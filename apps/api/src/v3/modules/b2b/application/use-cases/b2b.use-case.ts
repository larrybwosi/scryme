import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class B2BUseCase {
  constructor(private prisma: PrismaService) {}

  async getCatalog(organizationId: string, businessAccountId: string) {
    const products = await this.prisma.client.product.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      // ⚡ Bolt Optimization: Replace broad 'include' with targeted 'select' to reduce
      // database I/O and network payload. Fetching only required fields for variants
      // and category prevents over-fetching of large or unused metadata.
      select: {
        id: true,
        name: true,
        description: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        variants: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            sku: true,
            variantStocks: {
              select: {
                availableStock: true,
                locationId: true,
              },
            },
          },
        },
      },
    });

    // Map to maintain DTO compliance while preserving the expected structure
    return products.map((p) => ({
      ...p,
      categoryName: p.category?.name,
    }));
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
    const subtotal = data.items.reduce(
      (acc: number, item: any) => acc + (item.price || 0) * item.quantity,
      0,
    );

    const location = await this.prisma.client.inventoryLocation.findFirst({
      where: { organizationId, isActive: true },
    });

    if (!location) {
      throw new Error(
        "No active inventory location found for the organization",
      );
    }

    // ⚡ Bolt: Optimized order creation by batching variant lookups to avoid N+1 query problem.
    const variantIds = data.items.map((item: any) => item.variantId);
    const variants = await this.prisma.client.productVariant.findMany({
      where: { id: { in: variantIds } },
      select: {
        id: true,
        name: true,
        sku: true,
        product: { select: { name: true } },
      },
    });

    const variantMap = new Map(variants.map(v => [v.id, v]));

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

            if (!variant)
              throw new Error(`Variant ${item.variantId} not found`);

            return {
              variantId: item.variantId,
              productName: variant.product.name,
              variantName: variant.name || "Default",
              sku: variant.sku || "",
              quantity: item.quantity,
              listPrice: item.price || 0,
              unitPrice: item.price || 0,
              unitCost: 0,
              subtotal: (item.price || 0) * item.quantity,
              lineTotal: (item.price || 0) * item.quantity,
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
}
