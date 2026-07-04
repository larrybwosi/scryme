import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';
import type { Order, ReceiptConfig } from '@/store/store';

const getFontUrl = (path: string) => {
  if (typeof window !== 'undefined') return `${window.location.origin}${path}`;
  return path;
};

Font.register({
  family: 'Roboto',
  fonts: [
    { src: getFontUrl('/fonts/Roboto-Regular.ttf') },
    { src: getFontUrl('/fonts/Roboto-Bold.ttf'), fontWeight: 'bold' },
    { src: getFontUrl('/fonts/Roboto-Italic.ttf'), fontStyle: 'italic' },
  ],
});

interface ReceiptPdfProps {
  order: Order;
  settings: {
    businessName: string;
    businessSlogan?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    currency: string;
    receiptConfig: ReceiptConfig;
    [key: string]: any;
  };
  qrCodeUrl?: string;
  barcodeUrl?: string;
  branchName?: string;
}

const formatCurrency = (amount: number, _currency: string) =>
  amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const ReceiptPdfDocument = ({ order, settings, qrCodeUrl, barcodeUrl, branchName }: ReceiptPdfProps) => {
  const config = settings.receiptConfig || {};
  const isThermal = config.paperSize === '58mm' || config.paperSize === '80mm';

  // Compact font scale: small=7, medium=8, large=9
  const base = config.bodyFontSize || (config.fontSize === 'small' ? 7 : config.fontSize === 'medium' ? 8 : 9);
  const titleSize = config.titleFontSize || base + (isThermal ? 3 : 5);
  const headerSize = config.headerFontSize || base - 1;

  const pad = config.padding !== undefined ? config.padding : isThermal ? 8 : 24;
  const bc = config.primaryColor || (isThermal ? '#000' : '#d1d5db');
  const sc = config.secondaryColor || '#666666';
  const bs = config.dividerStyle || (isThermal ? 'dashed' : 'solid');

  const template = config.template || 'standard';

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        page: {
          fontFamily: 'Roboto',
          fontSize: base,
          padding: pad,
          backgroundColor: '#fff',
          color: config.primaryColor || '#111',
          ...(config.showBorder && {
            borderWidth: 2,
            borderColor: config.borderColor || bc,
          }),
        },

        // ── HEADER ──
        header: {
          alignItems:
            template === 'minimal'
              ? 'flex-start'
              : config.textAlignment === 'left'
                ? 'flex-start'
                : 'center',
          marginBottom: template === 'modern' ? 12 : 6,
          paddingBottom: 5,
          borderBottomWidth: template === 'minimal' ? 0 : 1,
          borderBottomColor: bc,
          borderBottomStyle: bs,
        },
        logo: {
          width: isThermal ? 32 : 44,
          height: isThermal ? 32 : 44,
          objectFit: 'contain',
          marginBottom: 4,
        },
        bizName: {
          fontSize: titleSize,
          fontWeight: 'bold',
          textAlign:
            template === 'minimal'
              ? 'left'
              : config.textAlignment === 'left'
                ? 'left'
                : 'center',
          textTransform: template === 'modern' ? 'none' : 'uppercase',
          letterSpacing: template === 'modern' ? 0.5 : 1.2,
          marginBottom: 1,
          color: config.primaryColor || '#000',
        },
        slogan: {
          fontSize: headerSize,
          fontStyle: 'italic',
          color: sc,
          textAlign: config.textAlignment === 'left' ? 'left' : 'center',
          marginBottom: 2,
        },
        contactLine: {
          fontSize: headerSize,
          color: isThermal ? (config.primaryColor || '#000') : sc,
          textAlign: config.textAlignment === 'left' ? 'left' : 'center',
          lineHeight: 1.3,
        },
        regRow: {
          flexDirection: 'row',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginTop: 1,
        },
        regItem: {
          fontSize: headerSize,
          color: sc,
          marginHorizontal: 3,
        },

        // ── DIVIDER ──
        divider: {
          borderBottomWidth: 1,
          borderBottomColor: bc,
          borderBottomStyle: bs,
          marginVertical: 4,
        },
        doubleDivider: {
          borderBottomWidth: 2,
          borderBottomColor: '#000',
          marginVertical: 3,
        },

        // ── META GRID ──
        metaGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          marginBottom: 5,
          paddingBottom: 5,
          borderBottomWidth: template === 'minimal' ? 0 : 1,
          borderBottomColor: bc,
          borderBottomStyle: bs,
          backgroundColor: template === 'modern' ? '#f9fafb' : 'transparent',
          padding: template === 'modern' ? 4 : 0,
          borderRadius: template === 'modern' ? 4 : 0,
        },
        metaCell: {
          width: isThermal ? '100%' : '50%',
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingVertical: 1,
          paddingRight: isThermal ? 0 : 8,
        },
        metaLabel: { fontSize: headerSize, color: sc },
        metaValue: { fontSize: headerSize, fontWeight: 'bold' },

        // ── TABLE ──
        table: { marginBottom: 4 },
        tHead: {
          flexDirection: 'row',
          borderBottomWidth: template === 'minimal' ? 1 : 1,
          borderBottomColor: config.primaryColor || '#000',
          borderBottomStyle: template === 'minimal' ? 'solid' : bs,
          paddingBottom: 3,
          marginBottom: 2,
          backgroundColor: template === 'modern' ? config.primaryColor || '#000' : 'transparent',
          padding: template === 'modern' ? 2 : 0,
        },
        tHCell: {
          fontSize: headerSize,
          fontWeight: 'bold',
          textTransform: 'uppercase',
          color:
            template === 'modern'
              ? '#fff'
              : isThermal
                ? config.primaryColor || '#000'
                : sc,
        },
        tRow: {
          flexDirection: 'row',
          marginBottom: config.itemSpacing ?? 3,
          alignItems: 'flex-start',
        },
        colItem: { width: '42%', paddingRight: 3 },
        colQty: { width: '13%', textAlign: 'center' },
        colPrice: { width: '22%', textAlign: 'right', paddingRight: 2 },
        colTotal: { width: '23%', textAlign: 'right' },

        itemName: { fontSize: base, fontWeight: 'bold', lineHeight: 1.2 },
        itemVariant: { fontSize: base - 2, color: sc, marginTop: 1 },

        // ── TOTALS ──
        totalsWrap: {
          marginTop: template === 'modern' ? 8 : 2,
          paddingTop: 4,
          borderTopWidth: template === 'minimal' ? 1 : template === 'modern' ? 0 : 1,
          borderTopColor: config.primaryColor || '#000',
          borderTopStyle: bs,
          alignItems: 'flex-end',
          backgroundColor: template === 'modern' ? '#f9fafb' : 'transparent',
          padding: template === 'modern' ? 6 : 0,
          borderRadius: template === 'modern' ? 4 : 0,
        },
        totalRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: isThermal ? '100%' : '48%',
          paddingVertical: 1,
        },
        totalLabel: { fontSize: base, color: isThermal ? (config.primaryColor || '#000') : sc },
        totalValue: { fontSize: base, fontWeight: 'bold' },
        grandRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: isThermal ? '100%' : '48%',
          paddingVertical: template === 'modern' ? 6 : 3,
          marginTop: 2,
          borderTopWidth: template === 'modern' ? 0 : 2,
          borderTopColor: config.primaryColor || '#000',
          borderBottomWidth: template === 'modern' ? 0 : 2,
          borderBottomColor: config.primaryColor || '#000',
          ...(template === 'modern' && {
            backgroundColor: config.primaryColor || '#000',
            color: '#fff',
            paddingHorizontal: 4,
            borderRadius: 2,
          }),
        },
        grandLabel: {
          fontSize: base + 2,
          fontWeight: 'bold',
          textTransform: 'uppercase',
          color: template === 'modern' ? '#fff' : config.primaryColor || '#000',
        },
        grandValue: {
          fontSize: base + 2,
          fontWeight: 'bold',
          color: template === 'modern' ? '#fff' : config.primaryColor || '#000',
        },
        savingsRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: isThermal ? '100%' : '48%',
          paddingVertical: 1,
        },
        savingsText: { fontSize: base, color: '#16a34a' },

        // ── FOOTER ──
        footer: { marginTop: 8, alignItems: 'center' },
        footerMsg: {
          fontSize: base,
          fontWeight: 'bold',
          textAlign: 'center',
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          marginBottom: 3,
        },
        footerLine: {
          fontSize: headerSize,
          textAlign: 'center',
          color: isThermal ? (config.primaryColor || '#000') : sc,
          marginBottom: 2,
        },
        footerDisclaimer: {
          fontSize: base - 2,
          textAlign: 'center',
          color: sc,
          fontStyle: 'italic',
          marginTop: 3,
        },
        loyaltyBox: {
          flexDirection: 'row',
          justifyContent: 'center',
          marginTop: 4,
        },
        loyaltyItem: {
          fontSize: headerSize,
          marginHorizontal: 5,
          color: isThermal ? (config.primaryColor || '#000') : sc,
        },
        barcodeWrap: {
          alignItems: 'center',
          marginTop: 6,
          paddingTop: 6,
          borderTopWidth: 1,
          borderTopColor: bc,
          borderTopStyle: bs,
          width: '100%',
        },
        barcodeNum: {
          fontSize: base - 2,
          marginTop: 2,
          letterSpacing: 1.5,
          color: '#444',
        },
        signatureWrap: {
          marginTop: 16,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: bc,
          borderTopStyle: 'solid',
          width: '80%',
          alignSelf: 'center',
        },
        signatureText: {
          fontSize: base - 2,
          textAlign: 'center',
          color: sc,
        },
      }),
    [base, pad, bc, bs, isThermal, config.itemSpacing, template, config.primaryColor, config.showBorder, config.borderColor, titleSize, headerSize, sc]
  );

  // ── PAGE SIZE ──
  const calculatePageHeight = () => {
    if (config.paperSize === 'Letter') return 'A4';
    let h = isThermal ? 28 : 48;
    if (config.showLogo && config.logoUrl) h += isThermal ? 42 : 56;
    h += 30; // biz name + slogan
    const contactLines = [
      config.showAddress && settings.address,
      config.showPhone || settings.phone,
      settings.email,
      settings.website,
      config.showTaxNumber && config.taxNumber,
      config.showVatNumber && config.vatNumber,
      config.showCompanyRegNumber && config.companyRegNumber,
    ].filter(Boolean).length;
    h += contactLines * 12 + 16;
    h += 46; // meta block
    h += 30; // table header
    order.items?.forEach(item => {
      h += 16;
      if (item.variantName && !['Default', 'Default Variant'].includes(item.variantName)) h += 11;
    });
    h += 16;
    if (config.showSubtotal !== false) h += 14;
    if (config.showDiscountBreakdown !== false && order.discount > 0) h += 14;
    if (config.showTaxBreakdown !== false) h += 14;
    if (config.showSavingsTotal && order.discount > 0) h += 14;
    h += 34; // grand total
    h += 14; // payment line
    h += 32; // footer base
    if (config.showNextVisitPromo) h += 14;
    if (config.showLoyaltyPoints || config.showLoyaltyBalance) h += 20;
    if (config.showReturnPolicy) h += 18;
    if (config.showLegalDisclaimer) h += 16;
    if (config.showQrCode && qrCodeUrl) h += 56;
    if (config.showBarcode && barcodeUrl) h += 52;
    if (config.showSurveyQr) h += 12;
    if (config.showSocialMedia) h += 12;
    return h;
  };

  const pageSize =
    config.paperSize === '58mm'
      ? { width: 164, height: calculatePageHeight() }
      : config.paperSize === '80mm'
        ? { width: 226, height: calculatePageHeight() }
        : 'A4';

  const currency = settings.currency || 'KSH';
  const labels = config.labels || {
    receipt: 'RECEIPT',
    date: 'DATE',
    cashier: 'CASHIER',
    customer: 'CUSTOMER',
    item: 'ITEM',
    qty: 'QTY',
    price: 'PRICE',
    total: 'TOTAL',
    subtotal: 'SUBTOTAL',
    tax: 'TAX',
    discount: 'DISCOUNT',
    savings: 'SAVINGS',
    paymentMethod: 'PAYMENT METHOD',
    change: 'CHANGE',
    servedBy: 'SERVED BY',
    vat: 'VAT',
    tin: 'TIN',
  };

  const renderSection = (section: string) => {
    switch (section) {
      case 'header':
        return (
          <View key="header" style={styles.header}>
            {config.showLogo && config.logoUrl && <Image src={config.logoUrl} style={styles.logo} />}
            {config.showLocationHeader && (
              <Text style={[styles.contactLine, { fontWeight: 'bold', textTransform: 'uppercase' }]}>
                {config.locationNameOverride || branchName || labels.branch}
              </Text>
            )}
            <Text style={styles.bizName}>{settings.businessName || 'Business Name'}</Text>
            {config.showTagline && config.tagline && <Text style={styles.slogan}>{config.tagline}</Text>}
            {!config.tagline && settings.businessSlogan && <Text style={styles.slogan}>{settings.businessSlogan}</Text>}

            {/* Contact — inline where possible */}
            {config.showAddress && settings.address && <Text style={styles.contactLine}>{settings.address}</Text>}
            {(config.showPhone || settings.phone) && settings.email ? (
              <Text style={styles.contactLine}>
                {config.phone || settings.phone} · {settings.email}
              </Text>
            ) : (
              <>
                {(config.showPhone || settings.phone) && (
                  <Text style={styles.contactLine}>{config.phone || settings.phone}</Text>
                )}
                {settings.email && <Text style={styles.contactLine}>{settings.email}</Text>}
              </>
            )}
            {settings.website && <Text style={styles.contactLine}>{settings.website}</Text>}

            {/* Reg numbers inline */}
            {(config.showTaxNumber && config.taxNumber) ||
            (config.showVatNumber && config.vatNumber) ||
            (config.showCompanyRegNumber && config.companyRegNumber) ||
            config.customFields?.some(f => f.enabled) ? (
              <View style={styles.regRow}>
                {config.showTaxNumber && config.taxNumber && (
                  <Text style={styles.regItem}>
                    {labels.tin}: {config.taxNumber}
                  </Text>
                )}
                {config.showVatNumber && config.vatNumber && (
                  <Text style={styles.regItem}>
                    {labels.vat}: {config.vatNumber}
                  </Text>
                )}
                {config.showCompanyRegNumber && config.companyRegNumber && (
                  <Text style={styles.regItem}>
                    {labels.reg}: {config.companyRegNumber}
                  </Text>
                )}
                {config.customFields
                  ?.filter(f => f.enabled && f.label && f.value)
                  .map((field, idx) => (
                    <Text key={idx} style={styles.regItem}>
                      {field.label}: {field.value}
                    </Text>
                  ))}
              </View>
            ) : null}
          </View>
        );

      case 'meta':
        return (
          <View key="meta" style={styles.metaGrid}>
            {config.showOrderNumber !== false && (
              <View style={styles.metaCell}>
                <Text style={styles.metaLabel}>{labels.receipt} No</Text>
                <Text style={styles.metaValue}>
                  {config.orderNumberPrefix || ''}
                  {order.orderNumber}
                </Text>
              </View>
            )}
            {config.showTransactionId && (
              <View style={styles.metaCell}>
                <Text style={styles.metaLabel}>Trans ID</Text>
                <Text style={styles.metaValue}>{order.id}</Text>
              </View>
            )}
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>{labels.date}</Text>
              <Text style={styles.metaValue}>
                {order.createdAt
                  ? format(new Date(order.createdAt), 'dd/MM/yy HH:mm')
                  : format(new Date(), 'dd/MM/yy HH:mm')}
              </Text>
            </View>
            {config.showCashier && order.cashierName && (
              <View style={styles.metaCell}>
                <Text style={styles.metaLabel}>{labels.servedBy}</Text>
                <Text style={styles.metaValue}>{order.cashierName}</Text>
              </View>
            )}
            {config.showCustomerName && order.customerName && (
              <View style={styles.metaCell}>
                <Text style={styles.metaLabel}>{labels.customer}</Text>
                <Text style={styles.metaValue}>{order.customerName}</Text>
              </View>
            )}
            {!config.showLocationHeader && (config.locationNameOverride || branchName) && (
              <View style={styles.metaCell}>
                <Text style={styles.metaLabel}>Branch</Text>
                <Text style={styles.metaValue}>{config.locationNameOverride || branchName}</Text>
              </View>
            )}
          </View>
        );

      case 'items':
        return (
          <View key="items" style={styles.table}>
            <View style={styles.tHead}>
              <Text style={[styles.colItem, styles.tHCell]}>{labels.item}</Text>
              <Text style={[styles.colQty, styles.tHCell]}>{labels.qty}</Text>
              <Text style={[styles.colPrice, styles.tHCell]}>{labels.price}</Text>
              <Text style={[styles.colTotal, styles.tHCell]}>{labels.amount}</Text>
            </View>

            {order.items?.map((item, i) => {
              const unitPrice = item.selectedUnit?.price || 0;
              const lineTotal = unitPrice * item.quantity;
              const variant = item.variantName || '';
              const showVariant = variant && !['Default', 'Default Variant'].includes(variant);
              return (
                <View key={i} style={styles.tRow}>
                  <View style={styles.colItem}>
                    <Text style={styles.itemName}>{item.productName}</Text>
                    {showVariant && <Text style={styles.itemVariant}>{variant}</Text>}
                    {config.showItemTax && <Text style={{ fontSize: base - 2, opacity: 0.5 }}>TAX INC.</Text>}
                  </View>
                  <Text style={styles.colQty}>{item.quantity}</Text>
                  <View style={[styles.colPrice, { flexDirection: 'column' }]}>
                    <Text style={{ color: '#555' }}>{formatCurrency(unitPrice, currency)}</Text>
                    {config.showItemDiscounts && (
                      <Text style={{ fontSize: base - 2, color: '#16a34a' }}>-0.00</Text>
                    )}
                  </View>
                  <Text style={[styles.colTotal, { fontWeight: 'bold' }]}>{formatCurrency(lineTotal, currency)}</Text>
                </View>
              );
            })}
          </View>
        );

      case 'totals':
        return (
          <View key="totals" style={styles.totalsWrap}>
            {config.showSubtotal !== false && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{labels.subtotal}</Text>
                <Text style={styles.totalValue}>{formatCurrency(order.subTotal || 0, currency)}</Text>
              </View>
            )}
            {config.showDiscountBreakdown !== false && order.discount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{labels.discount}</Text>
                <Text style={styles.totalValue}>-{formatCurrency(order.discount, currency)}</Text>
              </View>
            )}
            {config.showTaxBreakdown !== false && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{labels.tax}</Text>
                <Text style={styles.totalValue}>{formatCurrency(order.taxes || 0, currency)}</Text>
              </View>
            )}
            <View style={styles.grandRow}>
              <Text style={styles.grandLabel}>{labels.total}</Text>
              <Text style={styles.grandValue}>
                {currency} {formatCurrency(order.total || 0, currency)}
              </Text>
            </View>
            <View style={[styles.totalRow, { marginTop: 2 }]}>
              <Text style={styles.totalLabel}>{labels.paymentMethod}</Text>
              <Text style={styles.totalValue}>{order.paymentMethod || 'Cash'}</Text>
            </View>
            {config.showSavingsTotal && order.discount > 0 && (
              <View style={styles.savingsRow}>
                <Text style={styles.savingsText}>{labels.savings}</Text>
                <Text style={[styles.savingsText, { fontWeight: 'bold' }]}>
                  {formatCurrency(order.discount, currency)}
                </Text>
              </View>
            )}
          </View>
        );

      case 'footer':
        return (
          <View key="footer" style={styles.footer}>
            <View style={styles.divider} />

            {config.showThankYouMessage ? (
              <Text style={styles.footerMsg}>{config.thankYouMessage || 'Thank You'}</Text>
            ) : (
              <Text style={styles.footerMsg}>Thank You</Text>
            )}

            {config.showNextVisitPromo && config.nextVisitPromoText && (
              <Text style={[styles.footerLine, { fontWeight: 'bold' }]}>{config.nextVisitPromoText}</Text>
            )}

            {(config.showLoyaltyPoints || config.showLoyaltyBalance) && (
              <View style={styles.loyaltyBox}>
                {config.showLoyaltyPoints && (
                  <Text style={styles.loyaltyItem}>Pts Earned: +{Math.floor((order.total || 0) / 10)}</Text>
                )}
                {config.showLoyaltyBalance && <Text style={styles.loyaltyItem}>Balance: 150 pts</Text>}
              </View>
            )}

            {config.showSocialMedia && config.socialMediaHandle && (
              <Text style={[styles.footerLine, { fontWeight: 'bold', marginTop: 2 }]}>{config.socialMediaHandle}</Text>
            )}

            {config.showSurveyQr && config.surveyUrl && (
              <Text style={styles.footerLine}>Rate us: {config.surveyUrl}</Text>
            )}

            {config.showReturnPolicy && config.returnPolicyText && (
              <Text style={[styles.footerDisclaimer, { marginTop: 5 }]}>{config.returnPolicyText}</Text>
            )}

            {config.showLegalDisclaimer && config.legalDisclaimerText && (
              <Text style={styles.footerDisclaimer}>{config.legalDisclaimerText}</Text>
            )}

            {config.showSignatureLine && (
              <View style={styles.signatureWrap}>
                <Text style={styles.signatureText}>{config.signatureLineText || 'Customer Signature'}</Text>
              </View>
            )}

            <Text style={styles.footerDisclaimer}>Goods once sold are not returnable.</Text>
          </View>
        );

      case 'codes':
        return (
          <View key="codes" style={{ alignItems: 'center', marginTop: 10 }}>
            {config.showQrCode && qrCodeUrl && <Image src={qrCodeUrl} style={{ width: 48, height: 48 }} />}

            {config.showBarcode && barcodeUrl && (
              <View style={styles.barcodeWrap}>
                <Image src={barcodeUrl} style={{ width: isThermal ? 120 : 160, height: 28, objectFit: 'contain' }} />
                <Text style={styles.barcodeNum}>{order.orderNumber}</Text>
              </View>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Document>
      <Page size={pageSize} style={styles.page}>
        {(config.sectionOrder || ['header', 'meta', 'items', 'totals', 'footer', 'codes']).map(section => renderSection(section))}
      </Page>
    </Document>
  );
};
