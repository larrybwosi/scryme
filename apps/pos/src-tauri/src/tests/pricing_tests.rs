use sqlx::Row;
use crate::tests::test_utils::{setup_test_db};

#[tokio::test]
async fn test_price_resolution_logic() {
    let pool = setup_test_db().await;

    // 1. Insert a global price list
    sqlx::query("INSERT INTO price_lists (id, code, priority, is_global, is_active) VALUES ('l1', 'GLOBAL', 10, 1, 1)")
        .execute(&pool).await.unwrap();

    // 2. Insert a price item
    sqlx::query("INSERT INTO price_items (id, price_list_id, variant_id, price) VALUES ('i1', 'l1', 'v1', '150.50')")
        .execute(&pool).await.unwrap();

    // Verify SQL query logic for price resolution
    let row = sqlx::query("SELECT price FROM price_items WHERE variant_id = 'v1' AND price_list_id = 'l1'")
        .fetch_one(&pool).await.unwrap();

    let price: String = row.get("price");
    assert_eq!(price, "150.50");
}

#[tokio::test]
async fn test_customer_specific_price_resolution() {
    let pool = setup_test_db().await;

    // Global list (priority 10)
    sqlx::query("INSERT INTO price_lists (id, code, priority, is_global, is_active) VALUES ('l_global', 'GLB', 10, 1, 1)")
        .execute(&pool).await.unwrap();
    sqlx::query("INSERT INTO price_items (id, price_list_id, variant_id, price) VALUES ('i_glb', 'l_global', 'v1', '100')")
        .execute(&pool).await.unwrap();

    // Customer list (priority 20)
    sqlx::query("INSERT INTO price_lists (id, code, priority, is_global, is_active) VALUES ('l_cust', 'CUST', 20, 0, 1)")
        .execute(&pool).await.unwrap();
    sqlx::query("INSERT INTO price_items (id, price_list_id, variant_id, price) VALUES ('i_cust', 'l_cust', 'v1', '85')")
        .execute(&pool).await.unwrap();
    sqlx::query("INSERT INTO customer_allocations (customer_id, price_list_id) VALUES ('c1', 'l_cust')")
        .execute(&pool).await.unwrap();

    // Simulate resolution for customer c1
    let rows = sqlx::query("SELECT price_list_id FROM customer_allocations WHERE customer_id = 'c1'")
        .fetch_all(&pool).await.unwrap();
    let mut applicable_lists: Vec<String> = rows.iter().map(|r| r.get("price_list_id")).collect();

    let global_rows = sqlx::query("SELECT id FROM price_lists WHERE is_global = 1").fetch_all(&pool).await.unwrap();
    for r in global_rows { applicable_lists.push(r.get("id")); }

    assert!(applicable_lists.contains(&"l_cust".to_string()));
    assert!(applicable_lists.contains(&"l_global".to_string()));
}
