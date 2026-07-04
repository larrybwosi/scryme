import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { ScrymeService } from "@/v2/scryme/scryme.service";
import { MovementType } from "@repo/db";
import { ScrymeChatApiClient } from "@repo/scryme";

@Injectable()
export class StockMovementReportService {
  private readonly logger = new Logger(StockMovementReportService.name);
  private readonly scrymeClient = new ScrymeChatApiClient();

  constructor(
    private readonly prisma: PrismaService,
    private readonly scrymeService: ScrymeService,
  ) {}

  async generateAndSendReport(organizationId: string, recipientEmails: string[], days: number = 7) {
    this.logger.log(`Generating stock movement report for org ${organizationId} for the last ${days} days`);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // ⚡ Bolt Optimization: Use database-level aggregation (groupBy) instead of fetching all movements.
    // This reduces network payload and memory usage from O(N) to O(1) for summary stats.
    const summaryAggs = await this.prisma.client.stockMovement.groupBy({
      by: ["movementType"],
      where: {
        organizationId,
        movementDate: { gte: startDate },
      },
      _sum: {
        quantity: true,
      },
    });

    if (summaryAggs.length === 0) {
      this.logger.log(
        `No stock movements found for org ${organizationId} in the last ${days} days. Skipping report.`,
      );
      return;
    }

    let totalIn = 0;
    let totalOut = 0;

    summaryAggs.forEach((agg) => {
      if (this.isIncoming(agg.movementType)) {
        totalIn += agg._sum.quantity?.toNumber() || 0;
      } else if (this.isOutgoing(agg.movementType)) {
        totalOut += agg._sum.quantity?.toNumber() || 0;
      }
    });

    // ⚡ Bolt Optimization: Use Two-Step Aggregation Pattern for top items.
    // 1) Group by variantId in the database to find top 5 by quantity.
    const topVariantAggs = await this.prisma.client.stockMovement.groupBy({
      by: ["variantId"],
      where: {
        organizationId,
        movementDate: { gte: startDate },
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 5,
    });

    // 2) Hydrate names for only the top 5 variants in a single targeted query.
    const topVariantIds = topVariantAggs.map((a) => a.variantId);
    const variantsMetadata = await this.prisma.client.productVariant.findMany({
      where: { id: { in: topVariantIds } },
      select: {
        id: true,
        name: true,
        product: {
          select: { name: true },
        },
      },
    });

    const topItems = topVariantAggs.map((agg) => {
      const v = variantsMetadata.find((m) => m.id === agg.variantId);
      return {
        name: v
          ? `${v.product.name} (${v.name || "Default"})`
          : "Unknown Variant",
        qty: agg._sum.quantity?.toNumber() || 0,
      };
    });

    const reportMessage = this.formatReportMessage(
      { totalIn, totalOut, topItems },
      days,
      organizationId,
    );

    const scrymeConfig = await this.scrymeService.getConfiguration(organizationId);
    if (!scrymeConfig || !scrymeConfig.workspaceSlug || !scrymeConfig.isActive) {
      this.logger.warn(`Scryme not configured or inactive for org ${organizationId}. Cannot send report.`);
      return;
    }

    // For now, we'll send to a "notifications" channel if it exists, or create a direct message if we can.
    // Given current Scryme API, we'll try to find or use a default channel slug.
    const channelSlug = "notifications";

    try {
      await this.scrymeClient.sendMessage(scrymeConfig.workspaceSlug, channelSlug, {
        content: reportMessage,
      });
      this.logger.log(`Stock movement report sent to Scryme workspace ${scrymeConfig.workspaceSlug}`);
    } catch (error: any) {
      this.logger.error(`Failed to send stock movement report to Scryme: ${error.message}`);
    }
  }

  private formatReportMessage(
    stats: {
      totalIn: number;
      totalOut: number;
      topItems: { name: string; qty: number }[];
    },
    days: number,
    organizationId: string,
  ): string {
    const { totalIn, totalOut, topItems } = stats;

    const baseUrl = process.env.PUBLIC_WEB_URL || "https://app.dealio.co";
    const detailUrl = `${baseUrl}/inventory/movements?orgId=${organizationId}&days=${days}`;

    let message = `## 📦 Weekly Stock Movement Report\n\n`;
    message += `Summary for the last ${days} days:\n\n`;
    message += `* **Total Items Received:** ${totalIn.toFixed(2)}\n`;
    message += `* **Total Items Dispatched:** ${totalOut.toFixed(2)}\n\n`;

    message += `### 🔥 Top Moved Items\n`;
    topItems.forEach(item => {
      message += `* ${item.name}: **${item.qty.toFixed(2)}**\n`;
    });

    message += `\n[View Detailed Report](${detailUrl})`;

    return message;
  }

  private isIncoming(type: MovementType): boolean {
    const incomingTypes: MovementType[] = [
      MovementType.PURCHASE_RECEIPT,
      MovementType.ADJUSTMENT_IN,
      MovementType.CUSTOMER_RETURN,
      MovementType.PRODUCTION_IN,
      MovementType.UNPACK_IN,
      MovementType.INITIAL_STOCK
    ];
    return incomingTypes.includes(type);
  }

  private isOutgoing(type: MovementType): boolean {
    const outgoingTypes: MovementType[] = [
      MovementType.SALE,
      MovementType.ADJUSTMENT_OUT,
      MovementType.SUPPLIER_RETURN,
      MovementType.PRODUCTION_OUT,
      MovementType.QUALITY_REJECTION,
      MovementType.UNPACK_OUT
    ];
    return outgoingTypes.includes(type);
  }
}
