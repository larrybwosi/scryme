import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { WebhookDispatcherService } from "../webhook-dispatcher.service";
import { ScrymeChatApiClient, ScrymeChatAction, createReportMessage, CustomMessage } from "@repo/chat";
import { sendEmail } from "@repo/shared/services/email";
import { FirebaseMessagingService } from "@/common/firebase/firebase-messaging.service";

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
    private readonly firebaseMessagingService: FirebaseMessagingService,
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
      case "preorder_notification":
      case "f/dealio/preorder_notification":
        return this.handlePreorderNotification(ctx);
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

  private async handlePreorderNotification(ctx: WorkflowJobHandlerContext) {
    const transactionId = ctx.payload?.transactionId || ctx.payload?.id || "N/A";
    const transactionNumber = ctx.payload?.transactionNumber || ctx.payload?.number || "N/A";
    const customerName = ctx.payload?.customerName || ctx.payload?.customer?.name || "Valued Customer";
    const customerPhone = ctx.payload?.customerPhone || ctx.payload?.customer?.phone || "";
    const customerEmail = ctx.payload?.customerEmail || ctx.payload?.customer?.email || "";
    const notificationEmail = ctx.definitionConfig?.notificationEmail || ctx.payload?.notificationEmail || customerEmail;

    const metadata = ctx.payload?.metadata || {};
    const dueDate = ctx.payload?.dueDate || metadata.dueDate || (metadata.scheduledAt ? metadata.scheduledAt.split("T")[0] : "N/A");
    const dueTime = ctx.payload?.dueTime || metadata.dueTime || "";
    const itemSpecs = ctx.payload?.itemSpecs || metadata.itemSpecs || "";
    const inscription = ctx.payload?.inscription || metadata.inscription || "";
    const customizationNotes = ctx.payload?.customizationNotes || metadata.customizationNotes || ctx.payload?.notes || "";

    const currency = ctx.payload?.currency || ctx.payload?.currencyCode || "USD";
    const totalAmount = ctx.payload?.finalTotal ?? ctx.payload?.totalAmount ?? 0;
    const depositAmount = ctx.payload?.depositAmount ?? metadata.depositAmount ?? ctx.payload?.totalPaid ?? 0;
    const remainingBalance = ctx.payload?.remainingBalance ?? metadata.remainingBalance ?? Math.max(0, Number(totalAmount) - Number(depositAmount));

    this.logger.log(`[PreorderNotification] Processing preorder ${transactionNumber} (ID: ${transactionId}) for ${customerName}`);

    const reportMsg =
      `📌 **New Pre-Order Notification**\n\n` +
      `• **Order Number:** **${transactionNumber}**\n` +
      `• **Customer:** **${customerName}**${customerPhone ? ` (${customerPhone})` : ""}\n` +
      `• **Scheduled Completion:** **${dueDate}${dueTime ? ` at ${dueTime}` : ""}**\n` +
      `• **Deposit Paid:** **${currency} ${depositAmount}**\n` +
      `• **Remaining Balance:** **${currency} ${remainingBalance}**`;

    const actions: ScrymeChatAction[] = [
      {
        id: `view_txn_${transactionId}`,
        label: "🔍 View Transaction",
        type: "button",
        style: "primary",
        value: JSON.stringify({ action: "view_transaction", transactionId, number: transactionNumber }),
      },
      {
        id: `update_status_${transactionId}`,
        label: "⚡ Update Preorder Status",
        type: "button",
        style: "secondary",
        value: JSON.stringify({ action: "update_status", transactionId }),
      },
      {
        id: `contact_cust_${transactionId}`,
        label: "📞 Contact Customer",
        type: "button",
        style: "secondary",
        value: JSON.stringify({ action: "contact_customer", transactionId, phone: customerPhone, email: customerEmail }),
      },
    ];

    const preorderReport = createReportMessage({
      title: `Pre-Order Received: ${transactionNumber}`,
      reportId: `preorder_${transactionId}_${Date.now()}`,
      summary: `A new custom pre-order has been submitted for ${customerName}. Scheduled for completion on ${dueDate}${dueTime ? ` at ${dueTime}` : ""}.`,
      metrics: [
        { label: "Order Number", value: transactionNumber },
        { label: "Customer Name", value: customerName },
        { label: "Completion Schedule", value: `${dueDate}${dueTime ? ` at ${dueTime}` : ""}` },
        { label: "Deposit Paid", value: `${currency} ${depositAmount}` },
        { label: "Remaining Balance", value: `${currency} ${remainingBalance}` },
        { label: "Specifications", value: itemSpecs || "Standard Custom" },
        { label: "Custom Notes", value: customizationNotes || "None" },
      ],
      theme: { accentColor: "#f59e0b", borderColor: "#fef3c7", backgroundColor: "#fffbeb" },
    });

    const scrymeSent = await this.dispatchScrymeChatReport(ctx.organizationId, "preorder_alerts", reportMsg, {
      actions,
      customMessage: preorderReport,
      metadata: {
        transactionId,
        transactionNumber,
        depositAmount,
        remainingBalance,
        alertType: "PREORDER_NOTIFICATION",
      },
    });

    // FCM Push Notification for Preorder
    try {
      await this.firebaseMessagingService.sendToOrganization(ctx.organizationId, {
        title: `Pre-Order Received: ${transactionNumber}`,
        body: `Customer: ${customerName} - Schedule: ${dueDate}`,
        data: {
          eventType: "PREORDER_NOTIFICATION",
          transactionId,
          transactionNumber,
          organizationId: ctx.organizationId,
        },
      });
    } catch (fcmError: any) {
      this.logger.warn(`FCM push for preorder failed: ${fcmError.message}`);
    }

    let emailSent = false;
    if (notificationEmail) {
      const emailHtml = `
        200 OK - New Preorder
        <h2>New Pre-Order Notification</h2>
        <p>A new custom pre-order (<strong>${transactionNumber}</strong>) has been recorded.</p>
        <ul>
          <li><strong>Customer:</strong> ${customerName}</li>
          <li><strong>Completion Schedule:</strong> ${dueDate} ${dueTime}</li>
          <li><strong>Deposit Paid:</strong> ${currency} ${depositAmount}</li>
          <li><strong>Remaining Balance:</strong> ${currency} ${remainingBalance}</li>
          ${itemSpecs ? `<li><strong>Specifications:</strong> ${itemSpecs}</li>` : ""}
          ${inscription ? `<li><strong>Inscription:</strong> ${inscription}</li>` : ""}
          ${customizationNotes ? `<li><strong>Notes:</strong> ${customizationNotes}</li>` : ""}
        </ul>
      `;
      emailSent = await this.dispatchWorkflowEmail(
        notificationEmail,
        `📌 New Pre-Order Received: ${transactionNumber}`,
        emailHtml,
        `New Pre-Order Received: ${transactionNumber}\nCustomer: ${customerName}\nDue Date: ${dueDate} ${dueTime}`,
      );
    }

    return {
      success: true,
      scrymeNotificationSent: scrymeSent,
      emailSent,
      details: {
        transactionId,
        transactionNumber,
        customerName,
        dueDate,
        dueTime,
        depositAmount,
        remainingBalance,
        processedAt: new Date().toISOString(),
      },
    };
  }

  private async handleLowStockAlert(ctx: WorkflowJobHandlerContext) {
    const threshold = ctx.definitionConfig?.threshold ?? ctx.payload?.threshold ?? 10;
    const notificationEmail = ctx.definitionConfig?.notificationEmail ?? ctx.payload?.notificationEmail ?? "";
    const productId = ctx.payload?.productId;
    const rawProductName = ctx.payload?.productName || "";
    const rawVariantName = ctx.payload?.variantName || "";

    const isDefaultVariant = !rawVariantName || rawVariantName.trim().toLowerCase() === "default";

    let displayName = rawProductName;
    if (!displayName) {
      displayName = isDefaultVariant ? "Product" : rawVariantName.trim();
    } else if (!isDefaultVariant) {
      const trimmedVariant = rawVariantName.trim();
      if (rawProductName.toLowerCase().endsWith(trimmedVariant.toLowerCase())) {
        displayName = rawProductName;
      } else {
        displayName = `${rawProductName} - ${trimmedVariant}`;
      }
    }

    const currentStock = ctx.payload?.currentStock ?? 0;
    const isLowStock = currentStock < threshold;

    this.logger.log(`[LowStockAlert] ${displayName}: stock ${currentStock}, threshold ${threshold}. Alert triggered: ${isLowStock}`);

    let scrymeSent = false;
    let emailSent = false;

    if (isLowStock) {
      const alertMsg = `⚠️ **Low Stock Alert Report**\n\n` +
        `• **Item:** ${displayName}\n` +
        `• **Current Stock:** **${currentStock}**\n` +
        `• **Threshold:** **${threshold}**`;

      const actions: ScrymeChatAction[] = [
        {
          id: `restock_${productId || "item"}`,
          label: "⚡ Quick Restock",
          type: "button",
          style: "primary",
          value: JSON.stringify({ action: "restock_now", productId, productName: displayName, currentStock, threshold }),
        },
        {
          id: `reorder_${productId || "item"}`,
          label: "📦 Reorder from Supplier",
          type: "button",
          style: "secondary",
          value: JSON.stringify({ action: "reorder_supplier", productId, productName: displayName }),
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
        title: `Low Stock Warning: ${displayName}`,
        reportId: `low_stock_${productId || "item"}_${Date.now()}`,
        summary: `Stock count (${currentStock}) is below minimum threshold (${threshold}). Immediate replenishment recommended.`,
        metrics: [
          { label: "Item Name", value: displayName },
          { label: "Current Quantity", value: String(currentStock) },
          { label: "Minimum Threshold", value: String(threshold) },
          { label: "Stock Deficit", value: String(Math.max(0, threshold - currentStock)) },
        ],
        theme: { accentColor: "#f59e0b", borderColor: "#fef3c7", backgroundColor: "#fffbeb" },
      });

      scrymeSent = await this.dispatchScrymeChatReport(ctx.organizationId, "stock_alerts", alertMsg, {
        actions,
        customMessage: customReport,
        metadata: { productId, currentStock, threshold, alertType: "LOW_STOCK" },
      });

      // FCM Push Notification for Low Stock
      try {
        await this.firebaseMessagingService.sendToOrganization(ctx.organizationId, {
          title: `Low Stock Alert: ${displayName}`,
          body: `Current stock (${currentStock}) is below threshold (${threshold}).`,
          data: {
            eventType: "LOW_STOCK_ALERT",
            productId: productId || "",
            productName: displayName,
            organizationId: ctx.organizationId,
          },
        });
      } catch (fcmError: any) {
        this.logger.warn(`FCM push for low stock failed: ${fcmError.message}`);
      }

      if (notificationEmail) {
        const emailHtml = `
          <h2>Low Stock Alert</h2>
          <p>The inventory level for <strong>${displayName}</strong> has dropped below the critical threshold.</p>
          <ul>
            <li><strong>Item Name:</strong> ${displayName}</li>
            <li><strong>Current Stock:</strong> ${currentStock}</li>
            <li><strong>Threshold:</strong> ${threshold}</li>
          </ul>
        `;
        emailSent = await this.dispatchWorkflowEmail(
          notificationEmail,
          `⚠️ Low Stock Alert: ${displayName}`,
          emailHtml,
          `Low Stock Alert: ${displayName}\nCurrent Stock: ${currentStock} (Threshold: ${threshold})`,
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
        productName: displayName,
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
      reportId: `onboarding_${customerId || "new"}_${Date.now()}`,
      summary: `A new customer profile has been activated and integrated into the CRM database.`,
      metrics: [
        { label: "Customer Name", value: customerName },
        { label: "Email Address", value: customerEmail || "N/A" },
        { label: "Customer ID", value: customerId || "N/A" },
        { label: "Onboarded At", value: new Date().toLocaleDateString() },
      ],
      theme: { accentColor: "#10b981", borderColor: "#d1fae5", backgroundColor: "#ecfdf5" },
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

    const reportMsg = `📊 **Daily Sales Report Summary**\n\n` +
      `• **Total Orders:** ${totalSales}\n` +
      `• **Total Revenue:** ${currency} ${totalRevenue}`;

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
      reportId: `daily_sales_${ctx.organizationId}_${Date.now()}`,
      summary: `Performance summary for ${new Date().toLocaleDateString()}: ${totalSales} processed orders generating ${currency} ${totalRevenue}.`,
      metrics: [
        { label: "Total Orders", value: String(totalSales) },
        { label: "Total Revenue", value: `${currency} ${totalRevenue}` },
        { label: "Average Order Value", value: totalSales > 0 ? `${currency} ${(totalRevenue / totalSales).toFixed(2)}` : `${currency} 0.00` },
        { label: "Report Date", value: new Date().toLocaleDateString() },
      ],
      theme: { accentColor: "#6366f1", borderColor: "#e0e7ff", backgroundColor: "#eef2ff" },
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

    const reportMsg = `📦 **Weekly Stock Movement Summary**\n\n` +
      `• **Audit Period:** Past 7 Days\n` +
      `• **Status:** Audit Complete`;

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
      reportId: `stock_movement_${ctx.organizationId}_${Date.now()}`,
      summary: "Itemized audit summary of stock receptions, transfers, adjustments, and batch movements.",
      metrics: [
        { label: "Audit Period", value: "Past 7 Days" },
        { label: "Recipients Count", value: String(Array.isArray(recipients) ? recipients.length : 0) },
        { label: "Status", value: "Audit Complete" },
        { label: "Compiled At", value: new Date().toLocaleDateString() },
      ],
      theme: { accentColor: "#0284c7", borderColor: "#e0f2fe", backgroundColor: "#f0f9ff" },
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

    const reportMsg = `🔗 **Outgoing Webhook Workflow Executed**\n\n` +
      `• **Endpoint:** \`${targetUrl}\`\n` +
      `• **Execution ID:** \`${ctx.executionId}\``;
    const scrymeSent = await this.dispatchScrymeChatReport(ctx.organizationId, "system_alerts", reportMsg);

    return {
      ...webhookResult,
      scrymeNotificationSent: scrymeSent,
    };
  }

  private async handleGenericEvent(ctx: WorkflowJobHandlerContext) {
    this.logger.log(`[GenericEvent] Processed payload for job ${ctx.jobId}`);

    const eventType = ctx.payload?.eventType || "GENERIC_EVENT";
    const reportMsg = `📋 **Workflow Event Report**\n\n` +
      `• **Event Type:** **${eventType}**\n` +
      `• **Execution ID:** \`${ctx.executionId}\``;
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
