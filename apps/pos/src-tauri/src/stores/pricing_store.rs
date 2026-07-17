use crate::models::{ClientPriceList, ClientPriceListItem, PosPricingData};
use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use anyhow::Result;
use chrono::Utc;
use log::{error, info};
use reqwest::header::{HeaderMap, HeaderValue};
use sha2::{Digest, Sha256};
use sqlx::{Row, SqlitePool};
use std::collections::{HashMap};
use std::sync::OnceLock;
use tauri::{AppHandle, Manager};
use tauri_plugin_sql::{DbInstances, DbPool};

const PRICING_FILENAME: &str = "secure_pricing.bin";
const MAIN_DB_NAME: &str = "sqlite:pos_main.db";
const TIMEOUT_SECONDS: u64 = 30;

static LEGACY_SECRET: OnceLock<String> = OnceLock::new();

fn get_legacy_secret() -> &'static str {
    LEGACY_SECRET.get_or_init(|| {
        std::env::var("LEGACY_APP_SECRET")
            .unwrap_or_else(|_| "dealio-pos-secure-storage-salt".to_string())
    })
}

// --- State Management ---
pub struct PricingState;

impl Default for PricingState {
    fn default() -> Self {
        Self::new()
    }
}

impl PricingState {
    pub fn new() -> Self {
        Self
    }
}

// --- DB Helper ---
async fn get_db_pool(app: &AppHandle) -> Result<SqlitePool, String> {
    let instances = app.state::<DbInstances>();
    let guard = instances.0.read().await;

    let db_name = if cfg!(feature = "standalone") {
        "sqlite:pos_standalone.db"
    } else {
        MAIN_DB_NAME
    };

    if let Some(DbPool::Sqlite(pool)) = guard.get(db_name) {
        Ok(pool.clone())
    } else {
        Err(format!("Database {} not found.", db_name))
    }
}

// --- Encryption Helpers ---
fn get_legacy_key() -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(get_legacy_secret().as_bytes());
    hasher.finalize().into()
}

// --- Initialization & Migration ---
pub async fn init_state(app: &AppHandle) {
    let pool = match get_db_pool(app).await {
        Ok(p) => p,
        Err(e) => {
            error!("[PricingStore] Failed to get main DB pool: {}", e);
            return;
        }
    };

    let create_price_lists = r#"
        CREATE TABLE IF NOT EXISTS price_lists (
            id TEXT PRIMARY KEY,
            code TEXT,
            priority INTEGER,
            is_global BOOLEAN,
            is_active BOOLEAN,
            valid_from TEXT,
            valid_to TEXT,
            updated_at TEXT
        )
    "#;

    let create_price_items = r#"
        CREATE TABLE IF NOT EXISTS price_items (
            id TEXT PRIMARY KEY,
            price_list_id TEXT,
            variant_id TEXT,
            selling_unit_id TEXT,
            min_quantity INTEGER,
            price TEXT,
            updated_at TEXT
        )
    "#;

    let create_allocations = r#"
        CREATE TABLE IF NOT EXISTS customer_allocations (
            customer_id TEXT,
            price_list_id TEXT,
            PRIMARY KEY (customer_id, price_list_id)
        )
    "#;

    let create_sync_meta = r#"
        CREATE TABLE IF NOT EXISTS pricing_sync_meta (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            last_sync TEXT
        )
    "#;

    let _ = sqlx::query(create_price_lists).execute(&pool).await;
    let _ = sqlx::query(create_price_items).execute(&pool).await;
    let _ = sqlx::query(create_allocations).execute(&pool).await;
    let _ = sqlx::query(create_sync_meta).execute(&pool).await;

    let _ = migrate_legacy_file_to_db(app, &pool).await;
}

async fn migrate_legacy_file_to_db(app: &AppHandle, pool: &SqlitePool) -> Result<()> {
    let app_dir = app.path().app_data_dir().map_err(|e| anyhow::anyhow!(e))?;
    let path = app_dir.join(PRICING_FILENAME);

    if !path.exists() { return Ok(()); }

    info!("[PricingStore] Migrating legacy pricing data...");
    let file_bytes = tokio::fs::read(&path).await.map_err(|e| anyhow::anyhow!(e))?;
    if file_bytes.len() < 12 {
        let _ = tokio::fs::remove_file(&path).await;
        return Ok(());
    }

    let (nonce_slice, ciphertext) = file_bytes.split_at(12);
    let mut nonce_arr = [0u8; 12];
    nonce_arr.copy_from_slice(nonce_slice);
    let nonce = Nonce::from(nonce_arr);

    let mut plaintext_opt = None;
    if let Ok(key) = crate::security::get_or_create_key("pricing_store_key") {
        let cipher = Aes256Gcm::new(&key.into());
        plaintext_opt = cipher.decrypt(&nonce, ciphertext).ok();
    }

    if plaintext_opt.is_none() {
        let legacy_key = get_legacy_key();
        let cipher = Aes256Gcm::new(&legacy_key.into());
        plaintext_opt = cipher.decrypt(&nonce, ciphertext).ok();
    }

    if let Some(plaintext) = plaintext_opt {
        if let Ok((last_sync, data)) = serde_json::from_slice::<(Option<String>, PosPricingData)>(&plaintext) {
            save_data_to_db(pool, data, last_sync).await?;
            info!("[PricingStore] Migration complete. Deleting legacy file.");
            let _ = tokio::fs::remove_file(&path).await;
        }
    }
    Ok(())
}

async fn save_data_to_db(pool: &SqlitePool, data: PosPricingData, last_sync: Option<String>) -> Result<()> {
    let mut tx = pool.begin().await.map_err(|e| anyhow::anyhow!(e))?;

    for list in data.lists {
        sqlx::query("INSERT OR REPLACE INTO price_lists (id, code, priority, is_global, is_active, valid_from, valid_to, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)")
            .bind(list.id).bind(list.code).bind(list.priority).bind(list.is_global).bind(list.is_active).bind(list.valid_from).bind(list.valid_to).bind(list.updated_at)
            .execute(&mut *tx).await.map_err(|e| anyhow::anyhow!(e))?;
    }

    for item in data.items {
        sqlx::query("INSERT OR REPLACE INTO price_items (id, price_list_id, variant_id, selling_unit_id, min_quantity, price, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)")
            .bind(item.id).bind(item.price_list_id).bind(item.variant_id).bind(item.selling_unit_id).bind(item.min_quantity).bind(item.price).bind(item.updated_at)
            .execute(&mut *tx).await.map_err(|e| anyhow::anyhow!(e))?;
    }

    for (cust_id, lists) in data.allocations {
        for list_id in lists {
            sqlx::query("INSERT OR IGNORE INTO customer_allocations (customer_id, price_list_id) VALUES (?1, ?2)")
                .bind(&cust_id).bind(&list_id)
                .execute(&mut *tx).await.map_err(|e| anyhow::anyhow!(e))?;
        }
    }

    if let Some(ts) = last_sync {
        sqlx::query("INSERT OR REPLACE INTO pricing_sync_meta (id, last_sync) VALUES (1, ?1)")
            .bind(ts).execute(&mut *tx).await.map_err(|e| anyhow::anyhow!(e))?;
    }

    tx.commit().await.map_err(|e| anyhow::anyhow!(e))?;
    Ok(())
}

pub async fn load_pricing_from_disk(_app: &AppHandle, _state: &PricingState) -> Result<()> {
    Ok(())
}

// --- Sync Engine ---
use crate::auth_store::AuthState;

pub async fn run_sync(
    app: AppHandle,
    _state: &PricingState,
    auth_state: &AuthState,
) -> Result<String> {
    let pool = get_db_pool(&app).await.map_err(|e| anyhow::anyhow!(e))?;

    let (base_url, device_key) = {
        let config_guard = auth_state.device_config.lock().map_err(|_| anyhow::anyhow!("Lock error"))?;
        let config = config_guard.as_ref().ok_or_else(|| anyhow::anyhow!("Device not configured"))?;
        (config.base_url.clone(), config.device_key.clone())
    };

    let member_token = auth_state.get_active_token().map_err(|e| anyhow::anyhow!(e))?;

    let last_sync: Option<String> = sqlx::query("SELECT last_sync FROM pricing_sync_meta WHERE id = 1")
        .fetch_optional(&pool).await.map_err(|e| anyhow::anyhow!(e))?.map(|r| r.get("last_sync"));

    let target_url = if last_sync.is_some() {
        format!("{}/{}", base_url.trim_end_matches('/'), crate::api_config::routes::PRICING_SYNC)
    } else {
        format!("{}/{}", base_url.trim_end_matches('/'), crate::api_config::routes::PRICING)
    };

    let mut headers = HeaderMap::new();
    headers.insert("X-API-KEY", HeaderValue::from_str(&device_key).map_err(|e| anyhow::anyhow!(e))?);
    if let Some(token) = member_token {
        headers.insert("X-MEMBER-TOKEN", HeaderValue::from_str(&token).map_err(|e| anyhow::anyhow!(e))?);
    }

    let client = reqwest::Client::builder().default_headers(headers).timeout(std::time::Duration::from_secs(TIMEOUT_SECONDS)).build().map_err(|e| anyhow::anyhow!(e))?;
    let mut query_params = vec![];
    if let Some(token) = &last_sync { query_params.push(("lastSync", token.clone())); }

    let response = client.get(&target_url).query(&query_params).send().await.map_err(|e| anyhow::anyhow!(e))?;
    if !response.status().is_success() {
        return Err(anyhow::anyhow!("Server returned error: {}", response.status()));
    }

    let res_body = response.json::<crate::models::ServerPricingResponse>().await.map_err(|e| anyhow::anyhow!(e))?;
    let metadata = res_body.metadata;
    let server_data = res_body.data;

    let mut tx = pool.begin().await.map_err(|e| anyhow::anyhow!(e))?;

    if !metadata.is_delta || metadata.temp_full_sync {
        sqlx::query("DELETE FROM price_lists").execute(&mut *tx).await.map_err(|e| anyhow::anyhow!(e))?;
        sqlx::query("DELETE FROM price_items").execute(&mut *tx).await.map_err(|e| anyhow::anyhow!(e))?;
        sqlx::query("DELETE FROM customer_allocations").execute(&mut *tx).await.map_err(|e| anyhow::anyhow!(e))?;
    }

    for list in server_data.lists {
        sqlx::query("INSERT OR REPLACE INTO price_lists (id, code, priority, is_global, is_active, valid_from, valid_to, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)")
            .bind(list.id).bind(list.code).bind(list.priority).bind(list.is_global).bind(list.is_active).bind(list.valid_from).bind(list.valid_to).bind(list.updated_at)
            .execute(&mut *tx).await.map_err(|e| anyhow::anyhow!(e))?;
    }

    for item in server_data.items {
        sqlx::query("INSERT OR REPLACE INTO price_items (id, price_list_id, variant_id, selling_unit_id, min_quantity, price, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)")
            .bind(item.id).bind(item.price_list_id).bind(item.variant_id).bind(item.selling_unit_id).bind(item.min_quantity).bind(item.price).bind(item.updated_at)
            .execute(&mut *tx).await.map_err(|e| anyhow::anyhow!(e))?;
    }

    if let Some(allocations) = server_data.customer_allocations {
        for (cust_id, lists) in allocations {
            for list_id in lists {
                sqlx::query("INSERT OR IGNORE INTO customer_allocations (customer_id, price_list_id) VALUES (?1, ?2)")
                    .bind(cust_id.clone()).bind(list_id)
                    .execute(&mut *tx).await.map_err(|e| anyhow::anyhow!(e))?;
            }
        }
    }

    for deleted_id in server_data.deleted_item_ids {
        sqlx::query("DELETE FROM price_items WHERE id = ?1").bind(deleted_id).execute(&mut *tx).await.map_err(|e| anyhow::anyhow!(e))?;
    }

    sqlx::query("INSERT OR REPLACE INTO pricing_sync_meta (id, last_sync) VALUES (1, ?1)")
        .bind(&metadata.synced_at).execute(&mut *tx).await.map_err(|e| anyhow::anyhow!(e))?;

    tx.commit().await.map_err(|e| anyhow::anyhow!(e))?;
    Ok(metadata.synced_at)
}

// --- Pricing Resolution Engine ---
pub async fn resolve_price(
    app: &AppHandle,
    _state: &PricingState,
    customer_id: Option<String>,
    variant_id: String,
    unit_id: Option<String>,
    is_base_unit: bool,
) -> Option<f64> {
    let pool = get_db_pool(app).await.ok()?;
    let now = Utc::now().to_rfc3339();

    // 1. Try Customer-Specific Lists First (Customer Preference)
    if let Some(cid) = customer_id.as_ref().filter(|id| !id.is_empty()) {
        let customer_query = r#"
            SELECT pl.* FROM price_lists pl
            JOIN customer_allocations ca ON ca.price_list_id = pl.id
            WHERE ca.customer_id = ?1 AND pl.is_active = 1
            ORDER BY pl.priority DESC
        "#;

        if let Ok(rows) = sqlx::query(customer_query).bind(cid).fetch_all(&pool).await {
            for row in rows {
                if let Some(price) = check_list_and_resolve(&pool, &row, &now, &variant_id, &unit_id, is_base_unit).await {
                    return Some(price);
                }
            }
        }
    }

    // 2. Try Global Lists (Organization-wide Promotions)
    let global_query = r#"
        SELECT * FROM price_lists
        WHERE is_global = 1 AND is_active = 1
        ORDER BY priority DESC
    "#;

    if let Ok(rows) = sqlx::query(global_query).fetch_all(&pool).await {
        for row in rows {
            if let Some(price) = check_list_and_resolve(&pool, &row, &now, &variant_id, &unit_id, is_base_unit).await {
                return Some(price);
            }
        }
    }

    None
}

async fn check_list_and_resolve(
    pool: &SqlitePool,
    row: &sqlx::sqlite::SqliteRow,
    now: &str,
    variant_id: &str,
    unit_id: &Option<String>,
    is_base_unit: bool,
) -> Option<f64> {
    let id: String = row.get("id");
    let valid_from: Option<String> = row.get("valid_from");
    let valid_to: Option<String> = row.get("valid_to");

    if let Some(from) = valid_from { if from.as_str() > now { return None; } }
    if let Some(to) = valid_to { if to.as_str() < now { return None; } }

    let item_query = "SELECT price FROM price_items WHERE price_list_id = ?1 AND variant_id = ?2 AND (selling_unit_id = ?3 OR (selling_unit_id IS NULL AND ?4 = 1))";
    if let Ok(Some(item_row)) = sqlx::query(item_query)
        .bind(&id)
        .bind(variant_id)
        .bind(unit_id)
        .bind(is_base_unit)
        .fetch_optional(pool).await {
        let price_str: String = item_row.get("price");
        return price_str.parse::<f64>().ok();
    }
    None
}

pub async fn get_all_pricing(app: &AppHandle, _state: &PricingState) -> PosPricingData {
    let pool = match get_db_pool(app).await {
        Ok(p) => p,
        Err(_) => return PosPricingData { lists: vec![], items: vec![], allocations: HashMap::new() },
    };

    let lists = sqlx::query("SELECT * FROM price_lists").fetch_all(&pool).await.unwrap_or_default().into_iter().map(|r| ClientPriceList {
        id: r.get("id"), code: r.get("code"), priority: r.get("priority"), is_global: r.get("is_global"), is_active: r.get("is_active"), valid_from: r.get("valid_from"), valid_to: r.get("valid_to"), updated_at: r.get("updated_at"),
    }).collect();

    let items = sqlx::query("SELECT * FROM price_items").fetch_all(&pool).await.unwrap_or_default().into_iter().map(|r| ClientPriceListItem {
        id: r.get("id"), price_list_id: r.get("price_list_id"), variant_id: r.get("variant_id"), selling_unit_id: r.get("selling_unit_id"), min_quantity: r.get("min_quantity"), price: r.get("price"), updated_at: r.get("updated_at"),
    }).collect();

    let mut allocations: HashMap<String, Vec<String>> = HashMap::new();
    if let Ok(rows) = sqlx::query("SELECT * FROM customer_allocations").fetch_all(&pool).await {
        for row in rows {
            allocations.entry(row.get("customer_id")).or_default().push(row.get("price_list_id"));
        }
    }

    PosPricingData { lists, items, allocations }
}

pub async fn delete_local_price_list(app: &AppHandle, _state: &PricingState, id: &str) -> Result<String> {
    let pool = get_db_pool(app).await.map_err(|e| anyhow::anyhow!(e))?;
    let mut tx = pool.begin().await?;

    // 1. Delete associated price items
    sqlx::query("DELETE FROM price_items WHERE price_list_id = ?1").bind(id).execute(&mut *tx).await?;

    // 2. Delete associated customer allocations
    sqlx::query("DELETE FROM customer_allocations WHERE price_list_id = ?1").bind(id).execute(&mut *tx).await?;

    // 3. Delete the price list itself
    sqlx::query("DELETE FROM price_lists WHERE id = ?1").bind(id).execute(&mut *tx).await?;

    tx.commit().await?;
    Ok(id.to_string())
}
