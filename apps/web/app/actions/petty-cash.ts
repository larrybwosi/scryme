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

export async function getAllPettyCashTransactions() {
  const { auth } = await checkPermission([
    "OWNER",
    "ADMIN",
    "MANAGER",
    "REPORTER",
  ], true);

  return await db.pettyCashTransaction.findMany({
    where: {
      fund: {
        organizationId: auth.organizationId,
      },
    },
    include: {
      fund: {
        include: {
          location: true,
        },
      },
      member: {
        include: {
          user: true,
        },
      },
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

  // ⚡ Bolt Optimization & Threat Mitigation:
  // Parallelize independent relational ID validation queries concurrently via Promise.all
  // to collapse database execution latency from 2 sequential blocking roundtrips to 1 concurrent roundtrip
  // while preserving multi-tenant BOLA isolation checks.
  const [responsibleMember, location] = await Promise.all([
    data.responsibleMemberId
      ? db.member.findFirst({
          where: { id: data.responsibleMemberId, organizationId: auth.organizationId },
          select: { id: true },
        })
      : Promise.resolve(null),
    data.locationId
      ? db.inventoryLocation.findFirst({
          where: { id: data.locationId, organizationId: auth.organizationId },
          select: { id: true },
        })
      : Promise.resolve(null),
  ]);

  if (data.responsibleMemberId && !responsibleMember) {
    throw new Error("Responsible member not found or belongs to another organization");
  }

  if (data.locationId && !location) {
    throw new Error("Location not found or belongs to another organization");
  }

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
    // 🛡️ Sentinel: IDOR/BOLA Prevention - Use findFirst with organizationId filter
    // because PettyCashFund lacks a composite unique constraint on [id, organizationId].
    const fund = await tx.pettyCashFund.findFirst({
      where: { id: fundId, organizationId: auth.organizationId },
    });

    if (!fund) throw new Error("Fund not found");

    // THREAT: BOLA/IDOR Vulnerability
    // MITIGATION: PettyCashFund model lacks a composite unique constraint on [id, organizationId].
    // Using updateMany scoped strictly by id AND organizationId enforces database-level multi-tenant isolation.
    const updateResult = await tx.pettyCashFund.updateMany({
      where: { id: fundId, organizationId: auth.organizationId },
      data: {
        amount: { increment: data.amount },
      },
    });

    if (updateResult.count === 0) {
      throw new Error("Fund not found");
    }

    const updatedFund = await tx.pettyCashFund.findFirstOrThrow({
      where: { id: fundId, organizationId: auth.organizationId },
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

  // 🛡️ Sentinel: BOLA/IDOR Prevention - Verify fund belongs to organization before querying transactions
  const fund = await db.pettyCashFund.findFirst({
    where: { id: fundId, organizationId: auth.organizationId },
  });

  if (!fund) throw new Error("Fund not found");

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
