'use client';

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { Order } from '@/store/store';
import { format } from 'date-fns';

// ----------------------------------------------------------------
// 1. Enterprise Thermal Printer Styles (Strict Monochrome)
// ----------------------------------------------------------------
const styles = StyleSheet.create({
  ticketHeader: {
    alignItems: 'center',
    marginBottom: 10,
  },
  shopName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  ticketType: {
    fontSize: 12,
    letterSpacing: 1,
    borderBottomWidth: 1,
    borderBottomStyle: 'dashed',
    borderBottomColor: '#000',
    paddingBottom: 6,
    marginBottom: 6,
    width: '100%',
    textAlign: 'center',
  },
  orderNumberBox: {
    marginVertical: 10,
    alignItems: 'center',
  },
  orderNumberLabel: {
    fontSize: 10,
    color: '#444',
  },
  orderNumber: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
    borderStyle: 'solid',
    paddingVertical: 8,
    marginBottom: 10,
  },
  metaItem: {
    width: '50%',
    marginBottom: 4,
  },
  metaLabel: {
    fontSize: 8,
    color: '#666',
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  tableBox: {
    borderWidth: 2,
    borderColor: '#000',
    borderStyle: 'solid',
    padding: 8,
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#f0f0f0', // Translates to light gray dithering on thermal
  },
  tableLabel: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  tableNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  columnHeaders: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderBottomStyle: 'solid',
    paddingBottom: 4,
    marginBottom: 6,
  },
  colQty: { width: 30, fontSize: 9, fontWeight: 'bold' },
  colItem: { flex: 1, fontSize: 9, fontWeight: 'bold' },
  colPrice: { width: 45, fontSize: 9, fontWeight: 'bold', textAlign: 'right' },
  
  itemContainer: {
    marginBottom: 6,
  },
  itemMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  itemDetails: {
    color: '#333',
    marginLeft: 30,
    marginTop: 2,
    flexDirection: 'row',
  },
  bullet: {
    width: 10,
    fontSize: 10,
  },
  variantText: {
    flex: 1,
    fontSize: 10,
  },
  instructionsBox: {
    marginTop: 15,
    padding: 8,
    borderWidth: 2,
    borderColor: '#000',
    borderStyle: 'solid',
  },
  instructionsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomStyle: 'dashed',
    borderBottomColor: '#000',
    marginVertical: 10,
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 9,
    color: '#444',
    marginBottom: 2,
  },
  endOfTicket: {
    marginTop: 10,
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  }
});

// ----------------------------------------------------------------
// 2. Component Interface and Configuration
// ----------------------------------------------------------------
interface PDFKitchenTicketProps {
  order: Order;
  businessName?: string;
  kitchenTicketConfig?: {
    shopName?: string;
    ticketType?: 'KITCHEN' | 'RECEIPT';
    showTime?: boolean;
    showOrderType?: boolean;
    showCustomerName?: boolean;
    showTable?: boolean;
    showPrices?: boolean;
    showNotes?: boolean;
    fontSize?: 'small' | 'medium' | 'large';
    paperSize?: '80mm' | '58mm' | 'A5';
  };
}

export const PDFKitchenTicket = ({ order, businessName, kitchenTicketConfig }: PDFKitchenTicketProps) => {
  const config = {
    shopName: businessName || 'RESTAURANT NAME',
    ticketType: 'KITCHEN',
    showTime: true,
    showOrderType: true,
    showCustomerName: true,
    showTable: true,
    showPrices: false,
    showNotes: true,
    fontSize: 'medium',
    paperSize: '80mm',
    ...kitchenTicketConfig,
  } as const;

  // Determine base font size based on config
  const baseFontSize = config.fontSize === 'small' ? 10 : config.fontSize === 'large' ? 14 : 12;
  const qtyFontSize = baseFontSize + 2;

  const dynamicStyles = StyleSheet.create({
    page: {
      padding: config.paperSize === 'A5' ? 20 : 12,
      fontFamily: 'Helvetica',
      // Set fixed widths for thermal sizes (in points)
      width: config.paperSize === '58mm' ? 164 : config.paperSize === '80mm' ? 226 : '100%',
    },
    itemName: {
      fontSize: baseFontSize,
      fontWeight: 'bold',
      flex: 1, 
      textTransform: 'uppercase',
    },
    quantity: {
      width: 30,
      fontSize: qtyFontSize,
      fontWeight: 'bold',
    },
    instructionsText: {
      fontSize: baseFontSize,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    itemPrice: {
      width: 45,
      fontSize: baseFontSize,
      textAlign: 'right',
    },
  });

  const getPageSize = (): 'A5' | [number, number] => {
    switch (config.paperSize) {
      case '58mm':
        return [164, 500]; // Width, Max Height
      case '80mm':
        return [226, 500]; // Width, Max Height
      default:
        return 'A5';
    }
  };

  const totalItemsCount = order.items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <Document>
      <Page size={getPageSize()} style={dynamicStyles.page}>
        
        {/* ----------------- Header ----------------- */}
        <View style={styles.ticketHeader}>
          {config.shopName && <Text style={styles.shopName}>{config.shopName}</Text>}
          <Text style={styles.ticketType}>
            {config.ticketType === 'RECEIPT' ? 'CUSTOMER RECEIPT' : 'KITCHEN TICKET'}
          </Text>
        </View>

        {/* ----------------- Order Number ----------------- */}
        <View style={styles.orderNumberBox}>
          <Text style={styles.orderNumberLabel}>ORDER #</Text>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
        </View>

        {/* ----------------- Emphasized Table Box ----------------- */}
        {config.showTable && order.tableNumber && (
          <View style={styles.tableBox}>
            <Text style={styles.tableLabel}>TABLE</Text>
            <Text style={styles.tableNumber}>{order.tableNumber}</Text>
          </View>
        )}

        {/* ----------------- Meta Info Grid ----------------- */}
        <View style={styles.metaGrid}>
          {config.showOrderType && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Type</Text>
              <Text style={styles.metaValue}>{order.orderType}</Text>
            </View>
          )}
          {config.showCustomerName && order.customerName && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Customer</Text>
              <Text style={styles.metaValue}>{order.customerName}</Text>
            </View>
          )}
          {config.showTime && (
            <View style={{ width: '100%', marginBottom: 4 }}>
              <Text style={styles.metaLabel}>Order Time</Text>
              <Text style={styles.metaValue}>{format(new Date(order.createdAt), "dd MMM yyyy 'at' hh:mm a")}</Text>
            </View>
          )}
        </View>

        {/* ----------------- Column Headers ----------------- */}
        <View style={styles.columnHeaders}>
          <Text style={styles.colQty}>QTY</Text>
          <Text style={styles.colItem}>ITEM</Text>
          {config.showPrices && <Text style={styles.colPrice}>PRICE</Text>}
        </View>

        {/* ----------------- Items List ----------------- */}
        <View>
          {order.items.map((item, index) => (
            <View key={index} style={styles.itemContainer}>
              <View style={styles.itemMainRow}>
                <Text style={dynamicStyles.quantity}>{item.quantity}</Text>
                <Text style={dynamicStyles.itemName}>{item.productName}</Text>
                {config.showPrices && (
                  <Text style={dynamicStyles.itemPrice}>
                    ${((item.selectedUnit?.price || 0) * item.quantity).toFixed(2)}
                  </Text>
                )}
              </View>

              {/* Variant / Modifier Details */}
              {(item.variantName !== 'Default Variant' || item.selectedUnit?.unitName) && (
                <View style={styles.itemDetails}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.variantText}>
                    {item.variantName !== 'Default Variant' && `${item.variantName} `}
                    {item.selectedUnit?.unitName && `(${item.selectedUnit.unitName})`}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* ----------------- Special Instructions ----------------- */}
        {config.showNotes && order.instructions && (
          <View style={styles.instructionsBox}>
            <Text style={styles.instructionsTitle}>Special Instructions</Text>
            <Text style={dynamicStyles.instructionsText}>{order.instructions}</Text>
          </View>
        )}

        <View style={styles.divider} />

        {/* ----------------- Footer Summary ----------------- */}
        <View style={styles.footer}>
          <Text style={styles.timestamp}>Total Items: {totalItemsCount}</Text>
          <Text style={styles.timestamp}>Printed: {format(new Date(), "dd MMM yyyy 'at' hh:mm a")}</Text>
          
          <Text style={styles.endOfTicket}>- END OF TICKET -</Text>
        </View>
      </Page>
    </Document>
  );
};