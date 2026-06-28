import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  render,
  Svg,
  Path,
} from "@react-pdf/renderer";
import React from "react";
import path from "path";

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

  // ---------- INVOICE title with accent bar ----------
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 30,
    marginBottom: 30,
  },
  accentBar: { width: 6, height: 48, backgroundColor: DARK, marginRight: 18 },
  invoiceTitle: {
    fontSize: 38,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    letterSpacing: 1,
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

const DiamondIcon = () =>
  React.createElement(
    Svg,
    { width: 22, height: 22, viewBox: "0 0 24 24" },
    React.createElement(Path, {
      d: "M6 4 L18 4 L22 9 L12 21 L2 9 Z M2 9 L22 9 M6 4 L9 9 L12 21 M18 4 L15 9 L12 21",
      stroke: PINK,
      strokeWidth: 1,
      fill: "none",
    }),
  );

const items = [
  {
    qty: "1 SET",
    desc: "Us, cullumquodis nonsequi nonem quae vit ad minust, ipsam intur?",
    price: 100,
    total: 100,
  },
  {
    qty: "5 SET",
    desc: "Dolor aspis aut lant quis nuscid ustiiscid ent ut parios di arcilibus vid miliquo ditior sinus.",
    price: 100,
    total: 500,
  },
  {
    qty: "10 SET",
    desc: "Amquunt explit, veniaeped etum esequiatien sum dolum aut ab ium vera voluptam que peruptaque deliatiunt eumet et ab il ipsamentumquo es atur, vollic.",
    price: 100,
    total: 1000,
  },
];

const fmt = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const InvoiceDocument = () =>
  React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: styles.page },

      // ---- Brand header ----
      React.createElement(DiamondIcon),
      React.createElement(Text, { style: styles.brandName }, "YOUR BRAND"),
      React.createElement(
        Text,
        { style: styles.brandSlogan },
        "YOUR SLOGAN GOES HERE",
      ),

      React.createElement(
        View,
        { style: styles.headerRow },
        React.createElement(
          View,
          { style: styles.addressBlock },
          React.createElement(
            Text,
            { style: styles.addressLine },
            "YOUR STREET 123",
          ),
          React.createElement(
            Text,
            { style: styles.addressLine },
            "YOUR CITY 456",
          ),
          React.createElement(
            Text,
            { style: styles.addressLine },
            "P: (123)-456-7890",
          ),
          React.createElement(
            Text,
            { style: styles.addressLineReg },
            "www.example.com",
          ),
        ),

        React.createElement(
          View,
          { style: styles.metaBlock },
          React.createElement(
            Text,
            { style: styles.metaDate },
            "Friday, February 18, 2024",
          ),
          React.createElement(Text, { style: styles.metaNo }, "NO# 123"),
          React.createElement(Text, { style: styles.toLabel }, "TO:"),
          React.createElement(Text, { style: styles.toName }, "JAMES SMITH"),
          React.createElement(
            Text,
            { style: styles.toLine },
            "Your Street 123",
          ),
          React.createElement(Text, { style: styles.toLine }, "Your City 456"),
          React.createElement(Text, { style: styles.toLine }, "(123)-456-7890"),
          React.createElement(Text, { style: styles.toLine }, "example.com"),
        ),
      ),

      // ---- INVOICE title ----
      React.createElement(
        View,
        { style: styles.titleRow },
        React.createElement(View, { style: styles.accentBar }),
        React.createElement(Text, { style: styles.invoiceTitle }, "INVOICE"),
      ),

      // ---- Table ----
      React.createElement(
        View,
        { style: styles.tableHeader },
        React.createElement(Text, { style: styles.thQty }, "QTY"),
        React.createElement(
          Text,
          { style: styles.thDesc },
          "ITEMS DISCRIPTION",
        ),
        React.createElement(Text, { style: styles.thPrice }, "PRICE"),
        React.createElement(Text, { style: styles.thTotal }, "TOTAL"),
      ),

      ...items.map((item, idx) =>
        React.createElement(
          View,
          { key: idx, style: styles.tableRow },
          React.createElement(Text, { style: styles.tdQty }, item.qty),
          React.createElement(Text, { style: styles.tdDesc }, item.desc),
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
          { style: styles.totalsLabelsRow },
          React.createElement(
            View,
            { style: styles.totalsLabelBlock },
            React.createElement(
              Text,
              { style: styles.totalsLabel },
              "SUBTOTAL",
            ),
            React.createElement(
              Text,
              { style: styles.totalsValue },
              "$1,600.00",
            ),
          ),
          React.createElement(
            View,
            { style: styles.totalsLabelBlock },
            React.createElement(Text, { style: styles.totalsLabel }, "TAX"),
            React.createElement(Text, { style: styles.totalsValue }, "$160.00"),
          ),
        ),
        React.createElement(View, { style: styles.totalsDivider }),
        React.createElement(Text, { style: styles.grandTotal }, "$1,600.00"),
      ),

      // ---- Payment options ----
      React.createElement(
        View,
        { style: styles.paymentSection },
        React.createElement(
          Text,
          { style: styles.paymentLabel },
          "PAYMENT OPTIONS",
        ),
        React.createElement(
          Text,
          { style: styles.bankDetails },
          "BANK DETAILS",
        ),
        React.createElement(
          Text,
          { style: styles.bankAccount },
          "ACOUNT NO: 123 456 7890",
        ),
      ),

      React.createElement(View, { style: styles.dividerThick }),

      // ---- Terms ----
      React.createElement(
        Text,
        { style: styles.termsLabel },
        "TERMS & CONDITIONS",
      ),
      React.createElement(
        Text,
        { style: styles.termsText },
        "Ariberio ssequasin rest odicil eiunti aute nobis cum sumquodis nos quatus.",
      ),
      React.createElement(
        Text,
        { style: [styles.termsText, { marginTop: 6 }] },
        "Fugitiat alique dion aute lum dem aut esi qesci bea doluptam qui niatiumet verrorum quam quae aut.",
      ),
    ),
  );

(async () => {
  const outPath = path.join(__dirname, "invoice3.pdf");
  await render(React.createElement(InvoiceDocument), outPath);
  console.log("PDF written to", outPath);
})();
