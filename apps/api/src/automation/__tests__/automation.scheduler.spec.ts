import { describe, it, expect, vi, beforeEach } from "vitest";
import { AutomationScheduler } from "../automation.scheduler";

describe("AutomationScheduler", () => {
  let scheduler: AutomationScheduler;
  let mockPrisma: any;
  let mockAutomationService: any;

  beforeEach(() => {
    mockPrisma = {
      client: {
        workflowEngineDefinition: {
          findMany: vi.fn(),
        },
        productVariant: {
          findMany: vi.fn(),
        },
        order: {
          count: vi.fn(),
          aggregate: vi.fn(),
        },
        purchase: {
          findFirst: vi.fn(),
        },
      },
    };

    mockAutomationService = {
      triggerWorkflow: vi.fn().mockResolvedValue("exec_123"),
    };

    scheduler = new AutomationScheduler(mockPrisma as any, mockAutomationService as any);
  });

  describe("handleLowStockCronCheck", () => {
    it("should query active low stock definitions and trigger workflow for low stock variants with product & variant name", async () => {
      mockPrisma.client.workflowEngineDefinition.findMany.mockResolvedValue([
        { id: "def_1", key: "lowstock_alert", organizationId: "org_1", config: { threshold: 5 } },
      ]);

      mockPrisma.client.productVariant.findMany.mockResolvedValue([
        { id: "var_10", name: "1kg", product: { name: "Flour" }, variantStocks: [{ currentStock: 2 }] },
      ]);

      await scheduler.handleLowStockCronCheck();

      expect(mockPrisma.client.productVariant.findMany).toHaveBeenCalledWith({
        where: {
          product: { organizationId: "org_1" },
          OR: [
            { variantStocks: { some: { currentStock: { lte: 5 } } } },
            { variantStocks: { none: {} } },
          ],
        },
        include: {
          product: {
            include: {
              suppliers: {
                include: { supplier: true },
              },
            },
          },
          suppliers: {
            include: { supplier: true },
          },
          variantStocks: true,
        },
        take: 50,
      });

      expect(mockAutomationService.triggerWorkflow).toHaveBeenCalledWith("org_1", {
        key: "lowstock_alert",
        inputs: {
          variantId: "var_10",
          productId: undefined,
          productName: "Flour",
          variantName: "1kg",
          currentStock: 2,
          threshold: 5,
          supplierId: undefined,
          supplierName: undefined,
          existingPoId: undefined,
          existingPoNumber: undefined,
        },
      });
    });

    it("should handle variants with multiple location stocks and total stock calculation", async () => {
      mockPrisma.client.workflowEngineDefinition.findMany.mockResolvedValue([
        { id: "def_1", key: "lowstock_alert", organizationId: "org_1", config: { threshold: 10 } },
      ]);

      mockPrisma.client.productVariant.findMany.mockResolvedValue([
        {
          id: "var_11",
          name: "1kg",
          product: { name: "Sugar" },
          variantStocks: [{ currentStock: 3 }, { currentStock: 4 }],
        },
        {
          id: "var_12",
          name: "1kg",
          product: { name: "Salt" },
          variantStocks: [{ currentStock: 8 }, { currentStock: 5 }],
        },
      ]);

      await scheduler.handleLowStockCronCheck();

      expect(mockAutomationService.triggerWorkflow).toHaveBeenCalledTimes(1);
      expect(mockAutomationService.triggerWorkflow).toHaveBeenCalledWith("org_1", {
        key: "lowstock_alert",
        inputs: {
          variantId: "var_11",
          productId: undefined,
          productName: "Sugar",
          variantName: "1kg",
          currentStock: 7,
          threshold: 10,
          supplierId: undefined,
          supplierName: undefined,
          existingPoId: undefined,
          existingPoNumber: undefined,
        },
      });
    });
    it("should resolve preferred supplier and existing draft PO for low stock variant", async () => {
      mockPrisma.client.workflowEngineDefinition.findMany.mockResolvedValue([
        { id: "def_1", key: "lowstock_alert", organizationId: "org_1", config: { threshold: 10 } },
      ]);

      mockPrisma.client.productVariant.findMany.mockResolvedValue([
        {
          id: "var_20",
          productId: "prod_1",
          name: "500g",
          product: { id: "prod_1", name: "Butter" },
          variantStocks: [{ currentStock: 2 }],
          suppliers: [
            { isPreferred: false, supplier: { id: "sup_1", name: "Alpha Supplier" } },
            { isPreferred: true, supplier: { id: "sup_2", name: "Beta Preferred Supplier" } },
          ],
        },
      ]);

      mockPrisma.client.purchase.findFirst.mockResolvedValue({
        id: "po_99",
        purchaseNumber: "PO-1002",
      });

      await scheduler.handleLowStockCronCheck();

      expect(mockPrisma.client.purchase.findFirst).toHaveBeenCalledWith({
        where: {
          organizationId: "org_1",
          supplierId: "sup_2",
          status: { in: ["DRAFT", "PENDING_APPROVAL", "ORDERED"] },
        },
        orderBy: { createdAt: "desc" },
        select: { id: true, purchaseNumber: true },
      });

      expect(mockAutomationService.triggerWorkflow).toHaveBeenCalledWith("org_1", {
        key: "lowstock_alert",
        inputs: {
          variantId: "var_20",
          productId: "prod_1",
          productName: "Butter",
          variantName: "500g",
          currentStock: 2,
          threshold: 10,
          supplierId: "sup_2",
          supplierName: "Beta Preferred Supplier",
          existingPoId: "po_99",
          existingPoNumber: "PO-1002",
        },
      });
    });
  });

  describe("handleDailySalesReportCron", () => {
    it("should aggregate daily order metrics and trigger sales report workflow", async () => {
      mockPrisma.client.workflowEngineDefinition.findMany.mockResolvedValue([
        { id: "def_2", key: "daily_sales_report", organizationId: "org_1", config: { recipients: "boss@example.com" } },
      ]);

      mockPrisma.client.order.count.mockResolvedValue(15);
      mockPrisma.client.order.aggregate.mockResolvedValue({ _sum: { totalAmount: 4500 } });

      await scheduler.handleDailySalesReportCron();

      expect(mockAutomationService.triggerWorkflow).toHaveBeenCalledWith("org_1", {
        key: "daily_sales_report",
        inputs: {
          totalSales: 15,
          totalRevenue: 4500,
          currency: "USD",
          recipients: "boss@example.com",
        },
      });
    });
  });
});
