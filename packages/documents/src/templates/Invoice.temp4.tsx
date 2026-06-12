import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { InvoiceData } from './invoice-templates';

// --- Styles ---

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  invoiceInfo: {
    fontSize: 9,
    color: '#666',
  },
  invoiceLabel: {
    marginBottom: 3,
  },
  businessSection: {
    alignItems: 'flex-end',
    maxWidth: '50%',
  },
  businessTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 4,
    textAlign: 'right',
  },
  businessSubtitle: {
    fontSize: 9,
    color: '#666',
    textAlign: 'right',
    lineHeight: 1.4,
  },
  billingSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  billColumn: {
    width: '48%',
  },
  billTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  billText: {
    fontSize: 9,
    color: '#666',
    lineHeight: 1.5,
    marginBottom: 2,
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#333',
  },
  qtyColumn: { width: '8%' },
  descriptionColumn: { width: '62%' },
  priceColumn: { width: '15%', textAlign: 'right' },
  totalColumn: { width: '15%', textAlign: 'right' },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  tableCell: {
    fontSize: 9,
    color: '#333',
  },
  itemDescription: {
    fontSize: 9,
    color: '#666',
    lineHeight: 1.4,
  },
  totalsSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  totalsBox: {
    width: '45%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  totalLabel: {
    fontSize: 9,
    color: '#666',
  },
  totalValue: {
    fontSize: 9,
    color: '#333',
    fontWeight: 'bold',
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    marginTop: 2,
    paddingVertical: 8,
  },
  balanceDueRow: {
    backgroundColor: '#DC2626',
    marginTop: 4,
    paddingVertical: 8,
  },
  balanceDueLabel: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  balanceDueValue: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  footerSection: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerColumn: {
    width: '48%',
  },
  footerTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  footerText: {
    fontSize: 8,
    color: '#666',
    lineHeight: 1.5,
  },
  paymentMethodBox: {
    marginBottom: 6,
  },
  paymentMethodTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
  },
  paymentMethodDetail: {
    fontSize: 8,
    color: '#666',
    textAlign: 'right',
  },
  thankYouSection: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  thankYou: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 15,
  },
  signatureSection: {
    marginTop: 20,
  },
  signatureName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  signatureTitle: {
    fontSize: 9,
    color: '#666',
  },
});

const formatPrice = (amount: number, currencyCode: string, locale: string = 'en-US') => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
};

export const BusinessInvoicePDF: React.FC<{ data: InvoiceData }> = ({ data: invoiceData }) => {
  const { currencyCode, locale } = invoiceData.currencySettings || { code: invoiceData.currency, locale: 'en-US' };
  const isInclusive = invoiceData.isTaxInclusive ?? false;

  const subTotal = invoiceData.subtotal;
  const taxAmount = invoiceData.tax;
  const grandTotal = invoiceData.total || invoiceData.grandTotal || (subTotal + taxAmount);

  // Installment Logic
  const isInstallment = invoiceData.installmentDetails?.isInstallment;
  const amountPaid = invoiceData.amountPaid || invoiceData.installmentDetails?.totalAmountPaidSoFar || 0;
  const balanceDue = invoiceData.balanceDue ?? invoiceData.installmentDetails?.balanceDue ?? (grandTotal - amountPaid);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.invoiceInfo}>
              <Text style={styles.invoiceLabel}>Invoice No: {invoiceData.invoiceNumber}</Text>
            </Text>
            <Text style={styles.invoiceInfo}>
              <Text style={styles.invoiceLabel}>Date Of Issue: {invoiceData.date}</Text>
            </Text>
            <Text style={styles.invoiceInfo}>
              <Text style={styles.invoiceLabel}>Due Date: {invoiceData.dueDate}</Text>
            </Text>
          </View>
          <View style={styles.businessSection}>
            <Text style={styles.businessTitle}>{invoiceData.organizationName || invoiceData.company.name}</Text>
            {(invoiceData.organizationDescription || invoiceData.company.tagline) && (
              <Text style={styles.businessSubtitle}>{invoiceData.organizationDescription || invoiceData.company.tagline}</Text>
            )}
          </View>
        </View>

        {/* Bill To / From */}
        <View style={styles.billingSection}>
          <View style={styles.billColumn}>
            <Text style={styles.billTitle}>Bill To:</Text>
            <Text style={styles.billText}>{invoiceData.billTo?.name || invoiceData.client.name}</Text>
            <Text style={styles.billText}>{typeof invoiceData.billTo?.address === 'string' ? invoiceData.billTo.address : invoiceData.customerAddress}</Text>
            <Text style={styles.billText}>
              {invoiceData.billTo?.city}, {invoiceData.billTo?.state}
            </Text>
            <Text style={styles.billText}>{invoiceData.billTo?.zipCode}</Text>
          </View>
          <View style={[styles.billColumn, { alignItems: 'flex-end' }]}>
            <Text style={[styles.billTitle, { textAlign: 'right' }]}>From:</Text>
            <Text style={[styles.billText, { textAlign: 'right' }]}>{invoiceData.billFrom?.name || invoiceData.company.name}</Text>
            <Text style={[styles.billText, { textAlign: 'right' }]}>{invoiceData.billFrom?.address || invoiceData.company.address}</Text>
            <Text style={[styles.billText, { textAlign: 'right' }]}>{invoiceData.billFrom?.phone || invoiceData.company.phone}</Text>
            <Text style={[styles.billText, { textAlign: 'right' }]}>{invoiceData.billFrom?.email || invoiceData.company.email}</Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.qtyColumn]}>QTY</Text>
            <Text style={[styles.tableHeaderCell, styles.descriptionColumn]}>Item Description</Text>
            <Text style={[styles.tableHeaderCell, styles.priceColumn]}>Unit Price</Text>
            <Text style={[styles.tableHeaderCell, styles.totalColumn]}>Total</Text>
          </View>
          {invoiceData.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={styles.qtyColumn}>
                <Text style={styles.tableCell}>{item.qty || item.quantity}</Text>
              </View>
              <View style={styles.descriptionColumn}>
                <Text style={styles.itemDescription}>{item.itemDescription || item.description || item.itemName}</Text>
              </View>
              <View style={styles.priceColumn}>
                <Text style={[styles.tableCell, { textAlign: 'right' }]}>
                  {formatPrice(item.unitPrice || item.price || item.rate, currencyCode || 'USD', locale || 'en-US')}
                </Text>
              </View>
              <View style={styles.totalColumn}>
                <Text style={[styles.tableCell, { textAlign: 'right' }]}>
                  {formatPrice(item.total || item.amount, currencyCode || 'USD', locale || 'en-US')}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{isInclusive ? 'Total (Excl. Tax)' : 'Sub Total'}</Text>
              <Text style={styles.totalValue}>{formatPrice(subTotal, currencyCode || 'USD', locale || 'en-US')}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax ({invoiceData.taxRate}%)</Text>
              <Text style={styles.totalValue}>{formatPrice(taxAmount, currencyCode || 'USD', locale || 'en-US')}</Text>
            </View>

            {isInstallment ? (
              <>
                <View style={styles.grandTotalRow}>
                  <Text style={[styles.totalLabel, { fontWeight: 'bold' }]}>Invoice Total</Text>
                  <Text style={[styles.totalValue, { fontWeight: 'bold' }]}>
                    {formatPrice(grandTotal, currencyCode || 'USD', locale || 'en-US')}
                  </Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Less: Amount Paid</Text>
                  <Text style={styles.totalValue}>({formatPrice(amountPaid, currencyCode || 'USD', locale || 'en-US')})</Text>
                </View>
                <View style={[styles.totalRow, styles.balanceDueRow]}>
                  <Text style={styles.balanceDueLabel}>Balance Due</Text>
                  <Text style={styles.balanceDueValue}>{formatPrice(balanceDue, currencyCode || 'USD', locale || 'en-US')}</Text>
                </View>
              </>
            ) : (
              <View style={[styles.totalRow, styles.balanceDueRow]}>
                <Text style={styles.balanceDueLabel}>Grand Total</Text>
                <Text style={styles.balanceDueValue}>{formatPrice(grandTotal, currencyCode || 'USD', locale || 'en-US')}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footerSection}>
          <View style={styles.footerColumn}>
            <Text style={styles.footerTitle}>Terms & Conditions</Text>
            <Text style={styles.footerText}>{invoiceData.termsAndConditions || invoiceData.payment.terms}</Text>
          </View>
          <View style={[styles.footerColumn, { alignItems: 'flex-end' }]}>
            <Text style={[styles.footerTitle, { textAlign: 'right' }]}>Payment Method(s)</Text>
            {(invoiceData.paymentMethods || (invoiceData.payment.availableMethods || []).map(m => ({ methodName: m, details: [] }))).map((method, index) => (
              <View key={index} style={styles.paymentMethodBox}>
                <Text style={styles.paymentMethodTitle}>{method.methodName}</Text>
                {method.details && method.details.map((line, i) => (
                  <Text key={i} style={styles.paymentMethodDetail}>
                    {line}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        </View>

        {/* Thank You */}
        <View style={styles.thankYouSection}>
          <Text style={styles.thankYou}>Thank You</Text>
          <View style={styles.signatureSection}>
            <Text style={styles.signatureName}>{invoiceData.signature?.name}</Text>
            <Text style={styles.signatureTitle}>{invoiceData.signature?.title}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
