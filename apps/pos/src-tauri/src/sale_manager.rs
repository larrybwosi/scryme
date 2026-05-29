use tauri::{AppHandle, State};

use crate::models;
use crate::stores::auth_store::AuthState;
use crate::stores::product_store::ProductState;
use crate::stores::sales_store::{self, SalesState};
use crate::stores::shift_store::ShiftState;

#[tauri::command]
pub async fn process_sale_command(
    app: AppHandle,
    state: State<'_, SalesState>,
    product_state: State<'_, ProductState>,
    shift_state: State<'_, ShiftState>,
    auth_state: State<'_, AuthState>,
    sale_id: String,
    payload: serde_json::Value,
) -> Result<models::SaleResponse, String> {
    // Pass auth_state and shift_state to the logic
    let result = sales_store::process_sale(
        app.clone(),
        &state,
        &product_state,
        &shift_state,
        sale_id.clone(),
        payload.clone(),
        &auth_state,
    )
    .await
    .map_err(|e| e.to_string());

    // --- Audit Logging ---
    let (actor_name, location_id) = {
        let config_guard = auth_state
            .device_config
            .lock()
            .unwrap_or_else(|e| e.into_inner());
        let user = auth_state.get_active_user().unwrap_or(None);
        (
            user.map(|u| u.name.clone()),
            config_guard.as_ref().map(|c| c.location_id.clone()),
        )
    };

    match &result {
        Ok(_) => {
            let payment_method = payload
                .get("paymentMethod")
                .and_then(|v| v.as_str())
                .unwrap_or("UNKNOWN");
            let total = payload.get("total").and_then(|v| v.as_f64()).unwrap_or(0.0);
            let _ = crate::stores::audit_store::write_event(
                &app,
                crate::stores::audit_store::AuditLevel::Info,
                "SALE_PROCESSED",
                None,
                actor_name,
                location_id,
                None,
                serde_json::json!({ "sale_id": sale_id, "total": total, "payment_method": payment_method }),
            );
        }
        Err(e) => {
            let _ = crate::stores::audit_store::write_event(
                &app,
                crate::stores::audit_store::AuditLevel::Critical,
                "SALE_FAILED",
                None,
                actor_name,
                location_id,
                None,
                serde_json::json!({ "sale_id": sale_id, "error": e }),
            );
        }
    }

    result
}

#[tauri::command]
pub async fn sync_sales_command(
    app: AppHandle,
    state: State<'_, SalesState>,
    auth_state: State<'_, AuthState>,
) -> Result<String, String> {
    match sales_store::sync_pending_sales(app, &state, &auth_state).await {
        Ok(count) => Ok(format!("Synced {} sales", count)),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn get_pending_sales_command(
    app: AppHandle,
    state: State<'_, SalesState>,
) -> Result<Vec<models::QueuedSale>, String> {
    Ok(sales_store::get_queue_status(app, &state).await)
}

#[tauri::command]
pub async fn retry_sale_command(
    app: AppHandle,
    state: State<'_, SalesState>,
    auth_state: State<'_, AuthState>,
    sale_id: String,
) -> Result<bool, String> {
    sales_store::retry_single_sale(app, &state, &auth_state, sale_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn check_old_sales_command(
    app: AppHandle,
    state: State<'_, SalesState>,
    days_threshold: u64,
) -> Result<Vec<models::QueuedSale>, String> {
    Ok(sales_store::check_old_pending_sales(app, &state, days_threshold).await)
}

#[tauri::command]
pub async fn check_failed_sales_command(
    app: tauri::AppHandle,
    state: tauri::State<'_, SalesState>,
    retry_threshold: u32,
) -> Result<Vec<crate::models::QueuedSale>, String> {
    Ok(sales_store::check_failed_sales(app, &state, retry_threshold).await)
}

#[tauri::command]
pub async fn delete_sale_command(
    app: AppHandle,
    state: State<'_, SalesState>,
    sale_id: String,
) -> Result<bool, String> {
    sales_store::delete_sale(&app, &state, sale_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn scan_transaction_code(
    _state: State<'_, SalesState>,
    auth_state: State<'_, AuthState>,
    code: String,
) -> Result<serde_json::Value, String> {
    sales_store::scan_transaction_qr(&auth_state, code)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_order_command(
    auth_state: State<'_, AuthState>,
    location_id: String,
    order: serde_json::Value,
) -> Result<serde_json::Value, String> {
    sales_store::create_order(&auth_state, location_id, order)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_invoice_blob_command(
    auth_state: State<'_, AuthState>,
    url: String,
) -> Result<Vec<u8>, String> {
    let (device_key, token, base_url) = {
        let config_guard = auth_state.device_config.lock().map_err(|e| e.to_string())?;
        let config = config_guard.as_ref().ok_or("Device not initialized")?;

        let token = auth_state.get_active_token()?;

        (
            config.device_key.clone(),
            token,
            config.base_url.clone(),
        )
    };

    let full_url = if url.starts_with("http") {
        url
    } else {
        format!(
            "{}/{}",
            base_url.trim_end_matches('/'),
            url.trim_start_matches('/')
        )
    };

    let mut headers = reqwest::header::HeaderMap::new();
    headers.insert(
        "X-API-KEY",
        reqwest::header::HeaderValue::from_str(&device_key).map_err(|e| e.to_string())?,
    );

    if let Some(t) = token {
        headers.insert(
            "X-MEMBER-TOKEN",
            reqwest::header::HeaderValue::from_str(&t).map_err(|e| e.to_string())?,
        );
    }


    let client = reqwest::Client::builder()
        .default_headers(headers)
        .build()
        .map_err(|e| e.to_string())?;

    let resp = client
        .get(&full_url)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let status = resp.status();
    if !status.is_success() {
        let error_text = resp
            .text()
            .await
            .unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!(
            "Failed to fetch invoice: {} - {}",
            status, error_text
        ));
    }

    let bytes = resp.bytes().await.map_err(|e| e.to_string())?;
    Ok(bytes.to_vec())
}