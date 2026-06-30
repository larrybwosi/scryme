use crate::commands::{log_activity, serde_json_to_string};
use crate::error::{BackendError, BackendResult};
use crate::models::{Ingredient, RestockData};
use chrono::Utc;
use sqlx::SqlitePool;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub async fn get_ingredients(pool: State<'_, SqlitePool>) -> BackendResult<Vec<Ingredient>> {
    sqlx::query_as::<_, Ingredient>("SELECT * FROM ingredients ORDER BY name ASC")
        .fetch_all(&*pool)
        .await
        .map_err(BackendError::from)
}

#[tauri::command]
pub async fn create_ingredient(
    pool: State<'_, SqlitePool>,
    user_id: String,
    mut ingredient: Ingredient,
) -> BackendResult<Ingredient> {
    ingredient.id = Uuid::new_v4().to_string();
    ingredient.created_at = Utc::now();
    ingredient.updated_at = Utc::now();

    // 1. Start a transaction for atomicity
    let mut tx = pool.begin().await?;

    // Check if category exists if one is provided
    if let Some(ref cat_id) = ingredient.category_id {
        let exists: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM bakery_categories WHERE id = ?")
            .bind(cat_id)
            .fetch_one(&mut *tx)
            .await?;

        if exists.0 == 0 {
            // If category doesn't exist locally, we clear it to avoid FK error
            // Downstream sync will eventually fix it
            ingredient.category_id = None;
        }
    }

    // 2. Insert into ingredients (including stocking_unit_id and units_per_container)
    sqlx::query(
        "INSERT INTO ingredients (
            id, name, sku, category_id, current_stock, reorder_level, max_stock, 
            unit_id, stocking_unit_id, units_per_container, unit_price, organization_id, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&ingredient.id)
    .bind(&ingredient.name)
    .bind(&ingredient.sku)
    .bind(&ingredient.category_id)
    .bind(ingredient.current_stock)
    .bind(ingredient.reorder_level)
    .bind(ingredient.max_stock)
    .bind(&ingredient.unit_id)
    .bind(&ingredient.stocking_unit_id)   // Bound missing field
    .bind(ingredient.units_per_container) // Bound missing field
    .bind(ingredient.unit_price)
    .bind(&ingredient.organization_id)
    .bind(ingredient.created_at)
    .bind(ingredient.updated_at)
    .execute(&mut *tx)
    .await?;

    // 3. Log activity (Runs safely outside or inside; passed &pool here assuming standard implementation)
    let _ = log_activity(
        &pool,
        user_id,
        "CREATE",
        "INGREDIENT",
        &ingredient.id,
        Some(format!("Created ingredient {}", ingredient.name)),
    )
    .await;

    // 4. Insert into sync queue inside the same transaction
    sqlx::query("INSERT INTO sync_queue (id, action, entity_type, entity_id, payload) VALUES (?, ?, ?, ?, ?)")
        .bind(Uuid::new_v4().to_string())
        .bind("CREATE")
        .bind("INGREDIENT")
        .bind(&ingredient.id)
        .bind(serde_json_to_string(&ingredient)?)
        .execute(&mut *tx)
        .await?;

    // 5. Commit everything if all steps succeeded
    tx.commit().await?;

    Ok(ingredient)
}

#[tauri::command]
pub async fn update_ingredient(
    pool: State<'_, SqlitePool>,
    user_id: String,
    ingredient: serde_json::Value,
) -> BackendResult<()> {
    let id = ingredient["id"]
        .as_str()
        .ok_or_else(|| BackendError::Validation("Missing ingredient ID".to_string()))?;
    let name = ingredient["name"].as_str().unwrap_or("Unknown Ingredient");

    sqlx::query(
        "UPDATE ingredients SET
         name = COALESCE(?, name),
         sku = COALESCE(?, sku),
         category_id = COALESCE(?, category_id),
         current_stock = COALESCE(?, current_stock),
         reorder_level = COALESCE(?, reorder_level),
         max_stock = COALESCE(?, max_stock),
         unit_id = COALESCE(?, unit_id),
         unit_price = COALESCE(?, unit_price),
         updated_at = ?
         WHERE id = ?",
    )
    .bind(ingredient.get("name").and_then(|v| v.as_str()))
    .bind(ingredient.get("sku").and_then(|v| v.as_str()))
    .bind(ingredient.get("categoryId").and_then(|v| v.as_str()))
    .bind(ingredient.get("currentStock").and_then(|v| v.as_f64()))
    .bind(ingredient.get("reorderLevel").and_then(|v| v.as_f64()))
    .bind(ingredient.get("maxStock").and_then(|v| v.as_f64()))
    .bind(ingredient.get("unitId").and_then(|v| v.as_str()))
    .bind(ingredient.get("unitPrice").and_then(|v| v.as_f64()))
    .bind(Utc::now())
    .bind(id)
    .execute(&*pool)
    .await?;

    let _ = log_activity(
        &pool,
        user_id,
        "UPDATE",
        "INGREDIENT",
        id,
        Some(format!("Updated ingredient {}", name)),
    )
    .await;

    sqlx::query("INSERT INTO sync_queue (id, action, entity_type, entity_id, payload) VALUES (?, ?, ?, ?, ?)")
        .bind(Uuid::new_v4().to_string())
        .bind("UPDATE")
        .bind("INGREDIENT")
        .bind(id)
        .bind(serde_json_to_string(&ingredient)?)
        .execute(&*pool)
        .await?;

    Ok(())
}

#[tauri::command]
pub async fn delete_ingredient(
    pool: State<'_, SqlitePool>,
    user_id: String,
    id: String,
) -> BackendResult<()> {
    sqlx::query("DELETE FROM ingredients WHERE id = ?")
        .bind(&id)
        .execute(&*pool)
        .await?;

    let _ = log_activity(
        &pool,
        user_id,
        "DELETE",
        "INGREDIENT",
        &id,
        Some("Deleted ingredient".to_string()),
    )
    .await;

    sqlx::query("INSERT INTO sync_queue (id, action, entity_type, entity_id, payload) VALUES (?, ?, ?, ?, ?)")
        .bind(Uuid::new_v4().to_string())
        .bind("DELETE")
        .bind("INGREDIENT")
        .bind(&id)
        .bind("{}")
        .execute(&*pool)
        .await?;

    Ok(())
}

#[tauri::command]
pub async fn restock_inventory(
    pool: State<'_, SqlitePool>,
    user_id: String,
    data: RestockData,
) -> BackendResult<()> {
    let now = Utc::now();

    // Update local ingredient stock
    // In our local model, variant_id maps to ingredient.id
    sqlx::query(
        "UPDATE ingredients SET current_stock = current_stock + ?, last_restocked = ?, updated_at = ? WHERE id = ?"
    )
    .bind(data.unit_quantity)
    .bind(now)
    .bind(now)
    .bind(&data.variant_id)
    .execute(&*pool)
    .await?;

    let _ = log_activity(
        &pool,
        user_id,
        "RESTOCK",
        "INGREDIENT",
        &data.variant_id,
        Some(format!("Restocked {} units", data.unit_quantity)),
    )
    .await;

    // Queue for sync
    sqlx::query("INSERT INTO sync_queue (id, action, entity_type, entity_id, payload) VALUES (?, ?, ?, ?, ?)")
        .bind(Uuid::new_v4().to_string())
        .bind("CREATE") // The API uses POST for restock, which maps to CREATE in our sync logic
        .bind("RESTOCK")
        .bind(&data.variant_id)
        .bind(serde_json_to_string(&data)?)
        .execute(&*pool)
        .await?;

    Ok(())
}
