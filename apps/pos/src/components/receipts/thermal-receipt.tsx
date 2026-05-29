import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { useFormattedCurrency } from '@/lib/utils';
import { OrganizationData, PaymentData, ReceiptConfig } from './types';
import { CartItem } from '@/types';

const createStyles = (config: ReceiptConfig) =>
  StyleSheet.create({
    page: {
      flexDirection: 'column',
      backgroundColor: config.backgroundColor,
      padding: config.padding * 0.5, // Reduced padding
      width: config.width,
      minHeight: 'auto',
      fontSize: config.bodySize - 2, // Reduced base font size
      fontFamily: 'Helvetica',
    },
    header: {
      alignItems:
        config.logoPosition === 'left' ? 'flex-start' : config.logoPosition === 'right' ? 'flex-end' : 'center',
      marginBottom: config.spacing, // Reduced spacing
      paddingBottom: config.spacing * 0.5,
      ...(config.showDivider && {
        borderBottomWidth: config.dividerWidth,
        borderBottomColor: config.primaryColor,
        borderBottomStyle: 'solid',
      }),
    },
    companyName: {
      fontSize: config.titleSize - 2,
      fontWeight: 'bold',
      color: config.primaryColor,
      marginBottom: 1,
      textAlign: config.logoPosition,
      fontFamily: 'Helvetica-Bold',
    },
    companyDetails: {
      fontSize: config.bodySize - 2,
      color: config.secondaryColor,
      textAlign: config.logoPosition,
      marginBottom: 1,
    },
    invoiceTitle: {
      fontSize: config.headerSize - 2,
      fontWeight: 'bold',
      color: config.primaryColor,
      marginTop: config.spacing * 0.5,
      marginBottom: config.spacing * 0.5,
      textAlign: config.logoPosition,
      fontFamily: 'Helvetica-Bold',
    },
    invoiceDetails: {
      fontSize: config.bodySize - 2,
      color: config.secondaryColor,
      marginBottom: 1,
      textAlign: config.logoPosition,
    },
    section: {
      marginBottom: config.spacing,
    },
    sectionTitle: {
      fontSize: config.headerSize - 4,
      fontWeight: 'bold',
      color: config.primaryColor,
      marginBottom: config.spacing * 0.5,
      textAlign: 'left',
      textTransform: 'uppercase',
      fontFamily: 'Helvetica-Bold',
    },
    customerInfo: {
      marginBottom: config.spacing * 0.5,
    },
    customerRow: {
      flexDirection: 'row',
      marginBottom: 1,
    },
    customerLabel: {
      fontSize: config.bodySize - 2,
      fontWeight: 'bold',
      width: 40,
      color: config.primaryColor,
      fontFamily: 'Helvetica-Bold',
    },
    customerValue: {
      fontSize: config.bodySize - 2,
      color: config.secondaryColor,
      flex: 1,
    },
    table: {
      width: '100%',
    },
    tableHeader: {
      flexDirection: 'row',
      paddingBottom: 1,
      marginBottom: 1,
      ...(config.showDivider && {
        borderBottomWidth: config.dividerWidth * 0.5,
        borderBottomColor: config.secondaryColor,
        borderBottomStyle: 'solid',
      }),
    },
    tableHeaderCell: {
      fontSize: config.bodySize - 2,
      fontWeight: 'bold',
      color: config.primaryColor,
      fontFamily: 'Helvetica-Bold',
    },
    tableRow: {
      flexDirection: 'row',
      marginBottom: 1,
      alignItems: 'flex-start',
    },
    itemName: {
      width: '55%', // Slightly wider for name
      fontSize: config.bodySize - 2,
      color: config.primaryColor,
    },
    itemQty: {
      width: '10%',
      fontSize: config.bodySize - 2,
      color: config.secondaryColor,
      textAlign: 'center',
    },
    itemPrice: {
      width: '17.5%',
      fontSize: config.bodySize - 2,
      color: config.secondaryColor,
      textAlign: 'right',
    },
    itemTotal: {
      width: '17.5%',
      fontSize: config.bodySize - 2,
      color: config.primaryColor,
      textAlign: 'right',
    },
    itemVariant: {
      fontSize: config.bodySize - 3,
      color: config.secondaryColor,
      marginTop: 0,
    },
    divider: {
      ...(config.showDivider && {
        borderTopWidth: config.dividerWidth,
        borderTopColor: config.primaryColor,
        borderTopStyle: 'solid',
      }),
      marginVertical: config.spacing * 0.5,
    },
    totalsSection: {
      marginTop: config.spacing * 0.5,
    },
    totalsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 1,
    },
    totalsLabel: {
      fontSize: config.bodySize - 2,
      color: config.secondaryColor,
    },
    totalsValue: {
      fontSize: config.bodySize - 2,
      color: config.primaryColor,
      textAlign: 'right',
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: config.spacing * 0.5,
      paddingTop: config.spacing * 0.5,
      ...(config.showDivider && {
        borderTopWidth: config.dividerWidth,
        borderTopColor: config.primaryColor,
        borderTopStyle: 'solid',
      }),
    },
    totalLabel: {
      fontSize: config.headerSize - 2,
      fontWeight: 'bold',
      color: config.primaryColor,
      fontFamily: 'Helvetica-Bold',
    },
    totalValue: {
      fontSize: config.headerSize - 2,
      fontWeight: 'bold',
      color: config.primaryColor,
      textAlign: 'right',
      fontFamily: 'Helvetica-Bold',
    },
    paymentSection: {
      marginTop: config.spacing,
      paddingTop: config.spacing * 0.5,
      ...(config.showDivider && {
        borderTopWidth: config.dividerWidth,
        borderTopColor: config.primaryColor,
        borderTopStyle: 'solid',
      }),
    },
    paymentRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 1,
    },
    paymentLabel: {
      fontSize: config.bodySize - 2,
      color: config.primaryColor,
      fontWeight: 'bold',
      fontFamily: 'Helvetica-Bold',
    },
    paymentValue: {
      fontSize: config.bodySize - 2,
      color: config.secondaryColor,
      textAlign: 'right',
    },
    footer: {
      marginTop: config.spacing * 2,
      textAlign: 'center',
      paddingTop: config.spacing,
      ...(config.showDivider && {
        borderTopWidth: config.dividerWidth,
        borderTopColor: config.secondaryColor,
        borderTopStyle: 'solid',
      }),
    },
    footerText: {
      fontSize: config.bodySize - 2,
      color: config.secondaryColor,
      marginBottom: 1,
      textAlign: 'center',
    },
    orderNotes: {
      marginTop: config.spacing,
      paddingTop: config.spacing * 0.5,
      ...(config.showDivider && {
        borderTopWidth: config.dividerWidth,
        borderTopColor: config.secondaryColor,
        borderTopStyle: 'solid',
      }),
    },
    noteTitle: {
      fontSize: config.bodySize - 1,
      fontWeight: 'bold',
      color: config.primaryColor,
      marginBottom: 1,
      fontFamily: 'Helvetica-Bold',
    },
    noteText: {
      fontSize: config.bodySize - 2,
      color: config.secondaryColor,
      marginBottom: config.spacing * 0.5,
    },
    promoSection: {
      marginTop: config.spacing * 0.5,
      paddingTop: config.spacing * 0.5,
      ...(config.showDivider && {
        borderTopWidth: config.dividerWidth,
        borderTopColor: config.secondaryColor,
        borderTopStyle: 'solid',
      }),
    },
    perforation: {
      marginTop: config.spacing,
      borderTopStyle: 'solid',
      borderTopWidth: 1,
      borderTopColor: config.secondaryColor,
      height: 10,
    },
  });

// Helper components for better organization
const HeaderSection = ({
  organization,
  config,
  paymentData,
  orderType,
  currentDate,
  currentTime,
  styles,
}: {
  organization: OrganizationData;
  config: ReceiptConfig;
  paymentData: PaymentData;
  orderType?: string;
  currentDate: string;
  currentTime: string;
  styles: any;
}) => (
  <View style={styles.header}>
    <Text style={styles.companyName}>{organization.name}</Text>
    {organization.tagline && <Text style={styles.companyDetails}>{organization.tagline}</Text>}
    <Text style={styles.companyDetails}>{organization.address}</Text>
    <Text style={styles.companyDetails}>Tel: {organization.phone}</Text>
    {organization.email && <Text style={styles.companyDetails}>Email: {organization.email}</Text>}
    {organization.website && <Text style={styles.companyDetails}>{organization.website}</Text>}

    <Text style={styles.invoiceTitle}>{config.receiptTitle}</Text>
    {config.showReceiptNumber && <Text style={styles.invoiceDetails}>Order: {paymentData.orderId}</Text>}
    {config.showDateTime && (
      <Text style={styles.invoiceDetails}>
        {currentDate} {currentTime}
      </Text>
    )}
    {orderType && config.showOrderType && (
      <Text style={styles.invoiceDetails}>Order Type: {orderType.charAt(0).toUpperCase() + orderType.slice(1)}</Text>
    )}
  </View>
);

const CustomerSection = ({ paymentData, styles }: { config: ReceiptConfig; paymentData: PaymentData; styles: any }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Customer</Text>
    <View style={styles.customerInfo}>
      {paymentData.customerName && (
        <View style={styles.customerRow}>
          <Text style={styles.customerLabel}>Name:</Text>
          <Text style={styles.customerValue}>{paymentData.customerName}</Text>
        </View>
      )}
      {paymentData.customerPhone && (
        <View style={styles.customerRow}>
          <Text style={styles.customerLabel}>Phone:</Text>
          <Text style={styles.customerValue}>{paymentData.customerPhone}</Text>
        </View>
      )}
    </View>
  </View>
);

const ItemsSection = ({
  items,
  formatCurrency,
  styles,
}: {
  items: CartItem[];
  formatCurrency: (amount: number) => string;
  styles: any;
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Items</Text>
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderCell, { width: '55%' }]}>Item</Text>
        <Text style={[styles.tableHeaderCell, { width: '10%', textAlign: 'center' }]}>Qty</Text>
        <Text style={[styles.tableHeaderCell, { width: '17.5%', textAlign: 'right' }]}>Price</Text>
        <Text style={[styles.tableHeaderCell, { width: '17.5%', textAlign: 'right' }]}>Total</Text>
      </View>

      {items.map((item, index) => {
        const shouldShowVariant =
          item.variant &&
          !['default', 'default variant', 'n/a'].includes(item.variant.toLowerCase()) &&
          {
            /* @ts-ignore */
          };
        // item.variant.toLowerCase() !== item.name.toLowerCase();

        return (
          <View key={index}>
            <View style={styles.tableRow}>
              <View style={styles.itemName}>
                <Text>
                  {/* @ts-ignore */}
                  {item.name}
                  {shouldShowVariant ? ` - ${item.variant}` : ''}
                </Text>
                {item.addition && <Text style={styles.itemVariant}>+ {item.addition}</Text>}
              </View>
              <Text style={styles.itemQty}>{item.quantity}</Text>
              <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
              <Text style={styles.itemTotal}>{formatCurrency(item.price * item.quantity)}</Text>
            </View>
          </View>
        );
      })}
    </View>
  </View>
);

const TotalsSection = ({
  config,
  subtotal,
  discount,
  tax,
  total,
  formatCurrency,
  styles,
}: {
  config: ReceiptConfig;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  formatCurrency: (amount: number) => string;
  styles: any;
}) => (
  <View style={styles.totalsSection}>
    <View style={styles.totalsRow}>
      <Text style={styles.totalsLabel}>Subtotal:</Text>
      <Text style={styles.totalsValue}>{formatCurrency(subtotal)}</Text>
    </View>
    {config.showDiscount && discount > 0 && (
      <View style={styles.totalsRow}>
        <Text style={styles.totalsLabel}>Discount (10%):</Text>
        <Text style={styles.totalsValue}>-{formatCurrency(discount)}</Text>
      </View>
    )}
    {config.showTax && tax > 0 && (
      <View style={styles.totalsRow}>
        <Text style={styles.totalsLabel}>Tax (2.5%):</Text>
        <Text style={styles.totalsValue}>{formatCurrency(tax)}</Text>
      </View>
    )}
    <View style={styles.totalRow}>
      <Text style={styles.totalLabel}>TOTAL:</Text>
      <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
    </View>
  </View>
);

const PaymentSection = ({
  config,
  paymentData,
  formatCurrency,
  styles,
}: {
  config: ReceiptConfig;
  paymentData: PaymentData;
  formatCurrency: (amount: number) => string;
  styles: any;
}) => (
  <View style={styles.paymentSection}>
    <Text style={styles.sectionTitle}>Payment</Text>
    {config.showPaymentMethod && (
      <View style={styles.paymentRow}>
        <Text style={styles.paymentLabel}>Method:</Text>
        <Text style={styles.paymentValue}>
          {paymentData.paymentMethod === 'cash'
            ? 'Cash'
            : paymentData.paymentMethod === 'mobile'
              ? 'Mobile Payment'
              : 'Card Payment'}
        </Text>
      </View>
    )}
    {config.showAmountReceived && (
      <View style={styles.paymentRow}>
        <Text style={styles.paymentLabel}>Paid:</Text>
        <Text style={styles.paymentValue}>{formatCurrency(paymentData.amountPaid)}</Text>
      </View>
    )}
    {config.showChange && paymentData.change > 0 && (
      <View style={styles.paymentRow}>
        <Text style={styles.paymentLabel}>Change:</Text>
        <Text style={styles.paymentValue}>{formatCurrency(paymentData.change)}</Text>
      </View>
    )}
  </View>
);

const NotesSection = ({
  config,
  notes,
  specialInstructions,
  promoCode,
  styles,
}: {
  config: ReceiptConfig;
  notes?: string;
  specialInstructions?: string;
  promoCode?: string;
  styles: any;
}) => (
  <>
    {config.showOrderNotes && notes && (
      <View style={styles.orderNotes}>
        <Text style={styles.noteTitle}>{config.notesTitle}</Text>
        <Text style={styles.noteText}>{notes}</Text>
      </View>
    )}

    {config.showSpecialInstructions && specialInstructions && (
      <View style={styles.orderNotes}>
        <Text style={styles.noteTitle}>{config.instructionsTitle}</Text>
        <Text style={styles.noteText}>{specialInstructions}</Text>
      </View>
    )}

    {config.showPromoCode && promoCode && (
      <View style={styles.promoSection}>
        <Text style={styles.noteTitle}>{config.promoCodeText}</Text>
        <Text style={styles.noteText}>{promoCode}</Text>
      </View>
    )}
  </>
);

const FooterSection = ({
  config,
  organization,
  styles,
}: {
  config: ReceiptConfig;
  organization: OrganizationData;
  styles: any;
}) => (
  <View style={styles.footer}>
    <Text style={styles.footerText}>{config.thankYouMessage}</Text>
    {organization.email && <Text style={styles.footerText}>Questions? Email: {organization.email}</Text>}
    <Text style={styles.footerText}>{config.footerText}</Text>
  </View>
);

export interface EnhancedThermalReceiptPDFProps {
  items: CartItem[];
  paymentData: PaymentData;
  qrCodeImage?: string;
  organization: OrganizationData;
  config: ReceiptConfig;
  orderType?: 'dine-in' | 'takeaway' | 'delivery';
  notes?: string;
  promoCode?: string;
  specialInstructions?: string;
}

export const EnhancedThermalReceiptPDF = ({
  items,
  paymentData,
  organization,
  config,
  orderType,
  notes,
  promoCode,
  specialInstructions,
}: EnhancedThermalReceiptPDFProps) => {
  const styles = createStyles(config);
  const formatCurrency = useFormattedCurrency();

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = config.showDiscount ? subtotal * 0.1 : 0;
  const tax = config.showTax ? subtotal * 0.025 : 0;
  const total = subtotal - discount + tax;

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <Document>
      <Page size={[config.width, 600]} style={styles.page}>
        {/* Header */}
        {config.showHeader && (
          <HeaderSection
            organization={organization}
            config={config}
            paymentData={paymentData}
            orderType={orderType}
            currentDate={currentDate}
            currentTime={currentTime}
            styles={styles}
          />
        )}

        {/* Customer Information */}
        {config.showCustomerInfo && (paymentData.customerName || paymentData.customerPhone) && (
          <CustomerSection config={config} paymentData={paymentData} styles={styles} />
        )}

        {/* Order Items */}
        {config.showItemsSection && <ItemsSection items={items} formatCurrency={formatCurrency} styles={styles} />}

        {config.showDivider && <View style={styles.divider} />}

        {/* Totals */}
        {config.showTotalsSection && (
          <TotalsSection
            config={config}
            subtotal={subtotal}
            discount={discount}
            tax={tax}
            total={total}
            formatCurrency={formatCurrency}
            styles={styles}
          />
        )}

        {/* Payment Information */}
        {config.showPaymentSection && (
          <PaymentSection config={config} paymentData={paymentData} formatCurrency={formatCurrency} styles={styles} />
        )}

        {/* Notes Section */}
        <NotesSection
          config={config}
          notes={notes}
          specialInstructions={specialInstructions}
          promoCode={promoCode}
          styles={styles}
        />

        {/* Footer */}
        {config.showFooter && <FooterSection config={config} organization={organization} styles={styles} />}

        {/* Perforation */}
        {config.showPerforation && <View style={styles.perforation} />}
      </Page>
    </Document>
  );
};
