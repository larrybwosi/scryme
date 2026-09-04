import {
  Injectable,
  Inject,
  BadRequestException,
  InternalServerErrorException,
  forwardRef,
} from "@nestjs/common";
import * as crypto from "crypto";
import { PrismaService } from "@/prisma/prisma.service";
import { ApiRealtimeService } from "@/common/services/realtime.service";
import { emitOrderPlaced } from "@repo/shared/server";
import { createOrder } from "@repo/shared/actions";
import { CreateOrderInput, OrderTransactionStatus } from "@repo/shared/lib";
import { WebhookService } from "@/v3/modules/webhooks/infrastructure/services/webhook.service";
import { IOrderRepository } from "../../domain/repositories/order-repository.interface";
import { CreateOrderDto } from "../dto/create-order.dto";
import { ScrymeNotificationService } from "@/v2/scryme/scryme-notification.service";
import { BookingService } from "@/v3/modules/services/application/services/booking.service";
import {
  Prisma,
  TransactionType,
  TransactionChannel,
  TransactionStatus,
  PaymentStatus,
} from "@repo/db";

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

    if (!dto.customerId && !dto.businessAccountId) {
      throw new BadRequestException(
        "Either customerId or businessAccountId must be provided to create an order.",
      );
    }

    const hasPhysicalItems = dto.items && dto.items.length > 0;
    const hasServices = dto.services && dto.services.length > 0;

    if (!hasPhysicalItems && !hasServices) {
      throw new BadRequestException(
        "Order must contain at least one physical product or service booking.",
      );
    }

    if (hasPhysicalItems) {
      // 1. Create standard order via shared action
      const result = await createOrder(organizationId, memberId, {
        customerId: dto.customerId,
        businessAccountId: dto.businessAccountId,
        locationId: dto.locationId,
        items: dto.items,
        type: "ONLINE_ORDER",
        status: OrderTransactionStatus.PENDING_CONFIRMATION,
        notes: dto.notes,
      } as CreateOrderInput);

      if (!result.success) {
        throw new BadRequestException(
          result.error || "Failed to create physical order",
        );
      }

      transaction = result.data;
    } else {
      // 2. Pure Service Checkout: Create the base Transaction directly
      // SECURITY (Sentinel): Use cryptographically secure random bytes instead of Math.random() to prevent predictable order numbers
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString("hex").slice(0, 3).toUpperCase()}`;

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
        },
      });
    }

    // 3. Process Booking Services if present
    if (hasServices) {
      let extraSubtotal = new Prisma.Decimal(0);
      let extraTaxTotal = new Prisma.Decimal(0);

      // ⚡ Bolt Optimization: Batch pre-fetch all requested services with their tax rates
      // to eliminate the N+1 query bottleneck inside the loop.
      const serviceIds = Array.from(
        new Set(dto.services!.map(s => s.serviceId)),
      );
      const services = await this.prisma.client.service.findMany({
        where: {
          id: { in: serviceIds },
          organizationId,
        },
        include: {
          taxRates: {
            include: {
              taxRate: true,
            },
          },
        },
      });

      // Map-based lookup for O(1) constant-time resolution.
      const serviceMap = new Map(services.map(s => [s.id, s]));

      // ⚡ Bolt Optimization: Parallelize service booking creations.
      // Launching scheduling for multiple booking service inputs concurrently via Promise.all.
      // This collapses sequential blocking Cal.com/availability IO requests from O(N) to O(1).
      const bookingPromises = dto.services!.map(async (srvInput) => {
        const service = serviceMap.get(srvInput.serviceId);
        if (!service) {
          throw new BadRequestException(
            `Service ${srvInput.serviceId} not found`,
          );
        }

        const booking = await this.bookingService.createBooking(
          organizationId,
          {
            serviceId: srvInput.serviceId,
            customerId: dto.customerId,
            locationId: dto.locationId,
            scheduledStartTime: srvInput.scheduledStartTime,
            scheduledEndTime: srvInput.scheduledEndTime,
            staffIds: srvInput.staffIds,
            resourceIds: srvInput.resourceIds,
            notes: srvInput.notes || dto.notes,
          },
        );

        const srvPrice = new Prisma.Decimal(service.price);
        let srvTax = new Prisma.Decimal(0);
        for (const tr of service.taxRates) {
          srvTax = srvTax.add(srvPrice.mul(tr.taxRate.rate));
        }

        return {
          service,
          booking,
          srvPrice,
          srvTax,
        };
      });

      const resolvedBookings = await Promise.all(bookingPromises);

      // Assemble all write promises and calculate totals
      const serviceItemCreates: Promise<any>[] = [];
      const serviceBookingUpdates: Promise<any>[] = [];

      for (const res of resolvedBookings) {
        extraSubtotal = extraSubtotal.add(res.srvPrice);
        extraTaxTotal = extraTaxTotal.add(res.srvTax);

        // Defer database writes into concurrent promise arrays
        serviceItemCreates.push(
          this.prisma.client.transactionServiceItem.create({
            data: {
              transactionId: transaction.id,
              serviceId: res.service.id,
              bookingId: res.booking.id,
              serviceName: res.service.name,
              sku: res.service.sku,
              quantity: 1,
              unitPrice: res.srvPrice,
              subtotal: res.srvPrice,
              taxAmount: res.srvTax,
              lineTotal: res.srvPrice.add(res.srvTax),
            },
          })
        );

        serviceBookingUpdates.push(
          this.prisma.client.serviceBooking.update({
            where: { id: res.booking.id },
            data: { transactionId: transaction.id },
          })
        );
      }

      // ⚡ Bolt Optimization: Batch write service items and service booking links.
      // Executes all transactional creation and update operations in parallel, dropping round-trip latency to O(1).
      await Promise.all([...serviceItemCreates, ...serviceBookingUpdates]);

      // Update Transaction totals
      const finalSubtotal = new Prisma.Decimal(transaction.subtotal).add(
        extraSubtotal,
      );
      const finalTaxTotal = new Prisma.Decimal(transaction.taxTotal).add(
        extraTaxTotal,
      );
      const finalTotal = finalSubtotal
        .add(finalTaxTotal)
        .add(new Prisma.Decimal(transaction.shippingTotal || 0))
        .sub(new Prisma.Decimal(transaction.discountTotal || 0));

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
        },
      });
    }

    // 4. Trigger downstream notification events concurrently
    // ⚡ Bolt Optimization: Parallelize independent post-order event dispatches
    // (realtime update, webhook dispatch, Windmill event trigger, and Scryme notification).
    // Collapses 4 sequential asynchronous network/messaging roundtrips down to a flat O(1) concurrent latency profile.
    await Promise.all([
      this.realtimeService
        .publish(`order:${transaction.id}`, "order.created", transaction)
        .catch(err =>
          console.error("[v3 Order] Failed to publish realtime:", err),
        ),

      this.webhookService
        .dispatch("order.created", organizationId, transaction)
        .catch(err =>
          console.error("[v3 Order] Failed to dispatch webhook:", err),
        ),

      emitOrderPlaced(organizationId, {
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
          })),
        ],
      }).catch(err =>
        console.error("[v3 Order] Failed to emit Windmill event:", err),
      ),

      this.scrymeNotificationService
        .notifyOrderCreated(organizationId, transaction.id)
        .catch(err => console.error("[v3 Order] Failed to notify Scryme:", err)),
    ]);

    return transaction;
  }
}
