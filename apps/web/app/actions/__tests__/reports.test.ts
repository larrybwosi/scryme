import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("../auth", () => ({
  getOrganizationContext: vi.fn(),
}));

vi.mock("@repo/db", () => ({
  prisma: {
    reportSettings: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    organization: {
      findUnique: vi.fn(),
    },
    member: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    report: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    inventoryLocation: {
      findMany: vi.fn(),
    },
    department: {
      findMany: vi.fn(),
    },
    workflowEngineDefinition: {
      findMany: vi.fn(),
    },
    transaction: {
      aggregate: vi.fn(),
      findMany: vi.fn(),
    },
    stockMovement: {
      findMany: vi.fn(),
    },
    batch: {
      findMany: vi.fn(),
    },
    expense: {
      aggregate: vi.fn(),
      findMany: vi.fn(),
    },
    journalLine: {
      aggregate: vi.fn(),
    },
  },
}));

import { getOrganizationContext } from "../auth";
import { prisma } from "@repo/db";
import {
  getReportSettingsAction,
  updateReportSettingsAction,
  getReportsListAction,
  getReportLocationsAndDepartmentsAction,
  triggerTestReportAction,
  generateCategoryReportAction,
  askReportAiAction,
  deleteReportAction,
} from "../reports";

describe("reports server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw error if context is missing organizationId", async () => {
    (getOrganizationContext as any).mockResolvedValue(null);
    await expect(getReportSettingsAction()).rejects.toThrow("Unauthorized");
  });

  it("should return existing report settings", async () => {
    (getOrganizationContext as any).mockResolvedValue({ organizationId: "org-1" });
    (prisma.reportSettings.findUnique as any).mockResolvedValue({
      id: "rs-1",
      organizationId: "org-1",
      formats: ["HTML", "MARKDOWN"],
      summaryPeriodDays: 7,
      workflowEnabled: true,
    });

    const res = await getReportSettingsAction();
    expect(res.id).toBe("rs-1");
    expect(res.formats).toContain("HTML");
    expect(res.summaryPeriodDays).toBe(7);
    expect(res.workflowEnabled).toBe(true);
  });

  it("should update report settings successfully", async () => {
    (getOrganizationContext as any).mockResolvedValue({ organizationId: "org-1" });
    (prisma.reportSettings.findUnique as any).mockResolvedValue({
      id: "rs-1",
      organizationId: "org-1",
    });
    (prisma.reportSettings.update as any).mockResolvedValue({
      id: "rs-1",
      formats: ["PDF", "CSV"],
      workflowEnabled: true,
      workflowKey: "f/dealio/sales_report",
      minRevenueThreshold: 1000,
    });

    const res = await updateReportSettingsAction({
      formats: ["PDF", "CSV"],
      workflowEnabled: true,
      workflowKey: "f/dealio/sales_report",
      minRevenueThreshold: 1000,
    });

    expect(res.success).toBe(true);
    expect(res.settings.workflowEnabled).toBe(true);
    expect(res.settings.minRevenueThreshold).toBe(1000);
  });

  it("should generate sales category report and upsert report record", async () => {
    (getOrganizationContext as any).mockResolvedValue({ organizationId: "org-1" });
    (prisma.organization.findUnique as any).mockResolvedValue({ name: "Acme Bakery" });
    (prisma.member.findFirst as any).mockResolvedValue({ id: "mem-1" });

    (prisma.transaction.aggregate as any).mockResolvedValue({
      _sum: { finalTotal: 1540 },
      _count: { _all: 12 },
    });
    (prisma.transaction.findMany as any).mockResolvedValue([
      {
        id: "tx-1",
        number: "ORD-101",
        finalTotal: 120,
        createdAt: new Date(),
        items: [
          { productName: "Croissant", quantity: 20, subtotal: 80 },
          { productName: "Latte", quantity: 10, subtotal: 40 },
        ],
      },
    ]);

    (prisma.report.upsert as any).mockImplementation(({ create }: any) => {
      return { id: "rep-sales-1", ...create };
    });

    const res = await generateCategoryReportAction({
      category: "SALES",
      days: 7,
    });

    expect(res.success).toBe(true);
    expect(res.report.type).toBe("SALES_REPORT");
    const data = res.report.data as any;
    expect(data.sales.totalRevenue).toBe(1540);
    expect(data.sales.transactionCount).toBe(12);
    expect(data.sales.topProducts[0].name).toBe("Croissant");
    expect(res.report.summary).toBeDefined();
  });

  it("should generate stock category report and calculate inflows/outflows", async () => {
    (getOrganizationContext as any).mockResolvedValue({ organizationId: "org-1" });
    (prisma.organization.findUnique as any).mockResolvedValue({ name: "Acme Bakery" });
    (prisma.member.findFirst as any).mockResolvedValue({ id: "mem-1" });

    (prisma.stockMovement.findMany as any).mockResolvedValue([
      { movementType: "PURCHASE_RECEIPT", quantity: 100, variant: { product: { name: "Flour 25kg" } } },
      { movementType: "SALE", quantity: 40, variant: { product: { name: "Flour 25kg" } } },
    ]);

    (prisma.report.upsert as any).mockImplementation(({ create }: any) => {
      return { id: "rep-stock-1", ...create };
    });

    const res = await generateCategoryReportAction({
      category: "STOCK",
      days: 14,
    });

    expect(res.success).toBe(true);
    expect(res.report.type).toBe("INVENTORY_REPORT");
    const data = res.report.data as any;
    expect(data.inventory.totalIn).toBe(100);
    expect(data.inventory.totalOut).toBe(40);
    expect(data.inventory.netChange).toBe(60);
  });

  it("should generate production category report and track batches/waste", async () => {
    (getOrganizationContext as any).mockResolvedValue({ organizationId: "org-1" });
    (prisma.organization.findUnique as any).mockResolvedValue({ name: "Acme Bakery" });
    (prisma.member.findFirst as any).mockResolvedValue({ id: "mem-1" });

    (prisma.batch.findMany as any).mockResolvedValue([
      {
        id: "batch-1",
        batchNumber: "B-001",
        actualQuantity: 50,
        wasteQuantity: 2.5,
        recipe: { name: "Baguette", systemUnit: { symbol: "pcs" } },
      },
    ]);

    (prisma.report.upsert as any).mockImplementation(({ create }: any) => {
      return { id: "rep-prod-1", ...create };
    });

    const res = await generateCategoryReportAction({
      category: "PRODUCTION",
      days: 7,
    });

    expect(res.success).toBe(true);
    expect(res.report.type).toBe("BAKERY_REPORT");
    const data = res.report.data as any;
    expect(data.production.totalBatches).toBe(1);
    expect(data.production.totalYield).toBe(50);
    expect(data.production.totalWaste).toBe(2.5);
  });

  it("should answer interactive AI advisory questions based on report metrics", async () => {
    (getOrganizationContext as any).mockResolvedValue({ organizationId: "org-1" });
    (prisma.report.findFirst as any).mockResolvedValue({
      id: "rep-1",
      type: "SALES_REPORT",
      startDate: new Date("2026-11-01"),
      endDate: new Date("2026-11-07"),
      data: {
        sales: {
          totalRevenue: 8500,
          transactionCount: 140,
          topProducts: [{ name: "Artisan Loaf", revenue: 2100 }],
        },
      },
      summary: "Revenue surged by 15% this week.",
    });

    const res = await askReportAiAction("rep-1", "How was our sales and revenue performance?");
    expect(res.success).toBe(true);
    expect(res.answer).toContain("total recorded revenue is **$8500.00**");
    expect(res.answer).toContain("Artisan Loaf");
  });

  it("should delete report strictly scoped by organizationId", async () => {
    (getOrganizationContext as any).mockResolvedValue({ organizationId: "org-1" });
    (prisma.report.deleteMany as any).mockResolvedValue({ count: 1 });

    const res = await deleteReportAction("rep-1");
    expect(res.success).toBe(true);
    expect(prisma.report.deleteMany).toHaveBeenCalledWith({
      where: { id: "rep-1", organizationId: "org-1" },
    });
  });

  it("should throw error when deleting report of another organization", async () => {
    (getOrganizationContext as any).mockResolvedValue({ organizationId: "org-1" });
    (prisma.report.deleteMany as any).mockResolvedValue({ count: 0 });

    await expect(deleteReportAction("rep-unauthorized")).rejects.toThrow(
      "Report not found or unauthorized",
    );
  });
});
