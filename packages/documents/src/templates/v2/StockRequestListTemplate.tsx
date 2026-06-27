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

export interface StockRequestListPDFData {
  organizationName: string;
  logoUrl?: string;
  requests: Array<{
    requestNumber: string;
    requestDate: string;
    location: string;
    itemsCount: number;
    priority: string;
    status: string;
    estimatedCost: string;
  }>;
}

export const StockRequestListTemplate = ({
  data,
}: {
  data: StockRequestListPDFData;
}) => (
  <Document>
    <Page size="A4" style={styles.page} orientation="landscape">
      <PDFHeader
        logoUrl={data.logoUrl}
        orgName={data.organizationName}
        title="STOCK REQUESTS LIST"
        number={new Date().toLocaleDateString()}
      />

      <View style={styles.section}>
        <PDFTable>
          <PDFTableRow>
            <PDFTableCell width="15%" isHeader>
              Request #
            </PDFTableCell>
            <PDFTableCell width="15%" isHeader>
              Date
            </PDFTableCell>
            <PDFTableCell width="20%" isHeader>
              Location
            </PDFTableCell>
            <PDFTableCell width="10%" isHeader>
              Items
            </PDFTableCell>
            <PDFTableCell width="10%" isHeader>
              Priority
            </PDFTableCell>
            <PDFTableCell width="15%" isHeader>
              Status
            </PDFTableCell>
            <PDFTableCell width="15%" isHeader>
              Est. Cost
            </PDFTableCell>
          </PDFTableRow>
          {data.requests.map((req, i) => (
            <PDFTableRow key={i}>
              <PDFTableCell width="15%">{req.requestNumber}</PDFTableCell>
              <PDFTableCell width="15%">{req.requestDate}</PDFTableCell>
              <PDFTableCell width="20%">{req.location}</PDFTableCell>
              <PDFTableCell width="10%">{req.itemsCount}</PDFTableCell>
              <PDFTableCell width="10%">{req.priority}</PDFTableCell>
              <PDFTableCell width="15%">{req.status}</PDFTableCell>
              <PDFTableCell width="15%">{req.estimatedCost}</PDFTableCell>
            </PDFTableRow>
          ))}
        </PDFTable>
      </View>

      <PDFFooter
        orgName={data.organizationName}
        docType="Stock Requests List"
      />
    </Page>
  </Document>
);
