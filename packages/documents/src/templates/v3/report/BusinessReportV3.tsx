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

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */
const C = {
  brand: '#4f46e5',
  brandDark: '#312e81',
  brandSoft: '#eef2ff',
  ink: '#0f172a',
  body: '#334155',
  muted: '#64748b',
  faint: '#94a3b8',
  line: '#e2e8f0',
  lineSoft: '#f1f5f9',
  surface: '#f8fafc',
  white: '#ffffff',
  positive: '#047857',
  positiveSoft: '#ecfdf5',
  warn: '#b45309',
  warnSoft: '#fffbeb',
};

const FONT = 'Helvetica';
const FONT_BOLD = 'Helvetica-Bold';

const styles = StyleSheet.create({
  page: {
    paddingTop: 52,
    paddingBottom: 60,
    paddingHorizontal: 36,
    fontFamily: FONT,
    fontSize: 9,
    color: C.body,
    backgroundColor: C.white,
    lineHeight: 1.4,
  },

  /* Running header (pages 2+) */
  runningHeader: {
    position: 'absolute',
    top: 20,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 0.75,
    borderBottomColor: C.line,
    paddingBottom: 6,
  },
  runningText: { fontSize: 7.5, color: C.faint },

  /* Cover band */
  band: {
    backgroundColor: C.brandDark,
    borderRadius: 6,
    padding: 18,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bandLeft: { flexDirection: 'column', maxWidth: '64%' },
  logo: {
    width: 70,
    height: 34,
    marginBottom: 10,
    objectFit: 'contain',
    backgroundColor: C.white,
    padding: 3,
    borderRadius: 3,
  },
  eyebrow: {
    fontSize: 7.5,
    fontFamily: FONT_BOLD,
    color: '#a5b4fc',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 5,
  },
  title: {
    fontSize: 20,
    fontFamily: FONT_BOLD,
    color: C.white,
    letterSpacing: -0.3,
  },
  subtitle: { fontSize: 9.5, color: '#c7d2fe', marginTop: 4 },
  bandRight: { alignItems: 'flex-end', justifyContent: 'space-between' },
  orgName: { fontSize: 11, fontFamily: FONT_BOLD, color: C.white },
  badge: {
    backgroundColor: C.brand,
    color: C.white,
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 10,
    fontSize: 7.5,
    fontFamily: FONT_BOLD,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  /* Document control */
  control: {
    flexDirection: 'row',
    borderWidth: 0.75,
    borderColor: C.line,
    borderRadius: 4,
    backgroundColor: C.surface,
    marginBottom: 18,
  },
  controlCell: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRightWidth: 0.75,
    borderRightColor: C.line,
  },
  controlCellLast: { flex: 1, paddingVertical: 7, paddingHorizontal: 10 },
  controlLabel: {
    fontSize: 6.5,
    fontFamily: FONT_BOLD,
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  controlValue: { fontSize: 8.5, fontFamily: FONT_BOLD, color: C.ink },

  /* Section header */
  section: { marginBottom: 18 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
    paddingBottom: 5,
  },
  sectionNum: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.brand,
    color: C.white,
    fontSize: 8,
    fontFamily: FONT_BOLD,
    textAlign: 'center',
    paddingTop: 3.5,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 10.5,
    fontFamily: FONT_BOLD,
    color: C.ink,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sectionCaption: { fontSize: 7.5, color: C.muted, marginLeft: 'auto' },

  /* Executive summary */
  summaryBox: {
    backgroundColor: C.brandSoft,
    borderLeftWidth: 3,
    borderLeftColor: C.brand,
    borderRadius: 3,
    padding: 12,
  },
  summaryPara: { fontSize: 8.8, color: C.body, lineHeight: 1.55, marginBottom: 5 },
  summaryBulletRow: { flexDirection: 'row', marginBottom: 3 },
  summaryBullet: { width: 10, color: C.brand, fontFamily: FONT_BOLD },
  summaryBulletText: { flex: 1, fontSize: 8.8, lineHeight: 1.5 },
  summaryHeading: {
    fontSize: 8.8,
    fontFamily: FONT_BOLD,
    color: C.brandDark,
    marginTop: 3,
    marginBottom: 3,
  },

  /* KPI */
  kpiRow: { flexDirection: 'row', marginHorizontal: -4 },
  kpiWrap: { width: '25%', paddingHorizontal: 4, marginBottom: 8 },
  kpiCard: {
    borderWidth: 0.75,
    borderColor: C.line,
    borderTopWidth: 2.5,
    borderTopColor: C.brand,
    borderRadius: 4,
    backgroundColor: C.white,
    paddingVertical: 9,
    paddingHorizontal: 10,
    minHeight: 54,
  },
  kpiLabel: {
    fontSize: 6.8,
    color: C.muted,
    textTransform: 'uppercase',
    fontFamily: FONT_BOLD,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  kpiValue: { fontSize: 14, fontFamily: FONT_BOLD, color: C.ink },
  kpiSubtext: { fontSize: 7, color: C.faint, marginTop: 3 },

  /* Tables */
  table: {
    borderWidth: 0.75,
    borderColor: C.line,
    borderRadius: 4,
    overflow: 'hidden',
  },
  thead: {
    flexDirection: 'row',
    backgroundColor: C.brandDark,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  th: {
    fontSize: 7,
    fontFamily: FONT_BOLD,
    color: C.white,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  tr: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5.5,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: C.lineSoft,
  },
  trAlt: { backgroundColor: C.surface },
  td: { fontSize: 8.3, color: C.body },
  tdStrong: { fontSize: 8.3, fontFamily: FONT_BOLD, color: C.ink },
  tfoot: {
    flexDirection: 'row',
    paddingVertical: 6.5,
    paddingHorizontal: 8,
    backgroundColor: C.brandSoft,
    borderTopWidth: 1,
    borderTopColor: C.brand,
  },
  tfootText: { fontSize: 8.5, fontFamily: FONT_BOLD, color: C.brandDark },
  rank: { fontSize: 7.5, color: C.faint, fontFamily: FONT_BOLD },

  /* Share bar */
  barTrack: {
    height: 5,
    backgroundColor: C.lineSoft,
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  barFill: { height: 5, backgroundColor: C.brand, borderRadius: 3 },
  barLabel: { fontSize: 7, color: C.muted, marginTop: 2, textAlign: 'right' },

  /* Finance */
  financeGrid: { flexDirection: 'row', marginHorizontal: -4, marginBottom: 8 },
  financeCard: {
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 0.75,
    borderColor: C.line,
    borderRadius: 4,
    padding: 10,
    backgroundColor: C.surface,
  },
  financeCardHighlight: {
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: C.brand,
    borderRadius: 4,
    padding: 10,
    backgroundColor: C.brandSoft,
  },
  financeLabel: {
    fontSize: 6.8,
    color: C.muted,
    textTransform: 'uppercase',
    fontFamily: FONT_BOLD,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  financeValue: { fontSize: 13, fontFamily: FONT_BOLD, color: C.ink },
  financeNote: { fontSize: 7, color: C.muted, marginTop: 3 },

  status: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 4,
    padding: 8,
    marginTop: 2,
  },
  statusText: { fontSize: 8, flex: 1 },

  /* Notes */
  notes: {
    borderTopWidth: 0.75,
    borderTopColor: C.line,
    paddingTop: 8,
    marginTop: 4,
  },
  notesTitle: {
    fontSize: 7.5,
    fontFamily: FONT_BOLD,
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  notesText: { fontSize: 7.5, color: C.muted, lineHeight: 1.5 },

  /* Footer */
  footer: {
    position: 'absolute',
    bottom: 22,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.75,
    borderTopColor: C.line,
    paddingTop: 7,
  },
  footerText: { fontSize: 7, color: C.faint },
  footerStrong: { fontSize: 7, color: C.muted, fontFamily: FONT_BOLD },
});

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const fmtMoney = (currency: string, n: number) =>
  `${currency}${(Number.isFinite(n) ? n : 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fmtNum = (n: number) =>
  (Number.isFinite(n) ? n : 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

type SummaryBlock =
  | { type: 'p'; text: string }
  | { type: 'h'; text: string }
  | { type: 'li'; text: string };

/** Turn the AI markdown-ish text into simple structured blocks (react-pdf can't render markdown). */
const parseSummary = (raw: string): SummaryBlock[] =>
  raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line): SummaryBlock => {
      if (/^#{1,6}\s+/.test(line)) {
        return { type: 'h', text: line.replace(/^#{1,6}\s+/, '').replace(/[*_`]/g, '') };
      }
      if (/^([-*•]|\d+[.)])\s+/.test(line)) {
        return { type: 'li', text: line.replace(/^([-*•]|\d+[.)])\s+/, '').replace(/[*_`]/g, '') };
      }
      return { type: 'p', text: line.replace(/[*_`]/g, '') };
    });

const Section = ({
  index,
  title,
  caption,
  children,
}: {
  index: number;
  title: string;
  caption?: string;
  children: React.ReactNode;
}) => (
  <View style={styles.section}>
    <View style={styles.sectionHead} wrap={false} minPresenceAhead={60}>
      <Text style={styles.sectionNum}>{index}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
      {caption ? <Text style={styles.sectionCaption}>{caption}</Text> : null}
    </View>
    {children}
  </View>
);

const ControlCell = ({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) => (
  <View style={last ? styles.controlCellLast : styles.controlCell}>
    <Text style={styles.controlLabel}>{label}</Text>
    <Text style={styles.controlValue}>{value}</Text>
  </View>
);

/* ------------------------------------------------------------------ */
/* Report                                                              */
/* ------------------------------------------------------------------ */
export const BusinessReportV3 = ({ data }: { data: BusinessReportData }) => {
  const branding = data.branding || {};
  const currency = data.currency || '$';
  const category = data.category || 'EXECUTIVE';
  const company = branding.companyName || 'Scryme Platform';
  const generated = data.generatedAtText || new Date().toLocaleDateString();
  const reportRef = data.reportNumber || 'Report';

  const hasKpis = !!data.kpis && data.kpis.length > 0;
  const hasSales = !!data.salesBreakdown && data.salesBreakdown.length > 0;
  const hasInventory = !!data.inventoryBreakdown && data.inventoryBreakdown.length > 0;
  const hasProduction = !!data.productionBreakdown && data.productionBreakdown.length > 0;
  const hasFinance = !!data.financeSummary;

  const summaryBlocks = data.aiSummary ? parseSummary(data.aiSummary) : [];

  const salesTotals = hasSales
    ? data.salesBreakdown!.reduce(
        (acc, i) => ({
          qty: acc.qty + (Number(i.quantity) || 0),
          revenue: acc.revenue + (Number(i.revenue) || 0),
        }),
        { qty: 0, revenue: 0 }
      )
    : { qty: 0, revenue: 0 };

  const inventoryTotal = hasInventory
    ? data.inventoryBreakdown!.reduce((s, i) => s + (Number(i.qty) || 0), 0)
    : 0;

  const net = hasFinance ? data.financeSummary!.netVatPayable : 0;

  let n = 0; // running section number
  const next = () => ++n;

  // Pad the KPI list so the last row keeps the 4-column grid alignment.
  const kpiRows: (typeof data.kpis)[] = [];
  if (hasKpis) {
    for (let i = 0; i < data.kpis!.length; i += 4) kpiRows.push(data.kpis!.slice(i, i + 4));
  }

  return (
    <Document
      title={`${data.title} - ${reportRef}`}
      author={data.generatedByText || company}
      subject={`${category} Report`}
      creator="Scryme Business Intelligence System"
    >
      <Page style={styles.page} size="A4">
        {/* Running header, pages 2+ */}
        <View style={styles.runningHeader} fixed>
          <Text
            style={styles.runningText}
            render={({ pageNumber }) => (pageNumber > 1 ? `${company}  |  ${data.title}` : '')}
          />
          <Text
            style={styles.runningText}
            render={({ pageNumber }) => (pageNumber > 1 ? `Ref: ${reportRef}` : '')}
          />
        </View>

        {/* Cover band */}
        <View style={styles.band}>
          <View style={styles.bandLeft}>
            {branding.logoUrl && <Image src={branding.logoUrl} style={styles.logo} />}
            <Text style={styles.eyebrow}>{category} Report</Text>
            <Text style={styles.title}>{data.title}</Text>
            <Text style={styles.subtitle}>Reporting period: {data.periodText}</Text>
          </View>
          <View style={styles.bandRight}>
            <Text style={styles.orgName}>{company}</Text>
            <Text style={styles.badge}>Confidential</Text>
          </View>
        </View>

        {/* Document control */}
        <View style={styles.control}>
          <ControlCell label="Report Ref" value={String(reportRef)} />
          <ControlCell label="Scope" value={data.locationName || 'All Locations'} />
          <ControlCell label="Department" value={data.departmentName || 'All Departments'} />
          <ControlCell label="Generated" value={String(generated)} />
          <ControlCell label="Prepared By" value={data.generatedByText || 'System'} last />
        </View>

        {/* Executive summary */}
        {summaryBlocks.length > 0 && (
          <Section index={next()} title="Executive Summary" caption="AI-assisted analysis">
            <View style={styles.summaryBox}>
              {summaryBlocks.map((b, i) =>
                b.type === 'h' ? (
                  <Text key={i} style={styles.summaryHeading}>
                    {b.text}
                  </Text>
                ) : b.type === 'li' ? (
                  <View key={i} style={styles.summaryBulletRow} wrap={false}>
                    <Text style={styles.summaryBullet}>•</Text>
                    <Text style={styles.summaryBulletText}>{b.text}</Text>
                  </View>
                ) : (
                  <Text key={i} style={styles.summaryPara}>
                    {b.text}
                  </Text>
                )
              )}
            </View>
          </Section>
        )}

        {/* KPIs */}
        {hasKpis && (
          <Section index={next()} title="Key Performance Indicators">
            {kpiRows.map((row, r) => (
              <View key={r} style={styles.kpiRow} wrap={false}>
                {row!.map((kpi, idx) => (
                  <View key={idx} style={styles.kpiWrap}>
                    <View style={styles.kpiCard}>
                      <Text style={styles.kpiLabel}>{kpi.label}</Text>
                      <Text style={styles.kpiValue}>{kpi.value}</Text>
                      {kpi.subtext ? <Text style={styles.kpiSubtext}>{kpi.subtext}</Text> : null}
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </Section>
        )}

        {/* Sales */}
        {hasSales && (
          <Section
            index={next()}
            title="Sales & Revenue Breakdown"
            caption={`${data.salesBreakdown!.length} line items`}
          >
            <View style={styles.table}>
              <View style={styles.thead} fixed>
                <Text style={[styles.th, { width: '6%' }]}>#</Text>
                <Text style={[styles.th, { width: '34%' }]}>Product / Item</Text>
                <Text style={[styles.th, { width: '14%', textAlign: 'right' }]}>Qty Sold</Text>
                <Text style={[styles.th, { width: '24%', textAlign: 'right' }]}>Revenue</Text>
                <Text style={[styles.th, { width: '22%', textAlign: 'right' }]}>Share</Text>
              </View>
              {data.salesBreakdown!.map((item, idx) => {
                const pct = salesTotals.revenue > 0 ? (item.revenue / salesTotals.revenue) * 100 : 0;
                return (
                  <View
                    key={idx}
                    style={[styles.tr, idx % 2 === 1 ? styles.trAlt : {}]}
                    wrap={false}
                  >
                    <Text style={[styles.rank, { width: '6%' }]}>{idx + 1}</Text>
                    <Text style={[styles.td, { width: '34%' }]}>{item.name}</Text>
                    <Text style={[styles.td, { width: '14%', textAlign: 'right' }]}>
                      {fmtNum(Number(item.quantity))}
                    </Text>
                    <Text style={[styles.tdStrong, { width: '24%', textAlign: 'right' }]}>
                      {fmtMoney(currency, item.revenue)}
                    </Text>
                    <View style={{ width: '22%', paddingLeft: 10 }}>
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { width: `${Math.min(100, pct)}%` }]} />
                      </View>
                      <Text style={styles.barLabel}>{pct.toFixed(1)}%</Text>
                    </View>
                  </View>
                );
              })}
              <View style={styles.tfoot} wrap={false}>
                <Text style={[styles.tfootText, { width: '40%' }]}>Total</Text>
                <Text style={[styles.tfootText, { width: '14%', textAlign: 'right' }]}>
                  {fmtNum(salesTotals.qty)}
                </Text>
                <Text style={[styles.tfootText, { width: '24%', textAlign: 'right' }]}>
                  {fmtMoney(currency, salesTotals.revenue)}
                </Text>
                <Text style={[styles.tfootText, { width: '22%', textAlign: 'right' }]}>100%</Text>
              </View>
            </View>
          </Section>
        )}

        {/* Inventory */}
        {hasInventory && (
          <Section
            index={next()}
            title="Inventory Movement Activity"
            caption={`${data.inventoryBreakdown!.length} items`}
          >
            <View style={styles.table}>
              <View style={styles.thead} fixed>
                <Text style={[styles.th, { width: '6%' }]}>#</Text>
                <Text style={[styles.th, { width: '54%' }]}>Inventory Item</Text>
                <Text style={[styles.th, { width: '40%', textAlign: 'right' }]}>Quantity Moved</Text>
              </View>
              {data.inventoryBreakdown!.map((item, idx) => (
                <View
                  key={idx}
                  style={[styles.tr, idx % 2 === 1 ? styles.trAlt : {}]}
                  wrap={false}
                >
                  <Text style={[styles.rank, { width: '6%' }]}>{idx + 1}</Text>
                  <Text style={[styles.td, { width: '54%' }]}>{item.name}</Text>
                  <Text style={[styles.tdStrong, { width: '40%', textAlign: 'right' }]}>
                    {fmtNum(Number(item.qty))} units
                  </Text>
                </View>
              ))}
              <View style={styles.tfoot} wrap={false}>
                <Text style={[styles.tfootText, { width: '60%' }]}>Total units moved</Text>
                <Text style={[styles.tfootText, { width: '40%', textAlign: 'right' }]}>
                  {fmtNum(inventoryTotal)} units
                </Text>
              </View>
            </View>
          </Section>
        )}

        {/* Production */}
        {hasProduction && (
          <Section
            index={next()}
            title="Production & Recipe Output"
            caption={`${data.productionBreakdown!.length} formulas`}
          >
            <View style={styles.table}>
              <View style={styles.thead} fixed>
                <Text style={[styles.th, { width: '6%' }]}>#</Text>
                <Text style={[styles.th, { width: '54%' }]}>Recipe / Formula</Text>
                <Text style={[styles.th, { width: '40%', textAlign: 'right' }]}>Produced Volume</Text>
              </View>
              {data.productionBreakdown!.map((item, idx) => (
                <View
                  key={idx}
                  style={[styles.tr, idx % 2 === 1 ? styles.trAlt : {}]}
                  wrap={false}
                >
                  <Text style={[styles.rank, { width: '6%' }]}>{idx + 1}</Text>
                  <Text style={[styles.td, { width: '54%' }]}>{item.name}</Text>
                  <Text style={[styles.tdStrong, { width: '40%', textAlign: 'right' }]}>
                    {fmtNum(Number(item.quantity))} {item.unit}
                  </Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        {/* Finance */}
        {hasFinance && (
          <Section index={next()} title="Financial & Tax Obligation Summary">
            <View style={styles.financeGrid} wrap={false}>
              <View style={styles.financeCard}>
                <Text style={styles.financeLabel}>Operating Expenditure</Text>
                <Text style={styles.financeValue}>
                  {fmtMoney(currency, data.financeSummary!.totalExpenses)}
                </Text>
                <Text style={styles.financeNote}>Total for the period</Text>
              </View>
              <View style={styles.financeCard}>
                <Text style={styles.financeLabel}>Output Tax (Sales)</Text>
                <Text style={styles.financeValue}>
                  {fmtMoney(currency, data.financeSummary!.outputTax)}
                </Text>
                <Text style={styles.financeNote}>Collected on sales</Text>
              </View>
              <View style={styles.financeCard}>
                <Text style={styles.financeLabel}>Input Tax (Purchases)</Text>
                <Text style={styles.financeValue}>
                  {fmtMoney(currency, data.financeSummary!.inputTax)}
                </Text>
                <Text style={styles.financeNote}>Recoverable on purchases</Text>
              </View>
              <View style={styles.financeCardHighlight}>
                <Text style={[styles.financeLabel, { color: C.brandDark }]}>Net Tax Obligation</Text>
                <Text style={[styles.financeValue, { color: C.brand }]}>
                  {fmtMoney(currency, Math.abs(net))}
                </Text>
                <Text style={styles.financeNote}>{net >= 0 ? 'Payable' : 'Refundable / carry forward'}</Text>
              </View>
            </View>

            <View style={styles.table} wrap={false}>
              <View style={styles.thead}>
                <Text style={[styles.th, { width: '70%' }]}>Tax Computation</Text>
                <Text style={[styles.th, { width: '30%', textAlign: 'right' }]}>Amount</Text>
              </View>
              <View style={styles.tr}>
                <Text style={[styles.td, { width: '70%' }]}>Sales Output Tax</Text>
                <Text style={[styles.td, { width: '30%', textAlign: 'right' }]}>
                  {fmtMoney(currency, data.financeSummary!.outputTax)}
                </Text>
              </View>
              <View style={[styles.tr, styles.trAlt]}>
                <Text style={[styles.td, { width: '70%' }]}>Less: Purchases Input Tax</Text>
                <Text style={[styles.td, { width: '30%', textAlign: 'right' }]}>
                  ({fmtMoney(currency, data.financeSummary!.inputTax)})
                </Text>
              </View>
              <View style={styles.tfoot}>
                <Text style={[styles.tfootText, { width: '70%' }]}>Net Estimated Tax Obligation</Text>
                <Text style={[styles.tfootText, { width: '30%', textAlign: 'right' }]}>
                  {fmtMoney(currency, net)}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.status,
                { backgroundColor: net > 0 ? C.warnSoft : C.positiveSoft },
              ]}
              wrap={false}
            >
              <Text style={[styles.statusText, { color: net > 0 ? C.warn : C.positive }]}>
                {net > 0
                  ? 'Output tax exceeds input tax for this period. The net amount is estimated as payable.'
                  : 'Input tax meets or exceeds output tax for this period. No net payment is estimated.'}
              </Text>
            </View>
          </Section>
        )}

        {/* Notes */}
        <View style={styles.notes} wrap={false}>
          <Text style={styles.notesTitle}>Notes & Disclaimer</Text>
          <Text style={styles.notesText}>
            This report was generated automatically from live system records for the stated period and
            scope. Figures are shown in {currency} unless stated otherwise. Tax figures are estimates
            for management purposes and do not replace formal filings. AI-assisted commentary should be
            reviewed before being used for decision making. This document is confidential and intended
            for authorised recipients of {company} only.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <View>
            <Text style={styles.footerStrong}>Scryme Business Intelligence System</Text>
            <Text style={styles.footerText}>
              {reportRef}  |  Generated {generated}
            </Text>
          </View>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
};