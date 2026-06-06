use crate::auth_store::AuthState;
use anyhow::Result;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PettyCashFund {
    pub id: String,
    pub name: String,
    pub current_balance: f64,
}

#[tauri::command]
pub async fn get_petty_cash_funds(auth_state: State<'_, AuthState>) -> Result<Vec<PettyCashFund>, String> {
    let res = auth_state.build_request(reqwest::Method::GET, crate::api_config::routes::PETTY_CASH)?
        .send().await.map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        return Err(format!("Failed to fetch funds: {}", res.status()));
    }

    let v3_res: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
    let funds: Vec<PettyCashFund> = serde_json::from_value(v3_res.get("data").cloned().unwrap_or_default()).unwrap_or_default();
    Ok(funds)
}

#[tauri::command]
pub async fn top_up_petty_cash(
    auth_state: State<'_, AuthState>,
    fund_id: String,
    amount: f64,
    notes: Option<String>,
) -> Result<serde_json::Value, String> {
    let payload = serde_json::json!({ "amount": amount, "notes": notes });
    let res = auth_state.build_request(reqwest::Method::POST, &crate::api_config::routes::petty_cash_top_up(&fund_id))?
        .json(&payload).send().await.map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        return Err(format!("Top up failed: {}", res.status()));
    }

    res.json().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn record_petty_cash_expense(
    auth_state: State<'_, AuthState>,
    fund_id: String,
    amount: f64,
    category: String,
    notes: Option<String>,
) -> Result<serde_json::Value, String> {
    let payload = serde_json::json!({ "amount": amount, "category": category, "notes": notes });
    let res = auth_state.build_request(reqwest::Method::POST, &crate::api_config::routes::petty_cash_expense(&fund_id))?
        .json(&payload).send().await.map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        return Err(format!("Expense recording failed: {}", res.status()));
    }

    res.json().await.map_err(|e| e.to_string())
}
