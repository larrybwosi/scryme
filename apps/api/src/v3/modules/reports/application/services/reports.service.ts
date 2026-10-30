import { env } from "@repo/env";
import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { ScrymeService } from "@/v3/modules/scryme/scryme.service";
import { AiReportService, ReportSummaryData } from "./ai-report.service";
import { UpdateReportSettingsDto, GenerateReportDto } from "../../dto/reports.dto";
import { sendEmail } from "@repo/shared/services/email";
import { ScrymeChatApiClient } from "@repo/chat";

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);
  private readonly scrymeClient = new ScrymeChatApiClient();

  constructor(
    private readonly prisma: PrismaService,
    private readonly scrymeService: ScrymeService,
    private readonly aiReportService: AiReportService,
  ) {}

  async getReportSettings(organizationId: string) {
    let settings = await this.prisma.client.reportSettings.findUnique({
      where: { organizationId },
    });

    if (!settings) {
      const adminMembers = await this.prisma.client.member.findMany({
        where: { organizationId, role: { in: ["OWNER", "ADMIN"] as any[] } },
        select: { user: { select: { email: true } } },
      });

      const defaultEmails = adminMembers
        .map(m => m.user?.email)
        .filter((e): e is string => Boolean(e));

      settings = await this.prisma.client.reportSettings.create({
        data: {
          organizationId,
          emailEnabled: true,
          scrymeEnabled: true,
          recipients: defaultEmails,
          scrymeChannel: "reports",
          scheduleEnabled: true,
          frequency: "WEEKLY",
          dayOfWeek: 1,
          timeOfDay: "08:00",
          timezone: "UTC",
          includeSales: true,
          includeInventory: true,
          includeProduction: true,
          includeTax: true,
          includeAiInsights: true,
        },
      });
    }

    return settings;
  }

  async updateReportSettings(organizationId: string, dto: UpdateReportSettingsDto) {
    const existing = await this.getReportSettings(organizationId);

    return this.prisma.client.reportSettings.update({
      where: { id: existing.id },
      data: {
        ...dto,
      },
    });
  }

  async getReportsList(organizationId: string) {
    return this.prisma.client.report.findMany({
      where: { organizationId },
      orderBy: { generatedAt: "desc" },
      take: 20,
    });
  }

  async generateAndDispatchReport(organizationId: string, dto: GenerateReportDto, triggerUserEmail?: string) {
    // Bolt Optimization: Parallelize independent report settings lookup and organization details query.
    // Collapses pre-fetch latency from 2 sequential DB roundtrips down to 1 concurrent roundtrip.
    const [settings, org] = await Promise.all([
      this.getReportSettings(organizationId),
      this.prisma.client.organization.findUnique({
        where: { id: organizationId },
        select: { id: true, name: true, slug: true },
      }),
    ]);

    if (!org) {
      throw new NotFoundException(`Organization with ID ${organizationId} not found`);
    }

    const days = dto.days || 7;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Bolt Optimization: Parallelize sales, inventory, production, and tax metric queries.
    // Sequentially awaiting each section creates up to 4 consecutive DB query delays.
    // Executing enabled sections concurrently with Promise.all reduces query latency from O(N) to O(1).
    const [sales, inventory, production, tax] = await Promise.all([
      settings.includeSales ? this.getSalesMetrics(organizationId, startDate, endDate) : Promise.resolve(undefined),
      settings.includeInventory ? this.getInventoryMetrics(organizationId, startDate, endDate) : Promise.resolve(undefined),
      settings.includeProduction ? this.getProductionMetrics(organizationId, startDate, endDate) : Promise.resolve(undefined),
      settings.includeTax ? this.getTaxMetrics(organizationId, startDate, endDate) : Promise.resolve(undefined),
    ]);

    const summaryData: ReportSummaryData = {};
    if (sales) summaryData.sales = sales;
    if (inventory) summaryData.inventory = inventory;
    if (production) summaryData.production = production;
    if (tax) summaryData.tax = tax;

    let aiInsights = "";
    if (settings.includeAiInsights) {
      aiInsights = await this.aiReportService.generateExecutiveInsights(summaryData, org.name);
    }

    const reportData = {
      summary: summaryData,
      aiInsights,
      days,
      period: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
    };

    const savedReport = await this.prisma.client.report.create({
      data: {
        organizationId,
        type: "SALES_WEEKLY",
        data: reportData as any,
        summary: aiInsights,
        startDate,
        endDate,
        generatedById: (await this.getSystemOrAdminMemberId(organizationId)),
      },
    });

    const dispatchResults = {
      emailSent: false,
      scrymeSent: false,
      recipients: [] as string[],
      scrymeChannel: settings.scrymeChannel,
    };

    const shouldSendEmail = dto.sendEmail !== undefined ? dto.sendEmail : settings.emailEnabled;
    if (shouldSendEmail) {
      const emailList = [...new Set([...(settings.recipients || []), ...(triggerUserEmail ? [triggerUserEmail] : [])])];
      if (emailList.length > 0) {
        const htmlContent = this.buildHtmlEmailTemplate(org.name, summaryData, aiInsights, days, org.id);
        const emailRes = await sendEmail({
          to: emailList,
          subject: `📊 Executive Performance Report - ${org.name} (${days}-Day Summary)`,
          html: htmlContent,
        });
        dispatchResults.emailSent = emailRes.success;
        dispatchResults.recipients = emailList;
      }
    }

    const shouldSendScryme = dto.sendScryme !== undefined ? dto.sendScryme : settings.scrymeEnabled;
    if (shouldSendScryme) {
      const scrymeConfig = await this.scrymeService.getConfiguration(organizationId);
      if (scrymeConfig && scrymeConfig.workspaceSlug && scrymeConfig.isActive) {
        const markdownMessage = this.buildScrymeMarkdownMessage(org.name, summaryData, aiInsights, days, org.id);
        const channelSlug = settings.scrymeChannel || "reports";

        try {
          try {
            await this.scrymeClient.createChannel(
              scrymeConfig.workspaceSlug,
              "Executive Reports",
              channelSlug,
            );
          } catch (e: any) {}

          const webBaseUrl = env.NEXT_PUBLIC_APP_URL || env.NEXT_PUBLIC_WEB_URL || "https://app.scryme.tech";
          await this.scrymeClient.sendMessage(scrymeConfig.workspaceSlug, channelSlug, {
            content: markdownMessage,
            actions: [
              {
                id: "view_dashboard_reports",
                label: "📊 Open Web Dashboard",
                type: "button",
                style: "primary",
                value: `${webBaseUrl}/reports?orgId=${organizationId}`,
              },
            ],
          });
          dispatchResults.scrymeSent = true;
        } catch (error: any) {
          this.logger.error(`Failed to send report to ScrymeChat channel ${channelSlug}: ${error.message}`);
        }
      }
    }

    return {
      reportId: savedReport.id,
      organizationId,
      dispatched: dispatchResults,
      summary: summaryData,
      aiInsights,
    };
  }

  private async getSalesMetrics(organizationId: string, startDate: Date, endDate: Date) {
    const transactions = await this.prisma.client.transaction.findMany({
      where: {
        organizationId,
        createdAt: { gte: startDate, lte: endDate },
        status: { in: ["COMPLETED", "PAID"] as any[] },
      },
      select: {
        finalTotal: true,
        metadata: true,
      },
    });

    const totalRevenue = transactions.reduce((acc, t) => acc + Number(t.finalTotal || 0), 0);
    const transactionCount = transactions.length;

    const productSalesMap = new Map<string, { name: string; quantity: number; revenue: number }>();

    for (const t of transactions) {
      const metadata = t.metadata as any;
      if (metadata && Array.isArray(metadata.items)) {
        for (const item of metadata.items) {
          const name = item.name || item.productName || "Standard Item";
          const qty = Number(item.quantity || item.qty || 1);
          const price = Number(item.price || item.unitPrice || 0) * qty;

          const current = productSalesMap.get(name) || { name, quantity: 0, revenue: 0 };
          current.quantity += qty;
          current.revenue += price;
          productSalesMap.set(name, current);
        }
      }
    }

    const topProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalRevenue,
      transactionCount,
      topProducts,
    };
  }

  private async getInventoryMetrics(organizationId: string, startDate: Date, endDate: Date) {
    const movements = await this.prisma.client.stockMovement.findMany({
      where: {
        organizationId,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        movementType: true,
        quantity: true,
        variant: { select: { product: { select: { name: true } } } },
      },
    });

    let totalIn = 0;
    let totalOut = 0;
    const itemMap = new Map<string, { name: string; qty: number }>();

    const incomingTypes = ["PURCHASE_RECEIPT", "ADJUSTMENT_IN", "CUSTOMER_RETURN", "PRODUCTION_IN", "UNPACK_IN", "INITIAL_STOCK"];

    for (const m of movements) {
      const qty = Math.abs(Number(m.quantity || 0));
      const productName = m.variant?.product?.name || "Inventory Item";

      if (incomingTypes.includes(m.movementType as string)) {
        totalIn += qty;
      } else {
        totalOut += qty;
      }

      const current = itemMap.get(productName) || { name: productName, qty: 0 };
      current.qty += qty;
      itemMap.set(productName, current);
    }

    const topMovedItems = Array.from(itemMap.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return {
      totalIn,
      totalOut,
      topMovedItems,
    };
  }

  private async getProductionMetrics(organizationId: string, startDate: Date, endDate: Date) {
    const batches = await this.prisma.client.batch.findMany({
      where: {
        organizationId,
        completedAt: { gte: startDate, lte: endDate },
        status: "COMPLETED" as any,
      },
      select: {
        actualQuantity: true,
        wasteQuantity: true,
        recipe: {
          select: {
            name: true,
            systemUnit: { select: { symbol: true } },
            orgUnit: { select: { symbol: true } },
          },
        },
      },
    });

    const totalBatches = batches.length;
    const totalWaste = batches.reduce((acc, b) => acc + Number(b.wasteQuantity || 0), 0);

    const recipeMap = new Map<string, { name: string; quantity: number; unit: string }>();

    for (const b of batches) {
      const name = b.recipe?.name || "Recipe";
      const qty = Number(b.actualQuantity || 0);
      const unit = b.recipe?.systemUnit?.symbol || b.recipe?.orgUnit?.symbol || "units";

      const current = recipeMap.get(name) || { name, quantity: 0, unit };
      current.quantity += qty;
      recipeMap.set(name, current);
    }

    const topRecipes = Array.from(recipeMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return {
      totalBatches,
      totalWaste,
      topRecipes,
    };
  }

  private async getTaxMetrics(organizationId: string, startDate: Date, endDate: Date) {
    const [outputRes, inputRes] = await Promise.all([
      this.prisma.client.journalLine.aggregate({
        where: {
          journalEntry: {
            organizationId,
            status: "POSTED" as any,
            entryDate: { gte: startDate, lte: endDate },
            sourceType: "SALE" as any,
          },
          ledgerAccount: { subType: "TAX_PAYABLE" as any },
        },
        _sum: { credit: true },
      }),
      this.prisma.client.journalLine.aggregate({
        where: {
          journalEntry: {
            organizationId,
            status: "POSTED" as any,
            entryDate: { gte: startDate, lte: endDate },
            sourceType: { in: ["PURCHASE", "EXPENSE"] as any[] },
          },
          ledgerAccount: { subType: "TAX_PAYABLE" as any },
        },
        _sum: { debit: true },
      }),
    ]);

    const outputTax = Number(outputRes._sum.credit || 0);
    const inputTax = Number(inputRes._sum.debit || 0);

    return {
      outputTax,
      inputTax,
      netVatPayable: outputTax - inputTax,
    };
  }

  private async getSystemOrAdminMemberId(organizationId: string): Promise<string> {
    const member = await this.prisma.client.member.findFirst({
      where: { organizationId },
      select: { id: true },
    });
    return member?.id || "system";
  }

  private buildHtmlEmailTemplate(
    orgName: string,
    data: ReportSummaryData,
    aiInsights: string,
    days: number,
    orgId: string,
  ): string {
    const webBaseUrl = env.NEXT_PUBLIC_APP_URL || env.NEXT_PUBLIC_WEB_URL || "https://app.scryme.tech";

    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f4f5f7; margin: 0; padding: 20px; color: #1e293b; }
    .card { background: #ffffff; border-radius: 12px; max-width: 650px; margin: 0 auto; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .header { background: #4f46e5; color: #ffffff; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; }
    .content { padding: 24px; }
    .section { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
    .section-title { font-size: 16px; font-weight: 600; margin-top: 0; margin-bottom: 12px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; }
    .metric-grid { display: flex; gap: 12px; margin-bottom: 12px; }
    .metric { flex: 1; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; text-align: center; }
    .metric-val { font-size: 20px; font-weight: 700; color: #4f46e5; }
    .metric-lbl { font-size: 12px; color: #64748b; }
    ul { margin: 0; padding-left: 20px; }
    li { margin-bottom: 6px; font-size: 14px; }
    .ai-box { background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
    .ai-title { color: #4338ca; font-weight: 700; font-size: 15px; margin-top: 0; margin-bottom: 8px; }
    .footer { text-align: center; padding: 16px; font-size: 12px; color: #94a3b8; }
    .btn { display: inline-block; background: #4f46e5; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; margin-top: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>📊 Executive Performance Report</h1>
      <p style="margin: 6px 0 0; opacity: 0.9;">${orgName} • Past ${days} Days Summary</p>
    </div>
    <div class="content">
`;

    if (aiInsights) {
      html += `
      <div class="ai-box">
        <div class="ai-title">💡 Executive Insights & AI Analysis</div>
        <div style="font-size: 14px; line-height: 1.5; color: #1e1b4b;">
          ${aiInsights.replace(/\n/g, "<br/>")}
        </div>
      </div>
`;
    }

    if (data.sales) {
      html += `
      <div class="section">
        <div class="section-title">💰 Sales & Revenue</div>
        <div class="metric-grid">
          <div class="metric"><div class="metric-val">$${data.sales.totalRevenue.toFixed(2)}</div><div class="metric-lbl">Total Revenue</div></div>
          <div class="metric"><div class="metric-val">${data.sales.transactionCount}</div><div class="metric-lbl">Orders / Sales</div></div>
        </div>
`;
      if (data.sales.topProducts.length > 0) {
        html += `<strong>Top Sellers:</strong><ul>`;
        data.sales.topProducts.forEach(p => {
          html += `<li><strong>${p.name}</strong>: ${p.quantity} sold ($${p.revenue.toFixed(2)})</li>`;
        });
        html += `</ul>`;
      }
      html += `</div>`;
    }

    if (data.inventory) {
      html += `
      <div class="section">
        <div class="section-title">📦 Inventory & Stock Movement</div>
        <div class="metric-grid">
          <div class="metric"><div class="metric-val">${data.inventory.totalIn.toFixed(2)}</div><div class="metric-lbl">Received In</div></div>
          <div class="metric"><div class="metric-val">${data.inventory.totalOut.toFixed(2)}</div><div class="metric-lbl">Dispatched Out</div></div>
        </div>
`;
      if (data.inventory.topMovedItems.length > 0) {
        html += `<strong>Top Moved Items:</strong><ul>`;
        data.inventory.topMovedItems.forEach(i => {
          html += `<li><strong>${i.name}</strong>: ${i.qty.toFixed(2)} units</li>`;
        });
        html += `</ul>`;
      }
      html += `</div>`;
    }

    if (data.production && data.production.totalBatches > 0) {
      html += `
      <div class="section">
        <div class="section-title">👨‍🍳 Production Operations</div>
        <div class="metric-grid">
          <div class="metric"><div class="metric-val">${data.production.totalBatches}</div><div class="metric-lbl">Completed Batches</div></div>
          <div class="metric"><div class="metric-val">${data.production.totalWaste.toFixed(2)}</div><div class="metric-lbl">Recorded Waste</div></div>
        </div>
      </div>
`;
    }

    if (data.tax) {
      html += `
      <div class="section">
        <div class="section-title">🏛️ Tax Summary</div>
        <p style="font-size: 14px; margin: 0;">Output Tax: <strong>$${data.tax.outputTax.toFixed(2)}</strong> | Input Tax: <strong>$${data.tax.inputTax.toFixed(2)}</strong></p>
        <p style="font-size: 15px; margin-top: 6px; font-weight: bold; color: #0f172a;">Estimated Net VAT Payable: $${data.tax.netVatPayable.toFixed(2)}</p>
      </div>
`;
    }

    html += `
      <div style="text-align: center; margin-top: 24px;">
        <a href="${webBaseUrl}/reports?orgId=${orgId}" class="btn">View Interactive Analytics Dashboard</a>
      </div>
    </div>
    <div class="footer">
      Generated automatically by Scryme Executive Platform for ${orgName}.
    </div>
  </div>
</body>
</html>
`;

    return html;
  }

  private buildScrymeMarkdownMessage(
    orgName: string,
    data: ReportSummaryData,
    aiInsights: string,
    days: number,
    orgId: string,
  ): string {
    let msg = `## 📊 Executive Performance Report - ${orgName}\n`;
    msg += `*Period: Past ${days} days*\n\n`;

    if (aiInsights) {
      msg += `### 💡 AI Executive Insights\n${aiInsights}\n\n`;
    }

    if (data.sales) {
      msg += `### 💰 Sales Performance\n`;
      msg += `* **Total Revenue:** $${data.sales.totalRevenue.toFixed(2)}\n`;
      msg += `* **Total Orders:** ${data.sales.transactionCount}\n`;
      if (data.sales.topProducts.length > 0) {
        msg += `* **Top Items:** ${data.sales.topProducts.map(p => `${p.name} (${p.quantity})`).join(", ")}\n`;
      }
      msg += `\n`;
    }

    if (data.inventory) {
      msg += `### 📦 Inventory Flow\n`;
      msg += `* **Stock Received:** ${data.inventory.totalIn.toFixed(2)} units\n`;
      msg += `* **Stock Dispatched:** ${data.inventory.totalOut.toFixed(2)} units\n\n`;
    }

    if (data.production && data.production.totalBatches > 0) {
      msg += `### 👨‍🍳 Production\n`;
      msg += `* **Batches Completed:** ${data.production.totalBatches}\n`;
      msg += `* **Production Waste:** ${data.production.totalWaste.toFixed(2)} units\n\n`;
    }

    if (data.tax) {
      msg += `### 🏛️ Tax Summary\n`;
      msg += `* **Net VAT Payable:** $${data.tax.netVatPayable.toFixed(2)}\n\n`;
    }

    return msg;
  }
}
