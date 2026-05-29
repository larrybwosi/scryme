use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter};

/// Network status state
#[derive(Clone)]
pub struct NetworkState {
    pub is_online: Arc<Mutex<bool>>,
    pub last_check: Arc<Mutex<std::time::Instant>>,
    pub base_url: Arc<Mutex<Option<String>>>,
}

impl NetworkState {
    pub fn new() -> Self {
        Self {
            is_online: Arc::new(Mutex::new(false)),
            last_check: Arc::new(Mutex::new(std::time::Instant::now())),
            base_url: Arc::new(Mutex::new(None)),
        }
    }

    pub fn set_base_url(&self, url: String) {
        let mut base = self.base_url.lock().unwrap_or_else(|e| e.into_inner());
        *base = Some(url);
    }
}

/// Internal helper to update status and emit events
fn update_internal_status(app: &AppHandle, network_state: &Arc<NetworkState>, is_online: bool) {
    let mut current_status = network_state
        .is_online
        .lock()
        .unwrap_or_else(|e| e.into_inner());
    let previous_status = *current_status;

    if previous_status == is_online {
        // Update last check time even if status didn't change
        *network_state
            .last_check
            .lock()
            .unwrap_or_else(|e| e.into_inner()) = std::time::Instant::now();
        return;
    }

    *current_status = is_online;
    drop(current_status);

    // Update last check time
    *network_state
        .last_check
        .lock()
        .unwrap_or_else(|e| e.into_inner()) = std::time::Instant::now();

    // Emit event if status changed
    let _ = app.emit("network-status-changed", is_online);

    // If we just came online, trigger sync
    if is_online && !previous_status {
        let _ = app.emit("trigger-sales-sync", ());
    }
}

/// Tauri command to manually update network status (e.g., from Ably events)
#[tauri::command]
pub fn update_network_status_command(
    app: AppHandle,
    state: tauri::State<'_, NetworkState>,
    is_online: bool,
) {
    let network_state = Arc::new(state.inner().clone());
    update_internal_status(&app, &network_state, is_online);
}

/// Tauri command to get current network status
#[tauri::command]
pub fn get_network_status_command(state: tauri::State<'_, NetworkState>) -> bool {
    *state.is_online.lock().unwrap_or_else(|e| e.into_inner())
}
