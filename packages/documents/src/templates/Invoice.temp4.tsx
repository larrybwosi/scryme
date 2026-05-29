import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// --- Interfaces ---

export interface BusinessInvoiceItem {
  qty: number;
  itemDescription: string;
  unitPrice: number;
  total: number;
}

export interface PaymentMethodItem {
  methodName: string;
  details: string[];
}

export interface InstallmentDetails {
  isInstallment: boolean;
  totalAmountPaidSoFar: number;
  balanceDue: number;
  note?: string;
}

export interface BusinessInvoiceData {
  organizationName: string;
  organizationDescription?: string;
  currencySettings: {
    code: string;
    locale: string;
  };
  invoiceNumber: string;
  dateOfIssue: string;
  dueDate: string;
  billTo: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  billFrom: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  items: BusinessInvoiceItem[];

  // Tax Configuration
  taxRate: number;
  isTaxInclusive?: boolean; // New flag to toggle calculation logic

  paymentMethods: PaymentMethodItem[];
  installmentDetails?: InstallmentDetails;
  termsAndConditions: string;
  signature: {
    name: string;
    title: string;
  };
}

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

export const BusinessInvoicePDF: React.FC<{ data: any }> = ({ data: inputData }) => {
  const data: BusinessInvoiceData = {
    ...inputData,
    organizationName: inputData.organizationName || inputData.company?.name || inputData.organization?.name,
    currencySettings: inputData.currencySettings || {
      code: inputData.currency || 'USD',
      locale: 'en-US',
    },
    invoiceNumber: inputData.invoiceNumber,
    dateOfIssue: inputData.date,
    dueDate: inputData.dueDate || inputData.date,
    billTo: inputData.billTo || {
      name: inputData.client?.name || inputData.customerName,
      address: typeof inputData.client?.address === 'string' ? inputData.client.address : '',
      city: '',
      state: '',
      zipCode: '',
    },
    billFrom: inputData.billFrom || {
      name: inputData.company?.name || inputData.organization?.name,
      address: inputData.company?.address || inputData.organization?.address,
      phone: inputData.company?.phone || inputData.organization?.phone,
      email: inputData.company?.email || inputData.organization?.email,
    },
    items: inputData.items.map((item: any) => ({
      qty: item.qty || item.quantity,
      itemDescription: item.description || item.itemDescription,
      unitPrice: item.unitPrice || item.price,
      total: item.amount || item.total,
    })),
    taxRate: inputData.taxRate || (inputData.tax / inputData.subtotal) * 100 || 0,
    paymentMethods: inputData.paymentMethods || (inputData.payment?.availableMethods || []).map((m: string) => ({
      methodName: m,
      details: [],
    })),
    termsAndConditions: inputData.termsAndConditions || inputData.payment?.terms || '',
    signature: inputData.signature || {
      name: '',
      title: '',
    },
  };
  const { code: currencyCode, locale } = data.currencySettings;
  const isInclusive = data.isTaxInclusive ?? false;

  // 1. Calculate Sum of Line Items
  const sumOfLineItems = data.items.reduce((sum, item) => sum + item.total, 0);

  let subTotal = 0;
  let taxAmount = 0;
  let grandTotal = 0;

  if (isInclusive) {
    // If Inclusive: Line Items Sum = Grand Total
    grandTotal = sumOfLineItems;
    // Back-calculate Tax
    // Formula: Gross / (1 + Rate) = Net
    subTotal = grandTotal / (1 + data.taxRate / 100);
    taxAmount = grandTotal - subTotal;
  } else {
    // If Exclusive: Line Items Sum = Sub Total
    subTotal = sumOfLineItems;
    taxAmount = subTotal * (data.taxRate / 100);
    grandTotal = subTotal + taxAmount;
  }

  // Installment Logic
  const isInstallment = data.installmentDetails?.isInstallment;
  const amountPaid = data.installmentDetails?.totalAmountPaidSoFar || 0;
  const balanceDue = data.installmentDetails?.balanceDue ?? grandTotal - amountPaid;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.invoiceInfo}>
              <Text style={styles.invoiceLabel}>Invoice No: {data.invoiceNumber}</Text>
            </Text>
            <Text style={styles.invoiceInfo}>
              <Text style={styles.invoiceLabel}>Date Of Issue: {data.dateOfIssue}</Text>
            </Text>
            <Text style={styles.invoiceInfo}>
              <Text style={styles.invoiceLabel}>Due Date: {data.dueDate}</Text>
            </Text>
          </View>
          <View style={styles.businessSection}>
            <Text style={styles.businessTitle}>{data.organizationName}</Text>
            {data.organizationDescription && (
              <Text style={styles.businessSubtitle}>{data.organizationDescription}</Text>
            )}
          </View>
        </View>

        {/* Bill To / From */}
        <View style={styles.billingSection}>
          <View style={styles.billColumn}>
            <Text style={styles.billTitle}>Bill To:</Text>
            <Text style={styles.billText}>{data.billTo.name}</Text>
            <Text style={styles.billText}>{data.billTo.address}</Text>
            <Text style={styles.billText}>
              {data.billTo.city}, {data.billTo.state}
            </Text>
            <Text style={styles.billText}>{data.billTo.zipCode}</Text>
          </View>
          <View style={[styles.billColumn, { alignItems: 'flex-end' }]}>
            <Text style={[styles.billTitle, { textAlign: 'right' }]}>From:</Text>
            <Text style={[styles.billText, { textAlign: 'right' }]}>{data.billFrom.name}</Text>
            <Text style={[styles.billText, { textAlign: 'right' }]}>{data.billFrom.address}</Text>
            <Text style={[styles.billText, { textAlign: 'right' }]}>{data.billFrom.phone}</Text>
            <Text style={[styles.billText, { textAlign: 'right' }]}>{data.billFrom.email}</Text>
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
          {data.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={styles.qtyColumn}>
                <Text style={styles.tableCell}>{item.qty}</Text>
              </View>
              <View style={styles.descriptionColumn}>
                <Text style={styles.itemDescription}>{item.itemDescription}</Text>
              </View>
              <View style={styles.priceColumn}>
                <Text style={[styles.tableCell, { textAlign: 'right' }]}>
                  {formatPrice(item.unitPrice, currencyCode, locale)}
                </Text>
              </View>
              <View style={styles.totalColumn}>
                <Text style={[styles.tableCell, { textAlign: 'right' }]}>
                  {formatPrice(item.total, currencyCode, locale)}
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
              <Text style={styles.totalValue}>{formatPrice(subTotal, currencyCode, locale)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax ({data.taxRate}%)</Text>
              <Text style={styles.totalValue}>{formatPrice(taxAmount, currencyCode, locale)}</Text>
            </View>

            {isInstallment ? (
              <>
                <View style={styles.grandTotalRow}>
                  <Text style={[styles.totalLabel, { fontWeight: 'bold' }]}>Invoice Total</Text>
                  <Text style={[styles.totalValue, { fontWeight: 'bold' }]}>
                    {formatPrice(grandTotal, currencyCode, locale)}
                  </Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Less: Amount Paid</Text>
                  <Text style={styles.totalValue}>({formatPrice(amountPaid, currencyCode, locale)})</Text>
                </View>
                <View style={[styles.totalRow, styles.balanceDueRow]}>
                  <Text style={styles.balanceDueLabel}>Balance Due</Text>
                  <Text style={styles.balanceDueValue}>{formatPrice(balanceDue, currencyCode, locale)}</Text>
                </View>
              </>
            ) : (
              <View style={[styles.totalRow, styles.balanceDueRow]}>
                <Text style={styles.balanceDueLabel}>Grand Total</Text>
                <Text style={styles.balanceDueValue}>{formatPrice(grandTotal, currencyCode, locale)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footerSection}>
          <View style={styles.footerColumn}>
            <Text style={styles.footerTitle}>Terms & Conditions</Text>
            <Text style={styles.footerText}>{data.termsAndConditions}</Text>
          </View>
          <View style={[styles.footerColumn, { alignItems: 'flex-end' }]}>
            <Text style={[styles.footerTitle, { textAlign: 'right' }]}>Payment Method(s)</Text>
            {data.paymentMethods.map((method, index) => (
              <View key={index} style={styles.paymentMethodBox}>
                <Text style={styles.paymentMethodTitle}>{method.methodName}</Text>
                {method.details.map((line, i) => (
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
            <Text style={styles.signatureName}>{data.signature.name}</Text>
            <Text style={styles.signatureTitle}>{data.signature.title}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
