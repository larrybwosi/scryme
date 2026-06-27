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

export interface StockRequestPDFData {
  requestNumber: string;
  status: string;
  priority: string;
  requestDate: string;
  fromLocation: string;
  toLocation: string;
  requestedBy: string;
  justification?: string;
  items: Array<{
    sku: string;
    productName: string;
    variantName: string;
    quantity: number;
    reason?: string;
  }>;
  organizationName: string;
  logoUrl?: string;
}

export const StockRequestTemplate = ({
  data,
}: {
  data: StockRequestPDFData;
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <PDFHeader
        logoUrl={data.logoUrl}
        orgName={data.organizationName}
        title="STOCK REQUEST"
        number={data.requestNumber}
      />
      <View style={styles.section}>
        <PDFGrid>
          <PDFCol label="Requested Date" value={data.requestDate} />
          <PDFCol label="Status" value={data.status} />
          <PDFCol label="Priority" value={data.priority} />
        </PDFGrid>
        <PDFGrid>
          <PDFCol label="From Location" value={data.fromLocation} />
          <PDFCol label="To Location" value={data.toLocation} />
          <PDFCol label="Requested By" value={data.requestedBy} />
        </PDFGrid>
      </View>
      {data.justification && (
        <View style={styles.section}>
          <Text style={styles.label}>Justification</Text>
          <Text style={styles.tableCell}>{data.justification}</Text>
        </View>
      )}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Requested Items</Text>
        <PDFTable>
          <PDFTableRow>
            <PDFTableCell width="15%" isHeader>
              SKU
            </PDFTableCell>
            <PDFTableCell width="45%" isHeader>
              Product
            </PDFTableCell>
            <PDFTableCell width="15%" isHeader>
              Quantity
            </PDFTableCell>
            <PDFTableCell width="25%" isHeader>
              Reason
            </PDFTableCell>
          </PDFTableRow>
          {data.items.map((item, i) => (
            <PDFTableRow key={i}>
              <PDFTableCell width="15%">{item.sku}</PDFTableCell>
              <PDFTableCell width="45%">
                {item.productName} {item.variantName}
              </PDFTableCell>
              <PDFTableCell width="15%">{item.quantity}</PDFTableCell>
              <PDFTableCell width="25%">{item.reason || "-"}</PDFTableCell>
            </PDFTableRow>
          ))}
        </PDFTable>
      </View>
      <PDFFooter
        orgName={data.organizationName}
        docType="Stock Request Document"
      />
    </Page>
  </Document>
);
