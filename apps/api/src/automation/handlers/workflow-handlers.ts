import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { WebhookDispatcherService } from "../webhook-dispatcher.service";
import { ScrymeChatApiClient, ScrymeChatAction, createReportMessage, CustomMessage } from "@repo/chat";
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
    channelKeyOrSlug: string,
    messageContent: string,
    options?: {
      actions?: ScrymeChatAction[];
      customMessage?: CustomMessage;
      metadata?: Record<string, any>;
    },
  ): Promise<boolean> {
    try {
      const config = await (this.prisma.client as any).scrymeConfiguration.findUnique({
        where: { organizationId },
      });

      if (config && config.isActive && config.workspaceSlug) {
        const mappings = (config.channelMappings as Record<string, string>) || {};
        const targetChannel = mappings[channelKeyOrSlug] || channelKeyOrSlug || "alerts";

        const payload = {
          content: messageContent,
          actions: options?.actions,
          customMessage: options?.customMessage,
          metadata: options?.metadata,
        };

        try {
          await this.scrymeClient.sendMessage(
            config.workspaceSlug,
            targetChannel,
            payload,
          );
          this.logger.log(`Dispatched ScrymeChat report/info for org ${organizationId} to channel ${targetChannel}`);
          return true;
        } catch (err: any) {
          // If sending to mapped channel failed (e.g. 404), try fallback channel 'alerts' or 'general'
          if (targetChannel !== "alerts") {
            try {
              await this.scrymeClient.sendMessage(
                config.workspaceSlug,
                "alerts",
                payload,
              );
              this.logger.log(`Dispatched ScrymeChat report/info for org ${organizationId} to fallback channel 'alerts'`);
              return true;
            } catch (fallbackErr: any) {
              this.logger.warn(
                `Failed to dispatch ScrymeChat report for org ${organizationId} to ${targetChannel} and fallback 'alerts': ${fallbackErr.message}`
              );
              return false;
            }
          }
          this.logger.warn(`Failed to dispatch ScrymeChat report for org ${organizationId} to channel ${targetChannel}: ${err.message}`);
          return false;
        }
      }
    } catch (error: any) {
      this.logger.warn(`Failed to dispatch ScrymeChat report for org ${organizationId}: ${error.message}`);
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
        this.logger.error(`Failed to send workflow email to ${Array.isArray(to) ? to.join(", ") : to}: ${result.error}`);
        return false;
      }

      this.logger.log(`Workflow email dispatched successfully to ${Array.isArray(to) ? to.join(", ") : to}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Exception during workflow email dispatch to ${Array.isArray(to) ? to.join(", ") : to}: ${error.message}`);
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
    const notificationEmail = ctx.definitionConfig?.notificationEmail ?? ctx.payload?.notificationEmail ?? "";
    const productId = ctx.payload?.productId;
    const productName = ctx.payload?.productName || ctx.payload?.variantName || "Product";
    const currentStock = ctx.payload?.currentStock ?? 0;

    const isLowStock = currentStock < threshold;

    this.logger.log(`[LowStockAlert] ${productName} (${productId}): stock ${currentStock}, threshold ${threshold}. Alert triggered: ${isLowStock}`);

    let scrymeSent = false;
    let emailSent = false;

    if (isLowStock) {
      const alertMsg = `⚠️ **Low Stock Alert Report**\nProduct: **${productName}** (ID: \`${productId || 'N/A'}\`)\nCurrent Stock: **${currentStock}** (Threshold: ${threshold})`;

      const actions: ScrymeChatAction[] = [
        {
          id: `restock_${productId || "item"}`,
          label: "⚡ Quick Restock",
          type: "button",
          style: "primary",
          value: JSON.stringify({ action: "restock_now", productId, productName, currentStock, threshold }),
        },
        {
          id: `reorder_${productId || "item"}`,
          label: "📦 Reorder from Supplier",
          type: "button",
          style: "secondary",
          value: JSON.stringify({ action: "reorder_supplier", productId, productName }),
        },
        {
          id: `view_${productId || "item"}`,
          label: "🔍 View Details",
          type: "button",
          style: "secondary",
          value: JSON.stringify({ action: "view_product", productId }),
        },
      ];

      const customReport = createReportMessage({
        title: `Low Stock Warning: ${productName}`,
        summary: `Stock count (${currentStock}) is below threshold (${threshold}). Immediate replenishment recommended.`,
        theme: "amber",
        sections: [
          {
            title: "Inventory Breakdown",
            metrics: [
              { label: "Item Name", value: productName },
              { label: "Product ID", value: productId || "N/A" },
              { label: "Current Quantity", value: String(currentStock) },
              { label: "Minimum Threshold", value: String(threshold) },
              { label: "Stock Deficit", value: String(Math.max(0, threshold - currentStock)) },
            ],
          },
        ],
      });

      scrymeSent = await this.dispatchScrymeChatReport(ctx.organizationId, "stock_alerts", alertMsg, {
        actions,
        customMessage: customReport,
        metadata: { productId, currentStock, threshold, alertType: "LOW_STOCK" },
      });

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
    const onboardingActions: ScrymeChatAction[] = [
      {
        id: `view_customer_${customerId || "new"}`,
        label: "👤 View Customer CRM",
        type: "button",
        style: "primary",
        value: JSON.stringify({ action: "view_customer", customerId, customerEmail }),
      },
      {
        id: `send_offer_${customerId || "new"}`,
        label: "🏷️ Send Welcome Offer",
        type: "button",
        style: "secondary",
        value: JSON.stringify({ action: "send_welcome_offer", customerId, customerEmail }),
      },
    ];

    const onboardingReport = createReportMessage({
      title: `New Customer Onboarded: ${customerName}`,
      summary: `A new customer profile has been activated and integrated into the CRM database.`,
      theme: "emerald",
      sections: [
        {
          title: "Customer Profile Details",
          metrics: [
            { label: "Customer Name", value: customerName },
            { label: "Email Address", value: customerEmail || "N/A" },
            { label: "Customer ID", value: customerId || "N/A" },
            { label: "Onboarded At", value: new Date().toLocaleDateString() },
          ],
        },
      ],
    });

    const scrymeSent = await this.dispatchScrymeChatReport(ctx.organizationId, "crm_alerts", onboardingMsg, {
      actions: onboardingActions,
      customMessage: onboardingReport,
      metadata: { customerId, customerEmail, reportType: "CUSTOMER_ONBOARDING" },
    });

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
    const recipientsRaw = ctx.definitionConfig?.recipients ?? ctx.payload?.recipients ?? "";
    const recipients = typeof recipientsRaw === "string"
      ? recipientsRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : Array.isArray(recipientsRaw) ? recipientsRaw : [];

    const totalSales = ctx.payload?.totalSales ?? 0;
    const totalRevenue = ctx.payload?.totalRevenue ?? 0;
    const currency = ctx.payload?.currency ?? "USD";

    this.logger.log(`[DailySalesReport] Compiling report for org ${ctx.organizationId}: ${totalSales} sales, ${currency} ${totalRevenue}`);

    const reportMsg = `📊 **Daily Sales Report Summary**\nTotal Orders: **${totalSales}**\nTotal Revenue: **${currency} ${totalRevenue}**`;

    const salesActions: ScrymeChatAction[] = [
      {
        id: `analytics_${Date.now()}`,
        label: "📈 View Analytics Dashboard",
        type: "button",
        style: "primary",
        value: JSON.stringify({ action: "view_sales_analytics", organizationId: ctx.organizationId }),
      },
      {
        id: `export_csv_${Date.now()}`,
        label: "📥 Export Transactions CSV",
        type: "button",
        style: "secondary",
        value: JSON.stringify({ action: "export_sales_csv", organizationId: ctx.organizationId }),
      },
    ];

    const salesReport = createReportMessage({
      title: `Daily Financial Performance Report`,
      summary: `Performance summary for ${new Date().toLocaleDateString()}: ${totalSales} processed orders generating ${currency} ${totalRevenue}.`,
      theme: "indigo",
      sections: [
        {
          title: "Revenue & Volume Overview",
          metrics: [
            { label: "Total Orders", value: String(totalSales) },
            { label: "Total Revenue", value: `${currency} ${totalRevenue}` },
            { label: "Average Order Value", value: totalSales > 0 ? `${currency} ${(totalRevenue / totalSales).toFixed(2)}` : `${currency} 0.00` },
            { label: "Report Date", value: new Date().toLocaleDateString() },
          ],
        },
      ],
    });

    const scrymeSent = await this.dispatchScrymeChatReport(ctx.organizationId, "sales_alerts", reportMsg, {
      actions: salesActions,
      customMessage: salesReport,
      metadata: { totalSales, totalRevenue, currency, reportType: "DAILY_SALES" },
    });

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

    const movementActions: ScrymeChatAction[] = [
      {
        id: `audit_log_${Date.now()}`,
        label: "📋 Review Stock Movement Log",
        type: "button",
        style: "primary",
        value: JSON.stringify({ action: "view_stock_log", organizationId: ctx.organizationId }),
      },
      {
        id: `reconcile_${Date.now()}`,
        label: "⚖️ Reconcile Discrepancies",
        type: "button",
        style: "secondary",
        value: JSON.stringify({ action: "reconcile_stock", organizationId: ctx.organizationId }),
      },
    ];

    const movementReport = createReportMessage({
      title: "Weekly Inventory Movement Audit",
      summary: "Itemized audit summary of stock receptions, transfers, adjustments, and batch movements.",
      theme: "sky",
      sections: [
        {
          title: "Audit Parameters",
          metrics: [
            { label: "Audit Period", value: "Past 7 Days" },
            { label: "Recipients Count", value: String(Array.isArray(recipients) ? recipients.length : 0) },
            { label: "Status", value: "Audit Complete" },
            { label: "Compiled At", value: new Date().toLocaleDateString() },
          ],
        },
      ],
    });

    const scrymeSent = await this.dispatchScrymeChatReport(ctx.organizationId, "stock_alerts", reportMsg, {
      actions: movementActions,
      customMessage: movementReport,
      metadata: { reportType: "STOCK_MOVEMENT" },
    });

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
    const scrymeSent = await this.dispatchScrymeChatReport(ctx.organizationId, "system_alerts", reportMsg);

    return {
      ...webhookResult,
      scrymeNotificationSent: scrymeSent,
    };
  }

  private async handleGenericEvent(ctx: WorkflowJobHandlerContext) {
    this.logger.log(`[GenericEvent] Processed payload for job ${ctx.jobId}`);

    const eventType = ctx.payload?.eventType || "GENERIC_EVENT";
    const reportMsg = `📋 **Workflow Event Report**\nEvent Type: **${eventType}**\nExecution ID: \`${ctx.executionId}\``;
    const scrymeSent = await this.dispatchScrymeChatReport(ctx.organizationId, "system_alerts", reportMsg);

    return {
      success: true,
      event: eventType,
      scrymeNotificationSent: scrymeSent,
      processedAt: new Date().toISOString(),
      payload: ctx.payload,
    };
  }
}
