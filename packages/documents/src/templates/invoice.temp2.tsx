import { Document, Image, Page, StyleSheet, Text, View, Font } from '@react-pdf/renderer';

// --- 1. TYPE DEFINITIONS ---
// For type safety and better developer experience.
export interface InvoiceItem {
  qty: number;
  description: string;
  price: number;
  amount: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  currencySymbol: string;
  subtotal: number;
  tax: number;
  total: number;
  items: InvoiceItem[];
  company: {
    name: string;
    logoUrl?: string; // Optional company logo
    address: string;
    city: string;
    email: string;
    phone: string;
    website: string;
  };
  client: {
    name: string;
    company?: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    email: string;
  };
  notes?: string;
  payment: {
    terms?: string;
    availableMethods?: string[];
  };
}

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

// TIP: Register custom fonts for a more branded look.
// Font.register({
//   family: 'Lato',
//   fonts: [
//     { src: 'path/to/Lato-Regular.ttf' },
//     { src: 'path/to/Lato-Bold.ttf', fontWeight: 'bold' },
//   ],
// });

const styles = StyleSheet.create({
  // Page and General
  page: {
    fontFamily: 'Helvetica', // Replace with your custom font e.g., 'Lato'
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
// Kept outside the component for clarity and reusability.
const formatCurrency = (amount: number, symbol: string) => `${symbol}${amount.toFixed(2)}`;

const formatClientAddress = (client: InvoiceData['client']) =>
  [
    client.name,
    client.company,
    client.address.street,
    `${client.address.city}, ${client.address.state} ${client.address.zipCode}`,
    client.address.country,
    client.email,
  ]
    .filter(Boolean) // Remove any empty/null parts
    .join('\n');

// --- 4. SUB-COMPONENTS ---
// Breaking down the invoice into smaller, manageable parts.

const InvoiceHeader = ({ invoice }: { invoice: InvoiceData }) => (
  <View style={styles.headerView}>
    <View>
      {invoice.company.logoUrl && <Image style={styles.companyLogo} src={invoice.company.logoUrl} />}
      <Text style={styles.h3}>{invoice.company.name}</Text>
      <Text style={styles.address}>
        {invoice.company.address}
        {'\n'}
        {invoice.company.city}
      </Text>
    </View>
    <View style={styles.companyDetails}>
      <Text style={styles.h1}>INVOICE</Text>
      <Text style={{ color: colors.accent, fontWeight: 'bold' }}>#{invoice.invoiceNumber}</Text>
      <Text>Date Issued: {invoice.date}</Text>
    </View>
  </View>
);

const ClientInformation = ({ invoice }: { invoice: InvoiceData }) => (
  <View style={[styles.clientInfoView, styles.section]}>
    <View>
      <Text style={styles.h2}>Billed To</Text>
      <Text style={styles.address}>{formatClientAddress(invoice.client)}</Text>
    </View>
    <View style={{ textAlign: 'right' }}>
      <Text style={styles.h2}>Contact</Text>
      <Text>{invoice.company.email}</Text>
      <Text>{invoice.company.phone}</Text>
      <Text>{invoice.company.website}</Text>
    </View>
  </View>
);

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
        <Text style={[styles.tableCell, styles.colDesc]}>{item.description}</Text>
        <Text style={[styles.tableCell, styles.colQty]}>{item.qty}</Text>
        <Text style={[styles.tableCell, styles.colPrice]}>{formatCurrency(item.price, invoice.currencySymbol)}</Text>
        <Text style={[styles.tableCell, styles.colAmount]}>{formatCurrency(item.amount, invoice.currencySymbol)}</Text>
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
    {invoice.payment.terms && (
      <View style={{ marginBottom: 12 }}>
        <Text style={styles.h3}>Payment Terms</Text>
        <Text>{invoice.payment.terms}</Text>
      </View>
    )}
    {invoice.payment.availableMethods && (
      <View>
        <Text style={styles.h3}>Payment Methods</Text>
        <Text>We accept: {invoice.payment.availableMethods.join(', ').replace(/_/g, ' ')}</Text>
      </View>
    )}
  </View>
);

const InvoiceFooter = ({ invoice, qrCode }: { invoice: InvoiceData; qrCode?: string }) => (
  <View style={styles.footer} fixed>
    <Text>Thank you for your business.</Text>
    {qrCode && <Image style={styles.footerQRCode} src={qrCode} />}
  </View>
);

// --- 5. MAIN COMPONENT ---
// The final document, composed of all the smaller parts.
export const InvoicePDF = ({ data, qrCode }: { data: InvoiceData; qrCode?: string }) => {
  const invoiceData = data;
  return (
    <Document title={`Invoice #${invoiceData.invoiceNumber}`}>
      <Page size="A4" style={styles.page}>
        <InvoiceHeader invoice={invoiceData} />
        <ClientInformation invoice={invoiceData} />
        <InvoiceTable invoice={invoiceData} />
        <InvoiceTotals invoice={invoiceData} />
        <NotesAndTerms invoice={invoiceData} />
        <InvoiceFooter invoice={invoiceData} qrCode={qrCode} />
      </Page>
    </Document>
  );
};
