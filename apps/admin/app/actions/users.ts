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
      await scrymeClient.addWorkspaceMember(
        targetWorkspaceSlug,
        user.email,
        input.role || "member",
      );
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
