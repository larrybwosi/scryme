import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @repo/db
vi.mock("@repo/db", () => ({
  db: {
    ledgerAccount: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
    },
    member: {
      findUnique: vi.fn(),
    },
    journalEntry: {
      findMany: vi.fn(),
    },
    bankStatement: {
      findMany: vi.fn(),
    },
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
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import {
  getLedgerAccounts,
  createLedgerAccount,
  initializeCOA,
  getJournalEntries,
  getBankStatements,
  getProfitLoss,
} from "../accounting";

describe("Accounting Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getLedgerAccounts", () => {
    it("should redirect if unauthenticated", async () => {
      (getServerAuth as any).mockResolvedValue(null);

      await expect(getLedgerAccounts()).rejects.toThrow("REDIRECT:/unauthorized?reason=unauthenticated");
      expect(db.ledgerAccount.findMany).not.toHaveBeenCalled();
    });

    it("should fetch ledger accounts scoped to organizationId", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-1",
      });
      (db.member.findUnique as any).mockResolvedValue({ id: "mem-1", role: "ADMIN" });
      (db.ledgerAccount.findMany as any).mockResolvedValue([
        { id: "acc-1", name: "Cash", code: "1000" },
      ]);

      const result = await getLedgerAccounts();

      expect(result).toEqual([{ id: "acc-1", name: "Cash", code: "1000" }]);
      expect(db.ledgerAccount.findMany).toHaveBeenCalledWith({
        where: { organizationId: "org-1" },
        orderBy: [{ type: "asc" }, { code: "asc" }],
        include: { parent: true },
      });
    });
  });

  describe("createLedgerAccount", () => {
    it("should reject creation if role is insufficient", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-1",
      });
      (db.member.findUnique as any).mockResolvedValue({ id: "mem-1", role: "EMPLOYEE" });

      await expect(
        createLedgerAccount({
          name: "Sub Cash",
          code: "1001",
          type: "ASSET" as any,
          subType: "CASH" as any,
        })
      ).rejects.toThrow("Forbidden: Insufficient permissions");
    });

    it("should reject creation if parentId belongs to another organization (BOLA / IDOR mitigation)", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-1",
      });
      (db.member.findUnique as any).mockResolvedValue({ id: "mem-1", role: "ADMIN" });
      (db.ledgerAccount.findFirst as any).mockResolvedValue(null);

      await expect(
        createLedgerAccount({
          name: "Sub Cash",
          code: "1001",
          type: "ASSET" as any,
          subType: "CASH" as any,
          parentId: "foreign-parent-id",
        })
      ).rejects.toThrow("Parent ledger account not found or belongs to another organization");

      expect(db.ledgerAccount.findFirst).toHaveBeenCalledWith({
        where: {
          id: "foreign-parent-id",
          organizationId: "org-1",
        },
      });
      expect(db.ledgerAccount.create).not.toHaveBeenCalled();
    });

    it("should create ledger account successfully when parentId is valid", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-1",
      });
      (db.member.findUnique as any).mockResolvedValue({ id: "mem-1", role: "ADMIN" });
      (db.ledgerAccount.findFirst as any).mockResolvedValue({ id: "parent-1", organizationId: "org-1" });
      (db.ledgerAccount.create as any).mockResolvedValue({
        id: "acc-2",
        name: "Petty Cash",
        code: "1001",
        organizationId: "org-1",
        parentId: "parent-1",
      });

      const result = await createLedgerAccount({
        name: "Petty Cash",
        code: "1001",
        type: "ASSET" as any,
        subType: "CASH" as any,
        parentId: "parent-1",
      });

      expect(result).toEqual({
        id: "acc-2",
        name: "Petty Cash",
        code: "1001",
        organizationId: "org-1",
        parentId: "parent-1",
      });
      expect(db.ledgerAccount.create).toHaveBeenCalledWith({
        data: {
          name: "Petty Cash",
          code: "1001",
          type: "ASSET",
          subType: "CASH",
          parentId: "parent-1",
          organizationId: "org-1",
        },
      });
    });
  });

  describe("initializeCOA", () => {
    it("should initialize COA with 10 standard accounts concurrently", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-1",
      });
      (db.member.findUnique as any).mockResolvedValue({ id: "mem-1", role: "OWNER" });
      (db.ledgerAccount.upsert as any).mockResolvedValue({});

      const result = await initializeCOA();

      expect(result).toEqual({ success: true });
      expect(db.ledgerAccount.upsert).toHaveBeenCalledTimes(10);
    });
  });

  describe("getJournalEntries", () => {
    it("should fetch journal entries scoped to organizationId", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-1",
      });
      (db.member.findUnique as any).mockResolvedValue({ id: "mem-1", role: "MANAGER" });
      (db.journalEntry.findMany as any).mockResolvedValue([
        { id: "je-1", description: "Initial Entry" },
      ]);

      const result = await getJournalEntries({});

      expect(result).toEqual([{ id: "je-1", description: "Initial Entry" }]);
      expect(db.journalEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: "org-1" },
        })
      );
    });
  });

  describe("getBankStatements", () => {
    it("should fetch bank statements scoped to organizationId", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-1",
      });
      (db.member.findUnique as any).mockResolvedValue({ id: "mem-1", role: "REPORTER" });
      (db.bankStatement.findMany as any).mockResolvedValue([
        { id: "bs-1", statementDate: new Date() },
      ]);

      const result = await getBankStatements();

      expect(result).toHaveLength(1);
      expect(db.bankStatement.findMany).toHaveBeenCalledWith({
        where: { organizationId: "org-1" },
        orderBy: { statementDate: "desc" },
      });
    });
  });

  describe("getProfitLoss", () => {
    it("should calculate profit and loss scoped to organizationId", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-1",
      });
      (db.member.findUnique as any).mockResolvedValue({ id: "mem-1", role: "ADMIN" });
      (db.ledgerAccount.findMany as any).mockResolvedValue([
        {
          name: "Sales",
          code: "4000",
          type: "REVENUE",
          journalLines: [{ debit: 0, credit: 500 }],
        },
        {
          name: "Rent",
          code: "6000",
          type: "EXPENSE",
          journalLines: [{ debit: 200, credit: 0 }],
        },
      ]);

      const report = await getProfitLoss("2026-01-01", "2026-12-31");

      expect(report).toEqual({
        revenue: [{ name: "Sales", code: "4000", balance: 500 }],
        expenses: [{ name: "Rent", code: "6000", balance: 200 }],
        totalRevenue: 500,
        totalExpenses: 200,
        netProfit: 300,
      });
    });
  });
});
