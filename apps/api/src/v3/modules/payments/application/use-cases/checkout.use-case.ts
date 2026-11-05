import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Optional,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import {
  CheckoutDto,
  CheckoutResponseDto,
  CheckoutPaymentMethod,
} from "../dto/checkout.dto";
import { MpesaService } from "@repo/shared/mpesa/server";
import { emitOrderPlaced } from "@repo/shared/server";
import { WebhookService } from "../../../webhooks/infrastructure/services/webhook.service";
import { BookingService } from "@/v3/modules/services/application/services/booking.service";
import { Decimal } from "decimal.js";
import { OpenPanelService } from "@/common/openpanel/openpanel.service";
import { PaymentMethod } from "@repo/db";

@Injectable()
export class CheckoutUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mpesaService: MpesaService,
    private readonly webhookService: WebhookService,
    @Optional() private readonly openPanelService?: OpenPanelService,
    @Optional()
    @Inject(forwardRef(() => BookingService))
    private readonly bookingService?: BookingService,
  ) {}

  async execute(
    organizationId: string,
    dto: CheckoutDto,
  ): Promise<CheckoutResponseDto> {
    const paymentMethod = dto.paymentMethod || CheckoutPaymentMethod.MPESA;

    if (paymentMethod === CheckoutPaymentMethod.MPESA && !dto.phoneNumber) {
      throw new BadRequestException("Phone number is required for M-Pesa payments");
    }

    // 1. Get Cart and Default Location concurrently
    const cartWhere: any = { organizationId };
    if (dto.cartId) {
      cartWhere.id = dto.cartId;
    } else if (dto.sessionId) {
      cartWhere.sessionId = dto.sessionId;
    } else {
      throw new BadRequestException("Either cartId or sessionId must be provided");
    }

    const [cart, defaultLocation] = await Promise.all([
      this.prisma.client.cart.findFirst({
        where: cartWhere,
        include: { items: true },
      }),
      !dto.locationId
        ? this.prisma.client.inventoryLocation.findFirst({
            where: { organizationId, isDefault: true },
            select: { id: true },
          })
        : null,
    ]);

    if (!cart) throw new NotFoundException("Cart not found");
    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException("Cart is empty");
    }

    // Resolve and validate locationId upfront
    const locationId = dto.locationId || defaultLocation?.id;
    if (!locationId) {
      throw new BadRequestException(
        "No location provided and no default location found for organization",
      );
    }

    // Partition cart items into physical products and services
    const productItems = cart.items.filter((i) => i.productId || i.variantId);
    const serviceCartItems = cart.items.filter((i) => i.serviceId);

    if (productItems.length === 0 && serviceCartItems.length === 0) {
      throw new BadRequestException("Cart contains no valid items or services");
    }

    // 2. Process Physical Product Variants
    const variantIds = productItems
      .map((i) => i.variantId)
      .filter((id): id is string => Boolean(id && id !== "base"));

    let variants: any[] = [];
    if (variantIds.length > 0) {
      variants = await this.prisma.client.productVariant.findMany({
        where: { id: { in: variantIds } },
        select: {
          id: true,
          name: true,
          sku: true,
          retailPrice: true,
          buyingPrice: true,
          product: {
            select: {
              name: true,
            },
          },
        },
      });
    }
    const variantMap = new Map(variants.map((v) => [v.id, v]));

    let productSubtotal = new Decimal(0);
    const orderItemsData = productItems.map((item) => {
      const variant = item.variantId ? variantMap.get(item.variantId) : null;
      const unitPrice = variant?.retailPrice
        ? new Decimal(variant.retailPrice.toString())
        : new Decimal(0);
      const itemSubtotal = unitPrice.mul(item.quantity);
      productSubtotal = productSubtotal.add(itemSubtotal);

      return {
        variantId: item.variantId,
        quantity: item.quantity,
        productName: variant?.product?.name || "Unknown Product",
        variantName: variant?.name || "Unknown Variant",
        sku: variant?.sku || "UNKNOWN",
        listPrice: unitPrice,
        unitPrice: unitPrice,
        unitCost: variant?.buyingPrice || 0,
        subtotal: itemSubtotal,
        lineTotal: itemSubtotal,
      };
    });

    // 3. Process Bookable Services
    let serviceSubtotal = new Decimal(0);
    let serviceTaxTotal = new Decimal(0);
    const serviceBookingPromises: Promise<any>[] = [];

    if (serviceCartItems.length > 0) {
      const serviceIds = Array.from(new Set(serviceCartItems.map((i) => i.serviceId!)));
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
      const serviceMap = new Map(services.map((s) => [s.id, s]));

      for (const item of serviceCartItems) {
        const service = serviceMap.get(item.serviceId!);
        if (!service) {
          throw new NotFoundException(`Service ${item.serviceId} not found`);
        }

        const srvPrice = new Decimal(service.price ? service.price.toString() : 0);
        let srvTax = new Decimal(0);
        if (service.taxRates && service.taxRates.length > 0) {
          for (const tr of service.taxRates) {
            srvTax = srvTax.add(srvPrice.mul(tr.taxRate.rate));
          }
        }

        serviceSubtotal = serviceSubtotal.add(srvPrice.mul(item.quantity || 1));
        serviceTaxTotal = serviceTaxTotal.add(srvTax.mul(item.quantity || 1));

        const bookingDetails = (item.bookingDetails as any) || {};
        const startTime = bookingDetails.scheduledStartTime
          ? new Date(bookingDetails.scheduledStartTime).toISOString()
          : new Date().toISOString();

        if (this.bookingService) {
          serviceBookingPromises.push(
            this.bookingService
              .createBooking(
                organizationId,
                {
                  serviceId: service.id,
                  customerId: cart.customerId || undefined,
                  locationId,
                  scheduledStartTime: startTime,
                  scheduledEndTime: bookingDetails.scheduledEndTime,
                  staffIds: bookingDetails.staffIds || (bookingDetails.staffId ? [bookingDetails.staffId] : undefined),
                  resourceIds: bookingDetails.resourceIds,
                  notes: bookingDetails.notes || dto.notes,
                },
                false,
              )
              .then((booking) => ({
                service,
                booking,
                srvPrice,
                srvTax,
              })),
          );
        } else {
          // Fallback if bookingService is not injected directly
          serviceBookingPromises.push(
            Promise.resolve({
              service,
              booking: null,
              srvPrice,
              srvTax,
            }),
          );
        }
      }
    }

    const resolvedServiceBookings = await Promise.all(serviceBookingPromises);

    // Calculate Grand Totals
    const totalSubtotal = productSubtotal.add(serviceSubtotal);
    const finalTotal = totalSubtotal.add(serviceTaxTotal);

    // 4. Create Order Transaction
    const orderNumber = `ORD-${Date.now()}`;
    const transactionType =
      productItems.length > 0 ? "ONLINE_ORDER" : "SERVICE_BOOKING";

    let transaction = await this.prisma.client.transaction.create({
      data: {
        organization: { connect: { id: organizationId } },
        number: orderNumber,
        type: transactionType as any,
        channel: "ECOMMERCE_STORE",
        status: "PENDING_CONFIRMATION",
        customer: cart.customerId
          ? { connect: { id: cart.customerId } }
          : undefined,
        location: { connect: { id: locationId } },
        subtotal: totalSubtotal,
        discountTotal: 0,
        taxTotal: serviceTaxTotal,
        shippingTotal: 0,
        finalTotal: finalTotal,
        baseCurrencyTotal: finalTotal,
        notes: dto.notes,
        items: orderItemsData.length > 0 ? { create: orderItemsData } : undefined,
      },
    });

    // 5. Connect Service Items and Bookings
    if (resolvedServiceBookings.length > 0) {
      const serviceWrites: Promise<any>[] = [];

      for (const res of resolvedServiceBookings) {
        serviceWrites.push(
          this.prisma.client.transactionServiceItem.create({
            data: {
              transactionId: transaction.id,
              serviceId: res.service.id,
              bookingId: res.booking?.id || null,
              serviceName: res.service.name,
              sku: res.service.sku,
              quantity: 1,
              unitPrice: res.srvPrice,
              subtotal: res.srvPrice,
              taxAmount: res.srvTax,
              lineTotal: res.srvPrice.add(res.srvTax),
            },
          }),
        );

        if (res.booking?.id) {
          serviceWrites.push(
            this.prisma.client.serviceBooking.update({
              where: { id: res.booking.id },
              data: { transactionId: transaction.id },
            }),
          );
        }
      }

      await Promise.all(serviceWrites);
    }

    // 6. Create Payment Record according to chosen Payment Method
    let dbPaymentMethod: PaymentMethod = PaymentMethod.MPESA;
    if (paymentMethod === CheckoutPaymentMethod.CASH_ON_DELIVERY) {
      dbPaymentMethod = PaymentMethod.CASH;
    } else if (paymentMethod === CheckoutPaymentMethod.PAY_AT_VENUE) {
      dbPaymentMethod = PaymentMethod.OTHER;
    }

    const payment = await this.prisma.client.payment.create({
      data: {
        organizationId,
        transactionId: transaction.id,
        amount: transaction.finalTotal,
        method: dbPaymentMethod,
        status: "PENDING",
      },
    });

    // 7. Initiate Payment or Confirm Terms
    let mpesaResponse: any = null;
    let paymentStatusMessage = "Order created successfully";

    if (paymentMethod === CheckoutPaymentMethod.MPESA) {
      mpesaResponse = await this.mpesaService.initiateStkPush({
        organizationId,
        transactionId: transaction.id,
        paymentId: payment.id,
        amount: Number(transaction.finalTotal),
        phoneNumber: dto.phoneNumber!,
      });
      paymentStatusMessage = mpesaResponse?.CustomerMessage || "M-Pesa STK push initiated";
    } else if (paymentMethod === CheckoutPaymentMethod.CASH_ON_DELIVERY) {
      paymentStatusMessage = "Order placed with Cash on Delivery";
    } else if (paymentMethod === CheckoutPaymentMethod.PAY_AT_VENUE) {
      paymentStatusMessage = "Booking placed. Pay at venue upon arrival";
    }

    // 8. Mark Cart as CHECKED_OUT
    await this.prisma.client.cart.update({
      where: { id: cart.id },
      data: { status: "CHECKED_OUT" },
    });

    // 9. Emit Event & Dispatch Webhooks
    await emitOrderPlaced(organizationId, {
      orderId: transaction.id,
      orderNumber: transaction.number,
      totalAmount: Number(transaction.finalTotal),
      currency: "KES",
      items: [
        ...orderItemsData.map((i) => ({
          productName: i.productName,
          quantity: Number(i.quantity),
          lineTotal: Number(i.lineTotal),
        })),
        ...resolvedServiceBookings.map((s) => ({
          productName: s.service.name,
          quantity: 1,
          lineTotal: Number(s.srvPrice.add(s.srvTax)),
        })),
      ],
    }).catch((err) => console.error("Failed to emit order placed event:", err));

    await this.webhookService
      .dispatch("order.placed", organizationId, {
        orderId: transaction.id,
        orderNumber: transaction.number,
        finalTotal: Number(transaction.finalTotal),
        status: transaction.status,
        customerId: cart.customerId,
        paymentId: payment.id,
        paymentStatus: payment.status,
        paymentMethod,
      })
      .catch((err) => console.error("Failed to dispatch order placed webhook:", err));

    this.openPanelService?.trackEvent("checkout.completed", cart.customerId || undefined, {
      organizationId,
      orderId: transaction.id,
      orderNumber: transaction.number,
      totalAmount: Number(transaction.finalTotal),
      itemCount: cart.items.length,
      paymentMethod,
    });

    return {
      orderId: transaction.id,
      paymentId: payment.id,
      paymentMethod,
      status: paymentStatusMessage,
      merchantRequestID: mpesaResponse?.MerchantRequestID,
      checkoutRequestID: mpesaResponse?.CheckoutRequestID,
    };
  }
}
