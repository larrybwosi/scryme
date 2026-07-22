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
    auth_state: State<'_, AuthStateStore>,
    card_id: Option<String>,
    pin: Option<String>,
    float_amount: f64,
    opening_cash_details: Option<serde_json::Value>,
    device_id: Option<String>,
) -> Result<Shift, String> {
    let resolved_card_id = if let Some(ref cid) = card_id {
        if cid.is_empty() { None } else { Some(cid.clone()) }
    } else {
        None
    };

    let resolved_pin = if let Some(ref p) = pin {
        if p.is_empty() { None } else { Some(p.clone()) }
    } else {
        None
    };

    let (final_card_id, final_pin) = if resolved_card_id.is_none() || resolved_pin.is_none() {
        let active_user = auth_state.get_active_user()?;
        let active_token = auth_state.get_active_token()?;

        let cid = resolved_card_id
            .or_else(|| active_user.as_ref().and_then(|u| u.card_id.clone()))
            .or_else(|| active_user.as_ref().map(|u| u.id.clone()))
            .ok_or_else(|| "No active member found and no Card ID provided".to_string())?;

        let p = resolved_pin
            .or_else(|| active_token)
            .ok_or_else(|| "No active member token found and no PIN provided".to_string())?;

        (cid, p)
    } else {
        (resolved_card_id.unwrap(), resolved_pin.unwrap())
    };

    let result = shift_store::open_new_shift(app.clone(), &state, final_card_id.clone(), final_pin, float_amount, opening_cash_details, device_id).await;

    if let Ok(ref shift) = result {
        let _ = crate::stores::audit_store::write_event(
            &app,
            crate::stores::audit_store::AuditLevel::Info,
            "SHIFT_OPENED",
            Some(final_card_id),
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
    auth_state: State<'_, AuthStateStore>,
    card_id: Option<String>,
    pin: Option<String>,
    actual_count: f64,
    closing_cash_details: Option<serde_json::Value>,
    printer_name: Option<String>,
) -> Result<Shift, String> {
    let resolved_card_id = if let Some(ref cid) = card_id {
        if cid.is_empty() { None } else { Some(cid.clone()) }
    } else {
        None
    };

    let resolved_pin = if let Some(ref p) = pin {
        if p.is_empty() { None } else { Some(p.clone()) }
    } else {
        None
    };

    let (final_card_id, _final_pin) = if resolved_card_id.is_none() || resolved_pin.is_none() {
        let active_user = auth_state.get_active_user()?;
        let active_token = auth_state.get_active_token()?;

        let cid = resolved_card_id
            .or_else(|| active_user.as_ref().and_then(|u| u.card_id.clone()))
            .or_else(|| active_user.as_ref().map(|u| u.id.clone()))
            .ok_or_else(|| "No active member found and no Card ID provided".to_string())?;

        let p = resolved_pin
            .or_else(|| active_token)
            .ok_or_else(|| "No active member token found and no PIN provided".to_string())?;

        (cid, p)
    } else {
        (resolved_card_id.unwrap(), resolved_pin.unwrap())
    };

    let closed_shift = shift_store::close_current_shift(&app, &state, actual_count, Some(final_card_id.clone()), closing_cash_details).await?;

    let _ = crate::stores::audit_store::write_event(
        &app,
        crate::stores::audit_store::AuditLevel::Info,
        "SHIFT_CLOSED",
        Some(final_card_id),
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
