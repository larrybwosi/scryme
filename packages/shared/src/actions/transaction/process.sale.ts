import {
  FulfillmentType,
  PaymentStatus,
  TransactionType,
  TransactionStatus,
  FulfillmentStatus,
  AllocationStatus,
  PaymentMethod,
  prisma as db,
  Prisma,
} from "@repo/db";
import {
  ProcessSaleInput,
  ProcessSaleResult,
  TransactionWithDetails,
} from "../../lib/validations/sale";
import { Decimal } from "decimal.js";

export async function processSale(
  organizationId: string,
  memberId: string,
  data: ProcessSaleInput,
): Promise<ProcessSaleResult> {
  try {
    const result = await db.$transaction(async (tx) => {
      // 0. Idempotency Check
      if (data.saleNumber) {
        const existing = await tx.transaction.findFirst({
          where: { organizationId, number: data.saleNumber },
          include: {
            items: true,
            payments: true,
            customer: true,
          },
        });
        if (existing) {
          return existing;
        }
      }

      // 1. Fetch organization settings for tax and currency
      const organization = await tx.organization.findUnique({
        where: { id: organizationId },
        include: { settings: true },
      });

      const taxRate = organization?.settings?.defaultTaxRate
        ? new Decimal(organization.settings.defaultTaxRate as any).div(100)
        : new Decimal(0.16);
      const currencyCode =
        (organization?.settings?.defaultCurrency as string) || "KES";

      // 2. Calculate totals and handle stock
      let subtotal = new Decimal(0);
      const itemsToCreate = [];

      for (const item of data.cartItems) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          include: { product: true },
        });

        if (!variant) throw new Error(`Variant ${item.variantId} not found`);

        const unitPrice = new Decimal(
          (item as any).unitPrice || variant.retailPrice || 0,
        );
        const lineSubtotal = unitPrice.times(item.quantity);
        subtotal = subtotal.plus(lineSubtotal);

        itemsToCreate.push({
          variantId: item.variantId,
          productName: variant.product.name,
          variantName: variant.name,
          sku: variant.sku,
          quantity: item.quantity,
          listPrice: variant.retailPrice || 0,
          unitPrice: unitPrice,
          unitCost: variant.buyingPrice || 0,
          subtotal: lineSubtotal,
          lineTotal: lineSubtotal,
          sellingUnitId: item.sellingUnitId,
        });

        // Stock Deduction Logic
        if (data.enableStockTracking) {
          // Update location-specific stock
          const stockRecord = await tx.productVariantStock.findUnique({
            where: {
              variantId_locationId: {
                variantId: item.variantId,
                locationId: data.locationId,
              },
            },
          });

          if (stockRecord) {
            await tx.productVariantStock.update({
              where: { id: stockRecord.id },
              data: {
                availableStock: { decrement: item.quantity },
                currentStock: { decrement: item.quantity },
              },
            });
          } else {
            // Create if missing (though it should ideally exist)
            await tx.productVariantStock.create({
              data: {
                organizationId,
                productId: variant.productId,
                variantId: item.variantId,
                locationId: data.locationId,
                availableStock: -item.quantity,
                currentStock: -item.quantity,
              },
            });
          }

          // Log Stock Movement
          await tx.stockMovement.create({
            data: {
              organizationId,
              variantId: item.variantId,
              fromLocationId: data.locationId,
              quantity: item.quantity,
              movementType: MovementType.SALE,
              memberId: memberId !== "api" ? memberId : undefined as any,
              notes: `Sale ${data.saleNumber || "POS"}`,
            },
          });
        }
      }

      const taxTotal = subtotal.mul(taxRate);
      const finalTotal = subtotal
        .plus(taxTotal)
        .minus(data.discountAmount || 0);

      // 3. Create Transaction
      const transaction = await tx.transaction.create({
        data: {
          number: data.saleNumber || `SALE-${Date.now()}`,
          type: TransactionType.POS_SALE,
          status: TransactionStatus.COMPLETED,
          paymentStatus: PaymentStatus.PAID,
          organizationId,
          memberId,
          locationId: data.locationId,
          customerId: data.customerId,
          subtotal,
          taxTotal,
          discountTotal: data.discountAmount || 0,
          finalTotal,
          baseCurrencyTotal: finalTotal,
          currencyCode,
          items: {
            create: itemsToCreate,
          },
          payments: {
            create: data.payments.map((p) => ({
              organizationId,
              method: p.method,
              status: PaymentStatus.COMPLETED,
              amount: p.amount,
              amountReceived: p.amountReceived,
              change: p.change,
              referenceNumber: p.reference,
              payerPhone: p.mpesaPhoneNumber,
            })),
          },
        },
        include: {
          items: true,
          payments: true,
          customer: true,
        },
      });

      return transaction;
    });

    return {
      success: true,
      message: "Sale processed successfully",
      transactionId: result.id,
      data: result,
    };
  } catch (error: any) {
    console.error("ProcessSale Error:", error);
    return {
      success: false,
      message: error.message || "Failed to process sale",
      transactionId: "",
      data: null,
    };
  }
}
