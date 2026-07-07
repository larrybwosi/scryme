import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { PricingResolverService } from "../../../catalog/application/services/pricing-resolver.service";
import { CatalogPaginationDto } from "../dto/b2b.dto";
import { paginate } from "../../../../common/utils/pagination";

@Injectable()
export class B2BUseCase {
  constructor(
    private prisma: PrismaService,
    private pricingResolver: PricingResolverService,
  ) {}

  async getCatalog(
    organizationId: string,
    businessAccountId: string,
    query: CatalogPaginationDto,
  ) {
    const { page = 1, limit = 20, search, categoryId } = query;

    const where: any = {
      organizationId,
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const { data: products, meta } = await paginate(
      this.prisma.client.product,
      {
        offset: (page - 1) * limit,
        limit,
      },
      where,
      { createdAt: "desc" },
      {
        include: {
        variants: {
          include: {
            variantStocks: {
              select: {
                availableStock: true,
                locationId: true,
              },
            },
          },
        },
        category: true,
      },
    });

    // Resolve prices for all variants
    const allVariantIds = products.flatMap((p: any) =>
      p.variants.map((v: any) => v.id),
    );

    const prices = await this.pricingResolver.resolveBatchVariantPrices({
      items: allVariantIds.map(id => ({ variantId: id, quantity: 1 })),
      organizationId,
      businessAccountId,
    });

    const productsWithPrices = products.map((p: any) => ({
      ...p,
      categoryName: p.category?.name,
      variants: p.variants.map((v: any) => {
        const priceInfo = prices.get(v.id);
        return {
          ...v,
          unitPrice: priceInfo?.unitPrice || 0,
          priceListId: priceInfo?.priceListId,
        };
      }),
    }));

    return { data: productsWithPrices, meta };
  }

  async getInvoices(organizationId: string, businessAccountId: string) {
    return this.prisma.client.transaction.findMany({
      where: {
        organizationId,
        businessAccountId: businessAccountId || undefined,
        type: "POS_SALE" as any, // Using existing TransactionType
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getOrders(organizationId: string, businessAccountId: string) {
    return this.prisma.client.transaction.findMany({
      where: {
        organizationId,
        businessAccountId: businessAccountId || undefined,
        type: "SALES_ORDER" as any, // Using existing TransactionType
      },
      include: {
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async createOrder(
    organizationId: string,
    businessAccountId: string,
    data: any,
  ) {
    const variantIds = data.items.map((item: any) => item.variantId);

    // Security & Robustness: Resolve prices on server, don't trust client provided prices.
    const prices = await this.pricingResolver.resolveBatchVariantPrices({
      items: data.items.map((item: any) => ({
        variantId: item.variantId,
        quantity: item.quantity,
      })),
      organizationId,
      businessAccountId,
    });

    const subtotal = data.items.reduce((acc: number, item: any) => {
      const priceInfo = prices.get(item.variantId);
      return acc + (priceInfo?.unitPrice || 0) * item.quantity;
    }, 0);

    const location = await this.prisma.client.inventoryLocation.findFirst({
      where: { organizationId, isActive: true },
    });

    if (!location) {
      throw new Error(
        "No active inventory location found for the organization",
      );
    }

    // ⚡ Bolt: Optimized order creation by batching variant lookups to avoid N+1 query problem.
    const variants = await this.prisma.client.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: {
        product: { select: { name: true } },
        variantStocks: {
          where: { locationId: location.id },
          select: { availableStock: true },
        },
      },
    });

    const variantMap = new Map(variants.map(v => [v.id, v]));

    // Validation: Check stock availability
    for (const item of data.items) {
      const variant = variantMap.get(item.variantId);
      if (!variant) throw new Error(`Variant ${item.variantId} not found`);

      const stock = variant.variantStocks[0]?.availableStock || 0;
      if (stock < item.quantity) {
        throw new Error(`Insufficient stock for variant ${variant.product.name} - ${variant.name}`);
      }
    }

    const transaction = await this.prisma.client.transaction.create({
      data: {
        organizationId,
        businessAccountId,
        type: "SALES_ORDER" as any,
        status: "PENDING" as any,
        locationId: location.id,
        number: `B2B-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        subtotal,
        finalTotal: subtotal,
        baseCurrencyTotal: subtotal,
        items: {
          create: data.items.map((item: any) => {
            const variant = variantMap.get(item.variantId);
            const priceInfo = prices.get(item.variantId);

            if (!variant)
              throw new Error(`Variant ${item.variantId} not found`);

            return {
              variantId: item.variantId,
              productName: variant.product.name,
              variantName: variant.name || "Default",
              sku: variant.sku || "",
              quantity: item.quantity,
              listPrice: priceInfo?.unitPrice || 0,
              unitPrice: priceInfo?.unitPrice || 0,
              unitCost: 0,
              subtotal: (priceInfo?.unitPrice || 0) * item.quantity,
              lineTotal: (priceInfo?.unitPrice || 0) * item.quantity,
              organizationId,
            };
          }),
        },
      },
    });

    return {
      success: true,
      message: "B2B Order created successfully",
      orderId: transaction.id,
    };
  }

  async createQuote(
    organizationId: string,
    businessAccountId: string,
    data: any,
  ) {
    // Resolve prices for the quote
    const prices = await this.pricingResolver.resolveBatchVariantPrices({
      items: data.items.map((item: any) => ({
        variantId: item.variantId,
        quantity: item.quantity,
      })),
      organizationId,
      businessAccountId,
    });

    const subtotal = data.items.reduce((acc: number, item: any) => {
      const priceInfo = prices.get(item.variantId);
      return acc + (priceInfo?.unitPrice || 0) * item.quantity;
    }, 0);

    const location = await this.prisma.client.inventoryLocation.findFirst({
      where: { organizationId, isActive: true },
    });

    // ⚡ Bolt: Fetch variant details for quote items
    const variantIds = data.items.map((item: any) => item.variantId);
    const variants = await this.prisma.client.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: { product: { select: { name: true } } },
    });
    const variantMap = new Map(variants.map(v => [v.id, v]));

    const transaction = await this.prisma.client.transaction.create({
      data: {
        organizationId,
        businessAccountId,
        type: "QUOTE" as any,
        status: "PENDING" as any,
        locationId: location?.id,
        number: `QT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        subtotal,
        finalTotal: subtotal,
        baseCurrencyTotal: subtotal,
        items: {
          create: data.items.map((item: any) => {
            const variant = variantMap.get(item.variantId);
            const priceInfo = prices.get(item.variantId);
            return {
              variantId: item.variantId,
              productName: variant?.product.name || "Product",
              variantName: variant?.name || "Default",
              quantity: item.quantity,
              unitPrice: priceInfo?.unitPrice || 0,
              subtotal: (priceInfo?.unitPrice || 0) * item.quantity,
              lineTotal: (priceInfo?.unitPrice || 0) * item.quantity,
              organizationId,
            };
          }),
        },
      },
    });

    return {
      success: true,
      message: "B2B Quote created successfully",
      quoteId: transaction.id,
    };
  }
}
