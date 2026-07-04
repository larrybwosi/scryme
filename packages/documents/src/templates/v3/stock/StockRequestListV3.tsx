import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import { format } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StockRequestV3Item {
  requestNumber: string;
  requestDate: string;
  location: string;
  requestedBy?: string;
  itemsCount: number;
  priority: "URGENT" | "HIGH" | "NORMAL" | "LOW" | string;
  status:
    | "PENDING"
    | "APPROVED"
    | "FULFILLED"
    | "REJECTED"
    | "PARTIAL"
    | string;
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
// Clean spreadsheet-style: white background throughout, light gray header,
// thin grid lines, full-width table, no cards/KPI tiles, no colored badges.

const BORDER = "#dcdcdc";
const PAGE_MARGIN = 24;

const getStyles = (primary = "#f2f3f5") =>
  StyleSheet.create({
    page: {
      fontFamily: "Helvetica",
      fontSize: 9,
      color: "#1a1a1a",
      backgroundColor: "#ffffff",
    },

    // ── Compact header band (light gray) ──
    headerBand: {
      backgroundColor: primary,
      paddingHorizontal: PAGE_MARGIN,
      paddingVertical: 10,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottom: `1px solid ${BORDER}`,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
    },
    logo: {
      width: 22,
      height: 22,
      objectFit: "contain",
      marginRight: 8,
    },
    orgName: {
      fontSize: 11,
      fontWeight: "bold",
      color: "#1a1a1a",
    },
    branchName: {
      fontSize: 8,
      color: "#6b6b6b",
      marginLeft: 6,
    },
    headerRight: {
      alignItems: "flex-end",
    },
    docTitle: {
      fontSize: 12,
      fontWeight: "bold",
      color: "#1a1a1a",
      letterSpacing: 1,
    },
    docSubtitle: {
      fontSize: 7,
      color: "#6b6b6b",
      marginTop: 1,
    },

    // ── Meta strip (plain, white, thin bottom rule) ──
    metaStrip: {
      flexDirection: "row",
      paddingHorizontal: PAGE_MARGIN,
      paddingVertical: 8,
      backgroundColor: "#ffffff",
      borderBottom: `1px solid ${BORDER}`,
    },
    metaItem: {
      flexDirection: "row",
      alignItems: "center",
      marginRight: 28,
    },
    metaLabel: {
      fontSize: 7,
      color: "#6b6b6b",
      textTransform: "uppercase",
      letterSpacing: 0.4,
      marginRight: 4,
    },
    metaValue: {
      fontSize: 8.5,
      color: "#1a1a1a",
      fontWeight: "bold",
    },

    // ── Table (spreadsheet grid, full width) ──
    tableContainer: {
      paddingHorizontal: PAGE_MARGIN,
      paddingTop: 14,
      paddingBottom: 50,
    },
    tableHeaderRow: {
      flexDirection: "row",
      backgroundColor: "#eceef0",
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderTop: `1px solid ${BORDER}`,
      borderLeft: `1px solid ${BORDER}`,
      borderRight: `1px solid ${BORDER}`,
      borderBottom: `1px solid ${BORDER}`,
    },
    th: {
      fontSize: 7,
      fontWeight: "bold",
      color: "#4b4b4b",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    tableRow: {
      flexDirection: "row",
      paddingVertical: 6,
      paddingHorizontal: 8,
      alignItems: "center",
      borderBottom: `1px solid ${BORDER}`,
      borderLeft: `1px solid ${BORDER}`,
      borderRight: `1px solid ${BORDER}`,
    },
    tableRowAlt: {
      backgroundColor: "#fafafa",
    },
    td: {
      fontSize: 8.5,
      color: "#1a1a1a",
    },

    // Column widths — plain text values, no badges. Sum to 100% for full width.
    colReqNo: { width: "13%" },
    colDate: { width: "11%" },
    colLocation: { width: "17%" },
    colRequestedBy: { width: "15%" },
    colItems: { width: "8%", textAlign: "center" },
    colPriority: { width: "11%" },
    colStatus: { width: "11%" },
    colCost: { width: "14%", textAlign: "right" },

    // ── Summary line (replaces KPI cards) ──
    summaryRow: {
      flexDirection: "row",
      paddingHorizontal: PAGE_MARGIN,
      paddingVertical: 8,
      borderTop: `1px solid ${BORDER}`,
      justifyContent: "flex-end",
    },
    summaryItem: {
      flexDirection: "row",
      marginLeft: 24,
    },
    summaryLabel: {
      fontSize: 7.5,
      color: "#6b6b6b",
      textTransform: "uppercase",
      letterSpacing: 0.3,
      marginRight: 4,
    },
    summaryValue: {
      fontSize: 8.5,
      fontWeight: "bold",
      color: "#1a1a1a",
    },

    // ── Footer ──
    footer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: PAGE_MARGIN,
      paddingVertical: 8,
      borderTop: `1px solid ${BORDER}`,
      backgroundColor: "#ffffff",
    },
    footerText: {
      fontSize: 6.5,
      color: "#8a8a8a",
    },
    footerOrg: {
      fontSize: 7,
      fontWeight: "bold",
      color: "#1a1a1a",
    },
  });

// ─── Component ────────────────────────────────────────────────────────────────

export const StockRequestListV3 = ({
  data,
}: {
  data: StockRequestListV3Data;
}) => {
  const primary = data.primaryColor || "#f2f3f5";
  const styles = getStyles(primary);

  const total = data.requests.length;
  const urgent = data.requests.filter((r) => r.priority === "URGENT").length;
  const pending = data.requests.filter((r) => r.status === "PENDING").length;
  const fulfilled = data.requests.filter(
    (r) => r.status === "FULFILLED",
  ).length;

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* ── Header Band (compact) ── */}
        <View style={styles.headerBand}>
          <View style={styles.headerLeft}>
            {data.logoUrl && <Image src={data.logoUrl} style={styles.logo} />}
            <Text style={styles.orgName}>{data.organizationName}</Text>
            {data.branchName && (
              <Text style={styles.branchName}>· {data.branchName}</Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.docTitle}>STOCK REQUEST LIST</Text>
            <Text style={styles.docSubtitle}>
              {data.periodLabel || format(new Date(), "MMMM yyyy")} · Internal
              Use Only
            </Text>
          </View>
        </View>

        {/* ── Meta Strip ── */}
        <View style={styles.metaStrip}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Generated:</Text>
            <Text style={styles.metaValue}>
              {format(new Date(), "MMM dd, yyyy HH:mm")}
            </Text>
          </View>
          {data.generatedBy && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Prepared By:</Text>
              <Text style={styles.metaValue}>{data.generatedBy}</Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Report Level:</Text>
            <Text style={styles.metaValue}>
              {data.branchName ? "Branch" : "Organization"}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Total Requests:</Text>
            <Text style={styles.metaValue}>{total}</Text>
          </View>
        </View>

        {/* ── Table ── */}
        <View style={styles.tableContainer}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.th, styles.colReqNo]}>Request #</Text>
            <Text style={[styles.th, styles.colDate]}>Date</Text>
            <Text style={[styles.th, styles.colLocation]}>Location</Text>
            <Text style={[styles.th, styles.colRequestedBy]}>Requested By</Text>
            <Text style={[styles.th, styles.colItems]}>Items</Text>
            <Text style={[styles.th, styles.colPriority]}>Priority</Text>
            <Text style={[styles.th, styles.colStatus]}>Status</Text>
            <Text style={[styles.th, styles.colCost]}>Est. Cost</Text>
          </View>

          {data.requests.map((req, i) => (
            <View
              key={i}
              style={[styles.tableRow, i % 2 !== 0 ? styles.tableRowAlt : {}]}
            >
              <Text
                style={[
                  styles.td,
                  styles.colReqNo,
                  { fontFamily: "Helvetica-Bold" },
                ]}
              >
                {req.requestNumber}
              </Text>
              <Text style={[styles.td, styles.colDate]}>{req.requestDate}</Text>
              <Text style={[styles.td, styles.colLocation]}>
                {req.location}
              </Text>
              <Text style={[styles.td, styles.colRequestedBy]}>
                {req.requestedBy || "—"}
              </Text>
              <Text
                style={[styles.td, styles.colItems, { textAlign: "center" }]}
              >
                {req.itemsCount}
              </Text>
              <Text style={[styles.td, styles.colPriority]}>
                {req.priority}
              </Text>
              <Text style={[styles.td, styles.colStatus]}>{req.status}</Text>
              <Text
                style={[
                  styles.td,
                  styles.colCost,
                  { textAlign: "right", fontFamily: "Helvetica-Bold" },
                ]}
              >
                {req.estimatedCost}
              </Text>
            </View>
          ))}

          {data.requests.length === 0 && (
            <View
              style={{
                paddingVertical: 30,
                alignItems: "center",
                borderLeft: `1px solid ${BORDER}`,
                borderRight: `1px solid ${BORDER}`,
                borderBottom: `1px solid ${BORDER}`,
              }}
            >
              <Text style={{ fontSize: 9, color: "#8a8a8a" }}>
                No requests found.
              </Text>
            </View>
          )}
        </View>

        {/* ── Summary line (replaces KPI cards) ── */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total:</Text>
            <Text style={styles.summaryValue}>{total}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Urgent:</Text>
            <Text style={styles.summaryValue}>{urgent}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Pending:</Text>
            <Text style={styles.summaryValue}>{pending}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Fulfilled:</Text>
            <Text style={styles.summaryValue}>{fulfilled}</Text>
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Generated on {format(new Date(), "dd/MM/yyyy HH:mm")} · Confidential
          </Text>
          <Text style={styles.footerOrg}>{data.organizationName}</Text>
          <Text style={styles.footerText}>Stock Request List · v3</Text>
        </View>
      </Page>
    </Document>
  );
};
