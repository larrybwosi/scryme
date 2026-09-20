import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { ScrymeService } from "@/v2/scryme/scryme.service";
import { ProductionService } from "../application/services/production.service";
import { ScrymeChatApiClient } from "@repo/chat";

@Injectable()
export class ProductionReportService {
  private readonly logger = new Logger(ProductionReportService.name);
  private readonly scrymeClient = new ScrymeChatApiClient();

  constructor(
    private readonly prisma: PrismaService,
    private readonly scrymeService: ScrymeService,
    private readonly productionService: ProductionService,
  ) {}

  async generateAndSendReport(organizationId: string, days: number = 7) {
    this.logger.log(`Generating production report for org ${organizationId} for the last ${days} days`);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await this.getProductionStats(organizationId, startDate, endDate);

    if (stats.totalBatches === 0) {
      this.logger.log(`No production activity found for org ${organizationId} in the last ${days} days. Skipping report.`);
      return;
    }

    const settings = await this.productionService.getSettings(organizationId);
    const reportMessage = this.formatReportMessage(stats, days, organizationId, (settings as any).scrymeReportSections);

    const scrymeConfig = await this.scrymeService.getConfiguration(organizationId);
    if (!scrymeConfig || !scrymeConfig.workspaceSlug || !scrymeConfig.isActive) {
      this.logger.warn(`Scryme not configured or inactive for org ${organizationId}. Cannot send report.`);
      return;
    }

    const channelSlug = (settings as any).scrymeReportChannel || "production-reports";

    try {
      try {
        await this.scrymeClient.createChannel(
          scrymeConfig.workspaceSlug,
          "Production Reports",
          channelSlug,
        );
      } catch (e: any) {
        if (e.response?.status !== 409 && e.response?.data?.code !== "ALREADY_EXISTS") {
          this.logger.warn(`Could not ensure Scryme channel ${channelSlug} exists: ${e.message}`);
        }
      }

      await this.scrymeClient.sendMessage(scrymeConfig.workspaceSlug, channelSlug, {
        content: reportMessage,
        actions: [
          {
            id: "view_production_report",
            label: "View Full Report",
            type: "button",
            style: "primary",
            value: `${process.env.PUBLIC_WEB_URL || "https://app.dealio.co"}/production/reports?orgId=${organizationId}`
          }
        ]
      });
      this.logger.log(`Production report sent to Scryme channel ${channelSlug} in workspace ${scrymeConfig.workspaceSlug}`);
    } catch (error: any) {
      this.logger.error(`Failed to send production report to Scryme: ${error.message}`);
    }
  }

  private async getProductionStats(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const where = {
      organizationId,
      completedAt: {
        gte: startDate,
        lte: endDate,
      },
      status: "COMPLETED" as any,
    };

    const [aggregation, groups] = await Promise.all([
      this.prisma.client.batch.aggregate({
        where,
        _count: { _all: true },
        _sum: { wasteQuantity: true },
      }),
      this.prisma.client.batch.groupBy({
        where,
        by: ["recipeId"],
        _sum: {
          actualQuantity: true,
          wasteQuantity: true,
        },
      }),
    ]);

    const recipeIds = groups.map(g => g.recipeId);

    const recipes = await this.prisma.client.recipe.findMany({
      where: { id: { in: recipeIds } },
      select: {
        id: true,
        name: true,
        systemUnit: { select: { symbol: true } },
        orgUnit: { select: { symbol: true } },
      },
    });

    const recipeMap = new Map(recipes.map(r => [r.id, r]));

    const recipeStats = groups.map(g => {
      const recipe = recipeMap.get(g.recipeId);
      return {
        name: recipe?.name || "Unknown",
        quantity: Number(g._sum.actualQuantity || 0),
        unit: recipe?.systemUnit?.symbol || recipe?.orgUnit?.symbol || "",
        waste: Number(g._sum.wasteQuantity || 0),
      };
    });

    const topRecipes = [...recipeStats]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return {
      totalBatches: aggregation._count._all,
      totalWaste: Number(aggregation._sum.wasteQuantity || 0),
      topRecipes,
      recipeStats,
    };
  }

  private formatReportMessage(stats: any, days: number, organizationId: string, sections: any): string {
    const showSections = sections || { batches: true, waste: true, yields: true, top_recipes: true };

    let message = `## 📊 Weekly Production Report\n\n`;
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
      message += `\n### 🔥 Top Recipes & Items\n`;
      stats.topRecipes.forEach((recipe: any) => {
        message += `* ${recipe.name}: **${recipe.quantity.toFixed(2)} ${recipe.unit}**\n`;
      });
    }

    return message;
  }
}
