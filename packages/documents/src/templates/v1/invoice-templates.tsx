import React from 'react';
import { InvoicePDF as InvoiceDefault } from './invoice';
import { InvoicePDF as InvoiceTemp2 } from './invoice.temp2';
import { InvoicePDF as InvoiceTemp3 } from './Invoice.temp3';
import { BusinessInvoicePDF as InvoiceTemp4 } from './Invoice.temp4';
import { ModernInvoicePDF } from './Invoice.temp5';
import { BusinessInvoicePDF as DenvisInvoiceTemp6 } from './denvis.temp.6';
import { InvoicePDF as InvoiceSimple } from './InvoicePDF';
import { InvoiceTemplate as InvoiceV2 } from '../v2/InvoiceTemplate';
import { InvoiceData } from '../../types';
import { isV3Template } from '../../utils';
import { getTemplateById } from '../../registry';

export { type InvoiceData };

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

  // Support for V3 templates via registry
  if (isV3Template(template)) {
    const v3Template = getTemplateById(template!);
    if (v3Template) return v3Template.component;
  }

  return INVOICE_TEMPLATES.default;
}

/**
 * Helper to render the appropriate template with normalized props
 */
export function renderInvoiceTemplate(Template: React.ComponentType<any>, invoiceData: InvoiceData, qrCode: string) {
  return <Template data={invoiceData} qrCode={qrCode} />;
}
