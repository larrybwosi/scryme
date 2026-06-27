import React from "react";
import { Page, Text, View, Document, StyleSheet } from "@react-pdf/renderer";
import { commonStyles as styles } from "./document-styles";
import {
  PDFHeader,
  PDFFooter,
  PDFGrid,
  PDFCol,
  PDFTable,
  PDFTableRow,
  PDFTableCell,
} from "./PDFComponents";
import { InvoiceData } from "../../types";
import { formatCurrency } from "../../utils";

const invoiceStyles = StyleSheet.create({
  totalsSection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
  },
  totalsTable: { width: "30%" },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    borderBottom: "1px solid #eee",
  },
  grandTotal: {
    borderTop: "2px solid #2563eb",
    marginTop: 5,
    paddingTop: 5,
    fontWeight: "bold",
    fontSize: 12,
  },
  signatureSection: {
    marginTop: 40,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureBox: {
    width: "40%",
    borderTop: "1px solid #333",
    paddingTop: 5,
    textAlign: "center",
  },
  verificationCode: {
    marginTop: 10,
    fontSize: 7,
    color: "#666",
    fontFamily: "Courier",
  },
});

export const InvoiceTemplate = ({ data }: { data: InvoiceData }) => {
  const branding = data.branding;
  const logoUrl = branding?.logoUrl;
  const orgName = branding?.companyName;
  const orgAddress = branding?.companyAddress;
  const currencySettings = data.currencySettings || {
    code: data.currency || "USD",
    symbol: data.currencySymbol || "$",
    locale: "en-US",
  };

  const fmt = (val: number) => formatCurrency(val, currencySettings);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PDFHeader
          logoUrl={logoUrl}
          orgName={orgName}
          orgAddress={orgAddress}
          title="INVOICE"
          number={`#${data.invoiceNumber}`}
          primaryColor={branding?.primaryColor}
        />
        <View style={styles.section}>
          <PDFGrid>
            <PDFCol label="Bill To" value={data.customerName}>
              {data.customerEmail && (
                <Text style={styles.tableCell}>{data.customerEmail}</Text>
              )}
              {data.customerPhone && (
                <Text style={styles.tableCell}>{data.customerPhone}</Text>
              )}
              {data.customerAddress && (
                <Text style={styles.tableCell}>{data.customerAddress}</Text>
              )}
            </PDFCol>
            <PDFCol style={{ alignItems: "flex-end" }}>
              <View style={{ flexDirection: "row", marginBottom: 10 }}>
                <View style={{ marginRight: 20 }}>
                  <Text style={styles.label}>Date</Text>
                  <Text style={styles.value}>{String(data.date)}</Text>
                </View>
                <View>
                  <Text style={styles.label}>Status</Text>
                  <Text
                    style={[
                      styles.value,
                      {
                        color:
                          data.status === "PAID" || data.status === "COMPLETED"
                            ? "#059669"
                            : "#dc2626",
                      },
                    ]}
                  >
                    {data.status}
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                {data.locationName && (
                  <View style={{ flexDirection: "row", marginBottom: 2 }}>
                    <Text style={styles.label}>Location: </Text>
                    <Text style={[styles.value, { fontSize: 8 }]}>
                      {data.locationName}
                    </Text>
                  </View>
                )}
                {data.createdBy && (
                  <View style={{ flexDirection: "row", marginBottom: 2 }}>
                    <Text style={styles.label}>Created By: </Text>
                    <Text style={[styles.value, { fontSize: 8 }]}>
                      {data.createdBy}
                    </Text>
                  </View>
                )}
                {data.tags && data.tags.length > 0 && (
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      justifyContent: "flex-end",
                      marginTop: 4,
                    }}
                  >
                    {data.tags.map((tag, i) => (
                      <View
                        key={i}
                        style={{
                          backgroundColor: "#f3f4f6",
                          paddingHorizontal: 4,
                          paddingVertical: 2,
                          borderRadius: 2,
                          marginLeft: 4,
                          marginBottom: 2,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 7,
                            color: "#4b5563",
                            fontWeight: "bold",
                          }}
                        >
                          {tag.toUpperCase()}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </PDFCol>
          </PDFGrid>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invoice Items</Text>
          <PDFTable>
            <PDFTableRow>
              <PDFTableCell width="40%" isHeader>
                Item
              </PDFTableCell>
              <PDFTableCell width="15%" isHeader>
                Quantity
              </PDFTableCell>
              <PDFTableCell width="20%" isHeader>
                Rate
              </PDFTableCell>
              <PDFTableCell width="25%" isHeader>
                Amount
              </PDFTableCell>
            </PDFTableRow>
            {(data.items || []).map((item, i) => (
              <PDFTableRow key={i}>
                <View style={[styles.tableCol, { width: "40%" }]}>
                  <Text style={styles.tableCell}>
                    {item.itemName || item.description || "Item"}
                  </Text>
                  <Text style={{ fontSize: 7, color: "#666" }}>
                    {item.itemCode || item.sku}
                  </Text>
                </View>
                <PDFTableCell width="15%">{item.quantity || 0}</PDFTableCell>
                <PDFTableCell width="20%">
                  {fmt(item.rate || item.unitPrice || 0)}
                </PDFTableCell>
                <PDFTableCell width="25%">
                  {fmt(item.amount || item.totalPrice || 0)}
                </PDFTableCell>
              </PDFTableRow>
            ))}
          </PDFTable>
        </View>
        <View style={invoiceStyles.totalsSection}>
          <View style={invoiceStyles.totalsTable}>
            <View style={invoiceStyles.totalsRow}>
              <Text style={styles.label}>Net Total</Text>
              <Text style={styles.value}>{fmt(data.subtotal || 0)}</Text>
            </View>
            <View style={invoiceStyles.totalsRow}>
              <Text style={styles.label}>Tax</Text>
              <Text style={styles.value}>{fmt(data.tax || 0)}</Text>
            </View>
            <View
              style={[
                invoiceStyles.totalsRow,
                invoiceStyles.grandTotal,
                { borderTopColor: branding?.primaryColor || "#2563eb" },
              ]}
            >
              <Text style={{ fontWeight: "bold" }}>Grand Total</Text>
              <Text style={{ fontWeight: "bold" }}>{fmt(data.total || 0)}</Text>
            </View>
            {data.amountPaid !== undefined && (
              <View style={invoiceStyles.totalsRow}>
                <Text style={styles.label}>Amount Paid</Text>
                <Text style={styles.value}>{fmt(data.amountPaid || 0)}</Text>
              </View>
            )}
            {data.balanceDue !== undefined && (
              <View style={invoiceStyles.totalsRow}>
                <Text style={styles.label}>Balance Due</Text>
                <Text
                  style={[
                    styles.value,
                    { color: data.balanceDue > 0 ? "#dc2626" : "#059669" },
                  ]}
                >
                  {fmt(data.balanceDue || 0)}
                </Text>
              </View>
            )}
          </View>
        </View>
        <View style={invoiceStyles.signatureSection}>
          <View style={invoiceStyles.signatureBox}>
            <Text style={styles.label}>Customer Signature</Text>
          </View>
          <View style={invoiceStyles.signatureBox}>
            <Text style={styles.label}>Authorized Signature</Text>
            {data.verificationHash && (
              <Text style={invoiceStyles.verificationCode}>
                Ver: {data.verificationHash}
              </Text>
            )}
          </View>
        </View>
        <PDFFooter orgName={orgName} docType="Official Invoice Document" />
      </Page>
    </Document>
  );
};

export const InvoiceTemplatePDF = ({ data }: { data: InvoiceData }) => {
  const branding = data.branding;
  const logoUrl = branding?.logoUrl;
  const orgName = branding?.companyName;
  const orgAddress = branding?.companyAddress;

  return (
    <Page size="A4" style={styles.page}>
      <PDFHeader
        logoUrl={logoUrl}
        orgName={orgName}
        orgAddress={orgAddress}
        title="INVOICE"
        number={`#${data.invoiceNumber}`}
      />
      <View style={styles.section}>
        <PDFGrid>
          <PDFCol label="Bill To" value={data.customerName}>
            {data.customerEmail && (
              <Text style={styles.tableCell}>{data.customerEmail}</Text>
            )}
            {data.customerPhone && (
              <Text style={styles.tableCell}>{data.customerPhone}</Text>
            )}
            {data.customerAddress && (
              <Text style={styles.tableCell}>{data.customerAddress}</Text>
            )}
          </PDFCol>
          <PDFCol style={{ alignItems: "flex-end" }}>
            <View style={{ flexDirection: "row", marginBottom: 10 }}>
              <View style={{ marginRight: 20 }}>
                <Text style={styles.label}>Date</Text>
                <Text style={styles.value}>{String(data.date)}</Text>
              </View>
              <View>
                <Text style={styles.label}>Status</Text>
                <Text
                  style={[
                    styles.value,
                    {
                      color:
                        data.status === "PAID" || data.status === "COMPLETED"
                          ? "#059669"
                          : "#dc2626",
                    },
                  ]}
                >
                  {data.status}
                </Text>
              </View>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              {data.locationName && (
                <View style={{ flexDirection: "row", marginBottom: 2 }}>
                  <Text style={styles.label}>Location: </Text>
                  <Text style={[styles.value, { fontSize: 8 }]}>
                    {data.locationName}
                  </Text>
                </View>
              )}
              {data.createdBy && (
                <View style={{ flexDirection: "row", marginBottom: 2 }}>
                  <Text style={styles.label}>Created By: </Text>
                  <Text style={[styles.value, { fontSize: 8 }]}>
                    {data.createdBy}
                  </Text>
                </View>
              )}
              {data.tags && data.tags.length > 0 && (
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    justifyContent: "flex-end",
                    marginTop: 4,
                  }}
                >
                  {data.tags.map((tag, i) => (
                    <View
                      key={i}
                      style={{
                        backgroundColor: "#f3f4f6",
                        paddingHorizontal: 4,
                        paddingVertical: 2,
                        borderRadius: 2,
                        marginLeft: 4,
                        marginBottom: 2,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 7,
                          color: "#4b5563",
                          fontWeight: "bold",
                        }}
                      >
                        {tag.toUpperCase()}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </PDFCol>
        </PDFGrid>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Invoice Items</Text>
        <PDFTable>
          <PDFTableRow>
            <PDFTableCell width="40%" isHeader>
              Item
            </PDFTableCell>
            <PDFTableCell width="15%" isHeader>
              Quantity
            </PDFTableCell>
            <PDFTableCell width="20%" isHeader>
              Rate
            </PDFTableCell>
            <PDFTableCell width="25%" isHeader>
              Amount
            </PDFTableCell>
          </PDFTableRow>
          {(data.items || []).map((item, i) => (
            <PDFTableRow key={i}>
              <View style={[styles.tableCol, { width: "40%" }]}>
                <Text style={styles.tableCell}>
                  {item.itemName || item.description || "Item"}
                </Text>
                <Text style={{ fontSize: 7, color: "#666" }}>
                  {item.itemCode || item.sku}
                </Text>
              </View>
              <PDFTableCell width="15%">{item.quantity || 0}</PDFTableCell>
              <PDFTableCell width="20%">
                {(item.rate || item.unitPrice || 0).toFixed(2)}
              </PDFTableCell>
              <PDFTableCell width="25%">
                {(item.amount || item.totalPrice || 0).toFixed(2)}
              </PDFTableCell>
            </PDFTableRow>
          ))}
        </PDFTable>
      </View>
      <View style={invoiceStyles.totalsSection}>
        <View style={invoiceStyles.totalsTable}>
          <View style={invoiceStyles.totalsRow}>
            <Text style={styles.label}>Net Total</Text>
            <Text style={styles.value}>{(data.subtotal || 0).toFixed(2)}</Text>
          </View>
          <View style={invoiceStyles.totalsRow}>
            <Text style={styles.label}>Tax</Text>
            <Text style={styles.value}>{(data.tax || 0).toFixed(2)}</Text>
          </View>
          <View style={[invoiceStyles.totalsRow, invoiceStyles.grandTotal]}>
            <Text style={{ fontWeight: "bold" }}>Grand Total</Text>
            <Text style={{ fontWeight: "bold" }}>
              {(data.total || 0).toFixed(2)}
            </Text>
          </View>
          {data.amountPaid !== undefined && (
            <View style={invoiceStyles.totalsRow}>
              <Text style={styles.label}>Amount Paid</Text>
              <Text style={styles.value}>
                {(data.amountPaid || 0).toFixed(2)}
              </Text>
            </View>
          )}
          {data.balanceDue !== undefined && (
            <View style={invoiceStyles.totalsRow}>
              <Text style={styles.label}>Balance Due</Text>
              <Text
                style={[
                  styles.value,
                  { color: data.balanceDue > 0 ? "#dc2626" : "#059669" },
                ]}
              >
                {(data.balanceDue || 0).toFixed(2)}
              </Text>
            </View>
          )}
        </View>
      </View>
      <View style={invoiceStyles.signatureSection}>
        <View style={invoiceStyles.signatureBox}>
          <Text style={styles.label}>Customer Signature</Text>
        </View>
        <View style={invoiceStyles.signatureBox}>
          <Text style={styles.label}>Authorized Signature</Text>
          {data.verificationHash && (
            <Text style={invoiceStyles.verificationCode}>
              Ver: {data.verificationHash}
            </Text>
          )}
        </View>
      </View>
      <PDFFooter orgName={orgName} docType="Official Invoice Document" />
    </Page>
  );
};
