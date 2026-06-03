use crate::error::{BackendError, BackendResult};
use crate::models::User;
use keyring::Entry;
use sqlx::SqlitePool;
use tauri::State;
use bcrypt::verify;
use chrono::Utc;

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

    let password_hash = user.password_hash.as_ref().ok_or_else(|| {
        BackendError::Auth("User does not have a local password set".to_string())
    })?;

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
pub async fn validate_api_health(api_url: String) -> BackendResult<bool> {
    let client = reqwest::Client::new();
    let response = client
        .get(format!("{}/health", api_url))
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
        "http://localhost:3001"
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
        let err_body = response.text().await.unwrap_or_else(|_| "Unknown error body".to_string());
        return Err(BackendError::Internal(format!(
            "Provisioning failed ({}): {}",
            status,
            err_body
        )));
    }

    let result: serde_json::Value = response
        .json()
        .await
        .map_err(BackendError::Network)?;

    let api_key = result["apiKey"]
        .as_str()
        .ok_or_else(|| BackendError::Internal("No API Key returned from server".to_string()))?;

    // Store in keyring
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
        Err(e) => Err(BackendError::Internal(format!("Failed to retrieve API Key: {}", e))),
    }
}

#[tauri::command]
pub async fn clear_provisioned_api_key() -> BackendResult<()> {
    let entry = Entry::new("scryme-bakery", "device-api-key")
        .map_err(|e| BackendError::Internal(format!("Keyring error: {}", e)))?;

    match entry.delete_password() {
        Ok(_) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(BackendError::Internal(format!("Failed to clear API Key: {}", e))),
    }
}
