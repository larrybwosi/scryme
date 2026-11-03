export type KRAProviderType = "NAVARI" | "DIRECT_ETIMS";
export type KRAEnvironmentType = "SANDBOX" | "PRODUCTION";
export type KRAEnforcementModeType = "BLOCKING" | "ASYNC";

export interface KRAConfiguration {
  id?: string;
  organizationId: string;
  provider: KRAProviderType;
  environment: KRAEnvironmentType;
  enforcementMode: KRAEnforcementModeType;
  kraPin: string;
  businessName?: string | null;
  branchCode: string;
  deviceSerialNumber?: string | null;
  controlUnitId?: string | null;
  apiKey?: string | null;
  apiSecret?: string | null;
  highValueThreshold: number;
  autoSyncSales: boolean;
  autoSyncPurchases: boolean;
  isActive: boolean;
}

export interface KRAInvoicePayload {
  invoiceId: string;
  transactionId?: string;
  invoiceNumber?: string;
  customerName?: string;
  customerPin?: string;
  postingDate?: Date | string;
  netTotal: number;
  totalTaxes: number;
  grandTotal: number;
  etrMode?: boolean;
  items: Array<{
    itemName: string;
    itemCode?: string;
    hsCode?: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
    taxAmount?: number;
    lineTotal: number;
  }>;
}

export interface KRAPurchasePayload {
  purchaseId: string;
  purchaseOrderNumber?: string;
  supplierName?: string;
  supplierPin: string;
  invoiceDate?: Date | string;
  subTotal: number;
  taxTotal: number;
  grandTotal: number;
  items?: Array<{
    itemName: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
    taxAmount?: number;
    lineTotal: number;
  }>;
}

export interface KRASubmissionResult {
  success: boolean;
  controlCode?: string;
  receiptNumber?: string;
  qrCodeUrl?: string;
  status: "SUBMITTED" | "ACKNOWLEDGED" | "FAILED";
  errorCode?: string;
  errorMessage?: string;
  rawResponse?: any;
}

export interface KRAPinValidationResult {
  valid: boolean;
  taxpayerName?: string;
  kraPin: string;
  status?: string;
  message?: string;
}

export interface KRAVATSummary {
  periodStartDate: string;
  periodEndDate: string;
  outputVat: number;
  inputVat: number;
  netVatPayable: number;
  totalSales: number;
  totalPurchases: number;
  documentsCount: number;
}

export interface IKRAProvider {
  readonly name: string;
  readonly providerType: KRAProviderType;

  validatePin(config: KRAConfiguration, kraPin: string): Promise<KRAPinValidationResult>;
  submitInvoice(config: KRAConfiguration, payload: KRAInvoicePayload): Promise<KRASubmissionResult>;
  submitPurchase(config: KRAConfiguration, payload: KRAPurchasePayload): Promise<KRASubmissionResult>;
  getVatReturnReport(config: KRAConfiguration, params: { startDate: string; endDate: string }): Promise<any>;
}
