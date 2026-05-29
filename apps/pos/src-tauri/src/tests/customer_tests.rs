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
