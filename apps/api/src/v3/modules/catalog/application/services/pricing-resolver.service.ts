import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class PricingResolverService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveVariantPrice(params: {
    variantId: string;
    organizationId: string;
    customerId?: string;
    businessAccountId?: string;
    quantity?: number;
  }): Promise<{ unitPrice: number; priceListId?: string }> {
    const {
      variantId,
      organizationId,
      customerId,
      businessAccountId,
      quantity = 1,
    } = params;

    // 1. Get variant details (fallback wholesale price)
    const variant = await this.prisma.client.productVariant.findUnique({
      where: { id: variantId },
      select: { wholesalePrice: true, retailPrice: true },
    });

    if (!variant) {
      throw new Error("Variant not found");
    }

    // 2. Resolve applicable price lists
    // We look for price lists assigned to the customer or business account
    const priceLists = await this.prisma.client.priceList.findMany({
      where: {
        organizationId,
        isActive: true,
        OR: [
          { customers: { some: { id: customerId } } },
          { businessAccounts: { some: { id: businessAccountId } } },
          { isGlobal: true },
        ],
        validFrom: { lte: new Date() },
        validTo: { gte: new Date() },
      },
      orderBy: { priority: "desc" },
      select: {
        id: true,
        // ⚡ Bolt Optimization: Use targeted select to fetch only the price
        // instead of the entire PriceListItem record and its relations.
        items: {
          where: {
            variantId,
            isActive: true,
            minQuantity: { lte: quantity },
          },
          select: {
            price: true,
          },
          orderBy: { minQuantity: "desc" },
          take: 1,
        },
      },
    });

    // 3. Find the best price from price lists
    for (const list of priceLists) {
      if (list.items.length > 0) {
        return {
          unitPrice: list.items[0].price.toNumber(),
          priceListId: list.id,
        };
      }
    }

    // 4. Fallback to wholesalePrice then retailPrice
    const finalPrice =
      variant.wholesalePrice?.toNumber() ||
      variant.retailPrice?.toNumber() ||
      0;

    return { unitPrice: finalPrice };
  }
}
