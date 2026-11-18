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
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
        workflowEngineJob: {
          create: vi.fn(),
          findFirst: vi.fn().mockResolvedValue(null),
          findMany: vi.fn().mockResolvedValue([]),
          update: vi.fn(),
          updateMany: vi.fn(),
        },
        workflowEngineAuditLog: {
          create: vi.fn(),
          findFirst: vi.fn().mockResolvedValue(null),
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
    expect(available).toHaveLength(service.builtInTemplates.length);
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
      status: "RUNNING",
    });

    const res = await service.cancelJob("org_1", "exec_100");
    expect(res.success).toBe(true);
    expect(res.executionId).toBe("exec_100");
    expect(mockPrisma.client.workflowEngineExecution.update).toHaveBeenCalledWith({
      where: { id: "exec_100" },
      data: expect.objectContaining({ status: "CANCELLED" }),
    });
    expect(mockPrisma.client.workflowEngineJob.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ executionId: "exec_100" }),
        data: expect.objectContaining({ status: "CANCELLED" }),
      }),
    );
  });

  it("should resolve a job id to its execution before cancelling", async () => {
    mockPrisma.client.workflowEngineJob.findFirst.mockResolvedValue({
      id: "job_100",
      executionId: "exec_100",
      organizationId: "org_1",
    });
    mockPrisma.client.workflowEngineExecution.findFirst.mockResolvedValue({
      id: "exec_100",
      organizationId: "org_1",
      status: "RUNNING",
    });

    const res = await service.cancelJob("org_1", "job_100");

    expect(res.executionId).toBe("exec_100");
    expect(res.jobId).toBe("job_100");
    expect(mockPrisma.client.workflowEngineExecution.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "exec_100" } }),
    );
  });

  it("should read logs through the execution id that owns a job", async () => {
    mockPrisma.client.workflowEngineJob.findFirst.mockResolvedValue({
      id: "job_100",
      executionId: "exec_100",
      organizationId: "org_1",
    });
    mockPrisma.client.workflowEngineAuditLog.findMany.mockResolvedValue([
      {
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        level: "INFO",
        action: "JOB_STARTED",
        details: { attempt: 1 },
      },
    ]);

    const result = await service.getLogs("org_1", "job_100");

    expect(result.executionId).toBe("exec_100");
    expect(result.jobId).toBe("job_100");
    expect(result.data).toContain("JOB_STARTED");
    expect(mockPrisma.client.workflowEngineAuditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: "org_1", executionId: "exec_100" },
      }),
    );
  });

  it("should map execution history to the real job id", async () => {
    mockPrisma.client.workflowEngineExecution.findMany.mockResolvedValue([
      {
        id: "exec_100",
        status: "RUNNING",
        createdAt: new Date(),
        correlationId: "corr_1",
        triggerEvent: "f/dealio/customer_onboarding",
        jobs: [{ id: "job_100", status: "QUEUED", nextRunAt: new Date() }],
      },
    ]);

    const history = await service.getExecutionHistory("org_1");

    expect(history[0].id).toBe("exec_100");
    expect(history[0].jobId).toBe("job_100");
    expect(history[0].jobStatus).toBe("QUEUED");
  });

  it("should request a retry for a failed job and reset its attempt budget", async () => {
    mockPrisma.client.workflowEngineJob.findFirst.mockResolvedValue({
      id: "job_100",
      executionId: "exec_100",
      organizationId: "org_1",
      status: "FAILED",
      attempts: 5,
      lastError: "Permanent failure",
    });
    mockPrisma.client.workflowEngineJob.update.mockResolvedValue({
      id: "job_100",
      status: "QUEUED",
    });

    const result = await service.retryJob("org_1", "job_100");

    expect(result.success).toBe(true);
    expect(mockPrisma.client.workflowEngineJob.update).toHaveBeenCalledWith({
      where: { id: "job_100" },
      data: expect.objectContaining({
        status: "QUEUED",
        attempts: 0,
        lastError: null,
      }),
    });
    expect(mockPrisma.client.workflowEngineAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "JOB_REQUEUED" }),
      }),
    );
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

  it("should return the original execution when an incoming webhook is delivered twice with the same idempotency key", async () => {
    const mockWebhook = {
      id: "wh_1",
      organizationId: "org_1",
      direction: "INCOMING",
      isActive: true,
      secret: null,
      definitionId: "def_1",
    };
    const existingExecution = { id: "exec_existing", status: "RUNNING" };
    const existingJob = { id: "job_existing", status: "QUEUED" };

    mockPrisma.client.workflowEngineWebhook.findFirst.mockResolvedValue(mockWebhook);
    mockPrisma.client.workflowEngineDefinition.findUnique.mockResolvedValue({
      id: "def_1",
      key: "event_trigger",
      isActive: true,
    });
    mockPrisma.client.workflowEngineExecution.findFirst.mockResolvedValue(existingExecution);
    mockPrisma.client.workflowEngineJob.findFirst.mockResolvedValue(existingJob);

    const result = await service.handleIncomingWebhook(
      "org_1",
      "wh_1",
      { "x-idempotency-key": "delivery-42" },
      { event: "test" },
    );

    expect(result.duplicate).toBe(true);
    expect(result.execution.id).toBe("exec_existing");
    expect(mockPrisma.client.workflowEngineExecution.create).not.toHaveBeenCalled();
    expect(mockPrisma.client.workflowEngineJob.create).not.toHaveBeenCalled();
    expect(mockPrisma.client.workflowEngineAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "EXECUTION_DUPLICATE_IGNORED" }),
      }),
    );
  });

  it("should record an audit entry when replaying an execution", async () => {
    mockPrisma.client.workflowEngineExecution.findFirst.mockResolvedValue({
      id: "exec_old",
      triggerEvent: "f/dealio/customer_onboarding",
      payload: { source: "history" },
    });
    mockPrisma.client.workflowEngineDefinition.findUnique.mockResolvedValue({
      id: "def_1",
      key: "f/dealio/customer_onboarding",
      isActive: true,
    });
    mockPrisma.client.workflowEngineExecution.create.mockResolvedValue({ id: "exec_new" });
    mockPrisma.client.workflowEngineJob.create.mockResolvedValue({ id: "job_new" });

    const result = await service.replayExecution("org_1", { executionId: "exec_old" });

    expect(result.replayedFrom).toBe("exec_old");
    expect(result.execution.id).toBe("exec_new");
    expect(mockPrisma.client.workflowEngineAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "EXECUTION_REPLAYED",
          executionId: "exec_old",
          details: expect.objectContaining({ replayExecutionId: "exec_new" }),
        }),
      }),
    );
  });

  it("should list dead letter jobs with pagination bounds", async () => {
    mockPrisma.client.workflowEngineJob.findMany.mockResolvedValue([
      { id: "job_failed", status: "FAILED" },
    ]);

    const jobs = await service.getDeadLetterJobs("org_1", { limit: 25, offset: 10 });

    expect(jobs).toHaveLength(1);
    expect(mockPrisma.client.workflowEngineJob.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: "org_1", status: "FAILED" },
        take: 25,
        skip: 10,
      }),
    );
  });

  it("should remove expired stock and create adjustment, zero batch, and record movement", async () => {
    const mockBatch = {
      id: "batch_100",
      batchNumber: "BATCH-EXP-001",
      variantId: "var_100",
      locationId: "loc_100",
      currentQuantity: 20,
      variant: { name: "Whole Milk", product: { name: "Dairy" } },
      location: { name: "Cold Room" },
    };

    mockPrisma.client.stockBatch = {
      findFirst: vi.fn().mockResolvedValue(mockBatch),
      update: vi.fn().mockResolvedValue({ id: "batch_100", currentQuantity: 0 }),
    };
    mockPrisma.client.member = {
      findFirst: vi.fn().mockResolvedValue({ id: "mem_1" }),
    };

    const txMock = {
      stockAdjustment: {
        create: vi.fn().mockResolvedValue({ id: "adj_100" }),
      },
      stockBatch: {
        update: vi.fn().mockResolvedValue({ id: "batch_100", currentQuantity: 0 }),
      },
      productVariantStock: {
        findUnique: vi.fn().mockResolvedValue({ id: "pvs_100", currentStock: 50, availableStock: 50 }),
        update: vi.fn().mockResolvedValue({ id: "pvs_100" }),
      },
      stockMovement: {
        create: vi.fn().mockResolvedValue({ id: "mov_100" }),
      },
    };

    mockPrisma.client.$transaction = vi.fn().mockImplementation((cb) => cb(txMock));

    const result = await service.removeExpiredStock("org_1", {
      batchId: "batch_100",
      notes: "Testing expired stock clean-up",
    });

    expect(result.success).toBe(true);
    expect(result.batchId).toBe("batch_100");
    expect(result.removedQuantity).toBe(20);
    expect(txMock.stockAdjustment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: "org_1",
        variantId: "var_100",
        stockBatchId: "batch_100",
        locationId: "loc_100",
        quantity: 20,
        reason: "EXPIRED",
        status: "APPROVED",
      }),
    });
    expect(txMock.stockBatch.update).toHaveBeenCalledWith({
      where: { id: "batch_100" },
      data: { currentQuantity: 0 },
    });
    expect(txMock.productVariantStock.update).toHaveBeenCalledWith({
      where: { id: "pvs_100" },
      data: { currentStock: 30, availableStock: 30 },
    });
    expect(txMock.stockMovement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: "org_1",
        variantId: "var_100",
        stockBatchId: "batch_100",
        quantity: 20,
        movementType: "ADJUSTMENT_OUT",
      }),
    });
  });

});
