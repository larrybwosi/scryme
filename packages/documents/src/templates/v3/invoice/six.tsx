import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import React from "react";
import { V3DocumentData } from "../types";

// ---- Minimalist, clean color palette from the reference design ----
const BG_COLOR = "#F4F4F4";
const CHARCOAL = "#222222";
const MUTED_TEXT = "#555555";
const LINE_COLOR = "#CCCCCC";

const styles = StyleSheet.create({
  page: {
    paddingVertical: 50,
    paddingHorizontal: 50,
    fontSize: 9,
    color: CHARCOAL,
    fontFamily: "Helvetica",
    backgroundColor: BG_COLOR,
  },

  // ---------- Header Layout ----------
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 40,
  },
  headerLeft: {
    flexDirection: "column",
    gap: 4,
  },
  companyName: {
    fontSize: 11,
    color: MUTED_TEXT,
  },
  metaText: {
    fontSize: 10,
    color: MUTED_TEXT,
    marginTop: 15,
  },
  dateText: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginTop: 12,
    color: CHARCOAL,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  mainTitle: {
    fontSize: 46,
    fontFamily: "Helvetica-Bold",
    color: CHARCOAL,
    lineHeight: 1,
    marginBottom: 25,
  },
  invoiceToLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: MUTED_TEXT,
    marginBottom: 3,
  },
  customerName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: CHARCOAL,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  customerAddress: {
    fontSize: 9,
    color: MUTED_TEXT,
    textAlign: "right",
    lineHeight: 1.3,
    maxWidth: 180,
  },

  // ---------- Table Area ----------
  dividerLine: {
    borderBottomWidth: 1,
    borderBottomColor: LINE_COLOR,
    marginVertical: 12,
  },
  tableHeader: {
    flexDirection: "row",
    paddingBottom: 8,
  },
  tableHeaderCell: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: CHARCOAL,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    alignItems: "flex-start",
  },
  tableCell: {
    fontSize: 10,
    color: CHARCOAL,
    lineHeight: 1.4,
  },

  // Column Sizing
  colDesc: { width: "70%", paddingRight: 20 },
  colQty: { width: "15%", textAlign: "center" },
  colRate: { width: "15%", textAlign: "right" },

  itemDescriptionBlock: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  bulletAccent: {
    width: 12,
    fontSize: 10,
    color: MUTED_TEXT,
  },
  itemTextContainer: {
    flex: 1,
  },

  // ---------- Totals Section ----------
  totalsContainer: {
    alignItems: "flex-end",
    marginTop: 10,
    marginBottom: 30,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 220,
    paddingVertical: 5,
  },
  totalsLabel: {
    fontSize: 10,
    color: CHARCOAL,
  },
  totalsValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 220,
    paddingVertical: 8,
    marginVertical: 4,
  },
  grandTotalLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  grandTotalValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
  },

  // ---------- Bottom Info Block ----------
  bottomContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 10,
  },
  bottomLeftBlock: {
    width: "60%",
  },
  accentSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 2,
    borderLeftColor: CHARCOAL,
    paddingLeft: 6,
    marginBottom: 8,
    marginTop: 15,
  },
  accentSectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: CHARCOAL,
  },
  bankDetailsRow: {
    flexDirection: "row",
    marginBottom: 4,
    fontSize: 10,
  },
  bankLabel: {
    width: 75,
    color: MUTED_TEXT,
  },
  bankValue: {
    color: CHARCOAL,
  },
  termsParagraph: {
    fontSize: 9,
    color: MUTED_TEXT,
    lineHeight: 1.4,
  },

  // ---------- Signature Block ----------
  bottomRightBlock: {
    width: "30%",
    alignItems: "center",
    marginTop: 35,
  },
  signatureLine: {
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: LINE_COLOR,
    marginBottom: 4,
    alignItems: "center",
    paddingBottom: 2,
  },
  signatureGraphic: {
    fontFamily: "Helvetica-Oblique",
    fontSize: 14,
    color: CHARCOAL,
  },
  signatureLabel: {
    fontSize: 9,
    color: MUTED_TEXT,
  },
});

export const TemplateTwo = ({ data }: { data: V3DocumentData }) => {
  const {
    type,
    number,
    date,
    company,
    customer,
    items,
    subtotal,
    tax,
    taxRate,
    total,
    currency,
    terms,
  } = data;

  const fmt = (n: number) =>
    `${currency.symbol}${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ================= HEADER SECTION ================= */}
        <View style={styles.headerContainer}>
          <View style={styles.headerLeft}>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 11 }}>
              {company.name}
            </Text>
            <Text style={styles.companyName}>Company Name</Text>

            <Text style={styles.metaText}>
              {type ? type : "Invoice"} No &nbsp; : &nbsp; {number}
            </Text>
            <Text style={styles.dateText}>{date}</Text>
          </View>

          <View style={styles.headerRight}>
            <Text style={styles.mainTitle}>
              {type
                ? type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()
                : "Invoice"}
            </Text>
            <Text style={styles.invoiceToLabel}>Invoice to</Text>
            <Text style={styles.customerName}>{customer.name}</Text>
            {customer.address && (
              <Text style={styles.customerAddress}>{customer.address}</Text>
            )}
          </View>
        </View>

        {/* ================= TABLE SECTION ================= */}
        <View style={styles.dividerLine} />

        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, styles.colDesc]}>
            Description
          </Text>
          <Text style={[styles.tableHeaderCell, styles.colQty]}>QTY</Text>
          <Text style={[styles.tableHeaderCell, styles.colRate]}>Rate</Text>
        </View>

        <View style={styles.dividerLine} />

        {items.map((item, idx) => (
          <View key={idx} style={styles.tableRow}>
            <View
              style={[
                styles.tableCell,
                styles.colDesc,
                styles.itemDescriptionBlock,
              ]}
            >
              <Text style={styles.bulletAccent}>&gt;</Text>
              <View style={styles.itemTextContainer}>
                <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 2 }}>
                  {item.name}
                </Text>
                {item.description && (
                  <Text style={{ color: MUTED_TEXT, fontSize: 9.5 }}>
                    {item.description}
                  </Text>
                )}
              </View>
            </View>
            <Text style={[styles.tableCell, styles.colQty]}>
              {item.quantity}
            </Text>
            <Text style={[styles.tableCell, styles.colRate]}>
              {fmt(item.unitPrice)}
            </Text>
          </View>
        ))}

        {/* ================= TOTALS SECTION ================= */}
        <View style={styles.dividerLine} />

        <View style={styles.totalsContainer}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Amount Due</Text>
            <Text style={styles.totalsValue}>{fmt(subtotal)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>GST ({taxRate || 10}%)</Text>
            <Text style={styles.totalsValue}>{tax ? fmt(tax) : "$0"}</Text>
          </View>

          <View
            style={{
              width: 220,
              borderBottomWidth: 1,
              borderBottomColor: LINE_COLOR,
              marginVertical: 4,
            }}
          />

          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total Amount Due</Text>
            <Text style={styles.grandTotalValue}>{fmt(total)}</Text>
          </View>

          <View
            style={{
              width: 220,
              borderBottomWidth: 1,
              borderBottomColor: LINE_COLOR,
              marginVertical: 4,
            }}
          />
        </View>

        {/* ================= BOTTOM INFO & SIGNATURE ================= */}
        <View style={styles.bottomContainer}>
          <View style={styles.bottomLeftBlock}>
            {/* Payment Method */}
            <View style={styles.accentSectionHeader}>
              <Text style={styles.accentSectionTitle}>Payment Method</Text>
            </View>
            <Text
              style={[
                styles.bankLabel,
                { fontSize: 10, marginBottom: 6, fontFamily: "Helvetica-Bold" },
              ]}
            >
              Bank Details
            </Text>
            <View style={styles.bankDetailsRow}>
              <Text style={styles.bankLabel}>Account No :</Text>
              <Text style={styles.bankValue}>638 738 856</Text>
            </View>
            <View style={styles.bankDetailsRow}>
              <Text style={styles.bankLabel}>Sort Code :</Text>
              <Text style={styles.bankValue}>84 57 39</Text>
            </View>

            {/* Payment Terms */}
            <View style={[styles.accentSectionHeader, { marginTop: 20 }]}>
              <Text style={styles.accentSectionTitle}>Payment Terms</Text>
            </View>
            <Text style={styles.termsParagraph}>
              {terms ||
                "Rase voluptat doluptamus, vita suntiat ut qui digenti umquam comnis molorumquats moluptias fuias sendame nestemp oreheni amusdam sitetu."}
            </Text>
          </View>

          {/* Signature Graphic Block */}
          <View style={styles.bottomRightBlock}>
            <View style={styles.signatureLine}>
              <Text style={styles.signatureGraphic}>Robert William</Text>
            </View>
            <Text style={styles.signatureLabel}>Signature</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default TemplateTwo;
