use local_ip_address::local_ip;

#[tauri::command]
pub async fn get_local_ip_command() -> Result<String, String> {
    local_ip().map(|ip| ip.to_string()).map_err(|e| e.to_string())
}
