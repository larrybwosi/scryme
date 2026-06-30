use crate::error::{BackendError, BackendResult};
use crate::models::User;
use bcrypt::verify;
use chrono::Utc;
use keyring::Entry;
use sqlx::SqlitePool;
use tauri::{State};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use reqwest::header::HeaderValue;

// --- Data Types for Auth State ---

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct MemberProfile {
    pub id: String,
    #[serde(default)]
    pub name: String,
    pub role: Option<String>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct DeviceConfig {
    pub base_url: String,
    pub location_id: String,
    pub device_key: String,
    pub org_slug: String,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SanitizedDeviceConfig {
    pub location_id: String,
    pub org_slug: String,
    pub device_key: String,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct AuthSession {
    pub token: String,
    pub user: MemberProfile,
}

pub struct BakeryAuthState {
    pub device_config: Mutex<Option<DeviceConfig>>,
    pub base_url_override: Mutex<Option<String>>,
    pub sessions: Mutex<std::collections::HashMap<String, AuthSession>>, // member_id -> AuthSession
    pub active_member_id: Mutex<Option<String>>,
    pub client: reqwest::Client,
}

const KEYRING_SERVICE: &str = "scryme-bakery";
const KEYRING_USER: &str = "device-config";

impl BakeryAuthState {
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
        let proj_dirs = directories::ProjectDirs::from("com", "scryme", "bakery")?;
        let config_dir = proj_dirs.config_dir();
        if !config_dir.exists() {
            let _ = std::fs::create_dir_all(config_dir);
        }
        Some(config_dir.join("device.json"))
    }

    fn load_from_file() -> Option<DeviceConfig> {
        let path = Self::get_config_path()?;
        let content = std::fs::read_to_string(path).ok()?;
        serde_json::from_str(&content).ok()
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
        let entry = Entry::new(KEYRING_SERVICE, KEYRING_USER).ok()?;
        let password = entry.get_password().ok()?;
        serde_json::from_str(&password).ok()
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
            eprintln!("[AuthStore] Keyring save failed: {}. Falling back to file.", e);
        }

        // 2. ALWAYS Save to File as Backup
        Self::save_to_file_async(config).await?;

        Ok(())
    }

    pub fn build_request(
        &self,
        method: reqwest::Method,
        path: &str,
    ) -> BackendResult<reqwest::RequestBuilder> {
        let (base_url, device_key, location_id, org_slug) = {
            let override_guard = self.base_url_override.lock().map_err(|_| BackendError::Internal("Failed to lock base url override".to_string()))?;
            let config_guard = self.device_config.lock().map_err(|_| BackendError::Internal("Failed to lock device config".to_string()))?;

            let url = if let Some(over) = override_guard.as_ref() {
                over.clone()
            } else if let Some(config) = config_guard.as_ref() {
                config.base_url.clone()
            } else {
                if cfg!(debug_assertions) {
                    "http://localhost:3002/api/v2".to_string()
                } else {
                    "https://api.scryme.app/api/v2".to_string()
                }
            };

            let key = config_guard.as_ref().map(|c| c.device_key.clone());
            let loc_id = config_guard.as_ref().map(|c| c.location_id.clone());
            let slug = config_guard.as_ref().map(|c| c.org_slug.clone());
            (url, key, loc_id, slug)
        };

        let token = {
            let active_id_guard = self.active_member_id.lock().map_err(|_| BackendError::Internal("Failed to lock active id".to_string()))?;
            if let Some(id) = active_id_guard.as_ref() {
                let sessions_guard = self.sessions.lock().map_err(|_| BackendError::Internal("Failed to lock sessions".to_string()))?;
                sessions_guard.get(id).map(|s| s.token.clone())
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
            let mut key_val = HeaderValue::from_str(&key).map_err(|e| BackendError::Internal(e.to_string()))?;
            key_val.set_sensitive(true);
            request_builder = request_builder.header("X-API-KEY", key_val);
        }

        if let Some(t) = token {
            let mut val = HeaderValue::from_str(&t).map_err(|e| BackendError::Internal(e.to_string()))?;
            val.set_sensitive(true);
            request_builder = request_builder.header("X-MEMBER-TOKEN", val);
        }

        if let Some(loc) = location_id {
            if !loc.is_empty() {
                let val = HeaderValue::from_str(&loc).map_err(|e| BackendError::Internal(e.to_string()))?;
                request_builder = request_builder.header("X-LOCATION-ID", val);
            }
        }

        if let Some(slug) = org_slug {
            if !slug.is_empty() {
                let val = HeaderValue::from_str(&slug).map_err(|e| BackendError::Internal(e.to_string()))?;
                request_builder = request_builder.header("X-ORG-SLUG", val);
            }
        }

        Ok(request_builder)
    }
}

// --- Commands ---

#[tauri::command]
pub async fn login_local(
    pool: State<'_, SqlitePool>,
    email: String,
    password: String,
) -> BackendResult<User> {
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE email = ? LIMIT 1")
        .bind(&email)
        .fetch_optional(&*pool)
        .await?
        .ok_or_else(|| BackendError::Auth("Invalid email or password".to_string()))?;

    let password_hash = user
        .password_hash
        .as_ref()
        .ok_or_else(|| BackendError::Auth("User does not have a local password set".to_string()))?;

    if !verify(&password, password_hash).map_err(|e| BackendError::Internal(e.to_string()))? {
        return Err(BackendError::Auth("Invalid email or password".to_string()));
    }

    sqlx::query("UPDATE users SET last_login = ? WHERE id = ?")
        .bind(Utc::now())
        .bind(&user.id)
        .execute(&*pool)
        .await?;

    Ok(user)
}

#[tauri::command]
pub async fn sync_member_token_command(
    state: State<'_, BakeryAuthState>,
    token: String,
    member_id: String,
) -> BackendResult<()> {
    let mut active_id_guard = state.active_member_id.lock().map_err(|_| BackendError::Internal("Lock error".to_string()))?;
    let mut sessions_guard = state.sessions.lock().map_err(|_| BackendError::Internal("Lock error".to_string()))?;

    sessions_guard.insert(member_id.clone(), AuthSession {
        token,
        user: MemberProfile {
            id: member_id.clone(),
            name: String::new(),
            role: None,
        },
    });

    *active_id_guard = Some(member_id);

    Ok(())
}

#[tauri::command]
pub async fn restore_member_session(
    state: State<'_, BakeryAuthState>,
    member: MemberProfile,
) -> BackendResult<()> {
    let mut active_id = state.active_member_id.lock().map_err(|_| BackendError::Internal("Lock error".to_string()))?;
    *active_id = Some(member.id);
    Ok(())
}

#[tauri::command]
pub async fn switch_active_member(
    state: State<'_, BakeryAuthState>,
    member_id: String,
) -> BackendResult<()> {
    let mut active_id = state.active_member_id.lock().map_err(|_| BackendError::Internal("Lock error".to_string()))?;
    let sessions = state.sessions.lock().map_err(|_| BackendError::Internal("Lock error".to_string()))?;

    if !sessions.contains_key(&member_id) {
        return Err(BackendError::Auth("Member not checked in".to_string()));
    }

    *active_id = Some(member_id);
    Ok(())
}

#[tauri::command]
pub async fn validate_api_endpoint(api_url: String) -> BackendResult<bool> {
    let client = reqwest::Client::new();

    let base_url = if api_url.ends_with("/api/v2") {
        api_url
    } else {
        format!("{}/api/v2", api_url.trim_end_matches('/'))
    };

    let response = client
        .get(format!("{}/health", base_url))
        .send()
        .await
        .map_err(BackendError::Network)?;

    Ok(response.status().is_success())
}

#[tauri::command]
pub async fn provision_device_with_token(
    state: State<'_, BakeryAuthState>,
    setup_token: String,
    mac_address: Option<String>,
    serial_number: Option<String>,
    api_url_override: Option<String>,
) -> BackendResult<()> {
    let client = reqwest::Client::new();
    let default_api_url = if cfg!(debug_assertions) {
        "http://localhost:3002"
    } else {
        "https://api.scryme.app"
    };

    let base_api_url = api_url_override.as_deref().unwrap_or(default_api_url);
    let api_url = if base_api_url.ends_with("/api/v2") {
        base_api_url.to_string()
    } else {
        format!("{}/api/v2", base_api_url.trim_end_matches('/'))
    };

    let response = client
        .post(format!("{}/devices/provision", api_url))
        .json(&serde_json::json!({
            "setupToken": setup_token,
            "macAddress": mac_address,
            "serialNumber": serial_number,
        }))
        .send()
        .await
        .map_err(BackendError::Network)?;

    if !response.status().is_success() {
        let status = response.status();
        let err_body = response
            .text()
            .await
            .unwrap_or_else(|_| "Unknown error body".to_string());
        return Err(BackendError::Internal(format!(
            "Provisioning failed ({}): {}",
            status, err_body
        )));
    }

    let result: serde_json::Value = response.json().await.map_err(BackendError::Network)?;
    
    let api_key = result["data"]["apiKey"]
        .as_str()
        .ok_or_else(|| BackendError::Internal("No API Key returned from server".to_string()))?;

    let org_slug = result["data"]["organization"]["slug"]
        .as_str()
        .unwrap_or_default()
        .to_string();

    let location_id = result["data"]["locationId"]
        .as_str()
        .or_else(|| result["data"]["location"]["id"].as_str())
        .unwrap_or_default()
        .to_string();

    let new_config = DeviceConfig {
        base_url: api_url,
        location_id,
        device_key: api_key.to_string(),
        org_slug,
    };

    BakeryAuthState::save_to_keyring_async(&new_config).await.map_err(|e| BackendError::Internal(e))?;

    let mut config_guard = state.device_config.lock().map_err(|_| BackendError::Internal("Lock error".to_string()))?;
    *config_guard = Some(new_config);

    Ok(())
}

#[tauri::command]
pub async fn get_provisioned_api_key() -> BackendResult<Option<String>> {
    let entry = Entry::new(KEYRING_SERVICE, KEYRING_USER).map_err(|e| BackendError::Internal(format!("Keyring error: {}", e)))?;

    match entry.get_password() {
        Ok(pw) => {
            if let Ok(config) = serde_json::from_str::<DeviceConfig>(&pw) {
                Ok(Some(config.device_key))
            } else {
                Ok(None)
            }
        },
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(BackendError::Internal(format!(
            "Failed to retrieve API Key: {}",
            e
        ))),
    }
}

#[tauri::command]
pub async fn clear_provisioned_api_key() -> BackendResult<()> {
    let entry = Entry::new(KEYRING_SERVICE, KEYRING_USER).map_err(|e| BackendError::Internal(format!("Keyring error: {}", e)))?;

    match entry.delete_credential() {
        Ok(_) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(BackendError::Internal(format!(
            "Failed to clear API Key: {}",
            e
        ))),
    }
}

#[tauri::command]
pub async fn login_cloud_command(
    state: State<'_, BakeryAuthState>,
    card_id: String,
    pin: String,
    location_id: Option<String>,
) -> BackendResult<serde_json::Value> {
    let request = state.build_request(reqwest::Method::POST, "/members/login")?;

    let body = serde_json::json!({
        "cardId": card_id,
        "pin": pin,
        "locationId": location_id
    });

    let res = request.json(&body).send().await.map_err(BackendError::Network)?;

    let status = res.status();
    let text = res.text().await.map_err(|e| BackendError::Internal(format!("Failed to read response body: {}", e)))?;

    if !status.is_success() {
        return Err(BackendError::Auth(format!("Login failed: {} - {}", status, text)));
    }

    let json_res: serde_json::Value = serde_json::from_str(&text).map_err(BackendError::Serialization)?;
    let mut data = json_res["data"].clone();

    // Store token in state
    if let Some(token) = data["token"].as_str() {
        let member: MemberProfile = serde_json::from_value(data["member"].clone()).map_err(BackendError::Serialization)?;

        let mut active_id_guard = state.active_member_id.lock().map_err(|_| BackendError::Internal("Lock error".to_string()))?;
        let mut sessions_guard = state.sessions.lock().map_err(|_| BackendError::Internal("Lock error".to_string()))?;

        sessions_guard.insert(member.id.clone(), AuthSession {
            token: token.to_string(),
            user: member.clone(),
        });

        *active_id_guard = Some(member.id);

        // Remove token from response sent to frontend
        if let Some(obj) = data.as_object_mut() {
            obj.remove("token");
        }
    }

    Ok(data)
}

#[tauri::command]
pub async fn logout_cloud_command(
    state: State<'_, BakeryAuthState>,
) -> BackendResult<()> {
    let active_id = {
        let active_id_guard = state.active_member_id.lock().map_err(|_| BackendError::Internal("Lock error".to_string()))?;
        active_id_guard.clone()
    };

    // Best effort notify server
    if let Ok(request) = state.build_request(reqwest::Method::POST, "/bakery/auth/logout") {
        let _ = request.send().await;
    }

    if let Some(id) = active_id {
        let mut active_id_guard = state.active_member_id.lock().map_err(|_| BackendError::Internal("Lock error".to_string()))?;
        let mut sessions_guard = state.sessions.lock().map_err(|_| BackendError::Internal("Lock error".to_string()))?;

        sessions_guard.remove(&id);
        *active_id_guard = sessions_guard.keys().next().cloned();
    }

    Ok(())
}

#[tauri::command]
pub async fn authenticated_api_request(
    state: State<'_, BakeryAuthState>,
    method: String,
    path: String,
    body: Option<serde_json::Value>,
) -> BackendResult<serde_json::Value> {
    let req_method = match method.to_uppercase().as_str() {
        "GET" => reqwest::Method::GET,
        "POST" => reqwest::Method::POST,
        "PUT" => reqwest::Method::PUT,
        "PATCH" => reqwest::Method::PATCH,
        "DELETE" => reqwest::Method::DELETE,
        _ => return Err(BackendError::Validation(format!("Unsupported method: {}", method))),
    };

    let mut request = state.build_request(req_method, &path)?;

    if let Some(b) = body {
        request = request.json(&b);
    }

    let res = request.send().await.map_err(BackendError::Network)?;

    let status = res.status();
    if !status.is_success() {
        let err_body = res.text().await.unwrap_or_default();
        return Err(BackendError::Internal(format!("API Error {}: {}", status, err_body)));
    }

    let json_res: serde_json::Value = res.json().await.map_err(BackendError::Network)?;

    // Return only data portion if it's a standard response
    if json_res["success"].as_bool().unwrap_or(false) && json_res.get("data").is_some() {
        Ok(json_res["data"].clone())
    } else {
        Ok(json_res)
    }
}

#[tauri::command]
pub async fn update_bakery_api_url(
    state: State<'_, BakeryAuthState>,
    api_url: String,
) -> BackendResult<()> {
    {
        let mut override_guard = state.base_url_override.lock().map_err(|_| BackendError::Internal("Lock error on override".to_string()))?;
        *override_guard = Some(api_url.clone());
    }

    let config_to_save = {
        let mut config_guard = state.device_config.lock().map_err(|_| BackendError::Internal("Lock error on config".to_string()))?;
        if let Some(config) = config_guard.as_mut() {
            config.base_url = api_url;
            Some(config.clone())
        } else {
            None
        }
    };

    if let Some(config) = config_to_save {
        BakeryAuthState::save_to_keyring_async(&config).await.map_err(|e| BackendError::Internal(e))?;
    }

    Ok(())
}

#[tauri::command]
pub async fn set_device_config(
    state: State<'_, BakeryAuthState>,
    base_url: String,
    location_id: String,
    device_key: String,
    org_slug: String,
) -> BackendResult<()> {
    let new_config = DeviceConfig {
        base_url,
        location_id,
        device_key,
        org_slug,
    };

    BakeryAuthState::save_to_keyring_async(&new_config).await.map_err(|e| BackendError::Internal(e))?;

    let mut config = state.device_config.lock().map_err(|_| BackendError::Internal("Lock error".to_string()))?;
    *config = Some(new_config);

    Ok(())
}

#[tauri::command]
pub async fn get_device_config(
    state: State<'_, BakeryAuthState>,
) -> BackendResult<Option<SanitizedDeviceConfig>> {
    let config_guard = state.device_config.lock().map_err(|_| BackendError::Internal("Lock error".to_string()))?;
    Ok(config_guard.as_ref().map(|c| SanitizedDeviceConfig {
        location_id: c.location_id.clone(),
        org_slug: c.org_slug.clone(),
        device_key: c.device_key.clone(),
    }))
}

#[tauri::command]
pub async fn reset_device_config(state: State<'_, BakeryAuthState>) -> BackendResult<()> {
    let entry = Entry::new(KEYRING_SERVICE, KEYRING_USER).map_err(|e| BackendError::Internal(format!("Keyring error: {}", e)))?;
    let _ = entry.delete_credential();

    if let Some(path) = BakeryAuthState::get_config_path() {
        if path.exists() {
            let _ = std::fs::remove_file(path);
        }
    }

    *state.device_config.lock().unwrap() = None;
    state.sessions.lock().unwrap().clear();
    *state.active_member_id.lock().unwrap() = None;

    Ok(())
}
