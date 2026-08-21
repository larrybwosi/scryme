import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../../../prisma/prisma.service";
import { DispatchOrderDto, ReconcilePodDto } from "../dto/delivery.dto";
import {
  TransactionStatus,
  FulfillmentStatus,
  FulfillmentType,
  AddressType,
  ReturnStatus,
  ReturnReason,
  ReturnItemStatus,
  MovementType,
  BenefitType,
  WalletTxType,
  ReconciliationPolicy,
} from "@repo/db";

@Injectable()
export class DeliveryReconciliationUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async getPendingDispatch(organizationId: string, pagination: any) {
    return this.prisma.client.transaction.findMany({
      where: {
        organizationId,
        status: TransactionStatus.CONFIRMED,
        fulfillments: {
          none: {
            status: {
              in: [FulfillmentStatus.SHIPPED, FulfillmentStatus.DELIVERED],
            },
          },
        },
      },
      // ⚡ Bolt Optimization: Replace broad 'include' with targeted top-level 'select'
      // to avoid fetching heavy JSON fields (like metadata) and text fields (like termsAndConditions) in list views.
      select: {
        id: true,
        number: true,
        type: true,
        channel: true,
        status: true,
        paymentStatus: true,
        totalPaid: true,
        organizationId: true,
        customerId: true,
        businessAccountId: true,
        deliveryPartnerId: true,
        memberId: true,
        locationId: true,
        subtotal: true,
        discountTotal: true,
        taxTotal: true,
        shippingTotal: true,
        finalTotal: true,
        currencyCode: true,
        exchangeRate: true,
        baseCurrencyTotal: true,
        createdAt: true,
        confirmedAt: true,
        completedAt: true,
        cancelledAt: true,
        expiresAt: true,
        updatedAt: true,
        parentTransactionId: true,
        notes: true,
        tags: true,
        receiptUrl: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            company: true,
          },
        },
        items: {
          select: {
            id: true,
            productName: true,
            variantName: true,
            sku: true,
            quantity: true,
            unitPrice: true,
            lineTotal: true,
          },
        },
      },
      take: pagination.limit,
      skip: pagination.offset,
    });
  }

  async getActiveDeliveries(organizationId: string, pagination: any) {
    return this.prisma.client.fulfillment.findMany({
      where: {
        transaction: {
          organizationId,
        },
        status: FulfillmentStatus.SHIPPED,
      },
      // ⚡ Bolt Optimization: Replace broad 'include' with targeted top-level 'select'
      // to avoid fetching unneeded columns of Fulfillment in list views.
      select: {
        id: true,
        transactionId: true,
        type: true,
        status: true,
        shippingAddressId: true,
        billingAddressId: true,
        pickupLocationId: true,
        driverId: true,
        quantityHandedOver: true,
        quantityDelivered: true,
        isReconciled: true,
        trackingNumber: true,
        carrier: true,
        deliveryNotes: true,
        podType: true,
        proofOfDeliveryUrl: true,
        receivedBy: true,
        confirmationToken: true,
        confirmedByCustomerAt: true,
        reconciledAt: true,
        reconciledBy: true,
        scheduledAt: true,
        preparedAt: true,
        dispatchedAt: true,
        deliveredAt: true,
        createdAt: true,
        updatedAt: true,
        transaction: {
          select: {
            id: true,
            number: true,
            status: true,
            finalTotal: true,
            currencyCode: true,
            createdAt: true,
            customer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        items: {
          select: {
            id: true,
            quantity: true,
            transactionItemId: true,
          },
        },
      },
      take: pagination.limit,
      skip: pagination.offset,
    });
  }

  async dispatch(
    organizationId: string,
    memberId: string,
    dto: DispatchOrderDto,
  ) {
    return this.prisma.client.$transaction(async (tx) => {
      // Logic for dispatching
      return { success: true };
    });
  }

  async reconcilePod(
    organizationId: string,
    memberId: string,
    dto: ReconcilePodDto,
  ) {
    return this.prisma.client.$transaction(async (tx) => {
      const fulfillmentId = dto.fulfillmentId;
      const qtyDelivered = dto.quantityDelivered || 0;
      const qtyReturned = 0; // Legacy mapping from when DTO had qtyReturned

      // Fetch fulfillment along with all required deep relations needed for calculations
      // SECURITY (Sentinel): Using findFirst with organizationId to prevent IDOR.
      const fulfillment = await tx.fulfillment.findFirst({
        where: { id: fulfillmentId, transaction: { organizationId } },
        include: {
          transaction: {
            include: {
              deliveryPartner: true,
              items: {
                include: {
                  sellingUnit: true,
                  variant: {
                    include: {
                      product: {
                        include: {
                          unitConversions: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!fulfillment) {
        throw new NotFoundException(
          `Fulfillment with ID ${fulfillmentId} not found`,
        );
      }

      if (qtyDelivered > 0) {
        await tx.transaction.update({
          where: { id: fulfillment.transactionId },
          data: {
            status: TransactionStatus.COMPLETED,
            completedAt: new Date(),
          },
        });

        // Calculate and award benefits if third-party partner
        if (fulfillment.transaction.deliveryPartner) {
          const partner = fulfillment.transaction.deliveryPartner;
          let benefitAmount = 0;

          if (partner.benefitType === BenefitType.COMMISSION) {
            benefitAmount =
              Number(fulfillment.transaction.finalTotal) *
              (Number(partner.commissionRate) / 100);
          } else if (partner.benefitType === BenefitType.FIXED_FEE) {
            benefitAmount = Number(partner.fixedFee);
          }

          if (benefitAmount > 0) {
            const newBalance = Number(partner.walletBalance) + benefitAmount;
            await tx.deliveryPartner.update({
              where: { id: partner.id },
              data: { walletBalance: newBalance },
            });

            await tx.partnerWalletLog.create({
              data: {
                partnerId: partner.id,
                amount: benefitAmount,
                balanceAfter: newBalance,
                transactionType: WalletTxType.BENEFIT_ACCRUAL,
                referenceId: fulfillment.id,
                referenceType: "Fulfillment",
                notes: `Benefit for delivery #${fulfillment.id}`,
              },
            });
          }
        }
      }

      if (qtyReturned > 0) {
        const policy =
          fulfillment.transaction.deliveryPartner?.reconciliationPolicy ||
          ReconciliationPolicy.RETURN_TO_STOCK;

        if (
          policy === ReconciliationPolicy.PARTNER_CHARGED &&
          fulfillment.transaction.deliveryPartnerId
        ) {
          const chargeAmount = 0; // Logic for calculating charge would go here
          // For now, we assume simple return or waste
        }

        const returnRecord = await tx.return.create({
          data: {
            returnNumber: `RET-${fulfillment.transaction.number}-${Date.now().toString().slice(-4)}`,
            transactionId: fulfillment.transactionId,
            status: ReturnStatus.COMPLETED,
            reason: ReturnReason.OTHER,
            notes: dto.failureReason || "Reconciliation return",
            memberId,
            organizationId,
            refundAmount: 0, // Since it is reconciliation, not necessarily a refund to customer
          },
        });

        // Simple proportional return for now
        const returnRatio = qtyReturned / (fulfillment.quantityHandedOver || 1);

        const variantIds = fulfillment.transaction.items
          .map((i) => i.variantId)
          .filter(Boolean) as string[];

        // ⚡ Bolt Optimization: Batch pre-fetch all matching stock batches to eliminate N+1 queries.
        // Indexing latest batches by variantId allows O(1) constant-time lookup.
        const allBatches = await tx.stockBatch.findMany({
          where: {
            variantId: { in: variantIds },
            locationId: fulfillment.transaction.locationId,
            organizationId,
          },
          orderBy: { receivedDate: "desc" },
        });

        const latestBatchByVariant = new Map<string, any>();
        for (const b of allBatches) {
          if (!latestBatchByVariant.has(b.variantId)) {
            latestBatchByVariant.set(b.variantId, b);
          }
        }

        // ⚡ Bolt Optimization: Consolidate return quantities per unique variantId and batchId in-memory first.
        // This prevents database row lock contention or deadlocks if multiple transaction items share the same variant.
        const returnItemsToCreate: any[] = [];
        const variantRestockMap = new Map<string, number>();
        const batchRestockMap = new Map<string, number>();
        const movementsToCreate: any[] = [];

        for (const item of fulfillment.transaction.items) {
          const itemQtyToReturn = Math.round(
            Number(item.quantity) * returnRatio,
          );
          if (itemQtyToReturn <= 0) continue;

          returnItemsToCreate.push({
            returnId: returnRecord.id,
            transactionItemId: item.id,
            quantity: itemQtyToReturn,
            status:
              policy === ReconciliationPolicy.RETURN_TO_STOCK
                ? ReturnItemStatus.RESTOCKED
                : ReturnItemStatus.REJECTED,
            unitPrice: item.unitPrice,
            refundAmount: 0,
          });

          if (
            policy === ReconciliationPolicy.RETURN_TO_STOCK &&
            item.variantId &&
            item.variant
          ) {
            let qtyToRestock = itemQtyToReturn;
            const sellingUnitId = item.sellingUnit?.id || item.sellingUnitId;
            const baseUnitId = item.variant.baseUnitId;

            if (sellingUnitId && baseUnitId && sellingUnitId !== baseUnitId) {
              const conversion = item.variant.product.unitConversions.find(
                (c) =>
                  c.fromUnitId === sellingUnitId && c.toUnitId === baseUnitId,
              );
              if (conversion) {
                qtyToRestock =
                  itemQtyToReturn * Number(conversion.factor) +
                  Number(conversion.offset);
              }
            }

            if (qtyToRestock > 0) {
              variantRestockMap.set(
                item.variantId,
                (variantRestockMap.get(item.variantId) || 0) + qtyToRestock,
              );

              const batch = latestBatchByVariant.get(item.variantId);
              if (batch) {
                batchRestockMap.set(
                  batch.id,
                  (batchRestockMap.get(batch.id) || 0) + qtyToRestock,
                );
              }

              movementsToCreate.push({
                organizationId,
                variantId: item.variantId,
                toLocationId: fulfillment.transaction.locationId,
                quantity: qtyToRestock,
                movementType: MovementType.ADJUSTMENT_IN,
                memberId,
                notes: `Reconciliation return for #${fulfillment.transaction.number}`,
                referenceId: returnRecord.id,
                referenceType: "Return",
              });
            }
          }
        }

        // Execute batch database operations concurrently over unique entities
        const dbOperations: Promise<any>[] = [];

        if (returnItemsToCreate.length > 0) {
          dbOperations.push(
            tx.returnItem.createMany({
              data: returnItemsToCreate,
            }),
          );
        }

        for (const [batchId, qty] of batchRestockMap.entries()) {
          dbOperations.push(
            tx.stockBatch.update({
              where: { id: batchId },
              data: { currentQuantity: { increment: qty } },
            }),
          );
        }

        for (const [variantId, qty] of variantRestockMap.entries()) {
          dbOperations.push(
            tx.productVariantStock.update({
              where: {
                variantId_locationId: {
                  variantId,
                  locationId: fulfillment.transaction.locationId,
                },
              },
              data: {
                currentStock: { increment: qty },
                availableStock: { increment: qty },
              },
            }),
          );
        }

        if (movementsToCreate.length > 0) {
          dbOperations.push(
            tx.stockMovement.createMany({
              data: movementsToCreate,
            }),
          );
        }

        await Promise.all(dbOperations);
      }

      return { success: true };
    });
  }
}
