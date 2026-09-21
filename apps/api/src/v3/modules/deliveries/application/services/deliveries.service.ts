import { BenefitType, WalletTxType } from "@repo/db";
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { type V3ApiContext } from "@repo/shared/api/v3";
import {
  CreateDeliveryPartnerDto,
  UpdateDeliveryPartnerDto,
  AdjustWalletDto,
  DispatchDeliveryDto,
  ReconcileDeliveryDto,
} from "../../dto/deliveries.dto";

@Injectable()
export class DeliveriesService {
  constructor(private readonly prisma: PrismaService) {}

  async getPartners(organizationId: string) {
    return this.prisma.client.deliveryPartner.findMany({
      where: { organizationId },
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
        benefitType,
        reconciliationPolicy,
        isActive: isActive !== undefined ? isActive : true,
        organizationId,
      } as any,
    });
  }

  async getPartner(organizationId: string, id: string) {
    const partner = await this.prisma.client.deliveryPartner.findFirst({
      where: { id, organizationId },
      include: { walletLogs: { take: 20, orderBy: { createdAt: "desc" } } },
    });
    if (!partner) throw new NotFoundException("Delivery partner not found");
    return partner;
  }

  async updatePartner(organizationId: string, id: string, data: UpdateDeliveryPartnerDto) {
    const partner = await this.prisma.client.deliveryPartner.findFirst({
      where: { id, organizationId },
    });
    if (!partner) throw new NotFoundException("Delivery partner not found");

    return this.prisma.client.deliveryPartner.update({
      where: { id },
      data: data as any,
    });
  }

  async adjustPartnerWallet(organizationId: string, id: string, data: AdjustWalletDto) {
    const partner = await this.prisma.client.deliveryPartner.findFirst({
      where: { id, organizationId },
    });
    if (!partner) throw new NotFoundException("Delivery partner not found");

    const newBalance = Number(partner.walletBalance) + Number(data.amount);
    return this.prisma.client.$transaction([
      this.prisma.client.deliveryPartner.update({
        where: { id },
        data: { walletBalance: newBalance },
      }),
      this.prisma.client.partnerWalletLog.create({
        data: {
          partnerId: id,
          amount: data.amount,
          balanceAfter: newBalance,
          transactionType: (data.type as WalletTxType) || WalletTxType.ADJUSTMENT,
          notes: data.notes,
        },
      }),
    ]);
  }

  async dispatchDelivery(ctx: V3ApiContext, data: DispatchDeliveryDto) {
    const { organizationId } = ctx;
    const { transactionId, partnerId, driverId, notes } = data;

    return this.prisma.client.$transaction(async tx => {
      const transaction = await tx.transaction.findFirst({
        where: { id: transactionId, organizationId },
      });

      if (!transaction) throw new NotFoundException("Transaction not found");

      const fulfillment = await tx.fulfillment.create({
        data: {
          transactionId,
          type: "DELIVERY" as any,
          status: "IN_TRANSIT" as any,
          driverId: driverId,
          deliveryNotes: notes,
          dispatchedAt: new Date(),
        },
      });

      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          deliveryPartnerId: partnerId,
        },
      });

      return fulfillment;
    });
  }

  async reconcileDelivery(ctx: V3ApiContext, data: ReconcileDeliveryDto) {
    const { organizationId } = ctx;
    const { fulfillmentId, status, notes } = data;

    return this.prisma.client.$transaction(async tx => {
      const fulfillment = await tx.fulfillment.findFirst({
        where: {
          id: fulfillmentId,
          transaction: { organizationId },
        },
      });

      if (!fulfillment) throw new NotFoundException("Fulfillment not found");

      const updatedFulfillment = await tx.fulfillment.update({
        where: { id: fulfillmentId },
        data: {
          status: (status === "DELIVERED" ? "DELIVERED" : "CANCELLED") as any,
          deliveredAt: status === "DELIVERED" ? new Date() : null,
          deliveryNotes: notes || fulfillment.deliveryNotes,
        },
      });

      return updatedFulfillment;
    });
  }

  async getActiveDeliveries(organizationId: string) {
    return this.prisma.client.fulfillment.findMany({
      where: {
        transaction: { organizationId },
        status: { in: ["PENDING", "IN_TRANSIT"] },
        type: "DELIVERY",
      },
      include: {
        transaction: { include: { customer: true, deliveryPartner: true } },
        driver: true,
      },
    });
  }
}
