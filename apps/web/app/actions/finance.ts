"use server";

import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { revalidatePath } from "next/cache";
import {
  ExpenseStatus,
  PaymentMethod,
  UtilityType,
  Expense,
  ExpenseCategory,
  Supplier,
  Member,
  User,
  MemberRole
} from "@repo/db/client";

async function getMember(organizationId: string, userId: string) {
  return await db.member.findUnique({
    where: { organizationId_userId: { organizationId, userId } }
  });
}

async function checkPermission(allowedRoles: MemberRole[]) {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId) {
    throw new Error("Unauthorized");
  }

  const member = await getMember(auth.organizationId, auth.user.id);
  if (!member || !allowedRoles.includes(member.role)) {
    throw new Error("Forbidden: Insufficient permissions");
  }

  return { auth, member };
}

// --- Expense Actions ---

export async function getExpenses(params: {
  search?: string;
  status?: string;
  categoryId?: string;
}): Promise<(Expense & {
  category: ExpenseCategory;
  member: Member & { user: User };
  supplier: Supplier | null;
})[]> {
  const { auth } = await checkPermission(["OWNER", "ADMIN", "MANAGER", "REPORTER"]);

  const where: any = {
    organizationId: auth.organizationId,
  };

  if (params.search) {
    where.OR = [
      { expenseNumber: { contains: params.search, mode: "insensitive" } },
      { description: { contains: params.search, mode: "insensitive" } },
    ];
  }

  if (params.status && params.status !== "all") {
    where.status = params.status as ExpenseStatus;
  }

  if (params.categoryId) {
    where.categoryId = params.categoryId;
  }

  return await db.expense.findMany({
    where,
    include: {
      category: true,
      member: {
        include: {
          user: true
        }
      },
      supplier: true,
    },
    orderBy: {
      expenseDate: "desc",
    },
  });
}

export async function createExpense(data: {
  description: string;
  amount: number;
  categoryId: string;
  expenseDate: Date;
  paymentMethod: PaymentMethod;
  supplierId?: string;
  receiptUrl?: string;
  notes?: string;
}) {
  const { auth } = await checkPermission(["OWNER", "ADMIN", "MANAGER"]);

  // Generate expense number
  const count = await db.expense.count({
    where: { organizationId: auth.organizationId }
  });
  const expenseNumber = `EXP-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

  const expense = await db.expense.create({
    data: {
      organizationId: auth.organizationId,
      memberId: auth.user.id,
      expenseNumber,
      description: data.description,
      amount: data.amount,
      categoryId: data.categoryId,
      expenseDate: data.expenseDate,
      paymentMethod: data.paymentMethod,
      supplierId: data.supplierId,
      receiptUrl: data.receiptUrl,
      notes: data.notes,
      status: "PENDING",
    },
  });

  revalidatePath("/finance/expenses");
  return expense;
}

// --- Category Actions ---

export async function getExpenseCategories(): Promise<ExpenseCategory[]> {
  const { auth } = await checkPermission(["OWNER", "ADMIN", "MANAGER", "REPORTER"]);

  return await db.expenseCategory.findMany({
    where: { organizationId: auth.organizationId },
    orderBy: { name: "asc" },
  });
}

export async function createExpenseCategory(data: {
  name: string;
  description?: string;
  code?: string;
  glCode?: string;
}) {
  const { auth } = await checkPermission(["OWNER", "ADMIN"]);

  const category = await db.expenseCategory.create({
    data: {
      organizationId: auth.organizationId,
      ...data,
    },
  });

  revalidatePath("/finance/expenses");
  return category;
}

// --- Utility Actions ---

export async function getUtilityAccounts(): Promise<any[]> {
  const { auth } = await checkPermission(["OWNER", "ADMIN", "MANAGER", "REPORTER"]);

  return await db.utilityAccount.findMany({
    where: { organizationId: auth.organizationId },
    include: {
      _count: {
        select: { expenses: true }
      }
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createUtilityAccount(data: {
  name: string;
  provider?: string;
  accountNumber: string;
  meterNumber?: string;
  type: UtilityType;
}) {
  const { auth } = await checkPermission(["OWNER", "ADMIN"]);

  const account = await db.utilityAccount.create({
    data: {
      organizationId: auth.organizationId,
      ...data,
    },
  });

  revalidatePath("/finance/utilities");
  return account;
}

// --- Overview Actions ---

export async function getFinanceOverview() {
  const { auth } = await checkPermission(["OWNER", "ADMIN", "MANAGER", "REPORTER"]);

  const currentMonthStart = new Date();
  currentMonthStart.setDate(1);
  currentMonthStart.setHours(0, 0, 0, 0);

  const [totalExpenses, pendingApprovals, monthlySpend] = await Promise.all([
    db.expense.aggregate({
      where: { organizationId: auth.organizationId, status: "PAID" },
      _sum: { amount: true }
    }),
    db.approvalRequest.count({
      where: { organizationId: auth.organizationId, status: "PENDING" }
    }),
    db.expense.aggregate({
      where: {
        organizationId: auth.organizationId,
        expenseDate: { gte: currentMonthStart },
        status: { in: ["PAID", "APPROVED"] }
      },
      _sum: { amount: true }
    })
  ]);

  return {
    totalExpenses: Number(totalExpenses._sum.amount || 0),
    pendingApprovals,
    monthlySpend: Number(monthlySpend._sum.amount || 0),
  };
}
