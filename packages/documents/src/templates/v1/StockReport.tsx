import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { StockReportData } from '../../types';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  logo: {
    width: 60,
    height: 60,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  orgInfo: {
    textAlign: 'right',
  },
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  col: {
    fontSize: 9,
  },
  colProduct: { width: '40%' },
  colSku: { width: '20%' },
  colStock: { width: '20%', textAlign: 'right' },
  colUnit: { width: '20%', textAlign: 'right' },
});

export const StockReport = ({ data }: { data: StockReportData }) => {
  const branding = data.branding;
  return (
  <Document>
    <Page style={styles.page} size="A4">
      <View style={styles.header}>
        <View>
          {branding?.logoUrl && <Image src={branding.logoUrl} style={styles.logo} />}
          <Text style={styles.title}>Stock Level Report</Text>
          <Text style={{ fontSize: 12 }}>{data.name}</Text>
        </View>
        <View style={styles.orgInfo}>
          <Text>{branding?.companyName || 'Organization'}</Text>
          <Text style={{ fontSize: 10, color: '#666' }}>Generated on: {String(data.date)}</Text>
          <Text style={{ fontSize: 10, color: '#666' }}>By: {data.generatedBy}</Text>
        </View>
      </View>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.col, styles.colProduct]}>Product / Variant</Text>
          <Text style={[styles.col, styles.colSku]}>SKU</Text>
          <Text style={[styles.col, styles.colStock]}>Current Stock</Text>
          <Text style={[styles.col, styles.colUnit]}>Unit</Text>
        </View>
        {data.items.map((item, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={[styles.col, styles.colProduct]}>{item.productName} {item.variantName}</Text>
            <Text style={[styles.col, styles.colSku]}>{item.sku}</Text>
            <Text style={[styles.col, styles.colStock]}>{item.currentStock}</Text>
            <Text style={[styles.col, styles.colUnit]}>{item.unit}</Text>
          </View>
        ))}
      </View>
    </Page>
  </Document>
  );
};
