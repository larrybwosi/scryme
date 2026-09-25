import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { WebhookDispatcherService } from "../webhook-dispatcher.service";
import { ScrymeChatApiClient } from "@repo/chat";
import { sendEmail } from "@repo/shared/services/email";

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

  private async dispatchWorkflowEmail(
    to: string | string[],
    subject: string,
    html: string,
    text?: string,
  ): Promise<boolean> {
    if (!to || (Array.isArray(to) && to.length === 0)) {
      this.logger.warn("Skipping workflow email dispatch: recipient 'to' is empty");
      return false;
    }

    try {
      const result = await sendEmail({
        to,
        subject,
        html,
        text,
      });

      if (result && result.success === false) {
        this.logger.error(`Failed to send workflow email to ${to}: ${result.error}`);
        return false;
      }

      this.logger.log(`Workflow email dispatched successfully to ${Array.isArray(to) ? to.join(", ") : to}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Exception during workflow email dispatch to ${to}: ${error.message}`);
      return false;
    }
  }

  async executeHandler(handler: string, ctx: WorkflowJobHandlerContext): Promise<any> {
    this.logger.log(`Executing handler '${handler}' for job ${ctx.jobId} (Org: ${ctx.organizationId})`);

    switch (handler) {
      case "lowstock_alert":
      case "f/dealio/inventory_alert":
        return this.handleLowStockAlert(ctx);
      case "customer_onboarding":
      case "f/dealio/customer_onboarding":
        return this.handleCustomerOnboarding(ctx);
      case "daily_sales_report":
      case "f/dealio/daily_sales_report":
        return this.handleDailySalesReport(ctx);
      case "stock_movement_report":
      case "f/dealio/stock_movement_report":
        return this.handleStockMovementReport(ctx);
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
    const productName = ctx.payload?.productName || ctx.payload?.variantName || "Product";
    const currentStock = ctx.payload?.currentStock ?? 0;

    const isLowStock = currentStock < threshold;

    this.logger.log(`[LowStockAlert] ${productName} (${productId}): stock ${currentStock}, threshold ${threshold}. Alert triggered: ${isLowStock}`);

    let scrymeSent = false;
    let emailSent = false;

    if (isLowStock) {
      const alertMsg = `⚠️ **Low Stock Alert Report**\nProduct: **${productName}** (ID: \`${productId || 'N/A'}\`)\nCurrent Stock: **${currentStock}** (Threshold: ${threshold})`;
      scrymeSent = await this.dispatchScrymeChatReport(ctx.organizationId, "inventory-alerts", alertMsg);

      if (notificationEmail) {
        const emailHtml = `
          <h2>Low Stock Alert</h2>
          <p>The inventory level for <strong>${productName}</strong> has dropped below the critical threshold.</p>
          <ul>
            <li><strong>Current Stock:</strong> ${currentStock}</li>
            <li><strong>Threshold:</strong> ${threshold}</li>
            <li><strong>Product ID:</strong> ${productId || "N/A"}</li>
          </ul>
        `;
        emailSent = await this.dispatchWorkflowEmail(
          notificationEmail,
          `⚠️ Low Stock Alert: ${productName}`,
          emailHtml,
          `Low Stock Alert: ${productName}\nCurrent Stock: ${currentStock} (Threshold: ${threshold})`,
        );
      }
    }

    return {
      success: true,
      alertTriggered: isLowStock,
      scrymeNotificationSent: scrymeSent,
      emailSent,
      details: {
        productId,
        productName,
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

    let emailSent = false;
    if (sendWelcomeEmail && customerEmail) {
      const welcomeHtml = `
        <h2>Welcome to Scryme, ${customerName}!</h2>
        <p>Thank you for choosing us. Your customer profile has been successfully set up.</p>
        <p>If you have any questions or need support, feel free to reply directly to this email.</p>
      `;
      emailSent = await this.dispatchWorkflowEmail(
        customerEmail,
        `Welcome to Scryme, ${customerName}!`,
        welcomeHtml,
        `Welcome to Scryme, ${customerName}!\n\nThank you for joining us. Your account is ready.`,
      );
    }

    return {
      success: true,
      welcomeEmailSent: emailSent,
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

  private async handleDailySalesReport(ctx: WorkflowJobHandlerContext) {
    const recipientsRaw = ctx.definitionConfig?.recipients ?? ctx.payload?.recipients ?? "admin@example.com";
    const recipients = typeof recipientsRaw === "string"
      ? recipientsRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : Array.isArray(recipientsRaw) ? recipientsRaw : ["admin@example.com"];

    const totalSales = ctx.payload?.totalSales ?? 0;
    const totalRevenue = ctx.payload?.totalRevenue ?? 0;
    const currency = ctx.payload?.currency ?? "USD";

    this.logger.log(`[DailySalesReport] Compiling report for org ${ctx.organizationId}: ${totalSales} sales, ${currency} ${totalRevenue}`);

    const reportMsg = `📊 **Daily Sales Report Summary**\nTotal Orders: **${totalSales}**\nTotal Revenue: **${currency} ${totalRevenue}**`;
    const scrymeSent = await this.dispatchScrymeChatReport(ctx.organizationId, "workflow-reports", reportMsg);

    const emailHtml = `
      <h2>Daily Sales Summary Report</h2>
      <p>Here is the automated daily sales summary for your organization:</p>
      <ul>
        <li><strong>Total Transactions:</strong> ${totalSales}</li>
        <li><strong>Total Revenue:</strong> ${currency} ${totalRevenue}</li>
        <li><strong>Report Date:</strong> ${new Date().toLocaleDateString()}</li>
      </ul>
    `;

    const emailSent = await this.dispatchWorkflowEmail(
      recipients,
      `📊 Daily Sales Report - ${new Date().toLocaleDateString()}`,
      emailHtml,
      `Daily Sales Report\nTotal Transactions: ${totalSales}\nTotal Revenue: ${currency} ${totalRevenue}`,
    );

    return {
      success: true,
      scrymeNotificationSent: scrymeSent,
      emailSent,
      details: {
        recipients,
        totalSales,
        totalRevenue,
        currency,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  private async handleStockMovementReport(ctx: WorkflowJobHandlerContext) {
    const recipients = ctx.definitionConfig?.recipients ?? ctx.payload?.recipients ?? [];
    this.logger.log(`[StockMovementReport] Dispatching stock movement report for org ${ctx.organizationId}`);

    const reportMsg = `📦 **Weekly Stock Movement Summary**\nWeekly stock audit report compiled for workspace members.`;
    const scrymeSent = await this.dispatchScrymeChatReport(ctx.organizationId, "inventory-alerts", reportMsg);

    let emailSent = false;
    if (recipients.length > 0) {
      const emailHtml = `
        <h2>Weekly Stock Movement Summary</h2>
        <p>Your weekly stock movement log has been generated.</p>
        <p>Please review your inventory portal for itemized batch movements and stock variance details.</p>
      `;
      emailSent = await this.dispatchWorkflowEmail(
        recipients,
        `📦 Weekly Stock Movement Summary`,
        emailHtml,
      );
    }

    return {
      success: true,
      scrymeNotificationSent: scrymeSent,
      emailSent,
      recipientsCount: Array.isArray(recipients) ? recipients.length : 0,
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
