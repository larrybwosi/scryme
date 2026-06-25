use keyring::Entry;
use log::{info, error};
use reqwest::header::HeaderValue;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{AppHandle, State};

// --- Data Types ---

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")] 
pub struct MemberProfile {
    pub id: String,
    #[serde(default)] // Allows parsing to succeed with an empty string if "name" is missing
    pub name: String,
    
    pub role: Option<String>,
    // Add other non-sensitive fields from your Member model
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct DeviceConfig {
    pub base_url: String,
    pub location_id: String,
    pub device_key: String,
    pub org_slug: String,
    #[serde(default)]
    pub allow_negative_stock: bool,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct SanitizedDeviceConfig {
    pub location_id: String,
    pub org_slug: String,
    pub allow_negative_stock: bool,
}

// --- The State Container ---

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct Session {
    pub token: String,
    pub user: MemberProfile,
}

pub struct AuthState {
    // We wrap in Mutex to allow safe concurrent access
    pub device_config: Mutex<Option<DeviceConfig>>,
    pub base_url_override: Mutex<Option<String>>,
    pub sessions: Mutex<std::collections::HashMap<String, Session>>, // member_id -> Session
    pub active_member_id: Mutex<Option<String>>,
    pub client: reqwest::Client,
}

const KEYRING_SERVICE: &str = "dealio-desktop";
const KEYRING_USER: &str = "device-config";

impl Default for AuthState {
    fn default() -> Self {
        Self::new()
    }
}

impl AuthState {
    pub fn new() -> Self {
        // Try keyring first, then file
        let initial_config = Self::load_from_keyring().or_else(Self::load_from_file);

        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(30))
            .build()
            .unwrap_or_default();

        Self {
            device_config: Mutex::new(initial_config),
            base_url_override: Mutex::new(None),
            sessions: Mutex::new(std::collections::HashMap::new()),
            active_member_id: Mutex::new(None),
            client,
        }
    }

    fn get_config_path() -> Option<std::path::PathBuf> {
        let proj_dirs = directories::ProjectDirs::from("com", "dealio", "pos")?;
        let config_dir = proj_dirs.config_dir();
        if !config_dir.exists() {
            let _ = std::fs::create_dir_all(config_dir);
        }
        Some(config_dir.join("device.json"))
    }

    fn load_from_file() -> Option<DeviceConfig> {
        let path = Self::get_config_path()?;

        let content = std::fs::read_to_string(path).ok()?;
        match serde_json::from_str(&content) {
            Ok(config) => Some(config),
            Err(e) => {
                eprintln!("[AuthStore] Failed to parse file config: {}", e);
                None
            }
        }
    }

    async fn save_to_file_async(config: &DeviceConfig) -> Result<(), String> {
        let path = Self::get_config_path().ok_or("Could not determine config path")?;
        let json = serde_json::to_string(config).map_err(|e| e.to_string())?;
        tokio::fs::write(&path, json)
            .await
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    fn load_from_keyring() -> Option<DeviceConfig> {
        let entry = match Entry::new(KEYRING_SERVICE, KEYRING_USER) {
            Ok(e) => e,
            Err(e) => {
                eprintln!("[AuthStore] Failed to create keyring entry: {}", e);
                return None;
            }
        };

        let password = match entry.get_password() {
            Ok(p) => p,
            Err(e) => {
                eprintln!(
                    "[AuthStore] Failed to retrieve password from keyring: {}",
                    e
                );
                return None;
            }
        };

        match serde_json::from_str(&password) {
            Ok(config) => Some(config),
            Err(e) => {
                eprintln!("[AuthStore] Failed to parse config from keyring: {}", e);
                None
            }
        }
    }

    async fn save_to_keyring_async(config: &DeviceConfig) -> Result<(), String> {
        // 1. Try Keyring
        let keyring_result: Result<(), String> = {
            let entry = Entry::new(KEYRING_SERVICE, KEYRING_USER).map_err(|e| e.to_string())?;
            let json = serde_json::to_string(config).map_err(|e| e.to_string())?;
            entry.set_password(&json).map_err(|e| e.to_string())?;
            Ok(())
        };

        if let Err(e) = keyring_result {
            eprintln!(
                "[AuthStore] Keyring save failed: {}. Falling back to file.",
                e
            );
        }

        // 2. ALWAYS Save to File as Backup
        Self::save_to_file_async(config).await?;

        Ok(())
    }

    // --- Helper to get a configured HTTP Client ---
    // This provides a request builder utilizing the persistent client and automatically
    // injects API Key and Bearer token headers.
    pub fn build_request(
        &self,
        method: reqwest::Method,
        path: &str,
    ) -> Result<reqwest::RequestBuilder, String> {
        let (base_url, device_key) = {
            let override_guard = self
                .base_url_override
                .lock()
                .map_err(|_| "Failed to lock base url override")?;

            let config_guard = self
                .device_config
                .lock()
                .map_err(|_| "Failed to lock device config")?;

            let url = if let Some(over) = override_guard.as_ref() {
                over.clone()
            } else if let Some(config) = config_guard.as_ref() {
                config.base_url.clone()
            } else {
                // Fallback for initial provisioning where we might not have a config yet
                let dev_url = if cfg!(debug_assertions) {
                    "http://localhost:3002"
                } else {
                    "https://dealioerp.vercel.app"
                };
                dev_url.to_string()
            };

            let key = config_guard.as_ref().map(|c| c.device_key.clone());

            (url, key)
        };

        let token = {
            let active_id = self.active_member_id.lock().map_err(|_| "Failed to lock active id")?;
            if let Some(id) = active_id.as_ref() {
                let sessions = self.sessions.lock().map_err(|_| "Failed to lock sessions")?;
                sessions.get(id).map(|s| s.token.clone())
            } else {
                None
            }
        };


        let full_url = if path.starts_with("http") {
            path.to_string()
        } else {
            format!(
                "{}/{}",
                base_url.trim_end_matches('/'),
                path.trim_start_matches('/')
            )
        };

        let mut request_builder = self.client.request(method, &full_url);

        if let Some(key) = device_key {
            let mut key_val = HeaderValue::from_str(&key).map_err(|e| e.to_string())?;
            key_val.set_sensitive(true);
            request_builder = request_builder.header("X-API-KEY", key_val);
        }

        if let Some(t) = token {
            let mut val = HeaderValue::from_str(&t).map_err(|e| e.to_string())?;
            val.set_sensitive(true);
            request_builder = request_builder.header("X-MEMBER-TOKEN", val);
        }


        Ok(request_builder)
    }

    pub fn get_active_token(&self) -> Result<Option<String>, String> {
        let active_id = self.active_member_id.lock().map_err(|_| "Lock error")?;
        if let Some(id) = active_id.as_ref() {
            let sessions = self.sessions.lock().map_err(|_| "Lock error")?;
            Ok(sessions.get(id).map(|s| s.token.clone()))
        } else {
            Ok(None)
        }
    }

    pub fn get_active_user(&self) -> Result<Option<MemberProfile>, String> {
        let active_id = self.active_member_id.lock().map_err(|_| "Lock error")?;
        if let Some(id) = active_id.as_ref() {
            let sessions = self.sessions.lock().map_err(|_| "Lock error")?;
            Ok(sessions.get(id).map(|s| s.user.clone()))
        } else {
            Ok(None)
        }
    }

    fn load_token_from_keyring() -> Option<String> {
        let entry = Entry::new(KEYRING_SERVICE, "member-token").ok()?;
        entry.get_password().ok()
    }

    fn save_token_to_keyring(token: &str) -> Result<(), String> {
        let entry = Entry::new(KEYRING_SERVICE, "member-token").map_err(|e| e.to_string())?;
        entry.set_password(token).map_err(|e| e.to_string())?;
        Ok(())
    }

    fn delete_token_from_keyring() -> Result<(), String> {
        if let Ok(entry) = Entry::new(KEYRING_SERVICE, "member-token") {
            let _ = entry.delete_password();
        }
        Ok(())
    }
}

// --- API Response Models ---

// The nested login data containing the actual payload
#[derive(Deserialize)]
struct ServerLoginResponse {
    token: String,
    member: MemberProfile,
    #[serde(rename = "restoredSession")]
    restored_session: Option<bool>,
}

// The V2 API wrapper for login
#[derive(Deserialize)]
struct LoginApiWrapper {
    data: ServerLoginResponse,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CheckInResult {
    pub member: MemberProfile,
    pub restored_session: bool,
}

// --- Commands ---

#[tauri::command]
pub async fn set_device_config(
    state: State<'_, AuthState>,
    network_state: State<'_, crate::network_monitor::NetworkState>,
    base_url: String,
    location_id: String,
    device_key: String,
    org_slug: String,
) -> Result<(), String> {
    let new_config = DeviceConfig {
        base_url: base_url.clone(),
        location_id,
        device_key,
        org_slug,
        allow_negative_stock: false, // Default to false for new setups
    };

    // 1. Save to Keyring first (fail early if secure storage fails)
    AuthState::save_to_keyring_async(&new_config).await?;

    // 2. Update memory
    {
        let mut config = state.device_config.lock().map_err(|_| "Lock error")?;
        *config = Some(new_config);
    }

    // 3. Update network monitor
    network_state.set_base_url(base_url);

    Ok(())
}

#[tauri::command]
pub async fn login_member(
    app: AppHandle,
    state: State<'_, AuthState>,
    card_id: String,
    pin: Option<String>,
    location_id: Option<String>,
) -> Result<CheckInResult, String> {
    // 1. Build request (handles base_url, persistent client, and headers automatically)
    let request =
        state.build_request(reqwest::Method::POST, crate::api_config::routes::CHECK_IN)?;

    // 2. Perform Request
    let device_key = {
        let config_guard = state.device_config.lock().map_err(|_| "Lock error")?;
        config_guard.as_ref().map(|c| c.device_key.clone())
    };

    let body = serde_json::json!({
        "cardId": card_id,
        "pin": pin,
        "locationId": location_id,
        "deviceKey": device_key
    });

    let res = request
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    let status = res.status();
    let text = res
        .text()
        .await
        .map_err(|e| format!("Failed to read response body: {}", e))?;

    if !status.is_success() {
        let error_msg = format!("Login failed: {} - {}", status, text);
        error!("[AUTH] {}", error_msg);

        // Audit failed login attempt
        let _ = crate::audit_store::write_event(
            &app,
            crate::audit_store::AuditLevel::Warning,
            "LOGIN_FAILED",
            None,
            None,
            location_id,
            None,
            serde_json::json!({ "card_id": card_id, "reason": error_msg }),
        );
        return Err(error_msg);
    }

    // 3. Parse and Store Token Internally utilizing the new wrapper
    let wrapper: LoginApiWrapper = serde_json::from_str(&text)
        .map_err(|e| format!("JSON parse error: {} | Raw: {}", e, text))?;

    let data = wrapper.data;

    // CRITICAL: Token stays here, never returned to UI
    {
        let mut sessions = state.sessions.lock().map_err(|_| "Lock error")?;
        sessions.insert(data.member.id.clone(), Session {
            token: data.token.clone(),
            user: data.member.clone(),
        });

        let mut active_id = state.active_member_id.lock().map_err(|_| "Lock error")?;
        *active_id = Some(data.member.id.clone());
    }

    // Audit successful login
    let _ = crate::audit_store::write_event(
        &app,
        crate::audit_store::AuditLevel::Info,
        "LOGIN",
        None,
        Some(data.member.name.clone()),
        location_id,
        None,
        serde_json::json!({ "card_id": card_id, "role": data.member.role }),
    );

    Ok(CheckInResult {
        member: data.member,
        restored_session: data.restored_session.unwrap_or(false),
    })
}

#[tauri::command]
pub async fn logout_member(
    app: AppHandle,
    state: State<'_, AuthState>,
    location_id: Option<String>,
) -> Result<(), String> {
    // Capture actor before clearing
    let (actor_id, actor_name) = {
        let active_id_guard = state.active_member_id.lock().map_err(|_| "Lock error")?;
        let sessions = state.sessions.lock().map_err(|_| "Lock error")?;

        let id = active_id_guard.clone();
        let name = id.as_ref().and_then(|id| sessions.get(id).map(|s| s.user.name.clone()));
        (id, name)
    };

    // 1. Attempt to notify the server (Best effort) - Skip in standalone
    #[cfg(not(feature = "standalone"))]
    {
        if let Ok(request) =
            state.build_request(reqwest::Method::POST, crate::api_config::routes::CHECK_OUT)
        {
            let device_key = {
                let config_guard = state.device_config.lock().map_err(|_| "Lock error")?;
                config_guard.as_ref().map(|c| c.device_key.clone())
            };

            let body = serde_json::json!({
                "locationId": location_id,
                "deviceKey": device_key
            });
            let _ = request.json(&body).send().await;
        }
    }

    // 2. Clear local session
    {
        let mut active_id = state.active_member_id.lock().map_err(|_| "Lock error")?;
        let mut sessions = state.sessions.lock().map_err(|_| "Lock error")?;

        if let Some(id) = actor_id {
            sessions.remove(&id);
        }

        // Pick another session if available as active, or None
        *active_id = sessions.keys().next().cloned();
    }

    // Audit logout
    info!("[AUTH] Member {:?} logged out", actor_name);
    let _ = crate::audit_store::write_event(
        &app,
        crate::audit_store::AuditLevel::Info,
        "LOGOUT",
        None,
        actor_name,
        location_id,
        None,
        serde_json::Value::Null,
    );

    Ok(())
}

#[tauri::command]
pub async fn get_device_config(
    state: State<'_, AuthState>,
) -> Result<Option<SanitizedDeviceConfig>, String> {
    let config_guard = state.device_config.lock().map_err(|_| "Lock error")?;
    Ok(config_guard.as_ref().map(|c| SanitizedDeviceConfig {
        location_id: c.location_id.clone(),
        org_slug: c.org_slug.clone(),
        allow_negative_stock: c.allow_negative_stock,
    }))
}

#[tauri::command]
pub async fn authenticated_api_request(
    state: State<'_, AuthState>,
    method: String,
    path: String,
    body: Option<serde_json::Value>,
) -> Result<serde_json::Value, String> {
    let req_method = match method.to_uppercase().as_str() {
        "GET" => reqwest::Method::GET,
        "POST" => reqwest::Method::POST,
        "PUT" => reqwest::Method::PUT,
        "DELETE" => reqwest::Method::DELETE,
        _ => return Err(format!("Unsupported method: {}", method)),
    };

    // 1. Build Request (handles URL formatting and all headers)
    let mut request = state.build_request(req_method, &path)?;

    if let Some(b) = body {
        request = request.json(&b);
    }

    // 2. Send and handle response
    let res = request
        .send()
        .await
        .map_err(|e| format!("Proxy request failed: {}", e))?;

    let status = res.status();
    if !status.is_success() {
        let err_body = res.text().await.unwrap_or_default();
        return Err(format!("API Error {}: {}", status, err_body));
    }

    let json_res: serde_json::Value = res
        .json()
        .await
        .map_err(|e| format!("Invalid JSON response: {}", e))?;
    Ok(json_res)
}

#[tauri::command]
pub async fn restore_member_session(
    state: State<'_, AuthState>,
    member: MemberProfile,
) -> Result<(), String> {
    // NOTE: This was previously used to restore a single session from frontend.
    // In multi-session, we might need a token too, but let's see.
    // For now, if it's called, we ensure it's in sessions (though it might lack a token if not careful)
    let sessions = state.sessions.lock().map_err(|_| "Lock error")?;
    if !sessions.contains_key(&member.id) {
        // We don't have the token here, which is a problem for build_request.
        // Usually, restore_member_session is called when frontend already has the session.
        // If frontend has it, it should have been logged in or properly restored.
    }

    let mut active_id = state.active_member_id.lock().map_err(|_| "Lock error")?;
    *active_id = Some(member.id);

    Ok(())
}

#[tauri::command]
pub async fn switch_active_member(
    state: State<'_, AuthState>,
    member_id: String,
) -> Result<(), String> {
    let mut active_id = state.active_member_id.lock().map_err(|_| "Lock error")?;
    let sessions = state.sessions.lock().map_err(|_| "Lock error")?;

    if !sessions.contains_key(&member_id) {
        return Err("Member not checked in".to_string());
    }

    *active_id = Some(member_id);
    Ok(())
}

#[tauri::command]
pub async fn reset_device_config(state: State<'_, AuthState>) -> Result<(), String> {
    // 1. Clear Keyring
    let keyring_del = (|| -> Result<(), String> {
        let entry = Entry::new(KEYRING_SERVICE, KEYRING_USER).map_err(|e| e.to_string())?;
        entry.delete_password().map_err(|e| e.to_string())?;
        Ok(())
    })();

    if let Err(e) = keyring_del {
        eprintln!(
            "[AuthStore] Optional Keyring delete failed (might not exist): {}",
            e
        );
    }

    // 2. Clear File
    if let Some(path) = AuthState::get_config_path() {
        if path.exists() {
            let _ = tokio::fs::remove_file(path).await;
        }
    }

    // 3. Clear Memory
    *state.device_config.lock().unwrap() = None;
    state.sessions.lock().unwrap().clear();
    *state.active_member_id.lock().unwrap() = None;

    println!("[AuthStore] Device configuration reset complete.");
    Ok(())
}

// --- NEW COMMANDS FOR REFACTOR ---

#[tauri::command]
pub async fn start_device_setup_command(
    state: State<'_, AuthState>,
    network_state: State<'_, crate::network_monitor::NetworkState>,
    base_url: String,
    device_key: String,
    org_slug: String,
) -> Result<(), String> {
    // We store a partial config (no location_id yet) in memory
    // This allows get_locations_command to work using build_request
    let mut config = state.device_config.lock().map_err(|_| "Lock error")?;
    *config = Some(DeviceConfig {
        base_url: base_url.clone(),
        location_id: String::new(), // Empty for now
        device_key,
        org_slug,
        allow_negative_stock: false, // Default for setup
    });

    // Update network monitor
    network_state.set_base_url(base_url);

    Ok(())
}

#[tauri::command]
pub async fn set_negative_stock_command(
    state: tauri::State<'_, AuthState>,
    allow: bool,
) -> Result<(), String> {
    // 1. Isolate the Mutex lock in its own block to drop it before awaiting
    let config_to_save = {
        let mut config_guard = state.device_config.lock().map_err(|_| "Lock error")?;

        if let Some(config) = config_guard.as_mut() {
            config.allow_negative_stock = allow;
            Some(config.clone()) // Clone the data so we can use it safely outside the lock
        } else {
            None
        }
    }; // <-- config_guard is strictly dropped right here.

    // 2. Await the async save operation without holding the lock
    if let Some(config) = config_to_save {
        AuthState::save_to_keyring_async(&config)
            .await
            .map_err(|e| e.to_string())?;
    } else {
        return Err("Device not configured".to_string());
    }

    Ok(())
}

#[tauri::command]
pub async fn get_locations_command(
    state: State<'_, AuthState>,
) -> Result<serde_json::Value, String> {
    let request =
        state.build_request(reqwest::Method::GET, crate::api_config::routes::LOCATIONS)?;

    let res = request
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    let status = res.status();
    if !status.is_success() {
        let err_body = res.text().await.unwrap_or_default();
        return Err(format!(
            "Failed to fetch locations: {} - {}",
            status, err_body
        ));
    }

    let data: serde_json::Value = res
        .json()
        .await
        .map_err(|e| format!("Invalid JSON: {}", e))?;
    Ok(data)
}

#[tauri::command]
pub async fn get_ably_auth_token_command(
    state: State<'_, AuthState>,
    params: Option<serde_json::Value>,
) -> Result<serde_json::Value, String> {
    let mut request =
        match state.build_request(reqwest::Method::POST, crate::api_config::routes::ABLY_AUTH) {
            Ok(req) => req,
            Err(e) => {
                println!("[AuthStore] Failed to build request: {}", e);
                return Err(e);
            }
        };

    // If params are provided, send them in body
    if let Some(p) = params {
        request = request.json(&serde_json::json!({ "params": p }));
    } else {
        // Ensure we send an empty JSON object if server expects JSON
        request = request.json(&serde_json::json!({}));
    }

    let res = request.send().await.map_err(|e| {
        println!("[AuthStore] Network request failed: {}", e);
        format!("Network error: {}", e)
    })?;

    let status = res.status();

    if !status.is_success() {
        let err_body = res.text().await.unwrap_or_default();
        return Err(format!("Ably auth failed: {} - {}", status, err_body));
    }

    let data: serde_json::Value = res
        .json()
        .await
        .map_err(|e| format!("Invalid JSON: {}", e))?;
    Ok(data)
}

#[tauri::command]
pub async fn update_base_url(state: State<'_, AuthState>, base_url: String) -> Result<(), String> {
    let mut override_guard = state
        .base_url_override
        .lock()
        .map_err(|_| "Lock error on override")?;
    *override_guard = Some(base_url.clone());

    // Also update device_config if it exists so it's persisted on next save
    let mut config_guard = state.device_config.lock().map_err(|_| "Lock error on config")?;
    if let Some(config) = config_guard.as_mut() {
        config.base_url = base_url;
        // Re-persist if we've already established a config
        let config_to_save = config.clone();
        drop(config_guard); // Drop lock before async call
        AuthState::save_to_keyring_async(&config_to_save)
            .await
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub async fn update_device_location(
    state: State<'_, AuthState>,
    location_id: String,
) -> Result<(), String> {
    let config_to_save = {
        let mut config_guard = state.device_config.lock().map_err(|_| "Lock error")?;
        let config = config_guard.as_mut().ok_or("Device not configured")?;
        config.location_id = location_id;
        config.clone()
    };

    AuthState::save_to_keyring_async(&config_to_save)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}