use crate::auth_store::AuthState;
use anyhow::Result;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct Driver {
    pub id: String,
    pub member: DriverMember,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DriverMember {
    pub name: String,
    // Add other fields if necessary
}

// --- Commands ---

#[tauri::command]
pub async fn get_drivers_command(auth_state: State<'_, AuthState>) -> Result<Vec<Driver>, String> {
    let request =
        auth_state.build_request(reqwest::Method::GET, crate::api_config::routes::DRIVERS)?;

    let res = request.send().await.map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        return Err(format!("Failed to fetch drivers: {}", res.status()));
    }

    let drivers: Vec<Driver> = res.json().await.map_err(|e| e.to_string())?;
    Ok(drivers)
}

#[tauri::command]
pub async fn dispatch_order_command(
    auth_state: State<'_, AuthState>,
    transaction_id: String,
    payload: serde_json::Value,
) -> Result<serde_json::Value, String> {
    let path = format!(
        "{}?transactionId={}",
        crate::api_config::routes::DELIVERY_DISPATCH,
        transaction_id
    );

    let request = auth_state.build_request(reqwest::Method::POST, &path)?;

    let res = request
        .json(&payload)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let status = res.status();
    if !status.is_success() {
        let err_text = res.text().await.unwrap_or_default();
        return Err(format!("Dispatch failed: {} - {}", status, err_text));
    }

    let data: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
    Ok(data)
}

#[tauri::command]
pub async fn reconcile_delivery_command(
    auth_state: State<'_, AuthState>,
    fulfillment_id: String,
    file_path: Option<String>,
    notes: Option<String>,
) -> Result<serde_json::Value, String> {
    let request = auth_state.build_request(
        reqwest::Method::POST,
        crate::api_config::routes::DELIVERY_RECONCILE,
    )?;

    let mut form = reqwest::multipart::Form::new().text("fulfilmentId", fulfillment_id);

    if let Some(n) = notes {
        form = form.text("notes", n);
    }

    // If we have a file path, we need to read it and add it to the multipart form
    // NOTE: This assumes the frontend sends a file path (e.g. from a file selector or drag/drop)
    // If the frontend sends raw bytes, we'd handle it differently.
    // For now, let's assume we might receive a file path from the Tauri dialog.
    if let Some(path) = file_path {
        // Read file content
        match tokio::fs::read(&path).await {
            Ok(file_bytes) => {
                let part = reqwest::multipart::Part::bytes(file_bytes)
                    .file_name(
                        std::path::Path::new(&path)
                            .file_name()
                            .unwrap_or_default()
                            .to_string_lossy()
                            .to_string(),
                    )
                    .mime_str("application/octet-stream") // Or try to guess mime type
                    .map_err(|e| e.to_string())?;

                form = form.part("file", part);
            }
            Err(e) => return Err(format!("Failed to read file at {}: {}", path, e)),
        }
    }

    let res = request
        .multipart(form)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let status = res.status();
    if !status.is_success() {
        let err_text = res.text().await.unwrap_or_default();
        return Err(format!("Reconciliation failed: {} - {}", status, err_text));
    }

    let data: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
    Ok(data)
}
