export interface BrandingOptions {
  primaryColor?: string;
  logoUrl?: string;
  companyName?: string;
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyWebsite?: string;
  companyTagline?: string;
  showPoweredBy?: boolean;
  watermarkText?: string;
  customFields?: Array<{ label: string; value: string }>;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface ContactInfo {
  name: string;
  email?: string;
  phone?: string;
  address?: string | Address;
}

export interface DocumentItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  sku?: string;
  unit?: string;
  itemCode?: string;
  itemName?: string;
  rate?: number;
  amount?: number;
}

export type DocumentFormat = 'A4' | 'THERMAL';

export interface BaseDocumentData {
  id: string;
  number: string;
  date: string | Date;
  branding?: BrandingOptions;
  notes?: string;
  currency?: string;
  currencySymbol?: string;
  tags?: string[];
  locationName?: string;
  createdBy?: string;
  status?: string;
}

export interface PackingListData extends BaseDocumentData {
  orderNumber: string;
  customer: ContactInfo;
  shippingAddress: string | Address;
  items: Array<DocumentItem & { quantityPacked?: number }>;
}

export interface ReceiptData extends BaseDocumentData {
  receiptNumber: string;
  orderNumber?: string;
  customer: ContactInfo;
  items: DocumentItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod?: string;
  amountReceived?: number;
  change?: number;
  discountTotal?: number;
}

export interface WaybillData extends BaseDocumentData {
  orderNumber: string;
  qrCodeUrl?: string;
  sender: ContactInfo;
  recipient: ContactInfo & { notes?: string };
  meta?: {
    driverName?: string;
    serviceType?: string;
    primaryColor?: string;
  };
}

export interface StockReportData extends BaseDocumentData {
  name: string;
  generatedBy: string;
  items: Array<{
    productName: string;
    variantName: string;
    sku: string;
    currentStock: number;
    minStock?: number;
    unit: string;
  }>;
}

export interface TransactionAnalyticsExportData extends BaseDocumentData {
  dateRangeText: string;
  activeFiltersText?: string;
  transactions: Array<{
    number: string;
    date: string;
    customerName: string;
    total: number;
    paymentInfo: string;
    items: Array<{
      productName: string;
      variantName: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }>;
  }>;
}

export interface InvoiceData extends BaseDocumentData {
  invoiceNumber: string;
  dueDate?: string;
  status?: string;

  customerName: string;
  customerEmail?: string;
  customerAddress?: string;
  customerPhone?: string;

  items: Array<DocumentItem & {
    details?: string;
    // Legacy compatibility fields
    qty?: number;
    price?: number;
    total?: number;
    itemDescription?: string;
  }>;

  subtotal: number;
  tax: number;
  total: number;
  discount?: number;
  shipping?: number;
  amountPaid?: number;
  balanceDue?: number;

  paymentTerms?: string;
  bankDetails?: {
    accountNo: string;
    sortCode: string;
  };

  verificationHash?: string;
  qrCode?: string;
  invoiceNo?: string;
  invoiceDate?: string;

  // Legacy compatibility fields for top-level
  grandTotal?: number;
  taxRate?: number;
  gstRate?: number;
  isTaxInclusive?: boolean;
  currencyCode?: string;
  currencySettings?: {
    code: string;
    locale: string;
  };
  client?: any;
  company?: any;
  organization?: any;
  billTo?: any;
  billFrom?: any;
  invoiceTo?: any;
  billingAddress?: any;
  shippingAddress?: any;
  organizationName?: string;
  organizationAddress?: string;
  organizationDescription?: string;
  companyName?: string;
  companyTagline?: string;
  companyContact?: any;
  logo?: string | null;
  logoUrl?: string | null;
  website?: string | null;
  footerWebsite?: string;
  footerText?: string;
  payment?: any;
  paymentMethods?: any;
  paymentInformation?: string;
  installmentDetails?: any;
  terms?: string;
  termsAndConditions?: string;
  signature?: any;
}

export interface DeliveryNoteData extends BaseDocumentData {
  orderNumber: string;
  customer: ContactInfo;
  shippingAddress: string | Address;
  items: DocumentItem[];
  otp?: string;
}
