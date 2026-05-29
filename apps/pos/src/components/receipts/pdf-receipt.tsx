'use client';

import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import type { Order } from '@/store/store';
import { format } from 'date-fns';

Font.register({
  family: 'Roboto',
  fonts: [
    { src: '/fonts/Roboto-Regular.ttf' },
    { src: '/fonts/Roboto-Bold.ttf', fontWeight: 'bold' },
    { src: '/fonts/Roboto-Italic.ttf', fontStyle: 'italic' },
  ],
});

Font.register({
  family: 'CourierPrime',
  fonts: [{ src: '/fonts/CourierPrime-Regular.ttf' }, { src: '/fonts/CourierPrime-Bold.ttf', fontWeight: 'bold' }],
});

const styles = StyleSheet.create({
  page: {
    padding: 10,
    fontSize: 10,
    fontFamily: 'Roboto',
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
    borderBottom: '2pt dashed #000',
    paddingBottom: 15,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
    alignSelf: 'center',
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  headerText: {
    fontSize: 10,
    marginTop: 5,
  },
  infoSection: {
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontWeight: 'bold',
  },
  itemsSection: {
    marginTop: 10,
    borderTop: '2pt dashed #000',
    paddingTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottom: '1pt solid #000',
    paddingBottom: 5,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    borderBottom: '1pt solid #eee',
  },
  col1: { width: '40%' },
  col2: { width: '20%', textAlign: 'center' },
  col3: { width: '20%', textAlign: 'right' },
  col4: { width: '20%', textAlign: 'right' },
  totalsSection: {
    marginTop: 15,
    borderTop: '2pt dashed #000',
    paddingTop: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTop: '2pt solid #000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 20,
    textAlign: 'center',
    borderTop: '2pt dashed #000',
    paddingTop: 15,
  },
  qrCode: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    marginTop: 10,
  },
});

interface PDFReceiptProps {
  order: Order;
  businessName: string;
  currency: string;
  taxRate: number;
  receiptConfig: {
    showLogo: boolean;
    logoUrl: string;
    headerText: string;
    footerText: string;
    showAddress: boolean;
    address: string;
    showPhone: boolean;
    phone: string;
    showEmail: boolean;
    email: string;
    showTaxNumber: boolean;
    taxNumber: string;
    showWebsite: boolean;
    website: string;
    showQrCode: boolean;
  };
  qrCodeDataUrl?: string;
}

export const PDFReceipt = ({
  order,
  businessName,
  currency,
  taxRate,
  receiptConfig,
  qrCodeDataUrl,
}: PDFReceiptProps) => (
  <Document>
    <Page size={{ width: 205, height: 700 }} style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        {receiptConfig.showLogo && receiptConfig.logoUrl && (
          <Image src={receiptConfig.logoUrl || '/placeholder.svg'} style={styles.logo} />
        )}
        <Text style={styles.businessName}>{businessName}</Text>
        {receiptConfig.headerText && <Text style={styles.headerText}>{receiptConfig.headerText}</Text>}
        {receiptConfig.showAddress && <Text style={styles.headerText}>{receiptConfig.address}</Text>}
        {receiptConfig.showPhone && <Text style={styles.headerText}>Tel: {receiptConfig.phone}</Text>}
        {receiptConfig.showEmail && <Text style={styles.headerText}>{receiptConfig.email}</Text>}
        {receiptConfig.showWebsite && <Text style={styles.headerText}>{receiptConfig.website}</Text>}
        {receiptConfig.showTaxNumber && <Text style={styles.headerText}>Tax ID: {receiptConfig.taxNumber}</Text>}
      </View>

      {/* Order Info */}
      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Order No:</Text>
          <Text>{order.orderNumber}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Date:</Text>
          <Text>{format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}</Text>
        </View>
        {order.customerName && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Customer:</Text>
            <Text>{order.customerName}</Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <Text style={styles.label}>Type:</Text>
          <Text style={{ textTransform: 'uppercase' }}>{order.orderType}</Text>
        </View>
        {order.tableNumber && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Table:</Text>
            <Text>{order.tableNumber}</Text>
          </View>
        )}
        {order.paymentMethod !== 'pending' && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Payment:</Text>
            <Text style={{ textTransform: 'uppercase' }}>{order.paymentMethod}</Text>
          </View>
        )}
      </View>

      {/* Items */}
      <View style={styles.itemsSection}>
        <View style={styles.tableHeader}>
          <Text style={styles.col1}>Item</Text>
          <Text style={styles.col2}>Qty</Text>
          <Text style={styles.col3}>Price</Text>
          <Text style={styles.col4}>Total</Text>
        </View>
        {order.items.map((item, index) => {
          const itemTotal = (item.selectedUnit?.price || 0) * item.quantity;
          return (
            <View key={index} style={styles.tableRow}>
              <View style={styles.col1}>
                <Text>{item.productName}</Text>
                <Text style={{ fontSize: 8, color: '#666' }}>
                  {item.variantName} - {item.selectedUnit?.unitName}
                </Text>
              </View>
              <Text style={styles.col2}>{item.quantity}</Text>
              <Text style={styles.col3}>
                {currency} {(item.selectedUnit?.price || 0).toLocaleString()}
              </Text>
              <Text style={styles.col4}>
                {currency} {itemTotal.toLocaleString()}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Totals */}
      <View style={styles.totalsSection}>
        <View style={styles.totalRow}>
          <Text>Subtotal:</Text>
          <Text>
            {currency} {order.subTotal.toLocaleString()}
          </Text>
        </View>
        {order.discount > 0 && (
          <View style={styles.totalRow}>
            <Text>Discount:</Text>
            <Text>
              -{currency} {order.discount.toLocaleString()}
            </Text>
          </View>
        )}
        <View style={styles.totalRow}>
          <Text>Tax ({taxRate}%):</Text>
          <Text>
            {currency} {order.taxes.toLocaleString()}
          </Text>
        </View>
        <View style={styles.grandTotal}>
          <Text>TOTAL:</Text>
          <Text>
            {currency} {order.total.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {receiptConfig.footerText && <Text>{receiptConfig.footerText}</Text>}
        {receiptConfig.showQrCode && qrCodeDataUrl && (
          <Image src={qrCodeDataUrl || '/placeholder.svg'} style={styles.qrCode} />
        )}
        <Text style={{ marginTop: 15, fontSize: 8 }}>Powered by Dealio POS System</Text>
      </View>
    </Page>
  </Document>
);
