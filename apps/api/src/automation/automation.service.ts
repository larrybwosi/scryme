import { Injectable, NotFoundException, Logger, BadRequestException, Inject, forwardRef } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateWorkflowDefinitionDto, TriggerWorkflowDto, CreateWebhookDto } from "./dto/automation.dto";
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
  ) {}

  public readonly builtInTemplates: WorkflowTemplate[] = [
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
            default: "procurement@example.com",
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
      defaultConfig: { threshold: 10, alertFrequency: "IMMEDIATE", notificationEmail: "procurement@example.com" },
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
            default: "admin@example.com",
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
      defaultConfig: { recipients: "admin@example.com", reportTime: "18:00", includeCharts: true },
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
    const results = [];
    for (const builtIn of this.builtInTemplates) {
      const customConfig = customConfigs?.[builtIn.path] || customConfigs?.[builtIn.key] || {};
      const mergedConfig = {
        ...(builtIn.defaultConfig || {}),
        ...customConfig,
      };

      const res = await this.provisionWorkflow(organizationId, builtIn.path, mergedConfig);
      results.push(res);
    }
    return results;
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

  async triggerWorkflow(organizationId: string, dto: TriggerWorkflowDto | { path?: string; key?: string; inputs?: any; payload?: any; correlationId?: string }) {
    const pathOrKey = dto.key || (dto as any).path;
    if (!pathOrKey) {
      throw new BadRequestException("Workflow path or key is required.");
    }

    const template = this.builtInTemplates.find((t) => t.path === pathOrKey || t.key === pathOrKey);
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

    const correlationId = (dto as any).correlationId || `manual_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

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
      execution,
      job,
      data: execution,
    };
  }

  async cancelJob(organizationId: string, jobId: string) {
    const execution = await (this.prisma.client as any).workflowEngineExecution.findFirst({
      where: {
        organizationId,
        id: jobId,
      },
    });

    if (execution) {
      await (this.prisma.client as any).workflowEngineExecution.update({
        where: { id: execution.id },
        data: { status: "CANCELLED" },
      });
      await (this.prisma.client as any).workflowEngineJob.updateMany({
        where: { executionId: execution.id, organizationId },
        data: { status: "CANCELLED" },
      });
      await (this.prisma.client as any).workflowEngineAuditLog.create({
        data: {
          organizationId,
          executionId: execution.id,
          action: "JOB_CANCELLED",
          level: "WARN",
          details: { cancelledBy: "user", jobId },
        },
      });
    }

    return { success: true };
  }

  async getLogs(organizationId: string, jobId: string) {
    const auditLogs = await (this.prisma.client as any).workflowEngineAuditLog.findMany({
      where: {
        organizationId,
        executionId: jobId,
      },
      orderBy: { createdAt: "asc" },
    });

    const logsText = auditLogs.length > 0
      ? auditLogs.map((log: any) => `[${new Date(log.createdAt).toISOString()}] [${log.level}] ${log.action}: ${JSON.stringify(log.details || {})}`).join("\n")
      : `[CUSTOM AUTOMATION ENGINE LOGS]\n[${new Date().toISOString()}] Job initialized under instance ${jobId}.\n[${new Date().toISOString()}] Executing workflow steps autonomously via NestJS API.`;

    return { success: true, data: logsText };
  }

  async getExecutions(organizationId: string, key?: string) {
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
      take: 50,
    });
  }

  async getExecutionHistory(organizationId: string, scriptPath?: string) {
    const executions = await (this.prisma.client as any).workflowEngineExecution.findMany({
      where: {
        organizationId,
        ...(scriptPath ? { triggerEvent: scriptPath } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return executions.map((e: any) => ({
      id: e.id,
      jobId: e.id,
      status: e.status,
      createdAt: e.createdAt,
      result: e.result,
      payload: e.payload,
    }));
  }

  async getAuditLogs(organizationId: string, executionId?: string) {
    return (this.prisma.client as any).workflowEngineAuditLog.findMany({
      where: {
        organizationId,
        ...(executionId ? { executionId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
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

    const triggerKey = webhook.definitionId ? (await (this.prisma.client as any).workflowEngineDefinition.findUnique({ where: { id: webhook.definitionId } }))?.key || "event_trigger" : "event_trigger";

    return this.triggerWorkflow(organizationId, {
      key: triggerKey,
      payload: {
        source: "INCOMING_WEBHOOK",
        webhookId: webhook.id,
        headers,
        body,
      },
    });
  }

  private async ensureBuiltInDefinitions(organizationId: string) {
    for (const def of this.builtInTemplates) {
      const existing = await (this.prisma.client as any).workflowEngineDefinition.findUnique({
        where: {
          organizationId_key: {
            organizationId,
            key: def.path,
          },
        },
      });

      if (!existing) {
        await (this.prisma.client as any).workflowEngineDefinition.create({
          data: {
            organizationId,
            key: def.path,
            name: def.name,
            description: def.description,
            triggerType: def.triggerType || "EVENT",
            config: def.defaultConfig || {},
            isActive: true,
          },
        });
      }
    }
  }
}
