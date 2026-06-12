import React from 'react';
import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer';
import { InvoiceData } from './invoice-templates';

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 0, // Page padding is handled by sections
    fontSize: 9,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
  },
  // Header section
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 30, // Reduced from 40
    paddingBottom: 20, // Reduced from 30
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#14B8A6', // Teal color from original
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  companyInfo: {
    flexDirection: 'column',
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  companyTagline: {
    fontSize: 8,
    color: '#6B7280', // Changed from teal to gray to match target
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  headerText: {
    fontSize: 8,
    color: '#6B7280',
    marginBottom: 2,
  },
  // NEW: Section for Client + Invoice Details
  introSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    marginTop: 15, // Reduced from 20
    marginBottom: 20, // Reduced from 25
  },
  // Client Info Section (Now on left)
  clientSection: {
    flex: 1.2, // Give it slightly more space
    paddingRight: 40,
  },
  clientTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  clientText: {
    fontSize: 8,
    color: '#6B7280',
    marginBottom: 2,
  },
  websiteLink: {
    fontSize: 8,
    color: '#14B8A6',
    marginTop: 5,
    textDecoration: 'none',
  },
  // NEW: Invoice Details Section (Now on right)
  invoiceDetailsSection: {
    flex: 0.8,
    alignItems: 'flex-end',
  },
  invoiceTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15, // Reduced from 20
    textAlign: 'right',
  },
  detailsGrid: {
    width: '100%',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 5,
  },
  infoLabel: {
    fontSize: 8,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  infoValueLarge: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  // Table section
  tableContainer: {
    paddingHorizontal: 40,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#14B8A6', // Using original teal
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  descriptionHeader: {
    flex: 3,
  },
  quantityHeader: {
    flex: 0.7,
    textAlign: 'center',
  },
  priceHeader: {
    flex: 1,
    textAlign: 'right',
  },
  totalHeader: {
    flex: 1,
    textAlign: 'right',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10, // Reduced from 12
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableRowAlternate: {
    backgroundColor: '#F8F9FA', // Light gray for alternate rows
  },
  tableCell: {
    fontSize: 8,
    color: '#374151',
  },
  itemDescription: {
    flex: 3,
  },
  itemTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 3,
  },
  itemDetails: {
    fontSize: 7,
    color: '#6B7280',
    lineHeight: 1.4,
  },
  itemQuantity: {
    flex: 0.7,
    textAlign: 'center',
  },
  itemPrice: {
    flex: 1,
    textAlign: 'right',
  },
  itemTotal: {
    flex: 1,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  // Bottom Section
  bottomSection: {
    paddingHorizontal: 40,
    paddingTop: 15, // Reduced from 20
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  leftBottom: {
    flex: 1,
    paddingRight: 20,
  },
  rightBottom: {
    width: '40%',
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  termsValue: {
    fontSize: 8,
    color: '#6B7280',
    fontWeight: 'normal',
  },
  paymentText: {
    fontSize: 7,
    color: '#6B7280',
    lineHeight: 1.5,
  },
  // Totals
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  totalLabel: {
    fontSize: 8,
    color: '#6B7280',
  },
  totalValue: {
    fontSize: 8,
    color: '#1F2937',
    fontWeight: 'bold',
  },
  discountValue: {
    fontSize: 8,
    color: '#EF4444', // Red for discount
    fontWeight: 'bold',
  },
  grandTotalRow: {
    backgroundColor: '#14B8A6', // Using original teal
    marginTop: 2,
  },
  grandTotalLabel: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  grandTotalValue: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  // Signature Section
  signatureSection: {
    paddingHorizontal: 40,
    paddingTop: 20, // Reduced from 30
    alignItems: 'flex-end',
  },
  signatureName: {
    fontSize: 10,
    color: '#1F2937',
    marginBottom: 2,
  },
  signatureTitle: {
    fontSize: 8,
    color: '#6B7280',
  },
  thankYou: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1F2937',
    paddingHorizontal: 40,
    marginTop: 15, // Reduced from 20
    marginBottom: 10, // Reduced from 15
    paddingBottom: 80, // Reduced from 100. IMPORTANT: Padding to clear the absolute footer
  },
  // Footer
  footer: {
    backgroundColor: '#343A40', // Darker gray from target
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    paddingHorizontal: 40,
  },
  footerTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  footerText: {
    fontSize: 7,
    color: '#D1D5DB',
    lineHeight: 1.5,
    marginBottom: 10,
  },
  footerWebsite: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'right',
  },
});

export const ModernInvoicePDF: React.FC<{ data: InvoiceData }> = ({ data: invoiceData }) => {
  const data = {
    ...invoiceData,
    companyName: invoiceData.companyName || invoiceData.company.name,
    companyTagline: invoiceData.companyTagline || invoiceData.company.tagline || '',
    companyAddress: invoiceData.companyAddress || {
      city: invoiceData.company.city || '',
      street: invoiceData.company.address,
      zipCode: '',
    },
    companyContact: invoiceData.companyContact || {
      phone: invoiceData.company.phone || '',
      fax: '',
      email: invoiceData.company.email || '',
    },
    invoiceTo: invoiceData.invoiceTo || {
      name: invoiceData.client.name,
      address: typeof invoiceData.client.address === 'string' ? invoiceData.client.address : '',
      phone: invoiceData.client.phone || '',
      fax: '',
      email: invoiceData.client.email || '',
    },
    website: invoiceData.website || invoiceData.company.website || '',
    invoiceDate: invoiceData.date,
    invoiceNo: invoiceData.invoiceNumber,
    items: invoiceData.items.map((item: any) => ({
      description: item.description || item.itemName,
      details: item.details || '',
      quantity: item.qty || item.quantity,
      unitPrice: item.unitPrice || item.price || item.rate,
      total: item.amount || item.total,
    })),
    taxRate: invoiceData.taxRate || (invoiceData.tax / invoiceData.subtotal) * 100 || 0,
    discount: invoiceData.discount || 0,
    terms: invoiceData.terms || invoiceData.payment.terms || '',
    paymentInformation: invoiceData.paymentInformation || (invoiceData.payment.availableMethods || []).join(', '),
    signature: invoiceData.signature || { name: '', title: '' },
    termsAndConditions: invoiceData.termsAndConditions || invoiceData.payment.terms || '',
    footerWebsite: invoiceData.footerWebsite || invoiceData.company.website || '',
  };
  // Calculate totals
  const subtotal = invoiceData.subtotal;
  const taxAmount = invoiceData.tax;
  const discountAmount = (invoiceData as any).discountAmount || 0;
  const totalDue = invoiceData.total || invoiceData.grandTotal;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>e</Text>
            </View>
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>{data.companyName}</Text>
              <Text style={styles.companyTagline}>{data.companyTagline}</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <Text style={styles.headerText}>
              {data.companyAddress.city && `${data.companyAddress.city}, `}{data.companyAddress.street} {data.companyAddress.zipCode}
            </Text>
            <Text style={styles.headerText}>Phone: {data.companyContact.phone}</Text>
            <Text style={styles.headerText}>Fax: {data.companyContact.fax}</Text>
            <Text style={styles.headerText}>E-mail: {data.companyContact.email}</Text>
          </View>
        </View>

        {/* NEW: Client + Invoice Info Section */}
        <View style={styles.introSection}>
          {/* Client Information (Left) */}
          <View style={styles.clientSection}>
            <Text style={styles.clientTitle}>Invoice to:</Text>
            <Text style={styles.clientText}>{data.invoiceTo.name}</Text>
            <Text style={styles.clientText}>{data.invoiceTo.address}</Text>
            <Text style={styles.clientText}>Phone: {data.invoiceTo.phone}</Text>
            {data.invoiceTo.fax && <Text style={styles.clientText}>Fax: {data.invoiceTo.fax}</Text>}
            {data.invoiceTo.email && <Text style={styles.clientText}>E-mail: {data.invoiceTo.email}</Text>}
            <Link src={`http://${data.website}`} style={styles.websiteLink}>
              <Text>{data.website}</Text>
            </Link>
          </View>

          {/* Invoice Details (Right) */}
          <View style={styles.invoiceDetailsSection}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <View style={styles.detailsGrid}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Total Due:</Text>
                <Text style={styles.infoValueLarge}>
                  {invoiceData.currencySymbol} {totalDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Invoice Date:</Text>
                <Text style={styles.infoValue}>{data.invoiceDate}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Invoice No:</Text>
                <Text style={styles.infoValue}>{data.invoiceNo}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.descriptionHeader]}>Item Description</Text>
            <Text style={[styles.tableHeaderCell, styles.quantityHeader]}>Quantity</Text>
            <Text style={[styles.tableHeaderCell, styles.priceHeader]}>Unit Price</Text>
            <Text style={[styles.tableHeaderCell, styles.totalHeader]}>Total</Text>
          </View>

          {data.items.map((item, index) => {
            const rowStyle = index % 2 === 1 ? [styles.tableRow, styles.tableRowAlternate] : styles.tableRow;

            return (
              <View key={index} style={rowStyle}>
                <View style={styles.itemDescription}>
                  <Text style={styles.itemTitle}>{item.description}</Text>
                  <Text style={styles.itemDetails}>{item.details}</Text>
                </View>
                <View style={styles.itemQuantity}>
                  <Text style={styles.tableCell}>{item.quantity}</Text>
                </View>
                <View style={styles.itemPrice}>
                  <Text style={styles.tableCell}>
                    {invoiceData.currencySymbol} {item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
                <View style={styles.itemTotal}>
                  <Text style={styles.tableCell}>
                    {invoiceData.currencySymbol} {item.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          <View style={styles.leftBottom}>
            <Text style={styles.sectionTitle}>
              Terms: <Text style={styles.termsValue}>{data.terms}</Text>
            </Text>

            <Text style={[styles.sectionTitle, { marginTop: 15 }]}>Payment Information</Text>
            <Text style={styles.paymentText}>{data.paymentInformation}</Text>
          </View>

          <View style={styles.rightBottom}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{invoiceData.currencySymbol} {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalLabel}>Tax Rate {data.taxRate.toFixed(1)}%</Text>
              <Text style={styles.totalValue}>{invoiceData.currencySymbol} {taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalLabel}>Discount {data.discount}%</Text>
              <Text style={styles.discountValue}>
                - {invoiceData.currencySymbol} {discountAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={[styles.totalsRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Total Due:</Text>
              <Text style={styles.grandTotalValue}>
                {invoiceData.currencySymbol} {totalDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        </View>

        {/* Signature */}
        <View style={styles.signatureSection}>
          <Text style={styles.signatureName}>{data.signature.name}</Text>
          <Text style={styles.signatureTitle}>{data.signature.title}</Text>
        </View>

        {/* Thank You */}
        <Text style={styles.thankYou}>Thank you for your business</Text>

        {/* Footer (Absolute Positioned) */}
        <View style={styles.footer}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, paddingRight: 20 }}>
              <Text style={styles.footerTitle}>Terms & Conditions</Text>
              <Text style={styles.footerText}>{data.termsAndConditions}</Text>
            </View>
            <View style={{ width: '30%', justifyContent: 'flex-end' }}>
              <Link src={`http://${data.footerWebsite}`} style={styles.footerWebsite}>
                <Text>{data.footerWebsite}</Text>
              </Link>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default ModernInvoicePDF;
