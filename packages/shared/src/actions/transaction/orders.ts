import {
  db,
  TransactionStatus,
  TransactionType,
  PaymentStatus,
  AuditEntityType,
  AuditLogAction,
  FulfillmentStatus,
  StockAdjustmentReason,
  AllocationStatus,
  Prisma,
} from "@repo/db";
import { createAuditLog } from "../../lib/logs/logger";
import {
  OrderFilterSchema,
  CreateOrderInput,
  CreateOrderInputSchema,
} from "../../lib/validations/order";
import { unitCalculationService } from "../../lib/services/unit-calculation.service";

export async function createOrder(
  organizationId: string,
  input: CreateOrderInput,
  memberId: string,
) {
  try {
    // 1. --- Validation & Preparation ---
    const validation = CreateOrderInputSchema.safeParse(input);
    if (!validation.success) {
      throw new Error(
        `Invalid order data: ${validation.error.errors.map((e) => e.message).join(", ")}`,
      );
    }

    const {
      items,
      taxIds,
      enableStockTracking = true,
      isWholesale = false, // Defaults to retail if not specified
      ...orderData
    } = validation.data;

    const { customerId, businessAccountId, locationId } = orderData;

    // 2. --- Fetch Organization Settings & Data ---
    const orgData = await db.organization.findUnique({
      where: { id: organizationId },
      select: { settings: true },
    });

    const settings = orgData?.settings as any;
    const inventoryPolicy = settings?.inventoryPolicy ?? "FEFO";
    const allowNegativeStock = settings?.negativeStock ?? false;
    const baseCurrency = settings?.defaultCurrency ?? "USD";

    // 3. --- Main Transaction Logic ---
    const result = await db.$transaction(
      async (tx) => {
        const variantIds = items.map((item) => item.variantId);
        const now = new Date();

        // Parallel Fetch: Variants, Taxes and Price Lists
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
                  ...(customerId
                    ? [{ customers: { some: { id: customerId } } }]
                    : []),
                  ...(businessAccountId
                    ? [
                        {
                          businessAccounts: { some: { id: businessAccountId } },
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

        // 4. --- Process Items (Pricing & Stock) ---
        let transactionSubTotal = new Prisma.Decimal(0);
        const transactionItemsCreateData: any[] =
          [];
        const variantStockUpdates = new Map<string, number>();

        for (const item of items) {
          const variant = variantsMap.get(item.variantId) as any;
          if (!variant) {
            throw new Error(
              `Product variant ID ${item.variantId} is invalid, inactive, or not part of this organization.`,
            );
          }

          // A. Resolve Price using Service
          const { price: resolvedPrice } =
            await unitCalculationService.resolvePrice({
              variantId: item.variantId,
              sellingUnitId: item.sellingUnitId,
              quantity: item.quantity,
              customerId,
              businessAccountId,
              organizationId,
              isWholesale,
              manualPrice: item.unitPrice,
              tx,
              preFetchedVariant: variant,
              preFetchedPriceLists: activePriceLists,
            });

          const lineSubtotal = resolvedPrice.mul(item.quantity);
          transactionSubTotal = transactionSubTotal.add(lineSubtotal);

          // B. Stock Allocation using Service
          const allocationsCreateData: any[] =
            [];
          let unitCost = new Prisma.Decimal(variant.buyingPrice ?? 0);

          const selectedSellingUnit = item.sellingUnitId
            ? variant.sellingUnits.find(
                (su: any) => su.id === item.sellingUnitId,
              )
            : null;

          if (enableStockTracking && locationId) {
            const conversionMultiplier =
              selectedSellingUnit?.conversionMultiplier
                ? selectedSellingUnit.conversionMultiplier.toNumber()
                : 1;

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

            const currentVariantStockUpdate =
              variantStockUpdates.get(item.variantId) || 0;
            variantStockUpdates.set(
              item.variantId,
              currentVariantStockUpdate + allocationResult.stockDeductionTotal,
            );
          }

          // C. Prepare Transaction Item Data
          transactionItemsCreateData.push({
            productId: variant.productId,
            variantId: item.variantId,
            organizationId,
            quantity: item.quantity,
            unitPrice: resolvedPrice,
            unitCost: unitCost,
            subTotal: lineSubtotal,
            taxAmount: new Prisma.Decimal(0), // Calculated later
            totalAmount: lineSubtotal, // Updated after tax
            discountAmount: new Prisma.Decimal(0),
            sellingUnitId: item.sellingUnitId,
            notes: item.notes,
            allocations: {
              create: allocationsCreateData,
            },
          });
        }

        // 5. --- Global Tax Calculation ---
        let transactionTaxTotal = new Prisma.Decimal(0);
        for (const lineItem of transactionItemsCreateData) {
          let lineTax = new Prisma.Decimal(0);
          for (const tax of applicableTaxes) {
            const amount = lineItem.subTotal.mul(tax.rate);
            lineTax = lineTax.add(amount);
          }
          lineItem.taxAmount = lineTax;
          lineItem.totalAmount = lineItem.subTotal.add(lineTax);
          transactionTaxTotal = transactionTaxTotal.add(lineTax);
        }

        const transactionFinalTotal =
          transactionSubTotal.add(transactionTaxTotal);

        // 6. --- Create Main Transaction Record ---
        const transaction = await tx.transaction.create({
          data: {
            organizationId,
            memberId,
            customerId,
            businessAccountId,
            locationId,
            type: TransactionType.SALE,
            status: TransactionStatus.COMPLETED,
            paymentStatus: PaymentStatus.UNPAID,
            subTotal: transactionSubTotal,
            taxAmount: transactionTaxTotal,
            discountAmount: new Prisma.Decimal(0),
            finalTotal: transactionFinalTotal,
            totalPaid: new Prisma.Decimal(0),
            currency: baseCurrency,
            items: {
              create: transactionItemsCreateData.map((item) => ({
                ...item,
                allocations: item.allocations,
              })),
            },
          },
          include: {
            items: {
              include: {
                allocations: true,
              },
            },
          },
        });

        // 7. --- Update Global Stock Levels ---
        if (enableStockTracking && locationId) {
          for (const [variantId, deduction] of variantStockUpdates) {
            await tx.productVariantStock.update({
              where: {
                variantId_locationId: {
                  variantId,
                  locationId,
                },
              },
              data: {
                currentStock: { decrement: deduction },
                availableStock: { decrement: deduction },
              },
            });
          }
        }

        return transaction;
      },
      {
        timeout: 15000, // Extend timeout for complex stock/pricing logic
      },
    );

    // 8. --- Post-Transaction Actions (Audit Logs) ---
    await createAuditLog({
      organizationId,
      memberId,
      action: AuditLogAction.CREATE,
      entityType: AuditEntityType.TRANSACTION,
      entityId: result.id,
      details: {
        total: result.finalTotal.toNumber(),
        itemsCount: result.items.length,
      },
    });

    return { success: true, transaction: result };
  } catch (error: any) {
    console.error("Order creation failed:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred.",
    };
  }
}
