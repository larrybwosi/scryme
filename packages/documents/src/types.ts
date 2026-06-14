export interface BrandingOptions {
  primaryColor?: string;
  logoUrl?: string;
  companyName?: string;
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyWebsite?: string;
  companyTagline?: string;
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
}
