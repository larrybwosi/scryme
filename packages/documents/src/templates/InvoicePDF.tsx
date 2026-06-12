// components/documents/InvoicePDF.tsx

import React from "react";
import {
  Page,
  Document,
  Image,
  StyleSheet,
  Text,
  View,
  Font,
} from "@react-pdf/renderer";

// Register a professional and clean font (e.g., Lato from Google Fonts)
// Download the .ttf files and place them in your `public/fonts` directory
Font.register({
  family: "Lato",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/lato/v23/S6uyw4BMUTPHjx4wWw.ttf",
      fontWeight: "normal",
    },
    {
      src: "https://fonts.gstatic.com/s/lato/v23/S6u9w4BMUTPHh6UVSwiPHA.ttf",
      fontWeight: "bold",
    },
  ],
});

// Define styles for the invoice
const styles = StyleSheet.create({
  page: {
    fontFamily: "Lato",
    fontSize: 11,
    padding: 30,
    color: "#333",
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: "#4A90E2",
    paddingBottom: 10,
  },
  companyLogo: {
    width: 60,
    height: 60,
  },
  invoiceTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#4A90E2",
  },
  companyInfo: {
    textAlign: "right",
  },
  section: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  billTo: {
    flex: 1,
  },
  invoiceDetails: {
    flex: 1,
    textAlign: "right",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#4A90E2",
    marginBottom: 5,
  },
  text: {
    fontSize: 10,
    marginBottom: 2,
  },
  table: {
    width: "100%",
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#4A90E2",
    color: "#fff",
    padding: 5,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    padding: 5,
    alignItems: "center",
  },
  tableRowAlt: {
    backgroundColor: "#f9f9f9",
  },
  colDescription: {
    width: "55%",
    fontSize: 10,
  },
  colQty: {
    width: "10%",
    textAlign: "right",
    fontSize: 10,
  },
  colPrice: {
    width: "17.5%",
    textAlign: "right",
    fontSize: 10,
  },
  colAmount: {
    width: "17.5%",
    textAlign: "right",
    fontSize: 10,
  },
  headerText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#fff",
  },
  totalsSection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  totalsTable: {
    width: "40%",
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 3,
  },
  totalsLabel: {
    fontSize: 10,
  },
  totalsValue: {
    fontSize: 10,
    textAlign: "right",
  },
  grandTotalRow: {
    marginTop: 5,
    paddingTop: 5,
    borderTopWidth: 2,
    borderTopColor: "#4A90E2",
  },
  grandTotalLabel: {
    fontWeight: "bold",
    fontSize: 12,
  },
  grandTotalValue: {
    fontWeight: "bold",
    fontSize: 12,
    textAlign: "right",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 10,
  },
  footerText: {
    fontSize: 9,
    color: "#888",
  },
  qrCode: {
    width: 80, // Larger QR Code
    height: 80,
  },
});

interface InvoicePDFProps {
  data: any; // Define a proper type for your invoice data
  qrCode: string;
}

export const InvoicePDF: React.FC<InvoicePDFProps> = ({ data, qrCode }) => {
  const invoiceData = data;
  console.log(invoiceData);
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {/* You can use a real company logo here */}
          {/* <Image style={styles.companyLogo} src={invoiceData.company.logo} /> */}
          <Text style={styles.invoiceTitle}>INVOICE</Text>
          <View style={styles.companyInfo}>
            <Text style={{ ...styles.text, fontWeight: "bold", fontSize: 12 }}>
              {invoiceData?.organization?.name}
            </Text>
            <Text style={styles.text}>
              {invoiceData?.organization?.address || ""}
            </Text>
            <Text style={styles.text}>
              {invoiceData?.organization?.phone || ""}
            </Text>
            <Text style={styles.text}>
              {invoiceData?.organization?.email || ""}
            </Text>
          </View>
        </View>

        {/* Bill To & Invoice Details */}
        <View style={styles.section}>
          <View style={styles.billTo}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            <Text style={{ ...styles.text, fontWeight: "bold" }}>
              {invoiceData.customer.name}
            </Text>
            <Text style={styles.text}>{invoiceData.customer.address}</Text>
            <Text style={styles.text}>{invoiceData.customer.email}</Text>
          </View>
          <View style={styles.invoiceDetails}>
            <Text style={styles.sectionTitle}>Invoice Details</Text>
            <Text style={styles.text}>
              <Text style={{ fontWeight: "bold" }}>Invoice #:</Text>{" "}
              {invoiceData.invoiceNumber}
            </Text>
            <Text style={styles.text}>
              <Text style={{ fontWeight: "bold" }}>Date:</Text>{" "}
              {invoiceData.date}
            </Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerText, styles.colDescription]}>
              Description
            </Text>
            <Text style={[styles.headerText, styles.colQty]}>Qty</Text>
            <Text style={[styles.headerText, styles.colPrice]}>Unit Price</Text>
            <Text style={[styles.headerText, styles.colAmount]}>Amount</Text>
          </View>
          {invoiceData.items.map((item: any, index: number) => (
            <View
              key={index}
              style={[
                styles.tableRow,
                index % 2 === 1 ? styles.tableRowAlt : {},
              ]}
            >
              <Text style={styles.colDescription}>{item.description}</Text>
              <Text style={styles.colQty}>{item.qty}</Text>
              <Text style={styles.colPrice}>
                {invoiceData.currencySymbol}{" "}
                {item.price ? item.price.toFixed(2) : item.unitPrice.toFixed(2)}
              </Text>
              <Text style={styles.colAmount}>
                {invoiceData.currencySymbol}{" "}
                {item.amount
                  ? item.amount.toFixed(2)
                  : (item.qty * item.unitPrice).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsTable}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>
                {invoiceData.currencySymbol} {invoiceData.subtotal.toFixed(2)}
              </Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Tax</Text>
              <Text style={styles.totalsValue}>
                {invoiceData.currencySymbol} {invoiceData.tax.toFixed(2)}
              </Text>
            </View>
            <View style={[styles.totalsRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Total Due</Text>
              <Text style={styles.grandTotalValue}>
                {invoiceData.currencySymbol} {invoiceData.total.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer with QR Code */}
        <View style={styles.footer}>
          <View>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.footerText}>{invoiceData.notes}</Text>
            <Text style={{ ...styles.sectionTitle, marginTop: 10 }}>
              Payment Terms
            </Text>
            <Text style={styles.footerText}>{invoiceData?.payment?.terms}</Text>
          </View>
          <Image style={styles.qrCode} src={qrCode} />
        </View>
      </Page>
    </Document>
  );
};
