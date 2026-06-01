use crate::commands::{log_activity, serde_json_to_string};
use crate::error::{BackendError, BackendResult};
use crate::models::Template;
use chrono::Utc;
use sqlx::SqlitePool;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub async fn get_templates(pool: State<'_, SqlitePool>) -> BackendResult<Vec<Template>> {
    sqlx::query_as::<_, Template>("SELECT * FROM templates ORDER BY name ASC")
        .fetch_all(&*pool)
        .await
        .map_err(BackendError::from)
}

#[tauri::command]
pub async fn create_template(
    pool: State<'_, SqlitePool>,
    user_id: String,
    mut template: Template,
) -> BackendResult<Template> {
    template.id = Uuid::new_v4().to_string();
    template.created_at = Utc::now();
    template.updated_at = Utc::now();

    sqlx::query(
        "INSERT INTO templates (id, name, description, recipe_id, quantity, is_active, organization_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&template.id)
    .bind(&template.name)
    .bind(&template.description)
    .bind(&template.recipe_id)
    .bind(template.quantity)
    .bind(template.is_active)
    .bind(&template.organization_id)
    .bind(template.created_at)
    .bind(template.updated_at)
    .execute(&*pool)
    .await?;

    let _ = log_activity(
        &pool,
        user_id,
        "CREATE",
        "TEMPLATE",
        &template.id,
        Some(format!("Created template {}", template.name)),
    )
    .await;

    sqlx::query("INSERT INTO sync_queue (id, action, entity_type, entity_id, payload) VALUES (?, ?, ?, ?, ?)")
        .bind(Uuid::new_v4().to_string())
        .bind("CREATE")
        .bind("TEMPLATE")
        .bind(&template.id)
        .bind(serde_json_to_string(&template)?)
        .execute(&*pool)
        .await?;

    Ok(template)
}

#[tauri::command]
pub async fn update_template(
    pool: State<'_, SqlitePool>,
    user_id: String,
    template: serde_json::Value,
) -> BackendResult<()> {
    let id = template["id"]
        .as_str()
        .ok_or_else(|| BackendError::Validation("Missing template ID".to_string()))?;
    let name = template["name"].as_str().unwrap_or("Unknown Template");

    sqlx::query(
        "UPDATE templates SET
         name = COALESCE(?, name),
         description = COALESCE(?, description),
         recipe_id = COALESCE(?, recipe_id),
         quantity = COALESCE(?, quantity),
         is_active = COALESCE(?, is_active),
         updated_at = ?
         WHERE id = ?",
    )
    .bind(template.get("name").and_then(|v| v.as_str()))
    .bind(template.get("description").and_then(|v| v.as_str()))
    .bind(template.get("recipeId").and_then(|v| v.as_str()))
    .bind(template.get("quantity").and_then(|v| v.as_f64()))
    .bind(template.get("isActive").and_then(|v| v.as_bool()))
    .bind(Utc::now())
    .bind(id)
    .execute(&*pool)
    .await?;

    let _ = log_activity(
        &pool,
        user_id,
        "UPDATE",
        "TEMPLATE",
        id,
        Some(format!("Updated template {}", name)),
    )
    .await;

    sqlx::query("INSERT INTO sync_queue (id, action, entity_type, entity_id, payload) VALUES (?, ?, ?, ?, ?)")
        .bind(Uuid::new_v4().to_string())
        .bind("UPDATE")
        .bind("TEMPLATE")
        .bind(id)
        .bind(serde_json_to_string(&template)?)
        .execute(&*pool)
        .await?;

    Ok(())
}

#[tauri::command]
pub async fn delete_template(
    pool: State<'_, SqlitePool>,
    user_id: String,
    id: String,
) -> BackendResult<()> {
    sqlx::query("DELETE FROM templates WHERE id = ?")
        .bind(&id)
        .execute(&*pool)
        .await?;

    let _ = log_activity(
        &pool,
        user_id,
        "DELETE",
        "TEMPLATE",
        &id,
        Some("Deleted template".to_string()),
    )
    .await;

    sqlx::query("INSERT INTO sync_queue (id, action, entity_type, entity_id, payload) VALUES (?, ?, ?, ?, ?)")
        .bind(Uuid::new_v4().to_string())
        .bind("DELETE")
        .bind("TEMPLATE")
        .bind(&id)
        .bind("{}")
        .execute(&*pool)
        .await?;

    Ok(())
}
