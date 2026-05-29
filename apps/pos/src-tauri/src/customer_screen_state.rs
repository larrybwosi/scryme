use log::info;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{AppHandle, Manager, State, WebviewUrl, WebviewWindowBuilder};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct CustomerScreenConfig {
    pub enabled: bool,
}

pub struct CustomerScreenState {
    config: Mutex<CustomerScreenConfig>,
}

impl CustomerScreenState {
    pub fn new() -> Self {
        Self {
            config: Mutex::new(CustomerScreenConfig::default()),
        }
    }

    pub fn is_enabled(&self) -> bool {
        self.config
            .lock()
            .unwrap_or_else(|e| e.into_inner())
            .enabled
    }

    pub fn set_enabled(&self, enabled: bool) {
        let mut config = self.config.lock().unwrap_or_else(|e| e.into_inner());
        config.enabled = enabled;
    }

    pub fn get_config(&self) -> CustomerScreenConfig {
        self.config
            .lock()
            .unwrap_or_else(|e| e.into_inner())
            .clone()
    }

    async fn get_store_path(app: &AppHandle) -> Result<PathBuf, String> {
        let app_data = app
            .path()
            .app_data_dir()
            .map_err(|e| format!("Failed to get app data dir: {}", e))?;

        if !app_data.exists() {
            tokio::fs::create_dir_all(&app_data)
                .await
                .map_err(|e| format!("Failed to create app data dir: {}", e))?;
        }

        Ok(app_data.join("customer_screen_state.json"))
    }

    pub async fn save_to_store(&self, app: &AppHandle) -> Result<(), String> {
        let path = Self::get_store_path(app).await?;
        let config = self.get_config();
        let json = serde_json::to_string_pretty(&config)
            .map_err(|e| format!("Failed to serialize config: {}", e))?;

        tokio::fs::write(&path, json)
            .await
            .map_err(|e| format!("Failed to write config file: {}", e))?;

        Ok(())
    }

    pub async fn load_from_store(&self, app: &AppHandle) -> Result<(), String> {
        let path = Self::get_store_path(app).await?;

        if !path.exists() {
            // No saved state, use default
            return Ok(());
        }

        let json = tokio::fs::read_to_string(&path)
            .await
            .map_err(|e| format!("Failed to read config file: {}", e))?;

        let config: CustomerScreenConfig = serde_json::from_str(&json)
            .map_err(|e| format!("Failed to deserialize config: {}", e))?;

        let mut current_config = self.config.lock().unwrap_or_else(|e| e.into_inner());
        *current_config = config;

        Ok(())
    }
}

// --- Commands to open/manage the Customer Window ---
#[tauri::command]
pub async fn open_customer_screen(app: AppHandle) -> Result<(), String> {
    // 0. Check if enabled in state
    let state = app.state::<CustomerScreenState>();
    if !state.is_enabled() {
        return Err("Customer screen is disabled in settings".to_string());
    }

    let window_label = "customer";

    // 1. Check if window exists
    if let Some(window) = app.get_webview_window(window_label) {
        // If it exists, just focus it and return
        let _ = window.set_focus();
        return Ok(());
    }

    // 2. Create the window HIDDEN to prevent flashing on the wrong screen
    let builder =
        WebviewWindowBuilder::new(&app, window_label, WebviewUrl::App("/customer".into()))
            .title("Customer Display")
            .visible(false) // <--- CRITICAL: Start hidden
            .decorations(true)
            .skip_taskbar(true)
            .inner_size(800.0, 600.0);

    let window = builder.build().map_err(|e| e.to_string())?;

    // 3. Detect Monitors and Move
    let monitors = window.available_monitors().map_err(|e| e.to_string())?;
    info!("[Screen] Found {} monitors", monitors.len());

    if monitors.len() > 1 {
        let secondary_monitor = &monitors[1];
        let pos = secondary_monitor.position();

        info!("[Screen] Moving to monitor at {:?}", pos);

        window.set_position(*pos).map_err(|e| e.to_string())?;
        window.set_fullscreen(true).map_err(|e| e.to_string())?;
    }

    // 4. Show the window ONLY after it is in the correct position
    window.show().map_err(|e| e.to_string())?;
    window.set_focus().map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn close_customer_screen(
    app: AppHandle,
    state: State<'_, CustomerScreenState>,
) -> Result<(), String> {
    state.set_enabled(false);
    state.save_to_store(&app).await?;

    if let Some(window) = app.get_webview_window("customer") {
        window.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn set_customer_screen_enabled(
    app: AppHandle,
    state: State<'_, CustomerScreenState>,
    enabled: bool,
) -> Result<(), String> {
    state.set_enabled(enabled);
    state.save_to_store(&app).await?;

    if enabled {
        open_customer_screen(app).await?;
    } else {
        close_customer_screen(app.clone(), state).await?;
    }

    Ok(())
}

#[tauri::command]
pub fn get_customer_screen_state(state: State<'_, CustomerScreenState>) -> bool {
    state.is_enabled()
}
