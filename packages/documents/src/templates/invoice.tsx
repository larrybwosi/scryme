import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { InvoiceData } from './invoice-templates';

// Define a professional color palette
const getColors = (primaryColor = '#1f2937', accentColor = '#ef4444') => ({
  primary: primaryColor, // Dark Gray/Black for text
  secondary: '#6b7280', // Medium Gray for subtitles
  accent: accentColor, // Red for invoice number (or brand color)
  background: '#ffffff',
  lightGray: '#f3f4f6', // For table rows and borders
  headerBG: '#f9fafb',
});

// Create professional styles
const getStyles = (colors: ReturnType<typeof getColors>) => StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 40,
    backgroundColor: colors.background,
    color: '#1f2937',
  },
  // Header Section
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: colors.lightGray,
    paddingBottom: 15,
  },
  companyInfo: { flex: 1 },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  companyDetails: { fontSize: 9, lineHeight: 1.5, color: colors.secondary },
  invoiceTitleSection: { flex: 1, textAlign: 'right' },
  invoiceTitle: { fontSize: 32, fontWeight: 'light', color: colors.primary, marginBottom: 4 },
  invoiceNumber: { fontSize: 12, fontWeight: 'bold', color: colors.accent },
  invoiceDate: { fontSize: 10, color: colors.secondary, marginTop: 8 },
  // Address Section (NEW)
  addressSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 20,
  },
  addressBlock: { flex: 1 },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    paddingBottom: 3,
  },
  addressDetails: {
    fontSize: 10,
    lineHeight: 1.6,
    color: colors.secondary,
  },
  // Invoice Table
  table: { width: '100%', marginBottom: 20 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.headerBG,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.lightGray,
    padding: 6,
  },
  tableHeaderCol: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.lightGray, padding: 8 },
  tableCol: { fontSize: 10, color: colors.secondary },
  colQty: { width: '10%' },
  colDesc: { width: '45%', textAlign: 'left', color: '#1f2937' },
  colPrice: { width: '22%', textAlign: 'right' },
  colAmount: { width: '23%', textAlign: 'right' },
  // Totals Section
  totalsSection: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 20 },
  totalsBox: { width: '45%' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginTop: 6,
    borderTopWidth: 2,
    borderTopColor: colors.primary,
  },
  grandTotalText: { fontWeight: 'bold', fontSize: 14, color: colors.primary },
  // Notes & Terms Section
  notesAndTerms: { marginBottom: 20, lineHeight: 1.6, fontSize: 9, color: colors.secondary },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: { fontSize: 8, color: colors.secondary },
  footerQRCode: { width: 64, height: 64 },
});

// Create Document Component
export const InvoicePDF = ({ data, qrCode }: { data: InvoiceData; qrCode?: string }) => {
  const invoiceData = data;
  const branding = data.organization ? { primaryColor: (data.organization as any).primaryColor } : {};
  const colors = getColors(branding.primaryColor);
  const styles = getStyles(colors);

  const formatCurrency = (amount: number | undefined) => {
    if (typeof amount !== 'number') return `${invoiceData.currencySymbol}0.00`;
    return `${invoiceData.currencySymbol}${amount.toFixed(2)}`;
  };

  // Helper function to format a structured address object (from JSON)
  const formatAddress = (address: any) => {
    if (!address) return 'No address details available.';
    if (typeof address === 'string') return address;

    // Assumes address is a structured object like { street, city, state, zipCode, country }
    const parts = [
      address.street || address.street1,
      address.city && address.state ? `${address.city}, ${address.state} ${address.postalCode || address.zipCode || ''}`.trim() : null,
      address.country,
    ];
    return parts.filter(Boolean).join('\n');
  };

  const logo = invoiceData.logo || invoiceData.logoUrl || (invoiceData.company?.logo || invoiceData.company?.logoUrl);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            {logo && <Image src={logo as string} style={{ height: 40, marginBottom: 8, objectFit: 'contain' }} />}
            <Text style={styles.companyName}>{invoiceData.company.name || 'Company Name'}</Text>
            <Text style={styles.companyDetails}>
              {invoiceData.company.address || 'Company Address'}
              {'\n'}
              {invoiceData.company.email || 'company@email.com'} | {invoiceData.company.phone || 'Company Phone'}
            </Text>
          </View>
          <View style={styles.invoiceTitleSection}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>#{invoiceData.invoiceNumber}</Text>
            <Text style={styles.invoiceDate}>Date Issued: {invoiceData.date}</Text>
          </View>
        </View>

        {/* ✨ Billed To and Shipped To Section */}
        <View style={styles.addressSection}>
          <View style={styles.addressBlock}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            <Text style={styles.addressDetails}>
              {invoiceData.client.name}
              {'\n'}
              {formatAddress(invoiceData.billingAddress || invoiceData.client.address)}
              {'\n'}
              {invoiceData.client.email}
            </Text>
          </View>
          {invoiceData.shippingAddress && (
            <View style={styles.addressBlock}>
              <Text style={styles.sectionTitle}>Ship To</Text>
              <Text style={styles.addressDetails}>
                {invoiceData.client.name}
                {'\n'}
                {formatAddress(invoiceData.shippingAddress)}
              </Text>
            </View>
          )}
        </View>

        {/* Invoice Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCol, styles.colQty]}>QTY</Text>
            <Text style={[styles.tableHeaderCol, styles.colDesc]}>Description</Text>
            <Text style={[styles.tableHeaderCol, styles.colPrice]}>Unit Price</Text>
            <Text style={[styles.tableHeaderCol, styles.colAmount]}>Amount</Text>
          </View>
          {invoiceData.items.map((item: any, index: number) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCol, styles.colQty]}>{item.qty || item.quantity}</Text>
              <Text style={[styles.tableCol, styles.colDesc]}>{item.description || item.itemName}</Text>
              <Text style={[styles.tableCol, styles.colPrice]}>{formatCurrency(item.price || item.unitPrice || item.rate)}</Text>
              <Text style={[styles.tableCol, styles.colAmount]}>{formatCurrency(item.amount || item.total)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text>Subtotal</Text>
              <Text>{formatCurrency(invoiceData.subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text>Shipping</Text>
              <Text>{formatCurrency(invoiceData.shipping)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text>Tax</Text>
              <Text>{formatCurrency(invoiceData.tax)}</Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalText}>Total</Text>
              <Text style={styles.grandTotalText}>{formatCurrency(invoiceData.total || invoiceData.grandTotal)}</Text>
            </View>
          </View>
        </View>

        {/* Notes & Terms */}
        <View style={styles.notesAndTerms}>
          {invoiceData.notes && (
            <>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text>{invoiceData.notes}</Text>
            </>
          )}
          <View style={{ marginTop: 12 }}>
            <Text style={styles.sectionTitle}>Payment Terms</Text>
            <Text>{invoiceData.payment.terms || invoiceData.paymentTerms}</Text>
          </View>
          <View style={{ marginTop: 12 }}>
            <Text style={styles.sectionTitle}>Available Payment Methods</Text>
            <Text>We accept: {(invoiceData.payment.availableMethods || []).join(', ').replace(/_/g, ' ')}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <View>
            <Text style={styles.footerText}>Thank you for your business.</Text>
            <Text style={styles.footerText}>
              {invoiceData.company.name} | {invoiceData.company.website}
            </Text>
          </View>
          {qrCode && <Image style={styles.footerQRCode} src={qrCode} />}
        </View>
      </Page>
    </Document>
  );
};
