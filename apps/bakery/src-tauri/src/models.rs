use chrono::{DateTime, Utc};
#[allow(dead_code)]
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct User {
    pub id: String,
    pub name: String,
    pub email: String,
    #[serde(skip_serializing)]
    pub password_hash: Option<String>,
    pub role: Option<String>,
    pub last_login: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct BakeryCategory {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub organization_id: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RestockData {
    pub product_id: String,
    pub variant_id: String,
    pub unit_quantity: f64,
    pub supplier_id: String,
    pub purchase_price: f64,
    pub notes: Option<String>,
    pub document_urls: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Ingredient {
    pub id: String,
    pub name: String,
    pub sku: Option<String>,
    pub category_id: Option<String>,
    pub current_stock: f64,
    pub reorder_level: f64,
    pub max_stock: f64,
    pub unit_id: Option<String>,
    pub unit_price: f64,
    pub last_restocked: Option<DateTime<Utc>>,
    pub total_used: f64,
    pub average_usage_per_week: f64,
    pub organization_id: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct BatchIngredient {
    pub id: String,
    pub batch_id: String,
    pub ingredient_id: String,
    pub quantity_used: f64,
    pub unit: Option<String>,
    pub lot_number: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct BatchProcessLog {
    pub id: String,
    pub batch_id: String,
    pub action: String,
    pub details: Option<String>,
    pub performed_by: Option<String>,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct BatchQualityCheck {
    pub id: String,
    pub batch_id: String,
    pub check_name: String,
    pub result: String,
    pub notes: Option<String>,
    pub performed_by: Option<String>,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BatchTraceability {
    pub ingredients: Vec<BatchIngredient>,
    pub process_logs: Vec<BatchProcessLog>,
    pub quality_checks: Vec<BatchQualityCheck>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct SystemUnit {
    pub id: String,
    pub name: String,
    pub symbol: String,
    pub abbreviation: Option<String>,
    pub plural_name: Option<String>,
    pub r#type: String, // Use r# because type is a reserved keyword
    pub category: String,
    pub is_base_unit: bool,
    pub is_metric: bool,
    pub description: Option<String>,
    pub is_active: bool,
    pub sort_order: Option<i32>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct OrganizationUnit {
    pub id: String,
    pub organization_id: String,
    pub name: String,
    pub symbol: String,
    pub abbreviation: Option<String>,
    pub plural_name: Option<String>,
    pub r#type: String,
    pub category: String,
    pub description: Option<String>,
    pub is_active: bool,
    pub base_system_unit_id: Option<String>,
    pub conversion_factor: Option<f64>,
    pub conversion_offset: Option<f64>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FormattedBatch {
    pub id: String,
    pub batch_number: String,
    pub name: String,
    pub status: String,
    pub planned_quantity: f64,
    pub actual_quantity: Option<f64>,
    pub recipe: FormattedBatchRecipe,
    pub unit: FormattedBatchUnit,
    pub production_date: Option<DateTime<Utc>>,
    pub started_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FormattedBatchRecipe {
    pub id: String,
    pub name: String,
    #[serde(rename = "yield")]
    pub yield_quantity: f64,
    pub yield_unit_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FormattedBatchUnit {
    pub id: String,
    pub name: String,
    pub symbol: String,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Recipe {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub category_id: Option<String>,
    pub produces_variant_id: String,
    pub yield_quantity: f64,
    pub yield_unit: String,
    pub prep_time: Option<i32>,
    pub bake_time: Option<i32>,
    pub difficulty: Option<String>,
    pub instructions: Option<String>,
    pub organization_id: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateRecipeInput {
    pub name: String,
    pub category_id: String,
    pub yield_quantity: f64,
    pub system_unit_id: Option<String>,
    pub org_unit_id: Option<String>,
    pub produces_variant_id: String,
    pub ingredients: Vec<RecipeIngredientInput>,
    pub description: Option<String>,
    pub instructions: Option<String>,
    pub notes: Option<String>,
    pub prep_time: Option<i32>,
    pub bake_time: Option<i32>,
    pub difficulty: Option<String>,
    pub organization_id: Option<String>,
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecipeIngredientInput {
    pub ingredient_variant_id: String,
    pub quantity: f64,
    pub system_unit_id: Option<String>,
    pub org_unit_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Batch {
    pub id: String,
    #[sqlx(rename = "number")]
    #[serde(rename = "batchNumber")]
    pub number: String,
    pub name: String,
    pub status: String,
    pub recipe_id: String,
    pub planned_date: DateTime<Utc>,
    pub planned_quantity: f64,
    pub actual_quantity: Option<f64>,
    pub completed_quantity: Option<f64>,
    pub started_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub cancelled_at: Option<DateTime<Utc>>,
    pub organization_id: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateBatchInput {
    pub recipe_id: String,
    pub planned_quantity: f64,
    pub system_unit_id: Option<String>,
    pub org_unit_id: Option<String>,
    pub date: DateTime<Utc>,
    pub time: String,
    pub lead_baker_id: Option<String>,
    pub notes: Option<String>,
    pub organization_id: Option<String>,
    pub name: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
#[allow(dead_code)]
pub struct ActivityLog {
    pub id: String,
    pub user_id: String,
    pub action: String,
    pub entity_type: Option<String>,
    pub entity_id: Option<String>,
    pub details: Option<String>,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct SyncItem {
    pub id: String,
    pub action: String,
    pub entity_type: String,
    pub entity_id: String,
    pub payload: String,
    pub created_at: DateTime<Utc>,
    pub synced_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UnitsSyncResponse {
    pub system_units: Vec<SystemUnit>,
    pub organization_units: Vec<OrganizationUnit>,
    pub sync_timestamp: String,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Template {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub recipe_id: String,
    pub quantity: f64,
    pub is_active: bool,
    pub organization_id: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct BakerySettings {
    pub id: String,
    pub organization_id: String,
    pub is_enabled: bool,
    pub default_location_id: Option<String>,
    pub default_baker_id: Option<String>,
    pub auto_create_daily_batches: bool,
    pub expiry_warning_days: i32,
    pub auth_mode: String,
    pub api_key: Option<String>,
    pub api_endpoint_url: Option<String>,
    pub batch_prefix: Option<String>,
    pub batch_separator: Option<String>,
    pub batch_date_format: Option<String>,
    pub batch_sequence: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Baker {
    pub id: String,
    pub name: String,
    pub role: Option<String>,
    pub member_id: Option<String>,
    pub pin: Option<String>,
    pub email: Option<String>,
    pub is_active: bool,
    pub bakery_settings_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
