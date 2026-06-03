use crate::commands::{log_activity, serde_json_to_string};
use crate::error::{BackendError, BackendResult};
use crate::models::{SystemUnit, OrganizationUnit};
use chrono::Utc;
use sqlx::SqlitePool;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub async fn get_system_units(pool: State<'_, SqlitePool>) -> BackendResult<Vec<SystemUnit>> {
    sqlx::query_as::<_, SystemUnit>("SELECT * FROM system_units WHERE is_active = 1")
        .fetch_all(&*pool)
        .await
        .map_err(BackendError::from)
}

#[tauri::command]
pub async fn get_organization_units(
    pool: State<'_, SqlitePool>,
    organization_id: String,
) -> BackendResult<Vec<OrganizationUnit>> {
    sqlx::query_as::<_, OrganizationUnit>(
        "SELECT * FROM organization_units WHERE organization_id = ? AND is_active = 1",
    )
    .bind(organization_id)
    .fetch_all(&*pool)
    .await
    .map_err(BackendError::from)
}

#[tauri::command]
pub async fn create_organization_unit(
    pool: State<'_, SqlitePool>,
    user_id: String,
    mut unit: OrganizationUnit,
) -> BackendResult<OrganizationUnit> {
    unit.id = Uuid::new_v4().to_string();
    unit.created_at = Utc::now();
    unit.updated_at = Utc::now();

    sqlx::query(
        "INSERT INTO organization_units (id, organization_id, name, symbol, abbreviation, plural_name, \"type\", category, description, is_active, base_system_unit_id, conversion_factor, conversion_offset, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&unit.id)
    .bind(&unit.organization_id)
    .bind(&unit.name)
    .bind(&unit.symbol)
    .bind(&unit.abbreviation)
    .bind(&unit.plural_name)
    .bind(&unit.r#type)
    .bind(&unit.category)
    .bind(&unit.description)
    .bind(unit.is_active)
    .bind(&unit.base_system_unit_id)
    .bind(unit.conversion_factor)
    .bind(unit.conversion_offset)
    .bind(unit.created_at)
    .bind(unit.updated_at)
    .execute(&*pool)
    .await?;

    let _ = log_activity(
        &pool,
        user_id,
        "CREATE",
        "UNIT",
        &unit.id,
        Some(format!("Created custom unit {}", unit.name)),
    )
    .await;

    sqlx::query("INSERT INTO sync_queue (id, action, entity_type, entity_id, payload) VALUES (?, ?, ?, ?, ?)")
        .bind(Uuid::new_v4().to_string())
        .bind("CREATE")
        .bind("UNIT")
        .bind(&unit.id)
        .bind(serde_json_to_string(&unit)?)
        .execute(&*pool)
        .await?;

    Ok(unit)
}

#[tauri::command]
pub async fn update_organization_unit(
    pool: State<'_, SqlitePool>,
    user_id: String,
    unit: OrganizationUnit,
) -> BackendResult<()> {
    sqlx::query(
        "UPDATE organization_units SET name = ?, symbol = ?, abbreviation = ?, plural_name = ?, \"type\" = ?, category = ?, description = ?, is_active = ?, base_system_unit_id = ?, conversion_factor = ?, conversion_offset = ?, updated_at = ?
         WHERE id = ?"
    )
    .bind(&unit.name)
    .bind(&unit.symbol)
    .bind(&unit.abbreviation)
    .bind(&unit.plural_name)
    .bind(&unit.r#type)
    .bind(&unit.category)
    .bind(&unit.description)
    .bind(unit.is_active)
    .bind(&unit.base_system_unit_id)
    .bind(unit.conversion_factor)
    .bind(unit.conversion_offset)
    .bind(Utc::now())
    .bind(&unit.id)
    .execute(&*pool)
    .await?;

    let _ = log_activity(
        &pool,
        user_id,
        "UPDATE",
        "UNIT",
        &unit.id,
        Some(format!("Updated custom unit {}", unit.name)),
    )
    .await;

    sqlx::query("INSERT INTO sync_queue (id, action, entity_type, entity_id, payload) VALUES (?, ?, ?, ?, ?)")
        .bind(Uuid::new_v4().to_string())
        .bind("UPDATE")
        .bind("UNIT")
        .bind(&unit.id)
        .bind(serde_json_to_string(&unit)?)
        .execute(&*pool)
        .await?;

    Ok(())
}

#[tauri::command]
pub async fn delete_organization_unit(
    pool: State<'_, SqlitePool>,
    user_id: String,
    id: String,
) -> BackendResult<()> {
    sqlx::query("UPDATE organization_units SET is_active = 0, updated_at = ? WHERE id = ?")
        .bind(Utc::now())
        .bind(&id)
        .execute(&*pool)
        .await?;

    let _ = log_activity(
        &pool,
        user_id,
        "DELETE",
        "UNIT",
        &id,
        Some("Deactivated custom unit".to_string()),
    )
    .await;

    sqlx::query("INSERT INTO sync_queue (id, action, entity_type, entity_id, payload) VALUES (?, ?, ?, ?, ?)")
        .bind(Uuid::new_v4().to_string())
        .bind("DELETE")
        .bind("UNIT")
        .bind(&id)
        .bind("{}")
        .execute(&*pool)
        .await?;

    Ok(())
}
