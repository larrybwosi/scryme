use hidapi::HidApi;
use pcsc::{Context, Protocols, ReaderState, Scope, ShareMode, State as PcscState, PNP_NOTIFICATION};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;
use tauri::{AppHandle, Emitter, State};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader as AsyncBufReader};
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::Mutex;
use tokio::time::timeout;

// ----------------------------------------------------------------
// STATE MANAGEMENT (For Enterprise Graceful Shutdowns)
// ----------------------------------------------------------------

#[derive(Default)]
pub struct ScannerState {
    pub usb_active: Arc<AtomicBool>,
    pub net_active: Arc<AtomicBool>,
    pub nfc_active: Arc<AtomicBool>,
    
    pub usb_handle: Mutex<Option<tokio::task::JoinHandle<()>>>,
    pub net_handle: Mutex<Option<tokio::task::JoinHandle<()>>>,
    pub nfc_handle: Mutex<Option<tokio::task::JoinHandle<()>>>,
}

#[derive(Clone, serde::Serialize)]
struct ScanPayload {
    message: String,
    source: String,
}

// ----------------------------------------------------------------
// SECTION 1: USB HID (Wired Scanners / HID Mode)
// ----------------------------------------------------------------

#[tauri::command]
pub fn list_hid_devices() -> Result<Vec<(u16, u16, String)>, String> {
    let api = HidApi::new().map_err(|e| format!("HID API Error: {}", e))?;
    let mut devices = Vec::new();

    for device in api.device_list() {
        let name = device
            .product_string()
            .unwrap_or("Unknown Device")
            .to_string();
        devices.push((device.vendor_id(), device.product_id(), name));
    }
    Ok(devices)
}

#[tauri::command]
pub async fn start_scan(
    app: AppHandle,
    state: State<'_, ScannerState>,
    vid_hex: String,
    pid_hex: String,
) -> Result<String, String> {
    let vid = u16::from_str_radix(vid_hex.trim_start_matches("0x"), 16)
        .map_err(|_| "Invalid Vendor ID format")?;
    let pid = u16::from_str_radix(pid_hex.trim_start_matches("0x"), 16)
        .map_err(|_| "Invalid Product ID format")?;

    state.usb_active.store(false, Ordering::Relaxed);
    let mut handle_lock = state.usb_handle.lock().await;
    if let Some(handle) = handle_lock.take() {
        handle.abort();
    }

    state.usb_active.store(true, Ordering::Relaxed);
    let active_clone = state.usb_active.clone();

    let task = tokio::task::spawn_blocking(move || {
        let api = match HidApi::new() {
            Ok(api) => api,
            Err(e) => {
                let _ = app.emit("scanner-error", format!("HID API Init Error: {}", e));
                return;
            }
        };

        let device = match api.open(vid, pid) {
            Ok(dev) => dev,
            Err(e) => {
                let _ = app.emit("scanner-error", format!("Could not open device: {}", e));
                return;
            }
        };

        let _ = app.emit("scanner-status", "Connected (USB)");
        let mut buf = [0u8; 64];
        let mut string_buffer = String::new();

        while active_clone.load(Ordering::Relaxed) {
            match device.read_timeout(&mut buf, 500) {
                Ok(bytes_read) if bytes_read > 0 => {
                    let data_chunk = String::from_utf8_lossy(&buf[..bytes_read]);
                    string_buffer.push_str(&data_chunk);

                    if string_buffer.contains('\n') || string_buffer.contains('\r') {
                        let parts: Vec<&str> = string_buffer.split(&['\n', '\r'][..]).collect();
                        for part in parts.iter().take(parts.len() - 1) {
                            let code = part.trim();
                            if !code.is_empty() {
                                let _ = app.emit(
                                    "scanner-data",
                                    ScanPayload {
                                        message: code.to_string(),
                                        source: "USB".to_string(),
                                    },
                                );
                            }
                        }
                        string_buffer = parts.last().unwrap_or(&"").to_string();
                    }
                }
                Ok(_) => continue,
                Err(e) => {
                    let _ = app.emit("scanner-error", format!("USB Read Error: {}", e));
                    let _ = app.emit("scanner-status", "Disconnected (USB)");
                    break;
                }
            }
        }
    });

    *handle_lock = Some(task);
    Ok("USB Scanner listener started successfully".to_string())
}

// ----------------------------------------------------------------
// SECTION 2: NETWORK SCANNERS (Tokio Async TCP Server)
// ----------------------------------------------------------------

#[tauri::command]
pub async fn start_network_scan_server(
    app: AppHandle,
    state: State<'_, ScannerState>,
    port: u16,
) -> Result<String, String> {
    state.net_active.store(false, Ordering::Relaxed);
    let mut handle_lock = state.net_handle.lock().await;
    if let Some(handle) = handle_lock.take() {
        handle.abort();
    }

    state.net_active.store(true, Ordering::Relaxed);
    let active_clone = state.net_active.clone();

    let listener = TcpListener::bind(format!("0.0.0.0:{}", port))
        .await
        .map_err(|e| format!("Failed to bind to port {}: {}", port, e))?;

    let _ = app.emit("scanner-status", format!("Network Server Listening on :{}", port));

    let task = tokio::spawn(async move {
        while active_clone.load(Ordering::Relaxed) {
            match timeout(Duration::from_millis(1000), listener.accept()).await {
                Ok(Ok((stream, _addr))) => {
                    let app_clone = app.clone();
                    
                    tokio::spawn(async move {
                        let mut reader = AsyncBufReader::new(stream);
                        let mut line = String::new();

                        while let Ok(bytes) = reader.read_line(&mut line).await {
                            if bytes == 0 { break; } 

                            let code = line.trim().to_string();
                            if !code.is_empty() {
                                let _ = app_clone.emit(
                                    "scanner-data",
                                    ScanPayload {
                                        message: code,
                                        source: "Network".to_string(),
                                    },
                                );
                            }
                            line.clear();
                        }
                    });
                }
                Ok(Err(e)) => eprintln!("[Net Scanner] Accept error: {}", e),
                Err(_) => continue, 
            }
        }
    });

    *handle_lock = Some(task);
    Ok(format!("Network scanner server running on port {}", port))
}

// ----------------------------------------------------------------
// SECTION 3: NETWORK PRINTERS (Async TCP with Timeouts)
// ----------------------------------------------------------------

#[tauri::command]
pub async fn print_to_network(ip: String, port: String, payload: String) -> Result<String, String> {
    let address = format!("{}:{}", ip, port);

    let connect_future = TcpStream::connect(&address);
    let mut stream = match timeout(Duration::from_secs(3), connect_future).await {
        Ok(Ok(s)) => s,
        Ok(Err(e)) => return Err(format!("Failed to connect: {}", e)),
        Err(_) => return Err(format!("Connection to {} timed out after 3s", address)),
    };

    let write_future = stream.write_all(payload.as_bytes());
    if timeout(Duration::from_secs(3), write_future).await.is_err() {
        return Err("Sending data to printer timed out".to_string());
    }

    Ok("Print job sent successfully".to_string())
}

// ----------------------------------------------------------------
// SECTION 4: NFC (PC/SC with Panic Protections)
// ----------------------------------------------------------------

#[tauri::command]
pub async fn start_nfc_listener(app: AppHandle, state: State<'_, ScannerState>) -> Result<String, String> {
    state.nfc_active.store(false, Ordering::Relaxed);
    let mut handle_lock = state.nfc_handle.lock().await;
    if let Some(handle) = handle_lock.take() {
        handle.abort();
    }

    state.nfc_active.store(true, Ordering::Relaxed);
    let active_clone = state.nfc_active.clone();

    let task = tokio::task::spawn_blocking(move || {
        let ctx = match Context::establish(Scope::User) {
            Ok(ctx) => ctx,
            Err(e) => {
                let _ = app.emit("scanner-error", format!("NFC Error: {}", e));
                return;
            }
        };

        let mut readers_buf = [0; 2048];
        let mut reader_states = vec![ReaderState::new(PNP_NOTIFICATION(), PcscState::UNAWARE)];

        while active_clone.load(Ordering::Relaxed) {
            if ctx.get_status_change(Some(Duration::from_millis(500)), &mut reader_states).is_ok() {
                if let Ok(readers) = ctx.list_readers(&mut readers_buf) {
                    for reader in readers {
                        if let Ok(card) = ctx.connect(reader, ShareMode::Shared, Protocols::ANY) {
                            let apdu = [0xFF, 0xCA, 0x00, 0x00, 0x00];
                            let mut rapdu_buf = [0; 256];

                            if let Ok(rapdu) = card.transmit(&apdu, &mut rapdu_buf) {
                                let uid: String = rapdu.iter().map(|b| format!("{:02X}", b)).collect();

                                // [FIXED] Coerced the fallback to a string slice `&str` instead of a reference to a String.
                                let clean_uid = if uid.len() >= 4 {
                                    &uid[0..uid.len() - 4]
                                } else {
                                    uid.as_str() 
                                };

                                let _ = app.emit("nfc-read", clean_uid);
                                
                                std::thread::sleep(Duration::from_secs(2));
                            }
                        }
                    }
                }
            }
        }
    });

    *handle_lock = Some(task);
    Ok("NFC Listener started successfully".to_string())
}