import {
  db,
  TransactionStatus,
  TransactionType,
  PaymentStatus,
  AuditEntityType,
  AuditLogAction,
  Prisma,
} from "@repo/db";
import { createAuditLog } from "../../lib/logs/logger";
import {
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
        `Invalid order data: ${validation.error.issues.map((e) => e.message).join(", ")}`,
      );
    }

    const {
      items,
      taxIds,
      enableStockTracking = true,
      isWholesale = false,
      ...orderData
    } = validation.data;

    const { customerId, businessAccountId, locationId } = orderData;

    // 2. --- Fetch Organization Settings ---
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
            discountAmount: 0,
            taxAmount: 0,
            lineTotal: lineSubtotal,
            sellingUnitId: item.sellingUnitId,
            notes: item.notes || "",
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
            number: `ORD-${Date.now()}`,
            organizationId,
            memberId,
            customerId,
            businessAccountId,
            locationId,
            type: validation.data.type,
            status: TransactionStatus.CONFIRMED,
            paymentStatus: PaymentStatus.UNPAID,
            subtotal: transactionSubTotal,
            taxTotal: transactionTaxTotal,
            discountTotal: 0,
            finalTotal,
            baseCurrencyTotal: finalTotal,
            currencyCode: baseCurrency,
            items: {
              create: transactionItemsCreateData.map((item) => ({
                ...item,
                stockAllocations: item.stockAllocations,
              })),
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
      { timeout: 15000 },
    );

    await createAuditLog(db, {
      organizationId,
      memberId,
      action: AuditLogAction.CREATE,
      entityType: AuditEntityType.TRANSACTION,
      entityId: result.id,
      description: `Order ${result.number} created`,
      details: {
        total: result.finalTotal.toNumber(),
        itemsCount: (result as any).items?.length || 0,
      },
    });

    return { success: true, transaction: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
