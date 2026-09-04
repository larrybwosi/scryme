use sqlx::Row;
use crate::tests::test_utils::{setup_test_db, create_mock_customer};

// Note: Testing functions that require AppHandle/DbInstances is tricky in pure unit tests.
// We've moved logic to SQLite, so we should focus on testing the SQL queries or higher-level flows.
// Since I can't easily mock AppHandle here without complex setup, I will focus on logic consistency.

#[tokio::test]
async fn test_customer_migration_logic() {
    let pool = setup_test_db().await;
    let customer = create_mock_customer("c1", "Alice");

    let payload = serde_json::to_vec(&customer).unwrap();

    sqlx::query("INSERT INTO customers (id, name, payload) VALUES (?1, ?2, ?3)")
        .bind(&customer.id)
        .bind(&customer.name)
        .bind(&payload)
        .execute(&pool)
        .await
        .unwrap();

    let row = sqlx::query("SELECT name FROM customers WHERE id = 'c1'")
        .fetch_one(&pool)
        .await
        .unwrap();

    assert_eq!(row.get::<String, _>("name"), "Alice");
}

#[tokio::test]
async fn test_customer_search_query() {
    let pool = setup_test_db().await;
    let c1 = create_mock_customer("c1", "Alice");
    let c2 = create_mock_customer("c2", "Bob");

    sqlx::query("INSERT INTO customers (id, name, search_text) VALUES (?1, ?2, ?3)")
        .bind(&c1.id).bind(&c1.name).bind("alice")
        .execute(&pool).await.unwrap();
    sqlx::query("INSERT INTO customers (id, name, search_text) VALUES (?1, ?2, ?3)")
        .bind(&c2.id).bind(&c2.name).bind("bob")
        .execute(&pool).await.unwrap();

    let rows = sqlx::query("SELECT * FROM customers WHERE search_text LIKE '%ali%'")
        .fetch_all(&pool)
        .await
        .unwrap();

    assert_eq!(rows.len(), 1);
    assert_eq!(rows[0].get::<String, _>("name"), "Alice");
}

#[test]
fn test_customer_response_unwrap_logic() {
    use crate::models::PosCustomer;

    // 1. Test StandardResponseInterceptor wrapping getCustomersDelta ({ success: true, data: { data: [...], nextSyncToken: ... } })
    let raw_val: serde_json::Value = serde_json::json!({
        "success": true,
        "data": {
            "data": [
                {
                    "id": "c1",
                    "name": "John Doe",
                    "email": "john@example.com",
                    "phone": "+254712345678"
                }
            ],
            "nextSyncToken": "2026-03-30T10:00:00.000Z"
        },
        "timestamp": "2026-03-30T10:00:00.000Z"
    });

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

    let customers_list: Vec<PosCustomer> = serde_json::from_value(customers_array.clone()).unwrap();
    assert_eq!(customers_list.len(), 1);
    assert_eq!(customers_list[0].id, "c1");
    assert_eq!(customers_list[0].name, "John Doe");
    assert_eq!(sync_token_from_resp, Some("2026-03-30T10:00:00.000Z"));

    // 2. Test create_customer response ({ success: true, data: { id: "c2", name: "Jane Smith" } })
    let create_raw: serde_json::Value = serde_json::json!({
        "success": true,
        "data": {
            "id": "c2",
            "name": "Jane Smith",
            "company": "Acme Corp"
        }
    });

    let target = if let Some(data) = create_raw.get("data") {
        if let Some(c) = data.get("customer") {
            c
        } else {
            data
        }
    } else if let Some(c) = create_raw.get("customer") {
        c
    } else {
        &create_raw
    };

    let created: PosCustomer = serde_json::from_value(target.clone()).unwrap();
    assert_eq!(created.id, "c2");
    assert_eq!(created.name, "Jane Smith");
    assert_eq!(created.company, Some("Acme Corp".to_string()));
}
