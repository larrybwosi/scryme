import {
  Injectable,
  Inject,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { ApiRealtimeService } from "@/common/services/realtime.service";
import { emitOrderPlaced } from "@repo/windmill/server";
import { createOrder } from "@repo/shared/actions";
import { CreateOrderInput, OrderTransactionStatus } from "@repo/shared/lib";
import { WebhookService } from "@/v3/modules/webhooks/infrastructure/services/webhook.service";
import { IOrderRepository } from "../../domain/repositories/order-repository.interface";
import { CreateOrderDto } from "../dto/create-order.dto";
import { ScrymeNotificationService } from "@/v2/scryme/scryme-notification.service";

@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject(IOrderRepository)
    private readonly orderRepository: IOrderRepository,
    private readonly prisma: PrismaService,
    private readonly webhookService: WebhookService,
    private readonly realtimeService: ApiRealtimeService,
    private readonly scrymeNotificationService: ScrymeNotificationService,
  ) {}

  async execute(organizationId: string, dto: CreateOrderDto, memberId: string) {
    // We use the shared consolidated business logic from @repo/shared
    const result = await createOrder(organizationId, memberId, {
      customerId: dto.customerId,
      locationId: dto.locationId,
      items: dto.items,
      type: "ONLINE_ORDER", // Force ONLINE_ORDER for e-commerce/mobile
      status: OrderTransactionStatus.PENDING_CONFIRMATION, // Orders start as pending confirmation
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
    }).catch(err =>
      console.error("[v3 Order] Failed to emit Windmill event:", err),
    );

    // 6. Notify Scryme
    await this.scrymeNotificationService
      .notifyOrderCreated(organizationId, order.id)
      .catch(err => console.error("[v3 Order] Failed to notify Scryme:", err));

    return order;
  }
}
