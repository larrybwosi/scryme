// components/InvoicePDF.tsx
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { InvoiceData } from './invoice-templates';

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#F5F5F5',
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    flex: 1,
    textAlign: 'right',
  },
  label: {
    color: '#666',
    fontSize: 9,
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    marginBottom: 8,
  },
  invoiceToLabel: {
    fontSize: 9,
    color: '#666',
    marginBottom: 3,
  },
  invoiceToName: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
    paddingBottom: 8,
    marginBottom: 10,
  },
  tableHeaderCell: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  descriptionHeader: {
    flex: 3,
  },
  qtyHeader: {
    flex: 0.5,
    textAlign: 'center',
  },
  rateHeader: {
    flex: 0.7,
    textAlign: 'right',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEEEEE',
  },
  chevron: {
    width: 15,
    fontSize: 12,
    color: '#999',
  },
  description: {
    flex: 3,
    fontSize: 9,
    lineHeight: 1.4,
    paddingRight: 10,
  },
  qty: {
    flex: 0.5,
    textAlign: 'center',
    fontSize: 10,
  },
  rate: {
    flex: 0.7,
    textAlign: 'right',
    fontSize: 10,
  },
  totalsSection: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 10,
    color: '#666',
  },
  totalValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  finalTotal: {
    borderTopWidth: 1,
    borderTopColor: '#CCCCCC',
    paddingTop: 8,
    marginTop: 4,
  },
  finalTotalLabel: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  finalTotalValue: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  paymentSection: {
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  paymentDetails: {
    fontSize: 9,
    marginBottom: 4,
    color: '#666',
  },
  paymentTerms: {
    fontSize: 9,
    lineHeight: 1.5,
    color: '#666',
    marginTop: 4,
  },
  signatureSection: {
    position: 'absolute',
    bottom: 150,
    right: 40,
    alignItems: 'center',
  },
  signatureText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 20,
  },
  signatureLabel: {
    fontSize: 9,
    color: '#666',
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 4,
    width: 120,
    textAlign: 'center',
  },
});

export const InvoicePDF: React.FC<{ data: InvoiceData }> = ({ data }) => {
  // Calculate totals
  const items = data.items.map((item: any) => ({
    description: item.description || item.itemName,
    quantity: item.qty || item.quantity,
    rate: item.rate || item.unitPrice || item.price,
  }));
  const subtotal = data.subtotal;
  const gstRate = data.gstRate || data.taxRate || (data.tax / subtotal) * 100 || 0;
  const gstAmount = data.tax;
  const total = data.total || data.grandTotal;

  const invoiceTo = data.invoiceTo || {
    name: data.client.name,
    address: data.client.address,
    city: '',
    state: '',
    country: '',
    postalCode: '',
  };

  const bankDetails = data.bankDetails || {
    accountNo: 'N/A',
    sortCode: 'N/A',
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Invoice</Text>

          <View style={styles.headerRow}>
            <View style={styles.leftColumn}>
              <Text style={styles.label}>Client Name</Text>
              <Text style={styles.value}>{data.client?.name || (data as any).clientName}</Text>
              <Text style={styles.label}>Company Name</Text>
              <Text style={styles.value}>{data.company?.name || (data as any).companyName}</Text>
              <Text style={styles.label}>Invoice No</Text>
              <Text style={styles.value}>{data.invoiceNumber || (data as any).invoiceNo}</Text>
              <Text style={styles.value}>{data.date}</Text>
            </View>

            <View style={styles.rightColumn}>
              <Text style={styles.invoiceToLabel}>Invoice to</Text>
              <Text style={styles.invoiceToName}>{invoiceTo.name}</Text>
              <Text style={[styles.value, { fontSize: 9 }]}>
                {typeof invoiceTo.address === 'string' ? invoiceTo.address : ''}
              </Text>
              <Text style={[styles.value, { fontSize: 9 }]}>
                {invoiceTo.city}
                {invoiceTo.state ? `, ${invoiceTo.state}` : ''}
                {invoiceTo.country ? `, ${invoiceTo.country}` : ''}
                {invoiceTo.postalCode ? `, ${invoiceTo.postalCode}` : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.descriptionHeader]}>Description</Text>
            <Text style={[styles.tableHeaderCell, styles.qtyHeader]}>QTY</Text>
            <Text style={[styles.tableHeaderCell, styles.rateHeader]}>Rate</Text>
          </View>

          {items.map((item: any, index: number) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.chevron}>›</Text>
              <Text style={styles.description}>{item.description}</Text>
              <Text style={styles.qty}>{item.quantity}</Text>
              <Text style={styles.rate}>
                {data.currencySymbol || '$'}
                {item.rate.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Amount Due</Text>
            <Text style={styles.totalValue}>
              {data.currencySymbol || '$'}
              {subtotal.toFixed(2)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax ({gstRate.toFixed(1)}%)</Text>
            <Text style={styles.totalValue}>
              {data.currencySymbol || '$'}
              {gstAmount.toFixed(2)}
            </Text>
          </View>
          <View style={[styles.totalRow, styles.finalTotal]}>
            <Text style={styles.finalTotalLabel}>Total Amount Due</Text>
            <Text style={styles.finalTotalValue}>
              {data.currencySymbol || '$'}
              {total.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.paymentSection}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <Text style={styles.paymentDetails}>Bank Details</Text>
          <Text style={styles.paymentDetails}>Account No : {bankDetails.accountNo}</Text>
          <Text style={styles.paymentDetails}>Sort Code : {bankDetails.sortCode}</Text>
        </View>

        {/* Payment Terms */}
        <View style={[styles.paymentSection, { marginTop: 15 }]}>
          <Text style={styles.sectionTitle}>Payment Terms</Text>
          <Text style={styles.paymentTerms}>{data.payment?.terms || data.paymentTerms || (data as any).paymentTerms}</Text>
        </View>

        {/* Signature */}
        <View style={styles.signatureSection}>
          <Text style={styles.signatureText}>{data.signature?.name || 'Authorized'}</Text>
          <Text style={styles.signatureLabel}>Signature</Text>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;
