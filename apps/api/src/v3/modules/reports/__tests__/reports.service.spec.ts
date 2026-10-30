import { describe, it, expect, beforeEach, vi } from "vitest";
import { ReportsService } from "../application/services/reports.service";
import { NotFoundException } from "@nestjs/common";

describe("ReportsService", () => {
  let reportsService: ReportsService;
  let mockPrisma: any;
  let mockScrymeService: any;
  let mockAiReportService: any;

  const mockOrgId = "org_123";

  beforeEach(() => {
    mockPrisma = {
      client: {
        reportSettings: {
          findUnique: vi.fn(),
          create: vi.fn(),
          update: vi.fn(),
        },
        organization: {
          findUnique: vi.fn(),
        },
        report: {
          create: vi.fn(),
          findMany: vi.fn(),
        },
        transaction: {
          findMany: vi.fn(),
        },
        stockMovement: {
          findMany: vi.fn(),
        },
        batch: {
          findMany: vi.fn(),
        },
        journalLine: {
          aggregate: vi.fn(),
        },
        member: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
      },
    };

    mockScrymeService = {
      getConfiguration: vi.fn().mockResolvedValue(null),
    };

    mockAiReportService = {
      generateExecutiveInsights: vi.fn().mockResolvedValue("Mocked AI Insights"),
    };

    reportsService = new ReportsService(
      mockPrisma as any,
      mockScrymeService as any,
      mockAiReportService as any,
    );
  });

  it("should generate report with parallel metric queries when organization exists", async () => {
    mockPrisma.client.reportSettings.findUnique.mockResolvedValue({
      id: "settings_123",
      organizationId: mockOrgId,
      includeSales: true,
      includeInventory: true,
      includeProduction: true,
      includeTax: true,
      includeAiInsights: true,
      emailEnabled: false,
      scrymeEnabled: false,
    });

    mockPrisma.client.organization.findUnique.mockResolvedValue({
      id: mockOrgId,
      name: "Acme Corp",
      slug: "acme",
    });

    mockPrisma.client.transaction.findMany.mockResolvedValue([
      { finalTotal: 100, metadata: { items: [{ name: "Widget A", quantity: 2, price: 50 }] } },
    ]);

    mockPrisma.client.stockMovement.findMany.mockResolvedValue([
      { movementType: "PURCHASE_RECEIPT", quantity: 10, variant: { product: { name: "Widget A" } } },
    ]);

    mockPrisma.client.batch.findMany.mockResolvedValue([
      { actualQuantity: 5, wasteQuantity: 0, recipe: { name: "Bread" } },
    ]);

    mockPrisma.client.journalLine.aggregate
      .mockResolvedValueOnce({ _sum: { credit: 15 } })
      .mockResolvedValueOnce({ _sum: { debit: 5 } });

    mockPrisma.client.member.findFirst.mockResolvedValue({ id: "mem_admin" });

    mockPrisma.client.report.create.mockResolvedValue({
      id: "report_999",
      organizationId: mockOrgId,
    });

    const result = await reportsService.generateAndDispatchReport(mockOrgId, { days: 7 });

    expect(result.reportId).toBe("report_999");
    expect(result.summary.sales?.totalRevenue).toBe(100);
    expect(result.summary.inventory?.totalIn).toBe(10);
    expect(result.summary.production?.totalBatches).toBe(1);
    expect(result.summary.tax?.netVatPayable).toBe(10);
    expect(mockAiReportService.generateExecutiveInsights).toHaveBeenCalledWith(
      expect.anything(),
      "Acme Corp",
    );
  });

  it("should throw NotFoundException if organization does not exist", async () => {
    mockPrisma.client.reportSettings.findUnique.mockResolvedValue({
      id: "settings_123",
      organizationId: mockOrgId,
    });

    mockPrisma.client.organization.findUnique.mockResolvedValue(null);

    await expect(
      reportsService.generateAndDispatchReport(mockOrgId, { days: 7 }),
    ).rejects.toThrow(NotFoundException);
  });
});
