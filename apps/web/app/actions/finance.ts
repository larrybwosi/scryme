"use server";

import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  ExpenseStatus,
  PaymentMethod,
  ApprovalRequestType,
  UtilityType,
  Expense,
  ExpenseCategory,
  Supplier,
  Member,
  User,
  MemberRole,
  RecurrenceFrequency,
} from "@repo/db/client";
import { submitForApproval } from "./approvals";

async function checkPermission(allowedRoles: MemberRole[], isPageLoad = false) {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId || !auth.memberId) {
    if (isPageLoad) {
      redirect("/unauthorized?reason=unauthenticated");
    }
    throw new Error("Unauthorized");
  }

  const member = await db.member.findUnique({
    where: { id: auth.memberId },
  });

  if (!member || !allowedRoles.includes(member.role)) {
    if (isPageLoad) {
      redirect("/unauthorized?reason=insufficient_permissions");
    }
    throw new Error("Forbidden: Insufficient permissions");
  }

  return { auth, member };
}

// --- Expense Actions ---

export async function getExpenses(params: {
  search?: string;
  status?: string;
  categoryId?: string;
  locationId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<
  (Expense & {
    category: ExpenseCategory;
    member: Member & { user: User };
    supplier: Supplier | null;
    location: any | null;
  })[]
> {
  const { auth } = await checkPermission([
    "OWNER",
    "ADMIN",
    "MANAGER",
    "REPORTER",
  ], true);

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

  if (params.categoryId && params.categoryId !== "all") {
    where.categoryId = params.categoryId;
  }

  if (params.locationId && params.locationId !== "all") {
    where.locationId = params.locationId;
  }

  if (params.startDate || params.endDate) {
    where.expenseDate = {
      ...(params.startDate && { gte: new Date(params.startDate) }),
      ...(params.endDate && { lte: new Date(params.endDate) }),
    };
  }

  return await db.expense.findMany({
    where,
    include: {
      category: true,
      member: {
        include: {
          user: true,
        },
      },
      supplier: true,
      location: true,
    },
    orderBy: {
      expenseDate: "desc",
    },
  });
}

export async function getInventoryLocations() {
  const { auth } = await checkPermission([
    "OWNER",
    "ADMIN",
    "MANAGER",
    "REPORTER",
  ], true);

  return await db.inventoryLocation.findMany({
    where: { organizationId: auth.organizationId, isActive: true },
    orderBy: { name: "asc" },
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
  isRecurring?: boolean;
  frequency?: RecurrenceFrequency;
  startDate?: Date;
  endDate?: Date;
  utilityAccountId?: string;
}) {
  const { auth } = await checkPermission(["OWNER", "ADMIN", "MANAGER"]);

  // Generate expense number
  const count = await db.expense.count({
    where: { organizationId: auth.organizationId },
  });
  const expenseNumber = `EXP-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, "0")}`;

  return await db.$transaction(async tx => {
    const org = await tx.organization.findUnique({
      where: { id: auth.organizationId },
      select: { expenseApprovalThreshold: true },
    });

    const threshold = org?.expenseApprovalThreshold
      ? Number(org.expenseApprovalThreshold)
      : 0;
    const status = data.amount > threshold ? "PENDING_APPROVAL" : "PENDING";
    const orgSettings = await tx.organizationSettings.findUnique({
      where: { organizationId: auth.organizationId },
    });

    const expense = await tx.expense.create({
      data: {
        organizationId: auth.organizationId,
        memberId: auth.memberId,
        expenseNumber,
        description: data.description,
        amount: data.amount,
        currencyCode: orgSettings?.defaultCurrency || "USD",
        categoryId: data.categoryId,
        expenseDate: data.expenseDate,
        paymentMethod: data.paymentMethod,
        supplierId: data.supplierId,
        receiptUrl: data.receiptUrl,
        notes: data.notes,
        utilityAccountId: data.utilityAccountId,
        status: status as ExpenseStatus,
      },
    });

    if (status === "PENDING_APPROVAL") {
      await submitForApproval(
        {
          relatedId: expense.id,
          type: "EXPENSE",
          amount: data.amount,
          relatedRecordNumber: expenseNumber,
        },
        tx,
      );
    }

    if (data.isRecurring && data.frequency && data.startDate) {
      await tx.recurringExpense.create({
        data: {
          organizationId: auth.organizationId,
          createdById: auth.memberId,
          description: data.description,
          amount: data.amount,
          categoryId: data.categoryId,
          paymentMethod: data.paymentMethod,
          frequency: data.frequency,
          startDate: data.startDate,
          endDate: data.endDate,
          nextDueDate: calculateNextDueDate(data.startDate, data.frequency),
          supplierId: data.supplierId,
          utilityAccountId: data.utilityAccountId,
        },
      });
    }

    revalidatePath("/finance/expenses");
    if (data.utilityAccountId) revalidatePath("/finance/utilities");
    return expense;
  });
}

function calculateNextDueDate(
  current: Date,
  frequency: RecurrenceFrequency,
): Date {
  const next = new Date(current);
  switch (frequency) {
    case "DAILY":
      next.setDate(next.getDate() + 1);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "BIWEEKLY":
      next.setDate(next.getDate() + 14);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
    case "QUARTERLY":
      next.setMonth(next.getMonth() + 3);
      break;
    case "YEARLY":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

export async function recordUtilityBill(data: {
  utilityAccountId: string;
  amount: number;
  description: string;
  billDate: Date;
  paymentMethod: PaymentMethod;
  notes?: string;
}) {
  const { auth } = await checkPermission(["OWNER", "ADMIN", "MANAGER"]);

  const account = await db.utilityAccount.findUnique({
    where: { id: data.utilityAccountId },
  });

  if (!account) throw new Error("Utility account not found");

  // Create an expense linked to the utility account
  const expense = await createExpense({
    description: data.description || `${account.name} Bill`,
    amount: data.amount,
    categoryId: (await getUtilityCategoryId(auth.organizationId)) || "", // Need to find or create a Utilities category
    expenseDate: data.billDate,
    paymentMethod: data.paymentMethod,
    utilityAccountId: data.utilityAccountId,
    notes: data.notes,
  });

  revalidatePath("/finance/utilities");
  return expense;
}

async function getUtilityCategoryId(organizationId: string) {
  let category = await db.expenseCategory.findFirst({
    where: {
      organizationId,
      name: { contains: "Utility", mode: "insensitive" },
    },
  });

  if (!category) {
    category = await db.expenseCategory.create({
      data: {
        organizationId,
        name: "Utilities",
        description: "Water, Electricity, Internet, etc.",
        code: "UTIL",
      },
    });
  }

  return category.id;
}

export async function processRecurringExpenses() {
  // This would typically be called by a CRON job or background worker
  // We'll implement the logic here to be triggered as needed

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const dueRecurring = await db.recurringExpense.findMany({
    where: {
      isActive: true,
      nextDueDate: { lte: today },
      OR: [{ endDate: null }, { endDate: { gte: today } }],
    },
  });

  for (const recurring of dueRecurring) {
    await db.$transaction(async tx => {
      // Create the actual expense
      const count = await tx.expense.count({
        where: { organizationId: recurring.organizationId },
      });
      const expenseNumber = `EXP-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, "0")}`;

      // Check for approval threshold
      const org = await tx.organization.findUnique({
        where: { id: recurring.organizationId },
        select: { expenseApprovalThreshold: true },
      });

      const threshold = org?.expenseApprovalThreshold
        ? Number(org.expenseApprovalThreshold)
        : 0;
      const status =
        Number(recurring.amount?.toString() || 0) > threshold
          ? "PENDING_APPROVAL"
          : "PENDING";

      const expense = await tx.expense.create({
        data: {
          organizationId: recurring.organizationId,
          memberId: recurring.createdById, // Original creator
          expenseNumber,
          description: `Recurring: ${recurring.description}`,
          amount: recurring.amount,
          categoryId: recurring.categoryId,
          expenseDate: recurring.nextDueDate,
          paymentMethod: recurring.paymentMethod,
          supplierId: recurring.supplierId,
          utilityAccountId: recurring.utilityAccountId,
          recurringExpenseId: recurring.id,
          status: status as ExpenseStatus,
        },
      });

      if (status === "PENDING_APPROVAL") {
        // We'd call submitForApproval here, but we need to ensure it works within transaction
        // For simplicity in this background task, we'll create the approval request directly if needed
        await tx.approvalRequest.create({
          data: {
            organizationId: recurring.organizationId,
            requesterId: recurring.createdById,
            relatedId: expense.id,
            requestType: "EXPENSE",
            amount: recurring.amount,
            relatedRecordNumber: expenseNumber,
            status: "PENDING",
          },
        });
      }

      // Update next due date
      const nextDueDate = calculateNextDueDate(
        recurring.nextDueDate,
        recurring.frequency,
      );
      await tx.recurringExpense.update({
        where: { id: recurring.id },
        data: { nextDueDate },
      });

      // TODO: Send notifications to admins/managers
      // console.log(`Created recurring expense ${expenseNumber} for organization ${recurring.organizationId}`);
    });
  }

  return { processed: dueRecurring.length };
}

// --- Category Actions ---

export async function getExpenseCategories(): Promise<ExpenseCategory[]> {
  const { auth } = await checkPermission([
    "OWNER",
    "ADMIN",
    "MANAGER",
    "REPORTER",
  ], true);

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
  const { auth } = await checkPermission([
    "OWNER",
    "ADMIN",
    "MANAGER",
    "REPORTER",
  ], true);

  return await db.utilityAccount.findMany({
    where: { organizationId: auth.organizationId },
    include: {
      _count: {
        select: { expenses: true },
      },
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
  const { auth } = await checkPermission([
    "OWNER",
    "ADMIN",
    "MANAGER",
    "REPORTER",
  ], true);

  const currentMonthStart = new Date();
  currentMonthStart.setDate(1);
  currentMonthStart.setHours(0, 0, 0, 0);

  const [totalExpenses, pendingApprovals, monthlySpend] = await Promise.all([
    db.expense.aggregate({
      where: { organizationId: auth.organizationId, status: "PAID" },
      _sum: { amount: true },
    }),
    db.approvalRequest.count({
      where: { organizationId: auth.organizationId, status: "PENDING" },
    }),
    db.expense.aggregate({
      where: {
        organizationId: auth.organizationId,
        expenseDate: { gte: currentMonthStart },
        status: { in: ["PAID", "APPROVED"] },
      },
      _sum: { amount: true },
    }),
  ]);

  return {
    totalExpenses: Number(totalExpenses._sum.amount?.toString() || 0),
    pendingApprovals: pendingApprovals || 0,
    monthlySpend: Number(monthlySpend._sum.amount?.toString() || 0),
  };
}
