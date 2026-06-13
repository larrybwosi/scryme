import {
  Prisma,
  AllocationStatus,
  InventoryPolicy,
  prisma as db,
} from "@repo/db";
import { Decimal } from "decimal.js";
import { conversionService } from "./conversion.service";

export interface UnitConversionParams {
  value: number | Decimal;
  fromUnitId: string;
  toUnitId: string;
  organizationId: string;
  productId?: string;
}

export interface PriceResolutionParams {
  variantId: string;
  sellingUnitId?: string | null;
  quantity: number;
  customerId?: string | null;
  businessAccountId?: string | null;
  organizationId: string;
  isWholesale?: boolean;
  manualPrice?: number | null;
  tx?: Prisma.TransactionClient;
  preFetchedVariant?: any;
  preFetchedPriceLists?: any[];
}

export interface StockAllocationParams {
  tx: Prisma.TransactionClient;
  variantId: string;
  locationId: string;
  organizationId: string;
  quantityToFulfill: number; // In the requested selling unit
  conversionMultiplier: number;
  inventoryPolicy: InventoryPolicy;
  allowNegativeStock: boolean;
  buyingPrice: Decimal;
}

export interface AllocationResult {
  allocations: Prisma.InventoryAllocationCreateWithoutTransactionItemInput[];
  unitCost: Decimal;
  stockDeductionTotal: number; // Total in base units
}

class UnitCalculationService {
  /**
   * High-level unit conversion using the graph-based conversion engine.
   */
  async convertUnit(params: UnitConversionParams): Promise<number> {
    const { value, fromUnitId, toUnitId, organizationId, productId } = params;
    const result = await conversionService.convertDirect(
      value,
      fromUnitId,
      toUnitId,
      organizationId,
      productId,
    );

    if ("error" in result) {
      throw new Error(result.error);
    }

    return result.value;
  }

  /**
   * Resolves the best price for a product variant based on enterprise pricing rules.
   * Logic: Manual Override > Price List (Priority Waterfall) > Default Price (Wholesale/Retail)
   */
  async resolvePrice(
    params: PriceResolutionParams,
  ): Promise<{ price: Decimal; defaultPrice: Decimal; source: string }> {
    const {
      variantId,
      sellingUnitId,
      quantity,
      customerId,
      businessAccountId,
      organizationId,
      isWholesale = false,
      manualPrice,
      tx,
      preFetchedVariant,
      preFetchedPriceLists,
    } = params;

    const prismaClient = tx || db;

    // 1. Manual Override
    if (manualPrice !== undefined && manualPrice !== null) {
      const price = new Decimal(manualPrice);
      return { price, defaultPrice: price, source: "MANUAL_OVERRIDE" };
    }

    const now = new Date();

    // 2. Resolve Variant & Selling Unit for Default Price
    const variant =
      preFetchedVariant ||
      (await prismaClient.productVariant.findUnique({
        where: { id: variantId },
        include: {
          sellingUnits: {
            where: { id: sellingUnitId || undefined, isActive: true },
          },
        },
      }));

    if (!variant) {
      throw new Error(`Product variant ${variantId} not found.`);
    }

    const selectedSellingUnit = sellingUnitId
      ? variant.sellingUnits.find((u: any) => u.id === sellingUnitId)
      : null;

    let defaultPrice: Decimal;
    if (isWholesale) {
      defaultPrice =
        (selectedSellingUnit?.wholesalePrice
          ? new Decimal(selectedSellingUnit.wholesalePrice)
          : null) ??
        (variant.wholesalePrice ? new Decimal(variant.wholesalePrice) : null) ??
        (selectedSellingUnit?.retailPrice
          ? new Decimal(selectedSellingUnit.retailPrice)
          : null) ??
        (variant.retailPrice ? new Decimal(variant.retailPrice) : null) ??
        new Decimal(0);
    } else {
      defaultPrice =
        (selectedSellingUnit?.retailPrice
          ? new Decimal(selectedSellingUnit.retailPrice)
          : null) ??
        (variant.retailPrice ? new Decimal(variant.retailPrice) : null) ??
        new Decimal(0);
    }

    // 3. Resolve from Price Lists
    const activePriceLists =
      preFetchedPriceLists ||
      (await prismaClient.priceList.findMany({
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
              ? [{ businessAccounts: { some: { id: businessAccountId } } }]
              : []),
          ],
        },
        orderBy: { priority: "desc" },
        include: {
          items: {
            where: {
              variantId,
              sellingUnitId: sellingUnitId || null,
              isActive: true,
              deletedAt: null,
              minQuantity: { lte: quantity },
              OR: [{ maxQuantity: null }, { maxQuantity: { gte: quantity } }],
            },
          },
        },
      }));

    for (const list of activePriceLists) {
      const priceMatch = list.items.find((pi: any) => {
        const isVariantMatch = pi.variantId === variantId;
        const isUnitMatch = pi.sellingUnitId === (sellingUnitId || null);
        const isQtyMatch =
          quantity >= pi.minQuantity &&
          (!pi.maxQuantity || quantity <= pi.maxQuantity);
        return isVariantMatch && isUnitMatch && isQtyMatch;
      });

      if (priceMatch) {
        let resolvedPrice: Decimal;
        if (isWholesale) {
          resolvedPrice =
            (priceMatch.wholesalePrice
              ? new Decimal(priceMatch.wholesalePrice)
              : null) ?? new Decimal(priceMatch.price);
        } else {
          resolvedPrice = new Decimal(priceMatch.price);
        }

        return {
          price: resolvedPrice,
          defaultPrice,
          source: `PRICE_LIST:${list.name}`,
        };
      }
    }

    return { price: defaultPrice, defaultPrice, source: "DEFAULT" };
  }

  /**
   * Handles stock allocation from batches and calculates unit cost.
   */
  async calculateStockAllocation(
    params: StockAllocationParams & {
      productName?: string;
      variantName?: string;
    },
  ): Promise<AllocationResult> {
    const {
      tx,
      variantId,
      locationId,
      organizationId,
      quantityToFulfill,
      conversionMultiplier,
      inventoryPolicy,
      allowNegativeStock,
      buyingPrice,
    } = params;

    let stockDeductionNeeded = quantityToFulfill * conversionMultiplier;
    const initialDeductionNeeded = stockDeductionNeeded;
    let totalCostForLineItem = new Decimal(0);
    const allocations: Prisma.InventoryAllocationCreateWithoutTransactionItemInput[] =
      [];

    const batchOrderBy: Prisma.StockBatchOrderByWithRelationInput[] =
      inventoryPolicy === "FEFO"
        ? [{ expiryDate: "asc" }, { receivedDate: "asc" }]
        : inventoryPolicy === "LIFO"
          ? [{ receivedDate: "desc" }]
          : [{ receivedDate: "asc" }];

    const availableBatches = await tx.stockBatch.findMany({
      where: {
        variantId,
        locationId,
        organizationId,
        currentQuantity: { gt: 0 },
      },
      orderBy: batchOrderBy,
    });

    for (const batch of availableBatches) {
      if (stockDeductionNeeded <= 0) break;
      const currentBatchQty = new Decimal(
        batch.currentQuantity as unknown as string,
      ).toNumber();
      const quantityFromThisBatch = Math.min(
        stockDeductionNeeded,
        currentBatchQty,
      );

      const updateResult = await tx.stockBatch.updateMany({
        where: {
          id: batch.id,
          currentQuantity: { gte: quantityFromThisBatch },
        },
        data: { currentQuantity: { decrement: quantityFromThisBatch } },
      });

      if (updateResult.count > 0) {
        allocations.push({
          stockBatch: { connect: { id: batch.id } },
          inventoryLocation: { connect: { id: locationId } },
          quantity: quantityFromThisBatch,
          status: AllocationStatus.FULFILLED,
        });
        totalCostForLineItem = totalCostForLineItem.add(
          new Decimal(batch.purchasePrice as unknown as string).mul(
            quantityFromThisBatch,
          ),
        );
        stockDeductionNeeded -= quantityFromThisBatch;
      }
    }

    if (stockDeductionNeeded > 0) {
      // 1. Check if we have summary stock even if batches are missing or insufficient
      const stockRecord = await tx.productVariantStock.findUnique({
        where: { variantId_locationId: { variantId, locationId } },
      });

      const summaryAvailable = stockRecord
        ? new Decimal(stockRecord.availableStock as any).toNumber()
        : 0;

      if (summaryAvailable >= stockDeductionNeeded) {
        // We have enough summary stock. We'll proceed without batch allocation for the remainder.
        // This handles cases where batches might be out of sync or missing.
        totalCostForLineItem = totalCostForLineItem.add(
          new Decimal(buyingPrice).mul(stockDeductionNeeded),
        );
        stockDeductionNeeded = 0;
      } else if (!allowNegativeStock) {
        const totalAvailableInBatches = availableBatches.reduce(
          (sum, b) =>
            sum +
            new Decimal(b.currentQuantity as unknown as string).toNumber(),
          0,
        );
        const displayName =
          params.productName && params.variantName
            ? `${params.productName} (${params.variantName})`
            : `variant ${variantId}`;
        throw new Error(
          `Insufficient stock for ${displayName}. Required: ${initialDeductionNeeded}, Available (Batches): ${totalAvailableInBatches}, Available (Summary): ${summaryAvailable}.`,
        );
      } else {
        // If negative stock allowed, assume cost is current buying price
        totalCostForLineItem = totalCostForLineItem.add(
          new Decimal(buyingPrice).mul(stockDeductionNeeded),
        );
        stockDeductionNeeded = 0;
      }
    }

    const unitCost =
      quantityToFulfill > 0
        ? totalCostForLineItem.dividedBy(quantityToFulfill)
        : new Decimal(buyingPrice);

    return {
      allocations,
      unitCost,
      stockDeductionTotal: initialDeductionNeeded,
    };
  }
}

export const unitCalculationService = new UnitCalculationService();
