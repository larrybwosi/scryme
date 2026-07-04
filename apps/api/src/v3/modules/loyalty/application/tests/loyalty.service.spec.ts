import { vi } from "vitest";

// 1. Hoist the mocks
const mocked = vi.hoisted(() => {
  const m = {
    transaction: { findUnique: vi.fn() },
    loyaltyProgram: { findFirst: vi.fn() },
    customer: { findUnique: vi.fn(), update: vi.fn() },
    loyaltyTransaction: { create: vi.fn() },
    loyaltyReward: { findUnique: vi.fn() },
    loyaltyVoucher: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
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
      (mockPrisma.transaction.findUnique as any).mockResolvedValue({
        organization: { loyaltyPrograms: [] },
        customer: { id: "cust1" },
      });

      const points = await service.calculatePointsForTransaction("txn1");
      expect(points).toBe(0);
    });

    it("should calculate points based on currency spend", async () => {
      (mockPrisma.transaction.findUnique as any).mockResolvedValue({
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

      const points = await service.calculatePointsForTransaction("txn1");
      expect(points).toBe(100);
    });
  });
});
