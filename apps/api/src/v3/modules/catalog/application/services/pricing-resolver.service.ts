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
    const { variantId, quantity = 1, ...context } = params;

    // ⚡ Bolt Optimization: Use the batch resolver to ensure consistent logic and eliminate duplication.
    const results = await this.resolveBatchVariantPrices({
      items: [{ variantId, quantity }],
      ...context,
    });

    return results.get(variantId) || { unitPrice: 0 };
  }

  /**
   * ⚡ Bolt Optimization: Batched pricing resolution to prevent N+1 query patterns.
   * Resolves prices for multiple variants in a single set of optimized database queries.
   */
  async resolveBatchVariantPrices(params: {
    items: { variantId: string; quantity: number }[];
    organizationId: string;
    customerId?: string;
    businessAccountId?: string;
  }): Promise<Map<string, { unitPrice: number; priceListId?: string }>> {
    const { items, organizationId, customerId, businessAccountId } = params;

    // ⚡ Bolt Optimization: Early return on empty items to save 3 redundant database queries.
    if (!items || items.length === 0) {
      return new Map();
    }

    const variantIds = Array.from(new Set(items.map(i => i.variantId)));

    // 2. Resolve all applicable price lists for this context
    // Hardened Filter: Avoid matching generic price lists when IDs are undefined
    const orClauses: any[] = [{ isGlobal: true }];
    if (customerId) orClauses.push({ customers: { some: { id: customerId } } });
    if (businessAccountId)
      orClauses.push({ businessAccounts: { some: { id: businessAccountId } } });

    // ⚡ Bolt Optimization: Parallelize independent read-only database queries
    // for variants and applicable price lists using Promise.all.
    // This reduces database wait time from 2 sequential roundtrips to 1 flat parallel roundtrip.
    const [variants, priceLists] = await Promise.all([
      this.prisma.client.productVariant.findMany({
        where: { id: { in: variantIds } },
        select: { id: true, wholesalePrice: true, retailPrice: true },
      }),
      this.prisma.client.priceList.findMany({
        where: {
          organizationId,
          isActive: true,
          OR: orClauses,
          validFrom: { lte: new Date() },
          validTo: { gte: new Date() },
        },
        orderBy: { priority: "desc" },
        select: { id: true },
      }),
    ]);

    const variantMap = new Map(variants.map(v => [v.id, v]));
    const priceListIds = priceLists.map(pl => pl.id);

    // 3. Fetch all relevant price list items for these variants and price lists
    const priceListItems = await this.prisma.client.priceListItem.findMany({
      where: {
        priceListId: { in: priceListIds },
        variantId: { in: variantIds },
        isActive: true,
      },
      select: {
        priceListId: true,
        variantId: true,
        price: true,
        minQuantity: true,
      },
      orderBy: { minQuantity: "desc" },
    });

    // 4. Map price list items for efficient lookup: variantId -> priceListId -> items[]
    const itemsByVariantAndList = new Map<string, Map<string, any[]>>();
    for (const item of priceListItems) {
      if (!itemsByVariantAndList.has(item.variantId)) {
        itemsByVariantAndList.set(item.variantId, new Map());
      }
      const listMap = itemsByVariantAndList.get(item.variantId)!;
      if (!listMap.has(item.priceListId)) {
        listMap.set(item.priceListId, []);
      }
      listMap.get(item.priceListId)!.push(item);
    }

    const results = new Map<
      string,
      { unitPrice: number; priceListId?: string }
    >();

    for (const { variantId, quantity } of items) {
      const variant = variantMap.get(variantId);
      if (!variant) continue;

      let resolvedPrice: { unitPrice: number; priceListId?: string } | null =
        null;

      // Check price lists in priority order
      const variantListMap = itemsByVariantAndList.get(variantId);
      if (variantListMap) {
        for (const list of priceLists) {
          const listItems = variantListMap.get(list.id);
          if (listItems) {
            // Find the best item for this quantity (minQuantity <= quantity)
            // They are already ordered by minQuantity desc in the query
            const bestItem = listItems.find(li => li.minQuantity <= quantity);
            if (bestItem) {
              resolvedPrice = {
                unitPrice: bestItem.price.toNumber(),
                priceListId: list.id,
              };
              break;
            }
          }
        }
      }

      if (!resolvedPrice) {
        const finalPrice =
          variant.wholesalePrice?.toNumber() ||
          variant.retailPrice?.toNumber() ||
          0;
        resolvedPrice = { unitPrice: finalPrice };
      }

      results.set(variantId, resolvedPrice);
    }

    return results;
  }
}
