"use server";

import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { MemberRole, MembershipStatus } from "@repo/db";

export async function getStaffMembers() {
  const session = await getServerAuth();
  if (!session || !session.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  const members = await db.member.findMany({
    where: {
      organizationId: session.organizationId,
      deletedAt: null,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      customRoles: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return { success: true, data: members };
}

export async function addStaffMember(data: {
  email: string;
  name: string;
  role: MemberRole;
  password?: string;
}) {
  const session = await getServerAuth();
  if (!session || !session.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  // Only admins/owners can add staff
    const userRole = (session.user as any).role;
    if (userRole !== "ADMIN" && userRole !== "OWNER") {
        return { success: false, error: "Forbidden: Only admins can manage staff" };
  }

  try {
    // Check if user exists
    let user = await db.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      // Create user using better-auth admin API
      const password = data.password ||
        Array.from(require('crypto').randomBytes(12))
          .map((b: any) => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+"[b % 74])
          .join('');

      await (auth.api as any).createUser({
        headers: await headers(),
        body: {
            email: data.email,
            password: password,
            name: data.name,
        }
      });

      // The user is created, now find it to get the ID
      user = await db.user.findUnique({
        where: { email: data.email },
      });
    }

    if (!user) {
        return { success: false, error: "Failed to create or find user" };
    }

    // Check if already a member
    const existingMember = await db.member.findUnique({
      where: {
        organizationId_userId: {
          organizationId: session.organizationId,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      return { success: false, error: "User is already a member of this organization" };
    }

    // Create member record
    await db.member.create({
      data: {
        organizationId: session.organizationId,
        userId: user.id,
        role: data.role,
        email: data.email,
        isActive: true,
      },
    });

    revalidatePath("/staff");
    return { success: true };
  } catch (error: any) {
    console.error("Error adding staff member:", error);
    return { success: false, error: error.message || "Failed to add staff member" };
  }
}

export async function updateMemberRole(memberId: string, role: MemberRole) {
  const session = await getServerAuth();
  if (!session || !session.organizationId) return { success: false, error: "Unauthorized" };

  await db.member.update({
    where: { id: memberId, organizationId: session.organizationId },
    data: { role },
  });

  revalidatePath("/staff");
  return { success: true };
}

export async function blockMember(memberId: string, reason: string) {
  const session = await getServerAuth();
  if (!session || !session.organizationId) return { success: false, error: "Unauthorized" };

  await db.member.update({
    where: { id: memberId, organizationId: session.organizationId },
    data: {
      membershipStatus: "SUSPENDED",
      isActive: false,
      banReason: reason,
    },
  });

  revalidatePath("/staff");
  return { success: true };
}

export async function unblockMember(memberId: string) {
  const session = await getServerAuth();
  if (!session || !session.organizationId) return { success: false, error: "Unauthorized" };

  await db.member.update({
    where: { id: memberId, organizationId: session.organizationId },
    data: {
      membershipStatus: "ACTIVE",
      isActive: true,
      banReason: null,
    },
  });

  revalidatePath("/staff");
  return { success: true };
}

export async function getMemberSessions(userId: string) {
    const session = await getServerAuth();
    if (!session || !session.organizationId) return { success: false, error: "Unauthorized" };

    // Verify user belongs to the same organization
    const membership = await db.member.findUnique({
        where: {
            organizationId_userId: {
                organizationId: session.organizationId,
                userId: userId,
            },
        },
    });

    if (!membership) return { success: false, error: "Forbidden: User not in your organization" };

    const sessions = await db.session.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
    });

    return { success: true, data: sessions };
}

export async function revokeSession(token: string) {
    const session = await getServerAuth();
    if (!session || !session.organizationId) return { success: false, error: "Unauthorized" };

    const targetSession = await db.session.findUnique({
        where: { token },
        select: { userId: true },
    });

    if (!targetSession) return { success: false, error: "Session not found" };

    // Verify user belongs to the same organization
    const membership = await db.member.findUnique({
        where: {
            organizationId_userId: {
                organizationId: session.organizationId,
                userId: targetSession.userId,
            },
        },
    });

    if (!membership) return { success: false, error: "Forbidden" };

    await db.session.delete({
        where: { token },
    });

    return { success: true };
}

export async function getOrgCustomRoles() {
    const session = await getServerAuth();
    if (!session || !session.organizationId) return { success: false, error: "Unauthorized" };

    const roles = await db.customRole.findMany({
        where: { organizationId: session.organizationId, isActive: true },
    });

    return { success: true, data: roles };
}

export async function updateMemberCustomRoles(memberId: string, roleIds: string[]) {
    const session = await getServerAuth();
    if (!session || !session.organizationId) return { success: false, error: "Unauthorized" };

    await db.member.update({
        where: { id: memberId, organizationId: session.organizationId },
        data: {
            customRoles: {
                set: roleIds.map(id => ({ id })),
            },
        },
    });

    revalidatePath("/staff");
    return { success: true };
}
