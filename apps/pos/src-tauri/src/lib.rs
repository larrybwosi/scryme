#[cfg(not(debug_assertions))]
use better_posthog::events::capture;
#[cfg(not(debug_assertions))]
use dotenvy_macro::dotenv;
use log::error;
pub mod escpos_builder;
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, TrayIconBuilder, TrayIconEvent};
use tauri::Manager;
use tauri::Emitter;

pub mod stores;

mod api_config;
mod http_server;
mod models;
mod scanner_manager;
use scanner_manager::ScannerState;

// Features enabled by default, but excluded in standalone mode
#[cfg(not(feature = "standalone"))]
mod stock_acceptance;
#[cfg(not(feature = "standalone"))]
mod stock_acceptance_models;
#[cfg(not(feature = "standalone"))]
pub mod stock_transfer;

use stores::audit_store;
use stores::auth_store::{self, AuthState};
use stores::customer_store::{self, CustomerState};
use stores::delivery_store;
use stores::finance_store::{self, FinanceState};
use stores::pricing_store::{self, PricingState};
use stores::product_store::{self, ProductState};
use stores::sales_store::{self, SalesState};
use stores::shift_store::{self, ShiftState};
#[cfg(feature = "restaurant")]
use stores::table_store;

mod customer_manager;
mod pricing_manager;
mod printer_manager;
mod product_manager;
mod sale_manager;
mod shift_manager;

mod security;

mod notification_manager;
use notification_manager::NotificationState;

mod data_management;
mod licensing;
mod migration;

mod network_monitor;
use network_monitor::NetworkState;

mod customer_screen_state;
use customer_screen_state::CustomerScreenState;

#[cfg(all(not(feature = "standalone"), any(feature = "restaurant", feature = "pharmacy")))]
mod kds_hub_server;
#[cfg(all(not(feature = "standalone"), any(feature = "restaurant", feature = "pharmacy")))]
mod kds_models;
mod utils;

pub fn capture_event(event_name: &str, properties: Option<serde_json::Value>) {
    log::info!(
        "Analytics Event: {} - Properties: {:?}",
        event_name,
        properties
    );

    let mut builder = better_posthog::Event::builder()
        .event(event_name)
        .distinct_id("desktop_client");

    if let Some(serde_json::Value::Object(map)) = properties {
        for (key, value) in map {
            builder = builder.property(key, value);
        }
    }

    #[cfg(not(debug_assertions))]
    capture(builder.build());
}

#[cfg(test)]
mod tests;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let rt = tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()
        .unwrap();
    let _guard = rt.enter();

    #[cfg(not(debug_assertions))]
    let _posthog_guard = better_posthog::init(better_posthog::ClientOptions {
        api_key: Some(dotenv!("POSTHOG_API_KEY").into()),
        ..Default::default()
    });

    #[cfg(not(debug_assertions))]
    let client = sentry::init((
        dotenv!("SENTRY_DSN"),
        sentry::ClientOptions {
            release: sentry::release_name!(),
            auto_session_tracking: true,
            ..Default::default()
        },
    ));

    #[cfg(all(not(debug_assertions), not(target_os = "ios")))]
    let _minidump_guard = tauri_plugin_sentry::minidump::init(&client);

    #[cfg(not(debug_assertions))]
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_sentry::init(&client));

    #[cfg(debug_assertions)]
    let mut builder = tauri::Builder::default().plugin(tauri_plugin_sql::Builder::new().build());

    #[cfg(not(feature = "standalone"))]
    {
        builder = builder.plugin(tauri_plugin_updater::Builder::new().build());
    }

    builder
        .manage(ProductState::new())
        .manage(CustomerState::new())
        .manage(SalesState::new())
        .manage(PricingState::new())
        .manage(ShiftState::new())
        .manage(AuthState::new())
        .manage(FinanceState::new())
        .manage(NotificationState::new())
        .manage(NetworkState::new())
        .manage(CustomerScreenState::new())
        .manage(sales_store::SyncConfigState::new())
        .manage(ScannerState::default())
        .setup(|app| {
            capture_event("app_started", None);

            tauri::async_runtime::block_on(product_store::init_state(app.handle()));
            tauri::async_runtime::block_on(customer_store::init_state(app.handle()));
            tauri::async_runtime::block_on(pricing_store::init_state(app.handle()));
            tauri::async_runtime::block_on(finance_store::init_state(app.handle()));
            tauri::async_runtime::block_on(shift_store::init_state(app.handle()));
            tauri::async_runtime::block_on(audit_store::init_state(app.handle()));

            let state = app.state::<ProductState>();
            let auth_state_init = app.state::<AuthState>();
            let location_id_opt = {
                let config_guard = auth_state_init
                    .device_config
                    .lock()
                    .unwrap_or_else(|e| e.into_inner());
                config_guard.as_ref().map(|c| c.location_id.clone())
            };

            if let Some(location_id) = location_id_opt {
                if let Err(e) = tauri::async_runtime::block_on(
                    product_store::load_products_from_disk(app.handle(), &state, &location_id),
                ) {
                    error!(
                        "Failed to load initial data for location {}: {}",
                        location_id, e
                    );
                }
            } else if cfg!(feature = "standalone") {
                let _ = tauri::async_runtime::block_on(
                    product_store::load_products_from_disk(app.handle(), &state, "standalone"),
                );
            }

            let cust_state = app.state::<CustomerState>();
            if let Err(e) = tauri::async_runtime::block_on(
                customer_store::load_customers_from_disk(app.handle(), &cust_state),
            ) {
                error!("Failed to load initial customer data: {}", e);
            }

            let sales_state = app.state::<SalesState>();
            tauri::async_runtime::block_on(sales_store::init_state(app.handle(), &sales_state));
            
            #[cfg(not(feature = "standalone"))]
            {
                sales_store::start_auto_sync_task(app.handle().clone());

                let app_clone = app.handle().clone();
                tauri::async_runtime::spawn(async move {
                    loop {
                        tokio::time::sleep(std::time::Duration::from_secs(300)).await; // Every 5 minutes
                        let _ = finance_store::sync_petty_cash(app_clone.clone()).await;
                    }
                });
            }

            #[cfg(all(not(feature = "standalone"), feature = "restaurant"))]
            if let Err(e) = tauri::async_runtime::block_on(table_store::init_db(app.handle())) {
                error!("Failed to initialize table database: {}", e);
            }

            let pricing_state = app.state::<PricingState>();
            if let Err(e) = tauri::async_runtime::block_on(
                pricing_store::load_pricing_from_disk(app.handle(), &pricing_state),
            ) {
                error!("Failed to load initial pricing data: {}", e);
            }

            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let state = app_handle.state::<NotificationState>();
                notification_manager::init_notification_state(&app_handle, &state).await;
            });

            #[cfg(not(feature = "standalone"))]
            let notification_state = app.state::<NotificationState>();

            let customer_screen_state = app.state::<CustomerScreenState>();
            if let Err(e) = tauri::async_runtime::block_on(
                customer_screen_state.load_from_store(app.handle()),
            ) {
                error!("Failed to load customer screen state: {}", e);
            }

            #[cfg(not(feature = "standalone"))]
            {
                let old_sales = tauri::async_runtime::block_on(sales_store::check_old_pending_sales(
                    app.handle().clone(),
                    &sales_state,
                    3,
                ));

                if !old_sales.is_empty() {
                    let notification = notification_manager::AppNotification::new(
                        notification_manager::NotificationType::Warning,
                        notification_manager::NotificationPriority::High,
                        "Old Pending Sales Detected".to_string(),
                        format!(
                            "You have {} pending sales older than 3 days. Please sync them to avoid data loss.",
                            old_sales.len()
                        ),
                    );
                    notification_state.add_notification(notification.clone());
                    let _ = tauri::async_runtime::block_on(notification_manager::save_notification_to_db(app.handle(), &notification));
                    let _ = app.emit("old-sales-detected", old_sales.len());
                }

                let failed_sales = tauri::async_runtime::block_on(sales_store::check_failed_sales(
                    app.handle().clone(),
                    &sales_state,
                    5,
                ));
                if !failed_sales.is_empty() {
                    let _ = app.emit("failed-sales-detected", failed_sales);
                }
            }

            let auth_state_ref = app.state::<AuthState>();
            let initial_base_url = {
                let config_guard = auth_state_ref
                    .device_config
                    .lock()
                    .unwrap_or_else(|e| e.into_inner());
                config_guard.as_ref().map(|c| c.base_url.clone())
            };

            let network_state = app.state::<NetworkState>();
            if let Some(url) = initial_base_url {
                network_state.set_base_url(url);
            }

            if customer_screen_state.is_enabled() {
                let app_handle = app.handle().clone();
                tauri::async_runtime::spawn(async move {
                    if let Err(e) = customer_screen_state::open_customer_screen(app_handle).await {
                        eprintln!("Failed to open customer screen on startup: {}", e);
                    }
                });
            }

            let args: Vec<String> = std::env::args().collect();
            if !args.contains(&"--minimized".to_string()) {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }

            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let show_i = MenuItem::with_id(app, "show", "Show Main Window", true, None::<&str>)?;
            let hide_i = MenuItem::with_id(app, "hide", "Hide Main Window", true, None::<&str>)?;
            let customer_i = MenuItem::with_id(app, "customer", "Open Customer Display", true, None::<&str>)?;
            let sep = PredefinedMenuItem::separator(app)?;

            let menu = Menu::with_items(app, &[&show_i, &hide_i, &customer_i, &sep, &quit_i])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => app.exit(0),
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "hide" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.hide();
                        }
                    }
                    "customer" => {
                        let app_handle = app.clone();
                        let state = app.state::<CustomerScreenState>();
                        if state.is_enabled() {
                            tauri::async_runtime::spawn(async move {
                                let _ = customer_screen_state::open_customer_screen(app_handle).await;
                            });
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click { button: MouseButton::Left, .. } = event {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "main" {
                    api.prevent_close();
                    let _ = window.hide();
                } else if window.label() == "customer" {
                    let app_handle = window.app_handle().clone();
                    let state = app_handle.state::<CustomerScreenState>();
                    state.set_enabled(false);
                    tauri::async_runtime::spawn(async move {
                        let state = app_handle.state::<CustomerScreenState>();
                        let _ = state.save_to_store(&app_handle).await;
                    });
                }
            }
        })
        .plugin(tauri_plugin_log::Builder::new().level(log::LevelFilter::Info).build())
        .plugin(tauri_plugin_websocket::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_upload::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_autostart::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_hid::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_better_posthog::init())
        .invoke_handler(tauri::generate_handler![
            scanner_manager::start_scan,
            scanner_manager::list_hid_devices,
            scanner_manager::start_nfc_listener,
            scanner_manager::start_network_scan_server,
            scanner_manager::print_to_network,
            sale_manager::scan_transaction_code,
            customer_screen_state::open_customer_screen,
            customer_screen_state::close_customer_screen,
            customer_screen_state::set_customer_screen_enabled,
            customer_screen_state::get_customer_screen_state,
            #[cfg(not(feature = "standalone"))]
            product_manager::sync_products_command,
            product_manager::search_products_command,
            product_manager::search_global_command,
            product_manager::get_products_by_ids_command,
            product_manager::create_local_product_command,
            product_manager::update_local_product_command,
            product_manager::delete_local_product_command,
            product_manager::get_product_by_barcode_command,
            #[cfg(not(feature = "standalone"))]
            product_store::switch_location,
            printer_manager::get_serial_ports,
            printer_manager::open_cash_drawer,
            printer_manager::print_test_page,
            #[cfg(not(feature = "standalone"))]
            customer_manager::sync_customers_command,
            customer_manager::search_customers_command,
            customer_manager::get_customers_by_ids_command,
            customer_manager::create_customer_command,
            sale_manager::process_sale_command,
            #[cfg(not(feature = "standalone"))]
            sale_manager::sync_sales_command,
            sale_manager::get_pending_sales_command,
            #[cfg(not(feature = "standalone"))]
            pricing_manager::sync_pricing_command,
            pricing_manager::resolve_price_batch_command,
            pricing_manager::get_pos_pricing_command,
            printer_manager::print_network_receipt,
            printer_manager::print_system_receipt,
            printer_manager::print_usb,
            printer_manager::get_system_printers,
            printer_manager::discover_network_printers,
            printer_manager::save_printer_config,
            printer_manager::get_printer_config,
            printer_manager::print_job,
            printer_manager::print_receipt_native,
            printer_manager::print_kitchen_native,
            printer_manager::print_bar_native,
            printer_manager::print_labels_command,
            shift_manager::open_shift_command,
            shift_manager::get_shift_command,
            shift_manager::add_cash_drop_command,
            shift_manager::record_shift_sale_command,
            shift_manager::close_shift_command,
            #[cfg(not(feature = "standalone"))]
            shift_manager::sync_shifts_command,
            auth_store::set_device_config,
            auth_store::login_member,
            auth_store::logout_member,
            auth_store::switch_active_member,
            auth_store::get_device_config,
            auth_store::restore_member_session,
            auth_store::reset_device_config,
            auth_store::authenticated_api_request,
            #[cfg(not(feature = "standalone"))]
            auth_store::update_device_location,
            notification_manager::send_native_notification,
            notification_manager::get_notification_history,
            notification_manager::get_unread_notification_count,
            notification_manager::mark_notification_read,
            notification_manager::mark_all_notifications_read,
            notification_manager::delete_notification,
            notification_manager::clear_all_notifications,
            data_management::dangerously_clear_all_data,
            sale_manager::retry_sale_command,
            sale_manager::check_old_sales_command,
            sale_manager::check_failed_sales_command,
            sale_manager::delete_sale_command,
            network_monitor::get_network_status_command,
            network_monitor::update_network_status_command,
            sale_manager::create_order_command,
            sale_manager::get_invoice_blob_command,
            delivery_store::get_drivers_command,
            delivery_store::dispatch_order_command,
            delivery_store::reconcile_delivery_command,
            sales_store::get_sales_history_command,
            sales_store::record_payment_command,
            sales_store::initiate_mpesa_payment_command,
            sales_store::invalidate_sale_command,
            finance_store::register_petty_cash_command,
            sales_store::set_sync_interval_command,
            auth_store::set_negative_stock_command,
            #[cfg(not(feature = "standalone"))]
            auth_store::get_locations_command,
            #[cfg(not(feature = "standalone"))]
            auth_store::get_ably_auth_token_command,
            #[cfg(all(not(feature = "standalone"), feature = "restaurant"))]
            auth_store::start_device_setup_command,
            
            // Stock Acceptance - Only disabled in standalone
            #[cfg(not(feature = "standalone"))]
            stock_acceptance::save_document_locally,
            #[cfg(not(feature = "standalone"))]
            stock_acceptance::fetch_incoming_shipments,
            #[cfg(not(feature = "standalone"))]
            stock_acceptance::receive_purchase_order,
            #[cfg(not(feature = "standalone"))]
            stock_acceptance::receive_stock_transfer,
            #[cfg(not(feature = "standalone"))]
            stock_acceptance::submit_stock_process,
            #[cfg(not(feature = "standalone"))]
            stock_transfer::submit_stock_transfer,
            #[cfg(not(feature = "standalone"))]
            stock_transfer::submit_stock_request,

            http_server::start_file_server,
            audit_store::write_audit_log,
            audit_store::get_audit_logs,
            audit_store::get_system_logs,
            #[cfg(all(not(feature = "standalone"), any(feature = "restaurant", feature = "pharmacy")))]
            kds_hub_server::start_kds_hub,
            #[cfg(all(not(feature = "standalone"), any(feature = "restaurant", feature = "pharmacy")))]
            kds_hub_server::stop_kds_hub,
            #[cfg(all(not(feature = "standalone"), any(feature = "restaurant", feature = "pharmacy")))]
            kds_hub_server::get_hub_status,
            #[cfg(all(not(feature = "standalone"), any(feature = "restaurant", feature = "pharmacy")))]
            kds_hub_server::get_connected_devices,
            #[cfg(all(not(feature = "standalone"), any(feature = "restaurant", feature = "pharmacy")))]
            kds_hub_server::assign_user_to_device,
            utils::get_local_ip_command,
            #[cfg(feature = "restaurant")]
            table_store::get_tables_command,
            #[cfg(feature = "restaurant")]
            table_store::upsert_table_command,
            #[cfg(feature = "restaurant")]
            table_store::delete_table_command,
            #[cfg(feature = "restaurant")]
            table_store::update_table_status_command,
            #[cfg(feature = "restaurant")]
            table_store::get_table_history_command,
            licensing::get_machine_id,
            licensing::activate_license,
            licensing::set_local_auth,
            licensing::verify_local_auth,
            migration::push_local_to_cloud,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
