
use crate::stores::auth_store::AuthState;
use crate::stores::customer_store::CustomerState;
use crate::stores::product_store::{self, ProductState};
use crate::stores::sales_store::SalesState;

#[tauri::command]
#[cfg(not(feature = "standalone"))]
pub async fn sync_products_command(
    app: tauri::AppHandle,
    state: tauri::State<'_, ProductState>,
    auth_state: tauri::State<'_, AuthState>,
    force_full_sync: Option<bool>,
) -> Result<String, String> {
    match product_store::run_sync(app, &state, &auth_state, force_full_sync.unwrap_or(false)).await {
        Ok(count) => Ok(format!("Synced {} products", count)),
        Err(e) => {
            // We still convert the error to a string so the frontend can display it
            Err(e.to_string())
        }
    }
}

#[tauri::command]
pub async fn search_products_command(
    app: tauri::AppHandle,
    state: tauri::State<'_, ProductState>,
    auth_state: tauri::State<'_, AuthState>,
    query: String,
    category: String,
    page: Option<usize>,
    page_size: Option<usize>,
) -> Result<crate::models::ProductSearchResponse, String> {
    let location_id = {
        let config_guard = auth_state
            .device_config
            .lock()
            .unwrap_or_else(|e| e.into_inner());
        config_guard
            .as_ref()
            .map(|c| c.location_id.clone())
            .unwrap_or_else(|| "standalone".to_string())
    };
    
    let result = product_store::search_local(&app, &state, &location_id, query, category, page, page_size).await;
    Ok(result)
}

#[tauri::command]
pub async fn search_global_command(
    app: tauri::AppHandle,
    product_state: tauri::State<'_, ProductState>,
    customer_state: tauri::State<'_, CustomerState>,
    sales_state: tauri::State<'_, SalesState>,
    auth_state: tauri::State<'_, AuthState>,
    query: String,
) -> Result<crate::models::GlobalSearchResult, String> {
    let location_id = {
        let config_guard = auth_state
            .device_config
            .lock()
            .unwrap_or_else(|e| e.into_inner());
        config_guard
            .as_ref()
            .map(|c| c.location_id.clone())
            .unwrap_or_else(|| "standalone".to_string())
    };

    let products = product_store::search_local(
        &app,
        &product_state,
        &location_id,
        query.clone(),
        "All".to_string(),
        Some(1),
        Some(5),
    )
    .await
    .products;

    let customers = crate::stores::customer_store::search_local(&app, &customer_state, query.clone())
        .await
        .into_iter()
        .take(5)
        .collect();

    let sales = crate::stores::sales_store::search_local(app.clone(), &sales_state, query)
        .await
        .into_iter()
        .take(5)
        .collect();

    Ok(crate::models::GlobalSearchResult {
        products,
        customers,
        sales,
    })
}

#[tauri::command]
pub async fn get_products_by_ids_command(
    app: tauri::AppHandle,
    state: tauri::State<'_, ProductState>,
    auth_state: tauri::State<'_, AuthState>,
    ids: Vec<String>,
) -> Result<Vec<crate::models::PosProduct>, String> {
    let location_id = {
        let config_guard = auth_state
            .device_config
            .lock()
            .unwrap_or_else(|e| e.into_inner());
        config_guard
            .as_ref()
            .map(|c| c.location_id.clone())
            .unwrap_or_else(|| "standalone".to_string())
    };
    
    let products = product_store::get_products_by_ids(&app, &state, &location_id, ids).await;
    Ok(products)
}

#[tauri::command]
pub async fn create_local_product_command(
    app: tauri::AppHandle,
    state: tauri::State<'_, ProductState>,
    product: crate::models::PosProduct,
) -> Result<String, String> {
    product_store::create_local_product(&app, &state, product).await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_local_product_command(
    app: tauri::AppHandle,
    state: tauri::State<'_, ProductState>,
    product: crate::models::PosProduct,
) -> Result<String, String> {
    product_store::update_local_product(&app, &state, product).await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_local_product_command(
    app: tauri::AppHandle,
    state: tauri::State<'_, ProductState>,
    product_id: String,
    location_id: String,
) -> Result<String, String> {
    product_store::delete_local_product(&app, &state, &product_id, &location_id).await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_product_by_barcode_command(
    app: tauri::AppHandle,
    state: tauri::State<'_, ProductState>,
    auth_state: tauri::State<'_, AuthState>,
    barcode: String,
) -> Result<Option<crate::models::PosProduct>, String> {
    product_store::get_product_by_barcode(app, state, auth_state, barcode).await
}