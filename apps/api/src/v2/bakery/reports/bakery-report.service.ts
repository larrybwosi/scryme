import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { ScrymeService } from "@/v2/scryme/scryme.service";
import { BakeryService } from "../bakery.service";
import { ScrymeChatApiClient } from "@repo/scryme";

@Injectable()
export class BakeryReportService {
  private readonly logger = new Logger(BakeryReportService.name);
  private readonly scrymeClient = new ScrymeChatApiClient();

  constructor(
    private readonly prisma: PrismaService,
    private readonly scrymeService: ScrymeService,
    private readonly bakeryService: BakeryService,
  ) {}

  async generateAndSendReport(organizationId: string, days: number = 7) {
    this.logger.log(`Generating bakery production report for org ${organizationId} for the last ${days} days`);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await this.bakeryService.getProductionStats(organizationId, startDate, endDate);

    if (stats.totalBatches === 0) {
      this.logger.log(`No production activity found for org ${organizationId} in the last ${days} days. Skipping report.`);
      return;
    }

    const settings = await this.bakeryService.getSettings({ organizationId } as any);
    const reportMessage = this.formatReportMessage(stats, days, organizationId, settings.scrymeReportSections);

    const scrymeConfig = await this.scrymeService.getConfiguration(organizationId);
    if (!scrymeConfig || !scrymeConfig.workspaceSlug || !scrymeConfig.isActive) {
      this.logger.warn(`Scryme not configured or inactive for org ${organizationId}. Cannot send report.`);
      return;
    }

    const channelSlug = settings.scrymeReportChannel || "production-reports";

    try {
      // Ensure channel exists
      try {
        await this.scrymeClient.createChannel(
          scrymeConfig.workspaceSlug,
          "Production Reports",
          channelSlug,
        );
      } catch (e: any) {
        // Ignore error if channel already exists
        if (e.response?.status !== 409 && e.response?.data?.code !== "ALREADY_EXISTS") {
          this.logger.warn(`Could not ensure Scryme channel ${channelSlug} exists: ${e.message}`);
        }
      }

      await this.scrymeClient.sendMessage(scrymeConfig.workspaceSlug, channelSlug, {
        content: reportMessage,
        actions: [
          {
            id: "view_bakery_report",
            label: "View Full Report",
            type: "button",
            style: "primary",
            value: `${process.env.PUBLIC_WEB_URL || "https://app.dealio.co"}/bakery/reports?orgId=${organizationId}`
          }
        ]
      });
      this.logger.log(`Bakery production report sent to Scryme channel ${channelSlug} in workspace ${scrymeConfig.workspaceSlug}`);
    } catch (error: any) {
      this.logger.error(`Failed to send bakery production report to Scryme: ${error.message}`);
    }
  }

  private formatReportMessage(stats: any, days: number, organizationId: string, sections: any): string {
    const showSections = sections || { batches: true, waste: true, yields: true, top_recipes: true };

    let message = `## 🍞 Weekly Bakery Production Report\n\n`;
    message += `Summary for the last ${days} days:\n\n`;

    if (showSections.batches) {
      message += `* **Total Batches Completed:** ${stats.totalBatches}\n`;
    }

    if (showSections.waste) {
      message += `* **Total Production Waste:** ${stats.totalWaste.toFixed(2)}\n`;
    }

    if (showSections.yields && stats.recipeStats.length > 0) {
      message += `\n### 📊 Production Yields\n`;
      stats.recipeStats.forEach((rs: any) => {
        message += `* ${rs.name}: **${rs.quantity.toFixed(2)} ${rs.unit}**\n`;
      });
    }

    if (showSections.top_recipes && stats.topRecipes.length > 0) {
      message += `\n### 🔥 Top Recipes\n`;
      stats.topRecipes.forEach((recipe: any) => {
        message += `* ${recipe.name}: **${recipe.quantity.toFixed(2)} ${recipe.unit}**\n`;
      });
    }

    return message;
  }
}
