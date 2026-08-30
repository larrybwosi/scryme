import { describe, it, expect, beforeEach, vi } from "vitest";
import { AutomationController } from "../automation.controller";

describe("AutomationController", () => {
  let controller: AutomationController;
  let mockAutomationService: any;

  beforeEach(() => {
    mockAutomationService = {
      getAvailableWorkflows: vi.fn().mockResolvedValue([{ path: "f/dealio/customer_onboarding", name: "Customer Onboarding" }]),
      getDefinitions: vi.fn().mockResolvedValue([{ id: "def_1" }]),
      createDefinition: vi.fn().mockResolvedValue({ id: "def_1" }),
      provisionWorkflow: vi.fn().mockResolvedValue({ success: true, definitionId: "def_1" }),
      provisionDefinitions: vi.fn().mockResolvedValue([{ id: "def_1" }]),
      triggerWorkflow: vi.fn().mockResolvedValue({ success: true, execution: { id: "exec_1" } }),
      cancelJob: vi.fn().mockResolvedValue({ success: true }),
      getExecutionHistory: vi.fn().mockResolvedValue([{ id: "exec_1", jobId: "exec_1", status: "COMPLETED" }]),
      getLogs: vi.fn().mockResolvedValue({ success: true, data: "log line" }),
      getExecutions: vi.fn().mockResolvedValue([{ id: "exec_1" }]),
      getAuditLogs: vi.fn().mockResolvedValue([{ id: "audit_1" }]),
      getWebhooks: vi.fn().mockResolvedValue([{ id: "wh_1" }]),
      createWebhook: vi.fn().mockResolvedValue({ id: "wh_1" }),
      handleIncomingWebhook: vi.fn().mockResolvedValue({ execution: { id: "exec_2" } }),
    };

    controller = new AutomationController(mockAutomationService as any);
  });

  const ctx: any = { organizationId: "org_1" };

  it("should get available workflows for an organization", async () => {
    const res = await controller.getAvailableWorkflows(ctx);
    expect(res).toEqual([{ path: "f/dealio/customer_onboarding", name: "Customer Onboarding" }]);
    expect(mockAutomationService.getAvailableWorkflows).toHaveBeenCalledWith("org_1");
  });

  it("should get definitions for an organization", async () => {
    const res = await controller.getDefinitions(ctx);
    expect(res).toEqual([{ id: "def_1" }]);
    expect(mockAutomationService.getDefinitions).toHaveBeenCalledWith("org_1");
  });

  it("should provision a workflow", async () => {
    const res = await controller.provisionWorkflow(ctx, { path: "f/dealio/customer_onboarding", settings: { sendWelcomeEmail: true } });
    expect(res).toEqual({ success: true, definitionId: "def_1" });
    expect(mockAutomationService.provisionWorkflow).toHaveBeenCalledWith("org_1", "f/dealio/customer_onboarding", { sendWelcomeEmail: true });
  });

  it("should trigger a workflow execution", async () => {
    const res = await controller.triggerWorkflow(ctx, { key: "lowstock_alert" });
    expect(res).toEqual({ success: true, execution: { id: "exec_1" } });
    expect(mockAutomationService.triggerWorkflow).toHaveBeenCalledWith("org_1", { key: "lowstock_alert" });
  });

  it("should cancel a workflow job", async () => {
    const res = await controller.cancelJob(ctx, { jobId: "job_100" });
    expect(res).toEqual({ success: true });
    expect(mockAutomationService.cancelJob).toHaveBeenCalledWith("org_1", "job_100");
  });

  it("should fetch execution history and logs", async () => {
    const history = await controller.getExecutionHistory(ctx, "f/dealio/customer_onboarding");
    expect(history).toEqual([{ id: "exec_1", jobId: "exec_1", status: "COMPLETED" }]);

    const logs = await controller.getLogs(ctx, "job_100");
    expect(logs).toEqual({ success: true, data: "log line" });
  });

  it("should handle incoming webhook", async () => {
    const res = await controller.handleIncomingWebhook("org_1", "wh_1", {}, { event: "ping" });
    expect(res).toEqual({ execution: { id: "exec_2" } });
    expect(mockAutomationService.handleIncomingWebhook).toHaveBeenCalledWith("org_1", "wh_1", {}, { event: "ping" });
  });
});
