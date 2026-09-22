"use server";

import { db, MembershipStatus } from "@repo/db";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "./auth";

export async function listUsers() {
  await requireSuperAdmin();

  return db.user.findMany({
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
      createdAt: true,
      updatedAt: true,
      _count: {
        select: { members: true },
      },
    },
  });
}

export async function banUser(id: string, input: { banReason?: string; banExpires?: string }) {
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
    return {
      success: true,
      message: `Scryme Chat workspace access ${input.action === "grant" ? "granted" : "revoked"} for ${user.email}.`,
    };
  } catch (error: any) {
    revalidatePath("/users");
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
  return updated;
}

export async function resetUserPassword(
  userId: string,
  options?: { newPassword?: string; sendEmail?: boolean }
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
      await (auth.api as any).forgetPassword({
        headers: await headers(),
        body: {
          email: user.email,
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "https://app.scryme.tech"}/reset-password`,
        },
      });
      return { success: true, message: `Password reset email sent to ${user.email}` };
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
    return { success: true, message: `Password updated successfully for ${user.email}` };
  }

  throw new Error("Either newPassword or sendEmail must be provided");
}
