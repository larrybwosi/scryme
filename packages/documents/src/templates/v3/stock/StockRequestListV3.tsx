import React from 'react';
import { Page, Text, View, Document, Image, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StockRequestV3Item {
  requestNumber: string;
  requestDate: string;
  location: string;
  requestedBy?: string;
  itemsCount: number;
  priority: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW' | string;
  status: 'PENDING' | 'APPROVED' | 'FULFILLED' | 'REJECTED' | 'PARTIAL' | string;
  estimatedCost: string;
  justification?: string;
}

export interface StockRequestListV3Data {
  organizationName: string;
  logoUrl?: string;
  primaryColor?: string;
  generatedBy?: string;
  periodLabel?: string;
  branchName?: string; // if branch-level
  requests: StockRequestV3Item[];
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
    // Header band
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
      borderRadius: 8,
      objectFit: 'contain',
      marginBottom: 8,
    },
    orgName: {
      fontSize: 13,
      fontWeight: 'bold',
      color: '#ffffff',
      opacity: 0.95,
    },
    docTitleBlock: {
      alignItems: 'flex-end',
    },
    docTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#ffffff',
      letterSpacing: 1.5,
    },
    docSubtitle: {
      fontSize: 8,
      color: '#94a3b8',
      marginTop: 3,
      letterSpacing: 0.5,
    },
    // Meta strip
    metaStrip: {
      flexDirection: 'row',
      paddingHorizontal: 40,
      paddingVertical: 12,
      backgroundColor: '#f8fafc',
      borderBottom: '1px solid #e2e8f0',
      gap: 32,
    },
    metaItem: {
      flexDirection: 'column',
    },
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
    // KPI band
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
      flexDirection: 'column',
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
    // Table
    tableContainer: {
      paddingHorizontal: 40,
      paddingTop: 20,
      paddingBottom: 60,
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
    tableRowAlt: {
      backgroundColor: '#fafafa',
    },
    td: {
      fontSize: 9,
      color: '#334155',
    },
    // Priority badge
    badge: {
      borderRadius: 4,
      paddingVertical: 2,
      paddingHorizontal: 6,
      fontSize: 7,
      fontWeight: 'bold',
      letterSpacing: 0.3,
    },
    // Columns widths
    colReqNo: { width: '13%' },
    colDate: { width: '12%' },
    colLocation: { width: '16%' },
    colRequestedBy: { width: '14%' },
    colItems: { width: '8%', textAlign: 'center' },
    colPriority: { width: '11%' },
    colStatus: { width: '11%' },
    colCost: { width: '15%', textAlign: 'right' },
    // Footer
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
    footerText: {
      fontSize: 7,
      color: '#94a3b8',
    },
    footerOrg: {
      fontSize: 8,
      fontWeight: 'bold',
      color: '#ffffff',
    },
  });

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRIORITY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  URGENT: { bg: '#fef2f2', text: '#dc2626', label: 'URGENT' },
  HIGH: { bg: '#fff7ed', text: '#ea580c', label: 'HIGH' },
  NORMAL: { bg: '#eff6ff', text: '#2563eb', label: 'NORMAL' },
  LOW: { bg: '#f0fdf4', text: '#16a34a', label: 'LOW' },
};

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: '#fef9c3', text: '#a16207' },
  APPROVED: { bg: '#dcfce7', text: '#15803d' },
  FULFILLED: { bg: '#dbeafe', text: '#1d4ed8' },
  REJECTED: { bg: '#fee2e2', text: '#b91c1c' },
  PARTIAL: { bg: '#f3e8ff', text: '#7c3aed' },
};

function priorityStyle(p: string) {
  return PRIORITY_STYLES[p] || { bg: '#f1f5f9', text: '#64748b', label: p };
}

function statusStyle(s: string) {
  return STATUS_STYLES[s] || { bg: '#f1f5f9', text: '#64748b' };
}

// ─── Component ────────────────────────────────────────────────────────────────

export const StockRequestListV3 = ({
  data,
}: {
  data: StockRequestListV3Data;
}) => {
  const primary = data.primaryColor || '#0f172a';
  const styles = getStyles(primary);

  // KPI counts
  const total = data.requests.length;
  const urgent = data.requests.filter(r => r.priority === 'URGENT').length;
  const pending = data.requests.filter(r => r.status === 'PENDING').length;
  const fulfilled = data.requests.filter(r => r.status === 'FULFILLED').length;

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* ── Header Band ── */}
        <View style={styles.headerBand}>
          <View style={styles.headerRow}>
            <View>
              {data.logoUrl && (
                <Image src={data.logoUrl} style={styles.logo} />
              )}
              <Text style={styles.orgName}>{data.organizationName}</Text>
              {data.branchName && (
                <Text style={{ fontSize: 8, color: '#94a3b8', marginTop: 2 }}>
                  {data.branchName}
                </Text>
              )}
            </View>
            <View style={styles.docTitleBlock}>
              <Text style={styles.docTitle}>STOCK REQUEST LIST</Text>
              <Text style={styles.docSubtitle}>
                {data.periodLabel || format(new Date(), 'MMMM yyyy')} · Internal Use Only
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
            <Text style={styles.metaLabel}>Report Level</Text>
            <Text style={styles.metaValue}>
              {data.branchName ? 'Branch' : 'Organization'}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Total Requests</Text>
            <Text style={styles.metaValue}>{total}</Text>
          </View>
        </View>

        {/* ── KPI Band ── */}
        <View style={styles.kpiBand}>
          <View style={[styles.kpiCard, { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }]}>
            <Text style={[styles.kpiLabel, { color: '#64748b' }]}>Total Requests</Text>
            <Text style={[styles.kpiValue, { color: '#0f172a' }]}>{total}</Text>
          </View>
          <View style={[styles.kpiCard, { backgroundColor: '#fef2f2', border: '1px solid #fecaca' }]}>
            <Text style={[styles.kpiLabel, { color: '#dc2626' }]}>Urgent</Text>
            <Text style={[styles.kpiValue, { color: '#dc2626' }]}>{urgent}</Text>
          </View>
          <View style={[styles.kpiCard, { backgroundColor: '#fef9c3', border: '1px solid #fde047' }]}>
            <Text style={[styles.kpiLabel, { color: '#a16207' }]}>Pending</Text>
            <Text style={[styles.kpiValue, { color: '#a16207' }]}>{pending}</Text>
          </View>
          <View style={[styles.kpiCard, { backgroundColor: '#dcfce7', border: '1px solid #86efac' }]}>
            <Text style={[styles.kpiLabel, { color: '#15803d' }]}>Fulfilled</Text>
            <Text style={[styles.kpiValue, { color: '#15803d' }]}>{fulfilled}</Text>
          </View>
        </View>

        {/* ── Table ── */}
        <View style={styles.tableContainer}>
          {/* Header row */}
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.colReqNo]}>Request #</Text>
            <Text style={[styles.th, styles.colDate]}>Date</Text>
            <Text style={[styles.th, styles.colLocation]}>Location</Text>
            <Text style={[styles.th, styles.colRequestedBy]}>Requested By</Text>
            <Text style={[styles.th, styles.colItems]}>Items</Text>
            <Text style={[styles.th, styles.colPriority]}>Priority</Text>
            <Text style={[styles.th, styles.colStatus]}>Status</Text>
            <Text style={[styles.th, styles.colCost]}>Est. Cost</Text>
          </View>

          {data.requests.map((req, i) => {
            const pStyle = priorityStyle(req.priority);
            const sStyle = statusStyle(req.status);
            return (
              <View
                key={i}
                style={[styles.tableRow, i % 2 !== 0 ? styles.tableRowAlt : {}]}
              >
                <Text style={[styles.td, styles.colReqNo, { fontFamily: 'Helvetica-Bold', color: '#1d4ed8' }]}>
                  {req.requestNumber}
                </Text>
                <Text style={[styles.td, styles.colDate]}>{req.requestDate}</Text>
                <Text style={[styles.td, styles.colLocation]}>{req.location}</Text>
                <Text style={[styles.td, styles.colRequestedBy]}>{req.requestedBy || '—'}</Text>
                <Text style={[styles.td, styles.colItems, { textAlign: 'center' }]}>
                  {req.itemsCount}
                </Text>
                {/* Priority badge */}
                <View style={styles.colPriority}>
                  <View style={[styles.badge, { backgroundColor: pStyle.bg }]}>
                    <Text style={{ color: pStyle.text, fontSize: 7, fontWeight: 'bold' }}>
                      {pStyle.label}
                    </Text>
                  </View>
                </View>
                {/* Status badge */}
                <View style={styles.colStatus}>
                  <View style={[styles.badge, { backgroundColor: sStyle.bg }]}>
                    <Text style={{ color: sStyle.text, fontSize: 7, fontWeight: 'bold' }}>
                      {req.status}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.td, styles.colCost, { textAlign: 'right', fontFamily: 'Helvetica-Bold' }]}>
                  {req.estimatedCost}
                </Text>
              </View>
            );
          })}

          {data.requests.length === 0 && (
            <View style={{ paddingVertical: 30, alignItems: 'center' }}>
              <Text style={{ fontSize: 9, color: '#94a3b8' }}>No requests found.</Text>
            </View>
          )}
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Generated on {format(new Date(), 'dd/MM/yyyy HH:mm')} · Confidential
          </Text>
          <Text style={styles.footerOrg}>{data.organizationName}</Text>
          <Text style={styles.footerText}>Stock Request List · v3</Text>
        </View>
      </Page>
    </Document>
  );
};
