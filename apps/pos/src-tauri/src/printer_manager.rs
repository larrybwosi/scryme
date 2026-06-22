use serde::{Deserialize, Serialize};
use std::io::Write;
use std::path::PathBuf;
use tauri::{AppHandle, Manager, Runtime};
use tempfile::Builder;
use tokio::io::AsyncWriteExt;
use tokio::net::TcpStream;
use serde_json::Value; 
use crate::escpos_builder::EscPosBuilder; 
use crate::models::PrinterError;

// --- CONFIGURATION STRUCTS ---

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PrinterConfig {
    /// The type of connection: "system" or "network"
    #[serde(rename = "type")]
    pub method: String,

    /// For system: the printer name (e.g., "EPSON TM-T20").
    /// For network: the IP address (e.g., "192.168.1.50").
    pub target: String,

    /// Only used for network printers (defaults to 9100 if missing)
    pub port: Option<u16>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PrinterInfo {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub method: String, // "system" or "network"
    pub status: String,
    pub driver_name: Option<String>,
    pub port_name: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct PrinterSettings {
    pub receipt_printer: Option<PrinterConfig>,
    pub kitchen_printer: Option<PrinterConfig>,
    pub bar_printer: Option<PrinterConfig>,
    pub invoice_printer: Option<PrinterConfig>,
    pub bill_printer: Option<PrinterConfig>,
    pub waybill_printer: Option<PrinterConfig>,
    pub label_printer: Option<PrinterConfig>,
    pub auto_print_invoice: Option<bool>,
}

// Helper to get the path where we save settings
fn get_settings_path<R: Runtime>(app: &AppHandle<R>) -> PathBuf {
    app.path()
        .app_config_dir()
        .expect("Could not resolve app config dir")
        .join("printer_settings.json")
}

// --- NETWORK HELPER ---

async fn print_raw_to_printer(
    _app: &AppHandle,
    config: Option<PrinterConfig>,
    data: Vec<u8>,
) -> Result<String, String> {
    if let Some(printer) = config {
        // We exclusively use the native path for print_job,
        // even if the config says "network", we treat the target as a system printer name
        // if the user has it installed.
        // NOTE: The requirement was to use the native printer functions.
        print_system_raw_bytes(printer.target, data)
            .await
            .map_err(|e| format!("Native print failed: {:?}", e))
    } else {
        Err("Printer not configured".into())
    }
}

pub async fn print_pdf_to_system_printer(
    _app: &AppHandle,
    printer_name: String,
    pdf_bytes: Vec<u8>,
) -> Result<String, String> {
    // 1. Save PDF bytes to a temporary file
    let mut temp_file = Builder::new()
        .suffix(".pdf")
        .tempfile()
        .map_err(|e| format!("Failed to create temp PDF: {}", e))?;

    temp_file.write_all(&pdf_bytes).map_err(|e| format!("Failed to write PDF: {}", e))?;

    let (_, path) = temp_file.keep().map_err(|e| format!("Failed to keep temp PDF: {}", e))?;
    let file_path = path.to_string_lossy().to_string();

    #[cfg(target_os = "windows")]
    {
        use tauri_plugin_shell::ShellExt;

        let sidecar = _app.shell().sidecar("binaries/sumatrapdf")
            .map_err(|e| format!("Failed to create sidecar: {}", e))?;

        let output = sidecar
            .args([
                "-print-to",
                &printer_name,
                "-silent",
                &file_path,
            ])
            .output()
            .await
            .map_err(|e| format!("SumatraPDF execution failed: {}", e))?;

        // Clean up
        let _ = std::fs::remove_file(path);

        if output.status.success() {
            Ok("PDF sent to Windows printer via SumatraPDF".into())
        } else {
            Err(format!(
                "SumatraPDF failed: {}",
                String::from_utf8_lossy(&output.stderr)
            ))
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        let output = std::process::Command::new("lp")
            .arg("-d")
            .arg(&printer_name)
            .arg(&file_path)
            .output()
            .map_err(|e| format!("Failed to execute lp: {}", e))?;

        // Clean up
        let _ = std::fs::remove_file(path);

        if output.status.success() {
            Ok("PDF sent to CUPS successfully".into())
        } else {
            Err(format!(
                "CUPS print failed: {}",
                String::from_utf8_lossy(&output.stderr)
            ))
        }
    }
}

// --- COMMANDS ---

#[tauri::command]
pub async fn get_system_printers() -> Result<Vec<PrinterInfo>, String> {
    #[cfg(target_os = "windows")]
    {
        const CREATE_NO_WINDOW: u32 = 0x08000000;

        let output = tokio::process::Command::new("powershell")
            .args([
                "-Command",
                "Get-Printer | Select-Object Name, PrinterStatus, DriverName, PortName | ConvertTo-Json",
            ])
            .creation_flags(CREATE_NO_WINDOW)
            .output()
            .await
            .map_err(|e| e.to_string())?;

        if !output.status.success() {
            return Err(String::from_utf8_lossy(&output.stderr).to_string());
        }

        let text = String::from_utf8_lossy(&output.stdout);
        if text.trim().is_empty() {
            return Ok(Vec::new());
        }

        let json: Value = serde_json::from_str(&text).map_err(|e| e.to_string())?;
        let printers = if let Some(arr) = json.as_array() {
            arr.iter()
                .map(|p| PrinterInfo {
                    id: p["Name"].as_str().unwrap_or("").to_string(),
                    name: p["Name"].as_str().unwrap_or("").to_string(),
                    method: "system".into(),
                    status: match p["PrinterStatus"].as_u64().unwrap_or(0) {
                        1 => "Other".into(),
                        2 => "Unknown".into(),
                        3 => "Idle".into(),
                        4 => "Printing".into(),
                        5 => "Warmup".into(),
                        _ => "Ready".into(),
                    },
                    driver_name: p["DriverName"].as_str().map(|s| s.to_string()),
                    port_name: p["PortName"].as_str().map(|s| s.to_string()),
                })
                .collect()
        } else {
            vec![PrinterInfo {
                id: json["Name"].as_str().unwrap_or("").to_string(),
                name: json["Name"].as_str().unwrap_or("").to_string(),
                method: "system".into(),
                status: "Ready".into(),
                driver_name: json["DriverName"].as_str().map(|s| s.to_string()),
                port_name: json["PortName"].as_str().map(|s| s.to_string()),
            }]
        };

        Ok(printers)
    }

    #[cfg(not(target_os = "windows"))]
    {
        let output = tokio::process::Command::new("lpstat")
            .arg("-p")
            .output()
            .await
            .map_err(|e| e.to_string())?;

        let text = String::from_utf8_lossy(&output.stdout);
        let printers: Vec<PrinterInfo> = text
            .lines()
            .filter(|line| !line.is_empty())
            .map(|line| {
                let name = line.split_whitespace().nth(1).unwrap_or("Unknown").to_string();
                PrinterInfo {
                    id: name.clone(),
                    name,
                    method: "system".into(),
                    status: if line.contains("is idle") {
                        "Idle".into()
                    } else if line.contains("is printing") {
                        "Printing".into()
                    } else {
                        "Ready".into()
                    },
                    driver_name: None,
                    port_name: None,
                }
            })
            .collect();

        Ok(printers)
    }
}

#[tauri::command]
pub async fn discover_network_printers() -> Result<Vec<PrinterInfo>, String> {
    use std::net::{IpAddr, SocketAddr};
    use tokio::net::TcpStream;
    use tokio::time::{timeout, Duration};

    let local_ip = local_ip_address::local_ip().map_err(|e| e.to_string())?;

    let mut discovered = Vec::new();

    if let IpAddr::V4(ipv4) = local_ip {
        let octets = ipv4.octets();
        let base_ip = format!("{}.{}.{}", octets[0], octets[1], octets[2]);

        let mut tasks = Vec::new();

        for i in 1..255 {
            let ip = format!("{}.{}", base_ip, i);
            if ip == local_ip.to_string() { continue; }

            tasks.push(tokio::spawn(async move {
                let addr = format!("{}:9100", ip);
                let socket_addr: SocketAddr = addr.parse().ok()?;

                match timeout(Duration::from_millis(200), TcpStream::connect(socket_addr)).await {
                    Ok(Ok(_)) => Some(ip),
                    _ => None,
                }
            }));
        }

        for task in tasks {
            if let Ok(Some(ip)) = task.await {
                discovered.push(PrinterInfo {
                    id: ip.clone(),
                    name: format!("Network Printer ({})", ip),
                    method: "network".into(),
                    status: "Found".into(),
                    driver_name: Some("Generic Raw TCP".into()),
                    port_name: Some("9100".into()),
                });
            }
        }
    }

    Ok(discovered)
}

#[tauri::command]
pub async fn save_printer_config(app: AppHandle, config: PrinterSettings) -> Result<(), String> {
    let path = get_settings_path(&app);

    // Ensure the directory exists
    if let Some(parent) = path.parent() {
        tokio::fs::create_dir_all(parent)
            .await
            .map_err(|e| e.to_string())?;
    }

    let json = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    tokio::fs::write(path, json)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn get_printer_config(app: AppHandle) -> Result<PrinterSettings, String> {
    let path = get_settings_path(&app);

    if !path.exists() {
        return Ok(PrinterSettings::default());
    }

    let data = tokio::fs::read_to_string(path)
        .await
        .map_err(|e| e.to_string())?;

    // Attempt to parse. If the structure changed (string -> struct),
    // this might fail for old configs. You might want to handle fallback here
    // or assume the user will re-save settings.
    let config: PrinterSettings = serde_json::from_str(&data).map_err(|e| e.to_string())?;

    Ok(config)
}

#[tauri::command]
pub async fn print_job(
    app: AppHandle,
    job_type: String, // "receipt", "kitchen", "bar", "bill", "invoice", "waybill"
    order: Value,
    settings: Value,
    branch_name: Option<String>,
) -> Result<String, String> {
    match job_type.as_str() {
        "receipt" => print_receipt_native(app, order, settings, branch_name).await,
        "kitchen" => print_kitchen_native(app, order, settings, branch_name).await,
        "bar" => {
            if let Some(pdf_bytes) = order.get("pdfBytes").and_then(|v| v.as_array()) {
                let bytes: Vec<u8> = pdf_bytes.iter().filter_map(|v| v.as_u64().map(|b| b as u8)).collect();
                let printer_config = get_printer_config(app.clone()).await?;
                let target = printer_config.bar_printer.or(printer_config.receipt_printer).ok_or("Bar printer not configured")?.target;
                print_pdf_to_system_printer(&app, target, bytes).await
            } else {
                print_bar_native(app, order, settings, branch_name).await
            }
        },
        "bill" => {
            if let Some(pdf_bytes) = order.get("pdfBytes").and_then(|v| v.as_array()) {
                let bytes: Vec<u8> = pdf_bytes.iter().filter_map(|v| v.as_u64().map(|b| b as u8)).collect();
                let printer_config = get_printer_config(app.clone()).await?;
                let target = printer_config.bill_printer.or(printer_config.receipt_printer).ok_or("Bill printer not configured")?.target;
                print_pdf_to_system_printer(&app, target, bytes).await
            } else {
                print_bill_native(app, order, settings, branch_name).await
            }
        },
        "label" => print_generic_labels(app, order, settings).await,
        "invoice" | "waybill" => {
            // PDF Printing path for A4/Full documents
            let url = order.get("invoiceUrl")
                .or(order.get("waybillUrl"))
                .and_then(|v| v.as_str())
                .ok_or("No document URL provided for printing")?;

            // 1. Fetch PDF Bytes
            let pdf_bytes = crate::sale_manager::get_invoice_blob_command(
                app.state::<crate::stores::auth_store::AuthState>(),
                url.to_string(),
            ).await?;

            // 2. Resolve target printer
            let printer_config = get_printer_config(app.clone()).await?;
            let target_config = if job_type == "invoice" {
                printer_config.invoice_printer
            } else {
                // Try waybill printer, fallback to invoice printer
                printer_config.waybill_printer.or(printer_config.invoice_printer)
            }.ok_or_else(|| format!("No printer configured for {}", job_type))?;

            // 3. Print PDF
            print_pdf_to_system_printer(&app, target_config.target, pdf_bytes).await
        },
        _ => Err(format!("Unknown job type: {}", job_type)),
    }
}

// 1. Command to list available ports (so user can select the printer)
#[tauri::command]
pub fn get_serial_ports() -> Result<Vec<String>, String> {
    match serialport::available_ports() {
        Ok(ports) => {
            let port_names: Vec<String> = ports.iter().map(|p| p.port_name.clone()).collect();
            Ok(port_names)
        }
        Err(e) => Err(format!("Error listing ports: {}", e)),
    }
}

#[tauri::command]
pub async fn print_test_page(printer_name: String) -> Result<String, String> {
    let mut esc = EscPosBuilder::new();

    esc.align(1);
    esc.bold(true);
    esc.size(2, 2);
    esc.text_line("TEST PAGE");
    esc.size(1, 1);
    esc.bold(false);
    esc.feed(1);

    esc.align(0);
    esc.text_line(&format!("Printer: {}", printer_name));
    esc.text_line(&format!("Time: {}", chrono::Local::now().format("%Y-%m-%d %H:%M:%S")));
    esc.divider(48);

    esc.text_line("Native Raw Byte Printing: OK");
    esc.text_line("ESC/POS Commands: OK");

    esc.feed(4);
    esc.cut();

    print_system_raw_bytes(printer_name, esc.bytes)
        .await
        .map_err(|e| format!("Test print failed: {:?}", e))?;

    Ok("Test page sent to printer".into())
}

// 2. Command to Open the Drawer
#[tauri::command]
pub fn open_cash_drawer(port_name: String) -> Result<String, String> {
    // ESC/POS Command to kick drawer
    // Decimal: 27, 112, 0, 25, 250
    // Hex: 1B 70 00 19 FA
    let kick_code = [0x1B, 0x70, 0x00, 0x19, 0xFA];

    match serialport::new(&port_name, 9600)
        .timeout(std::time::Duration::from_millis(100))
        .open()
    {
        Ok(mut port) => {
            // Write the kick code to the printer
            match port.write_all(&kick_code) {
                Ok(_) => Ok("Drawer signal sent".into()),
                Err(e) => Err(format!("Failed to write to printer: {}", e)),
            }
        }
        Err(e) => Err(format!("Failed to open port {}: {}", port_name, e)),
    }
}


#[tauri::command] 
pub async fn print_receipt_native(
    app: tauri::AppHandle, 
    order: Value,
    settings: Value,
    branch_name: Option<String>,
) -> Result<String, String> {
    let mut esc = EscPosBuilder::new();
    
    // 1. Setup layout constraints based on Paper Size
    let config = settings.get("receiptConfig").unwrap_or(&Value::Null);
    let paper_size = config.get("paperSize").and_then(|v| v.as_str()).unwrap_or("80mm");
    let is_58mm = paper_size == "58mm";
    
    let width = if is_58mm { 32 } else { 48 };
    let cols = if is_58mm { (14, 4, 6, 8) } else { (22, 6, 9, 11) };

    // Layout and style from config
    let template = config.get("template").and_then(|v| v.as_str()).unwrap_or("standard");
    let alignment_val = config.get("textAlignment").and_then(|v| v.as_str()).unwrap_or("center");
    let alignment = if alignment_val == "center" { 1 } else { 0 };
    let divider_style = config.get("dividerStyle").and_then(|v| v.as_str()).unwrap_or("dashed");

    // --- LOGO ---
    if config.get("showLogo").and_then(|v| v.as_bool()).unwrap_or(true) {
        if let Some(logo_path) = config.get("logoUrl").and_then(|v| v.as_str()) {
            if !logo_path.is_empty() {
                let logo_pos_str = config.get("logoPosition").and_then(|v| v.as_str()).unwrap_or("center");
                let logo_pos = if logo_pos_str == "center" { 1 } else if logo_pos_str == "right" { 2 } else { 0 };
                let logo_width = config.get("logoWidth").and_then(|v| v.as_u64()).unwrap_or(50) as u8;
                let _ = esc.logo_enhanced(logo_path, is_58mm, logo_pos, logo_width);
            }
        }
    }

    // --- HEADER (Aligned per config) ---
    esc.align(alignment);
    if let Some(biz_name) = settings.get("businessName").and_then(|v| v.as_str()) {
        let title_font_size = config.get("titleFontSize").and_then(|v| v.as_u64()).unwrap_or(2) as u8;
        // Map PDF font size roughly to ESC/POS size (1-8)
        let size = if title_font_size > 20 { 3 } else if title_font_size > 12 { 2 } else { 1 };

        esc.size(size, size);
        esc.bold(true);
        if template == "modern" {
            esc.text_line(biz_name);
        } else {
            esc.text_line(&biz_name.to_uppercase());
        }
        
        esc.size(1, 1); // Reset
        esc.bold(false);
    }
    
    if config.get("showTagline").and_then(|v| v.as_bool()).unwrap_or(false) {
        if let Some(tagline) = config.get("tagline").and_then(|v| v.as_str()) {
            if !tagline.is_empty() { esc.text_line(tagline); }
        }
    } else if let Some(slogan) = settings.get("businessSlogan").and_then(|v| v.as_str()) {
        if !slogan.is_empty() { esc.text_line(slogan); }
    }

    if let Some(ref branch) = branch_name {
        if !branch.is_empty() { esc.text_line(&format!("Branch: {}", branch)); }
    }

    if config.get("showAddress").and_then(|v| v.as_bool()).unwrap_or(true) {
        if let Some(address) = settings.get("address").and_then(|v| v.as_str()) {
            if !address.is_empty() { esc.text_line(address); }
        }
    }

    let show_phone = config.get("showPhone").and_then(|v| v.as_bool()).unwrap_or(true);
    let show_email = config.get("showEmail").and_then(|v| v.as_bool()).unwrap_or(true);

    if show_phone || show_email {
        let phone = settings.get("phone").and_then(|v| v.as_str()).unwrap_or("");
        let email = settings.get("email").and_then(|v| v.as_str()).unwrap_or("");

        if show_phone && show_email && !phone.is_empty() && !email.is_empty() {
            esc.text_line(&format!("{} | {}", phone, email));
        } else if show_phone && !phone.is_empty() {
            esc.text_line(&format!("Tel: {}", phone));
        } else if show_email && !email.is_empty() {
            esc.text_line(email);
        }
    }

    if config.get("showWebsite").and_then(|v| v.as_bool()).unwrap_or(true) {
        if let Some(website) = settings.get("website").and_then(|v| v.as_str()) {
            if !website.is_empty() { esc.text_line(website); }
        }
    }

    // Reg numbers
    let show_tax = config.get("showTaxNumber").and_then(|v| v.as_bool()).unwrap_or(false);
    let show_vat = config.get("showVatNumber").and_then(|v| v.as_bool()).unwrap_or(false);
    let show_reg = config.get("showCompanyRegNumber").and_then(|v| v.as_bool()).unwrap_or(false);

    if show_tax || show_vat || show_reg {
        let mut reg_parts = Vec::new();
        if show_tax {
            if let Some(val) = config.get("taxNumber").and_then(|v| v.as_str()) {
                if !val.is_empty() { reg_parts.push(format!("TIN:{}", val)); }
            }
        }
        if show_vat {
            if let Some(val) = config.get("vatNumber").and_then(|v| v.as_str()) {
                if !val.is_empty() { reg_parts.push(format!("VAT:{}", val)); }
            }
        }
        if show_reg {
            if let Some(val) = config.get("companyRegNumber").and_then(|v| v.as_str()) {
                if !val.is_empty() { reg_parts.push(format!("REG:{}", val)); }
            }
        }
        if !reg_parts.is_empty() {
            esc.text_line(&reg_parts.join(" "));
        }
    }
    
    esc.feed(1);

    // --- META DATA ---
    esc.align(0);
    esc.divider_styled(width, divider_style);

    if config.get("showOrderNumber").and_then(|v| v.as_bool()).unwrap_or(true) {
        if let Some(order_num) = order.get("orderNumber").and_then(|v| v.as_str()) {
            esc.text_line(&format!("Receipt No: {}", order_num));
        }
    }

    if config.get("showTransactionId").and_then(|v| v.as_bool()).unwrap_or(false) {
        if let Some(id) = order.get("id").and_then(|v| v.as_str()) {
            esc.text_line(&format!("Trans ID: {}", id));
        }
    }

    let created_at = order.get("createdAt").and_then(|v| v.as_str()).unwrap_or("");
    if !created_at.is_empty() {
        esc.text_line(&format!("Date: {}", created_at));
    }

    if config.get("showOrderType").and_then(|v| v.as_bool()).unwrap_or(true) {
        if let Some(order_type) = order.get("orderType").and_then(|v| v.as_str()) {
            esc.text_line(&format!("Type: {}", order_type.to_uppercase()));
        }
    }

    if config.get("showCashier").and_then(|v| v.as_bool()).unwrap_or(true) {
        if let Some(cashier) = order.get("cashierName").and_then(|v| v.as_str()) {
            esc.text_line(&format!("Served By: {}", cashier));
        }
    }

    if config.get("showCustomerName").and_then(|v| v.as_bool()).unwrap_or(true) {
        if let Some(customer) = order.get("customerName").and_then(|v| v.as_str()) {
            if !customer.is_empty() && customer != "Walk-in Customer" {
                esc.text_line(&format!("Customer: {}", customer));
            }
        }
    }

    if let Some(table) = order.get("tableNumber").and_then(|v| v.as_str()) {
        if !table.is_empty() {
            esc.text_line(&format!("Table: {}", table));
        }
    }
    
    // --- TABLE HEADER ---
    if template == "modern" {
        esc.inverse(true);
        esc.item_row("ITEM", "QTY", "PRICE", "AMT", cols);
        esc.inverse(false);
    } else {
        esc.divider_styled(width, divider_style);
        esc.bold(true);
        esc.item_row("ITEM", "QTY", "PRICE", "AMT", cols);
        esc.bold(false);
        esc.divider_styled(width, divider_style);
    }

    // --- ITEMS LOOP ---
    if let Some(items) = order.get("items").and_then(|v| v.as_array()) {
        for item in items {
            let name = item.get("productName").and_then(|v| v.as_str()).unwrap_or("Item");
            let qty = item.get("quantity").and_then(|v| v.as_f64()).unwrap_or(1.0);

            // Handle prices at root of item or in selectedUnit
            let price = item.get("price").and_then(|v| v.as_f64())
                .or_else(|| item.get("selectedUnit").and_then(|u| u.get("price")).and_then(|p| p.as_f64()))
                .unwrap_or(0.0);

            let total = item.get("total").and_then(|v| v.as_f64()).unwrap_or(qty * price);
            
            // Format numbers nicely
            let qty_str = if qty.fract() == 0.0 { format!("{}", qty) } else { format!("{:.2}", qty) };
            let price_str = format!("{:.2}", price);
            let total_str = format!("{:.2}", total);

            esc.item_row(name, &qty_str, &price_str, &total_str, cols);

            // Item SKU
            if config.get("showItemSku").and_then(|v| v.as_bool()).unwrap_or(false) {
                if let Some(sku) = item.get("sku").and_then(|v| v.as_str()) {
                    if !sku.is_empty() { esc.text_line(&format!("  SKU: {}", sku)); }
                }
            }

            // Item Variant
            if let Some(variant) = item.get("variantName").and_then(|v| v.as_str()) {
                if !variant.is_empty() && variant != "Default Variant" && variant != "Default" {
                    esc.text_line(&format!("  ({})", variant));
                }
            }

            // Item Notes
            if config.get("showItemNotes").and_then(|v| v.as_bool()).unwrap_or(true) {
                if let Some(note) = item.get("notes").or(item.get("note")).and_then(|v| v.as_str()) {
                    if !note.is_empty() { esc.text_line(&format!("  * {}", note)); }
                }
            }
        }
    }
    esc.divider_styled(width, divider_style);

    // --- TOTALS (Left/Right Aligned) ---
    if config.get("showSubtotal").and_then(|v| v.as_bool()).unwrap_or(true) {
        if let Some(subtotal) = order.get("subTotal").and_then(|v| v.as_f64()) {
            esc.text_left_right("Subtotal:", &format!("{:.2}", subtotal), width);
        }
    }

    if config.get("showDiscountBreakdown").and_then(|v| v.as_bool()).unwrap_or(true) {
        if let Some(discount) = order.get("discount").or(order.get("discountAmount")).and_then(|v| v.as_f64()) {
            if discount > 0.0 {
                esc.text_left_right("Discount:", &format!("-{:.2}", discount), width);
            }
        }
    }

    if config.get("showTaxBreakdown").and_then(|v| v.as_bool()).unwrap_or(true) {
        if let Some(tax) = order.get("taxes").or(order.get("taxAmount")).and_then(|v| v.as_f64()) {
            if tax > 0.0 {
                esc.text_left_right("Tax:", &format!("{:.2}", tax), width);
            }
        }
    }

    // Big Total Row
    if let Some(total) = order.get("total").and_then(|v| v.as_f64()) {
        esc.feed(1);

        if template == "modern" {
            esc.inverse(true);
            esc.bold(true);
            esc.size(2, 2);
            let double_width = width / 2;
            let currency = settings.get("currency").and_then(|v| v.as_str()).unwrap_or("KSH");
            esc.text_left_right("TOTAL:", &format!("{} {:.2}", currency, total), double_width);
            esc.inverse(false);
        } else {
            esc.size(2, 2);
            esc.bold(true);
            let double_width = width / 2;
            let currency = settings.get("currency").and_then(|v| v.as_str()).unwrap_or("KSH");
            esc.text_left_right("TOTAL:", &format!("{} {:.2}", currency, total), double_width);
        }
        
        // Reset styles
        esc.size(1, 1);
        esc.bold(false);
        esc.feed(1);
    }

    // Show Savings
    if config.get("showSavingsTotal").and_then(|v| v.as_bool()).unwrap_or(false) {
        if let Some(discount) = order.get("discount").or(order.get("discountAmount")).and_then(|v| v.as_f64()) {
            if discount > 0.0 {
                esc.text_line(&format!("YOU SAVED: {:.2}", discount));
            }
        }
    }

    // Payment Method
    if config.get("showPaymentMethod").and_then(|v| v.as_bool()).unwrap_or(true) {
        if let Some(method) = order.get("paymentMethod").and_then(|v| v.as_str()) {
            esc.text_left_right("Payment Method:", method, width);
        }
    }

    // Split Payments
    if let Some(payments) = order.get("payments").and_then(|v| v.as_array()) {
        for p in payments {
            let method = p.get("method").and_then(|v| v.as_str()).unwrap_or("Payment");
            let amt = p.get("amount").and_then(|v| v.as_f64()).unwrap_or(0.0);
            esc.text_left_right(&format!("  - {}", method), &format!("{:.2}", amt), width);
        }
    }

    // Change Due
    if let Some(change) = order.get("change").and_then(|v| v.as_f64()) {
        if change > 0.0 {
            esc.text_left_right("Change Due:", &format!("{:.2}", change), width);
        }
    }

    // --- FOOTER & BARCODES (Center Aligned) ---
    esc.align(alignment);
    esc.feed(1);
    esc.divider_styled(width, divider_style);
    
    // Header text (from content tab)
    if let Some(header_text) = config.get("headerText").and_then(|v| v.as_str()) {
        if !header_text.is_empty() { esc.text_line(header_text); }
    }

    // Thank You Message
    if config.get("showThankYouMessage").and_then(|v| v.as_bool()).unwrap_or(true) {
        let msg = config.get("thankYouMessage").and_then(|v| v.as_str())
            .unwrap_or("Thank you for your business!");
        if !msg.is_empty() { esc.text_line(msg); }
    }

    // Next Visit Promo
    if config.get("showNextVisitPromo").and_then(|v| v.as_bool()).unwrap_or(false) {
        if let Some(promo) = config.get("nextVisitPromoText").and_then(|v| v.as_str()) {
            if !promo.is_empty() {
                esc.bold(true);
                esc.text_line(promo);
                esc.bold(false);
            }
        }
    }

    // Loyalty
    let show_pts = config.get("showLoyaltyPoints").and_then(|v| v.as_bool()).unwrap_or(false);
    let show_bal = config.get("showLoyaltyBalance").and_then(|v| v.as_bool()).unwrap_or(false);
    if show_pts || show_bal {
        if show_pts {
            if let Some(total) = order.get("total").and_then(|v| v.as_f64()) {
                esc.text_line(&format!("Points Earned: +{}", (total / 10.0).floor()));
            }
        }
        if show_bal {
            esc.text_line("Loyalty Balance: 150 pts");
        }
    }

    // Social Media
    if config.get("showSocialMedia").and_then(|v| v.as_bool()).unwrap_or(false) {
        if let Some(handle) = config.get("socialMediaHandle").and_then(|v| v.as_str()) {
            if !handle.is_empty() { esc.text_line(handle); }
        }
    }

    // Custom Footer Text
    if let Some(footer_text) = config.get("footerText").and_then(|v| v.as_str()) {
        if !footer_text.is_empty() { esc.text_line(footer_text); }
    }

    // Render Survey QR if enabled
    if config.get("showSurveyQr").and_then(|v| v.as_bool()).unwrap_or(false) {
        if let Some(url) = config.get("surveyUrl").and_then(|v| v.as_str()) {
            if !url.is_empty() {
                esc.text_line("Scan to rate your experience:");
                esc.qr_code(url);
            }
        }
    }

    // Render QR Code based on Target
    if config.get("showQrCode").and_then(|v| v.as_bool()).unwrap_or(false) {
        let target = config.get("qrCodeTarget").and_then(|v| v.as_str()).unwrap_or("website");
        let url = if target == "website" || target == "review-link" || target == "survey" {
            config.get("qrCodeCustomUrl").and_then(|v| v.as_str()).unwrap_or("")
        } else {
            "" // Default order link?
        };
        if !url.is_empty() {
            esc.qr_code(url);
        }
    }

    // Render 1D Barcode if enabled
    if config.get("showBarcode").and_then(|v| v.as_bool()).unwrap_or(true) {
        if let Some(order_num) = order.get("orderNumber").and_then(|v| v.as_str()) {
            esc.barcode_1d(order_num, None);
        }
    }

    // Return policy / Disclaimer
    if config.get("showReturnPolicy").and_then(|v| v.as_bool()).unwrap_or(false) {
        if let Some(policy) = config.get("returnPolicyText").and_then(|v| v.as_str()) {
            if !policy.is_empty() {
                esc.feed(1);
                esc.text_line(policy);
            }
        }
    }

    if config.get("showLegalDisclaimer").and_then(|v| v.as_bool()).unwrap_or(false) {
        if let Some(disclaimer) = config.get("legalDisclaimerText").and_then(|v| v.as_str()) {
            if !disclaimer.is_empty() {
                esc.feed(1);
                esc.text_line(disclaimer);
            }
        }
    }

    if config.get("showSignatureLine").and_then(|v| v.as_bool()).unwrap_or(false) {
        let label = config.get("signatureLineText").and_then(|v| v.as_str()).unwrap_or("Customer Signature");
        esc.feed(2);
        esc.divider(width);
        esc.text_line(label);
    }

    esc.feed(1);
    esc.text_line("Goods once sold are not returnable.");

    // --- FINISH BUILDING COMMANDS ---
    esc.feed(4);
    esc.cut();

    // 1. EXTRACT RAW BYTES
    let bytes_to_print = esc.bytes;

    // 2. LOAD PRINTER CONFIGURATION
    let printer_config = get_printer_config(app.clone())
        .await
        .map_err(|e| format!("Failed to load printer config: {}", e))?;

    // 3. ROUTE TO THE CORRECT PRINTER HANDLER
    print_raw_to_printer(&app, printer_config.receipt_printer, bytes_to_print).await
}

pub async fn print_network_raw_bytes(ip: String, port: Option<u16>, data: Vec<u8>) -> Result<String, PrinterError> {
    let port = port.unwrap_or(9100);
    let addr = format!("{}:{}", ip, port);
    let mut stream = TcpStream::connect(addr).await
        .map_err(|e| PrinterError::ConnectionFailed(e.to_string()))?;
        
    stream.write_all(&data).await
        .map_err(|e| PrinterError::SystemError(format!("Failed to write to printer: {}", e)))?;
        
    Ok("Sent to network printer".into())
}


#[cfg(target_os = "windows")]
pub async fn print_system_raw_bytes(
    printer_name: String,
    data: Vec<u8>,
) -> Result<String, PrinterError> {
    use windows::Win32::Graphics::Printing::{
        ClosePrinter, EndDocPrinter, EndPagePrinter, OpenPrinterW, StartDocPrinterW,
        StartPagePrinter, WritePrinter, DOC_INFO_1W, PRINTER_HANDLE,
    };
    use windows::core::{PCWSTR, PWSTR};

    unsafe {
        // 1. Use PRINTER_HANDLE instead of HANDLE
        let mut h_printer = PRINTER_HANDLE::default(); 
        let printer_name_wide: Vec<u16> = printer_name.encode_utf16().chain(std::iter::once(0)).collect();

        if OpenPrinterW(PCWSTR(printer_name_wide.as_ptr()), &mut h_printer, None).is_err() {
            return Err(PrinterError::SystemError("Failed to open printer".into()));
        }

        // 2. Make string buffers mutable so we can pass PWSTR (mutable pointer)
        let mut doc_name_wide: Vec<u16> = "Raw Print Job".encode_utf16().chain(std::iter::once(0)).collect();
        let mut data_type_wide: Vec<u16> = "RAW".encode_utf16().chain(std::iter::once(0)).collect();

        // 3. Use PWSTR(mut_ptr) instead of PCWSTR
        let doc_info = DOC_INFO_1W {
            pDocName: PWSTR(doc_name_wide.as_mut_ptr()),
            pOutputFile: PWSTR(std::ptr::null_mut()),
            pDatatype: PWSTR(data_type_wide.as_mut_ptr()),
        };

        // 4. Pass the pointer correctly without the extra `as *const u8`
        let job_id = StartDocPrinterW(h_printer, 1, &doc_info as *const DOC_INFO_1W);
        if job_id == 0 {
            let _ = ClosePrinter(h_printer);
            return Err(PrinterError::SystemError("Failed to start document".into()));
        }

        // 5. Use .ok().is_err() because StartPagePrinter returns a BOOL, not a Result
        if StartPagePrinter(h_printer).ok().is_err() {
            let _ = ClosePrinter(h_printer);
            return Err(PrinterError::SystemError("Failed to start page".into()));
        }

        let mut bytes_written: u32 = 0;
        let write_ok = WritePrinter(
            h_printer,
            data.as_ptr() as *const std::ffi::c_void,
            data.len() as u32,
            &mut bytes_written,
        );

        // 6. Same here, check .ok().is_err()
        if write_ok.ok().is_err() || bytes_written != data.len() as u32 {
            let _ = EndPagePrinter(h_printer);
            let _ = EndDocPrinter(h_printer);
            let _ = ClosePrinter(h_printer);
            return Err(PrinterError::SystemError("Failed to write to printer".into()));
        }

        let _ = EndPagePrinter(h_printer);
        let _ = EndDocPrinter(h_printer);
        let _ = ClosePrinter(h_printer);
    }

    Ok("Sent raw bytes natively to Windows print spooler".into())
}

#[cfg(not(target_os = "windows"))]
pub async fn print_system_raw_bytes(
    printer_name: String,
    data: Vec<u8>,
) -> Result<String, PrinterError> {
    use std::io::Write;
    
    // Linux/macOS: Write the raw ESC/POS bytes to a temporary binary file
    let mut temp_file = tempfile::Builder::new()
        .suffix(".bin")
        .tempfile()
        .map_err(|e| PrinterError::SystemError(format!("Temp file creation failed: {}", e)))?;

    temp_file.write_all(&data).map_err(|e| {
        PrinterError::SystemError(format!("Failed to write to temp file: {}", e))
    })?;

    let (_, path) = temp_file.keep().map_err(|e| {
        PrinterError::SystemError(format!("Failed to persist temp file: {}", e))
    })?;
    let file_path = path.to_string_lossy().to_string();

    // Use CUPS (lp) with the "-o raw" flag to bypass driver formatting
    let output = std::process::Command::new("lp")
        .arg("-d")
        .arg(&printer_name)
        .arg("-o")
        .arg("raw")
        .arg(&file_path)
        .output()
        .map_err(|e| PrinterError::SystemError(format!("Failed to execute lp: {}", e)))?;

    // Clean up temp file
    let _ = std::fs::remove_file(path);

    if output.status.success() {
        Ok("Sent raw bytes to CUPS successfully".into())
    } else {
        Err(PrinterError::SystemError(format!(
            "CUPS raw print failed: {}",
            String::from_utf8_lossy(&output.stderr)
        )))
    }
}


#[tauri::command]
pub async fn print_kitchen_native(
    app: tauri::AppHandle,
    order: Value,
    settings: Value,
    branch_name: Option<String>,
) -> Result<String, String> {
    let mut esc = EscPosBuilder::new();

    // 1. Setup layout constraints based on Paper Size
    let config = settings.get("kitchenTicketConfig").unwrap_or(&Value::Null);
    let paper_size = config.get("paperSize").and_then(|v| v.as_str()).unwrap_or("80mm");
    let is_58mm = paper_size == "58mm";
    let width = if is_58mm { 32 } else { 48 };

    // Kitchen Config Flags
    let show_time = config.get("showTime").and_then(|v| v.as_bool()).unwrap_or(true);
    let show_order_type = config.get("showOrderType").and_then(|v| v.as_bool()).unwrap_or(true);
    let show_customer_name = config.get("showCustomerName").and_then(|v| v.as_bool()).unwrap_or(true);
    let show_table = config.get("showTable").and_then(|v| v.as_bool()).unwrap_or(true);
    let show_prices = config.get("showPrices").and_then(|v| v.as_bool()).unwrap_or(false);
    let show_notes = config.get("showNotes").and_then(|v| v.as_bool()).unwrap_or(true);
    let show_server = config.get("showServerName").and_then(|v| v.as_bool()).unwrap_or(true);

    // --- HEADER ---
    esc.align(1); // Center

    if let Some(header) = config.get("headerText").and_then(|v| v.as_str()) {
        if !header.is_empty() {
            esc.bold(true);
            esc.size(2, 2);
            esc.text_line(&header.to_uppercase());
            esc.size(1, 1);
            esc.bold(false);
        }
    } else {
        let shop_name = config.get("shopName").and_then(|v| v.as_str())
            .or(branch_name.as_deref())
            .unwrap_or("RESTAURANT NAME");

        esc.bold(true);
        esc.size(2, 2);
        esc.text_line(&shop_name.to_uppercase());
        esc.size(1, 1);
        esc.bold(false);
    }

    // Ticket Type
    let ticket_type = config.get("ticketType").and_then(|v| v.as_str()).unwrap_or("KITCHEN");
    esc.feed(1);
    esc.text_line(&format!("- {} TICKET -", ticket_type.to_uppercase()));
    esc.divider(width);

    // --- ORDER NUMBER ---
    if let Some(order_num) = order.get("orderNumber").and_then(|v| v.as_str()) {
        esc.feed(1);
        esc.text_line("ORDER #");
        esc.bold(true);
        esc.size(3, 3);
        esc.text_line(order_num);
        esc.size(1, 1);
        esc.bold(false);
        esc.feed(1);
    }

    if config.get("showSequenceNumber").and_then(|v| v.as_bool()).unwrap_or(false) {
        if let Some(seq) = order.get("sequenceNumber").and_then(|v| v.as_i64()) {
            esc.text_line(&format!("Queue Position: {}", seq));
        }
    }

    esc.divider(width);

    // --- META GRID ---
    esc.align(0); // Left align
    
    if show_order_type {
        if let Some(order_type) = order.get("orderType").and_then(|v| v.as_str()) {
            esc.text_line(&format!("TYPE: {}", order_type.to_uppercase()));
        }
    }
    if show_time {
        let created_at = order.get("createdAt").and_then(|v| v.as_str()).unwrap_or("");
        if !created_at.is_empty() {
            esc.text_line(&format!("TIME: {}", created_at));
        }
    }
    if show_server {
        if let Some(user_name) = order.get("userName").or(order.get("cashierName")).and_then(|v| v.as_str()) {
            esc.text_line(&format!("SERVER: {}", user_name.to_uppercase()));
        }
    }
    if show_customer_name {
        if let Some(customer) = order.get("customerName").and_then(|v| v.as_str()) {
            if !customer.is_empty() && customer != "Walk-in Customer" {
                esc.text_line(&format!("CUSTOMER: {}", customer.to_uppercase()));
            }
        }
    }

    // --- TABLE BOX ---
    if show_table {
        if let Some(table) = order.get("tableName").or(order.get("tableNumber")).and_then(|v| v.as_str()) {
            if !table.is_empty() {
                esc.feed(1);
                esc.align(1);
                esc.inverse(true); // Black background with white text for visibility
                esc.size(2, 2);
                esc.text_line(&format!(" TABLE {} ", table.to_uppercase()));
                esc.inverse(false);
                esc.size(1, 1);
                esc.feed(1);
            }
        }
    }

    esc.align(0);
    esc.divider(width);

    // --- ITEMS LIST ---
    // Column widths
    let q_w = if is_58mm { 4 } else { 6 };
    let p_w = if show_prices { if is_58mm { 8 } else { 10 } } else { 0 };
    let i_w = width - q_w - p_w;

    // Headers
    esc.bold(true);
    let mut header = format!("{:<i_w$}{:>q_w$}", "ITEM", "QTY", i_w = i_w, q_w = q_w);
    if show_prices {
        header.push_str(&format!("{:>p_w$}", "PRICE", p_w = p_w));
    }
    esc.text_line(&header);
    esc.bold(false);
    esc.divider(width);

    let mut total_items = 0.0;

    if let Some(items) = order.get("items").and_then(|v| v.as_array()) {
        for item in items {
            let name = item.get("name").and_then(|v| v.as_str()).unwrap_or("Unknown");
            let qty = item.get("quantity").and_then(|v| v.as_f64()).unwrap_or(1.0);
            total_items += qty;
            
            let qty_str = format!("{}", qty);
            
            // Truncate name safely to avoid line breaking on large names
            let mut name_str = name.to_uppercase();
            if name_str.chars().count() > i_w {
                name_str = name_str.chars().take(i_w - 1).collect::<String>();
            }

            esc.bold(true);
            esc.size(1, 2); // Taller text to make items pop (like in standard KDS)
            
            let mut line = format!("{:<i_w$}{:>q_w$}", name_str, qty_str, i_w = i_w, q_w = q_w);
            if show_prices {
                let price = item.get("price").and_then(|v| v.as_f64()).unwrap_or(0.0);
                line.push_str(&format!("{:>p_w$.2}", price, p_w = p_w));
            }
            esc.text_line(&line);
            esc.size(1, 1);
            esc.bold(false);

            // Variant / Modifiers block
            let variant_name = item.get("variantName").and_then(|v| v.as_str()).unwrap_or("Default Variant");
            let unit_name = item.get("selectedUnit").and_then(|v| v.get("unitName")).and_then(|v| v.as_str());

            if variant_name != "Default Variant" || unit_name.is_some() {
                let mut var_str = String::from("  • ");
                if variant_name != "Default Variant" {
                    var_str.push_str(variant_name);
                    var_str.push(' ');
                }
                if let Some(un) = unit_name {
                    var_str.push_str(&format!("({})", un));
                }
                esc.text_line(&var_str);
            }
            esc.feed(1); // Space between items
        }
    }

    // --- SPECIAL INSTRUCTIONS ---
    if show_notes {
        if let Some(instructions) = order.get("instructions").and_then(|v| v.as_str()) {
            if !instructions.trim().is_empty() {
                esc.divider(width);
                esc.align(1);
                esc.bold(true);
                esc.text_line("SPECIAL INSTRUCTIONS");
                esc.bold(false);
                
                esc.inverse(true);
                esc.text_line(&format!(" {} ", instructions.to_uppercase()));
                esc.inverse(false);
                esc.feed(1);
            }
        }
    }

    esc.align(0);
    esc.divider(width);

    // --- FOOTER SUMMARY ---
    esc.align(1);
    esc.text_line(&format!("Total Items: {}", total_items));
    
    // Custom Footer
    if let Some(footer) = config.get("footerText").and_then(|v| v.as_str()) {
        if !footer.is_empty() {
            esc.text_line(footer);
        }
    }

    // Add current print timestamp
    let current_time = chrono::Local::now().format("%m/%d/%Y %H:%M:%S").to_string();
    esc.text_line(&format!("Printed: {}", current_time));

    esc.feed(1);
    esc.bold(true);
    esc.text_line("- END OF TICKET -");
    esc.bold(false);

    esc.feed(4); // Advance paper enough so the tear/cut clears the printhead
    esc.cut();

    let bytes_to_print = esc.bytes;

    let printer_config = get_printer_config(app.clone())
        .await
        .map_err(|e| format!("Failed to load printer config: {}", e))?;

    print_raw_to_printer(&app, printer_config.kitchen_printer, bytes_to_print).await
}

#[tauri::command]
pub async fn print_bar_native(
    app: tauri::AppHandle,
    order: Value,
    settings: Value,
    _branch_name: Option<String>,
) -> Result<String, String> {
    // Reuse kitchen ticket logic for bar for now, as they are usually similar (tickets)
    // but use the bar_printer config.
    let mut esc = EscPosBuilder::new();

    // 1. Setup layout constraints based on Paper Size
    let config = settings.get("kitchenTicketConfig").unwrap_or(&Value::Null); // Fallback to kitchen config for bar too
    let paper_size = config.get("paperSize").and_then(|v| v.as_str()).unwrap_or("80mm");
    let is_58mm = paper_size == "58mm";
    let width = if is_58mm { 32 } else { 48 };

    // --- HEADER ---
    esc.align(1);
    esc.bold(true);
    esc.size(2, 2);
    esc.text_line("BAR TICKET");
    esc.size(1, 1);
    esc.bold(false);
    esc.divider(width);

    // --- ORDER NUMBER ---
    if let Some(order_num) = order.get("orderNumber").and_then(|v| v.as_str()) {
        esc.text_line(&format!("ORDER #{}", order_num));
    }

    if let Some(table) = order.get("tableName").and_then(|v| v.as_str()) {
        esc.text_line(&format!("TABLE: {}", table));
    }
    esc.divider(width);

    // --- ITEMS ---
    if let Some(items) = order.get("items").and_then(|v| v.as_array()) {
        for item in items {
            let name = item.get("name").and_then(|v| v.as_str()).unwrap_or("Unknown");
            let qty = item.get("quantity").and_then(|v| v.as_f64()).unwrap_or(1.0);

            esc.bold(true);
            esc.text_line(&format!("{:<width$} x{}", name.to_uppercase(), qty, width = width - 4));
            esc.bold(false);
        }
    }

    esc.feed(4);
    esc.cut();

    let bytes_to_print = esc.bytes;

    let printer_config = get_printer_config(app.clone())
        .await
        .map_err(|e| format!("Failed to load printer config: {}", e))?;

    print_raw_to_printer(&app, printer_config.bar_printer, bytes_to_print).await
}

#[tauri::command]
pub async fn print_bill_native(
    app: tauri::AppHandle,
    order: Value,
    settings: Value,
    branch_name: Option<String>,
) -> Result<String, String> {
    let mut esc = EscPosBuilder::new();

    // 1. Setup layout constraints
    let config = settings.get("receiptConfig").unwrap_or(&Value::Null);
    let paper_size = config.get("paperSize").and_then(|v| v.as_str()).unwrap_or("80mm");
    let is_58mm = paper_size == "58mm";
    let width = if is_58mm { 32 } else { 48 };
    let cols = if is_58mm { (14, 4, 6, 8) } else { (22, 6, 9, 11) };

    // --- BILL HEADER ---
    esc.align(1);
    esc.bold(true);
    esc.size(2, 2);
    esc.text_line("PRO-FORMA BILL");
    esc.size(1, 1);
    esc.text_line("(NOT A RECEIPT)");
    esc.bold(false);
    esc.feed(1);

    if let Some(biz_name) = settings.get("businessName").and_then(|v| v.as_str()) {
        esc.text_line(biz_name);
    }
    if let Some(ref branch) = branch_name {
        if !branch.is_empty() { esc.text_line(&format!("Branch: {}", branch)); }
    }

    esc.divider(width);
    esc.align(0);

    // --- META DATA ---
    if let Some(order_num) = order.get("orderNumber").and_then(|v| v.as_str()) {
        esc.text_line(&format!("Order Ref: {}", order_num));
    }

    if let Some(table) = order.get("tableName").and_then(|v| v.as_str()) {
        esc.text_line(&format!("Table: {}", table));
    }

    if let Some(guests) = order.get("guestCount").and_then(|v| v.as_i64()) {
        esc.text_line(&format!("Guests: {}", guests));
    } else if let Some(guests) = order.get("guestCount").and_then(|v| v.as_str()) {
        esc.text_line(&format!("Guests: {}", guests));
    }

    let current_time = chrono::Local::now().format("%m/%d/%Y %H:%M:%S").to_string();
    esc.text_line(&format!("Time: {}", current_time));

    // --- TABLE HEADER ---
    esc.divider(width);
    esc.bold(true);
    esc.item_row("ITEM", "QTY", "PRICE", "AMT", cols);
    esc.bold(false);
    esc.divider(width);

    // --- ITEMS LOOP ---
    if let Some(items) = order.get("items").and_then(|v| v.as_array()) {
        for item in items {
            let name = item.get("productName").and_then(|v| v.as_str())
                .or(item.get("name").and_then(|v| v.as_str()))
                .unwrap_or("Item");
            let qty = item.get("quantity").and_then(|v| v.as_f64()).unwrap_or(1.0);
            let price = item.get("price").and_then(|v| v.as_f64()).unwrap_or(0.0);
            let total = item.get("total").and_then(|v| v.as_f64()).unwrap_or(qty * price);

            let qty_str = if qty.fract() == 0.0 { format!("{}", qty) } else { format!("{:.2}", qty) };
            let price_str = format!("{:.2}", price);
            let total_str = format!("{:.2}", total);

            esc.item_row(name, &qty_str, &price_str, &total_str, cols);
        }
    }
    esc.divider(width);

    // --- TOTALS ---
    if let Some(subtotal) = order.get("subTotal").and_then(|v| v.as_f64()) {
        esc.text_left_right("Subtotal:", &format!("{:.2}", subtotal), width);
    }
    if let Some(total) = order.get("total").and_then(|v| v.as_f64()) {
        esc.feed(1);
        esc.size(2, 2);
        esc.bold(true);
        // Correct character width for double-size text
        let double_width = width / 2;
        esc.text_left_right("TOTAL:", &format!("{:.2}", total), double_width);
        esc.size(1, 1);
        esc.bold(false);
        esc.feed(1);
    }

    esc.divider(width);
    esc.align(1);
    esc.feed(1);
    esc.text_line("Please present this bill at the counter.");
    esc.text_line("Thank you!");

    esc.feed(4);
    esc.cut();

    let bytes_to_print = esc.bytes;

    let printer_config = get_printer_config(app.clone())
        .await
        .map_err(|e| format!("Failed to load printer config: {}", e))?;

    // Use assigned bill printer or fallback to receipt printer
    let target_printer = printer_config.bill_printer.or(printer_config.receipt_printer);

    print_raw_to_printer(&app, target_printer, bytes_to_print).await
}

#[tauri::command]
pub async fn print_labels_command(
    app: tauri::AppHandle,
    items: Vec<Value>,
    config: Value,
) -> Result<String, String> {
    let mut order = serde_json::Map::new();
    order.insert("items".to_string(), Value::Array(items));

    let mut settings = serde_json::Map::new();
    settings.insert("labelConfig".to_string(), config);

    print_generic_labels(app, Value::Object(order), Value::Object(settings)).await
}

pub async fn print_generic_labels(
    app: tauri::AppHandle,
    order: Value,
    settings: Value,
) -> Result<String, String> {
    let mut all_bytes = Vec::new();
    let label_config = settings.get("labelConfig").or(settings.get("receiptConfig")).unwrap_or(&Value::Null);

    // Layout configuration
    let show_price = label_config.get("showPrice").and_then(|v| v.as_bool()).unwrap_or(true);
    let show_sku = label_config.get("showSku").and_then(|v| v.as_bool()).unwrap_or(true);
    let show_name = label_config.get("showName").and_then(|v| v.as_bool()).unwrap_or(true);
    let barcode_type = label_config.get("barcodeType").and_then(|v| v.as_str()).unwrap_or("code128");
    let name_font_size = label_config.get("nameFontSize").and_then(|v| v.as_u64()).unwrap_or(1);
    let price_font_size = label_config.get("priceFontSize").and_then(|v| v.as_u64()).unwrap_or(2);

    if let Some(items) = order.get("items").and_then(|v| v.as_array()) {
        for item in items {
            let mut esc = EscPosBuilder::new();

            // For labels, we usually center align
            esc.align(1);

            if show_name {
                let name = item.get("productName").or(item.get("name")).and_then(|v| v.as_str()).unwrap_or("Product");
                esc.bold(true);
                if name_font_size > 1 {
                    esc.size(name_font_size as u8, name_font_size as u8);
                }
                esc.text_line(name);
                if name_font_size > 1 {
                    esc.size(1, 1);
                }
                esc.bold(false);
            }

            if show_sku {
                if let Some(sku) = item.get("sku").and_then(|v| v.as_str()) {
                    esc.text_line(&format!("SKU: {}", sku));
                }
            }

            if show_price {
                if let Some(price) = item.get("price").and_then(|v| v.as_f64()) {
                    let currency = item.get("currency").and_then(|v| v.as_str()).unwrap_or("");
                    if price_font_size > 1 {
                        esc.size(price_font_size as u8, (price_font_size as u8).min(2));
                    }
                    esc.text_line(&format!("{} {:.2}", currency, price));
                    if price_font_size > 1 {
                        esc.size(1, 1);
                    }
                }
            }

            if let Some(barcode) = item.get("barcode").and_then(|v| v.as_str()) {
                if barcode_type == "qr" {
                    esc.qr_code(barcode);
                } else {
                    esc.barcode_1d(barcode, Some(barcode_type));
                }
            }

            // Dosage instructions for pharmacy labels
            if let Some(dosage) = item.get("dosageInstructions").and_then(|v| v.as_str()) {
                esc.feed(1);
                esc.align(0);
                esc.text_line("DIRECTIONS:");
                esc.text_line(dosage);
                esc.align(1);
            }

            esc.feed(1);
            esc.cut();

            // Handle multi-copy printing
            let quantity = item.get("quantity").and_then(|v| v.as_u64()).unwrap_or(1);
            for _ in 0..quantity {
                all_bytes.extend(esc.bytes.clone());
            }
        }
    }

    if all_bytes.is_empty() {
        return Err("No items to print labels for".into());
    }

    let printer_config = get_printer_config(app.clone()).await?;

    // Explicitly check for config-provided printer first
    let config_printer_name = label_config.get("printerName").and_then(|v| v.as_str());

    let target_printer = if let Some(name) = config_printer_name {
        if name == "default" {
            printer_config.label_printer.or(printer_config.bar_printer).or(printer_config.receipt_printer)
        } else {
            Some(PrinterConfig {
                method: "system".into(),
                target: name.to_string(),
                port: None,
            })
        }
    } else {
        printer_config.label_printer.or(printer_config.bar_printer).or(printer_config.receipt_printer)
    };

    print_raw_to_printer(&app, target_printer, all_bytes).await
}

// --- LEGACY COMPATIBILITY WRAPPERS (To be removed after full migration) ---

#[tauri::command]
pub async fn print_network_receipt(
    ip: String,
    port: Option<u16>,
    text: String,
) -> Result<String, String> {
    print_network_raw_bytes(ip, port, text.into_bytes())
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn print_system_receipt(
    _app: AppHandle,
    printer_name: String,
    content: String,
    _is_path: bool,
) -> Result<String, String> {
    // Note: We ignore is_path for now as we're standardizing on raw bytes.
    // This wrapper allows legacy code to still call this function.
    print_system_raw_bytes(printer_name, content.into_bytes())
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn print_usb(_vid: u16, _pid: u16, _text: String) -> Result<String, String> {
    Err("USB printing is currently deprecated in favor of system drivers".into())
}