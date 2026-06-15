import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import { ReceiptData } from "../../types";

// ─── Design Tokens ─────────────────────────────────────────────────────────────
// primaryColor drives the accent band + grand total bar.
// Everything else is from a fixed slate-based enterprise palette.
const C = {
  ink: "#0F1923", // primary text
  inkMid: "#3D4F61", // secondary text
  inkLight: "#6B7D8E", // labels / caps
  rule: "#D9E2EA", // hairline borders
  surface: "#F4F7FA", // table header bg, alt rows
  white: "#FFFFFF",
  // Teal accent pair (overridden below by primaryColor for accent band)
  accentText: "#FFFFFF",
  paidFill: "#E1F5EE",
  paidText: "#0C6E56",
};

const PAGE_PAD = 32;

// ─── Style Factory ─────────────────────────────────────────────────────────────
const buildStyles = (primaryColor = "#0C6E56") =>
  StyleSheet.create({
    // Page
    page: {
      fontFamily: "Helvetica",
      fontSize: 9,
      color: C.ink,
      backgroundColor: C.white,
      paddingHorizontal: PAGE_PAD,
      paddingTop: 0,
      paddingBottom: 32,
    },

    // ── Header band ──────────────────────────────────────────────────────────
    headerBand: {
      backgroundColor: primaryColor,
      marginHorizontal: -PAGE_PAD,
      paddingHorizontal: PAGE_PAD,
      paddingTop: 26,
      paddingBottom: 22,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
    },
    logo: {
      height: 28,
      marginBottom: 8,
      objectFit: "contain",
    },
    companyName: {
      fontFamily: "Helvetica-Bold",
      fontSize: 15,
      color: C.white,
      letterSpacing: 0.3,
    },
    companyMeta: {
      fontSize: 8,
      color: "rgba(255,255,255,0.68)",
      marginTop: 2,
      lineHeight: 1.55,
    },
    docTitleRight: {
      alignItems: "flex-end",
    },
    docEyebrow: {
      fontSize: 7.5,
      fontFamily: "Helvetica-Bold",
      color: "rgba(255,255,255,0.72)",
      letterSpacing: 2,
      textTransform: "uppercase",
    },
    docNumber: {
      fontFamily: "Helvetica-Bold",
      fontSize: 20,
      color: C.white,
      marginTop: 3,
      letterSpacing: 0.3,
    },
    docMeta: {
      fontSize: 8,
      color: "rgba(255,255,255,0.65)",
      marginTop: 2,
      textAlign: "right",
    },

    // ── Accent rule ──────────────────────────────────────────────────────────
    accentRule: {
      height: 3,
      // Lightened variant of primaryColor — use a fixed teal mid for the stripe
      backgroundColor: "#1D9E75",
      marginHorizontal: -PAGE_PAD,
      marginBottom: 22,
    },

    // ── Meta row (customer + transaction) ────────────────────────────────────
    metaRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 20,
      marginBottom: 22,
    },
    metaBlock: {
      flex: 1,
    },
    metaLabel: {
      fontSize: 7,
      fontFamily: "Helvetica-Bold",
      color: C.inkLight,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      marginBottom: 5,
    },
    metaName: {
      fontFamily: "Helvetica-Bold",
      fontSize: 11,
      color: C.ink,
      marginBottom: 2,
    },
    metaSub: {
      fontSize: 8.5,
      color: C.inkMid,
      lineHeight: 1.55,
    },

    // Paid badge
    paidBadge: {
      backgroundColor: C.paidFill,
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderRadius: 4,
      alignSelf: "flex-start",
      marginTop: 7,
    },
    paidBadgeText: {
      fontFamily: "Helvetica-Bold",
      fontSize: 7.5,
      color: C.paidText,
      letterSpacing: 1.4,
      textTransform: "uppercase",
    },

    // Transaction detail grid (right side)
    detailGrid: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 22,
      marginTop: 4,
    },
    detailCell: {},
    detailValue: {
      fontFamily: "Helvetica-Bold",
      fontSize: 9.5,
      color: C.ink,
      marginTop: 2,
    },

    // ── Hairline divider ─────────────────────────────────────────────────────
    divider: {
      height: 0.5,
      backgroundColor: C.rule,
      marginBottom: 16,
    },

    // ── Section label ────────────────────────────────────────────────────────
    sectionLabel: {
      fontSize: 7,
      fontFamily: "Helvetica-Bold",
      color: C.inkLight,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      marginBottom: 8,
    },

    // ── Table ────────────────────────────────────────────────────────────────
    tableHeaderRow: {
      flexDirection: "row",
      backgroundColor: C.surface,
      paddingVertical: 7,
      paddingHorizontal: 10,
      borderRadius: 4,
      marginBottom: 2,
    },
    tableHeaderCell: {
      fontSize: 7.5,
      fontFamily: "Helvetica-Bold",
      color: C.inkMid,
      letterSpacing: 0.6,
      textTransform: "uppercase",
    },
    tableRow: {
      flexDirection: "row",
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderBottomWidth: 0.5,
      borderBottomColor: C.rule,
    },
    tableRowAlt: {
      backgroundColor: "#FAFBFC",
    },
    tableCell: {
      fontSize: 9.5,
      color: C.ink,
    },
    tableCellMuted: {
      fontSize: 9.5,
      color: C.inkMid,
    },
    tableCellBold: {
      fontFamily: "Helvetica-Bold",
      fontSize: 9.5,
      color: C.ink,
    },

    // Column widths
    colDesc: { width: "55%" },
    colQty: { width: "10%", textAlign: "center" },
    colPrice: { width: "17%", textAlign: "right" },
    colTotal: { width: "18%", textAlign: "right" },

    // ── Totals ───────────────────────────────────────────────────────────────
    totalsSection: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginTop: 20,
    },
    totalsBox: {
      width: "42%",
    },
    totalsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 5,
      borderBottomWidth: 0.5,
      borderBottomColor: C.rule,
    },
    totalsLabel: {
      fontSize: 8.5,
      color: C.inkMid,
    },
    totalsValue: {
      fontFamily: "Helvetica-Bold",
      fontSize: 8.5,
      color: C.ink,
    },

    // Grand total bar
    grandBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: primaryColor,
      borderRadius: 4,
      paddingHorizontal: 10,
      paddingVertical: 9,
      marginTop: 7,
    },
    grandLabel: {
      fontFamily: "Helvetica-Bold",
      fontSize: 9,
      color: C.white,
      letterSpacing: 0.4,
    },
    grandValue: {
      fontFamily: "Helvetica-Bold",
      fontSize: 14,
      color: C.white,
      letterSpacing: 0.3,
    },

    // ── Payment method pill ──────────────────────────────────────────────────
    paymentRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 22,
      gap: 8,
    },
    paymentChip: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 4,
      borderWidth: 0.5,
      borderColor: C.rule,
      backgroundColor: C.surface,
    },
    paymentChipLabel: {
      fontSize: 7,
      fontFamily: "Helvetica-Bold",
      color: C.inkLight,
      letterSpacing: 1,
      textTransform: "uppercase",
      marginBottom: 1,
    },
    paymentChipValue: {
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      color: C.inkMid,
    },

    // ── Footer ───────────────────────────────────────────────────────────────
    footer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      marginTop: 32,
      paddingTop: 14,
      borderTopWidth: 0.5,
      borderTopColor: C.rule,
    },
    thankYou: {
      fontFamily: "Helvetica-Bold",
      fontSize: 10,
      color: primaryColor,
      marginBottom: 3,
    },
    footerSub: {
      fontSize: 7.5,
      color: C.inkLight,
      fontFamily: "Helvetica-Oblique",
      lineHeight: 1.6,
    },
    footerMeta: {
      fontSize: 7.5,
      color: C.inkLight,
      textAlign: "right",
      lineHeight: 1.7,
    },
    footerMetaBold: {
      fontFamily: "Helvetica-Bold",
      color: C.inkMid,
    },
  });

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtCurrency = (n: number) =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// ─── Component ────────────────────────────────────────────────────────────────
export const ReceiptDocument = ({ data }: { data: ReceiptData }) => {
  const primaryColor = data.branding?.primaryColor ?? "#0C6E56";
  const s = buildStyles(primaryColor);
  const dateStr = format(new Date(data.date), "MMM dd, yyyy");
  const companyName = data.branding?.companyName ?? "Our Company";

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* ── Header band ── */}
        <View style={s.headerBand}>
          <View>
            {data.branding?.logoUrl && (
              <Image src={data.branding.logoUrl} style={s.logo} />
            )}
            <Text style={s.companyName}>{companyName}</Text>
            {data.branding?.companyAddress && (
              <Text style={s.companyMeta}>{data.branding.companyAddress}</Text>
            )}
            {data.branding?.companyEmail && (
              <Text style={s.companyMeta}>{data.branding.companyEmail}</Text>
            )}
          </View>
          <View style={s.docTitleRight}>
            <Text style={s.docEyebrow}>Payment Receipt</Text>
            <Text style={s.docNumber}>#{data.receiptNumber}</Text>
            {data.orderNumber && (
              <Text style={s.docMeta}>Order #{data.orderNumber}</Text>
            )}
            <Text style={s.docMeta}>{dateStr}</Text>
          </View>
        </View>

        {/* ── Accent rule ── */}
        <View style={s.accentRule} />

        {/* ── Meta row ── */}
        <View style={s.metaRow}>
          {/* Customer */}
          <View style={s.metaBlock}>
            <Text style={s.metaLabel}>Billed to</Text>
            <Text style={s.metaName}>{data.customer.name}</Text>
            {data.customer.email && (
              <Text style={s.metaSub}>{data.customer.email}</Text>
            )}
            {data.customer.phone && (
              <Text style={s.metaSub}>{data.customer.phone}</Text>
            )}
            <View style={s.paidBadge}>
              <Text style={s.paidBadgeText}>✓ Paid</Text>
            </View>
          </View>

          {/* Transaction details */}
          <View style={[s.metaBlock, { alignItems: "flex-end" }]}>
            <Text style={s.metaLabel}>Transaction details</Text>
            <View style={s.detailGrid}>
              <View style={s.detailCell}>
                <Text style={s.metaLabel}>Date</Text>
                <Text style={s.detailValue}>{dateStr}</Text>
              </View>
              {data.paymentMethod && (
                <View style={s.detailCell}>
                  <Text style={s.metaLabel}>Payment method</Text>
                  <Text style={s.detailValue}>{data.paymentMethod}</Text>
                </View>
              )}
              <View style={s.detailCell}>
                <Text style={s.metaLabel}>Receipt no.</Text>
                <Text style={s.detailValue}>{data.receiptNumber}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Divider ── */}
        <View style={s.divider} />

        {/* ── Items table ── */}
        <Text style={s.sectionLabel}>Transaction summary</Text>

        <View style={s.tableHeaderRow}>
          <Text style={[s.tableHeaderCell, s.colDesc]}>Description</Text>
          <Text style={[s.tableHeaderCell, s.colQty, { textAlign: "center" }]}>
            Qty
          </Text>
          <Text style={[s.tableHeaderCell, s.colPrice, { textAlign: "right" }]}>
            Unit price
          </Text>
          <Text style={[s.tableHeaderCell, s.colTotal, { textAlign: "right" }]}>
            Amount
          </Text>
        </View>

        {data.items.map((item, i) => (
          <View key={i} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
            <Text style={[s.tableCell, s.colDesc]}>{item.description}</Text>
            <Text style={[s.tableCellMuted, s.colQty]}>{item.quantity}</Text>
            <Text style={[s.tableCellMuted, s.colPrice]}>
              {fmtCurrency(item.unitPrice ?? 0)}
            </Text>
            <Text style={[s.tableCellBold, s.colTotal]}>
              {fmtCurrency(
                item.totalPrice ?? item.quantity * (item.unitPrice ?? 0),
              )}
            </Text>
          </View>
        ))}

        {/* ── Totals ── */}
        <View style={s.totalsSection}>
          <View style={s.totalsBox}>
            <View style={s.totalsRow}>
              <Text style={s.totalsLabel}>Subtotal</Text>
              <Text style={s.totalsValue}>{fmtCurrency(data.subtotal)}</Text>
            </View>
            <View style={s.totalsRow}>
              <Text style={s.totalsLabel}>Tax</Text>
              <Text style={s.totalsValue}>{fmtCurrency(data.tax)}</Text>
            </View>
            <View style={s.grandBar}>
              <Text style={s.grandLabel}>Total paid</Text>
              <Text style={s.grandValue}>{fmtCurrency(data.total)}</Text>
            </View>
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={s.footer}>
          <View>
            <Text style={s.thankYou}>Thank you for your payment.</Text>
            <Text style={s.footerSub}>
              This is an official receipt issued by {companyName}.{"\n"}
              Please retain this document for your records.
            </Text>
          </View>
          <View>
            <Text style={s.footerMeta}>
              <Text style={s.footerMetaBold}>{companyName}</Text>
              {data.branding?.companyWebsite
                ? `\n${data.branding.companyWebsite}`
                : ""}
              {"\n"}Receipt #{data.receiptNumber}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export const ReceiptPDF = ({ data }: { data: ReceiptData }) => {
  const primaryColor = data.branding?.primaryColor ?? "#0C6E56";
  const s = buildStyles(primaryColor);
  const dateStr = format(new Date(data.date), "MMM dd, yyyy");
  const companyName = data.branding?.companyName ?? "Our Company";

  return <Page size="A4" style={s.page}>
        {/* ── Header band ── */}
        <View style={s.headerBand}>
          <View>
            {data.branding?.logoUrl && (
              <Image src={data.branding.logoUrl} style={s.logo} />
            )}
            <Text style={s.companyName}>{companyName}</Text>
            {data.branding?.companyAddress && (
              <Text style={s.companyMeta}>{data.branding.companyAddress}</Text>
            )}
            {data.branding?.companyEmail && (
              <Text style={s.companyMeta}>{data.branding.companyEmail}</Text>
            )}
          </View>
          <View style={s.docTitleRight}>
            <Text style={s.docEyebrow}>Payment Receipt</Text>
            <Text style={s.docNumber}>#{data.receiptNumber}</Text>
            {data.orderNumber && (
              <Text style={s.docMeta}>Order #{data.orderNumber}</Text>
            )}
            <Text style={s.docMeta}>{dateStr}</Text>
          </View>
        </View>

        {/* ── Accent rule ── */}
        <View style={s.accentRule} />

        {/* ── Meta row ── */}
        <View style={s.metaRow}>
          {/* Customer */}
          <View style={s.metaBlock}>
            <Text style={s.metaLabel}>Billed to</Text>
            <Text style={s.metaName}>{data.customer.name}</Text>
            {data.customer.email && (
              <Text style={s.metaSub}>{data.customer.email}</Text>
            )}
            {data.customer.phone && (
              <Text style={s.metaSub}>{data.customer.phone}</Text>
            )}
            <View style={s.paidBadge}>
              <Text style={s.paidBadgeText}>✓ Paid</Text>
            </View>
          </View>

          {/* Transaction details */}
          <View style={[s.metaBlock, { alignItems: "flex-end" }]}>
            <Text style={s.metaLabel}>Transaction details</Text>
            <View style={s.detailGrid}>
              <View style={s.detailCell}>
                <Text style={s.metaLabel}>Date</Text>
                <Text style={s.detailValue}>{dateStr}</Text>
              </View>
              {data.paymentMethod && (
                <View style={s.detailCell}>
                  <Text style={s.metaLabel}>Payment method</Text>
                  <Text style={s.detailValue}>{data.paymentMethod}</Text>
                </View>
              )}
              <View style={s.detailCell}>
                <Text style={s.metaLabel}>Receipt no.</Text>
                <Text style={s.detailValue}>{data.receiptNumber}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Divider ── */}
        <View style={s.divider} />

        {/* ── Items table ── */}
        <Text style={s.sectionLabel}>Transaction summary</Text>

        <View style={s.tableHeaderRow}>
          <Text style={[s.tableHeaderCell, s.colDesc]}>Description</Text>
          <Text style={[s.tableHeaderCell, s.colQty, { textAlign: "center" }]}>
            Qty
          </Text>
          <Text style={[s.tableHeaderCell, s.colPrice, { textAlign: "right" }]}>
            Unit price
          </Text>
          <Text style={[s.tableHeaderCell, s.colTotal, { textAlign: "right" }]}>
            Amount
          </Text>
        </View>

        {data.items.map((item, i) => (
          <View key={i} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
            <Text style={[s.tableCell, s.colDesc]}>{item.description}</Text>
            <Text style={[s.tableCellMuted, s.colQty]}>{item.quantity}</Text>
            <Text style={[s.tableCellMuted, s.colPrice]}>
              {fmtCurrency(item.unitPrice ?? 0)}
            </Text>
            <Text style={[s.tableCellBold, s.colTotal]}>
              {fmtCurrency(
                item.totalPrice ?? item.quantity * (item.unitPrice ?? 0),
              )}
            </Text>
          </View>
        ))}

        {/* ── Totals ── */}
        <View style={s.totalsSection}>
          <View style={s.totalsBox}>
            <View style={s.totalsRow}>
              <Text style={s.totalsLabel}>Subtotal</Text>
              <Text style={s.totalsValue}>{fmtCurrency(data.subtotal)}</Text>
            </View>
            <View style={s.totalsRow}>
              <Text style={s.totalsLabel}>Tax</Text>
              <Text style={s.totalsValue}>{fmtCurrency(data.tax)}</Text>
            </View>
            <View style={s.grandBar}>
              <Text style={s.grandLabel}>Total paid</Text>
              <Text style={s.grandValue}>{fmtCurrency(data.total)}</Text>
            </View>
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={s.footer}>
          <View>
            <Text style={s.thankYou}>Thank you for your payment.</Text>
            <Text style={s.footerSub}>
              This is an official receipt issued by {companyName}.{"\n"}
              Please retain this document for your records.
            </Text>
          </View>
          <View>
            <Text style={s.footerMeta}>
              <Text style={s.footerMetaBold}>{companyName}</Text>
              {data.branding?.companyWebsite
                ? `\n${data.branding.companyWebsite}`
                : ""}
              {"\n"}Receipt #{data.receiptNumber}
            </Text>
          </View>
        </View>
      </Page>;
};
