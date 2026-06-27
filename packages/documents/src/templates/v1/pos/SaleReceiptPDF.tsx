import React from "react";
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    padding: 12,
    width: "80mm",
    fontSize: 9,
    lineHeight: 1.2,
  },
  header: {
    alignItems: "center",
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    borderBottomStyle: "solid",
  },
  headerLogo: {
    width: 45,
    height: 45,
    marginBottom: 6,
    borderRadius: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 3,
    textAlign: "center",
    letterSpacing: 0.5,
    color: "#1a1a1a",
  },
  headerSubtitle: {
    fontSize: 8,
    textAlign: "center",
    marginBottom: 1,
    color: "#666",
  },
  headerDateTime: {
    fontSize: 8,
    textAlign: "center",
    color: "#666",
    letterSpacing: 0.2,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    borderBottomStyle: "dashed",
    marginVertical: 6,
  },
  strongDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    borderBottomStyle: "solid",
    marginVertical: 6,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
    paddingVertical: 1,
  },
  infoLabel: {
    fontWeight: "bold",
    fontSize: 8,
    color: "#333",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  infoValue: {
    fontSize: 8,
    color: "#1a1a1a",
    textAlign: "right",
  },
  itemsSection: {
    marginVertical: 8,
  },
  itemsHeader: {
    fontWeight: "bold",
    fontSize: 9,
    marginBottom: 4,
    color: "#333",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 2,
    paddingVertical: 1,
  },
  itemDetails: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontSize: 8,
    color: "#1a1a1a",
    marginBottom: 1,
  },
  itemQuantity: {
    fontSize: 7,
    color: "#666",
    fontStyle: "italic",
  },
  itemPrice: {
    fontSize: 8,
    color: "#1a1a1a",
    fontWeight: "bold",
    textAlign: "right",
  },
  summarySection: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#333",
    borderTopStyle: "solid",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
    paddingVertical: 1,
  },
  summaryLabel: {
    fontSize: 8,
    color: "#333",
    textTransform: "uppercase",
    letterSpacing: 0.2,
  },
  summaryValue: {
    fontSize: 8,
    color: "#1a1a1a",
    textAlign: "right",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 2,
    borderTopColor: "#333",
    borderTopStyle: "solid",
  },
  totalLabel: {
    fontWeight: "bold",
    fontSize: 11,
    color: "#1a1a1a",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  totalValue: {
    fontWeight: "bold",
    fontSize: 11,
    color: "#1a1a1a",
    textAlign: "right",
  },
  paymentSection: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    borderTopStyle: "dashed",
  },
  qrSection: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 8,
    paddingVertical: 6,
  },
  qrCode: {
    width: 65,
    height: 65,
    marginBottom: 4,
  },
  qrLabel: {
    fontSize: 7,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
  barcodeSection: {
    alignItems: "center",
    marginVertical: 6,
  },
  barcode: {
    fontSize: 12,
    letterSpacing: 2,
    textAlign: "center",
    color: "#1a1a1a",
    fontWeight: "bold",
  },
  footer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    borderTopStyle: "dashed",
    alignItems: "center",
  },
  footerText: {
    fontSize: 8,
    textAlign: "center",
    color: "#666",
    marginBottom: 2,
  },
  footerBrand: {
    fontSize: 9,
    textAlign: "center",
    color: "#333",
    fontWeight: "bold",
    marginBottom: 3,
  },
  footerTimestamp: {
    fontSize: 6,
    textAlign: "center",
    color: "#999",
  },
});

const formatCurrency = (amount: number): string => {
  return (amount / 100).toFixed(2);
};

const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export interface SaleData {
  saleNumber: string;
  saleDate: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  totalAmount: number;
  discountAmount: number;
  taxAmount: number;
  finalAmount: number;
  amountReceived: number;
  change: number;
  paymentMethod: string;
  paymentStatus: string;
  member?: {
    user: {
      name: string;
    };
  };
  organization: {
    id: string;
    name: string;
    logo?: string;
  };
  location: {
    name: string;
  };
  appliedTaxes: Array<{
    taxAmount: number;
    taxName?: string;
  }>;
  id: string;
}

interface SaleReceiptPDFProps {
  saleData: SaleData;
  qrCodeDataUrl: string;
}

export const SaleReceiptPDF: React.FC<SaleReceiptPDFProps> = ({
  saleData,
  qrCodeDataUrl,
}) => {
  const {
    saleNumber,
    saleDate,
    items,
    totalAmount,
    discountAmount,
    finalAmount,
    amountReceived,
    change,
    paymentMethod,
    paymentStatus,
    member,
    organization,
    location,
    appliedTaxes,
  } = saleData;

  const formattedDate = formatDateTime(saleDate);
  const currentTimestamp = new Date().toLocaleString();

  return (
    <Document>
      <Page size={[226.77, 650]} style={styles.page}>
        <View style={styles.header}>
          {organization.logo && (
            <Image src={organization.logo} style={styles.headerLogo} />
          )}
          <Text style={styles.headerTitle}>{organization.name}</Text>
          <Text style={styles.headerSubtitle}>{location.name}</Text>
          <Text style={styles.headerDateTime}>{formattedDate}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Receipt #:</Text>
          <Text style={styles.infoValue}>{saleNumber}</Text>
        </View>

        {member && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Customer:</Text>
            <Text style={styles.infoValue}>{member.user.name}</Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Status:</Text>
          <Text style={styles.infoValue}>{paymentStatus}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.itemsSection}>
          <Text style={styles.itemsHeader}>Items Purchased</Text>
          {items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>
                ${formatCurrency(item.unitPrice * item.quantity)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>
              ${formatCurrency(totalAmount)}
            </Text>
          </View>

          {discountAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount:</Text>
              <Text style={styles.summaryValue}>
                -${formatCurrency(discountAmount)}
              </Text>
            </View>
          )}

          {appliedTaxes.map((tax, index) => (
            <View key={index} style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{tax.taxName || "Tax"}:</Text>
              <Text style={styles.summaryValue}>
                ${formatCurrency(tax.taxAmount)}
              </Text>
            </View>
          ))}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>
              ${formatCurrency(finalAmount)}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.paymentSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Payment Method:</Text>
            <Text style={styles.infoValue}>{paymentMethod}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Amount Received:</Text>
            <Text style={styles.infoValue}>
              ${formatCurrency(amountReceived)}
            </Text>
          </View>

          {change > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Change:</Text>
              <Text style={styles.infoValue}>${formatCurrency(change)}</Text>
            </View>
          )}
        </View>

        <View style={styles.strongDivider} />

        <View style={styles.qrSection}>
          <Image src={qrCodeDataUrl} style={styles.qrCode} />
          <Text style={styles.qrLabel}>Scan for digital receipt</Text>
        </View>

        <View style={styles.barcodeSection}>
          <Text style={styles.barcode}>* {saleNumber} *</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Thank you for your business!</Text>
          <Text style={styles.footerBrand}>{organization.name}</Text>
          <Text style={styles.footerTimestamp}>
            Generated: {currentTimestamp}
          </Text>
        </View>
      </Page>
    </Document>
  );
};
