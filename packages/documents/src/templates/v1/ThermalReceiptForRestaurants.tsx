import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";

// Register a font that supports a wide range of characters, including symbols like currency.
// Ensure you have this font file in your public folder.
Font.register({
  family: "Roboto",
  src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
});

// Thermal printers typically use paper that is 80mm or 58mm wide.
// 80mm is approximately 226 points (at 72 DPI).
const getStyles = (primaryColor = "#000") =>
  StyleSheet.create({
    page: {
      fontFamily: "Roboto",
      fontSize: 9,
      padding: 10,
      width: 226, // 80mm width
      color: "#000",
    },
    header: {
      textAlign: "center",
      marginBottom: 10,
    },
    orgName: {
      fontSize: 14,
      fontWeight: "bold",
      marginBottom: 2,
      color: primaryColor !== "#000" ? primaryColor : "#000",
    },
    headerText: {
      fontSize: 8,
      color: "#333",
    },
    title: {
      fontSize: 12,
      textAlign: "center",
      marginVertical: 8,
      fontWeight: "bold",
    },
    table: {
      display: "flex",
      width: "auto",
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: "#eee",
      borderStyle: "dashed",
      alignItems: "center",
      paddingVertical: 3,
    },
    tableColHeader: {
      fontWeight: "bold",
    },
    colQty: {
      width: "15%",
      textAlign: "left",
    },
    colItem: {
      width: "55%",
      textAlign: "left",
    },
    colTotal: {
      width: "30%",
      textAlign: "right",
    },
    summaryTable: {
      marginTop: 10,
      borderTopWidth: 1,
      borderTopColor: "#000",
      borderStyle: "solid",
      paddingTop: 5,
    },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 2,
    },
    summaryLabel: {
      fontWeight: "bold",
    },
    finalTotal: {
      fontSize: 12,
      fontWeight: "bold",
      color: primaryColor !== "#000" ? primaryColor : "#000",
    },
    footer: {
      textAlign: "center",
      marginTop: 15,
    },
    qrCodeContainer: {
      alignItems: "center",
      marginVertical: 10,
    },
    thankYou: {
      fontSize: 8,
      marginTop: 5,
    },
  });

export interface ThermalReceiptItem {
  id: string;
  quantity: number;
  productName: string;
  totalPrice: number | string;
}

export interface ThermalReceiptData {
  orderNumber: string;
  tableNumber?: string | null;
  placedAt: string | Date;
  member?: { name: string } | null;
  organization: {
    name: string;
    address?: string | null;
    phone?: string | null;
    primaryColor?: string;
  };
  branding?: {
    primaryColor?: string;
  };
  items: ThermalReceiptItem[];
  subTotal: number | string;
  taxAmount: number | string;
  totalAmount: number | string;
}

interface ThermalReceiptPDFProps {
  order: ThermalReceiptData;
  qrCode?: string;
}

export function ThermalReceiptPDF({ order, qrCode }: ThermalReceiptPDFProps) {
  const branding = order.branding || {
    primaryColor: order.organization.primaryColor,
  };
  const styles = getStyles(branding.primaryColor);

  return (
    <Document>
      <Page size={{ width: 226, height: "auto" }} style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.orgName}>{order.organization.name}</Text>
          {order.organization.address && (
            <Text style={styles.headerText}>{order.organization.address}</Text>
          )}
          {order.organization.phone && (
            <Text style={styles.headerText}>
              Phone: {order.organization.phone}
            </Text>
          )}
        </View>

        <Text style={styles.title}>Order: {order.orderNumber}</Text>
        {order.tableNumber && (
          <Text style={styles.title}>Table: {order.tableNumber}</Text>
        )}
        <Text style={styles.headerText}>
          Date: {new Date(order.placedAt).toLocaleString("en-KE")}
        </Text>
        <Text style={styles.headerText}>
          Served by: {order.member?.name || "N/A"}
        </Text>

        <View style={styles.table}>
          {/* Table Header */}
          <View style={[styles.tableRow, { borderBottomColor: "#333" }]}>
            <Text style={[styles.tableColHeader, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableColHeader, styles.colItem]}>Item</Text>
            <Text style={[styles.tableColHeader, styles.colTotal]}>Total</Text>
          </View>
          {/* Table Body */}
          {order.items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colItem}>{item.productName}</Text>
              <Text style={styles.colTotal}>
                {Number(item.totalPrice).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.summaryTable}>
          <View style={styles.summaryRow}>
            <Text>Subtotal</Text>
            <Text>{Number(order.subTotal).toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Tax</Text>
            <Text>{Number(order.taxAmount).toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.finalTotal]}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text>KES {Number(order.totalAmount).toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.headerText}>Scan to Pay</Text>
          <View style={styles.qrCodeContainer}>
            {qrCode && <Image src={qrCode} style={{ width: 80, height: 80 }} />}
          </View>
          <Text style={styles.thankYou}>Thank you for your business!</Text>
        </View>
      </Page>
    </Document>
  );
}
