import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { TransactionAnalyticsExportData } from '../types';

Font.register({
  family: 'Oswald',
  src: 'https://fonts.gstatic.com/s/oswald/v13/Y_TKV6o8WovbUd3m_X9aAA.ttf',
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 30,
    paddingLeft: 40,
    paddingRight: 40,
    paddingBottom: 60,
    lineHeight: 1.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
  },
  orgInfo: {
    flexDirection: 'column',
  },
  orgName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  orgLogo: {
    width: 80,
    height: 40,
    objectFit: 'contain',
  },
  reportTitleSection: {
    textAlign: 'center',
    marginBottom: 10,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  filterText: {
    fontSize: 9,
    color: '#444444',
    marginBottom: 10,
  },
  dateRangeText: {
    fontSize: 12,
    color: '#555555',
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomColor: '#bfbfbf',
    borderBottomWidth: 1,
    alignItems: 'center',
    minHeight: 24,
  },
  tableHeader: {
    backgroundColor: '#f2f2f2',
    fontWeight: 'bold',
  },
  tableColHeader: {
    flex: 1,
    padding: 5,
    borderRightColor: '#bfbfbf',
    borderRightWidth: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableCol: {
    flex: 1,
    padding: 5,
    borderRightColor: '#bfbfbf',
    borderRightWidth: 1,
    textAlign: 'left',
    fontSize: 8,
  },
  tableColSmall: { flex: 0.5 },
  tableColMedium: { flex: 0.8 },
  tableColLarge: { flex: 1.5 },
  textRight: { textAlign: 'right' },
  pageNumber: {
    position: 'absolute',
    fontSize: 9,
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'grey',
  },
  noData: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 50,
    color: '#777777',
  },
});

export const AnalyticsExportDocument = ({ data }: { data: TransactionAnalyticsExportData }) => {
  let overallTotalAmount = 0;
  data.transactions.forEach(t => overallTotalAmount += t.total);

  return (
    <Document>
      <Page size="A4" style={styles.page} orientation="landscape">
        <View style={styles.header}>
          <View style={styles.orgInfo}>
            {data.organization.logo && <Image style={styles.orgLogo} src={data.organization.logo} />}
            <Text style={styles.orgName}>{data.organization.name}</Text>
          </View>
          <Text>Generated: {new Date().toLocaleDateString()}</Text>
        </View>

        <View style={styles.reportTitleSection}>
          <Text style={styles.reportTitle}>Sales Report</Text>
          <Text style={styles.dateRangeText}>{data.dateRangeText}</Text>
          {data.activeFiltersText && <Text style={styles.filterText}>{data.activeFiltersText}</Text>}
        </View>

        {data.transactions.length > 0 ? (
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableColHeader, { flex: 0.8 }]}>Sale #</Text>
              <Text style={[styles.tableColHeader, { flex: 0.7 }]}>Date</Text>
              <Text style={[styles.tableColHeader, styles.tableColLarge]}>Customer</Text>
              <Text style={[styles.tableColHeader, styles.tableColLarge]}>Product</Text>
              <Text style={[styles.tableColHeader, styles.tableColSmall]}>Qty</Text>
              <Text style={[styles.tableColHeader, styles.tableColMedium, styles.textRight]}>Unit Price</Text>
              <Text style={[styles.tableColHeader, styles.tableColMedium, styles.textRight]}>Item Total</Text>
              <Text style={[styles.tableColHeader, styles.tableColMedium, styles.textRight]}>Sale Total</Text>
              <Text style={[styles.tableColHeader]}>Payment</Text>
            </View>
            {data.transactions.map((transaction, tIndex) =>
              transaction.items.map((item, index) => (
                <View key={`${tIndex}-${index}`} style={styles.tableRow}>
                  {index === 0 ? (
                    <>
                      <Text style={[styles.tableCol, { flex: 0.8 }]}>{transaction.number}</Text>
                      <Text style={[styles.tableCol, { flex: 0.7 }]}>{transaction.date}</Text>
                      <Text style={[styles.tableCol, styles.tableColLarge]}>{transaction.customerName}</Text>
                    </>
                  ) : (
                    <>
                      <Text style={[styles.tableCol, { flex: 0.8 }]}></Text>
                      <Text style={[styles.tableCol, { flex: 0.7 }]}></Text>
                      <Text style={[styles.tableCol, styles.tableColLarge]}></Text>
                    </>
                  )}
                  <Text style={[styles.tableCol, styles.tableColLarge]}>
                    {item.productName} ({item.variantName})
                  </Text>
                  <Text style={[styles.tableCol, styles.tableColSmall, styles.textRight]}>{item.quantity}</Text>
                  <Text style={[styles.tableCol, styles.tableColMedium, styles.textRight]}>
                    {item.unitPrice.toFixed(2)}
                  </Text>
                  <Text style={[styles.tableCol, styles.tableColMedium, styles.textRight]}>
                    {item.subtotal.toFixed(2)}
                  </Text>
                  {index === 0 ? (
                    <>
                      <Text style={[styles.tableCol, styles.tableColMedium, styles.textRight]}>
                        {transaction.total.toFixed(2)}
                      </Text>
                      <Text style={[styles.tableCol]}>{transaction.paymentInfo}</Text>
                    </>
                  ) : (
                    <>
                      <Text style={[styles.tableCol, styles.tableColMedium]}></Text>
                      <Text style={[styles.tableCol]}></Text>
                    </>
                  )}
                </View>
              ))
            )}
            <View style={[styles.tableRow, styles.tableHeader, { borderTopWidth: 1, borderTopColor: '#bfbfbf' }]}>
              <Text style={[styles.tableColHeader, { flex: 0.8 }]}></Text>
              <Text style={[styles.tableColHeader, { flex: 0.7 }]}></Text>
              <Text style={[styles.tableColHeader, styles.tableColLarge]}></Text>
              <Text style={[styles.tableColHeader, styles.tableColLarge]}></Text>
              <Text style={[styles.tableColHeader, styles.tableColSmall]}></Text>
              <Text style={[styles.tableColHeader, styles.tableColMedium, styles.textRight]}></Text>
              <Text style={[styles.tableColHeader, styles.tableColMedium, styles.textRight]}>Total:</Text>
              <Text style={[styles.tableColHeader, styles.tableColMedium, styles.textRight]}>
                {overallTotalAmount.toFixed(2)}
              </Text>
              <Text style={[styles.tableColHeader]}></Text>
            </View>
          </View>
        ) : (
          <Text style={styles.noData}>No sales data available for the selected criteria.</Text>
        )}

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
};
