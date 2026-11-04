import { describe, it, expect, vi, beforeEach } from "vitest";

const mockedDb = vi.hoisted(() => {
  return {
    loyaltyProgram: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    loyaltyTier: {
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    loyaltyRule: {
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    loyaltyReward: {
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    customer: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    loyaltyTransaction: {
      create: vi.fn(),
    },
    $transaction: vi.fn(async (cb: any) => cb(mockedDb)),
  };
});

vi.mock("@repo/db", async (importOriginal) => {
  const actual = (await importOriginal()) as any;
  return {
    ...actual,
    db: mockedDb,
  };
});

vi.mock("@repo/auth/server", () => ({
  getServerAuth: vi.fn().mockResolvedValue({
    organizationId: "org-123",
    userId: "user-123",
    memberId: "mem-123",
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import {
  getLoyaltyProgramAction,
  upsertLoyaltyProgramAction,
  createLoyaltyTierAction,
  deleteLoyaltyTierAction,
  adjustCustomerPointsAction,
  processLoyaltyExpirationsAction,
} from "../loyalty";

describe("Loyalty Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getLoyaltyProgramAction", () => {
    it("should return existing loyalty program and serialize decimals", async () => {
      mockedDb.loyaltyProgram.findFirst.mockResolvedValue({
        id: "prog-1",
        name: "VIP Club",
        organizationId: "org-123",
        exchangeRate: { toString: () => "10.0" },
        maxRedemptionPercentage: { toString: () => "50.0" },
        tiers: [{ id: "t-1", minPoints: 100, multiplier: { toString: () => "1.25" } }],
        rules: [],
        rewards: [],
      });

      const res = await getLoyaltyProgramAction();
      expect(res.success).toBe(true);
      expect(res.program?.exchangeRate).toBe(10);
      expect(res.program?.maxRedemptionPercentage).toBe(50);
      expect(res.program?.tiers[0].multiplier).toBe(1.25);
    });

    it("should create default program if none found", async () => {
      mockedDb.loyaltyProgram.findFirst.mockResolvedValue(null);
      mockedDb.loyaltyProgram.create.mockResolvedValue({
        id: "prog-default",
        name: "Default Rewards",
        organizationId: "org-123",
        exchangeRate: { toString: () => "1.0" },
        maxRedemptionPercentage: { toString: () => "100.0" },
        tiers: [],
        rules: [],
        rewards: [],
      });

      const res = await getLoyaltyProgramAction();
      expect(res.success).toBe(true);
      expect(res.program?.name).toBe("Default Rewards");
      expect(mockedDb.loyaltyProgram.create).toHaveBeenCalled();
    });
  });

  describe("upsertLoyaltyProgramAction", () => {
    it("should update program with tenant scoping", async () => {
      mockedDb.loyaltyProgram.findFirst.mockResolvedValue({
        id: "prog-1",
        organizationId: "org-123",
      });
      mockedDb.loyaltyProgram.update.mockResolvedValue({
        id: "prog-1",
        name: "Elite Program",
      });

      const res = await upsertLoyaltyProgramAction({
        name: "Elite Program",
        minRedeemPoints: 50,
      });

      expect(res.success).toBe(true);
      expect(mockedDb.loyaltyProgram.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "prog-1" },
        }),
      );
    });
  });

  describe("deleteLoyaltyTierAction", () => {
    it("should enforce tenant BOLA and prevent cross-tenant tier deletion", async () => {
      mockedDb.loyaltyTier.findFirst.mockResolvedValue(null);

      const res = await deleteLoyaltyTierAction("foreign-tier-id");
      expect(res.success).toBe(false);
      expect(res.error).toContain("unauthorized");
      expect(mockedDb.loyaltyTier.delete).not.toHaveBeenCalled();
    });

    it("should delete tier when owned by organization", async () => {
      mockedDb.loyaltyTier.findFirst.mockResolvedValue({
        id: "t-1",
      });
      mockedDb.loyaltyTier.delete.mockResolvedValue({ id: "t-1" });

      const res = await deleteLoyaltyTierAction("t-1");
      expect(res.success).toBe(true);
      expect(mockedDb.loyaltyTier.delete).toHaveBeenCalledWith({
        where: { id: "t-1" },
      });
    });
  });

  describe("adjustCustomerPointsAction", () => {
    it("should adjust customer points and record audited transaction", async () => {
      mockedDb.customer.findFirst.mockResolvedValue({
        id: "cust-1",
        organizationId: "org-123",
        loyaltyPoints: 100,
      });
      mockedDb.loyaltyProgram.findFirst.mockResolvedValue({
        id: "prog-1",
        organizationId: "org-123",
        isActive: true,
      });
      mockedDb.customer.update.mockResolvedValue({
        id: "cust-1",
        loyaltyPoints: 150,
      });

      const res = await adjustCustomerPointsAction(
        "cust-1",
        50,
        "Customer appreciation promotion",
      );

      expect(res.success).toBe(true);
      expect(res.newBalance).toBe(150);
      expect(mockedDb.loyaltyTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            points: 50,
            type: "ADJUSTED",
            referenceId: "mem-123",
            referenceType: "MANUAL_ADJUSTMENT",
          }),
        }),
      );
    });

    it("should reject adjustments lacking mandatory reason", async () => {
      const res = await adjustCustomerPointsAction("cust-1", 50, "");
      expect(res.success).toBe(false);
      expect(res.error).toContain("Mandatory audit reason");
    });
  });

  describe("processLoyaltyExpirationsAction", () => {
    it("should expire inactive points and record EXPIRED transactions", async () => {
      mockedDb.loyaltyProgram.findFirst.mockResolvedValue({
        id: "prog-1",
        organizationId: "org-123",
        isActive: true,
        expiryMonths: 6,
      });

      const pastDate = new Date();
      pastDate.setMonth(pastDate.getMonth() - 8);

      mockedDb.customer.findMany.mockResolvedValue([
        {
          id: "cust-inactive",
          loyaltyPoints: 200,
          updatedAt: pastDate,
          loyaltyTransactions: [{ createdAt: pastDate }],
        },
      ]);
      mockedDb.customer.update.mockResolvedValue({
        id: "cust-inactive",
        loyaltyPoints: 0,
      });

      const res = await processLoyaltyExpirationsAction();
      expect(res.success).toBe(true);
      expect(res.expiredCount).toBe(1);
      expect(res.totalPointsExpired).toBe(200);
      expect(mockedDb.loyaltyTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: "EXPIRED",
            points: -200,
          }),
        }),
      );
    });
  });
});
