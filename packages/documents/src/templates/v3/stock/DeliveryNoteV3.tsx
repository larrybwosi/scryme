import React from 'react';
import {
  Page,
  Text,
  View,
  Document,
  Image,
  StyleSheet,
} from '@react-pdf/renderer';
import { format } from 'date-fns';
import { DeliveryNoteData } from '../../../types';

// ─── Styles ───────────────────────────────────────────────────────────────────

const getStyles = (primary = '#0f172a') =>
  StyleSheet.create({
    page: {
      fontFamily: 'Helvetica',
      fontSize: 9,
      color: '#1e293b',
      backgroundColor: '#ffffff',
      padding: 0,
    },
    accentBar: {
      height: 5,
      backgroundColor: primary,
    },
    // White header section
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingHorizontal: 40,
      paddingTop: 24,
      paddingBottom: 20,
      borderBottom: '1px solid #e2e8f0',
    },
    logo: {
      width: 52,
      height: 52,
      objectFit: 'contain',
      marginBottom: 8,
    },
    companyName: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#0f172a',
    },
    companyMeta: {
      fontSize: 8,
      color: '#64748b',
      marginTop: 2,
    },
    docTitleBlock: {
      alignItems: 'flex-end',
    },
    docTitle: {
      fontSize: 26,
      fontWeight: 'bold',
      color: primary,
      letterSpacing: 2,
    },
    docMeta: {
      fontSize: 8,
      color: '#64748b',
      marginTop: 3,
    },
    docMetaBold: {
      fontFamily: 'Helvetica-Bold',
      color: '#1e293b',
    },
    // Address grid
    addressGrid: {
      flexDirection: 'row',
      paddingHorizontal: 40,
      paddingTop: 20,
      paddingBottom: 20,
      gap: 16,
      borderBottom: '1px solid #f1f5f9',
    },
    addressCard: {
      flex: 1,
      border: '1.5px solid #e2e8f0',
      borderRadius: 8,
      overflow: 'hidden',
    },
    cardHeader: {
      backgroundColor: primary,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    cardHeaderBlue: {
      backgroundColor: '#1e40af',
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    cardTitle: {
      fontSize: 8,
      fontWeight: 'bold',
      color: '#ffffff',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    cardBody: {
      padding: 12,
    },
    nameText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#0f172a',
      marginBottom: 5,
    },
    addressText: {
      fontSize: 9,
      color: '#475569',
      lineHeight: 1.5,
      marginBottom: 6,
    },
    contactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
    },
    contactLabel: {
      width: 40,
      fontSize: 7,
      color: '#94a3b8',
      fontWeight: 'bold',
      textTransform: 'uppercase',
    },
    contactValue: {
      fontSize: 8,
      color: '#1e293b',
    },
    // Items table
    tableContainer: {
      paddingHorizontal: 40,
      paddingTop: 20,
      paddingBottom: 16,
    },
    sectionTitle: {
      fontSize: 8,
      fontWeight: 'bold',
      color: '#64748b',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: '#f1f5f9',
      borderRadius: 4,
      paddingVertical: 8,
      paddingHorizontal: 10,
      marginBottom: 2,
    },
    th: {
      fontSize: 7,
      fontWeight: 'bold',
      color: '#64748b',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    tableRow: {
      flexDirection: 'row',
      borderBottom: '1px solid #f1f5f9',
      paddingVertical: 9,
      paddingHorizontal: 10,
      alignItems: 'center',
    },
    tableRowAlt: { backgroundColor: '#fafafa' },
    td: { fontSize: 9, color: '#334155' },
    colIndex: { width: '5%', color: '#94a3b8', fontSize: 8 },
    colSku: { width: '18%' },
    colDesc: { width: '57%' },
    colQty: { width: '10%', textAlign: 'center' },
    colCondition: { width: '10%', textAlign: 'center' },
    // Notes section
    notesSection: {
      marginHorizontal: 40,
      marginBottom: 16,
      padding: 12,
      backgroundColor: '#fffbeb',
      border: '1px solid #fde68a',
      borderLeft: '4px solid #f59e0b',
      borderRadius: 6,
    },
    notesLabel: {
      fontSize: 7,
      fontWeight: 'bold',
      color: '#92400e',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    notesText: {
      fontSize: 9,
      color: '#78350f',
      lineHeight: 1.5,
    },
    // OTP box
    otpSection: {
      marginHorizontal: 40,
      marginBottom: 16,
      padding: 14,
      backgroundColor: '#eff6ff',
      border: '1px dashed #93c5fd',
      borderRadius: 8,
      alignItems: 'center',
    },
    otpLabel: {
      fontSize: 8,
      color: '#1d4ed8',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    otpValue: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#1e40af',
      letterSpacing: 3,
      fontFamily: 'Helvetica-Bold',
    },
    // Signature section
    signatureSection: {
      marginHorizontal: 40,
      marginTop: 8,
      borderTop: '2px solid #e2e8f0',
      paddingTop: 20,
    },
    signatureRow: {
      flexDirection: 'row',
      gap: 24,
    },
    signBox: { flex: 1 },
    signLine: {
      borderBottom: '1.5px solid #cbd5e1',
      height: 50,
      marginBottom: 6,
    },
    signLabel: {
      fontSize: 7,
      color: '#64748b',
      textAlign: 'center',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    signDate: {
      fontSize: 7,
      color: '#94a3b8',
      textAlign: 'center',
      marginTop: 2,
    },
    bottomBar: {
      backgroundColor: primary,
      paddingHorizontal: 40,
      paddingVertical: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 20,
    },
    bottomBarText: { fontSize: 7, color: '#94a3b8' },
    bottomBarOrg: { fontSize: 8, fontWeight: 'bold', color: '#ffffff' },
  });

const formatAddress = (address: any): string => {
  if (!address) return '';
  if (typeof address === 'string') return address;
  return [
    address.street,
    address.city,
    address.state,
    address.zipCode,
    address.country,
  ]
    .filter(Boolean)
    .join(', ');
};

// ─── Component ────────────────────────────────────────────────────────────────

export const DeliveryNoteV3Document = ({
  data,
}: {
  data: DeliveryNoteData;
}) => {
  const primary = data.branding?.primaryColor || '#0f172a';
  const styles = getStyles(primary);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.accentBar} />

        {/* Header */}
        <View style={styles.header}>
          <View>
            {data.branding?.logoUrl && (
              <Image src={data.branding.logoUrl} style={styles.logo} />
            )}
            <Text style={styles.companyName}>
              {data.branding?.companyName || 'Our Company'}
            </Text>
            {data.branding?.companyAddress && (
              <Text style={styles.companyMeta}>
                {data.branding.companyAddress}
              </Text>
            )}
            {data.branding?.companyPhone && (
              <Text style={styles.companyMeta}>
                {data.branding.companyPhone}
              </Text>
            )}
          </View>
          <View style={styles.docTitleBlock}>
            <Text style={styles.docTitle}>DELIVERY NOTE</Text>
            <Text style={styles.docMeta}>
              Note No:{' '}
              <Text style={styles.docMetaBold}>{data.number}</Text>
            </Text>
            {data.orderNumber && (
              <Text style={styles.docMeta}>
                Order:{' '}
                <Text style={styles.docMetaBold}>{data.orderNumber}</Text>
              </Text>
            )}
            <Text style={styles.docMeta}>
              Date:{' '}
              <Text style={styles.docMetaBold}>
                {format(new Date(data.date), 'MMM dd, yyyy')}
              </Text>
            </Text>
          </View>
        </View>

        {/* Address Grid */}
        <View style={styles.addressGrid}>
          <View style={styles.addressCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Customer</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.nameText}>{data.customer.name}</Text>
              {data.customer.email && (
                <View style={styles.contactRow}>
                  <Text style={styles.contactLabel}>Email</Text>
                  <Text style={styles.contactValue}>{data.customer.email}</Text>
                </View>
              )}
              {data.customer.phone && (
                <View style={styles.contactRow}>
                  <Text style={styles.contactLabel}>Phone</Text>
                  <Text style={styles.contactValue}>{data.customer.phone}</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.addressCard}>
            <View style={styles.cardHeaderBlue}>
              <Text style={styles.cardTitle}>Shipping Address</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.addressText}>
                {formatAddress(data.shippingAddress)}
              </Text>
            </View>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.tableContainer}>
          <Text style={styles.sectionTitle}>Items Delivered</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.colIndex]}>#</Text>
            <Text style={[styles.th, styles.colSku]}>SKU</Text>
            <Text style={[styles.th, styles.colDesc]}>Description</Text>
            <Text style={[styles.th, styles.colQty]}>Qty</Text>
            <Text style={[styles.th, styles.colCondition]}>Condition</Text>
          </View>

          {data.items.map((item, i) => (
            <View
              key={i}
              style={[
                styles.tableRow,
                i % 2 !== 0 ? styles.tableRowAlt : {},
              ]}>
              <Text style={[styles.td, styles.colIndex, { color: '#94a3b8' }]}>
                {i + 1}
              </Text>
              <Text
                style={[
                  styles.td,
                  styles.colSku,
                  { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#1d4ed8' },
                ]}>
                {item.sku || '—'}
              </Text>
              <Text style={[styles.td, styles.colDesc]}>{item.description}</Text>
              <Text
                style={[
                  styles.td,
                  styles.colQty,
                  { textAlign: 'center', fontFamily: 'Helvetica-Bold' },
                ]}>
                {item.quantity}
              </Text>
              <Text
                style={[
                  styles.td,
                  styles.colCondition,
                  { textAlign: 'center', color: '#16a34a', fontSize: 8 },
                ]}>
                Good
              </Text>
            </View>
          ))}
        </View>

        {/* Notes */}
        {data.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Special Instructions / Notes</Text>
            <Text style={styles.notesText}>{data.notes}</Text>
          </View>
        )}

        {/* Signature section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureRow}>
            <View style={styles.signBox}>
              <View style={styles.signLine} />
              <Text style={styles.signLabel}>Issued By</Text>
              <Text style={styles.signDate}>Name &amp; Date</Text>
            </View>
            <View style={styles.signBox}>
              <View style={styles.signLine} />
              <Text style={styles.signLabel}>Driver / Courier</Text>
              <Text style={styles.signDate}>Name &amp; Date</Text>
            </View>
            <View style={styles.signBox}>
              <View style={styles.signLine} />
              <Text style={styles.signLabel}>Received By (Customer)</Text>
              <Text style={styles.signDate}>Name &amp; Date</Text>
            </View>
          </View>
        </View>

        {/* Bottom bar */}
        <View style={styles.bottomBar}>
          <Text style={styles.bottomBarText}>
            {format(new Date(data.date), 'dd/MM/yyyy')} · Delivery Note v3
          </Text>
          <Text style={styles.bottomBarOrg}>
            {data.branding?.companyName || 'Our Company'}
          </Text>
          <Text style={styles.bottomBarText}>
            Thank you for your business.
          </Text>
        </View>
      </Page>
    </Document>
  );
};
