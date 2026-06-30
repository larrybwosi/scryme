import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import React from "react";
import { V3DocumentData } from "../types";

// ---- Clean corporate color palette pulled from the reference design ----
const DEEP_TEAL = "#0B3C3A";
const DARK_TEXT = "#1A1A1A";
const MUTED_GRAY = "#555555";
const LIGHT_LINE = "#E0E0E0";

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 45,
    fontSize: 9,
    color: DARK_TEXT,
    fontFamily: "Helvetica",
    backgroundColor: "#FFFFFF",
  },

  // ---------- Header Block ----------
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  logoIcon: {
    width: 28,
    height: 24,
    borderWidth: 2,
    borderColor: DEEP_TEAL,
    borderRadius: 4,
    marginRight: 8,
    position: "relative",
  },
  logoInnerCircle: {
    position: "absolute",
    right: -4,
    top: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: DEEP_TEAL,
  },
  logoTextGroup: {
    flexDirection: "column",
  },
  logoMainText: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: DARK_TEXT,
  },
  logoSubText: {
    fontSize: 8,
    color: MUTED_GRAY,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  mainTitle: {
    fontSize: 42,
    fontFamily: "Helvetica-Bold",
    color: DARK_TEXT,
    letterSpacing: 0.5,
  },
  companyWebsite: {
    fontSize: 8,
    color: MUTED_GRAY,
    letterSpacing: 2,
    marginTop: 2,
    textTransform: "uppercase",
  },

  // ---------- Meta & Client Information Section ----------
  infoSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
    marginTop: 15,
  },
  clientBlock: {
    width: "50%",
  },
  toLabel: {
    fontSize: 10,
    color: MUTED_GRAY,
    marginBottom: 4,
  },
  clientName: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: DARK_TEXT,
    marginBottom: 4,
  },
  clientTitle: {
    fontSize: 9,
    color: MUTED_GRAY,
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: DARK_TEXT,
    marginTop: 6,
  },
  infoValue: {
    fontSize: 9,
    color: MUTED_GRAY,
    marginTop: 2,
  },
  metaBlock: {
    width: "40%",
    alignItems: "flex-end",
  },

  // Fake Barcode Layout
  barcodeContainer: {
    flexDirection: "row",
    height: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  barcodeLineThin: {
    width: 1,
    height: 16,
    backgroundColor: DARK_TEXT,
    marginRight: 1,
  },
  barcodeLineThick: {
    width: 3,
    height: 16,
    backgroundColor: DARK_TEXT,
    marginRight: 1,
  },
  barcodeLineMedium: {
    width: 2,
    height: 16,
    backgroundColor: DARK_TEXT,
    marginRight: 1,
  },

  metaInvoiceNoLabel: {
    fontSize: 9,
    color: MUTED_GRAY,
    marginBottom: 2,
  },
  metaInvoiceNoValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: DARK_TEXT,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 4,
    width: "100%",
  },
  metaRowLabel: {
    fontSize: 9,
    color: MUTED_GRAY,
    textAlign: "right",
    width: "60%",
    paddingRight: 10,
  },
  metaRowValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: DARK_TEXT,
    textAlign: "left",
    width: "40%",
  },

  // ---------- Document Table ----------
  tableHeader: {
    flexDirection: "row",
    backgroundColor: DEEP_TEAL,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    color: "#FFFFFF",
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_LINE,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  tableCell: {
    fontSize: 9,
    color: DARK_TEXT,
  },

  // Column Width Layouts
  colNo: { width: "8%", textAlign: "left" },
  colDesc: { width: "47%", textAlign: "left" },
  colPrice: { width: "17%", textAlign: "right", paddingRight: 5 },
  colQty: { width: "11%", textAlign: "center" },
  colTotal: { width: "17%", textAlign: "right" },

  // ---------- Summary / Totals Block ----------
  summarySection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 15,
  },
  totalsContainer: {
    width: "40%",
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  totalsLabel: {
    fontSize: 9,
    color: MUTED_GRAY,
  },
  totalsValue: {
    fontSize: 9,
    color: DARK_TEXT,
    textAlign: "right",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: DEEP_TEAL,
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginTop: 6,
  },
  grandTotalLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
  },
  grandTotalValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    textAlign: "right",
  },

  // ---------- Signature Elements ----------
  signatureSection: {
    marginTop: 10,
    paddingHorizontal: 8,
  },
  signatureName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: DARK_TEXT,
    marginBottom: 2,
  },
  signatureTitle: {
    fontSize: 8,
    color: MUTED_GRAY,
    marginBottom: 8,
  },
  signatureLinePlaceholder: {
    width: 45,
    borderBottomWidth: 1,
    borderBottomColor: DARK_TEXT,
    height: 15,
    marginBottom: 2,
  },

  // ---------- Permanent Footer Matrix ----------
  footerContainer: {
    position: "absolute",
    bottom: 30,
    left: 45,
    right: 45,
  },
  footerDivider: {
    borderBottomWidth: 1,
    borderBottomColor: DARK_TEXT,
    marginBottom: 12,
  },
  footerMatrixRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerMatrixColumn: {
    flexDirection: "column",
    width: "16%",
  },
  footerMatrixLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: DARK_TEXT,
    marginBottom: 4,
  },
  footerMatrixValue: {
    fontSize: 7.5,
    color: MUTED_GRAY,
    lineHeight: 1.2,
  },
});

export const TemplateSeven = ({ data, qrCode }: { data: V3DocumentData; qrCode?: string }) => {
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
    signature,
    primaryColor,
    kraPin,
    kraControlCode,
    kraReceiptNumber,
  } = data;

  const activeColor = primaryColor || DEEP_TEAL;

  const fmt = (n: number) =>
    `${currency.symbol} ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ================= BRANDING HEADER ================= */}
        <View style={styles.headerRow}>
          <View style={styles.logoContainer}>
            {company.logo ? (
              <Image src={company.logo} style={{ width: 80, height: 40, objectFit: 'contain' }} />
            ) : (
              <>
                <View style={[styles.logoIcon, { borderColor: activeColor }]}>
                  <View style={[styles.logoInnerCircle, { backgroundColor: activeColor }]} />
                </View>
                <View style={styles.logoTextGroup}>
                  <Text style={[styles.logoMainText, { color: activeColor }]}>{company.name}</Text>
                  <Text style={styles.logoSubText}>{company.slogan || 'Logo here'}</Text>
                </View>
              </>
            )}
          </View>

          <View style={styles.headerRight}>
            <Text style={[styles.mainTitle, { color: activeColor }]}>
              {type
                ? type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()
                : "Invoice"}
            </Text>
            {company.website && <Text style={styles.companyWebsite}>{company.website}</Text>}
          </View>
        </View>

        {/* ================= CLIENT & META INFORMATION ================= */}
        <View style={styles.infoSection}>
          <View style={styles.clientBlock}>
            <Text style={styles.toLabel}>To</Text>
            <Text style={styles.clientName}>{customer.name}</Text>
            <Text style={styles.clientTitle}>Director</Text>

            <Text style={styles.infoLabel}>Address</Text>
            <Text style={styles.customerAddress}>
              {customer.address || "Example Street, City 55555, State"}
            </Text>

            {customer.email && (
              <>
                <Text style={styles.infoLabel}>E-mail</Text>
                <Text style={styles.infoValue}>{customer.email}</Text>
              </>
            )}

            {customer.phone && (
              <>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{customer.phone}</Text>
              </>
            )}
          </View>

          <View style={styles.metaBlock}>
            {qrCode ? (
              <Image src={qrCode} style={{ width: 60, height: 60, marginBottom: 10 }} />
            ) : (
            /* Elegant Vector Barcode Simulation */
            <View style={styles.barcodeContainer}>
              <View style={styles.barcodeLineThick} />
              <View style={styles.barcodeLineThin} />
              <View style={styles.barcodeLineMedium} />
              <View style={styles.barcodeLineThin} />
              <View style={styles.barcodeLineThick} />
              <View style={styles.barcodeLineMedium} />
              <View style={styles.barcodeLineThin} />
              <View style={styles.barcodeLineThick} />
              <View style={styles.barcodeLineThin} />
              <View style={styles.barcodeLineMedium} />
              <View style={styles.barcodeLineThick} />
            </View>
            )}

            <Text style={styles.metaInvoiceNoLabel}>{type === 'invoice' ? 'Invoice' : 'Receipt'} No.</Text>
            <Text style={styles.metaInvoiceNoValue}>#{number}</Text>

            <View style={styles.metaRow}>
              <Text style={styles.metaRowLabel}>Date :</Text>
              <Text style={styles.metaRowValue}>{date}</Text>
            </View>
            {(kraPin || kraControlCode || kraReceiptNumber) && (
              <View style={{ marginTop: 5 }}>
                {kraPin && (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaRowLabel}>KRA PIN :</Text>
                    <Text style={styles.metaRowValue}>{kraPin}</Text>
                  </View>
                )}
                {kraControlCode && (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaRowLabel}>Control Code :</Text>
                    <Text style={styles.metaRowValue}>{kraControlCode}</Text>
                  </View>
                )}
                {kraReceiptNumber && (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaRowLabel}>Receipt No :</Text>
                    <Text style={styles.metaRowValue}>{kraReceiptNumber}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {/* ================= PRIMARY LINE ITEMS TABLE ================= */}
        <View style={[styles.tableHeader, { backgroundColor: activeColor }]}>
          <Text style={[styles.tableHeaderCell, styles.colNo]}>No.</Text>
          <Text style={[styles.tableHeaderCell, styles.colDesc]}>
            Item Description
          </Text>
          <Text style={[styles.tableHeaderCell, styles.colPrice]}>
            Unit Price
          </Text>
          <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
          <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
        </View>

        {items.map((item, idx) => {
          const itemIndexStr = String(idx + 1).padStart(2, "0") + ".";
          return (
            <View key={idx} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colNo]}>
                {itemIndexStr}
              </Text>
              <Text style={[styles.tableCell, styles.colDesc]}>
                {item.name}
              </Text>
              <Text style={[styles.tableCell, styles.colPrice]}>
                {fmt(item.unitPrice)}
              </Text>
              <Text style={[styles.tableCell, styles.colQty]}>
                {item.quantity}
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
          );
        })}

        {/* ================= FINANCIAL CALCULATION SUMMARY ================= */}
        <View style={styles.summarySection}>
          <View style={styles.totalsContainer}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Sub Total =</Text>
              <Text style={styles.totalsValue}>{fmt(subtotal)}</Text>
            </View>

            {tax > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Tax ({taxRate || 20}%) =</Text>
                <Text style={styles.totalsValue}>{fmt(tax)}</Text>
              </View>
            )}

            {discount !== undefined && discount > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>
                  Discount ({discountRate || 10}%) =
                </Text>
                <Text style={styles.totalsValue}>{fmt(discount)}</Text>
              </View>
            )}

            <View style={[styles.grandTotalRow, { backgroundColor: activeColor }]}>
              <Text style={styles.grandTotalLabel}>Grand Total =</Text>
              <Text style={styles.grandTotalValue}>{fmt(total)}</Text>
            </View>
          </View>
        </View>

        {/* ================= SIGN-OFF COMPONENT ================= */}
        {signature && (
          <View style={styles.signatureSection}>
            {signature.image && <Image src={signature.image} style={{ width: 100, height: 40, marginBottom: 5 }} />}
            <Text style={styles.signatureName}>
              {signature.name}
            </Text>
            <Text style={styles.signatureTitle}>
              {signature.title}
            </Text>
            <View style={[styles.signatureLinePlaceholder, { borderBottomColor: activeColor }]} />
          </View>
        )}

        {/* ================= METRIC FOOTER BAR ================= */}
        <View style={styles.footerContainer} fixed>
          <View style={styles.footerDivider} />
          <View style={styles.footerMatrixRow}>
            <View style={styles.footerMatrixColumn}>
              <Text style={styles.footerMatrixLabel}>Invoice No</Text>
              <Text style={styles.footerMatrixValue}>{number}</Text>
            </View>
            <View style={styles.footerMatrixColumn}>
              <Text style={styles.footerMatrixLabel}>Acc No</Text>
              <Text style={styles.footerMatrixValue}>ABCD12345</Text>
            </View>
            <View style={styles.footerMatrixColumn}>
              <Text style={styles.footerMatrixLabel}>Due Date</Text>
              <Text style={styles.footerMatrixValue}>{date}</Text>
            </View>
            <View style={[styles.footerMatrixColumn, { width: "22%" }]}>
              <Text style={styles.footerMatrixLabel}>Address</Text>
              <Text style={styles.footerMatrixValue}>
                {company.address || "Example Street, City 55555, State"}
              </Text>
            </View>
            <View style={styles.footerMatrixColumn}>
              <Text style={styles.footerMatrixLabel}>Phone</Text>
              <Text style={styles.footerMatrixValue}>
                {company.phone || "555-555-5555"}
              </Text>
            </View>
            <View style={[styles.footerMatrixColumn, { width: "18%" }]}>
              <Text style={styles.footerMatrixLabel}>E-mail</Text>
              <Text style={styles.footerMatrixValue}>
                {company.email || "www.example.com"}
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default TemplateSeven;
