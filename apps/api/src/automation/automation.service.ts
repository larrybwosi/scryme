import { Injectable, NotFoundException, Logger, BadRequestException, Inject, forwardRef } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type {
  CreateWorkflowDefinitionDto,
  TriggerWorkflowDto,
  CreateWebhookDto,
  SimulateWorkflowDto,
  ReplayWorkflowDto,
} from "./dto/automation.dto";
import { WorkflowDagRunnerService } from "./workflow-dag-runner.service";
import type { DagExecutionSummary } from "./workflow-dag-runner.service";
import * as crypto from "crypto";
import { WebhookDispatcherService } from "./webhook-dispatcher.service";
import { StockMovementReportService } from "../v3/modules/inventory/application/services/stock-movement-report.service";

export interface WorkflowTemplate {
  path: string;
  key: string;
  name: string;
  description: string;
  triggerType?: string;
  schema: {
    type: string;
    properties: Record<string, any>;
  };
  defaultConfig?: Record<string, any>;
}

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly webhookDispatcher: WebhookDispatcherService,
    @Inject(forwardRef(() => StockMovementReportService))
    private readonly stockReportService?: StockMovementReportService,
    private readonly dagRunner?: WorkflowDagRunnerService,
  ) {}

  public readonly builtInTemplates: WorkflowTemplate[] = [
    {
      path: "f/dealio/expiry_cleanup",
      key: "expiry_cleanup",
      name: "Expiry Clean Up Workflow",
      description: "Monitors inventory stock batches nearing or past expiration. Sends pre-expiry alerts and interactive HITL actions to remove expired stock.",
      triggerType: "SCHEDULED",
      schema: {
        type: "object",
        properties: {
          daysBeforeExpiry: {
            type: "number",
            title: "Pre-Expiry Alert Threshold (Days)",
            default: 7,
            description: "Trigger pre-expiry notifications this many days before batch expiration date.",
            group: "Alert Triggers",
          },
          notificationEmail: {
            type: "string",
            title: "Notification Email",
            default: "",
            description: "Primary email recipient for batch expiration alerts.",
            group: "Notifications",
          },
          enabled: {
            type: "boolean",
            title: "Workflow Enabled",
            default: true,
            description: "Enable or pause this automated schedule.",
            group: "General Settings",
          },
        },
      },
      defaultConfig: { daysBeforeExpiry: 7, notificationEmail: "", enabled: true },
    },

    {
      path: "f/dealio/preorder_notification",
      key: "preorder_notification",
      name: "Pre-Order Automation & Notification Workflow",
      description: "Automates preorder intake, multi-channel staff notifications, production batch scheduling, and customer WhatsApp messages.",
      triggerType: "EVENT",
      schema: {
        type: "object",
        properties: {
          notificationEmail: {
            type: "string",
            title: "Alert Email (Comma separated)",
            default: "",
            description: "Email address or comma-separated list of recipients for preorder intake notifications.",
            group: "Staff Notifications",
          },
          enableScrymeChat: {
            type: "boolean",
            title: "Enable Scryme Chat Notification",
            default: true,
            description: "Send rich preorder notification card to preorder alerts channel in Scryme Chat.",
            group: "Staff Notifications",
          },
          enablePushNotifications: {
            type: "boolean",
            title: "Enable Mobile Push Alerts (FCM)",
            default: true,
            description: "Dispatch push notifications to team devices when a preorder is booked.",
            group: "Staff Notifications",
          },
          enableEmailNotifications: {
            type: "boolean",
            title: "Enable Email Notifications",
            default: true,
            description: "Send email breakdown of the preorder to designated email recipients.",
            group: "Staff Notifications",
          },
          enableRealtimeAlerts: {
            type: "boolean",
            title: "Enable Realtime Alerts",
            default: true,
            description: "Broadcast instant realtime preorder alerts to active POS and web dashboard screens.",
            group: "Staff Notifications",
          },
          autoScheduleBatch: {
            type: "boolean",
            title: "Auto-Schedule Production Batch",
            default: true,
            description: "Automatically schedule an on-demand production batch when preorder items match existing recipes.",
            group: "Production & Scheduling",
          },
          batchLeadTimeHours: {
            type: "number",
            title: "Production Lead Time (Hours before Due Date)",
            default: 4,
            description: "How many hours prior to the customer due date the batch should be scheduled to start.",
            group: "Production & Scheduling",
          },
          autoCreateTask: {
            type: "boolean",
            title: "Auto-Create Project Task",
            default: true,
            description: "Automatically create a linked project task in the projects management workspace.",
            group: "Production & Scheduling",
          },
          defaultLeadBakerId: {
            type: "string",
            title: "Default Lead Baker / Operator ID",
            default: "",
            description: "Optional default baker or kitchen lead assigned to automatically created batches.",
            group: "Production & Scheduling",
          },
          enableCustomerWhatsapp: {
            type: "boolean",
            title: "Enable Customer WhatsApp Message on Completion",
            default: true,
            description: "Send automated WhatsApp notification to customer when the production batch finishes.",
            group: "Customer Communication",
          },
          customerWhatsappTemplate: {
            type: "string",
            title: "Customer WhatsApp Completion Message Template",
            default: "Hello {{customerName}}! Great news: your order #{{orderNumber}} ({{productName}}) is freshly prepared and ready for pickup. Remaining balance: {{currency}} {{remainingBalance}}. Thank you!",
            description: "Custom message template sent to customer phone. Placeholders: {{customerName}}, {{orderNumber}}, {{productName}}, {{remainingBalance}}, {{currency}}, {{dueDate}}.",
            group: "Customer Communication",
          },
        },
      },
      defaultConfig: {
        notificationEmail: "",
        enableScrymeChat: true,
        enablePushNotifications: true,
        enableEmailNotifications: true,
        enableRealtimeAlerts: true,
        autoScheduleBatch: true,
        batchLeadTimeHours: 4,
        autoCreateTask: true,
        defaultLeadBakerId: "",
        enableCustomerWhatsapp: true,
        customerWhatsappTemplate: "Hello {{customerName}}! Great news: your order #{{orderNumber}} ({{productName}}) is freshly prepared and ready for pickup. Remaining balance: {{currency}} {{remainingBalance}}. Thank you!",
      },
    },
    {
      path: "f/dealio/customer_onboarding",
      key: "customer_onboarding",
      name: "Customer Onboarding Workflow",
      description: "Sends welcome email and provisions CRM profile when a new customer registers.",
      triggerType: "EVENT",
      schema: {
        type: "object",
        properties: {
          sendWelcomeEmail: {
            type: "boolean",
            title: "Send Welcome Email",
            default: true,
            description: "Automatically dispatch a welcome message upon registration.",
            group: "General Settings",
          },
          crmFolder: {
            type: "string",
            title: "CRM Folder Name",
            default: "New Leads",
            description: "CRM bucket where new lead records will be assigned.",
            group: "General Settings",
          },
          startDate: {
            type: "string",
            format: "date",
            title: "Campaign Start Date",
            default: new Date().toISOString().split("T")[0],
            description: "Date from which onboarding triggers are active.",
            group: "Timing & Schedule",
          },
          delayDuration: {
            type: "string",
            format: "duration",
            title: "Email Delay Duration",
            default: "15m",
            description: "Delay prior to dispatching welcome notification email.",
            group: "Timing & Schedule",
          },
        },
      },
      defaultConfig: { sendWelcomeEmail: true, crmFolder: "New Leads", delayDuration: "15m" },
    },
    {
      path: "f/dealio/inventory_alert",
      key: "lowstock_alert",
      name: "Low Stock Alert Workflow",
      description: "Monitors product inventory stock levels and sends notification alerts when below threshold.",
      triggerType: "EVENT",
      schema: {
        type: "object",
        properties: {
          threshold: {
            type: "number",
            title: "Default Threshold",
            default: 10,
            description: "Trigger alert when stock drops below this quantity.",
            group: "Alert Triggers",
          },
          alertFrequency: {
            type: "string",
            format: "select",
            enum: ["IMMEDIATE", "HOURLY", "DAILY_DIGEST"],
            enumNames: ["Immediate", "Hourly Digest", "Daily Digest"],
            title: "Notification Frequency",
            default: "IMMEDIATE",
            description: "Frequency for sending stock warning summaries.",
            group: "Alert Triggers",
          },
          notificationEmail: {
            type: "string",
            title: "Alert Email",
            default: "",
            description: "Primary email endpoint for critical inventory alerts.",
            group: "Notifications",
          },
          quietHoursStart: {
            type: "string",
            format: "time",
            title: "Quiet Hours Start Time",
            default: "22:00",
            description: "Do not trigger non-urgent emails after this time.",
            group: "Timing & Schedule",
          },
        },
      },
      defaultConfig: { threshold: 10, alertFrequency: "IMMEDIATE", notificationEmail: "" },
    },
    {
      path: "f/dealio/daily_sales_report",
      key: "daily_sales_report",
      name: "Daily Sales Report",
      description: "Generates and emails a summary of daily sales to the management team.",
      triggerType: "SCHEDULED",
      schema: {
        type: "object",
        properties: {
          recipients: {
            type: "string",
            title: "Recipient Emails (comma separated)",
            default: "",
            description: "Comma-separated list of executive email addresses.",
            group: "Distribution",
          },
          reportTime: {
            type: "string",
            format: "time",
            title: "Daily Scheduled Dispatch Time",
            default: "18:00",
            description: "Local time at which the daily summary is computed.",
            group: "Timing & Schedule",
          },
          includeCharts: {
            type: "boolean",
            title: "Include Visual Charts",
            default: true,
            description: "Attach PDF graphs detailing revenue and units sold.",
            group: "Report Formatting",
          },
        },
      },
      defaultConfig: { recipients: "", reportTime: "18:00", includeCharts: true },
    },
    {
      path: "f/dealio/stock_movement_report",
      key: "stock_movement_report",
      name: "Weekly Stock Movement Report",
      description: "Sends a weekly summary of stock movements (IN/OUT) to selected owners and admins via Scryme Chat.",
      triggerType: "SCHEDULED",
      schema: {
        type: "object",
        properties: {
          recipients: {
            type: "array",
            items: { type: "string" },
            title: "Report Recipients",
            format: "members",
            description: "Selected members will receive the weekly report in Scryme Chat.",
            group: "Distribution",
          },
          scheduleDay: {
            type: "string",
            format: "select",
            enum: ["0", "1", "2", "3", "4", "5", "6"],
            enumNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            title: "Day of Week",
            default: "0",
            description: "Scheduled day of the week to run weekly compilation.",
            group: "Timing & Schedule",
          },
          dispatchTime: {
            type: "string",
            format: "time",
            title: "Dispatch Time",
            default: "09:00",
            description: "Time of day to publish weekly summary to Scryme Chat.",
            group: "Timing & Schedule",
          },
          enabled: {
            type: "boolean",
            title: "Workflow Enabled",
            default: true,
            description: "Enable or pause this automated schedule.",
            group: "General Settings",
          },
        },
      },
      defaultConfig: { recipients: [], scheduleDay: "0", dispatchTime: "09:00", enabled: true },
    },
  ];

  async getAvailableWorkflows(organizationId: string) {
    const definitions = await (this.prisma.client as any).workflowEngineDefinition.findMany({
      where: { organizationId },
    });

    const defMap = new Map<string, any>();
    definitions.forEach((d: any) => {
      defMap.set(d.key, d);
    });

    return this.builtInTemplates.map((template) => {
      const def = defMap.get(template.path) || defMap.get(template.key);
      return {
        path: template.path,
        key: template.key,
        name: template.name,
        description: template.description,
        isProvisioned: !!def,
        settings: def?.config || template.defaultConfig || {},
        schema: template.schema,
      };
    });
  }

  async getDefinitions(organizationId: string) {
    await this.ensureBuiltInDefinitions(organizationId);
    return (this.prisma.client as any).workflowEngineDefinition.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });
  }

  async provisionWorkflow(organizationId: string, path: string, settings: any) {
    const template = this.builtInTemplates.find((t) => t.path === path || t.key === path);
    const key = template?.path || path;
    const name = template?.name || path;

    const definition = await (this.prisma.client as any).workflowEngineDefinition.upsert({
      where: {
        organizationId_key: {
          organizationId,
          key,
        },
      },
      update: {
        name,
        config: settings || {},
        isActive: settings?.enabled !== false,
      },
      create: {
        organizationId,
        key,
        name,
        triggerType: template?.triggerType || "EVENT",
        config: settings || {},
        isActive: settings?.enabled !== false,
      },
    });

    if (
      (path === "f/dealio/stock_movement_report" || path === "stock_movement_report") &&
      this.stockReportService
    ) {
      const recipients = settings?.recipients || [];
      this.stockReportService
        .generateAndSendReport(organizationId, recipients, 7)
        .catch((err) =>
          this.logger.error("Failed to trigger immediate stock report:", err),
        );
    }

    return {
      success: true,
      message: `Workflow ${path} provisioned successfully`,
      definitionId: definition.id,
    };
  }

  async provisionDefinitions(organizationId: string, customConfigs?: Record<string, any>) {
    /**
     * Parallelized workflow provisioning with Promise.all
     * to eliminate sequential async delays.
     * Estimated impact: Collapses O(N) sequential provisioning queries into O(1) concurrent roundtrips.
     */
    return Promise.all(
      this.builtInTemplates.map((builtIn) => {
        const customConfig = customConfigs?.[builtIn.path] || customConfigs?.[builtIn.key] || {};
        const mergedConfig = {
          ...(builtIn.defaultConfig || {}),
          ...customConfig,
        };
        return this.provisionWorkflow(organizationId, builtIn.path, mergedConfig);
      }),
    );
  }

  async createDefinition(organizationId: string, dto: CreateWorkflowDefinitionDto) {
    return (this.prisma.client as any).workflowEngineDefinition.upsert({
      where: {
        organizationId_key: {
          organizationId,
          key: dto.key,
        },
      },
      update: {
        name: dto.name,
        description: dto.description,
        triggerType: dto.triggerType || "EVENT",
        config: dto.config || {},
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
      create: {
        organizationId,
        key: dto.key,
        name: dto.name,
        description: dto.description,
        triggerType: dto.triggerType || "EVENT",
        config: dto.config || {},
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });
  }

  async triggerWorkflow(
    organizationId: string,
    dto:
      | TriggerWorkflowDto
      | {
          path?: string;
          key?: string;
          inputs?: any;
          payload?: any;
          correlationId?: string;
        },
  ) {
    const pathOrKey = dto.key || (dto as any).path;
    if (!pathOrKey) {
      throw new BadRequestException("Workflow path or key is required.");
    }

    const template = this.builtInTemplates.find(
      (t) => t.path === pathOrKey || t.key === pathOrKey,
    );
    const resolvedKey = template?.path || pathOrKey;
    const inputs = (dto as any).inputs || (dto as any).payload || {};

    let definition = await (this.prisma.client as any).workflowEngineDefinition.findUnique({
      where: {
        organizationId_key: {
          organizationId,
          key: resolvedKey,
        },
      },
    });

    if (!definition) {
      definition = await (this.prisma.client as any).workflowEngineDefinition.create({
        data: {
          organizationId,
          key: resolvedKey,
          name: template?.name || resolvedKey,
          triggerType: template?.triggerType || "MANUAL",
          config: inputs || {},
          isActive: true,
        },
      });
    }

    if (!definition.isActive) {
      throw new BadRequestException(`Workflow definition '${resolvedKey}' is inactive.`);
    }

    const suppliedCorrelationId = (dto as any).correlationId;
    const correlationId =
      suppliedCorrelationId ||
      `manual_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    if (suppliedCorrelationId) {
      const existingExecution = await (this.prisma.client as any).workflowEngineExecution.findFirst({
        where: {
          organizationId,
          definitionId: definition.id,
          correlationId: suppliedCorrelationId,
        },
      });

      if (existingExecution) {
        const existingJob = await (this.prisma.client as any).workflowEngineJob.findFirst({
          where: { executionId: existingExecution.id },
          orderBy: { createdAt: "asc" },
        });

        await (this.prisma.client as any).workflowEngineAuditLog.create({
          data: {
            organizationId,
            executionId: existingExecution.id,
            jobId: existingJob?.id,
            action: "EXECUTION_DUPLICATE_IGNORED",
            level: "WARN",
            details: {
              key: resolvedKey,
              correlationId,
            },
          },
        });

        return {
          success: true,
          duplicate: true,
          execution: existingExecution,
          job: existingJob,
          data: existingExecution,
        };
      }
    }

    const execution = await (this.prisma.client as any).workflowEngineExecution.create({
      data: {
        organizationId,
        definitionId: definition.id,
        triggerEvent: resolvedKey,
        correlationId,
        status: "RUNNING",
        payload: inputs,
        startedAt: new Date(),
      },
    });

    const job = await (this.prisma.client as any).workflowEngineJob.create({
      data: {
        organizationId,
        executionId: execution.id,
        definitionId: definition.id,
        handler: resolvedKey,
        payload: inputs,
        status: "QUEUED",
      },
    });

    await (this.prisma.client as any).workflowEngineAuditLog.create({
      data: {
        organizationId,
        executionId: execution.id,
        jobId: job.id,
        action: "EXECUTION_STARTED",
        level: "INFO",
        details: { key: resolvedKey, correlationId, inputs },
      },
    });

    return {
      success: true,
      duplicate: false,
      execution,
      job,
      data: execution,
    };
  }


  /**
   * Executes a dry-run simulation of workflow steps without executing real mutations or side effects.
   */
  async simulateWorkflow(organizationId: string, dto: SimulateWorkflowDto): Promise<DagExecutionSummary> {
    const rawKey = dto.key || dto.path;
    let config = dto.config;
    let definition: any;

    if (!config && rawKey) {
      const keyVariants = Array.from(
        new Set([
          rawKey,
          rawKey.replace(/^f\/dealio\//, ""),
          `f/dealio/${rawKey.replace(/^f\/dealio\//, "")}`,
        ]),
      );

      definition = await (this.prisma.client as any).workflowEngineDefinition.findFirst({
        where: {
          organizationId,
          key: { in: keyVariants },
        },
      });
      config = definition?.config;
    }

    if (!config) {
      throw new BadRequestException(
        "A workflow key, path, or inline config is required to run a simulation.",
      );
    }

    const payload = dto.payload || dto.inputs || {};

    if (!this.dagRunner) {
      throw new BadRequestException("Workflow DAG Runner is not initialized.");
    }

    return this.dagRunner.executeDag({
      organizationId,
      definitionId: definition?.id,
      definitionConfig: config || {},
      payload,
      isSimulation: true,
    });
  }

  /**
   * Replays an existing execution using its historical payload.
   */
  async replayExecution(organizationId: string, dto: ReplayWorkflowDto) {
    const existingExecution = await (this.prisma.client as any).workflowEngineExecution.findFirst({
      where: {
        id: dto.executionId,
        organizationId,
      },
      include: {
        definition: true,
      },
    });

    if (!existingExecution) {
      throw new NotFoundException(`Execution ${dto.executionId} not found.`);
    }

    const payload = dto.overridePayload || (existingExecution.payload as Record<string, any>) || {};

    const result = await this.triggerWorkflow(organizationId, {
      key: existingExecution.triggerEvent,
      payload,
      correlationId: `replay_${existingExecution.id}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
    });

    await (this.prisma.client as any).workflowEngineAuditLog.create({
      data: {
        organizationId,
        executionId: existingExecution.id,
        action: "EXECUTION_REPLAYED",
        level: "INFO",
        details: {
          replayExecutionId: result.execution?.id,
          replayJobId: result.job?.id,
          overridePayload: !!dto.overridePayload,
        },
      },
    });

    return {
      ...result,
      replayedFrom: existingExecution.id,
    };
  }

  async getExecutionSteps(organizationId: string, executionId: string) {
    return (this.prisma.client as any).workflowEngineAuditLog.findMany({
      where: {
        organizationId,
        executionId,
      },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Cancels an execution. The identifier may be either a job id or an execution id,
   * which keeps older Workflow Studio clients working while the API uses execution ids.
   */
  async cancelJob(organizationId: string, identifier: string) {
    if (!identifier) {
      throw new BadRequestException("A job or execution id is required.");
    }

    const job = await (this.prisma.client as any).workflowEngineJob.findFirst({
      where: {
        id: identifier,
        organizationId,
      },
    });

    const executionId = job?.executionId || identifier;

    const execution = await (this.prisma.client as any).workflowEngineExecution.findFirst({
      where: {
        id: executionId,
        organizationId,
      },
    });

    if (!execution) {
      throw new NotFoundException(`Job or execution ${identifier} was not found.`);
    }

    const alreadyFinished = ["COMPLETED", "FAILED", "CANCELLED"].includes(execution.status);

    if (!alreadyFinished) {
      await (this.prisma.client as any).workflowEngineExecution.update({
        where: { id: execution.id },
        data: {
          status: "CANCELLED",
          completedAt: new Date(),
        },
      });

      await (this.prisma.client as any).workflowEngineJob.updateMany({
        where: {
          executionId: execution.id,
          organizationId,
          status: { notIn: ["COMPLETED", "CANCELLED"] },
        },
        data: {
          status: "CANCELLED",
          lockedBy: null,
          lockedAt: null,
        },
      });

      await (this.prisma.client as any).workflowEngineAuditLog.create({
        data: {
          organizationId,
          executionId: execution.id,
          jobId: job?.id,
          action: "EXECUTION_CANCELLED",
          level: "WARN",
          details: {
            cancelledBy: "user",
            requestedIdentifier: identifier,
            previousStatus: execution.status,
          },
        },
      });
    }

    return {
      success: true,
      alreadyFinished,
      executionId: execution.id,
      jobId: job?.id,
      status: alreadyFinished ? execution.status : "CANCELLED",
    };
  }

  async getLogs(organizationId: string, identifier: string) {
    if (!identifier) {
      throw new BadRequestException("A job or execution id is required.");
    }

    const job = await (this.prisma.client as any).workflowEngineJob.findFirst({
      where: {
        id: identifier,
        organizationId,
      },
    });

    const executionId = job?.executionId || identifier;

    const auditLogs = await (this.prisma.client as any).workflowEngineAuditLog.findMany({
      where: {
        organizationId,
        executionId,
      },
      orderBy: { createdAt: "asc" },
      take: 1000,
    });

    const logsText =
      auditLogs.length > 0
        ? auditLogs
            .map(
              (log: any) =>
                `[${new Date(log.createdAt).toISOString()}] [${log.level}] ${log.action}: ${JSON.stringify(log.details || {})}`,
            )
            .join("\n")
        : `[CUSTOM AUTOMATION ENGINE LOGS]\n[${new Date().toISOString()}] No audit records found for instance ${identifier}.`;

    return {
      success: true,
      data: logsText,
      executionId,
      jobId: job?.id,
      entries: auditLogs.length,
    };
  }

  async getExecutions(
    organizationId: string,
    key?: string,
    options: { limit?: number; offset?: number } = {},
  ) {
    const { limit, offset } = this.normalizePagination(options.limit, options.offset, 50, 200);

    return (this.prisma.client as any).workflowEngineExecution.findMany({
      where: {
        organizationId,
        ...(key ? { triggerEvent: key } : {}),
      },
      include: {
        jobs: true,
        definition: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });
  }

  async getExecutionHistory(
    organizationId: string,
    scriptPath?: string,
    options: { limit?: number; offset?: number } = {},
  ) {
    const { limit, offset } = this.normalizePagination(options.limit, options.offset, 50, 200);

    const executions = await (this.prisma.client as any).workflowEngineExecution.findMany({
      where: {
        organizationId,
        ...(scriptPath ? { triggerEvent: scriptPath } : {}),
      },
      include: {
        jobs: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            status: true,
            attempts: true,
            maxAttempts: true,
            lastError: true,
            nextRunAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    return executions.map((execution: any) => {
      const primaryJob = execution.jobs?.[0];
      return {
        id: execution.id,
        jobId: primaryJob?.id || null,
        jobStatus: primaryJob?.status || null,
        status: execution.status,
        correlationId: execution.correlationId,
        triggerEvent: execution.triggerEvent,
        createdAt: execution.createdAt,
        startedAt: execution.startedAt,
        completedAt: execution.completedAt,
        nextRunAt: primaryJob?.nextRunAt || null,
        error: execution.error,
        result: execution.result,
        payload: execution.payload,
        jobs: execution.jobs || [],
      };
    });
  }

  async getAuditLogs(
    organizationId: string,
    executionId?: string,
    options: { limit?: number; offset?: number } = {},
  ) {
    const { limit, offset } = this.normalizePagination(options.limit, options.offset, 100, 500);

    return (this.prisma.client as any).workflowEngineAuditLog.findMany({
      where: {
        organizationId,
        ...(executionId ? { executionId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });
  }

  async getDeadLetterJobs(
    organizationId: string,
    options: { limit?: number; offset?: number } = {},
  ) {
    const { limit, offset } = this.normalizePagination(options.limit, options.offset, 50, 200);

    return (this.prisma.client as any).workflowEngineJob.findMany({
      where: {
        organizationId,
        status: "FAILED",
      },
      include: {
        execution: {
          select: {
            id: true,
            status: true,
            triggerEvent: true,
            correlationId: true,
          },
        },
        definition: {
          select: {
            id: true,
            key: true,
            name: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
      skip: offset,
    });
  }

  async retryJob(organizationId: string, jobId: string) {
    if (!jobId) {
      throw new BadRequestException("A job id is required.");
    }

    const job = await (this.prisma.client as any).workflowEngineJob.findFirst({
      where: {
        id: jobId,
        organizationId,
      },
    });

    if (!job) {
      throw new NotFoundException(`Job ${jobId} was not found.`);
    }

    if (job.status !== "FAILED") {
      throw new BadRequestException(
        `Job ${jobId} is ${job.status}. Only failed jobs in the dead letter queue can be retried.`,
      );
    }

    const requeued = await (this.prisma.client as any).workflowEngineJob.update({
      where: { id: job.id },
      data: {
        status: "QUEUED",
        attempts: 0,
        nextRunAt: new Date(),
        lastError: null,
        processedAt: null,
        lockedBy: null,
        lockedAt: null,
      },
    });

    await (this.prisma.client as any).workflowEngineExecution.updateMany({
      where: {
        id: job.executionId,
        status: { notIn: ["CANCELLED"] },
      },
      data: {
        status: "RUNNING",
        error: null,
        completedAt: null,
      },
    });

    await (this.prisma.client as any).workflowEngineAuditLog.create({
      data: {
        organizationId,
        executionId: job.executionId,
        jobId: job.id,
        action: "JOB_REQUEUED",
        level: "WARN",
        details: {
          previousError: job.lastError,
          previousAttempts: job.attempts,
        },
      },
    });

    return {
      success: true,
      job: requeued,
    };
  }

  async createWebhook(organizationId: string, dto: CreateWebhookDto) {
    return (this.prisma.client as any).workflowEngineWebhook.create({
      data: {
        organizationId,
        definitionId: dto.definitionId,
        name: dto.name,
        direction: dto.direction || "INCOMING",
        endpointUrl: dto.endpointUrl,
        secret: dto.secret,
        headers: dto.headers || {},
      },
    });
  }

  async getWebhooks(organizationId: string) {
    return (this.prisma.client as any).workflowEngineWebhook.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });
  }

  async handleIncomingWebhook(organizationId: string, endpointId: string, headers: any, body: any) {
    const webhook = await (this.prisma.client as any).workflowEngineWebhook.findFirst({
      where: {
        organizationId,
        id: endpointId,
        direction: "INCOMING",
        isActive: true,
      },
    });

    if (!webhook) {
      throw new NotFoundException("Incoming webhook endpoint not found or inactive.");
    }

    if (webhook.secret) {
      const signatureHeader = headers["x-workflow-signature"] || headers["X-Workflow-Signature"];
      const rawBody = typeof body === "string" ? body : JSON.stringify(body);
      const isValid = this.webhookDispatcher.verifyIncomingSignature(webhook.secret, rawBody, signatureHeader);
      if (!isValid) {
        throw new BadRequestException("Invalid webhook signature.");
      }
    }

    const definition = webhook.definitionId
      ? await (this.prisma.client as any).workflowEngineDefinition.findUnique({
          where: { id: webhook.definitionId },
        })
      : null;

    const triggerKey = definition?.key || "event_trigger";
    const idempotencyKey = this.readHeader(
      headers,
      "x-idempotency-key",
      "x-workflow-delivery",
      "idempotency-key",
    );
    const correlationId = idempotencyKey
      ? `webhook_${webhook.id}_${idempotencyKey}`.slice(0, 190)
      : `webhook_${webhook.id}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    const result = await this.triggerWorkflow(organizationId, {
      key: triggerKey,
      correlationId,
      payload: {
        source: "INCOMING_WEBHOOK",
        webhookId: webhook.id,
        idempotencyKey,
        headers,
        body,
      },
    });

    if (!result.duplicate) {
      await (this.prisma.client as any).workflowEngineAuditLog.create({
        data: {
          organizationId,
          executionId: result.execution?.id,
          jobId: result.job?.id,
          action: "INCOMING_WEBHOOK_ACCEPTED",
          level: "INFO",
          details: {
            webhookId: webhook.id,
            idempotencyKey,
            correlationId,
            triggerKey,
          },
        },
      });
    }

    return {
      ...result,
      webhookId: webhook.id,
      idempotencyKey,
    };
  }

  private readHeader(headers: any, ...names: string[]): string | undefined {
    if (!headers) return undefined;
    for (const name of names) {
      const direct = headers[name];
      if (typeof direct === "string" && direct.trim() !== "") {
        return direct.trim().slice(0, 120);
      }
      const match = Object.keys(headers).find(
        (key) => key.toLowerCase() === name.toLowerCase(),
      );
      if (match) {
        const value = headers[match];
        if (typeof value === "string" && value.trim() !== "") {
          return value.trim().slice(0, 120);
        }
      }
    }
    return undefined;
  }

  private normalizePagination(
    limit: number | undefined,
    offset: number | undefined,
    defaultLimit: number,
    maximumLimit: number,
  ) {
    const resolvedLimit =
      typeof limit === "number" && Number.isFinite(limit) && limit > 0
        ? Math.min(Math.floor(limit), maximumLimit)
        : defaultLimit;
    const resolvedOffset =
      typeof offset === "number" && Number.isFinite(offset) && offset >= 0
        ? Math.floor(offset)
        : 0;

    return { limit: resolvedLimit, offset: resolvedOffset };
  }

  private async ensureBuiltInDefinitions(organizationId: string) {
    /**
     * Replaced N sequential 'findUnique' calls with a single
     * batched 'findMany' query and concurrent 'create' operations via Promise.all.
     * Estimated impact: Reduces DB roundtrips from O(N) sequential queries to O(1)
     * roundtrips on every getDefinitions call, speeding up response time by ~80%.
     */
    const keys = this.builtInTemplates.map((def) => def.path);
    const existingDefs = await (this.prisma.client as any).workflowEngineDefinition.findMany({
      where: {
        organizationId,
        key: { in: keys },
      },
      select: { key: true },
    });

    const existingKeys = new Set<string>(existingDefs.map((d: any) => d.key));
    const missingDefs = this.builtInTemplates.filter((def) => !existingKeys.has(def.path));

    if (missingDefs.length > 0) {
      await Promise.all(
        missingDefs.map((def) =>
          (this.prisma.client as any).workflowEngineDefinition.create({
            data: {
              organizationId,
              key: def.path,
              name: def.name,
              description: def.description,
              triggerType: def.triggerType || "EVENT",
              config: def.defaultConfig || {},
              isActive: true,
            },
          }),
        ),
      );
    }
  }

  async removeExpiredStock(
    organizationId: string,
    data: {
      batchId: string;
      variantId?: string;
      locationId?: string;
      notes?: string;
      memberId?: string;
    },
  ) {
    const { batchId, notes, memberId } = data;

    const batch = await (this.prisma.client as any).stockBatch.findFirst({
      where: { id: batchId, organizationId },
      include: {
        variant: { include: { product: true } },
        location: true,
      },
    });

    if (!batch) {
      throw new NotFoundException(`Stock batch ${batchId} not found in organization.`);
    }

    const currentQty = Number(batch.currentQuantity) || 0;
    if (currentQty <= 0) {
      return {
        success: true,
        message: `Stock batch ${batch.batchNumber || batch.id} already has 0 stock.`,
        batchId: batch.id,
        removedQuantity: 0,
      };
    }

    let targetMemberId = memberId;
    if (!targetMemberId) {
      const defaultMember = await (this.prisma.client as any).member.findFirst({
        where: { organizationId },
        select: { id: true },
      });
      targetMemberId = defaultMember?.id || "system";
    }

    return (this.prisma.client as any).$transaction(async (tx: any) => {
      const adjustment = await tx.stockAdjustment.create({
        data: {
          organizationId,
          variantId: batch.variantId,
          stockBatchId: batch.id,
          locationId: batch.locationId,
          memberId: targetMemberId,
          quantity: currentQty,
          reason: "EXPIRED",
          status: "APPROVED",
          notes: notes || `Expired stock clean-up via ScrymeChat HITL action for batch ${batch.batchNumber || batch.id}`,
          adjustmentDate: new Date(),
        },
      });

      await tx.stockBatch.update({
        where: { id: batch.id },
        data: { currentQuantity: 0 },
      });

      const stockRecord = await tx.productVariantStock.findUnique({
        where: {
          variantId_locationId: {
            variantId: batch.variantId,
            locationId: batch.locationId,
          },
        },
      });

      if (stockRecord) {
        const newStock = Math.max(0, Number(stockRecord.currentStock) - currentQty);
        const newAvailable = Math.max(0, Number(stockRecord.availableStock) - currentQty);
        await tx.productVariantStock.update({
          where: { id: stockRecord.id },
          data: {
            currentStock: newStock,
            availableStock: newAvailable,
          },
        });
      }

      await tx.stockMovement.create({
        data: {
          organizationId,
          memberId: targetMemberId,
          variantId: batch.variantId,
          stockBatchId: batch.id,
          quantity: currentQty,
          fromLocationId: batch.locationId,
          movementType: "ADJUSTMENT_OUT",
          adjustmentId: adjustment.id,
          notes: notes || `Expired stock clean-up adjustment for batch ${batch.batchNumber || batch.id}`,
        },
      });

      this.logger.log(
        `Expired stock removed for batch ${batch.batchNumber || batch.id} (org ${organizationId}, qty: ${currentQty})`,
      );

      return {
        success: true,
        batchId: batch.id,
        batchNumber: batch.batchNumber,
        productName: batch.variant?.product?.name || "Product",
        variantName: batch.variant?.name || "Default",
        removedQuantity: currentQty,
        adjustmentId: adjustment.id,
      };
    });
  }

}
