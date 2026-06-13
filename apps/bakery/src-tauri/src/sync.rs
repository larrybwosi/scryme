use crate::error::{BackendError, BackendResult};
use crate::models::SyncItem;
use chrono::Utc;
use keyring::Entry;
use sqlx::SqlitePool;
use std::time::Duration;
use tokio::time::sleep;

pub async fn start_sync_worker(pool: SqlitePool, default_api_base_url: String) {
    let client = reqwest::Client::new();
    let mut current_delay = Duration::from_secs(60);
    let min_delay = Duration::from_secs(60);
    let max_delay = Duration::from_secs(3600);

    loop {
        // Fetch current API URL from settings
        let api_base_url = match sqlx::query_scalar::<_, Option<String>>(
            "SELECT api_endpoint_url FROM bakery_settings WHERE id = 'default-settings' LIMIT 1",
        )
        .fetch_optional(&pool)
        .await
        {
            Ok(Some(Some(url))) if !url.is_empty() => url,
            _ => default_api_base_url.clone(),
        };

        let api_base_url = if api_base_url.ends_with("/api/v2") {
            api_base_url
        } else {
            format!("{}/api/v2", api_base_url.trim_end_matches('/'))
        };

        let api_key = match get_api_key(&pool).await {
            Ok(Some(key)) => key,
            _ => {
                // If we don't have an API key, we can't sync.
                // Reset delay and wait a bit before checking again.
                current_delay = min_delay;
                sleep(Duration::from_secs(30)).await;
                continue;
            }
        };

        match get_pending_sync_items(&pool).await {
            Ok(items) => {
                if items.is_empty() {
                    current_delay = min_delay;
                } else {
                    let mut any_network_error = false;
                    let mut any_success = false;

                    for item in items {
                        match sync_item(&client, &api_base_url, &item, &api_key).await {
                            Ok(_) => {
                                any_success = true;
                                if let Err(e) = mark_as_synced(&pool, &item.id).await {
                                    log::error!("Failed to mark item {} as synced: {}", item.id, e);
                                }
                            }
                            Err(e) => {
                                log::warn!("Failed to sync item {}: {}", item.id, e);
                                if matches!(e, BackendError::Network(_)) {
                                    any_network_error = true;
                                    break; // Network down, stop processing items and backoff
                                }
                            }
                        }
                    }

                    if any_network_error {
                        current_delay = std::cmp::min(current_delay * 2, max_delay);
                        log::info!(
                            "Sync network error, increasing backoff to {:?}",
                            current_delay
                        );
                    } else if any_success {
                        current_delay = min_delay;
                    }
                }
            }
            Err(e) => {
                log::error!("Failed to fetch pending sync items: {}", e);
                current_delay = std::cmp::min(current_delay * 2, max_delay);
            }
        }

        // Periodic units sync (V2)
        if let Ok(Some(api_key)) = get_api_key(&pool).await {
            if let Err(e) = sync_units(&client, &api_base_url, &pool, &api_key).await {
                log::warn!("Periodic units sync failed: {}", e);
            }
        }

        // Two-way sync for Recipes and Batches
        if let Ok(Some(api_key)) = get_api_key(&pool).await {
            if let Err(e) = sync_recipes_and_batches(&client, &api_base_url, &pool, &api_key).await {
                log::warn!("Recipes and batches sync failed: {}", e);
            }
        }

        sleep(current_delay).await;
    }
}

async fn sync_units(
    client: &reqwest::Client,
    api_base_url: &str,
    pool: &SqlitePool,
    api_key: &str,
) -> BackendResult<()> {
    // 1. Get last sync time
    let last_sync_time: Option<String> = sqlx::query_scalar(
        "SELECT MAX(updated_at) FROM (SELECT updated_at FROM system_units UNION SELECT updated_at FROM organization_units)"
    )
    .fetch_optional(pool)
    .await?;

    let url = match last_sync_time {
        Some(ts) => format!(
            "{}/units/sync?lastSync={}",
            api_base_url,
            urlencoding::encode(&ts)
        ),
        None => format!("{}/units/sync", api_base_url),
    };

    let res = client.get(&url).header("X-API-KEY", api_key).send().await?;

    if !res.status().is_success() {
        return Err(BackendError::Network(res.error_for_status().unwrap_err()));
    }

    // Wrap response to match V2 sync output
    #[derive(Debug, serde::Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct V2UnitsSyncResponse {
        system_units: Vec<crate::models::SystemUnit>,
        organization_units: Vec<crate::models::OrganizationUnit>,
        // Ignore other fields for now
    }

    let sync_data: V2UnitsSyncResponse = res.json().await?;

    // 2. Update local database
    let mut tx = pool.begin().await?;

    for unit in sync_data.system_units {
        sqlx::query(
            "INSERT INTO system_units (id, name, symbol, abbreviation, plural_name, \"type\", category, is_base_unit, is_metric, description, is_active, sort_order, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                symbol = excluded.symbol,
                abbreviation = excluded.abbreviation,
                plural_name = excluded.plural_name,
                \"type\" = excluded.\"type\",
                category = excluded.category,
                is_base_unit = excluded.is_base_unit,
                is_metric = excluded.is_metric,
                description = excluded.description,
                is_active = excluded.is_active,
                sort_order = excluded.sort_order,
                updated_at = excluded.updated_at"
        )
        .bind(unit.id)
        .bind(unit.name)
        .bind(unit.symbol)
        .bind(unit.abbreviation)
        .bind(unit.plural_name)
        .bind(unit.r#type)
        .bind(unit.category)
        .bind(unit.is_base_unit)
        .bind(unit.is_metric)
        .bind(unit.description)
        .bind(unit.is_active)
        .bind(unit.sort_order)
        .bind(unit.created_at)
        .bind(unit.updated_at)
        .execute(&mut *tx)
        .await?;
    }

    for unit in sync_data.organization_units {
        sqlx::query(
            "INSERT INTO organization_units (id, organization_id, name, symbol, abbreviation, plural_name, \"type\", category, description, is_active, base_system_unit_id, conversion_factor, conversion_offset, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                symbol = excluded.symbol,
                abbreviation = excluded.abbreviation,
                plural_name = excluded.plural_name,
                \"type\" = excluded.\"type\",
                category = excluded.category,
                description = excluded.description,
                is_active = excluded.is_active,
                base_system_unit_id = excluded.base_system_unit_id,
                conversion_factor = excluded.conversion_factor,
                conversion_offset = excluded.conversion_offset,
                updated_at = excluded.updated_at"
        )
        .bind(unit.id)
        .bind(unit.organization_id)
        .bind(unit.name)
        .bind(unit.symbol)
        .bind(unit.abbreviation)
        .bind(unit.plural_name)
        .bind(unit.r#type)
        .bind(unit.category)
        .bind(unit.description)
        .bind(unit.is_active)
        .bind(unit.base_system_unit_id)
        .bind(unit.conversion_factor)
        .bind(unit.conversion_offset)
        .bind(unit.created_at)
        .bind(unit.updated_at)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;

    Ok(())
}

async fn sync_recipes_and_batches(
    client: &reqwest::Client,
    api_base_url: &str,
    pool: &SqlitePool,
    api_key: &str,
) -> BackendResult<()> {
    // 1. Sync Recipes (Downstream)
    let recipes_url = format!("{}/bakery/recipes", api_base_url);
    let res = client.get(&recipes_url).header("X-API-KEY", api_key).send().await?;
    if res.status().is_success() {
        let recipes: Vec<crate::models::Recipe> = res.json().await?;
        for recipe in recipes {
            sqlx::query(
                "INSERT INTO recipes (id, name, description, category_id, produces_variant_id, yield_quantity, yield_unit, prep_time, bake_time, difficulty, instructions, organization_id, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                 ON CONFLICT(id) DO UPDATE SET
                    name = excluded.name,
                    description = excluded.description,
                    category_id = excluded.category_id,
                    produces_variant_id = excluded.produces_variant_id,
                    yield_quantity = excluded.yield_quantity,
                    yield_unit = excluded.yield_unit,
                    prep_time = excluded.prep_time,
                    bake_time = excluded.bake_time,
                    difficulty = excluded.difficulty,
                    instructions = excluded.instructions,
                    updated_at = excluded.updated_at"
            )
            .bind(&recipe.id)
            .bind(&recipe.name)
            .bind(&recipe.description)
            .bind(&recipe.category_id)
            .bind(&recipe.produces_variant_id)
            .bind(recipe.yield_quantity)
            .bind(&recipe.yield_unit)
            .bind(recipe.prep_time)
            .bind(recipe.bake_time)
            .bind(&recipe.difficulty)
            .bind(&recipe.instructions)
            .bind(&recipe.organization_id)
            .bind(recipe.created_at)
            .bind(recipe.updated_at)
            .execute(pool)
            .await?;
        }
    }

    // 2. Sync Batches (Downstream)
    let batches_url = format!("{}/bakery/batches", api_base_url);
    let res = client.get(&batches_url).header("X-API-KEY", api_key).send().await?;
    if res.status().is_success() {
        let batches: Vec<crate::models::Batch> = res.json().await?;
        for batch in batches {
            sqlx::query(
                "INSERT INTO batches (id, number, name, status, recipe_id, planned_date, planned_quantity, actual_quantity, completed_quantity, started_at, completed_at, cancelled_at, organization_id, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                 ON CONFLICT(id) DO UPDATE SET
                    number = excluded.number,
                    name = excluded.name,
                    status = excluded.status,
                    recipe_id = excluded.recipe_id,
                    planned_date = excluded.planned_date,
                    planned_quantity = excluded.planned_quantity,
                    actual_quantity = excluded.actual_quantity,
                    completed_quantity = excluded.completed_quantity,
                    started_at = excluded.started_at,
                    completed_at = excluded.completed_at,
                    cancelled_at = excluded.cancelled_at,
                    updated_at = excluded.updated_at"
            )
            .bind(&batch.id)
            .bind(&batch.number)
            .bind(&batch.name)
            .bind(&batch.status)
            .bind(&batch.recipe_id)
            .bind(batch.planned_date)
            .bind(batch.planned_quantity)
            .bind(batch.actual_quantity)
            .bind(batch.completed_quantity)
            .bind(batch.started_at)
            .bind(batch.completed_at)
            .bind(batch.cancelled_at)
            .bind(&batch.organization_id)
            .bind(batch.created_at)
            .bind(batch.updated_at)
            .execute(pool)
            .await?;
        }
    }

    Ok(())
}

async fn get_api_key(pool: &SqlitePool) -> BackendResult<Option<String>> {
    // 1. Try to get from database first
    let res: Option<(Option<String>,)> =
        sqlx::query_as("SELECT api_key FROM bakery_settings WHERE api_key IS NOT NULL LIMIT 1")
            .fetch_optional(pool)
            .await
            .map_err(BackendError::from)?;

    if let Some(key) = res.and_then(|r| r.0) {
        return Ok(Some(key));
    }

    // 2. Try to get from keyring (provisioned devices)
    let entry = Entry::new("scryme-bakery", "device-api-key")
        .map_err(|e| BackendError::Internal(format!("Keyring error: {}", e)))?;

    match entry.get_password() {
        Ok(pw) => Ok(Some(pw)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(BackendError::Internal(format!(
            "Failed to retrieve API Key from keyring: {}",
            e
        ))),
    }
}

async fn get_pending_sync_items(pool: &SqlitePool) -> BackendResult<Vec<SyncItem>> {
    sqlx::query_as::<_, SyncItem>(
        "SELECT * FROM sync_queue WHERE synced_at IS NULL ORDER BY created_at ASC",
    )
    .fetch_all(pool)
    .await
    .map_err(BackendError::from)
}

async fn sync_item(
    client: &reqwest::Client,
    api_base_url: &str,
    item: &SyncItem,
    api_key: &str,
) -> BackendResult<()> {
    // Handle RESTOCK items specifically
    if item.entity_type == "RESTOCK" {
        let restock_data: crate::models::RestockData = serde_json::from_str(&item.payload)
            .map_err(|e| {
                BackendError::Internal(format!("Failed to parse restock payload: {}", e))
            })?;

        let url = format!(
            "{}/catalog/products/{}/variants/{}/restock",
            api_base_url, restock_data.product_id, restock_data.variant_id
        );
        let res = client
            .post(&url)
            .header("X-API-KEY", api_key)
            .header("Content-Type", "application/json")
            .body(item.payload.clone())
            .send()
            .await?;

        if res.status().is_success() {
            return Ok(());
        } else {
            return Err(BackendError::Network(res.error_for_status().unwrap_err()));
        }
    }

    // Skip syncing for SETTINGS types
    if item.entity_type == "SETTINGS" {
        return Ok(());
    }

    let (entity_path, is_bakery_scoped) = match item.entity_type.as_str() {
        "BATCH" => ("batches".to_string(), true),
        "RECIPE" => ("recipes".to_string(), true), // Map RECIPE to /bakery/recipes
        "TEMPLATE" => ("templates".to_string(), true),
        "CATEGORY" => ("categories".to_string(), true),
        "BAKER" => ("bakers".to_string(), true),
        "UNIT" => ("units/organization".to_string(), false),
        "INGREDIENT" => ("ingredients".to_string(), true),
        _ => (format!("{}s", item.entity_type.to_lowercase()), true),
    };

    let url = if is_bakery_scoped {
        format!("{}/bakery/{}", api_base_url, entity_path)
    } else {
        format!("{}/{}", api_base_url, entity_path)
    };

    let req = match item.action.as_str() {
        "CREATE" => client
            .post(&url)
            .body(item.payload.clone())
            .header("Content-Type", "application/json"),
        "UPDATE" => client
            .patch(format!("{}/{}", url, item.entity_id))
            .body(item.payload.clone())
            .header("Content-Type", "application/json"),
        "UPDATE_STATUS" => {
            // Handle specific status updates for batches
            if item.entity_type == "BATCH" {
                let status_payload: serde_json::Value = serde_json::from_str(&item.payload).unwrap_or_default();
                let status = status_payload["status"].as_str().unwrap_or("");
                let action = match status {
                    "IN_PROGRESS" => "start",
                    "COMPLETED" => "complete",
                    "CANCELLED" => "cancel",
                    _ => "update"
                };

                if action == "update" {
                    client.patch(format!("{}/{}", url, item.entity_id))
                        .body(item.payload.clone())
                        .header("Content-Type", "application/json")
                } else {
                    client.post(format!("{}/{}/{}", url, item.entity_id, action))
                        .body(item.payload.clone())
                        .header("Content-Type", "application/json")
                }
            } else {
                client.patch(format!("{}/{}", url, item.entity_id))
                    .body(item.payload.clone())
                    .header("Content-Type", "application/json")
            }
        },
        "DELETE" => client.delete(format!("{}/{}", url, item.entity_id)),
        _ => {
            return Err(BackendError::Internal(format!(
                "Unknown sync action: {}",
                item.action
            )))
        }
    };

    let res = req.header("X-API-KEY", api_key).send().await?;

    res.error_for_status()
        .map(|_| ())
        .map_err(BackendError::Network)
}

async fn mark_as_synced(pool: &SqlitePool, item_id: &str) -> BackendResult<()> {
    sqlx::query("UPDATE sync_queue SET synced_at = ? WHERE id = ?")
        .bind(Utc::now())
        .bind(item_id)
        .execute(pool)
        .await?;
    Ok(())
}
