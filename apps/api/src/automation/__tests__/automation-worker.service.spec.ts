import { describe, it, expect, beforeEach, vi } from "vitest";
import { AutomationWorkerService } from "../automation-worker.service";
import { WorkflowHandlers } from "../handlers/workflow-handlers";

// Mock the ScrymeChatApiClient
const mockSendMessage = vi.fn().mockResolvedValue({ success: true });
vi.mock("@repo/chat", () => {
  return {
    ScrymeChatApiClient: class {
      sendMessage = mockSendMessage;
    },
  };
});

describe("AutomationWorkerService", () => {
  let workerService: AutomationWorkerService;
  let mockPrisma: any;
  let mockWorkflowHandlers: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      client: {
        workflowEngineJob: {
          findMany: vi.fn().mockResolvedValue([]),
          updateMany: vi.fn(),
          update: vi.fn(),
          count: vi.fn().mockResolvedValue(0),
        },
        workflowEngineDefinition: {
          findUnique: vi.fn(),
        },
        workflowEngineExecution: {
          update: vi.fn(),
        },
        workflowEngineAuditLog: {
          create: vi.fn().mockResolvedValue({ id: "audit_1" }),
        },
        scrymeConfiguration: {
          findUnique: vi.fn(),
        },
      },
    };

    mockWorkflowHandlers = {
      executeHandler: vi.fn(),
    };

    workerService = new AutomationWorkerService(
      mockPrisma as any,
      mockWorkflowHandlers as any,
    );
  });

  it("should claim queued jobs using optimistic concurrency and process them successfully", async () => {
    const mockJob = {
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

    mockPrisma.client.workflowEngineJob.findMany.mockResolvedValue([mockJob]);
    mockPrisma.client.workflowEngineJob.updateMany.mockResolvedValue({ count: 1 });
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

    expect(mockPrisma.client.workflowEngineExecution.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "exec_100" },
        data: expect.objectContaining({ status: "COMPLETED" }),
      }),
    );
  });

  it("should handle job failure with exponential backoff retry when attempts remain", async () => {
    const mockJob = {
      id: "job_200",
      organizationId: "org_1",
      executionId: "exec_200",
      definitionId: "def_200",
      handler: "outgoing_webhook",
      payload: { endpointUrl: "https://example.com/webhook" },
      attempts: 0,
      maxAttempts: 3,
      backoffMs: 1000,
      status: "QUEUED",
    };

    mockPrisma.client.workflowEngineJob.findMany.mockResolvedValue([mockJob]);
    mockPrisma.client.workflowEngineJob.updateMany.mockResolvedValue({ count: 1 });
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

  it("should send real messages via ScrymeChatApiClient when organization is connected to Scryme in workflow handlers", async () => {
    mockPrisma.client.scrymeConfiguration.findUnique.mockResolvedValue({
      organizationId: "org_scryme",
      workspaceSlug: "scryme-org-workspace",
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
