import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IOrderRepository } from '../../domain/repositories/order-repository.interface';
import { CreateOrderDto } from '../dto/create-order.dto';
import { Order } from '../../domain/entities/order.entity';
import { PrismaService } from '@/prisma/prisma.service';
import { WebhookService } from '../../../webhooks/infrastructure/services/webhook.service';
import { V3RealtimeGateway } from '../../../../common/realtime/v3-realtime.gateway';
import { emitOrderPlaced } from '@repo/windmill/server';

@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject(IOrderRepository)
    private readonly orderRepository: IOrderRepository,
    private readonly prisma: PrismaService,
    private readonly webhookService: WebhookService,
    private readonly realtimeGateway: V3RealtimeGateway
  ) {}

  async execute(organizationId: string, dto: CreateOrderDto) {
    // 1. Validate variants and calculate totals
    const variantIds = dto.items.map(i => i.variantId);
    const variants = await this.prisma.client.productVariant.findMany({
      where: {
        id: { in: variantIds },
        product: { organizationId },
      },
      include: {
        product: true,
      },
    });

    if (variants.length !== variantIds.length) {
      throw new BadRequestException('One or more variants not found or do not belong to this organization');
    }

    const itemsData = dto.items.map(item => {
      const variant = variants.find(v => v.id === item.variantId)!;
      const unitPrice = item.unitPrice || variant.retailPrice?.toNumber() || 0;
      const subtotal = unitPrice * item.quantity;

      return {
        variantId: item.variantId,
        quantity: item.quantity,
        productName: variant.product.name,
        variantName: variant.name,
        sku: variant.sku,
        unitPrice,
        unitCost: variant.buyingPrice.toNumber(),
        subtotal,
        lineTotal: subtotal, // Simplification: no discounts/taxes for now
      };
    });

    const totalAmount = itemsData.reduce((sum, item) => sum + item.lineTotal, 0);

    // 2. Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 3. Create order
    const order = await this.orderRepository.create({
      number: orderNumber,
      organizationId,
      locationId: dto.locationId,
      customerId: dto.customerId,
      subtotal: totalAmount,
      finalTotal: totalAmount,
      notes: dto.notes,
      channel: dto.channel,
      items: itemsData,
      shippingAddress: dto.shippingAddress,
    });

    // 4. Trigger events
    this.realtimeGateway.sendToOrder(order.id, 'order.created', order);
    await this.webhookService.dispatch('order.created', organizationId, order);

    // 5. Emit Windmill event
    await emitOrderPlaced(organizationId, {
      orderId: order.id,
      orderNumber: order.number,
      customerId: order.customerId,
      totalAmount: Number(order.totalAmount),
      currency: 'KES', // Default for V3 for now
      items: order.items.map(i => ({
        productName: i.productName,
        quantity: Number(i.quantity),
        lineTotal: Number(i.lineTotal),
      })),
    }).catch(err => console.error('[v3 Order] Failed to emit Windmill event:', err));

    return order;
  }
}
