use tauri::{AppHandle, State};

use crate::models;
use crate::stores::auth_store::AuthState;
use crate::stores::customer_store::{self, CustomerState};

#[tauri::command]
pub async fn sync_customers_command(
    app: AppHandle,
    state: State<'_, CustomerState>,
    auth_state: State<'_, AuthState>,
) -> Result<String, String> {
    match customer_store::run_sync(app, &state, &auth_state).await {
        Ok(count) => Ok(format!("Synced {} customers", count)),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn create_customer_command(
    app: AppHandle,
    state: State<'_, CustomerState>,
    auth_state: State<'_, AuthState>,
    data: serde_json::Value,
) -> Result<models::PosCustomer, String> {
    customer_store::create_customer(app, &state, &auth_state, data)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_customer_command(
    app: AppHandle,
    state: State<'_, CustomerState>,
    auth_state: State<'_, AuthState>,
    id: String,
    data: serde_json::Value,
) -> Result<models::PosCustomer, String> {
    customer_store::update_customer(app, &state, &auth_state, id, data)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn search_customers_command(
    app: AppHandle,
    state: State<'_, CustomerState>,
    query: String,
) -> Result<Vec<models::PosCustomer>, String> {
    Ok(customer_store::search_local(&app, &state, query).await)
}

#[tauri::command]
pub async fn get_customers_by_ids_command(
    app: AppHandle,
    state: State<'_, CustomerState>,
    ids: Vec<String>,
) -> Result<Vec<models::PosCustomer>, String> {
    Ok(customer_store::get_customers_by_ids(&app, &state, ids).await)
}

#[tauri::command]
pub async fn delete_local_customer_command(
    app: AppHandle,
    state: State<'_, CustomerState>,
    id: String,
) -> Result<String, String> {
    customer_store::delete_local_customer(&app, &state, &id).await
        .map_err(|e| e.to_string())
}
