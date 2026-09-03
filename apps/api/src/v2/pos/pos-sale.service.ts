import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import type { V2ApiContext } from "@repo/shared/api/v2";
import { getDocumentUrl } from "@repo/shared/api/v2";
import { processSale } from "@repo/shared/actions";
import { triggerStkPush } from "@repo/shared/actions";
import { createOrder } from "@repo/shared/actions";
import { ProcessSaleInputSchema } from "@repo/shared/lib";
import { CreateOrderInputSchema } from "@repo/shared/lib";

@Injectable()
export class PosSaleService {
  private readonly logger = new Logger(PosSaleService.name);

  constructor(private prisma: PrismaService) {}

  async handleSale(ctx: V2ApiContext, body: any, enableStockTracking: boolean) {
    const { organizationId, memberId, locationId: ctxLocationId } = ctx;
    const locationId = ctxLocationId || body.locationId;

    if (!locationId) {
      throw new BadRequestException(
        "locationId is required (set on the device API key or pass it in the request body)",
      );
    }

    if (!memberId) {
      throw new BadRequestException("You should be logged in to create a sale");
    }

    // 1. Validate Input
    const preCheck = ProcessSaleInputSchema.safeParse({
      ...body,
      enableStockTracking,
      locationId,
    });
    if (!preCheck.success) {
      this.logger.error(
        `Validation Failed: ${JSON.stringify(preCheck.error.flatten())}`,
      );
      throw new BadRequestException({
        message: "Invalid sale data",
        details: preCheck.error.flatten().fieldErrors,
      });
    }

    // 2. Process Sale via Shared Action
    const result = await processSale(
      organizationId,
      memberId ?? "api",
      preCheck.data,
    );

    if (!result.success || !result.data) {
      throw new BadRequestException(result.message || "Failed to process sale");
    }

    const transaction = result.data;
    const payments = (transaction as any).payments || [];

    // 3. Handle M-Pesa STK Pushes
    const mpesaPayments = payments.filter(
      (p: any) => p.method === "MPESA" && p.status === "PENDING",
    );

    // ⚡ Bolt Optimization: Parallelize high-latency external Safaricom M-Pesa STK push API calls
    // using Promise.all with localized try/catch blocks. This avoids sequential network request
    // blocking and reduces the endpoint's latency profile significantly from O(N) down to O(1).
    await Promise.all(
      mpesaPayments.map(async (payment: any) => {
        if (payment.payerPhone) {
          const mpesaInput = (preCheck.data as any).payments.find(
            (p: any) =>
              p.method === "MPESA" &&
              Math.abs(Number(p.amount) - Number(payment.amount)) < 0.01,
          );

          const flowType = mpesaInput?.mpesaFlowType || "STK_PUSH";

          if (flowType === "STK_PUSH") {
            try {
              await triggerStkPush({
                organizationId,
                amount: Number(payment.amount),
                phoneNumber: payment.payerPhone,
                transactionId: transaction.id,
                paymentId: payment.id,
              });
            } catch (stkError: any) {
              this.logger.error(
                `STK Push Failed for payment ${payment.id}: ${stkError.message}`,
              );
            }
          }
        }
      }),
    );

    return result;
  }

  async handleOrder(ctx: V2ApiContext, body: any) {
    const { organizationId, memberId, locationId: ctxLocationId } = ctx;
    const locationId = ctxLocationId || body.locationId;

    if (!locationId) {
      throw new BadRequestException("locationId is required");
    }

    // 1. Validate Input
    const preCheck = CreateOrderInputSchema.safeParse({ ...body, locationId });
    if (!preCheck.success) {
      this.logger.error(
        `Order Validation Failed: ${JSON.stringify(preCheck.error.flatten())}`,
      );
      throw new BadRequestException({
        message: "Invalid order data",
        details: preCheck.error.flatten().fieldErrors,
      });
    }

    const sanitizedData = {
      ...preCheck.data,
      customerId: preCheck.data.customerId ? preCheck.data.customerId.trim() : undefined,
      businessAccountId: preCheck.data.businessAccountId ? preCheck.data.businessAccountId.trim() : undefined,
      notes: preCheck.data.notes || undefined,
      termsAndConditions: preCheck.data.termsAndConditions || undefined,
      deliveryPartnerId: preCheck.data.deliveryPartnerId || undefined,
      fulfillment: preCheck.data.fulfillment
        ? {
            ...preCheck.data.fulfillment,
            shippingAddressId: preCheck.data.fulfillment.shippingAddressId || undefined,
            pickupLocationId: preCheck.data.fulfillment.pickupLocationId || undefined,
            tableNumber: preCheck.data.fulfillment.tableNumber || undefined,
          }
        : undefined,
      items: preCheck.data.items.map((item) => ({
        ...item,
        sellingUnitId: item.sellingUnitId || undefined,
        unitPrice: item.unitPrice ?? undefined,
      })),
      taxIds: preCheck.data.taxIds || undefined,
      enableStockTracking: preCheck.data.enableStockTracking ?? undefined,
      isWholesale: preCheck.data.isWholesale ?? undefined,
    };

    // 2. Process Order via Shared Action
    const result = await createOrder(
      organizationId,
      memberId ?? "api",
      sanitizedData as any,
    );

    if (!result.success) {
      throw new BadRequestException(result.error || "Failed to process order");
    }

    // Populate invoiceUrl so POS can directly view and download/print the invoice
    if (result.data) {
      (result.data as any).invoiceUrl = getDocumentUrl(
        "invoice",
        result.data.id,
        organizationId,
      );
    }

    return result;
  }
}
