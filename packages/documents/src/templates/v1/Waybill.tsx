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
import { WaybillData, Address } from "../../types";

// --- Types ---
export type WaybillFormat = "A4" | "THERMAL";

// --- Styles: A4 Professional ---
const getA4Styles = (primaryColor = "#2563eb") =>
  StyleSheet.create({
    page: {
      padding: 40,
      fontFamily: "Helvetica",
      fontSize: 10,
      color: "#1a1a1a",
      backgroundColor: "#ffffff",
    },
    // Header with accent bar
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
      alignItems: "flex-start",
      marginBottom: 32,
      paddingBottom: 20,
      borderBottom: "2px solid #f1f5f9",
    },
    logoArea: {
      width: "55%",
    },
    logo: {
      height: 50,
      objectFit: "contain",
      marginBottom: 12,
    },
    companyName: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#0f172a",
      marginBottom: 4,
    },
    serviceType: {
      fontSize: 9,
      color: "#64748b",
      letterSpacing: 0.5,
    },
    docInfo: {
      width: "40%",
      textAlign: "right",
    },
    docTitle: {
      fontSize: 28,
      fontWeight: "bold",
      color: primaryColor,
      marginBottom: 8,
      letterSpacing: 0.5,
    },
    docMeta: {
      fontSize: 9,
      color: "#475569",
      marginBottom: 3,
      fontFamily: "Courier",
    },
    // Addresses Grid - Modern cards
    grid: {
      flexDirection: "row",
      gap: 16,
      marginBottom: 28,
    },
    card: {
      flex: 1,
      border: "1.5px solid #e2e8f0",
      borderRadius: 8,
      overflow: "hidden",
      backgroundColor: "#fafafa",
    },
    cardHeader: {
      backgroundColor: "#f8fafc",
      padding: "10px 14px",
      borderBottom: "1px solid #e2e8f0",
    },
    cardTitle: {
      fontSize: 9,
      fontWeight: "bold",
      textTransform: "uppercase",
      color: primaryColor,
      letterSpacing: 1,
    },
    cardBody: {
      padding: 14,
      backgroundColor: "#ffffff",
    },
    nameText: {
      fontSize: 12,
      fontWeight: "bold",
      marginBottom: 6,
      color: "#0f172a",
    },
    addressText: {
      fontSize: 10,
      color: "#475569",
      marginBottom: 10,
      lineHeight: 1.5,
    },
    contactRow: {
      flexDirection: "row",
      marginTop: 3,
      alignItems: "center",
    },
    contactLabel: {
      width: 45,
      fontSize: 9,
      color: "#94a3b8",
      fontWeight: "bold",
    },
    contactValue: {
      fontSize: 9,
      color: "#1e293b",
    },
    // Reference Section (Replaces Items Table)
    referenceSection: {
      width: "100%",
      marginBottom: 28,
      padding: 20,
      border: "1.5px solid #e2e8f0",
      borderRadius: 8,
      backgroundColor: "#f8fafc",
      alignItems: "center",
      justifyContent: "center",
    },
    referenceLabel: {
      fontSize: 10,
      color: "#64748b",
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    referenceValue: {
      fontSize: 24,
      fontWeight: "bold",
      color: "#0f172a",
      letterSpacing: 1,
    },

    // Notes Section
    notesSection: {
      marginBottom: 28,
      padding: 14,
      backgroundColor: "#fef3c7",
      border: "1px solid #fde68a",
      borderRadius: 8,
      borderLeft: "4px solid #f59e0b",
    },
    notesLabel: {
      fontSize: 9,
      fontWeight: "bold",
      color: "#92400e",
      marginBottom: 6,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    notesText: {
      fontSize: 10,
      color: "#78350f",
      lineHeight: 1.5,
    },
    // Footer
    footer: {
      marginTop: "auto",
      flexDirection: "row",
      borderTop: "2px solid #e2e8f0",
      paddingTop: 20,
      alignItems: "flex-start",
    },
    qrArea: {
      width: "30%",
      alignItems: "center",
    },
    qrImage: {
      width: 90,
      height: 90,
      border: "2px solid #e2e8f0",
      borderRadius: 8,
      padding: 4,
    },
    qrLabel: {
      fontSize: 8,
      color: "#94a3b8",
      marginTop: 6,
      textAlign: "center",
    },
    signatureArea: {
      width: "70%",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingLeft: 30,
      gap: 20,
    },
    signBox: {
      flex: 1,
    },
    signLine: {
      borderBottom: "1.5px solid #cbd5e1",
      height: 50,
      marginBottom: 8,
    },
    signLabel: {
      fontSize: 8,
      color: "#64748b",
      textAlign: "center",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
  });

// --- Styles: Thermal (80mm) - Modern Clean ---
const getThermalStyles = (primaryColor = "#2563eb") =>
  StyleSheet.create({
    page: {
      padding: 12,
      fontSize: 10,
      fontFamily: "Helvetica",
      width: "100%",
      backgroundColor: "#ffffff",
    },
    // Accent bar at top
    accent: {
      height: 4,
      backgroundColor: primaryColor,
      marginHorizontal: -12,
      marginTop: -12,
      marginBottom: 12,
    },
    header: {
      alignItems: "center",
      marginBottom: 12,
      paddingBottom: 10,
      borderBottom: "2px solid #e2e8f0",
    },
    title: {
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 6,
      color: "#0f172a",
    },
    companyText: {
      fontSize: 10,
      marginBottom: 3,
      textAlign: "center",
      color: "#1e293b",
      fontWeight: "bold",
    },
    metaText: {
      fontSize: 9,
      marginBottom: 2,
      textAlign: "center",
      color: "#64748b",
    },
    // Sections
    section: {
      marginVertical: 8,
      paddingBottom: 8,
      borderBottom: "1px solid #e2e8f0",
    },
    sectionTitle: {
      fontSize: 8,
      fontWeight: "bold",
      marginBottom: 6,
      color: primaryColor,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    recipientName: {
      fontSize: 11,
      fontWeight: "bold",
      marginBottom: 4,
      color: "#0f172a",
    },
    recipientAddress: {
      fontSize: 9,
      marginBottom: 4,
      color: "#475569",
      lineHeight: 1.4,
    },
    phoneText: {
      fontSize: 9,
      color: "#1e293b",
      marginBottom: 2,
    },
    // Order ID Box for Thermal
    orderIdBox: {
      marginVertical: 10,
      padding: 8,
      border: "1px dashed #cbd5e1",
      alignItems: "center",
      backgroundColor: "#f8fafc",
    },
    orderIdLabel: {
      fontSize: 8,
      color: "#64748b",
      marginBottom: 2,
    },
    orderIdValue: {
      fontSize: 14,
      fontWeight: "bold",
      color: "#0f172a",
    },
    // QR
    qrContainer: {
      alignItems: "center",
      marginTop: 12,
      paddingTop: 12,
      borderTop: "1px solid #e2e8f0",
    },
    qr: {
      width: 90,
      height: 90,
      border: "2px solid #e2e8f0",
      borderRadius: 6,
      padding: 4,
    },
    qrLabel: {
      fontSize: 8,
      color: "#94a3b8",
      marginTop: 6,
    },
  });

const formatAddress = (address: string | Address | undefined): string => {
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

// --- Component: A4 View ---
const A4Waybill = ({ data }: { data: WaybillData }) => {
  const branding = data.branding;
  const styles = getA4Styles(branding?.primaryColor);
  return (
    <Page size="A4" style={styles.page}>
      {/* Accent Bar */}
      <View style={styles.headerAccent} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoArea}>
          {branding?.logoUrl && (
            <Image src={branding.logoUrl} style={styles.logo} />
          )}
          <Text style={styles.companyName}>
            {branding?.companyName || data.sender.name}
          </Text>
          <Text style={styles.serviceType}>
            {data.meta?.serviceType || "Logistics Service"}
          </Text>
        </View>
        <View style={styles.docInfo}>
          <Text style={styles.docTitle}>WAYBILL</Text>
          <Text style={styles.docMeta}>ORDER NO: {data.orderNumber}</Text>
          <Text style={styles.docMeta}>
            DATE: {format(new Date(data.date), "MMM dd, yyyy HH:mm")}
          </Text>
          <Text style={styles.docMeta}>
            ID: {data.id.slice(-8).toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Address Grid */}
      <View style={styles.grid}>
        {/* Sender */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>From (Sender)</Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.nameText}>{data.sender.name}</Text>
            <Text style={styles.addressText}>
              {formatAddress(data.sender.address)}
            </Text>
            {data.sender.phone && (
              <View style={styles.contactRow}>
                <Text style={styles.contactLabel}>PHONE:</Text>
                <Text style={styles.contactValue}>{data.sender.phone}</Text>
              </View>
            )}
            {data.sender.email && (
              <View style={styles.contactRow}>
                <Text style={styles.contactLabel}>EMAIL:</Text>
                <Text style={styles.contactValue}>{data.sender.email}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Recipient */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>To (Receiver)</Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.nameText}>{data.recipient.name}</Text>
            <Text style={styles.addressText}>
              {formatAddress(data.recipient.address)}
            </Text>
            {data.recipient.phone && (
              <View style={styles.contactRow}>
                <Text style={styles.contactLabel}>PHONE:</Text>
                <Text style={styles.contactValue}>{data.recipient.phone}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Notes if present */}
      {data.recipient.notes && (
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>Delivery Instructions</Text>
          <Text style={styles.notesText}>{data.recipient.notes}</Text>
        </View>
      )}

      {/* Reference / Order ID Display (Replaces Item Table) */}
      <View style={styles.referenceSection}>
        <Text style={styles.referenceLabel}>Reference / Order Number</Text>
        <Text style={styles.referenceValue}>{data.orderNumber}</Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.qrArea}>
          {data.qrCodeUrl && (
            <Image src={data.qrCodeUrl} style={styles.qrImage} />
          )}
          <Text style={styles.qrLabel}>Scan to Track</Text>
        </View>
        <View style={styles.signatureArea}>
          <View style={styles.signBox}>
            <View style={styles.signLine} />
            <Text style={styles.signLabel}>Sender Signature</Text>
          </View>
          <View style={styles.signBox}>
            <View style={styles.signLine} />
            <Text style={styles.signLabel}>Receiver Signature</Text>
          </View>
        </View>
      </View>
    </Page>
  );
};

const ThermalWaybill = ({ data }: { data: WaybillData }) => {
  const branding = data.branding;
  const thermalStyles = getThermalStyles(branding?.primaryColor);
  return (
    <Page size={[226, 800]} style={thermalStyles.page}>
      {/* Accent Bar */}
      <View style={thermalStyles.accent} />

      {/* Header */}
      <View style={thermalStyles.header}>
        <Text style={thermalStyles.title}>WAYBILL</Text>
        <Text style={thermalStyles.companyText}>
          {branding?.companyName || data.sender.name}
        </Text>
        <Text style={thermalStyles.metaText}>
          {format(new Date(data.date), "dd/MM/yyyy HH:mm")}
        </Text>
      </View>

      {/* Recipient Section */}
      <View style={thermalStyles.section}>
        <Text style={thermalStyles.sectionTitle}>Deliver To</Text>
        <Text style={thermalStyles.recipientName}>{data.recipient.name}</Text>
        <Text style={thermalStyles.recipientAddress}>
          {formatAddress(data.recipient.address)}
        </Text>
        {data.recipient.phone && (
          <Text style={thermalStyles.phoneText}>📞 {data.recipient.phone}</Text>
        )}
      </View>

      {/* Notes if present */}
      {data.recipient.notes && (
        <View style={thermalStyles.section}>
          <Text style={thermalStyles.sectionTitle}>Notes</Text>
          <Text style={thermalStyles.recipientAddress}>
            {data.recipient.notes}
          </Text>
        </View>
      )}

      {/* Order Reference (Replaces Items) */}
      <View style={thermalStyles.orderIdBox}>
        <Text style={thermalStyles.orderIdLabel}>Order Reference</Text>
        <Text style={thermalStyles.orderIdValue}>{data.orderNumber}</Text>
      </View>

      {/* QR Code */}
      {data.qrCodeUrl && (
        <View style={thermalStyles.qrContainer}>
          <Image src={data.qrCodeUrl} style={thermalStyles.qr} />
          <Text style={thermalStyles.qrLabel}>Scan to Track</Text>
        </View>
      )}
    </Page>
  );
};

// --- Main Component ---
export const WaybillDocument = ({
  data,
  format,
}: {
  data: WaybillData;
  format?: WaybillFormat;
}) => {
  return (
    <Document>
      {format === "THERMAL" ? (
        <ThermalWaybill data={data} />
      ) : (
        <A4Waybill data={data} />
      )}
    </Document>
  );
};

export const WaybillPDF = ({
  data,
  format,
}: {
  data: WaybillData;
  format?: WaybillFormat;
}) => {
  return format === "THERMAL" ? (
    <ThermalWaybill data={data} />
  ) : (
    <A4Waybill data={data} />
  );
};
