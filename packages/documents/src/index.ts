import {
  renderToBuffer,
  renderToStream,
  renderToFile,
  renderToString,
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
  Canvas,
  Link,
  Note,
  Svg,
  Line,
  Polyline,
  Polygon,
  Path,
  Rect,
  Circle,
  Ellipse,
  G,
  Stop,
  Defs,
  Tspan,
  LinearGradient,
  RadialGradient,
} from '@react-pdf/renderer';
import { createElement, ReactElement } from 'react';

export * from './types';
export * from './templates/invoice';
export * from './templates/Waybill';
export { BatchProductionForm } from './templates/Bakery-batch';
export * from './templates/PackingList';
export * from './templates/StockReport';
export * from './templates/AnalyticsExport';
export { ReceiptDocument } from './templates/Receipt';
export { ReceiptDocument as GenericReceiptDocument } from './templates/Receipt';
export {
  INVOICE_TEMPLATES,
  INVOICE_TEMPLATE_METADATA,
  getInvoiceTemplate,
  renderInvoiceTemplate,
  type InvoiceData as GenericInvoiceData,
  type InvoiceTemplateType
} from './templates/invoice-templates';
export { InvoicePDF as SimpleInvoicePDF } from './templates/InvoicePDF';
export { InvoicePDF as Temp3InvoicePDF, type InvoiceData as Temp3InvoiceData } from './templates/Invoice.temp3';
export { BusinessInvoicePDF as Temp4InvoicePDF } from './templates/Invoice.temp4';
export { ModernInvoicePDF, type ModernInvoiceData, type ModernInvoiceItem } from './templates/Invoice.temp5';
export { BusinessInvoicePDF as DenvisInvoicePDF, type BusinessInvoiceData, type BusinessInvoiceItem } from './templates/denvis.temp.6';
export { InvoicePDF as Temp2InvoicePDF, type InvoiceData as Temp2InvoiceData, type InvoiceItem as Temp2InvoiceItem } from './templates/invoice.temp2';
export { ThermalReceiptPDF, type ThermalReceiptData } from './templates/ThermalReceiptForRestaurants';

export * from './v2/InvoiceTemplate';
export { ReceiptTemplate as ReceiptTemplateV2, type ReceiptPDFData as ReceiptPDFDataV2 } from './v2/ReceiptTemplate';
export * from './v2/StockRequestTemplate';
export * from './v2/StockTransferTemplate';
export * from './mock-data';

export {
  ReceiptDocument as POSReceiptDocument,
  InvoiceDocument as POSInvoiceDocument,
  type ReceiptData as POSReceiptData,
  type CartItem as POSCartItem
} from './templates/pos/POSDocuments';
export * from './templates/pos/SaleReceiptPDF';

export const DocumentGenerator: any = {
  toBuffer: renderToBuffer,
  toStream: renderToStream,
  toFile: renderToFile,
  toString: renderToString,
  createElement: (type: any, props: any, ...children: any[]) => createElement(type, props, ...children),
  renderToStream: (element: ReactElement<any>) => renderToStream(element as any),
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
  Canvas,
  Link,
  Note,
  Svg,
  Line,
  Polyline,
  Polygon,
  Path,
  Rect,
  Circle,
  Ellipse,
  G,
  Stop,
  Defs,
  Tspan,
  LinearGradient,
  RadialGradient,
};
