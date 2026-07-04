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
import { WaybillData, Address } from '../../../types';

// ─── Re-export the format type ─────────────────────────────────────────────
export type WaybillV3Format = 'A4' | 'THERMAL';

// ─── Styles ───────────────────────────────────────────────────────────────────

const getA4Styles = (primary = '#0f172a') =>
  StyleSheet.create({
    page: {
      fontFamily: 'Helvetica',
      fontSize: 9,
      color: '#1e293b',
      backgroundColor: '#ffffff',
      padding: 0,
    },
    // top accent bar
    accentBar: {
      height: 5,
      backgroundColor: primary,
    },
    // header section (white bg)
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
    docInfoBlock: {
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
      fontFamily: 'Helvetica',
    },
    docMetaBold: {
      fontFamily: 'Helvetica-Bold',
      color: '#1e293b',
    },
    // Addresses section
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
    addressCardHeader: {
      backgroundColor: primary,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    addressCardTitle: {
      fontSize: 8,
      fontWeight: 'bold',
      color: '#ffffff',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    addressCardBody: {
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
      marginBottom: 8,
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
    // Reference box
    referenceSection: {
      marginHorizontal: 40,
      marginVertical: 16,
      padding: 20,
      backgroundColor: '#f8fafc',
      border: '1.5px solid #e2e8f0',
      borderRadius: 8,
      alignItems: 'center',
    },
    referenceLabel: {
      fontSize: 8,
      color: '#64748b',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 6,
    },
    referenceValue: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#0f172a',
      letterSpacing: 1.5,
      fontFamily: 'Helvetica-Bold',
    },
    // Notes
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
    // Footer with signatures + QR
    footer: {
      marginHorizontal: 40,
      marginTop: 'auto',
      borderTop: '2px solid #e2e8f0',
      paddingTop: 20,
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    qrArea: {
      width: '25%',
      alignItems: 'center',
    },
    qrImage: {
      width: 80,
      height: 80,
      border: '2px solid #e2e8f0',
      borderRadius: 8,
      padding: 3,
    },
    qrLabel: {
      fontSize: 7,
      color: '#94a3b8',
      marginTop: 5,
      textAlign: 'center',
    },
    signatureArea: {
      flex: 1,
      flexDirection: 'row',
      paddingLeft: 24,
      gap: 20,
    },
    signBox: { flex: 1 },
    signLine: {
      borderBottom: '1.5px solid #cbd5e1',
      height: 48,
      marginBottom: 6,
    },
    signLabel: {
      fontSize: 7,
      color: '#64748b',
      textAlign: 'center',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
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

const getThermalStyles = (primary = '#0f172a') =>
  StyleSheet.create({
    page: {
      padding: 12,
      fontSize: 9,
      fontFamily: 'Helvetica',
      backgroundColor: '#ffffff',
    },
    accent: {
      height: 4,
      backgroundColor: primary,
      marginHorizontal: -12,
      marginTop: -12,
      marginBottom: 12,
    },
    header: {
      alignItems: 'center',
      marginBottom: 12,
      paddingBottom: 10,
      borderBottom: '2px solid #e2e8f0',
    },
    title: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#0f172a',
      marginBottom: 5,
    },
    companyText: {
      fontSize: 10,
      textAlign: 'center',
      fontWeight: 'bold',
      color: '#1e293b',
      marginBottom: 2,
    },
    metaText: {
      fontSize: 8,
      textAlign: 'center',
      color: '#64748b',
      marginBottom: 2,
    },
    section: {
      marginVertical: 8,
      paddingBottom: 8,
      borderBottom: '1px solid #e2e8f0',
    },
    sectionTitle: {
      fontSize: 7,
      fontWeight: 'bold',
      color: primary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 5,
    },
    recipientName: {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#0f172a',
      marginBottom: 3,
    },
    addressText: {
      fontSize: 9,
      color: '#475569',
      lineHeight: 1.4,
      marginBottom: 3,
    },
    orderBox: {
      marginVertical: 10,
      padding: 8,
      border: '1px dashed #cbd5e1',
      alignItems: 'center',
      backgroundColor: '#f8fafc',
    },
    orderLabel: { fontSize: 7, color: '#64748b', marginBottom: 2 },
    orderValue: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#0f172a',
    },
    qrContainer: {
      alignItems: 'center',
      marginTop: 12,
      paddingTop: 12,
      borderTop: '1px solid #e2e8f0',
    },
    qr: {
      width: 85,
      height: 85,
      border: '2px solid #e2e8f0',
      borderRadius: 6,
      padding: 4,
    },
    qrLabel: { fontSize: 7, color: '#94a3b8', marginTop: 5 },
  });

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatAddress = (address?: string | Address): string => {
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

// ─── A4 Layout ────────────────────────────────────────────────────────────────

const A4WaybillV3 = ({ data }: { data: WaybillData }) => {
  const primary = data.branding?.primaryColor || '#0f172a';
  const styles = getA4Styles(primary);
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.accentBar} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          {data.branding?.logoUrl && (
            <Image src={data.branding.logoUrl} style={styles.logo} />
          )}
          <Text style={styles.companyName}>
            {data.branding?.companyName || data.sender.name}
          </Text>
          {data.branding?.companyAddress && (
            <Text style={styles.companyMeta}>
              {data.branding.companyAddress}
            </Text>
          )}
          {data.meta?.serviceType && (
            <Text style={[styles.companyMeta, { marginTop: 2 }]}>
              {data.meta.serviceType}
            </Text>
          )}
        </View>
        <View style={styles.docInfoBlock}>
          <Text style={styles.docTitle}>WAYBILL</Text>
          <Text style={styles.docMeta}>
            ORDER:{' '}
            <Text style={styles.docMetaBold}>{data.orderNumber}</Text>
          </Text>
          <Text style={styles.docMeta}>
            DATE:{' '}
            <Text style={styles.docMetaBold}>
              {format(new Date(data.date), 'MMM dd, yyyy HH:mm')}
            </Text>
          </Text>
          <Text style={styles.docMeta}>
            REF: <Text style={styles.docMetaBold}>{data.id.slice(-10).toUpperCase()}</Text>
          </Text>
        </View>
      </View>

      {/* Addresses */}
      <View style={styles.addressGrid}>
        {/* Sender */}
        <View style={styles.addressCard}>
          <View style={styles.addressCardHeader}>
            <Text style={styles.addressCardTitle}>From (Sender)</Text>
          </View>
          <View style={styles.addressCardBody}>
            <Text style={styles.nameText}>{data.sender.name}</Text>
            <Text style={styles.addressText}>
              {formatAddress(data.sender.address)}
            </Text>
            {data.sender.phone && (
              <View style={styles.contactRow}>
                <Text style={styles.contactLabel}>Phone</Text>
                <Text style={styles.contactValue}>{data.sender.phone}</Text>
              </View>
            )}
            {data.sender.email && (
              <View style={styles.contactRow}>
                <Text style={styles.contactLabel}>Email</Text>
                <Text style={styles.contactValue}>{data.sender.email}</Text>
              </View>
            )}
          </View>
        </View>
        {/* Recipient */}
        <View style={styles.addressCard}>
          <View style={[styles.addressCardHeader, { backgroundColor: '#1e40af' }]}>
            <Text style={styles.addressCardTitle}>To (Recipient)</Text>
          </View>
          <View style={styles.addressCardBody}>
            <Text style={styles.nameText}>{data.recipient.name}</Text>
            <Text style={styles.addressText}>
              {formatAddress(data.recipient.address)}
            </Text>
            {data.recipient.phone && (
              <View style={styles.contactRow}>
                <Text style={styles.contactLabel}>Phone</Text>
                <Text style={styles.contactValue}>{data.recipient.phone}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Notes */}
      {data.recipient.notes && (
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>Delivery Instructions</Text>
          <Text style={styles.notesText}>{data.recipient.notes}</Text>
        </View>
      )}

      {/* Reference */}
      <View style={styles.referenceSection}>
        <Text style={styles.referenceLabel}>Reference / Order Number</Text>
        <Text style={styles.referenceValue}>{data.orderNumber}</Text>
      </View>

      {/* Footer: QR + Signatures */}
      <View style={styles.footer}>
        <View style={styles.qrArea}>
          {data.qrCodeUrl && (
            <Image src={data.qrCodeUrl} style={styles.qrImage} />
          )}
          <Text style={styles.qrLabel}>Scan to Track</Text>
        </View>
        <View style={styles.signatureArea}>
          <View style={styles.signBox}>
            <View style={styles.signLine} />
            <Text style={styles.signLabel}>Sender Signature</Text>
          </View>
          <View style={styles.signBox}>
            <View style={styles.signLine} />
            <Text style={styles.signLabel}>Receiver Signature</Text>
          </View>
          <View style={styles.signBox}>
            <View style={styles.signLine} />
            <Text style={styles.signLabel}>Driver / Courier</Text>
          </View>
        </View>
      </View>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <Text style={styles.bottomBarText}>
          {format(new Date(data.date), 'dd/MM/yyyy')} · Waybill v3
        </Text>
        <Text style={styles.bottomBarOrg}>
          {data.branding?.companyName || data.sender.name}
        </Text>
        <Text style={styles.bottomBarText}>
          {data.meta?.serviceType || 'Logistics'}
        </Text>
      </View>
    </Page>
  );
};

const ThermalWaybillV3 = ({ data }: { data: WaybillData }) => {
  const primary = data.branding?.primaryColor || '#0f172a';
  const styles = getThermalStyles(primary);
  return (
    <Page size={[226, 800]} style={styles.page}>
      <View style={styles.accent} />
      <View style={styles.header}>
        <Text style={styles.title}>WAYBILL</Text>
        <Text style={styles.companyText}>
          {data.branding?.companyName || data.sender.name}
        </Text>
        <Text style={styles.metaText}>
          {format(new Date(data.date), 'dd/MM/yyyy HH:mm')}
        </Text>
        <Text style={styles.metaText}>{data.orderNumber}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Deliver To</Text>
        <Text style={styles.recipientName}>{data.recipient.name}</Text>
        <Text style={styles.addressText}>
          {formatAddress(data.recipient.address)}
        </Text>
        {data.recipient.phone && (
          <Text style={styles.addressText}>Tel: {data.recipient.phone}</Text>
        )}
      </View>
      {data.recipient.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.addressText}>{data.recipient.notes}</Text>
        </View>
      )}
      <View style={styles.orderBox}>
        <Text style={styles.orderLabel}>Order Reference</Text>
        <Text style={styles.orderValue}>{data.orderNumber}</Text>
      </View>
      {data.qrCodeUrl && (
        <View style={styles.qrContainer}>
          <Image src={data.qrCodeUrl} style={styles.qr} />
          <Text style={styles.qrLabel}>Scan to Track</Text>
        </View>
      )}
    </Page>
  );
};

// ─── Exports ──────────────────────────────────────────────────────────────────

export const WaybillV3Document = ({
  data,
  format: fmt,
}: {
  data: WaybillData;
  format?: WaybillV3Format;
}) => (
  <Document>
    {fmt === 'THERMAL' ? (
      <ThermalWaybillV3 data={data} />
    ) : (
      <A4WaybillV3 data={data} />
    )}
  </Document>
);

export const WaybillV3PDF = ({
  data,
  format: fmt,
}: {
  data: WaybillData;
  format?: WaybillV3Format;
}) =>
  fmt === 'THERMAL' ? (
    <ThermalWaybillV3 data={data} />
  ) : (
    <A4WaybillV3 data={data} />
  );
