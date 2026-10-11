import { describe, it, expect, beforeEach, vi } from "vitest";
import { SalesService } from "../application/services/sales.service";

describe("SalesService", () => {
  let service: SalesService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      client: {
        member: {
          findFirst: vi.fn(),
        },
        transaction: {
          aggregate: vi.fn().mockResolvedValue({
            _sum: { finalTotal: 150841.93 },
          }),
          count: vi.fn(),
          findMany: vi.fn(),
        },
        customer: {
          count: vi.fn().mockResolvedValue(24139),
        },
        productVariant: {
          count: vi.fn().mockResolvedValue(53401),
        },
        pettyCashTransaction: {
          aggregate: vi.fn().mockResolvedValue({
            _sum: { amount: 12318.0 },
          }),
        },
      },
    };

    service = new SalesService(mockPrisma as any);
  });

  it("should calculate sales analytics", async () => {
    mockPrisma.client.transaction.findMany.mockResolvedValue([
      {
        id: "txn_1",
        number: "TXN_10005",
        status: "COMPLETED",
        createdAt: new Date("2024-09-22T10:00:00Z"),
        items: [{ productName: "EchoVibe Earbuds" }],
      },
    ]);

    const analytics = await service.getAnalytics("org_1");

    expect(analytics.userName).toBe("Admin");
    expect(analytics.totalBalance).toBe("150841.93");
    expect(analytics.metrics).toHaveLength(4);
    expect(analytics.recentTransactions).toHaveLength(1);
    expect(analytics.recentTransactions[0].productName).toBe("EchoVibe Earbuds");
    expect(analytics.recentTransactions[0].status).toBe("FULFILLED");
    expect(analytics.recentTransactions[0].transactionCode).toBe("#TXN_10005");
  });

  it("should retrieve and map sales orders", async () => {
    mockPrisma.client.transaction.findMany.mockResolvedValue([
      {
        id: "ord_101",
        number: "TXN_10018",
        status: "CONFIRMED",
        createdAt: new Date(),
        customer: { name: "John Doe" },
        items: [
          { productName: "TimeSync Smart Watch", quantity: 2 },
        ],
      },
    ]);

    const orders = await service.getOrders("org_1", "Watch");

    expect(orders).toHaveLength(1);
    expect(orders[0].id).toBe("ord_101");
    expect(orders[0].title).toBe("TimeSync Smart Watch");
    expect(orders[0].itemCountText).toBe("2 Items");
    expect(orders[0].status).toBe("CONFIRMED");
    expect(orders[0].orderCode).toBe("#TXN_10018");
    expect(orders[0].groupDate).toBe("Today");
  });
});
