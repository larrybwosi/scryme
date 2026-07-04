import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import React from "react";
import { V3DocumentData } from "../types";

// ---- Colors pulled from the reference invoice ----
const TEAL = "#1AB8C4";
const DARK = "#3A3A3A";
const GRAY_TEXT = "#6B6B6B";
const LIGHT_ROW = "#F4F6F7";

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 80, // Increased to account for fixed footer
    paddingHorizontal: 50,
    fontSize: 9,
    color: DARK,
    fontFamily: "Helvetica",
  },

  // ---------- Header ----------
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 30,
  },
  logoBlock: { flexDirection: "row", alignItems: "center" },
  logoText: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  companyInfo: {
    textAlign: "right",
    fontSize: 8,
    color: GRAY_TEXT,
    lineHeight: 1.5,
  },

  // ---------- Title / Invoice-to section ----------
  topSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  toLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    marginBottom: 8,
  },
  toText: { fontSize: 8, color: GRAY_TEXT, lineHeight: 1.6 },
  website: { fontSize: 8, color: TEAL, marginTop: 4 },

  documentTitle: {
    fontSize: 34,
    fontFamily: "Helvetica-Bold",
    color: "#BDBDBD",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  // meta row under INVOICE title (Total due / Date / No.)
  metaRow: { flexDirection: "row", marginTop: 14 },
  metaBlock: { marginLeft: 28 },
  metaBlockFirst: { marginLeft: 0 },
  metaLabel: { fontSize: 7.5, color: GRAY_TEXT, marginBottom: 4 },
  metaValue: { fontSize: 10, fontFamily: "Helvetica-Bold" },
  metaValueTeal: { fontSize: 10, fontFamily: "Helvetica-Bold", color: TEAL },

  // ---------- Table ----------
  tableHeader: {
    flexDirection: "row",
    backgroundColor: TEAL,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableHeaderText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E8E8E8",
  },
  colDesc: { width: "46%" },
  colQty: { width: "16%", textAlign: "center" },
  colUnit: { width: "19%", textAlign: "center" },
  colTotal: { width: "19%", textAlign: "right" },

  itemTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    marginBottom: 2,
  },
  itemSub: { fontSize: 7.5, color: "#9A9A9A" },
  cellText: { fontSize: 9, color: DARK },
  cellTotal: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    textAlign: "right",
  },

  // ---------- Terms / Totals ----------
  bottomSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 22,
  },
  termsBlock: { width: "45%" },
  termsLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    marginBottom: 10,
  },

  paymentLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    marginBottom: 6,
    marginTop: 18,
  },
  paymentText: { fontSize: 8, color: GRAY_TEXT, lineHeight: 1.6 },

  totalsBlock: { width: "45%" },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  totalsLabel: { fontSize: 9, color: DARK },
  totalsValue: { fontSize: 9, fontFamily: "Helvetica-Bold", color: DARK },
  discountLabel: { fontSize: 9, color: TEAL },
  discountValue: { fontSize: 9, fontFamily: "Helvetica-Bold", color: TEAL },

  totalDueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: TEAL,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  totalDueLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
  },
  totalDueValue: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
  },

  // ---------- Signature ----------
  signatureBlock: { alignItems: "flex-end", marginTop: 30 },
  signatureName: {
    fontSize: 10,
    fontFamily: "Helvetica-Oblique",
    color: DARK,
    marginBottom: 2,
  },
  signatureTitle: { fontSize: 8, color: GRAY_TEXT },

  // ---------- Thank you ----------
  thankYou: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    marginTop: 28,
  },

  // ---------- Footer ----------
  footer: {
    backgroundColor: "#8C8C8C",
    paddingHorizontal: 50,
    paddingVertical: 18,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  footerTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    marginBottom: 5,
  },
  footerText: { fontSize: 7.5, color: "#E0E0E0", lineHeight: 1.5, width: 360 },
  footerSite: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#FFFFFF" },
});

export const TemplateOne = ({ data, qrCode }: { data: V3DocumentData; qrCode?: string }) => {
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
    discount,
    discountRate,
    total,
    currency,
    paymentTerms,
    paymentInfo,
    terms,
    footerText,
    footerWebsite,
    signature,
    primaryColor,
    secondaryColor,
    kraPin,
    kraControlCode,
    kraReceiptNumber,
  } = data;

  const activeColor = primaryColor || TEAL;
  const activeSecondaryColor = secondaryColor || DARK;

  const fmt = (n: number) =>
    `${currency.symbol} ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header: logo + company info */}
        <View style={styles.headerRow}>
          <View style={styles.logoBlock}>
            {company.logo && (
              <Image src={company.logo} style={{ width: 60, height: 60, marginRight: 12, objectFit: 'contain' }} />
            )}
            <View>
              <Text style={[styles.logoText, { color: activeSecondaryColor }]}>{company.name}</Text>
              {company.slogan && <Text style={{ fontSize: 8, color: GRAY_TEXT, marginTop: 2 }}>{company.slogan}</Text>}
            </View>
          </View>
          <View style={styles.companyInfo}>
            {company.address && <Text>{company.address}</Text>}
            <Text>
              {company.phone && `Phone: ${company.phone}`}
              {company.phone && company.email && "  "}
              {company.email && `E-mail: ${company.email}`}
            </Text>
          </View>
        </View>

        {/* To / Title + meta */}
        <View style={styles.topSection}>
          <View>
            <Text style={styles.toLabel}>
              {type === "invoice" ? "Invoice to:" : "Receipt to:"}
            </Text>
            <View style={styles.toText}>
              <Text style={{ fontFamily: "Helvetica-Bold", color: activeSecondaryColor }}>{customer.name}</Text>
              {customer.address && <Text>{customer.address}</Text>}
              {customer.phone && <Text>{customer.phone}</Text>}
              {customer.email && <Text>{customer.email}</Text>}
            </View>
            {customer.website && (
              <Text style={[styles.website, { color: activeColor }]}>{customer.website}</Text>
            )}
            {kraPin && (
              <View style={{ marginTop: 8 }}>
                <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold" }}>KRA PIN: {kraPin}</Text>
              </View>
            )}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.documentTitle}>{type}</Text>
          </View>
        </View>

        {/* Meta row: Total Due / Date / No */}
        <View style={[styles.metaRow, { justifyContent: "flex-end" }]}>
          <View style={styles.metaBlockFirst}>
            <Text style={styles.metaLabel}>Total Due:</Text>
            <Text style={[styles.metaValueTeal, { color: activeColor }]}>{fmt(total)}</Text>
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>
              {type === "invoice" ? "Invoice Date:" : "Receipt Date:"}
            </Text>
            <Text style={[styles.metaValue, { color: activeSecondaryColor }]}>{date}</Text>
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>
              {type === "invoice" ? "Invoice No:" : "Receipt No:"}
            </Text>
            <Text style={[styles.metaValue, { color: activeSecondaryColor }]}>{number}</Text>
          </View>
        </View>

        {/* Table header */}
        <View style={[styles.tableHeader, { marginTop: 25, backgroundColor: activeColor }]}>
          <Text style={[styles.tableHeaderText, styles.colDesc]}>
            ITEM DESCRIPTION
          </Text>
          <Text style={[styles.tableHeaderText, styles.colQty]}>QUANTITY</Text>
          <Text style={[styles.tableHeaderText, styles.colUnit]}>
            UNIT PRICE
          </Text>
          <Text style={[styles.tableHeaderText, styles.colTotal]}>TOTAL</Text>
        </View>

        {/* Table rows */}
        {items.map((item, idx) => (
          <View
            key={idx}
            style={[
              styles.tableRow,
              idx % 2 === 1 ? { backgroundColor: LIGHT_ROW } : {},
            ]}
          >
            <View style={styles.colDesc}>
              <Text style={styles.itemTitle}>{item.name}</Text>
              {item.description && (
                <Text style={styles.itemSub}>{item.description}</Text>
              )}
            </View>
            <Text style={[styles.cellText, styles.colQty]}>
              {String(item.quantity)}
            </Text>
            <Text style={[styles.cellText, styles.colUnit]}>
              {fmt(item.unitPrice)}
            </Text>
            <Text style={[styles.cellTotal, styles.colTotal]}>
              {fmt(item.total)}
            </Text>
          </View>
        ))}

        {/* Bottom section: terms+payment | totals */}
        <View style={styles.bottomSection}>
          <View style={styles.termsBlock}>
            {paymentTerms && (
              <>
                <Text style={styles.termsLabel}>Terms: {paymentTerms}</Text>
              </>
            )}
            {paymentInfo && (
              <>
                <Text style={styles.paymentLabel}>Payment Information</Text>
                <Text style={styles.paymentText}>{paymentInfo}</Text>
              </>
            )}
          </View>
          <View style={styles.totalsBlock}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>{fmt(subtotal)}</Text>
            </View>
            {tax > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>
                  Tax {taxRate ? `(${taxRate}%)` : ""}
                </Text>
                <Text style={styles.totalsValue}>{fmt(tax)}</Text>
              </View>
            )}
            {discount !== undefined && discount > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.discountLabel}>
                  Discount {discountRate ? `(${discountRate}%)` : ""}
                </Text>
                <Text style={styles.discountValue}>-{fmt(discount)}</Text>
              </View>
            )}
            <View style={[styles.totalDueRow, { backgroundColor: activeColor }]}>
              <Text style={styles.totalDueLabel}>Total Due:</Text>
              <Text style={styles.totalDueValue}>{fmt(total)}</Text>
            </View>
          </View>
        </View>

        {/* Compliance and QR Section */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
          <View style={{ width: '60%' }}>
            {kraControlCode && (
              <Text style={{ fontSize: 8, color: GRAY_TEXT }}>KRA Control Code: {kraControlCode}</Text>
            )}
            {kraReceiptNumber && (
              <Text style={{ fontSize: 8, color: GRAY_TEXT }}>KRA Receipt Number: {kraReceiptNumber}</Text>
            )}

            {/* Signature */}
            {signature && (
              <View style={[styles.signatureBlock, { alignItems: 'flex-start', marginTop: 15 }]}>
                {signature.image && <Image src={signature.image} style={{ width: 100, height: 40, marginBottom: 5 }} />}
                <Text style={styles.signatureName}>{signature.name}</Text>
                <Text style={styles.signatureTitle}>{signature.title}</Text>
              </View>
            )}
          </View>

          {qrCode && (
            <View style={{ alignItems: 'flex-end' }}>
              <Image src={qrCode} style={{ width: 60, height: 60 }} />
            </View>
          )}
        </View>

        {/* Thank you */}
        <Text style={styles.thankYou}>Thank you for your business</Text>

        {/* Footer band */}
        {(terms || footerText || footerWebsite) && (
          <View style={styles.footer} fixed>
            <View>
              <Text style={styles.footerTitle}>Terms & Conditions</Text>
              <Text style={styles.footerText}>
                {terms || footerText}
              </Text>
            </View>
            {footerWebsite && (
              <Text style={styles.footerSite}>{footerWebsite}</Text>
            )}
          </View>
        )}
      </Page>
    </Document>
  );
};

export default TemplateOne;
