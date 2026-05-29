use base64::{engine::general_purpose, Engine as _};
use keyring::Entry;
use rand::RngCore;

const KEYRING_SERVICE: &str = "dealio-desktop";

pub fn get_or_create_key(key_name: &str) -> Result<[u8; 32], String> {
    let entry = Entry::new(KEYRING_SERVICE, key_name).map_err(|e| e.to_string())?;

    match entry.get_password() {
        Ok(stored_key) => {
            // Attempt to decode
            let bytes = general_purpose::STANDARD
                .decode(&stored_key)
                .map_err(|e| format!("Failed to decode key from keyring: {}", e))?;

            if bytes.len() != 32 {
                return Err("Stored key has invalid length".to_string());
            }

            let mut key_arr = [0u8; 32];
            key_arr.copy_from_slice(&bytes);
            Ok(key_arr)
        }
        Err(_) => {
            // Key not found (or access denied), generate new one
            let mut new_key = [0u8; 32];
            rand::thread_rng().fill_bytes(&mut new_key);

            let encoded_key = general_purpose::STANDARD.encode(new_key);

            entry
                .set_password(&encoded_key)
                .map_err(|e| e.to_string())?;

            Ok(new_key)
        }
    }
}
