import { Test, TestingModule } from "@nestjs/testing";
import { LoyaltyService } from "../loyalty.service";
import { PrismaService } from "@/prisma/prisma.service";
import { vi, describe, it, expect, beforeEach } from "vitest";

// Use vi.hoisted for variables needed in vi.mock
const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    transaction: {
      findUnique: vi.fn(),
    },
    loyaltyProgram: {
      findFirst: vi.fn(),
    },
    customer: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    loyaltyTransaction: {
      create: vi.fn(),
    },
    loyaltyReward: {
      findUnique: vi.fn(),
    },
    loyaltyVoucher: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(mockPrisma)),
  },
}));

// Mock @repo/db before imports that use it
vi.mock("@repo/db", async (importOriginal) => {
  const actual = (await importOriginal()) as any;
  return {
    ...actual,
    db: mockPrisma,
  };
});

describe("LoyaltyService", () => {
  let service: LoyaltyService;

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
