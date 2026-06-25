import { Injectable, NotFoundException, forwardRef, Inject } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { V2ApiContext } from "@repo/shared/api/v2/types/context";
import { StockMovementReportService } from "../../v3/modules/inventory/application/services/stock-movement-report.service";

@Injectable()
export class WorkflowsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => StockMovementReportService))
    private readonly stockReportService: StockMovementReportService,
  ) {}

  // Simulation of available scripts in Windmill
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
          },
          crmFolder: {
            type: "string",
            title: "CRM Folder Name",
            default: "New Leads",
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
          },
          notificationEmail: {
            type: "string",
            title: "Alert Email",
            default: "procurement@example.com",
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
          },
          includeCharts: {
            type: "boolean",
            title: "Include Visual Charts",
            default: true,
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
          },
          scheduleDay: {
            type: "number",
            title: "Day of Week (0=Sunday, 6=Saturday)",
            default: 0,
            minimum: 0,
            maximum: 6,
          },
          enabled: {
            type: "boolean",
            title: "Workflow Enabled",
            default: true,
          },
        },
      },
    },
  ];

  async getAvailableWorkflows(ctx: V2ApiContext) {
    // In a real scenario, this would fetch from Windmill API or a shared library table
    // For now, we return our mock scripts and mark if they are provisioned for this org

    const provisionedWorkflows = await (
      this.prisma.client as any
    ).windmillWorkflow.findMany({
      where: { organizationId: ctx.organizationId },
    });

    const config = await (
      this.prisma.client as any
    ).windmillConfiguration.findUnique({
      where: { organizationId: ctx.organizationId },
    });

    // Simulated: if config exists and has an API key, we consider it "active" for the org
    return this.mockScripts.map((script) => {
      const provisioned = provisionedWorkflows.find((w) => w.path === script.path);
      return {
        ...script,
        isProvisioned: !!provisioned,
        settings: provisioned?.settings || {},
      };
    });
  }

  async provisionWorkflow(ctx: V2ApiContext, path: string, settings: any) {
    // Simulated: Ensure Windmill config exists for the org
    let config = await (
      this.prisma.client as any
    ).windmillConfiguration.findUnique({
      where: { organizationId: ctx.organizationId },
    });

    if (!config) {
      config = await (this.prisma.client as any).windmillConfiguration.create({
        data: {
          organizationId: ctx.organizationId,
          windmillApiKey:
            "simulated_key_" + Math.random().toString(36).substring(7),
          windmillBaseUrl: "https://windmill.internal",
          workspaceId: "ws_" + ctx.organizationId.substring(0, 8),
          workspaceName: "Org Workspace",
        },
      });
    }

    // In a real scenario, you'd save these settings somewhere or deploy the script to the workspace

    // Persist provisioned workflow
    await (this.prisma.client as any).windmillWorkflow.upsert({
      where: {
        organizationId_path: {
          organizationId: ctx.organizationId,
          path: path,
        },
      },
      update: {
        settings: settings,
        isActive: settings.enabled !== false,
      },
      create: {
        organizationId: ctx.organizationId,
        configId: config.id,
        path: path,
        name: this.mockScripts.find((s) => s.path === path)?.name || path,
        settings: settings,
        isActive: settings.enabled !== false,
      },
    });

    // Trigger immediate report for Stock Movement Report if it's being provisioned
    if (path === "f/dealio/stock_movement_report") {
      const recipients = settings.recipients || [];
      // Trigger in background
      this.stockReportService
        .generateAndSendReport(ctx.organizationId, recipients, 7)
        .catch((err) =>
          console.error("Failed to trigger immediate stock report:", err),
        );
    }

    return {
      success: true,
      message: `Workflow ${path} provisioned successfully`,
      configId: config.id,
    };
  }

  async triggerWorkflow(ctx: V2ApiContext, path: string, inputs: any) {
    const config = await (
      this.prisma.client as any
    ).windmillConfiguration.findUnique({
      where: { organizationId: ctx.organizationId },
    });

    if (!config) {
      throw new NotFoundException(
        "Windmill not configured for this organization",
      );
    }

    // Simulate an execution record
    const execution = await (
      this.prisma.client as any
    ).windmillExecution.create({
      data: {
        organizationId: ctx.organizationId,
        configId: config.id,
        jobId: "job_" + Math.random().toString(36).substring(7),
        scriptPath: path,
        dealioEventType: "MANUAL_TRIGGER",
        correlationId: "manual_" + Date.now(),
        status: "PENDING",
      },
    });

    // Simulate background processing
    setTimeout(async () => {
      await (this.prisma.client as any).windmillExecution.update({
        where: { id: execution.id },
        data: {
          status: "COMPLETED",
          result: {
            success: true,
            triggeredAt: new Date().toISOString(),
            inputs,
          },
          completedAt: new Date(),
        },
      });
    }, 2000);

    return execution;
  }

  async getExecutionHistory(ctx: V2ApiContext, scriptPath?: string) {
    return (this.prisma.client as any).windmillExecution.findMany({
      where: {
        organizationId: ctx.organizationId,
        ...(scriptPath ? { scriptPath } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }
}
