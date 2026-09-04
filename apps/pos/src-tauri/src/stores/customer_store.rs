use crate::models::PosCustomer;
use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Nonce,
};
use anyhow::Result;
use log::{error, info};
use rand::RngCore;
use sha2::{Digest, Sha256};
use sqlx::{Row, SqlitePool};
use std::sync::OnceLock;
use tauri::{AppHandle, Manager};
use tauri_plugin_sql::{DbInstances, DbPool};

const CUSTOMER_FILENAME: &str = "secure_customers.bin";
const MAIN_DB_NAME: &str = "sqlite:pos_main.db";

static LEGACY_SECRET: OnceLock<String> = OnceLock::new();

fn get_legacy_secret() -> &'static str {
    LEGACY_SECRET.get_or_init(|| {
        std::env::var("LEGACY_APP_SECRET")
            .unwrap_or_else(|_| "dealio-pos-secure-storage-salt".to_string())
    })
}

// --- State Management ---
pub struct CustomerState;

impl Default for CustomerState {
    fn default() -> Self {
        Self::new()
    }
}

impl CustomerState {
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

async fn encrypt_payload(payload: &PosCustomer) -> Result<Vec<u8>> {
    let json_data = serde_json::to_string(payload)?;

    let key = crate::security::get_or_create_key("customer_store_key")
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

async fn decrypt_payload(file_bytes: &[u8]) -> Result<PosCustomer> {
    if file_bytes.len() < 12 {
        return Err(anyhow::anyhow!("Payload too short"));
    }

    let (nonce_slice, ciphertext) = file_bytes.split_at(12);
    let mut nonce_arr = [0u8; 12];
    nonce_arr.copy_from_slice(nonce_slice);
    let nonce = Nonce::from(nonce_arr);

    // Try Secure Key
    if let Ok(key) = crate::security::get_or_create_key("customer_store_key") {
        let cipher = Aes256Gcm::new(&key.into());
        if let Ok(plaintext) = cipher.decrypt(&nonce, ciphertext) {
            return Ok(serde_json::from_slice(&plaintext)?);
        }
    }

    // Try Legacy Key
    let legacy_key = get_legacy_key();
    let cipher = Aes256Gcm::new(&legacy_key.into());
    let plaintext = cipher
        .decrypt(&nonce, ciphertext)
        .map_err(|_| anyhow::anyhow!("Decryption failed"))?;

    Ok(serde_json::from_slice(&plaintext)?)
}

// --- Initialization & Migration ---
pub async fn init_state(app: &AppHandle) {
    let pool = match get_db_pool(app).await {
        Ok(p) => p,
        Err(e) => {
            error!("[CustomerStore] Failed to get main DB pool: {}", e);
            return;
        }
    };

    let create_customers_table = r#"
        CREATE TABLE IF NOT EXISTS customers (
            id TEXT PRIMARY KEY,
            name TEXT,
            phone TEXT,
            email TEXT,
            search_text TEXT,
            payload BLOB
        )
    "#;

    let create_sync_table = r#"
        CREATE TABLE IF NOT EXISTS customer_sync_meta (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            last_sync TEXT
        )
    "#;

    let _ = sqlx::query(create_customers_table).execute(&pool).await;
    let _ = sqlx::query(create_sync_table).execute(&pool).await;

    let _ = migrate_legacy_file_to_db(app, &pool).await;
}

async fn migrate_legacy_file_to_db(app: &AppHandle, pool: &SqlitePool) -> Result<()> {
    let app_dir = app.path().app_data_dir().map_err(|e| anyhow::anyhow!(e))?;
    let path = app_dir.join(CUSTOMER_FILENAME);

    if !path.exists() {
        return Ok(());
    }

    info!("[CustomerStore] Found legacy secure_customers.bin. Migrating...");

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
    if let Ok(key) = crate::security::get_or_create_key("customer_store_key") {
        let cipher = Aes256Gcm::new(&key.into());
        plaintext_opt = cipher.decrypt(&nonce, ciphertext).ok();
    }

    if plaintext_opt.is_none() {
        let legacy_key = get_legacy_key();
        let cipher = Aes256Gcm::new(&legacy_key.into());
        plaintext_opt = cipher.decrypt(&nonce, ciphertext).ok();
    }

    if let Some(plaintext) = plaintext_opt {
        if let Ok((last_sync, customers)) = serde_json::from_slice::<(Option<String>, Vec<PosCustomer>)>(&plaintext) {
            let mut tx = pool.begin().await.map_err(|e| anyhow::anyhow!(e))?;
            for customer in customers {
                let search_text = build_search_text(&customer);
                let encrypted_payload = encrypt_payload(&customer).await?;

                let _ = sqlx::query(
                    "INSERT OR IGNORE INTO customers (id, name, phone, email, search_text, payload) VALUES (?1, ?2, ?3, ?4, ?5, ?6)"
                )
                .bind(&customer.id)
                .bind(&customer.name)
                .bind(&customer.phone)
                .bind(&customer.email)
                .bind(search_text)
                .bind(encrypted_payload)
                .execute(&mut *tx)
                .await.map_err(|e| anyhow::anyhow!(e))?;
            }

            if let Some(ts) = last_sync {
                let _ = sqlx::query("INSERT OR REPLACE INTO customer_sync_meta (id, last_sync) VALUES (1, ?1)")
                    .bind(ts)
                    .execute(&mut *tx)
                    .await.map_err(|e| anyhow::anyhow!(e))?;
            }
            tx.commit().await.map_err(|e| anyhow::anyhow!(e))?;
            info!("[CustomerStore] Migration complete. Deleting legacy file.");
            let _ = tokio::fs::remove_file(&path).await;
        }
    }

    Ok(())
}

fn build_search_text(c: &PosCustomer) -> String {
    let mut terms = vec![c.name.to_lowercase()];
    if let Some(p) = &c.phone {
        terms.push(p.to_lowercase());
    }
    if let Some(e) = &c.email {
        terms.push(e.to_lowercase());
    }
    if let Some(comp) = &c.company {
        terms.push(comp.to_lowercase());
    }
    if let Some(ip) = &c.insurance_provider {
        terms.push(ip.to_lowercase());
    }
    if let Some(pn) = &c.policy_number {
        terms.push(pn.to_lowercase());
    }
    terms.join(" ")
}

pub async fn load_customers_from_disk(_app: &AppHandle, _state: &CustomerState) -> Result<()> {
    // SQLite handles persistence
    Ok(())
}

// --- Sync Engine ---
use crate::auth_store::AuthState;

pub async fn run_sync(
    app: AppHandle,
    _state: &CustomerState,
    auth_state: &AuthState,
) -> Result<usize> {
    let pool = get_db_pool(&app).await.map_err(|e| anyhow::anyhow!(e))?;

    let last_sync: Option<String> = sqlx::query("SELECT last_sync FROM customer_sync_meta WHERE id = 1")
        .fetch_optional(&pool).await.map_err(|e| anyhow::anyhow!(e))?.map(|r| r.get("last_sync"));

    let request = auth_state.build_request(reqwest::Method::GET, crate::api_config::routes::CUSTOMERS)
        .map_err(|e| anyhow::anyhow!(e))?;

    let mut query_params = vec![];
    if let Some(ts) = &last_sync {
        query_params.push(("lastSync", ts.clone()));
    }

    let response = request.query(&query_params).send().await.map_err(|e| anyhow::anyhow!(e))?;
    if !response.status().is_success() {
        return Err(anyhow::anyhow!("Server returned error: {}", response.status()));
    }

    let raw_val: serde_json::Value = response.json().await.map_err(|e| anyhow::anyhow!(e))?;

    // StandardResponseInterceptor wraps response in { success: true, data: ..., timestamp: ... }
    // getCustomersDelta returns { data: [...], nextSyncToken: ... } inside that envelope.
    let unwrapped_data = if let Some(d) = raw_val.get("data") {
        d
    } else {
        &raw_val
    };

    let (customers_array, sync_token_from_resp) = if unwrapped_data.is_array() {
        (unwrapped_data, None)
    } else if let Some(arr) = unwrapped_data.get("data").and_then(|v| if v.is_array() { Some(v) } else { None }) {
        (arr, unwrapped_data.get("nextSyncToken").and_then(|t| t.as_str()))
    } else if let Some(arr) = raw_val.get("customers").and_then(|v| if v.is_array() { Some(v) } else { None }) {
        (arr, None)
    } else {
        (unwrapped_data, None)
    };

    let customers_list: Vec<PosCustomer> = serde_json::from_value(customers_array.clone())
        .unwrap_or_default();

    let incoming_count = customers_list.len();
    let mut tx = pool.begin().await.map_err(|e| anyhow::anyhow!(e))?;

    if last_sync.is_none() {
        // Clear local customers before full sync
        sqlx::query("DELETE FROM customers").execute(&mut *tx).await.map_err(|e| anyhow::anyhow!(e))?;
    }

    for customer in customers_list {
        let search_text = build_search_text(&customer);
        let encrypted_payload = encrypt_payload(&customer).await?;

        let query = r#"
            INSERT INTO customers (id, name, phone, email, search_text, payload)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6)
            ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                phone = excluded.phone,
                email = excluded.email,
                search_text = excluded.search_text,
                payload = excluded.payload
        "#;

        sqlx::query(query)
            .bind(&customer.id)
            .bind(&customer.name)
            .bind(&customer.phone)
            .bind(&customer.email)
            .bind(search_text)
            .bind(encrypted_payload)
            .execute(&mut *tx)
            .await.map_err(|e| anyhow::anyhow!(e))?;
    }

    let new_sync_time = sync_token_from_resp
        .map(|s| s.to_string())
        .unwrap_or_else(|| chrono::Utc::now().to_rfc3339());

    sqlx::query("INSERT OR REPLACE INTO customer_sync_meta (id, last_sync) VALUES (1, ?1)")
        .bind(&new_sync_time)
        .execute(&mut *tx)
        .await.map_err(|e| anyhow::anyhow!(e))?;

    tx.commit().await.map_err(|e| anyhow::anyhow!(e))?;

    Ok(incoming_count)
}

// --- Search Logic ---
pub async fn search_local(app: &AppHandle, _state: &CustomerState, query: String) -> Vec<PosCustomer> {
    let pool = match get_db_pool(app).await {
        Ok(p) => p,
        Err(_) => return Vec::new(),
    };

    let query = query.trim().to_lowercase();
    let rows = if query.is_empty() {
        sqlx::query("SELECT payload FROM customers LIMIT 50").fetch_all(&pool).await
    } else {
        let lower_query = format!("%{}%", query);
        sqlx::query("SELECT payload FROM customers WHERE search_text LIKE ?1 LIMIT 50")
            .bind(lower_query)
            .fetch_all(&pool)
            .await
    };

    let mut results = Vec::new();
    if let Ok(rows) = rows {
        for row in rows {
            let encrypted: Vec<u8> = row.get("payload");
            if let Ok(customer) = decrypt_payload(&encrypted).await {
                results.push(customer);
            }
        }
    }
    results
}

pub async fn get_customers_by_ids(app: &AppHandle, _state: &CustomerState, ids: Vec<String>) -> Vec<PosCustomer> {
    if ids.is_empty() { return Vec::new(); }
    let pool = match get_db_pool(app).await {
        Ok(p) => p,
        Err(_) => return Vec::new(),
    };

    let mut results = Vec::new();
    for id in ids {
        if let Ok(Some(row)) = sqlx::query("SELECT payload FROM customers WHERE id = ?1").bind(id).fetch_optional(&pool).await {
            let encrypted: Vec<u8> = row.get("payload");
            if let Ok(customer) = decrypt_payload(&encrypted).await {
                results.push(customer);
            }
        }
    }
    results
}

pub async fn create_customer(
    app: AppHandle,
    _state: &CustomerState,
    auth_state: &AuthState,
    payload: serde_json::Value,
) -> Result<PosCustomer> {
    if cfg!(feature = "standalone") {
        let mut new_customer: PosCustomer = serde_json::from_value(payload)?;
        if new_customer.id.is_empty() {
            new_customer.id = uuid::Uuid::now_v7().to_string();
        }

        let pool = get_db_pool(&app).await.map_err(|e| anyhow::anyhow!(e))?;
        let search_text = build_search_text(&new_customer);
        let encrypted_payload = encrypt_payload(&new_customer).await?;

        sqlx::query("INSERT OR REPLACE INTO customers (id, name, phone, email, search_text, payload) VALUES (?1, ?2, ?3, ?4, ?5, ?6)")
            .bind(&new_customer.id)
            .bind(&new_customer.name)
            .bind(&new_customer.phone)
            .bind(&new_customer.email)
            .bind(search_text)
            .bind(encrypted_payload)
            .execute(&pool)
            .await.map_err(|e| anyhow::anyhow!(e))?;

        return Ok(new_customer);
    }

    create_customer_cloud(app, _state, auth_state, payload).await
}

pub async fn create_customer_cloud(
    app: AppHandle,
    _state: &CustomerState,
    auth_state: &AuthState,
    payload: serde_json::Value,
) -> Result<PosCustomer> {
    let request = auth_state.build_request(reqwest::Method::POST, crate::api_config::routes::CUSTOMERS)
        .map_err(|e| anyhow::anyhow!(e))?;
    let response = request.json(&payload).send().await.map_err(|e| anyhow::anyhow!(e))?;

    if !response.status().is_success() {
        return Err(anyhow::anyhow!("Server error: {}", response.status()));
    }

    let raw_val: serde_json::Value = response.json().await.map_err(|e| anyhow::anyhow!(e))?;
    let target = if let Some(data) = raw_val.get("data") {
        if let Some(c) = data.get("customer") {
            c
        } else {
            data
        }
    } else if let Some(c) = raw_val.get("customer") {
        c
    } else {
        &raw_val
    };

    let new_customer: PosCustomer = serde_json::from_value(target.clone())
        .map_err(|e| anyhow::anyhow!("Failed to parse created customer: {} | Raw: {}", e, raw_val))?;

    // Save to DB
    let pool = get_db_pool(&app).await.map_err(|e| anyhow::anyhow!(e))?;
    let search_text = build_search_text(&new_customer);
    let encrypted_payload = encrypt_payload(&new_customer).await?;

    sqlx::query("INSERT OR REPLACE INTO customers (id, name, phone, email, search_text, payload) VALUES (?1, ?2, ?3, ?4, ?5, ?6)")
        .bind(&new_customer.id)
        .bind(&new_customer.name)
        .bind(&new_customer.phone)
        .bind(&new_customer.email)
        .bind(search_text)
        .bind(encrypted_payload)
        .execute(&pool)
        .await.map_err(|e| anyhow::anyhow!(e))?;

    Ok(new_customer)
}

pub async fn delete_local_customer(app: &AppHandle, _state: &CustomerState, id: &str) -> Result<String> {
    let pool = get_db_pool(app).await.map_err(|e| anyhow::anyhow!(e))?;
    sqlx::query("DELETE FROM customers WHERE id = ?1").bind(id).execute(&pool).await?;
    Ok(id.to_string())
}

pub async fn update_customer(
    app: AppHandle,
    _state: &CustomerState,
    auth_state: &AuthState,
    id: String,
    payload: serde_json::Value,
) -> Result<PosCustomer> {
    if cfg!(feature = "standalone") {
        let new_customer: PosCustomer = serde_json::from_value(payload)?;
        let pool = get_db_pool(&app).await.map_err(|e| anyhow::anyhow!(e))?;
        let search_text = build_search_text(&new_customer);
        let encrypted_payload = encrypt_payload(&new_customer).await?;

        sqlx::query("UPDATE customers SET name = ?1, phone = ?2, email = ?3, search_text = ?4, payload = ?5 WHERE id = ?6")
            .bind(&new_customer.name)
            .bind(&new_customer.phone)
            .bind(&new_customer.email)
            .bind(search_text)
            .bind(encrypted_payload)
            .bind(&id)
            .execute(&pool)
            .await.map_err(|e| anyhow::anyhow!(e))?;

        return Ok(new_customer);
    }

    update_customer_cloud(app, _state, auth_state, id, payload).await
}

pub async fn update_customer_cloud(
    app: AppHandle,
    _state: &CustomerState,
    auth_state: &AuthState,
    id: String,
    payload: serde_json::Value,
) -> Result<PosCustomer> {
    let path = format!("{}/{}", crate::api_config::routes::CUSTOMERS, id);
    let request = auth_state.build_request(reqwest::Method::PATCH, &path)
        .map_err(|e| anyhow::anyhow!(e))?;
    let response = request.json(&payload).send().await.map_err(|e| anyhow::anyhow!(e))?;

    if !response.status().is_success() {
        return Err(anyhow::anyhow!("Server error: {}", response.status()));
    }

    let raw_val: serde_json::Value = response.json().await.map_err(|e| anyhow::anyhow!(e))?;
    let target = if let Some(data) = raw_val.get("data") {
        if let Some(c) = data.get("customer") {
            c
        } else {
            data
        }
    } else if let Some(c) = raw_val.get("customer") {
        c
    } else {
        &raw_val
    };

    let new_customer: PosCustomer = serde_json::from_value(target.clone())
        .map_err(|e| anyhow::anyhow!("Failed to parse updated customer: {} | Raw: {}", e, raw_val))?;

    // Save to DB
    let pool = get_db_pool(&app).await.map_err(|e| anyhow::anyhow!(e))?;
    let search_text = build_search_text(&new_customer);
    let encrypted_payload = encrypt_payload(&new_customer).await?;

    sqlx::query("UPDATE customers SET name = ?1, phone = ?2, email = ?3, search_text = ?4, payload = ?5 WHERE id = ?6")
        .bind(&new_customer.name)
        .bind(&new_customer.phone)
        .bind(&new_customer.email)
        .bind(search_text)
        .bind(encrypted_payload)
        .bind(&id)
        .execute(&pool)
        .await.map_err(|e| anyhow::anyhow!(e))?;

    Ok(new_customer)
}
