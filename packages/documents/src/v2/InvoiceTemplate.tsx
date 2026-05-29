import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { commonStyles as styles } from './document-styles';
import { PDFHeader, PDFFooter, PDFGrid, PDFCol, PDFTable, PDFTableRow, PDFTableCell } from './PDFComponents';

const invoiceStyles = StyleSheet.create({
  totalsSection: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 },
  totalsTable: { width: '30%' },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, borderBottom: '1px solid #eee' },
  grandTotal: { borderTop: '2px solid #2563eb', marginTop: 5, paddingTop: 5, fontWeight: 'bold', fontSize: 12 },
  signatureSection: { marginTop: 40, flexDirection: 'row', justifyContent: 'space-between' },
  signatureBox: { width: '40%', borderTop: '1px solid #333', paddingTop: 5, textAlign: 'center' },
  verificationCode: { marginTop: 10, fontSize: 7, color: '#666', fontFamily: 'Courier' }
});

export interface InvoicePDFData {
  invoiceNumber: string; status: string; date: string; dueDate?: string;
  customerName: string; customerEmail?: string;
  organizationName: string; organizationAddress?: string; logoUrl?: string;
  items: Array<{ itemCode: string; itemName: string; quantity: number; rate: number; amount: number; }>;
  netTotal: number; totalTaxes: number; grandTotal: number;
  amountPaid?: number; balanceDue?: number;
  verificationHash?: string;
}

export const InvoiceTemplate = ({ data }: { data: InvoicePDFData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <PDFHeader logoUrl={data.logoUrl} orgName={data.organizationName} orgAddress={data.organizationAddress} title="INVOICE" number={`#${data.invoiceNumber}`} />
      <View style={styles.section}>
        <PDFGrid>
          <PDFCol label="Bill To" value={data.customerName}>{data.customerEmail && <Text style={styles.tableCell}>{data.customerEmail}</Text>}</PDFCol>
          <PDFCol style={{ alignItems: 'flex-end' }}>
            <View style={{ flexDirection: 'row' }}>
              <View style={{ marginRight: 20 }}><Text style={styles.label}>Date</Text><Text style={styles.value}>{data.date}</Text></View>
              <View><Text style={styles.label}>Status</Text><Text style={styles.value}>{data.status}</Text></View>
            </View>
          </PDFCol>
        </PDFGrid>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Invoice Items</Text>
        <PDFTable>
          <PDFTableRow>
            <PDFTableCell width="40%" isHeader>Item</PDFTableCell>
            <PDFTableCell width="15%" isHeader>Quantity</PDFTableCell>
            <PDFTableCell width="20%" isHeader>Rate</PDFTableCell>
            <PDFTableCell width="25%" isHeader>Amount</PDFTableCell>
          </PDFTableRow>
          {data.items.map((item, i) => (
            <PDFTableRow key={i}>
              <View style={[styles.tableCol, { width: '40%' }]}><Text style={styles.tableCell}>{item.itemName}</Text><Text style={{ fontSize: 7, color: '#666' }}>{item.itemCode}</Text></View>
              <PDFTableCell width="15%">{item.quantity}</PDFTableCell>
              <PDFTableCell width="20%">{item.rate.toFixed(2)}</PDFTableCell>
              <PDFTableCell width="25%">{item.amount.toFixed(2)}</PDFTableCell>
            </PDFTableRow>
          ))}
        </PDFTable>
      </View>
      <View style={invoiceStyles.totalsSection}>
        <View style={invoiceStyles.totalsTable}>
          <View style={invoiceStyles.totalsRow}><Text style={styles.label}>Net Total</Text><Text style={styles.value}>{data.netTotal.toFixed(2)}</Text></View>
          <View style={invoiceStyles.totalsRow}><Text style={styles.label}>Tax</Text><Text style={styles.value}>{data.totalTaxes.toFixed(2)}</Text></View>
          <View style={[invoiceStyles.totalsRow, invoiceStyles.grandTotal]}><Text style={{ fontWeight: 'bold' }}>Grand Total</Text><Text style={{ fontWeight: 'bold' }}>{data.grandTotal.toFixed(2)}</Text></View>
          {data.amountPaid !== undefined && (
            <View style={invoiceStyles.totalsRow}><Text style={styles.label}>Amount Paid</Text><Text style={styles.value}>{data.amountPaid.toFixed(2)}</Text></View>
          )}
          {data.balanceDue !== undefined && (
            <View style={invoiceStyles.totalsRow}><Text style={styles.label}>Balance Due</Text><Text style={[styles.value, { color: data.balanceDue > 0 ? '#dc2626' : '#059669' }]}>{data.balanceDue.toFixed(2)}</Text></View>
          )}
        </View>
      </View>
      <View style={invoiceStyles.signatureSection}>
        <View style={invoiceStyles.signatureBox}><Text style={styles.label}>Customer Signature</Text></View>
        <View style={invoiceStyles.signatureBox}>
          <Text style={styles.label}>Authorized Signature</Text>
          {data.verificationHash && <Text style={invoiceStyles.verificationCode}>Ver: {data.verificationHash}</Text>}
        </View>
      </View>
      <PDFFooter orgName={data.organizationName} docType="Official Invoice Document" />
    </Page>
  </Document>
);
