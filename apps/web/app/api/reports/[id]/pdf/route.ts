import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@repo/auth/server";
import { db } from "@repo/db";
import { renderToStream } from "@react-pdf/renderer";
import { createElement, ReactElement } from "react";
import { BusinessReportV3 } from "@repo/documents/server";
import { BusinessReportData } from "@repo/documents";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  const report = await db.report.findFirst({
    where: {
      id,
      organizationId: auth.organizationId,
    },
    include: {
      generatedBy: {
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      },
    },
  });

  if (!report) {
    return new NextResponse("Report Not Found", { status: 404 });
  }

  const org = await db.organization.findUnique({
    where: { id: auth.organizationId },
    include: {
      settings: true,
      invoiceConfig: true,
    },
  });

  const rawData: any = report.data || {};
  const currencySymbol = org?.settings?.defaultCurrency === "KES" ? "KSh " : "$";
  const category = (rawData.category || report.type?.replace("_REPORT", "") || "EXECUTIVE").toUpperCase();

  // Format date range text
  const startStr = report.startDate
    ? new Date(report.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";
  const endStr = report.endDate
    ? new Date(report.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";
  const periodText = startStr && endStr ? `${startStr} – ${endStr}` : `${rawData.days || 7} Days`;

  // Build KPIs
  const kpis: any[] = [];
  if (rawData.sales) {
    kpis.push({
      label: "Total Revenue",
      value: `${currencySymbol}${Number(rawData.sales.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      subtext: `${rawData.sales.transactionCount || 0} orders`,
    });
  }
  if (rawData.inventory) {
    kpis.push({
      label: "Stock Movements",
      value: `${Number(rawData.inventory.totalIn || 0) + Number(rawData.inventory.totalOut || 0)} units`,
      subtext: `In: ${rawData.inventory.totalIn || 0} | Out: ${rawData.inventory.totalOut || 0}`,
    });
  }
  if (rawData.production) {
    kpis.push({
      label: "Production Batches",
      value: `${rawData.production.totalBatches || 0} batches`,
      subtext: `Waste: ${rawData.production.totalWaste || 0} units`,
    });
  }
  if (rawData.finance) {
    kpis.push({
      label: "Operating Spend",
      value: `${currencySymbol}${Number(rawData.finance.totalExpenses || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      subtext: `${rawData.finance.expenseCount || 0} expense entries`,
    });
  }
  if (rawData.tax) {
    kpis.push({
      label: "Estimated VAT",
      value: `${currencySymbol}${Number(rawData.tax.netVatPayable || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      subtext: `Net tax payable`,
    });
  }

  const reportDocData: BusinessReportData = {
    id: report.id,
    number: `REP-${report.id.substring(0, 8).toUpperCase()}`,
    date: report.generatedAt,
    title: `${category.charAt(0) + category.slice(1).toLowerCase()} Business Performance Report`,
    category,
    reportNumber: `REP-${report.id.substring(0, 8).toUpperCase()}`,
    periodText,
    generatedAtText: new Date(report.generatedAt).toLocaleString(),
    generatedByText: report.generatedBy?.user?.name || report.generatedBy?.user?.email || "System",
    currency: currencySymbol,
    aiSummary: report.summary || rawData.aiInsights || undefined,
    kpis,
    salesBreakdown: rawData.sales?.topProducts?.map((p: any) => ({
      name: p.name,
      quantity: Number(p.quantity || 0),
      revenue: Number(p.revenue || 0),
    })),
    inventoryBreakdown: rawData.inventory?.topMovedItems?.map((i: any) => ({
      name: i.name,
      qty: Number(i.qty || 0),
    })),
    productionBreakdown: rawData.production?.topRecipes?.map((r: any) => ({
      name: r.name,
      quantity: Number(r.quantity || 0),
      unit: r.unit || "units",
    })),
    financeSummary: rawData.finance || rawData.tax ? {
      totalExpenses: Number(rawData.finance?.totalExpenses || 0),
      outputTax: Number(rawData.tax?.outputTax || 0),
      inputTax: Number(rawData.tax?.inputTax || 0),
      netVatPayable: Number(rawData.tax?.netVatPayable || 0),
    } : undefined,
    branding: {
      companyName: org?.name || "Scryme Organization",
      logoUrl: org?.invoiceConfig?.logoUrl || org?.logo || undefined,
      companyAddress: typeof org?.address === "string" ? org?.address : undefined,
    },
  };

  try {
    const documentElement = createElement(BusinessReportV3, { data: reportDocData }) as unknown as ReactElement;
    const stream = await renderToStream(documentElement as any);

    const filename = `${category.toLowerCase()}-report-${report.id.substring(0, 8)}.pdf`;

    return new NextResponse(stream as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("[report-pdf-api] Error generating PDF report:", error);
    return new NextResponse(`Error generating PDF report: ${error.message}`, { status: 500 });
  }
}
