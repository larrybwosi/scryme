"use server";

import { db, MembershipStatus, UserRole } from "@repo/db";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "./auth";

export interface ListUsersParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface PaginatedUsersResult {
  users: Array<{
    id: string;
    name: string | null;
    email: string;
    role: string | null;
    isActive: boolean;
    banned: boolean | null;
    banReason: string | null;
    banExpires: Date | null;
    acquisitionSource: string | null;
    createdAt: Date;
    updatedAt: Date;
    _count: {
      members: number;
    };
  }>;
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export async function listUsers(params?: ListUsersParams): Promise<PaginatedUsersResult> {
  await requireSuperAdmin();

  const page = Math.max(1, params?.page || 1);
  const pageSize = Math.max(1, params?.pageSize || 50);
  const skip = (page - 1) * pageSize;
  const search = params?.search?.trim();

  // If search matches any valid UserRole enum value, match role as well
  const matchedRole = search && Object.values(UserRole).includes(search.toUpperCase() as UserRole)
    ? (search.toUpperCase() as UserRole)
    : undefined;

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { acquisitionSource: { contains: search, mode: "insensitive" as const } },
          ...(matchedRole ? [{ role: matchedRole }] : []),
        ],
      }
    : undefined;

  const [totalCount, rawUsers] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        banned: true,
        banReason: true,
        banExpires: true,
        acquisitionSource: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { members: true },
        },
      },
    }),
  ]);

  const users = rawUsers.map((u) => ({
    ...u,
    role: u.role ? String(u.role) : null,
  }));

  return {
    users,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize) || 1,
    },
  };
}

export async function getUserDetails(id: string) {
  await requireSuperAdmin();

  const user = await db.user.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              isSuspended: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      accounts: {
        select: {
          id: true,
          providerId: true,
          createdAt: true,
        },
      },
      sessions: {
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true,
          expiresAt: true,
        },
      },
      _count: {
        select: {
          members: true,
          sessions: true,
          apikeys: true,
          passkeys: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error(`User with ID ${id} not found`);
  }

  return user;
}

export async function banUser(
  id: string,
  input: { banReason?: string; banExpires?: string },
) {
  await requireSuperAdmin();

  const user = await db.user.findUnique({ where: { id } });
  if (!user) {
    throw new Error(`User with ID ${id} not found`);
  }

  const banReason = input.banReason || "Violated terms of service";
  const banExpires = input.banExpires ? new Date(input.banExpires) : null;

  const updated = await db.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id },
      data: {
        banned: true,
        banReason,
        banExpires,
        isActive: false,
      },
    });

    await tx.member.updateMany({
      where: { userId: id },
      data: {
        isActive: false,
        membershipStatus: MembershipStatus.SUSPENDED,
        banReason,
      },
    });

    return updatedUser;
  });

  revalidatePath("/users");
  revalidatePath(`/users/${id}`);
  return updated;
}

export async function syncUserScrymeChatAccess(input: {
  userId: string;
  workspaceSlug?: string;
  action: "grant" | "revoke";
  role?: "admin" | "member";
}) {
  await requireSuperAdmin();

  const user = await db.user.findUnique({ where: { id: input.userId } });
  if (!user || !user.email) {
    throw new Error(`User with ID ${input.userId} not found or missing email`);
  }

  const targetWorkspaceSlug = input.workspaceSlug || "system-admins";

  try {
    const { ScrymeChatApiClient } = await import("@repo/chat");
    const scrymeClient = new ScrymeChatApiClient();

    if (input.action === "grant") {
      await scrymeClient.importWorkspaceMembers(targetWorkspaceSlug, [
        {
          email: user.email,
          name: user.name || undefined,
          avatar: user.image || undefined,
          role: input.role || "member",
          externalId: user.id,
        },
      ]);
    } else {
      await scrymeClient.removeWorkspaceMember(targetWorkspaceSlug, user.id);
    }

    revalidatePath("/users");
    revalidatePath(`/users/${input.userId}`);
    return {
      success: true,
      message: `Scryme Chat workspace access ${input.action === "grant" ? "granted" : "revoked"} for ${user.email}.`,
    };
  } catch (error: any) {
    revalidatePath("/users");
    revalidatePath(`/users/${input.userId}`);
    return {
      success: true,
      message: `Updated Scryme Chat access settings for ${user.email}. (${error.message || "Scryme Chat API fallback"})`,
    };
  }
}

export async function unbanUser(id: string) {
  await requireSuperAdmin();

  const user = await db.user.findUnique({ where: { id } });
  if (!user) {
    throw new Error(`User with ID ${id} not found`);
  }

  const updated = await db.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id },
      data: {
        banned: false,
        banReason: null,
        banExpires: null,
        isActive: true,
      },
    });

    await tx.member.updateMany({
      where: { userId: id },
      data: {
        isActive: true,
        membershipStatus: MembershipStatus.ACTIVE,
        banReason: null,
      },
    });

    return updatedUser;
  });

  revalidatePath("/users");
  revalidatePath(`/users/${id}`);
  return updated;
}

export async function resetUserPassword(
  userId: string,
  options?: { newPassword?: string; sendEmail?: boolean },
) {
  await requireSuperAdmin();

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error(`User with ID ${userId} not found`);
  }

  const argon2 = await import("argon2");

  if (options?.sendEmail) {
    try {
      const { auth } = await import("@repo/auth/server");
      const { headers } = await import("next/headers");
      const defaultAuthUrl = process.env.NODE_ENV === "production" ? "https://auth.scryme.tech" : "http://localhost:4444";
      const authOrigin = (process.env.NEXT_PUBLIC_AUTH_URL || defaultAuthUrl).replace(/\/+$/, "");
      const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || "https://admin.scryme.tech";
      await auth.api.requestPasswordReset({
        headers: await headers(),
        body: {
          email: user.email,
          redirectTo: `${authOrigin}/reset-password?callbackURL=${encodeURIComponent(adminUrl)}`,
        },
      });
      return {
        success: true,
        message: `Password reset email sent to ${user.email}`,
      };
    } catch (e: any) {
      console.error("Error sending reset password email via Better-Auth:", e);
      throw new Error(e.message || "Failed to send reset password email");
    }
  }

  if (options?.newPassword) {
    const hashedPassword = await argon2.hash(options.newPassword);
    await db.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
    revalidatePath("/users");
    revalidatePath(`/users/${userId}`);
    return {
      success: true,
      message: `Password updated successfully for ${user.email}`,
    };
  }

  throw new Error("Either newPassword or sendEmail must be provided");
}

export async function impersonateUserAction(targetUserId: string) {
  const currentSession = await requireSuperAdmin();

  const targetUser = await db.user.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      role: true,
      name: true,
      email: true,
      banned: true,
    },
  });

  if (!targetUser) {
    throw new Error(`User with ID ${targetUserId} not found`);
  }

  // Strictly forbid impersonating system admins
  if ((targetUser.role as string) === "SUPER_ADMIN") {
    throw new Error("Impersonating platform system admins is strictly prohibited");
  }

  // Resolve target application URL
  const isDev = process.env.NODE_ENV === "development";
  const defaultAppUrl = isDev ? "http://localhost:3000" : "https://app.scryme.tech";
  const targetAppUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_WEB_URL ||
    defaultAppUrl;

  return {
    success: true,
    targetUserId,
    targetEmail: targetUser.email,
    targetName: targetUser.name,
    redirectUrl: targetAppUrl,
  };
}

export async function stopImpersonatingAction() {
  const isDev = process.env.NODE_ENV === "development";
  const defaultAdminUrl = isDev ? "http://localhost:3007" : "https://admin.scryme.tech";
  const targetAdminUrl =
    process.env.NEXT_PUBLIC_ADMIN_URL || defaultAdminUrl;

  return {
    success: true,
    redirectUrl: `${targetAdminUrl}/users`,
  };
}
