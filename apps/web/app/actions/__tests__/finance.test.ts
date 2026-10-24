import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @repo/db
vi.mock("@repo/db", () => {
  const mockDb = {
    recurringExpense: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    expense: {
      count: vi.fn(),
      create: vi.fn(),
    },
    organization: {
      findUnique: vi.fn(),
    },
    approvalRequest: {
      create: vi.fn(),
    },
    $transaction: vi.fn(async (callback) => callback(mockDb)),
  };
  return { db: mockDb };
});

// Mock @repo/auth/server
vi.mock("@repo/auth/server", () => ({
  getServerAuth: vi.fn(),
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

import { db } from "@repo/db";
import { processRecurringExpenses } from "../finance";

describe("processRecurringExpenses Server Action Optimization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return processed count 0 when no recurring expenses are due", async () => {
    (db.recurringExpense.findMany as any).mockResolvedValue([]);

    const result = await processRecurringExpenses();

    expect(result).toEqual({ processed: 0 });
    expect(db.recurringExpense.findMany).toHaveBeenCalled();
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("should process due recurring expenses concurrently across organizations and sequentially within an org", async () => {
    const mockDueRecurring = [
      {
        id: "rec-1",
        organizationId: "org-1",
        createdById: "mem-1",
        description: "Software License",
        amount: 100,
        categoryId: "cat-1",
        nextDueDate: new Date("2026-01-01"),
        frequency: "MONTHLY",
        paymentMethod: "CREDIT_CARD",
        supplierId: null,
        utilityAccountId: null,
      },
      {
        id: "rec-2",
        organizationId: "org-1",
        createdById: "mem-1",
        description: "Cloud Hosting",
        amount: 300,
        categoryId: "cat-1",
        nextDueDate: new Date("2026-01-01"),
        frequency: "MONTHLY",
        paymentMethod: "CREDIT_CARD",
        supplierId: null,
        utilityAccountId: null,
      },
      {
        id: "rec-3",
        organizationId: "org-2",
        createdById: "mem-2",
        description: "Internet Service",
        amount: 500,
        categoryId: "cat-2",
        nextDueDate: new Date("2026-01-01"),
        frequency: "MONTHLY",
        paymentMethod: "BANK_TRANSFER",
        supplierId: null,
        utilityAccountId: null,
      },
    ];

    (db.recurringExpense.findMany as any).mockResolvedValue(mockDueRecurring);
    let countOrg1 = 5;
    let countOrg2 = 10;
    (db.expense.count as any).mockImplementation(({ where }: any) => {
      if (where.organizationId === "org-1") return Promise.resolve(countOrg1++);
      if (where.organizationId === "org-2") return Promise.resolve(countOrg2++);
      return Promise.resolve(0);
    });
    (db.organization.findUnique as any).mockImplementation(({ where }: any) => {
      if (where.id === "org-1") return Promise.resolve({ expenseApprovalThreshold: 200 });
      if (where.id === "org-2") return Promise.resolve({ expenseApprovalThreshold: 200 });
      return Promise.resolve(null);
    });
    (db.expense.create as any).mockImplementation(({ data }: any) =>
      Promise.resolve({ id: `exp-${data.organizationId}`, ...data }),
    );
    (db.recurringExpense.update as any).mockResolvedValue({});

    const result = await processRecurringExpenses();

    expect(result).toEqual({ processed: 3 });
    expect(db.recurringExpense.findMany).toHaveBeenCalled();
    expect(db.expense.count).toHaveBeenCalledTimes(3);
    expect(db.organization.findUnique).toHaveBeenCalledTimes(3);
    expect(db.expense.create).toHaveBeenCalledTimes(3);

    const year = new Date().getFullYear();

    // Inspect calls made to expense.create
    const createCalls = (db.expense.create as any).mock.calls.map((c: any) => c[0].data);
    const org1Calls = createCalls.filter((c: any) => c.organizationId === "org-1");
    const org2Calls = createCalls.filter((c: any) => c.organizationId === "org-2");

    expect(org1Calls).toHaveLength(2);
    expect(org2Calls).toHaveLength(1);

    // First org-1 expense gets EXP-YYYY-0006
    expect(org1Calls[0]).toEqual(
      expect.objectContaining({
        organizationId: "org-1",
        expenseNumber: `EXP-${year}-0006`,
        amount: 100,
        status: "PENDING",
      }),
    );

    // Second org-1 expense gets EXP-YYYY-0007 (incremented sequential count!)
    expect(org1Calls[1]).toEqual(
      expect.objectContaining({
        organizationId: "org-1",
        expenseNumber: `EXP-${year}-0007`,
        amount: 300,
        status: "PENDING_APPROVAL",
      }),
    );

    expect(org2Calls[0]).toEqual(
      expect.objectContaining({
        organizationId: "org-2",
        expenseNumber: `EXP-${year}-0011`,
        amount: 500,
        status: "PENDING_APPROVAL",
      }),
    );

    expect(db.recurringExpense.update).toHaveBeenCalledTimes(3);
  });
});
