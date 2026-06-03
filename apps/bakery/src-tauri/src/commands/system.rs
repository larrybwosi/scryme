use crate::error::BackendResult;
use mac_address::get_mac_address;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HardwareIdentifiers {
    pub mac_address: Option<String>,
    pub serial_number: Option<String>,
}

#[tauri::command]
pub async fn get_hardware_identifiers() -> BackendResult<HardwareIdentifiers> {
    let mac = get_mac_address().ok().flatten().map(|m| m.to_string());

    let serial = get_system_serial();

    Ok(HardwareIdentifiers {
        mac_address: mac,
        serial_number: serial,
    })
}


fn get_system_serial() -> Option<String> {
    #[cfg(target_os = "linux")]
    {
        std::fs::read_to_string("/sys/class/dmi/id/product_uuid")
            .or_else(|_| std::fs::read_to_string("/etc/machine-id"))
            .ok()
            .map(|s| s.trim().to_string())
    }

    #[cfg(target_os = "windows")]
    {
        use std::process::Command;

        // Attempt wmic first
        if let Ok(output) = Command::new("wmic")
            .args(&["bios", "get", "serialnumber"])
            .output()
        {
            if output.status.success() {
                let stdout = String::from_utf8_lossy(&output.stdout);
                let lines: Vec<&str> = stdout.lines().collect();
                if lines.len() >= 2 {
                    let serial = lines[1].trim().to_string();
                    if !serial.is_empty() && serial != "To be filled by O.E.M." {
                        return Some(serial);
                    }
                }
            }
        }

        // Fallback to PowerShell if wmic fails or is missing
        if let Ok(output) = Command::new("powershell")
            .args(&["-Command", "Get-CimInstance -ClassName Win32_Bios | Select-Object -ExpandProperty SerialNumber"])
            .output()
        {
            if output.status.success() {
                let serial = String::from_utf8_lossy(&output.stdout).trim().to_string();
                if !serial.is_empty() {
                    return Some(serial);
                }
            }
        }
        None
    }

    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        let output = Command::new("ioreg")
            .args(&["-rd1", "-c", "IOPlatformExpertDevice"])
            .output()
            .ok()?;

        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            for line in stdout.lines() {
                if line.contains("IOPlatformSerialNumber") {
                    return line.split('"').nth(3).map(|s| s.to_string());
                }
            }
        }
        None
    }

    #[cfg(not(any(target_os = "linux", target_os = "windows", target_os = "macos")))]
    {
        None
    }
}
