use crate::commands::{log_activity, serde_json_to_string};
use crate::error::{BackendError, BackendResult};
use crate::models::{BakerySettings, Batch, BatchIngredient, BatchProcessLog, BatchQualityCheck, BatchTraceability};
use chrono::Utc;
use sqlx::SqlitePool;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub async fn get_batches(
    pool: State<'_, SqlitePool>,
) -> BackendResult<Vec<crate::models::FormattedBatch>> {
    let rows = sqlx::query(
        "SELECT b.*, r.name as recipe_name, r.yield_quantity, r.yield_unit
         FROM batches b
         LEFT JOIN recipes r ON b.recipe_id = r.id
         ORDER BY b.created_at DESC",
    )
    .fetch_all(&*pool)
    .await?;

    let batches = rows
        .into_iter()
        .map(|row| {
            use sqlx::Row;
            let yield_unit = row.get::<Option<String>, _>("yield_unit").unwrap_or_else(|| "units".to_string());
            crate::models::FormattedBatch {
                id: row.get("id"),
                batch_number: row.get("number"),
                name: row.get("name"),
                status: row.get("status"),
                planned_quantity: row.get("planned_quantity"),
                actual_quantity: row.get("actual_quantity"),
                production_date: row.try_get("planned_date").ok(),
                started_at: row.get("started_at"),
                completed_at: row.get("completed_at"),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
                recipe: crate::models::FormattedBatchRecipe {
                    id: row
                        .get::<Option<String>, _>("recipe_id")
                        .unwrap_or_default(),
                    name: row
                        .get::<Option<String>, _>("recipe_name")
                        .unwrap_or_else(|| "Unknown Formula".to_string()),
                    yield_quantity: row.get::<Option<f64>, _>("yield_quantity").unwrap_or(0.0),
                    yield_unit_id: yield_unit.clone(),
                },
                unit: crate::models::FormattedBatchUnit {
                    id: yield_unit.clone(),
                    name: "Units".to_string(), // Default name for offline
                    symbol: yield_unit,
                },
            }
        })
        .collect();

    Ok(batches)
}

#[tauri::command]
pub async fn create_batch(
    pool: State<'_, SqlitePool>,
    user_id: String,
    input: crate::models::CreateBatchInput,
) -> BackendResult<Batch> {
    let org_id = input
        .organization_id
        .unwrap_or_else(|| "local-org".to_string());

    let batch = Batch {
        id: Uuid::new_v4().to_string(),
        number: "".to_string(), // Will be generated
        name: input.name.unwrap_or_else(|| "New Batch".to_string()),
        status: input.status.unwrap_or_else(|| "PLANNED".to_string()),
        recipe_id: input.recipe_id,
        planned_date: input.date,
        planned_quantity: input.planned_quantity,
        actual_quantity: None,
        completed_quantity: None,
        started_at: None,
        completed_at: None,
        cancelled_at: None,
        organization_id: org_id,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    create_batch_inner(&*pool, user_id, batch).await
}

pub async fn generate_batch_number(pool: &SqlitePool, organization_id: &str) -> BackendResult<String> {
    let settings = sqlx::query_as::<_, BakerySettings>(
        "SELECT * FROM bakery_settings WHERE organization_id = ? OR organization_id = 'local-org' LIMIT 1"
    )
    .bind(organization_id)
    .fetch_one(pool)
    .await?;

    let prefix = settings.batch_prefix.unwrap_or_else(|| "BAT".to_string());
    let separator = settings.batch_separator.unwrap_or_else(|| "-".to_string());
    let date_format = settings
        .batch_date_format
        .unwrap_or_else(|| "YYYYMMDD".to_string());
    let sequence_length = settings
        .batch_sequence
        .as_ref()
        .and_then(|s| s.parse::<usize>().ok())
        .unwrap_or(4);

    let now = Utc::now();
    let date_str = match date_format.as_str() {
        "YYYYMMDD" => now.format("%Y%m%d").to_string(),
        "YYMM" => now.format("%y%m").to_string(),
        _ => "".to_string(),
    };

    let (count,): (i64,) = sqlx::query_as("SELECT COUNT(*) FROM batches WHERE organization_id = ?")
        .bind(organization_id)
        .fetch_one(pool)
        .await?;

    let sequence = format!("{:0>width$}", count + 1, width = sequence_length);

    let mut parts = Vec::new();
    parts.push(prefix);
    if !date_str.is_empty() {
        parts.push(date_str);
    }
    parts.push(sequence);

    Ok(parts.join(&separator))
}

pub async fn create_batch_inner(
    pool: &SqlitePool,
    user_id: String,
    mut batch: Batch,
) -> BackendResult<Batch> {
    batch.id = Uuid::new_v4().to_string();
    batch.created_at = Utc::now();
    batch.updated_at = Utc::now();

    // Always generate the batch number, ignoring any manual input from the client
    batch.number = generate_batch_number(pool, &batch.organization_id).await?;

    sqlx::query(
        "INSERT INTO batches (id, number, name, status, recipe_id, planned_date, planned_quantity, organization_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&batch.id)
    .bind(&batch.number)
    .bind(&batch.name)
    .bind(&batch.status)
    .bind(&batch.recipe_id)
    .bind(batch.planned_date)
    .bind(batch.planned_quantity)
    .bind(&batch.organization_id)
    .bind(batch.created_at)
    .bind(batch.updated_at)
    .execute(pool)
    .await?;

    let _ = log_activity(
        pool,
        user_id,
        "CREATE",
        "BATCH",
        &batch.id,
        Some(format!("Created batch {}", batch.number)),
    )
    .await;

    sqlx::query("INSERT INTO sync_queue (id, action, entity_type, entity_id, payload) VALUES (?, ?, ?, ?, ?)")
        .bind(Uuid::new_v4().to_string())
        .bind("CREATE")
        .bind("BATCH")
        .bind(&batch.id)
        .bind(serde_json_to_string(&batch)?)
        .execute(pool)
        .await?;

    Ok(batch)
}

#[tauri::command]
pub async fn update_batch(
    pool: State<'_, SqlitePool>,
    user_id: String,
    input: serde_json::Value,
) -> BackendResult<()> {
    let id = input["id"]
        .as_str()
        .ok_or_else(|| BackendError::Validation("Missing batch ID".to_string()))?;
    let now = Utc::now();

    sqlx::query(
        "UPDATE batches SET planned_quantity = COALESCE(?, planned_quantity), actual_quantity = COALESCE(?, actual_quantity), status = COALESCE(?, status), name = COALESCE(?, name), updated_at = ? WHERE id = ?"
    )
    .bind(input.get("plannedQuantity").and_then(|v| v.as_f64()))
    .bind(input.get("actualQuantity").and_then(|v| v.as_f64()))
    .bind(input.get("status").and_then(|v| v.as_str()))
    .bind(input.get("notes").and_then(|v| v.as_str()).or_else(|| input.get("name").and_then(|v| v.as_str())))
    .bind(now)
    .bind(id)
    .execute(&*pool)
    .await?;

    let _ = log_activity(
        &pool,
        user_id,
        "UPDATE",
        "BATCH",
        id,
        Some("Updated batch details".to_string()),
    )
    .await;

    sqlx::query("INSERT INTO sync_queue (id, action, entity_type, entity_id, payload) VALUES (?, ?, ?, ?, ?)")
        .bind(Uuid::new_v4().to_string())
        .bind("UPDATE")
        .bind("BATCH")
        .bind(id)
        .bind(serde_json_to_string(&input)?)
        .execute(&*pool)
        .await?;

    Ok(())
}

#[tauri::command]
pub async fn update_batch_status(
    pool: State<'_, SqlitePool>,
    user_id: String,
    id: String,
    status: String,
) -> BackendResult<()> {
    let now = Utc::now();
    let mut query = String::from("UPDATE batches SET status = ?, updated_at = ?");

    if status == "IN_PROGRESS" {
        query.push_str(", started_at = ?");
    } else if status == "COMPLETED" {
        query.push_str(", completed_at = ?");
    } else if status == "CANCELLED" {
        query.push_str(", cancelled_at = ?");
    }

    query.push_str(" WHERE id = ?");

    let mut q = sqlx::query(&query).bind(&status).bind(now);

    if status == "IN_PROGRESS" || status == "COMPLETED" || status == "CANCELLED" {
        q = q.bind(now);
    }

    q.bind(&id).execute(&*pool).await?;

    let _ = log_activity(
        &pool,
        user_id,
        "UPDATE_STATUS",
        "BATCH",
        &id,
        Some(format!("Updated batch status to {}", status)),
    )
    .await;

    sqlx::query("INSERT INTO sync_queue (id, action, entity_type, entity_id, payload) VALUES (?, ?, ?, ?, ?)")
        .bind(Uuid::new_v4().to_string())
        .bind("UPDATE_STATUS")
        .bind("BATCH")
        .bind(&id)
        .bind(format!("{{\"status\": \"{}\"}}", status))
        .execute(&*pool)
        .await?;

    Ok(())
}

#[tauri::command]
pub async fn delete_batch(
    pool: State<'_, SqlitePool>,
    user_id: String,
    id: String,
) -> BackendResult<()> {
    sqlx::query("DELETE FROM batches WHERE id = ?")
        .bind(&id)
        .execute(&*pool)
        .await?;

    let _ = log_activity(
        &pool,
        user_id,
        "DELETE",
        "BATCH",
        &id,
        Some("Deleted batch".to_string()),
    )
    .await;

    sqlx::query("INSERT INTO sync_queue (id, action, entity_type, entity_id, payload) VALUES (?, ?, ?, ?, ?)")
        .bind(Uuid::new_v4().to_string())
        .bind("DELETE")
        .bind("BATCH")
        .bind(&id)
        .bind("{}")
        .execute(&*pool)
        .await?;

    Ok(())
}

#[tauri::command]
pub async fn get_batch_traceability(
    pool: State<'_, SqlitePool>,
    id: String,
) -> BackendResult<BatchTraceability> {
    let ingredients =
        sqlx::query_as::<_, BatchIngredient>("SELECT * FROM batch_ingredients WHERE batch_id = ?")
            .bind(&id)
            .fetch_all(&*pool)
            .await?;

    let process_logs = sqlx::query_as::<_, BatchProcessLog>(
        "SELECT * FROM batch_process_logs WHERE batch_id = ? ORDER BY timestamp ASC",
    )
    .bind(&id)
    .fetch_all(&*pool)
    .await?;

    let quality_checks = sqlx::query_as::<_, BatchQualityCheck>(
        "SELECT * FROM batch_quality_checks WHERE batch_id = ? ORDER BY timestamp ASC",
    )
    .bind(&id)
    .fetch_all(&*pool)
    .await?;

    Ok(BatchTraceability {
        ingredients,
        process_logs,
        quality_checks,
    })
}

#[tauri::command]
pub async fn get_overview(
    pool: State<'_, SqlitePool>,
    org_id: String,
) -> BackendResult<serde_json::Value> {
    let rows_result = sqlx::query(
        "SELECT b.*, r.name as recipe_name, r.yield_quantity, r.yield_unit
         FROM batches b
         LEFT JOIN recipes r ON b.recipe_id = r.id
         WHERE b.organization_id = ? OR b.organization_id = 'local-org'
         ORDER BY b.created_at DESC",
    )
    .bind(&org_id)
    .fetch_all(&*pool)
    .await;

    let rows = match rows_result {
        Ok(r) => r,
        Err(e) => {
            log::error!("Error fetching batches for overview: {}", e);
            Vec::new()
        }
    };

    let total_batches = rows.len() as i32;
    let active_batches = rows
        .iter()
        .filter(|r| {
            use sqlx::Row;
            let status: String = r.get("status");
            status == "IN_PROGRESS"
        })
        .count() as i32;

    let now = Utc::now();
    let completed_today = rows
        .iter()
        .filter(|r| {
            use sqlx::Row;
            let status: String = r.get("status");
            if status != "COMPLETED" {
                return false;
            }
            let completed_at: Option<chrono::DateTime<Utc>> = r.try_get("completed_at").ok();
            if let Some(date) = completed_at {
                date.date_naive() == now.date_naive()
            } else {
                false
            }
        })
        .count() as i32;

    let ingredients = sqlx::query_as::<_, crate::models::Ingredient>("SELECT * FROM ingredients")
        .fetch_all(&*pool)
        .await
        .unwrap_or_default();

    let low_stock_count = ingredients
        .iter()
        .filter(|i| i.current_stock <= i.reorder_level)
        .count() as i32;
    let inventory_value: f64 = ingredients
        .iter()
        .map(|i| i.current_stock * i.unit_price)
        .sum();

    let recipes = sqlx::query_as::<_, crate::models::Recipe>("SELECT * FROM recipes")
        .fetch_all(&*pool)
        .await
        .unwrap_or_default();

    let mut recipes_by_category = std::collections::HashMap::new();
    for recipe in &recipes {
        if let Some(cat_id) = &recipe.category_id {
            *recipes_by_category.entry(cat_id.clone()).or_insert(0) += 1;
        }
    }

    let formatted_batches: Vec<crate::models::FormattedBatch> = rows
        .into_iter()
        .map(|row| {
            use sqlx::Row;
            let yield_unit: String = row
                .get::<Option<String>, _>("yield_unit")
                .unwrap_or_else(|| "units".to_string());
            crate::models::FormattedBatch {
                id: row.get("id"),
                batch_number: row.get("number"),
                name: row.get("name"),
                status: row.get("status"),
                planned_quantity: row.get("planned_quantity"),
                actual_quantity: row.get("actual_quantity"),
                production_date: row.try_get("planned_date").ok(),
                started_at: row.try_get("started_at").ok(),
                completed_at: row.try_get("completed_at").ok(),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
                recipe: crate::models::FormattedBatchRecipe {
                    id: row
                        .get::<Option<String>, _>("recipe_id")
                        .unwrap_or_default(),
                    name: row
                        .get::<Option<String>, _>("recipe_name")
                        .unwrap_or_else(|| "Unknown Formula".to_string()),
                    yield_quantity: row.get::<Option<f64>, _>("yield_quantity").unwrap_or(0.0),
                    yield_unit_id: yield_unit.clone(),
                },
                unit: crate::models::FormattedBatchUnit {
                    id: yield_unit.clone(),
                    name: "Units".to_string(),
                    symbol: yield_unit,
                },
            }
        })
        .collect();

    Ok(serde_json::json!({
        "summary": {
            "totalBatches": total_batches,
            "activeBatches": active_batches,
            "completedToday": completed_today,
            "lowStockItems": low_stock_count
        },
        "recentBatches": formatted_batches.into_iter().take(10).collect::<Vec<crate::models::FormattedBatch>>(),
        "lowStockIngredients": ingredients.into_iter().filter(|i| i.current_stock <= i.reorder_level).take(10).collect::<Vec<crate::models::Ingredient>>(),
        "stockData": [],
        "averageRecipeCost": 0,
        "recipesByCategory": recipes_by_category,
        "totalInventoryValue": inventory_value
    }))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::Batch;
    use chrono::Utc;
    use sqlx::sqlite::SqlitePoolOptions;
    use sqlx::Row;

    async fn setup_db() -> BackendResult<SqlitePool> {
        let pool = SqlitePoolOptions::new().connect("sqlite::memory:").await?;

        let migrations = crate::migrations::get_migrations();

        for migration in migrations {
            for statement in migration.sql.split(';') {
                let trimmed = statement.trim();
                if !trimmed.is_empty() {
                    sqlx::query(trimmed).execute(&pool).await?;
                }
            }
        }

        // Override default settings for test
        sqlx::query(
            "INSERT OR REPLACE INTO bakery_settings (id, organization_id, is_enabled, auth_mode, api_key, batch_prefix, batch_separator, batch_date_format, batch_sequence) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(uuid::Uuid::new_v4().to_string())
        .bind("org1")
        .bind(true)
        .bind("LOCAL")
        .bind("test-api-key")
        .bind("BAT")
        .bind("-")
        .bind("YYYYMMDD")
        .bind("4")
        .execute(&pool)
        .await?;

        Ok(pool)
    }

    #[tokio::test]
    async fn test_create_batch_offline() -> BackendResult<()> {
        let pool = setup_db().await?;
        let batch = Batch {
            id: "".to_string(),
            number: "B001".to_string(),
            name: "Test Batch".to_string(),
            status: "PLANNED".to_string(),
            recipe_id: "r1".to_string(),
            planned_date: Utc::now(),
            planned_quantity: 10.0,
            actual_quantity: None,
            completed_quantity: None,
            started_at: None,
            completed_at: None,
            cancelled_at: None,
            organization_id: "org1".to_string(),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let result = create_batch_inner(&pool, "u1".to_string(), batch).await?;

        // Verify persisted in DB
        let saved = sqlx::query_as::<_, Batch>("SELECT * FROM batches WHERE id = ?")
            .bind(&result.id)
            .fetch_one(&pool)
            .await?;
        // Now batch number is generated from settings, so it won't be B001
        assert!(saved.number.starts_with("BAT-"));

        // Verify queued for sync
        let queued = sqlx::query("SELECT * FROM sync_queue WHERE entity_id = ?")
            .bind(&result.id)
            .fetch_one(&pool)
            .await?;
        assert!(queued.get::<Option<String>, _>("id").is_some());
        Ok(())
    }
}
