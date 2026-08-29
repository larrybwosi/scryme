import { Injectable, NotFoundException, forwardRef, Inject } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { V2ApiContext } from "@repo/shared/api/v2";
import { StockMovementReportService } from "../../v3/modules/inventory/application/services/stock-movement-report.service";
import * as crypto from "crypto";

@Injectable()
export class WorkflowsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => StockMovementReportService))
    private readonly stockReportService: StockMovementReportService,
  ) {}

  private readonly mockScripts = [
    {
      path: "f/dealio/customer_onboarding",
      name: "Customer Onboarding",
      description:
        "Sends welcome email and creates a profile in CRM when a new customer is added.",
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
    },
    {
      path: "f/dealio/inventory_alert",
      name: "Low Stock Alert",
      description:
        "Monitors stock levels and notifies the procurement team when items are below threshold.",
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
    },
    {
      path: "f/dealio/daily_sales_report",
      name: "Daily Sales Report",
      description:
        "Generates and emails a summary of daily sales to the management team.",
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
    },
    {
      path: "f/dealio/stock_movement_report",
      name: "Weekly Stock Movement Report",
      description:
        "Sends a weekly summary of stock movements (IN/OUT) to selected owners and admins via Scryme Chat.",
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
    },
  ];

  async getAvailableWorkflows(ctx: V2ApiContext) {
    const definitions = await (this.prisma.client as any).workflowEngineDefinition.findMany({
      where: { organizationId: ctx.organizationId },
    });

    const definitionsMap = new Map<string, any>(
      definitions.map((d: any) => [d.key, d]),
    );

    return this.mockScripts.map((script) => {
      const definition = definitionsMap.get(script.path);
      return {
        ...script,
        isProvisioned: !!definition,
        settings: definition?.config || {},
      };
    });
  }

  async provisionWorkflow(ctx: V2ApiContext, path: string, settings: any) {
    const definition = await (this.prisma.client as any).workflowEngineDefinition.upsert({
      where: {
        organizationId_key: {
          organizationId: ctx.organizationId,
          key: path,
        },
      },
      update: {
        config: settings || {},
        isActive: settings.enabled !== false,
      },
      create: {
        organizationId: ctx.organizationId,
        key: path,
        name: this.mockScripts.find((s) => s.path === path)?.name || path,
        triggerType: "EVENT",
        config: settings || {},
        isActive: settings.enabled !== false,
      },
    });

    if (path === "f/dealio/stock_movement_report") {
      const recipients = settings.recipients || [];
      this.stockReportService
        .generateAndSendReport(ctx.organizationId, recipients, 7)
        .catch((err) =>
          console.error("Failed to trigger immediate stock report:", err),
        );
    }

    return {
      success: true,
      message: `Workflow ${path} provisioned successfully`,
      definitionId: definition.id,
    };
  }

  async triggerWorkflow(ctx: V2ApiContext, path: string, inputs: any) {
    let definition = await (this.prisma.client as any).workflowEngineDefinition.findUnique({
      where: {
        organizationId_key: {
          organizationId: ctx.organizationId,
          key: path,
        },
      },
    });

    if (!definition) {
      definition = await (this.prisma.client as any).workflowEngineDefinition.create({
        data: {
          organizationId: ctx.organizationId,
          key: path,
          name: this.mockScripts.find((s) => s.path === path)?.name || path,
          triggerType: "MANUAL",
          config: inputs || {},
          isActive: true,
        },
      });
    }

    const correlationId = "manual_" + Date.now() + "_" + crypto.randomBytes(4).toString("hex");

    const execution = await (this.prisma.client as any).workflowEngineExecution.create({
      data: {
        organizationId: ctx.organizationId,
        definitionId: definition.id,
        triggerEvent: path,
        correlationId,
        status: "RUNNING",
        payload: inputs || {},
        startedAt: new Date(),
      },
    });

    const job = await (this.prisma.client as any).workflowEngineJob.create({
      data: {
        organizationId: ctx.organizationId,
        executionId: execution.id,
        definitionId: definition.id,
        handler: path,
        payload: inputs || {},
        status: "QUEUED",
      },
    });

    return execution;
  }

  async getExecutionHistory(ctx: V2ApiContext, scriptPath?: string) {
    return (this.prisma.client as any).workflowEngineExecution.findMany({
      where: {
        organizationId: ctx.organizationId,
        ...(scriptPath ? { triggerEvent: scriptPath } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }
}
