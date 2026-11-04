import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import {
  db,
  LoyaltyTransactionType,
  VoucherStatus,
  Decimal,
  TierBasis,
} from "@repo/db";
import {
  emitLoyaltyPointsAwarded,
  emitLoyaltyVoucherCreated,
} from "@repo/shared/server";
import { randomBytes } from "crypto";
import {
  UpsertLoyaltyProgramDto,
  CreateLoyaltyTierDto,
  UpdateLoyaltyTierDto,
  CreateLoyaltyRuleDto,
  UpdateLoyaltyRuleDto,
  CreateLoyaltyRewardDto,
  UpdateLoyaltyRewardDto,
  DirectRedeemPointsDto,
} from "./dto/loyalty.dto";

@Injectable()
export class LoyaltyService {
  constructor(private readonly prisma: PrismaService) {}

  // -------------------------------------------------------------
  // PROGRAM CONFIGURATION
  // -------------------------------------------------------------

  async getProgram(organizationId: string) {
    let program = await db.loyaltyProgram.findFirst({
      where: { organizationId },
      include: {
        tiers: { orderBy: { minPoints: "asc" } },
        rules: { orderBy: { createdAt: "desc" } },
        rewards: { orderBy: { pointsRequired: "asc" } },
      },
    });

    if (!program) {
      program = await this.prisma.client.loyaltyProgram.create({
        data: {
          name: "Default Rewards",
          organizationId,
          pointsLabel: "Points",
          exchangeRate: new Decimal(1.0),
          tierBasis: TierBasis.CURRENT_BALANCE,
          allowDirectRedemption: true,
          minRedeemPoints: 0,
          maxRedemptionPercentage: new Decimal(100.0),
        },
        include: {
          tiers: { orderBy: { minPoints: "asc" } },
          rules: { orderBy: { createdAt: "desc" } },
          rewards: { orderBy: { pointsRequired: "asc" } },
        },
      });
    }

    return program;
  }

  async upsertProgram(organizationId: string, dto: UpsertLoyaltyProgramDto) {
    const existing = await db.loyaltyProgram.findFirst({
      where: { organizationId },
    });

    const data: any = {
      name: dto.name,
      description: dto.description,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
      pointsLabel: dto.pointsLabel || "Points",
      exchangeRate: dto.exchangeRate ? new Decimal(dto.exchangeRate) : new Decimal(1.0),
      expiryMonths: dto.expiryMonths !== undefined ? dto.expiryMonths : null,
      tierBasis: (dto.tierBasis as TierBasis) || TierBasis.CURRENT_BALANCE,
      minRedeemPoints: dto.minRedeemPoints ?? 0,
      maxRedemptionPercentage: dto.maxRedemptionPercentage
        ? new Decimal(dto.maxRedemptionPercentage)
        : new Decimal(100.0),
      allowDirectRedemption: dto.allowDirectRedemption ?? true,
    };

    if (existing) {
      return await this.prisma.client.loyaltyProgram.update({
        where: { id: existing.id },
        data,
        include: {
          tiers: { orderBy: { minPoints: "asc" } },
          rules: { orderBy: { createdAt: "desc" } },
          rewards: { orderBy: { pointsRequired: "asc" } },
        },
      });
    }

    return await this.prisma.client.loyaltyProgram.create({
      data: {
        ...data,
        organizationId,
      },
      include: {
        tiers: { orderBy: { minPoints: "asc" } },
        rules: { orderBy: { createdAt: "desc" } },
        rewards: { orderBy: { pointsRequired: "asc" } },
      },
    });
  }

  // -------------------------------------------------------------
  // TIERS MANAGEMENT
  // -------------------------------------------------------------

  async createTier(organizationId: string, dto: CreateLoyaltyTierDto) {
    const program = await this.getProgram(organizationId);

    return await this.prisma.client.loyaltyTier.create({
      data: {
        programId: program.id,
        name: dto.name,
        description: dto.description,
        minPoints: dto.minPoints,
        multiplier: dto.multiplier ? new Decimal(dto.multiplier) : new Decimal(1.0),
        color: dto.color,
        icon: dto.icon,
      },
    });
  }

  async updateTier(tierId: string, organizationId: string, dto: UpdateLoyaltyTierDto) {
    const tier = await db.loyaltyTier.findFirst({
      where: { id: tierId, program: { organizationId } },
    });
    if (!tier) throw new NotFoundException("Loyalty tier not found");

    return await this.prisma.client.loyaltyTier.update({
      where: { id: tierId },
      data: {
        name: dto.name,
        description: dto.description,
        minPoints: dto.minPoints,
        multiplier: dto.multiplier ? new Decimal(dto.multiplier) : undefined,
        color: dto.color,
        icon: dto.icon,
      },
    });
  }

  async deleteTier(tierId: string, organizationId: string) {
    const tier = await db.loyaltyTier.findFirst({
      where: { id: tierId, program: { organizationId } },
    });
    if (!tier) throw new NotFoundException("Loyalty tier not found");

    await this.prisma.client.loyaltyTier.delete({
      where: { id: tierId },
    });
    return { success: true };
  }

  // -------------------------------------------------------------
  // RULES MANAGEMENT
  // -------------------------------------------------------------

  async createRule(organizationId: string, dto: CreateLoyaltyRuleDto) {
    const program = await this.getProgram(organizationId);

    return await this.prisma.client.loyaltyRule.create({
      data: {
        programId: program.id,
        name: dto.name,
        description: dto.description,
        ruleType: dto.ruleType as any,
        pointsValue: dto.pointsValue,
        currencyAmount: dto.currencyAmount ? new Decimal(dto.currencyAmount) : null,
        categoryId: dto.categoryId,
        productId: dto.productId,
        variantId: dto.variantId,
        minOrderValue: dto.minOrderValue ? new Decimal(dto.minOrderValue) : null,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
        validTo: dto.validTo ? new Date(dto.validTo) : null,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateRule(ruleId: string, organizationId: string, dto: UpdateLoyaltyRuleDto) {
    const rule = await db.loyaltyRule.findFirst({
      where: { id: ruleId, program: { organizationId } },
    });
    if (!rule) throw new NotFoundException("Loyalty rule not found");

    return await this.prisma.client.loyaltyRule.update({
      where: { id: ruleId },
      data: {
        name: dto.name,
        description: dto.description,
        ruleType: dto.ruleType as any,
        pointsValue: dto.pointsValue,
        currencyAmount: dto.currencyAmount ? new Decimal(dto.currencyAmount) : undefined,
        categoryId: dto.categoryId,
        productId: dto.productId,
        variantId: dto.variantId,
        minOrderValue: dto.minOrderValue ? new Decimal(dto.minOrderValue) : undefined,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validTo: dto.validTo ? new Date(dto.validTo) : undefined,
        isActive: dto.isActive,
      },
    });
  }

  async deleteRule(ruleId: string, organizationId: string) {
    const rule = await db.loyaltyRule.findFirst({
      where: { id: ruleId, program: { organizationId } },
    });
    if (!rule) throw new NotFoundException("Loyalty rule not found");

    await this.prisma.client.loyaltyRule.delete({
      where: { id: ruleId },
    });
    return { success: true };
  }

  // -------------------------------------------------------------
  // REWARDS CATALOG MANAGEMENT
  // -------------------------------------------------------------

  async createReward(organizationId: string, dto: CreateLoyaltyRewardDto) {
    const program = await this.getProgram(organizationId);

    return await this.prisma.client.loyaltyReward.create({
      data: {
        programId: program.id,
        name: dto.name,
        description: dto.description,
        rewardType: dto.rewardType as any,
        pointsRequired: dto.pointsRequired,
        discountValue: dto.discountValue ? new Decimal(dto.discountValue) : null,
        productId: dto.productId,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateReward(rewardId: string, organizationId: string, dto: UpdateLoyaltyRewardDto) {
    const reward = await db.loyaltyReward.findFirst({
      where: { id: rewardId, program: { organizationId } },
    });
    if (!reward) throw new NotFoundException("Loyalty reward not found");

    return await this.prisma.client.loyaltyReward.update({
      where: { id: rewardId },
      data: {
        name: dto.name,
        description: dto.description,
        rewardType: dto.rewardType as any,
        pointsRequired: dto.pointsRequired,
        discountValue: dto.discountValue ? new Decimal(dto.discountValue) : undefined,
        productId: dto.productId,
        isActive: dto.isActive,
      },
    });
  }

  async deleteReward(rewardId: string, organizationId: string) {
    const reward = await db.loyaltyReward.findFirst({
      where: { id: rewardId, program: { organizationId } },
    });
    if (!reward) throw new NotFoundException("Loyalty reward not found");

    await this.prisma.client.loyaltyReward.delete({
      where: { id: rewardId },
    });
    return { success: true };
  }

  // -------------------------------------------------------------
  // CUSTOMER AUDITED MANUAL ADJUSTMENTS
  // -------------------------------------------------------------

  async adjustPoints(
    customerId: string,
    organizationId: string,
    points: number,
    reason: string,
    staffMemberId?: string,
  ) {
    if (!reason || reason.trim() === "") {
      throw new BadRequestException("Reason is required for manual points adjustment");
    }

    const [customer, program] = await Promise.all([
      db.customer.findFirst({ where: { id: customerId, organizationId } }),
      db.loyaltyProgram.findFirst({ where: { organizationId, isActive: true } }),
    ]);

    if (!customer) throw new NotFoundException("Customer not found");
    if (!program) throw new BadRequestException("Active loyalty program not found");

    const newBalance = customer.loyaltyPoints + points;
    if (newBalance < 0) {
      throw new BadRequestException("Adjustment would cause customer points to drop below zero");
    }

    return await this.prisma.client.$transaction(async tx => {
      const updatedCustomer = await tx.customer.update({
        where: { id: customerId },
        data: { loyaltyPoints: { increment: points } },
      });

      const auditDescription = staffMemberId
        ? `Manual adjustment by staff ${staffMemberId}: ${reason}`
        : `Manual adjustment: ${reason}`;

      const loyaltyTx = await tx.loyaltyTransaction.create({
        data: {
          programId: program.id,
          customerId,
          organizationId,
          type: LoyaltyTransactionType.ADJUSTED,
          points,
          balanceAfter: updatedCustomer.loyaltyPoints,
          description: auditDescription,
          referenceId: staffMemberId,
          referenceType: "MANUAL_ADJUSTMENT",
        },
      });

      return {
        customer: updatedCustomer,
        transaction: loyaltyTx,
      };
    });
  }

  // -------------------------------------------------------------
  // DIRECT REDEEM (PAY WITH POINTS AT CHECKOUT)
  // -------------------------------------------------------------

  async directRedeemPoints(organizationId: string, dto: DirectRedeemPointsDto) {
    const [customer, program] = await Promise.all([
      db.customer.findFirst({ where: { id: dto.customerId, organizationId } }),
      db.loyaltyProgram.findFirst({ where: { organizationId, isActive: true } }),
    ]);

    if (!customer) throw new NotFoundException("Customer not found");
    if (!program) throw new BadRequestException("Active loyalty program not found");

    if (!program.allowDirectRedemption) {
      throw new BadRequestException("Direct point redemption is disabled for this organization");
    }

    if (customer.loyaltyPoints < dto.points) {
      throw new BadRequestException("Insufficient loyalty points balance");
    }

    if (customer.loyaltyPoints < program.minRedeemPoints) {
      throw new BadRequestException(
        `Minimum balance of ${program.minRedeemPoints} points required to redeem`,
      );
    }

    // Calculate discount amount from exchangeRate (e.g. 100 points / exchangeRate 100 = 1 currency unit discount)
    const rate = program.exchangeRate.toNumber();
    const discountAmount = rate > 0 ? dto.points / rate : 0;

    const maxAllowedDiscount =
      (dto.orderTotal * program.maxRedemptionPercentage.toNumber()) / 100;

    if (discountAmount > maxAllowedDiscount) {
      throw new BadRequestException(
        `Redemption exceeds maximum permitted order discount (${program.maxRedemptionPercentage}% = ${maxAllowedDiscount.toFixed(2)})`,
      );
    }

    return await this.prisma.client.$transaction(async tx => {
      const updatedCustomer = await tx.customer.update({
        where: { id: dto.customerId },
        data: { loyaltyPoints: { decrement: dto.points } },
      });

      if (updatedCustomer.loyaltyPoints < 0) {
        throw new BadRequestException("Insufficient loyalty points balance");
      }

      const loyaltyTx = await tx.loyaltyTransaction.create({
        data: {
          programId: program.id,
          customerId: dto.customerId,
          organizationId,
          type: LoyaltyTransactionType.REDEEMED,
          points: -dto.points,
          balanceAfter: updatedCustomer.loyaltyPoints,
          description: `Direct checkout redemption: ${dto.points} pts for discount`,
          referenceId: dto.transactionId,
          referenceType: "TRANSACTION",
        },
      });

      return {
        success: true,
        pointsRedeemed: dto.points,
        discountAmount,
        newBalance: updatedCustomer.loyaltyPoints,
        transactionId: loyaltyTx.id,
      };
    });
  }

  // -------------------------------------------------------------
  // AUTOMATED POINTS EXPIRY PROCESSOR
  // -------------------------------------------------------------

  async processPointExpirations(organizationId: string) {
    const program = await db.loyaltyProgram.findFirst({
      where: { organizationId, isActive: true },
    });

    if (!program || !program.expiryMonths || program.expiryMonths <= 0) {
      return { expiredCustomersCount: 0, totalPointsExpired: 0 };
    }

    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - program.expiryMonths);

    // Find customers in organization with positive points balance
    const customersWithPoints = await db.customer.findMany({
      where: {
        organizationId,
        loyaltyPoints: { gt: 0 },
      },
      select: {
        id: true,
        loyaltyPoints: true,
        updatedAt: true,
        loyaltyTransactions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true },
        },
      },
    });

    let expiredCustomersCount = 0;
    let totalPointsExpired = 0;

    for (const cust of customersWithPoints) {
      const lastActivity =
        cust.loyaltyTransactions[0]?.createdAt || cust.updatedAt;

      if (lastActivity < cutoffDate) {
        const pointsToExpire = cust.loyaltyPoints;

        await this.prisma.client.$transaction(async tx => {
          await tx.customer.update({
            where: { id: cust.id },
            data: { loyaltyPoints: 0 },
          });

          await tx.loyaltyTransaction.create({
            data: {
              programId: program.id,
              customerId: cust.id,
              organizationId,
              type: LoyaltyTransactionType.EXPIRED,
              points: -pointsToExpire,
              balanceAfter: 0,
              description: `Points expired after ${program.expiryMonths} months of inactivity`,
              referenceType: "EXPIRATION",
            },
          });
        });

        expiredCustomersCount++;
        totalPointsExpired += pointsToExpire;
      }
    }

    return {
      expiredCustomersCount,
      totalPointsExpired,
      cutoffDate: cutoffDate.toISOString(),
    };
  }

  // -------------------------------------------------------------
  // CUSTOMER HISTORY & ANALYTICS
  // -------------------------------------------------------------

  async getCustomerHistory(
    customerId: string,
    organizationId: string,
    limit: number = 50,
  ) {
    const customer = await db.customer.findFirst({
      where: { id: customerId, organizationId },
      select: { id: true, name: true, email: true, loyaltyPoints: true },
    });
    if (!customer) throw new NotFoundException("Customer not found");

    const transactions = await db.loyaltyTransaction.findMany({
      where: { customerId, organizationId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return { customer, transactions };
  }

  async getAnalytics(organizationId: string) {
    const [program, totalPointsAgg, totalRedeemedAgg, activeMembersCount] =
      await Promise.all([
        db.loyaltyProgram.findFirst({
          where: { organizationId },
          include: { tiers: true, rules: true, rewards: true },
        }),
        db.loyaltyTransaction.aggregate({
          where: { organizationId, type: LoyaltyTransactionType.EARNED },
          _sum: { points: true },
        }),
        db.loyaltyTransaction.aggregate({
          where: { organizationId, type: LoyaltyTransactionType.REDEEMED },
          _sum: { points: true },
        }),
        db.customer.count({
          where: { organizationId, loyaltyPoints: { gt: 0 } },
        }),
      ]);

    return {
      program: program ? { id: program.id, name: program.name, isActive: program.isActive } : null,
      totalPointsIssued: totalPointsAgg._sum.points || 0,
      totalPointsRedeemed: Math.abs(totalRedeemedAgg._sum.points || 0),
      activeLoyaltyCustomers: activeMembersCount,
      tiersCount: program?.tiers.length || 0,
      rulesCount: program?.rules.length || 0,
      rewardsCount: program?.rewards.length || 0,
    };
  }

  // -------------------------------------------------------------
  // TRANSACTION POINTS CALCULATION & SALES INTEGRATION
  // -------------------------------------------------------------

  async calculatePointsForTransaction(
    transactionId: string,
    organizationId: string,
  ) {
    const transaction = await db.transaction.findFirst({
      where: { id: transactionId, organizationId },
      select: {
        id: true,
        organizationId: true,
        customerId: true,
        finalTotal: true,
        items: {
          select: {
            id: true,
            quantity: true,
            variantId: true,
            subtotal: true,
            variant: {
              select: {
                id: true,
                productId: true,
                loyaltyPointsOverride: true,
                product: {
                  select: {
                    id: true,
                    categoryId: true,
                    loyaltyPointsOverride: true,
                  },
                },
              },
            },
          },
        },
        organization: {
          select: {
            loyaltyPrograms: {
              where: { isActive: true },
              select: {
                id: true,
                rules: {
                  where: { isActive: true },
                  select: {
                    id: true,
                    ruleType: true,
                    variantId: true,
                    productId: true,
                    categoryId: true,
                    pointsValue: true,
                    currencyAmount: true,
                    minOrderValue: true,
                  },
                },
                tiers: {
                  select: {
                    id: true,
                    minPoints: true,
                    multiplier: true,
                  },
                },
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            loyaltyPoints: true,
          },
        },
      },
    });

    if (
      !transaction ||
      !transaction.customer ||
      !transaction.organization.loyaltyPrograms.length
    ) {
      return 0;
    }

    const program = transaction.organization.loyaltyPrograms[0];
    let totalPoints = 0;

    // 1. Process Rule-based points
    for (const item of transaction.items) {
      let itemPoints = 0;

      const variantOverride =
        item.variant.loyaltyPointsOverride ??
        item.variant.product.loyaltyPointsOverride;

      if (variantOverride) {
        itemPoints = variantOverride * item.quantity;
      } else {
        for (const rule of program.rules) {
          if (rule.ruleType === "POINTS_PER_ITEM") {
            if (
              rule.variantId === item.variantId ||
              rule.productId === item.variant.productId ||
              rule.categoryId === item.variant.product.categoryId
            ) {
              itemPoints = Math.max(
                itemPoints,
                rule.pointsValue * item.quantity,
              );
            }
          }
        }
      }
      totalPoints += itemPoints;
    }

    // 2. Process Currency-based points (General rule)
    const currencyRule = program.rules.find(
      r => r.ruleType === "POINTS_PER_CURRENCY",
    );
    if (currencyRule && currencyRule.currencyAmount) {
      const orderTotal = transaction.finalTotal.toNumber();
      if (!currencyRule.minOrderValue || orderTotal >= currencyRule.minOrderValue.toNumber()) {
        const spendPoints =
          Math.floor(
            orderTotal /
              currencyRule.currencyAmount.toNumber(),
          ) * currencyRule.pointsValue;
        totalPoints += spendPoints;
      }
    }

    // 3. Apply Tier Multiplier
    const customerBalance = transaction.customer.loyaltyPoints;
    const applicableTier = program.tiers
      .filter(t => customerBalance >= t.minPoints)
      .sort((a, b) => b.minPoints - a.minPoints)[0];

    if (applicableTier) {
      totalPoints = Math.floor(
        totalPoints * applicableTier.multiplier.toNumber(),
      );
    }

    return totalPoints;
  }

  async awardPoints(
    customerId: string,
    points: number,
    organizationId: string,
    description: string,
    referenceId?: string,
  ) {
    if (points === 0) return;

    const [customerExists, program] = await Promise.all([
      db.customer.findFirst({
        where: { id: customerId, organizationId },
      }),
      db.loyaltyProgram.findFirst({
        where: { organizationId, isActive: true },
      }),
    ]);

    if (!customerExists || !program) return;

    return await this.prisma.client.$transaction(async tx => {
      const customer = await tx.customer.update({
        where: { id: customerId },
        data: {
          loyaltyPoints: {
            increment: points,
          },
        },
      });

      await tx.loyaltyTransaction.create({
        data: {
          programId: program.id,
          customerId,
          organizationId,
          type:
            points > 0
              ? LoyaltyTransactionType.EARNED
              : LoyaltyTransactionType.REDEEMED,
          points,
          balanceAfter: customer.loyaltyPoints,
          description,
          referenceId,
          referenceType: "TRANSACTION",
        },
      });

      emitLoyaltyPointsAwarded(organizationId, {
        customerId,
        points,
        balanceAfter: customer.loyaltyPoints,
        description,
      }).catch(err =>
        console.error("[Loyalty] Failed to emit notification event:", err),
      );

      return customer;
    });
  }

  async redeemPointsForVoucher(
    customerId: string,
    rewardId: string,
    organizationId: string,
  ) {
    const reward = await db.loyaltyReward.findFirst({
      where: { id: rewardId, program: { organizationId } },
      select: {
        id: true,
        name: true,
        pointsRequired: true,
        isActive: true,
        programId: true,
      },
    });

    if (!reward || !reward.isActive)
      throw new Error("Reward not found or inactive");

    const customer = await db.customer.findFirst({
      where: { id: customerId, organizationId },
    });

    if (!customer || customer.loyaltyPoints < reward.pointsRequired) {
      throw new Error("Insufficient points");
    }

    return await this.prisma.client.$transaction(async tx => {
      const updatedCustomer = await tx.customer.update({
        where: { id: customerId },
        data: {
          loyaltyPoints: {
            decrement: reward.pointsRequired,
          },
        },
      });

      if (updatedCustomer.loyaltyPoints < 0) {
        throw new Error("Insufficient points");
      }

      await tx.loyaltyTransaction.create({
        data: {
          programId: reward.programId,
          customerId,
          organizationId,
          type: LoyaltyTransactionType.REDEEMED,
          points: -reward.pointsRequired,
          balanceAfter: updatedCustomer.loyaltyPoints,
          description: `Redeemed for ${reward.name}`,
          referenceId: rewardId,
          referenceType: "REWARD",
        },
      });

      const voucherCode = randomBytes(4).toString("hex").toUpperCase();
      const voucher = await tx.loyaltyVoucher.create({
        data: {
          code: voucherCode,
          programId: reward.programId,
          rewardId: reward.id,
          customerId,
          organizationId,
          status: VoucherStatus.ACTIVE,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      emitLoyaltyVoucherCreated(organizationId, {
        customerId,
        voucherCode: voucher.code,
        rewardName: reward.name,
        expiresAt: voucher.expiresAt.toISOString(),
      }).catch(err =>
        console.error("[Loyalty] Failed to emit notification event:", err),
      );

      return voucher;
    });
  }

  async getCustomerStatus(customerId: string, organizationId: string) {
    const [customer, program] = await Promise.all([
      db.customer.findFirst({
        where: { id: customerId, organizationId },
        select: {
          id: true,
          loyaltyPoints: true,
          email: true,
          name: true,
        },
      }),
      db.loyaltyProgram.findFirst({
        where: { organizationId, isActive: true },
        include: {
          tiers: { orderBy: { minPoints: "asc" } },
          rewards: { where: { isActive: true }, orderBy: { pointsRequired: "asc" } },
        },
      }),
    ]);

    if (!customer) return null;

    let tierName = "Standard";
    let multiplier = 1.0;

    if (program && program.tiers.length > 0) {
      const applicableTier = program.tiers
        .filter(t => customer.loyaltyPoints >= t.minPoints)
        .sort((a, b) => b.minPoints - a.minPoints)[0];

      if (applicableTier) {
        tierName = applicableTier.name;
        multiplier = applicableTier.multiplier.toNumber();
      }
    }

    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      points: customer.loyaltyPoints,
      tier: tierName,
      multiplier,
      availableRewards: program?.rewards || [],
    };
  }

  async validateVoucher(
    code: string,
    customerId: string,
    organizationId: string,
  ) {
    const voucher = await db.loyaltyVoucher.findFirst({
      where: { code, organizationId },
      select: {
        id: true,
        code: true,
        status: true,
        expiresAt: true,
        customerId: true,
        reward: {
          select: {
            name: true,
            rewardType: true,
            discountValue: true,
          },
        },
        program: {
          select: {
            isActive: true,
          },
        },
      },
    });

    if (voucher && voucher.program && !voucher.program.isActive) {
      throw new Error("Loyalty program is currently inactive");
    }

    if (!voucher || voucher.status !== VoucherStatus.ACTIVE) {
      throw new Error("Invalid or expired voucher");
    }

    if (voucher.expiresAt && voucher.expiresAt < new Date()) {
      throw new Error("Voucher has expired");
    }

    if (voucher.customerId !== customerId) {
      throw new Error("Voucher does not belong to this customer");
    }

    return {
      valid: true,
      code: voucher.code,
      reward: voucher.reward?.name ?? "Reward",
      rewardType: voucher.reward?.rewardType,
      discountValue: voucher.reward?.discountValue,
      expiresAt: voucher.expiresAt,
    };
  }

  async handleCustomerSignup(organizationId: string, customerId: string) {
    const program = await db.loyaltyProgram.findFirst({
      where: { organizationId, isActive: true },
      include: {
        rules: {
          where: { ruleType: "FIXED_POINTS", isActive: true },
        },
      },
    });

    if (!program) return;

    const signupRule = program.rules.find(r =>
      r.name.toLowerCase().includes("signup") ||
      r.name.toLowerCase().includes("welcome") ||
      r.description?.toLowerCase().includes("signup"),
    ) || program.rules[0];

    if (signupRule && signupRule.pointsValue > 0) {
      await this.awardPoints(
        customerId,
        signupRule.pointsValue,
        organizationId,
        `Welcome signup bonus: ${signupRule.name}`,
      );
    }
  }
}
