import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Svg,
  Path,
} from "@react-pdf/renderer";
import React from "react";
import { V3DocumentData } from "../types";

// ---- Colors pulled from the reference invoice ----
const BG = "#EAEAE8";
const DARK = "#2A2A2A";
const GRAY_TEXT = "#6E6E6E";
const PINK = "#E07A8B";
const LINE = "#2A2A2A";
const LIGHT_LINE = "#BFBFBD";

const styles = StyleSheet.create({
  page: {
    backgroundColor: BG,
    paddingTop: 45,
    paddingBottom: 45,
    paddingHorizontal: 50,
    fontSize: 9,
    color: DARK,
    fontFamily: "Helvetica",
  },

  // ---------- Header ----------
  brandName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    marginTop: 10,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  brandSlogan: {
    fontSize: 7.5,
    color: GRAY_TEXT,
    marginTop: 2,
    marginBottom: 16,
    letterSpacing: 0.5,
  },

  headerRow: { flexDirection: "row", justifyContent: "space-between" },
  addressBlock: {},
  addressLine: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    marginBottom: 3,
  },
  addressLineReg: { fontSize: 8.5, color: GRAY_TEXT, marginBottom: 3 },

  metaBlock: { alignItems: "flex-start" },
  metaDate: { fontSize: 8.5, color: DARK, marginBottom: 10 },
  metaNo: { fontSize: 8.5, color: DARK, marginBottom: 14 },
  toLabel: {
    fontSize: 7.5,
    color: GRAY_TEXT,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  toName: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    marginBottom: 6,
  },
  toLine: { fontSize: 8.5, color: GRAY_TEXT, marginBottom: 2 },

  // ---------- DOCUMENT title with accent bar ----------
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 30,
    marginBottom: 30,
  },
  accentBar: { width: 6, height: 48, backgroundColor: DARK, marginRight: 18 },
  documentTitle: {
    fontSize: 38,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  // ---------- Table ----------
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1.5,
    borderBottomColor: LINE,
    paddingBottom: 8,
  },
  thQty: {
    width: "10%",
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: DARK,
  },
  thDesc: {
    width: "42%",
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: DARK,
  },
  thPrice: {
    width: "23%",
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: DARK,
  },
  thTotal: {
    width: "25%",
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: DARK,
  },

  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: LIGHT_LINE,
  },
  tdQty: {
    width: "10%",
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: DARK,
  },
  tdDesc: {
    width: "42%",
    paddingRight: 10,
    fontSize: 8.5,
    color: GRAY_TEXT,
    lineHeight: 1.4,
  },
  tdPrice: {
    width: "23%",
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: DARK,
  },
  tdTotal: {
    width: "25%",
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: DARK,
  },

  // ---------- Totals ----------
  totalsSection: { alignItems: "flex-end", marginTop: 18 },
  totalsLabelsRow: { flexDirection: "row" },
  totalsLabelBlock: { width: 90, marginRight: 20 },
  totalsLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    marginBottom: 3,
  },
  totalsValue: { fontSize: 9, fontFamily: "Helvetica-Bold", color: DARK },

  totalsDivider: {
    borderTopWidth: 1,
    borderTopColor: LINE,
    width: 200,
    marginTop: 10,
    marginBottom: 10,
  },
  grandTotal: { fontSize: 13, fontFamily: "Helvetica-Bold", color: DARK },

  // ---------- Payment options ----------
  paymentSection: { marginTop: 40 },
  paymentLabel: {
    fontSize: 7.5,
    color: GRAY_TEXT,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  bankDetails: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    marginBottom: 3,
  },
  bankAccount: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: DARK },

  dividerThick: {
    borderTopWidth: 2.5,
    borderTopColor: DARK,
    marginTop: 18,
    marginBottom: 18,
  },

  // ---------- Terms ----------
  termsLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    marginBottom: 10,
  },
  termsText: { fontSize: 8, color: GRAY_TEXT, lineHeight: 1.6 },
});

const DiamondIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24">
    <Path
      d="M6 4 L18 4 L22 9 L12 21 L2 9 Z M2 9 L22 9 M6 4 L9 9 L12 21 M18 4 L15 9 L12 21"
      stroke={PINK}
      strokeWidth={1}
      fill="none"
    />
  </Svg>
);

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
    total,
    currency,
    bankDetails,
    terms,
  } = data;

  const fmt = (n: number) =>
    `${currency.symbol}${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ---- Brand header ---- */}
        <DiamondIcon />
        <Text style={styles.brandName}>{company.name}</Text>
        {company.slogan && <Text style={styles.brandSlogan}>{company.slogan}</Text>}

        <View style={styles.headerRow}>
          <View style={styles.addressBlock}>
            {company.address && (
              <Text style={styles.addressLine}>{company.address}</Text>
            )}
            {company.phone && (
              <Text style={styles.addressLine}>P: {company.phone}</Text>
            )}
            {company.website && (
              <Text style={styles.addressLineReg}>{company.website}</Text>
            )}
          </View>

          <View style={styles.metaBlock}>
            <Text style={styles.metaDate}>{date}</Text>
            <Text style={styles.metaNo}>NO# {number}</Text>
            <Text style={styles.toLabel}>TO:</Text>
            <Text style={styles.toName}>{customer.name}</Text>
            {customer.address && <Text style={styles.toLine}>{customer.address}</Text>}
            {customer.phone && <Text style={styles.toLine}>{customer.phone}</Text>}
            {customer.email && <Text style={styles.toLine}>{customer.email}</Text>}
            {customer.website && <Text style={styles.toLine}>{customer.website}</Text>}
          </View>
        </View>

        {/* ---- DOCUMENT title ---- */}
        <View style={styles.titleRow}>
          <View style={styles.accentBar} />
          <Text style={styles.documentTitle}>{type}</Text>
        </View>

        {/* ---- Table ---- */}
        <View style={styles.tableHeader}>
          <Text style={styles.thQty}>QTY</Text>
          <Text style={styles.thDesc}>ITEMS DESCRIPTION</Text>
          <Text style={styles.thPrice}>PRICE</Text>
          <Text style={styles.thTotal}>TOTAL</Text>
        </View>

        {items.map((item: any, idx: number) => (
          <View key={idx} style={styles.tableRow}>
            <Text style={styles.tdQty}>{item.quantity}</Text>
            <View style={styles.tdDesc}>
              <Text style={{ fontFamily: "Helvetica-Bold", color: DARK }}>{item.name}</Text>
              {item.description && <Text>{item.description}</Text>}
            </View>
            <Text style={styles.tdPrice}>{fmt(item.unitPrice)}</Text>
            <Text style={styles.tdTotal}>{fmt(item.total)}</Text>
          </View>
        ))}

        {/* ---- Totals ---- */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsLabelsRow}>
            <View style={styles.totalsLabelBlock}>
              <Text style={styles.totalsLabel}>SUBTOTAL</Text>
              <Text style={styles.totalsValue}>{fmt(subtotal)}</Text>
            </View>
            {tax > 0 && (
              <View style={styles.totalsLabelBlock}>
                <Text style={styles.totalsLabel}>TAX</Text>
                <Text style={styles.totalsValue}>{fmt(tax)}</Text>
              </View>
            )}
          </View>
          <View style={styles.totalsDivider} />
          <Text style={styles.grandTotal}>{fmt(total)}</Text>
        </View>

        {/* ---- Payment options ---- */}
        {bankDetails && (
          <View style={styles.paymentSection}>
            <Text style={styles.paymentLabel}>PAYMENT OPTIONS</Text>
            <Text style={styles.bankDetails}>BANK DETAILS</Text>
            {bankDetails.accountNo && (
              <Text style={styles.bankAccount}>ACCOUNT NO: {bankDetails.accountNo}</Text>
            )}
            {bankDetails.sortCode && (
              <Text style={styles.bankAccount}>SORT CODE: {bankDetails.sortCode}</Text>
            )}
          </View>
        )}

        <View style={styles.dividerThick} />

        {/* ---- Terms ---- */}
        {terms && (
          <>
            <Text style={styles.termsLabel}>TERMS & CONDITIONS</Text>
            <Text style={styles.termsText}>{terms}</Text>
          </>
        )}
      </Page>
    </Document>
  );
};

export default TemplateTwo;
