use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
    },
    response::IntoResponse,
    routing::get,
    Router,
};
use local_ip_address::local_ip;
use log::{info, warn, error};
use std::net::SocketAddr; 
use tokio::sync::{broadcast, oneshot};
use tokio::time::{sleep, Duration};
use futures_util::{sink::SinkExt, stream::StreamExt};
use tauri::{AppHandle, Manager, Emitter, State as TauriState};
use crate::kds_models::{WsMessage, AssignmentPayload};
use std::sync::{Arc, Mutex};
use std::collections::HashMap;
use serde::Serialize;

#[derive(Debug, Clone, serde::Serialize)]
pub struct ConnectedDevice {
    pub id: String,
    pub name: String,
    pub device_type: String,
    pub status: String,
    pub last_seen: i64,
    pub ip: String,
    pub current_user_id: Option<String>,
    pub current_user_name: Option<String>,
    pub assigned_user_id: Option<String>,
    pub assigned_user_name: Option<String>,
    pub station: Option<String>,
    pub current_page: Option<String>,
    pub table_number: Option<String>,
    pub cart_item_count: Option<usize>,
}

pub struct DeviceRegistry {
    pub devices: Mutex<HashMap<String, ConnectedDevice>>,
    pub tx: broadcast::Sender<String>,
    pub is_running: Mutex<bool>,
    pub shutdown_tx: Mutex<Option<oneshot::Sender<()>>>,
    pub active_connections: Mutex<usize>,
    pub session_id: Mutex<u64>,
}

#[derive(Debug, Serialize)]
pub struct HubStatus {
    pub is_running: bool,
    pub active_connections: usize,
}

// Application state shared across all WebSocket connections
#[derive(Clone)]
struct AppState {
    // A channel that can broadcast messages to many receivers
    tx: broadcast::Sender<String>, 
    // Tauri's AppHandle to access the database/state from inside the WS tasks
    app_handle: AppHandle,
    // Global registry of devices
    registry: Arc<DeviceRegistry>,
}

#[tauri::command]
pub async fn start_kds_hub(app: AppHandle) -> Result<String, String> {
    let registry = if let Some(r) = app.try_state::<Arc<DeviceRegistry>>() {
        r.inner().clone()
    } else {
        // Increased channel capacity for high traffic
        let (tx, _rx) = broadcast::channel(1024);
        let r = Arc::new(DeviceRegistry {
            devices: Mutex::new(HashMap::new()),
            tx,
            is_running: Mutex::new(false),
            shutdown_tx: Mutex::new(None),
            active_connections: Mutex::new(0),
            session_id: Mutex::new(0),
        });
        app.manage(r.clone());
        r
    };

    let _current_session = {
        let mut is_running = registry.is_running.lock().unwrap();
        if *is_running {
            let ip = local_ip().map_err(|e| e.to_string())?;
            return Ok(format!("ws://{}:8080/kds-ws", ip));
        }
        *is_running = true;

        let mut sid = registry.session_id.lock().unwrap();
        *sid += 1;
        *sid
    };

    let (shutdown_tx, shutdown_rx) = oneshot::channel::<()>();
    {
        let mut tx_guard = registry.shutdown_tx.lock().unwrap();
        *tx_guard = Some(shutdown_tx);
    }

    let registry_clone = registry.clone();
    let tx = registry.tx.clone();
    let ip = local_ip().map_err(|e| e.to_string())?;
    
    // Bind to a fixed port for the POS hub (e.g., 8080) on 0.0.0.0
    // Using 0.0.0.0 to listen on all interfaces, more robust
    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));

    let state = AppState { 
        tx,
        app_handle: app.clone(),
        registry: registry_clone.clone(),
    };

    let router = Router::new()
        .route("/kds-ws", get(ws_handler))
        .layer(axum::extract::DefaultBodyLimit::disable())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind(addr).await.map_err(|e| {
        let mut is_running = registry_clone.is_running.lock().unwrap();
        *is_running = false;
        format!("Failed to bind to {}: {}", addr, e)
    })?;

    let app_for_spawn = app.clone();
    tauri::async_runtime::spawn(async move {
        info!("KDS Hub WebSocket running on ws://{}:8080/kds-ws", ip);
        let _ = app_for_spawn.emit("kds-hub-started", format!("ws://{}:8080/kds-ws", ip));
        let serve = axum::serve(
            listener,
            router.into_make_service_with_connect_info::<SocketAddr>(),
        )
        .with_graceful_shutdown(async move {
            let _ = shutdown_rx.await;
            info!("KDS Hub server received shutdown signal.");
        });

        if let Err(e) = serve.await {
            error!("KDS Hub server error: {}", e);
        }

        // Reset state when server stops
        let mut is_running = registry_clone.is_running.lock().unwrap();
        *is_running = false;
        let mut tx_guard = registry_clone.shutdown_tx.lock().unwrap();
        *tx_guard = None;
        let _ = app_for_spawn.emit("kds-hub-stopped", ());
        info!("KDS Hub server stopped.");
    });

    Ok(format!("ws://{}:8080/kds-ws", ip))
}

#[tauri::command]
pub async fn stop_kds_hub(state: TauriState<'_, Arc<DeviceRegistry>>) -> Result<(), String> {
    let mut tx_guard = state.shutdown_tx.lock().unwrap();
    if let Some(tx) = tx_guard.take() {
        let _ = tx.send(());
        Ok(())
    } else {
        Err("Server not running".to_string())
    }
}

#[tauri::command]
pub async fn get_hub_status(state: TauriState<'_, Arc<DeviceRegistry>>) -> Result<HubStatus, String> {
    let is_running = *state.is_running.lock().unwrap();
    let active_connections = *state.active_connections.lock().unwrap();
    Ok(HubStatus { is_running, active_connections })
}

async fn ws_handler(
    ws: WebSocketUpgrade,
    axum::extract::ConnectInfo(addr): axum::extract::ConnectInfo<SocketAddr>,
    State(state): State<AppState>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, state, addr))
}

async fn handle_socket(socket: WebSocket, state: AppState, addr: SocketAddr) {
    let client_ip = addr.ip().to_string();

    {
        let mut count = state.registry.active_connections.lock().unwrap();
        *count += 1;
        info!("KDS Client connected from {}. Total active: {}", client_ip, *count);
    }

    // --- 1. INITIAL CONNECTION SYNC ---
    info!("Starting initial sync for client {}...", client_ip);
    
    // Fetch active/preparing orders from the local SQLite DB using the AppHandle
    let active_orders = crate::stores::sales_store::get_active_kds_orders(&state.app_handle).await;
    
    let sync_msg = WsMessage::SyncOrders(active_orders);

    let (mut sender, mut receiver) = socket.split();

    if let Ok(text) = serde_json::to_string(&sync_msg) {
        if sender.send(Message::Text(text)).await.is_err() {
            info!("KDS client disconnected before initial sync finished.");
            decrement_connections(&state.registry);
            return;
        }
    }

    // Split the socket for concurrent read/write after the initial sync
    let mut rx = state.tx.subscribe();

    // Clone the AppHandle for the send task
    let app_handle_for_send = state.app_handle.clone();

    // --- 2. THE BROADCAST SENDER TASK ---
    let mut send_task = tokio::spawn(async move {
        loop {
            match rx.recv().await {
                Ok(msg) => {
                    // Send the broadcasted message to this specific KDS screen
                    if sender.send(Message::Text(msg)).await.is_err() {
                        info!("KDS Client disconnected during broadcast.");
                        break; 
                    }
                }
                Err(tokio::sync::broadcast::error::RecvError::Lagged(skipped_count)) => {
                    // The client fell behind (e.g., bad Wi-Fi). It missed `skipped_count` messages.
                    warn!("KDS client lagged and missed {} messages. Forcing a re-sync.", skipped_count);
                    
                    // Fetch the latest state from the DB and push it
                    let active_orders = crate::stores::sales_store::get_active_kds_orders(&app_handle_for_send).await;
                    
                    let resync_msg = WsMessage::SyncOrders(active_orders);
                    if let Ok(text) = serde_json::to_string(&resync_msg) {
                        if sender.send(Message::Text(text)).await.is_err() {
                            break; // Client is actually gone
                        }
                    }
                }
                Err(tokio::sync::broadcast::error::RecvError::Closed) => {
                    info!("Broadcast channel closed.");
                    break;
                }
            }
        }
    });

    // --- 3. THE RECEIVER TASK ---
    let tx = state.tx.clone();
    // Clone the AppHandle for the receive task
    let app_handle_for_recv = state.app_handle.clone();
    let registry = state.registry.clone();
    
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(Message::Text(text))) = receiver.next().await {
            if let Ok(ws_msg) = serde_json::from_str::<WsMessage>(&text) {
                match ws_msg {
                    WsMessage::NewOrder(order) => {
                        info!("Received new order locally: {}", order.id);
                        // Save to local SQLite database using Tauri app_handle (Non-blocking spawn)
                        let app_handle = app_handle_for_recv.clone();
                        let order_clone = order.clone();
                        tauri::async_runtime::spawn(async move {
                            crate::stores::sales_store::save_local_kds_order(&app_handle, &order_clone).await;
                        });
                        let _ = tx.send(text.clone());
                    },
                    WsMessage::OrderStatusUpdated { id, new_status } => {
                        info!("Order {} status updated to: {}", id, new_status);
                        // Update local SQLite database state (Non-blocking spawn)
                        let app_handle = app_handle_for_recv.clone();
                        let id_clone = id.clone();
                        let status_clone = new_status.clone();
                        tauri::async_runtime::spawn(async move {
                            crate::stores::sales_store::update_kds_order_status(&app_handle, &id_clone, &status_clone).await;
                        });
                        let _ = tx.send(text.clone());
                    },
                    WsMessage::DeviceStatus(device) => {
                        let mut devices = registry.devices.lock().unwrap();
                        let (assigned_user_id, assigned_user_name, current_page, table_number, cart_item_count) = devices.get(&device.id)
                            .map(|d| (d.assigned_user_id.clone(), d.assigned_user_name.clone(), d.current_page.clone(), d.table_number.clone(), d.cart_item_count))
                            .unwrap_or((None, None, None, None, None));

                        devices.insert(device.id.clone(), ConnectedDevice {
                            id: device.id,
                            name: device.name,
                            device_type: device.device_type,
                            status: device.status,
                            last_seen: device.last_seen,
                            ip: client_ip.clone(),
                            current_user_id: device.current_user_id,
                            current_user_name: device.current_user_name,
                            assigned_user_id,
                            assigned_user_name,
                            station: device.station,
                            current_page,
                            table_number,
                            cart_item_count,
                        });
                    },
                    WsMessage::AssignmentUpdate(_assignment) => {
                        // Normally assignments flow HUB -> CLIENT, but if a client sends one, broadcast it
                        let _ = tx.send(text.clone());
                    },
                    WsMessage::TabletActivity(activity) => {
                        let mut devices = registry.devices.lock().unwrap();
                        if let Some(device) = devices.get_mut(&activity.device_id) {
                            device.current_page = Some(activity.current_page.clone());
                            device.table_number = activity.table_number.clone();
                            device.cart_item_count = Some(activity.cart_items.len());
                            device.last_seen = chrono::Utc::now().timestamp_millis();
                        }
                        let _ = tx.send(text.clone());
                    },
                    WsMessage::OrderEtaQuery { .. } | WsMessage::OrderEtaResponse { .. } => {
                        let _ = tx.send(text.clone());
                    },
                    WsMessage::SyncOrders(_) => {
                        // The tablet shouldn't send this to the server, ignore or log
                        warn!("Received SyncOrders from client, which is unexpected.");
                    },
                    WsMessage::Ping => {
                        // Keep-alive from the tablet, no action needed
                    }
                }
            }
        }
    });

    // If either task fails/exits, cancel the other (client disconnected)
    tokio::select! {
        _ = (&mut send_task) => recv_task.abort(),
        _ = (&mut recv_task) => send_task.abort(),
    };

    decrement_connections(&state.registry);
}

fn decrement_connections(registry: &Arc<DeviceRegistry>) {
    let mut count = registry.active_connections.lock().unwrap();
    if *count > 0 {
        *count -= 1;
    }
    info!("KDS Client disconnected. Total active: {}", *count);

    if *count == 0 {
        let registry_clone = registry.clone();
        let current_session = *registry.session_id.lock().unwrap();

        tauri::async_runtime::spawn(async move {
            info!("No active connections. Starting 5-minute auto-shutdown timer for session {}...", current_session);
            sleep(Duration::from_secs(300)).await;

            // Check if we are still in the same session and count is still zero
            let count = registry_clone.active_connections.lock().unwrap();
            let session = registry_clone.session_id.lock().unwrap();

            if *count == 0 && *session == current_session {
                let is_running = registry_clone.is_running.lock().unwrap();
                if *is_running {
                    info!("Auto-shutting down KDS Hub (session {}) due to inactivity.", current_session);
                    let mut tx_guard = registry_clone.shutdown_tx.lock().unwrap();
                    if let Some(tx) = tx_guard.take() {
                        let _ = tx.send(());
                    }
                }
            } else if *session != current_session {
                info!("Auto-shutdown timer for session {} discarded (new session {} active).", current_session, *session);
            } else {
                info!("Auto-shutdown for session {} cancelled, new client connected.", current_session);
            }
        });
    }
}

#[tauri::command]
pub async fn get_connected_devices(state: TauriState<'_, Arc<DeviceRegistry>>) -> Result<Vec<ConnectedDevice>, String> {
    let devices = state.devices.lock().unwrap();
    Ok(devices.values().cloned().collect())
}

#[tauri::command]
pub async fn assign_user_to_device(
    state: TauriState<'_, Arc<DeviceRegistry>>,
    device_id: String,
    user_id: Option<String>,
    user_name: Option<String>,
) -> Result<(), String> {
    let mut devices = state.devices.lock().unwrap();
    if let Some(device) = devices.get_mut(&device_id) {
        device.assigned_user_id = user_id.clone();
        device.assigned_user_name = user_name.clone();

        let update = WsMessage::AssignmentUpdate(AssignmentPayload {
            device_id: device_id.clone(),
            user_id,
            user_name,
        });

        if let Ok(text) = serde_json::to_string(&update) {
            let _ = state.tx.send(text);
        }
        Ok(())
    } else {
        Err("Device not found".to_string())
    }
}
