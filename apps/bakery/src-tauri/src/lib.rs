mod commands;
mod db;
mod error;
mod migrations;
mod models;
mod scaling;
mod sync;

use tauri::{
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};

pub fn run() {
    let migrations = migrations::get_migrations();

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:bakery.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_log::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            commands::get_batches,
            commands::create_batch,
            commands::update_batch,
            commands::update_batch_status,
            commands::delete_batch,
            commands::get_recipes,
            commands::create_recipe,
            commands::update_recipe,
            commands::delete_recipe,
            commands::get_templates,
            commands::create_template,
            commands::update_template,
            commands::delete_template,
            commands::get_categories,
            commands::create_category,
            commands::update_category,
            commands::delete_category,
            commands::get_settings,
            commands::update_settings,
            commands::get_baker,
            commands::get_bakers,
            commands::create_baker,
            commands::update_baker,
            commands::delete_baker,
            commands::login_user,
            commands::login_staff,
            commands::scale_recipe,
            commands::get_overview,
            commands::login_local,
            commands::update_local_admin,
            commands::get_hardware_identifiers,
            commands::validate_api_health,
            commands::provision_device_with_token,
            commands::get_provisioned_api_key,
            commands::clear_provisioned_api_key,
            commands::get_system_units,
            commands::get_organization_units,
            commands::create_organization_unit,
            commands::update_organization_unit,
            commands::delete_organization_unit,
            commands::get_ingredients,
            commands::create_ingredient,
            commands::update_ingredient,
            commands::delete_ingredient,
            commands::restock_inventory,
            commands::get_batch_traceability,
        ])
        .setup(|app| {
            let handle = app.handle();
            let db_pool = match tauri::async_runtime::block_on(db::init(handle)) {
                Ok(pool) => pool,
                Err(e) => {
                    log::error!("Failed to initialize database: {}", e);
                    // Instead of panicking, we might want to show a dialog or exit gracefully
                    // For now, let's at least not use unwrap()
                    app.handle().exit(1);
                    return Ok(());
                }
            };

            app.manage(db_pool.clone());

            // Start sync worker
            let base_api_url = if cfg!(debug_assertions) {
                "http://localhost:3001"
            } else {
                option_env!("VITE_API_URL")
                    .unwrap_or("https://api.scryme.app")
            };
            let api_url = if base_api_url.ends_with("/api/v2") {
                base_api_url.to_string()
            } else {
                format!("{}/api/v2", base_api_url.trim_end_matches('/'))
            };
            tauri::async_runtime::spawn(sync::start_sync_worker(db_pool, api_url));

            // Set up tray icon
            let icon = app.default_window_icon().cloned();
            let mut tray_builder = TrayIconBuilder::new();
            if let Some(i) = icon {
                tray_builder = tray_builder.icon(i);
            }

            let _tray = tray_builder
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
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
                let _ = window.hide();
                api.prevent_close();
            }
        })
        .run(tauri::generate_context!())
        .map_err(|e| {
            log::error!("Error while running tauri application: {}", e);
            e
        })
        .ok();
}