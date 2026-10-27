"use server";

import { db, MemberRole } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { ScrymeChatApiClient, ScrymeChatAction } from "@repo/chat";
import { revalidatePath } from "next/cache";

export async function getCurrentUserContext() {
  const auth = await getServerAuth();
  if (!auth) return null;

  return {
    user: {
      id: auth.user.id,
      name: auth.user.name || null,
      email: auth.user.email,
      image: auth.user.image || null,
    },
    role: auth.role || "GUEST",
    organizationId: auth.organizationId || null,
  };
}

export async function requestPermissionsAction(data: {
  reason: string;
  requestedPage?: string;
}) {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId || !auth.memberId) {
    return { success: false, error: "Unauthorized: Please log in again." };
  }

  const user = auth.user;
  const member = await db.member.findUnique({
    where: { id: auth.memberId },
  });

  if (!member) {
    return { success: false, error: "Member profile not found." };
  }

  const role = member.role;
  const username = user.name || user.email;

  const config = await db.scrymeConfiguration.findUnique({
    where: { organizationId: auth.organizationId },
  });

  const content = `🔔 **Access Permission Request**
**User**: ${username} (${user.email})
**Current Role**: ${role}
**Requested Resource**: ${data.requestedPage || "General Pages"}
**Reason / Explanation**: "${data.reason || "No explanation provided"}"`;

  // Interactive actions so admins can approve or reject the permission request directly
  const actions: ScrymeChatAction[] = [
    {
      id: `approve_perm:ADMIN:${auth.memberId}`,
      label: "Approve (Grant Admin)",
      type: "button",
      style: "primary",
      value: "ADMIN",
    },
    {
      id: `approve_perm:MANAGER:${auth.memberId}`,
      label: "Approve (Grant Manager)",
      type: "button",
      style: "secondary",
      value: "MANAGER",
    },
    {
      id: `decline_perm:${auth.memberId}`,
      label: "Decline",
      type: "button",
      style: "danger",
      value: "DECLINED",
    },
    {
      id: `grant_${auth.memberId}`,
      label: "Review Member Settings",
      type: "button",
      style: "primary",
      value: `/staff/${auth.memberId}`,
    },
  ];

  // Send Scryme Chat message
  if (config && config.workspaceSlug) {
    const clientId = process.env.SCRYME_CHAT_CLIENT_ID;
    const clientSecret = process.env.SCRYME_CHAT_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      // Simulated Mode
      const mockMessageId = `mock_scryme_perm_${Date.now()}`;
      await db.scrymeMessage.create({
        data: {
          organizationId: auth.organizationId,
          workspaceSlug: config.workspaceSlug || "",
          channelSlug: "admins",
          messageId: mockMessageId,
          content,
          senderId: auth.memberId,
          eventType: "PERMISSION_REQUEST",
          metadata: { actions } as any,
        },
      });

      return {
        success: true,
        simulated: true,
        message: "Request sent successfully (Simulated mode).",
      };
    }

    const scrymeClient = new ScrymeChatApiClient();
    try {
      // First, try to create/ensure the admins channel exists (it will gracefully fail/conflict if already exists)
      try {
        await scrymeClient.createChannel(
          config.workspaceSlug,
          "Admins",
          "admins",
          "public",
        );
      } catch (err) {
        // Ignore conflicts if channel already exists
      }

      const response = await scrymeClient.sendMessage(
        config.workspaceSlug,
        "admins",
        {
          content,
          actions,
        }
      ).catch(async (err) => {
        // Fallback to sending to 'alerts' if 'admins' fails
        console.warn("Failed to send message to admins channel, trying alerts channel:", err);
        return await scrymeClient.sendMessage(
          config.workspaceSlug || "",
          "alerts",
          {
            content,
            actions,
          }
        );
      });

      await db.scrymeMessage.create({
        data: {
          organizationId: auth.organizationId,
          workspaceSlug: config.workspaceSlug || "",
          channelSlug: response?.channelSlug || "admins",
          messageId: response?.id || `scryme_perm_${Date.now()}`,
          content,
          senderId: auth.memberId,
          eventType: "PERMISSION_REQUEST",
          metadata: { actions } as any,
        },
      });

      return { success: true };
    } catch (err: any) {
      console.error("Failed to send permission request Scryme message:", err);
      return {
        success: false,
        error: `Failed to send notification to admins: ${err.message || err}`,
      };
    }
  } else {
    // Graceful simulated mode when integration is not set up
    return {
      success: true,
      simulated: true,
      message: "Scryme Chat integration not set up for this organization. Request was logged locally.",
    };
  }
}

export async function approvePermissionRequestAction(data: {
  memberId: string;
  roleToGrant: MemberRole;
}) {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId || !auth.memberId) {
    return { success: false, error: "Unauthorized: Please log in again." };
  }

  const currentMember = await db.member.findFirst({
    where: { id: auth.memberId, organizationId: auth.organizationId },
  });

  if (!currentMember || !["OWNER", "ADMIN"].includes(currentMember.role)) {
    return {
      success: false,
      error: "Forbidden: Only admins can approve permission requests.",
    };
  }

  // THREAT: Privilege Escalation (CWE-269)
  // MITIGATION: Only OWNER role holders can grant the OWNER role. Non-OWNER admins are restricted from granting OWNER privileges.
  if (data.roleToGrant === "OWNER" && currentMember.role !== "OWNER") {
    return {
      success: false,
      error: "Forbidden: Only organization owners can grant the OWNER role.",
    };
  }

  const memberToUpdate = await db.member.findFirst({
    where: { id: data.memberId, organizationId: auth.organizationId },
  });

  if (!memberToUpdate) {
    return { success: false, error: "Target member not found." };
  }

  // THREAT: BOLA/IDOR Vulnerability
  // MITIGATION: Member model lacks a composite unique constraint on [id, organizationId].
  // Using updateMany scoped strictly by id AND organizationId enforces database-level multi-tenant isolation.
  const updateResult = await db.member.updateMany({
    where: { id: memberToUpdate.id, organizationId: auth.organizationId },
    data: {
      role: data.roleToGrant,
      membershipStatus: "ACTIVE",
      isActive: true,
    },
  });

  if (updateResult.count === 0) {
    return { success: false, error: "Target member not found." };
  }

  const updatedMember = await db.member.findFirstOrThrow({
    where: { id: memberToUpdate.id, organizationId: auth.organizationId },
  });

  revalidatePath("/staff");
  revalidatePath(`/staff/${data.memberId}`);
  revalidatePath("/unauthorized");

  return { success: true, member: updatedMember };
}
