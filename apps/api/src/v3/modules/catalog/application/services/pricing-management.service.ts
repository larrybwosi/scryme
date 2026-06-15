import {Injectable, Logger} from "@nestjs/common";
import {PrismaService} from "@/prisma/prisma.service";
import {
  PriceSyncMode,
  SupplierSelection,
  PricingMethod,
  PriceChangeStatus,
  Prisma,
} from "@repo/db";

type PrismaTransaction = Omit<
  PrismaService["client"],
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

@Injectable()
export class PricingManagementService {
  private readonly logger = new Logger(PricingManagementService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Orchestrates price recalculation for a variant when cost changes.
   */
  async handleCostChange(
    params: {
      organizationId: string;
      variantId: string;
      source: "PURCHASE_ORDER" | "SUPPLIER_UPDATE";
      sourceId?: string;
      newCost?: number;
    },
    tx?: PrismaTransaction,
  ) {
    const client = tx || this.prisma.client;
    const {
      organizationId,
      variantId,
      source,
      sourceId,
      newCost: providedCost,
    } = params;

    if (!variantId) {
      this.logger.warn(
        `Missing variantId for cost change in org ${organizationId}`,
      );
      return;
    }

    // 1. Get Organization Settings
    const settings = await client.organizationSettings.findUnique({
      where: {organizationId},
    });

    if (!settings || settings.priceSyncMode === PriceSyncMode.MANUAL) {
      this.logger.log(
        `Skipping price sync for org ${organizationId}: Mode is MANUAL or settings missing`,
      );
      return;
    }

    // 2. Resolve the new "Active Cost" based on strategy if not provided
    const activeCost =
      providedCost ??
      (await this.resolveActiveCost(
        organizationId,
        variantId,
        settings.supplierSelectionStrategy,
        client,
      ));

    if (activeCost === null) {
      this.logger.warn(
        `Could not resolve active cost for variant ${variantId} in org ${organizationId}`,
      );
      return;
    }

    // 3. Get existing variant to capture OLD cost before updating
    const variant = await client.productVariant.findUnique({
      where: {id: variantId},
      select: {buyingPrice: true},
    });

    const oldCost = variant ? Number(variant.buyingPrice) : activeCost;

    // 4. Update the ProductVariant.buyingPrice to stay in sync
    await client.productVariant.update({
      where: {id: variantId},
      data: {buyingPrice: activeCost},
    });

    // 5. Find all PriceListItems for this variant that belong to auto-sync PriceLists
    const affectedItems = await client.priceListItem.findMany({
      where: {
        variantId,
        priceList: {
          organizationId,
          autoSyncWithCost: true,
          isActive: true,
        },
      },
      include: {
        priceList: true,
      },
    });

    for (const item of affectedItems) {
      await this.processItemPriceUpdate(
        {
          item,
          oldCost,
          newCost: activeCost,
          settings,
          source,
          sourceId,
        },
        client,
      );
    }
  }

  private async resolveActiveCost(
    organizationId: string,
    variantId: string,
    strategy: SupplierSelection,
    client: PrismaTransaction,
  ): Promise<number | null> {
    switch (strategy) {
      case SupplierSelection.PREFERRED: {
        const preferred = await client.productSupplier.findFirst({
          where: {variantId, isPreferred: true},
          select: {costPrice: true},
        });
        return preferred ? Number(preferred.costPrice) : null;
      }

      case SupplierSelection.LOWEST_COST: {
        const lowest = await client.productSupplier.findFirst({
          where: {variantId},
          orderBy: {costPrice: "asc"},
          select: {costPrice: true},
        });
        return lowest ? Number(lowest.costPrice) : null;
      }

      case SupplierSelection.LATEST_DELIVERY: {
        const latest = await client.stockBatch.findFirst({
          where: {variantId, organizationId},
          orderBy: {receivedDate: "desc"},
          select: {purchasePrice: true},
        });
        return latest ? Number(latest.purchasePrice) : null;
      }

      default:
        return null;
    }
  }

  private async processItemPriceUpdate(
    params: {
      item: any;
      oldCost: number;
      newCost: number;
      settings: any;
      source: string;
      sourceId?: string;
    },
    client: PrismaTransaction,
  ) {
    const {item, oldCost, newCost, settings, source, sourceId} = params;
    const oldPrice = Number(item.price);

    let proposedPrice: number;

    if (item.method === PricingMethod.FIXED) {
      // Maintain existing margin for FIXED prices
      // Margin = (Price - Cost) / Price
      const currentMargin =
        oldPrice > 0 && oldCost > 0 ? (oldPrice - oldCost) / oldPrice : 0;
      proposedPrice = newCost / (1 - currentMargin);
    } else {
      // Re-calculate based on DYNAMIC method (COST_MARKUP or COST_MARGIN)
      const value = Number(item.percentageValue);
      if (item.method === PricingMethod.COST_MARKUP) {
        proposedPrice = newCost * (1 + value / 100);
      } else {
        // COST_MARGIN
        proposedPrice = newCost / (1 - value / 100);
      }
    }

    const priceIncreaseRatio =
      oldPrice > 0 ? (proposedPrice - oldPrice) / oldPrice : 0;
    const newMargin =
      proposedPrice > 0 ? (proposedPrice - newCost) / proposedPrice : 0;

    // Check against enterprise thresholds
    const requiresReview =
      settings.priceSyncMode === PriceSyncMode.REVIEW_REQUIRED ||
      priceIncreaseRatio > Number(settings.priceApprovalThreshold) ||
      newMargin < Number(settings.minMarginThreshold);

    if (requiresReview) {
      await this.createPriceChangeRequest(
        {
          organizationId: settings.organizationId,
          item,
          oldPrice,
          newPrice: proposedPrice,
          oldCost,
          newCost,
          source,
          sourceId,
          reason: this.generateReviewReason(
            priceIncreaseRatio,
            newMargin,
            settings,
          ),
        },
        client,
      );
    } else {
      // Apply update directly
      await client.priceListItem.update({
        where: {id: item.id},
        data: {price: proposedPrice},
      });

      await client.priceHistory.create({
        data: {
          priceListItemId: item.id,
          previousPrice: oldPrice,
          newPrice: proposedPrice,
          previousMethod: item.method,
          newMethod: item.method,
          changeReason: `Auto-sync from ${source}`,
          changeType: "COST_RECALC",
          changedBy: "SYSTEM",
          metadata: {oldCost, newCost, sourceId},
        },
      });
    }
  }

  private generateReviewReason(
    increaseRatio: number,
    margin: number,
    settings: any,
  ): string {
    const reasons: string[] = [];
    if (increaseRatio > Number(settings.priceApprovalThreshold)) {
      reasons.push(
        `Significant price increase (${(increaseRatio * 100).toFixed(1)}% > ${(Number(settings.priceApprovalThreshold) * 100).toFixed(1)}%)`,
      );
    }
    if (margin < Number(settings.minMarginThreshold)) {
      reasons.push(
        `Low margin (${(margin * 100).toFixed(1)}% < ${(Number(settings.minMarginThreshold) * 100).toFixed(1)}%)`,
      );
    }
    if (reasons.length === 0)
      return "Manual review required by organization settings";
    return reasons.join(", ");
  }

  private async createPriceChangeRequest(data: any, client: PrismaTransaction) {
    const {
      organizationId,
      item,
      oldPrice,
      newPrice,
      oldCost,
      newCost,
      source,
      sourceId,
      reason,
    } = data;

    // Check if there's already a pending request for this item to avoid duplicates
    const existing = await client.priceChangeRequest.findFirst({
      where: {
        priceListItemId: item.id,
        status: PriceChangeStatus.PENDING,
      },
    });

    if (existing) {
      await client.priceChangeRequest.update({
        where: {id: existing.id},
        data: {
          newPrice,
          newCost,
          reason,
          source,
          sourceId,
          requestedAt: new Date(),
        },
      });
    } else {
      await client.priceChangeRequest.create({
        data: {
          organizationId,
          priceListItemId: item.id,
          oldPrice,
          newPrice,
          oldCost,
          newCost,
          source,
          sourceId,
          reason,
          status: PriceChangeStatus.PENDING,
        },
      });
    }
  }
}
