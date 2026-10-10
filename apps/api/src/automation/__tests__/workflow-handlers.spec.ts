import { describe, it, expect, beforeEach, vi } from "vitest";
import { WorkflowHandlers } from "../handlers/workflow-handlers";

describe("WorkflowHandlers - Expiry Cleanup", () => {
  let handlers: WorkflowHandlers;
  let mockPrisma: any;
  let mockWebhookDispatcher: any;
  let mockFirebaseMessaging: any;

  beforeEach(() => {
    mockPrisma = {
      client: {
        scrymeConfiguration: {
          findUnique: vi.fn(),
        },
      },
    };

    mockWebhookDispatcher = {};
    mockFirebaseMessaging = {
      sendToOrganization: vi.fn().mockResolvedValue(true),
    };

    handlers = new WorkflowHandlers(
      mockPrisma as any,
      mockWebhookDispatcher as any,
      mockFirebaseMessaging as any,
    );

    (handlers as any).scrymeClient = {
      sendMessage: vi.fn().mockResolvedValue({ id: "msg_1" }),
    };
  });

  it("should handle near-expiry batch and dispatch warning report", async () => {
    mockPrisma.client.scrymeConfiguration.findUnique.mockResolvedValue({
      isActive: true,
      workspaceSlug: "ws-test",
      channelMappings: { expiry_alerts: "expiry-alerts" },
    });

    const ctx = {
      organizationId: "org_1",
      executionId: "exec_1",
      jobId: "job_1",
      definitionConfig: {},
      payload: {
        batchId: "b_1",
        batchNumber: "BATCH-101",
        productName: "Yogurt",
        variantName: "Default",
        currentQuantity: 50,
        expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        isExpired: false,
        daysUntilExpiry: 5,
        locationName: "Store Fridge",
      },
    };

    const result = await handlers.executeHandler("f/dealio/expiry_cleanup", ctx);

    expect(result.success).toBe(true);
    expect(result.isExpired).toBe(false);
    expect(result.scrymeNotificationSent).toBe(true);
    expect((handlers as any).scrymeClient.sendMessage).toHaveBeenCalledWith(
      "ws-test",
      "expiry-alerts",
      expect.objectContaining({
        content: expect.stringContaining("Upcoming Stock Expiration Warning"),
      }),
    );
  });

  it("should handle expired batch and dispatch critical report with HITL action button", async () => {
    mockPrisma.client.scrymeConfiguration.findUnique.mockResolvedValue({
      isActive: true,
      workspaceSlug: "ws-test",
      channelMappings: { expiry_alerts: "expiry-alerts" },
    });

    const ctx = {
      organizationId: "org_1",
      executionId: "exec_2",
      jobId: "job_2",
      definitionConfig: {},
      payload: {
        batchId: "b_2",
        batchNumber: "BATCH-202",
        productName: "Cream",
        variantName: "Default",
        currentQuantity: 30,
        expiryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        isExpired: true,
        daysUntilExpiry: -2,
        locationName: "Storage A",
      },
    };

    const result = await handlers.executeHandler("expiry_cleanup", ctx);

    expect(result.success).toBe(true);
    expect(result.isExpired).toBe(true);
    expect(result.scrymeNotificationSent).toBe(true);
    expect((handlers as any).scrymeClient.sendMessage).toHaveBeenCalledWith(
      "ws-test",
      "expiry-alerts",
      expect.objectContaining({
        content: expect.stringContaining("Expired Stock Clean-Up Required"),
        actions: expect.arrayContaining([
          expect.objectContaining({
            style: "danger",
            label: "⚡ Remove Expired Stock",
          }),
        ]),
      }),
    );
  });
});
