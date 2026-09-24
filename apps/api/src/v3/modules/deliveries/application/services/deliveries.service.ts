import { BenefitType, WalletTxType, DriverStatus, FulfillmentStatus, TransactionStatus } from "@repo/db";
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

// Map our domain DeliveryStatus to Prisma's FulfillmentStatus enum where necessary
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
        benefitType: benefitType as BenefitType || BenefitType.COMMISSION,
        reconciliationPolicy: reconciliationPolicy as any,
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
        walletLogs: { take: 50, orderBy: { createdAt: "desc" } },
      },
    });
    if (!partner) throw new NotFoundException("Delivery partner not found");
    return partner;
  }

  async updatePartner(organizationId: string, id: string, data: UpdateDeliveryPartnerDto) {
    const partner = await this.prisma.client.deliveryPartner.findFirst({
      where: { id, organizationId },
    });
    if (!partner) throw new NotFoundException("Delivery partner not found");

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.commissionRate !== undefined) updateData.commissionRate = data.commissionRate;
    if (data.fixedFee !== undefined) updateData.fixedFee = data.fixedFee;
    if (data.benefitType !== undefined) updateData.benefitType = data.benefitType;
    if (data.reconciliationPolicy !== undefined) updateData.reconciliationPolicy = data.reconciliationPolicy;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    await this.prisma.client.deliveryPartner.updateMany({
      where: { id, organizationId },
      data: updateData,
    });

    return this.getPartner(organizationId, id);
  }

  async adjustPartnerWallet(organizationId: string, id: string, data: AdjustWalletDto) {
    const partner = await this.prisma.client.deliveryPartner.findFirst({
      where: { id, organizationId },
    });
    if (!partner) throw new NotFoundException("Delivery partner not found");

    const currentBalance = Number(partner.walletBalance);
    const adjustAmount = Number(data.amount);
    const newBalance = currentBalance + adjustAmount;

    if (newBalance < 0 && data.type === WalletTxType.WITHDRAWAL) {
      throw new BadRequestException("Insufficient partner wallet balance for withdrawal");
    }

    return this.prisma.client.$transaction(async (tx) => {
      const updatedPartner = await tx.deliveryPartner.update({
        where: { id },
        data: { walletBalance: newBalance },
      });

      const log = await tx.partnerWalletLog.create({
        data: {
          partnerId: id,
          amount: adjustAmount,
          balanceAfter: newBalance,
          transactionType: (data.type as WalletTxType) || WalletTxType.ADJUSTMENT,
          notes: data.notes || "Manual wallet adjustment",
        },
      });

      return { partner: updatedPartner, log };
    });
  }

  async dispatchDelivery(ctx: V3ApiContext, data: DispatchDeliveryDto) {
    const { organizationId } = ctx;
    const { transactionId, partnerId, driverId, notes } = data;

    return this.prisma.client.$transaction(async (tx) => {
      const transaction = await tx.transaction.findFirst({
        where: { id: transactionId, organizationId },
        include: { customer: true, deliveryPartner: true },
      });

      if (!transaction) throw new NotFoundException("Transaction not found");

      // Validate internal driver if provided
      let driver = null;
      if (driverId) {
        driver = await tx.driver.findFirst({
          where: { id: driverId, organizationId },
        });
        if (!driver) throw new NotFoundException("Driver not found");
        if (driver.availability === DriverStatus.OFFLINE) {
          throw new BadRequestException("Assigned driver is currently offline");
        }
      }

      // Validate external delivery partner if provided
      let partner = null;
      if (partnerId) {
        partner = await tx.deliveryPartner.findFirst({
          where: { id: partnerId, organizationId },
        });
        if (!partner) throw new NotFoundException("Delivery partner not found");
        if (!partner.isActive) {
          throw new BadRequestException("Delivery partner is not active");
        }
      }

      // Check existing fulfillment or create a new one
      let fulfillment = await tx.fulfillment.findFirst({
        where: { transactionId },
      });

      if (fulfillment) {
        fulfillment = await tx.fulfillment.update({
          where: { id: fulfillment.id },
          data: {
            status: FulfillmentStatus.IN_TRANSIT,
            driverId: driverId || fulfillment.driverId,
            deliveryNotes: notes || fulfillment.deliveryNotes,
            dispatchedAt: new Date(),
          },
        });
      } else {
        fulfillment = await tx.fulfillment.create({
          data: {
            transactionId,
            type: "DELIVERY" as any,
            status: FulfillmentStatus.IN_TRANSIT,
            driverId: driverId || null,
            deliveryNotes: notes || null,
            dispatchedAt: new Date(),
          },
        });
      }

      // Link partner to transaction if provided
      if (partnerId) {
        await tx.transaction.update({
          where: { id: transactionId },
          data: { deliveryPartnerId: partnerId },
        });
      }

      // Update driver availability status to ON_DELIVERY
      if (driverId) {
        await tx.driver.update({
          where: { id: driverId },
          data: { availability: DriverStatus.ON_DELIVERY },
        });
      }

      const result = {
        fulfillment,
        transactionId,
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
      const fulfillment = await tx.fulfillment.findFirst({
        where: {
          id: fulfillmentId,
          transaction: { organizationId },
        },
        include: { transaction: true },
      });

      if (!fulfillment) throw new NotFoundException("Fulfillment not found");

      if (driverId) {
        const driver = await tx.driver.findFirst({
          where: { id: driverId, organizationId },
        });
        if (!driver) throw new NotFoundException("Driver not found");
      }

      if (partnerId) {
        const partner = await tx.deliveryPartner.findFirst({
          where: { id: partnerId, organizationId },
        });
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
    const { status, reason, notes } = data;

    return this.prisma.client.$transaction(async (tx) => {
      const fulfillment = await tx.fulfillment.findFirst({
        where: {
          id: fulfillmentId,
          transaction: { organizationId },
        },
        include: { driver: true, transaction: true },
      });

      if (!fulfillment) throw new NotFoundException("Fulfillment not found");

      const prismaStatus = DOMAIN_TO_FULFILLMENT_STATUS_MAP[status];

      const updatedFulfillment = await tx.fulfillment.update({
        where: { id: fulfillmentId },
        data: {
          status: prismaStatus,
          deliveryNotes: notes ? `${fulfillment.deliveryNotes || ""}\n${notes}`.trim() : fulfillment.deliveryNotes,
          deliveredAt: status === DeliveryStatus.DELIVERED ? new Date() : fulfillment.deliveredAt,
        },
      });

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
    const { organizationId } = ctx;
    const { fulfillmentId, status, quantityDelivered, pod, notes, reasonCode } = data;

    return this.prisma.client.$transaction(async (tx) => {
      const fulfillment = await tx.fulfillment.findFirst({
        where: {
          id: fulfillmentId,
          transaction: { organizationId },
        },
        include: {
          transaction: {
            include: { deliveryPartner: true },
          },
          driver: true,
        },
      });

      if (!fulfillment) throw new NotFoundException("Fulfillment not found");

      const isSuccess = status === DeliveryStatus.DELIVERED;
      const prismaStatus = isSuccess ? FulfillmentStatus.DELIVERED : FulfillmentStatus.CANCELLED;

      // Update fulfillment reconciliation details
      const updatedFulfillment = await tx.fulfillment.update({
        where: { id: fulfillmentId },
        data: {
          status: prismaStatus,
          quantityDelivered: quantityDelivered !== undefined ? quantityDelivered : fulfillment.quantityHandedOver,
          isReconciled: true,
          deliveredAt: isSuccess ? new Date() : null,
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

      // Update transaction status
      await tx.transaction.update({
        where: { id: fulfillment.transactionId },
        data: {
          status: isSuccess ? TransactionStatus.COMPLETED : TransactionStatus.CANCELLED,
          completedAt: isSuccess ? new Date() : null,
          cancelledAt: !isSuccess ? new Date() : null,
        },
      });

      // Process Partner Wallet financial calculation if delivery partner attached
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
              transactionType: WalletTxType.EARNING,
              notes: `Commission for completed fulfillment ${fulfillmentId} (Order ${fulfillment.transaction.number})`,
            },
          });
        }
      }

      // Free up internal driver availability
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
            reconciledAt: new Date().toISOString(),
          })
          .catch((err) => this.logger.error("Failed to dispatch delivery.reconciled webhook", err));
      });

      return updatedFulfillment;
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
            finalTotal: true,
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
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
