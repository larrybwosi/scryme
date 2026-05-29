import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { commonStyles as styles } from './document-styles';
import { PDFHeader, PDFFooter, PDFGrid, PDFCol, PDFTable, PDFTableRow, PDFTableCell } from './PDFComponents';

const receiptStyles = StyleSheet.create({
  totalsSection: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 },
  totalsTable: { width: '40%' },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottom: '1px solid #f3f4f6' },
  grandTotal: { borderTop: '2px solid #10b981', marginTop: 5, paddingTop: 5, fontWeight: 'bold', fontSize: 14, color: '#064e3b' },
  statusBadge: { padding: '4 8', borderRadius: 4, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  paidBadge: { backgroundColor: '#d1fae5', color: '#065f46' },
  infoSection: { marginBottom: 20, padding: 12, backgroundColor: '#f9fafb', borderRadius: 8 },
});

export interface ReceiptPDFData {
  receiptNumber: string;
  transactionId: string;
  date: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  organizationName: string;
  organizationAddress?: string;
  logoUrl?: string;
  paymentMethod: string;
  items: Array<{
    itemName: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  finalTotal: number;
  amountReceived?: number;
  change?: number;
}

export const ReceiptTemplate = ({ data }: { data: ReceiptPDFData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <PDFHeader
        logoUrl={data.logoUrl}
        orgName={data.organizationName}
        orgAddress={data.organizationAddress}
        title="PAYMENT RECEIPT"
        number={`#${data.receiptNumber}`}
      />

      <View style={receiptStyles.infoSection}>
        <PDFGrid>
          <PDFCol label="Customer Details">
            <Text style={styles.value}>{data.customerName}</Text>
            {data.customerEmail && <Text style={{ fontSize: 9, color: '#4b5563' }}>{data.customerEmail}</Text>}
            {data.customerPhone && <Text style={{ fontSize: 9, color: '#4b5563' }}>{data.customerPhone}</Text>}
          </PDFCol>
          <PDFCol style={{ alignItems: 'flex-end' }}>
            <View style={{ flexDirection: 'row', gap: 15 }}>
              <View>
                <Text style={styles.label}>Date</Text>
                <Text style={styles.value}>{data.date}</Text>
              </View>
              <View>
                <Text style={styles.label}>Payment Method</Text>
                <Text style={styles.value}>{data.paymentMethod}</Text>
              </View>
              <View>
                <Text style={[receiptStyles.statusBadge, receiptStyles.paidBadge]}>PAID</Text>
              </View>
            </View>
          </PDFCol>
        </PDFGrid>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transaction Summary</Text>
        <PDFTable>
          <PDFTableRow>
            <PDFTableCell width="50%" isHeader>Description</PDFTableCell>
            <PDFTableCell width="10%" isHeader>Qty</PDFTableCell>
            <PDFTableCell width="20%" isHeader>Unit Price</PDFTableCell>
            <PDFTableCell width="20%" isHeader>Total</PDFTableCell>
          </PDFTableRow>
          {data.items.map((item, i) => (
            <PDFTableRow key={i}>
              <PDFTableCell width="50%">{item.itemName}</PDFTableCell>
              <PDFTableCell width="10%">{item.quantity}</PDFTableCell>
              <PDFTableCell width="20%">{item.rate.toFixed(2)}</PDFTableCell>
              <PDFTableCell width="20%">{item.amount.toFixed(2)}</PDFTableCell>
            </PDFTableRow>
          ))}
        </PDFTable>
      </View>

      <View style={receiptStyles.totalsSection}>
        <View style={receiptStyles.totalsTable}>
          <View style={receiptStyles.totalsRow}>
            <Text style={styles.label}>Subtotal</Text>
            <Text style={styles.value}>{data.subtotal.toFixed(2)}</Text>
          </View>
          {data.discountTotal > 0 && (
            <View style={receiptStyles.totalsRow}>
              <Text style={styles.label}>Discount</Text>
              <Text style={styles.value}>-{data.discountTotal.toFixed(2)}</Text>
            </View>
          )}
          <View style={receiptStyles.totalsRow}>
            <Text style={styles.label}>Tax</Text>
            <Text style={styles.value}>{data.taxTotal.toFixed(2)}</Text>
          </View>
          <View style={[receiptStyles.totalsRow, receiptStyles.grandTotal]}>
            <Text>Amount Paid</Text>
            <Text>{data.finalTotal.toFixed(2)}</Text>
          </View>

          {data.amountReceived !== undefined && (
            <View style={{ marginTop: 10 }}>
              <View style={receiptStyles.totalsRow}>
                <Text style={styles.label}>Cash Received</Text>
                <Text style={styles.value}>{data.amountReceived.toFixed(2)}</Text>
              </View>
              <View style={receiptStyles.totalsRow}>
                <Text style={styles.label}>Change Returned</Text>
                <Text style={styles.value}>{(data.change || 0).toFixed(2)}</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      <View style={{ marginTop: 40, textAlign: 'center' }}>
        <Text style={{ fontSize: 10, color: '#4b5563', fontStyle: 'italic' }}>
          Thank you for your business!
        </Text>
      </View>

      <PDFFooter orgName={data.organizationName} docType="Payment Receipt" />
    </Page>
  </Document>
);
