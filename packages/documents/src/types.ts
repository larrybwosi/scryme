export interface BrandingOptions {
  primaryColor?: string;
  logoUrl?: string;
  companyName?: string;
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyWebsite?: string;
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
}

export type DocumentFormat = 'A4' | 'THERMAL';

export interface PackingListData {
  orderNumber: string;
  date: Date | string;
  customer: ContactInfo;
  shippingAddress: string | Address;
  items: Array<DocumentItem & { quantityPacked?: number }>;
  notes?: string;
  branding?: BrandingOptions;
}

export interface ReceiptData {
  receiptNumber: string;
  orderNumber?: string;
  date: Date | string;
  customer: ContactInfo;
  items: DocumentItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod?: string;
  branding?: BrandingOptions;
  amountReceived?: number;
  change?: number;
  discountTotal?: number;
}

export interface WaybillData {
  id: string;
  orderNumber: string;
  date: Date | string;
  qrCodeUrl?: string;
  logoUrl?: string;
  sender: ContactInfo;
  recipient: ContactInfo & { notes?: string };
  meta?: {
    driverName?: string;
    serviceType?: string;
    primaryColor?: string;
  };
}

export interface StockReportData {
  name: string;
  date: string;
  generatedBy: string;
  organization: {
    name: string;
    logo?: string;
  };
  items: Array<{
    productName: string;
    variantName: string;
    sku: string;
    currentStock: number;
    minStock?: number;
    unit: string;
  }>;
}

export interface TransactionAnalyticsExportData {
  organization: {
    name: string;
    logo?: string;
  };
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
