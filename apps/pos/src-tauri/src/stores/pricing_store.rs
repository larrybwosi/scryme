use crate::models::{ClientPriceList, ClientPriceListItem, PosPricingData, ServerPricingRuleItem, ServerPricingBundle, ServerPricingBundleItem};
use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use anyhow::Result;
use chrono::Utc;
use log::{error, info};
use sha2::{Digest, Sha256};
use sqlx::{Row, SqlitePool};
use std::collections::{HashMap};
use std::sync::OnceLock;
use tauri::{AppHandle, Manager};
use tauri_plugin_sql::{DbInstances, DbPool};

const PRICING_FILENAME: &str = "secure_pricing.bin";
const MAIN_DB_NAME: &str = "sqlite:pos_main.db";

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

    let create_pricing_rules = r#"
        CREATE TABLE IF NOT EXISTS pricing_rules (
            id TEXT PRIMARY KEY,
            name TEXT,
            description TEXT,
            price_list_id TEXT,
            variant_id TEXT,
            category_id TEXT,
            conditions TEXT,
            discount_type TEXT,
            discount_value TEXT,
            stackable BOOLEAN,
            priority INTEGER,
            max_usage INTEGER,
            usage_count INTEGER,
            is_active BOOLEAN,
            valid_from TEXT,
            valid_to TEXT,
            updated_at TEXT
        )
    "#;

    let create_pricing_bundles = r#"
        CREATE TABLE IF NOT EXISTS pricing_bundles (
            id TEXT PRIMARY KEY,
            name TEXT,
            code TEXT,
            description TEXT,
            bundle_type TEXT,
            bundle_price TEXT,
            buy_quantity INTEGER,
            get_quantity INTEGER,
            get_discount_type TEXT,
            get_discount_value TEXT,
            savings_label TEXT,
            image_url TEXT,
            is_active BOOLEAN,
            valid_from TEXT,
            valid_to TEXT,
            updated_at TEXT
        )
    "#;

    let create_pricing_bundle_items = r#"
        CREATE TABLE IF NOT EXISTS pricing_bundle_items (
            id TEXT PRIMARY KEY,
            bundle_id TEXT,
            variant_id TEXT,
            quantity INTEGER,
            item_role TEXT,
            price_override TEXT
        )
    "#;

    let _ = sqlx::query(create_price_lists).execute(&pool).await;
    let _ = sqlx::query(create_price_items).execute(&pool).await;
    let _ = sqlx::query(create_allocations).execute(&pool).await;
    let _ = sqlx::query(create_sync_meta).execute(&pool).await;
    let _ = sqlx::query(create_pricing_rules).execute(&pool).await;
    let _ = sqlx::query(create_pricing_bundles).execute(&pool).await;
    let _ = sqlx::query(create_pricing_bundle_items).execute(&pool).await;

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

    let last_sync: Option<String> = sqlx::query("SELECT last_sync FROM pricing_sync_meta WHERE id = 1")
        .fetch_optional(&pool).await.map_err(|e| anyhow::anyhow!(e))?.map(|r| r.get("last_sync"));

    let route = if last_sync.is_some() {
        crate::api_config::routes::PRICING_SYNC
    } else {
        crate::api_config::routes::PRICING
    };

    let request = auth_state.build_request(reqwest::Method::GET, route).map_err(|e| anyhow::anyhow!(e))?;
    let mut query_params = vec![];
    if let Some(token) = &last_sync { query_params.push(("lastSync", token.clone())); }

    let response = request.query(&query_params).send().await.map_err(|e| anyhow::anyhow!(e))?;
    if !response.status().is_success() {
        return Err(anyhow::anyhow!("Server returned error: {}", response.status()));
    }

    let raw_val: serde_json::Value = response.json().await.map_err(|e| anyhow::anyhow!(e))?;
    let target = if let Some(data) = raw_val.get("data") {
        if data.get("metadata").is_some() || data.get("data").is_some() {
            data
        } else {
            &raw_val
        }
    } else {
        &raw_val
    };

    let res_body: crate::models::ServerPricingResponse = serde_json::from_value(target.clone())
        .map_err(|e| anyhow::anyhow!("Failed to parse pricing response: {} | Raw: {}", e, raw_val))?;
    let metadata = res_body.metadata;
    let server_data = res_body.data;

    let mut tx = pool.begin().await.map_err(|e| anyhow::anyhow!(e))?;

    if !metadata.is_delta || metadata.temp_full_sync {
        sqlx::query("DELETE FROM price_lists").execute(&mut *tx).await.map_err(|e| anyhow::anyhow!(e))?;
        sqlx::query("DELETE FROM price_items").execute(&mut *tx).await.map_err(|e| anyhow::anyhow!(e))?;
        sqlx::query("DELETE FROM customer_allocations").execute(&mut *tx).await.map_err(|e| anyhow::anyhow!(e))?;
        sqlx::query("DELETE FROM pricing_rules").execute(&mut *tx).await.map_err(|e| anyhow::anyhow!(e))?;
        sqlx::query("DELETE FROM pricing_bundles").execute(&mut *tx).await.map_err(|e| anyhow::anyhow!(e))?;
        sqlx::query("DELETE FROM pricing_bundle_items").execute(&mut *tx).await.map_err(|e| anyhow::anyhow!(e))?;
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

    for rule in server_data.rules {
        sqlx::query("INSERT OR REPLACE INTO pricing_rules (id, name, description, price_list_id, variant_id, category_id, conditions, discount_type, discount_value, stackable, priority, max_usage, usage_count, is_active, valid_from, valid_to, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17)")
            .bind(rule.id).bind(rule.name).bind(rule.description).bind(rule.price_list_id).bind(rule.variant_id).bind(rule.category_id).bind(rule.conditions).bind(rule.discount_type).bind(rule.discount_value).bind(rule.stackable).bind(rule.priority).bind(rule.max_usage).bind(rule.usage_count).bind(rule.is_active).bind(rule.valid_from).bind(rule.valid_to).bind(rule.updated_at)
            .execute(&mut *tx).await.map_err(|e| anyhow::anyhow!(e))?;
    }

    for bundle in server_data.bundles {
        sqlx::query("INSERT OR REPLACE INTO pricing_bundles (id, name, code, description, bundle_type, bundle_price, buy_quantity, get_quantity, get_discount_type, get_discount_value, savings_label, image_url, is_active, valid_from, valid_to, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)")
            .bind(&bundle.id).bind(&bundle.name).bind(&bundle.code).bind(&bundle.description).bind(&bundle.bundle_type).bind(&bundle.bundle_price).bind(bundle.buy_quantity).bind(bundle.get_quantity).bind(&bundle.get_discount_type).bind(&bundle.get_discount_value).bind(&bundle.savings_label).bind(&bundle.image_url).bind(bundle.is_active).bind(&bundle.valid_from).bind(&bundle.valid_to).bind(&bundle.updated_at)
            .execute(&mut *tx).await.map_err(|e| anyhow::anyhow!(e))?;

        for bi in bundle.items {
            sqlx::query("INSERT OR REPLACE INTO pricing_bundle_items (id, bundle_id, variant_id, quantity, item_role, price_override) VALUES (?1, ?2, ?3, ?4, ?5, ?6)")
                .bind(bi.id).bind(bi.bundle_id).bind(bi.variant_id).bind(bi.quantity).bind(bi.item_role).bind(bi.price_override)
                .execute(&mut *tx).await.map_err(|e| anyhow::anyhow!(e))?;
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
    state: &PricingState,
    customer_id: Option<String>,
    variant_id: String,
    unit_id: Option<String>,
    is_base_unit: bool,
) -> Option<f64> {
    resolve_price_with_qty(app, state, customer_id, variant_id, unit_id, is_base_unit, 1).await
}

pub async fn resolve_price_with_qty(
    app: &AppHandle,
    _state: &PricingState,
    customer_id: Option<String>,
    variant_id: String,
    unit_id: Option<String>,
    is_base_unit: bool,
    quantity: i32,
) -> Option<f64> {
    let pool = get_db_pool(app).await.ok()?;
    let now = Utc::now().to_rfc3339();

    // 0. Check Multi-Buy Bundles First (e.g. FIXED multi-buy pack rules like Buy 3 for $10)
    let bundle_query = r#"
        SELECT pb.*, pbi.quantity as item_qty FROM pricing_bundles pb
        JOIN pricing_bundle_items pbi ON pbi.bundle_id = pb.id
        WHERE pbi.variant_id = ?1 AND (pb.is_active = 1 OR pb.is_active IS NULL)
    "#;

    if let Ok(rows) = sqlx::query(bundle_query).bind(&variant_id).fetch_all(&pool).await {
        for row in rows {
            let valid_from: Option<String> = row.get("valid_from");
            let valid_to: Option<String> = row.get("valid_to");
            if let Some(from) = valid_from { if from.as_str() > now.as_str() { continue; } }
            if let Some(to) = valid_to { if to.as_str() < now.as_str() { continue; } }

            let bundle_type: String = row.get("bundle_type");
            let buy_qty: i32 = row.get::<Option<i32>, _>("buy_quantity")
                .or_else(|| row.get::<Option<i32>, _>("item_qty"))
                .unwrap_or(1);

            if quantity >= buy_qty {
                if bundle_type == "FIXED" {
                    if let Some(b_price_str) = row.get::<Option<String>, _>("bundle_price") {
                        if let Ok(b_price) = b_price_str.parse::<f64>() {
                            if buy_qty > 0 {
                                return Some(b_price / (buy_qty as f64));
                            }
                        }
                    }
                }
            }
        }
    }

    let mut base_price: Option<f64> = None;
    let mut resolved_price_list_id: Option<String> = None;

    // 1. Try Customer-Specific Lists First
    if let Some(cid) = customer_id.as_ref().filter(|id| !id.is_empty()) {
        let customer_query = r#"
            SELECT pl.* FROM price_lists pl
            JOIN customer_allocations ca ON ca.price_list_id = pl.id
            WHERE ca.customer_id = ?1 AND pl.is_active = 1
            ORDER BY pl.priority DESC
        "#;

        if let Ok(rows) = sqlx::query(customer_query).bind(cid).fetch_all(&pool).await {
            for row in rows {
                if let Some((price, list_id)) = check_list_and_resolve(&pool, &row, &now, &variant_id, &unit_id, is_base_unit, quantity).await {
                    base_price = Some(price);
                    resolved_price_list_id = Some(list_id);
                    break;
                }
            }
        }
    }

    // 2. Try Global Lists
    if base_price.is_none() {
        let global_query = r#"
            SELECT * FROM price_lists
            WHERE is_global = 1 AND is_active = 1
            ORDER BY priority DESC
        "#;

        if let Ok(rows) = sqlx::query(global_query).fetch_all(&pool).await {
            for row in rows {
                if let Some((price, list_id)) = check_list_and_resolve(&pool, &row, &now, &variant_id, &unit_id, is_base_unit, quantity).await {
                    base_price = Some(price);
                    resolved_price_list_id = Some(list_id);
                    break;
                }
            }
        }
    }

    let price = base_price?;

    // 3. Apply Pricing Rules if any apply to this variant / price list
    if let Some(pl_id) = resolved_price_list_id {
        let rule_query = r#"
            SELECT * FROM pricing_rules
            WHERE is_active = 1
              AND (variant_id = ?1 OR variant_id IS NULL)
              AND price_list_id = ?2
            ORDER BY priority DESC
        "#;

        if let Ok(rule_rows) = sqlx::query(rule_query).bind(&variant_id).bind(&pl_id).fetch_all(&pool).await {
            let mut final_price = price;
            for r in rule_rows {
                let valid_from: Option<String> = r.get("valid_from");
                let valid_to: Option<String> = r.get("valid_to");
                if let Some(from) = valid_from { if from.as_str() > now.as_str() { continue; } }
                if let Some(to) = valid_to { if to.as_str() < now.as_str() { continue; } }

                let discount_type: String = r.get("discount_type");
                let discount_val_str: String = r.get("discount_value");
                if let Ok(discount_val) = discount_val_str.parse::<f64>() {
                    if discount_type == "PERCENTAGE" {
                        final_price -= final_price * (discount_val / 100.0);
                    } else if discount_type == "FIXED" {
                        final_price = (final_price - discount_val).max(0.0);
                    }
                    let stackable: Option<bool> = r.get("stackable");
                    if stackable != Some(true) {
                        break;
                    }
                }
            }
            return Some(final_price);
        }
    }

    Some(price)
}

async fn check_list_and_resolve(
    pool: &SqlitePool,
    row: &sqlx::sqlite::SqliteRow,
    now: &str,
    variant_id: &str,
    unit_id: &Option<String>,
    is_base_unit: bool,
    quantity: i32,
) -> Option<(f64, String)> {
    let id: String = row.get("id");
    let valid_from: Option<String> = row.get("valid_from");
    let valid_to: Option<String> = row.get("valid_to");

    if let Some(from) = valid_from { if from.as_str() > now { return None; } }
    if let Some(to) = valid_to { if to.as_str() < now { return None; } }

    let item_query = r#"
        SELECT price FROM price_items
        WHERE price_list_id = ?1
          AND variant_id = ?2
          AND (selling_unit_id = ?3 OR (selling_unit_id IS NULL AND ?4 = 1) OR selling_unit_id IS NULL)
          AND min_quantity <= ?5
        ORDER BY min_quantity DESC, price ASC
        LIMIT 1
    "#;

    if let Ok(Some(item_row)) = sqlx::query(item_query)
        .bind(&id)
        .bind(variant_id)
        .bind(unit_id)
        .bind(is_base_unit)
        .bind(quantity)
        .fetch_optional(pool).await {
        let price_str: String = item_row.get("price");
        if let Ok(price) = price_str.parse::<f64>() {
            return Some((price, id));
        }
    }
    None
}

pub async fn get_all_pricing(app: &AppHandle, _state: &PricingState) -> PosPricingData {
    let pool = match get_db_pool(app).await {
        Ok(p) => p,
        Err(_) => return PosPricingData { lists: vec![], items: vec![], allocations: HashMap::new(), rules: vec![], bundles: vec![] },
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

    let rules = sqlx::query("SELECT * FROM pricing_rules").fetch_all(&pool).await.unwrap_or_default().into_iter().map(|r| ServerPricingRuleItem {
        id: r.get("id"), name: r.get("name"), description: r.get("description"), price_list_id: r.get("price_list_id"), variant_id: r.get("variant_id"), category_id: r.get("category_id"), conditions: r.get("conditions"), discount_type: r.get("discount_type"), discount_value: r.get("discount_value"), stackable: r.get("stackable"), priority: r.get("priority"), max_usage: r.get("max_usage"), usage_count: r.get("usage_count"), is_active: r.get("is_active"), valid_from: r.get("valid_from"), valid_to: r.get("valid_to"), updated_at: r.get("updated_at"),
    }).collect();

    let mut bundle_items_map: HashMap<String, Vec<ServerPricingBundleItem>> = HashMap::new();
    if let Ok(bi_rows) = sqlx::query("SELECT * FROM pricing_bundle_items").fetch_all(&pool).await {
        for r in bi_rows {
            let bundle_id: String = r.get("bundle_id");
            bundle_items_map.entry(bundle_id.clone()).or_default().push(ServerPricingBundleItem {
                id: r.get("id"), bundle_id, variant_id: r.get("variant_id"), quantity: r.get("quantity"), item_role: r.get("item_role"), price_override: r.get("price_override"),
            });
        }
    }

    let bundles = sqlx::query("SELECT * FROM pricing_bundles").fetch_all(&pool).await.unwrap_or_default().into_iter().map(|r| {
        let id: String = r.get("id");
        let items = bundle_items_map.get(&id).cloned().unwrap_or_default();
        ServerPricingBundle {
            id, name: r.get("name"), code: r.get("code"), description: r.get("description"), bundle_type: r.get("bundle_type"), bundle_price: r.get("bundle_price"), buy_quantity: r.get("buy_quantity"), get_quantity: r.get("get_quantity"), get_discount_type: r.get("get_discount_type"), get_discount_value: r.get("get_discount_value"), savings_label: r.get("savings_label"), image_url: r.get("image_url"), is_active: r.get("is_active"), valid_from: r.get("valid_from"), valid_to: r.get("valid_to"), updated_at: r.get("updated_at"), items,
        }
    }).collect();

    PosPricingData { lists, items, allocations, rules, bundles }
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
