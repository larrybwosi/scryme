import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  render,
} from "@react-pdf/renderer";
import React from "react";
import path from "path";

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
    color: DARK,
    letterSpacing: 0.5,
  },
  brandSlogan: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Oblique",
    color: GRAY_TEXT,
    marginTop: 1,
  },
  invoiceTitle: {
    fontSize: 26,
    fontFamily: "Helvetica",
    color: DARK,
    letterSpacing: 2,
  },

  // ---------- Invoice to ----------
  invoiceToSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  invoiceToLeft: {},
  invoiceToBadge: {
    backgroundColor: LIGHT_BG,
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  invoiceToBadgeText: { fontSize: 8, color: GRAY_TEXT },
  invoiceToName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    marginBottom: 4,
  },
  invoiceToAddr: { fontSize: 8.5, color: GRAY_TEXT, lineHeight: 1.5 },

  invoiceToRight: { alignItems: "flex-end" },
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
    color: DARK,
  },
  signatureName: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: DARK,
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

const ZigzagLogo = () =>
  React.createElement(
    Svg,
    { width: 34, height: 22, viewBox: "0 0 34 22" },
    React.createElement(Path, {
      d: "M0 6 L6 1 L12 6 L18 1 L24 6 L30 1 L34 4",
      stroke: DARK,
      strokeWidth: 2,
      fill: "none",
    }),
    React.createElement(Path, {
      d: "M0 12 L6 7 L12 12 L18 7 L24 12 L30 7 L34 10",
      stroke: DARK,
      strokeWidth: 2,
      fill: "none",
    }),
    React.createElement(Path, {
      d: "M0 18 L6 13 L12 18 L18 13 L24 18 L30 13 L34 16",
      stroke: DARK,
      strokeWidth: 2,
      fill: "none",
    }),
  );

const items = [
  { desc: "Lorem ipsum dolor sit amet", qty: 2, price: 20, total: 40 },
  { desc: "Maecenas dapibus quis lipsum", qty: 1, price: 10, total: 10 },
  { desc: "Cras ullamcorper odio", qty: 3, price: 25, total: 75 },
  { desc: "Mauris quam purus", qty: 5, price: 5, total: 25 },
  { desc: "Vivamus semper vitae leo", qty: 1, price: 90, total: 90 },
  { desc: "Nullam condimentum ultrices neque", qty: 2, price: 40, total: 80 },
];

const fmt = (n) => `$${n.toFixed(2)}`;

const InvoiceDocument = () =>
  React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: styles.page },

      // ---- Header ----
      React.createElement(
        View,
        { style: styles.headerRow },
        React.createElement(
          View,
          { style: styles.brandRow },
          React.createElement(ZigzagLogo),
          React.createElement(
            View,
            { style: styles.brandTextBlock },
            React.createElement(
              Text,
              { style: styles.brandName },
              "BRAND NAME",
            ),
            React.createElement(
              Text,
              { style: styles.brandSlogan },
              "Maecenas dapibus quis lipsum",
            ),
          ),
        ),
        React.createElement(Text, { style: styles.invoiceTitle }, "INVOICE"),
      ),

      // ---- Invoice to / meta ----
      React.createElement(
        View,
        { style: styles.invoiceToSection },
        React.createElement(
          View,
          { style: styles.invoiceToLeft },
          React.createElement(
            View,
            { style: styles.invoiceToBadge },
            React.createElement(
              Text,
              { style: styles.invoiceToBadgeText },
              "Invoice to:",
            ),
          ),
          React.createElement(
            Text,
            { style: styles.invoiceToName },
            "Ostin Parker",
          ),
          React.createElement(
            Text,
            { style: styles.invoiceToAddr },
            "66 Avenue any street,\nCity name, State, US",
          ),
        ),
        React.createElement(
          View,
          { style: styles.invoiceToRight },
          React.createElement(
            Text,
            { style: styles.metaLine },
            "Invoice # 115662",
          ),
          React.createElement(
            Text,
            { style: styles.metaLine },
            "Date  03/12/2022",
          ),
        ),
      ),

      // ---- Table ----
      React.createElement(
        View,
        { style: styles.tableHeader },
        React.createElement(Text, { style: styles.thDesc }, "ITEM DESCRIPTION"),
        React.createElement(Text, { style: styles.thQty }, "QTY"),
        React.createElement(Text, { style: styles.thPrice }, "PRICE"),
        React.createElement(Text, { style: styles.thTotal }, "TOTAL"),
      ),

      ...items.map((item, idx) =>
        React.createElement(
          View,
          { key: idx, style: styles.tableRow },
          React.createElement(Text, { style: styles.tdDesc }, item.desc),
          React.createElement(Text, { style: styles.tdQty }, String(item.qty)),
          React.createElement(Text, { style: styles.tdPrice }, fmt(item.price)),
          React.createElement(Text, { style: styles.tdTotal }, fmt(item.total)),
        ),
      ),

      // ---- Totals ----
      React.createElement(
        View,
        { style: styles.totalsSection },
        React.createElement(
          View,
          { style: styles.totalsRow },
          React.createElement(Text, { style: styles.totalsLabel }, "SUB TOTAL"),
          React.createElement(Text, { style: styles.totalsValue }, "$320.00"),
        ),
        React.createElement(
          View,
          { style: styles.totalsRow },
          React.createElement(Text, { style: styles.totalsLabel }, "TAX (0%)"),
          React.createElement(Text, { style: styles.totalsValue }, "$0.00"),
        ),
      ),

      // ---- Payment / grand total band ----
      React.createElement(
        View,
        { style: styles.bottomBand },
        React.createElement(
          View,
          { style: styles.paymentBlock },
          React.createElement(
            Text,
            { style: styles.paymentLabel },
            "PAYMENT METHOD",
          ),
          React.createElement(
            View,
            { style: styles.paymentRow },
            React.createElement(Text, { style: styles.paymentKey }, "Paypal"),
            React.createElement(Text, { style: styles.paymentVal }, ""),
          ),
          React.createElement(
            Text,
            { style: [styles.paymentVal, { marginBottom: 6 }] },
            "anyemail@domain.com",
          ),
          React.createElement(
            Text,
            { style: styles.paymentKey },
            "Bank account",
          ),
          React.createElement(
            Text,
            { style: styles.paymentVal },
            "23-554-2785-54",
          ),
          React.createElement(
            Text,
            { style: styles.thankYou },
            "Thank you for business with us!",
          ),
        ),
        React.createElement(
          View,
          { style: styles.grandTotalBlock },
          React.createElement(
            Text,
            { style: styles.grandTotalLabel },
            "GRAND TOTAL",
          ),
          React.createElement(
            Text,
            { style: styles.grandTotalValue },
            "$320.00",
          ),
        ),
      ),

      // ---- Signature ----
      React.createElement(
        View,
        { style: styles.signatureArea },
        React.createElement(Text, { style: styles.signatureScript }, "Freeman"),
        React.createElement(
          Text,
          { style: styles.signatureName },
          "MR. FREEMAN GOAL",
        ),
        React.createElement(
          Text,
          { style: styles.signatureTitle },
          "Executive director",
        ),
      ),

      // ---- Terms ----
      React.createElement(
        View,
        { style: styles.termsRow },
        React.createElement(Text, { style: styles.termsLabel }, "TERMS:"),
        React.createElement(
          Text,
          { style: styles.termsText },
          "Maecenas dapibus quis laoreas. Cras ullamcorper odio vel ante, vel aliquet purus. Mauris quam purus, vel sequam fugiet.",
        ),
        React.createElement(
          Text,
          { style: styles.termsAddr },
          "Address line can be here",
        ),
      ),
    ),
  );

(async () => {
  const outPath = path.join(__dirname, "invoice4.pdf");
  await render(React.createElement(InvoiceDocument), outPath);
  console.log("PDF written to", outPath);
})();
