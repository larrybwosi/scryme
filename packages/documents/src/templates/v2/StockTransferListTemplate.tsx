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

export interface StockTransferListPDFData {
  organizationName: string;
  logoUrl?: string;
  transfers: Array<{
    transferNumber: string;
    fromLocation: string;
    toLocation: string;
    requestedDate: string;
    requestedBy: string;
    status: string;
  }>;
}

export const StockTransferListTemplate = ({
  data,
}: {
  data: StockTransferListPDFData;
}) => (
  <Document>
    <Page size="A4" style={styles.page} orientation="landscape">
      <PDFHeader
        logoUrl={data.logoUrl}
        orgName={data.organizationName}
        title="STOCK TRANSFERS LIST"
        number={new Date().toLocaleDateString()}
      />

      <View style={styles.section}>
        <PDFTable>
          <PDFTableRow>
            <PDFTableCell width="15%" isHeader>
              Transfer #
            </PDFTableCell>
            <PDFTableCell width="20%" isHeader>
              From Location
            </PDFTableCell>
            <PDFTableCell width="20%" isHeader>
              To Location
            </PDFTableCell>
            <PDFTableCell width="15%" isHeader>
              Date
            </PDFTableCell>
            <PDFTableCell width="15%" isHeader>
              Requested By
            </PDFTableCell>
            <PDFTableCell width="15%" isHeader>
              Status
            </PDFTableCell>
          </PDFTableRow>
          {data.transfers.map((trf, i) => (
            <PDFTableRow key={i}>
              <PDFTableCell width="15%">{trf.transferNumber}</PDFTableCell>
              <PDFTableCell width="20%">{trf.fromLocation}</PDFTableCell>
              <PDFTableCell width="20%">{trf.toLocation}</PDFTableCell>
              <PDFTableCell width="15%">{trf.requestedDate}</PDFTableCell>
              <PDFTableCell width="15%">{trf.requestedBy}</PDFTableCell>
              <PDFTableCell width="15%">{trf.status}</PDFTableCell>
            </PDFTableRow>
          ))}
        </PDFTable>
      </View>

      <PDFFooter
        orgName={data.organizationName}
        docType="Stock Transfers List"
      />
    </Page>
  </Document>
);
