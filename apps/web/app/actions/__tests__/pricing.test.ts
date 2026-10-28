import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @repo/db
vi.mock("@repo/db", () => ({
  db: {
    priceList: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findFirstOrThrow: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    priceListItem: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findFirstOrThrow: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
      upsert: vi.fn(),
    },
    pricingRule: {
      findMany: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    pricingBundle: {
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    pricingBundleItem: {
      findMany: vi.fn(),
    },
    product: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    productVariant: {
      findMany: vi.fn(),
    },
    customer: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(callbackOrArray => {
      if (Array.isArray(callbackOrArray)) {
        return Promise.all(callbackOrArray);
      }
      return callbackOrArray({});
    }),
  },
  Decimal: class MockDecimal {
    value: number;
    constructor(v: number) {
      this.value = v;
    }
  },
  PriceApprovalStatus: {
    DRAFT: "DRAFT",
    PENDING_APPROVAL: "PENDING_APPROVAL",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
  },
  PricingMethod: { FIXED: "FIXED" },
  DiscountType: { PERCENTAGE: "PERCENTAGE" },
  BundleType: { FIXED: "FIXED", DYNAMIC: "DYNAMIC" },
}));

// Mock @repo/auth/server
vi.mock("@repo/auth/server", () => ({
  getServerAuth: vi.fn(),
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock @repo/shared/realtime
vi.mock("@repo/shared/realtime", () => ({
  realtimeService: {
    publish: vi.fn().mockResolvedValue(true),
  },
}));

import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { realtimeService } from "@repo/shared/realtime";
import {
  deletePriceList,
  removePriceListItem,
  deleteVolumeTier,
  deleteProductPricingRule,
  deleteProductPricingBundle,
  submitPriceListForApproval,
  approvePriceList,
  rejectPriceList,
  updatePriceList,
  addPriceListItems,
} from "../pricing";

describe("Pricing Server Actions - Tenant Isolation & BOLA Hardening", () => {
  const mockOrgId = "org_tenant_123";
  const mockMemberId = "mem_123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("deletePriceList", () => {
    it("should throw error if unauthenticated", async () => {
      (getServerAuth as any).mockResolvedValue(null);

      await expect(deletePriceList("pl_1")).rejects.toThrow("Unauthorized");
    });

    it("should delete price list using deleteMany scoped strictly by organizationId", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: mockOrgId,
        memberId: mockMemberId,
      });
      (db.priceList.deleteMany as any).mockResolvedValue({ count: 1 });

      await deletePriceList("pl_1");

      expect(db.priceList.deleteMany).toHaveBeenCalledWith({
        where: { id: "pl_1", organizationId: mockOrgId },
      });
      expect(realtimeService.publish).toHaveBeenCalledWith(
        `organization:${mockOrgId}:pricing`,
        "price-list-deleted",
        { priceListId: "pl_1" },
      );
    });

    it("should throw error if price list belongs to another tenant (count === 0)", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: mockOrgId,
        memberId: mockMemberId,
      });
      (db.priceList.deleteMany as any).mockResolvedValue({ count: 0 });

      await expect(deletePriceList("pl_foreign")).rejects.toThrow(
        "Price list not found or unauthorized",
      );
    });
  });

  describe("removePriceListItem", () => {
    it("should throw error if price list item is not found in organization", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: mockOrgId,
      });
      (db.priceListItem.findFirst as any).mockResolvedValue(null);

      await expect(removePriceListItem("pli_foreign")).rejects.toThrow(
        "Price list item not found or unauthorized",
      );
    });

    it("should delete price list item using deleteMany scoped by organizationId", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: mockOrgId,
      });
      (db.priceListItem.findFirst as any).mockResolvedValue({
        priceListId: "pl_100",
      });
      (db.priceListItem.deleteMany as any).mockResolvedValue({ count: 1 });

      await removePriceListItem("pli_123");

      expect(db.priceListItem.deleteMany).toHaveBeenCalledWith({
        where: { id: "pli_123", organizationId: mockOrgId },
      });
    });
  });

  describe("deleteVolumeTier", () => {
    it("should delete volume tier using deleteMany scoped by organizationId", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: mockOrgId,
      });
      (db.priceListItem.deleteMany as any).mockResolvedValue({ count: 1 });

      await deleteVolumeTier("pli_vol_1", "prod_1");

      expect(db.priceListItem.deleteMany).toHaveBeenCalledWith({
        where: { id: "pli_vol_1", organizationId: mockOrgId },
      });
    });

    it("should throw error if volume tier does not belong to organization", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: mockOrgId,
      });
      (db.priceListItem.deleteMany as any).mockResolvedValue({ count: 0 });

      await expect(deleteVolumeTier("pli_foreign")).rejects.toThrow(
        "Volume tier not found or unauthorized",
      );
    });
  });

  describe("deleteProductPricingRule", () => {
    it("should delete rule using deleteMany scoped by organizationId", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: mockOrgId,
      });
      (db.pricingRule.deleteMany as any).mockResolvedValue({ count: 1 });

      await deleteProductPricingRule("rule_1", "prod_1");

      expect(db.pricingRule.deleteMany).toHaveBeenCalledWith({
        where: { id: "rule_1", organizationId: mockOrgId },
      });
    });

    it("should throw error if pricing rule belongs to foreign organization", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: mockOrgId,
      });
      (db.pricingRule.deleteMany as any).mockResolvedValue({ count: 0 });

      await expect(deleteProductPricingRule("rule_foreign")).rejects.toThrow(
        "Pricing rule not found or unauthorized",
      );
    });
  });

  describe("deleteProductPricingBundle", () => {
    it("should delete bundle using deleteMany scoped by organizationId", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: mockOrgId,
      });
      (db.pricingBundle.deleteMany as any).mockResolvedValue({ count: 1 });

      await deleteProductPricingBundle("bdl_1", "prod_1");

      expect(db.pricingBundle.deleteMany).toHaveBeenCalledWith({
        where: { id: "bdl_1", organizationId: mockOrgId },
      });
    });

    it("should throw error if bundle belongs to foreign organization", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: mockOrgId,
      });
      (db.pricingBundle.deleteMany as any).mockResolvedValue({ count: 0 });

      await expect(deleteProductPricingBundle("bdl_foreign")).rejects.toThrow(
        "Pricing bundle not found or unauthorized",
      );
    });
  });

  describe("submitPriceListForApproval & Status Actions", () => {
    it("should update status using updateMany scoped by organizationId", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: mockOrgId,
        memberId: mockMemberId,
      });
      (db.priceList.updateMany as any).mockResolvedValue({ count: 1 });
      (db.priceList.findFirstOrThrow as any).mockResolvedValue({
        id: "pl_1",
        approvalStatus: "PENDING_APPROVAL",
      });

      const res = await submitPriceListForApproval("pl_1");

      expect(db.priceList.updateMany).toHaveBeenCalledWith({
        where: { id: "pl_1", organizationId: mockOrgId },
        data: expect.objectContaining({
          approvalStatus: "PENDING_APPROVAL",
          submittedBy: mockMemberId,
        }),
      });
      expect(res.approvalStatus).toBe("PENDING_APPROVAL");
    });

    it("should throw error on approve if price list belongs to another org", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: mockOrgId,
        memberId: mockMemberId,
      });
      (db.priceList.updateMany as any).mockResolvedValue({ count: 0 });

      await expect(approvePriceList("pl_foreign")).rejects.toThrow(
        "Price list not found or unauthorized",
      );
    });

    it("should throw error on reject if price list belongs to another org", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: mockOrgId,
        memberId: mockMemberId,
      });
      (db.priceList.updateMany as any).mockResolvedValue({ count: 0 });

      await expect(rejectPriceList("pl_foreign", "bad pricing")).rejects.toThrow(
        "Price list not found or unauthorized",
      );
    });

    it("should throw error on updatePriceList if target belongs to another org", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: mockOrgId,
      });
      (db.priceList.updateMany as any).mockResolvedValue({ count: 0 });

      await expect(updatePriceList("pl_foreign", { name: "New Name" })).rejects.toThrow(
        "Price list not found or unauthorized",
      );
    });
  });

  describe("addPriceListItems", () => {
    it("should throw error if target price list is not owned by organization", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: mockOrgId,
      });
      (db.priceList.findFirst as any).mockResolvedValue(null);

      await expect(
        addPriceListItems("pl_foreign", [
          { variantId: "var_1", method: "FIXED" as any, price: 50 },
        ]),
      ).rejects.toThrow("Price list not found or unauthorized");
    });
  });
});
