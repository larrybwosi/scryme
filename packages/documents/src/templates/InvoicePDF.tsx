import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { InvoiceData } from './invoice-templates';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  invoiceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#555',
  },
  section: {
    marginBottom: 15,
  },
  label: {
    fontSize: 9,
    color: '#777',
    marginBottom: 2,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    padding: 5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    padding: 5,
  },
  col: {
    flex: 1,
  },
  col2: {
    flex: 2,
  },
  colRight: {
    textAlign: 'right',
  },
  totalSection: {
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    width: '30%',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  grandTotal: {
    fontWeight: 'bold',
    fontSize: 12,
    marginTop: 5,
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 5,
  },
});

export const InvoicePDF = ({ data }: { data: InvoiceData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View>
          <Text style={styles.companyName}>{data.company.name}</Text>
          <Text>{data.company.address}</Text>
        </View>
        <View style={styles.colRight}>
          <Text style={styles.invoiceTitle}>INVOICE</Text>
          <Text>#{data.invoiceNumber}</Text>
          <Text>{data.date}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>BILL TO</Text>
        <Text>{data.customerName}</Text>
        <Text>{data.customerAddress}</Text>
      </View>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.col2}>Description</Text>
          <Text style={[styles.col, styles.colRight]}>Qty</Text>
          <Text style={[styles.col, styles.colRight]}>Price</Text>
          <Text style={[styles.col, styles.colRight]}>Total</Text>
        </View>
        {data.items.map((item, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.col2}>{item.description || item.itemName}</Text>
            <Text style={[styles.col, styles.colRight]}>{item.qty || item.quantity}</Text>
            <Text style={[styles.col, styles.colRight]}>
              {data.currencySymbol}{(item.price || item.unitPrice || item.rate).toFixed(2)}
            </Text>
            <Text style={[styles.col, styles.colRight]}>
              {data.currencySymbol}{(item.amount || item.total).toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.totalSection}>
        <View style={styles.totalRow}>
          <Text>Subtotal</Text>
          <Text>{data.currencySymbol}{data.subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text>Tax</Text>
          <Text>{data.currencySymbol}{data.tax.toFixed(2)}</Text>
        </View>
        <View style={[styles.totalRow, styles.grandTotal]}>
          <Text>Total</Text>
          <Text>{data.currencySymbol}{(data.total || data.grandTotal || 0).toFixed(2)}</Text>
        </View>
      </View>

      {data.notes && (
        <View style={{ marginTop: 20 }}>
          <Text style={styles.label}>NOTES</Text>
          <Text>{data.notes}</Text>
        </View>
      )}
    </Page>
  </Document>
);
