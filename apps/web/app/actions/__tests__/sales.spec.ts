import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@repo/db", () => ({
  db: {
    member: {
      findUnique: vi.fn(),
    },
    transaction: {
      count: vi.fn(),
      create: vi.fn(),
    },
    organizationSettings: {
      findUnique: vi.fn(),
    },
    productVariant: {
      findMany: vi.fn(),
    },
    transactionItem: {
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("@repo/auth/server", () => ({
  getServerAuth: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

import { createTransaction } from "../sales";
import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";

describe("createTransaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getServerAuth as any).mockResolvedValue({
      organizationId: "org-123",
      memberId: "mem-456",
    });
    (db.member.findUnique as any).mockResolvedValue({
      id: "mem-456",
      role: "ADMIN",
    });
    (db.transaction.count as any).mockResolvedValue(5);
    (db.organizationSettings.findUnique as any).mockResolvedValue({
      defaultCurrency: "USD",
    });
    (db.transaction.create as any).mockResolvedValue({
      id: "trx-789",
    });
  });

  it("batches product variant fetching and parallelizes transaction item updates", async () => {
    const items = [
      {
        variantId: "var-1",
        quantity: 2,
        unitPrice: 10,
        unitCost: 5,
      },
      {
        variantId: "var-2",
        quantity: 1,
        unitPrice: 20,
        unitCost: 10,
      },
      {
        variantId: "var-1",
        quantity: 3,
        unitPrice: 10,
        unitCost: 5,
      },
    ];

    (db.productVariant.findMany as any).mockResolvedValue([
      {
        id: "var-1",
        name: "Size M",
        sku: "SKU-1",
        product: { name: "Product A" },
      },
      {
        id: "var-2",
        name: "Size L",
        sku: "SKU-2",
        product: { name: "Product B" },
      },
    ]);

    (db.transactionItem.updateMany as any).mockResolvedValue({ count: 1 });

    const result = await createTransaction({
      type: "SALES_ORDER",
      customerId: "cust-1",
      locationId: "loc-1",
      items,
    });

    expect(result).toEqual({ id: "trx-789" });

    // Verify productVariant.findMany was called ONCE with unique variant IDs
    expect(db.productVariant.findMany).toHaveBeenCalledTimes(1);
    expect(db.productVariant.findMany).toHaveBeenCalledWith({
      where: { id: { in: ["var-1", "var-2"] } },
      include: { product: true },
    });

    // Verify transactionItem.updateMany was called for each unique variant ID
    expect(db.transactionItem.updateMany).toHaveBeenCalledTimes(2);
    expect(db.transactionItem.updateMany).toHaveBeenCalledWith({
      where: { transactionId: "trx-789", variantId: "var-1" },
      data: {
        productName: "Product A",
        variantName: "Size M",
        sku: "SKU-1",
      },
    });
    expect(db.transactionItem.updateMany).toHaveBeenCalledWith({
      where: { transactionId: "trx-789", variantId: "var-2" },
      data: {
        productName: "Product B",
        variantName: "Size L",
        sku: "SKU-2",
      },
    });
  });
});
