import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class B2BUseCase {
  constructor(private prisma: PrismaService) {}

  async getCatalog(organizationId: string, businessAccountId: string) {
    const products = await this.prisma.client.product.findMany({
      where: {
        organizationId,
        isActive: true,
      },
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

    return products;
  }

  async getInvoices(organizationId: string, businessAccountId: string) {
    return this.prisma.client.transaction.findMany({
      where: {
        organizationId,
        businessAccountId: businessAccountId || undefined,
        type: 'POS_SALE' as any, // Using existing TransactionType
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrders(organizationId: string, businessAccountId: string) {
    return this.prisma.client.transaction.findMany({
      where: {
        organizationId,
        businessAccountId: businessAccountId || undefined,
        type: 'SALES_ORDER' as any, // Using existing TransactionType
      },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createOrder(organizationId: string, businessAccountId: string, data: any) {
    const subtotal = data.items.reduce((acc: number, item: any) => acc + (item.price || 0) * item.quantity, 0);

    const location = await this.prisma.client.inventoryLocation.findFirst({
        where: { organizationId, isActive: true }
    });

    if (!location) {
        throw new Error('No active inventory location found for the organization');
    }

    const transaction = await this.prisma.client.transaction.create({
        data: {
            organizationId,
            businessAccountId,
            type: 'SALES_ORDER' as any,
            status: 'PENDING' as any,
            locationId: location.id,
            number: `B2B-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
            subtotal,
            finalTotal: subtotal,
            baseCurrencyTotal: subtotal,
            items: {
                create: await Promise.all(data.items.map(async (item: any) => {
                    const variant = await this.prisma.client.productVariant.findUnique({
                        where: { id: item.variantId },
                        include: { product: true }
                    });

                    if (!variant) throw new Error(`Variant ${item.variantId} not found`);

                    return {
                        variantId: item.variantId,
                        productName: variant.product.name,
                        variantName: variant.name || 'Default',
                        sku: variant.sku || '',
                        quantity: item.quantity,
                        listPrice: item.price || 0,
                        unitPrice: item.price || 0,
                        unitCost: 0,
                        subtotal: (item.price || 0) * item.quantity,
                        lineTotal: (item.price || 0) * item.quantity,
                        organizationId
                    };
                }))
            }
        }
    });
    return { success: true, message: 'B2B Order created successfully', orderId: transaction.id };
  }
}
