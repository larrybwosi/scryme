import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CheckoutDto, CheckoutResponseDto } from "../dto/checkout.dto";
import { MpesaService } from "@repo/shared/mpesa/server";
import { emitOrderPlaced } from "@repo/windmill/server";
import { Decimal } from "decimal.js";

@Injectable()
export class CheckoutUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mpesaService: MpesaService,
  ) {}

  async execute(
    organizationId: string,
    dto: CheckoutDto,
  ): Promise<CheckoutResponseDto> {
    // 1. Get Cart
    const cart = await this.prisma.client.cart.findUnique({
      where: { id: dto.cartId },
      include: { items: true },
    });

    if (!cart) throw new NotFoundException("Cart not found");
    if (cart.items.length === 0) throw new BadRequestException("Cart is empty");

    const variantIds = cart.items
      .map((i) => i.variantId)
      .filter((id) => id !== "base");
    /**
     * ⚡ Bolt Optimization: Replaced broad 'include' with targeted 'select'.
     * Fetching only required fields for checkout (prices, names, sku) reduces
     * database I/O and memory overhead in the critical payment path.
     */
    const variants = await this.prisma.client.productVariant.findMany({
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
    const variantMap = new Map(variants.map((v) => [v.id, v]));

    // Calculate totals since Cart model doesn't have them
    let subtotal = new Decimal(0);
    const orderItemsData = cart.items.map((item) => {
      const variant = variantMap.get(item.variantId);
      const unitPrice = variant?.retailPrice
        ? new Decimal(variant.retailPrice.toString())
        : new Decimal(0);
      const itemSubtotal = unitPrice.mul(item.quantity);
      subtotal = subtotal.add(itemSubtotal);

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

    const finalTotal = subtotal; // Simplified for now

    // 2. Create Order (Transaction)
    const orderNumber = `ORD-${Date.now()}`;

    // Need a locationId.
    let locationId = dto.locationId;
    if (!locationId) {
      const location = await this.prisma.client.inventoryLocation.findFirst({
        where: { organizationId, isDefault: true },
      });
      if (!location)
        throw new BadRequestException(
          "No location provided and no default location found for organization",
        );
      locationId = location.id;
    }

    const transaction = await this.prisma.client.transaction.create({
      data: {
        organization: { connect: { id: organizationId } },
        number: orderNumber,
        type: "ONLINE_ORDER",
        channel: "ECOMMERCE_STORE",
        status: "PENDING_CONFIRMATION",
        customer: cart.customerId
          ? { connect: { id: cart.customerId } }
          : undefined,
        location: { connect: { id: locationId } },
        subtotal: subtotal,
        discountTotal: 0,
        taxTotal: 0,
        shippingTotal: 0,
        finalTotal: finalTotal,
        baseCurrencyTotal: finalTotal,
        items: {
          create: orderItemsData,
        },
      },
    });

    // 3. Create Payment record
    const payment = await this.prisma.client.payment.create({
      data: {
        organizationId,
        transactionId: transaction.id,
        amount: transaction.finalTotal,
        method: "MPESA",
        status: "PENDING",
      },
    });

    // 4. Initiate M-Pesa STK Push
    const mpesaResponse = await this.mpesaService.initiateStkPush({
      organizationId,
      transactionId: transaction.id,
      paymentId: payment.id,
      amount: Number(transaction.finalTotal),
      phoneNumber: dto.phoneNumber,
    });

    // 5. Mark Cart as CHECKED_OUT
    await this.prisma.client.cart.update({
      where: { id: cart.id },
      data: { status: "CHECKED_OUT" },
    });

    // 6. Emit Event
    await emitOrderPlaced(organizationId, {
      orderId: transaction.id,
      orderNumber: transaction.number,
      totalAmount: Number(transaction.finalTotal),
      currency: "KES",
      items: [],
    });

    return {
      orderId: transaction.id,
      paymentId: payment.id,
      status: mpesaResponse.CustomerMessage,
      merchantRequestID: mpesaResponse.MerchantRequestID,
      checkoutRequestID: mpesaResponse.CheckoutRequestID,
    };
  }
}
