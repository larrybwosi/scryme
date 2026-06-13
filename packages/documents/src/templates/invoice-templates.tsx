import React from 'react';
import { InvoicePDF as InvoiceDefault } from './invoice';
import { InvoicePDF as InvoiceTemp2 } from './invoice.temp2';
import { InvoicePDF as InvoiceTemp3 } from './Invoice.temp3';
import { BusinessInvoicePDF as InvoiceTemp4 } from './Invoice.temp4';
import { ModernInvoicePDF } from './Invoice.temp5';
import { BusinessInvoicePDF as DenvisInvoiceTemp6 } from './denvis.temp.6';
import { InvoicePDF as InvoiceSimple } from './InvoicePDF';
import { InvoiceTemplate as InvoiceV2 } from '../v2/InvoiceTemplate';

export interface InvoiceData {
  // General Identifiers
  id: string;
  invoiceNumber: string;
  invoiceNo?: string;
  number?: string;
  date: string;
  dateOfIssue?: string;
  invoiceDate?: string;
  dueDate?: string;
  status?: string;

  // Currency
  currencySymbol: string;
  currency: string;
  currencyCode?: string;
  currencySettings?: {
    code: string;
    locale: string;
  };

  // Client / Customer Info
  customerName: string;
  customerEmail?: string;
  customerAddress?: string;
  customerPhone?: string;
  client: {
    name: string;
    email: string;
    address: string | any;
    phone?: string;
    company?: string;
  };
  invoiceTo?: {
    name: string;
    address: string | any;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    phone?: string;
    fax?: string;
    email?: string;
  };
  billTo?: {
    name: string;
    address: string | any;
    city?: string;
    state?: string;
    zipCode?: string;
    phone?: string;
    email?: string;
  };
  billingAddress?: any;
  shippingAddress?: any;

  // Company / Organization Info
  company: {
    name: string;
    address: string;
    city?: string;
    logo?: string | null;
    logoUrl?: string | null;
    email?: string | null;
    phone?: string | null;
    website?: string | null;
    tagline?: string;
  };
  organization?: {
    name: string;
    address: string;
    logo?: string | null;
    logoUrl?: string | null;
    email?: string | null;
    phone?: string | null;
    description?: string;
    primaryColor?: string;
  };
  billFrom?: {
    name: string;
    address: string;
    phone?: string;
    email?: string;
    city?: string;
    state?: string;
  };
  organizationName?: string;
  organizationAddress?: string;
  organizationDescription?: string;
  companyName?: string;
  companyTagline?: string;
  companyContact?: {
    phone: string;
    fax: string;
    email: string;
  };
  logo?: string | null;
  logoUrl?: string | null;
  website?: string | null;
  footerWebsite?: string;

  // Items
  items: Array<{
    description: string;
    itemDescription?: string;
    itemName?: string;
    itemCode?: string;
    qty: number;
    quantity: number;
    unitPrice: number;
    price: number;
    rate: number;
    amount: number;
    total: number;
    details?: string;
  }>;

  // Totals
  subtotal: number;
  netTotal?: number;
  tax: number;
  taxTotal?: number;
  totalTaxes?: number;
  gstRate?: number;
  taxRate?: number;
  isTaxInclusive?: boolean;
  discount?: number;
  discountTotal?: number;
  shipping?: number;
  shippingTotal?: number;
  total: number;
  grandTotal?: number;
  amountPaid?: number;
  balanceDue?: number;

  // Payment
  payment: {
    terms: string;
    availableMethods: string[];
    paymentTerms?: string;
  };
  paymentMethods?: Array<{
    methodName: string;
    details: string[];
  }>;
  paymentTerms?: string;
  paymentInformation?: string;
  bankDetails?: {
    accountNo: string;
    sortCode: string;
  };
  installmentDetails?: {
    isInstallment: boolean;
    totalAmountPaidSoFar: number;
    balanceDue: number;
    note?: string;
  };

  // Other
  notes?: string | null;
  terms?: string;
  termsAndConditions?: string;
  signature?: {
    name: string;
    title: string;
  };
  verificationHash?: string;
}

export const INVOICE_TEMPLATES = {
  default: InvoiceDefault as React.ComponentType<any>,
  v2: InvoiceV2 as React.ComponentType<any>,
  temp2: InvoiceTemp2 as React.ComponentType<any>,
  temp3: InvoiceTemp3 as React.ComponentType<any>,
  temp4: InvoiceTemp4 as React.ComponentType<any>,
  temp5: ModernInvoicePDF as React.ComponentType<any>,
  temp6: DenvisInvoiceTemp6 as React.ComponentType<any>,
  simple: InvoiceSimple as React.ComponentType<any>,
} as const;

export const INVOICE_TEMPLATE_METADATA = [
  { id: 'default', name: 'Classic Invoice', description: 'Our original standard invoice design.', version: 'v1' },
  { id: 'v2', name: 'Professional V2', description: 'Clean, modern professional design with verification codes.', version: 'v2' },
  { id: 'temp2', name: 'Modern Minimal', description: 'A sleek, minimalist approach to billing.', version: 'v1' },
  { id: 'temp3', name: 'Compact Billing', description: 'Space-efficient design for smaller invoices.', version: 'v1' },
  { id: 'temp4', name: 'Business Formal', description: 'Traditional business layout with detailed headers.', version: 'v1' },
  { id: 'temp5', name: 'Premium Modern', description: 'High-end design with bold accents.', version: 'v1' },
  { id: 'temp6', name: 'Corporate Standard', description: 'Standard corporate template for large-scale operations.', version: 'v1' },
  { id: 'simple', name: 'Ultra Simple', description: 'Just the facts, no extra styling.', version: 'v1' },
] as const;

export type InvoiceTemplateType = keyof typeof INVOICE_TEMPLATES;

export function getInvoiceTemplate(template?: string | null) {
  if (template && template in INVOICE_TEMPLATES) {
    return INVOICE_TEMPLATES[template as InvoiceTemplateType];
  }
  return INVOICE_TEMPLATES.default;
}

/**
 * Helper to render the appropriate template with normalized props
 */
export function renderInvoiceTemplate(Template: React.ComponentType<any>, invoiceData: InvoiceData, qrCode: string) {
  return <Template data={invoiceData} qrCode={qrCode} />;
}
