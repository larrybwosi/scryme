import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { InvoiceData } from '../../types';

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
  // Address Section
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
  watermark: {
    position: 'absolute',
    top: '35%',
    left: '20%',
    transform: 'rotate(-45deg)',
    fontSize: 60,
    color: 'rgba(200, 200, 200, 0.3)',
    zIndex: -1,
  },
  poweredBy: {
    fontSize: 7,
    color: colors.secondary,
    textAlign: 'center',
    marginTop: 4,
  },
});

// Create Document Component
export const InvoicePDF = ({ data, qrCode }: { data: InvoiceData; qrCode?: string }) => {
  const branding = data.branding;
  const colors = getColors(branding?.primaryColor);
  const styles = getStyles(colors);

  const formatCurrency = (amount: number | undefined) => {
    if (typeof amount !== 'number' || isNaN(amount)) return `${data.currencySymbol || ''}0.00`;
    return `${data.currencySymbol || ''}${amount.toFixed(2)}`;
  };

  const logo = branding?.logoUrl;
  const companyName = branding?.companyName || 'Company Name';
  const companyAddress = branding?.companyAddress || '';
  const companyEmail = branding?.companyEmail || '';
  const companyPhone = branding?.companyPhone || '';
  const companyWebsite = branding?.companyWebsite || '';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {branding?.watermarkText && (
          <Text style={styles.watermark} fixed>
            {branding.watermarkText}
          </Text>
        )}

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            {logo && <Image src={logo} style={{ height: 40, marginBottom: 8, objectFit: 'contain' }} />}
            <Text style={styles.companyName}>{companyName}</Text>
            <Text style={styles.companyDetails}>
              {companyAddress}
              {'\n'}
              {companyEmail} | {companyPhone}
            </Text>
          </View>
          <View style={styles.invoiceTitleSection}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>#{data.invoiceNumber}</Text>
            <Text style={styles.invoiceDate}>Date Issued: {String(data.date)}</Text>
          </View>
        </View>

        {/* Billed To Section */}
        <View style={styles.addressSection}>
          <View style={styles.addressBlock}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            <Text style={styles.addressDetails}>
              {data.customerName}
              {data.customerEmail ? `\n${data.customerEmail}` : ''}
              {data.customerPhone ? `\n${data.customerPhone}` : ''}
              {data.customerAddress ? `\n${data.customerAddress}` : ''}
            </Text>
          </View>
          <View style={[styles.addressBlock, { alignItems: 'flex-end' }]}>
             {data.locationName && (
                <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                  <Text style={styles.sectionTitle}>Location: </Text>
                  <Text style={styles.addressDetails}>{data.locationName}</Text>
                </View>
              )}
              {data.createdBy && (
                <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                  <Text style={styles.sectionTitle}>Prepared By: </Text>
                  <Text style={styles.addressDetails}>{data.createdBy}</Text>
                </View>
              )}
              {data.status && (
                <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                  <Text style={styles.sectionTitle}>Status: </Text>
                  <Text style={[styles.addressDetails, { color: data.status === 'PAID' ? '#059669' : '#dc2626', fontWeight: 'bold' }]}>{data.status}</Text>
                </View>
              )}
              {data.tags && data.tags.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', marginTop: 4 }}>
                  {data.tags.map((tag, i) => (
                    <View key={i} style={{ backgroundColor: colors.lightGray, paddingHorizontal: 4, paddingVertical: 2, borderRadius: 2, marginLeft: 4, marginBottom: 2 }}>
                      <Text style={{ fontSize: 7, color: colors.primary, fontWeight: 'bold' }}>{tag.toUpperCase()}</Text>
                    </View>
                  ))}
                </View>
              )}
          </View>
        </View>

        {/* Invoice Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCol, styles.colQty]}>QTY</Text>
            <Text style={[styles.tableHeaderCol, styles.colDesc]}>Description</Text>
            <Text style={[styles.tableHeaderCol, styles.colPrice]}>Unit Price</Text>
            <Text style={[styles.tableHeaderCol, styles.colAmount]}>Amount</Text>
          </View>
          {(data.items || []).map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCol, styles.colQty]}>{item.quantity || 0}</Text>
              <Text style={[styles.tableCol, styles.colDesc]}>{item.description || item.itemName || 'Item'}</Text>
              <Text style={[styles.tableCol, styles.colPrice]}>{formatCurrency(item.unitPrice || item.rate || 0)}</Text>
              <Text style={[styles.tableCol, styles.colAmount]}>{formatCurrency(item.totalPrice || item.amount || 0)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text>Subtotal</Text>
              <Text>{formatCurrency(data.subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text>Shipping</Text>
              <Text>{formatCurrency(data.shipping)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text>Tax</Text>
              <Text>{formatCurrency(data.tax)}</Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalText}>Total</Text>
              <Text style={styles.grandTotalText}>{formatCurrency(data.total)}</Text>
            </View>
          </View>
        </View>

        {/* Notes & Terms */}
        <View style={styles.notesAndTerms}>
          {data.notes && (
            <>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text>{data.notes}</Text>
            </>
          )}
          {data.paymentTerms && (
            <View style={{ marginTop: 12 }}>
              <Text style={styles.sectionTitle}>Payment Terms</Text>
              <Text>{data.paymentTerms}</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <View>
            <Text style={styles.footerText}>{data.footerText || 'Thank you for your business.'}</Text>
            <Text style={styles.footerText}>
              {companyName} | {companyWebsite}
            </Text>
            {branding?.showPoweredBy !== false && (
              <Text style={styles.poweredBy}>Powered by Scryme</Text>
            )}
          </View>
          {branding?.customFields && branding.customFields.length > 0 && (
            <View style={{ textAlign: 'right' }}>
              {branding.customFields.map((field, index) => (
                <Text key={index} style={styles.footerText}>
                  {field.label}: {field.value}
                </Text>
              ))}
            </View>
          )}
          {(qrCode || data.qrCode) && <Image style={styles.footerQRCode} src={qrCode || data.qrCode} />}
        </View>
      </Page>
    </Document>
  );
};
