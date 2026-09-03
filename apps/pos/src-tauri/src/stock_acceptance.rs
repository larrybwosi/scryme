use crate::auth_store::AuthState;
use crate::stock_acceptance_models::{
    CommandError, DocumentMetadata, ErrorKind, IncomingResponse, ReceivePurchaseRequest,
    ReceiveTransferRequest, StockProcessRequest,
};
use base64::{engine::general_purpose, Engine as _};
use log::{error, info, warn};
use reqwest::multipart::{Form, Part};
use std::path::Path;
use tauri::{AppHandle, Manager, State};
use uuid::Uuid;

// --- Constants ---

const MAX_FILE_SIZE: u64 = 20 * 1024 * 1024; // 20 MB in bytes

// --- Error Handling Implementation ---

impl From<anyhow::Error> for CommandError {
    fn from(err: anyhow::Error) -> Self {
        error!("Internal Error: {:?}", err);
        CommandError::new(ErrorKind::Unknown, err.to_string())
    }
}

async fn handle_response<T: for<'de> serde::Deserialize<'de>>(
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
        413 => Err(CommandError::new(
            ErrorKind::Validation,
            "File upload too large (Max 20MB)",
        )),
        400 | 422 => Err(
            CommandError::new(ErrorKind::Validation, "Invalid request data")
                .with_details(error_body),
        ),
        404 => {
            Err(CommandError::new(ErrorKind::Server, "Resource not found").with_details(error_body))
        }
        409 => Err(
            CommandError::new(ErrorKind::Validation, "Conflict: Item already processed")
                .with_details(error_body),
        ),
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
pub async fn save_document_locally(
    app: AppHandle,
    filename: String,
    file_type: String,
    base64_data: String,
) -> Result<DocumentMetadata, CommandError> {
    let app_dir = app.path().app_data_dir().map_err(|e| {
        CommandError::new(ErrorKind::Storage, format!("AppData folder error: {}", e))
    })?;

    let docs_dir = app_dir.join("documents");

    if !docs_dir.exists() {
        tokio::fs::create_dir_all(&docs_dir).await.map_err(|e| {
            CommandError::new(
                ErrorKind::Storage,
                format!("Failed to create docs folder: {}", e),
            )
        })?;
    }

    let unique_id = Uuid::now_v7().to_string();
    let sanitized_name =
        filename.replace(|c: char| !c.is_alphanumeric() && c != '.' && c != '-', "_");
    let safe_filename = format!("{}_{}", unique_id, sanitized_name);
    let file_path = docs_dir.join(&safe_filename);

    let bytes = general_purpose::STANDARD
        .decode(&base64_data)
        .map_err(|e| {
            CommandError::new(ErrorKind::Validation, format!("Invalid Base64 data: {}", e))
        })?;

    tokio::fs::write(&file_path, &bytes).await.map_err(|e| {
        CommandError::new(ErrorKind::Storage, format!("Failed to save file: {}", e))
    })?;

    info!("[DeliveryStore] Saved document: {}", safe_filename);

    Ok(DocumentMetadata {
        id: unique_id,
        name: filename,
        doc_type: file_type,
        path: file_path.to_string_lossy().to_string(),
        size: bytes.len() as u64,
    })
}

#[tauri::command]
pub async fn submit_stock_process(
    auth_state: State<'_, AuthState>,
    payload: StockProcessRequest,
) -> Result<serde_json::Value, CommandError> {
    info!(
        "[StockAcceptance] Submitting process for batch {} - Action: {}",
        payload.batch_id, payload.action
    );

    let req = auth_state.build_request(reqwest::Method::POST, crate::api_config::routes::INVENTORY_PROCESS)
        .map_err(|e| CommandError::new(ErrorKind::Configuration, e))?;

    let resp = req.json(&payload).send().await.map_err(|e| {
        CommandError::new(ErrorKind::Network, "Failed to submit decision")
            .with_details(e.to_string())
    })?;

    handle_response(resp, "SubmitStockProcess").await
}

#[tauri::command]
pub async fn fetch_incoming_shipments(
    auth_state: State<'_, AuthState>,
    location_id: String,
) -> Result<IncomingResponse, CommandError> {
    info!(
        "[StockAcceptance] Fetching incoming shipments for location: {}",
        location_id
    );

    let req = auth_state.build_request(reqwest::Method::GET, crate::api_config::routes::INCOMING_SHIPMENTS)
        .map_err(|e| CommandError::new(ErrorKind::Configuration, e))?;

    let resp = req
        .query(&[("locationId", &location_id)])
        .send()
        .await
        .map_err(|e| {
            CommandError::new(ErrorKind::Network, "Failed to connect to server")
                .with_details(e.to_string())
        })?;

    handle_response(resp, "FetchIncomingShipments").await
}

/// Submits a Purchase Order receipt with optional file attachments.
/// Enforces a 20MB limit per file.
#[tauri::command]
pub async fn receive_purchase_order(
    auth_state: State<'_, AuthState>,
    purchase_id: String,
    payload: ReceivePurchaseRequest,
    file_paths: Option<Vec<String>>,
) -> Result<serde_json::Value, CommandError> {
    let encoded_id = urlencoding::encode(&purchase_id);
    let route = crate::api_config::routes::purchase_receive(&encoded_id);
    let req = auth_state.build_request(reqwest::Method::POST, &route)
        .map_err(|e| CommandError::new(ErrorKind::Configuration, e))?;

    info!(
        "[StockAcceptance] Submitting Receipt for PO: {}",
        purchase_id
    );

    // 1. Serialize the JSON payload
    let json_data = serde_json::to_string(&payload).map_err(|e| {
        CommandError::new(ErrorKind::Serialization, "Failed to serialize request data")
            .with_details(e.to_string())
    })?;

    // 2. Build the Multipart Form
    // Note: The API expects the JSON body in a field named "data"
    let mut form = Form::new().text("data", json_data);

    // 3. Process Files (if any)
    if let Some(paths) = file_paths {
        for path_str in paths {
            let path = Path::new(&path_str);

            // Safety Check: Validate File Size
            match tokio::fs::metadata(path).await {
                Ok(metadata) => {
                    if metadata.len() > MAX_FILE_SIZE {
                        let msg = format!("File '{}' exceeds the 20MB upload limit.", path_str);
                        warn!("[StockAcceptance] {}", msg);
                        return Err(CommandError::new(ErrorKind::Validation, "File too large")
                            .with_details(msg));
                    }
                }
                Err(e) => {
                    return Err(CommandError::new(
                        ErrorKind::FileSystem,
                        "Failed to check file size",
                    )
                    .with_details(format!("File: {}, Error: {}", path_str, e)));
                }
            }

            let filename = path
                .file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string();

            // Read file content
            match tokio::fs::read(&path_str).await {
                Ok(bytes) => {
                    let part = Part::bytes(bytes).file_name(filename);
                    form = form.part("files", part);
                }
                Err(e) => {
                    error!("Failed to read file {}: {}", path_str, e);
                    return Err(CommandError::new(
                        ErrorKind::FileSystem,
                        "Failed to read attachment",
                    )
                    .with_details(format!("File: {}, Error: {}", path_str, e)));
                }
            }
        }
    }

    // 4. Send Request
    let resp = req
        .multipart(form)
        .send()
        .await
        .map_err(|e| {
            CommandError::new(ErrorKind::Network, "Failed to submit purchase receipt")
                .with_details(e.to_string())
        })?;

    handle_response(resp, "ReceivePurchaseOrder").await
}

#[tauri::command]
pub async fn receive_stock_transfer(
    auth_state: State<'_, AuthState>,
    transfer_id: String,
    payload: ReceiveTransferRequest,
    file_paths: Option<Vec<String>>,
) -> Result<serde_json::Value, CommandError> {
    let encoded_id = urlencoding::encode(&transfer_id);
    let route = crate::api_config::routes::transfer_receive(&encoded_id);
    let req = auth_state.build_request(reqwest::Method::POST, &route)
        .map_err(|e| CommandError::new(ErrorKind::Configuration, e))?;

    info!(
        "[StockAcceptance] Submitting Receipt for Transfer: {}",
        transfer_id
    );

    // 1. Serialize the JSON payload
    let json_data = serde_json::to_string(&payload).map_err(|e| {
        CommandError::new(ErrorKind::Serialization, "Failed to serialize request data")
            .with_details(e.to_string())
    })?;

    // 2. Build the Multipart Form
    let mut form = Form::new().text("data", json_data);

    // 3. Process Files (if any)
    if let Some(paths) = file_paths {
        for path_str in paths {
            let path = Path::new(&path_str);

            match tokio::fs::metadata(path).await {
                Ok(metadata) => {
                    if metadata.len() > MAX_FILE_SIZE {
                        let msg = format!("File '{}' exceeds the 20MB upload limit.", path_str);
                        warn!("[StockAcceptance] {}", msg);
                        return Err(CommandError::new(ErrorKind::Validation, "File too large")
                            .with_details(msg));
                    }
                }
                Err(e) => {
                    return Err(CommandError::new(
                        ErrorKind::FileSystem,
                        "Failed to check file size",
                    )
                    .with_details(format!("File: {}, Error: {}", path_str, e)));
                }
            }

            let filename = path
                .file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string();

            match tokio::fs::read(&path_str).await {
                Ok(bytes) => {
                    let part = Part::bytes(bytes).file_name(filename);
                    form = form.part("files", part);
                }
                Err(e) => {
                    error!("Failed to read file {}: {}", path_str, e);
                    return Err(CommandError::new(
                        ErrorKind::FileSystem,
                        "Failed to read attachment",
                    )
                    .with_details(format!("File: {}, Error: {}", path_str, e)));
                }
            }
        }
    }

    // 4. Send Request
    let resp = req
        .multipart(form)
        .send()
        .await
        .map_err(|e| {
            CommandError::new(ErrorKind::Network, "Failed to submit transfer receipt")
                .with_details(e.to_string())
        })?;

    handle_response(resp, "ReceiveStockTransfer").await
}