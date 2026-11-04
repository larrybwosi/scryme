import { describe, it, expect, vi, beforeEach } from "vitest";
import { getDashboardData } from "../dashboard";
import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";

vi.mock("@repo/db", () => ({
  db: {
    product: {
      count: vi.fn(),
    },
    transaction: {
      findMany: vi.fn(),
    },
    expense: {
      aggregate: vi.fn(),
    },
    productVariantStock: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@repo/auth/server", () => ({
  getServerAuth: vi.fn(),
}));

describe("getDashboardData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw an error if unauthenticated", async () => {
    vi.mocked(getServerAuth).mockResolvedValue(null as any);
    await expect(getDashboardData("month")).rejects.toThrow("Unauthorized");
  });

  it("should return real values and empty arrays when no transactions or products exist", async () => {
    vi.mocked(getServerAuth).mockResolvedValue({
      organizationId: "org-123",
      user: { id: "user-1", name: "Test User" },
    } as any);

    (db.product.count as any).mockResolvedValue(0);
    (db.transaction.findMany as any).mockResolvedValue([]);
    (db.expense.aggregate as any).mockResolvedValue({ _sum: { amount: null } });
    (db.productVariantStock.findMany as any).mockResolvedValue([]);

    const data = await getDashboardData("month");

    // Must be 0, not mock fallbacks like 1525, 10892, 157342, 12453
    expect(data.stats.totalProducts.value).toBe(0);
    expect(data.stats.totalSales.value).toBe(0);
    expect(data.stats.totalIncome.value).toBe(0);
    expect(data.stats.totalExpenses.value).toBe(0);

    // Empty state arrays, not mock iPhone/MacBook or Electronics categories
    expect(data.popularProducts).toEqual([]);
    expect(data.categoryDistribution).toEqual([]);
    expect(data.recentActivity).toEqual([]);
  });

  it("should correctly compute real stats, popular products, and recurring vs one-time split", async () => {
    vi.mocked(getServerAuth).mockResolvedValue({
      organizationId: "org-123",
      user: { id: "user-1", name: "Test User" },
    } as any);

    (db.product.count as any).mockResolvedValue(5);
    (db.expense.aggregate as any).mockResolvedValue({ _sum: { amount: 350 } });
    (db.productVariantStock.findMany as any).mockResolvedValue([]);

    const mockTransactions = [
      {
        id: "tx-1",
        number: "ORD-001",
        finalTotal: 1000,
        createdAt: new Date(),
        type: "POS_SALE",
        customer: { name: "Alice" },
        items: [
          {
            quantity: 2,
            unitPrice: 500,
            variantId: "v-1",
            productName: "Real Product A",
            variantName: "Standard",
            variant: {
              product: {
                id: "p-1",
                name: "Real Product A",
                imageUrls: [],
                category: { name: "Retail" },
              },
              variantStocks: [{ currentStock: 10 }],
            },
          },
        ],
      },
      {
        id: "tx-2",
        number: "ORD-002",
        finalTotal: 500,
        createdAt: new Date(),
        type: "SUBSCRIPTION",
        customer: { name: "Bob" },
        items: [],
      },
    ];

    (db.transaction.findMany as any).mockImplementation(async (args: any) => {
      if (args.where?.createdAt?.gte && !args.orderBy) {
        return []; // previousRes or heatmapRes
      }
      return mockTransactions as any;
    });

    const data = await getDashboardData("month");

    expect(data.stats.totalProducts.value).toBe(5);
    expect(data.stats.totalSales.value).toBe(2);
    expect(data.stats.totalIncome.value).toBe(1500);
    expect(data.stats.totalExpenses.value).toBe(350);

    expect(data.popularProducts.length).toBe(1);
    expect(data.popularProducts[0].name).toBe("Real Product A");
    expect(data.popularProducts[0].sales).toBe(2);
    expect(data.popularProducts[0].earnings).toBe(1000);

    expect(data.categoryDistribution.length).toBe(1);
    expect(data.categoryDistribution[0].name).toBe("Retail");
    expect(data.categoryDistribution[0].value).toBe(1000);

    expect(data.recentActivity.length).toBe(2);
    expect(data.recentActivity[0].title).toBe("Order #ORD-001");
  });

  it("should calculate averageOrderValue, averageSales, and totalSessions accurately", async () => {
    vi.mocked(getServerAuth).mockResolvedValue({
      organizationId: "org-123",
      user: { id: "user-1", name: "Test User" },
    } as any);

    (db.product.count as any).mockResolvedValue(10);
    (db.expense.aggregate as any).mockResolvedValue({ _sum: { amount: 100 } });
    (db.productVariantStock.findMany as any).mockResolvedValue([]);

    const mockTransactions = [
      {
        id: "tx-1",
        number: "ORD-001",
        finalTotal: 200,
        createdAt: new Date(),
        type: "POS_SALE",
        customer: { name: "Alice" },
        items: [],
      },
      {
        id: "tx-2",
        number: "ORD-002",
        finalTotal: 300,
        createdAt: new Date(),
        type: "POS_SALE",
        customer: { name: "Bob" },
        items: [],
      },
    ];

    (db.transaction.findMany as any).mockImplementation(async (args: any) => {
      if (args.where?.createdAt?.gte && !args.orderBy) {
        return [];
      }
      return mockTransactions as any;
    });

    const data = await getDashboardData("week", "previous_period");

    expect(data.averageOrderValue.value).toBe(250); // (200 + 300) / 2
    expect(data.totalSessions.value).toBe(2);
    expect(data.averageSales.value).toBeGreaterThan(0);
    expect(data.averageOrderValue.chartData.length).toBeGreaterThan(0);
  });
});
