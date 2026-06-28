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
const DARK = "#2B2B2B";
const GRAY_TEXT = "#5A5A5A";
const HEADER_BG = "#E2E4E5";
const ROW_ALT = "#EBEDEE";
const SUBTOTAL_BG = "#DCDEDF";
const LINE = "#2B2B2B";

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
  invoiceTitle: {
    fontSize: 32,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    letterSpacing: 1,
    marginBottom: 20,
  },
  topRow: { flexDirection: "row", justifyContent: "space-between" },

  clientBlock: {},
  clientLabel: { fontSize: 9, color: DARK, marginBottom: 2 },
  metaTable: { marginTop: 16 },
  metaRow: { flexDirection: "row", marginBottom: 4 },
  metaKey: { fontSize: 8.5, color: GRAY_TEXT, width: 75 },
  metaColon: { fontSize: 8.5, color: GRAY_TEXT, width: 10 },
  metaVal: { fontSize: 8.5, color: DARK },

  invoiceToBlock: { alignItems: "flex-start", maxWidth: 200 },
  invoiceToLabel: { fontSize: 9, color: GRAY_TEXT, marginBottom: 4 },
  invoiceToName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    marginBottom: 8,
  },
  invoiceToAddr: { fontSize: 8.5, color: GRAY_TEXT, lineHeight: 1.5 },

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

const items = [
  { ref: 1, desc: "Logo Design", qty: 1, unit: 120, amount: 120 },
  { ref: 2, desc: "Flyer Design", qty: 2, unit: 90, amount: 40 },
  { ref: 3, desc: "Web development", qty: 1, unit: 20, amount: 90 },
  { ref: 4, desc: "Restaurant logo", qty: 3, unit: 110, amount: 30 },
  { ref: 5, desc: "Poster Design", qty: 5, unit: 60, amount: 125 },
  { ref: 6, desc: "T-Shirt Design", qty: 3, unit: 34, amount: 105 },
  { ref: 7, desc: "Instagram Story Design", qty: 7, unit: 128, amount: 140 },
  { ref: 8, desc: "Facebook Post Design", qty: 11, unit: 35, amount: 22 },
];

const fmt = (n: number) => `$${n}`;

const InvoiceDocument = () =>
  React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: styles.page },

      // ---- Top gray band ----
      React.createElement(
        View,
        { style: styles.topBand },
        React.createElement(Text, { style: styles.dateText }, "July 10, 20XX"),
        React.createElement(Text, { style: styles.invoiceTitle }, "INVOICE"),

        React.createElement(
          View,
          { style: styles.topRow },
          // Client block
          React.createElement(
            View,
            { style: styles.clientBlock },
            React.createElement(
              Text,
              { style: styles.clientLabel },
              "Client Name",
            ),
            React.createElement(
              Text,
              { style: styles.clientLabel },
              "Company Name",
            ),
            React.createElement(
              View,
              { style: styles.metaTable },
              React.createElement(
                View,
                { style: styles.metaRow },
                React.createElement(
                  Text,
                  { style: styles.metaKey },
                  "Date issued",
                ),
                React.createElement(Text, { style: styles.metaColon }, ":"),
                React.createElement(
                  Text,
                  { style: styles.metaVal },
                  "July 10, 20XX",
                ),
              ),
              React.createElement(
                View,
                { style: styles.metaRow },
                React.createElement(
                  Text,
                  { style: styles.metaKey },
                  "Invoice No",
                ),
                React.createElement(Text, { style: styles.metaColon }, ":"),
                React.createElement(Text, { style: styles.metaVal }, "25637"),
              ),
            ),
          ),

          // Invoice to block
          React.createElement(
            View,
            { style: styles.invoiceToBlock },
            React.createElement(
              Text,
              { style: styles.invoiceToLabel },
              "Invoice to",
            ),
            React.createElement(
              Text,
              { style: styles.invoiceToName },
              "MATTHEW SMITH",
            ),
            React.createElement(
              Text,
              { style: styles.invoiceToAddr },
              "123 Street Name, City Name,\nState, Country, 12345",
            ),
          ),
        ),
      ),

      // ---- Table ----
      React.createElement(
        View,
        { style: styles.tableSection },
        React.createElement(
          View,
          { style: styles.tableHeader },
          React.createElement(Text, { style: styles.thRef }, "REF"),
          React.createElement(Text, { style: styles.thDesc }, "DESCRIPTION"),
          React.createElement(Text, { style: styles.thQty }, "QTY"),
          React.createElement(Text, { style: styles.thUnit }, "UNLT PRICE"),
          React.createElement(Text, { style: styles.thAmount }, "AMOUNT"),
        ),

        ...items.map((item, idx) =>
          React.createElement(
            View,
            {
              key: idx,
              style: [
                styles.tableRow,
                idx % 2 === 1 ? { backgroundColor: ROW_ALT } : {},
              ],
            },
            React.createElement(
              View,
              { style: styles.tdRef },
              React.createElement(
                View,
                { style: styles.refBadge },
                React.createElement(
                  Text,
                  { style: styles.refBadgeText },
                  String(item.ref),
                ),
              ),
            ),
            React.createElement(Text, { style: styles.tdDesc }, item.desc),
            React.createElement(
              Text,
              { style: styles.tdQty },
              String(item.qty),
            ),
            React.createElement(Text, { style: styles.tdUnit }, fmt(item.unit)),
            React.createElement(
              Text,
              { style: styles.tdAmount },
              fmt(item.amount),
            ),
          ),
        ),
      ),

      // ---- Subtotal ----
      React.createElement(
        View,
        { style: styles.subtotalRow },
        React.createElement(Text, { style: styles.subtotalLabel }, "SUB TOTAL"),
        React.createElement(
          View,
          { style: styles.subtotalValueBox },
          React.createElement(Text, { style: styles.subtotalValue }, "$741"),
        ),
      ),

      // ---- Bottom section: payment to | bank info + signature ----
      React.createElement(
        View,
        { style: styles.bottomSection },
        React.createElement(
          View,
          { style: styles.paymentToBlock },
          React.createElement(
            Text,
            { style: styles.paymentToLabel },
            "Please make payment to",
          ),
          React.createElement(
            Text,
            { style: styles.paymentToName },
            "JAMES SMITH",
          ),
          React.createElement(
            Text,
            { style: styles.paymentToAddr },
            "123 Street Name, City\nName, State, Country, 12345",
          ),
        ),

        React.createElement(
          View,
          { style: styles.bankBlock },
          React.createElement(
            View,
            { style: styles.bankRow },
            React.createElement(Text, { style: styles.bankLabel }, "BANK"),
            React.createElement(
              Text,
              { style: styles.bankSubLabel },
              "Account No",
            ),
            React.createElement(Text, { style: styles.bankColon }, ":"),
            React.createElement(Text, { style: styles.bankVal }, "638 738 856"),
          ),
          React.createElement(
            View,
            { style: styles.bankRow },
            React.createElement(Text, { style: styles.bankLabel }, "INFO"),
            React.createElement(
              Text,
              { style: styles.bankSubLabel },
              "Sort Code",
            ),
            React.createElement(Text, { style: styles.bankColon }, ":"),
            React.createElement(Text, { style: styles.bankVal }, "84 57 39"),
          ),

          React.createElement(
            View,
            { style: styles.signatureArea },
            React.createElement(
              Text,
              { style: styles.signatureScript },
              "Matthew Smith",
            ),
            React.createElement(View, { style: styles.signatureLine }),
            React.createElement(
              Text,
              { style: styles.signatureLabel },
              "Signature",
            ),
          ),
        ),
      ),

      // ---- Footer ----
      React.createElement(View, { style: styles.footerDivider }),
      React.createElement(
        View,
        { style: styles.footerRow },
        React.createElement(
          Text,
          { style: styles.footerText },
          "www.example.com",
        ),
        React.createElement(
          Text,
          { style: styles.footerText },
          "user@example.com",
        ),
        React.createElement(Text, { style: styles.footerText }, "THANK YOU"),
      ),
    ),
  );

(async () => {
  const outPath = path.join(__dirname, "invoice2.pdf");
  await render(React.createElement(InvoiceDocument), outPath);
  console.log("PDF written to", outPath);
})();
