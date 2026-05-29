use crate::models::{PosProduct, ProductSearchResponse};
#[cfg(not(feature = "standalone"))]
use crate::models::ProductsSyncResponse;
use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Nonce,
};
use anyhow::Result;
use log::{error, info};
use rand::RngCore;
use sha2::{Digest, Sha256};
use sqlx::{Row, SqlitePool};
#[cfg(not(feature = "standalone"))]
use std::path::PathBuf;
use std::sync::OnceLock;
use tauri::{AppHandle, Manager, Emitter};
#[cfg(not(feature = "standalone"))]
use reqwest::header::{HeaderMap, HeaderValue};
use tauri_plugin_sql::{DbInstances, DbPool};

use crate::auth_store::AuthState;

#[cfg(not(feature = "standalone"))]
const TIMEOUT_SECONDS: u64 = 60;
const MAIN_DB_NAME: &str = "sqlite:pos_main.db";

static LEGACY_SECRET: OnceLock<String> = OnceLock::new();

fn get_legacy_secret() -> &'static str {
    LEGACY_SECRET.get_or_init(|| {
        std::env::var("LEGACY_APP_SECRET")
            .unwrap_or_else(|_| "dealio-pos-secure-storage-salt".to_string())
    })
}

// --- State Management ---
pub struct ProductState;

impl ProductState {
    pub fn new() -> Self { Self }
}

impl Default for ProductState {
    fn default() -> Self { Self::new() }
}

// --- DB Helper ---
pub async fn get_db_pool(app: &AppHandle) -> Result<SqlitePool, String> {
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

async fn encrypt_payload(payload: &PosProduct) -> Result<Vec<u8>> {
    let json_data = serde_json::to_string(payload)?;
    let key = crate::security::get_or_create_key("product_store_key").map_err(|e| anyhow::anyhow!("Keyring error: {}", e))?;
    let cipher = Aes256Gcm::new(&key.into());
    let mut nonce_bytes = [0u8; 12];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from(nonce_bytes);
    let ciphertext = cipher.encrypt(&nonce, json_data.as_bytes()).map_err(|_| anyhow::anyhow!("Encryption failed"))?;
    let mut final_payload = nonce_bytes.to_vec();
    final_payload.extend_from_slice(&ciphertext);
    Ok(final_payload)
}

async fn decrypt_payload(file_bytes: &[u8]) -> Result<PosProduct> {
    if file_bytes.len() < 12 { return Err(anyhow::anyhow!("Payload too short")); }
    let (nonce_slice, ciphertext) = file_bytes.split_at(12);
    let mut nonce_arr = [0u8; 12];
    nonce_arr.copy_from_slice(nonce_slice);
    let nonce = Nonce::from(nonce_arr);

    if let Ok(key) = crate::security::get_or_create_key("product_store_key") {
        let cipher = Aes256Gcm::new(&key.into());
        if let Ok(plaintext) = cipher.decrypt(&nonce, ciphertext) {
            return Ok(serde_json::from_slice(&plaintext)?);
        }
    }

    let legacy_key = get_legacy_key();
    let cipher = Aes256Gcm::new(&legacy_key.into());
    let plaintext = cipher.decrypt(&nonce, ciphertext).map_err(|_| anyhow::anyhow!("Decryption failed"))?;
    Ok(serde_json::from_slice(&plaintext)?)
}

// --- Initialization & Migration ---
pub async fn init_state(app: &AppHandle) {
    let pool = match get_db_pool(app).await {
        Ok(p) => p,
        Err(e) => {
            error!("[ProductStore] Failed to get main DB pool: {}", e);
            return;
        }
    };

    let create_products_table = r#"
        CREATE TABLE IF NOT EXISTS products (
            product_id TEXT,
            location_id TEXT,
            category TEXT,
            product_name TEXT,
            search_text TEXT,
            payload BLOB,
            PRIMARY KEY (product_id, location_id)
        )
    "#;

    let create_sync_table = r#"
        CREATE TABLE IF NOT EXISTS product_sync_meta (
            location_id TEXT PRIMARY KEY,
            last_sync TEXT
        )
    "#;

    let _ = sqlx::query(create_products_table).execute(&pool).await;
    let _ = sqlx::query(create_sync_table).execute(&pool).await;

    // Add indexes for performance with tens of thousands of products
    let _ = sqlx::query("CREATE INDEX IF NOT EXISTS idx_products_location_category ON products (location_id, category)")
        .execute(&pool).await;
    let _ = sqlx::query("CREATE INDEX IF NOT EXISTS idx_products_location_name ON products (location_id, product_name)")
        .execute(&pool).await;

    let _ = migrate_legacy_files_to_db(app, &pool).await;
}

async fn migrate_legacy_files_to_db(app: &AppHandle, pool: &SqlitePool) -> Result<()> {
    let app_dir = app.path().app_data_dir()?;
    let mut entries = tokio::fs::read_dir(&app_dir).await?;
    
    while let Some(entry) = entries.next_entry().await? {
        let path = entry.path();
        let filename = path.file_name().unwrap_or_default().to_string_lossy();
        
        if filename.starts_with("products_loc_") && filename.ends_with(".json") {
            let location_id = filename.replace("products_loc_", "").replace(".json", "");
            info!("[ProductStore] Found legacy product file for location {}. Migrating...", location_id);
            let content = tokio::fs::read_to_string(&path).await?;
            if let Ok((last_sync, products)) = serde_json::from_str::<(Option<String>, Vec<PosProduct>)>(&content) {
                let mut tx = pool.begin().await?;
                for product in products {
                    let search_text = build_search_text(&product);
                    let encrypted_payload = encrypt_payload(&product).await?;
                    let _ = sqlx::query("INSERT OR IGNORE INTO products (product_id, location_id, category, product_name, search_text, payload) VALUES (?1, ?2, ?3, ?4, ?5, ?6)")
                        .bind(&product.product_id).bind(&location_id).bind(&product.category).bind(&product.product_name).bind(search_text).bind(encrypted_payload)
                        .execute(&mut *tx).await;
                }
                if let Some(ts) = last_sync {
                    let _ = sqlx::query("INSERT OR REPLACE INTO product_sync_meta (location_id, last_sync) VALUES (?1, ?2)")
                        .bind(&location_id).bind(ts).execute(&mut *tx).await;
                }
                tx.commit().await?;
                let _ = tokio::fs::remove_file(&path).await;
            }
        }
    }
    Ok(())
}

pub(crate) fn build_search_text(product: &PosProduct) -> String {
    let mut terms = vec![product.product_name.to_lowercase()];
    if let Some(ai) = &product.active_ingredient {
        terms.push(ai.to_lowercase());
    }
    for variant in &product.variants {
        terms.push(variant.sku.to_lowercase());
        if let Some(barcode) = &variant.barcode {
            terms.push(barcode.to_lowercase());
        }
        terms.push(variant.variant_name.to_lowercase());
    }
    terms.join(" ")
}

// --- Helper: Cache Single Image ---
#[cfg(not(feature = "standalone"))]
async fn get_images_dir(app: &AppHandle) -> Result<PathBuf> {
    let app_dir = app.path().app_data_dir()?;
    let images_dir = app_dir.join("product_images");
    if !images_dir.exists() { tokio::fs::create_dir_all(&images_dir).await?; }
    Ok(images_dir)
}

#[cfg(not(feature = "standalone"))]
async fn cache_image(app: &AppHandle, url: &str) -> Option<String> {
    if url.trim().is_empty() { return None; }
    let clean_name = url.replace("https://", "").replace("http://", "").replace('/', "_").replace(':', "").replace('?', "_");
    let filename = if clean_name.contains('.') { clean_name } else { format!("{}.jpg", clean_name) };
    let images_dir = match get_images_dir(app).await { Ok(d) => d, Err(_) => return Some(url.to_string()), };
    let file_path = images_dir.join(&filename);
    let file_path_str = file_path.to_string_lossy().to_string();

    if file_path.exists() {
        if let Ok(metadata) = tokio::fs::metadata(&file_path).await { if metadata.len() > 0 { return Some(file_path_str); } }
        let _ = tokio::fs::remove_file(&file_path).await;
    }

    match reqwest::get(url).await {
        Ok(resp) if resp.status().is_success() => {
            if let Ok(bytes) = resp.bytes().await {
                if tokio::fs::write(&file_path, &bytes).await.is_ok() {
                    if let Ok(metadata) = tokio::fs::metadata(&file_path).await { if metadata.len() > 0 { return Some(file_path_str); } }
                }
            }
            Some(url.to_string())
        }
        _ => Some(url.to_string()),
    }
}

pub async fn load_products_from_disk(app: &AppHandle, _state: &ProductState, location_id: &str) -> Result<()> {
    let pool = get_db_pool(app).await.map_err(|e| anyhow::anyhow!(e))?;
    let rows = sqlx::query("SELECT payload FROM products WHERE location_id = ?1")
        .bind(location_id)
        .fetch_all(&pool).await?;

    let mut products = Vec::new();
    for row in rows {
        let encrypted: Vec<u8> = row.get("payload");
        if let Ok(product) = decrypt_payload(&encrypted).await {
            products.push(product);
        }
    }

    info!("[ProductStore] Loaded {} products from disk for location {}", products.len(), location_id);
    // In this architecture, search_local is used to fetch products from DB.
    // The ProductState struct is a marker for tauri manage.
    // However, if we need to notify the frontend, we could emit an event.
    let _ = app.emit("products-loaded", products);

    Ok(())
}

// --- 2. Sync Engine ---
#[cfg(not(feature = "standalone"))]
pub async fn run_sync(
    app: AppHandle,
    _state: &ProductState,
    auth_state: &AuthState,
    force_full_sync: bool,
) -> Result<usize> {
    let pool = get_db_pool(&app).await.map_err(|e| anyhow::anyhow!(e))?;
    let (base_url, location_id, device_key) = {
        let config_guard = auth_state.device_config.lock().map_err(|_| anyhow::anyhow!("Lock error"))?;
        let config = config_guard.as_ref().ok_or_else(|| anyhow::anyhow!("Device not configured"))?;
        (config.base_url.clone(), config.location_id.clone(), config.device_key.clone())
    };
    let member_token = auth_state.get_active_token().map_err(|e| anyhow::anyhow!(e))?;
    if base_url.is_empty() { return Err(anyhow::anyhow!("Base URL is empty")); }
    let target_url = format!("{}/{}", base_url.trim_end_matches('/'), crate::api_config::routes::PRODUCTS);

    let last_sync_time: Option<String> = if force_full_sync { None } else {
        sqlx::query("SELECT last_sync FROM product_sync_meta WHERE location_id = ?1").bind(&location_id).fetch_optional(&pool).await?.map(|r| r.get("last_sync"))
    };

    let mut headers = HeaderMap::new();
    headers.insert("X-API-KEY", HeaderValue::from_str(&device_key)?);
    if let Some(token) = member_token { headers.insert("X-MEMBER-TOKEN", HeaderValue::from_str(&token)?); }

    let client = reqwest::Client::builder().default_headers(headers).timeout(std::time::Duration::from_secs(TIMEOUT_SECONDS)).build()?;
    let mut query_params = vec![("locationId", location_id.clone()), ("page", "1".to_string()), ("limit", "2000".to_string()), ("categoryId", "all".to_string())];
    if let Some(ts) = &last_sync_time { query_params.push(("lastSync", ts.clone())); }

    let response = client.get(&target_url).query(&query_params).send().await?;
    if !response.status().is_success() { return Err(anyhow::anyhow!("Server returned error: {}", response.status())); }

    let v2_resp = response.json::<crate::models::V2Response<ProductsSyncResponse>>().await?;
    let mut res_body = v2_resp.data;

    // Parallelize image caching for better performance
    let mut image_tasks = Vec::new();
    for product in &res_body.products {
        if let Some(url) = &product.image_url {
            if !url.starts_with('/') && !url.starts_with("C:") && url.starts_with("http") {
                let app_handle = app.clone();
                let url_clone = url.clone();
                image_tasks.push(tokio::spawn(async move {
                    (url_clone.clone(), cache_image(&app_handle, &url_clone).await)
                }));
            }
        }
    }

    let image_results = futures_util::future::join_all(image_tasks).await;
    let mut image_map = std::collections::HashMap::new();
    for res in image_results {
        if let Ok((original_url, cached_path)) = res {
            image_map.insert(original_url, cached_path);
        }
    }

    // Update product image URLs with cached paths
    for product in &mut res_body.products {
        if let Some(url) = &product.image_url {
            if let Some(cached_path) = image_map.get(url) {
                product.image_url = cached_path.clone();
            }
        }
    }

    let incoming_count = res_body.products.len();
    let new_sync_time = v2_resp.meta.and_then(|m| m.get("syncTimestamp").and_then(|t| t.as_str().map(|s| s.to_string())))
        .unwrap_or_else(|| chrono::Utc::now().to_rfc3339());

    let mut tx = pool.begin().await?;
    for product in res_body.products {
        let search_text = build_search_text(&product);
        let encrypted_payload = encrypt_payload(&product).await?;
        let query = r#"
            INSERT INTO products (product_id, location_id, category, product_name, search_text, payload)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6)
            ON CONFLICT(product_id, location_id) DO UPDATE SET
                category = excluded.category,
                product_name = excluded.product_name,
                search_text = excluded.search_text,
                payload = excluded.payload
        "#;
        sqlx::query(query).bind(&product.product_id).bind(&location_id).bind(&product.category).bind(&product.product_name).bind(search_text).bind(encrypted_payload).execute(&mut *tx).await?;
    }
    sqlx::query("INSERT OR REPLACE INTO product_sync_meta (location_id, last_sync) VALUES (?1, ?2)").bind(&location_id).bind(new_sync_time).execute(&mut *tx).await?;
    tx.commit().await?;
    Ok(incoming_count)
}

// --- 3. Stock Management ---
pub async fn deduct_stock(
    app: AppHandle,
    _state: &ProductState,
    location_id: &str,
    cart_items: &Vec<serde_json::Value>,
    allow_negative: bool,
) -> Result<()> {
    let pool = get_db_pool(&app).await.map_err(|e| anyhow::anyhow!(e))?;
    let mut tx = pool.begin().await?;

    for item in cart_items {
        let product_id = item.get("productId").and_then(|v| v.as_str());
        let variant_id = item.get("variantId").and_then(|v| v.as_str());
        let unit_id = item.get("sellingUnitId").and_then(|v| v.as_str());
        let quantity = item.get("quantity").and_then(|v| v.as_f64()).unwrap_or(0.0) as i32;

        if let (Some(p_id), Some(v_id)) = (product_id, variant_id) {
            let row = sqlx::query("SELECT payload FROM products WHERE product_id = ?1 AND location_id = ?2").bind(p_id).bind(location_id).fetch_optional(&mut *tx).await?;
            if let Some(r) = row {
                let encrypted: Vec<u8> = r.get("payload");
                let mut product: PosProduct = decrypt_payload(&encrypted).await?;
                let mut updated = false;

                if let Some(variant) = product.variants.iter_mut().find(|v| v.variant_id == v_id) {
                    let conversion = if let Some(u_id) = unit_id {
                        variant.sellable_units.iter().find(|u| u.unit_id == u_id).map(|u| u.conversion).unwrap_or(1.0)
                    } else { 1.0 };
                    let deducted_qty = (quantity as f64 * conversion) as i32;
                    if !allow_negative && variant.stock < deducted_qty {
                        return Err(anyhow::anyhow!("Insufficient stock for {}: requested {}, available {}", product.product_name, deducted_qty, variant.stock));
                    }

                    // Pharmacy: Deduct from batches if they exist (FEFO)
                    if let Some(batches) = variant.batches.as_mut() {
                        let mut remaining_to_deduct = deducted_qty;
                        // Sort by expiry date ascending
                        batches.sort_by(|a, b| a.expiry_date.cmp(&b.expiry_date));

                        for batch in batches.iter_mut() {
                            if remaining_to_deduct <= 0 { break; }
                            let deduct_from_batch = remaining_to_deduct.min(batch.stock);
                            batch.stock -= deduct_from_batch;
                            remaining_to_deduct -= deduct_from_batch;
                        }

                        if remaining_to_deduct > 0 && allow_negative {
                            if let Some(last_batch) = batches.last_mut() {
                                last_batch.stock -= remaining_to_deduct;
                            }
                        }
                    }

                    variant.stock -= deducted_qty;

                    if let Some(total) = product.total_stock.as_mut() { *total -= deducted_qty; }
                    updated = true;
                }

                if updated {
                    let new_encrypted = encrypt_payload(&product).await?;
                    sqlx::query("UPDATE products SET payload = ?1 WHERE product_id = ?2 AND location_id = ?3").bind(new_encrypted).bind(p_id).bind(location_id).execute(&mut *tx).await?;
                }
            }
        }
    }
    tx.commit().await?;
    Ok(())
}

// --- 4. Search Logic ---
pub async fn search_local(
    app: &AppHandle,
    _state: &ProductState,
    location_id: &str,
    query: String,
    category: String,
    page: Option<usize>,
    page_size: Option<usize>,
) -> ProductSearchResponse {
    let pool = match get_db_pool(app).await { Ok(p) => p, Err(_) => return ProductSearchResponse { products: vec![], total_count: 0 }, };
    let p = page.unwrap_or(1).max(1);
    let ps = page_size.unwrap_or(50);
    let offset = (p - 1) * ps;
    let filter_category = category != "all" && !category.is_empty();
    let lower_query = format!("%{}%", query.trim().to_lowercase());

    let (count_sql, data_sql) = if filter_category {
        ("SELECT COUNT(*) as count FROM products WHERE location_id = ?1 AND category = ?2 AND search_text LIKE ?3",
         "SELECT payload FROM products WHERE location_id = ?1 AND category = ?2 AND search_text LIKE ?3 LIMIT ?4 OFFSET ?5")
    } else {
        ("SELECT COUNT(*) as count FROM products WHERE location_id = ?1 AND search_text LIKE ?2",
         "SELECT payload FROM products WHERE location_id = ?1 AND search_text LIKE ?2 LIMIT ?3 OFFSET ?4")
    };

    let mut total_count = 0;
    if filter_category {
        if let Ok(row) = sqlx::query(count_sql).bind(location_id).bind(&category).bind(&lower_query).fetch_one(&pool).await { total_count = row.get::<i32, _>("count") as usize; }
    } else {
        if let Ok(row) = sqlx::query(count_sql).bind(location_id).bind(&lower_query).fetch_one(&pool).await { total_count = row.get::<i32, _>("count") as usize; }
    }

    let rows = if filter_category {
        sqlx::query(data_sql).bind(location_id).bind(&category).bind(&lower_query).bind(ps as i32).bind(offset as i32).fetch_all(&pool).await
    } else {
        sqlx::query(data_sql).bind(location_id).bind(&lower_query).bind(ps as i32).bind(offset as i32).fetch_all(&pool).await
    };

    let mut products = Vec::new();
    if let Ok(rows) = rows {
        for row in rows {
            let encrypted: Vec<u8> = row.get("payload");
            if let Ok(product) = decrypt_payload(&encrypted).await { products.push(product); }
        }
    }
    ProductSearchResponse { products, total_count }
}

pub async fn get_products_by_ids(app: &AppHandle, _state: &ProductState, location_id: &str, ids: Vec<String>) -> Vec<PosProduct> {
    if ids.is_empty() { return Vec::new(); }
    let pool = match get_db_pool(app).await { Ok(p) => p, Err(_) => return Vec::new(), };
    let mut products = Vec::new();
    for id in ids {
        let query = "SELECT payload FROM products WHERE location_id = ?1 AND (product_id = ?2 OR search_text LIKE ?3)";
        let like_id = format!("%{}%", id);
        if let Ok(Some(r)) = sqlx::query(query).bind(location_id).bind(&id).bind(&like_id).fetch_optional(&pool).await {
            let encrypted: Vec<u8> = r.get("payload");
            if let Ok(product) = decrypt_payload(&encrypted).await { products.push(product); }
        }
    }
    products
}

#[tauri::command]
#[cfg(not(feature = "standalone"))]
pub async fn switch_location(
    app: AppHandle,
    state: tauri::State<'_, ProductState>,
    _auth_state: tauri::State<'_, AuthState>,
    new_location_id: String,
) -> Result<Vec<PosProduct>, String> {
    let search_res = search_local(&app, &state, &new_location_id, "".to_string(), "all".to_string(), Some(1), Some(50)).await;
    let cached = search_res.products;
    let app_clone = app.clone();
    tauri::async_runtime::spawn(async move {
        let state_inner = app_clone.state::<ProductState>();
        let auth_inner = app_clone.state::<AuthState>();
        let _ = run_sync(app_clone.clone(), &state_inner, &auth_inner, false).await;
    });
    Ok(cached)
}

pub async fn create_local_product(app: &AppHandle, state: &ProductState, product: PosProduct) -> Result<String> {
    let pool = get_db_pool(app).await.map_err(|e| anyhow::anyhow!(e))?;
    let search_text = build_search_text(&product);
    let encrypted_payload = encrypt_payload(&product).await?;

    let location_id = {
        let auth_state = app.state::<AuthState>();
        let config_guard = auth_state.device_config.lock().map_err(|_| anyhow::anyhow!("Lock error"))?;
        config_guard.as_ref().map(|c| c.location_id.clone()).unwrap_or_else(|| "standalone".to_string())
    };

    sqlx::query("INSERT INTO products (product_id, location_id, category, product_name, search_text, payload) VALUES (?1, ?2, ?3, ?4, ?5, ?6)")
        .bind(&product.product_id).bind(&location_id).bind(&product.category).bind(&product.product_name).bind(search_text).bind(encrypted_payload)
        .execute(&pool).await?;

    // Refresh memory
    load_products_from_disk(app, state, &location_id).await?;

    Ok(product.product_id)
}

pub async fn update_local_product(app: &AppHandle, state: &ProductState, product: PosProduct) -> Result<String> {
    let pool = get_db_pool(app).await.map_err(|e| anyhow::anyhow!(e))?;
    let search_text = build_search_text(&product);
    let encrypted_payload = encrypt_payload(&product).await?;

    let location_id = {
        let auth_state = app.state::<AuthState>();
        let config_guard = auth_state.device_config.lock().map_err(|_| anyhow::anyhow!("Lock error"))?;
        config_guard.as_ref().map(|c| c.location_id.clone()).unwrap_or_else(|| "standalone".to_string())
    };

    sqlx::query("UPDATE products SET category = ?1, product_name = ?2, search_text = ?3, payload = ?4 WHERE product_id = ?5 AND location_id = ?6")
        .bind(&product.category).bind(&product.product_name).bind(search_text).bind(encrypted_payload).bind(&product.product_id).bind(&location_id)
        .execute(&pool).await?;

    // Refresh memory
    load_products_from_disk(app, state, &location_id).await?;

    Ok(product.product_id)
}

pub async fn delete_local_product(app: &AppHandle, state: &ProductState, product_id: &str, location_id: &str) -> Result<String> {
    let pool = get_db_pool(app).await.map_err(|e| anyhow::anyhow!(e))?;
    sqlx::query("DELETE FROM products WHERE product_id = ?1 AND location_id = ?2").bind(product_id).bind(location_id).execute(&pool).await?;

    // Refresh memory
    load_products_from_disk(app, state, location_id).await?;

    Ok(product_id.to_string())
}

pub async fn get_product_by_barcode(
    app: AppHandle,
    _state: tauri::State<'_, ProductState>,
    auth_state: tauri::State<'_, AuthState>,
    barcode: String,
) -> Result<Option<PosProduct>, String> {
    let pool = get_db_pool(&app).await?;
    let location_id = {
        let config_guard = auth_state
            .device_config
            .lock()
            .map_err(|_| "Lock error".to_string())?;
        config_guard
            .as_ref()
            .map(|c| c.location_id.clone())
            .unwrap_or_else(|| "standalone".to_string())
    };

    let query = "SELECT payload FROM products WHERE location_id = ?1 AND search_text LIKE ?2";
    let like_barcode = format!("%{}%", barcode.to_lowercase());

    let rows = sqlx::query(query)
        .bind(&location_id)
        .bind(&like_barcode)
        .fetch_all(&pool)
        .await
        .map_err(|e| e.to_string())?;

    for row in rows {
        let encrypted: Vec<u8> = row.get("payload");
        if let Ok(product) = decrypt_payload(&encrypted).await {
            // Precise check within the decrypted product variants to avoid partial matches in search_text
            for variant in &product.variants {
                if variant.barcode == Some(barcode.clone()) {
                    return Ok(Some(product));
                }
            }
        }
    }

    Ok(None)
}
