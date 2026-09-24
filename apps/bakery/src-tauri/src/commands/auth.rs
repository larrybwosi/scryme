use crate::error::{BackendError, BackendResult};
use crate::models::User;
use bcrypt::verify;
use chrono::Utc;
use keyring::Entry;
use sqlx::SqlitePool;
use tauri::State;
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
                    "http://localhost:3002".to_string()
                } else {
                    "https://api.scryme.tech".to_string()
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
            let clean_path = path.trim_start_matches('/');
            let resolved_path = if clean_path.contains(":orgSlug") || clean_path.contains("{orgSlug}") {
                if let Some(ref slug) = org_slug {
                    clean_path.replace(":orgSlug", slug).replace("{orgSlug}", slug)
                } else {
                    clean_path.to_string()
                }
            } else {
                clean_path.to_string()
            };
            format!(
                "{}/{}",
                base_url.trim_end_matches('/'),
                resolved_path
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

    /// Constructs a `scryme_sdk::ScrymeClient` using the current device config and active auth state.
    pub fn build_sdk_client(&self) -> BackendResult<scryme_sdk::ScrymeClient> {
        let (base_url, org_slug) = {
            let override_guard = self.base_url_override.lock().map_err(|_| BackendError::Internal("Failed to lock base url override".to_string()))?;
            let config_guard = self.device_config.lock().map_err(|_| BackendError::Internal("Failed to lock device config".to_string()))?;

            let url = if let Some(over) = override_guard.as_ref() {
                over.clone()
            } else if let Some(config) = config_guard.as_ref() {
                config.base_url.clone()
            } else {
                if cfg!(debug_assertions) {
                    "http://localhost:3002".to_string()
                } else {
                    "https://api.scryme.tech".to_string()
                }
            };

            let slug = config_guard.as_ref().map(|c| c.org_slug.clone()).unwrap_or_default();
            (url, slug)
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

        let mut builder = scryme_sdk::ScrymeClient::builder()
            .base_url(base_url)
            .org_slug(org_slug);

        if let Some(t) = token {
            builder = builder.bearer_token(t);
        }

        Ok(builder.build())
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
    let sanitized = api_url.trim().trim_end_matches('/');
    let clean_url = sanitized.replace("/api/v3", "");

    let response = client
        .get(format!("{}/api/v3/health", clean_url))
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
        "https://api.scryme.tech"
    };

    let base_api_url = api_url_override.as_deref().unwrap_or(default_api_url);
    let clean_url = base_api_url.trim().trim_end_matches('/').replace("/api/v3", "");

    let response = client
        .post(format!("{}/api/v3/global/pos/provision", clean_url))
        .json(&serde_json::json!({
            "setupToken": setup_token,
            "token": setup_token,
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
    
    let is_wrapped = result.get("success").is_some();
    let target = if is_wrapped { &result["data"] } else { &result };

    let api_key = target["apiKey"]
        .as_str()
        .or_else(|| target["clientId"].as_str())
        .ok_or_else(|| BackendError::Internal("No API Key returned from server".to_string()))?;

    let org_slug = target["organization"]["slug"]
        .as_str()
        .or_else(|| target["organization"]["orgSlug"].as_str())
        .unwrap_or_default()
        .to_string();

    let location_id = target["device"]["locationId"]
        .as_str()
        .or_else(|| target["locationId"].as_str())
        .or_else(|| target["location"]["id"].as_str())
        .unwrap_or_default()
        .to_string();

    let new_config = DeviceConfig {
        base_url: clean_url,
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
pub async fn start_device_setup_command(
    state: State<'_, BakeryAuthState>,
    base_url: String,
    device_key: String,
    org_slug: String,
) -> BackendResult<()> {
    let mut config = state.device_config.lock().map_err(|_| BackendError::Internal("Lock error".to_string()))?;
    *config = Some(DeviceConfig {
        base_url,
        location_id: String::new(),
        device_key,
        org_slug,
    });
    Ok(())
}

#[tauri::command]
pub async fn get_locations_command(
    state: State<'_, BakeryAuthState>,
) -> BackendResult<serde_json::Value> {
    let request = state.build_request(reqwest::Method::GET, "api/v3/:orgSlug/pos/locations")?;

    let res = request
        .send()
        .await
        .map_err(BackendError::Network)?;

    let status = res.status();
    if !status.is_success() {
        let err_body = res.text().await.unwrap_or_default();
        return Err(BackendError::Internal(format!(
            "Failed to fetch locations: {} - {}",
            status, err_body
        )));
    }

    let mut data: serde_json::Value = res
        .json()
        .await
        .map_err(BackendError::Network)?;

    if data["success"].as_bool().unwrap_or(false) && data.get("data").is_some() {
        data = data["data"].clone();
    }

    Ok(data)
}

#[tauri::command]
pub async fn create_pairing_session_command(
    state: State<'_, BakeryAuthState>,
) -> BackendResult<serde_json::Value> {
    let request = state.build_request(
        reqwest::Method::POST,
        "api/v3/pos/pairing/session",
    )?;

    let res = request
        .send()
        .await
        .map_err(BackendError::Network)?;

    let status = res.status();
    if !status.is_success() {
        let err_body = res.text().await.unwrap_or_default();
        return Err(BackendError::Internal(format!("Failed to create pairing session: {} - {}", status, err_body)));
    }

    let data: serde_json::Value = res
        .json()
        .await
        .map_err(BackendError::Network)?;

    Ok(data)
}

#[tauri::command]
pub async fn get_pairing_session_status_command(
    state: State<'_, BakeryAuthState>,
    session_id: String,
) -> BackendResult<serde_json::Value> {
    let path = format!("api/v3/pos/pairing/session/{}/status", session_id);
    let request = state.build_request(reqwest::Method::GET, &path)?;

    let res = request
        .send()
        .await
        .map_err(BackendError::Network)?;

    let status = res.status();
    if !status.is_success() {
        let err_body = res.text().await.unwrap_or_default();
        return Err(BackendError::Internal(format!("Failed to check session status: {} - {}", status, err_body)));
    }

    let data: serde_json::Value = res
        .json()
        .await
        .map_err(BackendError::Network)?;

    Ok(data)
}

#[tauri::command]
pub async fn authorize_pairing_session_command(
    state: State<'_, BakeryAuthState>,
    session_id: String,
    location_id: Option<String>,
    device_name: Option<String>,
    device_type: Option<String>,
) -> BackendResult<serde_json::Value> {
    let path = format!("api/v3/pos/pairing/session/{}/authorize", session_id);
    let mut request = state.build_request(reqwest::Method::POST, &path)?;

    let body = serde_json::json!({
        "locationId": location_id,
        "deviceName": device_name,
        "deviceType": device_type,
    });
    request = request.json(&body);

    let res = request
        .send()
        .await
        .map_err(BackendError::Network)?;

    let status = res.status();
    if !status.is_success() {
        let err_body = res.text().await.unwrap_or_default();
        return Err(BackendError::Internal(format!("Failed to authorize session: {} - {}", status, err_body)));
    }

    let data: serde_json::Value = res
        .json()
        .await
        .map_err(BackendError::Network)?;

    Ok(data)
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
    let request = state.build_request(reqwest::Method::POST, "api/v3/:orgSlug/pos/login")?;

    let device_key = {
        let config_guard = state.device_config.lock().map_err(|_| BackendError::Internal("Lock error".to_string()))?;
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
        .map_err(BackendError::Network)?;

    let status = res.status();
    let text = res
        .text()
        .await
        .map_err(BackendError::Network)?;

    if !status.is_success() {
        return Err(BackendError::Auth(format!("Login failed: {} - {}", status, text)));
    }

    let json: serde_json::Value = serde_json::from_str(&text)
        .map_err(|e| BackendError::Internal(format!("JSON parse error: {}", e)))?;

    let target = if json.get("data").is_some() && !json["data"].is_null() {
        &json["data"]
    } else {
        &json
    };

    let (token_val, member_val, restored_val) = if let Some(access_token_obj) = target.get("accessToken").and_then(|v| v.as_object()) {
        let nested_token = access_token_obj.get("token").or_else(|| access_token_obj.get("accessToken"));
        let nested_member = access_token_obj.get("member").or_else(|| target.get("member"));
        let nested_restored = access_token_obj.get("restoredSession").or_else(|| access_token_obj.get("restored_session")).or_else(|| target.get("restoredSession")).or_else(|| target.get("restored_session"));
        (nested_token, nested_member, nested_restored)
    } else {
        let direct_token = target.get("token").or_else(|| target.get("accessToken"));
        let direct_member = target.get("member");
        let direct_restored = target.get("restoredSession").or_else(|| target.get("restored_session"));
        (direct_token, direct_member, direct_restored)
    };

    let token = token_val
        .and_then(|t| t.as_str())
        .ok_or_else(|| BackendError::Auth(format!("Missing token in login response: {}", text)))?
        .to_string();

    let member_json = member_val
        .ok_or_else(|| BackendError::Auth(format!("Missing member in login response: {}", text)))?;

    let member_id = member_json["id"].as_str().unwrap_or_default().to_string();
    let member_name = member_json["name"]
        .as_str()
        .or_else(|| member_json["user"]["name"].as_str())
        .unwrap_or_default()
        .to_string();
    let member_role = member_json["role"].as_str().map(|s| s.to_string());

    let member = MemberProfile {
        id: member_id,
        name: member_name,
        role: member_role,
    };

    let restored_session = restored_val.and_then(|r| r.as_bool()).unwrap_or(false);

    let org_slug_val = {
        let config_guard = state.device_config.lock().map_err(|_| BackendError::Internal("Lock error".to_string()))?;
        config_guard.as_ref().map(|c| c.org_slug.clone()).unwrap_or_default()
    };

    let data = serde_json::json!({
        "token": token,
        "member": member,
        "orgSlug": org_slug_val,
        "restoredSession": restored_session,
    });

    let mut active_id_guard = state.active_member_id.lock().map_err(|_| BackendError::Internal("Lock error".to_string()))?;
    let mut sessions_guard = state.sessions.lock().map_err(|_| BackendError::Internal("Lock error".to_string()))?;

    sessions_guard.insert(member.id.clone(), AuthSession {
        token,
        user: member.clone(),
    });

    *active_id_guard = Some(member.id);

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
        eprintln!("[API Request Failed] {} {} -> Status {}: {}", method, path, status, err_body);
        return Err(BackendError::Internal(format!("API Error {} [{} {}]: {}", status, method, path, err_body)));
    }

    let json_res: serde_json::Value = res.json().await.map_err(BackendError::Network)?;

    // Return data and metadata if it's a standard response
    if json_res["success"].as_bool().unwrap_or(false) && json_res.get("data").is_some() {
        if let Some(meta) = json_res.get("meta").or(json_res.get("metadata")) {
            Ok(serde_json::json!({
                "data": json_res["data"],
                "metadata": meta
            }))
        } else {
            Ok(json_res["data"].clone())
        }
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

    *state.device_config.lock().map_err(|_| BackendError::Internal("Lock error".to_string()))? = None;
    state.sessions.lock().map_err(|_| BackendError::Internal("Lock error".to_string()))?.clear();
    *state.active_member_id.lock().map_err(|_| BackendError::Internal("Lock error".to_string()))? = None;

    Ok(())
}
