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
          findFirst: vi.fn(),
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
        organization: {
          findUnique: vi.fn().mockResolvedValue({
            id: "org_1",
            settings: { defaultCurrency: "USD" },
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

  it("should retrieve single order details", async () => {
    mockPrisma.client.transaction.findFirst.mockResolvedValue({
      id: "ord_101",
      number: "TXN_10018",
      status: "COMPLETED",
      createdAt: new Date(),
      customer: { name: "Alice Wonderland", email: "alice@example.com", phone: "+12345678" },
      items: [
        { id: "item_1", productName: "TimeSync Smart Watch", quantity: 2, unitPrice: 45, total: 90 },
      ],
      payments: [
        { provider: "M-Pesa STK Push" },
      ],
      finalTotal: 90,
      subtotal: 90,
    });

    const order = await service.getOrderDetails("org_1", "ord_101");
    expect(order.id).toBe("ord_101");
    expect(order.customerName).toBe("Alice Wonderland");
    expect(order.lineItems).toHaveLength(1);
    expect(order.lineItems?.[0].name).toBe("TimeSync Smart Watch");
    expect(order.paymentMethod).toBe("M-Pesa STK Push");
  });
});
