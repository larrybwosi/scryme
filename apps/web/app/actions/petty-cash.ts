"use server";

import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  MemberRole,
  PettyCashFund,
  PettyCashTransaction,
  PettyCashTransactionType,
} from "@repo/db/client";

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

export async function getPettyCashFunds() {
  const { auth } = await checkPermission([
    "OWNER",
    "ADMIN",
    "MANAGER",
    "REPORTER",
  ], true);

  return await db.pettyCashFund.findMany({
    where: { organizationId: auth.organizationId },
    include: {
      responsibleMember: {
        include: {
          user: true,
        },
      },
      location: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createPettyCashFund(data: {
  name: string;
  floatAmount: number;
  currencyCode: string;
  responsibleMemberId: string;
  locationId?: string;
}) {
  const { auth } = await checkPermission(["OWNER", "ADMIN"]);

  const fund = await db.pettyCashFund.create({
    data: {
      organizationId: auth.organizationId,
      name: data.name,
      floatAmount: data.floatAmount,
      amount: data.floatAmount,
      currencyCode: data.currencyCode,
      responsibleMemberId: data.responsibleMemberId,
      locationId: data.locationId || null,
    },
    include: {
      responsibleMember: {
        include: {
          user: true,
        },
      },
      location: true,
    },
  });

  revalidatePath("/finance/petty-cash");
  return fund;
}

export async function topUpPettyCashFund(
  fundId: string,
  data: {
    amount: number;
    description?: string;
  },
) {
  const { auth } = await checkPermission(["OWNER", "ADMIN", "MANAGER"]);

  return await db.$transaction(async tx => {
    const fund = await tx.pettyCashFund.findUnique({
      where: { id: fundId },
    });

    if (!fund) throw new Error("Fund not found");

    const updatedFund = await tx.pettyCashFund.update({
      where: { id: fundId },
      data: {
        amount: { increment: data.amount },
      },
    });

    await tx.pettyCashTransaction.create({
      data: {
        fundId,
        type: "TOP_UP" as PettyCashTransactionType,
        amount: data.amount,
        description: data.description || "Manual top up",
        memberId: auth.memberId as string,
      },
    });

    revalidatePath("/finance/petty-cash");
    return updatedFund;
  });
}

export async function getPettyCashTransactions(fundId: string) {
  const { auth } = await checkPermission([
    "OWNER",
    "ADMIN",
    "MANAGER",
    "REPORTER",
  ], true);

  return await db.pettyCashTransaction.findMany({
    where: { fundId },
    include: {
      member: {
        include: {
          user: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
