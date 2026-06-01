use crate::error::BackendResult;
use crate::models::Recipe;
use serde::{Deserialize, Serialize};
use sqlx::Row;
use sqlx::SqlitePool;

#[derive(Debug, Serialize, Deserialize)]
pub struct ScaledIngredient {
    pub variant_id: String,
    pub original_quantity: f64,
    pub scaled_quantity: f64,
    pub unit: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ScaledRecipe {
    pub recipe_id: String,
    pub multiplier: f64,
    pub target_yield: f64,
    pub ingredients: Vec<ScaledIngredient>,
}

pub async fn scale_recipe_logic(
    pool: &SqlitePool,
    recipe_id: &str,
    target_yield: f64,
) -> BackendResult<ScaledRecipe> {
    let recipe = sqlx::query_as::<_, Recipe>("SELECT * FROM recipes WHERE id = ?")
        .bind(recipe_id)
        .fetch_one(pool)
        .await?;

    let ingredients_data = sqlx::query(
        "SELECT ingredient_variant_id, quantity, unit FROM recipe_ingredients WHERE recipe_id = ?",
    )
    .bind(recipe_id)
    .fetch_all(pool)
    .await?;

    let mut ingredients: Vec<ScaledIngredient> = Vec::new();
    for row in ingredients_data {
        let variant_id: String = row.get(0);
        let quantity: f64 = row.get(1);
        let unit: String = match row.try_get(2) {
            Ok(u) => u,
            Err(_) => "".to_string(),
        };

        ingredients.push(ScaledIngredient {
            variant_id,
            original_quantity: quantity,
            scaled_quantity: 0.0,
            unit,
        });
    }

    let multiplier = if recipe.yield_quantity > 0.0 {
        target_yield / recipe.yield_quantity
    } else {
        1.0
    };

    let scaled_ingredients = ingredients
        .into_iter()
        .map(|mut ing| {
            ing.scaled_quantity = ing.original_quantity * multiplier;
            ing
        })
        .collect();

    Ok(ScaledRecipe {
        recipe_id: recipe.id.clone(),
        multiplier,
        target_yield,
        ingredients: scaled_ingredients,
    })
}
