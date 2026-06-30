use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

// --- V2 API Wrapper ---
#[derive(Debug, Serialize, Deserialize)]
pub struct V2Response<T> {
    pub success: bool,
    pub data: T,
    pub meta: Option<serde_json::Value>,
}

// --- Response Wrapper ---
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProductsSyncResponse {
    pub products: Vec<PosProduct>,
    pub pagination: Option<Pagination>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Pagination {
    pub total: i32,
    pub pages: i32,
    pub page: i32,
    pub limit: i32,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProductSearchResponse {
    pub products: Vec<PosProduct>,
    pub total_count: usize,
}

// --- 1. Product ---
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PosProduct {
    pub product_id: String,

    #[serde(rename = "name", alias = "productName")]
    pub product_name: String,

    pub category: String,

    // Make optional as some products might not have images
    // Make optional as some products might not have images
    pub image_url: Option<String>,

    // New field seen in your JSON
    // Use custom deserializer to handle "004" (string) vs 0 (int)
    #[serde(default, deserialize_with = "deserialize_option_string_or_num")]
    pub total_stock: Option<i32>,

    pub variants: Vec<Variant>,

    // Pharmacy features
    pub active_ingredient: Option<String>,
}

// --- 2. Variant ---
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Variant {
    pub variant_id: String,

    #[serde(rename = "name", alias = "variantName")]
    pub variant_name: String,

    pub sku: String,
    pub barcode: Option<String>,

    #[serde(deserialize_with = "deserialize_string_or_num")]
    pub stock: i32,

    pub sellable_units: Vec<SellableUnit>,

    // Pharmacy features
    pub batches: Option<Vec<Batch>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Batch {
    pub batch_number: String,
    pub expiry_date: String, // ISO String
    pub manufacturing_date: Option<String>,
    pub stock: i32,
}

// --- Custom Deserializers ---

fn deserialize_option_string_or_num<'de, D>(deserializer: D) -> Result<Option<i32>, D::Error>
where
    D: serde::Deserializer<'de>,
{
    let v: serde_json::Value = serde::Deserialize::deserialize(deserializer)?;
    match v {
        serde_json::Value::Number(n) => Ok(n.as_i64().map(|x| x as i32)),
        serde_json::Value::String(s) => {
            if s.is_empty() {
                Ok(None)
            } else {
                s.parse::<f64>()
                    .map(|f| Some(f as i32))
                    .or_else(|_| s.parse::<i32>().map(Some))
                    .map_err(serde::de::Error::custom)
            }
        }
        serde_json::Value::Null => Ok(None),
        _ => Err(serde::de::Error::custom("Expected number, string, or null")),
    }
}

fn deserialize_string_or_num<'de, D>(deserializer: D) -> Result<i32, D::Error>
where
    D: serde::Deserializer<'de>,
{
    let v: serde_json::Value = serde::Deserialize::deserialize(deserializer)?;
    match v {
        serde_json::Value::Number(n) => n
            .as_i64()
            .map(|x| x as i32)
            .ok_or_else(|| serde::de::Error::custom("Number out of range")),
        serde_json::Value::String(s) => {
            // Handle cases like "004" or "5.0"
            s.parse::<f64>()
                .map(|f| f as i32)
                .or_else(|_| s.parse::<i32>())
                .map_err(serde::de::Error::custom)
        }
        _ => Err(serde::de::Error::custom("Expected number or string")),
    }
}

// --- 3. Sellable Unit ---
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SellableUnit {
    pub unit_id: String,
    pub unit_name: String,
    pub price: f64,
    pub wholesale_price: Option<f64>, // Added based on your JSON
    pub conversion: f64,
    pub is_base_unit: bool,

    // Nested Pricing Rules
    pub pricing: Option<Vec<PricingRule>>,
}

// --- 4. Pricing Rules ---
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PricingRule {
    pub price: f64,
    pub min_qty: i32,
    pub max_qty: Option<i32>, // Nullable in JSON
    pub list_id: String,
    pub list_name: String,
    pub list_code: String,
    pub priority: i32,

    // These dates can be null
    pub valid_from: Option<String>,
    pub valid_to: Option<String>,
}

// --- CUSTOMERS ---

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CustomersSyncResponse {
    pub data: Vec<PosCustomer>,
    pub next_sync_token: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PosCustomer {
    pub id: String,
    pub name: String,
    pub email: Option<String>,
    pub phone: Option<String>,

    // Backend fields
    #[serde(alias = "type")]
    pub customer_type: Option<String>, // "B2B" or "B2C" usually
    #[serde(alias = "jobTitle")]
    pub company: Option<String>,
    pub business_account_id: Option<String>,
    pub loyalty_points: Option<f64>,

    // Computed/Frontend helper fields
    pub city: Option<String>,
    pub primary_address: Option<String>,

    pub updated_at: Option<String>,

    pub gender: Option<String>,
    pub date_of_birth: Option<String>,

    // Pharmacy features
    pub medical_history: Option<String>,
    pub allergies: Option<String>,
    pub chronic_conditions: Option<String>,
    pub insurance_provider: Option<String>,
    pub policy_number: Option<String>,
}

// --- SALES ---

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct QueuedSale {
    pub id: String, // UUID generated by frontend
    pub timestamp: u64,
    pub location_id: String,
    pub transaction_data: serde_json::Value, // Flexible payload
    pub status: SaleStatus,
    pub retry_count: u32,
    pub last_error: Option<String>,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum SaleStatus {
    Pending,
    Synced,
    Failed,
    Invalidated,
    PendingCloudSync,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaleResponse {
    pub success: bool,
    pub message: String,
    pub server_response: Option<serde_json::Value>,
}

// --- PRICING ---

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ClientPriceList {
    pub id: String,
    pub code: String,
    pub priority: i32,
    pub is_global: bool,
    pub is_active: bool,
    pub valid_from: Option<String>,
    pub valid_to: Option<String>,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ClientPriceListItem {
    pub id: String,
    pub price_list_id: String,
    pub variant_id: String,
    pub selling_unit_id: Option<String>,
    pub min_quantity: i32,
    #[serde(deserialize_with = "deserialize_price_to_string")]
    pub price: String, // Keep as string to match API/Frontend precision if needed
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PricingMetadata {
    pub synced_at: String,

    #[serde(default)]
    pub is_delta: bool,

    #[serde(default)]
    pub temp_full_sync: bool,
}

// --- SERVER RESPONSE STRUCTS (Nested) ---
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ServerPricingResponse {
    pub metadata: PricingMetadata,
    pub data: ServerPricingData,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ServerPricingData {
    pub lists: Vec<ServerPriceList>,
    pub items: Vec<ServerPriceListItem>,
    pub customer_allocations: Option<std::collections::HashMap<String, Vec<String>>>,
    #[serde(default)]
    pub deleted_item_ids: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ServerPriceList {
    pub id: String,
    pub code: String,
    pub priority: i32,
    pub is_global: bool,
    #[serde(default = "default_true")]
    pub is_active: bool,
    pub valid_from: Option<String>,
    pub valid_to: Option<String>,
    #[serde(default)]
    pub updated_at: String,
}

fn default_true() -> bool {
    true
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ServerPriceListItem {
    pub id: String,
    pub price_list_id: String,
    pub variant_id: String,
    pub selling_unit_id: Option<String>,
    pub min_quantity: i32,
    #[serde(deserialize_with = "deserialize_price_to_string")]
    pub price: String,
    #[serde(default)]
    pub updated_at: String,
}

fn deserialize_price_to_string<'de, D>(deserializer: D) -> Result<String, D::Error>
where
    D: serde::Deserializer<'de>,
{
    let v: serde_json::Value = serde::Deserialize::deserialize(deserializer)?;
    match v {
        serde_json::Value::String(s) => Ok(s),
        serde_json::Value::Number(n) => Ok(n.to_string()),
        _ => Err(serde::de::Error::custom(
            "Expected string or number for price",
        )),
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PosPricingData {
    pub lists: Vec<ClientPriceList>,
    pub items: Vec<ClientPriceListItem>,
    pub allocations: std::collections::HashMap<String, Vec<String>>,
}

// A robust error type for the frontend to consume
#[derive(Debug, thiserror::Error)]
#[allow(dead_code)]
pub enum PrinterError {
    #[error("Network connection timed out")]
    Timeout,
    #[error("Connection refused: {0}")]
    ConnectionFailed(String),
    #[error("IO Error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Printer system error: {0}")]
    SystemError(String),
    #[error("USB Device not found (VID: {0}, PID: {1})")]
    UsbDeviceNotFound(u16, u16),
}

// Helper to convert our typed error to the String format Tauri expects
impl serde::Serialize for PrinterError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Shift {
    pub id: String,
    pub opened_at: DateTime<Utc>,
    pub closed_at: Option<DateTime<Utc>>,
    pub operator_id: Option<String>,
    pub closing_operator_id: Option<String>,

    // Money tracking
    pub starting_float: f64,
    pub total_cash_sales: f64,   // Sales made in cash
    pub total_cash_drops: f64,   // Cash removed (e.g., paying vendor)
    pub total_cash_refunds: f64, // Cash given back

    // Detailed cash breakdowns (JSON)
    pub opening_cash_details: Option<serde_json::Value>,
    pub closing_cash_details: Option<serde_json::Value>,

    // Reconciliation
    pub expected_cash: f64,               // Float + Sales - Drops - Refunds
    pub actual_cash: Option<f64>,         // What user counted
    pub variance: Option<f64>,            // Actual - Expected
    pub operator_card_id: Option<String>, // The Card ID
    pub operator_pin: Option<String>,     // The PIN (or Hash of PIN)
    pub device_id: Option<String>,        // The Device ID where shift was opened
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ShiftSyncPayload {
    pub location_id: String,
    pub shift_id: String,
    pub opened_at: String, // ISO String
    pub closed_at: Option<String>,

    // Auth Data for Anti-Buddy Punching
    pub operator_card_id: String,
    pub operator_pin: String, // Sending raw or hashed depending on your API security

    // Money
    pub starting_float: f64,
    pub total_cash_sales: f64,
    pub total_cash_drops: f64,
    pub actual_cash_count: Option<f64>,
    pub variance: Option<f64>,

    // Detailed cash breakdowns
    pub opening_cash_details: Option<serde_json::Value>,
    pub closing_cash_details: Option<serde_json::Value>,
    pub closing_operator_id: Option<String>,
}

// --- GLOBAL SEARCH ---
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GlobalSearchResult {
    pub products: Vec<PosProduct>,
    pub customers: Vec<PosCustomer>,
    pub sales: Vec<QueuedSale>,
}
