import React from 'react';
import { InvoicePDF as InvoiceDefault } from './invoice';
import { InvoicePDF as InvoiceTemp2 } from './invoice.temp2';
import { InvoicePDF as InvoiceSimple } from './InvoicePDF';
import { InvoiceTemplate as InvoiceV2 } from '../v2/InvoiceTemplate';
import { InvoiceData } from '../../types';

export { type InvoiceData };

export const INVOICE_TEMPLATES = {
  default: InvoiceDefault as React.ComponentType<any>,
  v2: InvoiceV2 as React.ComponentType<any>,
  temp2: InvoiceTemp2 as React.ComponentType<any>,
  simple: InvoiceSimple as React.ComponentType<any>,
} as const;

export const INVOICE_TEMPLATE_METADATA = [
  { id: 'default', name: 'Classic Invoice', description: 'Our original standard invoice design.', version: 'v1' },
  { id: 'v2', name: 'Professional V2', description: 'Clean, modern professional design with verification codes.', version: 'v2' },
  { id: 'temp2', name: 'Modern Minimal', description: 'A sleek, minimalist approach to billing.', version: 'v1' },
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
