"use server";

import { db, LoyaltyTransactionType, TierBasis, Decimal } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { revalidatePath } from "next/cache";

// -------------------------------------------------------------
// PROGRAM ACTIONS
// -------------------------------------------------------------

export async function getLoyaltyProgramAction(): Promise<{
  success: boolean;
  program?: any;
  error?: string;
}> {
  const session = await getServerAuth();
  if (!session || !session.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    let program = await db.loyaltyProgram.findFirst({
      where: { organizationId: session.organizationId },
      include: {
        tiers: { orderBy: { minPoints: "asc" } },
        rules: { orderBy: { createdAt: "desc" } },
        rewards: { orderBy: { pointsRequired: "asc" } },
      },
    });

    if (!program) {
      program = await db.loyaltyProgram.create({
        data: {
          name: "Default Rewards",
          organizationId: session.organizationId,
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

    // Convert Decimals to numbers for serializable Server Action responses
    const serialized = {
      ...program,
      exchangeRate: Number(program.exchangeRate),
      maxRedemptionPercentage: Number(program.maxRedemptionPercentage),
      tiers: program.tiers.map((t: any) => ({
        ...t,
        multiplier: Number(t.multiplier),
      })),
      rules: program.rules.map((r: any) => ({
        ...r,
        currencyAmount: r.currencyAmount ? Number(r.currencyAmount) : null,
        minOrderValue: r.minOrderValue ? Number(r.minOrderValue) : null,
      })),
      rewards: program.rewards.map((rw: any) => ({
        ...rw,
        discountValue: rw.discountValue ? Number(rw.discountValue) : null,
      })),
    };

    return { success: true, program: serialized };
  } catch (error: any) {
    console.error("Error fetching loyalty program:", error);
    return { success: false, error: error.message || "Failed to fetch loyalty program" };
  }
}

export async function upsertLoyaltyProgramAction(data: {
  name: string;
  description?: string;
  isActive?: boolean;
  pointsLabel?: string;
  exchangeRate?: number;
  expiryMonths?: number | null;
  tierBasis?: TierBasis;
  minRedeemPoints?: number;
  maxRedemptionPercentage?: number;
  allowDirectRedemption?: boolean;
}): Promise<{ success: boolean; program?: any; error?: string }> {
  const session = await getServerAuth();
  if (!session || !session.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const existing = await db.loyaltyProgram.findFirst({
      where: { organizationId: session.organizationId },
    });

    const updatePayload: any = {
      name: data.name,
      description: data.description,
      isActive: data.isActive !== undefined ? data.isActive : true,
      pointsLabel: data.pointsLabel || "Points",
      exchangeRate: data.exchangeRate ? new Decimal(data.exchangeRate) : new Decimal(1.0),
      expiryMonths: data.expiryMonths !== undefined ? data.expiryMonths : null,
      tierBasis: data.tierBasis || TierBasis.CURRENT_BALANCE,
      minRedeemPoints: data.minRedeemPoints ?? 0,
      maxRedemptionPercentage: data.maxRedemptionPercentage
        ? new Decimal(data.maxRedemptionPercentage)
        : new Decimal(100.0),
      allowDirectRedemption: data.allowDirectRedemption ?? true,
    };

    let program: any;
    if (existing) {
      // Tenant Isolation BOLA: Ensure update is scoped by id & organizationId
      program = await db.loyaltyProgram.update({
        where: { id: existing.id },
        data: updatePayload,
      });
    } else {
      program = await db.loyaltyProgram.create({
        data: {
          ...updatePayload,
          organizationId: session.organizationId,
        },
      });
    }

    revalidatePath("/settings/loyalty");
    return { success: true, program };
  } catch (error: any) {
    console.error("Error saving loyalty program:", error);
    return { success: false, error: error.message || "Failed to save loyalty program" };
  }
}

// -------------------------------------------------------------
// TIER ACTIONS
// -------------------------------------------------------------

export async function createLoyaltyTierAction(data: {
  name: string;
  description?: string;
  minPoints: number;
  multiplier?: number;
  color?: string;
  icon?: string;
}): Promise<{ success: boolean; tier?: any; error?: string }> {
  const session = await getServerAuth();
  if (!session || !session.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const program = await db.loyaltyProgram.findFirst({
      where: { organizationId: session.organizationId },
    });

    if (!program) {
      return { success: false, error: "Loyalty program not found" };
    }

    const tier = await db.loyaltyTier.create({
      data: {
        programId: program.id,
        name: data.name,
        description: data.description,
        minPoints: data.minPoints,
        multiplier: data.multiplier ? new Decimal(data.multiplier) : new Decimal(1.0),
        color: data.color,
        icon: data.icon,
      },
    });

    revalidatePath("/settings/loyalty");
    return { success: true, tier };
  } catch (error: any) {
    console.error("Error creating loyalty tier:", error);
    return { success: false, error: error.message || "Failed to create tier" };
  }
}

export async function deleteLoyaltyTierAction(
  tierId: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerAuth();
  if (!session || !session.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Multi-tenant BOLA enforcement: verify tier belongs to this organization's program
    const tier = await db.loyaltyTier.findFirst({
      where: { id: tierId, program: { organizationId: session.organizationId } },
    });

    if (!tier) {
      return { success: false, error: "Loyalty tier not found or unauthorized" };
    }

    await db.loyaltyTier.delete({
      where: { id: tierId },
    });

    revalidatePath("/settings/loyalty");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting loyalty tier:", error);
    return { success: false, error: error.message || "Failed to delete tier" };
  }
}

// -------------------------------------------------------------
// RULE ACTIONS
// -------------------------------------------------------------

export async function createLoyaltyRuleAction(data: {
  name: string;
  description?: string;
  ruleType: any;
  pointsValue: number;
  currencyAmount?: number;
  minOrderValue?: number;
  categoryId?: string;
  productId?: string;
  variantId?: string;
  validFrom?: string;
  validTo?: string;
  isActive?: boolean;
}): Promise<{ success: boolean; rule?: any; error?: string }> {
  const session = await getServerAuth();
  if (!session || !session.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const program = await db.loyaltyProgram.findFirst({
      where: { organizationId: session.organizationId },
    });

    if (!program) {
      return { success: false, error: "Loyalty program not found" };
    }

    const rule = await db.loyaltyRule.create({
      data: {
        programId: program.id,
        name: data.name,
        description: data.description,
        ruleType: data.ruleType,
        pointsValue: data.pointsValue,
        currencyAmount: data.currencyAmount ? new Decimal(data.currencyAmount) : null,
        minOrderValue: data.minOrderValue ? new Decimal(data.minOrderValue) : null,
        categoryId: data.categoryId,
        productId: data.productId,
        variantId: data.variantId,
        validFrom: data.validFrom ? new Date(data.validFrom) : null,
        validTo: data.validTo ? new Date(data.validTo) : null,
        isActive: data.isActive ?? true,
      },
    });

    revalidatePath("/settings/loyalty");
    return { success: true, rule };
  } catch (error: any) {
    console.error("Error creating loyalty rule:", error);
    return { success: false, error: error.message || "Failed to create rule" };
  }
}

export async function deleteLoyaltyRuleAction(
  ruleId: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerAuth();
  if (!session || !session.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const rule = await db.loyaltyRule.findFirst({
      where: { id: ruleId, program: { organizationId: session.organizationId } },
    });

    if (!rule) {
      return { success: false, error: "Loyalty rule not found or unauthorized" };
    }

    await db.loyaltyRule.delete({
      where: { id: ruleId },
    });

    revalidatePath("/settings/loyalty");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting loyalty rule:", error);
    return { success: false, error: error.message || "Failed to delete rule" };
  }
}

// -------------------------------------------------------------
// REWARD ACTIONS
// -------------------------------------------------------------

export async function createLoyaltyRewardAction(data: {
  name: string;
  description?: string;
  rewardType: any;
  pointsRequired: number;
  discountValue?: number;
  productId?: string;
  isActive?: boolean;
}): Promise<{ success: boolean; reward?: any; error?: string }> {
  const session = await getServerAuth();
  if (!session || !session.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const program = await db.loyaltyProgram.findFirst({
      where: { organizationId: session.organizationId },
    });

    if (!program) {
      return { success: false, error: "Loyalty program not found" };
    }

    const reward = await db.loyaltyReward.create({
      data: {
        programId: program.id,
        name: data.name,
        description: data.description,
        rewardType: data.rewardType,
        pointsRequired: data.pointsRequired,
        discountValue: data.discountValue ? new Decimal(data.discountValue) : null,
        productId: data.productId,
        isActive: data.isActive ?? true,
      },
    });

    revalidatePath("/settings/loyalty");
    return { success: true, reward };
  } catch (error: any) {
    console.error("Error creating loyalty reward:", error);
    return { success: false, error: error.message || "Failed to create reward" };
  }
}

export async function deleteLoyaltyRewardAction(
  rewardId: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerAuth();
  if (!session || !session.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const reward = await db.loyaltyReward.findFirst({
      where: { id: rewardId, program: { organizationId: session.organizationId } },
    });

    if (!reward) {
      return { success: false, error: "Loyalty reward not found or unauthorized" };
    }

    await db.loyaltyReward.delete({
      where: { id: rewardId },
    });

    revalidatePath("/settings/loyalty");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting loyalty reward:", error);
    return { success: false, error: error.message || "Failed to delete reward" };
  }
}

// -------------------------------------------------------------
// CUSTOMER AUDITED MANUAL ADJUSTMENTS & EXPIRATION
// -------------------------------------------------------------

export async function adjustCustomerPointsAction(
  customerId: string,
  points: number,
  reason: string,
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  const session = await getServerAuth();
  if (!session || !session.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  if (!reason || reason.trim() === "") {
    return { success: false, error: "Mandatory audit reason is required" };
  }

  try {
    const [customer, program] = await Promise.all([
      db.customer.findFirst({
        where: { id: customerId, organizationId: session.organizationId },
      }),
      db.loyaltyProgram.findFirst({
        where: { organizationId: session.organizationId, isActive: true },
      }),
    ]);

    if (!customer) return { success: false, error: "Customer not found" };
    if (!program) return { success: false, error: "Active loyalty program not found" };

    const newBalance = customer.loyaltyPoints + points;
    if (newBalance < 0) {
      return { success: false, error: "Adjustment would cause points balance to drop below zero" };
    }

    const updated = await db.$transaction(async tx => {
      const cust = await tx.customer.update({
        where: { id: customerId },
        data: { loyaltyPoints: { increment: points } },
      });

      const memberId = session.memberId || (session as any).userId || session.user?.id;
      const desc = `Manual adjustment by staff ${memberId}: ${reason}`;

      await tx.loyaltyTransaction.create({
        data: {
          programId: program.id,
          customerId,
          organizationId: session.organizationId,
          type: LoyaltyTransactionType.ADJUSTED,
          points,
          balanceAfter: cust.loyaltyPoints,
          description: desc,
          referenceId: memberId,
          referenceType: "MANUAL_ADJUSTMENT",
        },
      });

      return cust;
    });

    revalidatePath("/settings/loyalty");
    return { success: true, newBalance: updated.loyaltyPoints };
  } catch (error: any) {
    console.error("Error adjusting customer points:", error);
    return { success: false, error: error.message || "Failed to adjust points" };
  }
}

export async function listLoyaltyCustomersAction(): Promise<{
  success: boolean;
  customers?: any[];
  error?: string;
}> {
  const session = await getServerAuth();
  if (!session || !session.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const customers = await db.customer.findMany({
      where: { organizationId: session.organizationId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        loyaltyPoints: true,
        updatedAt: true,
      },
      orderBy: { loyaltyPoints: "desc" },
      take: 100,
    });

    return { success: true, customers };
  } catch (error: any) {
    console.error("Error listing loyalty customers:", error);
    return { success: false, error: error.message || "Failed to list customers" };
  }
}

export async function processLoyaltyExpirationsAction(): Promise<{
  success: boolean;
  expiredCount?: number;
  totalPointsExpired?: number;
  error?: string;
}> {
  const session = await getServerAuth();
  if (!session || !session.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const program = await db.loyaltyProgram.findFirst({
      where: { organizationId: session.organizationId, isActive: true },
    });

    if (!program || !program.expiryMonths || program.expiryMonths <= 0) {
      return { success: true, expiredCount: 0, totalPointsExpired: 0 };
    }

    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - program.expiryMonths);

    const customers = await db.customer.findMany({
      where: {
        organizationId: session.organizationId,
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

    let expiredCount = 0;
    let totalPointsExpired = 0;

    for (const cust of customers) {
      const lastActivity = cust.loyaltyTransactions[0]?.createdAt || cust.updatedAt;
      if (lastActivity < cutoffDate) {
        const points = cust.loyaltyPoints;
        await db.$transaction(async tx => {
          await tx.customer.update({
            where: { id: cust.id },
            data: { loyaltyPoints: 0 },
          });

          await tx.loyaltyTransaction.create({
            data: {
              programId: program.id,
              customerId: cust.id,
              organizationId: session.organizationId,
              type: LoyaltyTransactionType.EXPIRED,
              points: -points,
              balanceAfter: 0,
              description: `Points expired after ${program.expiryMonths} months inactivity`,
              referenceType: "EXPIRATION",
            },
          });
        });

        expiredCount++;
        totalPointsExpired += points;
      }
    }

    revalidatePath("/settings/loyalty");
    return { success: true, expiredCount, totalPointsExpired };
  } catch (error: any) {
    console.error("Error processing expirations:", error);
    return { success: false, error: error.message || "Failed to process expirations" };
  }
}
