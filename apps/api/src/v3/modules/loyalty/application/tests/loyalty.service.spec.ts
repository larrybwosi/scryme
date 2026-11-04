import { vi } from "vitest";

// 1. Hoist the mocks
const mocked = vi.hoisted(() => {
  const m = {
    transaction: { findUnique: vi.fn(), findFirst: vi.fn() },
    loyaltyProgram: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    loyaltyTier: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    loyaltyRule: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    loyaltyReward: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    customer: {
      findUnique: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    loyaltyTransaction: {
      create: vi.fn(),
      findMany: vi.fn(),
      aggregate: vi.fn(),
    },
    loyaltyVoucher: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(m)),
  };
  return { mockPrisma: m };
});

// 2. Mock the dependency
vi.mock("@repo/db", async (importOriginal) => {
  const actual = (await importOriginal()) as any;
  return {
    ...actual,
    db: mocked.mockPrisma,
  };
});

// 3. Regular imports
import { Test, TestingModule } from "@nestjs/testing";
import { LoyaltyService } from "../loyalty.service";
import { PrismaService } from "@/prisma/prisma.service";
import { describe, it, expect, beforeEach } from "vitest";

describe("LoyaltyService", () => {
  let service: LoyaltyService;
  const { mockPrisma } = mocked;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoyaltyService,
        { provide: PrismaService, useValue: { client: mockPrisma } },
      ],
    }).compile();

    service = module.get<LoyaltyService>(LoyaltyService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("Program Configuration", () => {
    it("should get existing loyalty program", async () => {
      (mockPrisma.loyaltyProgram.findFirst as any).mockResolvedValue({
        id: "prog1",
        name: "VIP Club",
        organizationId: "org1",
        tiers: [],
        rules: [],
        rewards: [],
      });

      const res = await service.getProgram("org1");
      expect(res.id).toBe("prog1");
      expect(mockPrisma.loyaltyProgram.findFirst).toHaveBeenCalledWith({
        where: { organizationId: "org1" },
        include: {
          tiers: { orderBy: { minPoints: "asc" } },
          rules: { orderBy: { createdAt: "desc" } },
          rewards: { orderBy: { pointsRequired: "asc" } },
        },
      });
    });

    it("should create default program if none exists", async () => {
      (mockPrisma.loyaltyProgram.findFirst as any).mockResolvedValue(null);
      (mockPrisma.loyaltyProgram.create as any).mockResolvedValue({
        id: "prog_new",
        name: "Default Rewards",
        organizationId: "org1",
        tiers: [],
        rules: [],
        rewards: [],
      });

      const res = await service.getProgram("org1");
      expect(res.id).toBe("prog_new");
      expect(mockPrisma.loyaltyProgram.create).toHaveBeenCalled();
    });

    it("should upsert existing program", async () => {
      (mockPrisma.loyaltyProgram.findFirst as any).mockResolvedValue({
        id: "prog1",
      });
      (mockPrisma.loyaltyProgram.update as any).mockResolvedValue({
        id: "prog1",
        name: "Updated Name",
      });

      const res = await service.upsertProgram("org1", {
        name: "Updated Name",
        pointsLabel: "Stars",
        exchangeRate: 50,
        minRedeemPoints: 20,
      });

      expect(res.name).toBe("Updated Name");
      expect(mockPrisma.loyaltyProgram.update).toHaveBeenCalled();
    });
  });

  describe("Tier Management", () => {
    it("should create a new loyalty tier", async () => {
      (mockPrisma.loyaltyProgram.findFirst as any).mockResolvedValue({
        id: "prog1",
      });
      (mockPrisma.loyaltyTier.create as any).mockResolvedValue({
        id: "tier1",
        name: "Gold",
        minPoints: 500,
      });

      const res = await service.createTier("org1", {
        name: "Gold",
        minPoints: 500,
        multiplier: 1.5,
      });

      expect(res.id).toBe("tier1");
      expect(mockPrisma.loyaltyTier.create).toHaveBeenCalled();
    });

    it("should delete a loyalty tier", async () => {
      (mockPrisma.loyaltyTier.findFirst as any).mockResolvedValue({
        id: "tier1",
      });
      (mockPrisma.loyaltyTier.delete as any).mockResolvedValue({ id: "tier1" });

      const res = await service.deleteTier("tier1", "org1");
      expect(res.success).toBe(true);
      expect(mockPrisma.loyaltyTier.delete).toHaveBeenCalledWith({
        where: { id: "tier1" },
      });
    });
  });

  describe("Customer Audited Manual Adjustments", () => {
    it("should adjust customer points with mandatory reason and member audit", async () => {
      (mockPrisma.customer.findFirst as any).mockResolvedValue({
        id: "cust1",
        organizationId: "org1",
        loyaltyPoints: 100,
      });
      (mockPrisma.loyaltyProgram.findFirst as any).mockResolvedValue({
        id: "prog1",
        organizationId: "org1",
        isActive: true,
      });
      (mockPrisma.customer.update as any).mockResolvedValue({
        id: "cust1",
        loyaltyPoints: 150,
      });
      (mockPrisma.loyaltyTransaction.create as any).mockResolvedValue({
        id: "tx1",
        points: 50,
      });

      const res = await service.adjustPoints(
        "cust1",
        "org1",
        50,
        "Customer loyalty bonus",
        "mem_staff1",
      );

      expect(res.customer.loyaltyPoints).toBe(150);
      expect(mockPrisma.loyaltyTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            points: 50,
            type: "ADJUSTED",
            referenceId: "mem_staff1",
            referenceType: "MANUAL_ADJUSTMENT",
          }),
        }),
      );
    });

    it("should throw error if adjustment causes points to drop below zero", async () => {
      (mockPrisma.customer.findFirst as any).mockResolvedValue({
        id: "cust1",
        organizationId: "org1",
        loyaltyPoints: 20,
      });
      (mockPrisma.loyaltyProgram.findFirst as any).mockResolvedValue({
        id: "prog1",
        isActive: true,
      });

      await expect(
        service.adjustPoints("cust1", "org1", -50, "Manual penalty"),
      ).rejects.toThrow("Adjustment would cause customer points to drop below zero");
    });
  });

  describe("Direct Checkout Redemption", () => {
    it("should redeem points directly for checkout discount", async () => {
      (mockPrisma.customer.findFirst as any).mockResolvedValue({
        id: "cust1",
        organizationId: "org1",
        loyaltyPoints: 200,
      });
      (mockPrisma.loyaltyProgram.findFirst as any).mockResolvedValue({
        id: "prog1",
        organizationId: "org1",
        isActive: true,
        allowDirectRedemption: true,
        minRedeemPoints: 50,
        exchangeRate: { toNumber: () => 10 }, // 10 pts = $1
        maxRedemptionPercentage: { toNumber: () => 50 }, // max 50%
      });
      (mockPrisma.customer.update as any).mockResolvedValue({
        id: "cust1",
        loyaltyPoints: 100,
      });
      (mockPrisma.loyaltyTransaction.create as any).mockResolvedValue({
        id: "tx_redeem",
      });

      const res = await service.directRedeemPoints("org1", {
        customerId: "cust1",
        points: 100,
        orderTotal: 50.0, // order $50, max 50% = $25 discount. 100 pts / 10 = $10 discount. Valid!
      });

      expect(res.success).toBe(true);
      expect(res.pointsRedeemed).toBe(100);
      expect(res.discountAmount).toBe(10);
      expect(res.newBalance).toBe(100);
    });

    it("should reject direct redemption if exceeds max allowed percentage", async () => {
      (mockPrisma.customer.findFirst as any).mockResolvedValue({
        id: "cust1",
        organizationId: "org1",
        loyaltyPoints: 500,
      });
      (mockPrisma.loyaltyProgram.findFirst as any).mockResolvedValue({
        id: "prog1",
        organizationId: "org1",
        isActive: true,
        allowDirectRedemption: true,
        minRedeemPoints: 0,
        exchangeRate: { toNumber: () => 10 },
        maxRedemptionPercentage: { toNumber: () => 20 }, // 20% max
      });

      await expect(
        service.directRedeemPoints("org1", {
          customerId: "cust1",
          points: 300, // $30 discount
          orderTotal: 100, // 20% max = $20
        }),
      ).rejects.toThrow("Redemption exceeds maximum permitted order discount");
    });
  });

  describe("processPointExpirations", () => {
    it("should expire points for customers inactive past expiry cutoff", async () => {
      (mockPrisma.loyaltyProgram.findFirst as any).mockResolvedValue({
        id: "prog1",
        organizationId: "org1",
        isActive: true,
        expiryMonths: 6,
      });

      const pastDate = new Date();
      pastDate.setMonth(pastDate.getMonth() - 8); // 8 months ago

      (mockPrisma.customer.findMany as any).mockResolvedValue([
        {
          id: "cust_inactive",
          loyaltyPoints: 300,
          updatedAt: pastDate,
          loyaltyTransactions: [{ createdAt: pastDate }],
        },
      ]);
      (mockPrisma.customer.update as any).mockResolvedValue({
        id: "cust_inactive",
        loyaltyPoints: 0,
      });
      (mockPrisma.loyaltyTransaction.create as any).mockResolvedValue({
        id: "tx_expired",
      });

      const res = await service.processPointExpirations("org1");
      expect(res.expiredCustomersCount).toBe(1);
      expect(res.totalPointsExpired).toBe(300);
      expect(mockPrisma.customer.update).toHaveBeenCalledWith({
        where: { id: "cust_inactive" },
        data: { loyaltyPoints: 0 },
      });
    });
  });

  describe("calculatePointsForTransaction", () => {
    it("should return 0 if no loyalty program exists", async () => {
      (mockPrisma.transaction.findFirst as any).mockResolvedValue({
        organization: { loyaltyPrograms: [] },
        customer: { id: "cust1" },
      });

      const points = await service.calculatePointsForTransaction("txn1", "org1");
      expect(points).toBe(0);
    });

    it("should calculate points based on currency spend", async () => {
      (mockPrisma.transaction.findFirst as any).mockResolvedValue({
        id: "txn1",
        finalTotal: { toNumber: () => 100 },
        items: [],
        customer: { id: "cust1", loyaltyPoints: 0 },
        organization: {
          loyaltyPrograms: [
            {
              id: "prog1",
              rules: [
                {
                  ruleType: "POINTS_PER_CURRENCY",
                  currencyAmount: { toNumber: () => 1 },
                  pointsValue: 1,
                  isActive: true,
                },
              ],
              tiers: [],
            },
          ],
        },
      });

      const points = await service.calculatePointsForTransaction("txn1", "org1");
      expect(points).toBe(100);
    });
  });

  describe("validateVoucher", () => {
    it("should validate voucher with null expiresAt (non-expiring voucher)", async () => {
      (mockPrisma.loyaltyVoucher.findFirst as any).mockResolvedValue({
        id: "vouch1",
        code: "NOEXPIRATION",
        status: "ACTIVE",
        expiresAt: null,
        customerId: "cust1",
        reward: { name: "10% Off", rewardType: "DISCOUNT_PERCENTAGE", discountValue: 10 },
        program: { isActive: true },
      });

      const res = await service.validateVoucher("NOEXPIRATION", "cust1", "org1");
      expect(res.valid).toBe(true);
      expect(res.code).toBe("NOEXPIRATION");
      expect(res.reward).toBe("10% Off");
      expect(res.expiresAt).toBeNull();
    });
  });
});
