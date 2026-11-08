import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';
import { BusinessReportData } from '../../../types';

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#1f2937',
    backgroundColor: '#ffffff',
    lineHeight: 1.4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1.5,
    borderBottomColor: '#4f46e5',
    paddingBottom: 16,
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'column',
    maxWidth: '60%',
  },
  logo: {
    width: 64,
    height: 32,
    marginBottom: 8,
    objectFit: 'contain',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 10,
    color: '#4b5563',
    marginTop: 2,
  },
  metaContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  orgName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
  },
  metaText: {
    fontSize: 8.5,
    color: '#6b7280',
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#e0e7ff',
    color: '#3730a3',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    fontSize: 8,
    fontWeight: 'bold',
    marginTop: 6,
    alignSelf: 'flex-end',
    textTransform: 'uppercase',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    padding: 10,
  },
  kpiLabel: {
    fontSize: 7.5,
    color: '#6b7280',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  kpiSubtext: {
    fontSize: 7,
    color: '#9ca3af',
    marginTop: 2,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  aiContainer: {
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#ddd6fe',
    borderRadius: 6,
    padding: 12,
    marginBottom: 20,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  aiTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#5b21b6',
  },
  aiContent: {
    fontSize: 8.5,
    color: '#374151',
    lineHeight: 1.5,
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 14,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableColHeader: {
    fontSize: 7.5,
    fontWeight: 'bold',
    color: '#4b5563',
    textTransform: 'uppercase',
  },
  tableColText: {
    fontSize: 8,
    color: '#374151',
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
    fontSize: 7.5,
    color: '#9ca3af',
  },
});

export const BusinessReportV3 = ({ data }: { data: BusinessReportData }) => {
  const branding = data.branding || {};
  const currency = data.currency || '$';
  const category = data.category || 'EXECUTIVE';

  return (
    <Document title={`${data.title} - ${data.reportNumber || 'Report'}`}>
      <Page style={styles.page} size="A4">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {branding.logoUrl && <Image src={branding.logoUrl} style={styles.logo} />}
            <Text style={styles.title}>{data.title}</Text>
            <Text style={styles.subtitle}>
              Interval: {data.periodText}
              {data.locationName ? ` • Location: ${data.locationName}` : ''}
              {data.departmentName ? ` • Department: ${data.departmentName}` : ''}
            </Text>
          </View>
          <View style={styles.metaContainer}>
            <Text style={styles.orgName}>{branding.companyName || 'Scryme Platform'}</Text>
            <Text style={styles.metaText}>Generated: {data.generatedAtText || new Date().toLocaleDateString()}</Text>
            {data.generatedByText && <Text style={styles.metaText}>Author: {data.generatedByText}</Text>}
            <Text style={styles.badge}>{category} Report</Text>
          </View>
        </View>

        {/* AI Advisory Summary */}
        {data.aiSummary && (
          <View style={styles.aiContainer}>
            <View style={styles.aiHeader}>
              <Text style={styles.aiTitle}>Executive AI Advisory & Operational Intelligence</Text>
            </View>
            <Text style={styles.aiContent}>{data.aiSummary.replace(/[*#]/g, '')}</Text>
          </View>
        )}

        {/* KPI Grid */}
        {data.kpis && data.kpis.length > 0 && (
          <View style={styles.kpiGrid}>
            {data.kpis.map((kpi, idx) => (
              <View key={idx} style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>{kpi.label}</Text>
                <Text style={styles.kpiValue}>{kpi.value}</Text>
                {kpi.subtext && <Text style={styles.kpiSubtext}>{kpi.subtext}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Top Products / Sales Breakdown */}
        {data.salesBreakdown && data.salesBreakdown.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sales & Revenue Breakdown</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableColHeader, { width: '45%' }]}>Product / Item</Text>
                <Text style={[styles.tableColHeader, { width: '25%', textAlign: 'right' }]}>Quantity Sold</Text>
                <Text style={[styles.tableColHeader, { width: '30%', textAlign: 'right' }]}>Total Revenue</Text>
              </View>
              {data.salesBreakdown.map((item, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={[styles.tableColText, { width: '45%' }]}>{item.name}</Text>
                  <Text style={[styles.tableColText, { width: '25%', textAlign: 'right' }]}>{item.quantity}</Text>
                  <Text style={[styles.tableColText, { width: '30%', textAlign: 'right', fontWeight: 'bold' }]}>
                    {currency}{item.revenue.toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Inventory Flow Breakdown */}
        {data.inventoryBreakdown && data.inventoryBreakdown.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Inventory Movement Activity</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableColHeader, { width: '60%' }]}>Inventory Item</Text>
                <Text style={[styles.tableColHeader, { width: '40%', textAlign: 'right' }]}>Quantity Moved</Text>
              </View>
              {data.inventoryBreakdown.map((item, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={[styles.tableColText, { width: '60%' }]}>{item.name}</Text>
                  <Text style={[styles.tableColText, { width: '40%', textAlign: 'right' }]}>{item.qty} units</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Production Batch Breakdown */}
        {data.productionBreakdown && data.productionBreakdown.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Production & Recipe Output</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableColHeader, { width: '60%' }]}>Recipe / Formula</Text>
                <Text style={[styles.tableColHeader, { width: '40%', textAlign: 'right' }]}>Produced Volume</Text>
              </View>
              {data.productionBreakdown.map((item, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={[styles.tableColText, { width: '60%' }]}>{item.name}</Text>
                  <Text style={[styles.tableColText, { width: '40%', textAlign: 'right' }]}>
                    {item.quantity} {item.unit}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Finance & Tax Summary Breakdown */}
        {data.financeSummary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Financial & Tax Obligation Summary</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableColHeader, { width: '50%' }]}>Metric</Text>
                <Text style={[styles.tableColHeader, { width: '50%', textAlign: 'right' }]}>Amount</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableColText, { width: '50%' }]}>Total Operating Expenditure</Text>
                <Text style={[styles.tableColText, { width: '50%', textAlign: 'right', fontWeight: 'bold' }]}>
                  {currency}{data.financeSummary.totalExpenses.toFixed(2)}
                </Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableColText, { width: '50%' }]}>Sales Output Tax</Text>
                <Text style={[styles.tableColText, { width: '50%', textAlign: 'right' }]}>
                  {currency}{data.financeSummary.outputTax.toFixed(2)}
                </Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableColText, { width: '50%' }]}>Purchases Input Tax</Text>
                <Text style={[styles.tableColText, { width: '50%', textAlign: 'right' }]}>
                  {currency}{data.financeSummary.inputTax.toFixed(2)}
                </Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableColText, { width: '50%', fontWeight: 'bold' }]}>Net Estimated Tax Obligation</Text>
                <Text style={[styles.tableColText, { width: '50%', textAlign: 'right', fontWeight: 'bold', color: '#4f46e5' }]}>
                  {currency}{data.financeSummary.netVatPayable.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Scryme Business Intelligence System</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
};
