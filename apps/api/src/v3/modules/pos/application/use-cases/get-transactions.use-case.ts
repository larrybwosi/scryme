import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { V3ApiContext } from "@repo/shared/api/v3";
import { Decimal } from "@repo/db";
import { getDocumentUrl } from "@repo/shared/api/v2";

@Injectable()
export class GetTransactionsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(ctx: V3ApiContext, query: any) {
    const { organizationId } = ctx;
    const locationId = ctx.locationId || query.locationId;
    const { status, type, customerId, startDate, endDate } = query;

    const where: any = { organizationId };

    // Branch location filtering: All staff checked in at this branch should see the branch transactions
    if (locationId) where.locationId = locationId;

    if (status) where.status = status;
    if (type) where.type = type;
    if (customerId) where.customerId = customerId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const page = parseInt(query.page || "1", 10);
    const limit = parseInt(query.limit || "50", 10);
    const skip = (page - 1) * limit;

    const [total, transactions] = await Promise.all([
      this.prisma.client.transaction.count({ where }),
      this.prisma.client.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { id: true, name: true, email: true } },
          items: {
            select: {
              id: true,
              transactionId: true,
              variantId: true,
              productName: true,
              variantName: true,
              sku: true,
              quantity: true,
              listPrice: true,
              unitPrice: true,
              unitCost: true,
              subtotal: true,
              discountAmount: true,
              taxAmount: true,
              lineTotal: true,
              sellingUnitId: true,
              sellingOrgUnitId: true,
              notes: true,
              createdAt: true,
              updatedAt: true,
              variant: { select: { productId: true } },
            },
          },
          payments: {
            select: {
              id: true,
              transactionId: true,
              organizationId: true,
              method: true,
              status: true,
              amount: true,
              amountReceived: true,
              change: true,
              gatewayTxnId: true,
              gatewayCurrencyCode: true,
              gatewayAmount: true,
              gatewayFee: true,
              payerPhone: true,
              payerName: true,
              payoutId: true,
              referenceNumber: true,
              cashDrawerId: true,
              processedAt: true,
              createdAt: true,
              updatedAt: true,
              notes: true,
            },
          },
          fulfillments: { select: { id: true } },
        },
      }),
    ]);

    const formattedTransactions = transactions.map((t: any) => {
      const totalAmount = t.finalTotal ? Number(t.finalTotal) : 0;
      const paidAmount = t.payments
        ? t.payments.reduce((sum: number, p: any) => sum + (p.amount ? Number(p.amount) : 0), 0)
        : 0;

      let txStatus = t.paymentStatus ? t.paymentStatus.toLowerCase() : "pending";
      if (t.fulfillments && t.fulfillments.length > 0) {
        txStatus = "dispatched";
      }

      return {
        id: t.id,
        number: t.number,
        customer: t.customer?.name || "Guest",
        email: t.customer?.email || "",
        totalAmount,
        paidAmount,
        date: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString(),
        status: txStatus,
        fulfillmentId: t.fulfillments?.[0]?.id || null,
        invoiceLink: (() => {
          try {
            return getDocumentUrl("invoice", t.id, ctx.organizationId);
          } catch {
            return `/api/v2/public/documents/invoice/${t.id}`;
          }
        })(),
        items: (t.items || []).map((i: any) => ({
          id: i.id,
          productId: i.variant?.productId || i.variantId,
          productName: i.productName,
          variantId: i.variantId,
          sku: i.sku,
          quantity: i.quantity,
          unitPrice: i.unitPrice ? Number(i.unitPrice) : 0,
          totalPrice: i.lineTotal ? Number(i.lineTotal) : 0,
        })),
        payments: t.payments,
      };
    });

    if (query.page || query.limit) {
      return {
        data: formattedTransactions,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      };
    }

    return formattedTransactions;
  }
}
