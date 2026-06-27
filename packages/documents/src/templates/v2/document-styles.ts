import { StyleSheet } from "@react-pdf/renderer";

export const commonStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#333",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottom: "2px solid #2563eb",
    paddingBottom: 20,
    marginBottom: 20,
  },
  logo: {
    width: 60,
    height: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2563eb",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
    backgroundColor: "#f3f4f6",
    padding: 4,
  },
  grid: {
    flexDirection: "row",
    marginBottom: 10,
  },
  col: {
    flex: 1,
  },
  label: {
    fontSize: 8,
    color: "#666",
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    fontWeight: "bold",
  },
  table: {
    display: "table" as any,
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row",
  },
  tableColHeader: {
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: "#f9fafb",
    padding: 5,
  },
  tableCol: {
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
  },
  tableCellHeader: {
    fontWeight: "bold",
    fontSize: 9,
  },
  tableCell: {
    fontSize: 9,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: "1px solid #e5e7eb",
    paddingTop: 10,
    textAlign: "center",
    fontSize: 8,
    color: "#999",
  },
});
