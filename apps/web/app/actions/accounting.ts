"use server";

import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { revalidatePath } from "next/cache";
import { MemberRole, AccountType, AccountSubType } from "@repo/db/client";

async function checkPermission(allowedRoles: MemberRole[]) {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId || !auth.memberId) {
    throw new Error("Unauthorized");
  }

  const member = await db.member.findUnique({
    where: { id: auth.memberId },
  });

  if (!member || !allowedRoles.includes(member.role)) {
    throw new Error("Forbidden: Insufficient permissions");
  }

  return { auth, member };
}

// --- Chart of Accounts Actions ---

export async function getLedgerAccounts() {
  const { auth } = await checkPermission([
    "OWNER",
    "ADMIN",
    "MANAGER",
    "REPORTER",
  ]);
  return await db.ledgerAccount.findMany({
    where: { organizationId: auth.organizationId },
    orderBy: [{ type: "asc" }, { code: "asc" }],
    include: {
      parent: true,
    },
  });
}

export async function createLedgerAccount(data: {
  name: string;
  code: string;
  type: AccountType;
  subType: AccountSubType;
  description?: string;
  parentId?: string;
}) {
  const { auth } = await checkPermission(["OWNER", "ADMIN"]);
  const account = await db.ledgerAccount.create({
    data: {
      ...data,
      organizationId: auth.organizationId,
    },
  });
  revalidatePath("/finance/accounting/coa");
  return account;
}

export async function initializeCOA() {
  const { auth } = await checkPermission(["OWNER", "ADMIN"]);

  // In a real scenario, we'd call the API or replicate the logic here
  // For now, let's replicate the logic for simplicity in this sandbox
  const standardAccounts = [
    {
      name: "Cash",
      code: "1000",
      type: AccountType.ASSET,
      subType: AccountSubType.CASH,
    },
    {
      name: "Bank",
      code: "1010",
      type: AccountType.ASSET,
      subType: AccountSubType.BANK,
    },
    {
      name: "Accounts Receivable",
      code: "1200",
      type: AccountType.ASSET,
      subType: AccountSubType.ACCOUNTS_RECEIVABLE,
    },
    {
      name: "Inventory",
      code: "1300",
      type: AccountType.ASSET,
      subType: AccountSubType.INVENTORY,
    },
    {
      name: "Accounts Payable",
      code: "2000",
      type: AccountType.LIABILITY,
      subType: AccountSubType.ACCOUNTS_PAYABLE,
    },
    {
      name: "VAT Payable",
      code: "2200",
      type: AccountType.LIABILITY,
      subType: AccountSubType.TAX_PAYABLE,
    },
    {
      name: "Retained Earnings",
      code: "3000",
      type: AccountType.EQUITY,
      subType: AccountSubType.RETAINED_EARNINGS,
      isSystem: true,
    },
    {
      name: "Sales Revenue",
      code: "4000",
      type: AccountType.REVENUE,
      subType: AccountSubType.REVENUE,
    },
    {
      name: "Cost of Goods Sold",
      code: "5000",
      type: AccountType.EXPENSE,
      subType: AccountSubType.COST_OF_GOODS_SOLD,
    },
    {
      name: "Operating Expenses",
      code: "6000",
      type: AccountType.EXPENSE,
      subType: AccountSubType.OPERATING_EXPENSE,
    },
  ];

  for (const account of standardAccounts) {
    await db.ledgerAccount.upsert({
      where: {
        organizationId_code: {
          organizationId: auth.organizationId,
          code: account.code,
        },
      },
      update: {},
      create: {
        ...account,
        organizationId: auth.organizationId,
      },
    });
  }

  revalidatePath("/finance/accounting/coa");
  return { success: true };
}

// --- Journal Entry Actions ---

export async function getJournalEntries(params: {
  startDate?: string;
  endDate?: string;
}) {
  const { auth } = await checkPermission([
    "OWNER",
    "ADMIN",
    "MANAGER",
    "REPORTER",
  ]);
  return await db.journalEntry.findMany({
    where: {
      organizationId: auth.organizationId,
      ...(params.startDate || params.endDate
        ? {
            entryDate: {
              ...(params.startDate && { gte: new Date(params.startDate) }),
              ...(params.endDate && { lte: new Date(params.endDate) }),
            },
          }
        : {}),
    },
    include: {
      lines: {
        include: {
          ledgerAccount: true,
        },
      },
      member: {
        include: {
          user: true,
        },
      },
    },
    orderBy: { entryDate: "desc" },
  });
}

// --- Bank Reconciliation Actions ---

export async function getBankStatements() {
  const { auth } = await checkPermission([
    "OWNER",
    "ADMIN",
    "MANAGER",
    "REPORTER",
  ]);
  return await db.bankStatement.findMany({
    where: { organizationId: auth.organizationId },
    orderBy: { statementDate: "desc" },
  });
}

// --- Reporting Actions ---

export async function getProfitLoss(startDate: string, endDate: string) {
  const { auth } = await checkPermission([
    "OWNER",
    "ADMIN",
    "MANAGER",
    "REPORTER",
  ]);

  const accounts = await db.ledgerAccount.findMany({
    where: {
      organizationId: auth.organizationId,
      type: { in: ["REVENUE", "EXPENSE"] },
    },
    include: {
      journalLines: {
        where: {
          journalEntry: {
            organizationId: auth.organizationId,
            status: "POSTED",
            entryDate: { gte: new Date(startDate), lte: new Date(endDate) },
          },
        },
      },
    },
  });

  const report = {
    revenue: [] as any[],
    expenses: [] as any[],
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
  };

  for (const account of accounts) {
    const balance = account.journalLines.reduce((sum, line) => {
      if (account.type === "REVENUE") {
        return sum + (Number(line.credit) - Number(line.debit));
      } else {
        return sum + (Number(line.debit) - Number(line.credit));
      }
    }, 0);

    if (balance === 0) continue;

    const entry = { name: account.name, code: account.code, balance };

    if (account.type === "REVENUE") {
      report.revenue.push(entry);
      report.totalRevenue += balance;
    } else {
      report.expenses.push(entry);
      report.totalExpenses += balance;
    }
  }

  report.netProfit = report.totalRevenue - report.totalExpenses;
  return report;
}
