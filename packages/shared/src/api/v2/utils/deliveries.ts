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
} from "@repo/db";

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
  outcome: "DELIVERED" | "FAILED";
  proofUrl?: string; // We expect URL to be handled by caller if they use shared
  receivedBy?: string;
  failureReason?: string;
};

// --- Shared Functions ---

export async function performDeliveryDispatch(
  prisma: PrismaClient,
  data: DispatchParams,
) {
  const {
    transactionId,
    organizationId,
    driverId,
    deliveryAddress,
    estimatedTime,
    deliveryFee,
    memberId,
    notes,
  } = data;

  return await (prisma as any).$transaction(async (tx: any) => {
    // 1. Fetch Transaction with Product Conversions
    const transaction = await tx.transaction.findUnique({
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

    if (!transaction) throw new Error("TRANSACTION_NOT_FOUND");
    if (transaction.status === TransactionStatus.DISPATCHED)
      throw new Error("ALREADY_DISPATCHED");

    // 2. Stock Reduction Logic
    for (const item of transaction.items) {
      if (!item.variant) continue;

      const sellingUnitId = item.sellingUnit?.id || item.sellingUnitId;
      const baseUnitId = item.variant.baseUnitId;

      let qtyToDeduct = Number(item.quantity);

      // If units differ, convert
      if (sellingUnitId && baseUnitId && sellingUnitId !== baseUnitId) {
        const conversion = item.variant.product.unitConversions.find(
          (c: any) =>
            c.fromUnitId === sellingUnitId && c.toUnitId === baseUnitId,
        );
        if (conversion) {
          qtyToDeduct =
            Number(item.quantity) * Number(conversion.factor) +
            Number(conversion.offset);
        }
      }

      const batches = await tx.stockBatch.findMany({
        where: {
          variantId: item.variantId,
          locationId: transaction.locationId,
          currentQuantity: { gt: 0 },
        },
        orderBy: [{ expiryDate: "asc" }, { receivedDate: "asc" }],
      });

      let remaining = qtyToDeduct;

      for (const batch of batches) {
        if (remaining <= 0) break;
        const deduction = Math.min(Number(batch.currentQuantity), remaining);

        await tx.stockBatch.update({
          where: { id: batch.id },
          data: { currentQuantity: { decrement: deduction } },
        });

        // Create Movement Log
        await tx.stockMovement.create({
          data: {
            organizationId,
            stockBatchId: batch.id,
            variantId: item.variantId,
            fromLocationId: transaction.locationId,
            quantity: deduction,
            movementType: "SALE",
            referenceId: transaction.id,
            memberId,
            notes: `Dispatch Order #${transaction.number}`,
            movementDate: new Date(),
          },
        });

        remaining -= deduction;
      }

      if (remaining > 0) {
        throw new Error(
          `INSUFFICIENT_STOCK: Item ${item.variant.sku} needs ${qtyToDeduct} base units.`,
        );
      }

      // C. AGGREGATE UPDATE
      await tx.productVariantStock.updateMany({
        where: {
          variantId: item.variantId,
          locationId: transaction.locationId,
        },
        data: {
          currentStock: { decrement: qtyToDeduct },
          reservedStock: { decrement: qtyToDeduct },
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
          country: deliveryAddress.country || "KEN",
          customerId: transaction.customerId,
          businessAccountId: transaction.businessAccountId,
        },
      });
      shippingAddressId = newAddress.id;
    } else if (transaction.customer?.addresses?.length) {
      const defaultAddr =
        transaction.customer.addresses.find((a: any) => a.isDefault) ||
        transaction.customer.addresses[0];
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
    const { documentService } =
      await import("../../../lib/services/document.service");
    documentService
      .generateAndAttachProofDocuments({
        transactionId,
        fulfillmentId: fulfillment.id,
        organizationId,
        memberId,
      })
      .catch((err) =>
        console.error("Failed to generate proof documents:", err),
      );

    return fulfillment;
  });
}

export async function performReconciliation(
  prisma: PrismaClient,
  data: ReconcileParams,
) {
  const {
    fulfilmentId,
    organizationId,
    reconciledBy,
    outcome,
    proofUrl,
    receivedBy,
    failureReason,
  } = data;

  return await (prisma as any).$transaction(async (tx: any) => {
    const fulfillment = await tx.fulfillment.findUnique({
      where: { id: fulfilmentId },
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

    if (
      !fulfillment ||
      fulfillment.transaction.organizationId !== organizationId
    ) {
      throw new Error("FULFILLMENT_OR_TRANSACTION_NOT_FOUND");
    }

    const transaction = fulfillment.transaction;
    const locationId = transaction.locationId;

    if (outcome === "DELIVERED") {
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

      return { success: true, status: "COMPLETED" };
    }

    if (outcome === "FAILED") {
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

      const totalRefundAmount = transaction.items.reduce(
        (sum: number, item: any) => {
          return sum + Number(item.lineTotal);
        },
        0,
      );

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
          orderBy: { receivedDate: "desc" },
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
            movementType: "CUSTOMER_RETURN",
            referenceId: returnRecord.id,
            memberId: reconciledBy,
            notes: `Failed delivery return for Order #${transaction.number}`,
            movementDate: new Date(),
          },
        });
      }

      return { success: true, status: "FAILED_AND_RETURNED" };
    }
  });
}
