import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { TransactionAnalyticsExportData } from "../../types";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 10,
  },
  logo: {
    width: 60,
    height: 60,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  orgInfo: {
    textAlign: "right",
  },
  filters: {
    marginBottom: 20,
    fontSize: 10,
    color: "#666",
  },
  table: {
    width: "100%",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tableRow: {
    flexDirection: "row",
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  col: {
    fontSize: 9,
  },
  colNo: { width: "15%" },
  colDate: { width: "15%" },
  colCustomer: { width: "25%" },
  colItems: { width: "30%" },
  colTotal: { width: "15%", textAlign: "right" },
});

export const AnalyticsExport = ({
  data,
}: {
  data: TransactionAnalyticsExportData;
}) => {
  const branding = data.branding;
  return (
    <Document>
      <Page style={styles.page} size="A4" orientation="landscape">
        <View style={styles.header}>
          <View>
            {branding?.logoUrl && (
              <Image src={branding.logoUrl} style={styles.logo} />
            )}
            <Text style={styles.title}>Transaction Analytics Export</Text>
          </View>
          <View style={styles.orgInfo}>
            <Text>{branding?.companyName || "Organization"}</Text>
            <Text style={{ fontSize: 10, color: "#666" }}>
              Generated on: {String(data.date)}
            </Text>
          </View>
        </View>

        <View style={styles.filters}>
          <Text>Date Range: {data.dateRangeText}</Text>
          {data.activeFiltersText && (
            <Text>Filters: {data.activeFiltersText}</Text>
          )}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.col, styles.colNo]}>Number</Text>
            <Text style={[styles.col, styles.colDate]}>Date</Text>
            <Text style={[styles.col, styles.colCustomer]}>Customer</Text>
            <Text style={[styles.col, styles.colItems]}>Items</Text>
            <Text style={[styles.col, styles.colTotal]}>Total</Text>
          </View>
          {data.transactions.map((t, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.col, styles.colNo]}>{t.number}</Text>
              <Text style={[styles.col, styles.colDate]}>{t.date}</Text>
              <Text style={[styles.col, styles.colCustomer]}>
                {t.customerName}
              </Text>
              <Text style={[styles.col, styles.colItems]}>
                {t.items
                  .map((item) => `${item.productName} (x${item.quantity})`)
                  .join(", ")}
              </Text>
              <Text style={[styles.col, styles.colTotal]}>
                {t.total.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};
