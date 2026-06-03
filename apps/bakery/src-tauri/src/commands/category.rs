use crate::commands::{log_activity, serde_json_to_string};
use crate::error::{BackendError, BackendResult};
use crate::models::BakeryCategory;
use chrono::Utc;
use sqlx::SqlitePool;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub async fn get_categories(pool: State<'_, SqlitePool>) -> BackendResult<Vec<BakeryCategory>> {
    sqlx::query_as::<_, BakeryCategory>("SELECT * FROM bakery_categories ORDER BY name ASC")
        .fetch_all(&*pool)
        .await
        .map_err(BackendError::from)
}

#[tauri::command]
pub async fn create_category(
    pool: State<'_, SqlitePool>,
    user_id: String,
    mut category: BakeryCategory,
) -> BackendResult<BakeryCategory> {
    category.id = Uuid::new_v4().to_string();
    category.created_at = Utc::now();
    category.updated_at = Utc::now();

    sqlx::query(
        "INSERT INTO bakery_categories (id, name, description, organization_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(&category.id)
    .bind(&category.name)
    .bind(&category.description)
    .bind(&category.organization_id)
    .bind(category.created_at)
    .bind(category.updated_at)
    .execute(&*pool)
    .await?;

    let _ = log_activity(
        &pool,
        user_id,
        "CREATE",
        "CATEGORY",
        &category.id,
        Some(format!("Created category {}", category.name)),
    )
    .await;

    sqlx::query("INSERT INTO sync_queue (id, action, entity_type, entity_id, payload) VALUES (?, ?, ?, ?, ?)")
        .bind(Uuid::new_v4().to_string())
        .bind("CREATE")
        .bind("CATEGORY")
        .bind(&category.id)
        .bind(serde_json_to_string(&category)?)
        .execute(&*pool)
        .await?;

    Ok(category)
}

#[tauri::command]
pub async fn update_category(
    pool: State<'_, SqlitePool>,
    user_id: String,
    category: serde_json::Value,
) -> BackendResult<()> {
    let id = category["id"]
        .as_str()
        .ok_or_else(|| BackendError::Validation("Missing category ID".to_string()))?;
    let name = category["name"].as_str().unwrap_or("Unknown Category");

    sqlx::query(
        "UPDATE bakery_categories SET
         name = COALESCE(?, name),
         description = COALESCE(?, description),
         updated_at = ?
         WHERE id = ?",
    )
    .bind(category.get("name").and_then(|v| v.as_str()))
    .bind(category.get("description").and_then(|v| v.as_str()))
    .bind(Utc::now())
    .bind(id)
    .execute(&*pool)
    .await?;

    let _ = log_activity(
        &pool,
        user_id,
        "UPDATE",
        "CATEGORY",
        id,
        Some(format!("Updated category {}", name)),
    )
    .await;

    sqlx::query("INSERT INTO sync_queue (id, action, entity_type, entity_id, payload) VALUES (?, ?, ?, ?, ?)")
        .bind(Uuid::new_v4().to_string())
        .bind("UPDATE")
        .bind("CATEGORY")
        .bind(id)
        .bind(serde_json_to_string(&category)?)
        .execute(&*pool)
        .await?;

    Ok(())
}

#[tauri::command]
pub async fn delete_category(
    pool: State<'_, SqlitePool>,
    user_id: String,
    id: String,
) -> BackendResult<()> {
    sqlx::query("DELETE FROM bakery_categories WHERE id = ?")
        .bind(&id)
        .execute(&*pool)
        .await?;

    let _ = log_activity(
        &pool,
        user_id,
        "DELETE",
        "CATEGORY",
        &id,
        Some("Deleted category".to_string()),
    )
    .await;

    sqlx::query("INSERT INTO sync_queue (id, action, entity_type, entity_id, payload) VALUES (?, ?, ?, ?, ?)")
        .bind(Uuid::new_v4().to_string())
        .bind("DELETE")
        .bind("CATEGORY")
        .bind(&id)
        .bind("{}")
        .execute(&*pool)
        .await?;

    Ok(())
}
