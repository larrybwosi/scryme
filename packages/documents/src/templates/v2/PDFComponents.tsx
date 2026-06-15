import React from 'react';
import { Text, View, Image } from '@react-pdf/renderer';
import { commonStyles as styles } from './document-styles';

export const PDFHeader = ({ logoUrl, orgName, orgAddress, title, number }: any) => (
  <View style={styles.header}>
    <View>
      {logoUrl && <Image src={logoUrl} style={styles.logo} />}
      <Text style={{ fontSize: 14, fontWeight: 'bold' }}>{orgName}</Text>
      {orgAddress && <Text style={{ fontSize: 8 }}>{orgAddress}</Text>}
    </View>
    <View style={{ textAlign: 'right' }}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{number}</Text>
    </View>
  </View>
);

export const PDFFooter = ({ orgName, docType }: any) => (
  <View style={styles.footer}>
    <Text>Generated on {new Date().toLocaleString()}</Text>
    <Text>{orgName} - {docType}</Text>
  </View>
);

export const PDFGrid = ({ children }: any) => (
  <View style={styles.grid}>{children}</View>
);

export const PDFCol = ({ label, value, children, style }: any) => (
  <View style={[styles.col, style]}>
    {label && <Text style={styles.label}>{label}</Text>}
    {value && <Text style={styles.value}>{value}</Text>}
    {children}
  </View>
);

export const PDFTable = ({ children }: any) => (
  <View style={styles.table}>{children}</View>
);

export const PDFTableRow = ({ children }: any) => (
  <View style={styles.tableRow}>{children}</View>
);

export const PDFTableCell = ({ children, width, isHeader }: any) => (
  <View style={[isHeader ? styles.tableColHeader : styles.tableCol, { width }]}>
    <Text style={isHeader ? styles.tableCellHeader : styles.tableCell}>{children}</Text>
  </View>
);
