"use server";

import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  FulfillmentStatus,
  TransactionStatus,
  PaymentStatus,
  PaymentMethod,
  MovementType,
  DriverStatus,
  BenefitType,
  WalletTxType,
  MemberRole,
} from "@repo/db";
import Decimal from "decimal.js";

async function checkPermission(allowedRoles: MemberRole[], isPageLoad = false) {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId || !auth.memberId) {
    if (isPageLoad) {
      redirect("/unauthorized?reason=unauthenticated");
    }
    throw new Error("Unauthorized");
  }

  const member = await db.member.findUnique({
    where: { id: auth.memberId },
  });

  if (!member || !allowedRoles.includes(member.role)) {
    if (isPageLoad) {
      redirect("/unauthorized?reason=insufficient_permissions");
    }
    throw new Error("Forbidden: Insufficient permissions");
  }

  return { auth, member };
}

export async function getActiveDeliveriesList() {
  const { auth } = await checkPermission(["OWNER", "ADMIN", "MANAGER", "STAFF"]);

  return db.fulfillment.findMany({
    where: {
      transaction: { organizationId: auth.organizationId },
      type: "DELIVERY",
    },
    include: {
      transaction: {
        include: {
          customer: true,
          deliveryPartner: true,
          items: {
            include: { variant: true },
          },
        },
      },
      driver: {
        include: { deliveryPartner: true },
      },
      items: {
        include: {
          transactionItem: true,
          stockBatch: true,
        },
      },
      shippingAddress: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getDriverActiveDeliveries(driverId?: string) {
  const { auth } = await checkPermission(["OWNER", "ADMIN", "MANAGER", "STAFF"]);

  let resolvedDriverId = driverId;
  if (!resolvedDriverId && auth.memberId) {
    const driverRecord = await db.driver.findFirst({
      where: { memberId: auth.memberId, organizationId: auth.organizationId },
    });
    resolvedDriverId = driverRecord?.id;
  }

  if (!resolvedDriverId) {
    return [];
  }

  return db.fulfillment.findMany({
    where: {
      driverId: resolvedDriverId,
      transaction: { organizationId: auth.organizationId },
      type: "DELIVERY",
    },
    include: {
      transaction: {
        include: {
          customer: {
            include: { addresses: true },
          },
          items: true,
        },
      },
      shippingAddress: true,
      items: {
        include: {
          transactionItem: true,
          stockBatch: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function completeDriverDelivery(data: {
  fulfillmentId: string;
  otpCode?: string;
  recipientName?: string;
  proofOfDeliveryUrl?: string;
  codAmountCollected?: number;
  codPaymentMethod?: string;
  notes?: string;
}) {
  const { auth } = await checkPermission(["OWNER", "ADMIN", "MANAGER", "STAFF"]);

  const fulfillment = await db.fulfillment.findFirst({
    where: {
      id: data.fulfillmentId,
      transaction: { organizationId: auth.organizationId },
    },
    include: {
      transaction: {
        include: { deliveryPartner: true },
      },
      driver: true,
    },
  });

  if (!fulfillment) {
    return { success: false, error: "Fulfillment not found or unauthorized" };
  }

  // OTP Verification Check
  if (fulfillment.confirmationToken && data.otpCode) {
    if (data.otpCode.trim() !== fulfillment.confirmationToken.trim()) {
      return { success: false, error: "Invalid OTP confirmation code provided" };
    }
  }

  return await db.$transaction(async (tx) => {
    // 1. Process COD if collected
    if (data.codAmountCollected && Number(data.codAmountCollected) > 0) {
      const amountNum = Number(data.codAmountCollected);
      const method = (data.codPaymentMethod?.toUpperCase() as PaymentMethod) || PaymentMethod.CASH;

      await tx.payment.create({
        data: {
          transactionId: fulfillment.transactionId,
          organizationId: auth.organizationId,
          method,
          status: PaymentStatus.COMPLETED,
          amount: amountNum,
          amountReceived: amountNum,
          payerName: data.recipientName || fulfillment.receivedBy || "Recipient",
          processedAt: new Date(),
          notes: `Driver Handover COD Collection (${fulfillment.transaction.number})`,
        },
      });

      const newTotalPaid = Number(fulfillment.transaction.totalPaid || 0) + amountNum;
      const finalTotal = Number(fulfillment.transaction.finalTotal || 0);
      const newPaymentStatus = newTotalPaid >= finalTotal ? PaymentStatus.PAID : PaymentStatus.PARTIALLY_PAID;

      await tx.transaction.update({
        where: { id: fulfillment.transactionId },
        data: {
          totalPaid: newTotalPaid,
          paymentStatus: newPaymentStatus,
        },
      });
    }

    // 2. Update fulfillment
    const updated = await tx.fulfillment.update({
      where: { id: data.fulfillmentId },
      data: {
        status: FulfillmentStatus.DELIVERED,
        deliveredAt: new Date(),
        receivedBy: data.recipientName || fulfillment.receivedBy,
        proofOfDeliveryUrl: data.proofOfDeliveryUrl || fulfillment.proofOfDeliveryUrl,
        confirmedByCustomerAt: data.otpCode ? new Date() : fulfillment.confirmedByCustomerAt,
        codAmountCollected: data.codAmountCollected ? Number(data.codAmountCollected) : null,
        deliveryNotes: data.notes
          ? `${fulfillment.deliveryNotes || ""}\nDriver Handover: ${data.notes}`.trim()
          : fulfillment.deliveryNotes,
      },
    });

    // 3. Mark transaction complete if paid
    const updatedTx = await tx.transaction.findUnique({
      where: { id: fulfillment.transactionId },
    });

    if (updatedTx?.paymentStatus === PaymentStatus.PAID) {
      await tx.transaction.update({
        where: { id: fulfillment.transactionId },
        data: { status: TransactionStatus.COMPLETED, completedAt: new Date() },
      });
    }

    // 4. Free driver if no remaining active deliveries
    if (fulfillment.driverId) {
      const remaining = await tx.fulfillment.count({
        where: {
          driverId: fulfillment.driverId,
          status: { in: [FulfillmentStatus.IN_TRANSIT, FulfillmentStatus.PREPARING] },
          id: { not: fulfillment.id },
        },
      });

      if (remaining === 0) {
        await tx.driver.updateMany({
          where: { id: fulfillment.driverId, organizationId: auth.organizationId },
          data: { availability: DriverStatus.ONLINE },
        });
      }
    }

    revalidatePath("/sales/deliveries");
    return { success: true, data: updated };
  });
}

export async function reconcileDeliveryFull(data: {
  fulfillmentId: string;
  isDelivered: boolean;
  receivedBy?: string;
  reconciliationNotes?: string;
  failureReason?: string;
  codAmountCollected?: number;
  codPaymentMethod?: string;
  returnedItems?: Array<{
    fulfillmentItemId: string;
    quantityReturned: number;
    quantityDamaged?: number;
    reason?: string;
  }>;
}) {
  const { auth } = await checkPermission(["OWNER", "ADMIN", "MANAGER"]);

  const fulfillment = await db.fulfillment.findFirst({
    where: {
      id: data.fulfillmentId,
      transaction: { organizationId: auth.organizationId },
    },
    include: {
      transaction: {
        include: { deliveryPartner: true },
      },
      driver: { include: { deliveryPartner: true } },
      items: {
        include: { transactionItem: true, stockBatch: true },
      },
    },
  });

  if (!fulfillment) {
    return { success: false, error: "Fulfillment not found or unauthorized" };
  }

  return await db.$transaction(async (tx) => {
    // 1. Process COD if collected
    if (data.codAmountCollected && Number(data.codAmountCollected) > 0) {
      const amountNum = Number(data.codAmountCollected);
      const method = (data.codPaymentMethod?.toUpperCase() as PaymentMethod) || PaymentMethod.CASH;

      await tx.payment.create({
        data: {
          transactionId: fulfillment.transactionId,
          organizationId: auth.organizationId,
          method,
          status: PaymentStatus.COMPLETED,
          amount: amountNum,
          amountReceived: amountNum,
          payerName: data.receivedBy || fulfillment.receivedBy || "Customer",
          processedAt: new Date(),
          notes: `COD Reconciliation (${fulfillment.transaction.number})`,
        },
      });

      const newTotalPaid = Number(fulfillment.transaction.totalPaid || 0) + amountNum;
      const finalTotal = Number(fulfillment.transaction.finalTotal || 0);
      const newPaymentStatus = newTotalPaid >= finalTotal ? PaymentStatus.PAID : PaymentStatus.PARTIALLY_PAID;

      await tx.transaction.update({
        where: { id: fulfillment.transactionId },
        data: {
          totalPaid: newTotalPaid,
          paymentStatus: newPaymentStatus,
        },
      });
    }

    // 2. Restock returned items
    if (data.returnedItems && data.returnedItems.length > 0) {
      for (const ret of data.returnedItems) {
        const item = fulfillment.items.find((i) => i.id === ret.fulfillmentItemId);
        if (item) {
          const qtyReturned = Math.max(0, ret.quantityReturned || 0);
          const qtyDamaged = Math.max(0, ret.quantityDamaged || 0);
          const qtyToRestock = Math.max(0, qtyReturned - qtyDamaged);

          await tx.fulfillmentItem.update({
            where: { id: item.id },
            data: {
              quantityReturned: qtyReturned,
              quantityDamaged: qtyDamaged,
            },
          });

          if (qtyToRestock > 0) {
            if (item.stockBatchId) {
              await tx.stockBatch.update({
                where: { id: item.stockBatchId },
                data: { currentQuantity: { increment: qtyToRestock } },
              });
            }

            const variantId = item.transactionItem?.variantId;
            const locationId = fulfillment.transaction.locationId;

            if (variantId && locationId) {
              await tx.productVariantStock.updateMany({
                where: { variantId, locationId },
                data: { currentStock: { increment: qtyToRestock } },
              });

              await tx.stockMovement.create({
                data: {
                  type: MovementType.CUSTOMER_RETURN,
                  quantity: qtyToRestock,
                  variantId,
                  locationId,
                  stockBatchId: item.stockBatchId || undefined,
                  reference: `RECONCILIATION_${fulfillment.id}`,
                  notes: `Restocked ${qtyToRestock} units. Reason: ${ret.reason || "Reconciliation return"}`,
                  movementDate: new Date(),
                },
              });
            }
          }
        }
      }
    }

    // 3. Update fulfillment
    const finalStatus = data.isDelivered ? FulfillmentStatus.COMPLETED : FulfillmentStatus.CANCELLED;
    const updated = await tx.fulfillment.update({
      where: { id: data.fulfillmentId },
      data: {
        isReconciled: true,
        reconciledAt: new Date(),
        reconciledBy: auth.memberId,
        receivedBy: data.receivedBy || fulfillment.receivedBy,
        status: finalStatus,
        reconciliationNotes: data.reconciliationNotes || null,
        failureReason: !data.isDelivered ? data.failureReason || data.reconciliationNotes : null,
        codAmountCollected: data.codAmountCollected ? Number(data.codAmountCollected) : null,
      },
    });

    // 4. Update transaction
    const currentTx = await tx.transaction.findUnique({
      where: { id: fulfillment.transactionId },
    });

    const isPaid = currentTx?.paymentStatus === PaymentStatus.PAID;
    await tx.transaction.update({
      where: { id: fulfillment.transactionId },
      data: {
        status: data.isDelivered && isPaid ? TransactionStatus.COMPLETED : data.isDelivered ? TransactionStatus.PROCESSING : TransactionStatus.CANCELLED,
        completedAt: data.isDelivered && isPaid ? new Date() : null,
        cancelledAt: !data.isDelivered ? new Date() : null,
      },
    });

    // 5. Driver / Partner payout & availability
    if (fulfillment.driverId) {
      await tx.driver.updateMany({
        where: { id: fulfillment.driverId, organizationId: auth.organizationId },
        data: { availability: DriverStatus.ONLINE },
      });

      const partner = fulfillment.driver?.deliveryPartner || fulfillment.transaction.deliveryPartner;
      if (partner && data.isDelivered) {
        let earnedFee = new Decimal(0);
        if (partner.benefitType === BenefitType.COMMISSION && partner.commissionRate) {
          earnedFee = new Decimal(fulfillment.transaction.finalTotal).mul(new Decimal(partner.commissionRate)).div(100);
        } else if (partner.fixedFee) {
          earnedFee = new Decimal(partner.fixedFee);
        }

        if (earnedFee.gt(0)) {
          await tx.partnerWalletLog.create({
            data: {
              partnerId: partner.id,
              amount: earnedFee,
              balanceAfter: new Decimal(partner.walletBalance).add(earnedFee),
              transactionType: WalletTxType.BENEFIT_ACCRUAL,
              notes: `Commission for fulfillment #${fulfillment.id} (Order ${fulfillment.transaction.number})`,
            },
          });

          await tx.deliveryPartner.update({
            where: { id: partner.id },
            data: { walletBalance: { increment: earnedFee } },
          });
        }
      }
    }

    revalidatePath("/sales/deliveries");
    revalidatePath("/sales/deliveries/reconciliation");
    return { success: true, data: updated };
  });
}
