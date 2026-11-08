import { describe, it, expect, vi } from "vitest";
import React from "react";
import { BusinessReportV3 } from "./templates/v3/report/BusinessReportV3";
import { BusinessReportData } from "./types";

// Mock @react-pdf/renderer
vi.mock("@react-pdf/renderer", async () => {
  return {
    Document: ({ children, title }: any) => <div data-testid="doc" data-title={title}>{children}</div>,
    Page: ({ children, size }: any) => <div data-testid="page" data-size={size}>{children}</div>,
    Text: ({ children, render }: any) => {
      if (typeof render === "function") {
        return <span>{render({ pageNumber: 1, totalPages: 1 })}</span>;
      }
      return <span>{children}</span>;
    },
    View: ({ children, style }: any) => <div data-testid="view">{children}</div>,
    Image: ({ src }: any) => <img src={src} alt="pdf-img" />,
    StyleSheet: {
      create: (styles: any) => styles,
    },
  };
});

describe("BusinessReportV3 PDF Template", () => {
  const mockReportData: BusinessReportData = {
    id: "rep-123",
    number: "REP-2026-001",
    date: new Date("2026-11-05"),
    title: "Executive Business Summary",
    category: "EXECUTIVE",
    reportNumber: "REP-2026-001",
    periodText: "Last 7 Days (2026-10-29 to 2026-11-05)",
    generatedAtText: "Nov 5, 2026",
    generatedByText: "Sarah Admin",
    locationName: "Downtown Flagship",
    departmentName: "Operations",
    currency: "$",
    aiSummary: "Revenue grew 14% over baseline. Inventory flow is healthy.",
    kpis: [
      { label: "Total Revenue", value: "$12,500.00", subtext: "42 orders" },
      { label: "Operating Expenses", value: "$3,200.00", subtext: "Cost centers" },
      { label: "Net Tax Payable", value: "$900.00", subtext: "Net VAT" },
    ],
    salesBreakdown: [
      { name: "Sourdough Loaf", quantity: 64, revenue: 512 },
      { name: "Artisan Croissant", quantity: 120, revenue: 480 },
    ],
    inventoryBreakdown: [
      { name: "Organic Flour", qty: 250 },
    ],
    productionBreakdown: [
      { name: "Artisan Baguette", quantity: 120, unit: "pcs" },
    ],
    financeSummary: {
      totalExpenses: 3200,
      outputTax: 2000,
      inputTax: 1100,
      netVatPayable: 900,
    },
    branding: {
      companyName: "Acme Bakery Co.",
      logoUrl: "https://example.com/logo.png",
    },
  };

  it("renders report header, branding, and category badge", () => {
    const element = <BusinessReportV3 data={mockReportData} />;
    expect(element).toBeDefined();
    expect(element.props.data.title).toBe("Executive Business Summary");
    expect(element.props.data.category).toBe("EXECUTIVE");
    expect(element.props.data.branding.companyName).toBe("Acme Bakery Co.");
  });

  it("includes AI summary and KPI metrics", () => {
    const element = <BusinessReportV3 data={mockReportData} />;
    expect(element.props.data.aiSummary).toContain("Revenue grew 14%");
    expect(element.props.data.kpis).toHaveLength(3);
    expect(element.props.data.salesBreakdown).toHaveLength(2);
    expect(element.props.data.financeSummary?.netVatPayable).toBe(900);
  });
});
