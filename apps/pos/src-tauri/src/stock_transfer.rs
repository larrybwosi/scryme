use crate::auth_store::AuthState;
use log::{error, info};
use serde::{Deserialize, Serialize};
use tauri::State;

// --- Error Handling Structures ---

#[derive(Debug, Serialize)]
pub enum ErrorKind {
    Authentication,
    Network,
    FileSystem,
    Serialization,
    Server,
    Validation,
    Configuration,
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

// Helper to map anyhow errors to CommandError
impl From<anyhow::Error> for CommandError {
    fn from(err: anyhow::Error) -> Self {
        error!("Internal Error: {:?}", err);
        CommandError::new(ErrorKind::Unknown, err.to_string())
    }
}

// --- Data Structures ---

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TransferItem {
    pub variant_id: String,
    pub quantity: i32,
}

// The payload received from the Frontend (User Input)
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TransferRequest {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub to_location_id: Option<String>,
    pub items: Vec<TransferItem>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub notes: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub documents: Option<Vec<String>>,
}

// The payload sent to the API (User Input + Injected Context)
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TransferApiPayload {
    pub from_location_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub to_location_id: Option<String>,
    pub items: Vec<TransferItem>,

    // UPDATED: Added skip_serializing_if to ensure these are omitted if None
    #[serde(skip_serializing_if = "Option::is_none")]
    pub notes: Option<String>,

    // UPDATED: Added skip_serializing_if to ensure these are omitted if None
    #[serde(skip_serializing_if = "Option::is_none")]
    pub documents: Option<Vec<String>>,
}

// --- Internal Helpers ---

async fn handle_response<T: for<'de> Deserialize<'de>>(
    response: reqwest::Response,
    context: &str,
) -> Result<T, CommandError> {
    let status = response.status();

    if status.is_success() {
        let raw_val: serde_json::Value = response.json().await.map_err(|e| {
            error!("[{}] JSON Read Error: {}", context, e);
            CommandError::new(
                ErrorKind::Serialization,
                "Failed to process server response",
            )
            .with_details(e.to_string())
        })?;

        let target = if let Some(d) = raw_val.get("data") {
            if !d.is_null() {
                d
            } else {
                &raw_val
            }
        } else {
            &raw_val
        };

        if let Ok(result) = serde_json::from_value::<T>(target.clone()) {
            return Ok(result);
        }

        return serde_json::from_value::<T>(raw_val.clone()).map_err(|e| {
            error!("[{}] JSON Parse Error: {} | Raw: {}", context, e, raw_val);
            CommandError::new(
                ErrorKind::Serialization,
                "Failed to process server response",
            )
            .with_details(e.to_string())
        });
    }

    let error_body = response
        .text()
        .await
        .unwrap_or_else(|_| "No content".to_string());
    error!("[{}] API Error {}: {}", context, status, error_body);

    match status.as_u16() {
        401 | 403 => Err(CommandError::new(
            ErrorKind::Authentication,
            "Session expired or unauthorized",
        )
        .with_details(error_body)),
        400 | 422 => Err(
            CommandError::new(ErrorKind::Validation, "Invalid request data")
                .with_details(error_body),
        ),
        404 => {
            Err(CommandError::new(ErrorKind::Server, "Resource not found").with_details(error_body))
        }
        500..=599 => {
            Err(CommandError::new(ErrorKind::Server, "Remote server error")
                .with_details(error_body))
        }
        _ => Err(
            CommandError::new(ErrorKind::Unknown, format!("Unexpected status: {}", status))
                .with_details(error_body),
        ),
    }
}

// --- Public Commands ---

#[tauri::command]
pub async fn submit_stock_transfer(
    auth_state: State<'_, AuthState>,
    payload: TransferRequest,
) -> Result<serde_json::Value, CommandError> {
    let current_location_id = {
        let config_guard = auth_state.device_config.lock().map_err(|_| {
            CommandError::new(ErrorKind::Configuration, "Failed to lock device config")
        })?;
        let config = config_guard.as_ref().ok_or_else(|| {
            CommandError::new(ErrorKind::Configuration, "Device is not configured")
        })?;
        config.location_id.clone()
    };

    let api_payload = TransferApiPayload {
        from_location_id: current_location_id.clone(),
        to_location_id: payload.to_location_id,
        items: payload.items,
        notes: payload.notes,
        documents: payload.documents,
    };

    info!(
        "[StockTransfer] Submitting transfer from {} to {:?}",
        current_location_id, api_payload.to_location_id
    );

    let req = auth_state.build_request(reqwest::Method::POST, crate::api_config::routes::INVENTORY_TRANSFERS)
        .map_err(|e| CommandError::new(ErrorKind::Configuration, e))?;

    let resp = req
        .json(&api_payload)
        .send()
        .await
        .map_err(|e| {
            CommandError::new(ErrorKind::Network, "Failed to submit transfer request")
                .with_details(e.to_string())
        })?;

    handle_response(resp, "SubmitStockTransfer").await
}

#[tauri::command]
pub async fn submit_stock_request(
    auth_state: State<'_, AuthState>,
    payload: TransferRequest,
) -> Result<serde_json::Value, CommandError> {
    let current_location_id = {
        let config_guard = auth_state.device_config.lock().map_err(|_| {
            CommandError::new(ErrorKind::Configuration, "Failed to lock device config")
        })?;
        let config = config_guard.as_ref().ok_or_else(|| {
            CommandError::new(ErrorKind::Configuration, "Device is not configured")
        })?;
        config.location_id.clone()
    };

    let api_payload = TransferApiPayload {
        from_location_id: current_location_id.clone(),
        to_location_id: payload.to_location_id,
        items: payload.items,
        notes: payload.notes,
        documents: payload.documents,
    };

    info!(
        "[StockRequest] Submitting request from {} to {:?}",
        current_location_id, api_payload.to_location_id
    );

    let req = auth_state.build_request(reqwest::Method::POST, crate::api_config::routes::INVENTORY_REQUESTS)
        .map_err(|e| CommandError::new(ErrorKind::Configuration, e))?;

    let resp = req
        .json(&api_payload)
        .send()
        .await
        .map_err(|e| {
            CommandError::new(ErrorKind::Network, "Failed to submit stock request")
                .with_details(e.to_string())
        })?;

    handle_response(resp, "SubmitStockRequest").await
}