import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @repo/db
vi.mock("@repo/db", () => ({
  db: {
    member: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    inventoryLocation: {
      findFirst: vi.fn(),
    },
    pettyCashFund: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      findFirstOrThrow: vi.fn(),
    },
    pettyCashTransaction: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(async (cb: any) =>
      cb({
        pettyCashFund: {
          findFirst: vi.mocked(db.pettyCashFund.findFirst),
          updateMany: vi.mocked(db.pettyCashFund.updateMany),
          findFirstOrThrow: vi.mocked(db.pettyCashFund.findFirstOrThrow),
        },
        pettyCashTransaction: {
          create: vi.mocked(db.pettyCashTransaction.create),
        },
      })
    ),
  },
}));

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
import { getServerAuth } from "@repo/auth/server";
import {
  getPettyCashFunds,
  createPettyCashFund,
  topUpPettyCashFund,
  getPettyCashTransactions,
} from "../petty-cash";

describe("Petty Cash Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createPettyCashFund", () => {
    it("should throw error if unauthenticated", async () => {
      (getServerAuth as any).mockResolvedValue(null);

      await expect(
        createPettyCashFund({
          name: "Main Cash",
          floatAmount: 500,
          currencyCode: "USD",
          responsibleMemberId: "mem-1",
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("should reject creation if responsibleMemberId belongs to another organization", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-admin",
      });
      (db.member.findUnique as any).mockResolvedValue({
        id: "mem-admin",
        role: "ADMIN",
      });
      (db.member.findFirst as any).mockResolvedValue(null);

      await expect(
        createPettyCashFund({
          name: "Main Cash",
          floatAmount: 500,
          currencyCode: "USD",
          responsibleMemberId: "foreign-member-id",
        })
      ).rejects.toThrow("Responsible member not found or belongs to another organization");

      expect(db.member.findFirst).toHaveBeenCalledWith({
        where: { id: "foreign-member-id", organizationId: "org-1" },
        select: { id: true },
      });
      expect(db.pettyCashFund.create).not.toHaveBeenCalled();
    });

    it("should reject creation if locationId belongs to another organization", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-admin",
      });
      (db.member.findUnique as any).mockResolvedValue({
        id: "mem-admin",
        role: "ADMIN",
      });
      (db.member.findFirst as any).mockResolvedValue({ id: "mem-1" });
      (db.inventoryLocation.findFirst as any).mockResolvedValue(null);

      await expect(
        createPettyCashFund({
          name: "Branch Cash",
          floatAmount: 200,
          currencyCode: "USD",
          responsibleMemberId: "mem-1",
          locationId: "foreign-loc-id",
        })
      ).rejects.toThrow("Location not found or belongs to another organization");

      expect(db.inventoryLocation.findFirst).toHaveBeenCalledWith({
        where: { id: "foreign-loc-id", organizationId: "org-1" },
        select: { id: true },
      });
      expect(db.pettyCashFund.create).not.toHaveBeenCalled();
    });

    it("should create petty cash fund when relational IDs belong to organization", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-admin",
      });
      (db.member.findUnique as any).mockResolvedValue({
        id: "mem-admin",
        role: "ADMIN",
      });
      (db.member.findFirst as any).mockResolvedValue({ id: "mem-1" });
      (db.inventoryLocation.findFirst as any).mockResolvedValue({ id: "loc-1" });
      (db.pettyCashFund.create as any).mockResolvedValue({
        id: "fund-1",
        name: "Branch Cash",
        organizationId: "org-1",
      });

      const result = await createPettyCashFund({
        name: "Branch Cash",
        floatAmount: 300,
        currencyCode: "USD",
        responsibleMemberId: "mem-1",
        locationId: "loc-1",
      });

      expect(result).toEqual({
        id: "fund-1",
        name: "Branch Cash",
        organizationId: "org-1",
      });
      expect(db.pettyCashFund.create).toHaveBeenCalledWith({
        data: {
          organizationId: "org-1",
          name: "Branch Cash",
          floatAmount: 300,
          amount: 300,
          currencyCode: "USD",
          responsibleMemberId: "mem-1",
          locationId: "loc-1",
        },
        include: expect.any(Object),
      });
    });
  });

  describe("topUpPettyCashFund", () => {
    it("should throw error if fund does not exist or belongs to another organization", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-admin",
      });
      (db.member.findUnique as any).mockResolvedValue({
        id: "mem-admin",
        role: "ADMIN",
      });
      (db.pettyCashFund.findFirst as any).mockResolvedValue(null);

      await expect(
        topUpPettyCashFund("foreign-fund-id", { amount: 100 })
      ).rejects.toThrow("Fund not found");
    });

    it("should update fund using updateMany scoped strictly by id and organizationId", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-admin",
      });
      (db.member.findUnique as any).mockResolvedValue({
        id: "mem-admin",
        role: "ADMIN",
      });
      (db.pettyCashFund.findFirst as any).mockResolvedValue({
        id: "fund-1",
        organizationId: "org-1",
      });
      (db.pettyCashFund.updateMany as any).mockResolvedValue({ count: 1 });
      (db.pettyCashFund.findFirstOrThrow as any).mockResolvedValue({
        id: "fund-1",
        organizationId: "org-1",
        amount: 400,
      });

      const result = await topUpPettyCashFund("fund-1", {
        amount: 100,
        description: "Weekly top up",
      });

      expect(result).toEqual({
        id: "fund-1",
        organizationId: "org-1",
        amount: 400,
      });
      expect(db.pettyCashFund.updateMany).toHaveBeenCalledWith({
        where: { id: "fund-1", organizationId: "org-1" },
        data: { amount: { increment: 100 } },
      });
      expect(db.pettyCashTransaction.create).toHaveBeenCalledWith({
        data: {
          fundId: "fund-1",
          type: "TOP_UP",
          amount: 100,
          description: "Weekly top up",
          memberId: "mem-admin",
        },
      });
    });
  });
});
