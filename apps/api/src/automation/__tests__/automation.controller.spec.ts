import { describe, it, expect, beforeEach, vi } from "vitest";
import { AutomationController } from "../automation.controller";

describe("AutomationController", () => {
  let controller: AutomationController;
  let mockAutomationService: any;

  beforeEach(() => {
    mockAutomationService = {
      getDefinitions: vi.fn().mockResolvedValue([{ id: "def_1" }]),
      createDefinition: vi.fn().mockResolvedValue({ id: "def_1" }),
      triggerWorkflow: vi.fn().mockResolvedValue({ execution: { id: "exec_1" } }),
      getExecutions: vi.fn().mockResolvedValue([{ id: "exec_1" }]),
      getAuditLogs: vi.fn().mockResolvedValue([{ id: "audit_1" }]),
      getWebhooks: vi.fn().mockResolvedValue([{ id: "wh_1" }]),
      createWebhook: vi.fn().mockResolvedValue({ id: "wh_1" }),
      handleIncomingWebhook: vi.fn().mockResolvedValue({ execution: { id: "exec_2" } }),
    };

    controller = new AutomationController(mockAutomationService as any);
  });

  const ctx: any = { organizationId: "org_1" };

  it("should get definitions for an organization", async () => {
    const res = await controller.getDefinitions(ctx);
    expect(res).toEqual([{ id: "def_1" }]);
    expect(mockAutomationService.getDefinitions).toHaveBeenCalledWith("org_1");
  });

  it("should trigger a workflow execution", async () => {
    const res = await controller.triggerWorkflow(ctx, { key: "lowstock_alert" });
    expect(res).toEqual({ execution: { id: "exec_1" } });
    expect(mockAutomationService.triggerWorkflow).toHaveBeenCalledWith("org_1", { key: "lowstock_alert" });
  });

  it("should handle incoming webhook", async () => {
    const res = await controller.handleIncomingWebhook("org_1", "wh_1", {}, { event: "ping" });
    expect(res).toEqual({ execution: { id: "exec_2" } });
    expect(mockAutomationService.handleIncomingWebhook).toHaveBeenCalledWith("org_1", "wh_1", {}, { event: "ping" });
  });
});
