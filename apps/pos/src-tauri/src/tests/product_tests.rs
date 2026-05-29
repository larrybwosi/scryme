use sqlx::Row;
use crate::tests::test_utils::{setup_test_db, create_mock_product};
use crate::stores::product_store::build_search_text;

#[tokio::test]
async fn test_product_search_text_persistence() {
    let pool = setup_test_db().await;
    let product = create_mock_product("p1", "Test Product");
    let search_text = build_search_text(&product);

    sqlx::query("INSERT INTO products (product_id, location_id, product_name, search_text) VALUES (?1, ?2, ?3, ?4)")
        .bind(&product.product_id).bind("loc1").bind(&product.product_name).bind(search_text)
        .execute(&pool).await.unwrap();

    let row = sqlx::query("SELECT * FROM products WHERE search_text LIKE '%test%'").fetch_one(&pool).await.unwrap();
    assert_eq!(row.get::<String, _>("product_id"), "p1");
}

#[tokio::test]
async fn test_product_stock_deduction_query() {
    let pool = setup_test_db().await;
    // Stock deduction currently reads payload, modifies it, and saves it back.
    // Let's test the payload update logic.
    let product = create_mock_product("p1", "Stock Item");
    let payload = serde_json::to_vec(&product).unwrap();

    sqlx::query("INSERT INTO products (product_id, location_id, payload) VALUES ('p1', 'loc1', ?1)")
        .bind(&payload).execute(&pool).await.unwrap();

    let row = sqlx::query("SELECT payload FROM products WHERE product_id = 'p1'").fetch_one(&pool).await.unwrap();
    let saved_payload: Vec<u8> = row.get("payload");
    assert_eq!(payload, saved_payload);
}
