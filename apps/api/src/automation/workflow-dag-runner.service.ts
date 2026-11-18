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

export interface DagResumeState {
  queue: string[];
  visited: string[];
  context: Record<string, any>;
  stepResults: StepExecutionResult[];
}

export interface DagExecutionContext {
  organizationId: string;
  executionId?: string;
  jobId?: string;
  definitionId?: string;
  definitionConfig?: DagDefinitionConfig;
  payload: Record<string, any>;
  isSimulation?: boolean;
  resumeState?: DagResumeState;
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
  attempts?: number;
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
  cancelled?: boolean;
  paused?: boolean;
  resumeAt?: string;
  resumeState?: DagResumeState;
}

interface DataEntityDefinition {
  delegate: string;
  label: string;
}

const DATA_ENTITY_MAP: Record<string, DataEntityDefinition> = {
  customer: { delegate: "customer", label: "Customer" },
  transaction: { delegate: "transaction", label: "Transaction" },
  product: { delegate: "product", label: "Product" },
  productvariant: { delegate: "productVariant", label: "Product Variant" },
  task: { delegate: "task", label: "Task" },
  project: { delegate: "project", label: "Project" },
  purchase: { delegate: "purchase", label: "Purchase" },
  stockbatch: { delegate: "stockBatch", label: "Stock Batch" },
};

const EMAIL_ACTION_HINTS = ["email", "mail"];
const CHAT_ACTION_HINTS = ["chat", "message", "slack", "teams"];
const HTTP_ACTION_HINTS = ["http", "request", "api call", "webhook call"];

@Injectable()
export class WorkflowDagRunnerService {
  private readonly logger = new Logger(WorkflowDagRunnerService.name);
  private readonly scrymeClient = new ScrymeChatApiClient();

  private readonly maxSteps = this.readPositiveInt("WORKFLOW_MAX_STEPS", 500);
  private readonly maxDelayMs = this.readPositiveInt("WORKFLOW_MAX_DELAY_MS", 30 * 24 * 60 * 60 * 1000);
  private readonly maxNodeTimeoutMs = this.readPositiveInt("WORKFLOW_MAX_NODE_TIMEOUT_MS", 5 * 60 * 1000);

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
          return this.normalizeComparable(rawValue) === this.normalizeComparable(expected);
        case "not_equals":
          return this.normalizeComparable(rawValue) !== this.normalizeComparable(expected);
        case "contains":
          if (Array.isArray(rawValue)) {
            return rawValue.some(
              (item) => this.normalizeComparable(item) === this.normalizeComparable(expected),
            );
          }
          return this.normalizeComparable(rawValue).includes(this.normalizeComparable(expected));
        case "greater_than": {
          const actualNumber = this.toFiniteNumber(rawValue);
          const expectedNumber = this.toFiniteNumber(expected);
          return actualNumber !== null && expectedNumber !== null && actualNumber > expectedNumber;
        }
        case "less_than": {
          const actualNumber = this.toFiniteNumber(rawValue);
          const expectedNumber = this.toFiniteNumber(expected);
          return actualNumber !== null && expectedNumber !== null && actualNumber < expectedNumber;
        }
        case "is_empty":
          return (
            rawValue === null ||
            rawValue === undefined ||
            rawValue === "" ||
            (Array.isArray(rawValue) && rawValue.length === 0)
          );
        case "is_not_empty":
          return (
            rawValue !== null &&
            rawValue !== undefined &&
            rawValue !== "" &&
            (!Array.isArray(rawValue) || rawValue.length > 0)
          );
        default:
          return false;
      }
    };

    if (matchMode === "ANY") {
      return rules.some(checkRule);
    }
    return rules.every(checkRule);
  }

  /**
   * Resolves nested dot separated properties (e.g. 'payload.customer.email') from context.
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
   * Executes a studio configured workflow DAG sequentially.
   */
  async executeDag(ctx: DagExecutionContext): Promise<DagExecutionSummary> {
    const nodes = ctx.definitionConfig?.studio?.nodes || [];
    const edges = ctx.definitionConfig?.studio?.edges || [];

    if (nodes.length === 0) {
      return this.buildSummary(ctx, [], ctx.payload, {
        success: true,
        totalSteps: 0,
      });
    }

    const nodeMap = new Map<string, DagNode>(nodes.map((node) => [node.id, node]));
    const outgoingEdges = this.buildEdgeMap(edges);
    const priorCompleted = await this.loadCompletedSteps(ctx);

    let visited: Set<string>;
    let queue: string[];
    let currentContext: Record<string, any>;
    let stepResults: StepExecutionResult[];

    if (ctx.resumeState) {
      visited = new Set(ctx.resumeState.visited);
      queue = [...ctx.resumeState.queue];
      currentContext = ctx.resumeState.context;
      stepResults = [...ctx.resumeState.stepResults];
      await this.recordAuditLog(ctx, "DAG_RESUMED", {
        queueLength: queue.length,
        visitedCount: visited.size,
      }, "INFO");
    } else {
      visited = new Set<string>();
      queue = this.resolveStartNodes(nodes, edges).map((node) => node.id);
      currentContext = this.createInitialContext(ctx);
      stepResults = [];
    }

    let processedSteps = 0;

    while (queue.length > 0) {
      if (await this.refreshCancellation(ctx)) {
        return this.buildSummary(ctx, stepResults, currentContext, {
          success: false,
          totalSteps: nodes.length,
          error: "Execution cancelled by an operator.",
          cancelled: true,
        });
      }

      processedSteps += 1;
      if (processedSteps > this.maxSteps) {
        return this.buildSummary(ctx, stepResults, currentContext, {
          success: false,
          totalSteps: nodes.length,
          error: `Workflow exceeded the maximum of ${this.maxSteps} executed steps.`,
        });
      }

      const currentNodeId = queue.shift()!;
      if (visited.has(currentNodeId)) continue;
      visited.add(currentNodeId);

      const node = nodeMap.get(currentNodeId);
      if (!node) {
        this.logger.warn(`Workflow DAG references missing node '${currentNodeId}'.`);
        continue;
      }

      const nodeLabel = node.data?.label || node.id;
      const kind = node.data?.kind || "action";
      const logicType = kind === "logic" ? this.resolveLogicType(node) : undefined;
      const startMs = Date.now();

      const conditionsPassed =
        logicType === "branch" ? true : this.evaluateConditions(node.data?.conditions, currentContext);

      if (!conditionsPassed) {
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
        await this.recordAuditLog(ctx, "STEP_SKIPPED", this.serializeStepResult(skippedResult), "WARN");
        continue;
      }

      if (kind === "delay" && !ctx.isSimulation) {
        const delayMs = this.resolveDelayMs(node);
        if (delayMs > 0) {
          const resumeAt = new Date(Date.now() + delayMs);
          const delayedResult: StepExecutionResult = {
            nodeId: node.id,
            nodeLabel,
            kind,
            status: "COMPLETED",
            input: { ...currentContext.payload },
            output: {
              delayed: true,
              delayMs,
              resumeAt: resumeAt.toISOString(),
            },
            durationMs: Date.now() - startMs,
          };
          stepResults.push(delayedResult);
          currentContext.steps[node.id] = delayedResult.output;
          await this.recordAuditLog(ctx, "STEP_COMPLETED", this.serializeStepResult(delayedResult), "INFO");

          this.enqueueTargets(queue, outgoingEdges.get(node.id) || [], visited);

          const resumeState: DagResumeState = {
            queue: [...queue],
            visited: [...visited],
            context: currentContext,
            stepResults,
          };

          await this.recordAuditLog(ctx, "DAG_PAUSED", {
            nodeId: node.id,
            resumeAt: resumeAt.toISOString(),
            delayMs,
            resumeState,
          }, "INFO");

          return this.buildSummary(ctx, stepResults, currentContext, {
            success: true,
            totalSteps: nodes.length,
            paused: true,
            resumeAt: resumeAt.toISOString(),
            resumeState,
          });
        }
      }

      const previousOutput = priorCompleted.get(node.id);
      let stepOutput: any;

      try {
        if (!ctx.isSimulation && previousOutput !== undefined) {
          stepOutput = previousOutput;
        } else {
          stepOutput = await this.executeWithPolicy(node, currentContext, ctx);
        }
      } catch (err: any) {
        const durationMs = Date.now() - startMs;
        const failedResult: StepExecutionResult = {
          nodeId: node.id,
          nodeLabel,
          kind,
          status: "FAILED",
          input: { ...currentContext.payload },
          error: err?.message || "Step execution error",
          durationMs,
        };
        stepResults.push(failedResult);
        await this.recordAuditLog(ctx, "STEP_FAILED", this.serializeStepResult(failedResult), "ERROR");

        return this.buildSummary(ctx, stepResults, currentContext, {
          success: false,
          totalSteps: nodes.length,
          error: `Step '${nodeLabel}' failed: ${err?.message || "unknown error"}`,
        });
      }

      const successResult: StepExecutionResult = {
        nodeId: node.id,
        nodeLabel,
        kind,
        status: "COMPLETED",
        input: { ...currentContext.payload },
        output: stepOutput,
        durationMs: Date.now() - startMs,
      };

      if (!ctx.isSimulation && previousOutput !== undefined) {
        successResult.output = {
          ...(stepOutput && typeof stepOutput === "object" ? stepOutput : { value: stepOutput }),
          idempotentReplay: true,
        };
      }

      stepResults.push(successResult);

      currentContext.steps[node.id] = stepOutput;
      if (stepOutput && typeof stepOutput === "object" && !Array.isArray(stepOutput)) {
        currentContext.payload = { ...currentContext.payload, ...stepOutput };
      }

      await this.recordAuditLog(ctx, "STEP_COMPLETED", this.serializeStepResult(successResult), "INFO");
      this.enqueueTargets(queue, this.selectNextEdges(node, logicType, stepOutput, outgoingEdges.get(node.id) || []), visited);
    }

    return this.buildSummary(ctx, stepResults, currentContext, {
      success: true,
      totalSteps: nodes.length,
    });
  }

  private async executeWithPolicy(
    node: DagNode,
    currentContext: Record<string, any>,
    ctx: DagExecutionContext,
  ): Promise<any> {
    const retryCount = this.clamp(this.toFiniteNumber(node.data?.executionOptions?.retryCount) ?? 0, 0, 10);
    const timeoutSeconds = this.toFiniteNumber(node.data?.executionOptions?.timeoutSeconds) ?? 0;
    const timeoutMs = timeoutSeconds > 0
      ? Math.min(timeoutSeconds * 1000, this.maxNodeTimeoutMs)
      : 0;
    const backoffStrategy = node.data?.executionOptions?.backoffStrategy || "exponential";

    let lastError: any;

    for (let attempt = 0; attempt <= retryCount; attempt += 1) {
      try {
        return await this.withTimeout(
          () => this.executeStepNode(node, currentContext, ctx),
          timeoutMs,
          node.data?.label || node.id,
        );
      } catch (error: any) {
        lastError = error;
        if (attempt < retryCount) {
          const delayMs = this.backoffDelay(attempt, backoffStrategy);
          this.logger.warn(
            `Workflow node '${node.id}' failed on attempt ${attempt + 1}. Retrying in ${delayMs}ms: ${error?.message}`,
          );
          if (!ctx.isSimulation) {
            await this.sleep(delayMs);
          }
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }

  private async executeStepNode(
    node: DagNode,
    currentContext: Record<string, any>,
    ctx: DagExecutionContext,
  ): Promise<any> {
    const kind = node.data?.kind || "action";
    const config = node.data?.config || {};
    const isSimulation = !!ctx.isSimulation;

    if (kind === "trigger") {
      return { triggered: true, trigger: config.eventType || config.eventName || "manual" };
    }

    if (kind === "logic") {
      const match = this.evaluateConditions(node.data?.conditions, currentContext);
      return {
        match,
        branch: match ? "true" : "false",
        status: match ? "passed" : "filtered",
      };
    }

    if (kind === "delay") {
      return { delayed: true, duration: config.duration || config.until || "5s", simulated: isSimulation };
    }

    if (kind === "webhook") {
      return this.dispatchWebhookNode(node, currentContext, ctx);
    }

    if (kind === "data") {
      return this.applyDataMutation(node, currentContext, ctx);
    }

    const actionType = this.resolveActionType(node);

    if (actionType === "send_email") {
      const recipientValue = config.recipient ?? config.to ?? config.notificationEmail ?? config.email;
      const recipient = Array.isArray(recipientValue)
        ? recipientValue
            .map((item) => this.interpolateString(String(item), currentContext))
            .filter(Boolean)
        : this.interpolateString(String(recipientValue || ""), currentContext);
      const recipientList = Array.isArray(recipient)
        ? recipient
        : recipient
          ? [recipient]
          : [];
      const subject = this.interpolateString(
        config.subject || "Workflow Automation Notification",
        currentContext,
      );
      const body = this.interpolateString(
        config.body || config.message || "Automated notification from workflow.",
        currentContext,
      );

      if (recipientList.length === 0) {
        throw new Error("Send Email action requires at least one recipient.");
      }

      if (isSimulation) {
        return {
          simulated: true,
          action: "send_email",
          recipients: recipientList,
          subject,
          previewBody: body,
        };
      }

      const emailResult = await sendEmail({
        to: recipientList,
        subject,
        html: `<p>${body}</p>`,
        text: body,
      });

      if (emailResult && emailResult.success === false) {
        throw new Error(emailResult.error || "Email provider rejected the message.");
      }

      return { sent: true, recipients: recipientList, subject };
    }

    if (actionType === "scryme_chat") {
      const channel = this.interpolateString(String(config.channel || "general"), currentContext);
      const message = this.interpolateString(
        config.message || config.content || "Automated update from workflow.",
        currentContext,
      );

      if (isSimulation) {
        return { simulated: true, action: "scryme_chat", channel, message };
      }

      const configOrg = await (this.prisma.client as any).scrymeConfiguration.findUnique({
        where: { organizationId: ctx.organizationId },
      });

      if (!configOrg || !configOrg.isActive || !configOrg.workspaceSlug) {
        return {
          posted: false,
          reason: "Scryme Chat is not connected for this organization.",
          channel,
          message,
        };
      }

      await this.scrymeClient.sendMessage(configOrg.workspaceSlug, channel, {
        content: message,
      });

      return { posted: true, channel, message };
    }

    if (actionType === "http_request") {
      const rawUrl = this.interpolateString(config.url || config.endpointUrl || "", currentContext);
      const method = String(config.method || "POST").toUpperCase();

      if (!rawUrl) {
        throw new Error("HTTP Request action requires a URL.");
      }

      const configuredHeaders = this.interpolateObject(
        this.normalizeHeaders(config.headers),
        currentContext,
      );
      const configuredBody =
        config.body !== undefined
          ? this.interpolateObject(config.body, currentContext)
          : config.payload !== undefined
            ? this.interpolateObject(config.payload, currentContext)
            : currentContext.payload;

      if (isSimulation) {
        return {
          simulated: true,
          action: "http_request",
          method,
          url: rawUrl,
          headers: configuredHeaders,
          payload: configuredBody,
        };
      }

      return this.webhookDispatcher.dispatchOutgoingWebhook({
        organizationId: ctx.organizationId,
        executionId: ctx.executionId,
        jobId: ctx.jobId,
        endpointUrl: rawUrl,
        method,
        headers: configuredHeaders,
        payload: configuredBody,
        idempotencyKey: ctx.executionId ? `${ctx.executionId}:${node.id}` : undefined,
      });
    }

    return {
      nodeId: node.id,
      label: node.data?.label,
      executed: true,
      isSimulation,
      config: this.interpolateObject(config, currentContext),
    };
  }

  private async dispatchWebhookNode(
    node: DagNode,
    currentContext: Record<string, any>,
    ctx: DagExecutionContext,
  ): Promise<any> {
    const config = node.data?.config || {};
    const isSimulation = !!ctx.isSimulation;

    const webhookId = config.webhookId ? this.interpolateString(String(config.webhookId), currentContext) : undefined;
    const directUrl = config.url || config.endpointUrl;
    const eventName = this.interpolateString(
      String(config.eventName || config.event || "workflow.custom_event"),
      currentContext,
    );
    const payload =
      config.payload !== undefined
        ? this.interpolateObject(config.payload, currentContext)
        : currentContext.payload;

    let targets: Array<{
      id?: string;
      endpointUrl: string;
      secret?: string | null;
      headers?: Record<string, string>;
    }> = [];

    if (webhookId) {
      const webhook = await (this.prisma.client as any).workflowEngineWebhook.findFirst({
        where: {
          id: webhookId,
          organizationId: ctx.organizationId,
          direction: "OUTGOING",
          isActive: true,
        },
      });
      if (!webhook) {
        throw new Error(`Outgoing webhook '${webhookId}' was not found or is inactive.`);
      }
      targets = [{
        id: webhook.id,
        endpointUrl: webhook.endpointUrl,
        secret: webhook.secret,
        headers: this.normalizeHeaders(webhook.headers),
      }];
    } else if (directUrl) {
      targets = [{
        endpointUrl: this.interpolateString(String(directUrl), currentContext),
        secret: config.secret,
        headers: this.normalizeHeaders(config.headers),
      }];
    } else {
      const webhooks = await (this.prisma.client as any).workflowEngineWebhook.findMany({
        where: {
          organizationId: ctx.organizationId,
          direction: "OUTGOING",
          isActive: true,
        },
      });

      const matching = eventName
        ? webhooks.filter((webhook: any) =>
            String(webhook.name || "").toLowerCase() === eventName.toLowerCase() ||
            String(webhook.name || "").toLowerCase() === "workflow.completed",
          )
        : webhooks;

      targets = (matching.length > 0 ? matching : webhooks).map((webhook: any) => ({
        id: webhook.id,
        endpointUrl: webhook.endpointUrl,
        secret: webhook.secret,
        headers: this.normalizeHeaders(webhook.headers),
      }));
    }

    if (targets.length === 0) {
      throw new Error(`No active outgoing webhook is registered for event '${eventName}'.`);
    }

    if (isSimulation) {
      return {
        simulated: true,
        action: "outgoing_webhook",
        eventName,
        targets: targets.map((target) => ({ id: target.id, endpointUrl: target.endpointUrl })),
        payload,
      };
    }

    const results = [];
    for (const target of targets) {
      const result = await this.webhookDispatcher.dispatchOutgoingWebhook({
        organizationId: ctx.organizationId,
        executionId: ctx.executionId,
        jobId: ctx.jobId,
        webhookId: target.id,
        endpointUrl: target.endpointUrl,
        secret: target.secret || undefined,
        headers: target.headers,
        payload,
        method: config.method || "POST",
        idempotencyKey: ctx.executionId ? `${ctx.executionId}:${node.id}:${target.id || target.endpointUrl}` : undefined,
      });
      results.push({ webhookId: target.id, endpointUrl: target.endpointUrl, ...result });
    }

    return {
      dispatched: true,
      eventName,
      dispatchedCount: results.length,
      results,
    };
  }

  private async applyDataMutation(
    node: DagNode,
    currentContext: Record<string, any>,
    ctx: DagExecutionContext,
  ): Promise<any> {
    const config = node.data?.config || {};
    const entityKey = String(config.entity || config.model || "").replace(/[\s_-]/g, "").toLowerCase();
    const action = String(config.action || "update").toLowerCase();
    const entity = DATA_ENTITY_MAP[entityKey];
    const isSimulation = !!ctx.isSimulation;

    if (!entity) {
      throw new Error(
        `Data node entity '${config.entity || "unknown"}' is not supported. Supported entities: ${Object.values(DATA_ENTITY_MAP).map((item) => item.label).join(", ")}.`,
      );
    }

    if (action !== "update" && action !== "create") {
      throw new Error(`Data node action '${action}' is not supported. Use 'update' or 'create'.`);
    }

    const targetId = config.targetId
      ? this.interpolateString(String(config.targetId), currentContext)
      : undefined;
    const rawData = config.data ?? config.values ?? config.fields ?? {};
    const data = this.interpolateObject(rawData, currentContext) as Record<string, any>;

    delete data.id;
    delete data.organizationId;
    delete data.createdAt;

    if (Object.keys(data).length === 0) {
      throw new Error("Data node requires a non empty data object.");
    }

    if (action === "update" && !targetId) {
      throw new Error("Data node update action requires a targetId.");
    }

    if (isSimulation) {
      return {
        simulated: true,
        entity: entity.label,
        action,
        targetId: targetId || null,
        data,
        status: "mocked",
      };
    }

    const delegate = (this.prisma.client as any)[entity.delegate];
    if (!delegate) {
      throw new Error(`Database model '${entity.delegate}' is not available.`);
    }

    if (action === "update") {
      const result = await delegate.updateMany({
        where: {
          id: targetId,
          organizationId: ctx.organizationId,
        },
        data,
      });

      if (!result || result.count === 0) {
        throw new Error(`${entity.label} '${targetId}' was not found in this organization.`);
      }

      return {
        entity: entity.label,
        action,
        targetId,
        updated: result.count,
        status: "processed",
      };
    }

    const created = await delegate.create({
      data: {
        ...data,
        organizationId: ctx.organizationId,
      },
    });

    return {
      entity: entity.label,
      action,
      targetId: created?.id || null,
      created: true,
      status: "processed",
    };
  }

  private selectNextEdges(
    node: DagNode,
    logicType: "branch" | "filter" | undefined,
    stepOutput: any,
    edges: DagEdge[],
  ): DagEdge[] {
    if (edges.length === 0) return [];
    if (logicType !== "branch") return edges;

    const branch = stepOutput?.match === true ? "true" : "false";
    const hasExplicitHandles = edges.some((edge) => this.normalizeBranchHandle(edge.sourceHandle));

    if (!hasExplicitHandles) {
      return edges;
    }

    const selected = edges.filter((edge) => {
      const handle = this.normalizeBranchHandle(edge.sourceHandle);
      if (!handle) return true;
      return handle === branch;
    });

    return selected;
  }

  private normalizeBranchHandle(handle?: string | null): "true" | "false" | null {
    if (!handle) return null;
    const normalized = String(handle).trim().toLowerCase();
    if (["true", "yes", "match", "matched", "pass", "passed", "success", "approved"].includes(normalized)) {
      return "true";
    }
    if (["false", "no", "else", "unmatched", "fail", "failed", "reject", "rejected", "default"].includes(normalized)) {
      return "false";
    }
    return null;
  }

  private enqueueTargets(queue: string[], edges: DagEdge[], visited: Set<string>) {
    for (const edge of edges) {
      if (!visited.has(edge.target) && !queue.includes(edge.target)) {
        queue.push(edge.target);
      }
    }
  }

  private resolveLogicType(node: DagNode): "branch" | "filter" {
    const configured = String(node.data?.config?.logicType || "").toLowerCase();
    if (configured === "filter" || configured === "branch") {
      return configured;
    }

    const icon = String(node.data?.icon || "").toLowerCase();
    const label = String(node.data?.label || "").toLowerCase();
    if (icon.includes("filter") || label.includes("filter") || label.includes("guard")) {
      return "filter";
    }
    return "branch";
  }

  private resolveActionType(node: DagNode): "send_email" | "scryme_chat" | "http_request" | "generic" {
    const config = node.data?.config || {};
    const explicit = String(config.actionType || config.action || "").toLowerCase();
    if (["send_email", "email"].includes(explicit)) return "send_email";
    if (["scryme_chat", "chat", "message"].includes(explicit)) return "scryme_chat";
    if (["http_request", "http", "webhook", "request"].includes(explicit)) return "http_request";

    const label = String(node.data?.label || "").toLowerCase();
    if (config.url || config.endpointUrl || HTTP_ACTION_HINTS.some((hint) => label.includes(hint))) {
      return "http_request";
    }
    if (config.channel || CHAT_ACTION_HINTS.some((hint) => label.includes(hint))) {
      return "scryme_chat";
    }
    if (
      config.recipient ||
      config.to ||
      config.template ||
      EMAIL_ACTION_HINTS.some((hint) => label.includes(hint))
    ) {
      return "send_email";
    }
    return "generic";
  }

  private resolveDelayMs(node: DagNode): number {
    const config = node.data?.config || {};
    const pauseType = String(config.pauseType || "duration").toLowerCase();

    if (pauseType === "until" && config.until) {
      const until = Date.parse(String(config.until));
      if (Number.isNaN(until)) {
        throw new Error(`Delay node has an invalid 'until' timestamp: ${config.until}`);
      }
      return Math.max(0, until - Date.now());
    }

    const rawDuration = config.duration ?? config.delay ?? config.seconds ?? 0;
    const delayMs = this.parseDurationMs(rawDuration);

    if (delayMs === null) {
      throw new Error(`Delay node has an invalid duration: ${rawDuration}`);
    }
    if (delayMs > this.maxDelayMs) {
      throw new Error(
        `Delay node duration exceeds the maximum allowed of ${this.maxDelayMs}ms.`,
      );
    }

    return delayMs;
  }

  private parseDurationMs(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) {
      return Math.max(0, value);
    }
    if (typeof value !== "string" || value.trim() === "") {
      return null;
    }

    const normalized = value.trim().toLowerCase();
    if (/^\d+$/.test(normalized)) {
      return Number(normalized);
    }

    const match = normalized.match(/^(\d+(?:\.\d+)?)\s*(ms|s|m|h|d|w)$/);
    if (!match) return null;

    const amount = Number(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      ms: 1,
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
      w: 7 * 24 * 60 * 60 * 1000,
    };

    return Math.max(0, Math.round(amount * multipliers[unit]));
  }

  private resolveStartNodes(nodes: DagNode[], edges: DagEdge[]): DagNode[] {
    const triggerNodes = nodes.filter(
      (node) =>
        node.data?.kind === "trigger" ||
        node.type === "trigger" ||
        !edges.some((edge) => edge.target === node.id),
    );
    return triggerNodes.length > 0 ? triggerNodes : [nodes[0]];
  }

  private buildEdgeMap(edges: DagEdge[]): Map<string, DagEdge[]> {
    const outgoingEdges = new Map<string, DagEdge[]>();
    for (const edge of edges) {
      const list = outgoingEdges.get(edge.source) || [];
      list.push(edge);
      outgoingEdges.set(edge.source, list);
    }
    return outgoingEdges;
  }

  private createInitialContext(ctx: DagExecutionContext): Record<string, any> {
    return {
      payload: { ...ctx.payload },
      meta: {
        organizationId: ctx.organizationId,
        executionId: ctx.executionId,
        jobId: ctx.jobId,
        timestamp: new Date().toISOString(),
      },
      steps: {},
    };
  }

  private buildSummary(
    ctx: DagExecutionContext,
    stepResults: StepExecutionResult[],
    finalContext: Record<string, any>,
    overrides: {
      success: boolean;
      totalSteps: number;
      error?: string;
      cancelled?: boolean;
      paused?: boolean;
      resumeAt?: string;
      resumeState?: DagResumeState;
    },
  ): DagExecutionSummary {
    return {
      success: overrides.success,
      isSimulation: !!ctx.isSimulation,
      totalSteps: overrides.totalSteps,
      executedSteps: stepResults.filter((step) => step.status === "COMPLETED").length,
      skippedSteps: stepResults.filter((step) => step.status === "SKIPPED").length,
      failedSteps: stepResults.filter((step) => step.status === "FAILED").length,
      steps: stepResults,
      finalContext,
      error: overrides.error,
      cancelled: overrides.cancelled,
      paused: overrides.paused,
      resumeAt: overrides.resumeAt,
      resumeState: overrides.resumeState,
    };
  }

  private serializeStepResult(stepResult: StepExecutionResult): Record<string, any> {
    return {
      nodeId: stepResult.nodeId,
      nodeLabel: stepResult.nodeLabel,
      kind: stepResult.kind,
      status: stepResult.status,
      durationMs: stepResult.durationMs,
      output: stepResult.output,
      error: stepResult.error,
    };
  }

  private async loadCompletedSteps(ctx: DagExecutionContext): Promise<Map<string, any>> {
    const completed = new Map<string, any>();
    if (ctx.isSimulation || !ctx.executionId) return completed;

    const delegate = (this.prisma.client as any).workflowEngineAuditLog;
    if (!delegate || typeof delegate.findMany !== "function") return completed;

    try {
      const logs = await delegate.findMany({
        where: {
          executionId: ctx.executionId,
          action: "STEP_COMPLETED",
        },
        orderBy: { createdAt: "asc" },
        take: this.maxSteps,
      });

      for (const log of logs) {
        const details = log?.details as Record<string, any> | undefined;
        if (details?.nodeId && details.status !== "FAILED") {
          completed.set(details.nodeId, details.output);
        }
      }
    } catch (error: any) {
      this.logger.warn(`Unable to load completed workflow steps: ${error.message}`);
    }

    return completed;
  }

  private async refreshCancellation(ctx: DagExecutionContext): Promise<boolean> {
    if (ctx.isSimulation || !ctx.executionId) return false;

    const delegate = (this.prisma.client as any).workflowEngineExecution;
    if (!delegate || typeof delegate.findUnique !== "function") return false;

    try {
      const execution = await delegate.findUnique({
        where: { id: ctx.executionId },
        select: { status: true },
      });
      const cancelled = execution?.status === "CANCELLED";
      (ctx as any).__cancelled = cancelled;
      return cancelled;
    } catch {
      return false;
    }
  }

  private async recordAuditLog(
    ctx: DagExecutionContext,
    action: string,
    details: Record<string, any>,
    level: "INFO" | "WARN" | "ERROR",
  ) {
    if (ctx.isSimulation || !ctx.executionId) {
      return;
    }

    const delegate = (this.prisma.client as any).workflowEngineAuditLog;
    if (!delegate || typeof delegate.create !== "function") {
      return;
    }

    try {
      await delegate.create({
        data: {
          organizationId: ctx.organizationId,
          executionId: ctx.executionId,
          jobId: ctx.jobId,
          action,
          level,
          details,
        },
      });
    } catch (err: any) {
      this.logger.warn(`Failed to write DAG audit log '${action}': ${err.message}`);
    }
  }

  private normalizeHeaders(headers: unknown): Record<string, string> {
    if (!headers) return {};
    if (typeof headers === "string") {
      return headers.split("\n").reduce<Record<string, string>>((result, line) => {
        const separator = line.indexOf(":");
        if (separator === -1) return result;
        const key = line.slice(0, separator).trim();
        const value = line.slice(separator + 1).trim();
        if (key) result[key] = value;
        return result;
      }, {});
    }
    if (typeof headers === "object" && !Array.isArray(headers)) {
      return Object.entries(headers as Record<string, unknown>).reduce<Record<string, string>>(
        (result, [key, value]) => {
          if (value !== undefined && value !== null) {
            result[key] = String(value);
          }
          return result;
        },
        {},
      );
    }
    return {};
  }

  private toFiniteNumber(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  private normalizeComparable(value: unknown): string {
    if (value === null || value === undefined) return "";
    if (typeof value === "object") return JSON.stringify(value).toLowerCase();
    return String(value).toLowerCase();
  }

  private clamp(value: number, minimum: number, maximum: number): number {
    return Math.min(maximum, Math.max(minimum, value));
  }

  private backoffDelay(attempt: number, strategy: "linear" | "exponential"): number {
    const base = 250;
    const raw = strategy === "linear" ? base * (attempt + 1) : base * 2 ** attempt;
    return Math.min(raw, 5000);
  }

  private async withTimeout<T>(work: () => Promise<T>, timeoutMs: number, label: string): Promise<T> {
    if (!timeoutMs || timeoutMs <= 0) {
      return work();
    }

    let timer: NodeJS.Timeout | undefined;
    try {
      return await Promise.race([
        work(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            reject(new Error(`Step '${label}' timed out after ${timeoutMs}ms.`));
          }, timeoutMs);
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private readPositiveInt(name: string, fallback: number): number {
    const raw = process.env[name];
    if (!raw) return fallback;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
  }
}
