import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import { DeliveryNoteData } from "../../types";

const getA4Styles = (primaryColor = "#2563eb") =>
  StyleSheet.create({
    page: {
      padding: 40,
      fontFamily: "Helvetica",
      fontSize: 10,
      color: "#1a1a1a",
      backgroundColor: "#ffffff",
    },
    headerAccent: {
      height: 6,
      backgroundColor: primaryColor,
      marginBottom: 20,
      marginHorizontal: -40,
      marginTop: -40,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 30,
      borderBottom: "2px solid #f1f5f9",
      paddingBottom: 20,
    },
    logo: {
      height: 50,
      marginBottom: 10,
    },
    companyName: {
      fontSize: 16,
      fontWeight: "bold",
    },
    docTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: primaryColor,
      textAlign: "right",
    },
    docMeta: {
      textAlign: "right",
      fontSize: 9,
      marginTop: 2,
      color: "#64748b",
    },
    grid: {
      flexDirection: "row",
      gap: 20,
      marginBottom: 25,
    },
    addressBlock: {
      flex: 1,
    },
    sectionTitle: {
      fontSize: 9,
      fontWeight: "bold",
      textTransform: "uppercase",
      color: primaryColor,
      marginBottom: 5,
      letterSpacing: 0.5,
    },
    table: {
      width: "100%",
      marginBottom: 30,
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: "#f8fafc",
      borderBottom: "1px solid #e2e8f0",
      padding: 8,
    },
    tableHeaderCol: {
      fontSize: 9,
      fontWeight: "bold",
      color: "#475569",
    },
    tableRow: {
      flexDirection: "row",
      borderBottom: "1px solid #f1f5f9",
      padding: 8,
      alignItems: "center",
    },
    colSku: { width: "20%" },
    colDesc: { width: "65%" },
    colQty: { width: "15%", textAlign: "center" },
    footer: {
      marginTop: "auto",
      borderTop: "1px solid #e2e8f0",
      paddingTop: 20,
    },
    signatureArea: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 40,
      gap: 40,
    },
    signBox: {
      flex: 1,
    },
    signLine: {
      borderBottom: "1px solid #94a3b8",
      height: 40,
      marginBottom: 5,
    },
    signLabel: {
      fontSize: 8,
      color: "#64748b",
      textAlign: "center",
      textTransform: "uppercase",
    },
    otpBox: {
      marginTop: 20,
      padding: 10,
      backgroundColor: "#f0f9ff",
      border: "1px dashed #7dd3fc",
      borderRadius: 4,
      alignItems: "center",
    },
    otpLabel: {
      fontSize: 8,
      color: "#0369a1",
      marginBottom: 2,
    },
    otpValue: {
      fontSize: 16,
      fontWeight: "bold",
      letterSpacing: 2,
      color: "#0c4a6e",
    },
  });

const formatAddress = (address: any): string => {
  if (!address) return "";
  if (typeof address === "string") return address;
  const parts = [
    address.street,
    address.city,
    address.state,
    address.zipCode,
    address.country,
  ];
  return parts.filter(Boolean).join(", ");
};

export const DeliveryNoteDocument = ({ data }: { data: DeliveryNoteData }) => {
  const styles = getA4Styles(data.branding?.primaryColor);
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerAccent} />

        <View style={styles.header}>
          <View>
            {data.branding?.logoUrl && (
              <Image src={data.branding.logoUrl} style={styles.logo} />
            )}
            <Text style={styles.companyName}>
              {data.branding?.companyName || "Our Company"}
            </Text>
            <Text style={{ fontSize: 9, color: "#64748b" }}>
              {data.branding?.companyAddress}
            </Text>
          </View>
          <View>
            <Text style={styles.docTitle}>DELIVERY NOTE</Text>
            <Text style={styles.docMeta}>Note No: {data.number}</Text>
            <Text style={styles.docMeta}>Order No: {data.orderNumber}</Text>
            <Text style={styles.docMeta}>
              Date: {format(new Date(data.date), "MMM dd, yyyy")}
            </Text>
          </View>
        </View>

        <View style={styles.grid}>
          <View style={styles.addressBlock}>
            <Text style={styles.sectionTitle}>Customer</Text>
            <Text style={{ fontWeight: "bold", fontSize: 11 }}>
              {data.customer.name}
            </Text>
            {data.customer.email && (
              <Text style={{ fontSize: 9 }}>{data.customer.email}</Text>
            )}
            {data.customer.phone && (
              <Text style={{ fontSize: 9 }}>{data.customer.phone}</Text>
            )}
          </View>
          <View style={styles.addressBlock}>
            <Text style={styles.sectionTitle}>Shipping Address</Text>
            <Text style={{ fontSize: 10 }}>
              {formatAddress(data.shippingAddress)}
            </Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCol, styles.colSku]}>SKU</Text>
            <Text style={[styles.tableHeaderCol, styles.colDesc]}>
              Description
            </Text>
            <Text style={[styles.tableHeaderCol, styles.colQty]}>Qty</Text>
          </View>
          {data.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.colSku, { fontSize: 9 }]}>
                {item.sku || "-"}
              </Text>
              <Text style={[styles.colDesc, { fontSize: 10 }]}>
                {item.description}
              </Text>
              <Text style={[styles.colQty, { fontSize: 10 }]}>
                {item.quantity}
              </Text>
            </View>
          ))}
        </View>

        {data.notes && (
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.sectionTitle}>Notes / Instructions</Text>
            <Text style={{ fontSize: 9, color: "#475569" }}>{data.notes}</Text>
          </View>
        )}

        <View style={styles.signatureArea}>
          <View style={styles.signBox}>
            <View style={styles.signLine} />
            <Text style={styles.signLabel}>Issued By</Text>
          </View>
          <View style={styles.signBox}>
            <View style={styles.signLine} />
            <Text style={styles.signLabel}>
              Received By (Customer Signature)
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={{ fontSize: 8, color: "#94a3b8", textAlign: "center" }}>
            Thank you for your business. Please retain this delivery note for
            your records.
          </Text>
        </View>
      </Page>
    </Document>
  );
};
