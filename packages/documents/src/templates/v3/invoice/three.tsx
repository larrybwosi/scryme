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
const DARK = "#2B2B2B";
const GRAY_TEXT = "#5A5A5A";
const HEADER_BG = "#E2E4E5";
const ROW_ALT = "#EBEDEE";
const SUBTOTAL_BG = "#DCDEDF";

const styles = StyleSheet.create({
  page: {
    paddingTop: 0,
    paddingBottom: 40,
    paddingHorizontal: 0,
    fontSize: 9,
    color: DARK,
    fontFamily: "Helvetica",
  },

  // ---------- Top gray band ----------
  topBand: {
    backgroundColor: HEADER_BG,
    paddingTop: 35,
    paddingBottom: 30,
    paddingHorizontal: 45,
  },
  dateText: { fontSize: 8.5, color: GRAY_TEXT, marginBottom: 6 },
  documentTitle: {
    fontSize: 32,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    letterSpacing: 1,
    marginBottom: 20,
    textTransform: "uppercase",
  },
  topRow: { flexDirection: "row", justifyContent: "space-between" },

  companyBlock: {},
  companyLabel: { fontSize: 9, color: DARK, marginBottom: 2 },
  metaTable: { marginTop: 16 },
  metaRow: { flexDirection: "row", marginBottom: 4 },
  metaKey: { fontSize: 8.5, color: GRAY_TEXT, width: 75 },
  metaColon: { fontSize: 8.5, color: GRAY_TEXT, width: 10 },
  metaVal: { fontSize: 8.5, color: DARK },

  toBlock: { alignItems: "flex-start", maxWidth: 200 },
  toLabel: { fontSize: 9, color: GRAY_TEXT, marginBottom: 4 },
  toName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    marginBottom: 8,
  },
  toAddr: { fontSize: 8.5, color: GRAY_TEXT, lineHeight: 1.5 },

  // ---------- Table ----------
  tableSection: { paddingHorizontal: 45, marginTop: 30 },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: DARK,
  },
  thRef: {
    width: "9%",
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: DARK,
  },
  thDesc: {
    width: "38%",
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: DARK,
  },
  thQty: {
    width: "13%",
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    textAlign: "center",
  },
  thUnit: {
    width: "20%",
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    textAlign: "center",
  },
  thAmount: {
    width: "20%",
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    textAlign: "right",
  },

  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    alignItems: "center",
  },
  tdRef: { width: "9%", fontSize: 9, color: DARK },
  tdDesc: { width: "38%", fontSize: 9, color: DARK },
  tdQty: { width: "13%", fontSize: 9, color: DARK, textAlign: "center" },
  tdUnit: { width: "20%", fontSize: 9, color: DARK, textAlign: "center" },
  tdAmount: { width: "20%", fontSize: 9, color: DARK, textAlign: "right" },

  refBadge: {
    backgroundColor: "#D7D9DA",
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  refBadgeText: { fontSize: 8, color: DARK },

  // ---------- Subtotal ----------
  subtotalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 14,
    paddingHorizontal: 45,
  },
  subtotalLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    marginRight: 20,
  },
  subtotalValueBox: {
    backgroundColor: SUBTOTAL_BG,
    paddingVertical: 6,
    paddingHorizontal: 18,
  },
  subtotalValue: { fontSize: 9, fontFamily: "Helvetica-Bold", color: DARK },

  // ---------- Bottom section ----------
  bottomSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 45,
    marginTop: 40,
  },
  paymentToBlock: { width: "45%" },
  paymentToLabel: { fontSize: 8.5, color: GRAY_TEXT, marginBottom: 6 },
  paymentToName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    marginBottom: 10,
  },
  paymentToAddr: { fontSize: 8.5, color: GRAY_TEXT, lineHeight: 1.5 },

  bankBlock: { width: "50%" },
  bankRow: { flexDirection: "row", marginBottom: 6 },
  bankLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    width: 70,
  },
  bankSubLabel: { fontSize: 8.5, color: GRAY_TEXT, width: 65 },
  bankColon: { fontSize: 8.5, color: GRAY_TEXT, width: 12 },
  bankVal: { fontSize: 8.5, color: DARK },

  signatureArea: { alignItems: "flex-end", marginTop: 18 },
  signatureScript: {
    fontSize: 16,
    fontFamily: "Helvetica-Oblique",
    color: DARK,
    marginBottom: 2,
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: DARK,
    width: 140,
    marginBottom: 3,
  },
  signatureLabel: {
    fontSize: 8,
    color: GRAY_TEXT,
    textAlign: "center",
    width: 140,
  },

  // ---------- Footer ----------
  footerDivider: {
    borderTopWidth: 1,
    borderTopColor: "#BFBFBF",
    marginTop: 35,
    marginHorizontal: 45,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 45,
    paddingTop: 14,
  },
  footerText: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: DARK },
});

export const TemplateThree = ({ data, qrCode }: { data: V3DocumentData; qrCode?: string }) => {
  const {
    type,
    number,
    date,
    company,
    customer,
    items,
    total,
    currency,
    bankDetails,
    footerWebsite,
    signature,
    primaryColor,
    kraPin,
    kraControlCode,
    kraReceiptNumber,
  } = data;

  const activeColor = primaryColor || DARK;

  const fmt = (n: number) => `${currency.symbol}${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ---- Top gray band ---- */}
        <View style={[styles.topBand, activeColor !== DARK ? { backgroundColor: activeColor } : {}]}>
          <Text style={[styles.dateText, activeColor !== DARK ? { color: '#FFFFFF' } : {}]}>{date}</Text>
          <Text style={[styles.documentTitle, activeColor !== DARK ? { color: '#FFFFFF' } : {}]}>{type}</Text>

          <View style={styles.topRow}>
            {/* Company block */}
            <View style={styles.companyBlock}>
              {company.logo && (
                <Image src={company.logo} style={{ width: 50, height: 50, marginBottom: 10, objectFit: 'contain' }} />
              )}
              <Text style={[styles.companyLabel, activeColor !== DARK ? { color: '#FFFFFF' } : {}]}>{company.name}</Text>
              {company.slogan && <Text style={[styles.companyLabel, activeColor !== DARK ? { color: '#FFFFFF' } : {}]}>{company.slogan}</Text>}
              <View style={styles.metaTable}>
                <View style={styles.metaRow}>
                  <Text style={[styles.metaKey, activeColor !== DARK ? { color: '#FFFFFF' } : {}]}>Date issued</Text>
                  <Text style={[styles.metaColon, activeColor !== DARK ? { color: '#FFFFFF' } : {}]}>:</Text>
                  <Text style={[styles.metaVal, activeColor !== DARK ? { color: '#FFFFFF' } : {}]}>{date}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={[styles.metaKey, activeColor !== DARK ? { color: '#FFFFFF' } : {}]}>
                    {type === "invoice" ? "Invoice No" : "Receipt No"}
                  </Text>
                  <Text style={[styles.metaColon, activeColor !== DARK ? { color: '#FFFFFF' } : {}]}>:</Text>
                  <Text style={[styles.metaVal, activeColor !== DARK ? { color: '#FFFFFF' } : {}]}>{number}</Text>
                </View>
                {(kraPin || kraControlCode || kraReceiptNumber) && (
                  <View style={{ marginTop: 10 }}>
                    {kraPin && <Text style={{ fontSize: 7, color: activeColor !== DARK ? '#FFFFFF' : GRAY_TEXT }}>KRA PIN: {kraPin}</Text>}
                    {kraControlCode && <Text style={{ fontSize: 7, color: activeColor !== DARK ? '#FFFFFF' : GRAY_TEXT }}>Control Code: {kraControlCode}</Text>}
                    {kraReceiptNumber && <Text style={{ fontSize: 7, color: activeColor !== DARK ? '#FFFFFF' : GRAY_TEXT }}>Receipt No: {kraReceiptNumber}</Text>}
                  </View>
                )}
              </View>
            </View>

            {/* To block */}
            <View style={styles.toBlock}>
              <Text style={[styles.toLabel, activeColor !== DARK ? { color: '#FFFFFF' } : {}]}>
                {type === "invoice" ? "Invoice to" : "Receipt to"}
              </Text>
              <Text style={[styles.toName, activeColor !== DARK ? { color: '#FFFFFF' } : {}]}>{customer.name}</Text>
              <Text style={[styles.toAddr, activeColor !== DARK ? { color: '#FFFFFF' } : {}]}>
                {customer.address}
                {customer.phone ? `\n${customer.phone}` : ""}
                {customer.email ? `\n${customer.email}` : ""}
              </Text>
              {qrCode && (
                <Image src={qrCode} style={{ width: 60, height: 60, marginTop: 10 }} />
              )}
            </View>
          </View>
        </View>

        {/* ---- Table ---- */}
        <View style={styles.tableSection}>
          <View style={[styles.tableHeader, { borderBottomColor: activeColor }]}>
            <Text style={styles.thRef}>REF</Text>
            <Text style={styles.thDesc}>DESCRIPTION</Text>
            <Text style={styles.thQty}>QTY</Text>
            <Text style={styles.thUnit}>UNIT PRICE</Text>
            <Text style={styles.thAmount}>AMOUNT</Text>
          </View>

          {items.map((item, idx) => (
            <View
              key={idx}
              style={[
                styles.tableRow,
                idx % 2 === 1 ? { backgroundColor: ROW_ALT } : {},
              ]}
            >
              <View style={styles.tdRef}>
                <View style={styles.refBadge}>
                  <Text style={styles.refBadgeText}>
                    {String(item.ref || idx + 1)}
                  </Text>
                </View>
              </View>
              <View style={styles.tdDesc}>
                 <Text style={{ fontFamily: "Helvetica-Bold" }}>{item.name}</Text>
                 {item.description && <Text style={{ fontSize: 7, color: GRAY_TEXT }}>{item.description}</Text>}
              </View>
              <Text style={styles.tdQty}>{String(item.quantity)}</Text>
              <Text style={styles.tdUnit}>{fmt(item.unitPrice)}</Text>
              <Text style={styles.tdAmount}>{fmt(item.total)}</Text>
            </View>
          ))}
        </View>

        {/* ---- Subtotal ---- */}
        <View style={styles.subtotalRow}>
          <Text style={styles.subtotalLabel}>TOTAL</Text>
          <View style={[styles.subtotalValueBox, { backgroundColor: activeColor === DARK ? SUBTOTAL_BG : activeColor }]}>
            <Text style={[styles.subtotalValue, activeColor !== DARK ? { color: '#FFFFFF' } : {}]}>{fmt(total)}</Text>
          </View>
        </View>

        {/* ---- Bottom section: payment to | bank info + signature ---- */}
        <View style={styles.bottomSection}>
          <View style={styles.paymentToBlock}>
            <Text style={styles.paymentToLabel}>Please make payment to</Text>
            <Text style={styles.paymentToName}>{company.name}</Text>
            <Text style={styles.paymentToAddr}>
              {company.address}
            </Text>
          </View>

          <View style={styles.bankBlock}>
            {bankDetails && (
              <>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>BANK</Text>
                  <Text style={styles.bankSubLabel}>Account No</Text>
                  <Text style={styles.bankColon}>:</Text>
                  <Text style={styles.bankVal}>{bankDetails.accountNo}</Text>
                </View>
                {bankDetails.sortCode && (
                  <View style={styles.bankRow}>
                    <Text style={styles.bankLabel}>INFO</Text>
                    <Text style={styles.bankSubLabel}>Sort Code</Text>
                    <Text style={styles.bankColon}>:</Text>
                    <Text style={styles.bankVal}>{bankDetails.sortCode}</Text>
                  </View>
                )}
              </>
            )}

            {signature && (
              <View style={styles.signatureArea}>
                {signature.image && <Image src={signature.image} style={{ width: 100, height: 40, marginBottom: 5 }} />}
                <Text style={styles.signatureScript}>{signature.name}</Text>
                <View style={[styles.signatureLine, { borderTopColor: activeColor }]} />
                <Text style={styles.signatureLabel}>{signature.title || "Signature"}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ---- Footer ---- */}
        <View style={styles.footerDivider} />
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>{footerWebsite || company.website || ""}</Text>
          <Text style={styles.footerText}>{company.email || ""}</Text>
          <Text style={styles.footerText}>THANK YOU</Text>
        </View>
      </Page>
    </Document>
  );
};

export default TemplateThree;
