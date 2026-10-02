import { describe, it, expect, vi, beforeEach } from "vitest";
import { WorkflowHandlers } from "../workflow-handlers";

vi.mock("@repo/shared/services/email", () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true, id: "msg_123" }),
}));

describe("WorkflowHandlers", () => {
  let handlers: WorkflowHandlers;
  let mockPrisma: any;
  let mockWebhookDispatcher: any;

  beforeEach(() => {
    mockPrisma = {
      client: {
        scrymeConfiguration: {
          findUnique: vi.fn(),
        },
      },
    };

    mockWebhookDispatcher = {
      dispatchOutgoingWebhook: vi.fn(),
    };

    handlers = new WorkflowHandlers(mockPrisma as any, mockWebhookDispatcher as any);
  });

  describe("lowstock_alert", () => {
    it("should trigger low stock alert using product and variant name without product ID", async () => {
      mockPrisma.client.scrymeConfiguration.findUnique.mockResolvedValue({
        isActive: true,
        workspaceSlug: "scryme-corp",
        channelMappings: {
          stock_alerts: "inventory-alerts",
        },
      });

      const sendScrymeSpy = vi.spyOn((handlers as any).scrymeClient, "sendMessage").mockResolvedValue({} as any);

      const result = await handlers.executeHandler("lowstock_alert", {
        organizationId: "org_1",
        executionId: "exec_1",
        jobId: "job_1",
        definitionConfig: { threshold: 10, notificationEmail: "inventory@example.com" },
        payload: { productId: "prod_99", productName: "Widget X", variantName: "Large", currentStock: 3 },
      });

      expect(result.success).toBe(true);
      expect(result.alertTriggered).toBe(true);
      expect(result.scrymeNotificationSent).toBe(true);
      expect(result.emailSent).toBe(true);
      expect(result.details.productName).toBe("Widget X - Large");

      expect(sendScrymeSpy).toHaveBeenCalledWith(
        "scryme-corp",
        "inventory-alerts",
        expect.objectContaining({
          content: expect.stringContaining("Widget X - Large"),
        }),
      );

      const messageContent = sendScrymeSpy.mock.calls[0][2].content;
      expect(messageContent).not.toContain("prod_99");
      expect(messageContent).not.toContain("ID:");
    });

    it("should omit variant name if variantName is 'default' (case insensitive)", async () => {
      mockPrisma.client.scrymeConfiguration.findUnique.mockResolvedValue({
        isActive: true,
        workspaceSlug: "scryme-corp",
        channelMappings: {
          stock_alerts: "inventory-alerts",
        },
      });

      const sendScrymeSpy = vi.spyOn((handlers as any).scrymeClient, "sendMessage").mockResolvedValue({} as any);

      const result = await handlers.executeHandler("lowstock_alert", {
        organizationId: "org_1",
        executionId: "exec_1",
        jobId: "job_1",
        definitionConfig: { threshold: 10 },
        payload: { productId: "prod_100", productName: "Artisan Bread", variantName: "Default", currentStock: 2 },
      });

      expect(result.success).toBe(true);
      expect(result.details.productName).toBe("Artisan Bread");

      expect(sendScrymeSpy).toHaveBeenCalledWith(
        "scryme-corp",
        "inventory-alerts",
        expect.objectContaining({
          content: expect.stringContaining("Artisan Bread"),
        }),
      );

      const messageContent = sendScrymeSpy.mock.calls[0][2].content;
      expect(messageContent).not.toContain("Default");
      expect(messageContent).not.toContain("prod_100");
    });
  });

  describe("customer_onboarding", () => {
    it("should process onboarding, send welcome email and notify ScrymeChat channel", async () => {
      mockPrisma.client.scrymeConfiguration.findUnique.mockResolvedValue({
        isActive: true,
        workspaceSlug: "scryme-corp",
        channelMappings: {
          crm_alerts: "customer-onboarding",
        },
      });

      const sendScrymeSpy = vi.spyOn((handlers as any).scrymeClient, "sendMessage").mockResolvedValue({} as any);

      const result = await handlers.executeHandler("customer_onboarding", {
        organizationId: "org_1",
        executionId: "exec_2",
        jobId: "job_2",
        definitionConfig: { sendWelcomeEmail: true },
        payload: { customerId: "cust_123", name: "Alice Smith", email: "alice@example.com" },
      });

      expect(result.success).toBe(true);
      expect(result.welcomeEmailSent).toBe(true);
      expect(result.scrymeNotificationSent).toBe(true);

      expect(sendScrymeSpy).toHaveBeenCalledWith(
        "scryme-corp",
        "customer-onboarding",
        expect.objectContaining({ content: expect.stringContaining("Alice Smith") }),
      );
    });
  });

  describe("daily_sales_report", () => {
    it("should generate sales summary, email recipients and notify ScrymeChat", async () => {
      mockPrisma.client.scrymeConfiguration.findUnique.mockResolvedValue({
        isActive: true,
        workspaceSlug: "scryme-corp",
        channelMappings: {
          sales_alerts: "workflow-reports",
        },
      });

      const sendScrymeSpy = vi.spyOn((handlers as any).scrymeClient, "sendMessage").mockResolvedValue({} as any);

      const result = await handlers.executeHandler("daily_sales_report", {
        organizationId: "org_1",
        executionId: "exec_3",
        jobId: "job_3",
        definitionConfig: { recipients: "exec@example.com, manager@example.com" },
        payload: { totalSales: 42, totalRevenue: 15800, currency: "KES" },
      });

      expect(result.success).toBe(true);
      expect(result.scrymeNotificationSent).toBe(true);
      expect(result.emailSent).toBe(true);
      expect(result.details.recipients).toEqual(["exec@example.com", "manager@example.com"]);

      expect(sendScrymeSpy).toHaveBeenCalledWith(
        "scryme-corp",
        "workflow-reports",
        expect.objectContaining({ content: expect.stringContaining("42") }),
      );
    });
  });
});
