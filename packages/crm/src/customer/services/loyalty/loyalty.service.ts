import 'server-only';
import { db } from '@repo/db';
import { Prisma } from '@repo/db';
import { Decimal } from 'decimal.js';
import { OpenLoyaltyClient } from '@repo/shared/server';

export type LoyaltyActionType =
  | 'EARNED'
  | 'REDEEMED'
  | 'EXPIRED'
  | 'ADJUSTED'
  | 'REFUND_VOID'
  | 'EARNED_PURCHASE'
  | 'SPENT_REWARD'
  | 'MANUAL_ADJUSTMENT'
  | 'REFUND_DEDUCTION';

export class LoyaltyService {
  /**
   * Calculates points earned for a transaction based on loyalty rules and customer tier.
   */
  static async calculatePoints(
    organizationId: string,
    customerId: string,
    transactionItems: { variantId: string; productId: string; categoryId?: string; quantity: number; subtotal: number }[],
    totalAmount: number,
    tx?: Prisma.TransactionClient
  ): Promise<number> {
    const client = tx || db;

    const program = await client.loyaltyProgram.findFirst({
      where: { organizationId, isActive: true },
      include: {
        rules: { where: { isActive: true } },
        tiers: { orderBy: { minPoints: 'desc' } },
      },
    });

    if (!program) return 0;

    const customer = await client.customer.findUnique({
      where: { id: customerId },
      select: { loyaltyPoints: true, loyaltyTransactions: { select: { points: true, type: true } } },
    });

    if (!customer) return 0;

    // Determine current tier multiplier
    let multiplier = new Decimal(1.0);

    let pointsForTier = customer.loyaltyPoints;
    if (program.tierBasis === 'LIFETIME_POINTS') {
      pointsForTier = (customer.loyaltyTransactions as any[])
        .filter((t: any) => t.type === 'EARNED')
        .reduce((sum: number, t: any) => sum + t.points, 0);
    }

    const currentTier = program.tiers.find((t: any) => pointsForTier >= t.minPoints);
    if (currentTier) {
      multiplier = new Decimal(currentTier.multiplier.toString());
    }

    let totalPoints = 0;

    // Evaluate rules for each item
    for (const item of transactionItems) {
      let itemBestPoints = 0;

      for (const rule of program.rules) {
        let rulePoints = 0;

        // Check scope
        if (rule.variantId && rule.variantId !== item.variantId) continue;
        if (rule.productId && rule.productId !== item.productId) continue;
        if (rule.categoryId && rule.categoryId !== item.categoryId) continue;

        // Check conditions
        if (rule.minOrderValue && new Decimal(totalAmount).lt(rule.minOrderValue.toString())) continue;
        if (rule.validFrom && rule.validFrom > new Date()) continue;
        if (rule.validTo && rule.validTo < new Date()) continue;

        if (rule.ruleType === 'POINTS_PER_ITEM') {
          rulePoints = rule.pointsValue * item.quantity;
        } else if (rule.ruleType === 'POINTS_PER_CURRENCY') {
          if (rule.currencyAmount && !new Decimal(rule.currencyAmount.toString()).isZero()) {
            rulePoints = Math.floor(
              new Decimal(item.subtotal)
                .div(rule.currencyAmount.toString())
                .mul(rule.pointsValue)
                .toNumber()
            );
          }
        } else if (rule.ruleType === 'FIXED_POINTS') {
           rulePoints = rule.pointsValue;
        }

        if (rulePoints > itemBestPoints) {
          itemBestPoints = rulePoints;
        }
      }
      totalPoints += itemBestPoints;
    }

    let transactionBestPoints = 0;
    for (const rule of program.rules) {
        if (!rule.variantId && !rule.productId && !rule.categoryId) {
            let rulePoints = 0;
            if (rule.ruleType === 'POINTS_PER_CURRENCY') {
                if (rule.currencyAmount && !new Decimal(rule.currencyAmount.toString()).isZero()) {
                    rulePoints = Math.floor(
                      new Decimal(totalAmount)
                        .div(rule.currencyAmount.toString())
                        .mul(rule.pointsValue)
                        .toNumber()
                    );
                }
            } else if (rule.ruleType === 'FIXED_POINTS') {
                rulePoints = rule.pointsValue;
            }

            if (rulePoints > transactionBestPoints) {
                transactionBestPoints = rulePoints;
            }
        }
    }

    const finalPoints = Math.max(totalPoints, transactionBestPoints);

    // Apply tier multiplier
    return Math.floor(new Decimal(finalPoints).mul(multiplier).toNumber());
  }

  /**
   * Accrues points for a customer and records the transaction.
   */
  static async accruePoints(
    tx: Prisma.TransactionClient,
    organizationId: string,
    customerId: string,
    points: number,
    referenceId: string,
    description: string
  ) {
    if (points <= 0) return;

    const program = await tx.loyaltyProgram.findFirst({
      where: { organizationId, isActive: true },
    });

    if (!program) return;

    const customer = await tx.customer.update({
      where: { id: customerId },
      data: { loyaltyPoints: { increment: points } },
    });

    await tx.loyaltyTransaction.create({
      data: {
        programId: program.id,
        customerId,
        organizationId,
        type: 'EARNED',
        points,
        balanceAfter: customer.loyaltyPoints,
        referenceId,
        referenceType: 'TRANSACTION',
        description,
      },
    });
  }

  /**
   * Redeems points for a customer.
   */
  static async redeemPoints(
    tx: Prisma.TransactionClient,
    organizationId: string,
    customerId: string,
    points: number,
    referenceId: string,
    description: string
  ) {
    if (points <= 0) return;

    const program = await tx.loyaltyProgram.findFirst({
      where: { organizationId, isActive: true },
    });

    if (!program) throw new Error('Active loyalty program not found.');

    const customer = await tx.customer.findUnique({
      where: { id: customerId },
      select: { loyaltyPoints: true },
    });

    if (!customer || customer.loyaltyPoints < points) {
      throw new Error('Insufficient loyalty points.');
    }

    const updatedCustomer = await tx.customer.update({
      where: { id: customerId },
      data: { loyaltyPoints: { decrement: points } },
    });

    await tx.loyaltyTransaction.create({
      data: {
        programId: program.id,
        customerId,
        organizationId,
        type: 'REDEEMED',
        points: -points,
        balanceAfter: updatedCustomer.loyaltyPoints,
        referenceId,
        referenceType: 'TRANSACTION',
        description,
      },
    });
  }

  /**
   * Validates a voucher code for a customer.
   */
  static async validateVoucher(
    organizationId: string,
    customerId: string,
    code: string,
    tx?: Prisma.TransactionClient
  ) {
    const client = tx || db;
    const voucher = await client.loyaltyVoucher.findFirst({
      where: {
        code,
        organizationId,
        customerId,
        status: 'ACTIVE',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: {
        reward: true,
      },
    });

    if (!voucher) {
      throw new Error('Invalid or expired voucher.');
    }

    return voucher;
  }

  /**
   * Redeems a voucher and links it to a transaction.
   */
  static async redeemVoucher(
    tx: Prisma.TransactionClient,
    voucherId: string,
    transactionId: string
  ) {
    await tx.loyaltyVoucher.update({
      where: { id: voucherId },
      data: {
        status: 'REDEEMED',
        redeemedAt: new Date(),
        transactionId,
      },
    });
  }

  /**
   * Processes referral rewards when a purchase is made.
   */
  static async processReferral(
    tx: Prisma.TransactionClient,
    organizationId: string,
    refereeCustomerId: string,
    transactionId: string,
    event: 'SIGNUP' | 'FIRST_PURCHASE'
  ) {
    const customer = await tx.customer.findUnique({
      where: { id: refereeCustomerId },
    });

    if (!customer || !customer.email) return;

    const user = await tx.user.findFirst({
      where: { email: customer.email },
    });

    if (!user) return;

    const referral = await tx.referral.findFirst({
      where: {
        refereeId: user.id,
        organizationId,
        status: 'pending_verification',
        rewardApplied: false,
        program: {
          trigger: event
        }
      },
      include: { program: true },
    });

    if (!referral) return;

    await tx.referral.update({
      where: { id: referral.id },
      data: {
        firstPurchaseMade: event === 'FIRST_PURCHASE',
        status: 'completed',
        rewardApplied: true,
      },
    });

    if (referral.program.referrerReward > 0) {
      const referrerUser = await tx.user.findUnique({ where: { id: referral.referrerId } });
      if (referrerUser && referrerUser.email) {
        const referrerCustomer = await tx.customer.findFirst({
          where: { organizationId, email: referrerUser.email },
        });

        if (referrerCustomer) {
          await this.accruePoints(
            tx,
            organizationId,
            referrerCustomer.id,
            referral.program.referrerReward,
            referral.id,
            `Referral reward for referring ${customer.name}`
          );
        }
      }
    }

    if (referral.program.refereeReward > 0) {
      await this.accruePoints(
        tx,
        organizationId,
        refereeCustomerId,
        referral.program.refereeReward,
        referral.id,
        `Referral bonus from program ${referral.program.name}`
      );
    }
  }

  // PORTED FROM LoyaltyEngine (Open Loyalty Integration)

  /**
   * Submits a purchase transaction to Open Loyalty.
   */
  static async submitPurchaseToExternal(
    customerId: string,
    transactionId: string,
    totalAmountMicros: number,
    items: { sku: string; name: string; quantity: number; price: number }[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!customerId || items.length === 0) {
        return { success: false, error: 'Invalid transaction payload.' };
      }

      const grossValue = totalAmountMicros / 1_000_000;

      await OpenLoyaltyClient.submitTransaction(customerId, transactionId, grossValue, items);

      return { success: true };
    } catch (error) {
      console.error('[LoyaltyService] Failed to submit purchase to Open Loyalty:', error);
      return { success: false, error: 'Failed to sync transaction with loyalty engine.' };
    }
  }

  /**
   * Delegates manual point adjustments, compensations, or deductions to Open Loyalty.
   */
  static async adjustPointsExternal(
    customerId: string,
    pointsDelta: number,
    actionType: LoyaltyActionType,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (pointsDelta === 0) return { success: true };

    try {
      const reason = notes ? `${actionType} - ${notes}` : actionType;

      if (pointsDelta > 0) {
        await OpenLoyaltyClient.addPoints(customerId, pointsDelta, reason);
      } else {
        await OpenLoyaltyClient.deductPoints(customerId, Math.abs(pointsDelta), reason);
      }

      return { success: true };
    } catch (error) {
      console.error('[LoyaltyService] Failed to apply points via Open Loyalty:', error);
      return { success: false, error: 'Failed to push point adjustment to Loyalty Engine.' };
    }
  }

  /**
   * Fetches the customer's point history from Open Loyalty.
   */
  static async getExternalTransactions(customerId: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const transactions = await OpenLoyaltyClient.getCustomerTransactions(customerId);
      return { success: true, data: transactions };
    } catch (error) {
      console.error('[LoyaltyService] Failed to fetch customer transactions:', error);
      return { success: false, error: 'Failed to retrieve transaction history.' };
    }
  }
}
