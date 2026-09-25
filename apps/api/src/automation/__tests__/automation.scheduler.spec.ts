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
      },
    };

    mockAutomationService = {
      triggerWorkflow: vi.fn().mockResolvedValue("exec_123"),
    };

    scheduler = new AutomationScheduler(mockPrisma as any, mockAutomationService as any);
  });

  describe("handleLowStockCronCheck", () => {
    it("should query active low stock definitions and trigger workflow for low stock variants", async () => {
      mockPrisma.client.workflowEngineDefinition.findMany.mockResolvedValue([
        { id: "def_1", key: "lowstock_alert", organizationId: "org_1", config: { threshold: 5 } },
      ]);

      mockPrisma.client.productVariant.findMany.mockResolvedValue([
        { id: "var_10", name: "Flour 1kg", stockQuantity: 2 },
      ]);

      await scheduler.handleLowStockCronCheck();

      expect(mockAutomationService.triggerWorkflow).toHaveBeenCalledWith("org_1", {
        key: "lowstock_alert",
        inputs: {
          productId: "var_10",
          productName: "Flour 1kg",
          currentStock: 2,
          threshold: 5,
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
