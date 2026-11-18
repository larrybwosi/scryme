import { describe, it, expect, beforeEach, vi } from "vitest";
import { AutomationWorkerService } from "../automation-worker.service";
import { WorkflowHandlers } from "../handlers/workflow-handlers";

// Mock the ScrymeChatApiClient
const mockSendMessage = vi.fn().mockResolvedValue({ success: true });
vi.mock("@repo/chat", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@repo/chat")>();
  return {
    ...actual,
    ScrymeChatApiClient: class {
      sendMessage = mockSendMessage;
    },
  };
});

describe("AutomationWorkerService", () => {
  let workerService: AutomationWorkerService;
  let mockPrisma: any;
  let mockWorkflowHandlers: any;
  let mockDagRunner: any;

  const baseJob = {
    id: "job_100",
    organizationId: "org_1",
    executionId: "exec_100",
    definitionId: "def_100",
    handler: "lowstock_alert",
    payload: { productId: "prod_1", currentStock: 2 },
    attempts: 0,
    maxAttempts: 5,
    backoffMs: 1000,
    status: "QUEUED",
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      client: {
        workflowEngineJob: {
          findMany: vi.fn().mockResolvedValue([]),
          findFirst: vi.fn().mockResolvedValue(null),
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          update: vi.fn(),
          count: vi.fn().mockResolvedValue(0),
        },
        workflowEngineDefinition: {
          findUnique: vi.fn(),
        },
        workflowEngineExecution: {
          findUnique: vi.fn().mockResolvedValue({ status: "RUNNING" }),
          update: vi.fn(),
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
        workflowEngineAuditLog: {
          create: vi.fn().mockResolvedValue({ id: "audit_1" }),
          findFirst: vi.fn().mockResolvedValue(null),
        },
        scrymeConfiguration: {
          findUnique: vi.fn(),
        },
      },
    };

    mockWorkflowHandlers = {
      executeHandler: vi.fn(),
    };

    mockDagRunner = {
      executeDag: vi.fn(),
    };

    workerService = new AutomationWorkerService(
      mockPrisma as any,
      mockWorkflowHandlers as any,
    );
  });

  function queueJobs(...jobs: any[]) {
    mockPrisma.client.workflowEngineJob.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(jobs);
  }

  it("should claim queued jobs using optimistic concurrency and process them successfully", async () => {
    queueJobs(baseJob);
    mockPrisma.client.workflowEngineDefinition.findUnique.mockResolvedValue({
      id: "def_100",
      config: { threshold: 10 },
    });
    mockWorkflowHandlers.executeHandler.mockResolvedValue({ alertTriggered: true });

    await workerService.pollAndProcessJobs();

    expect(mockPrisma.client.workflowEngineJob.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "job_100" }),
        data: expect.objectContaining({ status: "PROCESSING" }),
      }),
    );

    expect(mockWorkflowHandlers.executeHandler).toHaveBeenCalledWith(
      "lowstock_alert",
      expect.objectContaining({
        organizationId: "org_1",
        executionId: "exec_100",
        jobId: "job_100",
      }),
    );

    expect(mockPrisma.client.workflowEngineJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "job_100" },
        data: expect.objectContaining({ status: "COMPLETED" }),
      }),
    );

    expect(mockPrisma.client.workflowEngineExecution.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "exec_100" }),
        data: expect.objectContaining({ status: "COMPLETED" }),
      }),
    );
  });

  it("should handle job failure with exponential backoff retry when attempts remain", async () => {
    const job = {
      ...baseJob,
      id: "job_200",
      executionId: "exec_200",
      definitionId: "def_200",
      handler: "outgoing_webhook",
      payload: { endpointUrl: "https://example.com/webhook" },
      maxAttempts: 3,
    };

    queueJobs(job);
    mockPrisma.client.workflowEngineDefinition.findUnique.mockResolvedValue({ id: "def_200", config: {} });
    mockWorkflowHandlers.executeHandler.mockRejectedValue(new Error("Network connection timeout"));

    await workerService.pollAndProcessJobs();

    expect(mockPrisma.client.workflowEngineJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "job_200" },
        data: expect.objectContaining({
          status: "RETRYING",
          lastError: "Network connection timeout",
        }),
      }),
    );

    expect(mockPrisma.client.workflowEngineAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "JOB_RETRIED",
          level: "WARN",
        }),
      }),
    );
  });

  it("should move a job to the dead letter queue after the final failed attempt", async () => {
    const job = {
      ...baseJob,
      id: "job_300",
      executionId: "exec_300",
      attempts: 2,
      maxAttempts: 3,
    };

    queueJobs(job);
    mockPrisma.client.workflowEngineDefinition.findUnique.mockResolvedValue({ id: "def_100", config: {} });
    mockWorkflowHandlers.executeHandler.mockRejectedValue(new Error("Permanent failure"));

    await workerService.pollAndProcessJobs();

    expect(mockPrisma.client.workflowEngineJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "job_300" },
        data: expect.objectContaining({
          status: "FAILED",
          lastError: "Permanent failure",
        }),
      }),
    );
    expect(mockPrisma.client.workflowEngineExecution.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "exec_300" }),
        data: expect.objectContaining({ status: "FAILED" }),
      }),
    );
    expect(mockPrisma.client.workflowEngineAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "JOB_DEAD_LETTERED" }),
      }),
    );
  });

  it("should requeue paused DAG jobs without consuming an attempt", async () => {
    const job = {
      ...baseJob,
      definitionId: "def_pause",
      attempts: 0,
    };

    queueJobs(job);
    mockPrisma.client.workflowEngineDefinition.findUnique.mockResolvedValue({
      id: "def_pause",
      config: { studio: { nodes: [{ id: "n1", data: { kind: "trigger" } }] } },
    });
    mockDagRunner.executeDag.mockResolvedValue({
      success: true,
      paused: true,
      resumeAt: new Date(Date.now() + 60_000).toISOString(),
      steps: [],
    });

    const pausingWorker = new AutomationWorkerService(
      mockPrisma as any,
      mockWorkflowHandlers as any,
      mockDagRunner as any,
    );
    await pausingWorker.pollAndProcessJobs();

    expect(mockDagRunner.executeDag).toHaveBeenCalledWith(
      expect.objectContaining({
        executionId: "exec_100",
        jobId: "job_100",
        isSimulation: false,
      }),
    );
    expect(mockPrisma.client.workflowEngineJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "job_100" },
        data: expect.objectContaining({
          status: "RETRYING",
          attempts: 0,
          lastError: null,
        }),
      }),
    );
    expect(mockPrisma.client.workflowEngineExecution.updateMany).not.toHaveBeenCalled();
    expect(mockWorkflowHandlers.executeHandler).not.toHaveBeenCalled();
  });

  it("should cancel the job and execution when the DAG reports cancellation", async () => {
    const job = { ...baseJob, id: "job_cancel" };

    queueJobs(job);
    mockPrisma.client.workflowEngineDefinition.findUnique.mockResolvedValue({
      id: "def_100",
      config: { studio: { nodes: [{ id: "n1", data: { kind: "trigger" } }] } },
    });
    mockDagRunner.executeDag.mockResolvedValue({
      success: false,
      cancelled: true,
      error: "Execution cancelled by an operator.",
      steps: [],
    });

    const cancellingWorker = new AutomationWorkerService(
      mockPrisma as any,
      mockWorkflowHandlers as any,
      mockDagRunner as any,
    );
    await cancellingWorker.pollAndProcessJobs();

    expect(mockPrisma.client.workflowEngineJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "job_cancel" },
        data: expect.objectContaining({ status: "CANCELLED" }),
      }),
    );
    expect(mockPrisma.client.workflowEngineExecution.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "exec_100" },
        data: expect.objectContaining({ status: "CANCELLED" }),
      }),
    );
  });

  it("should not start a job whose execution was already cancelled", async () => {
    queueJobs(baseJob);
    mockPrisma.client.workflowEngineExecution.findUnique.mockResolvedValue({ status: "CANCELLED" });

    await workerService.pollAndProcessJobs();

    expect(mockPrisma.client.workflowEngineJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "job_100" },
        data: expect.objectContaining({ status: "CANCELLED" }),
      }),
    );
    expect(mockWorkflowHandlers.executeHandler).not.toHaveBeenCalled();
  });

  it("should recover stale processing locks and requeue those jobs", async () => {
    const staleJob = {
      ...baseJob,
      id: "job_stale",
      status: "PROCESSING",
      lockedBy: "dead_worker",
      lockedAt: new Date(Date.now() - 10 * 60 * 1000),
    };

    mockPrisma.client.workflowEngineJob.findMany
      .mockResolvedValueOnce([staleJob])
      .mockResolvedValueOnce([]);

    await workerService.pollAndProcessJobs();

    expect(mockPrisma.client.workflowEngineJob.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { in: ["job_stale"] },
          status: "PROCESSING",
        }),
        data: expect.objectContaining({
          status: "QUEUED",
          lockedBy: null,
          lockedAt: null,
        }),
      }),
    );
    expect(mockPrisma.client.workflowEngineAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "JOB_LOCK_RECOVERED" }),
      }),
    );
  });

  it("should send real messages via ScrymeChatApiClient when organization is connected to Scryme in workflow handlers", async () => {
    mockPrisma.client.scrymeConfiguration.findUnique.mockResolvedValue({
      organizationId: "org_scryme",
      workspaceSlug: "scryme-org-workspace",
      channelMappings: {
        stock_alerts: "inventory-alerts",
      },
      isActive: true,
    });

    const handlers = new WorkflowHandlers(mockPrisma as any, { dispatchOutgoingWebhook: vi.fn() } as any);

    const result = await handlers.executeHandler("lowstock_alert", {
      organizationId: "org_scryme",
      executionId: "exec_scryme_1",
      jobId: "job_scryme_1",
      definitionConfig: { threshold: 10 },
      payload: { productId: "item-123", currentStock: 2 },
    });

    expect(result.alertTriggered).toBe(true);
    expect(result.scrymeNotificationSent).toBe(true);
    expect(mockSendMessage).toHaveBeenCalledWith(
      "scryme-org-workspace",
      "inventory-alerts",
      expect.objectContaining({
        content: expect.stringContaining("Low Stock Alert Report"),
      }),
    );
  });
});
