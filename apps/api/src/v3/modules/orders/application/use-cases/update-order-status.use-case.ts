import {
  Injectable,
  Inject,
  NotFoundException,
  forwardRef,
} from "@nestjs/common";
import { IOrderRepository } from "../../domain/repositories/order-repository.interface";
import { ApiRealtimeService } from "../../../../../common/services/realtime.service";
import { WebhookService } from "../../../webhooks/infrastructure/services/webhook.service";
import { LoyaltyService } from "../../../loyalty/application/loyalty.service";
import { InvoiceUseCase } from "../../../finance/application/use-cases/invoice.use-case";

@Injectable()
export class UpdateOrderStatusUseCase {
  constructor(
    @Inject(IOrderRepository)
    private readonly orderRepository: IOrderRepository,
    private readonly realtimeService: ApiRealtimeService,
    private readonly webhookService: WebhookService,
    private readonly loyaltyService: LoyaltyService,
    @Inject(forwardRef(() => InvoiceUseCase))
    private readonly invoiceUseCase: InvoiceUseCase,
  ) {}

  async execute(organizationId: string, orderId: string, status: string) {
    const order = await this.orderRepository.findById(orderId, organizationId);
    if (!order) {
      throw new NotFoundException("Order not found");
    }

    const oldStatus = order.status;
    order.status = status;
    const updatedOrder = await this.orderRepository.save(order);

    if (status === "COMPLETED" && oldStatus !== "COMPLETED") {
      await this.handleOrderCompletion(order);
    }

    await this.realtimeService.publish(
      `order:${orderId}`,
      "order.updated",
      updatedOrder,
    );
    await this.webhookService.dispatch(
      "order.updated",
      order.organizationId,
      updatedOrder,
    );

    return updatedOrder;
  }

  private async handleOrderCompletion(order: any) {
    await this.awardLoyaltyPoints(order);
    await this.generateInvoice(order);
  }

  private async awardLoyaltyPoints(order: any) {
    if (!order.customerId) return;
    try {
      const points = await this.loyaltyService.calculatePointsForTransaction(
        order.id,
      );
      if (points > 0) {
        await this.loyaltyService.awardPoints(
          order.customerId,
          points,
          order.organizationId,
          `Points earned from order ${order.id}`,
          order.id,
        );
      }
    } catch (error) {
      console.error(
        `Failed to award loyalty points for order ${order.id}:`,
        error,
      );
    }
  }

  private async generateInvoice(order: any) {
    try {
      await this.invoiceUseCase.createInvoiceFromOrder(
        order.organizationId,
        order.id,
      );
    } catch (error) {
      console.error(
        `Failed to auto-generate invoice for order ${order.id}:`,
        error,
      );
    }
  }
}
