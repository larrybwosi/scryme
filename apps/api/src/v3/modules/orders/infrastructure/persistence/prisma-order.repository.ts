import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { IOrderRepository } from '../../domain/repositories/order-repository.interface';
import { Order } from '../../domain/entities/order.entity';
import { PaginationQueryDto, PaginatedResponse, paginate } from '@/v3/common/utils/pagination';

@Injectable()
export class PrismaOrderRepository implements IOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByOrganization(
    organizationId: string,
    paginationQuery: PaginationQueryDto
  ): Promise<PaginatedResponse<Order>> {
    const result = await paginate(
      this.prisma.client.transaction,
      paginationQuery,
      { organizationId },
      { createdAt: 'desc' },
      {
        select: {
          id: true,
          number: true,
          customerId: true,
          status: true,
          finalTotal: true,
          organizationId: true,
          locationId: true,
          createdAt: true,
          updatedAt: true,
          items: true,
          lpoNumber: true,
          lpoDate: true,
          lpoExpiryDate: true,
          lpoUrl: true,
        },
      }
    );

    return {
      ...result,
      data: result.data.map(
        (o: any) =>
          new Order(
            o.id,
            o.number,
            o.customerId,
            o.status,
            o.finalTotal.toNumber(),
            o.organizationId,
            o.locationId,
            o.createdAt,
            o.updatedAt,
            o.items,
            o.lpoNumber,
            o.lpoDate,
            o.lpoExpiryDate,
            o.lpoUrl
          )
      ),
    };
  }

  async findById(id: string): Promise<Order | null> {
    const o = await this.prisma.client.transaction.findUnique({
      where: { id },
      select: {
        id: true,
        number: true,
        customerId: true,
        status: true,
        finalTotal: true,
        organizationId: true,
        locationId: true,
        createdAt: true,
        updatedAt: true,
        items: true,
        lpoNumber: true,
        lpoDate: true,
        lpoExpiryDate: true,
        lpoUrl: true,
      },
    });
    if (!o) return null;
    return new Order(
      o.id,
      o.number,
      o.customerId,
      o.status,
      o.finalTotal.toNumber(),
      o.organizationId,
      o.locationId,
      o.createdAt,
      o.updatedAt,
      o.items,
      o.lpoNumber,
      o.lpoDate,
      o.lpoExpiryDate,
      o.lpoUrl
    );
  }

  async create(orderData: any): Promise<Order> {
    const o = await this.prisma.client.transaction.create({
      data: {
        lpoNumber: orderData.lpoNumber,
        lpoDate: orderData.lpoDate,
        lpoExpiryDate: orderData.lpoExpiryDate,
        lpoUrl: orderData.lpoUrl,
        number: orderData.number,
        type: orderData.type || 'ONLINE_ORDER',
        channel: orderData.channel || 'ECOMMERCE_STORE',
        status: orderData.status || 'PENDING_CONFIRMATION',
        organization: { connect: { id: orderData.organizationId } },
        location: { connect: { id: orderData.locationId } },
        customer: orderData.customerId ? { connect: { id: orderData.customerId } } : undefined,
        subtotal: orderData.subtotal,
        finalTotal: orderData.finalTotal,
        baseCurrencyTotal: orderData.finalTotal,
        discountTotal: orderData.discountTotal || 0,
        taxTotal: orderData.taxTotal || 0,
        shippingTotal: orderData.shippingTotal || 0,
        notes: orderData.notes,
        items: {
          create: orderData.items.map((item: any) => ({
            variantId: item.variantId,
            quantity: item.quantity,
            productName: item.productName,
            variantName: item.variantName,
            sku: item.sku,
            listPrice: item.unitPrice,
            unitPrice: item.unitPrice,
            unitCost: item.unitCost || 0,
            subtotal: item.subtotal,
            lineTotal: item.lineTotal,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return new Order(
      o.id,
      o.number,
      o.customerId,
      o.status,
      o.finalTotal.toNumber(),
      o.organizationId,
      o.locationId,
      o.createdAt,
      o.updatedAt,
      (o as any).items || []
    );
  }

  async save(order: Order): Promise<Order> {
    const o = await this.prisma.client.transaction.upsert({
      where: { id: order.id },
      update: {
        status: order.status as any,
        finalTotal: order.totalAmount,
        lpoNumber: order.lpoNumber,
        lpoDate: order.lpoDate,
        lpoExpiryDate: order.lpoExpiryDate,
        lpoUrl: order.lpoUrl,
      },
      create: {
        id: order.id,
        number: order.number || `ORD-${Date.now()}`,
        type: 'POS_SALE',
        location: { connect: { id: order.locationId } },
        customer: order.customerId ? { connect: { id: order.customerId } } : undefined,
        status: order.status as any,
        finalTotal: order.totalAmount,
        subtotal: order.totalAmount,
        baseCurrencyTotal: order.totalAmount,
        organization: { connect: { id: order.organizationId } },
      },
      include: {
        items: true,
      },
    });
    return new Order(
      o.id,
      o.number,
      o.customerId,
      o.status,
      o.finalTotal.toNumber(),
      o.organizationId,
      o.locationId,
      o.createdAt,
      o.updatedAt,
      (o as any).items || [],
      o.lpoNumber,
      o.lpoDate,
      o.lpoExpiryDate,
      o.lpoUrl
    );
  }
}
