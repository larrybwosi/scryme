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
pub struct AuthSession {
    pub token: String,
    pub member_id: String,
}

pub struct BakeryAuthState {
    pub api_url: Mutex<Option<String>>,
    pub session: Mutex<Option<AuthSession>>,
    pub client: reqwest::Client,
}

impl BakeryAuthState {
    pub fn new() -> Self {
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(30))
            .build()
            .unwrap_or_default();

        Self {
            api_url: Mutex::new(None),
            session: Mutex::new(None),
            client,
        }
    }

    pub fn build_request(
        &self,
        method: reqwest::Method,
        path: &str,
    ) -> BackendResult<reqwest::RequestBuilder> {
        let base_url = {
            let url_guard = self.api_url.lock().map_err(|_| BackendError::Internal("Failed to lock api_url".to_string()))?;
            url_guard.clone().unwrap_or_else(|| {
                if cfg!(debug_assertions) {
                    "http://localhost:3002/api/v2".to_string()
                } else {
                    "https://api.scryme.app/api/v2".to_string()
                }
            })
        };

        let api_key = {
            let entry = Entry::new("scryme-bakery", "device-api-key")
                .map_err(|e| BackendError::Internal(format!("Keyring error: {}", e)))?;
            entry.get_password().ok()
        };

        let token = {
            let session_guard = self.session.lock().map_err(|_| BackendError::Internal("Failed to lock session".to_string()))?;
            session_guard.as_ref().map(|s| s.token.clone())
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

        if let Some(key) = api_key {
            let mut key_val = HeaderValue::from_str(&key).map_err(|e| BackendError::Internal(e.to_string()))?;
            key_val.set_sensitive(true);
            request_builder = request_builder.header("X-API-KEY", key_val);
        }

        if let Some(t) = token {
            let mut val = HeaderValue::from_str(&t).map_err(|e| BackendError::Internal(e.to_string()))?;
            val.set_sensitive(true);
            request_builder = request_builder.header("X-MEMBER-TOKEN", val);
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
    let mut session_guard = state.session.lock().map_err(|_| BackendError::Internal("Lock error".to_string()))?;
    *session_guard = Some(AuthSession {
        token,
        member_id,
    });
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
    
    println!("Provisioning API response: {:?}", result);

    let api_key = result["data"]["apiKey"]
        .as_str()
        .ok_or_else(|| BackendError::Internal("No API Key returned from server".to_string()))?;

    let entry = Entry::new("scryme-bakery", "device-api-key")
        .map_err(|e| BackendError::Internal(format!("Keyring error: {}", e)))?;

    entry
        .set_password(api_key)
        .map_err(|e| BackendError::Internal(format!("Failed to store API Key: {}", e)))?;

    Ok(())
}

#[tauri::command]
pub async fn get_provisioned_api_key() -> BackendResult<Option<String>> {
    let entry = Entry::new("scryme-bakery", "device-api-key")
        .map_err(|e| BackendError::Internal(format!("Keyring error: {}", e)))?;

    match entry.get_password() {
        Ok(pw) => Ok(Some(pw)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(BackendError::Internal(format!(
            "Failed to retrieve API Key: {}",
            e
        ))),
    }
}

#[tauri::command]
pub async fn clear_provisioned_api_key() -> BackendResult<()> {
    let entry = Entry::new("scryme-bakery", "device-api-key")
        .map_err(|e| BackendError::Internal(format!("Keyring error: {}", e)))?;

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

    // Store token in state
    if let Some(token) = json_res["data"]["token"].as_str() {
        if let Some(member_id) = json_res["data"]["member"]["id"].as_str() {
            let mut session_guard = state.session.lock().map_err(|_| BackendError::Internal("Lock error".to_string()))?;
            *session_guard = Some(AuthSession {
                token: token.to_string(),
                member_id: member_id.to_string(),
            });
        }
    }

    Ok(json_res["data"].clone())
}

#[tauri::command]
pub async fn logout_cloud_command(
    state: State<'_, BakeryAuthState>,
) -> BackendResult<()> {
    // Best effort notify server
    let request = state.build_request(reqwest::Method::POST, "/bakery/auth/logout")?;
    let _ = request.send().await;

    let mut session_guard = state.session.lock().map_err(|_| BackendError::Internal("Lock error".to_string()))?;
    *session_guard = None;
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

    // Unwrap standard response if it exists
    if json_res["success"] == true && !json_res["data"].is_null() {
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
    let mut url_guard = state.api_url.lock().map_err(|_| BackendError::Internal("Lock error".to_string()))?;
    *url_guard = Some(api_url);
    Ok(())
}
