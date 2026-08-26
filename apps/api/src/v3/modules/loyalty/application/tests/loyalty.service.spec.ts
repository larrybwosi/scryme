import { vi } from "vitest";

// 1. Hoist the mocks
const mocked = vi.hoisted(() => {
  const m = {
    transaction: { findUnique: vi.fn(), findFirst: vi.fn() },
    loyaltyProgram: { findFirst: vi.fn() },
    customer: { findUnique: vi.fn(), update: vi.fn(), findFirst: vi.fn() },
    loyaltyTransaction: { create: vi.fn() },
    loyaltyReward: { findUnique: vi.fn(), findFirst: vi.fn() },
    loyaltyVoucher: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), findFirst: vi.fn() },
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

  describe("redeemPointsForVoucher", () => {
    it("should throw error if concurrent deduction drops loyalty points below zero", async () => {
      (mockPrisma.loyaltyReward.findFirst as any).mockResolvedValue({
        id: "reward1",
        name: "Free Coffee",
        pointsRequired: 50,
        isActive: true,
        programId: "prog1",
      });
      (mockPrisma.customer.findFirst as any).mockResolvedValue({
        id: "cust1",
        loyaltyPoints: 50,
      });
      // Simulate concurrent deduction where customer points drop below 0 (-10)
      (mockPrisma.customer.update as any).mockResolvedValue({
        id: "cust1",
        loyaltyPoints: -10,
      });

      await expect(
        service.redeemPointsForVoucher("cust1", "reward1", "org1"),
      ).rejects.toThrow("Insufficient points");
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
        reward: { name: "10% Off" },
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
