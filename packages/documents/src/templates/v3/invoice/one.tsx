import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  render,
} from "@react-pdf/renderer";
import React from "react";
import path from "path";

// ---- Colors pulled from the reference invoice ----
const TEAL = "#1AB8C4";
const DARK = "#3A3A3A";
const GRAY_TEXT = "#6B6B6B";
const LIGHT_ROW = "#F4F6F7";
const FOOTER_GRAY = "#7B7B7B";

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 0,
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
  logoCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: TEAL,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  logoCircleText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
  },
  logoText: { fontSize: 14, fontFamily: "Helvetica-Bold", color: DARK },
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
  invoiceToLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    marginBottom: 8,
  },
  invoiceToText: { fontSize: 8, color: GRAY_TEXT, lineHeight: 1.6 },
  website: { fontSize: 8, color: TEAL, marginTop: 4 },

  invoiceTitle: {
    fontSize: 34,
    fontFamily: "Helvetica-Bold",
    color: "#BDBDBD",
    letterSpacing: 1,
  },

  // meta row under INVOICE title (Total due / Date / No.)
  metaRow: { flexDirection: "row", marginTop: 14 },
  metaBlock: { marginLeft: 28 },
  metaBlockFirst: { marginLeft: 0 },
  metaLabel: { fontSize: 7.5, color: GRAY_TEXT, marginBottom: 4 },
  metaValue: { fontSize: 10, fontFamily: "Helvetica-Bold", color: DARK },
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
    marginTop: 24,
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

const items = [
  {
    name: "Apient vellaci inulles",
    sub: "Acipsani endelite dolupti faceripame omnimpossit",
    qty: 2,
    unit: 750.0,
    total: 1500.0,
  },
  {
    name: "Maercinda voluptas ut archil",
    sub: "Doluptame nimo ium rem expe suntus dest aut res",
    qty: 1,
    unit: 300.0,
    total: 300.0,
  },
  {
    name: "Dolomaximin presci aut",
    sub: "Acipsani endelite doluptione non plant faceriaecus ulparu",
    qty: 3,
    unit: 299.0,
    total: 897.0,
  },
  {
    name: "Reperum expedatiatende",
    sub: "Vume omnimpossit mo cusaecae sitatiumquam ut quo",
    qty: 1,
    unit: 780.0,
    total: 780.0,
  },
  {
    name: "Dionsedissit iume omnimpossit mo cusaecae",
    sub: "Feperum exped qui nate officto aliquids reperum expedct",
    qty: 2,
    unit: 300.0,
    total: 600.0,
  },
];

const fmt = (n: number) =>
  `$ ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const InvoiceDocument = () =>
  React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: styles.page },

      // Header: logo + company info
      React.createElement(
        View,
        { style: styles.headerRow },
        React.createElement(
          View,
          { style: styles.logoBlock },
          React.createElement(
            View,
            { style: styles.logoCircle },
            React.createElement(Text, { style: styles.logoCircleText }, "S"),
          ),
          React.createElement(Text, { style: styles.logoText }, "example"),
        ),
        React.createElement(
          View,
          { style: styles.companyInfo },
          React.createElement(Text, null, "City Name, Street Name 01234"),
          React.createElement(
            Text,
            null,
            "Phone: 00 123 456 789  Fax: 00 123 456 789",
          ),
          React.createElement(Text, null, "E-mail: office@example.com"),
        ),
      ),

      // Invoice to / Title + meta
      React.createElement(
        View,
        { style: styles.topSection },
        React.createElement(
          View,
          null,
          React.createElement(
            Text,
            { style: styles.invoiceToLabel },
            "Invoice to:",
          ),
          React.createElement(
            View,
            { style: styles.invoiceToText },
            React.createElement(Text, null, "City Name, Street Name 01234"),
            React.createElement(
              Text,
              null,
              "Phone: 00 123 456 789  Fax: 00 123 456 789",
            ),
            React.createElement(Text, null, "E-mail: office@example.com"),
          ),
          React.createElement(
            Text,
            { style: styles.website },
            "www.example.com",
          ),
        ),
        React.createElement(
          View,
          { style: { alignItems: "flex-end" } },
          React.createElement(Text, { style: styles.invoiceTitle }, "INVOICE"),
        ),
      ),

      // Meta row: Total Due / Invoice Date / Invoice No
      React.createElement(
        View,
        { style: [styles.metaRow, { justifyContent: "flex-end" }] },
        React.createElement(
          View,
          { style: styles.metaBlockFirst },
          React.createElement(Text, { style: styles.metaLabel }, "Total Due:"),
          React.createElement(
            Text,
            { style: styles.metaValueTeal },
            "$ 5,784.70",
          ),
        ),
        React.createElement(
          View,
          { style: styles.metaBlock },
          React.createElement(
            Text,
            { style: styles.metaLabel },
            "Invoice Date:",
          ),
          React.createElement(Text, { style: styles.metaValue }, "27.05.2022"),
        ),
        React.createElement(
          View,
          { style: styles.metaBlock },
          React.createElement(Text, { style: styles.metaLabel }, "Invoice No:"),
          React.createElement(Text, { style: styles.metaValue }, "000720"),
        ),
      ),

      // Table header
      React.createElement(
        View,
        { style: [styles.tableHeader, { marginTop: 25 }] },
        React.createElement(
          Text,
          { style: [styles.tableHeaderText, styles.colDesc] },
          "ITEM DESCRIPTION",
        ),
        React.createElement(
          Text,
          { style: [styles.tableHeaderText, styles.colQty] },
          "QUANTITY",
        ),
        React.createElement(
          Text,
          { style: [styles.tableHeaderText, styles.colUnit] },
          "UNIT PRICE",
        ),
        React.createElement(
          Text,
          { style: [styles.tableHeaderText, styles.colTotal] },
          "TOTAL",
        ),
      ),

      // Table rows
      ...items.map((item, idx) =>
        React.createElement(
          View,
          {
            key: idx,
            style: [
              styles.tableRow,
              idx % 2 === 1 ? { backgroundColor: LIGHT_ROW } : {},
            ],
          },
          React.createElement(
            View,
            { style: styles.colDesc },
            React.createElement(Text, { style: styles.itemTitle }, item.name),
            React.createElement(Text, { style: styles.itemSub }, item.sub),
          ),
          React.createElement(
            Text,
            { style: [styles.cellText, styles.colQty] },
            String(item.qty),
          ),
          React.createElement(
            Text,
            { style: [styles.cellText, styles.colUnit] },
            fmt(item.unit),
          ),
          React.createElement(
            Text,
            { style: [styles.cellTotal, styles.colTotal] },
            fmt(item.total),
          ),
        ),
      ),

      // Bottom section: terms+payment | totals
      React.createElement(
        View,
        { style: styles.bottomSection },
        React.createElement(
          View,
          { style: styles.termsBlock },
          React.createElement(
            Text,
            { style: styles.termsLabel },
            "Terms: 30 days from issue",
          ),
          React.createElement(
            Text,
            { style: styles.paymentLabel },
            "Payment Information",
          ),
          React.createElement(
            Text,
            { style: styles.paymentText },
            "Sime omnimag natibus es nis eum re prepuditest, tem que numqui doluptas sinvel mod eos rem fuga. Ribus es aliqui il maiori sit unti sit et lam",
          ),
        ),
        React.createElement(
          View,
          { style: styles.totalsBlock },
          React.createElement(
            View,
            { style: styles.totalsRow },
            React.createElement(
              Text,
              { style: styles.totalsLabel },
              "Subtotal",
            ),
            React.createElement(
              Text,
              { style: styles.totalsValue },
              "$ 3,477.00",
            ),
          ),
          React.createElement(
            View,
            { style: styles.totalsRow },
            React.createElement(
              Text,
              { style: styles.totalsLabel },
              "Tax Rate 7%",
            ),
            React.createElement(
              Text,
              { style: styles.totalsValue },
              "$ 243.39",
            ),
          ),
          React.createElement(
            View,
            { style: styles.totalsRow },
            React.createElement(
              Text,
              { style: styles.discountLabel },
              "Discount 10%",
            ),
            React.createElement(
              Text,
              { style: styles.discountValue },
              "-$ 3,47.70",
            ),
          ),
          React.createElement(
            View,
            { style: styles.totalDueRow },
            React.createElement(
              Text,
              { style: styles.totalDueLabel },
              "Total Due:",
            ),
            React.createElement(
              Text,
              { style: styles.totalDueValue },
              "$ 5,784.70",
            ),
          ),
        ),
      ),

      // Signature
      React.createElement(
        View,
        { style: styles.signatureBlock },
        React.createElement(Text, { style: styles.signatureName }, "John Doe"),
        React.createElement(
          Text,
          { style: styles.signatureTitle },
          "Project Director",
        ),
      ),

      // Thank you
      React.createElement(
        Text,
        { style: styles.thankYou },
        "Thank you for your business",
      ),

      // Footer band
      React.createElement(
        View,
        { style: styles.footer },
        React.createElement(
          View,
          null,
          React.createElement(
            Text,
            { style: styles.footerTitle },
            "Terms & Conditions",
          ),
          React.createElement(
            Text,
            { style: styles.footerText },
            "Sime omnimag natibus es nis eum res aliqui il maiori sit unti sit et lam quam voamplius. Riorte pulcita, quodit dea moenatr untrata rbent. Catilic renium ac fachuides.",
          ),
        ),
        React.createElement(
          Text,
          { style: styles.footerSite },
          "www.example.com",
        ),
      ),
    ),
  );

(async () => {
  const outPath = path.join(__dirname, "invoice.pdf");
  await render(React.createElement(InvoiceDocument), outPath);
  console.log("PDF written to", outPath);
})();
