/**
 * Supported barcode formats for enterprise use.
 */
export type BarcodeFormat =
  | 'code128'
  | 'code39'
  | 'ean13'
  | 'ean8'
  | 'upca'
  | 'qr'
  | 'pdf417'
  | 'datamatrix';

export interface BarcodeOptions {
  width?: number;
  height?: number;
  includeText?: boolean;
  scale?: number;
  rotate?: 'N' | 'R' | 'L' | 'I';
  padding?: number;
  background?: string;
}

/**
 * BarcodeService provides a centralized logic for generating barcodes
 * and QR codes across the enterprise application.
 */
export const BarcodeService = {
  /**
   * Generates a barcode as a Data URL (PNG).
   */
  async generate(
    text: string,
    format: BarcodeFormat = 'code128',
    options: BarcodeOptions = {}
  ): Promise<string> {
    if (!text) {
      throw new Error('Barcode text is required');
    }

    try {
      const bwipjs = await import('bwip-js');
      // Map simplified formats to bwip-js BCIDs
      const bcidMap: Record<string, string> = {
        code128: 'code128',
        code39: 'code39',
        ean13: 'ean13',
        ean8: 'ean8',
        upca: 'upca',
        upc: 'upca',
        qr: 'qrcode',
        pdf417: 'pdf417',
        datamatrix: 'datamatrix'
      };

      const canvas = document.createElement('canvas');

      bwipjs.toCanvas(canvas, {
        bcid: bcidMap[format],
        text: text,
        scale: options.scale ?? 3,
        height: options.height ?? 10,
        includetext: options.includeText ?? true,
        textxalign: 'center',
        rotate: options.rotate ?? 'N',
        paddingwidth: options.padding ?? 0,
        paddingheight: options.padding ?? 0,
        backgroundcolor: options.background ?? 'ffffff'
      });

      return canvas.toDataURL('image/png');
    } catch (err) {
      console.error('[BarcodeService] Generation failed:', err);
      throw new Error(`Failed to generate ${format} barcode: ${err}`);
    }
  },

  /**
   * Validates if a string is a valid barcode of a specific format.
   */
  isValid(text: string, format: BarcodeFormat): boolean {
    if (!text) return false;

    switch (format) {
      case 'ean13':
        return /^\d{13}$/.test(text);
      case 'ean8':
        return /^\d{8}$/.test(text);
      case 'upca':
        return /^\d{12}$/.test(text);
      default:
        return text.length > 0;
    }
  }
};

export interface ParsedBarcodeResult {
  raw: string;
  cleanBarcode: string;
  quantity: number;
  isVariableWeight: boolean;
  weightOrPrice?: number;
  itemCode?: string;
}

/**
 * Parses supermarket cashier barcode entries, supporting:
 * 1. Multiplier prefix: "5*12345678" or "3x12345678" -> quantity: 5, barcode: "12345678"
 * 2. In-store Variable Weight / Price EAN-13 barcodes (prefix 20-29):
 *    Format: PP IIIII WWWW C (PP: 2-digit prefix, IIIII: 5-digit item code, WWWW: 4-digit weight/price in grams/cents, C: checksum)
 */
export function parseBarcodeEntry(input: string): ParsedBarcodeResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { raw: input, cleanBarcode: '', quantity: 1, isVariableWeight: false };
  }

  let quantity = 1;
  let code = trimmed;

  // Check for quantity multiplier like "5*barcode" or "5xbarcode"
  const multiplierMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*[*xX]\s*(.+)$/);
  if (multiplierMatch) {
    const parsedQty = parseFloat(multiplierMatch[1]);
    if (!isNaN(parsedQty) && parsedQty > 0) {
      quantity = parsedQty;
      code = multiplierMatch[2].trim();
    }
  }

  // Check for EAN-13 variable weight / price (standard retail prefixes 20 - 29)
  if (/^\d{13}$/.test(code)) {
    const prefix = parseInt(code.substring(0, 2), 10);
    if (prefix >= 20 && prefix <= 29) {
      const itemCode = code.substring(2, 7);
      const valueDigits = parseInt(code.substring(7, 11), 10);
      // Typically 4 digits represent weight in grams / 1000 (kg) or price in cents / 100
      const weightInKg = valueDigits / 1000;

      return {
        raw: input,
        cleanBarcode: code,
        quantity: quantity === 1 ? weightInKg : quantity,
        isVariableWeight: true,
        weightOrPrice: weightInKg,
        itemCode,
      };
    }
  }

  return {
    raw: input,
    cleanBarcode: code,
    quantity,
    isVariableWeight: false,
  };
}
