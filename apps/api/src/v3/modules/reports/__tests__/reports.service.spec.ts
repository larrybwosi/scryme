import { describe, it, expect, beforeEach, vi } from "vitest";
import { ReportsService } from "../application/services/reports.service";

describe("ReportsService", () => {
  let reportsService: ReportsService;
  let mockPrisma: any;
  let mockScrymeService: any;
  let mockAiReportService: any;

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
        member: {
          findMany: vi.fn(),
          findFirst: vi.fn(),
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
      },
    };

    mockScrymeService = {
      getConfiguration: vi.fn().mockResolvedValue(null),
    };

    mockAiReportService = {
      generateExecutiveInsights: vi.fn().mockResolvedValue("Executive AI Insight Analysis"),
    };

    reportsService = new ReportsService(
      mockPrisma as any,
      mockScrymeService as any,
      mockAiReportService as any,
    );
  });

  describe("generateAndDispatchReport", () => {
    it("should fetch setup data and domain metrics concurrently and return generated report", async () => {
      const orgId = "org-123";

      mockPrisma.client.reportSettings.findUnique.mockResolvedValue({
        id: "setting-1",
        organizationId: orgId,
        includeSales: true,
        includeInventory: true,
        includeProduction: true,
        includeTax: true,
        includeAiInsights: true,
        emailEnabled: false,
        scrymeEnabled: false,
      });

      mockPrisma.client.organization.findUnique.mockResolvedValue({
        id: orgId,
        name: "Acme Corp",
        slug: "acme",
      });

      mockPrisma.client.member.findFirst.mockResolvedValue({
        id: "member-admin-1",
      });

      mockPrisma.client.transaction.findMany.mockResolvedValue([
        { finalTotal: 500, metadata: { items: [{ name: "Widget A", quantity: 2, price: 250 }] } },
      ]);

      mockPrisma.client.stockMovement.findMany.mockResolvedValue([
        { movementType: "PURCHASE_RECEIPT", quantity: 10, variant: { product: { name: "Raw Material" } } },
      ]);

      mockPrisma.client.batch.findMany.mockResolvedValue([
        { actualQuantity: 50, wasteQuantity: 1, recipe: { name: "Bread Recipe", systemUnit: { symbol: "kg" } } },
      ]);

      mockPrisma.client.journalLine.aggregate
        .mockResolvedValueOnce({ _sum: { credit: 100 } })
        .mockResolvedValueOnce({ _sum: { debit: 40 } });

      mockPrisma.client.report.create.mockResolvedValue({
        id: "report-999",
        organizationId: orgId,
      });

      const result = await reportsService.generateAndDispatchReport(orgId, { days: 7, sendEmail: false, sendScryme: false });

      expect(result.reportId).toBe("report-999");
      expect(result.organizationId).toBe(orgId);
      expect(result.summary.sales).toBeDefined();
      expect(result.summary.sales?.totalRevenue).toBe(500);
      expect(result.summary.inventory?.totalIn).toBe(10);
      expect(result.summary.production?.totalBatches).toBe(1);
      expect(result.summary.tax?.netVatPayable).toBe(60);
      expect(result.aiInsights).toBe("Executive AI Insight Analysis");

      expect(mockPrisma.client.report.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: orgId,
            generatedById: "member-admin-1",
          }),
        }),
      );
    });
  });
});
