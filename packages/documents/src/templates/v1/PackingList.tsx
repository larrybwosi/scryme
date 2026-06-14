import React from 'react';
import { Page, Text, View, Document, Image, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { PackingListData, DocumentFormat, Address } from '../../types';
import { getA4CommonStyles } from '../../styles';

const formatAddress = (address: string | Address | undefined) => {
  if (!address) return '';
  if (typeof address === 'string') return address;
  const parts = [
    address.street,
    address.city && address.state ? `${address.city}, ${address.state} ${address.zipCode || ''}`.trim() : address.city || address.state,
    address.country,
  ];
  return parts.filter(Boolean).join('\n');
};

const getA4Styles = (primaryColor = '#2563eb') => {
  const common = getA4CommonStyles(primaryColor);
  return {
    ...common,
    grid: StyleSheet.create({
      view: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 25,
      }
    }).view,
    addressBlock: StyleSheet.create({
      view: {
        flex: 1,
      }
    }).view,
    colSku: { width: '20%' },
    colDesc: { width: '50%' },
    colOrdered: { width: '15%', textAlign: 'center' as const },
    colPacked: { width: '15%', textAlign: 'center' as const },
    notes: StyleSheet.create({
      view: {
        marginTop: 20,
        padding: 10,
        backgroundColor: '#f8fafc',
        borderRadius: 4,
      }
    }).view,
  };
};

const getThermalStyles = (primaryColor = '#000000') => StyleSheet.create({
  page: {
    padding: 10,
    width: 226,
    fontFamily: 'Helvetica',
    fontSize: 9,
  },
  header: {
    textAlign: 'center',
    marginBottom: 10,
    borderBottom: '1px solid #eee',
    paddingBottom: 5,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  section: {
    marginVertical: 5,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 10,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  table: {
    marginTop: 5,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottom: '1px solid #000',
    paddingVertical: 2,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #eee',
    paddingVertical: 3,
  },
  colDesc: { width: '60%' },
  colQty: { width: '40%', textAlign: 'right' },
  footer: {
    marginTop: 15,
    textAlign: 'center',
    borderTop: '1px dashed #eee',
    paddingTop: 10,
  },
});

const A4PackingList = ({ data }: { data: PackingListData }) => {
  const styles = getA4Styles(data.branding?.primaryColor);
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.headerAccent} />
      <View style={styles.header}>
        <View style={styles.companyInfo}>
          {data.branding?.logoUrl && <Image src={data.branding.logoUrl} style={styles.logo} />}
          <Text style={styles.companyName}>{data.branding?.companyName || 'Our Company'}</Text>
          <Text style={styles.metaText}>{data.branding?.companyAddress}</Text>
        </View>
        <View style={styles.docTitleSection}>
          <Text style={styles.docTitle}>PACKING LIST</Text>
          <Text style={styles.metaText}>Order No: {data.orderNumber}</Text>
          <Text style={styles.metaText}>Date: {format(new Date(data.date), 'MMM dd, yyyy')}</Text>
        </View>
      </View>

      <View style={styles.grid}>
        <View style={styles.addressBlock}>
          <Text style={styles.sectionTitle}>Customer</Text>
          <Text style={{ fontWeight: 'bold' }}>{data.customer.name}</Text>
          {data.customer.email && <Text>{data.customer.email}</Text>}
          {data.customer.phone && <Text>{data.customer.phone}</Text>}
        </View>
        <View style={styles.addressBlock}>
          <Text style={styles.sectionTitle}>Shipping Address</Text>
          <Text>{formatAddress(data.shippingAddress)}</Text>
        </View>
      </View>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCol, styles.colSku]}>SKU</Text>
          <Text style={[styles.tableHeaderCol, styles.colDesc]}>Description</Text>
          <Text style={[styles.tableHeaderCol, styles.colOrdered]}>Ordered</Text>
          <Text style={[styles.tableHeaderCol, styles.colPacked]}>Packed</Text>
        </View>
        {data.items.map((item, index) => (
          <View key={index} style={[styles.tableRow, { alignItems: 'center' }]}>
            <Text style={[styles.colSku]}>{item.sku || '-'}</Text>
            <Text style={[styles.colDesc]}>{item.description}</Text>
            <Text style={[styles.colOrdered]}>{item.quantity}</Text>
            <Text style={[styles.colPacked]}>{item.quantityPacked ?? '___'}</Text>
          </View>
        ))}
      </View>

      {data.notes && (
        <View style={styles.notes}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text>{data.notes}</Text>
        </View>
      )}

      <Text style={styles.footer}>
        {data.branding?.companyName} | {data.branding?.companyWebsite || ''}
      </Text>
    </Page>
  );
};

const ThermalPackingList = ({ data }: { data: PackingListData }) => {
  const styles = getThermalStyles(data.branding?.primaryColor);
  return (
    <Page size={{ width: 226, height: 'auto' }} style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>PACKING LIST</Text>
        <Text>{data.branding?.companyName}</Text>
        <Text>Order: {data.orderNumber}</Text>
        <Text>Date: {format(new Date(data.date), 'dd/MM/yyyy')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ship To:</Text>
        <Text>{data.customer.name}</Text>
        <Text>{formatAddress(data.shippingAddress)}</Text>
      </View>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.colDesc}>Item</Text>
          <Text style={styles.colQty}>Qty</Text>
        </View>
        {data.items.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.colDesc}>{item.description}</Text>
            <Text style={styles.colQty}>{item.quantity}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text>Check items carefully.</Text>
        <Text>Thank you!</Text>
      </View>
    </Page>
  );
};

export const PackingListDocument = ({ data, format = 'A4' }: { data: PackingListData; format?: DocumentFormat }) => {
  return (
    <Document>
      {format === 'THERMAL' ? <ThermalPackingList data={data} /> : <A4PackingList data={data} />}
    </Document>
  );
};
