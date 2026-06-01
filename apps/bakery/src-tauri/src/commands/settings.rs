use crate::error::{BackendError, BackendResult};
use crate::models::{BakerySettings};
use bcrypt::{hash, DEFAULT_COST};
use chrono::Utc;
use sqlx::SqlitePool;
use tauri::State;

#[tauri::command]
pub async fn update_local_admin(
    pool: State<'_, SqlitePool>,
    email: Option<String>,
    password: Option<String>,
) -> BackendResult<()> {
    if let Some(new_email) = email {
        sqlx::query("UPDATE users SET email = ? WHERE id = 'local-admin'")
            .bind(new_email)
            .execute(&*pool)
            .await?;
    }

    if let Some(new_password) = password {
        let password_hash =
            hash(new_password, DEFAULT_COST).map_err(|e| BackendError::Internal(e.to_string()))?;
        sqlx::query("UPDATE users SET password_hash = ? WHERE id = 'local-admin'")
            .bind(password_hash)
            .execute(&*pool)
            .await?;
    }

    Ok(())
}

#[tauri::command]
pub async fn get_settings(
    pool: State<'_, SqlitePool>,
    org_id: String,
) -> BackendResult<BakerySettings> {
    sqlx::query_as::<_, BakerySettings>("SELECT * FROM bakery_settings WHERE organization_id = ? OR organization_id = 'local-org' LIMIT 1")
        .bind(org_id)
        .fetch_one(&*pool)
        .await
        .map_err(BackendError::from)
}

#[tauri::command]
pub async fn update_settings(
    pool: State<'_, SqlitePool>,
    _user_id: String,
    settings: serde_json::Value,
) -> BackendResult<()> {
    // Fetch the single settings row ID if it's not provided
    let id = if let Some(id) = settings.get("id").and_then(|v| v.as_str()) {
        id.to_string()
    } else {
        let (existing_id,): (String,) = sqlx::query_as("SELECT id FROM bakery_settings LIMIT 1")
            .fetch_one(&*pool)
            .await?;
        existing_id
    };

    sqlx::query(
        "UPDATE bakery_settings SET
         is_enabled = COALESCE(?, is_enabled),
         default_location_id = COALESCE(?, default_location_id),
         default_baker_id = COALESCE(?, default_baker_id),
         auto_create_daily_batches = COALESCE(?, auto_create_daily_batches),
         expiry_warning_days = COALESCE(?, expiry_warning_days),
         auth_mode = COALESCE(?, auth_mode),
         api_key = COALESCE(?, api_key),
         api_endpoint_url = COALESCE(?, api_endpoint_url),
         batch_prefix = COALESCE(?, batch_prefix),
         batch_separator = COALESCE(?, batch_separator),
         batch_date_format = COALESCE(?, batch_date_format),
         batch_sequence = COALESCE(?, batch_sequence),
         updated_at = ?
         WHERE id = ?",
    )
    .bind(settings.get("isEnabled").and_then(|v| v.as_bool()))
    .bind(settings.get("defaultLocationId").and_then(|v| v.as_str()))
    .bind(settings.get("defaultBakerId").and_then(|v| v.as_str()))
    .bind(
        settings
            .get("autoCreateDailyBatches")
            .and_then(|v| v.as_bool()),
    )
    .bind(settings.get("expiryWarningDays").and_then(|v| v.as_i64()))
    .bind(settings.get("authMode").and_then(|v| v.as_str()))
    .bind(settings.get("apiKey").and_then(|v| v.as_str()))
    .bind(settings.get("apiEndpointUrl").and_then(|v| v.as_str()))
    .bind(settings.get("batchPrefix").and_then(|v| v.as_str()))
    .bind(settings.get("batchSeparator").and_then(|v| v.as_str()))
    .bind(settings.get("batchDateFormat").and_then(|v| v.as_str()))
    .bind(settings.get("batchSequence").and_then(|v| v.as_str()))
    .bind(Utc::now())
    .bind(id)
    .execute(&*pool)
    .await?;

    Ok(())
}
