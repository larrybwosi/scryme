import React from 'react';
import { Document, Image, Page, StyleSheet, Text, View, Font } from '@react-pdf/renderer';
import { InvoiceData } from './invoice-templates';

// Register a professional and clean font (e.g., Lato from Google Fonts)
Font.register({
  family: 'Lato',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/lato/v23/S6uyw4BMUTPHjx4wWw.ttf', fontWeight: 'normal' },
    { src: 'https://fonts.gstatic.com/s/lato/v23/S6u9w4BMUTPHh6UVSwiPHA.ttf', fontWeight: 'bold' },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Lato',
    fontSize: 10,
    padding: 30,
    color: '#333',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#4A90E2',
    paddingBottom: 10,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  invoiceTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  companyInfo: {
    textAlign: 'right',
  },
  section: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  billTo: {
    flex: 1,
  },
  invoiceDetails: {
    flex: 1,
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 5,
  },
  text: {
    fontSize: 10,
    marginBottom: 2,
  },
  label: {
    fontSize: 9,
    color: '#777',
    marginBottom: 2,
  },
  table: {
    width: '100%',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#4A90E2',
    color: '#fff',
    padding: 5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    padding: 5,
    alignItems: 'center',
  },
  tableRowAlt: {
    backgroundColor: '#f9f9f9',
  },
  colDescription: {
    width: '55%',
    fontSize: 10,
  },
  colQty: {
    width: '10%',
    textAlign: 'right',
    fontSize: 10,
  },
  colPrice: {
    width: '17.5%',
    textAlign: 'right',
    fontSize: 10,
  },
  colAmount: {
    width: '17.5%',
    textAlign: 'right',
    fontSize: 10,
  },
  headerText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  totalSection: {
    alignItems: 'flex-end',
    marginTop: 10,
  },
  totalRow: {
    flexDirection: 'row',
    width: '40%',
    justifyContent: 'space-between',
    padding: 3,
  },
  grandTotal: {
    fontWeight: 'bold',
    fontSize: 12,
    marginTop: 5,
    paddingTop: 5,
    borderTopWidth: 2,
    borderTopColor: '#4A90E2',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 9,
    color: '#888',
  },
  qrCode: {
    width: 80,
    height: 80,
  },
});

interface InvoicePDFProps {
  data: InvoiceData;
  qrCode?: string;
}

export const InvoicePDF: React.FC<InvoicePDFProps> = ({ data, qrCode }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.companyName}>{data.company?.name}</Text>
          <Text style={styles.text}>{data.company?.address}</Text>
        </View>
        <View style={styles.companyInfo}>
          <Text style={styles.invoiceTitle}>INVOICE</Text>
          <Text style={styles.text}>#{data.invoiceNumber}</Text>
          <Text style={styles.text}>{data.date}</Text>
        </View>
      </View>

      {/* Bill To & Invoice Details Info */}
      <View style={styles.section}>
        <View style={styles.billTo}>
          <Text style={styles.sectionTitle}>Bill To</Text>
          <Text style={[styles.text, { fontWeight: 'bold' }]}>{data.customerName}</Text>
          <Text style={styles.text}>{data.customerAddress}</Text>
        </View>
      </View>

      {/* Items Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.headerText, styles.colDescription]}>Description</Text>
          <Text style={[styles.headerText, styles.colQty]}>Qty</Text>
          <Text style={[styles.headerText, styles.colPrice]}>Unit Price</Text>
          <Text style={[styles.headerText, styles.colAmount]}>Amount</Text>
        </View>
        {data.items?.map((item: any, i: number) => (
          <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
            <Text style={styles.colDescription}>{item.description || item.itemName}</Text>
            <Text style={styles.colQty}>{item.qty || item.quantity}</Text>
            <Text style={styles.colPrice}>
              {data.currencySymbol}{(item.price || item.unitPrice || item.rate || 0).toFixed(2)}
            </Text>
            <Text style={styles.colAmount}>
              {data.currencySymbol}{(item.amount || item.total || ((item.qty || item.quantity || 0) * (item.price || item.unitPrice || 0))).toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      {/* Totals Section */}
      <View style={styles.totalSection}>
        <View style={styles.totalRow}>
          <Text>Subtotal</Text>
          <Text>{data.currencySymbol}{(data.subtotal || 0).toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text>Tax</Text>
          <Text>{data.currencySymbol}{(data.tax || 0).toFixed(2)}</Text>
        </View>
        <View style={[styles.totalRow, styles.grandTotal]}>
          <Text>Total</Text>
          <Text>{data.currencySymbol}{(data.total || data.grandTotal || 0).toFixed(2)}</Text>
        </View>
      </View>

      {/* Footer with Notes & QR Code */}
      <View style={styles.footer}>
        <View style={{ flex: 1, marginRight: 20 }}>
          {data.notes && (
            <>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.footerText}>{data.notes}</Text>
            </>
          )}
        </View>
        {qrCode && <Image style={styles.qrCode} src={qrCode} />}
      </View>
    </Page>
  </Document>
);