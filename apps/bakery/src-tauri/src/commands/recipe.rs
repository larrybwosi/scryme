use crate::commands::{log_activity, serde_json_to_string};
use crate::error::{BackendError, BackendResult};
use crate::models::{Recipe, CreateRecipeInput};
use crate::scaling::ScaledRecipe;
use chrono::Utc;
use sqlx::SqlitePool;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub async fn get_recipes(pool: State<'_, SqlitePool>) -> BackendResult<Vec<Recipe>> {
    sqlx::query_as::<_, Recipe>("SELECT * FROM recipes ORDER BY name ASC")
        .fetch_all(&*pool)
        .await
        .map_err(BackendError::from)
}

#[tauri::command]
pub async fn create_recipe(
    pool: State<'_, SqlitePool>,
    user_id: String,
    input: CreateRecipeInput,
) -> BackendResult<Recipe> {
    let org_id = input
        .organization_id
        .unwrap_or_else(|| "local-org".to_string());
    let recipe_id = Uuid::new_v4().to_string();
    let now = Utc::now();

    let yield_unit = input
        .system_unit_id
        .clone()
        .or(input.org_unit_id.clone())
        .unwrap_or_else(|| "units".to_string());

    let recipe = Recipe {
        id: recipe_id.clone(),
        name: input.name,
        description: input.description,
        category_id: Some(input.category_id),
        produces_variant_id: input.produces_variant_id,
        yield_quantity: input.yield_quantity,
        yield_unit,
        prep_time: input.prep_time,
        bake_time: input.bake_time,
        difficulty: input.difficulty,
        instructions: input.instructions,
        organization_id: org_id,
        created_at: now,
        updated_at: now,
    };

    sqlx::query(
        "INSERT INTO recipes (id, name, description, category_id, produces_variant_id, yield_quantity, yield_unit, prep_time, bake_time, difficulty, instructions, organization_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
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
    .execute(&*pool)
    .await?;

    for ing in input.ingredients {
        let ing_id = Uuid::new_v4().to_string();
        let unit = ing.system_unit_id.or(ing.org_unit_id);
        sqlx::query(
            "INSERT INTO recipe_ingredients (id, recipe_id, ingredient_variant_id, quantity, unit)
             VALUES (?, ?, ?, ?, ?)",
        )
        .bind(ing_id)
        .bind(&recipe_id)
        .bind(ing.ingredient_variant_id)
        .bind(ing.quantity)
        .bind(unit)
        .execute(&*pool)
        .await?;
    }

    let _ = log_activity(
        &pool,
        user_id,
        "CREATE",
        "RECIPE",
        &recipe.id,
        Some(format!("Created recipe {}", recipe.name)),
    )
    .await;

    sqlx::query("INSERT INTO sync_queue (id, action, entity_type, entity_id, payload) VALUES (?, ?, ?, ?, ?)")
        .bind(Uuid::new_v4().to_string())
        .bind("CREATE")
        .bind("RECIPE")
        .bind(&recipe.id)
        .bind(serde_json_to_string(&recipe)?)
        .execute(&*pool)
        .await?;

    Ok(recipe)
}

#[tauri::command]
pub async fn update_recipe(
    pool: State<'_, SqlitePool>,
    user_id: String,
    recipe: serde_json::Value,
) -> BackendResult<()> {
    let id = recipe["id"]
        .as_str()
        .ok_or_else(|| BackendError::Validation("Missing recipe ID".to_string()))?;
    let name = recipe["name"].as_str().unwrap_or("Unknown Recipe");

    sqlx::query(
        "UPDATE recipes SET
         name = COALESCE(?, name),
         description = COALESCE(?, description),
         category_id = COALESCE(?, category_id),
         produces_variant_id = COALESCE(?, produces_variant_id),
         yield_quantity = COALESCE(?, yield_quantity),
         yield_unit = COALESCE(?, yield_unit),
         prep_time = COALESCE(?, prep_time),
         bake_time = COALESCE(?, bake_time),
         difficulty = COALESCE(?, difficulty),
         instructions = COALESCE(?, instructions),
         updated_at = ?
         WHERE id = ?",
    )
    .bind(recipe.get("name").and_then(|v| v.as_str()))
    .bind(recipe.get("description").and_then(|v| v.as_str()))
    .bind(recipe.get("categoryId").and_then(|v| v.as_str()))
    .bind(recipe.get("producesVariantId").and_then(|v| v.as_str()))
    .bind(recipe.get("yieldQuantity").and_then(|v| v.as_f64()))
    .bind(
        recipe
            .get("systemUnitId")
            .and_then(|v| v.as_str())
            .or_else(|| recipe.get("orgUnitId").and_then(|v| v.as_str())),
    )
    .bind(recipe.get("prepTime").and_then(|v| v.as_i64()))
    .bind(recipe.get("bakeTime").and_then(|v| v.as_i64()))
    .bind(recipe.get("difficulty").and_then(|v| v.as_str()))
    .bind(recipe.get("instructions").and_then(|v| v.as_str()))
    .bind(Utc::now())
    .bind(id)
    .execute(&*pool)
    .await?;

    let _ = log_activity(
        &pool,
        user_id,
        "UPDATE",
        "RECIPE",
        id,
        Some(format!("Updated recipe {}", name)),
    )
    .await;

    sqlx::query("INSERT INTO sync_queue (id, action, entity_type, entity_id, payload) VALUES (?, ?, ?, ?, ?)")
        .bind(Uuid::new_v4().to_string())
        .bind("UPDATE")
        .bind("RECIPE")
        .bind(id)
        .bind(serde_json_to_string(&recipe)?)
        .execute(&*pool)
        .await?;

    Ok(())
}

#[tauri::command]
pub async fn delete_recipe(
    pool: State<'_, SqlitePool>,
    user_id: String,
    id: String,
) -> BackendResult<()> {
    sqlx::query("DELETE FROM recipes WHERE id = ?")
        .bind(&id)
        .execute(&*pool)
        .await?;

    let _ = log_activity(
        &pool,
        user_id,
        "DELETE",
        "RECIPE",
        &id,
        Some("Deleted recipe".to_string()),
    )
    .await;

    sqlx::query("INSERT INTO sync_queue (id, action, entity_type, entity_id, payload) VALUES (?, ?, ?, ?, ?)")
        .bind(Uuid::new_v4().to_string())
        .bind("DELETE")
        .bind("RECIPE")
        .bind(&id)
        .bind("{}")
        .execute(&*pool)
        .await?;

    Ok(())
}

#[tauri::command]
pub async fn scale_recipe(
    pool: State<'_, SqlitePool>,
    recipe_id: String,
    target_yield: f64,
) -> BackendResult<ScaledRecipe> {
    crate::scaling::scale_recipe_logic(&pool, &recipe_id, target_yield).await
}
