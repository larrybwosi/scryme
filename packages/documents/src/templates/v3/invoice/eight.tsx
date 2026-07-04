import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import React from "react";
import { V3DocumentData } from "../types";

// ---- Dark Corporate Palette pulled from the reference design ----
const DARK_BG = "#2B2A29";
const LIGHT_BG = "#FFFFFF";
const ROW_BG_ALT = "#F3F4F8";
const TEXT_DARK = "#1E1E1E";
const TEXT_LIGHT = "#FFFFFF";
const TEXT_MUTED = "#A0A0A0";

const styles = StyleSheet.create({
  page: {
    padding: 0, // No default padding to allow bleeding block sections
    fontSize: 9,
    color: TEXT_DARK,
    fontFamily: "Helvetica",
    backgroundColor: LIGHT_BG,
  },

  // ==================== UPPER BLOCK (Dark Header Matrix) ====================
  upperBlock: {
    backgroundColor: DARK_BG,
    color: TEXT_LIGHT,
    paddingHorizontal: 40,
    paddingTop: 40,
    paddingBottom: 25,
  },
  topBrandRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#403F3E",
    paddingBottom: 20,
    alignItems: "center",
  },
  brandLeft: {
    width: "35%",
    borderRightWidth: 1,
    borderRightColor: "#403F3E",
    paddingRight: 15,
  },
  companyName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  companySlogan: {
    fontSize: 8,
    color: TEXT_MUTED,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  brandRight: {
    width: "65%",
    paddingLeft: 25,
  },
  hugeTitle: {
    fontSize: 34,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 12,
    textTransform: "uppercase",
  },

  // Lower Header Row (Client vs Meta Info)
  metaDetailsRow: {
    flexDirection: "row",
    marginTop: 20,
  },
  clientMetaDataBlock: {
    width: "50%",
    borderRightWidth: 1,
    borderRightColor: "#403F3E",
    paddingRight: 15,
  },
  metaLabelInline: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: TEXT_MUTED,
    marginBottom: 6,
  },
  clientName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: TEXT_LIGHT,
    marginBottom: 2,
  },
  clientTitle: {
    fontSize: 8.5,
    color: TEXT_MUTED,
    marginBottom: 8,
  },
  clientAddressText: {
    fontSize: 8.5,
    color: TEXT_MUTED,
    lineHeight: 1.3,
  },
  invoiceMetaDataBlock: {
    width: "50%",
    paddingLeft: 25,
    justifyContent: "flex-start",
  },
  metaNumberLabel: {
    fontSize: 9,
    color: TEXT_MUTED,
  },
  metaNumberValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: TEXT_LIGHT,
    marginBottom: 10,
    marginTop: 2,
  },
  kvRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  kvKey: {
    width: 80,
    fontSize: 8.5,
    color: TEXT_MUTED,
  },
  kvValue: {
    fontSize: 8.5,
    color: TEXT_LIGHT,
  },

  // ==================== LOWER BLOCK (White Content Canvas) ====================
  lowerCanvas: {
    paddingHorizontal: 40,
    paddingTop: 30,
    flexDirection: "column",
  },

  // Grid/Table Styles
  tableHeader: {
    flexDirection: "row",
    backgroundColor: DARK_BG,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tableHeaderCell: {
    color: TEXT_LIGHT,
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    alignItems: "center",
  },
  tableCell: {
    fontSize: 9,
    color: TEXT_DARK,
  },

  // Precise Width Percentages
  colItemQuality: { width: "45%" },
  colUnitPrice: { width: "20%", textAlign: "right" },
  colQuantity: { width: "15%", textAlign: "center" },
  colTotal: { width: "20%", textAlign: "right" },

  itemName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: 8,
    color: "#666666",
  },

  // Full Width Subtotal Bar
  subtotalRowContainer: {
    flexDirection: "row",
    backgroundColor: DARK_BG,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 15,
    justifyContent: "space-between",
  },
  subtotalLabel: {
    color: TEXT_LIGHT,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    textTransform: "uppercase",
  },
  subtotalValue: {
    color: TEXT_LIGHT,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },

  // Bottom Content Blocks (Payment Info + Signature)
  bottomFlexLayout: {
    flexDirection: "row",
    marginTop: 35,
    justifyContent: "space-between",
  },
  termsAndPaymentPane: {
    width: "50%",
    backgroundColor: DARK_BG,
    color: TEXT_LIGHT,
    padding: 15,
  },
  paneTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
    color: TEXT_LIGHT,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  paneText: {
    fontSize: 8,
    color: TEXT_MUTED,
    lineHeight: 1.4,
    marginBottom: 10,
  },
  signaturePane: {
    width: "45%",
    backgroundColor: DARK_BG,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  signatureGraphicPlaceholder: {
    width: "70%",
    height: 30,
    borderBottomWidth: 1,
    borderBottomColor: "#FFFFFF",
    marginBottom: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  signatureLineText: {
    fontFamily: "Helvetica-Oblique",
    fontSize: 15,
    color: TEXT_LIGHT,
  },
  signatureLabelText: {
    fontSize: 8.5,
    color: TEXT_MUTED,
    textTransform: "uppercase",
  },
});

export const TemplateEight = ({ data, qrCode }: { data: V3DocumentData; qrCode?: string }) => {
  const {
    type,
    number,
    date,
    company,
    customer,
    items,
    subtotal,
    total,
    currency,
    paymentInfo,
    terms,
    primaryColor,
    kraPin,
    kraControlCode,
    kraReceiptNumber,
    signature,
  } = data;

  const activeColor = primaryColor || DARK_BG;

  const fmt = (n: number) =>
    `${currency.symbol}${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ==================== UPPER DARK MATRIX HEADER ==================== */}
        <View style={[styles.upperBlock, { backgroundColor: activeColor }]}>
          <View style={styles.topBrandRow}>
            <View style={styles.brandLeft}>
              {company.logo && (
                <Image src={company.logo} style={{ width: 100, height: 50, marginBottom: 10, objectFit: 'contain' }} />
              )}
              <Text style={styles.companyName}>{company.name}</Text>
              {company.slogan && <Text style={styles.companySlogan}>{company.slogan}</Text>}
            </View>
            <View style={styles.brandRight}>
              <Text style={styles.hugeTitle}>
                {type ? type.toUpperCase() : "INVOICE"}
              </Text>
            </View>
          </View>

          <View style={styles.metaDetailsRow}>
            {/* Client Recipient Details */}
            <View style={styles.clientMetaDataBlock}>
              <Text style={styles.metaLabelInline}>To</Text>
              <Text style={styles.clientName}>{customer.name}</Text>
              <Text style={styles.clientTitle}>Director</Text>
              <Text style={styles.clientAddressText}>
                {customer.address ||
                  "1234 Street Address Number #00\nCity, State"}
              </Text>
              <Text style={[styles.clientAddressText, { marginTop: 4 }]}>
                {customer.email ? `W  ${customer.email}` : ""}
                {customer.phone ? `  |  P  ${customer.phone}` : ""}
              </Text>
            </View>

            {/* Document Registry Metadata */}
            <View style={styles.invoiceMetaDataBlock}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View>
                  <Text style={styles.metaNumberLabel}>{type === 'invoice' ? 'Invoice' : 'Receipt'} No.</Text>
                  <Text style={styles.metaNumberValue}>#{number}</Text>
                </View>
                {qrCode && (
                  <Image src={qrCode} style={{ width: 40, height: 40 }} />
                )}
              </View>

              <View style={styles.kvRow}>
                <Text style={styles.kvKey}>Date</Text>
                <Text style={styles.kvValue}>: {date}</Text>
              </View>
              {(kraPin || kraControlCode || kraReceiptNumber) && (
                <View style={{ marginTop: 5 }}>
                  {kraPin && (
                    <View style={styles.kvRow}>
                      <Text style={styles.kvKey}>KRA PIN</Text>
                      <Text style={styles.kvValue}>: {kraPin}</Text>
                    </View>
                  )}
                  {kraControlCode && (
                    <View style={styles.kvRow}>
                      <Text style={styles.kvKey}>Ctrl Code</Text>
                      <Text style={styles.kvValue}>: {kraControlCode}</Text>
                    </View>
                  )}
                  {kraReceiptNumber && (
                    <View style={styles.kvRow}>
                      <Text style={styles.kvKey}>Receipt No</Text>
                      <Text style={styles.kvValue}>: {kraReceiptNumber}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ==================== LOWER WHITE CANVAS CONTENT ==================== */}
        <View style={styles.lowerCanvas}>
          {/* Table Header Row */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colItemQuality]}>
              Item Quality
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colUnitPrice]}>
              Unite Price
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colQuantity]}>
              Quantity
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
          </View>

          {/* Table Rows Array Loop */}
          {items.map((item, idx) => (
            <View
              key={idx}
              style={[
                styles.tableRow,
                idx % 2 === 1 ? { backgroundColor: ROW_BG_ALT } : {},
              ]}
            >
              <View style={[styles.tableCell, styles.colItemQuality]}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.description && (
                  <Text style={styles.itemDescription}>{item.description}</Text>
                )}
              </View>
              <Text style={[styles.tableCell, styles.colUnitPrice]}>
                {fmt(item.unitPrice)}
              </Text>
              <Text style={[styles.tableCell, styles.colQuantity]}>
                {String(item.quantity).padStart(2, "0")}
              </Text>
              <Text
                style={[
                  styles.tableCell,
                  styles.colTotal,
                  { fontFamily: "Helvetica-Bold" },
                ]}
              >
                {fmt(item.total)}
              </Text>
            </View>
          ))}

          {/* Unified Sub Total Ribbon Section */}
          <View style={[styles.subtotalRowContainer, { backgroundColor: activeColor }]}>
            <Text style={styles.subtotalLabel}>Sub Total</Text>
            <Text style={styles.subtotalValue}>{fmt(subtotal || total)}</Text>
          </View>

          {/* Bottom Grid Layout (Info Panel + Signature Block) */}
          <View style={styles.bottomFlexLayout}>
            <View style={[styles.termsAndPaymentPane, { backgroundColor: activeColor }]}>
              <Text style={styles.paneTitle}>Payment Method :</Text>
              <Text style={styles.paneText}>
                {paymentInfo || "Method 1 > Method 2 > Method 3"}
              </Text>

              <Text style={styles.paneTitle}>Terms and Conditions</Text>
              <Text style={styles.paneText}>
                {terms ||
                  "Lorem ipsum dolor sed diam nonummy aliquam erat volutpat veniam."}
              </Text>
            </View>

            <View style={[styles.signaturePane, { backgroundColor: activeColor }]}>
              {signature ? (
                <>
                  {signature.image && <Image src={signature.image} style={{ width: 100, height: 40, marginBottom: 5 }} />}
                  <View style={styles.signatureGraphicPlaceholder}>
                    <Text style={styles.signatureLineText}>{signature.name}</Text>
                  </View>
                  <Text style={styles.signatureLabelText}>{signature.title}</Text>
                </>
              ) : (
                <>
                  <View style={styles.signatureGraphicPlaceholder}>
                    <Text style={styles.signatureLineText}>Company Signature</Text>
                  </View>
                  <Text style={styles.signatureLabelText}>Company signature</Text>
                </>
              )}
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default TemplateEight;
