// Print configuration and job types for automated receipt printing

export interface AutoPrintConfig {
  enabled: boolean;
  printFormat: 'pdf' | 'thermal' | 'both';
  copies: number; // 1-5
  openCashDrawer: boolean; // Auto-open cash drawer on cash payments
  printKitchenReceipt: boolean; // Print separate kitchen receipt
  kitchenPrinterType: 'receipt' | 'kitchen' | null; // Which printer to use for kitchen receipts
  showPrintDialog: boolean; // Show confirmation before printing
  silentMode: boolean; // Print without UI feedback
  autoRetry: boolean; // Automatically retry failed prints
  maxRetries: number; // Maximum retry attempts
}

export interface PrintJob {
  id: string;
  orderId: string;
  orderNumber: string;
  timestamp: Date;
  status: 'pending' | 'printing' | 'success' | 'failed' | 'queued';
  format: 'pdf' | 'thermal';
  error?: string;
  retryCount: number;
  maxRetries: number;
  printerName?: string;
  jobType: 'customer' | 'kitchen'; // Type of receipt
}

export interface PrintResult {
  success: boolean;
  jobId?: string;
  error?: string;
  requiresRetry?: boolean;
}

export interface PrintQueueItem extends PrintJob {
  orderData: any; // Full order data for reprinting
}

export const DEFAULT_AUTO_PRINT_CONFIG: AutoPrintConfig = {
  enabled: false,
  printFormat: 'pdf',
  copies: 1,
  openCashDrawer: false,
  printKitchenReceipt: false,
  kitchenPrinterType: null,
  showPrintDialog: false,
  silentMode: false,
  autoRetry: true,
  maxRetries: 2,
};
