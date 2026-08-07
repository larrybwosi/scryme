import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import React from "react";
import { V3DocumentData } from "../types";

// ---- Authentic color palette pulled from the reference design ----
const BG_COLOR = "#D5D6D1";
const ACCENT_ORANGE = "#D44A2A";
const DARK_TEXT = "#222222";

const getStyles = (activeColor: string, activeSecondaryColor: string) => StyleSheet.create({
  page: {
    padding: 45,
    fontSize: 9,
    color: activeSecondaryColor,
    fontFamily: "Helvetica",
    backgroundColor: BG_COLOR,
    flexDirection: "row",
  },

  // ---------- Left Column Layout ----------
  leftColumn: {
    width: "30%",
    flexDirection: "column",
    justifyContent: "space-between",
    paddingRight: 15,
  },
  billToBlock: {
    marginTop: 10,
  },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    marginBottom: 4,
    color: activeSecondaryColor,
  },
  infoText: {
    fontSize: 8.5,
    lineHeight: 1.4,
    color: activeSecondaryColor,
  },
  contactSpacing: {
    marginTop: 10,
  },

  // Vertical / rotated title container
  verticalTitleContainer: {
    marginVertical: 40,
    alignItems: "flex-start",
    paddingLeft: 5,
  },
  verticalTitle: {
    fontSize: 42,
    fontFamily: "Helvetica-Bold",
    color: activeColor,
    transform: "rotate(90deg)",
    transformOrigin: "left top",
    marginLeft: 35,
  },

  leftBottomBlock: {
    marginBottom: 10,
  },
  businessContactBlock: {
    marginBottom: 20,
  },

  // ---------- Right Column Layout ----------
  rightColumn: {
    width: "70%",
    flexDirection: "column",
  },
  headerBlock: {
    alignItems: "flex-end",
    marginBottom: 30,
  },
  mainTitle: {
    fontSize: 44,
    fontFamily: "Helvetica-Bold",
    color: activeColor,
    lineHeight: 1,
  },
  subtitle: {
    fontSize: 10,
    marginTop: 4,
    color: activeSecondaryColor,
  },

  // Meta Info Header (Invoice No, Acc No, Due Date)
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  metaGroup: {
    flexDirection: "column",
    width: "33%",
  },
  metaLabel: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: activeSecondaryColor,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 8.5,
    color: activeSecondaryColor,
  },

  // ---------- Grid/Table Structure ----------
  tableContainer: {
    borderWidth: 1,
    borderColor: activeSecondaryColor,
    flexDirection: "column",
    marginBottom: 25,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: activeSecondaryColor,
  },
  tableHeaderCell: {
    padding: 6,
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    color: activeSecondaryColor,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: activeSecondaryColor,
  },
  tableCell: {
    padding: 6,
    fontSize: 8.5,
    lineHeight: 1.3,
    color: activeSecondaryColor,
  },

  // Column Width Definitions
  colQty: {
    width: "10%",
    borderRightWidth: 1,
    borderColor: activeSecondaryColor,
    textAlign: "center",
  },
  colDesc: { width: "55%", borderRightWidth: 1, borderColor: activeSecondaryColor },
  colUnit: {
    width: "17%",
    borderRightWidth: 1,
    borderColor: activeSecondaryColor,
    textAlign: "right",
  },
  colTotal: { width: "18%", textAlign: "right" },

  itemName: {
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
    color: activeSecondaryColor,
  },
  itemDescription: {
    fontSize: 7.5,
    color: activeSecondaryColor,
    opacity: 0.8,
  },

  // Bottom Integrated Grid Block (Notes & Totals)
  tableFooterRow: {
    flexDirection: "row",
  },
  notesCell: {
    width: "65%",
    padding: 8,
    borderRightWidth: 1,
    borderColor: activeSecondaryColor,
  },
  notesTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    fontStyle: "italic",
    marginBottom: 4,
    color: activeSecondaryColor,
  },
  notesText: {
    fontSize: 7.5,
    fontStyle: "italic",
    lineHeight: 1.3,
    color: activeSecondaryColor,
    opacity: 0.8,
  },
  totalsCellContainer: {
    width: "35%",
    flexDirection: "column",
  },
  totalsSubRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderColor: activeSecondaryColor,
  },
  totalsSubRowLast: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 6,
    fontFamily: "Helvetica-Bold",
    color: activeSecondaryColor,
  },
  totalsLabel: {
    fontSize: 8.5,
    color: activeSecondaryColor,
  },
  totalsValue: {
    fontSize: 8.5,
    textAlign: "right",
    color: activeSecondaryColor,
  },

  // ---------- Footer Elements ----------
  thankYouText: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: activeColor,
    marginBottom: 5,
  },
  horizontalRule: {
    borderBottomWidth: 1,
    borderColor: activeSecondaryColor,
    marginBottom: 10,
  },
  termsBlock: {
    marginTop: 5,
  },
  termsTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    marginBottom: 3,
    color: activeSecondaryColor,
  },
  termsText: {
    fontSize: 7.5,
    fontStyle: "italic",
    lineHeight: 1.3,
    color: activeSecondaryColor,
    opacity: 0.8,
  },
});

export const TemplateFive = ({ data, qrCode }: { data: V3DocumentData; qrCode?: string }) => {
  const {
    type,
    number,
    date,
    company,
    customer,
    items,
    subtotal,
    tax,
    total,
    currency,
    paymentInfo,
    terms,
    primaryColor,
    secondaryColor,
    kraPin,
    kraControlCode,
    kraReceiptNumber,
    signature,
  } = data;

  const activeColor = primaryColor || ACCENT_ORANGE;
  const activeSecondaryColor = secondaryColor || DARK_TEXT;

  const styles = getStyles(activeColor, activeSecondaryColor);

  const fmt = (n: number) =>
    `${currency.symbol}${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ================= LEFT COLUMN ================= */}
        <View style={styles.leftColumn}>
          <View style={styles.billToBlock}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            <Text style={[styles.infoText, { fontFamily: "Helvetica-Bold" }]}>
              {customer.name}
            </Text>
            {customer.address && (
              <Text style={styles.infoText}>{customer.address}</Text>
            )}

            <View style={styles.contactSpacing}>
              <Text style={styles.sectionTitle}>Contact</Text>
              {customer.phone && (
                <Text style={styles.infoText}>{customer.phone}</Text>
              )}
              {customer.email && (
                <Text style={styles.infoText}>{customer.email}</Text>
              )}
              {customer.website && (
                <Text style={styles.infoText}>{customer.website}</Text>
              )}
            </View>
          </View>

          {/* Large Vertical Rotated Document Type */}
          <View style={styles.verticalTitleContainer}>
            <Text style={styles.verticalTitle}>
              {type ? type.toUpperCase() : "INVOICE"}
            </Text>
          </View>

          <View style={styles.leftBottomBlock}>
            <View style={styles.businessContactBlock}>
              <Text style={styles.sectionTitle}>{company.name}</Text>
              {company.phone && (
                <Text style={styles.infoText}>Ph: {company.phone}</Text>
              )}
              {company.email && (
                <Text style={styles.infoText}>Email: {company.email}</Text>
              )}
              {company.address && (
                <Text style={styles.infoText}>{company.address}</Text>
              )}
            </View>

            {paymentInfo && (
              <View>
                <Text style={styles.sectionTitle}>Payment Info</Text>
                <Text style={styles.infoText}>{paymentInfo}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ================= RIGHT COLUMN ================= */}
        <View style={styles.rightColumn}>
          {/* Main Brand Header */}
          <View style={styles.headerBlock}>
            {company.logo && (
              <Image src={company.logo} style={{ width: 120, height: 60, marginBottom: 10, objectFit: 'contain' }} />
            )}
            <Text style={styles.mainTitle}>{company.name}</Text>
            {company.slogan && <Text style={styles.subtitle}>{company.slogan}</Text>}
          </View>

          {/* Metadata Block */}
          <View style={styles.metaRow}>
            <View style={styles.metaGroup}>
              <Text style={styles.metaLabel}>{type === 'invoice' ? 'Invoice No' : 'Receipt No'}</Text>
              <Text style={styles.metaValue}>#{number}</Text>
            </View>
            <View style={styles.metaGroup}>
              <Text style={styles.metaLabel}>Date</Text>
              <Text style={styles.metaValue}>{date}</Text>
            </View>
            <View style={styles.metaGroup}>
              {qrCode && (
                <Image src={qrCode} style={{ width: 40, height: 40 }} />
              )}
            </View>
          </View>

          {/* Unified Document Grid/Table */}
          <View style={styles.tableContainer}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
              <Text style={[styles.tableHeaderCell, styles.colDesc]}>
                Item Description
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colUnit]}>
                Unit Price
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colTotal]}>
                Total
              </Text>
            </View>

            {/* Table Rows */}
            {items.map((item, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.colQty]}>
                  {item.quantity}
                </Text>
                <View style={[styles.tableCell, styles.colDesc]}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  {item.description && (
                    <Text style={styles.itemDescription}>
                      {item.description}
                    </Text>
                  )}
                </View>
                <Text style={[styles.tableCell, styles.colUnit]}>
                  {fmt(item.unitPrice)}
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

            {/* Integrated Footer Grid (Notes + Totals Summary) */}
            <View style={styles.tableFooterRow}>
              <View style={styles.notesCell}>
                <Text style={styles.notesTitle}>Notes :</Text>
                <Text style={styles.notesText}>
                  Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed
                  diam nonummy nibh euismod tincidunt ut laoreet dolore magna.
                </Text>
              </View>

              <View style={styles.totalsCellContainer}>
                <View style={styles.totalsSubRow}>
                  <Text style={styles.totalsLabel}>Sub Total</Text>
                  <Text style={styles.totalsValue}>{fmt(subtotal)}</Text>
                </View>
                <View style={styles.totalsSubRow}>
                  <Text style={styles.totalsLabel}>Tax</Text>
                  <Text style={styles.totalsValue}>{fmt(tax || 0)}</Text>
                </View>
                <View style={styles.totalsSubRowLast}>
                  <Text style={{ fontFamily: "Helvetica-Bold" }}>
                    Grand Total
                  </Text>
                  <Text style={{ fontFamily: "Helvetica-Bold" }}>
                    {fmt(total)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* KRA Compliance Data */}
          {(kraPin || kraControlCode || kraReceiptNumber) && (
            <View style={{ marginBottom: 15, paddingHorizontal: 5 }}>
              {kraPin && <Text style={{ fontSize: 8 }}>KRA PIN: {kraPin}</Text>}
              {kraControlCode && <Text style={{ fontSize: 8 }}>Control Code: {kraControlCode}</Text>}
              {kraReceiptNumber && <Text style={{ fontSize: 8 }}>Receipt No: {kraReceiptNumber}</Text>}
            </View>
          )}

          {/* Thank You & Terms Section */}
          <View style={{ marginTop: "auto" }}>
            {signature && (
              <View style={{ alignItems: 'flex-end', marginBottom: 15 }}>
                {signature.image && <Image src={signature.image} style={{ width: 100, height: 40, marginBottom: 5 }} />}
                <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}>{signature.name}</Text>
                <Text style={{ fontSize: 8 }}>{signature.title}</Text>
              </View>
            )}
            <Text style={styles.thankYouText}>Thank You</Text>
            <View style={styles.horizontalRule} />

            <View style={styles.termsBlock}>
              <Text style={styles.termsTitle}>Term & condition</Text>
              <Text style={styles.termsText}>
                {terms ||
                  "Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud."}
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default TemplateFive;
