import React from "react";
import { Page, Text, View, Document } from "@react-pdf/renderer";
import { commonStyles as styles } from "./document-styles";
import {
  PDFHeader,
  PDFFooter,
  PDFGrid,
  PDFCol,
  PDFTable,
  PDFTableRow,
  PDFTableCell,
} from "./PDFComponents";

export interface StockTransferPDFData {
  transferNumber: string;
  status: string;
  requestedDate: string;
  shippedDate?: string;
  receivedDate?: string;
  fromLocation: string;
  toLocation: string;
  requestedBy: string;
  approvedBy?: string;
  shippedBy?: string;
  receivedBy?: string;
  carrier?: string;
  trackingNumber?: string;
  notes?: string;
  items: Array<{
    sku: string;
    productName: string;
    variantName: string;
    requestedQuantity: number;
    shippedQuantity?: number;
    receivedQuantity?: number;
  }>;
  organizationName: string;
  logoUrl?: string;
}

export const StockTransferTemplate = ({
  data,
}: {
  data: StockTransferPDFData;
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <PDFHeader
        logoUrl={data.logoUrl}
        orgName={data.organizationName}
        title="STOCK TRANSFER"
        number={data.transferNumber}
      />
      <View style={styles.section}>
        <PDFGrid>
          <PDFCol label="Requested Date" value={data.requestedDate} />
          <PDFCol label="Status" value={data.status} />
          <PDFCol label="Requested By" value={data.requestedBy} />
        </PDFGrid>
        <PDFGrid>
          <PDFCol label="From Location" value={data.fromLocation} />
          <PDFCol label="To Location" value={data.toLocation} />
          <PDFCol label="Approved By" value={data.approvedBy || "-"} />
        </PDFGrid>
      </View>
      {(data.carrier || data.trackingNumber) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping Information</Text>
          <PDFGrid>
            <PDFCol label="Carrier" value={data.carrier || "-"} />
            <PDFCol
              label="Tracking Number"
              value={data.trackingNumber || "-"}
            />
            <PDFCol label="Shipped Date" value={data.shippedDate || "-"} />
          </PDFGrid>
        </View>
      )}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transfer Items</Text>
        <PDFTable>
          <PDFTableRow>
            <PDFTableCell width="15%" isHeader>
              SKU
            </PDFTableCell>
            <PDFTableCell width="40%" isHeader>
              Product
            </PDFTableCell>
            <PDFTableCell width="15%" isHeader>
              Requested
            </PDFTableCell>
            <PDFTableCell width="15%" isHeader>
              Shipped
            </PDFTableCell>
            <PDFTableCell width="15%" isHeader>
              Received
            </PDFTableCell>
          </PDFTableRow>
          {data.items.map((item, i) => (
            <PDFTableRow key={i}>
              <PDFTableCell width="15%">{item.sku}</PDFTableCell>
              <PDFTableCell width="40%">
                {item.productName} {item.variantName}
              </PDFTableCell>
              <PDFTableCell width="15%">{item.requestedQuantity}</PDFTableCell>
              <PDFTableCell width="15%">
                {item.shippedQuantity ?? "-"}
              </PDFTableCell>
              <PDFTableCell width="15%">
                {item.receivedQuantity ?? "-"}
              </PDFTableCell>
            </PDFTableRow>
          ))}
        </PDFTable>
      </View>
      {data.notes && (
        <View style={styles.section}>
          <Text style={styles.label}>Notes</Text>
          <Text style={styles.tableCell}>{data.notes}</Text>
        </View>
      )}
      <PDFFooter
        orgName={data.organizationName}
        docType="Stock Transfer Document"
      />
    </Page>
  </Document>
);
