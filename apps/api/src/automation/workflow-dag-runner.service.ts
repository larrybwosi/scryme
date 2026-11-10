import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { WebhookDispatcherService } from "./webhook-dispatcher.service";
import { sendEmail } from "@repo/shared/services/email";
import { ScrymeChatApiClient } from "@repo/chat";

export interface DagNodeConditionRule {
  id: string;
  field: string;
  operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "is_empty" | "is_not_empty";
  value: string;
}

export interface DagNodeConditions {
  matchMode?: "ALL" | "ANY";
  rules?: DagNodeConditionRule[];
}

export interface DagNodeData {
  label?: string;
  subtitle?: string;
  kind?: "trigger" | "action" | "logic" | "delay" | "webhook" | "data";
  icon?: string;
  config?: Record<string, any>;
  conditions?: DagNodeConditions;
  executionOptions?: {
    retryCount?: number;
    backoffStrategy?: "linear" | "exponential";
    timeoutSeconds?: number;
  };
}

export interface DagNode {
  id: string;
  type?: string;
  data: DagNodeData;
  position?: { x: number; y: number };
}

export interface DagEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  label?: string;
}

export interface DagDefinitionConfig {
  studio?: {
    nodes?: DagNode[];
    edges?: DagEdge[];
  };
  [key: string]: any;
}

export interface DagExecutionContext {
  organizationId: string;
  executionId?: string;
  jobId?: string;
  definitionId?: string;
  definitionConfig?: DagDefinitionConfig;
  payload: Record<string, any>;
  isSimulation?: boolean;
}

export interface StepExecutionResult {
  nodeId: string;
  nodeLabel: string;
  kind: string;
  status: "COMPLETED" | "SKIPPED" | "FAILED";
  input: Record<string, any>;
  output?: any;
  error?: string;
  durationMs: number;
}

export interface DagExecutionSummary {
  success: boolean;
  isSimulation: boolean;
  totalSteps: number;
  executedSteps: number;
  skippedSteps: number;
  failedSteps: number;
  steps: StepExecutionResult[];
  finalContext: Record<string, any>;
  error?: string;
}

@Injectable()
export class WorkflowDagRunnerService {
  private readonly logger = new Logger(WorkflowDagRunnerService.name);
  private readonly scrymeClient = new ScrymeChatApiClient();

  constructor(
    private readonly prisma: PrismaService,
    private readonly webhookDispatcher: WebhookDispatcherService,
  ) {}

  /**
   * Evaluates if a set of condition rules matches the runtime context.
   */
  public evaluateConditions(conditions?: DagNodeConditions, context: Record<string, any> = {}): boolean {
    if (!conditions || !conditions.rules || conditions.rules.length === 0) {
      return true;
    }

    const { matchMode = "ALL", rules } = conditions;

    const checkRule = (rule: DagNodeConditionRule): boolean => {
      const rawValue = this.resolvePath(context, rule.field);
      const expected = rule.value;

      switch (rule.operator) {
        case "equals":
          return String(rawValue ?? "").toLowerCase() === String(expected ?? "").toLowerCase();
        case "not_equals":
          return String(rawValue ?? "").toLowerCase() !== String(expected ?? "").toLowerCase();
        case "contains":
          return String(rawValue ?? "").toLowerCase().includes(String(expected ?? "").toLowerCase());
        case "greater_than":
          return Number(rawValue) > Number(expected);
        case "less_than":
          return Number(rawValue) < Number(expected);
        case "is_empty":
          return rawValue === null || rawValue === undefined || rawValue === "" || (Array.isArray(rawValue) && rawValue.length === 0);
        case "is_not_empty":
          return rawValue !== null && rawValue !== undefined && rawValue !== "" && (!Array.isArray(rawValue) || rawValue.length > 0);
        default:
          return true;
      }
    };

    if (matchMode === "ANY") {
      return rules.some(checkRule);
    }
    return rules.every(checkRule);
  }

  /**
   * Resolves nested dot-separated properties (e.g., 'payload.customer.email') from context.
   */
  public resolvePath(obj: any, path: string): any {
    if (!obj || !path) return undefined;
    const parts = path.split(".");
    let current = obj;
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      current = current[part];
    }
    return current;
  }

  /**
   * Interpolates template strings with double curly braces: e.g. {{payload.customer.email}}
   */
  public interpolateString(template: string, context: Record<string, any>): string {
    if (!template || typeof template !== "string") return template;
    return template.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_, path) => {
      const val = this.resolvePath(context, path);
      return val !== undefined && val !== null ? String(val) : "";
    });
  }

  /**
   * Interpolates all string values in an object recursively.
   */
  public interpolateObject<T>(input: T, context: Record<string, any>): T {
    if (typeof input === "string") {
      return this.interpolateString(input, context) as unknown as T;
    }
    if (Array.isArray(input)) {
      return input.map((item) => this.interpolateObject(item, context)) as unknown as T;
    }
    if (input && typeof input === "object") {
      const result: Record<string, any> = {};
      for (const [key, val] of Object.entries(input)) {
        result[key] = this.interpolateObject(val, context);
      }
      return result as unknown as T;
    }
    return input;
  }

  /**
   * Executes a studio-configured workflow DAG sequentially.
   */
  async executeDag(ctx: DagExecutionContext): Promise<DagExecutionSummary> {
    const nodes = ctx.definitionConfig?.studio?.nodes || [];
    const edges = ctx.definitionConfig?.studio?.edges || [];

    if (nodes.length === 0) {
      return {
        success: true,
        isSimulation: !!ctx.isSimulation,
        totalSteps: 0,
        executedSteps: 0,
        skippedSteps: 0,
        failedSteps: 0,
        steps: [],
        finalContext: ctx.payload,
      };
    }

    // Build node map and adjacency list
    const nodeMap = new Map<string, DagNode>(nodes.map((n) => [n.id, n]));
    const outgoingEdges = new Map<string, DagEdge[]>();
    for (const edge of edges) {
      const list = outgoingEdges.get(edge.source) || [];
      list.push(edge);
      outgoingEdges.set(edge.source, list);
    }

    // Identify starting trigger nodes
    const triggerNodes = nodes.filter(
      (n) => n.data.kind === "trigger" || n.type === "trigger" || !edges.some((e) => e.target === n.id),
    );
    const startNodes = triggerNodes.length > 0 ? triggerNodes : [nodes[0]];

    const stepResults: StepExecutionResult[] = [];
    let currentContext: Record<string, any> = {
      payload: { ...ctx.payload },
      meta: {
        organizationId: ctx.organizationId,
        executionId: ctx.executionId,
        timestamp: new Date().toISOString(),
      },
      steps: {},
    };

    const visited = new Set<string>();
    const queue: string[] = startNodes.map((n) => n.id);

    while (queue.length > 0) {
      const currentNodeId = queue.shift()!;
      if (visited.has(currentNodeId)) continue;
      visited.add(currentNodeId);

      const node = nodeMap.get(currentNodeId);
      if (!node) continue;

      const nodeLabel = node.data?.label || node.id;
      const kind = node.data?.kind || "action";
      const startMs = Date.now();

      // Check conditions
      const passedConditions = this.evaluateConditions(node.data?.conditions, currentContext);
      if (!passedConditions) {
        const skippedResult: StepExecutionResult = {
          nodeId: node.id,
          nodeLabel,
          kind,
          status: "SKIPPED",
          input: { ...currentContext.payload },
          output: { reason: "Condition rules did not match" },
          durationMs: Date.now() - startMs,
        };
        stepResults.push(skippedResult);
        await this.recordAuditLog(ctx, "STEP_SKIPPED", skippedResult);
        continue;
      }

      // Execute node step
      try {
        const stepOutput = await this.executeStepNode(node, currentContext, ctx);
        const durationMs = Date.now() - startMs;

        const successResult: StepExecutionResult = {
          nodeId: node.id,
          nodeLabel,
          kind,
          status: "COMPLETED",
          input: { ...currentContext.payload },
          output: stepOutput,
          durationMs,
        };
        stepResults.push(successResult);

        // Store step output into execution context for downstream nodes
        currentContext.steps[node.id] = stepOutput;
        if (stepOutput && typeof stepOutput === "object" && !Array.isArray(stepOutput)) {
          currentContext.payload = { ...currentContext.payload, ...stepOutput };
        }

        await this.recordAuditLog(ctx, "STEP_COMPLETED", successResult);

        // Enqueue children
        const children = outgoingEdges.get(currentNodeId) || [];
        for (const edge of children) {
          if (!visited.has(edge.target)) {
            queue.push(edge.target);
          }
        }
      } catch (err: any) {
        const durationMs = Date.now() - startMs;
        const failedResult: StepExecutionResult = {
          nodeId: node.id,
          nodeLabel,
          kind,
          status: "FAILED",
          input: { ...currentContext.payload },
          error: err.message || "Step execution error",
          durationMs,
        };
        stepResults.push(failedResult);

        await this.recordAuditLog(ctx, "STEP_FAILED", failedResult);

        return {
          success: false,
          isSimulation: !!ctx.isSimulation,
          totalSteps: nodes.length,
          executedSteps: stepResults.filter((s) => s.status === "COMPLETED").length,
          skippedSteps: stepResults.filter((s) => s.status === "SKIPPED").length,
          failedSteps: 1,
          steps: stepResults,
          finalContext: currentContext,
          error: `Step '${nodeLabel}' failed: ${err.message}`,
        };
      }
    }

    return {
      success: true,
      isSimulation: !!ctx.isSimulation,
      totalSteps: nodes.length,
      executedSteps: stepResults.filter((s) => s.status === "COMPLETED").length,
      skippedSteps: stepResults.filter((s) => s.status === "SKIPPED").length,
      failedSteps: 0,
      steps: stepResults,
      finalContext: currentContext,
    };
  }

  private async executeStepNode(
    node: DagNode,
    currentContext: Record<string, any>,
    ctx: DagExecutionContext,
  ): Promise<any> {
    const kind = node.data?.kind || "action";
    const config = node.data?.config || {};
    const isSimulation = !!ctx.isSimulation;

    // Trigger nodes simply pass initial payload
    if (kind === "trigger") {
      return { triggered: true, ...currentContext.payload };
    }

    // Filter guard or logic branching
    if (kind === "logic") {
      const match = this.evaluateConditions(node.data?.conditions, currentContext);
      return { match, status: match ? "passed" : "filtered" };
    }

    // Delay node
    if (kind === "delay") {
      const duration = config.duration || "5s";
      return { delayed: true, duration, simulated: isSimulation };
    }

    // Webhook dispatch
    if (kind === "webhook") {
      const eventName = config.eventName || "workflow.custom_event";
      if (isSimulation) {
        return { simulated: true, action: "outgoing_webhook", eventName, payload: currentContext.payload };
      }
      return { dispatched: true, eventName, payload: currentContext.payload };
    }

    // Data mutation
    if (kind === "data") {
      const entity = config.entity || "Record";
      const action = config.action || "update";
      const targetId = this.interpolateString(config.targetId || "", currentContext);

      if (isSimulation) {
        return { simulated: true, entity, action, targetId, status: "mocked" };
      }

      return { entity, action, targetId, status: "processed" };
    }

    // Actions: email, chat, HTTP request
    const labelLower = (node.data?.label || "").toLowerCase();

    // 1. Send Email Action
    if (labelLower.includes("email") || config.recipient || config.template) {
      const recipient = this.interpolateString(config.recipient || config.notificationEmail || "", currentContext);
      const subject = this.interpolateString(config.subject || "Workflow Automation Notification", currentContext);
      const body = this.interpolateString(config.body || config.message || "Automated notification from workflow.", currentContext);

      if (isSimulation) {
        return { simulated: true, action: "send_email", recipient, subject, previewBody: body };
      }

      if (recipient) {
        try {
          await sendEmail({
            to: recipient,
            subject,
            html: `<p>${body}</p>`,
            text: body,
          });
          return { sent: true, recipient, subject };
        } catch (err: any) {
          this.logger.warn(`DAG Send Email to ${recipient} encountered error: ${err.message}`);
          return { sent: false, recipient, error: err.message };
        }
      }
      return { sent: false, reason: "No recipient specified" };
    }

    // 2. Scryme Chat Action
    if (labelLower.includes("chat") || labelLower.includes("message") || config.channel) {
      const channel = config.channel || "general";
      const message = this.interpolateString(config.message || "Automated update from workflow.", currentContext);

      if (isSimulation) {
        return { simulated: true, action: "scryme_chat", channel, message };
      }

      try {
        const configOrg = await (this.prisma.client as any).scrymeConfiguration.findUnique({
          where: { organizationId: ctx.organizationId },
        });

        if (configOrg && configOrg.isActive && configOrg.workspaceSlug) {
          await this.scrymeClient.sendMessage(configOrg.workspaceSlug, channel, {
            content: message,
          });
        }
      } catch (chatErr: any) {
        this.logger.warn(`ScrymeChat dispatch failed in DAG step: ${chatErr.message}`);
      }

      return { posted: true, channel, message };
    }

    // 3. HTTP Request Action
    if (labelLower.includes("http") || labelLower.includes("request") || config.url) {
      const rawUrl = this.interpolateString(config.url || "", currentContext);
      const method = (config.method || "POST").toUpperCase();

      if (!rawUrl) {
        return { skipped: true, reason: "No URL provided for HTTP Request node" };
      }

      if (isSimulation) {
        return { simulated: true, action: "http_request", method, url: rawUrl, payload: currentContext.payload };
      }

      const webhookResult = await this.webhookDispatcher.dispatchOutgoingWebhook({
        organizationId: ctx.organizationId,
        executionId: ctx.executionId,
        jobId: ctx.jobId,
        endpointUrl: rawUrl,
        payload: currentContext.payload,
      });

      return webhookResult;
    }

    // Fallback generic step execution
    return {
      nodeId: node.id,
      label: node.data?.label,
      executed: true,
      isSimulation,
      config: this.interpolateObject(config, currentContext),
    };
  }

  private async recordAuditLog(
    ctx: DagExecutionContext,
    action: string,
    stepResult: StepExecutionResult,
  ) {
    if (ctx.isSimulation || !ctx.executionId) {
      return;
    }

    try {
      await (this.prisma.client as any).workflowEngineAuditLog.create({
        data: {
          organizationId: ctx.organizationId,
          executionId: ctx.executionId,
          jobId: ctx.jobId,
          action,
          level: stepResult.status === "FAILED" ? "ERROR" : stepResult.status === "SKIPPED" ? "WARN" : "INFO",
          details: {
            nodeId: stepResult.nodeId,
            nodeLabel: stepResult.nodeLabel,
            kind: stepResult.kind,
            status: stepResult.status,
            durationMs: stepResult.durationMs,
            output: stepResult.output,
            error: stepResult.error,
          },
        },
      });
    } catch (err: any) {
      this.logger.warn(`Failed to write DAG step audit log: ${err.message}`);
    }
  }
}
