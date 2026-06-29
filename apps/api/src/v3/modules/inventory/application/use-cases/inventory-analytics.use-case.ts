import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { SupplierService } from "@repo/shared/suppliers/server";

@Injectable()
export class GetSupplierLeadTimeUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(organizationId: string, supplierId?: string) {
    // Lead time is time between Purchase Order (created) and Stock Batch (receivedDate)
    const performanceData =
      await this.prisma.client.supplierPerformance.findMany({
        where: {
          organizationId,
          ...(supplierId && { supplierId }),
        },
        include: {
          supplier: {
            select: {
              name: true,
              code: true,
            },
          },
        },
        orderBy: {
          periodEnd: "desc",
        },
        take: 12,
      });

    return performanceData;
  }
}

@Injectable()
export class GetWasteAnalysisUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    organizationId: string,
    options: { startDate?: Date; endDate?: Date },
  ) {
    // ⚡ Bolt Optimization: Use database-level aggregation (groupBy) instead of fetching all movements
    // and reducing them in-memory. This significantly reduces network payload and memory usage,
    // especially for organizations with many adjustments. Complexity: O(G) where G is number of reasons.
    const aggregations = await this.prisma.client.stockAdjustment.groupBy({
      by: ["reason"],
      where: {
        organizationId,
        reason: {
          in: ["DAMAGED", "EXPIRED", "LOST", "STOLEN"],
        },
        adjustmentDate: {
          gte: options.startDate,
          lte: options.endDate,
        },
      },
      _sum: {
        quantity: true,
      },
      _count: {
        _all: true,
      },
    });

    // Transform back to the expected contract
    const analysis = aggregations.reduce((acc, agg) => {
      acc[agg.reason] = {
        count: agg._count._all,
        totalQuantity: agg._sum.quantity?.toNumber() || 0,
        totalValue: 0, // Value calculation placeholder to maintain contract
      };
      return acc;
    }, {} as any);

    return analysis;
  }
}
