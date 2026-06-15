import {
  prisma,
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
import { realtimeService } from "../../realtime";
import { z } from "zod";

// --- STATS FUNCTION ---
export async function getOrderStats(organizationId: string) {
  const baseWhere: Prisma.TransactionWhereInput = {
    organizationId,
    type: { not: TransactionType.POS_SALE }, // Filter for all non-POS types
  };

  try {
    const [completedStats, pendingCount, processingCount] =
      await prisma.$transaction([
        // 1. Get revenue and count for COMPLETED orders
        prisma.transaction.aggregate({
          where: {
            ...baseWhere,
            status: TransactionStatus.COMPLETED,
          },
          _sum: {
            finalTotal: true,
          },
          _count: {
            _all: true,
          },
        }),
        // 2. Get count of PENDING orders
        prisma.transaction.count({
          where: {
            ...baseWhere,
            status: TransactionStatus.PENDING_CONFIRMATION,
          },
        }),
        // 3. Get count of all "in-progress" orders
        prisma.transaction.count({
          where: {
            ...baseWhere,
            status: {
              in: [
                TransactionStatus.CONFIRMED,
                TransactionStatus.PROCESSING,
                TransactionStatus.READY,
                TransactionStatus.DISPATCHED,
              ],
            },
          },
        }),
      ]);

    const totalRevenue = completedStats._sum.finalTotal
      ? (completedStats._sum.finalTotal as Prisma.Decimal).toNumber()
      : 0;
    const totalCompletedOrders = completedStats._count._all;

    return {
      success: true,
      data: {
        totalRevenue,
        totalCompletedOrders,
        pendingOrders: pendingCount,
        processingOrders: processingCount,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to get stats" };
  }
}

/**
 * Creates a new order (Transaction) with Enterprise Pricing & Stock Logic.
 */
export async function createOrder(
  organizationId: string,
  memberId: string,
  inputData: CreateOrderInput,
) {
  let auditLogWritten = false;
  let transactionId: string | undefined;

  try {
    // 1. --- Validation ---
    const validation = CreateOrderInputSchema.safeParse(inputData);
    if (!validation.success) {
      console.log("Validation errors:", validation.error.flatten().fieldErrors);
      return {
        success: false,
        error: "Invalid input data",
        details: validation.error.flatten().fieldErrors,
        statusCode: 400,
      };
    }

    const {
      items,
      payments,
      fulfillment,
      shippingFee,
      discountAmount,
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

    const inventoryPolicy = orgData?.settings?.inventoryPolicy ?? "FEFO";
    const allowNegativeStock = orgData?.settings?.negativeStock ?? false;
    const baseCurrency = orgData?.settings?.defaultCurrency ?? "USD";

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

        const variantsMap = new Map(allVariants.map((v) => [v.id, v]));

        // 4. --- Process Items (Pricing & Stock) ---
        let transactionSubTotal = new Prisma.Decimal(0);
        const transactionItemsCreateData: Prisma.TransactionItemCreateWithoutTransactionInput[] =
          [];
        const variantStockUpdates = new Map<string, number>();

        for (const item of items) {
          const variant = variantsMap.get(item.variantId);
          if (!variant) {
            throw new Error(
              `Product variant ID ${item.variantId} is invalid, inactive, or not part of this organization.`,
            );
          }

          // A. Resolve Price using Service
          const { price: resolvedPrice, defaultPrice } =
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
          const allocationsCreateData: Prisma.InventoryAllocationCreateWithoutTransactionItemInput[] =
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
            unitCost = new Prisma.Decimal(
              allocationResult.unitCost as unknown as Prisma.Decimal,
            );

            const currentVariantStockUpdate =
              variantStockUpdates.get(item.variantId) ?? 0;
            variantStockUpdates.set(
              item.variantId,
              currentVariantStockUpdate + allocationResult.stockDeductionTotal,
            );
          }

          // D. Prepare Transaction Item Data
          // Connect to the specific SystemUnit or OrgUnit based on the config
          const systemUnitConnect = selectedSellingUnit?.systemUnitId
            ? { connect: { id: selectedSellingUnit.systemUnitId } }
            : undefined;

          const orgUnitConnect = selectedSellingUnit?.orgUnitId
            ? { connect: { id: selectedSellingUnit.orgUnitId } }
            : undefined;

          transactionItemsCreateData.push({
            variant: { connect: { id: item.variantId } },
            sellingUnit: systemUnitConnect,
            sellingOrgUnit: orgUnitConnect,

            productName: variant.product.name,
            variantName: variant.name || variant.product.name,
            sku: variant.sku ?? "N/A",
            quantity: item.quantity,

            listPrice: defaultPrice as unknown as Prisma.Decimal, // Store the original base price
            unitPrice: resolvedPrice as unknown as Prisma.Decimal, // Store the actual applied price
            unitCost: unitCost,
            subtotal: lineSubtotal,
            lineTotal: lineSubtotal,

            stockAllocations: { create: allocationsCreateData },
          });
        }

        // 5. --- Financial Calculations (Global) ---
        const transactionDiscount = new Prisma.Decimal(discountAmount ?? 0);
        const inputShipping = new Prisma.Decimal(shippingFee ?? 0);

        if (transactionDiscount.gt(transactionSubTotal)) {
          throw new Error(`Discount cannot exceed subtotal.`);
        }

        const goodsTotalInclusive =
          transactionSubTotal.sub(transactionDiscount);

        // Tax Logic (Inclusive Calculation)
        const totalTaxRate = applicableTaxes.reduce(
          (sum, tax) => sum.add(tax.rate),
          new Prisma.Decimal(0),
        );

        const totalAmountBeforeTax = totalTaxRate.gt(0)
          ? goodsTotalInclusive
              .div(new Prisma.Decimal(1).add(totalTaxRate))
              .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
          : goodsTotalInclusive;

        const totalCalculatedTax =
          goodsTotalInclusive.sub(totalAmountBeforeTax);

        const appliedTaxesCreateData = applicableTaxes.map((tax) => ({
          taxRateId: tax.id,
          name: tax.name,
          rate: tax.rate,
          amount: totalAmountBeforeTax
            .mul(tax.rate)
            .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP),
        }));

        const calculatedFinalTotal = goodsTotalInclusive.add(inputShipping);

        // 6. --- Payment Status ---
        const totalPaidAmount = (payments || []).reduce(
          (sum: Prisma.Decimal, payment: any) =>
            sum.add(new Prisma.Decimal(payment.amount)),
          new Prisma.Decimal(0),
        );

        let calcPaymentStatus;
        if (calculatedFinalTotal.equals(0))
          calcPaymentStatus = PaymentStatus.COMPLETED;
        else if (totalPaidAmount.gte(calculatedFinalTotal))
          calcPaymentStatus = PaymentStatus.COMPLETED;
        else if (totalPaidAmount.gt(0))
          calcPaymentStatus = PaymentStatus.PARTIALLY_PAID;

        const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

        // 7. --- Update Stock (Deduct immediately for orders) ---
        if (enableStockTracking && locationId) {
          await Promise.all(
            Array.from(variantStockUpdates.entries()).map(
              ([variantId, quantityChange]) =>
                tx.productVariantStock.updateMany({
                  where: { variantId, locationId, organizationId },
                  data: {
                    currentStock: { decrement: quantityChange },
                    availableStock: { decrement: quantityChange },
                  },
                }),
            ),
          );
        }

        // 8. --- Create Transaction Record ---
        const newOrder = await tx.transaction.create({
          data: {
            ...orderData, // contains customerId, organizationId, etc.
            organizationId,
            memberId,
            deliveryPartnerId: validation.data.deliveryPartnerId,
            termsAndConditions: validation.data.termsAndConditions,
            number: orderNumber,
            type: orderData.type ?? TransactionType.ONLINE_ORDER,
            status:
              orderData.type === TransactionType.QUOTE
                ? TransactionStatus.DRAFT
                : TransactionStatus.COMPLETED, // Mark as completed since stock is deducted
            paymentStatus: calcPaymentStatus || PaymentStatus.PENDING,

            subtotal: totalAmountBeforeTax,
            discountTotal: transactionDiscount,
            taxTotal: totalCalculatedTax,
            shippingTotal: inputShipping,
            finalTotal: calculatedFinalTotal,

            baseCurrencyTotal: calculatedFinalTotal, // Assuming 1:1 for now, can be updated if FX is added
            currencyCode: baseCurrency,
            exchangeRate: 1,

            items: { create: transactionItemsCreateData },
            payments: {
              create: (payments || []).map((p: any) => ({
                amount: p.amount,
                method: p.method,
                organizationId,
              })),
            },
            attachments: validation.data.attachments
              ? {
                  create: validation.data.attachments.map((a) => ({
                    ...a,
                    organizationId,
                    memberId,
                  })),
                }
              : undefined,
            taxes: { create: appliedTaxesCreateData },

            fulfillments: fulfillment
              ? {
                  create: [
                    {
                      type: fulfillment.type,
                      status: FulfillmentStatus.PENDING,
                      pickupLocationId: fulfillment.pickupLocationId,
                      // Map additional fulfillment fields if schema allows
                    },
                  ],
                }
              : undefined,
          },
          include: {
            items: true,
            payments: true,
            fulfillments: true,
            customer: true,
          },
        });

        transactionId = newOrder.id;
        return newOrder;
      },
      { maxWait: 15000, timeout: 20000 },
    ); // Extended timeout for large orders

    // 8. --- Audit Log (Post-Transaction) ---
    if (transactionId) {
      // --- Real-time Notification ---
      realtimeService
        .publish(`org:${organizationId}:transactions`, "transaction:created", {
          id: result.id,
          number: result.number,
          type: result.type,
          status: result.status,
          finalTotal: result.finalTotal,
          customerName: result.customer?.name || "Walk-in Customer",
          createdAt: result.createdAt,
        })
        .catch((err) =>
          console.error("Failed to publish real-time update:", err),
        );

      await createAuditLog(db, {
        organizationId,
        memberId,
        action: AuditLogAction.CREATE,
        entityType: AuditEntityType.TRANSACTION,
        entityId: transactionId,
        description: `Created order ${result.number}. Total: ${result.finalTotal}`,
      });
    }

    return {
      success: true,
      data: result,
      statusCode: 201,
    };
  } catch (error: any) {
    console.error("[CREATE_ORDER_ERROR]", error);

    // Attempt failure log
    try {
      await createAuditLog(db, {
        organizationId,
        memberId,
        action: AuditLogAction.CREATE,
        entityType: AuditEntityType.TRANSACTION,
        entityId: "N/A",
        description: `Failed to create order: ${error.message}`,
        details: { error: String(error) },
      });
    } catch (e) {}

    return {
      success: false,
      error: error.message || "Failed to create order",
      statusCode: 500,
    };
  }
}

// ===================================
// READ (R)
// ===================================

/**
 * Gets a single order by its ID.
 */
export async function getOrderById(
  organizationId: string,
  transactionId: string,
) {
  try {
    const order = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        organizationId,
        type: { not: TransactionType.POS_SALE }, // Ensure it's an order
      },
      include: {
        items: { include: { variant: true, sellingUnit: true } }, // Also include sellingUnit
        payments: true,
        fulfillments: {
          include: { shippingAddress: true, pickupLocation: true },
        },
        customer: true,
        member: { select: { id: true, user: { select: { name: true } } } },
      },
    });

    if (!order) {
      return {
        success: false,
        error: "Order not found",
        statusCode: 404,
      };
    }
    return { success: true, data: order, statusCode: 200 };
  } catch (error: any) {
    console.error("[GET_ORDER_ERROR]", error);
    return {
      success: false,
      error: "Failed to retrieve order",
      statusCode: 500,
    };
  }
}

/**
 * Gets a paginated list of all orders.
 */
export async function getPaginatedOrders(
  organizationId: string,
  optionsInput: unknown,
) {
  try {
    // 1. --- Validation ---
    const validation = OrderFilterSchema.safeParse(optionsInput);
    if (!validation.success) {
      return {
        success: false,
        error: "Invalid filter options",
        details: validation.error.flatten().fieldErrors,
        statusCode: 400,
      };
    }
    const { page, pageSize, searchTerm, status, dateFrom, dateTo, sortBy } =
      validation.data;

    const skip = (page - 1) * pageSize;

    // 2. --- Build Query ---
    const where: Prisma.TransactionWhereInput = {
      organizationId,
      type: { not: TransactionType.POS_SALE }, // Filter for "orders"
    };

    if (searchTerm) {
      where.OR = [
        { number: { contains: searchTerm, mode: "insensitive" } },
        { customer: { name: { contains: searchTerm, mode: "insensitive" } } },
      ];
    }
    if (status) {
      where.status = status as TransactionStatus;
    }
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const orderBy = sortBy
      ? { [sortBy.split(":")[0]]: sortBy.split(":")[1] || "desc" }
      : undefined;

    // 3. --- Database Transaction ---
    const [transactions, total] = await prisma.$transaction([
      prisma.transaction.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true } },
          items: {
            select: {
              id: true,
              productName: true,
              variantName: true,
              quantity: true,
            },
          },
          fulfillments: { select: { type: true, status: true } },
        },
        orderBy,
        skip,
        take: pageSize,
      }),
      prisma.transaction.count({ where }),
    ]);

    // 4. --- Format Response ---
    return {
      success: true,
      data: transactions,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
      statusCode: 200,
    };
  } catch (error: any) {
    console.error("[GET_PAGINATED_ORDERS_ERROR]", error);
    return {
      success: false,
      error: "Failed to retrieve orders",
      statusCode: 500,
    };
  }
}

/**
 * CONFIRMS an order (e.g., PENDING_CONFIRMATION -> CONFIRMED).
 * This validates stock availability in BASE units, reserves stock, and soft-allocates batches.
 */
export async function confirmOrder(
  organizationId: string,
  memberId: string,
  transactionId: string,
) {
  let auditLogWritten = false;

  try {
    // 1. Fetch Organization Settings for Inventory Policy (FEFO vs LIFO)
    const orgData = await db.organization.findUnique({
      where: { id: organizationId },
      select: { settings: true },
    });
    const inventoryPolicy = orgData?.settings?.inventoryPolicy ?? "FEFO";

    const confirmedTransaction = await db.$transaction(
      async (tx) => {
        // 2. Fetch Order with Deep Relations to resolve Units
        const order = await tx.transaction.findUnique({
          where: { id: transactionId, organizationId },
          include: {
            items: {
              include: {
                // The unit actually stored on the transaction item (from utilites.prisma)
                sellingUnit: true, // Relation to SystemUnit
                sellingOrgUnit: true, // Relation to OrganizationUnit

                // The variant and its configuration (from inventory.prisma)
                variant: {
                  include: {
                    product: { select: { id: true, name: true } },
                    // Fetch all configured selling units for this variant to find the multiplier
                    sellingUnits: {
                      where: { isActive: true },
                      select: {
                        id: true,
                        systemUnitId: true,
                        orgUnitId: true,
                        conversionMultiplier: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });

        if (!order) throw new Error("Order not found");

        if (order.status !== TransactionStatus.PENDING_CONFIRMATION) {
          throw new Error(
            `Order cannot be confirmed. Current status: ${order.status}`,
          );
        }

        // Ensure the order status is one of the allowed types
        const allowedStatuses: Array<"CONFIRMED" | "PROCESSING" | "READY"> = [
          "CONFIRMED",
          "PROCESSING",
          "READY",
        ];
        if (!allowedStatuses.includes(order.status as any)) {
          throw new Error(`Invalid order status: ${order.status}`);
        }

        // 3. Aggregate Base Quantities (Convert Boxes -> Pieces)
        // We need to know total base units required per variant to check stock levels.
        const baseQuantitiesToCommit = new Map<string, number>();

        // We also track how many base units each specific line item needs for batch allocation later
        const itemBaseNeeds = new Map<string, number>();

        for (const item of order.items) {
          let multiplier = 1;

          // Logic: Find the VariantSellingUnit config that matches the System/Org unit used in this item
          if (item.sellingUnitId) {
            // Match SystemUnit
            const config = item.variant.sellingUnits.find(
              (su) => su.systemUnitId === item.sellingUnitId,
            );
            if (config?.conversionMultiplier)
              multiplier = config.conversionMultiplier.toNumber();
          } else if (item.sellingOrgUnitId) {
            // Match OrganizationUnit
            const config = item.variant.sellingUnits.find(
              (su) => su.orgUnitId === item.sellingOrgUnitId,
            );
            if (config?.conversionMultiplier)
              multiplier = config.conversionMultiplier.toNumber();
          }

          const baseQuantity = item.quantity * multiplier;

          // Add to variant total
          const currentTotal = baseQuantitiesToCommit.get(item.variantId) || 0;
          baseQuantitiesToCommit.set(
            item.variantId,
            currentTotal + baseQuantity,
          );

          // Record specific item need
          itemBaseNeeds.set(item.id, baseQuantity);
        }

        // 4. Verify & Reserve Stock (Variant Level)
        const variantIds = Array.from(baseQuantitiesToCommit.keys());

        // Fetch current stock levels for these variants at this location
        const stockPools = await tx.productVariantStock.findMany({
          where: {
            variantId: { in: variantIds },
            locationId: order.locationId,
            organizationId,
          },
        });
        const stockPoolMap = new Map(stockPools.map((s) => [s.variantId, s]));

        const stockUpdates: Prisma.PrismaPromise<any>[] = [];
        const stockAdjustments: Prisma.StockAdjustmentCreateManyInput[] = [];
        const allocationCreations: Prisma.InventoryAllocationCreateManyInput[] =
          [];
        for (const [variantId, totalBaseNeeded] of Array.from(
          baseQuantitiesToCommit.entries(),
        )) {
          const pool = stockPoolMap.get(variantId);
          const variantName =
            order.items.find((i) => i.variantId === variantId)?.variantName ||
            "Unknown";

          if (!pool) {
            throw new Error(
              `No stock record found for ${variantName} at this location.`,
            );
          }

          if (
            new Prisma.Decimal(pool.availableStock as any).lt(totalBaseNeeded)
          ) {
            throw new Error(
              `Insufficient stock for ${variantName}. Required: ${totalBaseNeeded}, Available: ${pool.availableStock}`,
            );
          }

          // A. Move Stock: Available -> Reserved
          stockUpdates.push(
            tx.productVariantStock.update({
              where: { id: pool.id },
              data: {
                availableStock: { decrement: totalBaseNeeded },
                reservedStock: { increment: totalBaseNeeded },
              },
            }),
          );

          // B. Log the Reservation (Audit Trail)
          const refItem = order.items.find((i) => i.variantId === variantId);
          stockAdjustments.push({
            organizationId,
            memberId,
            variantId,
            locationId: order.locationId!,
            referenceNumber: refItem?.id || transactionId!,
            reason: StockAdjustmentReason.ORDER_COMMIT,
            quantity: -totalBaseNeeded,
            notes: `Order ${order.number} confirmed (Stock Reserved)`,
          } as any);

          // C. Soft Allocate Batches (FEFO/LIFO)
          const batchOrderBy: Prisma.StockBatchOrderByWithRelationInput[] =
            inventoryPolicy === "LIFO"
              ? [{ receivedDate: "desc" }]
              : [{ expiryDate: "asc" }, { receivedDate: "asc" }];

          const availableBatches = await tx.stockBatch.findMany({
            where: {
              variantId,
              locationId: order.locationId,
              organizationId,
              currentQuantity: { gt: 0 },
            },
            orderBy: batchOrderBy,
          });

          let remainingToAllocateForVariant = totalBaseNeeded;

          for (const batch of availableBatches) {
            if (remainingToAllocateForVariant <= 0) break;

            const takeFromBatch = Math.min(
              remainingToAllocateForVariant,
              new Prisma.Decimal(batch.currentQuantity as any).toNumber(),
            );

            const applicableItems = order.items.filter(
              (i) =>
                i.variantId === variantId && (itemBaseNeeds.get(i.id) || 0) > 0,
            );

            let batchQtyUsed = 0;

            for (const item of applicableItems) {
              if (batchQtyUsed >= takeFromBatch) break;

              const needed = itemBaseNeeds.get(item.id) || 0;
              const availableInSlice = takeFromBatch - batchQtyUsed;
              const allocateAmount = Math.min(needed, availableInSlice);

              allocationCreations.push({
                transactionItemId: item.id,
                stockBatchId: batch.id,
                inventoryLocationId: order.locationId!,
                quantity: allocateAmount as any,
                status: AllocationStatus.RESERVED,
              });

              itemBaseNeeds.set(item.id, needed - allocateAmount);
              batchQtyUsed += allocateAmount;
            }

            remainingToAllocateForVariant -= takeFromBatch;
          }
        }

        // 5. Execute DB Operations
        await Promise.all(stockUpdates); // Update VariantStock counts

        if (allocationCreations.length > 0) {
          await tx.inventoryAllocation.createMany({
            data: allocationCreations,
          }); // Create links to batches
        }

        if (stockAdjustments.length > 0) {
          await tx.stockAdjustment.createMany({ data: stockAdjustments }); // Log history
        }

        // 6. Update Order Status
        return tx.transaction.update({
          where: { id: transactionId },
          data: {
            status: TransactionStatus.CONFIRMED,
            confirmedAt: new Date(),
          },
          include: {
            items: true,
            payments: true,
            fulfillments: true,
            customer: true,
          },
        });
      },
      { maxWait: 10000, timeout: 20000 },
    );

    // 7. Success Audit Log
    await createAuditLog(db, {
      organizationId,
      memberId,
      action: AuditLogAction.UPDATE,
      entityType: AuditEntityType.TRANSACTION,
      entityId: confirmedTransaction.id,
      description: `Confirmed order ${confirmedTransaction.number}. Stock reserved.`,
    });
    auditLogWritten = true;

    return {
      success: true,
      data: confirmedTransaction,
      message: "Order confirmed and stock reserved successfully.",
      statusCode: 200,
    };
  } catch (error: any) {
    console.error("[CONFIRM_ORDER_ERROR]", error);

    // Failure Audit Log
    if (!auditLogWritten) {
      try {
        await createAuditLog(db, {
          organizationId,
          memberId,
          action: AuditLogAction.UPDATE,
          entityType: AuditEntityType.TRANSACTION,
          entityId: transactionId,
          description: `Failed to confirm order: ${error.message}`,
          details: { error: error.stack },
        });
      } catch (e) {
        /* ignore secondary error */
      }
    }

    const isClientError =
      error.message.includes("Insufficient stock") ||
      error.message.includes("not found") ||
      error.message.includes("cannot be confirmed");

    return {
      success: false,
      error: error.message || "Failed to confirm order",
      statusCode: isClientError ? 400 : 500,
    };
  }
}

// --- Helper Functions for Manual Calculation ---

// --- Main Functions ---

export async function cancelOrder(
  organizationId: string,
  memberId: string,
  transactionId: string,
  reason: string,
) {
  let auditLogWritten = false;
  try {
    const validation = z
      .string()
      .min(3, "Reason must be provided")
      .safeParse(reason);
    if (!validation.success) {
      return {
        success: false,
        error: "A reason is required to cancel an order.",
        statusCode: 400,
      };
    }

    const cancelledTransaction = await prisma.$transaction(
      async (tx) => {
        // 1. Fetch Order with Conversions
        const order = await tx.transaction.findUnique({
          where: { id: transactionId, organizationId },
          include: {
            items: {
              include: {
                sellingUnit: true,
                variant: {
                  select: {
                    baseUnitId: true,
                    product: {
                      select: {
                        // Needed to calculate how much to put back
                        unitConversions: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });

        if (!order) {
          throw new Error("Order not found");
        }

        const cancelableStatuses: TransactionStatus[] = [
          TransactionStatus.DISPATCHED,
          TransactionStatus.COMPLETED,
          TransactionStatus.CANCELLED,
        ];

        if (cancelableStatuses.includes(order.status)) {
          throw new Error(
            `Order cannot be cancelled. Current status: ${order.status}`,
          );
        }

        const stockWasCommitted = [
          TransactionStatus.CONFIRMED,
          TransactionStatus.PROCESSING,
          TransactionStatus.READY,
        ].includes(order.status as any); // Safe cast if needed, or define array

        if (stockWasCommitted) {
          // 3. Aggregate Item Quantities (Converted to BASE units)
          const variantBaseQuantities = new Map<string, number>();

          for (const item of order.items) {
            const variantId = item.variantId;
            const baseUnitId = item.variant?.baseUnitId;
            const sellingUnitId =
              item.sellingUnit?.id ||
              item.sellingUnitId ||
              item.sellingOrgUnitId;

            let qtyToReturn = item.quantity;

            if (baseUnitId && sellingUnitId) {
              try {
                qtyToReturn = await unitCalculationService.convertUnit({
                  value: item.quantity,
                  fromUnitId: sellingUnitId,
                  toUnitId: baseUnitId,
                  organizationId,
                  productId: (item.variant.product as any).id as any,
                });
              } catch (e) {
                console.warn(`Conversion failed for variant ${variantId}:`, e);
              }
            }

            const current = variantBaseQuantities.get(variantId) || 0;
            variantBaseQuantities.set(variantId, current + qtyToReturn);
          }

          const variantIds = Array.from(variantBaseQuantities.keys());

          // 4. Fetch Stock
          const stockAllocations = await tx.productVariantStock.findMany({
            where: {
              variantId: { in: variantIds },
              locationId: order.locationId,
            },
          });
          const stockMap = new Map(
            stockAllocations.map((s) => [s.variantId, s]),
          );

          // 5. Updates
          const stockUpdates = [];
          const stockAdjustments: Prisma.StockAdjustmentCreateManyInput[] = [];

          for (const [variantId, quantity] of Array.from(
            variantBaseQuantities.entries(),
          )) {
            const stock = stockMap.get(variantId);
            if (!stock) {
              console.warn(
                `Stock record not found for variant ${variantId} during cancellation.`,
              );
              continue;
            }

            const quantityToRestock = Math.min(
              quantity,
              new Prisma.Decimal(stock.reservedStock as any).toNumber(),
            );

            if (quantityToRestock > 0) {
              stockUpdates.push(
                tx.productVariantStock.update({
                  where: { id: stock.id },
                  data: {
                    reservedStock: { decrement: quantityToRestock },
                    availableStock: { increment: quantityToRestock },
                  },
                }),
              );

              // Fix: Use 'referenceNumber' instead of 'transactionItemId'
              stockAdjustments.push({
                organizationId,
                memberId,
                variantId,
                locationId: order.locationId,
                referenceNumber: order.items.find(
                  (i) => i.variantId === variantId,
                )!.id,
                reason: StockAdjustmentReason.ORDER_CANCEL,
                quantity: quantityToRestock,
                notes: `Order ${order.number} cancelled: ${reason}`,
              });
            }
          }

          // 6. DB Writes
          await Promise.all(stockUpdates);
          if (stockAdjustments.length > 0) {
            await tx.stockAdjustment.createMany({ data: stockAdjustments });
          }
        }

        // 7. Update Statuses
        await tx.fulfillment.updateMany({
          where: { transactionId: order.id },
          data: { status: FulfillmentStatus.CANCELLED },
        });

        return tx.transaction.update({
          where: { id: transactionId },
          data: { status: TransactionStatus.CANCELLED },
          include: { items: true, fulfillments: true },
        });
      },
      { maxWait: 10000, timeout: 20000 },
    );

    // 8. Audit Log
    await createAuditLog(prisma, {
      organizationId,
      memberId,
      action: AuditLogAction.UPDATE,
      entityType: AuditEntityType.TRANSACTION,
      entityId: cancelledTransaction.id,
      description: `Cancelled order ${cancelledTransaction.number}.`,
      details: { reason },
    });
    auditLogWritten = true;

    return { success: true, data: cancelledTransaction, statusCode: 200 };
  } catch (error: any) {
    console.error("[CANCEL_ORDER_ERROR]", error);
    if (!auditLogWritten) {
      await createAuditLog(prisma, {
        organizationId,
        memberId,
        action: AuditLogAction.UPDATE,
        entityType: AuditEntityType.TRANSACTION,
        entityId: transactionId,
        description: `Failed to cancel order: ${error.message}`,
        details: { error: error.stack, reason },
      });
    }
    const isClientError =
      error.message.includes("not found") ||
      error.message.includes("cannot be cancelled");
    return {
      success: false,
      error: error.message || "Failed to cancel order",
      statusCode: isClientError ? 400 : 500,
    };
  }
}
