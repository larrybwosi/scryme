import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Svg,
  Path,
} from "@react-pdf/renderer";
import React from "react";
import { V3DocumentData } from "../types";

// ---- Colors pulled from the reference invoice ----
const DARK_NAVY = "#262B38";
const YELLOW = "#F5C518";
const DARK = "#222222";
const GRAY_TEXT = "#7A7A7A";
const LIGHT_BG = "#F2F2F2";
const ROW_LINE = "#E5E5E5";

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 45,
    fontSize: 9,
    color: DARK,
    fontFamily: "Helvetica",
  },

  // ---------- Header ----------
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  brandRow: { flexDirection: "row", alignItems: "center" },
  brandTextBlock: { marginLeft: 10 },
  brandName: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
  },
  brandSlogan: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Oblique",
    color: GRAY_TEXT,
    marginTop: 1,
  },
  documentTitle: {
    fontSize: 26,
    fontFamily: "Helvetica",
    letterSpacing: 2,
    textTransform: "uppercase",
  },

  // ---------- To ----------
  toSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  toLeft: {},
  toBadge: {
    backgroundColor: LIGHT_BG,
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  toBadgeText: { fontSize: 8, color: GRAY_TEXT },
  toName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  toAddr: { fontSize: 8.5, color: GRAY_TEXT, lineHeight: 1.5 },

  toRight: { alignItems: "flex-end" },
  metaLine: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    marginBottom: 4,
  },

  // ---------- Table ----------
  tableHeader: {
    flexDirection: "row",
    backgroundColor: DARK_NAVY,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  thDesc: {
    width: "46%",
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  thQty: {
    width: "16%",
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  thPrice: {
    width: "19%",
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  thTotal: {
    width: "19%",
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    textAlign: "right",
  },

  tableRow: {
    flexDirection: "row",
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: ROW_LINE,
  },
  tdDesc: { width: "46%", fontSize: 8.5, color: DARK },
  tdQty: { width: "16%", fontSize: 8.5, color: DARK, textAlign: "center" },
  tdPrice: { width: "19%", fontSize: 8.5, color: DARK, textAlign: "center" },
  tdTotal: {
    width: "19%",
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    textAlign: "right",
  },

  // ---------- Totals ----------
  totalsSection: { alignItems: "flex-end", marginTop: 14 },
  totalsRow: {
    flexDirection: "row",
    marginBottom: 4,
    width: 160,
    justifyContent: "space-between",
  },
  totalsLabel: { fontSize: 8.5, color: GRAY_TEXT },
  totalsValue: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: DARK },

  // ---------- Payment / Grand total band ----------
  bottomBand: {
    flexDirection: "row",
    marginTop: 22,
  },
  paymentBlock: {
    backgroundColor: YELLOW,
    width: "55%",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  paymentLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  paymentRow: { flexDirection: "row", marginBottom: 4 },
  paymentKey: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    width: 70,
  },
  paymentVal: { fontSize: 8, color: DARK },
  thankYou: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    marginTop: 8,
  },

  grandTotalBlock: {
    backgroundColor: DARK_NAVY,
    width: "45%",
    alignItems: "center",
    justifyContent: "center",
  },
  grandTotalLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  grandTotalValue: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: YELLOW,
  },

  // ---------- Signature ----------
  signatureArea: { alignItems: "flex-end", marginTop: 24 },
  signatureScript: {
    fontSize: 18,
    fontFamily: "Helvetica-Oblique",
  },
  signatureName: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    marginTop: 4,
  },
  signatureTitle: { fontSize: 7.5, color: GRAY_TEXT, marginTop: 1 },

  // ---------- Terms ----------
  termsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: ROW_LINE,
  },
  termsLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    width: 50,
  },
  termsText: { fontSize: 7, color: GRAY_TEXT, width: 280, lineHeight: 1.5 },
  termsAddr: { fontSize: 7.5, color: GRAY_TEXT },
});

const ZigzagLogo = () => (
  <Svg width={34} height={22} viewBox="0 0 34 22">
    <Path
      d="M0 6 L6 1 L12 6 L18 1 L24 6 L30 1 L34 4"
      stroke={DARK}
      strokeWidth={2}
      fill="none"
    />
    <Path
      d="M0 12 L6 7 L12 12 L18 7 L24 12 L30 7 L34 10"
      stroke={DARK}
      strokeWidth={2}
      fill="none"
    />
    <Path
      d="M0 18 L6 13 L12 18 L18 13 L24 18 L30 13 L34 16"
      stroke={DARK}
      strokeWidth={2}
      fill="none"
    />
  </Svg>
);

export const TemplateFour = ({ data, qrCode }: { data: V3DocumentData; qrCode?: string }) => {
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
    paymentMethod,
    bankDetails,
    terms,
    signature,
    primaryColor,
    secondaryColor,
    kraPin,
    kraControlCode,
    kraReceiptNumber,
  } = data;

  const activeColor = primaryColor || DARK_NAVY;
  const activeSecondaryColor = secondaryColor || DARK;

  const fmt = (n: number) => `${currency.symbol}${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ---- Header ---- */}
        <View style={styles.headerRow}>
          <View style={styles.brandRow}>
            {company.logo && (
              <Image src={company.logo} style={{ width: 60, height: 60, objectFit: 'contain', marginRight: 10 }} />
            )}
            <View style={styles.brandTextBlock}>
              <Text style={[styles.brandName, { color: activeSecondaryColor }]}>{company.name}</Text>
              {company.slogan && <Text style={styles.brandSlogan}>{company.slogan}</Text>}
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.documentTitle, { color: activeSecondaryColor }]}>{type}</Text>
            {qrCode && <Image src={qrCode} style={{ width: 40, height: 40, marginTop: 5 }} />}
          </View>
        </View>

        {/* ---- To / meta ---- */}
        <View style={styles.toSection}>
          <View style={styles.toLeft}>
            <View style={styles.toBadge}>
              <Text style={styles.toBadgeText}>
                {type === "invoice" ? "Invoice to:" : "Receipt to:"}
              </Text>
            </View>
            <Text style={[styles.toName, { color: activeSecondaryColor }]}>{customer.name}</Text>
            <Text style={styles.toAddr}>
              {customer.address}
              {customer.phone ? `\n${customer.phone}` : ""}
              {customer.email ? `\n${customer.email}` : ""}
            </Text>
            {(kraPin || kraControlCode || kraReceiptNumber) && (
              <View style={{ marginTop: 10 }}>
                {kraPin && <Text style={{ fontSize: 7, color: GRAY_TEXT }}>KRA PIN: {kraPin}</Text>}
                {kraControlCode && <Text style={{ fontSize: 7, color: GRAY_TEXT }}>KRA Control Code: {kraControlCode}</Text>}
                {kraReceiptNumber && <Text style={{ fontSize: 7, color: GRAY_TEXT }}>KRA Receipt No: {kraReceiptNumber}</Text>}
              </View>
            )}
          </View>
          <View style={styles.toRight}>
            <Text style={styles.metaLine}>
              {type === "invoice" ? "Invoice #" : "Receipt #"} {number}
            </Text>
            <Text style={styles.metaLine}>
              Date {date}
            </Text>
          </View>
        </View>

        {/* ---- Table ---- */}
        <View style={[styles.tableHeader, { backgroundColor: activeColor }]}>
          <Text style={styles.thDesc}>ITEM DESCRIPTION</Text>
          <Text style={styles.thQty}>QTY</Text>
          <Text style={styles.thPrice}>PRICE</Text>
          <Text style={styles.thTotal}>TOTAL</Text>
        </View>

        {items.map((item, idx) => (
          <View key={idx} style={styles.tableRow}>
            <View style={styles.tdDesc}>
               <Text style={{ fontFamily: "Helvetica-Bold" }}>{item.name}</Text>
               {item.description && <Text style={{ fontSize: 7, color: GRAY_TEXT }}>{item.description}</Text>}
            </View>
            <Text style={styles.tdQty}>{String(item.quantity)}</Text>
            <Text style={styles.tdPrice}>{fmt(item.unitPrice)}</Text>
            <Text style={styles.tdTotal}>{fmt(item.total)}</Text>
          </View>
        ))}

        {/* ---- Totals ---- */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>SUB TOTAL</Text>
            <Text style={styles.totalsValue}>{fmt(subtotal)}</Text>
          </View>
          {tax > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>TAX {taxRate ? `(${taxRate}%)` : ""}</Text>
              <Text style={styles.totalsValue}>{fmt(tax)}</Text>
            </View>
          )}
        </View>

        {/* ---- Payment / grand total band ---- */}
        <View style={styles.bottomBand}>
          <View style={styles.paymentBlock}>
            <Text style={styles.paymentLabel}>PAYMENT METHOD</Text>
            {paymentMethod && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentKey}>{paymentMethod}</Text>
              </View>
            )}
            {bankDetails && (
              <>
                <Text style={[styles.paymentKey, { marginTop: 4 }]}>Bank account</Text>
                <Text style={styles.paymentVal}>{bankDetails.accountNo}</Text>
              </>
            )}
            <Text style={styles.thankYou}>Thank you for business with us!</Text>
          </View>
          <View style={[styles.grandTotalBlock, { backgroundColor: activeColor }]}>
            <Text style={styles.grandTotalLabel}>GRAND TOTAL</Text>
            <Text style={styles.grandTotalValue}>{fmt(total)}</Text>
          </View>
        </View>

        {/* ---- Signature ---- */}
        {signature && signature.name && (
          <View style={styles.signatureArea}>
            {signature.image && <Image src={signature.image} style={{ width: 100, height: 40, marginBottom: 5 }} />}
            <Text style={[styles.signatureScript, { color: activeSecondaryColor }]}>{signature.name}</Text>
            <Text style={[styles.signatureName, { color: activeSecondaryColor }]}>{signature.name.toUpperCase()}</Text>
            <Text style={styles.signatureTitle}>{signature.title}</Text>
          </View>
        )}

        {/* ---- Terms ---- */}
        <View style={styles.termsRow}>
          <Text style={styles.termsLabel}>TERMS:</Text>
          <Text style={styles.termsText}>{terms}</Text>
          <Text style={styles.termsAddr}>{company.address}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default TemplateFour;
