import React from 'react';
import { InvoicePDF as InvoiceDefault } from './templates/v1/invoice';
import { InvoicePDF as InvoiceTemp2 } from './templates/v1/invoice.temp2';
import { InvoicePDF as InvoiceTemp3 } from './templates/v1/Invoice.temp3';
import { BusinessInvoicePDF as InvoiceTemp4 } from './templates/v1/Invoice.temp4';
import { ModernInvoicePDF } from './templates/v1/Invoice.temp5';
import { BusinessInvoicePDF as DenvisInvoiceTemp6 } from './templates/v1/denvis.temp.6';
import { InvoicePDF as InvoiceSimple } from './templates/v1/InvoicePDF';
import { InvoiceTemplate as InvoiceV2 } from './templates/v2/InvoiceTemplate';

import { ReceiptDocument as ReceiptDefault } from './templates/v1/Receipt';
import { ReceiptTemplate as ReceiptV2 } from './templates/v2/ReceiptTemplate';

import { WaybillDocument as WaybillDefault } from './templates/v1/Waybill';

export type DocumentType = 'INVOICE' | 'RECEIPT' | 'WAYBILL';

export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  type: DocumentType;
  component: React.ComponentType<any>;
}

export const DOCUMENT_REGISTRY: TemplateMetadata[] = [
  // Invoices
  {
    id: 'invoice-v2',
    name: 'Professional V2',
    description: 'Clean, modern professional design with verification codes.',
    version: 'v2.0.0',
    type: 'INVOICE',
    component: InvoiceV2 as React.ComponentType<any>
  },
  {
    id: 'invoice-default',
    name: 'Classic Invoice',
    description: 'Our original standard invoice design.',
    version: 'v1.0.0',
    type: 'INVOICE',
    component: InvoiceDefault as React.ComponentType<any>
  },
  {
    id: 'invoice-temp2',
    name: 'Modern Minimal',
    description: 'A sleek, minimalist approach to billing.',
    version: 'v1.0.0',
    type: 'INVOICE',
    component: InvoiceTemp2 as React.ComponentType<any>
  },
  {
    id: 'invoice-temp3',
    name: 'Compact Billing',
    description: 'Space-efficient design for smaller invoices.',
    version: 'v1.0.0',
    type: 'INVOICE',
    component: InvoiceTemp3 as React.ComponentType<any>
  },
  {
    id: 'invoice-temp4',
    name: 'Business Formal',
    description: 'Traditional business layout with detailed headers.',
    version: 'v1.0.0',
    type: 'INVOICE',
    component: InvoiceTemp4 as React.ComponentType<any>
  },
  {
    id: 'invoice-temp5',
    name: 'Premium Modern',
    description: 'High-end design with bold accents.',
    version: 'v1.0.0',
    type: 'INVOICE',
    component: ModernInvoicePDF as React.ComponentType<any>
  },
  {
    id: 'invoice-temp6',
    name: 'Corporate Standard',
    description: 'Standard corporate template for large-scale operations.',
    version: 'v1.0.0',
    type: 'INVOICE',
    component: DenvisInvoiceTemp6 as React.ComponentType<any>
  },
  {
    id: 'invoice-simple',
    name: 'Ultra Simple',
    description: 'Just the facts, no extra styling.',
    version: 'v1.0.0',
    type: 'INVOICE',
    component: InvoiceSimple as React.ComponentType<any>
  },

  // Receipts
  {
    id: 'receipt-v2',
    name: 'Standard Receipt V2',
    description: 'Modern receipt template with itemized breakdown.',
    version: 'v2.0.0',
    type: 'RECEIPT',
    component: ReceiptV2 as React.ComponentType<any>
  },
  {
    id: 'receipt-default',
    name: 'Classic Receipt',
    description: 'Standard receipt design for quick transactions.',
    version: 'v1.0.0',
    type: 'RECEIPT',
    component: ReceiptDefault as React.ComponentType<any>
  },

  // Waybills
  {
    id: 'waybill-default',
    name: 'Standard Waybill',
    description: 'Official waybill for shipping and deliveries.',
    version: 'v1.0.0',
    type: 'WAYBILL',
    component: WaybillDefault as React.ComponentType<any>
  }
];

export function getTemplateById(id: string) {
  return DOCUMENT_REGISTRY.find(t => t.id === id);
}

export function getTemplatesByType(type: DocumentType) {
  return DOCUMENT_REGISTRY.filter(t => t.type === type).sort((a, b) => b.version.localeCompare(a.version));
}
