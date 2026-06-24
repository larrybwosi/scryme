import {
  PaymentStatus,
  TransactionType,
  TransactionStatus,
  PaymentMethod,
  db,
  Prisma,
} from "@repo/db";
import {
  ProcessSaleInput,
  ProcessSaleResult,
  TransactionWithDetails,
  ProcessSaleInputSchema,
} from "../../lib/validations/sale";

import { navariService } from "../../lib/services/navari.service";
import { unitCalculationService } from "../../lib/services/unit-calculation.service";

export async function processSale(
  organizationId: string,
  input: ProcessSaleInput,
  memberId: string,
): Promise<ProcessSaleResult> {
  try {
    const validation = ProcessSaleInputSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        message: "Validation failed",
        error: `Invalid sale data: ${validation.error.issues.map((e) => e.message).join(", ")}`,
      };
    }

    const {
      cartItems: items,
      locationId,
      isWholesale = false,
      payments,
      amountReceived,
      notes,
      enableStockTracking = true,
      taxIds,
    } = validation.data;

    const amountPaid = amountReceived || 0;
    const paymentMethod = payments[0]?.method || PaymentMethod.CASH;

    const orgData = await db.organization.findUnique({
      where: { id: organizationId },
      select: { settings: true },
    });

    const settings = orgData?.settings as any;
    const inventoryPolicy = settings?.inventoryPolicy ?? "FEFO";
    const allowNegativeStock = settings?.negativeStock ?? false;
    const baseCurrency = settings?.defaultCurrency ?? "USD";
    const taxIntegrationEnabled = settings?.taxIntegrationEnabled ?? false;
    const country = settings?.country ?? "Kenya";
    const highValueThreshold =
      settings?.highValueTaxThreshold ?? new Prisma.Decimal(100000);

    const result = await db.$transaction(
      async (tx) => {
        const variantIds = items.map((item) => item.variantId);
        const now = new Date();

        const [allVariants, applicableTaxes, activePriceLists] =
          await Promise.all([
            tx.productVariant.findMany({
              where: {
                id: { in: variantIds },
                product: { organizationId, isActive: true },
              },
              include: {
                product: {
                  select: { id: true, name: true, organizationId: true },
                },
                sellingUnits: {
                  where: { isActive: true },
                  select: {
                    id: true,
                    retailPrice: true,
                    wholesalePrice: true,
                    conversionMultiplier: true,
                    systemUnitId: true,
                    orgUnitId: true,
                  },
                },
              },
            }),
            tx.taxRate.findMany({
              where: {
                id: { in: taxIds && taxIds.length > 0 ? taxIds : undefined },
                isDefault: taxIds && taxIds.length > 0 ? undefined : true,
                organizationId,
                isActive: true,
              },
              select: { id: true, name: true, rate: true },
            }),
            tx.priceList.findMany({
              where: {
                organizationId,
                isActive: true,
                AND: [
                  { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
                  { OR: [{ validTo: null }, { validTo: { gte: now } }] },
                ],
                OR: [
                  { isGlobal: true },
                  ...(validation.data.customerId
                    ? [{ customers: { some: { id: validation.data.customerId } } }]
                    : []),
                  ...(validation.data.businessAccountId
                    ? [
                        {
                          businessAccounts: { some: { id: validation.data.businessAccountId } },
                        },
                      ]
                    : []),
                ],
              },
              orderBy: { priority: "desc" },
              include: {
                items: {
                  where: {
                    variantId: { in: variantIds },
                    isActive: true,
                    deletedAt: null,
                  },
                },
              },
            }),
          ]);

        const variantsMap = new Map(allVariants.map((v: any) => [v.id, v]));
        let transactionSubTotal = new Prisma.Decimal(0);
        const transactionItemsCreateData: any[] = [];
        const variantStockUpdates = new Map<string, number>();

        for (const item of items) {
          const variant = variantsMap.get(item.variantId) as any;
          if (!variant) {
            throw new Error(`Variant ${item.variantId} not found`);
          }

          const { price: resolvedPrice } =
            await unitCalculationService.resolvePrice({
              variantId: item.variantId,
              sellingUnitId: item.sellingUnitId,
              quantity: item.quantity,
              customerId: validation.data.customerId,
              businessAccountId: validation.data.businessAccountId,
              organizationId,
              isWholesale,
              tx,
              preFetchedVariant: variant,
              preFetchedPriceLists: activePriceLists,
            });

          const lineSubtotal = resolvedPrice.mul(item.quantity);
          transactionSubTotal = transactionSubTotal.add(lineSubtotal);

          const allocationsCreateData: any[] = [];
          let unitCost = new Prisma.Decimal(variant.buyingPrice ?? 0);

          const selectedSellingUnit = item.sellingUnitId
            ? variant.sellingUnits.find(
                (su: any) => su.id === item.sellingUnitId,
              )
            : null;

          if (enableStockTracking && locationId) {
            const conversionMultiplier =
              selectedSellingUnit?.conversionMultiplier?.toNumber() || 1;

            const allocationResult =
              await unitCalculationService.calculateStockAllocation({
                tx,
                variantId: item.variantId,
                locationId,
                organizationId,
                quantityToFulfill: item.quantity,
                conversionMultiplier,
                inventoryPolicy: inventoryPolicy as any,
                allowNegativeStock,
                buyingPrice: variant.buyingPrice as unknown as Prisma.Decimal,
                productName: variant.product.name,
                variantName: variant.name || variant.product.name,
              });

            allocationsCreateData.push(...allocationResult.allocations);
            unitCost = allocationResult.unitCost;

            const currentDeduction = variantStockUpdates.get(item.variantId) || 0;
            variantStockUpdates.set(
              item.variantId,
              currentDeduction + allocationResult.stockDeductionTotal,
            );
          }

          transactionItemsCreateData.push({
            variantId: item.variantId,
            productName: variant.product.name,
            variantName: variant.name || variant.product.name,
            sku: variant.sku,
            quantity: item.quantity,
            listPrice: variant.retailPrice || 0,
            unitPrice: resolvedPrice,
            unitCost,
            subtotal: lineSubtotal,
            taxAmount: 0,
            lineTotal: lineSubtotal,
            discountAmount: 0,
            sellingUnitId: item.sellingUnitId,
            stockAllocations: { create: allocationsCreateData },
          });
        }

        let transactionTaxTotal = new Prisma.Decimal(0);
        for (const line of transactionItemsCreateData) {
          let lineTax = new Prisma.Decimal(0);
          for (const tax of applicableTaxes) {
            lineTax = lineTax.add(line.subtotal.mul(tax.rate));
          }
          line.taxAmount = lineTax;
          line.lineTotal = line.subtotal.add(lineTax);
          transactionTaxTotal = transactionTaxTotal.add(lineTax);
        }

        const finalTotal = transactionSubTotal.add(transactionTaxTotal);

        const transaction = await tx.transaction.create({
          data: {
            number: `SALE-${Date.now()}`,
            organizationId,
            memberId,
            customerId: validation.data.customerId,
            businessAccountId: validation.data.businessAccountId,
            locationId,
            type: TransactionType.POS_SALE,
            status: TransactionStatus.COMPLETED,
            paymentStatus:
              amountPaid >= finalTotal.toNumber()
                ? PaymentStatus.PAID
                : amountPaid > 0
                  ? PaymentStatus.PARTIALLY_PAID
                  : PaymentStatus.UNPAID,
            subtotal: transactionSubTotal,
            taxTotal: transactionTaxTotal,
            discountTotal: 0,
            finalTotal,
            totalPaid: amountPaid,
            currencyCode: baseCurrency,
            baseCurrencyTotal: finalTotal,
            notes: notes || "",
            items: { create: transactionItemsCreateData },
            payments: {
              create:
                amountPaid > 0
                  ? [
                      {
                        amount: amountPaid,
                        method: paymentMethod as PaymentMethod,
                        status: PaymentStatus.PAID,
                        organizationId,
                      },
                    ]
                  : [],
            },
          },
          include: { items: true },
        });

        if (enableStockTracking && locationId) {
          for (const [vId, ded] of variantStockUpdates) {
            await tx.productVariantStock.update({
              where: { variantId_locationId: { variantId: vId, locationId } },
              data: {
                currentStock: { decrement: ded },
                availableStock: { decrement: ded },
              },
            });
          }
        }

        return transaction;
      },
      { timeout: 20000 },
    );

    if (taxIntegrationEnabled) {
      try {
        await navariService.reportSale(result as any, {
          country,
          highValueThreshold: highValueThreshold.toNumber(),
        });
      } catch (err) {
        console.error("Tax reporting failed:", err);
      }
    }

    return { success: true, message: "Sale processed successfully", transactionId: result.id, data: result };
  } catch (error: any) {
    return { success: false, message: error.message, error: error.message };
  }
}
