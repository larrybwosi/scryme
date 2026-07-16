"use server";

import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { revalidatePath } from "next/cache";
import { MemberRole } from "@repo/db";

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

  if (new Date() > invitation.expiresAt) {
    return { success: false, error: "Invitation has expired" };
  }

  // Check if user is already a member
  const existingMember = await db.member.findUnique({
    where: {
      organizationId_userId: {
        organizationId: invitation.organizationId,
        userId: auth.user.id,
      },
    },
  });

  if (!existingMember) {
    // Create member
    await db.member.create({
      data: {
        organizationId: invitation.organizationId,
        userId: auth.user.id,
        role: invitation.role,
      },
    });
  }

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
    const { getRedisClient } = await import("@repo/shared/redis");
    const redis = await getRedisClient();
    await redis.del(`session-cache:${auth.user.id}`);
  } catch (e) {
    console.error("Failed to clear session cache:", e);
  }

  revalidatePath("/");
  return { success: true };
}

export async function getInvitationByToken(token: string) {
  const invitation = await db.invitation.findUnique({
    where: { token },
    include: {
      organization: {
        select: {
          name: true,
          logo: true,
        },
      },
      inviter: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!invitation) {
    return { success: false, error: "Invitation not found" };
  }

  if (invitation.status !== "PENDING") {
    return { success: false, error: "Invitation has already been accepted or is inactive" };
  }

  if (new Date() > invitation.expiresAt) {
    return { success: false, error: "Invitation has expired" };
  }

  return { success: true, data: invitation };
}

export async function createOrgInvitation(data: {
  email: string;
  role: MemberRole;
}) {
  const session = await getServerAuth();
  if (!session || !session.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  // Permission check
  const memberRole = session.role as MemberRole;
  const isOwner = memberRole === "OWNER";
  const isAdmin = memberRole === "ADMIN";

  if (!isOwner && !isAdmin) {
    return { success: false, error: "Forbidden: Insufficient permissions" };
  }

  if (isAdmin) {
    const settings = await db.organizationSettings.findUnique({
      where: { organizationId: session.organizationId },
      select: { adminsCanManageStaff: true },
    });

    if (!settings?.adminsCanManageStaff) {
      return {
        success: false,
        error: "Forbidden: Admin staff management is disabled",
      };
    }
  }

  try {
    const crypto = await import("crypto");
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    // Check if user is already a member of this organization
    const userWithEmail = await db.user.findUnique({
      where: { email: data.email },
    });

    if (userWithEmail) {
      const existingMember = await db.member.findUnique({
        where: {
          organizationId_userId: {
            organizationId: session.organizationId,
            userId: userWithEmail.id,
          },
        },
      });

      if (existingMember) {
        return {
          success: false,
          error: "This user is already a member of your organization.",
        };
      }
    }

    // Check if there is already a PENDING invitation for this email in this organization
    const existingInvitation = await db.invitation.findFirst({
      where: {
        organizationId: session.organizationId,
        email: data.email,
        status: "PENDING",
      },
    });

    if (existingInvitation) {
      const updated = await db.invitation.update({
        where: { id: existingInvitation.id },
        data: {
          role: data.role,
          token,
          expiresAt,
          inviterId: session.user.id,
        },
      });
      revalidatePath("/staff");
      return { success: true, data: updated };
    }

    const invitation = await db.invitation.create({
      data: {
        organizationId: session.organizationId,
        email: data.email,
        role: data.role,
        token,
        expiresAt,
        inviterId: session.user.id,
      },
    });

    revalidatePath("/staff");
    return { success: true, data: invitation };
  } catch (error: any) {
    console.error("Error creating invitation:", error);
    return { success: false, error: error.message || "Failed to create invitation" };
  }
}

export async function revokeOrgInvitation(invitationId: string) {
  const session = await getServerAuth();
  if (!session || !session.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  // Permission check
  const memberRole = session.role as MemberRole;
  const isOwner = memberRole === "OWNER";
  const isAdmin = memberRole === "ADMIN";

  if (!isOwner && !isAdmin) {
    return { success: false, error: "Forbidden: Insufficient permissions" };
  }

  if (isAdmin) {
    const settings = await db.organizationSettings.findUnique({
      where: { organizationId: session.organizationId },
      select: { adminsCanManageStaff: true },
    });

    if (!settings?.adminsCanManageStaff) {
      return {
        success: false,
        error: "Forbidden: Admin staff management is disabled",
      };
    }
  }

  try {
    await db.invitation.delete({
      where: {
        id: invitationId,
        organizationId: session.organizationId,
      },
    });

    revalidatePath("/staff");
    return { success: true };
  } catch (error: any) {
    console.error("Error revoking invitation:", error);
    return { success: false, error: error.message || "Failed to revoke invitation" };
  }
}

export async function getOrgInvitations() {
  const session = await getServerAuth();
  if (!session || !session.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const invitations = await db.invitation.findMany({
      where: {
        organizationId: session.organizationId,
        status: "PENDING",
      },
      include: {
        inviter: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, data: invitations };
  } catch (error: any) {
    console.error("Error getting invitations:", error);
    return { success: false, error: error.message || "Failed to retrieve invitations" };
  }
}
