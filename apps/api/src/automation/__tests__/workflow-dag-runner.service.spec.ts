import { describe, it, expect, beforeEach, vi } from "vitest";
import { WorkflowDagRunnerService, DagDefinitionConfig } from "../workflow-dag-runner.service";

describe("WorkflowDagRunnerService", () => {
  let runner: WorkflowDagRunnerService;
  let mockPrisma: any;
  let mockWebhookDispatcher: any;

  beforeEach(() => {
    mockPrisma = {
      client: {
        scrymeConfiguration: {
          findUnique: vi.fn(),
        },
        workflowEngineAuditLog: {
          create: vi.fn().mockResolvedValue({ id: "audit_1" }),
        },
      },
    };

    mockWebhookDispatcher = {
      dispatchOutgoingWebhook: vi.fn().mockResolvedValue({ success: true, statusCode: 200 }),
    };

    runner = new WorkflowDagRunnerService(mockPrisma as any, mockWebhookDispatcher as any);
  });

  describe("evaluateConditions", () => {
    it("should return true when no condition rules are set", () => {
      expect(runner.evaluateConditions(undefined, {})).toBe(true);
      expect(runner.evaluateConditions({ rules: [] }, {})).toBe(true);
    });

    it("should evaluate equals and not_equals correctly", () => {
      const matchAll = {
        matchMode: "ALL" as const,
        rules: [
          { id: "1", field: "payload.status", operator: "equals" as const, value: "active" },
          { id: "2", field: "payload.tier", operator: "not_equals" as const, value: "free" },
        ],
      };

      expect(runner.evaluateConditions(matchAll, { payload: { status: "active", tier: "pro" } })).toBe(true);
      expect(runner.evaluateConditions(matchAll, { payload: { status: "inactive", tier: "pro" } })).toBe(false);
      expect(runner.evaluateConditions(matchAll, { payload: { status: "active", tier: "free" } })).toBe(false);
    });

    it("should evaluate greater_than and less_than correctly", () => {
      const matchConditions = {
        matchMode: "ALL" as const,
        rules: [
          { id: "1", field: "payload.amount", operator: "greater_than" as const, value: "100" },
        ],
      };

      expect(runner.evaluateConditions(matchConditions, { payload: { amount: 150 } })).toBe(true);
      expect(runner.evaluateConditions(matchConditions, { payload: { amount: 50 } })).toBe(false);
    });

    it("should evaluate matchMode ANY properly", () => {
      const matchAny = {
        matchMode: "ANY" as const,
        rules: [
          { id: "1", field: "payload.role", operator: "equals" as const, value: "admin" },
          { id: "2", field: "payload.role", operator: "equals" as const, value: "owner" },
        ],
      };

      expect(runner.evaluateConditions(matchAny, { payload: { role: "owner" } })).toBe(true);
      expect(runner.evaluateConditions(matchAny, { payload: { role: "user" } })).toBe(false);
    });
  });

  describe("interpolateString and resolvePath", () => {
    it("should interpolate context variables using mustache syntax", () => {
      const template = "Hello {{payload.user.name}}, order {{payload.orderId}} is confirmed!";
      const context = {
        payload: {
          user: { name: "Alice" },
          orderId: "ORD-999",
        },
      };

      const result = runner.interpolateString(template, context);
      expect(result).toBe("Hello Alice, order ORD-999 is confirmed!");
    });
  });

  describe("executeDag in simulation mode", () => {
    it("should execute sequential graph steps in simulation mode without side effects", async () => {
      const config: DagDefinitionConfig = {
        studio: {
          nodes: [
            {
              id: "node_trigger",
              data: {
                kind: "trigger",
                label: "Order Created Trigger",
              },
            },
            {
              id: "node_filter",
              data: {
                kind: "logic",
                label: "High Value Filter",
                conditions: {
                  matchMode: "ALL",
                  rules: [
                    { id: "r1", field: "payload.amount", operator: "greater_than", value: "500" },
                  ],
                },
              },
            },
            {
              id: "node_email",
              data: {
                kind: "action",
                label: "Send VIP Email",
                config: {
                  recipient: "{{payload.customerEmail}}",
                  subject: "VIP Order Notification",
                  body: "Thank you for spending {{payload.amount}}!",
                },
              },
            },
          ],
          edges: [
            { id: "e1", source: "node_trigger", target: "node_filter" },
            { id: "e2", source: "node_filter", target: "node_email" },
          ],
        },
      };

      // 1. Run simulation where condition passes (> 500)
      const passingSummary = await runner.executeDag({
        organizationId: "org_test",
        definitionConfig: config,
        payload: { customerEmail: "vip@example.com", amount: 1200 },
        isSimulation: true,
      });

      expect(passingSummary.success).toBe(true);
      expect(passingSummary.isSimulation).toBe(true);
      expect(passingSummary.executedSteps).toBe(3);
      expect(passingSummary.failedSteps).toBe(0);
      expect(mockWebhookDispatcher.dispatchOutgoingWebhook).not.toHaveBeenCalled();

      // 2. Run simulation where condition is skipped (amount <= 500)
      const skippingSummary = await runner.executeDag({
        organizationId: "org_test",
        definitionConfig: config,
        payload: { customerEmail: "regular@example.com", amount: 200 },
        isSimulation: true,
      });

      expect(skippingSummary.success).toBe(true);
      expect(skippingSummary.executedSteps).toBe(1); // Trigger ran
      expect(skippingSummary.skippedSteps).toBe(1); // Filter skipped
      const skippedStep = skippingSummary.steps.find((s) => s.nodeId === "node_filter");
      expect(skippedStep?.status).toBe("SKIPPED");
    });
  });

  describe("executeDag live execution", () => {
    it("should dispatch outgoing webhook node in live mode and record audit log", async () => {
      const config: DagDefinitionConfig = {
        studio: {
          nodes: [
            {
              id: "node_1",
              data: {
                kind: "trigger",
                label: "Event Trigger",
              },
            },
            {
              id: "node_2",
              data: {
                kind: "action",
                label: "HTTP Request",
                config: {
                  url: "https://api.external.com/webhook",
                  method: "POST",
                },
              },
            },
          ],
          edges: [
            { id: "e1", source: "node_1", target: "node_2" },
          ],
        },
      };

      const summary = await runner.executeDag({
        organizationId: "org_test",
        executionId: "exec_123",
        jobId: "job_456",
        definitionConfig: config,
        payload: { eventId: "evt_1" },
        isSimulation: false,
      });

      expect(summary.success).toBe(true);
      expect(mockWebhookDispatcher.dispatchOutgoingWebhook).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: "org_test",
          executionId: "exec_123",
          endpointUrl: "https://api.external.com/webhook",
        }),
      );

      expect(mockPrisma.client.workflowEngineAuditLog.create).toHaveBeenCalled();
    });
  });
});
