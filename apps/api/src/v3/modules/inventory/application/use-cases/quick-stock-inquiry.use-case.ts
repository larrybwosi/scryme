import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class QuickStockInquiryUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    organizationId: string,
    businessAccountId: string,
    variantIds: string[],
  ) {
    // 1. Resolve Business Account's Default Location
    const businessAccount = await this.prisma.client.businessAccount.findFirst({
      where: { id: businessAccountId, organizationId },
      select: { defaultLocationId: true },
    });

    if (!businessAccount || !businessAccount.defaultLocationId) {
      throw new BadRequestException(
        "Business account not found or has no default location assigned.",
      );
    }

    const locationId = businessAccount.defaultLocationId;

    // 2. Fetch Stock for Variants at Location
    const stocks = await this.prisma.client.productVariantStock.findMany({
      where: {
        locationId,
        variantId: { in: variantIds },
        organizationId,
      },
      select: {
        variantId: true,
        availableStock: true,
        variant: {
          select: {
            sku: true,
            name: true,
          },
        },
      },
    });

    /**
     * OPTIMIZATION (Bolt ⚡): Replaced O(N*M) lookup with O(N+M) Map.
     * Indexing the stocks by variantId allows for constant-time lookups
     * during the mapping phase, which is more efficient for large lists.
     */
    const stockMap = new Map(stocks.map((s) => [s.variantId, s]));

    return variantIds.map((variantId) => {
      const stock = stockMap.get(variantId);
      return {
        variantId,
        sku: stock?.variant.sku || "N/A",
        name: stock?.variant.name || "Unknown",
        locationId,
        availableStock: stock?.availableStock.toNumber() || 0,
      };
    });
  }
}
