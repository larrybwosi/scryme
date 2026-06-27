import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { ReceiptData } from "../../types";
import { formatCurrency } from "../../utils";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  // Palette — slate-anchored professional with a single teal accent
  ink: "#0F1923", // near-black for primary text
  inkMid: "#3D4F61", // secondary text
  inkLight: "#6B7D8E", // tertiary / labels
  rule: "#D9E2EA", // borders & dividers
  surface: "#F4F7FA", // section backgrounds
  white: "#FFFFFF",

  // Accent — one strong teal used with restraint
  accent: "#0C6E56", // header band, grand total bar
  accentMid: "#1D9E75", // paid badge, accent line
  accentPale: "#E1F5EE", // badge fill

  // Typography
  fontSans: "Helvetica",
  fontBold: "Helvetica-Bold",
  fontObl: "Helvetica-Oblique",

  // Spacing
  pagePad: 32,
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: T.fontSans,
    fontSize: 9,
    color: T.ink,
    backgroundColor: T.white,
    paddingHorizontal: T.pagePad,
    paddingTop: 0,
    paddingBottom: 32,
  },

  // ── Header band
  headerBand: {
    backgroundColor: T.accent,
    marginHorizontal: -T.pagePad,
    paddingHorizontal: T.pagePad,
    paddingTop: 28,
    paddingBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 0,
  },
  orgName: {
    fontFamily: T.fontBold,
    fontSize: 16,
    color: T.white,
    letterSpacing: 0.4,
  },
  orgAddress: {
    fontSize: 8,
    color: "rgba(255,255,255,0.72)",
    marginTop: 3,
    lineHeight: 1.5,
  },
  docTitle: {
    fontFamily: T.fontBold,
    fontSize: 11,
    color: T.white,
    letterSpacing: 2,
    textTransform: "uppercase",
    textAlign: "right",
  },
  receiptNum: {
    fontSize: 20,
    fontFamily: T.fontBold,
    color: T.white,
    textAlign: "right",
    marginTop: 2,
    letterSpacing: 0.5,
  },

  // ── Accent rule under header
  accentRule: {
    height: 3,
    backgroundColor: T.accentMid,
    marginHorizontal: -T.pagePad,
    marginBottom: 20,
  },

  // ── Meta row (customer + transaction details)
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 20,
  },
  metaBlock: {
    flex: 1,
  },
  metaBlockRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  metaLabel: {
    fontSize: 7,
    color: T.inkLight,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 4,
    fontFamily: T.fontBold,
  },
  metaValue: {
    fontSize: 10,
    color: T.ink,
    fontFamily: T.fontBold,
    marginBottom: 1,
  },
  metaSub: {
    fontSize: 8,
    color: T.inkMid,
    lineHeight: 1.5,
  },

  // ── Paid badge
  paidBadge: {
    backgroundColor: T.accentPale,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  paidBadgeText: {
    fontFamily: T.fontBold,
    fontSize: 8,
    color: T.accent,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },

  // ── Meta details grid (date, method, transaction ID)
  detailGrid: {
    flexDirection: "row",
    gap: 24,
    marginTop: 8,
  },
  detailCell: {},

  // ── Hairline divider
  divider: {
    height: 0.5,
    backgroundColor: T.rule,
    marginBottom: 16,
  },

  // ── Section header
  sectionLabel: {
    fontSize: 7,
    fontFamily: T.fontBold,
    color: T.inkLight,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 8,
  },

  // ── Table
  tableHeader: {
    flexDirection: "row",
    backgroundColor: T.surface,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginBottom: 2,
  },
  tableHeaderText: {
    fontSize: 7.5,
    fontFamily: T.fontBold,
    color: T.inkMid,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: T.rule,
    alignItems: "center",
  },
  tableRowAlt: {
    backgroundColor: "#FAFBFC",
  },
  cellDesc: { flex: 5, fontSize: 9, color: T.ink },
  cellQty: { flex: 1, fontSize: 9, color: T.inkMid, textAlign: "center" },
  cellRate: { flex: 2, fontSize: 9, color: T.inkMid, textAlign: "right" },
  cellAmt: {
    flex: 2,
    fontSize: 9,
    fontFamily: T.fontBold,
    color: T.ink,
    textAlign: "right",
  },

  // ── Totals panel
  totalsPanel: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
  },
  totalsInner: {
    width: "42%",
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: T.rule,
  },
  totalsLabel: {
    fontSize: 8.5,
    color: T.inkMid,
  },
  totalsValue: {
    fontSize: 8.5,
    color: T.ink,
    fontFamily: T.fontBold,
  },
  discountValue: {
    fontSize: 8.5,
    color: T.accentMid,
    fontFamily: T.fontBold,
  },

  // ── Grand total bar
  grandTotalBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: T.accent,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginTop: 6,
  },
  grandTotalLabel: {
    fontSize: 9,
    fontFamily: T.fontBold,
    color: T.white,
    letterSpacing: 0.5,
  },
  grandTotalValue: {
    fontSize: 13,
    fontFamily: T.fontBold,
    color: T.white,
    letterSpacing: 0.3,
  },

  // ── Cash section
  cashSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: T.rule,
  },
  cashRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },

  // ── Footer
  footer: {
    marginTop: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  footerLeft: {
    flex: 1,
  },
  thankYou: {
    fontSize: 10,
    fontFamily: T.fontBold,
    color: T.accent,
    marginBottom: 3,
  },
  footerSub: {
    fontSize: 7.5,
    color: T.inkLight,
    fontFamily: T.fontObl,
    lineHeight: 1.5,
  },
  footerRight: {
    alignItems: "flex-end",
  },
  footerMeta: {
    fontSize: 7.5,
    color: T.inkLight,
    textAlign: "right",
    lineHeight: 1.6,
  },
  footerBoldMeta: {
    fontFamily: T.fontBold,
    color: T.inkMid,
  },
});

// ─── Sub-components ───────────────────────────────────────────────────────────

const MetaField = ({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) => (
  <View style={s.detailCell}>
    <Text style={s.metaLabel}>{label}</Text>
    <Text style={s.metaValue}>{value}</Text>
    {sub && <Text style={s.metaSub}>{sub}</Text>}
  </View>
);

// ─── Main Export ──────────────────────────────────────────────────────────────

export type ReceiptPDFData = ReceiptData;

const fmt = (n: number, currency = "") =>
  `${currency}${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const ReceiptTemplate = ({ data }: { data: ReceiptPDFData }) => {
  const branding = data.branding;
  const logoUrl = branding?.logoUrl;
  const orgName = String(branding?.companyName || "Our Company");
  const orgAddress = branding?.companyAddress ? String(branding.companyAddress) : undefined;
  const currencySettings = data.currencySettings || {
    code: data.currency || "USD",
    symbol: data.currencySymbol || "$",
    locale: "en-US",
  };

  const fmt = (val: number) => formatCurrency(val, currencySettings);

  const displayDate = data.date instanceof Date
    ? data.date.toLocaleDateString()
    : String(data.date || '');

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* ── Header Band ── */}
        <View style={[s.headerBand, branding?.primaryColor ? { backgroundColor: branding.primaryColor } : {}]}>
          <View>
            {logoUrl && (
              <Image
                src={logoUrl}
                style={{
                  height: 28,
                  marginBottom: 8,
                  objectFit: "contain",
                  objectPositionX: 0,
                }}
              />
            )}
            <Text style={s.orgName}>{orgName}</Text>
            {orgAddress && (
              <Text style={s.orgAddress}>{orgAddress}</Text>
            )}
          </View>
          <View>
            <Text style={s.docTitle}>Payment Receipt</Text>
            <Text style={s.receiptNum}>#{String(data.receiptNumber || 'N/A')}</Text>
          </View>
        </View>

        {/* ── Teal accent rule ── */}
        <View style={[s.accentRule, branding?.primaryColor ? { backgroundColor: branding.primaryColor, opacity: 0.8 } : {}]} />

        {/* ── Meta Row ── */}
        <View style={s.metaRow}>
          {/* Customer block */}
          <View style={s.metaBlock}>
            <Text style={s.metaLabel}>Billed to</Text>
            <Text style={s.metaValue}>{String(data.customer?.name || 'Walk-in Customer')}</Text>
            {data.customer?.email && (
              <Text style={s.metaSub}>{String(data.customer.email)}</Text>
            )}
            {data.customer?.phone && (
              <Text style={s.metaSub}>{String(data.customer.phone)}</Text>
            )}
            <View style={s.paidBadge}>
              <Text style={s.paidBadgeText}>✓ {String(data.status || 'Paid')}</Text>
            </View>
          </View>

          {/* Transaction detail block */}
          <View style={[s.metaBlock, { alignItems: "flex-end" }]}>
            <Text style={s.metaLabel}>Transaction details</Text>
            <View style={[s.detailGrid, { justifyContent: "flex-end" }]}>
              <MetaField label="Date" value={displayDate} />
              <MetaField label="Payment method" value={String(data.paymentMethod || "N/A")} />
            </View>
            <View style={{ alignItems: 'flex-end', marginTop: 10 }}>
              {data.locationName && (
                <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                  <Text style={s.metaLabel}>Location: </Text>
                  <Text style={[s.metaValue, { fontSize: 8 }]}>{String(data.locationName)}</Text>
                </View>
              )}
              {data.createdBy && (
                <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                  <Text style={s.metaLabel}>Cashier: </Text>
                  <Text style={[s.metaValue, { fontSize: 8 }]}>{String(data.createdBy)}</Text>
                </View>
              )}
              {data.tags && data.tags.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', marginTop: 4 }}>
                  {data.tags.map((tag, i) => (
                    <View key={i} style={{ backgroundColor: T.surface, paddingHorizontal: 4, paddingVertical: 2, borderRadius: 2, marginLeft: 4, marginBottom: 2 }}>
                      <Text style={{ fontSize: 7, color: T.inkMid, fontFamily: T.fontBold }}>{tag.toUpperCase()}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ── Divider ── */}
        <View style={s.divider} />

        {/* ── Items Table ── */}
        <Text style={s.sectionLabel}>Transaction summary</Text>

        <View style={s.tableHeader}>
          <Text style={[s.tableHeaderText, { flex: 5 }]}>Description</Text>
          <Text style={[s.tableHeaderText, { flex: 1, textAlign: "center" }]}>
            Qty
          </Text>
          <Text style={[s.tableHeaderText, { flex: 2, textAlign: "right" }]}>
            Unit price
          </Text>
          <Text style={[s.tableHeaderText, { flex: 2, textAlign: "right" }]}>
            Amount
          </Text>
        </View>

        {(data.items || []).map((item, i) => (
          <View key={i} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
            <Text style={s.cellDesc}>{item.itemName || item.description || 'Item'}</Text>
            <Text style={s.cellQty}>{item.quantity || 0}</Text>
            <Text style={s.cellRate}>{fmt(item.rate || item.unitPrice || 0)}</Text>
            <Text style={s.cellAmt}>{fmt(item.amount || item.totalPrice || 0)}</Text>
          </View>
        ))}

        {/* ── Totals ── */}
        <View style={s.totalsPanel}>
          <View style={s.totalsInner}>
            <View style={s.totalsRow}>
              <Text style={s.totalsLabel}>Subtotal</Text>
              <Text style={s.totalsValue}>{fmt(data.subtotal)}</Text>
            </View>

            {(data.discountTotal || 0) > 0 && (
              <View style={s.totalsRow}>
                <Text style={s.totalsLabel}>Discount</Text>
                <Text style={[s.discountValue, branding?.primaryColor ? { color: branding.primaryColor } : {}]}>
                  − {fmt(data.discountTotal || 0)}
                </Text>
              </View>
            )}

            <View style={s.totalsRow}>
              <Text style={s.totalsLabel}>Tax</Text>
              <Text style={s.totalsValue}>{fmt(data.tax)}</Text>
            </View>

            <View style={[s.grandTotalBar, branding?.primaryColor ? { backgroundColor: branding.primaryColor } : {}]}>
              <Text style={s.grandTotalLabel}>Amount paid</Text>
              <Text style={s.grandTotalValue}>
                {fmt(data.total)}
              </Text>
            </View>

            {data.amountReceived !== undefined && (
              <View style={s.cashSection}>
                <View style={s.cashRow}>
                  <Text style={s.totalsLabel}>Cash received</Text>
                  <Text style={s.totalsValue}>
                    {fmt(data.amountReceived)}
                  </Text>
                </View>
                <View style={s.cashRow}>
                  <Text style={s.totalsLabel}>Change returned</Text>
                  <Text style={s.totalsValue}>
                    {fmt(data.change ?? 0)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={s.footer}>
          <View style={s.footerLeft}>
            <Text style={s.thankYou}>Thank you for your business.</Text>
            <Text style={s.footerSub}>
              This is an official payment receipt issued by{" "}
              {orgName}.{"\n"}
              Please retain this document for your records.
            </Text>
          </View>
          <View style={s.footerRight}>
            <Text style={s.footerMeta}>
              <Text style={s.footerBoldMeta}>{orgName}</Text>
              {"\n"}Receipt #{String(data.receiptNumber || 'N/A')}
              {"\n"}Issued {displayDate}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export const ReceiptTemplatePDF = ({ data }: { data: ReceiptPDFData }) => {
  const branding = data.branding;
  const logoUrl = branding?.logoUrl;
  const orgName = String(branding?.companyName || "Our Company");
  const orgAddress = branding?.companyAddress ? String(branding.companyAddress) : undefined;
  const currencySettings = data.currencySettings || { code: data.currency || 'USD', symbol: data.currencySymbol || '$', locale: 'en-US' };

  const fmt = (val: number) => formatCurrency(val, currencySettings);

  const displayDate = data.date instanceof Date
    ? data.date.toLocaleDateString()
    : String(data.date || '');

  return (
    <Page size="A4" style={s.page}>
      {/* ── Header Band ── */}
      <View style={[s.headerBand, branding?.primaryColor ? { backgroundColor: branding.primaryColor } : {}]}>
        <View>
          {logoUrl && (
            <Image
              src={logoUrl}
              style={{
                height: 28,
                marginBottom: 8,
                objectFit: "contain",
                objectPositionX: 0,
              }}
            />
          )}
          <Text style={s.orgName}>{orgName}</Text>
          {orgAddress && <Text style={s.orgAddress}>{orgAddress}</Text>}
        </View>
        <View>
          <Text style={s.docTitle}>Payment Receipt</Text>
          <Text style={s.receiptNum}>#{String(data.receiptNumber || 'N/A')}</Text>
        </View>
      </View>

      {/* ── Teal accent rule ── */}
      <View style={[s.accentRule, branding?.primaryColor ? { backgroundColor: branding.primaryColor, opacity: 0.8 } : {}]} />

      {/* ── Meta Row ── */}
      <View style={s.metaRow}>
        {/* Customer block */}
        <View style={s.metaBlock}>
          <Text style={s.metaLabel}>Billed to</Text>
          <Text style={s.metaValue}>{String(data.customer?.name || 'Walk-in Customer')}</Text>
          {data.customer?.email && (
            <Text style={s.metaSub}>{String(data.customer.email)}</Text>
          )}
          {data.customer?.phone && (
            <Text style={s.metaSub}>{String(data.customer.phone)}</Text>
          )}
          <View style={s.paidBadge}>
            <Text style={s.paidBadgeText}>✓ {String(data.status || 'Paid')}</Text>
          </View>
        </View>

        {/* Transaction detail block */}
        <View style={[s.metaBlock, { alignItems: "flex-end" }]}>
          <Text style={s.metaLabel}>Transaction details</Text>
          <View style={[s.detailGrid, { justifyContent: "flex-end" }]}>
            <MetaField label="Date" value={displayDate} />
            <MetaField
              label="Payment method"
              value={String(data.paymentMethod || "N/A")}
            />
            <MetaField label="Transaction ID" value={String(data.id || 'N/A')} />
          </View>
        </View>
      </View>

      {/* ── Divider ── */}
      <View style={s.divider} />

      {/* ── Items Table ── */}
      <Text style={s.sectionLabel}>Transaction summary</Text>

      <View style={s.tableHeader}>
        <Text style={[s.tableHeaderText, { flex: 5 }]}>Description</Text>
        <Text style={[s.tableHeaderText, { flex: 1, textAlign: "center" }]}>
          Qty
        </Text>
        <Text style={[s.tableHeaderText, { flex: 2, textAlign: "right" }]}>
          Unit price
        </Text>
        <Text style={[s.tableHeaderText, { flex: 2, textAlign: "right" }]}>
          Amount
        </Text>
      </View>

      {data.items.map((item, i) => (
        <View key={i} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
          <Text style={s.cellDesc}>{item.itemName || item.description}</Text>
          <Text style={s.cellQty}>{item.quantity}</Text>
          <Text style={s.cellRate}>
            {fmt(item.rate || item.unitPrice || 0)}
          </Text>
          <Text style={s.cellAmt}>
            {fmt(item.amount || item.totalPrice || 0)}
          </Text>
        </View>
      ))}

      {/* ── Totals ── */}
      <View style={s.totalsPanel}>
        <View style={s.totalsInner}>
          <View style={s.totalsRow}>
            <Text style={s.totalsLabel}>Subtotal</Text>
            <Text style={s.totalsValue}>{fmt(data.subtotal)}</Text>
          </View>

          {(data.discountTotal || 0) > 0 && (
            <View style={s.totalsRow}>
              <Text style={s.totalsLabel}>Discount</Text>
              <Text style={[s.discountValue, branding?.primaryColor ? { color: branding.primaryColor } : {}]}>
                − {fmt(data.discountTotal || 0)}
              </Text>
            </View>
          )}

          <View style={s.totalsRow}>
            <Text style={s.totalsLabel}>Tax</Text>
            <Text style={s.totalsValue}>{fmt(data.tax)}</Text>
          </View>

          <View style={[s.grandTotalBar, branding?.primaryColor ? { backgroundColor: branding.primaryColor } : {}]}>
            <Text style={s.grandTotalLabel}>Amount paid</Text>
            <Text style={s.grandTotalValue}>{fmt(data.total)}</Text>
          </View>

          {data.amountReceived !== undefined && (
            <View style={s.cashSection}>
              <View style={s.cashRow}>
                <Text style={s.totalsLabel}>Cash received</Text>
                <Text style={s.totalsValue}>
                  {fmt(data.amountReceived)}
                </Text>
              </View>
              <View style={s.cashRow}>
                <Text style={s.totalsLabel}>Change returned</Text>
                <Text style={s.totalsValue}>
                  {fmt(data.change ?? 0)}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* ── Footer ── */}
      <View style={s.footer}>
        <View style={s.footerLeft}>
          <Text style={s.thankYou}>Thank you for your business.</Text>
          <Text style={s.footerSub}>
            This is an official payment receipt issued by {orgName}.{"\n"}
            Please retain this document for your records.
          </Text>
        </View>
        <View style={s.footerRight}>
          <Text style={s.footerMeta}>
            <Text style={s.footerBoldMeta}>{orgName}</Text>
            {"\n"}Receipt #{String(data.receiptNumber || 'N/A')}
            {"\n"}Issued {displayDate}
          </Text>
        </View>
      </View>
    </Page>
  );
};
