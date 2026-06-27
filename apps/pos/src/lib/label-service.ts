import { invoke } from '@tauri-apps/api/core';

export interface PrintLabelItem {
  id: string;
  name: string;
  sku?: string;
  barcode: string;
  price?: number;
  currency?: string;
  category?: string;
  quantity: number;
}

export type LabelSize = '50x30' | '40x25' | '30x20' | '100x50';

export interface LabelPrintConfig {
  size: LabelSize;
  showPrice: boolean;
  showSku: boolean;
  showName: boolean;
  barcodeType: 'code128' | 'ean13' | 'ean8' | 'upca' | 'qr';
  printerName?: string;
  nameFontSize?: number;
  priceFontSize?: number;
}

/**
 * LabelService handles the orchestration of label printing tasks.
 * It abstracts the communication with the Rust backend.
 */
export const LabelService = {
  /**
   * Batch print product labels.
   */
  async printLabels(items: PrintLabelItem[], config: LabelPrintConfig): Promise<void> {
    if (items.length === 0) return;

    try {
      await invoke('print_labels_command', {
        items,
        config: {
          ...config,
          printerName: config.printerName || 'default',
        },
      });
    } catch (err) {
      console.error('[LabelService] Print failed:', err);
      throw new Error(`Label printing failed: ${err}`);
    }
  },

  /**
   * Get available printers that support label printing.
   */
  async getAvailablePrinters(): Promise<string[]> {
    try {
      const printers = await invoke<any[]>('get_system_printers');
      return printers.map(p => p.name);
    } catch (err) {
      console.error('[LabelService] Failed to fetch printers:', err);
      return [];
    }
  },
};
