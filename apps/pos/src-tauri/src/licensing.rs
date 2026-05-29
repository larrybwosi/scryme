use tauri::command;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
pub struct ActivationRequest {
    pub machine_id: String,
    pub license_key: String,
}

#[derive(Serialize, Deserialize)]
pub struct ActivationResponse {
    pub success: bool,
    pub message: String,
}

#[command]
pub fn get_machine_id() -> Result<String, String> {
    machine_uid::get().map_err(|e| e.to_string())
}

#[command]
pub async fn activate_license(_license_key: String) -> Result<ActivationResponse, String> {
    // For now, return success automatically.
    // We can add actual license checking logic later.
    Ok(ActivationResponse {
        success: true,
        message: "License activated successfully".to_string(),
    })
}

#[command]
pub async fn set_local_auth(app: tauri::AppHandle, pin: String) -> Result<(), String> {
    use sha2::{Sha256, Digest};
    let mut hasher = Sha256::new();
    hasher.update(pin.as_bytes());
    let hash = format!("{:x}", hasher.finalize());

    let pool = crate::stores::product_store::get_db_pool(&app).await?;

    sqlx::query("CREATE TABLE IF NOT EXISTS standalone_auth (id INTEGER PRIMARY KEY, pin_hash TEXT)")
        .execute(&pool).await.map_err(|e| e.to_string())?;

    sqlx::query("INSERT OR REPLACE INTO standalone_auth (id, pin_hash) VALUES (1, ?1)")
        .bind(hash).execute(&pool).await.map_err(|e| e.to_string())?;

    Ok(())
}

#[command]
pub async fn verify_local_auth(app: tauri::AppHandle, pin: String) -> Result<bool, String> {
    use sha2::{Sha256, Digest};
    let mut hasher = Sha256::new();
    hasher.update(pin.as_bytes());
    let hash = format!("{:x}", hasher.finalize());

    let pool = crate::stores::product_store::get_db_pool(&app).await?;

    let row: Option<(String,)> = sqlx::query_as("SELECT pin_hash FROM standalone_auth WHERE id = 1")
        .fetch_optional(&pool).await.map_err(|e| e.to_string())?;

    match row {
        Some((stored_hash,)) => Ok(stored_hash == hash),
        None => Ok(false),
    }
}
