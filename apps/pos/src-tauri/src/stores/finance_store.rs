use anyhow::{Context, Result};
use log::{error, info, warn};
use reqwest::StatusCode;
use sqlx::Row;
use tauri::{AppHandle, Manager, State};
use tauri_plugin_sql::{DbInstances, DbPool};

use crate::auth_store::AuthState;

const MAIN_DB_NAME: &str = "sqlite:pos_main.db";

pub struct FinanceState;

impl FinanceState {
    pub fn new() -> Self {
        Self
    }
}

async fn get_db_pool(app: &AppHandle, db_name: &str) -> Result<sqlx::SqlitePool, String> {
    let instances = app.state::<DbInstances>();
    let guard = instances.0.read().await;

    let target_db = if cfg!(feature = "standalone") && db_name == MAIN_DB_NAME {
        "sqlite:pos_standalone.db"
    } else {
        db_name
    };

    if let Some(DbPool::Sqlite(pool)) = guard.get(target_db) {
        Ok(pool.clone())
    } else {
        Err(format!("Database {} not found.", target_db))
    }
}

pub async fn init_state(app: &AppHandle) {
    let pool = match get_db_pool(app, MAIN_DB_NAME).await {
        Ok(p) => p,
        Err(e) => {
            error!("[FinanceStore] Failed to get main DB pool: {}", e);
            return;
        }
    };

    let create_table_query = r#"
        CREATE TABLE IF NOT EXISTS queued_petty_cash (
            id TEXT PRIMARY KEY,
            timestamp INTEGER,
            org_slug TEXT,
            payload TEXT,
            retry_count INTEGER DEFAULT 0,
            last_error TEXT
        )
    "#;

    if let Err(e) = sqlx::query(create_table_query).execute(&pool).await {
        error!("[FinanceStore] Failed to create queued_petty_cash table: {}", e);
    }
}

#[tauri::command]
pub async fn register_petty_cash_command(
    app: AppHandle,
    auth_state: State<'_, AuthState>,
    org_slug: String,
    payload: serde_json::Value,
) -> Result<serde_json::Value, String> {
    let transaction_id = uuid::Uuid::new_v4().to_string();
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis() as i64;

    // Try immediate push
    match push_petty_cash(&auth_state, &org_slug, &payload).await {
        Ok(resp) => {
            info!("[FinanceStore] Petty cash registered immediately.");
            return Ok(resp);
        }
        Err(e) => {
            warn!("[FinanceStore] Immediate push failed: {}. Queueing...", e);
            let pool = get_db_pool(&app, MAIN_DB_NAME).await?;
            let payload_str = serde_json::to_string(&payload).map_err(|e| e.to_string())?;

            sqlx::query(
                "INSERT INTO queued_petty_cash (id, timestamp, org_slug, payload) VALUES (?1, ?2, ?3, ?4)"
            )
            .bind(&transaction_id)
            .bind(timestamp)
            .bind(&org_slug)
            .bind(&payload_str)
            .execute(&pool)
            .await
            .map_err(|e| e.to_string())?;

            Ok(serde_json::json!({
                "success": true,
                "message": "Registered locally and queued for sync.",
                "queued": true
            }))
        }
    }
}

#[tauri::command]
pub async fn upload_file_command(
    auth_state: State<'_, AuthState>,
    file_path: String,
) -> Result<serde_json::Value, String> {
    let request = auth_state
        .build_request(reqwest::Method::POST, crate::api_config::routes::UPLOAD)
        .map_err(|e| e.to_string())?;

    // Read file content
    let file_bytes = tokio::fs::read(&file_path)
        .await
        .map_err(|e| format!("Failed to read file at {}: {}", file_path, e))?;

    let file_name = std::path::Path::new(&file_path)
        .file_name()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();

    let part = reqwest::multipart::Part::bytes(file_bytes)
        .file_name(file_name)
        .mime_str("application/octet-stream") // API should handle it
        .map_err(|e| e.to_string())?;

    let form = reqwest::multipart::Form::new().part("file", part);

    let res = request
        .multipart(form)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let status = res.status();
    if !status.is_success() {
        let err_text = res.text().await.unwrap_or_default();
        return Err(format!("Upload failed: {} - {}", status, err_text));
    }

    let data: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
    Ok(data)
}

async fn push_petty_cash(
    auth_state: &AuthState,
    org_slug: &str,
    payload: &serde_json::Value,
) -> Result<serde_json::Value> {
    let path = format!("api/v3/{}/pos/petty-cash", org_slug);
    let req = auth_state
        .build_request(reqwest::Method::POST, &path)
        .map_err(|e| anyhow::anyhow!(e))?
        .json(payload);

    let resp = req
        .timeout(std::time::Duration::from_secs(30))
        .send()
        .await
        .map_err(|e| anyhow::anyhow!(e))?;

    let status = resp.status();
    if status.is_success() {
        return resp.json().await.map_err(|e| anyhow::anyhow!(e));
    }

    let error_body = resp.text().await.unwrap_or_default();
    Err(anyhow::anyhow!("Server Error {}: {}", status, error_body))
}

pub async fn sync_petty_cash(app: AppHandle) -> Result<usize> {
    let auth_state = app.state::<AuthState>();
    let pool = get_db_pool(&app, MAIN_DB_NAME).await.map_err(|e| anyhow::anyhow!(e))?;

    let rows = sqlx::query("SELECT id, org_slug, payload FROM queued_petty_cash LIMIT 10")
        .fetch_all(&pool)
        .await?;

    let mut success_count = 0;
    for row in rows {
        let id: String = row.get("id");
        let org_slug: String = row.get("org_slug");
        let payload_str: String = row.get("payload");
        let payload: serde_json::Value = serde_json::from_str(&payload_str)?;

        match push_petty_cash(&auth_state, &org_slug, &payload).await {
            Ok(_) => {
                sqlx::query("DELETE FROM queued_petty_cash WHERE id = ?1")
                    .bind(&id)
                    .execute(&pool)
                    .await?;
                success_count += 1;
            }
            Err(e) => {
                warn!("[FinanceStore] Sync failed for {}: {}", id, e);
                sqlx::query("UPDATE queued_petty_cash SET retry_count = retry_count + 1, last_error = ?1 WHERE id = ?2")
                    .bind(e.to_string())
                    .bind(&id)
                    .execute(&pool)
                    .await?;
            }
        }
    }

    Ok(success_count)
}
