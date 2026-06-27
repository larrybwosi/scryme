// @ts-nocheck
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { InvoiceData } from "../../types";

// ---------------------------------------------------------------------------
// Brand palette — red & green used structurally, not decoratively.
// ---------------------------------------------------------------------------
const B = {
  red: "#C0392B",
  redDark: "#9B2335",
  redLight: "#FDECEA",
  green: "#1E7C41",
  greenDark: "#155D30",
  greenLight: "#E9F5EE",

  ink: "#111418",
  charcoal: "#2C3138",
  slate: "#4A5260",
  steel: "#70798A",
  silver: "#9EA8B5",
  rule: "#D4D9DF",
  fog: "#ECEEF1",
  paper: "#F5F6F8",
  white: "#FFFFFF",
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const S = StyleSheet.create({
  page: {
    padding: 0,
    fontSize: 9,
    fontFamily: "Helvetica",
    backgroundColor: B.white,
    color: B.ink,
  },

  // ── Split colour band at top ──
  topBand: { flexDirection: "row", height: 5 },
  topBandRed: { flex: 1, backgroundColor: B.red },
  topBandGreen: { flex: 1, backgroundColor: B.green },

  // ── Header ──
  header: {
    backgroundColor: B.redDark,
    paddingHorizontal: 44,
    paddingTop: 28,
    paddingBottom: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: { flexDirection: "column" },
  invoiceLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: B.silver,
    letterSpacing: 2.8,
    marginBottom: 5,
  },
  invoiceNumber: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: B.white,
    letterSpacing: 0.4,
  },
  headerRight: { alignItems: "flex-end", maxWidth: 220 },

  // Logo sits in a white pill so it reads on the dark header
  logoContainer: {
    backgroundColor: B.white,
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
    width: 120,
    height: 50,
  },
  logo: {
    width: 100,
    height: 38,
    objectFit: "contain",
  },
  orgName: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: B.white,
    textAlign: "right",
    marginBottom: 2,
  },
  orgDescription: {
    fontSize: 7.5,
    color: B.silver,
    textAlign: "right",
    lineHeight: 1.55,
    maxWidth: 200,
  },

  // Green rule under header
  greenRule: { height: 3, backgroundColor: B.green },

  // ── Body ──
  body: {
    paddingHorizontal: 44,
    paddingTop: 26,
    paddingBottom: 48,
  },

  // ── Meta row ──
  metaRow: { flexDirection: "row", marginBottom: 24 },
  metaCell: { marginRight: 32 },
  metaLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: B.steel,
    letterSpacing: 1.6,
    marginBottom: 3,
  },
  metaValue: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: B.ink,
  },

  // ── Hairline rule ──
  rule: { height: 1, backgroundColor: B.rule, marginBottom: 22 },

  // ── Billing ──
  billingSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  billCol: { width: "44%" },
  billColRight: { width: "44%", alignItems: "flex-end" },
  billSectionLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: B.steel,
    letterSpacing: 1.6,
    marginBottom: 7,
    paddingBottom: 5,
    borderBottomWidth: 1.5,
    borderBottomColor: B.red,
  },
  billSectionLabelGreen: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: B.steel,
    letterSpacing: 1.6,
    marginBottom: 7,
    paddingBottom: 5,
    borderBottomWidth: 1.5,
    borderBottomColor: B.green,
    textAlign: "right",
  },
  billName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: B.ink,
    marginBottom: 3,
  },
  billNameRight: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: B.ink,
    marginBottom: 3,
    textAlign: "right",
  },
  billText: { fontSize: 8.5, color: B.slate, lineHeight: 1.6 },
  billTextRight: {
    fontSize: 8.5,
    color: B.slate,
    lineHeight: 1.6,
    textAlign: "right",
  },

  // ── Items Table ──
  table: { marginBottom: 18 },
  tableHead: {
    flexDirection: "row",
    backgroundColor: B.green,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableHeadCell: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: B.white,
    letterSpacing: 1.1,
  },
  tableRowEven: {
    flexDirection: "row",
    paddingVertical: 9,
    paddingHorizontal: 10,
    backgroundColor: B.white,
    borderBottomWidth: 1,
    borderBottomColor: B.fog,
  },
  tableRowOdd: {
    flexDirection: "row",
    paddingVertical: 9,
    paddingHorizontal: 10,
    backgroundColor: B.paper,
    borderBottomWidth: 1,
    borderBottomColor: B.fog,
  },
  tableCell: { fontSize: 9, color: B.ink },
  tableCellMuted: { fontSize: 8.5, color: B.slate, lineHeight: 1.5 },

  colQty: { width: "8%" },
  colDesc: { width: "52%" },
  colPrice: { width: "20%", textAlign: "right" },
  colTotal: { width: "20%", textAlign: "right" },

  // ── Totals ──
  totalsSection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 28,
  },
  totalsBox: { width: "42%" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: B.fog,
  },
  totalLabel: { fontSize: 8.5, color: B.steel },
  totalValue: { fontSize: 8.5, color: B.slate, fontFamily: "Helvetica-Bold" },

  invoiceTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: B.rule,
  },
  invoiceTotalLabel: { fontSize: 8.5, color: B.steel },
  invoiceTotalValue: {
    fontSize: 8.5,
    color: B.slate,
    fontFamily: "Helvetica-Bold",
  },

  amountPaidRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: B.redLight,
    borderBottomWidth: 1,
    borderBottomColor: B.rule,
  },
  amountPaidLabel: { fontSize: 8.5, color: B.red },
  amountPaidValue: {
    fontSize: 8.5,
    color: B.red,
    fontFamily: "Helvetica-Bold",
  },

  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: B.greenLight,
    borderLeftWidth: 3,
    borderLeftColor: B.green,
    marginTop: 3,
  },
  grandTotalLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: B.greenDark,
  },
  grandTotalValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: B.greenDark,
  },

  balanceDueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: B.greenLight,
    borderLeftWidth: 3,
    borderLeftColor: B.green,
    marginTop: 3,
  },
  balanceDueLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: B.greenDark,
  },
  balanceDueValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: B.greenDark,
  },

  // ── Footer ──
  footerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 20,
    marginBottom: 32,
  },
  footerCol: { width: "47%" },
  footerLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: B.white,
    letterSpacing: 1.5,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  footerLabelRed: { backgroundColor: B.redDark },
  footerLabelGreen: { backgroundColor: B.greenDark },
  footerText: {
    fontSize: 8,
    color: B.slate,
    lineHeight: 1.65,
    paddingHorizontal: 2,
  },
  paymentMethodBox: { marginBottom: 7, paddingHorizontal: 2 },
  paymentMethodTitle: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: B.ink,
    marginBottom: 2,
  },
  paymentMethodDetail: { fontSize: 8, color: B.slate, lineHeight: 1.55 },

  // ── Closing ──
  closingSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: B.rule,
  },
  thankText: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: B.red,
    marginBottom: 3,
  },
  tagline: { fontSize: 8, color: B.silver },
  signatureBlock: { alignItems: "flex-end" },
  signatureLine: {
    width: 120,
    height: 1,
    backgroundColor: B.ink,
    marginBottom: 5,
  },
  signatureName: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: B.ink,
    textAlign: "right",
  },
  signatureTitle: {
    fontSize: 8,
    color: B.steel,
    textAlign: "right",
    marginTop: 1,
  },

  // ── Bottom split colour band ──
  bottomBand: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    height: 5,
  },
  bottomBandGreen: { flex: 1, backgroundColor: B.green },
  bottomBandRed: { flex: 1, backgroundColor: B.red },
});

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
const fmt = (amount: number, code: string, locale: string): string => {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${code} ${amount.toFixed(2)}`;
  }
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const BusinessInvoicePDF: React.FC<{ data: InvoiceData }> = ({
  data: invoiceData,
}) => {
  const { code, locale } = invoiceData.currencySettings || {
    code: invoiceData.currency,
    locale: "en-US",
  };
  const isInclusive = invoiceData.isTaxInclusive ?? false;

  const subTotal = invoiceData.subtotal;
  const taxAmount = invoiceData.tax;
  const grandTotal =
    invoiceData.total || invoiceData.grandTotal || subTotal + taxAmount;

  const isInstallment = invoiceData.installmentDetails?.isInstallment;
  const amountPaid =
    invoiceData.amountPaid ||
    (invoiceData.installmentDetails?.totalAmountPaidSoFar ?? 0);
  const balanceDue =
    invoiceData.balanceDue ??
    invoiceData.installmentDetails?.balanceDue ??
    grandTotal - amountPaid;

  const logo =
    invoiceData.logo ||
    invoiceData.logoUrl ||
    invoiceData.company?.logo ||
    invoiceData.company?.logoUrl;

  return (
    <Document>
      <Page size="A4" style={S.page}>
        {/* Top split band */}
        <View style={S.topBand}>
          <View style={S.topBandRed} />
          <View style={S.topBandGreen} />
        </View>

        {/* Header */}
        <View style={S.header}>
          <View style={S.headerLeft}>
            <Text style={S.invoiceLabel}>INVOICE</Text>
            <Text style={S.invoiceNumber}>{invoiceData.invoiceNumber}</Text>
          </View>

          <View style={S.headerRight}>
            {/* Logo section — renders when logo is provided */}
            {logo ? (
              <View style={S.logoContainer}>
                <Image src={logo as string} style={S.logo} />
              </View>
            ) : null}
            <Text style={S.orgName}>
              {invoiceData.organizationName || invoiceData.company.name}
            </Text>
            {(invoiceData.organizationDescription ||
              invoiceData.company.tagline) && (
              <Text style={S.orgDescription}>
                {invoiceData.organizationDescription ||
                  invoiceData.company.tagline}
              </Text>
            )}
          </View>
        </View>

        {/* Green accent rule */}
        <View style={S.greenRule} />

        {/* Body */}
        <View style={S.body}>
          {/* Meta row */}
          <View style={S.metaRow}>
            {[
              { label: "DATE OF ISSUE", value: invoiceData.date },
              { label: "DUE DATE", value: invoiceData.dueDate },
              { label: "CURRENCY", value: code || invoiceData.currency },
            ].map((m) => (
              <View key={m.label} style={S.metaCell}>
                <Text style={S.metaLabel}>{m.label}</Text>
                <Text style={S.metaValue}>{m.value as string}</Text>
              </View>
            ))}
          </View>

          <View style={S.rule} />

          {/* Billing */}
          <View style={S.billingSection}>
            <View style={S.billCol}>
              <Text style={S.billSectionLabel}>BILLED TO</Text>
              <Text style={S.billName}>
                {invoiceData.billTo?.name || invoiceData.client.name}
              </Text>
              <Text style={S.billText}>
                {typeof invoiceData.billTo?.address === "string"
                  ? invoiceData.billTo.address
                  : invoiceData.customerAddress}
              </Text>
              <Text style={S.billText}>
                {invoiceData.billTo?.city}, {invoiceData.billTo?.state}{" "}
                {invoiceData.billTo?.zipCode}
              </Text>
            </View>
            <View style={S.billColRight}>
              <Text style={S.billSectionLabelGreen}>FROM</Text>
              <Text style={S.billNameRight}>
                {invoiceData.billFrom?.name || invoiceData.company.name}
              </Text>
              <Text style={S.billTextRight}>
                {invoiceData.billFrom?.address || invoiceData.company.address}
              </Text>
              <Text style={S.billTextRight}>
                {invoiceData.billFrom?.phone || invoiceData.company.phone}
              </Text>
              <Text style={S.billTextRight}>
                {invoiceData.billFrom?.email || invoiceData.company.email}
              </Text>
            </View>
          </View>

          {/* Items table */}
          <View style={S.table}>
            <View style={S.tableHead}>
              <Text style={[S.tableHeadCell, S.colQty]}>QTY</Text>
              <Text style={[S.tableHeadCell, S.colDesc]}>DESCRIPTION</Text>
              <Text style={[S.tableHeadCell, S.colPrice]}>UNIT PRICE</Text>
              <Text style={[S.tableHeadCell, S.colTotal]}>AMOUNT</Text>
            </View>

            {invoiceData.items.map((item, i) => (
              <View
                key={i}
                style={i % 2 === 0 ? S.tableRowEven : S.tableRowOdd}
              >
                <View style={S.colQty}>
                  <Text style={S.tableCell}>{item.qty || item.quantity}</Text>
                </View>
                <View style={S.colDesc}>
                  <Text style={S.tableCellMuted}>
                    {item.itemDescription || item.description || item.itemName}
                  </Text>
                </View>
                <View style={S.colPrice}>
                  <Text style={[S.tableCell, { textAlign: "right" }]}>
                    {fmt(
                      item.unitPrice || item.price || item.rate,
                      code || "USD",
                      locale || "en-US",
                    )}
                  </Text>
                </View>
                <View style={S.colTotal}>
                  <Text
                    style={[
                      S.tableCell,
                      { textAlign: "right", fontFamily: "Helvetica-Bold" },
                    ]}
                  >
                    {fmt(
                      item.totalPrice || item.amount,
                      code || "USD",
                      locale || "en-US",
                    )}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Totals */}
          <View style={S.totalsSection}>
            <View style={S.totalsBox}>
              <View style={S.totalRow}>
                <Text style={S.totalLabel}>
                  {isInclusive ? "Subtotal (excl. tax)" : "Subtotal"}
                </Text>
                <Text style={S.totalValue}>
                  {fmt(subTotal, code || "USD", locale || "en-US")}
                </Text>
              </View>
              <View style={S.totalRow}>
                <Text style={S.totalLabel}>Tax ({invoiceData.taxRate}%)</Text>
                <Text style={S.totalValue}>
                  {fmt(taxAmount, code || "USD", locale || "en-US")}
                </Text>
              </View>

              {isInstallment ? (
                <>
                  <View style={S.invoiceTotalRow}>
                    <Text style={S.invoiceTotalLabel}>Invoice Total</Text>
                    <Text style={S.invoiceTotalValue}>
                      {fmt(grandTotal, code || "USD", locale || "en-US")}
                    </Text>
                  </View>
                  <View style={S.amountPaidRow}>
                    <Text style={S.amountPaidLabel}>Less: Amount Paid</Text>
                    <Text style={S.amountPaidValue}>
                      ({fmt(amountPaid, code || "USD", locale || "en-US")})
                    </Text>
                  </View>
                  <View style={S.balanceDueRow}>
                    <Text style={S.balanceDueLabel}>Balance Due</Text>
                    <Text style={S.balanceDueValue}>
                      {fmt(balanceDue, code || "USD", locale || "en-US")}
                    </Text>
                  </View>
                </>
              ) : (
                <View style={S.grandTotalRow}>
                  <Text style={S.grandTotalLabel}>Total Due</Text>
                  <Text style={S.grandTotalValue}>
                    {fmt(grandTotal, code || "USD", locale || "en-US")}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Footer */}
          <View style={S.footerSection}>
            <View style={S.footerCol}>
              <Text style={[S.footerLabel, S.footerLabelRed]}>
                TERMS & CONDITIONS
              </Text>
              <Text style={S.footerText}>
                {invoiceData.termsAndConditions || invoiceData.payment.terms}
              </Text>
            </View>
            <View style={S.footerCol}>
              <Text style={[S.footerLabel, S.footerLabelGreen]}>
                PAYMENT METHODS
              </Text>
              {(
                invoiceData.paymentMethods ||
                (invoiceData.payment.availableMethods || []).map((m) => ({
                  methodName: m,
                  details: [],
                }))
              ).map((m, i) => (
                <View key={i} style={S.paymentMethodBox}>
                  <Text style={S.paymentMethodTitle}>{m.methodName}</Text>
                  {m.details &&
                    m.details.map((line, j) => (
                      <Text key={j} style={S.paymentMethodDetail}>
                        {line}
                      </Text>
                    ))}
                </View>
              ))}
            </View>
          </View>

          {/* Closing / Signature */}
          <View style={S.closingSection}>
            <View>
              <Text style={S.thankText}>Thank you for your business.</Text>
              <Text style={S.tagline}>
                {invoiceData.organizationName || invoiceData.company.name} ·{" "}
                {invoiceData.company.email}
              </Text>
            </View>
            <View style={S.signatureBlock}>
              <View style={S.signatureLine} />
              <Text style={S.signatureName}>{invoiceData.signature?.name}</Text>
              <Text style={S.signatureTitle}>
                {invoiceData.signature?.title}
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom split band */}
        <View style={S.bottomBand}>
          <View style={S.bottomBandGreen} />
          <View style={S.bottomBandRed} />
        </View>
      </Page>
    </Document>
  );
};

export default BusinessInvoicePDF;
