"use server";

import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { ScrymeChatApiClient } from "@repo/scryme";

export async function getCurrentUserContext() {
  const auth = await getServerAuth();
  if (!auth) return null;

  return {
    user: {
      id: auth.user.id,
      name: auth.user.name,
      email: auth.user.email,
      image: auth.user.image,
    },
    role: auth.role,
    organizationId: auth.organizationId,
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
          workspaceSlug: config.workspaceSlug,
          channelSlug: "admins",
          messageId: mockMessageId,
          content,
          senderId: auth.memberId,
          eventType: "PERMISSION_REQUEST",
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
          actions: [
            {
              id: `grant_${auth.memberId}`,
              label: "Review Member Settings",
              type: "button",
              style: "primary",
              value: `/staff/${auth.memberId}`,
            }
          ]
        }
      ).catch(async (err) => {
        // Fallback to sending to 'alerts' if 'admins' fails
        console.warn("Failed to send message to admins channel, trying alerts channel:", err);
        return await scrymeClient.sendMessage(
          config.workspaceSlug,
          "alerts",
          {
            content,
            actions: [
              {
                id: `grant_${auth.memberId}`,
                label: "Review Member Settings",
                type: "button",
                style: "primary",
                value: `/staff/${auth.memberId}`,
              }
            ]
          }
        );
      });

      await db.scrymeMessage.create({
        data: {
          organizationId: auth.organizationId,
          workspaceSlug: config.workspaceSlug,
          channelSlug: response?.channelSlug || "admins",
          messageId: response?.id || `scryme_perm_${Date.now()}`,
          content,
          senderId: auth.memberId,
          eventType: "PERMISSION_REQUEST",
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
