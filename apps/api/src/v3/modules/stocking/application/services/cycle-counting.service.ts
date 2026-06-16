import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { Cron, CronExpression } from "@nestjs/schedule";
import { StockTakeStatus, AutomationFrequency } from "@repo/db";

@Injectable()
export class CycleCountingService {
  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async processCycleCounts() {
    const now = new Date();
    const configs = await this.prisma.client.cycleCountConfig.findMany({
      where: {
        isActive: true,
        OR: [{ nextRunAt: null }, { nextRunAt: { lte: now } }],
      },
    });

    for (const config of configs) {
      await this.generateStockTake(config);
      await this.updateNextRun(config);
    }
  }

  async generateStockTake(config: any) {
    const organizationId = config.organizationId;
    const locationId = config.locationId;

    // Build filter based on config
    const filter: any = {
      organizationId,
      locationId,
      variant: {
        categoryId: config.categoryId || undefined,
      },
    };

    // ABC Analysis Logic
    // In a real system, we would calculate ABC based on value/velocity.
    // Here we filter if config specifies particular ABC classes.
    if (config.includeABC && config.includeABC.length > 0) {
      // Assuming ABC is a tag or a field we've added or can derive.
      // For now, we'll use a placeholder logic.
      filter.variant.tags = { hasSome: config.includeABC };
    }

    const stock = await this.prisma.client.productVariantStock.findMany({
      where: filter,
      include: {
        variant: {
          include: { product: true },
        },
      },
    });

    if (stock.length === 0) return;

    const stockTakeNumber = `CC-${Date.now()}`;

    await this.prisma.client.stockTake.create({
      data: {
        organizationId,
        locationId,
        stockTakeNumber,
        status: StockTakeStatus.PLANNED,
        scheduledDate: new Date(),
        notes: `Automatically generated from Cycle Count Config: ${config.name}. Included ABC: ${config.includeABC?.join(",") || "All"}`,
        items: {
          create: stock.map((s) => ({
            variantId: s.variantId,
            systemQuantity: s.currentStock,
          })),
        },
      },
    });

    await this.prisma.client.cycleCountConfig.update({
      where: { id: config.id },
      data: { lastRunAt: new Date() },
    });
  }

  private async updateNextRun(config: any) {
    const nextRun = new Date();
    switch (config.frequency) {
      case AutomationFrequency.DAILY:
        nextRun.setDate(nextRun.getDate() + 1);
        break;
      case AutomationFrequency.WEEKLY:
        nextRun.setDate(nextRun.getDate() + 7);
        break;
      case AutomationFrequency.MONTHLY:
        nextRun.setMonth(nextRun.getMonth() + 1);
        break;
      default:
        nextRun.setDate(nextRun.getDate() + 1);
    }

    await this.prisma.client.cycleCountConfig.update({
      where: { id: config.id },
      data: { nextRunAt: nextRun },
    });
  }
}
