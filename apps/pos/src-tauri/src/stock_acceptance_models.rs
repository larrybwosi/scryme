use serde::{Deserialize, Serialize};

// --- General Delivery/Stock Models ---

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DeliveryItem {
    pub variant_id: String,

    // Core quantity logic
    pub quantity: i32,
    #[serde(default)]
    pub unit_cost: f64,

    // Purchase / Transfer Receipt Fields
    #[serde(skip_serializing_if = "Option::is_none")]
    pub purchase_item_id: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub received_quantity: Option<f64>,

    // Quality Control Fields
    #[serde(skip_serializing_if = "Option::is_none")]
    pub accepted_quantity: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rejected_quantity: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rejection_reason: Option<String>,

    // Batch/Expiry Info
    #[serde(skip_serializing_if = "Option::is_none")]
    pub batch_number: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expiry_date: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DocumentMetadata {
    pub id: String,
    pub name: String,
    pub doc_type: String,
    pub path: String,
    pub size: u64,
}

// --- Stock Batch / Inventory Models ---

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct StockProcessRequest {
    pub batch_id: String,
    pub location_id: String,
    pub action: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub accepted_quantity: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rejected_quantity: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub notes: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub documents: Option<Vec<String>>,
}

// --- Incoming Shipments Models ---

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct IncomingVariant {
    pub id: String,
    pub name: String,
    pub sku: Option<String>,
    #[serde(alias = "displayName")]
    pub display_name: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct IncomingItem {
    pub id: String,

    #[serde(alias = "requestedQuantity")]
    pub quantity: String,

    pub variant: IncomingVariant,

    #[serde(default)]
    pub unit_cost: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct IncomingShipment {
    pub id: String,
    #[serde(rename = "type")]
    pub shipment_type: String,
    pub reference_number: String,
    pub source: String,
    pub date: String,
    pub status: String,
    pub item_count: i32,
    pub items: Vec<IncomingItem>,
    pub receive_api_url: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct IncomingResponse {
    pub data: Vec<IncomingShipment>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ReceivePurchaseRequest {
    pub location_id: String,
    pub items: Vec<DeliveryItem>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ReceiveTransferRequest {
    pub location_id: String,
    pub items: Vec<DeliveryItem>,
    pub notes: Option<String>,
}

// --- Error Models ---

#[derive(Debug, Serialize)]
pub enum ErrorKind {
    Authentication,
    Network,
    FileSystem,
    Serialization,
    Server,
    Validation,
    Configuration,
    Storage,
    Unknown,
}

#[derive(Debug, Serialize)]
pub struct CommandError {
    pub kind: ErrorKind,
    pub message: String,
    pub details: Option<String>,
}

impl CommandError {
    pub fn new(kind: ErrorKind, message: impl Into<String>) -> Self {
        Self {
            kind,
            message: message.into(),
            details: None,
        }
    }

    pub fn with_details(mut self, details: impl Into<String>) -> Self {
        self.details = Some(details.into());
        self
    }
}
