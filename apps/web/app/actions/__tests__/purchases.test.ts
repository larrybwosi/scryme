import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @repo/db and @repo/auth/server
vi.mock("@repo/db", () => ({
  db: {
    member: { findUnique: vi.fn() },
    purchase: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      $transaction: vi.fn(),
    },
    supplier: { findUnique: vi.fn() },
    organization: { findUnique: vi.fn() },
    $transaction: vi.fn((cb) => cb({
      purchaseItem: { deleteMany: vi.fn() },
      purchase: {
        update: vi.fn().mockResolvedValue({ id: "po-1", status: "DRAFT" }),
      },
    })),
  },
}));

vi.mock("@repo/auth/server", () => ({
  getServerAuth: vi.fn().mockResolvedValue({
    organizationId: "org-1",
    memberId: "member-1",
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Purchases Server Actions (Drafts, Approvals & Workflow)", () => {
  it("should validate server action exports", async () => {
    const purchasesActions = await import("../purchases");
    expect(purchasesActions.getPurchases).toBeDefined();
    expect(purchasesActions.createPurchase).toBeDefined();
    expect(purchasesActions.createPurchaseDraft).toBeDefined();
    expect(purchasesActions.updatePurchaseDraft).toBeDefined();
    expect(purchasesActions.submitPurchaseOrder).toBeDefined();
  });
});
