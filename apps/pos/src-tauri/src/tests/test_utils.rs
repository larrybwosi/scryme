use sqlx::SqlitePool;
use crate::models::{PosCustomer, PosProduct, Variant};

pub async fn setup_test_db() -> SqlitePool {
    let pool = SqlitePool::connect("sqlite::memory:").await.unwrap();

    // Products
    sqlx::query(r#"
        CREATE TABLE products (
            product_id TEXT,
            location_id TEXT,
            category TEXT,
            product_name TEXT,
            search_text TEXT,
            payload BLOB,
            PRIMARY KEY (product_id, location_id)
        )
    "#).execute(&pool).await.unwrap();

    // Customers
    sqlx::query(r#"
        CREATE TABLE customers (
            id TEXT PRIMARY KEY,
            name TEXT,
            phone TEXT,
            email TEXT,
            search_text TEXT,
            payload BLOB
        )
    "#).execute(&pool).await.unwrap();

    // Price Lists
    sqlx::query(r#"
        CREATE TABLE price_lists (
            id TEXT PRIMARY KEY,
            code TEXT,
            priority INTEGER,
            is_global BOOLEAN,
            is_active BOOLEAN,
            valid_from TEXT,
            valid_to TEXT,
            updated_at TEXT
        )
    "#).execute(&pool).await.unwrap();

    // Price Items
    sqlx::query(r#"
        CREATE TABLE price_items (
            id TEXT PRIMARY KEY,
            price_list_id TEXT,
            variant_id TEXT,
            selling_unit_id TEXT,
            min_quantity INTEGER,
            price TEXT,
            updated_at TEXT
        )
    "#).execute(&pool).await.unwrap();

    // Customer Allocations
    sqlx::query(r#"
        CREATE TABLE customer_allocations (
            customer_id TEXT,
            price_list_id TEXT,
            PRIMARY KEY (customer_id, price_list_id)
        )
    "#).execute(&pool).await.unwrap();

    // Audit Logs
    sqlx::query(r#"
        CREATE TABLE audit_logs (
            id TEXT PRIMARY KEY,
            timestamp TEXT,
            level TEXT,
            action TEXT,
            actor_id TEXT,
            actor_name TEXT,
            location_id TEXT,
            device_id TEXT,
            details TEXT
        )
    "#).execute(&pool).await.unwrap();

    pool
}

pub fn create_mock_customer(id: &str, name: &str) -> PosCustomer {
    PosCustomer {
        id: id.to_string(),
        name: name.to_string(),
        email: Some(format!("{}@example.com", id)),
        phone: Some("123456789".to_string()),
        customer_type: Some("B2C".to_string()),
        company: None,
        loyalty_points: Some(0.0),
        city: None,
        primary_address: None,
        updated_at: None,
        medical_history: None,
        allergies: None,
        chronic_conditions: None,
        insurance_provider: None,
        policy_number: None,
    }
}

pub fn create_mock_product(id: &str, name: &str) -> PosProduct {
    PosProduct {
        product_id: id.to_string(),
        product_name: name.to_string(),
        category: "Test".to_string(),
        image_url: None,
        total_stock: Some(100),
        variants: vec![
            Variant {
                variant_id: format!("v_{}", id),
                variant_name: format!("{} Variant", name),
                sku: format!("SKU_{}", id),
                barcode: None,
                stock: 10,
                sellable_units: vec![],
                batches: None,
            }
        ],
        active_ingredient: None,
    }
}
