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
        // 1. Try to get API URL and org_slug from keyring
        let (api_base_url, org_slug) = match get_device_info(&pool).await {
            Ok(Some((_, Some(url), slug))) if !url.is_empty() => (url, slug.unwrap_or_else(|| "default-org".to_string())),
            _ => {
                let url = match sqlx::query_scalar::<_, Option<String>>(
                    "SELECT api_endpoint_url FROM bakery_settings WHERE id = 'default-settings' LIMIT 1",
                )
                .fetch_optional(&pool)
                .await
                {
                    Ok(Some(Some(u))) if !u.is_empty() => u,
                    _ => default_api_base_url.clone(),
                };
                (url, "default-org".to_string())
            }
        };

        let api_base_url = api_base_url.trim().trim_end_matches('/').replace("/api/v3", "").to_string();

        let api_key = match get_device_info(&pool).await {
            Ok(Some((key, _, _))) => key,
            _ => {
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
                        match sync_item(&client, &api_base_url, &org_slug, &item, &api_key).await {
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
                                    break;
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

        // Periodic categories sync (V3)
        if let Ok(Some((api_key, _, _))) = get_device_info(&pool).await {
            if let Err(e) = sync_categories(&client, &api_base_url, &org_slug, &pool, &api_key).await {
                log::warn!("Categories sync failed: {}", e);
            }
        }

        // Two-way sync for Recipes and Batches (V3)
        if let Ok(Some((api_key, _, _))) = get_device_info(&pool).await {
            if let Err(e) = sync_recipes_and_batches(&client, &api_base_url, &org_slug, &pool, &api_key).await {
                log::warn!("Recipes and batches sync failed: {}", e);
            }
        }

        // Periodic ingredients sync (V3)
        if let Ok(Some((api_key, _, _))) = get_device_info(&pool).await {
            if let Err(e) = sync_ingredients(&client, &api_base_url, &org_slug, &pool, &api_key).await {
                log::warn!("Ingredients sync failed: {}", e);
            }
        }

        sleep(current_delay).await;
    }
}

async fn sync_categories(
    client: &reqwest::Client,
    api_base_url: &str,
    org_slug: &str,
    pool: &SqlitePool,
    api_key: &str,
) -> BackendResult<()> {
    let url = format!("{}/api/v3/{}/production/categories", api_base_url, org_slug);
    let res = client.get(&url).header("X-API-KEY", api_key).send().await?;

    if res.status().is_success() {
        let json_res: serde_json::Value = res.json().await?;
        let categories_json = if json_res["success"].as_bool().unwrap_or(false) && json_res.get("data").is_some() {
            &json_res["data"]
        } else {
            &json_res
        };

        if let Ok(categories) = serde_json::from_value::<Vec<crate::models::BakeryCategory>>(categories_json.clone()) {
            for category in categories {
                sqlx::query(
                    "INSERT INTO bakery_categories (id, name, description, organization_id, created_at, updated_at)
                     VALUES (?, ?, ?, ?, ?, ?)
                     ON CONFLICT(id) DO UPDATE SET
                        name = excluded.name,
                        description = excluded.description,
                        updated_at = excluded.updated_at"
                )
                .bind(&category.id)
                .bind(&category.name)
                .bind(&category.description)
                .bind(&category.organization_id)
                .bind(category.created_at)
                .bind(category.updated_at)
                .execute(pool)
                .await?;
            }
        }
    }

    Ok(())
}

async fn sync_ingredients(
    client: &reqwest::Client,
    api_base_url: &str,
    org_slug: &str,
    pool: &SqlitePool,
    api_key: &str,
) -> BackendResult<()> {
    let url = format!("{}/api/v3/{}/production/ingredients", api_base_url, org_slug);
    let res = client.get(&url).header("X-API-KEY", api_key).send().await?;

    if res.status().is_success() {
        let json_res: serde_json::Value = res.json().await?;
        let ingredients_json = if json_res["success"].as_bool().unwrap_or(false) && json_res.get("data").is_some() {
            &json_res["data"]
        } else {
            &json_res
        };

        if let Ok(ingredients) = serde_json::from_value::<Vec<crate::models::Ingredient>>(ingredients_json.clone()) {
            for ing in ingredients {
                sqlx::query(
                    "INSERT INTO ingredients (
                        id, name, sku, category_id, current_stock, reorder_level, max_stock,
                        unit_id, stocking_unit_id, units_per_container, unit_price, organization_id, created_at, updated_at
                     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                     ON CONFLICT(id) DO UPDATE SET
                        name = excluded.name,
                        sku = excluded.sku,
                        category_id = excluded.category_id,
                        current_stock = excluded.current_stock,
                        reorder_level = excluded.reorder_level,
                        max_stock = excluded.max_stock,
                        unit_id = excluded.unit_id,
                        stocking_unit_id = excluded.stocking_unit_id,
                        units_per_container = excluded.units_per_container,
                        unit_price = excluded.unit_price,
                        updated_at = excluded.updated_at"
                )
                .bind(&ing.id)
                .bind(&ing.name)
                .bind(&ing.sku)
                .bind(&ing.category_id)
                .bind(ing.current_stock)
                .bind(ing.reorder_level)
                .bind(ing.max_stock)
                .bind(&ing.unit_id)
                .bind(&ing.stocking_unit_id)
                .bind(ing.units_per_container)
                .bind(ing.unit_price)
                .bind(&ing.organization_id)
                .bind(ing.created_at)
                .bind(ing.updated_at)
                .execute(pool)
                .await?;
            }
        }
    }

    Ok(())
}

async fn sync_recipes_and_batches(
    client: &reqwest::Client,
    api_base_url: &str,
    org_slug: &str,
    pool: &SqlitePool,
    api_key: &str,
) -> BackendResult<()> {
    // 1. Sync Recipes (V3 Downstream)
    let recipes_url = format!("{}/api/v3/{}/production/recipes", api_base_url, org_slug);
    let res = client.get(&recipes_url).header("X-API-KEY", api_key).send().await?;
    if res.status().is_success() {
        let json_res: serde_json::Value = res.json().await?;
        let recipes_json = if json_res["success"].as_bool().unwrap_or(false) && json_res.get("data").is_some() {
            &json_res["data"]
        } else {
            &json_res
        };

        if let Ok(recipes) = serde_json::from_value::<Vec<crate::models::Recipe>>(recipes_json.clone()) {
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
    }

    // 2. Sync Batches (V3 Downstream)
    let batches_url = format!("{}/api/v3/{}/production/batches", api_base_url, org_slug);
    let res = client.get(&batches_url).header("X-API-KEY", api_key).send().await?;
    if res.status().is_success() {
        let json_res: serde_json::Value = res.json().await?;
        let batches_json = if json_res["success"].as_bool().unwrap_or(false) && json_res.get("data").is_some() {
            &json_res["data"]
        } else {
            &json_res
        };

        if let Ok(batches) = serde_json::from_value::<Vec<crate::models::Batch>>(batches_json.clone()) {
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
    }

    Ok(())
}

async fn get_device_info(pool: &SqlitePool) -> BackendResult<Option<(String, Option<String>, Option<String>)>> {
    // 1. Try DB first
    let res: Option<(Option<String>, Option<String>)> =
        sqlx::query_as("SELECT api_key, api_endpoint_url FROM bakery_settings WHERE api_key IS NOT NULL LIMIT 1")
            .fetch_optional(pool)
            .await
            .map_err(BackendError::from)?;

    if let Some((Some(key), url)) = res {
        return Ok(Some((key, url, None)));
    }

    // 2. Try keyring
    let entry = Entry::new("scryme-bakery", "device-config")
        .map_err(|e| BackendError::Internal(format!("Keyring error: {}", e)))?;

    match entry.get_password() {
        Ok(pw) => {
             if let Ok(config) = serde_json::from_str::<crate::commands::DeviceConfig>(&pw) {
                Ok(Some((config.device_key, Some(config.base_url), Some(config.org_slug))))
            } else {
                Ok(None)
            }
        },
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
    org_slug: &str,
    item: &SyncItem,
    api_key: &str,
) -> BackendResult<()> {
    if item.entity_type == "SETTINGS" {
        return Ok(());
    }

    let entity_path = match item.entity_type.as_str() {
        "BATCH" => "batches".to_string(),
        "RECIPE" => "recipes".to_string(),
        "TEMPLATE" => "templates".to_string(),
        "CATEGORY" => "categories".to_string(),
        "BAKER" => "bakers".to_string(),
        "INGREDIENT" | "RAW_MATERIAL" => "ingredients".to_string(),
        _ => format!("{}s", item.entity_type.to_lowercase()),
    };

    let url = format!("{}/api/v3/{}/production/{}", api_base_url, org_slug, entity_path);

    let req = match item.action.as_str() {
        "CREATE" => {
            let mut payload: serde_json::Value = serde_json::from_str(&item.payload).unwrap_or_default();
            if let Some(obj) = payload.as_object_mut() {
                obj.remove("id");
                obj.remove("created_at");
                obj.remove("updated_at");
                obj.remove("createdAt");
                obj.remove("updatedAt");
            }

            client
                .post(&url)
                .json(&payload)
                .header("Content-Type", "application/json")
        },
        "UPDATE" => {
            let mut payload: serde_json::Value = serde_json::from_str(&item.payload).unwrap_or_default();
            if let Some(obj) = payload.as_object_mut() {
                obj.remove("id");
                obj.remove("created_at");
                obj.remove("updated_at");
                obj.remove("createdAt");
                obj.remove("updatedAt");
            }

            client
                .patch(format!("{}/{}", url, item.entity_id))
                .json(&payload)
                .header("Content-Type", "application/json")
        },
        "UPDATE_STATUS" => {
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
