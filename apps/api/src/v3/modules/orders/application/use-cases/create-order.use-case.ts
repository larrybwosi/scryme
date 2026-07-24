import {
  Injectable,
  Inject,
  BadRequestException,
  InternalServerErrorException,
  forwardRef,
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
import { BookingService } from "@/v3/modules/services/application/services/booking.service";
import { Prisma, TransactionType, TransactionChannel, TransactionStatus, PaymentStatus } from "@repo/db";

@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject(IOrderRepository)
    private readonly orderRepository: IOrderRepository,
    private readonly prisma: PrismaService,
    private readonly webhookService: WebhookService,
    private readonly realtimeService: ApiRealtimeService,
    private readonly scrymeNotificationService: ScrymeNotificationService,
    @Inject(forwardRef(() => BookingService))
    private readonly bookingService: BookingService,
  ) {}

  async execute(organizationId: string, dto: CreateOrderDto, memberId: string) {
    let transaction: any;

    const hasPhysicalItems = dto.items && dto.items.length > 0;
    const hasServices = dto.services && dto.services.length > 0;

    if (!hasPhysicalItems && !hasServices) {
      throw new BadRequestException("Order must contain at least one physical product or service booking.");
    }

    if (hasPhysicalItems) {
      // 1. Create standard order via shared action
      const result = await createOrder(organizationId, memberId, {
        customerId: dto.customerId,
        locationId: dto.locationId,
        items: dto.items,
        type: "ONLINE_ORDER",
        status: OrderTransactionStatus.PENDING_CONFIRMATION,
        notes: dto.notes,
      } as CreateOrderInput);

      if (!result.success) {
        throw new BadRequestException(result.error || "Failed to create physical order");
      }

      transaction = result.data;
    } else {
      // 2. Pure Service Checkout: Create the base Transaction directly
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

      transaction = await this.prisma.client.transaction.create({
        data: {
          organizationId,
          memberId,
          customerId: dto.customerId,
          locationId: dto.locationId,
          number: orderNumber,
          type: TransactionType.SERVICE_BOOKING,
          channel: dto.channel || TransactionChannel.ECOMMERCE_STORE,
          status: TransactionStatus.PENDING_CONFIRMATION,
          paymentStatus: PaymentStatus.PENDING,
          subtotal: 0,
          discountTotal: 0,
          taxTotal: 0,
          shippingTotal: 0,
          finalTotal: 0,
          baseCurrencyTotal: 0,
          notes: dto.notes,
        },
        include: {
          items: true,
          payments: true,
          fulfillments: true,
          customer: true,
        }
      });
    }

    // 3. Process Booking Services if present
    if (hasServices) {
      let extraSubtotal = new Prisma.Decimal(0);
      let extraTaxTotal = new Prisma.Decimal(0);

      for (const srvInput of dto.services!) {
        // Retrieve Service detail
        const service = await this.prisma.client.service.findFirst({
          where: { id: srvInput.serviceId, organizationId },
          include: { taxRates: { include: { taxRate: true } } }
        });

        if (!service) {
          throw new BadRequestException(`Service ${srvInput.serviceId} not found`);
        }

        // Schedule the booking slot
        const booking = await this.bookingService.createBooking(organizationId, {
          serviceId: srvInput.serviceId,
          customerId: dto.customerId,
          locationId: dto.locationId,
          scheduledStartTime: srvInput.scheduledStartTime,
          scheduledEndTime: srvInput.scheduledEndTime,
          staffIds: srvInput.staffIds,
          resourceIds: srvInput.resourceIds,
          notes: srvInput.notes || dto.notes,
        });

        const srvPrice = new Prisma.Decimal(service.price);
        extraSubtotal = extraSubtotal.add(srvPrice);

        // Compute Taxes
        let srvTax = new Prisma.Decimal(0);
        for (const tr of service.taxRates) {
          srvTax = srvTax.add(srvPrice.mul(tr.taxRate.rate));
        }
        extraTaxTotal = extraTaxTotal.add(srvTax);

        // Link Booking & create line item
        await this.prisma.client.transactionServiceItem.create({
          data: {
            transactionId: transaction.id,
            serviceId: service.id,
            bookingId: booking.id,
            serviceName: service.name,
            sku: service.sku,
            quantity: 1,
            unitPrice: srvPrice,
            subtotal: srvPrice,
            taxAmount: srvTax,
            lineTotal: srvPrice.add(srvTax),
          }
        });

        // Link ServiceBooking to Transaction
        await this.prisma.client.serviceBooking.update({
          where: { id: booking.id },
          data: { transactionId: transaction.id }
        });
      }

      // Update Transaction totals
      const finalSubtotal = new Prisma.Decimal(transaction.subtotal).add(extraSubtotal);
      const finalTaxTotal = new Prisma.Decimal(transaction.taxTotal).add(extraTaxTotal);
      const finalTotal = finalSubtotal.add(finalTaxTotal).add(new Prisma.Decimal(transaction.shippingTotal || 0)).sub(new Prisma.Decimal(transaction.discountTotal || 0));

      transaction = await this.prisma.client.transaction.update({
        where: { id: transaction.id },
        data: {
          subtotal: finalSubtotal,
          taxTotal: finalTaxTotal,
          finalTotal: finalTotal,
          baseCurrencyTotal: finalTotal,
        },
        include: {
          items: true,
          serviceItems: true,
          payments: true,
          fulfillments: true,
          customer: true,
          serviceBookings: true,
        }
      });
    }

    // 4. Trigger events
    await this.realtimeService.publish(
      `order:${transaction.id}`,
      "order.created",
      transaction,
    ).catch(err => console.error("[v3 Order] Failed to publish realtime:", err));

    await this.webhookService.dispatch("order.created", organizationId, transaction)
      .catch(err => console.error("[v3 Order] Failed to dispatch webhook:", err));

    // 5. Emit Windmill event
    await emitOrderPlaced(organizationId, {
      orderId: transaction.id,
      orderNumber: transaction.number,
      customerId: transaction.customerId,
      totalAmount: Number(transaction.finalTotal),
      currency: transaction.currencyCode || "KES",
      items: [
        ...(transaction.items || []).map((i: any) => ({
          productName: i.productName,
          quantity: Number(i.quantity),
          lineTotal: Number(i.lineTotal),
        })),
        ...(transaction.serviceItems || []).map((i: any) => ({
          productName: i.serviceName,
          quantity: Number(i.quantity),
          lineTotal: Number(i.lineTotal),
        }))
      ],
    }).catch(err =>
      console.error("[v3 Order] Failed to emit Windmill event:", err),
    );

    // 6. Notify Scryme
    await this.scrymeNotificationService
      .notifyOrderCreated(organizationId, transaction.id)
      .catch(err => console.error("[v3 Order] Failed to notify Scryme:", err));

    return transaction;
  }
}
