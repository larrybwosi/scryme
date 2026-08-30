import { describe, it, expect, beforeEach, vi } from "vitest";
import { AutomationService } from "../automation.service";

describe("AutomationService", () => {
  let service: AutomationService;
  let mockPrisma: any;
  let mockWebhookDispatcher: any;
  let mockStockReportService: any;

  beforeEach(() => {
    mockPrisma = {
      client: {
        workflowEngineDefinition: {
          findMany: vi.fn().mockResolvedValue([]),
          findUnique: vi.fn(),
          create: vi.fn(),
          upsert: vi.fn(),
        },
        workflowEngineExecution: {
          create: vi.fn(),
          findMany: vi.fn().mockResolvedValue([]),
          findFirst: vi.fn(),
          update: vi.fn(),
        },
        workflowEngineJob: {
          create: vi.fn(),
          updateMany: vi.fn(),
        },
        workflowEngineAuditLog: {
          create: vi.fn(),
          findMany: vi.fn().mockResolvedValue([]),
        },
        workflowEngineWebhook: {
          findFirst: vi.fn(),
          findMany: vi.fn().mockResolvedValue([]),
          create: vi.fn(),
        },
      },
    };

    mockWebhookDispatcher = {
      verifyIncomingSignature: vi.fn().mockReturnValue(true),
    };

    mockStockReportService = {
      generateAndSendReport: vi.fn().mockResolvedValue(true),
    };

    service = new AutomationService(mockPrisma as any, mockWebhookDispatcher as any, mockStockReportService as any);
  });

  it("should get available workflow templates with provision status", async () => {
    mockPrisma.client.workflowEngineDefinition.findMany.mockResolvedValue([
      { key: "f/dealio/customer_onboarding", config: { sendWelcomeEmail: true } },
    ]);

    const available = await service.getAvailableWorkflows("org_1");
    expect(available).toHaveLength(4);
    const onboarding = available.find((a) => a.key === "customer_onboarding");
    expect(onboarding?.isProvisioned).toBe(true);
    expect(onboarding?.settings).toEqual({ sendWelcomeEmail: true });
  });

  it("should provision workflow and call stock report service if applicable", async () => {
    mockPrisma.client.workflowEngineDefinition.upsert.mockResolvedValue({
      id: "def_stock",
      key: "f/dealio/stock_movement_report",
    });

    const result = await service.provisionWorkflow("org_1", "f/dealio/stock_movement_report", {
      recipients: ["user_1"],
      enabled: true,
    });

    expect(result.success).toBe(true);
    expect(result.definitionId).toBe("def_stock");
    expect(mockStockReportService.generateAndSendReport).toHaveBeenCalledWith("org_1", ["user_1"], 7);
  });

  it("should retrieve definitions and seed built-in definitions if missing", async () => {
    mockPrisma.client.workflowEngineDefinition.findUnique.mockResolvedValue(null);
    mockPrisma.client.workflowEngineDefinition.create.mockResolvedValue({
      id: "def_1",
      key: "f/dealio/customer_onboarding",
      organizationId: "org_1",
    });
    mockPrisma.client.workflowEngineDefinition.findMany.mockResolvedValue([
      { id: "def_1", key: "f/dealio/customer_onboarding", organizationId: "org_1" },
    ]);

    const result = await service.getDefinitions("org_1");

    expect(result).toHaveLength(1);
    expect(mockPrisma.client.workflowEngineDefinition.findMany).toHaveBeenCalledWith({
      where: { organizationId: "org_1" },
      orderBy: { createdAt: "desc" },
    });
  });

  it("should trigger workflow execution and create job & audit log", async () => {
    const mockDef = {
      id: "def_1",
      key: "lowstock_alert",
      organizationId: "org_1",
      isActive: true,
    };
    mockPrisma.client.workflowEngineDefinition.findUnique.mockResolvedValue(mockDef);
    mockPrisma.client.workflowEngineExecution.create.mockResolvedValue({
      id: "exec_1",
      status: "RUNNING",
    });
    mockPrisma.client.workflowEngineJob.create.mockResolvedValue({
      id: "job_1",
      status: "QUEUED",
    });

    const result = await service.triggerWorkflow("org_1", {
      key: "lowstock_alert",
      payload: { productId: "prod_123", currentStock: 3, threshold: 10 },
    });

    expect(result.execution.id).toBe("exec_1");
    expect(result.job.id).toBe("job_1");
    expect(mockPrisma.client.workflowEngineAuditLog.create).toHaveBeenCalled();
  });

  it("should cancel job instance", async () => {
    mockPrisma.client.workflowEngineExecution.findFirst.mockResolvedValue({
      id: "exec_100",
      organizationId: "org_1",
    });

    const res = await service.cancelJob("org_1", "exec_100");
    expect(res.success).toBe(true);
    expect(mockPrisma.client.workflowEngineExecution.update).toHaveBeenCalledWith({
      where: { id: "exec_100" },
      data: { status: "CANCELLED" },
    });
  });

  it("should process incoming webhooks", async () => {
    const mockWebhook = {
      id: "wh_1",
      organizationId: "org_1",
      direction: "INCOMING",
      isActive: true,
      secret: "test_secret",
      definitionId: "def_1",
    };
    mockPrisma.client.workflowEngineWebhook.findFirst.mockResolvedValue(mockWebhook);
    mockPrisma.client.workflowEngineDefinition.findUnique.mockResolvedValue({
      id: "def_1",
      key: "event_trigger",
      isActive: true,
    });
    mockPrisma.client.workflowEngineExecution.create.mockResolvedValue({ id: "exec_2" });
    mockPrisma.client.workflowEngineJob.create.mockResolvedValue({ id: "job_2" });

    const result = await service.handleIncomingWebhook("org_1", "wh_1", { "x-workflow-signature": "sha256=123" }, { event: "test" });

    expect(result.execution.id).toBe("exec_2");
    expect(mockWebhookDispatcher.verifyIncomingSignature).toHaveBeenCalled();
  });
});
