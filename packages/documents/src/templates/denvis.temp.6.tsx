import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

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
  /**
   * Optional logo image. Accepts:
   *  - A base64 data URI:  "data:image/png;base64,iVBOR..."
   *  - A remote URL:       "https://example.com/logo.png"
   * When omitted the logo area is hidden; the org name fills its space.
   */
  logo?: string;
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
  taxRate: number;
  isTaxInclusive?: boolean;
  paymentMethods: PaymentMethodItem[];
  installmentDetails?: InstallmentDetails;
  termsAndConditions: string;
  signature: {
    name: string;
    title: string;
  };
}

// ---------------------------------------------------------------------------
// Brand palette — red & green used structurally, not decoratively.
// ---------------------------------------------------------------------------
const B = {
  red: '#C0392B',
  redDark: '#9B2335',
  redLight: '#FDECEA',
  green: '#1E7C41',
  greenDark: '#155D30',
  greenLight: '#E9F5EE',

  ink: '#111418',
  charcoal: '#2C3138',
  slate: '#4A5260',
  steel: '#70798A',
  silver: '#9EA8B5',
  rule: '#D4D9DF',
  fog: '#ECEEF1',
  paper: '#F5F6F8',
  white: '#FFFFFF',
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const S = StyleSheet.create({
  page: {
    padding: 0,
    fontSize: 9,
    fontFamily: 'Helvetica',
    backgroundColor: B.white,
    color: B.ink,
  },

  // ── Split colour band at top ──
  topBand: { flexDirection: 'row', height: 5 },
  topBandRed: { flex: 1, backgroundColor: B.red },
  topBandGreen: { flex: 1, backgroundColor: B.green },

  // ── Header ──
  header: {
    backgroundColor: B.redDark,
    paddingHorizontal: 44,
    paddingTop: 28,
    paddingBottom: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: { flexDirection: 'column' },
  invoiceLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: B.silver,
    letterSpacing: 2.8,
    marginBottom: 5,
  },
  invoiceNumber: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: B.white,
    letterSpacing: 0.4,
  },
  headerRight: { alignItems: 'flex-end', maxWidth: 220 },

  // Logo sits in a white pill so it reads on the dark header
  logoContainer: {
    backgroundColor: B.white,
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 50,
  },
  logo: {
    width: 100,
    height: 38,
    objectFit: 'contain',
  },
  orgName: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: B.white,
    textAlign: 'right',
    marginBottom: 2,
  },
  orgDescription: {
    fontSize: 7.5,
    color: B.silver,
    textAlign: 'right',
    lineHeight: 1.55,
    maxWidth: 200,
  },

  // Green rule under header
  greenRule: { height: 3, backgroundColor: B.green },

  // ── Body ──
  body: {
    paddingHorizontal: 44,
    paddingTop: 26,
    paddingBottom: 48,
  },

  // ── Meta row ──
  metaRow: { flexDirection: 'row', marginBottom: 24 },
  metaCell: { marginRight: 32 },
  metaLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: B.steel,
    letterSpacing: 1.6,
    marginBottom: 3,
  },
  metaValue: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: B.ink,
  },

  // ── Hairline rule ──
  rule: { height: 1, backgroundColor: B.rule, marginBottom: 22 },

  // ── Billing ──
  billingSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  billCol: { width: '44%' },
  billColRight: { width: '44%', alignItems: 'flex-end' },
  billSectionLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: B.steel,
    letterSpacing: 1.6,
    marginBottom: 7,
    paddingBottom: 5,
    borderBottomWidth: 1.5,
    borderBottomColor: B.red,
  },
  billSectionLabelGreen: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: B.steel,
    letterSpacing: 1.6,
    marginBottom: 7,
    paddingBottom: 5,
    borderBottomWidth: 1.5,
    borderBottomColor: B.green,
    textAlign: 'right',
  },
  billName: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: B.ink,
    marginBottom: 3,
  },
  billNameRight: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: B.ink,
    marginBottom: 3,
    textAlign: 'right',
  },
  billText: { fontSize: 8.5, color: B.slate, lineHeight: 1.6 },
  billTextRight: { fontSize: 8.5, color: B.slate, lineHeight: 1.6, textAlign: 'right' },

  // ── Items Table ──
  table: { marginBottom: 18 },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: B.green,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableHeadCell: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: B.white,
    letterSpacing: 1.1,
  },
  tableRowEven: {
    flexDirection: 'row',
    paddingVertical: 9,
    paddingHorizontal: 10,
    backgroundColor: B.white,
    borderBottomWidth: 1,
    borderBottomColor: B.fog,
  },
  tableRowOdd: {
    flexDirection: 'row',
    paddingVertical: 9,
    paddingHorizontal: 10,
    backgroundColor: B.paper,
    borderBottomWidth: 1,
    borderBottomColor: B.fog,
  },
  tableCell: { fontSize: 9, color: B.ink },
  tableCellMuted: { fontSize: 8.5, color: B.slate, lineHeight: 1.5 },

  colQty: { width: '8%' },
  colDesc: { width: '52%' },
  colPrice: { width: '20%', textAlign: 'right' },
  colTotal: { width: '20%', textAlign: 'right' },

  // ── Totals ──
  totalsSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 28,
  },
  totalsBox: { width: '42%' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: B.fog,
  },
  totalLabel: { fontSize: 8.5, color: B.steel },
  totalValue: { fontSize: 8.5, color: B.slate, fontFamily: 'Helvetica-Bold' },

  invoiceTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: B.rule,
  },
  invoiceTotalLabel: { fontSize: 8.5, color: B.steel },
  invoiceTotalValue: { fontSize: 8.5, color: B.slate, fontFamily: 'Helvetica-Bold' },

  amountPaidRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: B.redLight,
    borderBottomWidth: 1,
    borderBottomColor: B.rule,
  },
  amountPaidLabel: { fontSize: 8.5, color: B.red },
  amountPaidValue: { fontSize: 8.5, color: B.red, fontFamily: 'Helvetica-Bold' },

  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: B.greenLight,
    borderLeftWidth: 3,
    borderLeftColor: B.green,
    marginTop: 3,
  },
  grandTotalLabel: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: B.greenDark },
  grandTotalValue: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: B.greenDark },

  balanceDueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: B.greenLight,
    borderLeftWidth: 3,
    borderLeftColor: B.green,
    marginTop: 3,
  },
  balanceDueLabel: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: B.greenDark },
  balanceDueValue: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: B.greenDark },

  // ── Footer ──
  footerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
    marginBottom: 32,
  },
  footerCol: { width: '47%' },
  footerLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: B.white,
    letterSpacing: 1.5,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  footerLabelRed: { backgroundColor: B.redDark },
  footerLabelGreen: { backgroundColor: B.greenDark },
  footerText: { fontSize: 8, color: B.slate, lineHeight: 1.65, paddingHorizontal: 2 },
  paymentMethodBox: { marginBottom: 7, paddingHorizontal: 2 },
  paymentMethodTitle: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: B.ink, marginBottom: 2 },
  paymentMethodDetail: { fontSize: 8, color: B.slate, lineHeight: 1.55 },

  // ── Closing ──
  closingSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: B.rule,
  },
  thankText: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: B.red,
    marginBottom: 3,
  },
  tagline: { fontSize: 8, color: B.silver },
  signatureBlock: { alignItems: 'flex-end' },
  signatureLine: { width: 120, height: 1, backgroundColor: B.ink, marginBottom: 5 },
  signatureName: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: B.ink, textAlign: 'right' },
  signatureTitle: { fontSize: 8, color: B.steel, textAlign: 'right', marginTop: 1 },

  // ── Bottom split colour band ──
  bottomBand: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    height: 5,
  },
  bottomBandGreen: { flex: 1, backgroundColor: B.green },
  bottomBandRed: { flex: 1, backgroundColor: B.red },
});

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
const fmt = (amount: number, code: string, locale: string): string => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${code} ${amount.toFixed(2)}`;
  }
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
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
  const { code, locale } = data.currencySettings;
  const isInclusive = data.isTaxInclusive ?? false;

  const lineSum = data.items.reduce((s, i) => s + i.total, 0);
  let subTotal: number, taxAmount: number, grandTotal: number;

  if (isInclusive) {
    grandTotal = lineSum;
    subTotal = grandTotal / (1 + data.taxRate / 100);
    taxAmount = grandTotal - subTotal;
  } else {
    subTotal = lineSum;
    taxAmount = subTotal * (data.taxRate / 100);
    grandTotal = subTotal + taxAmount;
  }

  const isInstallment = data.installmentDetails?.isInstallment;
  const amountPaid = data.installmentDetails?.totalAmountPaidSoFar ?? 0;
  const balanceDue = data.installmentDetails?.balanceDue ?? grandTotal - amountPaid;

  return (
    <Document>
      <Page size="A4" style={S.page}>
        {/* Top split band */}
        <View style={S.topBand}>
          <View style={S.topBandRed} />
          <View style={S.topBandGreen} />
        </View>

        {/* Header */}
        <View style={S.header}>
          <View style={S.headerLeft}>
            <Text style={S.invoiceLabel}>INVOICE</Text>
            <Text style={S.invoiceNumber}>{data.invoiceNumber}</Text>
          </View>

          <View style={S.headerRight}>
            {/* Logo section — renders when data.logo is provided */}
            {data.logo ? (
              <View style={S.logoContainer}>
                <Image src={data.logo} style={S.logo} />
              </View>
            ) : null}
            <Text style={S.orgName}>{data.organizationName}</Text>
            {data.organizationDescription && <Text style={S.orgDescription}>{data.organizationDescription}</Text>}
          </View>
        </View>

        {/* Green accent rule */}
        <View style={S.greenRule} />

        {/* Body */}
        <View style={S.body}>
          {/* Meta row */}
          <View style={S.metaRow}>
            {[
              { label: 'DATE OF ISSUE', value: data.dateOfIssue },
              { label: 'DUE DATE', value: data.dueDate },
              { label: 'CURRENCY', value: data.currencySettings.code },
            ].map(m => (
              <View key={m.label} style={S.metaCell}>
                <Text style={S.metaLabel}>{m.label}</Text>
                <Text style={S.metaValue}>{m.value}</Text>
              </View>
            ))}
          </View>

          <View style={S.rule} />

          {/* Billing */}
          <View style={S.billingSection}>
            <View style={S.billCol}>
              <Text style={S.billSectionLabel}>BILLED TO</Text>
              <Text style={S.billName}>{data.billTo.name}</Text>
              <Text style={S.billText}>{data.billTo.address}</Text>
              <Text style={S.billText}>
                {data.billTo.city}, {data.billTo.state} {data.billTo.zipCode}
              </Text>
            </View>
            <View style={S.billColRight}>
              <Text style={S.billSectionLabelGreen}>FROM</Text>
              <Text style={S.billNameRight}>{data.billFrom.name}</Text>
              <Text style={S.billTextRight}>{data.billFrom.address}</Text>
              <Text style={S.billTextRight}>{data.billFrom.phone}</Text>
              <Text style={S.billTextRight}>{data.billFrom.email}</Text>
            </View>
          </View>

          {/* Items table */}
          <View style={S.table}>
            <View style={S.tableHead}>
              <Text style={[S.tableHeadCell, S.colQty]}>QTY</Text>
              <Text style={[S.tableHeadCell, S.colDesc]}>DESCRIPTION</Text>
              <Text style={[S.tableHeadCell, S.colPrice]}>UNIT PRICE</Text>
              <Text style={[S.tableHeadCell, S.colTotal]}>AMOUNT</Text>
            </View>

            {data.items.map((item, i) => (
              <View key={i} style={i % 2 === 0 ? S.tableRowEven : S.tableRowOdd}>
                <View style={S.colQty}>
                  <Text style={S.tableCell}>{item.qty}</Text>
                </View>
                <View style={S.colDesc}>
                  <Text style={S.tableCellMuted}>{item.itemDescription}</Text>
                </View>
                <View style={S.colPrice}>
                  <Text style={[S.tableCell, { textAlign: 'right' }]}>{fmt(item.unitPrice, code, locale)}</Text>
                </View>
                <View style={S.colTotal}>
                  <Text style={[S.tableCell, { textAlign: 'right', fontFamily: 'Helvetica-Bold' }]}>
                    {fmt(item.total, code, locale)}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Totals */}
          <View style={S.totalsSection}>
            <View style={S.totalsBox}>
              <View style={S.totalRow}>
                <Text style={S.totalLabel}>{isInclusive ? 'Subtotal (excl. tax)' : 'Subtotal'}</Text>
                <Text style={S.totalValue}>{fmt(subTotal, code, locale)}</Text>
              </View>
              <View style={S.totalRow}>
                <Text style={S.totalLabel}>Tax ({data.taxRate}%)</Text>
                <Text style={S.totalValue}>{fmt(taxAmount, code, locale)}</Text>
              </View>

              {isInstallment ? (
                <>
                  <View style={S.invoiceTotalRow}>
                    <Text style={S.invoiceTotalLabel}>Invoice Total</Text>
                    <Text style={S.invoiceTotalValue}>{fmt(grandTotal, code, locale)}</Text>
                  </View>
                  <View style={S.amountPaidRow}>
                    <Text style={S.amountPaidLabel}>Less: Amount Paid</Text>
                    <Text style={S.amountPaidValue}>({fmt(amountPaid, code, locale)})</Text>
                  </View>
                  <View style={S.balanceDueRow}>
                    <Text style={S.balanceDueLabel}>Balance Due</Text>
                    <Text style={S.balanceDueValue}>{fmt(balanceDue, code, locale)}</Text>
                  </View>
                </>
              ) : (
                <View style={S.grandTotalRow}>
                  <Text style={S.grandTotalLabel}>Total Due</Text>
                  <Text style={S.grandTotalValue}>{fmt(grandTotal, code, locale)}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Footer */}
          <View style={S.footerSection}>
            <View style={S.footerCol}>
              <Text style={[S.footerLabel, S.footerLabelRed]}>TERMS & CONDITIONS</Text>
              <Text style={S.footerText}>{data.termsAndConditions}</Text>
            </View>
            <View style={S.footerCol}>
              <Text style={[S.footerLabel, S.footerLabelGreen]}>PAYMENT METHODS</Text>
              {data.paymentMethods.map((m, i) => (
                <View key={i} style={S.paymentMethodBox}>
                  <Text style={S.paymentMethodTitle}>{m.methodName}</Text>
                  {m.details.map((line, j) => (
                    <Text key={j} style={S.paymentMethodDetail}>
                      {line}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          </View>

          {/* Closing / Signature */}
          <View style={S.closingSection}>
            <View>
              <Text style={S.thankText}>Thank you for your business.</Text>
              <Text style={S.tagline}>
                {data.organizationName} · {data.billFrom.email}
              </Text>
            </View>
            <View style={S.signatureBlock}>
              <View style={S.signatureLine} />
              <Text style={S.signatureName}>{data.signature.name}</Text>
              <Text style={S.signatureTitle}>{data.signature.title}</Text>
            </View>
          </View>
        </View>

        {/* Bottom split band */}
        <View style={S.bottomBand}>
          <View style={S.bottomBandGreen} />
          <View style={S.bottomBandRed} />
        </View>
      </Page>
    </Document>
  );
};

export default BusinessInvoicePDF;
