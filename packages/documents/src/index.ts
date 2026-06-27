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
} from "@react-pdf/renderer";
import { createElement, ReactElement } from "react";

export * from "./types";
export * from "./registry";

// V1 Templates
export * from "./templates/v1/invoice";
export * from "./templates/v1/Waybill";
export * from "./templates/v1/DeliveryNote";
export { BatchProductionForm } from "./templates/v1/Bakery-batch";
export * from "./templates/v1/PackingList";
export * from "./templates/v1/StockReport";
export * from "./templates/v1/AnalyticsExport";
export { ReceiptDocument } from "./templates/v1/Receipt";
export { ReceiptDocument as GenericReceiptDocument } from "./templates/v1/Receipt";
export {
  INVOICE_TEMPLATES,
  INVOICE_TEMPLATE_METADATA,
  getInvoiceTemplate,
  renderInvoiceTemplate,
  type InvoiceData as GenericInvoiceData,
  type InvoiceTemplateType,
} from "./templates/v1/invoice-templates";
export {
  getMockInvoiceData,
  getMockReceiptData,
  getMockWaybillData,
} from "./mock-data";
export { InvoicePDF as SimpleInvoicePDF } from "./templates/v1/InvoicePDF";
export { InvoicePDF as Temp2InvoicePDF } from "./templates/v1/invoice.temp2";
export {
  ThermalReceiptPDF,
  type ThermalReceiptData,
} from "./templates/v1/ThermalReceiptForRestaurants";

export {
  ReceiptDocument as POSReceiptDocument,
  InvoiceDocument as POSInvoiceDocument,
  type ReceiptData as POSReceiptData,
  type CartItem as POSCartItem,
} from "./templates/v1/pos/POSDocuments";
export * from "./templates/v1/pos/SaleReceiptPDF";

// V2 Templates
export * from "./templates/v2/InvoiceTemplate";
export {
  ReceiptTemplate as ReceiptTemplateV2,
  type ReceiptPDFData as ReceiptPDFDataV2,
} from "./templates/v2/ReceiptTemplate";
export * from "./templates/v2/StockRequestTemplate";
export * from "./templates/v2/StockTransferTemplate";
export * from "./templates/v2/StockRequestListTemplate";
export * from "./templates/v2/AggregatedStockRequestListTemplate";
export * from "./templates/v2/StockTransferListTemplate";

export * from "./mock-data";

export const DocumentGenerator: any = {
  toBuffer: renderToBuffer,
  toStream: renderToStream,
  toFile: renderToFile,
  toString: renderToString,
  createElement: (type: any, props: any, ...children: any[]) =>
    createElement(type, props, ...children),
  renderToStream: (element: ReactElement<any>) =>
    renderToStream(element as any),
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
