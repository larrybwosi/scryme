import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import type { V2ApiContext } from "@repo/shared/api/v2/types/context";
import { TransactionType, TransactionStatus, PaymentStatus } from "@repo/db";
import { z } from "zod";
import { emitOrderPlaced } from "@repo/windmill/server";

const CreateOrderSchema = z.object({
  externalOrderId: z.string().min(1),
  locationId: z.string().min(1),
  customerId: z.string().optional(),
  currencyCode: z.string().length(3).default("USD"),
  items: z
    .array(
      z.object({
        variantId: z.string().min(1),
        quantity: z.number().int().positive(),
        unitPrice: z.number().positive(),
      }),
    )
    .min(1),
  shippingTotal: z.number().nonnegative().default(0),
  discountTotal: z.number().nonnegative().default(0),
  notes: z.string().optional(),
});

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async getOrders(ctx: V2ApiContext, query: any) {
    const { organizationId } = ctx;
    const page = Math.max(1, parseInt(query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || "25", 10)));
    const skip = (page - 1) * limit;

    try {
      const where = {
        organizationId,
        channel: "ECOMMERCE_STORE" as any,
      };

      const [transactions, total] = await Promise.all([
        this.prisma.client.transaction.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            number: true,
            status: true,
            paymentStatus: true,
            finalTotal: true,
            currencyCode: true,
            createdAt: true,
            metadata: true,
            customer: { select: { id: true, name: true, email: true } },
            items: {
              select: {
                id: true,
                productName: true,
                variantName: true,
                sku: true,
                quantity: true,
                unitPrice: true,
                lineTotal: true,
              },
            },
          },
        }),
        this.prisma.client.transaction.count({ where }),
      ]);

      const shaped = transactions.map(t => {
        const meta = (t.metadata ?? {}) as Record<string, unknown>;
        return {
          id: t.id,
          orderNumber: t.number,
          externalOrderId: (meta.externalOrderId as string | null) ?? null,
          status: t.status,
          paymentStatus: t.paymentStatus,
          total: t.finalTotal,
          currency: t.currencyCode,
          customer: t.customer ?? null,
          createdAt: t.createdAt,
          items: t.items.map(i => ({
            id: i.id,
            productName: i.productName,
            variantName: i.variantName,
            sku: i.sku,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            lineTotal: i.lineTotal,
          })),
        };
      });

      return {
        orders: shaped,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new InternalServerErrorException("Failed to fetch orders");
    }
  }

  async createOrder(ctx: V2ApiContext, body: any) {
    const parsed = CreateOrderSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: "Validation failed",
        details: parsed.error.flatten(),
      });
    }

    const data = parsed.data;

    // Idempotency: check if this externalOrderId was already submitted via metadata
    const existingTxn = await this.prisma.client.transaction.findFirst({
      where: {
        organizationId: ctx.organizationId,
        metadata: { path: ["externalOrderId"], equals: data.externalOrderId },
      },
      select: {
        id: true,
        number: true,
        status: true,
        paymentStatus: true,
        finalTotal: true,
        currencyCode: true,
        createdAt: true,
      },
    });
    if (existingTxn) {
      return {
        order: {
          id: existingTxn.id,
          orderNumber: existingTxn.number,
          externalOrderId: data.externalOrderId,
          status: existingTxn.status,
          paymentStatus: existingTxn.paymentStatus,
          total: existingTxn.finalTotal,
          currency: existingTxn.currencyCode,
          createdAt: existingTxn.createdAt,
        },
        idempotent: true,
        message: "Order already exists for this externalOrderId",
      };
    }

    // Resolve variants and check stock
    const variantIds = data.items.map(i => i.variantId);
    const variants = await this.prisma.client.productVariant.findMany({
      where: {
        id: { in: variantIds },
        product: { organizationId: ctx.organizationId },
      },
      select: {
        id: true,
        sku: true,
        name: true,
        retailPrice: true,
        buyingPrice: true,
        product: { select: { name: true } },
        variantStocks: {
          where: { locationId: data.locationId },
          select: { availableStock: true, locationId: true },
        },
      },
    });

    if (variants.length !== variantIds.length) {
      const missing = variantIds.filter(id => !variants.find(v => v.id === id));
      throw new NotFoundException({
        message: "One or more variants not found",
        missingVariantIds: missing,
      });
    }

    // Check stock levels
    const insufficientStock: any[] = [];
    for (const item of data.items) {
      const variant = variants.find(v => v.id === item.variantId)!;
      const stock = Number(variant.variantStocks[0]?.availableStock ?? 0);
      if (stock < item.quantity) {
        insufficientStock.push({
          variantId: item.variantId,
          sku: variant.sku,
          requested: item.quantity,
          available: stock,
        });
      }
    }
    if (insufficientStock.length > 0) {
      throw new ConflictException({
        message: "Insufficient inventory",
        insufficientStock,
      });
    }

    // Build financials
    const subtotal = data.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    const finalTotal = subtotal + data.shippingTotal - data.discountTotal;

    // Generate order number
    const count = await this.prisma.client.transaction.count({
      where: { organizationId: ctx.organizationId },
    });
    const orderNumber = `ECO-${String(count + 1).padStart(6, "0")}`;

    try {
      const result = await this.prisma.client.$transaction(async tx => {
        const transaction = await tx.transaction.create({
          data: {
            number: orderNumber,
            type: TransactionType.POS_SALE,
            channel: "ECOMMERCE_STORE",
            status: TransactionStatus.PENDING_CONFIRMATION,
            paymentStatus: PaymentStatus.UNPAID,
            organizationId: ctx.organizationId,
            customerId: data.customerId ?? null,
            locationId: data.locationId,
            subtotal,
            discountTotal: data.discountTotal,
            taxTotal: 0,
            shippingTotal: data.shippingTotal,
            finalTotal,
            currencyCode: data.currencyCode,
            exchangeRate: 1,
            baseCurrencyTotal: finalTotal,
            notes: data.notes ?? null,
            metadata: {
              externalOrderId: data.externalOrderId,
              source: "v2_api",
              apiKeyId: ctx.apiKeyId,
            },
            items: {
              create: data.items.map(item => {
                const variant = variants.find(v => v.id === item.variantId)!;
                return {
                  variantId: item.variantId,
                  productName: variant.product.name,
                  variantName: variant.name,
                  sku: variant.sku,
                  quantity: item.quantity,
                  listPrice: Number(variant.retailPrice),
                  unitPrice: item.unitPrice,
                  unitCost: Number(variant.buyingPrice),
                  subtotal: item.unitPrice * item.quantity,
                  discountAmount: 0,
                  taxAmount: 0,
                  lineTotal: item.unitPrice * item.quantity,
                };
              }),
            },
          },
          select: {
            id: true,
            number: true,
            status: true,
            paymentStatus: true,
            finalTotal: true,
            currencyCode: true,
            createdAt: true,
          },
        });

        return transaction;
      });

      // Emit Windmill event
      emitOrderPlaced(ctx.organizationId, {
        orderId: result.id,
        orderNumber: result.number,
        customerId: data.customerId,
        totalAmount: Number(result.finalTotal),
        currency: result.currencyCode,
        items: data.items.map(i => {
          const v = variants.find(varnt => varnt.id === i.variantId)!;
          return {
            productName: `${v.product.name} - ${v.name}`,
            quantity: i.quantity,
            lineTotal: i.unitPrice * i.quantity,
          };
        }),
      }).catch(err =>
        console.error("[v2 orders POST] Failed to emit Windmill event:", err),
      );

      return {
        order: {
          id: result.id,
          orderNumber: result.number,
          externalOrderId: data.externalOrderId,
          status: result.status,
          paymentStatus: result.paymentStatus,
          total: result.finalTotal,
          currency: result.currencyCode,
          createdAt: result.createdAt,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException("Failed to create order");
    }
  }
}
