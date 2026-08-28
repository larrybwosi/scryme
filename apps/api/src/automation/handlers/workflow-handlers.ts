import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { WebhookDispatcherService } from "../webhook-dispatcher.service";

export interface WorkflowJobHandlerContext {
  organizationId: string;
  executionId: string;
  jobId: string;
  definitionConfig?: any;
  payload: any;
}

@Injectable()
export class WorkflowHandlers {
  private readonly logger = new Logger(WorkflowHandlers.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly webhookDispatcher: WebhookDispatcherService,
  ) {}

  async executeHandler(handler: string, ctx: WorkflowJobHandlerContext): Promise<any> {
    this.logger.log(`Executing handler '${handler}' for job ${ctx.jobId} (Org: ${ctx.organizationId})`);

    switch (handler) {
      case "lowstock_alert":
        return this.handleLowStockAlert(ctx);
      case "customer_onboarding":
        return this.handleCustomerOnboarding(ctx);
      case "outgoing_webhook":
        return this.handleOutgoingWebhook(ctx);
      case "event_trigger":
      default:
        return this.handleGenericEvent(ctx);
    }
  }

  private async handleLowStockAlert(ctx: WorkflowJobHandlerContext) {
    const threshold = ctx.definitionConfig?.threshold ?? ctx.payload?.threshold ?? 10;
    const notificationEmail = ctx.definitionConfig?.notificationEmail ?? ctx.payload?.notificationEmail ?? "alerts@example.com";
    const productId = ctx.payload?.productId;
    const currentStock = ctx.payload?.currentStock ?? 0;

    const isLowStock = currentStock < threshold;

    this.logger.log(`[LowStockAlert] Product ${productId}: stock ${currentStock}, threshold ${threshold}. Alert triggered: ${isLowStock}`);

    return {
      success: true,
      alertTriggered: isLowStock,
      details: {
        productId,
        currentStock,
        threshold,
        notificationEmail,
        timestamp: new Date().toISOString(),
      },
    };
  }

  private async handleCustomerOnboarding(ctx: WorkflowJobHandlerContext) {
    const customerId = ctx.payload?.customerId || ctx.payload?.id;
    const customerEmail = ctx.payload?.email;
    const customerName = ctx.payload?.name || "Valued Customer";
    const sendWelcomeEmail = ctx.definitionConfig?.sendWelcomeEmail ?? true;

    this.logger.log(`[CustomerOnboarding] Processing onboarding for ${customerEmail} (ID: ${customerId})`);

    return {
      success: true,
      welcomeEmailSent: sendWelcomeEmail,
      crmProfileCreated: true,
      details: {
        customerId,
        customerEmail,
        customerName,
        onboardedAt: new Date().toISOString(),
      },
    };
  }

  private async handleOutgoingWebhook(ctx: WorkflowJobHandlerContext) {
    const webhookId = ctx.payload?.webhookId;
    const targetUrl = ctx.payload?.endpointUrl || ctx.definitionConfig?.endpointUrl;
    const headers = ctx.payload?.headers || ctx.definitionConfig?.headers || {};
    const secret = ctx.payload?.secret || ctx.definitionConfig?.secret;
    const webhookData = ctx.payload?.data || ctx.payload;

    if (!targetUrl) {
      throw new Error("Outgoing webhook target URL is required");
    }

    return await this.webhookDispatcher.dispatchOutgoingWebhook({
      organizationId: ctx.organizationId,
      executionId: ctx.executionId,
      jobId: ctx.jobId,
      webhookId,
      endpointUrl: targetUrl,
      secret,
      headers,
      payload: webhookData,
    });
  }

  private async handleGenericEvent(ctx: WorkflowJobHandlerContext) {
    this.logger.log(`[GenericEvent] Processed payload for job ${ctx.jobId}`);
    return {
      success: true,
      event: ctx.payload?.eventType || "GENERIC_EVENT",
      processedAt: new Date().toISOString(),
      payload: ctx.payload,
    };
  }
}
