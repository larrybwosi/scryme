import { StyleSheet } from "@react-pdf/renderer";

export const getA4CommonStyles = (primaryColor = "#2563eb") =>
  StyleSheet.create({
    page: {
      padding: 40,
      fontFamily: "Helvetica",
      fontSize: 10,
      color: "#1a1a1a",
      backgroundColor: "#ffffff",
    },
    headerAccent: {
      height: 6,
      backgroundColor: primaryColor,
      marginBottom: 20,
      marginHorizontal: -40,
      marginTop: -40,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 30,
      borderBottom: "1px solid #e2e8f0",
      paddingBottom: 20,
    },
    logo: {
      height: 45,
      marginBottom: 10,
      objectFit: "contain",
    },
    companyInfo: {
      flex: 1,
    },
    companyName: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#0f172a",
    },
    docTitleSection: {
      textAlign: "right",
    },
    docTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: primaryColor,
      marginBottom: 5,
    },
    metaText: {
      fontSize: 9,
      color: "#64748b",
    },
    sectionTitle: {
      fontSize: 9,
      fontWeight: "bold",
      textTransform: "uppercase",
      color: primaryColor,
      borderBottom: `1px solid ${primaryColor}22`,
      paddingBottom: 3,
      marginBottom: 8,
    },
    table: {
      width: "100%",
      marginBottom: 20,
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: "#f8fafc",
      borderBottom: "1px solid #e2e8f0",
      padding: 8,
    },
    tableHeaderCol: {
      fontSize: 9,
      fontWeight: "bold",
      color: "#475569",
    },
    tableRow: {
      flexDirection: "row",
      borderBottom: "1px solid #f1f5f9",
      padding: 8,
    },
    footer: {
      position: "absolute",
      bottom: 30,
      left: 40,
      right: 40,
      borderTop: "1px solid #e2e8f0",
      paddingTop: 10,
      textAlign: "center",
      fontSize: 8,
      color: "#94a3b8",
    },
  });
