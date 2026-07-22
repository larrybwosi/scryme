use tauri::{AppHandle, State, Manager};
// use tauri_plugin_aptabase::EventTracker;

use crate::models::Shift;
use crate::stores::shift_store::{self, ShiftState};

// Fixed import: correctly use auth_store
use crate::stores::auth_store::AuthState as AuthStateStore;

// --- SHIFT COMMANDS ---

#[tauri::command]
pub async fn get_shift_command(app: AppHandle, state: State<'_, ShiftState>) -> Result<Option<Shift>, String> {
    Ok(shift_store::get_shift_status(&app, &state))
}

#[tauri::command]
pub async fn add_cash_drop_command(
    app: AppHandle,
    state: State<'_, ShiftState>,
    amount: f64,
    reason: String,
) -> Result<(), String> {
    shift_store::record_cash_drop(&app, &state, amount, reason).await
}

#[tauri::command]
pub async fn record_shift_sale_command(app: AppHandle, state: State<'_, ShiftState>, amount: f64) -> Result<(), String> {
    shift_store::record_cash_sale(&app, &state, amount).await
}

#[tauri::command]
pub async fn open_shift_command(
    app: AppHandle,
    state: State<'_, ShiftState>,
    card_id: String,
    pin: String,
    float_amount: f64,
    opening_cash_details: Option<serde_json::Value>,
    device_id: Option<String>,
) -> Result<Shift, String> {
    if card_id.is_empty() || pin.is_empty() {
        return Err("Credentials missing".to_string());
    }

    let result = shift_store::open_new_shift(app.clone(), &state, card_id.clone(), pin, float_amount, opening_cash_details, device_id).await;

    if let Ok(ref shift) = result {
        let _ = crate::stores::audit_store::write_event(
            &app,
            crate::stores::audit_store::AuditLevel::Info,
            "SHIFT_OPENED",
            Some(card_id),
            None,
            None,
            None,
            serde_json::json!({ "shift_id": shift.id, "float": float_amount }),
        );

        crate::capture_event(
            "shift_opened",
            Some(serde_json::json!({
                "shift_id": shift.id,
                "float": float_amount
            })),
        );
    }

    result
}

#[tauri::command]
pub async fn close_shift_command(
    app: AppHandle,
    state: State<'_, ShiftState>,
    card_id: String,
    pin: String,
    actual_count: f64,
    closing_cash_details: Option<serde_json::Value>,
    printer_name: Option<String>,
) -> Result<Shift, String> {
    if card_id.is_empty() || pin.is_empty() {
        return Err("Credentials missing".to_string());
    }

    let closed_shift = shift_store::close_current_shift(&app, &state, actual_count, Some(card_id.clone()), closing_cash_details).await?;

    let _ = crate::stores::audit_store::write_event(
        &app,
        crate::stores::audit_store::AuditLevel::Info,
        "SHIFT_CLOSED",
        Some(card_id),
        None,
        None,
        None,
        serde_json::json!({
            "shift_id": closed_shift.id,
            "total_cash_sales": closed_shift.total_cash_sales,
            "actual_cash": closed_shift.actual_cash,
            "variance": closed_shift.variance
        }),
    );

    crate::capture_event(
        "shift_closed",
        Some(serde_json::json!({
            "shift_id": closed_shift.id,
            "total_cash_sales": closed_shift.total_cash_sales,
            "variance": closed_shift.variance
        })),
    );

    let report_text = shift_store::generate_z_report_text(&closed_shift);

    if let Some(p_name) = printer_name {
        let _ = crate::printer_manager::print_system_receipt(app.clone(), p_name, report_text, false).await;
    }

    // Automatically sync shifts upon closing
    let auth_state = app.state::<AuthStateStore>();
    let _ = shift_store::sync_pending_shifts(app.clone(), &state, &auth_state).await;

    Ok(closed_shift)
}

#[tauri::command]
pub async fn sync_shifts_command(
    app: AppHandle,
    state: State<'_, ShiftState>,
    auth_state: State<'_, AuthStateStore>,
) -> Result<String, String> {
    shift_store::sync_pending_shifts(app, &state, &auth_state).await
}
