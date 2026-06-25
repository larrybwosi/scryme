import React from 'react';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

export interface CartItem {
  variantId: string
  productName: string
  variantName: string
  sku: string
  quantity: number
  unitPrice: number
  sellingUnit: string
  totalPrice: number
  brand: string
}

export interface ReceiptData {
  items: CartItem[]
  subtotal: number
  taxAmount: number
  total: number
  taxName: string
  taxRate: number
  paymentMethod: string
  cashReceived?: number
  change?: number
  receiptNumber: string
  date: string
  cashier: string
}

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 20,
    fontSize: 10,
  },
  header: {
    textAlign: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 10,
  },
  section: {
    marginBottom: 15,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
    paddingBottom: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E5E5",
  },
  itemName: {
    flex: 2,
    fontSize: 9,
  },
  itemDetails: {
    flex: 1,
    textAlign: "center",
    fontSize: 9,
  },
  itemPrice: {
    flex: 1,
    textAlign: "right",
    fontSize: 9,
  },
  total: {
    fontSize: 14,
    fontWeight: "bold",
    borderTopWidth: 1,
    borderTopColor: "#000000",
    paddingTop: 5,
  },
  footer: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 8,
    color: "#666666",
  },
})

export const ReceiptDocument: React.FC<{ data: any }> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>{data.branding?.companyName || "POS Pro"}</Text>
        <Text style={styles.subtitle}>Sales Receipt</Text>
        <Text>Receipt #: {data.receiptNumber || data.number}</Text>
        <Text>Date: {String(data.date)}</Text>
        <Text>Cashier: {data.cashier || data.createdBy || "System"}</Text>
        {data.locationName && <Text>Location: {data.locationName}</Text>}
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={{ fontWeight: "bold", flex: 2 }}>Item</Text>
          <Text style={{ fontWeight: "bold", flex: 1, textAlign: "center" }}>Qty</Text>
          <Text style={{ fontWeight: "bold", flex: 1, textAlign: "right" }}>Price</Text>
          <Text style={{ fontWeight: "bold", flex: 1, textAlign: "right" }}>Total</Text>
        </View>

        {(data.items || []).map((item: any, index: number) => (
          <View key={index} style={styles.itemRow}>
            <View style={{ flex: 2 }}>
              <Text style={styles.itemName}>{item.productName || item.itemName || "Item"}</Text>
              <Text style={{ fontSize: 8, color: "#666666" }}>{item.variantName || ""}</Text>
              <Text style={{ fontSize: 8, color: "#666666" }}>SKU: {item.sku || "N/A"}</Text>
            </View>
            <Text style={styles.itemDetails}>
              {item.quantity || item.qty || 0} {item.sellingUnit || "units"}
            </Text>
            <Text style={styles.itemPrice}>${(item.unitPrice || item.rate || 0).toFixed(2)}</Text>
            <Text style={styles.itemPrice}>${(item.totalPrice || item.amount || 0).toFixed(2)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text>Subtotal:</Text>
          <Text>${(data.subtotal || 0).toFixed(2)}</Text>
        </View>
        <View style={styles.row}>
          <Text>
            {data.taxName || "Tax"}:
          </Text>
          <Text>${(data.taxAmount || data.tax || 0).toFixed(2)}</Text>
        </View>
        <View style={[styles.row, styles.total]}>
          <Text>Total:</Text>
          <Text>${(data.total || 0).toFixed(2)}</Text>
        </View>

        {data.paymentMethod === "cash" && data.cashReceived && (
          <>
            <View style={styles.row}>
              <Text>Cash Received:</Text>
              <Text>${data.cashReceived.toFixed(2)}</Text>
            </View>
            <View style={styles.row}>
              <Text>Change:</Text>
              <Text>${(data.change || 0).toFixed(2)}</Text>
            </View>
          </>
        )}

        <View style={styles.row}>
          <Text>Payment Method:</Text>
          <Text>{data.paymentMethod.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text>Thank you for your business!</Text>
        <Text>Visit us again soon</Text>
      </View>
    </Page>
  </Document>
)

export const InvoiceDocument: React.FC<{ data: any }> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>{data.branding?.companyName || "POS Pro"}</Text>
        <Text style={styles.subtitle}>INVOICE</Text>
        <Text>Invoice #: {data.invoiceNumber || data.number}</Text>
        <Text>Date: {String(data.date)}</Text>
        {data.locationName && <Text>Location: {data.locationName}</Text>}
      </View>

      <View style={styles.section}>
        <Text style={{ fontWeight: "bold", marginBottom: 10 }}>Bill To:</Text>
        <Text>{data.customerName || data.customer?.name || "Customer Name"}</Text>
        <Text>{data.customerAddress || data.customer?.address || "Customer Address"}</Text>
        <Text>{data.customerEmail || data.customer?.email || ""}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={{ fontWeight: "bold", flex: 2 }}>Description</Text>
          <Text style={{ fontWeight: "bold", flex: 1, textAlign: "center" }}>Qty</Text>
          <Text style={{ fontWeight: "bold", flex: 1, textAlign: "right" }}>Rate</Text>
          <Text style={{ fontWeight: "bold", flex: 1, textAlign: "right" }}>Amount</Text>
        </View>

        {(data.items || []).map((item: any, index: number) => (
          <View key={index} style={styles.itemRow}>
            <View style={{ flex: 2 }}>
              <Text style={styles.itemName}>
                {item.productName || item.itemName || "Item"} - {item.variantName || ""}
              </Text>
              <Text style={{ fontSize: 8, color: "#666666" }}>SKU: {item.sku || "N/A"}</Text>
            </View>
            <Text style={styles.itemDetails}>{item.quantity || item.qty || 0}</Text>
            <Text style={styles.itemPrice}>${(item.unitPrice || item.rate || 0).toFixed(2)}</Text>
            <Text style={styles.itemPrice}>${(item.totalPrice || item.amount || 0).toFixed(2)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text>Subtotal:</Text>
          <Text>${(data.subtotal || 0).toFixed(2)}</Text>
        </View>
        <View style={styles.row}>
          <Text>{data.taxName || "Tax"}:</Text>
          <Text>${(data.taxAmount || data.tax || 0).toFixed(2)}</Text>
        </View>
        <View style={[styles.row, styles.total]}>
          <Text>Total Amount Due:</Text>
          <Text>${(data.total || 0).toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text>Payment Terms: Net 30 days</Text>
        <Text>Thank you for your business!</Text>
      </View>
    </Page>
  </Document>
)
