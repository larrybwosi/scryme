"use server";

import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { redirect } from "next/navigation";
import { MemberRole } from "@repo/db/client";

async function checkPermission(allowedRoles: MemberRole[]) {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId || !auth.memberId) {
    redirect("/unauthorized?reason=unauthenticated");
  }

  const member = await db.member.findUnique({
    where: { id: auth.memberId },
  });

  if (!member || !allowedRoles.includes(member.role)) {
    redirect("/unauthorized?reason=insufficient_permissions");
  }

  return { auth, member };
}

export async function getExpenseAnalyticsReport(startDate?: string, endDate?: string) {
  const { auth } = await checkPermission(["OWNER", "ADMIN", "MANAGER", "REPORTER"]);

  const where: any = {
    organizationId: auth.organizationId,
    deletedAt: null,
  };

  if (startDate || endDate) {
    where.expenseDate = {
      ...(startDate && { gte: new Date(startDate) }),
      ...(endDate && { lte: new Date(endDate) }),
    };
  }

  const expenses = await db.expense.findMany({
    where,
    include: {
      category: true,
      costCenter: true,
      location: true,
      supplier: true,
    },
    orderBy: { expenseDate: "desc" },
  });

  let totalAmount = 0;
  let totalTaxAmount = 0;
  let approvedTotal = 0;
  let pendingTotal = 0;

  const categoryMap = new Map<string, { id: string; name: string; total: number; count: number }>();
  const costCenterMap = new Map<string, { id: string; name: string; code: string; total: number; count: number }>();

  for (const exp of expenses) {
    const amt = Number(exp.amount?.toString() || 0);
    const tax = Number(exp.taxAmount?.toString() || 0);
    totalAmount += amt;
    totalTaxAmount += tax;

    if (exp.status === "APPROVED" || exp.status === "PAID") {
      approvedTotal += amt;
    } else if (exp.status === "PENDING" || exp.status === "PENDING_APPROVAL") {
      pendingTotal += amt;
    }

    const catId = exp.categoryId || "uncategorized";
    const catName = exp.category?.name || "Uncategorized";
    const cat = categoryMap.get(catId) || { id: catId, name: catName, total: 0, count: 0 };
    cat.total += amt;
    cat.count += 1;
    categoryMap.set(catId, cat);

    if (exp.costCenterId && exp.costCenter) {
      const ccId = exp.costCenterId;
      const cc = costCenterMap.get(ccId) || {
        id: ccId,
        name: exp.costCenter.name,
        code: exp.costCenter.code,
        total: 0,
        count: 0,
      };
      cc.total += amt;
      cc.count += 1;
      costCenterMap.set(ccId, cc);
    }
  }

  return {
    totalAmount,
    totalTaxAmount,
    approvedTotal,
    pendingTotal,
    count: expenses.length,
    categoryBreakdown: Array.from(categoryMap.values()),
    costCenterBreakdown: Array.from(costCenterMap.values()),
    expenses: expenses.slice(0, 100),
  };
}

export async function getBudgetVarianceReport() {
  const { auth } = await checkPermission(["OWNER", "ADMIN", "MANAGER", "REPORTER"]);

  const budgets = await db.budget.findMany({
    where: {
      organizationId: auth.organizationId,
      deletedAt: null,
    },
    include: {
      expenseCategory: true,
      costCenter: true,
      location: true,
    },
    orderBy: { periodStart: "desc" },
  });

  const items = budgets.map(b => {
    const budgeted = Number(b.amount?.toString() || 0);
    const spent = Number(b.spentAmount?.toString() || 0);
    const committed = Number(b.committedAmount?.toString() || 0);
    const variance = budgeted - (spent + committed);
    const percentage = budgeted > 0 ? ((spent + committed) / budgeted) * 100 : 0;

    return {
      id: b.id,
      name: b.name,
      periodStart: b.periodStart,
      periodEnd: b.periodEnd,
      budgeted,
      spent,
      committed,
      variance,
      percentage: Math.min(percentage, 999),
      categoryName: b.expenseCategory?.name || "All Categories",
      costCenterName: b.costCenter?.name || "All Cost Centers",
      locationName: b.location?.name || "All Locations",
    };
  });

  const totalBudgeted = items.reduce((acc, curr) => acc + curr.budgeted, 0);
  const totalSpent = items.reduce((acc, curr) => acc + curr.spent, 0);
  const totalCommitted = items.reduce((acc, curr) => acc + curr.committed, 0);
  const totalVariance = totalBudgeted - (totalSpent + totalCommitted);

  return {
    items,
    totalBudgeted,
    totalSpent,
    totalCommitted,
    totalVariance,
  };
}
