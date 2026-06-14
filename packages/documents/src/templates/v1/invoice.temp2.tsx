import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { InvoiceData } from '../../types';

// --- 2. STYLING ---
// A modern and professional color palette and style guide.
const colors = {
  primary: '#1A2E44', // Deep Blue/Gray
  secondary: '#5A677D', // Medium Gray
  accent: '#3498db', // Bright Blue
  background: '#FFFFFF',
  lightGray: '#F0F2F5',
  border: '#E1E5E8',
};

const styles = StyleSheet.create({
  // Page and General
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 40,
    backgroundColor: colors.background,
    color: colors.secondary,
  },
  section: {
    marginBottom: 24,
  },
  h1: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
  h2: { fontSize: 14, fontWeight: 'bold', color: colors.primary, textTransform: 'uppercase', marginBottom: 10 },
  h3: { fontSize: 11, fontWeight: 'bold', color: colors.primary },

  // Header
  headerView: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  companyLogo: { width: 100, height: 'auto', marginBottom: 10 },
  companyDetails: { textAlign: 'right' },

  // Client Info
  clientInfoView: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  address: { lineHeight: 1.5 },

  // Table
  table: { width: '100%' },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.lightGray,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    padding: 8,
  },
  tableHeaderCell: {
    fontWeight: 'bold',
    color: colors.primary,
    textTransform: 'uppercase',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    padding: 8,
  },
  tableCell: { color: colors.secondary },
  colDesc: { width: '50%', color: colors.primary },
  colQty: { width: '10%', textAlign: 'center' },
  colPrice: { width: '20%', textAlign: 'right' },
  colAmount: { width: '20%', textAlign: 'right' },

  // Totals
  totalsView: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  totalsBox: {
    width: '40%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: colors.primary,
  },
  grandTotalText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: colors.primary,
  },

  // Notes & Terms
  notesAndTerms: {
    fontSize: 9,
    lineHeight: 1.6,
    marginTop: 30,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 8,
    color: colors.secondary,
  },
  footerQRCode: { width: 50, height: 50 },
});

// --- 3. HELPER FUNCTIONS ---
const formatCurrency = (amount: number, symbol?: string) => `${symbol || ''}${amount.toFixed(2)}`;

// --- 4. SUB-COMPONENTS ---
const InvoiceHeader = ({ invoice }: { invoice: InvoiceData }) => {
  const branding = invoice.branding;
  return (
    <View style={styles.headerView}>
      <View>
        {branding?.logoUrl && <Image style={styles.companyLogo} src={branding.logoUrl} />}
        <Text style={styles.h3}>{branding?.companyName || 'Company Name'}</Text>
        <Text style={styles.address}>
          {branding?.companyAddress || ''}
        </Text>
      </View>
      <View style={styles.companyDetails}>
        <Text style={styles.h1}>INVOICE</Text>
        <Text style={{ color: colors.accent, fontWeight: 'bold' }}>#{invoice.invoiceNumber}</Text>
        <Text>Date Issued: {String(invoice.date)}</Text>
      </View>
    </View>
  );
};

const ClientInformation = ({ invoice }: { invoice: InvoiceData }) => {
  const branding = invoice.branding;
  return (
    <View style={[styles.clientInfoView, styles.section]}>
      <View>
        <Text style={styles.h2}>Billed To</Text>
        <Text style={styles.address}>
          {invoice.customerName}
          {'\n'}
          {invoice.customerAddress}
          {'\n'}
          {invoice.customerEmail}
        </Text>
      </View>
      <View style={{ textAlign: 'right' }}>
        <Text style={styles.h2}>Contact</Text>
        <Text>{branding?.companyEmail}</Text>
        <Text>{branding?.companyPhone}</Text>
        <Text>{branding?.companyWebsite}</Text>
      </View>
    </View>
  );
};

const InvoiceTable = ({ invoice }: { invoice: InvoiceData }) => (
  <View style={[styles.table, styles.section]}>
    <View style={styles.tableHeader}>
      <Text style={[styles.tableHeaderCell, styles.colDesc]}>Description</Text>
      <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
      <Text style={[styles.tableHeaderCell, styles.colPrice]}>Unit Price</Text>
      <Text style={[styles.tableHeaderCell, styles.colAmount]}>Amount</Text>
    </View>
    {invoice.items.map((item, index) => (
      <View key={index} style={styles.tableRow}>
        <Text style={[styles.tableCell, styles.colDesc]}>{item.description || item.itemName}</Text>
        <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
        <Text style={[styles.tableCell, styles.colPrice]}>{formatCurrency(item.unitPrice || item.rate || 0, invoice.currencySymbol)}</Text>
        <Text style={[styles.tableCell, styles.colAmount]}>{formatCurrency(item.totalPrice || item.amount || item.totalPrice || 0, invoice.currencySymbol)}</Text>
      </View>
    ))}
  </View>
);

const InvoiceTotals = ({ invoice }: { invoice: InvoiceData }) => (
  <View style={styles.totalsView}>
    <View style={styles.totalsBox}>
      <View style={styles.totalRow}>
        <Text>Subtotal</Text>
        <Text>{formatCurrency(invoice.subtotal, invoice.currencySymbol)}</Text>
      </View>
      <View style={styles.totalRow}>
        <Text>Tax</Text>
        <Text>{formatCurrency(invoice.tax, invoice.currencySymbol)}</Text>
      </View>
      <View style={styles.grandTotalRow}>
        <Text style={styles.grandTotalText}>Total</Text>
        <Text style={styles.grandTotalText}>{formatCurrency(invoice.total, invoice.currencySymbol)}</Text>
      </View>
    </View>
  </View>
);

const NotesAndTerms = ({ invoice }: { invoice: InvoiceData }) => (
  <View style={styles.notesAndTerms}>
    {invoice.notes && (
      <View style={{ marginBottom: 12 }}>
        <Text style={styles.h3}>Notes</Text>
        <Text>{invoice.notes}</Text>
      </View>
    )}
    {invoice.paymentTerms && (
      <View style={{ marginBottom: 12 }}>
        <Text style={styles.h3}>Payment Terms</Text>
        <Text>{invoice.paymentTerms}</Text>
      </View>
    )}
  </View>
);

const InvoiceFooter = ({ invoice, qrCode }: { invoice: InvoiceData; qrCode?: string }) => (
  <View style={styles.footer} fixed>
    <Text>Thank you for your business.</Text>
    {(qrCode || invoice.qrCode) && <Image style={styles.footerQRCode} src={qrCode || invoice.qrCode} />}
  </View>
);

// --- 5. MAIN COMPONENT ---
export const InvoicePDF = ({ data, qrCode }: { data: InvoiceData; qrCode?: string }) => {
  return (
    <Document title={`Invoice #${data.invoiceNumber}`}>
      <Page size="A4" style={styles.page}>
        <InvoiceHeader invoice={data} />
        <ClientInformation invoice={data} />
        <InvoiceTable invoice={data} />
        <InvoiceTotals invoice={data} />
        <NotesAndTerms invoice={data} />
        <InvoiceFooter invoice={data} qrCode={qrCode} />
      </Page>
    </Document>
  );
};
