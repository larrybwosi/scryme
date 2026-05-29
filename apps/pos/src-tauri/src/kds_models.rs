use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OrderItem {
    pub id: String, // Client-generated UUID
    pub name: String,
    pub quantity: f64,
    pub modifiers: String,
    pub is_allergy: bool,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct KdsOrderPayload {
    pub id: String, // Client-generated UUID (Idempotency key)
    pub num: String,
    #[serde(rename = "type")]
    pub order_type: String,
    pub station: String,
    pub table: String,
    pub status: String,
    pub created_at: i64,
    pub bumped_at: Option<i64>,
    pub items: Vec<OrderItem>,
    pub note: Option<String>,
    pub server: String,
    pub covers: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceStatusPayload {
    pub id: String,
    pub name: String,
    pub device_type: String,
    pub status: String,
    pub last_seen: i64,
    pub current_user_id: Option<String>,
    pub current_user_name: Option<String>,
    pub station: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssignmentPayload {
    pub device_id: String,
    pub user_id: Option<String>,
    pub user_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TabletActivityPayload {
    pub device_id: String,
    pub current_page: String,
    pub cart_items: Vec<OrderItem>,
    pub table_number: Option<String>,
}

// Wrapper for WebSocket messages to allow different message types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "payload")]
pub enum WsMessage {
    NewOrder(KdsOrderPayload),
    OrderStatusUpdated { id: String, new_status: String },
    SyncOrders(Vec<KdsOrderPayload>), // <-- ADD THIS for initial syncs
    DeviceStatus(DeviceStatusPayload),
    AssignmentUpdate(AssignmentPayload),
    TabletActivity(TabletActivityPayload),
    OrderEtaQuery { id: String, station: String },
    OrderEtaResponse { id: String, eta_minutes: u32 },
    Ping,
}