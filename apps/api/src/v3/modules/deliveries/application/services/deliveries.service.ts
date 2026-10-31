import {
  BenefitType,
  WalletTxType,
  DriverStatus,
  FulfillmentStatus,
  TransactionStatus,
  PaymentStatus,
  PaymentMethod,
  MovementType,
  AllocationStatus,
} from "@repo/db";
import { Injectable, NotFoundException, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { WebhookService } from "@/v3/modules/webhooks/infrastructure/services/webhook.service";
import { type V3ApiContext } from "@repo/shared/api/v3";
import {
  CreateDeliveryPartnerDto,
  UpdateDeliveryPartnerDto,
  AdjustWalletDto,
  DispatchDeliveryDto,
  ReconcileDeliveryDto,
  AssignDriverPartnerDto,
  UpdateDeliveryStatusDto,
  DeliveryStatus,
} from "../../dto/deliveries.dto";

// Map domain DeliveryStatus to Prisma FulfillmentStatus
const DOMAIN_TO_FULFILLMENT_STATUS_MAP: Record<DeliveryStatus, FulfillmentStatus> = {
  [DeliveryStatus.PENDING]: FulfillmentStatus.PENDING,
  [DeliveryStatus.ASSIGNED]: FulfillmentStatus.PREPARING,
  [DeliveryStatus.PICKED_UP]: FulfillmentStatus.READY,
  [DeliveryStatus.IN_TRANSIT]: FulfillmentStatus.IN_TRANSIT,
  [DeliveryStatus.DELIVERED]: FulfillmentStatus.DELIVERED,
  [DeliveryStatus.FAILED]: FulfillmentStatus.CANCELLED,
  [DeliveryStatus.CANCELLED]: FulfillmentStatus.CANCELLED,
  [DeliveryStatus.RETURNED]: FulfillmentStatus.CANCELLED,
};

const VALID_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
  [DeliveryStatus.PENDING]: [DeliveryStatus.ASSIGNED, DeliveryStatus.CANCELLED, DeliveryStatus.IN_TRANSIT],
  [DeliveryStatus.ASSIGNED]: [DeliveryStatus.PICKED_UP, DeliveryStatus.IN_TRANSIT, DeliveryStatus.CANCELLED],
  [DeliveryStatus.PICKED_UP]: [DeliveryStatus.IN_TRANSIT, DeliveryStatus.DELIVERED, DeliveryStatus.FAILED, DeliveryStatus.CANCELLED],
  [DeliveryStatus.IN_TRANSIT]: [DeliveryStatus.DELIVERED, DeliveryStatus.FAILED, DeliveryStatus.CANCELLED, DeliveryStatus.RETURNED],
  [DeliveryStatus.DELIVERED]: [],
  [DeliveryStatus.FAILED]: [DeliveryStatus.ASSIGNED, DeliveryStatus.CANCELLED],
  [DeliveryStatus.CANCELLED]: [],
  [DeliveryStatus.RETURNED]: [],
};

@Injectable()
export class DeliveriesService {
  private readonly logger = new Logger(DeliveriesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly webhookService: WebhookService,
  ) {}

  async getPartners(organizationId: string) {
    return this.prisma.client.deliveryPartner.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: { drivers: true, transactions: true },
        },
      },
    });
  }

  async createPartner(organizationId: string, data: CreateDeliveryPartnerDto) {
    const {
      name,
      email,
      phone,
      address,
      commissionRate,
      fixedFee,
      benefitType,
      reconciliationPolicy,
      isActive,
    } = data;

    return this.prisma.client.deliveryPartner.create({
      data: {
        name,
        email,
        phone,
        address,
        commissionRate,
        fixedFee,
        benefitType: (benefitType as BenefitType) || BenefitType.COMMISSION,
        reconciliationPolicy: (reconciliationPolicy as any) || "RETURN_TO_STOCK",
        isActive: isActive !== undefined ? isActive : true,
        organizationId,
      },
    });
  }

  async getPartner(organizationId: string, id: string) {
    const partner = await this.prisma.client.deliveryPartner.findFirst({
      where: { id, organizationId },
      include: {
        drivers: true,
        walletLogs: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!partner) throw new NotFoundException("Delivery partner not found");
    return partner;
  }

  async updatePartner(organizationId: string, id: string, data: UpdateDeliveryPartnerDto) {
    await this.getPartner(organizationId, id);

    const {
      name,
      email,
      phone,
      address,
      commissionRate,
      fixedFee,
      benefitType,
      reconciliationPolicy,
      isActive,
    } = data;

    return this.prisma.client.deliveryPartner.updateMany({
      where: { id, organizationId },
      data: {
        name,
        email,
        phone,
        address,
        commissionRate,
        fixedFee,
        benefitType: benefitType as BenefitType,
        reconciliationPolicy: reconciliationPolicy as any,
        isActive,
      },
    });
  }

  async adjustPartnerWallet(organizationId: string, partnerId: string, data: AdjustWalletDto) {
    const partner = await this.getPartner(organizationId, partnerId);
    const { amount, type, notes } = data;

    return this.prisma.client.$transaction(async (tx) => {
      const currentBalance = Number(partner.walletBalance);
      const isDeduction = type === "DEDUCTION" || amount < 0;
      const absAmount = Math.abs(amount);
      const newBalance = isDeduction ? currentBalance - absAmount : currentBalance + absAmount;

      await tx.deliveryPartner.update({
        where: { id: partnerId },
        data: { walletBalance: newBalance },
      });

      const log = await tx.partnerWalletLog.create({
        data: {
          partnerId,
          amount: isDeduction ? -absAmount : absAmount,
          balanceAfter: newBalance,
          transactionType: isDeduction ? WalletTxType.PAYOUT : WalletTxType.ADJUSTMENT,
          notes,
        },
      });

      return { partnerId, newBalance, log };
    });
  }

  async dispatchDelivery(ctx: V3ApiContext, data: DispatchDeliveryDto) {
    const { organizationId, memberId } = ctx;
    const { transactionId, driverId, partnerId, notes, estimatedTime, deliveryFee, verificationOtp } = data;

    return this.prisma.client.$transaction(async (tx) => {
      const [transaction, driver, partner] = await Promise.all([
        tx.transaction.findFirst({
          where: { id: transactionId, organizationId },
          include: { customer: true, items: true },
        }),
        driverId
          ? tx.driver.findFirst({
              where: { id: driverId, organizationId },
            })
          : Promise.resolve(null),
        partnerId
          ? tx.deliveryPartner.findFirst({
              where: { id: partnerId, organizationId },
            })
          : Promise.resolve(null),
      ]);

      if (!transaction) throw new NotFoundException("Transaction not found");

      if (driverId) {
        if (!driver) throw new NotFoundException("Driver not found");
        if (driver.availability === DriverStatus.OFFLINE) {
          throw new BadRequestException("Driver is currently offline");
        }
      }

      if (partnerId) {
        if (!partner) throw new NotFoundException("Delivery partner not found");
        if (!partner.isActive) throw new BadRequestException("Delivery partner is not active");
      }

      // Generate a secure 6-digit confirmation token (OTP) if not provided
      const confirmationToken =
        verificationOtp || Math.floor(100000 + Math.random() * 900000).toString();

      // Check for existing fulfillment
      let fulfillment = await tx.fulfillment.findFirst({
        where: {
          transactionId,
          type: "DELIVERY",
        },
      });

      if (!fulfillment) {
        fulfillment = await tx.fulfillment.create({
          data: {
            transactionId,
            type: "DELIVERY",
            status: FulfillmentStatus.IN_TRANSIT,
            driverId: driverId || null,
            deliveryNotes: notes || null,
            scheduledAt: estimatedTime ? new Date(estimatedTime) : null,
            confirmationToken,
            dispatchedAt: new Date(),
            items: {
              create: transaction.items.map((item) => ({
                transactionItemId: item.id,
                quantity: item.quantity,
              })),
            },
          },
        });
      } else {
        fulfillment = await tx.fulfillment.update({
          where: { id: fulfillment.id },
          data: {
            status: FulfillmentStatus.IN_TRANSIT,
            driverId: driverId !== undefined ? driverId : fulfillment.driverId,
            deliveryNotes: notes || fulfillment.deliveryNotes,
            scheduledAt: estimatedTime ? new Date(estimatedTime) : fulfillment.scheduledAt,
            confirmationToken: fulfillment.confirmationToken || confirmationToken,
            dispatchedAt: new Date(),
          },
        });
      }

      // Update driver status if internal driver
      if (driverId) {
        await tx.driver.update({
          where: { id: driverId },
          data: { availability: DriverStatus.ON_DELIVERY },
        });
      }

      // Update transaction status & link partner if provided
      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          deliveryPartnerId: partnerId || transaction.deliveryPartnerId,
          status: TransactionStatus.PROCESSING,
          shippingTotal: deliveryFee !== undefined ? deliveryFee : transaction.shippingTotal,
        },
      });

      const result = {
        fulfillmentId: fulfillment.id,
        transactionId,
        confirmationToken: fulfillment.confirmationToken || confirmationToken,
        driverId: driverId || null,
        partnerId: partnerId || null,
        status: DeliveryStatus.IN_TRANSIT,
      };

      // Emit async webhook dispatch outside transaction failure scope
      setImmediate(() => {
        this.webhookService
          .dispatch("delivery.dispatched", organizationId, {
            fulfillmentId: fulfillment.id,
            transactionId,
            driverId,
            partnerId,
            status: DeliveryStatus.IN_TRANSIT,
            confirmationToken: result.confirmationToken,
            dispatchedAt: new Date().toISOString(),
          })
          .catch((err) => this.logger.error("Failed to dispatch delivery.dispatched webhook", err));
      });

      return result;
    });
  }

  async assignDriverOrPartner(ctx: V3ApiContext, fulfillmentId: string, data: AssignDriverPartnerDto) {
    const { organizationId } = ctx;
    const { driverId, partnerId } = data;

    return this.prisma.client.$transaction(async (tx) => {
      const [fulfillment, driver, partner] = await Promise.all([
        tx.fulfillment.findFirst({
          where: {
            id: fulfillmentId,
            transaction: { organizationId },
          },
          include: { transaction: true },
        }),
        driverId
          ? tx.driver.findFirst({
              where: { id: driverId, organizationId },
            })
          : Promise.resolve(null),
        partnerId
          ? tx.deliveryPartner.findFirst({
              where: { id: partnerId, organizationId },
            })
          : Promise.resolve(null),
      ]);

      if (!fulfillment) throw new NotFoundException("Fulfillment not found");
      if (driverId && !driver) throw new NotFoundException("Driver not found");

      if (partnerId) {
        if (!partner) throw new NotFoundException("Delivery partner not found");
        await tx.transaction.update({
          where: { id: fulfillment.transactionId },
          data: { deliveryPartnerId: partnerId },
        });
      }

      const updatedFulfillment = await tx.fulfillment.update({
        where: { id: fulfillmentId },
        data: {
          driverId: driverId !== undefined ? driverId : fulfillment.driverId,
          status: fulfillment.status === FulfillmentStatus.PENDING ? FulfillmentStatus.PREPARING : fulfillment.status,
        },
      });

      return updatedFulfillment;
    });
  }

  async updateDeliveryStatus(ctx: V3ApiContext, fulfillmentId: string, data: UpdateDeliveryStatusDto) {
    const { organizationId } = ctx;
    const { status, reason, notes, otpCode } = data;

    return this.prisma.client.$transaction(async (tx) => {
      const fulfillment = await tx.fulfillment.findFirst({
        where: {
          id: fulfillmentId,
          transaction: { organizationId },
        },
        include: { driver: true, transaction: true },
      });

      if (!fulfillment) throw new NotFoundException("Fulfillment not found");

      // Verify OTP if transitioning to DELIVERED and OTP is configured
      if (status === DeliveryStatus.DELIVERED && fulfillment.confirmationToken) {
        if (otpCode && otpCode.trim() !== fulfillment.confirmationToken.trim()) {
          throw new BadRequestException("Invalid delivery OTP confirmation code");
        }
      }

      const prismaStatus = DOMAIN_TO_FULFILLMENT_STATUS_MAP[status];

      const updatedFulfillment = await tx.fulfillment.update({
        where: { id: fulfillmentId },
        data: {
          status: prismaStatus,
          deliveryNotes: notes ? `${fulfillment.deliveryNotes || ""}\n${notes}`.trim() : fulfillment.deliveryNotes,
          deliveredAt: status === DeliveryStatus.DELIVERED ? new Date() : fulfillment.deliveredAt,
          confirmedByCustomerAt: status === DeliveryStatus.DELIVERED && otpCode ? new Date() : fulfillment.confirmedByCustomerAt,
          failureReason: [DeliveryStatus.FAILED, DeliveryStatus.CANCELLED].includes(status) ? reason : fulfillment.failureReason,
        },
      });

      if (status === DeliveryStatus.DELIVERED && fulfillment.transaction) {
        if (
          fulfillment.transaction.paymentStatus === PaymentStatus.PAID &&
          (fulfillment.transaction.status === TransactionStatus.PROCESSING || fulfillment.transaction.status === TransactionStatus.PREORDER)
        ) {
          await tx.transaction.update({
            where: { id: fulfillment.transaction.id },
            data: { status: TransactionStatus.COMPLETED, completedAt: new Date() },
          });
        }
      }

      // If delivery is terminal (DELIVERED, FAILED, CANCELLED, RETURNED), free up internal driver
      if (
        fulfillment.driverId &&
        [DeliveryStatus.DELIVERED, DeliveryStatus.FAILED, DeliveryStatus.CANCELLED, DeliveryStatus.RETURNED].includes(status)
      ) {
        await tx.driver.update({
          where: { id: fulfillment.driverId },
          data: { availability: DriverStatus.ONLINE },
        });
      }

      setImmediate(() => {
        const eventName = `delivery.${status.toLowerCase()}`;
        this.webhookService
          .dispatch(eventName, organizationId, {
            fulfillmentId,
            transactionId: fulfillment.transactionId,
            status,
            reason,
            updatedAt: new Date().toISOString(),
          })
          .catch((err) => this.logger.error(`Failed to dispatch ${eventName} webhook`, err));
      });

      return updatedFulfillment;
    });
  }

  async reconcileDelivery(ctx: V3ApiContext, data: ReconcileDeliveryDto) {
    const { organizationId, memberId } = ctx;
    const {
      fulfillmentId,
      status,
      quantityDelivered,
      pod,
      notes,
      reasonCode,
      codAmountCollected,
      codPaymentMethod,
      returnedItems,
    } = data;

    return this.prisma.client.$transaction(async (tx) => {
      const fulfillment = await tx.fulfillment.findFirst({
        where: {
          id: fulfillmentId,
          transaction: { organizationId },
        },
        include: {
          transaction: {
            include: { deliveryPartner: true, items: true },
          },
          items: {
            include: {
              transactionItem: true,
              stockBatch: true,
            },
          },
          driver: true,
        },
      });

      if (!fulfillment) throw new NotFoundException("Fulfillment not found");

      // Verify OTP if provided in POD
      if (pod?.deliveryPin && fulfillment.confirmationToken) {
        if (pod.deliveryPin.trim() !== fulfillment.confirmationToken.trim()) {
          throw new BadRequestException("Invalid delivery OTP confirmation PIN");
        }
      }

      const isSuccess = status === DeliveryStatus.DELIVERED;
      const prismaStatus = isSuccess ? FulfillmentStatus.DELIVERED : FulfillmentStatus.CANCELLED;

      // 1. Process COD (Cash on Delivery) if recorded
      let createdPayment: any = null;
      if (codAmountCollected && Number(codAmountCollected) > 0) {
        const amountNum = Number(codAmountCollected);
        const method = (codPaymentMethod?.toUpperCase() as PaymentMethod) || PaymentMethod.CASH;

        createdPayment = await tx.payment.create({
          data: {
            transactionId: fulfillment.transactionId,
            organizationId,
            method,
            status: PaymentStatus.COMPLETED,
            amount: amountNum,
            amountReceived: amountNum,
            payerName: pod?.recipientName || fulfillment.receivedBy || "Customer",
            processedAt: new Date(),
            notes: `COD collected during delivery reconciliation (${fulfillment.transaction.number})`,
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

      // 2. Restock returned items if any
      if (returnedItems && returnedItems.length > 0) {
        for (const ret of returnedItems) {
          const matchedItem = fulfillment.items.find(
            (fi) => fi.id === ret.itemId || fi.transactionItemId === ret.itemId,
          );

          if (matchedItem) {
            const qtyReturned = Math.max(0, Number(ret.quantityReturned) || 0);
            const qtyDamaged = Math.max(0, Number(ret.quantityDamaged) || 0);
            const qtyToRestock = Math.max(0, qtyReturned - qtyDamaged);

            await tx.fulfillmentItem.update({
              where: { id: matchedItem.id },
              data: {
                quantityReturned: qtyReturned,
                quantityDamaged: qtyDamaged,
              },
            });

            // Restock undamaged goods back into StockBatch and ProductVariantStock
            if (qtyToRestock > 0) {
              if (matchedItem.stockBatchId) {
                await tx.stockBatch.update({
                  where: { id: matchedItem.stockBatchId },
                  data: {
                    currentQuantity: { increment: qtyToRestock },
                  },
                });
              }

              const variantId = matchedItem.transactionItem?.variantId;
              const locationId = fulfillment.transaction.locationId;

              if (variantId && locationId) {
                await tx.productVariantStock.updateMany({
                  where: { variantId, locationId },
                  data: {
                    currentStock: { increment: qtyToRestock },
                  },
                });

                await tx.stockMovement.create({
                  data: {
                    type: MovementType.CUSTOMER_RETURN,
                    quantity: qtyToRestock,
                    variantId,
                    locationId,
                    stockBatchId: matchedItem.stockBatchId || undefined,
                    reference: `DELIVERY_RETURN_${fulfillment.id}`,
                    notes: `Restocked ${qtyToRestock} units from returned delivery. Reason: ${ret.reason || "Returned by customer"}`,
                    movementDate: new Date(),
                  },
                });
              }
            }
          }
        }
      }

      // 3. Update fulfillment reconciliation details
      const updatedFulfillment = await tx.fulfillment.update({
        where: { id: fulfillmentId },
        data: {
          status: prismaStatus,
          quantityDelivered: quantityDelivered !== undefined ? quantityDelivered : fulfillment.quantityHandedOver,
          isReconciled: true,
          reconciledAt: new Date(),
          reconciledBy: memberId || null,
          deliveredAt: isSuccess ? new Date() : null,
          receivedBy: pod?.recipientName || fulfillment.receivedBy,
          proofOfDeliveryUrl: pod?.signatureUrl || pod?.photoUrl || fulfillment.proofOfDeliveryUrl,
          confirmedByCustomerAt: isSuccess && (pod?.deliveryPin || fulfillment.confirmationToken) ? new Date() : fulfillment.confirmedByCustomerAt,
          codAmountCollected: codAmountCollected ? Number(codAmountCollected) : null,
          reconciliationNotes: notes || null,
          failureReason: !isSuccess ? reasonCode || notes : fulfillment.failureReason,
          deliveryNotes: [
            fulfillment.deliveryNotes,
            notes,
            pod?.recipientName ? `Recipient: ${pod.recipientName}` : null,
            pod?.deliveryPin ? `PIN: ${pod.deliveryPin}` : null,
            pod?.signatureUrl ? `Signature: ${pod.signatureUrl}` : null,
            pod?.photoUrl ? `Proof Photo: ${pod.photoUrl}` : null,
            reasonCode ? `Reason Code: ${reasonCode}` : null,
          ]
            .filter(Boolean)
            .join(" | "),
        },
      });

      // 4. Update transaction status
      const currentTx = await tx.transaction.findUnique({
        where: { id: fulfillment.transactionId },
      });

      const shouldCompleteTx =
        isSuccess && (currentTx?.paymentStatus === PaymentStatus.PAID || (currentTx?.totalPaid && Number(currentTx.totalPaid) > 0));

      await tx.transaction.update({
        where: { id: fulfillment.transactionId },
        data: {
          status: shouldCompleteTx ? TransactionStatus.COMPLETED : isSuccess ? TransactionStatus.PROCESSING : TransactionStatus.CANCELLED,
          completedAt: shouldCompleteTx ? new Date() : null,
          cancelledAt: !isSuccess ? new Date() : null,
        },
      });

      // 5. Process Partner Wallet financial calculation if delivery partner attached
      const partner = fulfillment.transaction.deliveryPartner;
      if (partner && isSuccess) {
        let earnedFee = 0;
        const total = Number(fulfillment.transaction.finalTotal);

        if (partner.benefitType === BenefitType.COMMISSION && partner.commissionRate) {
          earnedFee = (total * Number(partner.commissionRate)) / 100;
        } else if (partner.fixedFee) {
          earnedFee = Number(partner.fixedFee);
        }

        if (earnedFee > 0) {
          const newBalance = Number(partner.walletBalance) + earnedFee;
          await tx.deliveryPartner.update({
            where: { id: partner.id },
            data: { walletBalance: newBalance },
          });

          await tx.partnerWalletLog.create({
            data: {
              partnerId: partner.id,
              amount: earnedFee,
              balanceAfter: newBalance,
              transactionType: WalletTxType.BENEFIT_ACCRUAL,
              notes: `Commission for completed fulfillment ${fulfillmentId} (Order ${fulfillment.transaction.number})`,
            },
          });
        }
      }

      // 6. Free up internal driver availability
      if (fulfillment.driverId) {
        await tx.driver.update({
          where: { id: fulfillment.driverId },
          data: { availability: DriverStatus.ONLINE },
        });
      }

      setImmediate(() => {
        this.webhookService
          .dispatch("delivery.reconciled", organizationId, {
            fulfillmentId,
            transactionId: fulfillment.transactionId,
            status,
            isReconciled: true,
            pod,
            codAmountCollected,
            reconciledAt: new Date().toISOString(),
          })
          .catch((err) => this.logger.error("Failed to dispatch delivery.reconciled webhook", err));
      });

      return {
        ...updatedFulfillment,
        codPayment: createdPayment,
      };
    });
  }

  async getActiveDeliveries(organizationId: string) {
    return this.prisma.client.fulfillment.findMany({
      where: {
        transaction: { organizationId },
        status: { in: [FulfillmentStatus.PENDING, FulfillmentStatus.PREPARING, FulfillmentStatus.READY, FulfillmentStatus.IN_TRANSIT] },
        type: "DELIVERY",
      },
      include: {
        transaction: {
          select: {
            id: true,
            number: true,
            status: true,
            paymentStatus: true,
            finalTotal: true,
            totalPaid: true,
            currencyCode: true,
            createdAt: true,
            customer: {
              select: { id: true, name: true, phone: true, email: true },
            },
            deliveryPartner: {
              select: { id: true, name: true, phone: true, benefitType: true },
            },
          },
        },
        driver: {
          select: { id: true, name: true, phone: true, availability: true },
        },
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

  async getDriverDeliveries(organizationId: string, driverId: string) {
    return this.prisma.client.fulfillment.findMany({
      where: {
        driverId,
        transaction: { organizationId },
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
      take: 20,
    });
  }

  async getDeliveryMetrics(organizationId: string) {
    const [totalDeliveries, activeDeliveries, reconciledDeliveries, drivers, partners] = await Promise.all([
      this.prisma.client.fulfillment.count({
        where: { transaction: { organizationId }, type: "DELIVERY" },
      }),
      this.prisma.client.fulfillment.count({
        where: {
          transaction: { organizationId },
          type: "DELIVERY",
          status: { in: [FulfillmentStatus.PENDING, FulfillmentStatus.PREPARING, FulfillmentStatus.READY, FulfillmentStatus.IN_TRANSIT] },
        },
      }),
      this.prisma.client.fulfillment.count({
        where: { transaction: { organizationId }, type: "DELIVERY", isReconciled: true },
      }),
      this.prisma.client.driver.count({
        where: { organizationId },
      }),
      this.prisma.client.deliveryPartner.count({
        where: { organizationId, isActive: true },
      }),
    ]);

    return {
      totalDeliveries,
      activeDeliveries,
      reconciledDeliveries,
      driversCount: drivers,
      partnersCount: partners,
    };
  }
}
