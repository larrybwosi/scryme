import React from "react";
import { InvoicePDF as InvoiceDefault } from "./templates/v1/invoice";
import { InvoicePDF as InvoiceTemp2 } from "./templates/v1/invoice.temp2";
import { InvoicePDF as InvoiceTemp3 } from "./templates/v1/Invoice.temp3";
import { BusinessInvoicePDF as InvoiceTemp4 } from "./templates/v1/Invoice.temp4";
import { ModernInvoicePDF } from "./templates/v1/Invoice.temp5";
import { BusinessInvoicePDF as DenvisInvoiceTemp6 } from "./templates/v1/denvis.temp.6";
import { InvoicePDF as InvoiceSimple } from "./templates/v1/InvoicePDF";
import { InvoiceTemplate as InvoiceV2 } from "./templates/v2/InvoiceTemplate";

import { ReceiptDocument as ReceiptDefault } from "./templates/v1/Receipt";
import { ReceiptTemplate as ReceiptV2 } from "./templates/v2/ReceiptTemplate";

import { WaybillDocument as WaybillDefault } from "./templates/v1/Waybill";
import { WaybillV3Document } from "./templates/v3/stock/WaybillV3";
import { DeliveryNoteV3Document } from "./templates/v3/stock/DeliveryNoteV3";

import {
  TemplateOne,
  TemplateTwo,
  TemplateThree,
  TemplateFour,
  TemplateFive,
  TemplateSix,
  TemplateSeven,
  TemplateEight,
  ReceiptOne,
  ReceiptTwo,
  ReceiptThree,
  ReceiptFour,
  ReceiptFive,
  ReceiptSix,
  ReceiptSeven,
  ReceiptEight,
} from "./templates/v3";

export type DocumentType = "INVOICE" | "RECEIPT" | "WAYBILL" | "DELIVERY_NOTE";

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
    id: "invoice-v2",
    name: "Professional V2",
    description: "Clean, modern professional design with verification codes.",
    version: "v2.0.0",
    type: "INVOICE",
    component: InvoiceV2 as React.ComponentType<any>,
  },
  {
    id: "invoice-default",
    name: "Classic Invoice",
    description: "Our original standard invoice design.",
    version: "v1.0.0",
    type: "INVOICE",
    component: InvoiceDefault as React.ComponentType<any>,
  },
  {
    id: "invoice-temp2",
    name: "Modern Minimal",
    description: "A sleek, minimalist approach to billing.",
    version: "v1.0.0",
    type: "INVOICE",
    component: InvoiceTemp2 as React.ComponentType<any>,
  },
  {
    id: "invoice-temp3",
    name: "Compact Billing",
    description: "Space-efficient design for smaller invoices.",
    version: "v1.0.0",
    type: "INVOICE",
    component: InvoiceTemp3 as React.ComponentType<any>,
  },
  {
    id: "invoice-temp4",
    name: "Business Formal",
    description: "Traditional business layout with detailed headers.",
    version: "v1.0.0",
    type: "INVOICE",
    component: InvoiceTemp4 as React.ComponentType<any>,
  },
  {
    id: "invoice-temp5",
    name: "Premium Modern",
    description: "High-end design with bold accents.",
    version: "v1.0.0",
    type: "INVOICE",
    component: ModernInvoicePDF as React.ComponentType<any>,
  },
  {
    id: "invoice-temp6",
    name: "Corporate Standard",
    description: "Standard corporate template for large-scale operations.",
    version: "v1.0.0",
    type: "INVOICE",
    component: DenvisInvoiceTemp6 as React.ComponentType<any>,
  },
  {
    id: "invoice-simple",
    name: "Ultra Simple",
    description: "Just the facts, no extra styling.",
    version: "v1.0.0",
    type: "INVOICE",
    component: InvoiceSimple as React.ComponentType<any>,
  },
  {
    id: "invoice-v3-1",
    name: "V3 Teal Modern",
    description: "Modern teal design with a fixed bottom footer band.",
    version: "v3.0.0",
    type: "INVOICE",
    component: TemplateOne as React.ComponentType<any>,
  },
  {
    id: "invoice-v3-2",
    name: "V3 Diamond Accent",
    description: "Elegant design with diamond icons and sidebar meta info.",
    version: "v3.0.0",
    type: "INVOICE",
    component: TemplateTwo as React.ComponentType<any>,
  },
  {
    id: "invoice-v3-3",
    name: "V3 Gray Header",
    description: "Clean design with a bold top gray band and badge numbers.",
    version: "v3.0.0",
    type: "INVOICE",
    component: TemplateThree as React.ComponentType<any>,
  },
  {
    id: "invoice-v3-4",
    name: "V3 Navy & Yellow",
    description:
      "Bold professional design with navy headers and yellow accents.",
    version: "v3.0.0",
    type: "INVOICE",
    component: TemplateFour as React.ComponentType<any>,
  },
  {
    id: "invoice-v3-5",
    name: "V3 Compact Modern",
    description: "Compact and efficient layout for smaller transactions.",
    version: "v3.0.0",
    type: "INVOICE",
    component: TemplateFive as React.ComponentType<any>,
  },
  {
    id: "invoice-v3-6",
    name: "V3 Elegant Serif",
    description: "A sophisticated design with serif fonts.",
    version: "v3.0.0",
    type: "INVOICE",
    component: TemplateSix as React.ComponentType<any>,
  },
  {
    id: "invoice-v3-7",
    name: "V3 Bold Corporate",
    description: "A heavy-hitting corporate layout.",
    version: "v3.0.0",
    type: "INVOICE",
    component: TemplateSeven as React.ComponentType<any>,
  },
  {
    id: "invoice-v3-8",
    name: "V3 Clean Professional",
    description: "A no-nonsense professional layout.",
    version: "v3.0.0",
    type: "INVOICE",
    component: TemplateEight as React.ComponentType<any>,
  },

  // Receipts
  {
    id: "receipt-v2",
    name: "Standard Receipt V2",
    description: "Modern receipt template with itemized breakdown.",
    version: "v2.0.0",
    type: "RECEIPT",
    component: ReceiptV2 as React.ComponentType<any>,
  },
  {
    id: "receipt-default",
    name: "Classic Receipt",
    description: "Standard receipt design for quick transactions.",
    version: "v1.0.0",
    type: "RECEIPT",
    component: ReceiptDefault as React.ComponentType<any>,
  },
  {
    id: "receipt-v3-1",
    name: "V3 Teal Modern Receipt",
    description: "Modern teal receipt design.",
    version: "v3.0.0",
    type: "RECEIPT",
    component: ReceiptOne as React.ComponentType<any>,
  },
  {
    id: "receipt-v3-2",
    name: "V3 Diamond Accent Receipt",
    description: "Elegant receipt design with diamond icons.",
    version: "v3.0.0",
    type: "RECEIPT",
    component: ReceiptTwo as React.ComponentType<any>,
  },
  {
    id: "receipt-v3-3",
    name: "V3 Gray Header Receipt",
    description: "Clean receipt design with gray header band.",
    version: "v3.0.0",
    type: "RECEIPT",
    component: ReceiptThree as React.ComponentType<any>,
  },
  {
    id: "receipt-v3-4",
    name: "V3 Navy & Yellow Receipt",
    description: "Bold professional receipt design.",
    version: "v3.0.0",
    type: "RECEIPT",
    component: ReceiptFour as React.ComponentType<any>,
  },
  {
    id: "receipt-v3-5",
    name: "V3 Compact Modern Receipt",
    description: "Compact modern receipt design.",
    version: "v3.0.0",
    type: "RECEIPT",
    component: ReceiptFive as React.ComponentType<any>,
  },
  {
    id: "receipt-v3-6",
    name: "V3 Elegant Serif Receipt",
    description: "Sophisticated receipt design.",
    version: "v3.0.0",
    type: "RECEIPT",
    component: ReceiptSix as React.ComponentType<any>,
  },
  {
    id: "receipt-v3-7",
    name: "V3 Bold Corporate Receipt",
    description: "Heavy-hitting corporate receipt.",
    version: "v3.0.0",
    type: "RECEIPT",
    component: ReceiptSeven as React.ComponentType<any>,
  },
  {
    id: "receipt-v3-8",
    name: "V3 Clean Professional Receipt",
    description: "No-nonsense professional receipt.",
    version: "v3.0.0",
    type: "RECEIPT",
    component: ReceiptEight as React.ComponentType<any>,
  },

  // Waybills
  {
    id: "waybill-default",
    name: "Standard Waybill",
    description: "Official waybill for shipping and deliveries.",
    version: "v1.0.0",
    type: "WAYBILL",
    component: WaybillDefault as React.ComponentType<any>,
  },
  {
    id: "waybill-v3",
    name: "V3 Enterprise Waybill",
    description:
      "Next-gen enterprise waybill with branded header band, three-party signature block, and thermal format support.",
    version: "v3.0.0",
    type: "WAYBILL",
    component: WaybillV3Document as React.ComponentType<any>,
  },

  // Delivery Notes
  {
    id: "delivery-note-v3",
    name: "V3 Enterprise Delivery Note",
    description:
      "Professional delivery note with three-party signature block, condition columns, and branded footer.",
    version: "v3.0.0",
    type: "DELIVERY_NOTE",
    component: DeliveryNoteV3Document as React.ComponentType<any>,
  },
];

export function getTemplateById(id: string) {
  return DOCUMENT_REGISTRY.find((t) => t.id === id);
}

export function getTemplatesByType(type: DocumentType) {
  return DOCUMENT_REGISTRY.filter((t) => t.type === type).sort((a, b) =>
    b.version.localeCompare(a.version),
  );
}
