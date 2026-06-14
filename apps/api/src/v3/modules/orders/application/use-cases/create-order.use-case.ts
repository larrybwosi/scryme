import {
  Injectable,
  Inject,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { IOrderRepository } from "../../domain/repositories/order-repository.interface";
import { CreateOrderDto } from "../dto/create-order.dto";
import { PrismaService } from "@/prisma/prisma.service";
import { WebhookService } from "../../../webhooks/infrastructure/services/webhook.service";
import { ApiRealtimeService } from "../../../../../common/services/realtime.service";
import { emitOrderPlaced } from "@repo/windmill/server";
import { createOrder, CreateOrderInput } from "@repo/shared/server";

@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject(IOrderRepository)
    private readonly orderRepository: IOrderRepository,
    private readonly prisma: PrismaService,
    private readonly webhookService: WebhookService,
    private readonly realtimeService: ApiRealtimeService,
  ) {}

  async execute(organizationId: string, dto: CreateOrderDto, memberId: string) {
    // We use the shared consolidated business logic from @repo/shared
    const result = await createOrder(organizationId, memberId, {
      customerId: dto.customerId,
      locationId: dto.locationId,
      items: dto.items,
      type: dto.channel as any, // Map channel to transaction type
      notes: dto.notes,
    } as CreateOrderInput);

    if (!result.success) {
      throw new BadRequestException(result.error || "Failed to create order");
    }

    const order = result.data;
    if (!order) {
      throw new InternalServerErrorException(
        "Order created but no data returned",
      );
    }

    // 4. Trigger events
    await this.realtimeService.publish(
      `order:${order.id}`,
      "order.created",
      order,
    );
    await this.webhookService.dispatch("order.created", organizationId, order);

    // 5. Emit Windmill event
    await emitOrderPlaced(organizationId, {
      orderId: order.id,
      orderNumber: order.number,
      customerId: order.customerId,
      totalAmount: Number(order.finalTotal),
      currency: order.currencyCode || "KES",
      items: order.items.map((i: any) => ({
        productName: i.productName,
        quantity: Number(i.quantity),
        lineTotal: Number(i.lineTotal),
      })),
    }).catch((err) =>
      console.error("[v3 Order] Failed to emit Windmill event:", err),
    );

    return order;
  }
}
