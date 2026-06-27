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

  async generateAndSendReport(
    organizationId: string,
    recipientEmails: string[],
    days: number = 7,
  ) {
    this.logger.log(
      `Generating stock movement report for org ${organizationId} for the last ${days} days`,
    );

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const movements = await this.prisma.client.stockMovement.findMany({
      where: {
        organizationId,
        movementDate: {
          gte: startDate,
        },
      },
      include: {
        variant: {
          include: {
            product: true,
          },
        },
      },
    });

    if (movements.length === 0) {
      this.logger.log(
        `No stock movements found for org ${organizationId} in the last ${days} days. Skipping report.`,
      );
      return;
    }

    const reportMessage = this.formatReportMessage(
      movements,
      days,
      organizationId,
    );

    const scrymeConfig =
      await this.scrymeService.getConfiguration(organizationId);
    if (
      !scrymeConfig ||
      !scrymeConfig.workspaceSlug ||
      !scrymeConfig.isActive
    ) {
      this.logger.warn(
        `Scryme not configured or inactive for org ${organizationId}. Cannot send report.`,
      );
      return;
    }

    // For now, we'll send to a "notifications" channel if it exists, or create a direct message if we can.
    // Given current Scryme API, we'll try to find or use a default channel slug.
    const channelSlug = "notifications";

    try {
      await this.scrymeClient.sendMessage(
        scrymeConfig.workspaceSlug,
        channelSlug,
        {
          content: reportMessage,
        },
      );
      this.logger.log(
        `Stock movement report sent to Scryme workspace ${scrymeConfig.workspaceSlug}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to send stock movement report to Scryme: ${error.message}`,
      );
    }
  }

  private formatReportMessage(
    movements: any[],
    days: number,
    organizationId: string,
  ): string {
    const totalIn = movements
      .filter(m => this.isIncoming(m.movementType))
      .reduce((acc, m) => acc + Number(m.quantity), 0);

    const totalOut = movements
      .filter(m => this.isOutgoing(m.movementType))
      .reduce((acc, m) => acc + Number(m.quantity), 0);

    // Group by variant for top moved items
    const variantStats: Record<string, { name: string; qty: number }> = {};
    movements.forEach(m => {
      const variantName = `${m.variant.product.name} (${m.variant.name || "Default"})`;
      if (!variantStats[variantName]) {
        variantStats[variantName] = { name: variantName, qty: 0 };
      }
      variantStats[variantName].qty += Number(m.quantity);
    });

    const topItems = Object.values(variantStats)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

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
      MovementType.INITIAL_STOCK,
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
      MovementType.UNPACK_OUT,
    ];
    return outgoingTypes.includes(type);
  }
}
