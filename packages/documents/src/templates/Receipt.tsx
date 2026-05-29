import React from 'react';
import { Page, Text, View, Document, Image, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { ReceiptData } from '../types';
import { getA4CommonStyles } from '../styles';

const getStyles = (primaryColor = '#2563eb') => {
  const common = getA4CommonStyles(primaryColor);
  return {
    ...common,
    customerSection: StyleSheet.create({
      view: {
        marginBottom: 25,
      }
    }).view,
    colDesc: { width: '55%' },
    colQty: { width: '10%', textAlign: 'center' as const },
    colPrice: { width: '17%', textAlign: 'right' as const },
    colTotal: { width: '18%', textAlign: 'right' as const },
    summarySection: StyleSheet.create({
      view: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
      }
    }).view,
    summaryBox: {
      width: '40%',
    },
    summaryRow: StyleSheet.create({
      view: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 3,
      }
    }).view,
    totalRow: StyleSheet.create({
      view: {
        borderTop: '2px solid #0f172a',
        marginTop: 5,
        paddingTop: 5,
        fontWeight: 'bold' as const,
        fontSize: 12,
      }
    }).view,
    paymentInfo: StyleSheet.create({
      view: {
        marginTop: 30,
        padding: 10,
        border: '1px solid #e2e8f0',
        borderRadius: 4,
      }
    }).view,
  };
};

export const ReceiptDocument = ({ data }: { data: ReceiptData }) => {
  const styles = getStyles(data.branding?.primaryColor);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerAccent} />
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            {data.branding?.logoUrl && <Image src={data.branding.logoUrl} style={styles.logo} />}
            <Text style={styles.companyName}>{data.branding?.companyName || 'Our Company'}</Text>
            <Text style={styles.metaText}>{data.branding?.companyAddress}</Text>
            <Text style={styles.metaText}>{data.branding?.companyEmail}</Text>
          </View>
          <View style={styles.docTitleSection}>
            <Text style={styles.docTitle}>RECEIPT</Text>
            <Text style={styles.metaText}>Receipt No: {data.receiptNumber}</Text>
            {data.orderNumber && <Text style={styles.metaText}>Order No: {data.orderNumber}</Text>}
            <Text style={styles.metaText}>Date: {format(new Date(data.date), 'MMM dd, yyyy')}</Text>
          </View>
        </View>

        <View style={styles.customerSection}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <Text style={{ fontWeight: 'bold' }}>{data.customer.name}</Text>
          {data.customer.email && <Text>{data.customer.email}</Text>}
          {data.customer.phone && <Text>{data.customer.phone}</Text>}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCol, styles.colDesc]}>Item Description</Text>
            <Text style={[styles.tableHeaderCol, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderCol, styles.colPrice]}>Price</Text>
            <Text style={[styles.tableHeaderCol, styles.colTotal]}>Total</Text>
          </View>
          {data.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{formatCurrency(item.unitPrice || 0)}</Text>
              <Text style={styles.colTotal}>{formatCurrency(item.totalPrice || (item.quantity * (item.unitPrice || 0)))}</Text>
            </View>
          ))}
        </View>

        <View style={styles.summarySection}>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text>Subtotal:</Text>
              <Text>{formatCurrency(data.subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text>Tax:</Text>
              <Text>{formatCurrency(data.tax)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text>Total Paid:</Text>
              <Text>{formatCurrency(data.total)}</Text>
            </View>
          </View>
        </View>

        {data.paymentMethod && (
          <View style={styles.paymentInfo}>
            <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Payment Method</Text>
            <Text>{data.paymentMethod}</Text>
          </View>
        )}

        <Text style={styles.footer}>
          Thank you for your payment!{'\n'}
          {data.branding?.companyName} | {data.branding?.companyWebsite || ''}
        </Text>
      </Page>
    </Document>
  );
};
