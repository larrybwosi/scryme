"use server";

import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { revalidatePath } from "next/cache";

export async function getPendingInvitations() {
  const auth = await getServerAuth();
  if (!auth) return { success: false, error: "Unauthorized" };

  const invitations = await db.invitation.findMany({
    where: {
      email: auth.user.email,
      status: "PENDING",
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          description: true,
        },
      },
      inviter: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  return { success: true, data: invitations };
}

export async function acceptInvitationByToken(token: string) {
  const auth = await getServerAuth();
  if (!auth) return { success: false, error: "Unauthorized" };

  const invitation = await db.invitation.findUnique({
    where: { token },
  });

  if (!invitation || invitation.status !== "PENDING") {
    return { success: false, error: "Invalid or expired invitation" };
  }

  // Create member
  await db.member.create({
    data: {
      organizationId: invitation.organizationId,
      userId: auth.user.id,
      role: invitation.role,
    },
  });

  // Update invitation status
  await db.invitation.update({
    where: { id: invitation.id },
    data: { status: "ACCEPTED" },
  });

  // Update user's active organization
  await db.user.update({
    where: { id: auth.user.id },
    data: { activeOrganizationId: invitation.organizationId },
  });

  // Clear session cache to reflect the new organization immediately
  try {
    const { getUpstashRedis } = await import("@repo/shared");
    const redis = getUpstashRedis();
    await redis.del(`session-cache:${auth.user.id}`);
  } catch (e) {
    console.error("Failed to clear session cache:", e);
  }

  revalidatePath("/");
  return { success: true };
}
