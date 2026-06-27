import React from "react";
import { Page, Text, View, Document } from "@react-pdf/renderer";
import { commonStyles as styles } from "./document-styles";
import {
  PDFHeader,
  PDFFooter,
  PDFTable,
  PDFTableRow,
  PDFTableCell,
} from "./PDFComponents";

export interface AggregatedStockRequestListPDFData {
  organizationName: string;
  logoUrl?: string;
  items: Array<{
    sku: string;
    name: string;
    variantName: string;
    totalRequested: number;
    totalAllocated: number;
    totalRemaining: number;
  }>;
}

export const AggregatedStockRequestListTemplate = ({
  data,
}: {
  data: AggregatedStockRequestListPDFData;
}) => (
  <Document>
    <Page size="A4" style={styles.page} orientation="landscape">
      <PDFHeader
        logoUrl={data.logoUrl}
        orgName={data.organizationName}
        title="COMPILED STOCK REQUESTS"
        number={new Date().toLocaleDateString()}
      />

      <View style={styles.section}>
        <PDFTable>
          <PDFTableRow>
            <PDFTableCell width="15%" isHeader>
              SKU
            </PDFTableCell>
            <PDFTableCell width="40%" isHeader>
              Product Name
            </PDFTableCell>
            <PDFTableCell width="15%" isHeader>
              Requested
            </PDFTableCell>
            <PDFTableCell width="15%" isHeader>
              Allocated
            </PDFTableCell>
            <PDFTableCell width="15%" isHeader>
              Remaining
            </PDFTableCell>
          </PDFTableRow>
          {data.items.map((item, i) => (
            <PDFTableRow key={i}>
              <PDFTableCell width="15%">{item.sku}</PDFTableCell>
              <PDFTableCell width="40%">
                {item.name} {item.variantName}
              </PDFTableCell>
              <PDFTableCell width="15%">{item.totalRequested}</PDFTableCell>
              <PDFTableCell width="15%">{item.totalAllocated}</PDFTableCell>
              <PDFTableCell width="15%">{item.totalRemaining}</PDFTableCell>
            </PDFTableRow>
          ))}
        </PDFTable>
      </View>

      <PDFFooter
        orgName={data.organizationName}
        docType="Aggregated Stock Requests"
      />
    </Page>
  </Document>
);
