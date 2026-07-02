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
