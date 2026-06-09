use image::{imageops::FilterType};

pub struct EscPosBuilder {
    pub bytes: Vec<u8>,
}

impl Default for EscPosBuilder {
    fn default() -> Self {
        Self::new()
    }
}

impl EscPosBuilder {
    pub fn new() -> Self {
        Self {
            bytes: vec![0x1B, 0x40], // ESC @ (Initialize printer)
        }
    }

    pub fn text(&mut self, text: &str) {
        self.bytes.extend_from_slice(text.as_bytes());
    }

    /// Helper to print text and automatically feed to the next line.
    pub fn text_line(&mut self, text: &str) {
        self.text(text);
        self.feed(1);
    }

    pub fn feed(&mut self, lines: u8) {
        for _ in 0..lines {
            self.bytes.push(0x0A); // LF
        }
    }

    pub fn align(&mut self, pos: u8) {
        // 0 = Left, 1 = Center, 2 = Right
        self.bytes.extend_from_slice(&[0x1B, 0x61, pos]); 
    }

    pub fn bold(&mut self, on: bool) {
        let val = if on { 1 } else { 0 };
        self.bytes.extend_from_slice(&[0x1B, 0x45, val]);
    }

    /// Set text size. Width and height are multipliers from 1 to 8.
    /// Default size is (1, 1). To reset, call `size(1, 1)`.
    pub fn size(&mut self, width_multiplier: u8, height_multiplier: u8) {
        // Clamp values between 1 and 8 to prevent invalid commands
        let w = width_multiplier.clamp(1, 8) - 1;
        let h = height_multiplier.clamp(1, 8) - 1;
        
        // ESC/POS packs both sizes into a single byte using bitwise shifts:
        // n = (width - 1) * 16 + (height - 1)
        let n = (w << 4) | h;
        
        // GS ! n (Select character size)
        self.bytes.extend_from_slice(&[0x1D, 0x21, n]);
    }

    /// Turn underline on or off. 
    /// 0 = Off, 1 = 1-dot thick, 2 = 2-dots thick.
    pub fn underline(&mut self, thickness: u8) {
        let n = thickness.clamp(0, 2);
        
        // ESC - n (Turn underline mode on/off)
        self.bytes.extend_from_slice(&[0x1B, 0x2D, n]);
    }

    /// Turn inverse printing (white text on black background) on or off.
    pub fn inverse(&mut self, on: bool) {
        let n = if on { 1 } else { 0 };
        
        // GS B n (Turn white/black reverse printing mode on/off)
        self.bytes.extend_from_slice(&[0x1D, 0x42, n]);
    }

    pub fn cut(&mut self) {
        self.bytes.extend_from_slice(&[0x1D, 0x56, 0x41, 0x00]); // GS V A 0 (Full Cut)
    }

    // --- NEW: LAYOUT & FORMATTING HELPERS ---

    /// Prints a divider line of dashes to match the PDF divider style.
    /// Provide your paper width in characters (e.g., 32 for 58mm, 48 for 80mm).
    pub fn divider(&mut self, char_width: usize) {
        let dashes = "-".repeat(char_width);
        self.text_line(&dashes);
    }

    /// Aligns left string to the left margin, right string to the right margin.
    /// Perfect for Totals, Subtotals, and Discounts.
    pub fn text_left_right(&mut self, left: &str, right: &str, char_width: usize) {
        let left_len = left.chars().count();
        let right_len = right.chars().count();
        
        if left_len + right_len >= char_width {
            // Fallback if strings are too long
            self.text_line(&format!("{} {}", left, right));
        } else {
            let padding = char_width - left_len - right_len;
            let padded_string = format!("{}{}{}", left, " ".repeat(padding), right);
            self.text_line(&padded_string);
        }
    }

    /// Formats the primary receipt item row.
    /// You must pass the column widths based on your paper size.
    /// Example for 58mm (32 chars): col_widths = (14, 4, 6, 8)
    /// Example for 80mm (48 chars): col_widths = (22, 6, 9, 11)
    pub fn item_row(&mut self, item: &str, qty: &str, price: &str, total: &str, col_widths: (usize, usize, usize, usize)) {
        let (w_item, w_qty, w_price, w_total) = col_widths;
        
        // Safely truncate the item name if it's too long for its column
        let mut item_str = item.to_string();
        if item_str.chars().count() > w_item {
            // Keep room for a trailing space
            let end = item_str.char_indices().nth(w_item - 1).map(|(i, _)| i).unwrap_or(item_str.len());
            item_str = item_str[..end].to_string();
        }

        // Left align Item, Right align Qty, Price, and Total
        let formatted_row = format!(
            "{:<w_item$}{:>w_qty$}{:>w_price$}{:>w_total$}",
            item_str, qty, price, total,
            w_item = w_item, w_qty = w_qty, w_price = w_price, w_total = w_total
        );

        self.text_line(&formatted_row);
    }

    // --- NEW: NATIVE 1D BARCODE (CODE128) ---
    /// Prints a standard 1D Barcode with text below it. Perfect for order numbers.
    pub fn barcode_1d(&mut self, data: &str, symbology: Option<&str>) {
        // HRI characters print position: 2 = Below the barcode
        self.bytes.extend_from_slice(&[0x1D, 0x48, 0x02]);
        
        // Set barcode height (e.g., 64 dots)
        self.bytes.extend_from_slice(&[0x1D, 0x68, 0x40]);
        
        // Set barcode width module (2 to 6, 2 is standard for receipts)
        self.bytes.extend_from_slice(&[0x1D, 0x77, 0x02]);

        let symbology = symbology.unwrap_or("code128");
        
        match symbology.to_lowercase().as_str() {
            "upc-a" | "upca" => {
                // GS k 65 n d1...dn
                let bytes = data.as_bytes();
                if bytes.len() >= 11 {
                    self.bytes.extend_from_slice(&[0x1D, 0x6B, 65, bytes.len() as u8]);
                    self.bytes.extend_from_slice(bytes);
                }
            }
            "ean13" => {
                // GS k 67 n d1...dn
                let bytes = data.as_bytes();
                if bytes.len() >= 12 {
                    self.bytes.extend_from_slice(&[0x1D, 0x6B, 67, bytes.len() as u8]);
                    self.bytes.extend_from_slice(bytes);
                }
            }
            "ean8" => {
                // GS k 68 n d1...dn
                let bytes = data.as_bytes();
                if bytes.len() >= 7 {
                    self.bytes.extend_from_slice(&[0x1D, 0x6B, 68, bytes.len() as u8]);
                    self.bytes.extend_from_slice(bytes);
                }
            }
            _ => {
                // Default to CODE128
                // Print barcode using CODE128 (System 73 / 0x49)
                // ESC/POS CODE128 requires a subset character prepended to the data.
                // We use Subset B '{B' (0x7B, 0x42) for standard alphanumerics.
                let mut barcode_data = vec![0x7B, 0x42];
                barcode_data.extend_from_slice(data.as_bytes());

                let len = barcode_data.len() as u8;

                // GS k <m> <n> <data>
                self.bytes.extend_from_slice(&[0x1D, 0x6B, 0x49, len]);
                self.bytes.extend_from_slice(&barcode_data);
            }
        }
        
        self.feed(2); // Padding below the barcode
    }

    // --- NATIVE QR CODE ---
    pub fn qr_code(&mut self, url: &str) {
        let url_bytes = url.as_bytes();
        let store_len = url_bytes.len() + 3; // +3 for the command header bytes
        
        let p_l = (store_len % 256) as u8;
        let p_h = (store_len / 256) as u8;

        // 1. Set QR Code Model (Model 2 is standard)
        // GS ( k 0x04 0x00 0x31 0x41 0x32 0x00
        self.bytes.extend_from_slice(&[0x1D, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]);

        // 2. Set QR Code Module Size (1 to 16, 6 or 8 is usually best for readability)
        // GS ( k 0x03 0x00 0x31 0x43 <size>
        self.bytes.extend_from_slice(&[0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, 0x06]);

        // 3. Set Error Correction Level (48=L, 49=M, 50=Q, 51=H)
        // GS ( k 0x03 0x00 0x31 0x45 <level>
        self.bytes.extend_from_slice(&[0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x30]); // 0x30 = 48 (L)

        // 4. Store QR Code Data
        // GS ( k pL pH 0x31 0x50 0x30 <data>
        self.bytes.extend_from_slice(&[0x1D, 0x28, 0x6B, p_l, p_h, 0x31, 0x50, 0x30]);
        self.bytes.extend_from_slice(url_bytes);

        // 5. Print the QR Code
        // GS ( k 0x03 0x00 0x31 0x51 0x30
        self.bytes.extend_from_slice(&[0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30]);
        
        self.feed(2); // Add some padding below it
    }

    // --- NATIVE LOGO PRINTING (GS v 0) ---
    pub fn logo(&mut self, img_path: &str, is_58mm: bool) -> Result<(), String> {
        let img = image::open(img_path).map_err(|e| e.to_string())?;
        
        // Max width: 58mm = 384px, 80mm = 512px
        let max_width = if is_58mm { 384 } else { 512 };
        
        // Resize while maintaining aspect ratio
        let resized = img.resize(max_width, max_width * 2, FilterType::Nearest);
        let grayscale = resized.to_luma8();
        let (width, height) = grayscale.dimensions();
        
        // Width in bytes (1 bit per pixel)
        let width_bytes = width.div_ceil(8) as u16;
        let x_l = (width_bytes % 256) as u8;
        let x_h = (width_bytes / 256) as u8;
        let y_l = (height % 256) as u8;
        let y_h = ((height / 256) % 256) as u8;

        self.align(1); // Center logo
        
        // GS v 0 (Raster bit image command: normal mode)
        self.bytes.extend_from_slice(&[0x1D, 0x76, 0x30, 0x00, x_l, x_h, y_l, y_h]);

        // Pack 8 pixels into 1 byte
        for y in 0..height {
            for x_byte in 0..width_bytes {
                let mut byte = 0u8;
                for bit in 0..8 {
                    let x = (x_byte * 8) + bit as u16;
                    if (x as u32) < width {
                        // Get the pixel's grayscale value
                        let pixel = grayscale.get_pixel(x as u32, y)[0];
                        
                        // Threshold: If darker than 128, burn a dot (bit = 1)
                        if pixel < 128 {
                            // Shift a 1 into the correct bit position (MSB to LSB)
                            byte |= 1 << (7 - bit);
                        }
                    }
                }
                self.bytes.push(byte);
            }
        }
        
        self.feed(1); // Give it some breathing room after the image
        self.align(0); // Reset to left
        Ok(())
    }
}