use tauri::{AppHandle, command, State};
use crate::stores::product_store::{self, ProductState};
use crate::stores::auth_store::AuthState;
use crate::stores::customer_store::{self, CustomerState};
use crate::stores::sales_store::{self, SalesState};
use crate::stores::shift_store::{self, ShiftState};
use anyhow::Result;
use log::{info, error};

#[command]
pub async fn push_local_to_cloud(
    app: AppHandle,
    product_state: State<'_, ProductState>,
    customer_state: State<'_, CustomerState>,
    sales_state: State<'_, SalesState>,
    shift_state: State<'_, ShiftState>,
    auth_state: State<'_, AuthState>,
) -> Result<String, String> {
    let (base_url, location_id) = {
        let config_guard = auth_state.device_config.lock().map_err(|e| e.to_string())?;
        let config = config_guard.as_ref().ok_or("Cloud API not configured. Please set up your business first.")?;
        (config.base_url.clone(), config.location_id.clone())
    };

    if base_url.is_empty() {
        return Err("Cloud API not configured. Please set up your business first.".to_string());
    }

    info!("[Migration] Starting data push to cloud for location: {}", location_id);

    // 1. Push Customers
    let customers = customer_store::search_local(&app, &customer_state, "".to_string()).await;
    let mut customer_count = 0;
    for customer in customers {
        let payload = serde_json::to_value(&customer).map_err(|e| e.to_string())?;
        if let Err(e) = customer_store::create_customer_cloud(app.clone(), &customer_state, &auth_state, payload).await {
            error!("[Migration] Failed to push customer {}: {}", customer.id, e);
        } else {
            customer_count += 1;
        }
    }

    // 2. Push Products
    let products_res = product_store::search_local(&app, &product_state, "standalone", "".to_string(), "all".to_string(), Some(1), Some(1000)).await;
    let mut product_count = 0;
    for product in products_res.products {
        let path = crate::api_config::routes::PRODUCTS;
        let product_to_push = product.clone();
        // The API might expect product_id to be empty for new products or handle it
        let req = auth_state.build_request(reqwest::Method::POST, path).map_err(|e| e.to_string())?
            .json(&product_to_push);

        match req.send().await {
            Ok(resp) if resp.status().is_success() => product_count += 1,
            Ok(resp) => error!("[Migration] Failed to push product {}: {}", product.product_id, resp.status()),
            Err(e) => error!("[Migration] Network error pushing product {}: {}", product.product_id, e),
        }
    }

    // 3. Push Sales (Queued Sales)
    let pending_sales = sales_store::get_queue_status(app.clone(), &sales_state).await;
    let mut sales_count = 0;
    for sale in pending_sales {
        match sales_store::retry_single_sale(app.clone(), &sales_state, &auth_state, sale.id.clone()).await {
            Ok(_) => sales_count += 1,
            Err(e) => error!("[Migration] Failed to push sale {}: {}", sale.id, e),
        }
    }

    // 4. Push Shifts
    let sync_res = shift_store::sync_pending_shifts_cloud(app.clone(), &shift_state, &auth_state).await;
    info!("[Migration] Shift sync result: {:?}", sync_res);

    let summary = format!(
        "Migration Complete: {} Customers, {} Products, {} Sales pushed to cloud.",
        customer_count, product_count, sales_count
    );
    info!("[Migration] {}", summary);

    Ok(summary)
}
