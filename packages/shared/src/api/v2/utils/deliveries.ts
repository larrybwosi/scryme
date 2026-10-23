import {
  PrismaClient,
  TransactionStatus,
  AddressType,
  FulfillmentType,
  FulfillmentStatus,
  PodType,
  ReturnStatus,
  ReturnReason,
  ReturnItemStatus,
} from '@repo/db';

// --- Types ---

export interface DispatchParams {
  transactionId: string;
  organizationId: string;
  driverId?: string;
  deliveryAddress?: {
    street: string;
    city: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  estimatedTime?: Date | string;
  deliveryFee?: number;
  memberId: string;
  notes?: string;
}

export type ReconcileParams = {
  fulfilmentId: string;
  organizationId: string;
  reconciledBy: string; // Member ID
  outcome: 'DELIVERED' | 'FAILED';
  proofUrl?: string; // We expect URL to be handled by caller if they use shared
  receivedBy?: string;
  failureReason?: string;
};

// --- Shared Functions ---

export async function performDeliveryDispatch(prisma: PrismaClient, data: DispatchParams) {
  const { transactionId, organizationId, driverId, deliveryAddress, estimatedTime, deliveryFee, memberId, notes } =
    data;

  return await (prisma as any).$transaction(async (tx: any) => {
    // 1. Fetch Transaction with Product Conversions
    // @security: Multi-tenant isolation is enforced by scoping lookup to organizationId.
    const transaction = await tx.transaction.findFirst({
      where: { id: transactionId, organizationId },
      include: {
        location: true,
        customer: { include: { addresses: true } },
        items: {
          include: {
            sellingUnit: true,
            variant: {
              include: {
                product: { include: { unitConversions: true } },
              },
            },
          },
        },
      },
    });

    if (!transaction) throw new Error('TRANSACTION_NOT_FOUND');
    if (transaction.status === TransactionStatus.DISPATCHED) throw new Error('ALREADY_DISPATCHED');

    // ⚡ Bolt Optimization: Stock Reduction Logic
    // Pre-fetch all active stock batches for all item variantIds in a single batched query
    // instead of issuing sequential findMany queries per item inside the loop.
    // Index batches into an in-memory Map<string, StockBatch[]> keyed by variantId.
    const variantIds = transaction.items
      .filter((item: any) => item.variant)
      .map((item: any) => item.variantId);

    const allBatches = variantIds.length > 0
      ? await tx.stockBatch.findMany({
          where: {
            organizationId,
            variantId: { in: variantIds },
            locationId: transaction.locationId,
            currentQuantity: { gt: 0 },
          },
          orderBy: [{ expiryDate: 'asc' }, { receivedDate: 'asc' }],
        })
      : [];

    const batchesByVariantMap = new Map<string, any[]>();
    for (const batch of allBatches) {
      if (!batchesByVariantMap.has(batch.variantId)) {
        batchesByVariantMap.set(batch.variantId, []);
      }
      batchesByVariantMap.get(batch.variantId)!.push(batch);
    }

    const batchDeductionsToExecute: { id: string; deduction: number }[] = [];
    const stockMovementsToCreate: any[] = [];
    const aggregateDeductionsByVariant = new Map<string, number>();

    for (const item of transaction.items) {
      if (!item.variant) continue;

      const sellingUnitId = item.sellingUnit?.id || item.sellingUnitId;
      const baseUnitId = item.variant.baseUnitId;

      let qtyToDeduct = Number(item.quantity);

      // If units differ, convert
      if (sellingUnitId && baseUnitId && sellingUnitId !== baseUnitId) {
        const conversion = item.variant.product?.unitConversions?.find(
          (c: any) => c.fromUnitId === sellingUnitId && c.toUnitId === baseUnitId
        );
        if (conversion) {
          qtyToDeduct = Number(item.quantity) * Number(conversion.factor) + Number(conversion.offset);
        }
      }

      const batches = batchesByVariantMap.get(item.variantId) || [];
      let remaining = qtyToDeduct;

      for (const batch of batches) {
        if (remaining <= 0) break;
        const currentBatchQty = Number(batch.currentQuantity);
        if (currentBatchQty <= 0) continue;

        const deduction = Math.min(currentBatchQty, remaining);

        batchDeductionsToExecute.push({
          id: batch.id,
          deduction,
        });

        // Update local copy so subsequent deductions on the same batch in this transaction calculate correctly
        batch.currentQuantity = currentBatchQty - deduction;

        stockMovementsToCreate.push({
          organizationId,
          stockBatchId: batch.id,
          variantId: item.variantId,
          fromLocationId: transaction.locationId,
          quantity: deduction,
          movementType: 'SALE',
          referenceId: transaction.id,
          memberId,
          notes: `Dispatch Order #${transaction.number}`,
          movementDate: new Date(),
        });

        remaining -= deduction;
      }

      if (remaining > 0) {
        throw new Error(`INSUFFICIENT_STOCK: Item ${item.variant.sku} needs ${qtyToDeduct} base units.`);
      }

      // Consolidate variant stock deductions in-memory to execute 1 update per unique variantId
      const currentDeduction = aggregateDeductionsByVariant.get(item.variantId) || 0;
      aggregateDeductionsByVariant.set(item.variantId, currentDeduction + qtyToDeduct);
    }

    // Execute batch deductions sequentially on the interactive transaction handle
    for (const { id, deduction } of batchDeductionsToExecute) {
      await tx.stockBatch.update({
        where: { id },
        data: { currentQuantity: { decrement: deduction } },
      });
    }

    if (stockMovementsToCreate.length > 0) {
      await tx.stockMovement.createMany({
        data: stockMovementsToCreate,
      });
    }

    // Execute consolidated productVariantStock updates per unique variantId sequentially on the interactive transaction handle
    for (const [variantId, totalDeduct] of aggregateDeductionsByVariant.entries()) {
      await tx.productVariantStock.updateMany({
        where: { variantId, locationId: transaction.locationId },
        data: {
          currentStock: { decrement: totalDeduct },
          reservedStock: { decrement: totalDeduct },
        },
      });
    }

    // 3. Address Handling
    let shippingAddressId: string | undefined;

    if (deliveryAddress) {
      const newAddress = await tx.address.create({
        data: {
          type: AddressType.SHIPPING,
          street1: deliveryAddress.street,
          city: deliveryAddress.city,
          state: deliveryAddress.state,
          postalCode: deliveryAddress.zip,
          country: deliveryAddress.country || 'KEN',
          customerId: transaction.customerId,
          businessAccountId: transaction.businessAccountId,
        },
      });
      shippingAddressId = newAddress.id;
    } else if (transaction.customer?.addresses?.length) {
      const defaultAddr =
        transaction.customer.addresses.find((a: any) => a.isDefault) || transaction.customer.addresses[0];
      shippingAddressId = defaultAddr.id;
    }

    // 4. Create/Update Fulfillment & Transaction Status
    const fulfillment = await tx.fulfillment.create({
      data: {
        transactionId,
        type: FulfillmentType.DELIVERY,
        status: FulfillmentStatus.PENDING,
        driverId,
        pickupLocationId: transaction.locationId,
        shippingAddressId,
        deliveryNotes: notes,
        scheduledAt: estimatedTime ? new Date(estimatedTime) : null,
        podType: PodType.DIGITAL_APP,
        items: {
          create: transaction.items.map((item: any) => ({
            transactionItemId: item.id,
            quantity: item.quantity,
          })),
        },
      },
    });

    await tx.transaction.update({
      where: { id: transactionId },
      data: {
        status: TransactionStatus.DISPATCHED,
        shippingTotal: deliveryFee ? { set: deliveryFee } : undefined,
      },
    });

    // 5. Generate Proof Documents (Background)
    const { documentService } = await import('../../../lib/services/document.service');
    documentService.generateAndAttachProofDocuments({
        transactionId,
        fulfillmentId: fulfillment.id,
        organizationId,
        memberId
    }).catch(err => console.error('Failed to generate proof documents:', err));

    return fulfillment;
  });
}

export async function performReconciliation(prisma: PrismaClient, data: ReconcileParams) {
  const { fulfilmentId, organizationId, reconciledBy, outcome, proofUrl, receivedBy, failureReason } = data;

  return await (prisma as any).$transaction(async (tx: any) => {
    // @security: Multi-tenant isolation is enforced by scoping lookup to organizationId via transaction.
    const fulfillment = await tx.fulfillment.findFirst({
      where: {
        id: fulfilmentId,
        transaction: { organizationId },
      },
      include: {
        transaction: {
          include: {
            items: {
              include: { variant: true },
            },
          },
        },
      },
    });

    if (!fulfillment) {
      throw new Error('FULFILLMENT_OR_TRANSACTION_NOT_FOUND');
    }

    const transaction = fulfillment.transaction;
    const locationId = transaction.locationId;

    if (outcome === 'DELIVERED') {
      await tx.fulfillment.update({
        where: { id: fulfillment.id },
        data: {
          status: FulfillmentStatus.DELIVERED,
          deliveredAt: new Date(),
          proofOfDeliveryUrl: proofUrl,
          receivedBy: receivedBy,
          reconciledBy: reconciledBy,
          reconciledAt: new Date(),
        },
      });

      await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          status: TransactionStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      return { success: true, status: 'COMPLETED' };
    }

    if (outcome === 'FAILED') {
      await tx.fulfillment.update({
        where: { id: fulfillment.id },
        data: {
          status: FulfillmentStatus.CANCELLED,
          deliveryNotes: `Delivery Failed: ${failureReason}`,
          reconciledBy: reconciledBy,
          reconciledAt: new Date(),
        },
      });

      await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          status: TransactionStatus.FAILED,
          notes: `Delivery failed: ${failureReason}`,
        },
      });

      const totalRefundAmount = transaction.items.reduce((sum: number, item: any) => {
        return sum + Number(item.lineTotal);
      }, 0);

      const returnRecord = await tx.return.create({
        data: {
          returnNumber: `RET-${transaction.number}-FL`,
          transactionId: transaction.id,
          status: ReturnStatus.COMPLETED,
          reason: ReturnReason.OTHER,
          notes: failureReason,
          memberId: reconciledBy,
          organizationId: organizationId,
          refundAmount: totalRefundAmount,
          restockFee: 0,
        },
      });

      for (const item of transaction.items) {
        await tx.returnItem.create({
          data: {
            returnId: returnRecord.id,
            transactionItemId: item.id,
            quantity: item.quantity,
            status: ReturnItemStatus.RESTOCKED,
            unitPrice: item.unitPrice,
            refundAmount: item.lineTotal,
          },
        });

        const targetBatch = await tx.stockBatch.findFirst({
          where: {
            variantId: item.variantId,
            locationId: locationId,
          },
          orderBy: { receivedDate: 'desc' },
        });

        let stockBatchId = targetBatch?.id;

        if (targetBatch) {
          await tx.stockBatch.update({
            where: { id: targetBatch.id },
            data: { currentQuantity: { increment: item.quantity } },
          });
        } else {
          const newBatch = await tx.stockBatch.create({
            data: {
              organizationId,
              variantId: item.variantId,
              locationId: locationId,
              initialQuantity: item.quantity,
              currentQuantity: item.quantity,
              purchasePrice: item.unitCost,
              receivedDate: new Date(),
              batchNumber: `RET-${transaction.number.slice(-6)}`,
              expiryDate: null,
            },
          });
          stockBatchId = newBatch.id;
        }

        const productId = item.variant.productId;

        await tx.productVariantStock.upsert({
          where: {
            variantId_locationId: {
              variantId: item.variantId,
              locationId: locationId,
            },
          },
          update: {
            currentStock: { increment: item.quantity },
            availableStock: { increment: item.quantity },
          },
          create: {
            organizationId,
            productId: productId,
            variantId: item.variantId,
            locationId: locationId,
            currentStock: item.quantity,
            availableStock: item.quantity,
          },
        });

        await tx.stockMovement.create({
          data: {
            organizationId,
            stockBatchId: stockBatchId!,
            variantId: item.variantId,
            toLocationId: locationId,
            fromLocationId: null,
            quantity: item.quantity,
            movementType: 'CUSTOMER_RETURN',
            referenceId: returnRecord.id,
            memberId: reconciledBy,
            notes: `Failed delivery return for Order #${transaction.number}`,
            movementDate: new Date(),
          },
        });
      }

      return { success: true, status: 'FAILED_AND_RETURNED' };
    }
  });
}
