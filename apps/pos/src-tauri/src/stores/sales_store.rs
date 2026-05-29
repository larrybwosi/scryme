use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Nonce,
};
use anyhow::{Context, Result};
use log::{error, info, warn};
use rand::RngCore;
use reqwest::StatusCode;
use sha2::{Digest, Sha256};
use sqlx::Row;
use std::sync::{Arc, OnceLock};
use std::time::Duration;
use tauri::{AppHandle, Manager, State};
use tauri_plugin_sql::{DbInstances, DbPool};
use thiserror::Error;
use tokio::sync::RwLock;
use tokio::time::{sleep, Instant};

use crate::auth_store::AuthState;
#[cfg(all(not(feature = "standalone"), any(feature = "restaurant", feature = "pharmacy")))]
use crate::kds_models::{KdsOrderPayload, OrderItem};
use crate::models::{QueuedSale, SaleResponse, SaleStatus};
use crate::shift_store::ShiftState;

const SALES_FILENAME: &str = "secure_sales_queue.bin"; // Kept only for migration
static LEGACY_SECRET: OnceLock<String> = OnceLock::new();

// Name of the DBs as registered/loaded by the sql plugin in your setup/frontend
const MAIN_DB_NAME: &str = "sqlite:pos_main.db";
#[cfg(all(not(feature = "standalone"), any(feature = "restaurant", feature = "pharmacy")))]
const KDS_DB_NAME: &str = "sqlite:kds_orders.db";

fn get_legacy_secret() -> &'static str {
    LEGACY_SECRET.get_or_init(|| {
        option_env!("LEGACY_APP_SECRET")
            .map(|s| s.to_string())
            .unwrap_or_else(|| "dealio-pos-secure-storage-salt".to_string())
    })
}

#[derive(Error, Debug)]
pub enum SalesError {
    #[error("Network request failed: {0}")]
    NetworkError(String),
    #[error("Server rejected request (Fatal): {0}")]
    ValidationError(String),
    #[error("Authentication failed: {0}")]
    AuthError(String),
    #[error("Encryption/Storage failed: {0}")]
    StorageError(String),
    #[error("Digital payment processing failed: {0}")]
    PaymentProcessingError(String),
    #[error(transparent)]
    Other(#[from] anyhow::Error),
}

// SalesState no longer needs to hold a giant Arc<Mutex<Vec>>. 
// We keep it empty (or you can remove it entirely if you unregister it from Tauri) 
// to maintain API compatibility without holding memory.
pub struct SalesState;

impl SalesState {
    pub fn new() -> Self {
        Self
    }
}

impl Default for SalesState {
    fn default() -> Self {
        Self::new()
    }
}

// --- DB Helper ---
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

// --- Row-Level Encryption Helpers ---

fn get_legacy_key() -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(get_legacy_secret().as_bytes());
    hasher.finalize().into()
}

async fn encrypt_payload(_app: &AppHandle, payload: &serde_json::Value) -> Result<Vec<u8>> {
    let json_data = serde_json::to_string(payload)?;

    let key = crate::security::get_or_create_key("sales_queue_key")
        .map_err(|e| anyhow::anyhow!("Keyring error: {}", e))?;

    let cipher = Aes256Gcm::new(&key.into());

    let mut nonce_bytes = [0u8; 12];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from(nonce_bytes);

    let ciphertext = cipher
        .encrypt(&nonce, json_data.as_bytes())
        .map_err(|_| anyhow::anyhow!("Encryption failed"))?;

    let mut final_payload = nonce_bytes.to_vec();
    final_payload.extend_from_slice(&ciphertext);

    Ok(final_payload)
}

async fn decrypt_payload(_app: &AppHandle, file_bytes: &[u8]) -> Result<serde_json::Value> {
    if file_bytes.len() < 12 {
        return Err(anyhow::anyhow!("Payload too short"));
    }

    let (nonce_slice, ciphertext) = file_bytes.split_at(12);
    let mut nonce_arr = [0u8; 12];
    nonce_arr.copy_from_slice(nonce_slice);
    let nonce = Nonce::from(nonce_arr);

    let secure_key_res = crate::security::get_or_create_key("sales_queue_key");

    if let Ok(key) = secure_key_res {
        let cipher = Aes256Gcm::new(&key.into());
        if let Ok(plaintext) = cipher.decrypt(&nonce, ciphertext) {
            return Ok(serde_json::from_slice(&plaintext)?);
        }
    }

    warn!("[SalesStore] Decryption with secure key failed. Attempting legacy key...");
    let legacy_key = get_legacy_key();
    let legacy_cipher = Aes256Gcm::new(&legacy_key.into());

    match legacy_cipher.decrypt(&nonce, ciphertext) {
        Ok(plaintext) => Ok(serde_json::from_slice(&plaintext)?),
        Err(_) => Err(anyhow::anyhow!("Decryption failed with both keys")),
    }
}

// --- Initialization & Migration ---

pub async fn init_state(app: &AppHandle, _state: &SalesState) {
    let pool = match get_db_pool(app, MAIN_DB_NAME).await {
        Ok(p) => p,
        Err(e) => {
            error!("[SalesStore] Failed to get main DB pool: {}", e);
            return;
        }
    };

    // 1. Initialize Table
    let create_table_query = r#"
        CREATE TABLE IF NOT EXISTS queued_sales (
            id TEXT PRIMARY KEY,
            timestamp INTEGER,
            location_id TEXT,
            sale_number TEXT,
            transaction_data BLOB,
            status TEXT,
            retry_count INTEGER,
            last_error TEXT
        )
    "#;

    if let Err(e) = sqlx::query(create_table_query).execute(&pool).await {
        error!("[SalesStore] Failed to create queued_sales table: {}", e);
        return;
    }

    // 2. One-Time Migration from old flat file to SQLite
    let _ = migrate_legacy_file_to_db(app, &pool).await;
}

async fn migrate_legacy_file_to_db(app: &AppHandle, pool: &sqlx::SqlitePool) -> Result<()> {
    let app_dir = app.path().app_data_dir().context("No App Data Dir")?;
    let path = app_dir.join(SALES_FILENAME);

    if !path.exists() {
        return Ok(()); // Nothing to migrate
    }

    info!("[SalesStore] Found legacy secure_sales_queue.bin. Starting migration to SQLite...");

    let file_bytes = tokio::fs::read(&path).await?;
    if file_bytes.len() < 12 {
        let _ = tokio::fs::remove_file(&path).await;
        return Ok(());
    }

    let (nonce_slice, ciphertext) = file_bytes.split_at(12);
    let mut nonce_arr = [0u8; 12];
    nonce_arr.copy_from_slice(nonce_slice);
    let nonce = Nonce::from(nonce_arr);

    let secure_key_res = crate::security::get_or_create_key("sales_queue_key");
    let mut plaintext_opt = None;

    if let Ok(key) = secure_key_res {
        let cipher = Aes256Gcm::new(&key.into());
        plaintext_opt = cipher.decrypt(&nonce, ciphertext).ok();
    }

    if plaintext_opt.is_none() {
        let legacy_key = get_legacy_key();
        let legacy_cipher = Aes256Gcm::new(&legacy_key.into());
        plaintext_opt = legacy_cipher.decrypt(&nonce, ciphertext).ok();
    }

    if let Some(plaintext) = plaintext_opt {
        if let Ok(queue) = serde_json::from_slice::<Vec<QueuedSale>>(&plaintext) {
            for sale in queue {
                let sale_number = sale.transaction_data.get("saleNumber").and_then(|v| v.as_str()).unwrap_or("UNKNOWN").to_string();
                let encrypted_payload = encrypt_payload(app, &sale.transaction_data).await.unwrap_or_default();
                
                let status_str = format!("{:?}", sale.status);

                let _ = sqlx::query(
                    "INSERT OR IGNORE INTO queued_sales (id, timestamp, location_id, sale_number, transaction_data, status, retry_count, last_error) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)"
                )
                .bind(&sale.id)
                .bind(sale.timestamp as i64)
                .bind(&sale.location_id)
                .bind(sale_number)
                .bind(encrypted_payload)
                .bind(status_str)
                .bind(sale.retry_count)
                .bind(sale.last_error)
                .execute(pool)
                .await;
            }
            info!("[SalesStore] Migration complete. Deleting legacy file.");
            let _ = tokio::fs::remove_file(&path).await;
        }
    } else {
        error!("[SalesStore] Could not decrypt legacy file during migration.");
    }

    Ok(())
}

// --- Public Methods ---

pub async fn process_sale(
    app: AppHandle,
    _state: &SalesState,
    product_state: &crate::product_store::ProductState,
    shift_state: &ShiftState,
    sale_id: String,
    payload: serde_json::Value,
    auth_state: &AuthState,
) -> Result<SaleResponse> {
    let (_base_url, location_id, _device_key, _allow_negative_stock) = {
        let config_guard = auth_state
            .device_config
            .lock()
            .map_err(|_| anyhow::anyhow!("Lock error"))?;
        let config = config_guard
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("Device not configured"))?;
        (
            config.base_url.clone(),
            config.location_id.clone(),
            config.device_key.clone(),
            config.allow_negative_stock,
        )
    };

    let payment_method = payload
        .get("paymentMethod")
        .and_then(|v| v.as_str())
        .unwrap_or("UNKNOWN")
        .to_uppercase();

    let is_interactive_payment = ["MPESA", "PAYBILL", "TILL"].contains(&payment_method.as_str());

    if payment_method == "CASH" {
        if let Some(total) = payload.get("total").and_then(|v| v.as_f64()) {
            if !cfg!(feature = "standalone") {
                if let Err(e) = crate::shift_store::record_cash_sale(&app, shift_state, total).await {
                    error!("[SalesStore] Failed to record cash sale in shift: {}", e);
                } else {
                    info!("[SalesStore] Recorded cash sale of {:.2}", total);
                }
            } else {
                info!("[SalesStore] Standalone Mode: Bypassing shift cash recording for amount {:.2}", total);
            }
        }
    }

    if let Some(cart_items) = payload.get("cartItems").and_then(|v| v.as_array()) {
        if let Err(e) = crate::product_store::deduct_stock(
            app.clone(),
            product_state,
            &location_id,
            cart_items,
            _allow_negative_stock,
        )
        .await
        {
            error!("[SalesStore] Stock validation failed: {}", e);
            return Err(SalesError::ValidationError(e.to_string()).into());
        }
    }

    if is_interactive_payment {
        info!("[SalesStore] Attempting immediate sync for interactive payment: {}", payment_method);
        match push_single_sale(auth_state, &location_id, &payload).await {
            Ok(server_resp) => {
                return Ok(SaleResponse {
                    success: true,
                    message: "Transaction initiated successfully.".into(),
                    server_response: Some(server_resp),
                });
            }
            Err(e) => {
                error!("[SalesStore] Immediate sync failed for {}: {}", payment_method, e);
                return Err(SalesError::PaymentProcessingError(format!(
                    "{} requires an active internet connection. Please check your network or switch to Cash.", 
                    payment_method
                )).into());
            }
        }
    }

    // Strategy B: Row-Level Database Insertion
    let pool = get_db_pool(&app, MAIN_DB_NAME)
        .await
        .map_err(SalesError::StorageError)?;

    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)?
        .as_millis() as i64;

    let sale_number = payload.get("saleNumber").and_then(|v| v.as_str()).unwrap_or("UNKNOWN").to_string();
    let encrypted_payload = encrypt_payload(&app, &payload).await?;

    let insert_query = r#"
        INSERT INTO queued_sales (id, timestamp, location_id, sale_number, transaction_data, status, retry_count, last_error)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
    "#;

    sqlx::query(insert_query)
        .bind(&sale_id)
        .bind(timestamp)
        .bind(&location_id)
        .bind(&sale_number)
        .bind(&encrypted_payload)
        .bind(format!("{:?}", if cfg!(feature = "standalone") { SaleStatus::PendingCloudSync } else { SaleStatus::Pending }))
        .bind(0)
        .bind(None::<String>)
        .execute(&pool)
        .await
        .map_err(|e| SalesError::StorageError(e.to_string()))?;

    if cfg!(feature = "standalone") {
        return Ok(SaleResponse {
            success: true,
            message: "Sale completed successfully.".into(),
            server_response: None,
        });
    }

    // Spawn Background Sync Task
    let app_handle = app.clone();
    let sale_id_clone = sale_id.clone();
    let payload_clone = payload.clone();

    tauri::async_runtime::spawn(async move {
        info!("[Background] Starting sync for sale: {}", sale_id_clone);
        let auth_state = app_handle.state::<AuthState>();

        match push_single_sale(&auth_state, &location_id, &payload_clone).await {
            Ok(_) => {
                info!("[Background] Sale {} synced successfully.", sale_id_clone);
                let _ = sqlx::query("DELETE FROM queued_sales WHERE id = ?1")
                    .bind(&sale_id_clone)
                    .execute(&pool)
                    .await;
            }
            Err(e) => {
                warn!("[Background] Sync failed for {}: {}. Leaving in DB.", sale_id_clone, e);
                let _ = sqlx::query("UPDATE queued_sales SET retry_count = retry_count + 1, last_error = ?1 WHERE id = ?2")
                    .bind(e.to_string())
                    .bind(&sale_id_clone)
                    .execute(&pool)
                    .await;
            }
        }
    });

    Ok(SaleResponse {
        success: true,
        message: "Sale saved locally. Syncing in background.".into(),
        server_response: None,
    })
}

pub async fn sync_pending_sales(
    app: AppHandle,
    _state: &SalesState,
    auth_state: &AuthState,
) -> Result<usize> {
    let has_config = auth_state.device_config.lock().is_ok_and(|c| c.is_some());
    if !has_config {
        return Ok(0);
    }

    let pool = get_db_pool(&app, MAIN_DB_NAME).await.map_err(|e| anyhow::anyhow!(e))?;

    let rows = sqlx::query("SELECT id, location_id, transaction_data, retry_count FROM queued_sales WHERE status != 'Failed' AND retry_count < 20 LIMIT 50")
        .fetch_all(&pool)
        .await?;

    if rows.is_empty() {
        return Ok(0);
    }

    info!("[Sync] Found {} pending sales to sync...", rows.len());
    let mut success_count = 0;

    for row in rows {
        let id: String = row.get("id");
        let location_id: String = row.get("location_id");
        let encrypted_data: Vec<u8> = row.get("transaction_data");
        let retry_count: i32 = row.get("retry_count");

        if retry_count > 5 {
            tokio::time::sleep(Duration::from_millis(100 * (retry_count as u64))).await;
        }

        let payload = match decrypt_payload(&app, &encrypted_data).await {
            Ok(p) => p,
            Err(e) => {
                error!("[Sync] Failed to decrypt payload for {}: {}", id, e);
                continue;
            }
        };

        match push_single_sale(auth_state, &location_id, &payload).await {
            Ok(_) => {
                let _ = sqlx::query("DELETE FROM queued_sales WHERE id = ?1")
                    .bind(&id)
                    .execute(&pool)
                    .await;
                success_count += 1;
            }
            Err(e) => {
                if let Some(SalesError::ValidationError(_)) = e.downcast_ref::<SalesError>() {
                    error!("[Sync] Fatal validation error for {}. Marking FAILED.", id);
                    let _ = sqlx::query("UPDATE queued_sales SET status = 'Failed', last_error = ?1 WHERE id = ?2")
                        .bind(format!("Fatal: {}", e))
                        .bind(&id)
                        .execute(&pool)
                        .await;
                } else {
                    warn!("[Sync] Transient error for {}: {}", id, e);
                    let _ = sqlx::query("UPDATE queued_sales SET retry_count = retry_count + 1, last_error = ?1 WHERE id = ?2")
                        .bind(e.to_string())
                        .bind(&id)
                        .execute(&pool)
                        .await;
                }
            }
        }
    }

    Ok(success_count)
}

async fn push_single_sale(
    auth_state: &AuthState,
    location_id: &str,
    payload: &serde_json::Value,
) -> Result<serde_json::Value> {
    let encoded_loc = urlencoding::encode(location_id);
    let url_path = format!(
        "{}?locationId={}&enableStockTracking=true",
        crate::api_config::routes::SALE_PROCESS,
        encoded_loc
    );

    let req = auth_state
        .build_request(reqwest::Method::POST, &url_path)
        .map_err(SalesError::AuthError)?
        .json(payload);

    let resp = req
        .timeout(Duration::from_secs(45))
        .send()
        .await
        .map_err(|e| SalesError::NetworkError(e.to_string()))?;

    let status = resp.status();

    if status.is_success() {
        let body: serde_json::Value = resp
            .json()
            .await
            .map_err(|e| SalesError::NetworkError(format!("Invalid JSON: {}", e)))?;
        return Ok(body);
    }

    let error_body = resp.text().await.unwrap_or_default();

    match status {
        StatusCode::BAD_REQUEST | StatusCode::UNPROCESSABLE_ENTITY => {
            Err(SalesError::ValidationError(format!("{} - {}", status, error_body)).into())
        }
        StatusCode::UNAUTHORIZED | StatusCode::FORBIDDEN => {
            Err(SalesError::AuthError(format!("{} - {}", status, error_body)).into())
        }
        _ => Err(SalesError::NetworkError(format!("Server Error {}: {}", status, error_body)).into()),
    }
}

// --- Queue Management Commands ---

pub async fn get_queue_status(app: AppHandle, _state: &SalesState) -> Vec<QueuedSale> {
    let pool = match get_db_pool(&app, MAIN_DB_NAME).await {
        Ok(p) => p,
        Err(_) => return Vec::new(),
    };

    let rows = sqlx::query("SELECT * FROM queued_sales").fetch_all(&pool).await.unwrap_or_default();
    let mut queue = Vec::new();

    for row in rows {
        let encrypted_data: Vec<u8> = row.get("transaction_data");
        let transaction_data = decrypt_payload(&app, &encrypted_data).await.unwrap_or_default();
        
        let status_str: String = row.get("status");
        let status = match status_str.as_str() {
            "Pending" => SaleStatus::Pending,
            "Failed" => SaleStatus::Failed,
            "Invalidated" => SaleStatus::Invalidated,
            "PendingCloudSync" => SaleStatus::PendingCloudSync,
            _ => SaleStatus::Synced,
        };

        queue.push(QueuedSale {
            id: row.get("id"),
            timestamp: row.get::<i64, _>("timestamp") as u64,
            location_id: row.get("location_id"),
            transaction_data,
            status,
            retry_count: row.get::<i32, _>("retry_count") as u32,
            last_error: row.get("last_error"),
        });
    }

    queue
}

pub async fn retry_single_sale(
    app: AppHandle,
    _state: &SalesState,
    auth_state: &AuthState,
    sale_id: String,
) -> Result<bool> {
    let pool = get_db_pool(&app, MAIN_DB_NAME).await.map_err(|e| anyhow::anyhow!(e))?;

    let row = sqlx::query("SELECT location_id, transaction_data FROM queued_sales WHERE id = ?1")
        .bind(&sale_id)
        .fetch_optional(&pool)
        .await?;

    if let Some(row) = row {
        let location_id: String = row.get("location_id");
        let encrypted_data: Vec<u8> = row.get("transaction_data");
        let payload = decrypt_payload(&app, &encrypted_data).await?;

        match push_single_sale(auth_state, &location_id, &payload).await {
            Ok(_) => {
                info!("[SalesStore] Sale {} retried successfully.", sale_id);
                let _ = sqlx::query("DELETE FROM queued_sales WHERE id = ?1").bind(&sale_id).execute(&pool).await;
                Ok(true)
            }
            Err(e) => {
                warn!("[SalesStore] Retry failed for {}: {}", sale_id, e);
                let _ = sqlx::query(
                    "UPDATE queued_sales SET retry_count = retry_count + 1, last_error = ?1, status = CASE WHEN retry_count >= 10 THEN 'Failed' ELSE status END WHERE id = ?2"
                )
                .bind(e.to_string())
                .bind(&sale_id)
                .execute(&pool)
                .await;
                Err(e)
            }
        }
    } else {
        Err(anyhow::anyhow!("Sale not found"))
    }
}

pub async fn check_old_pending_sales(app: AppHandle, _state: &SalesState, days_threshold: u64) -> Vec<QueuedSale> {
    let pool = match get_db_pool(&app, MAIN_DB_NAME).await {
        Ok(p) => p,
        Err(_) => return Vec::new(),
    };

    let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis() as i64;
    let threshold_ms = (days_threshold * 24 * 60 * 60 * 1000) as i64;
    let cutoff = now - threshold_ms;

    let rows = sqlx::query("SELECT id FROM queued_sales WHERE status != 'Synced' AND timestamp < ?1")
        .bind(cutoff)
        .fetch_all(&pool)
        .await
        .unwrap_or_default();

    // Reusing get_queue_status isn't fully optimal, but suffices for occasional checks
    // You could map `rows` fully here if desired.
    get_queue_status(app, _state).await.into_iter().filter(|s| rows.iter().any(|r| r.get::<String, _>("id") == s.id)).collect()
}

pub async fn check_failed_sales(app: AppHandle, _state: &SalesState, retry_threshold: u32) -> Vec<QueuedSale> {
    get_queue_status(app, _state).await.into_iter().filter(|s| s.retry_count >= retry_threshold).collect()
}

pub async fn delete_sale(app: &AppHandle, _state: &SalesState, sale_id: String) -> Result<bool> {
    let pool = get_db_pool(app, MAIN_DB_NAME).await.map_err(|e| anyhow::anyhow!(e))?;
    let result = sqlx::query("DELETE FROM queued_sales WHERE id = ?1")
        .bind(&sale_id)
        .execute(&pool)
        .await?;

    if result.rows_affected() > 0 {
        info!("[SalesStore] Sale {} deleted from DB.", sale_id);
        Ok(true)
    } else {
        Ok(false)
    }
}

pub async fn search_local(app: AppHandle, _state: &SalesState, query: String) -> Vec<QueuedSale> {
    let pool = match get_db_pool(&app, MAIN_DB_NAME).await {
        Ok(p) => p,
        Err(_) => return Vec::new(),
    };

    let lower_query = format!("%{}%", query.to_lowercase());
    
    // This is where extracting sale_number pays off—we don't need to decrypt the DB to search!
    let rows = sqlx::query("SELECT id FROM queued_sales WHERE LOWER(id) LIKE ?1 OR LOWER(sale_number) LIKE ?1")
        .bind(&lower_query)
        .fetch_all(&pool)
        .await
        .unwrap_or_default();

    let matched_ids: Vec<String> = rows.into_iter().map(|r| r.get("id")).collect();

    get_queue_status(app, _state).await.into_iter().filter(|s| matched_ids.contains(&s.id)).collect()
}

pub async fn invalidate_sale(
    app: &AppHandle,
    _state: &SalesState,
    sale_id: String,
    reason: String,
) -> Result<bool> {
    let pool = get_db_pool(app, MAIN_DB_NAME).await.map_err(|e| anyhow::anyhow!(e))?;
    
    let result = sqlx::query("UPDATE queued_sales SET status = 'Invalidated', last_error = ?1 WHERE id = ?2")
        .bind(format!("Voided locally: {}", reason))
        .bind(&sale_id)
        .execute(&pool)
        .await?;

    if result.rows_affected() > 0 {
        info!("[SalesStore] Sale {} invalidated.", sale_id);
        Ok(true)
    } else {
        Err(anyhow::anyhow!("Sale not found in local DB"))
    }
}

#[tauri::command]
pub async fn invalidate_sale_command(
    app: AppHandle,
    state: State<'_, SalesState>,
    sale_id: String,
    reason: String,
) -> Result<bool, String> {
    invalidate_sale(&app, &state, sale_id, reason).await.map_err(|e| e.to_string())
}

// --- Network / API Commands ---

#[tauri::command]
pub async fn get_sales_history_command(
    auth_state: State<'_, AuthState>,
    location_id: Option<String>,
) -> Result<Vec<serde_json::Value>, String> {
    let mut url_path = crate::api_config::routes::SALE_BASE.to_string();
    if let Some(loc_id) = location_id {
        let encoded_loc = urlencoding::encode(&loc_id);
        url_path = format!("{}?locationId={}", url_path, encoded_loc);
    }

    let res = auth_state.build_request(reqwest::Method::GET, &url_path)?.send().await.map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        return Err(format!("Failed to fetch sales history: {}", res.status()));
    }

    res.json().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn record_payment_command(
    auth_state: State<'_, AuthState>,
    payload: serde_json::Value,
) -> Result<serde_json::Value, String> {
    let url_path = crate::api_config::routes::SALE_PAYMENTS.to_string();
    let res = auth_state.build_request(reqwest::Method::POST, &url_path)?.json(&payload).send().await.map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        return Err(format!("Payment recording failed: {} - {}", res.status(), res.text().await.unwrap_or_default()));
    }

    res.json().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn initiate_mpesa_payment_command(
    auth_state: State<'_, AuthState>,
    phone_number: String,
    amount: f64,
    sale_number: String,
) -> Result<serde_json::Value, String> {
    let url_path = crate::api_config::routes::MPESA_INITIATE.to_string();
    let payload = serde_json::json!({ "phoneNumber": phone_number, "amount": amount, "saleNumber": sale_number });

    let res = auth_state.build_request(reqwest::Method::POST, &url_path)?.json(&payload).send().await.map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        return Err(format!("M-Pesa initiation failed: {} - {}", res.status(), res.text().await.unwrap_or_default()));
    }

    res.json().await.map_err(|e| e.to_string())
}

pub async fn scan_transaction_qr(auth_state: &AuthState, qr_code: String) -> Result<serde_json::Value> {
    let url_path = crate::api_config::routes::TRANSACTION_SCAN.to_string();
    let req = auth_state.build_request(reqwest::Method::POST, &url_path).map_err(SalesError::AuthError)?;
    let payload = serde_json::json!({ "code": qr_code });

    let resp = req.json(&payload).timeout(Duration::from_secs(30)).send().await.map_err(|e| SalesError::NetworkError(e.to_string()))?;

    if resp.status().is_success() {
        return resp.json().await.map_err(|e| SalesError::NetworkError(format!("Invalid JSON: {}", e)).into());
    }

    Err(SalesError::NetworkError(format!("Server Error {}: {}", resp.status(), resp.text().await.unwrap_or_default())).into())
}

pub async fn create_order(
    auth_state: &AuthState,
    location_id: String,
    order_payload: serde_json::Value,
) -> Result<serde_json::Value> {
    let encoded_loc = urlencoding::encode(&location_id);
    let url_path = format!("{}?locationId={}", crate::api_config::routes::ORDERS, encoded_loc);

    let req = auth_state.build_request(reqwest::Method::POST, &url_path).map_err(SalesError::AuthError)?;
    let resp = req.json(&order_payload).timeout(Duration::from_secs(30)).send().await.map_err(|e| SalesError::NetworkError(e.to_string()))?;

    let status = resp.status();
    if status.is_success() {
        return resp.json().await.map_err(|e| SalesError::NetworkError(format!("Invalid JSON: {}", e)).into());
    }

    let error_body = resp.text().await.unwrap_or_default();
    match status {
        StatusCode::BAD_REQUEST | StatusCode::UNPROCESSABLE_ENTITY => Err(SalesError::ValidationError(format!("{} - {}", status, error_body)).into()),
        StatusCode::UNAUTHORIZED | StatusCode::FORBIDDEN => Err(SalesError::AuthError(format!("{} - {}", status, error_body)).into()),
        _ => Err(SalesError::NetworkError(format!("Server Error {}: {}", status, error_body)).into()),
    }
}

// --- Sync Config ---

pub struct SyncConfigState {
    pub interval: Arc<RwLock<Duration>>,
}

impl SyncConfigState {
    pub fn new() -> Self {
        Self { interval: Arc::new(RwLock::new(Duration::from_secs(5 * 60))) }
    }
}

impl Default for SyncConfigState {
    fn default() -> Self {
        Self::new()
    }
}

#[tauri::command]
pub async fn set_sync_interval_command(state: State<'_, SyncConfigState>, minutes: u64) -> Result<String, String> {
    if minutes < 1 {
        return Err("Interval must be at least 1 minute".into());
    }
    let mut interval = state.interval.write().await;
    *interval = Duration::from_secs(minutes * 60);
    info!("Background sales sync interval updated to {} minutes", minutes);
    Ok(format!("Sync interval updated to {} minutes", minutes))
}

pub fn start_auto_sync_task(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        let mut last_sync = Instant::now();
        loop {
            sleep(Duration::from_secs(10)).await;
            let interval = {
                let state = app.state::<SyncConfigState>();
                let val = *state.interval.read().await; 
                val // Return the copied value so the borrow drops
            };

            if last_sync.elapsed() >= interval {
                let sales_state = app.state::<SalesState>();
                let auth_state = app.state::<AuthState>();

                match sync_pending_sales(app.clone(), &sales_state, &auth_state).await {
                    Ok(_) => info!("[AutoSync] Sync successful."),
                    Err(e) => error!("[AutoSync] Failed to sync sales: {}", e),
                }
                last_sync = Instant::now();
            }
        }
    });
}

// --- KDS SQLite Storage Logic ---

#[cfg(all(not(feature = "standalone"), any(feature = "restaurant", feature = "pharmacy")))]
pub async fn get_active_kds_orders(app: &AppHandle) -> Vec<KdsOrderPayload> {
    let pool = match get_db_pool(app, KDS_DB_NAME).await {
        Ok(p) => p,
        Err(e) => {
            error!("[SalesStore] Failed to get KDS DB pool: {}", e);
            return Vec::new();
        }
    };

    let query = "SELECT order_id, num, order_type, station, table_name, status, created_at, bumped_at, items, note, server, covers FROM kds_orders WHERE status != 'COMPLETED'";
    let rows = match sqlx::query(query).fetch_all(&pool).await {
        Ok(r) => r,
        Err(e) => {
            error!("[SalesStore] Failed to query active KDS orders: {}", e);
            return Vec::new();
        }
    };

    let mut orders = Vec::new();
    for row in rows {
        let items_json: String = row.get("items");
        let items: Vec<OrderItem> = serde_json::from_str(&items_json).unwrap_or_default();

        orders.push(KdsOrderPayload {
            id: row.get("order_id"),
            num: row.get("num"),
            order_type: row.get("order_type"),
            station: row.get("station"),
            table: row.get("table_name"),
            status: row.get("status"),
            created_at: row.get("created_at"),
            bumped_at: row.get("bumped_at"),
            items,
            note: row.get("note"),
            server: row.get("server"),
            covers: row.get("covers"),
        });
    }

    orders
}

#[cfg(all(not(feature = "standalone"), any(feature = "restaurant", feature = "pharmacy")))]
pub async fn save_local_kds_order(app: &AppHandle, order: &KdsOrderPayload) {
    let pool = match get_db_pool(app, KDS_DB_NAME).await {
        Ok(p) => p,
        Err(e) => {
            error!("[SalesStore] Failed to get KDS DB pool: {}", e);
            return;
        }
    };

    let items_json = match serde_json::to_string(&order.items) {
        Ok(j) => j,
        Err(e) => {
            error!("[SalesStore] Failed to serialize KDS order items: {}", e);
            return;
        }
    };

    let query = r#"
        INSERT INTO kds_orders (order_id, num, order_type, station, table_name, status, created_at, bumped_at, items, note, server, covers)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)
        ON CONFLICT(order_id) DO UPDATE SET
            num = excluded.num,
            order_type = excluded.order_type,
            station = excluded.station,
            table_name = excluded.table_name,
            status = excluded.status,
            created_at = excluded.created_at,
            bumped_at = excluded.bumped_at,
            items = excluded.items,
            note = excluded.note,
            server = excluded.server,
            covers = excluded.covers
    "#;

    if let Err(e) = sqlx::query(query)
        .bind(&order.id)
        .bind(&order.num)
        .bind(&order.order_type)
        .bind(&order.station)
        .bind(&order.table)
        .bind(&order.status)
        .bind(order.created_at)
        .bind(order.bumped_at)
        .bind(&items_json)
        .bind(&order.note)
        .bind(&order.server)
        .bind(order.covers)
        .execute(&pool)
        .await
    {
        error!("[SalesStore] Failed to save KDS order to SQLite: {}", e);
    } else {
        info!("[SalesStore] KDS Order {} saved to SQLite.", order.id);
    }
}

#[cfg(all(not(feature = "standalone"), any(feature = "restaurant", feature = "pharmacy")))]
pub async fn update_kds_order_status(app: &AppHandle, order_id: &str, new_status: &str) {
    let pool = match get_db_pool(app, KDS_DB_NAME).await {
        Ok(p) => p,
        Err(e) => {
            error!("[SalesStore] Failed to get KDS DB pool: {}", e);
            return;
        }
    };

    let query = "UPDATE kds_orders SET status = ?1 WHERE order_id = ?2";

    match sqlx::query(query).bind(new_status).bind(order_id).execute(&pool).await {
        Ok(result) => {
            if result.rows_affected() > 0 {
                info!("[SalesStore] KDS Order {} status updated to {}.", order_id, new_status);
            } else {
                warn!("[SalesStore] Attempted to update KDS order {}, but it was not found.", order_id);
            }
        }
        Err(e) => error!("[SalesStore] Failed to update KDS order status: {}", e),
    }
}