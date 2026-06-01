import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { db, LoyaltyTransactionType, VoucherStatus } from '@repo/db';
import { emitLoyaltyPointsAwarded, emitLoyaltyVoucherCreated } from '@repo/windmill/server';

@Injectable()
export class LoyaltyService {
  constructor() {}

  async calculatePointsForTransaction(transactionId: string) {
    const transaction = await db.transaction.findUnique({
      where: { id: transactionId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
        organization: {
          include: {
            loyaltyPrograms: {
              where: { isActive: true },
              include: {
                rules: { where: { isActive: true } },
                tiers: true,
              },
            },
          },
        },
        customer: true,
      },
    });

    if (!transaction || !transaction.customer || !transaction.organization.loyaltyPrograms.length) {
      return 0;
    }

    const program = transaction.organization.loyaltyPrograms[0];
    let totalPoints = 0;

    // 1. Process Rule-based points
    for (const item of transaction.items) {
      let itemPoints = 0;

      // Check for variant-specific override in our DB (legacy field)
      const variantOverride = item.variant.loyaltyPointsOverride ?? item.variant.product.loyaltyPointsOverride;

      if (variantOverride) {
        itemPoints = variantOverride * item.quantity;
      } else {
        // Apply Program Rules
        for (const rule of program.rules) {
          if (rule.ruleType === 'POINTS_PER_ITEM') {
            if (
              rule.variantId === item.variantId ||
              rule.productId === item.variant.productId ||
              rule.categoryId === item.variant.product.categoryId
            ) {
              itemPoints = Math.max(itemPoints, rule.pointsValue * item.quantity);
            }
          }
        }
      }
      totalPoints += itemPoints;
    }

    // 2. Process Currency-based points (General rule)
    const currencyRule = program.rules.find(r => r.ruleType === 'POINTS_PER_CURRENCY');
    if (currencyRule && currencyRule.currencyAmount) {
      const spendPoints =
        Math.floor(transaction.finalTotal.toNumber() / currencyRule.currencyAmount.toNumber()) *
        currencyRule.pointsValue;
      totalPoints += spendPoints;
    }

    // 3. Apply Tier Multiplier
    const customerBalance = transaction.customer.loyaltyPoints;
    const applicableTier = program.tiers
      .filter(t => customerBalance >= t.minPoints)
      .sort((a, b) => b.minPoints - a.minPoints)[0];

    if (applicableTier) {
      totalPoints = Math.floor(totalPoints * applicableTier.multiplier.toNumber());
    }

    return totalPoints;
  }

  async awardPoints(
    customerId: string,
    points: number,
    organizationId: string,
    description: string,
    referenceId?: string
  ) {
    if (points === 0) return;

    const program = await db.loyaltyProgram.findFirst({
      where: { organizationId, isActive: true },
    });

    if (!program) return;

    return await db.$transaction(async tx => {
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
          type: points > 0 ? LoyaltyTransactionType.EARNED : LoyaltyTransactionType.REDEEMED,
          points,
          balanceAfter: customer.loyaltyPoints,
          description,
          referenceId,
          referenceType: 'TRANSACTION',
        },
      });

      // Emit Windmill event
      emitLoyaltyPointsAwarded(organizationId, {
        customerId,
        points,
        balanceAfter: customer.loyaltyPoints,
        description,
      }).catch(err => console.error('[Loyalty] Failed to emit Windmill event:', err));

      return customer;
    });
  }

  async redeemPointsForVoucher(customerId: string, rewardId: string, organizationId: string) {
    const reward = await db.loyaltyReward.findUnique({
      where: { id: rewardId },
      include: { program: true },
    });

    if (!reward || !reward.isActive) throw new Error('Reward not found or inactive');

    const customer = await db.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer || customer.loyaltyPoints < reward.pointsRequired) {
      throw new Error('Insufficient points');
    }

    return await db.$transaction(async tx => {
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
          referenceType: 'REWARD',
        },
      });

      // 3. Create Voucher
      const voucherCode = Math.random().toString(36).substring(2, 10).toUpperCase();
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
      }).catch(err => console.error('[Loyalty] Failed to emit Windmill event:', err));

      return voucher;
    });
  }

  async getCustomerStatus(customerId: string, organizationId: string) {
    return await db.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        loyaltyPoints: true,
        email: true,
        name: true,
      },
    });
  }

  async validateVoucher(code: string, customerId: string, organizationId: string) {
    const voucher = await db.loyaltyVoucher.findUnique({
      where: { code },
      include: {
        reward: true,
        program: true,
      },
    });

    if (!voucher || voucher.status !== VoucherStatus.ACTIVE) {
      throw new Error('Invalid or expired voucher');
    }

    if (voucher.expiresAt < new Date()) {
      throw new Error('Voucher has expired');
    }

    if (voucher.customerId !== customerId) {
      throw new Error('Voucher does not belong to this customer');
    }

    return {
      valid: true,
      code: voucher.code,
      reward: voucher.reward.name,
      expiresAt: voucher.expiresAt,
    };
  }
}
