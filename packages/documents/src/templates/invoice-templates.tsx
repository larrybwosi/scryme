import React from 'react';
import { InvoicePDF as InvoiceDefault } from './invoice';
import { InvoicePDF as InvoiceTemp2 } from './invoice.temp2';
import { InvoicePDF as InvoiceTemp3 } from './Invoice.temp3';
import { BusinessInvoicePDF as InvoiceTemp4 } from './Invoice.temp4';
import { ModernInvoicePDF } from './Invoice.temp5';
import { BusinessInvoicePDF as DenvisInvoiceTemp6 } from './denvis.temp.6';
import { InvoicePDF as InvoiceSimple } from './InvoicePDF';

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  currencySymbol: string;
  currency: string;
  customerName: string;
  customerAddress: string;
  client: {
    name: string;
    email: string;
    address: string | any;
  };
  items: Array<{
    description: string;
    qty: number;
    unitPrice: number;
    amount: number;
    // Some templates use these aliases
    quantity?: number;
    price?: number;
    total?: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  shipping?: number;
  company: {
    name: string;
    address: string;
    logo?: string | null;
    email?: string | null;
    phone?: string | null;
    website?: string | null;
  };
  // Some templates use organization instead of company
  organization?: {
    name: string;
    address: string;
    logo?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  payment: {
    terms: string;
    availableMethods: string[];
  };
  notes?: string | null;
  // For templates that need more detailed address
  billingAddress?: any;
  shippingAddress?: any;
}

export const INVOICE_TEMPLATES = {
  default: InvoiceDefault as React.ComponentType<any>,
  temp2: InvoiceTemp2 as React.ComponentType<any>,
  temp3: InvoiceTemp3 as React.ComponentType<any>,
  temp4: InvoiceTemp4 as React.ComponentType<any>,
  temp5: ModernInvoicePDF as React.ComponentType<any>,
  temp6: DenvisInvoiceTemp6 as React.ComponentType<any>,
  simple: InvoiceSimple as React.ComponentType<any>,
} as const;

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
