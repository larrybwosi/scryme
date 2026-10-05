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

    it("should include supplier and Add to PO action when open PO exists", async () => {
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
        executionId: "exec_10",
        jobId: "job_10",
        definitionConfig: { threshold: 10 },
        payload: {
          productId: "prod_1",
          variantId: "var_1",
          productName: "Chocolate Cake",
          variantName: "1KG",
          currentStock: 2,
          supplierId: "sup_1",
          supplierName: "Bakery Supplies Ltd",
          existingPoId: "po_100",
          existingPoNumber: "PO-2026-001",
        },
      });

      expect(result.success).toBe(true);
      expect(result.details.productName).toBe("Chocolate Cake - 1KG");
      expect(result.details.supplierName).toBe("Bakery Supplies Ltd");
      expect(result.details.existingPoNumber).toBe("PO-2026-001");

      const payloadSent = sendScrymeSpy.mock.calls[0][2];
      expect(payloadSent.content).toContain("Chocolate Cake - 1KG");
      expect(payloadSent.content).toContain("Bakery Supplies Ltd");

      const addPoAction = payloadSent.actions.find((a: any) => a.id === "add_po_po_100");
      expect(addPoAction).toBeDefined();
      expect(addPoAction.label).toContain("PO #PO-2026-001");
    });

    it("should include supplier and Create PO action when no open PO exists", async () => {
      mockPrisma.client.scrymeConfiguration.findUnique.mockResolvedValue({
        isActive: true,
        workspaceSlug: "scryme-corp",
      });

      const sendScrymeSpy = vi.spyOn((handlers as any).scrymeClient, "sendMessage").mockResolvedValue({} as any);

      const result = await handlers.executeHandler("lowstock_alert", {
        organizationId: "org_1",
        executionId: "exec_11",
        jobId: "job_11",
        definitionConfig: { threshold: 10 },
        payload: {
          productId: "prod_2",
          variantId: "var_2",
          productName: "Flour",
          variantName: "Default",
          currentStock: 1,
          supplierId: "sup_2",
          supplierName: "Global Grain Co",
        },
      });

      expect(result.success).toBe(true);
      expect(result.details.productName).toBe("Flour");
      expect(result.details.supplierName).toBe("Global Grain Co");

      const payloadSent = sendScrymeSpy.mock.calls[0][2];
      const createPoAction = payloadSent.actions.find((a: any) => a.id === "create_po_sup_2");
      expect(createPoAction).toBeDefined();
      expect(createPoAction.label).toContain("Global Grain Co");
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
  describe("preorder_notification", () => {
    it("should format preorder report, dispatch to preorder_alerts channel and send notification email", async () => {
      mockPrisma.client.scrymeConfiguration.findUnique.mockResolvedValue({
        isActive: true,
        workspaceSlug: "scryme-bakery",
        channelMappings: {
          preorder_alerts: "custom-preorders",
        },
      });

      const sendScrymeSpy = vi.spyOn((handlers as any).scrymeClient, "sendMessage").mockResolvedValue({} as any);

      const result = await handlers.executeHandler("preorder_notification", {
        organizationId: "org_1",
        executionId: "exec_4",
        jobId: "job_4",
        definitionConfig: { notificationEmail: "orders@bakery.com" },
        payload: {
          transactionId: "txn_1001",
          transactionNumber: "TRX-2026-00100",
          customerName: "John Doe",
          customerPhone: "+254711223344",
          customerEmail: "john@example.com",
          metadata: {
            dueDate: "2026-10-15",
            dueTime: "15:00",
            itemSpecs: "3-Tier Wedding Cake",
            inscription: "Happy Anniversary",
            customizationNotes: "Red Velvet with Cream Cheese frosting",
            depositAmount: 5000,
            remainingBalance: 5000,
          },
          finalTotal: 10000,
          totalPaid: 5000,
          currency: "KES",
        },
      });

      expect(result.success).toBe(true);
      expect(result.scrymeNotificationSent).toBe(true);
      expect(result.emailSent).toBe(true);
      expect(result.details.transactionNumber).toBe("TRX-2026-00100");
      expect(result.details.customerName).toBe("John Doe");

      expect(sendScrymeSpy).toHaveBeenCalledWith(
        "scryme-bakery",
        "custom-preorders",
        expect.objectContaining({
          content: expect.stringContaining("TRX-2026-00100"),
          actions: expect.arrayContaining([
            expect.objectContaining({ id: "view_txn_txn_1001" }),
          ]),
          customMessage: expect.objectContaining({
            context: expect.objectContaining({
              title: "Pre-Order Received: TRX-2026-00100",
            }),
          }),
        }),
      );
    });
  });
});
