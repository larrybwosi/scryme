import { Injectable, NotFoundException, Logger, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateWorkflowDefinitionDto, TriggerWorkflowDto, CreateWebhookDto } from "./dto/automation.dto";
import * as crypto from "crypto";
import { WebhookDispatcherService } from "./webhook-dispatcher.service";

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly webhookDispatcher: WebhookDispatcherService,
  ) {}

  private readonly builtInDefinitions: CreateWorkflowDefinitionDto[] = [
    {
      key: "lowstock_alert",
      name: "Low Stock Alert Workflow",
      description: "Monitors product inventory stock levels and sends notification alerts when below threshold.",
      triggerType: "EVENT",
      config: { threshold: 10, notificationEmail: "procurement@example.com" },
    },
    {
      key: "customer_onboarding",
      name: "Customer Onboarding Workflow",
      description: "Sends welcome email and provisions CRM profile when a new customer registers.",
      triggerType: "EVENT",
      config: { sendWelcomeEmail: true, crmFolder: "New Leads" },
    },
    {
      key: "event_trigger",
      name: "Generic Event Driven Trigger",
      description: "Handles asynchronous event workflows and payload processing.",
      triggerType: "EVENT",
      config: {},
    },
  ];

  async getDefinitions(organizationId: string) {
    // Ensure built-in definitions are seeded for the org if missing
    await this.ensureBuiltInDefinitions(organizationId);

    return (this.prisma.client as any).workflowEngineDefinition.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });
  }

  async provisionDefinitions(organizationId: string, customConfigs?: Record<string, any>) {
    const results = [];
    for (const builtIn of this.builtInDefinitions) {
      const customConfig = customConfigs?.[builtIn.key] || {};
      const mergedConfig = {
        ...(builtIn.config || {}),
        ...customConfig,
      };

      const definition = await this.createDefinition(organizationId, {
        ...builtIn,
        config: mergedConfig,
      });
      results.push(definition);
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

  async triggerWorkflow(organizationId: string, dto: TriggerWorkflowDto) {
    let definition = await (this.prisma.client as any).workflowEngineDefinition.findUnique({
      where: {
        organizationId_key: {
          organizationId,
          key: dto.key,
        },
      },
    });

    if (!definition) {
      // Seed if it matches a built-in workflow
      const builtIn = this.builtInDefinitions.find((b) => b.key === dto.key);
      if (builtIn) {
        definition = await this.createDefinition(organizationId, builtIn);
      } else {
        throw new NotFoundException(`Workflow definition '${dto.key}' not found for organization.`);
      }
    }

    if (!definition.isActive) {
      throw new BadRequestException(`Workflow definition '${dto.key}' is inactive.`);
    }

    const correlationId = dto.correlationId || `corr_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const payload = dto.payload || {};

    // 1. Create Workflow Execution
    const execution = await (this.prisma.client as any).workflowEngineExecution.create({
      data: {
        organizationId,
        definitionId: definition.id,
        triggerEvent: dto.key,
        correlationId,
        status: "RUNNING",
        payload,
        startedAt: new Date(),
      },
    });

    // 2. Queue Job for processing
    const job = await (this.prisma.client as any).workflowEngineJob.create({
      data: {
        organizationId,
        executionId: execution.id,
        definitionId: definition.id,
        handler: dto.key,
        payload,
        status: "QUEUED",
      },
    });

    // 3. Create Audit Log
    await (this.prisma.client as any).workflowEngineAuditLog.create({
      data: {
        organizationId,
        executionId: execution.id,
        jobId: job.id,
        action: "EXECUTION_STARTED",
        level: "INFO",
        details: { key: dto.key, correlationId },
      },
    });

    return {
      execution,
      job,
    };
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

    // Verify signature if secret configured
    if (webhook.secret) {
      const signatureHeader = headers["x-workflow-signature"] || headers["X-Workflow-Signature"];
      const rawBody = typeof body === "string" ? body : JSON.stringify(body);
      const isValid = this.webhookDispatcher.verifyIncomingSignature(webhook.secret, rawBody, signatureHeader);
      if (!isValid) {
        throw new BadRequestException("Invalid webhook signature.");
      }
    }

    // Queue execution for incoming webhook
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

  private async ensureBuiltInDefinitions(organizationId: string) {
    for (const def of this.builtInDefinitions) {
      const existing = await (this.prisma.client as any).workflowEngineDefinition.findUnique({
        where: {
          organizationId_key: {
            organizationId,
            key: def.key,
          },
        },
      });

      if (!existing) {
        await (this.prisma.client as any).workflowEngineDefinition.create({
          data: {
            organizationId,
            ...def,
          },
        });
      }
    }
  }
}
