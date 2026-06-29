import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class InventoryIntegrityService {
  constructor(private readonly prisma: PrismaService) {}

  async verifyOrganizationIntegrity(organizationId: string) {
    const issues = [];
    const batchSize = 100;
    let skip = 0;

    while (true) {
      const variants = await this.prisma.client.productVariant.findMany({
        where: { product: { organizationId } },
        select: { id: true },
        take: batchSize,
        skip: skip,
      });

      if (variants.length === 0) break;

      /**
       * OPTIMIZATION (Bolt ⚡): Replaced N+1 query pattern with batched pre-fetching.
       * Instead of querying stocks and batches for each variant individually,
       * we fetch all required records for the entire batch of variants in two parallel queries.
       * Estimated impact: Reduces database roundtrips by ~90% for large inventories.
       */
      const variantIds = variants.map((v) => v.id);
      const [allStocks, allBatches] = await Promise.all([
        this.prisma.client.productVariantStock.findMany({
          where: { variantId: { in: variantIds } },
        }),
        this.prisma.client.stockBatch.findMany({
          where: {
            variantId: { in: variantIds },
            currentQuantity: { gt: 0 },
          },
        }),
      ]);

      for (const variant of variants) {
        const variantStocks = allStocks.filter(
          (s) => s.variantId === variant.id,
        );
        const variantBatches = allBatches.filter(
          (b) => b.variantId === variant.id,
        );

        const variantIssues = await this.verifyVariantIntegrity(
          organizationId,
          variant.id,
          variantStocks,
          variantBatches,
        );
        issues.push(...variantIssues);
      }

      skip += batchSize;
    }

    return {
      status: issues.length === 0 ? "HEALTHY" : "UNHEALTHY",
      issuesCount: issues.length,
      issues,
    };
  }

  async verifyVariantIntegrity(
    organizationId: string,
    variantId: string,
    preFetchedStocks?: any[],
    preFetchedBatches?: any[],
  ) {
    const issues = [];

    // 1. Check Stock Summary vs Batches
    const stocks =
      preFetchedStocks ||
      (await this.prisma.client.productVariantStock.findMany({
        where: { variantId },
      }));

    for (const stock of stocks) {
      const batches =
        preFetchedBatches?.filter((b) => b.locationId === stock.locationId) ||
        (await this.prisma.client.stockBatch.findMany({
          where: {
            variantId,
            locationId: stock.locationId,
            currentQuantity: { gt: 0 },
          },
        }));

      const totalBatchQty = batches.reduce(
        (acc: number, b: any) => acc + Number(b.currentQuantity),
        0,
      );
      const currentStock = Number(stock.currentStock);

      if (Math.abs(totalBatchQty - currentStock) > 0.001) {
        issues.push({
          type: "STOCK_BATCH_MISMATCH",
          variantId,
          locationId: stock.locationId,
          stockQty: currentStock,
          batchTotalQty: totalBatchQty,
          diff: totalBatchQty - currentStock,
        });
      }
    }

    return issues;
  }

  async fixVariantIntegrity(
    organizationId: string,
    variantId: string,
    locationId: string,
  ) {
    const batches = await this.prisma.client.stockBatch.findMany({
      where: { variantId, locationId, currentQuantity: { gt: 0 } },
    });

    const totalBatchQty = batches.reduce(
      (acc: number, b: any) => acc + Number(b.currentQuantity),
      0,
    );

    await this.prisma.client.productVariantStock.update({
      where: { variantId_locationId: { variantId, locationId } },
      data: {
        currentStock: totalBatchQty,
        availableStock: totalBatchQty,
      },
    });

    return { success: true, newStock: totalBatchQty };
  }
}
