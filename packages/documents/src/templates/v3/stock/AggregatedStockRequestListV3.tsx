import React from 'react';
import { Page, Text, View, Document, Image, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AggregatedStockItemV3 {
  sku: string;
  name: string;
  variantName: string;
  category?: string;
  totalRequested: number;
  totalAllocated: number;
  totalRemaining: number;
  unitCost?: string;
  totalEstimatedCost?: string;
  fulfillmentRate?: number; // 0–100
}

export interface AggregatedStockRequestListV3Data {
  organizationName: string;
  logoUrl?: string;
  primaryColor?: string;
  generatedBy?: string;
  periodLabel?: string;
  branchName?: string;
  items: AggregatedStockItemV3[];
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const getStyles = (primary = '#0f172a') =>
  StyleSheet.create({
    page: {
      fontFamily: 'Helvetica',
      fontSize: 9,
      color: '#1e293b',
      backgroundColor: '#ffffff',
      paddingHorizontal: 0,
      paddingVertical: 0,
    },
    headerBand: {
      backgroundColor: primary,
      paddingHorizontal: 40,
      paddingTop: 32,
      paddingBottom: 24,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    logo: {
      width: 48,
      height: 48,
      objectFit: 'contain',
      marginBottom: 8,
    },
    orgName: {
      fontSize: 13,
      fontWeight: 'bold',
      color: '#ffffff',
    },
    docTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#ffffff',
      letterSpacing: 1.5,
      textAlign: 'right',
    },
    docSubtitle: {
      fontSize: 8,
      color: '#94a3b8',
      marginTop: 3,
      textAlign: 'right',
    },
    metaStrip: {
      flexDirection: 'row',
      paddingHorizontal: 40,
      paddingVertical: 12,
      backgroundColor: '#f8fafc',
      borderBottom: '1px solid #e2e8f0',
      gap: 32,
    },
    metaItem: { flexDirection: 'column' },
    metaLabel: {
      fontSize: 7,
      color: '#94a3b8',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    metaValue: {
      fontSize: 9,
      color: '#1e293b',
      fontWeight: 'bold',
      marginTop: 2,
    },
    kpiBand: {
      flexDirection: 'row',
      paddingHorizontal: 40,
      paddingVertical: 14,
      borderBottom: '1px solid #e2e8f0',
      gap: 12,
    },
    kpiCard: {
      flex: 1,
      borderRadius: 6,
      paddingVertical: 10,
      paddingHorizontal: 14,
    },
    kpiLabel: {
      fontSize: 7,
      fontWeight: 'bold',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    kpiValue: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    tableContainer: {
      paddingHorizontal: 40,
      paddingTop: 20,
      paddingBottom: 60,
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
    // Progress bar
    progressTrack: {
      height: 5,
      backgroundColor: '#e2e8f0',
      borderRadius: 3,
      marginTop: 2,
    },
    progressFill: {
      height: 5,
      borderRadius: 3,
      backgroundColor: '#22c55e',
    },
    // Columns
    colSku: { width: '11%' },
    colName: { width: '28%' },
    colVariant: { width: '14%' },
    colRequested: { width: '12%', textAlign: 'center' },
    colAllocated: { width: '12%', textAlign: 'center' },
    colRemaining: { width: '12%', textAlign: 'center' },
    colFulfillment: { width: '11%' },
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 40,
      paddingVertical: 12,
      backgroundColor: primary,
    },
    footerText: { fontSize: 7, color: '#94a3b8' },
    footerOrg: { fontSize: 8, fontWeight: 'bold', color: '#ffffff' },
  });

// ─── Component ────────────────────────────────────────────────────────────────

export const AggregatedStockRequestListV3 = ({
  data,
}: {
  data: AggregatedStockRequestListV3Data;
}) => {
  const primary = data.primaryColor || '#0f172a';
  const styles = getStyles(primary);

  const totalRequested = data.items.reduce((s, i) => s + i.totalRequested, 0);
  const totalAllocated = data.items.reduce((s, i) => s + i.totalAllocated, 0);
  const totalRemaining = data.items.reduce((s, i) => s + i.totalRemaining, 0);
  const overallRate =
    totalRequested > 0
      ? Math.round((totalAllocated / totalRequested) * 100)
      : 0;

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* ── Header ── */}
        <View style={styles.headerBand}>
          <View style={styles.headerRow}>
            <View>
              {data.logoUrl && <Image src={data.logoUrl} style={styles.logo} />}
              <Text style={styles.orgName}>{data.organizationName}</Text>
              {data.branchName && (
                <Text style={{ fontSize: 8, color: '#94a3b8', marginTop: 2 }}>
                  {data.branchName}
                </Text>
              )}
            </View>
            <View>
              <Text style={styles.docTitle}>COMPILED STOCK REQUESTS</Text>
              <Text style={styles.docSubtitle}>
                {data.periodLabel || format(new Date(), 'MMMM yyyy')} ·
                Aggregated across all pending requests
              </Text>
            </View>
          </View>
        </View>

        {/* ── Meta Strip ── */}
        <View style={styles.metaStrip}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Generated</Text>
            <Text style={styles.metaValue}>
              {format(new Date(), 'MMM dd, yyyy HH:mm')}
            </Text>
          </View>
          {data.generatedBy && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Prepared By</Text>
              <Text style={styles.metaValue}>{data.generatedBy}</Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Unique SKUs</Text>
            <Text style={styles.metaValue}>{data.items.length}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Overall Fulfillment</Text>
            <Text style={styles.metaValue}>{overallRate}%</Text>
          </View>
        </View>

        {/* ── KPI Band ── */}
        <View style={styles.kpiBand}>
          <View
            style={[
              styles.kpiCard,
              { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' },
            ]}>
            <Text style={[styles.kpiLabel, { color: '#64748b' }]}>
              Unique Products
            </Text>
            <Text style={[styles.kpiValue, { color: '#0f172a' }]}>
              {data.items.length}
            </Text>
          </View>
          <View
            style={[
              styles.kpiCard,
              { backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' },
            ]}>
            <Text style={[styles.kpiLabel, { color: '#1d4ed8' }]}>
              Total Requested
            </Text>
            <Text style={[styles.kpiValue, { color: '#1d4ed8' }]}>
              {totalRequested}
            </Text>
          </View>
          <View
            style={[
              styles.kpiCard,
              { backgroundColor: '#dcfce7', border: '1px solid #86efac' },
            ]}>
            <Text style={[styles.kpiLabel, { color: '#15803d' }]}>
              Allocated
            </Text>
            <Text style={[styles.kpiValue, { color: '#15803d' }]}>
              {totalAllocated}
            </Text>
          </View>
          <View
            style={[
              styles.kpiCard,
              { backgroundColor: '#fef9c3', border: '1px solid #fde047' },
            ]}>
            <Text style={[styles.kpiLabel, { color: '#a16207' }]}>
              Still Needed
            </Text>
            <Text style={[styles.kpiValue, { color: '#a16207' }]}>
              {totalRemaining}
            </Text>
          </View>
        </View>

        {/* ── Table ── */}
        <View style={styles.tableContainer}>
          <Text style={styles.sectionTitle}>
            Product-Level Demand Summary
          </Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.colSku]}>SKU</Text>
            <Text style={[styles.th, styles.colName]}>Product Name</Text>
            <Text style={[styles.th, styles.colVariant]}>Variant</Text>
            <Text style={[styles.th, styles.colRequested]}>Requested</Text>
            <Text style={[styles.th, styles.colAllocated]}>Allocated</Text>
            <Text style={[styles.th, styles.colRemaining]}>Remaining</Text>
            <Text style={[styles.th, styles.colFulfillment]}>Fulfillment</Text>
          </View>

          {data.items.map((item, i) => {
            const rate =
              item.fulfillmentRate !== undefined
                ? item.fulfillmentRate
                : item.totalRequested > 0
                ? Math.round((item.totalAllocated / item.totalRequested) * 100)
                : 0;
            const fillColor =
              rate >= 80 ? '#22c55e' : rate >= 50 ? '#f59e0b' : '#ef4444';

            return (
              <View
                key={i}
                style={[
                  styles.tableRow,
                  i % 2 !== 0 ? styles.tableRowAlt : {},
                ]}>
                <Text
                  style={[
                    styles.td,
                    styles.colSku,
                    {
                      fontFamily: 'Helvetica-Bold',
                      color: '#1d4ed8',
                      fontSize: 8,
                    },
                  ]}>
                  {item.sku}
                </Text>
                <Text style={[styles.td, styles.colName, { fontFamily: 'Helvetica-Bold' }]}>
                  {item.name}
                </Text>
                <Text style={[styles.td, styles.colVariant, { color: '#64748b' }]}>
                  {item.variantName || '—'}
                </Text>
                <Text
                  style={[
                    styles.td,
                    styles.colRequested,
                    { textAlign: 'center', fontFamily: 'Helvetica-Bold' },
                  ]}>
                  {item.totalRequested}
                </Text>
                <Text
                  style={[
                    styles.td,
                    styles.colAllocated,
                    { textAlign: 'center', color: '#15803d' },
                  ]}>
                  {item.totalAllocated}
                </Text>
                <Text
                  style={[
                    styles.td,
                    styles.colRemaining,
                    {
                      textAlign: 'center',
                      color: item.totalRemaining > 0 ? '#dc2626' : '#64748b',
                      fontFamily:
                        item.totalRemaining > 0 ? 'Helvetica-Bold' : 'Helvetica',
                    },
                  ]}>
                  {item.totalRemaining}
                </Text>
                {/* Progress bar fulfillment */}
                <View style={styles.colFulfillment}>
                  <Text style={{ fontSize: 8, color: fillColor, fontFamily: 'Helvetica-Bold' }}>
                    {rate}%
                  </Text>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min(rate, 100)}%`,
                          backgroundColor: fillColor,
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            );
          })}

          {data.items.length === 0 && (
            <View style={{ paddingVertical: 30, alignItems: 'center' }}>
              <Text style={{ fontSize: 9, color: '#94a3b8' }}>
                No aggregated items found.
              </Text>
            </View>
          )}
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Generated {format(new Date(), 'dd/MM/yyyy HH:mm')} · Confidential
          </Text>
          <Text style={styles.footerOrg}>{data.organizationName}</Text>
          <Text style={styles.footerText}>Compiled Stock Requests · v3</Text>
        </View>
      </Page>
    </Document>
  );
};
