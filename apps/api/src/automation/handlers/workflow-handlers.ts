import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { WebhookDispatcherService } from "../webhook-dispatcher.service";
import { ScrymeChatApiClient } from "@repo/chat";

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
  private readonly scrymeClient = new ScrymeChatApiClient();

  constructor(
    private readonly prisma: PrismaService,
    private readonly webhookDispatcher: WebhookDispatcherService,
  ) {}

  private async dispatchScrymeChatReport(
    organizationId: string,
    channelSlug: string,
    messageContent: string,
  ): Promise<boolean> {
    try {
      const config = await (this.prisma.client as any).scrymeConfiguration.findUnique({
        where: { organizationId },
      });

      if (config && config.isActive && config.workspaceSlug) {
        await this.scrymeClient.sendMessage(
          config.workspaceSlug,
          channelSlug || "notifications",
          { content: messageContent },
        );
        this.logger.log(`Dispatched ScrymeChat report/info for org ${organizationId} to channel ${channelSlug || "notifications"}`);
        return true;
      }
    } catch (error: any) {
      this.logger.error(`Failed to dispatch ScrymeChat report for org ${organizationId}: ${error.message}`);
    }
    return false;
  }

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

    let scrymeSent = false;
    if (isLowStock) {
      const alertMsg = `⚠️ **Low Stock Alert Report**\nProduct ID: \`${productId || 'N/A'}\`\nCurrent Stock: **${currentStock}** (Threshold: ${threshold})`;
      scrymeSent = await this.dispatchScrymeChatReport(ctx.organizationId, "inventory-alerts", alertMsg);
    }

    return {
      success: true,
      alertTriggered: isLowStock,
      scrymeNotificationSent: scrymeSent,
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

    const onboardingMsg = `🎉 **Customer Onboarding Report**\nNew Customer Onboarded: **${customerName}** (${customerEmail || 'N/A'})\nCustomer ID: \`${customerId || 'N/A'}\``;
    const scrymeSent = await this.dispatchScrymeChatReport(ctx.organizationId, "customer-onboarding", onboardingMsg);

    return {
      success: true,
      welcomeEmailSent: sendWelcomeEmail,
      scrymeNotificationSent: scrymeSent,
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

    const webhookResult = await this.webhookDispatcher.dispatchOutgoingWebhook({
      organizationId: ctx.organizationId,
      executionId: ctx.executionId,
      jobId: ctx.jobId,
      webhookId,
      endpointUrl: targetUrl,
      secret,
      headers,
      payload: webhookData,
    });

    const reportMsg = `🔗 **Outgoing Webhook Workflow Executed**\nEndpoint: \`${targetUrl}\`\nExecution ID: \`${ctx.executionId}\``;
    const scrymeSent = await this.dispatchScrymeChatReport(ctx.organizationId, "workflow-reports", reportMsg);

    return {
      ...webhookResult,
      scrymeNotificationSent: scrymeSent,
    };
  }

  private async handleGenericEvent(ctx: WorkflowJobHandlerContext) {
    this.logger.log(`[GenericEvent] Processed payload for job ${ctx.jobId}`);

    const eventType = ctx.payload?.eventType || "GENERIC_EVENT";
    const reportMsg = `📋 **Workflow Event Report**\nEvent Type: **${eventType}**\nExecution ID: \`${ctx.executionId}\``;
    const scrymeSent = await this.dispatchScrymeChatReport(ctx.organizationId, "workflow-reports", reportMsg);

    return {
      success: true,
      event: eventType,
      scrymeNotificationSent: scrymeSent,
      processedAt: new Date().toISOString(),
      payload: ctx.payload,
    };
  }
}
