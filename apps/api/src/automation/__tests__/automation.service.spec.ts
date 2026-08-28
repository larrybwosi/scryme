import { describe, it, expect, beforeEach, vi } from "vitest";
import { AutomationService } from "../automation.service";

describe("AutomationService", () => {
  let service: AutomationService;
  let mockPrisma: any;
  let mockWebhookDispatcher: any;

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
        },
        workflowEngineJob: {
          create: vi.fn(),
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

    service = new AutomationService(mockPrisma as any, mockWebhookDispatcher as any);
  });

  it("should retrieve definitions and seed built-in definitions if missing", async () => {
    mockPrisma.client.workflowEngineDefinition.findUnique.mockResolvedValue(null);
    mockPrisma.client.workflowEngineDefinition.create.mockResolvedValue({
      id: "def_1",
      key: "lowstock_alert",
      organizationId: "org_1",
    });
    mockPrisma.client.workflowEngineDefinition.findMany.mockResolvedValue([
      { id: "def_1", key: "lowstock_alert", organizationId: "org_1" },
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

  it("should provision workflow definitions with organization custom configs", async () => {
    mockPrisma.client.workflowEngineDefinition.upsert.mockImplementation((args: any) =>
      Promise.resolve({
        id: "def_upserted",
        organizationId: args.create.organizationId,
        key: args.create.key,
        config: args.create.config,
      }),
    );

    const customConfigs = {
      lowstock_alert: { threshold: 5, notificationEmail: "custom@example.com" },
    };

    const results = await service.provisionDefinitions("org_1", customConfigs);

    expect(results.length).toBeGreaterThan(0);
    const lowStockDef = results.find((r) => r.key === "lowstock_alert");
    expect(lowStockDef?.config).toEqual({
      threshold: 5,
      notificationEmail: "custom@example.com",
    });
  });
});
