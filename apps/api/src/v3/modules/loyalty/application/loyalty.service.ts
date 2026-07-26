import { Injectable } from "@nestjs/common";
import { randomBytes } from "crypto";
import { PrismaService } from "@/prisma/prisma.service";
import {
  LoyaltyTransactionType,
  VoucherStatus,
  LoyaltyRuleType,
  db,
} from "@repo/db";
import {
  emitLoyaltyPointsAwarded,
  emitLoyaltyVoucherCreated,
} from "@repo/windmill/server";

@Injectable()
export class LoyaltyService {
  constructor(private readonly prisma: PrismaService) {}

  async handleCustomerSignup(organizationId: string, customerId: string) {
    const program = await this.prisma.client.loyaltyProgram.findFirst({
      where: { organizationId, isActive: true },
      include: {
        rules: {
          where: { ruleType: LoyaltyRuleType.FIXED_POINTS, isActive: true },
        },
      },
    });

    if (!program) return;

    const signupRule = program.rules.find(
      r =>
        r.name.toLowerCase().includes("signup") ||
        r.name.toLowerCase().includes("sign up"),
    );
    if (signupRule) {
      await this.awardPoints(
        customerId,
        signupRule.pointsValue,
        organizationId,
        signupRule.description || "Signup bonus",
        "SIGNUP",
      );
    }
  }

  async calculatePointsForTransaction(
    transactionId: string,
    organizationId: string,
  ) {
    const transaction = await db.transaction.findFirst({
      where: { id: transactionId, organizationId },
      // ⚡ Bolt Optimization: Use targeted select to avoid over-fetching large relations
      // and unused fields, reducing database I/O and network payload.
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

      // Check for variant-specific override in our DB (legacy field)
      const variantOverride =
        item.variant.loyaltyPointsOverride ??
        item.variant.product.loyaltyPointsOverride;

      if (variantOverride) {
        itemPoints = variantOverride * item.quantity;
      } else {
        // Apply Program Rules
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
      const spendPoints =
        Math.floor(
          transaction.finalTotal.toNumber() /
            currencyRule.currencyAmount.toNumber(),
        ) * currencyRule.pointsValue;
      totalPoints += spendPoints;
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

    // Validate customer belongs to organization
    const customerExists = await db.customer.findFirst({
      where: { id: customerId, organizationId },
    });

    if (!customerExists) return;

    const program = await db.loyaltyProgram.findFirst({
      where: { organizationId, isActive: true },
    });

    if (!program) return;

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

      // Emit Windmill event
      emitLoyaltyPointsAwarded(organizationId, {
        customerId,
        points,
        balanceAfter: customer.loyaltyPoints,
        description,
      }).catch(err =>
        console.error("[Loyalty] Failed to emit Windmill event:", err),
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
      // ⚡ Bolt Optimization: Select only required fields to avoid fetching full program model
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
      // 1. Deduct points
      const updatedCustomer = await tx.customer.update({
        where: { id: customerId },
        data: {
          loyaltyPoints: {
            decrement: reward.pointsRequired,
          },
        },
      });

      // 2. Record transaction
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

      // 3. Create Voucher using a secure random generator instead of Math.random()
      const voucherCode = randomBytes(4).toString("hex").toUpperCase();
      const voucher = await tx.loyaltyVoucher.create({
        data: {
          code: voucherCode,
          programId: reward.programId,
          rewardId: reward.id,
          customerId,
          organizationId,
          status: VoucherStatus.ACTIVE,
          // Default 1 month expiry if not specified
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      // Emit Windmill event
      emitLoyaltyVoucherCreated(organizationId, {
        customerId,
        voucherCode: voucher.code,
        rewardName: reward.name,
        expiresAt: voucher.expiresAt.toISOString(),
      }).catch(err =>
        console.error("[Loyalty] Failed to emit Windmill event:", err),
      );

      return voucher;
    });
  }

  async getCustomerStatus(customerId: string, organizationId: string) {
    return await db.customer.findFirst({
      where: { id: customerId, organizationId },
      select: {
        id: true,
        loyaltyPoints: true,
        email: true,
        name: true,
      },
    });
  }

  async validateVoucher(
    code: string,
    customerId: string,
    organizationId: string,
  ) {
    const voucher = await db.loyaltyVoucher.findFirst({
      where: { code, organizationId },
      // ⚡ Bolt Optimization: Use targeted select to fetch only required display/validation fields.
      select: {
        id: true,
        code: true,
        status: true,
        expiresAt: true,
        customerId: true,
        reward: {
          select: {
            name: true,
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

    if (voucher.expiresAt < new Date()) {
      throw new Error("Voucher has expired");
    }

    if (voucher.customerId !== customerId) {
      throw new Error("Voucher does not belong to this customer");
    }

    return {
      valid: true,
      code: voucher.code,
      reward: voucher.reward.name,
      expiresAt: voucher.expiresAt,
    };
  }
}
