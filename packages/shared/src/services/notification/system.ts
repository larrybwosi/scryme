import { ScrymeChatApiClient } from "@repo/chat";
import { env } from "@repo/env";
import { db } from "@repo/db";

export interface SystemErrorAlertOptions {
  status: number;
  message: string;
  code?: string;
  method?: string;
  path?: string;
  correlationId?: string;
  organizationId?: string;
  userId?: string;
  sentryEventId?: string;
}

/**
 * Sends a system-wide notification to the configured Scryme Chat workspace and channel.
 * This is used for critical system events such as new user registration and other administrative alerts.
 */
export async function sendSystemNotification(content: string, options?: { channelSlug?: string }): Promise<void> {
  const clientId = env.SCRYME_CHAT_CLIENT_ID || process.env.SCRYME_CHAT_CLIENT_ID;
  const clientSecret = env.SCRYME_CHAT_CLIENT_SECRET || process.env.SCRYME_CHAT_CLIENT_SECRET;
  const workspaceSlug = env.SCRYME_SYSTEM_WORKSPACE_SLUG || process.env.SCRYME_SYSTEM_WORKSPACE_SLUG;
  const channelSlug = options?.channelSlug || env.SCRYME_SYSTEM_CHANNEL_SLUG || process.env.SCRYME_SYSTEM_CHANNEL_SLUG || "system-notifications";
  const apiUrl = env.SCRYME_CHAT_API_URL || process.env.SCRYME_CHAT_API_URL;

  if (!clientId || !clientSecret || !workspaceSlug) {
    console.warn(
      "Scryme system notification skipped: SCRYME_CHAT_CLIENT_ID, SCRYME_CHAT_CLIENT_SECRET, or SCRYME_SYSTEM_WORKSPACE_SLUG is not configured."
    );
    return;
  }

  try {
    const scrymeClient = new ScrymeChatApiClient();
    await scrymeClient.sendMessage(workspaceSlug, channelSlug, {
      content,
    });
  } catch (error: any) {
    console.error(`Failed to send system notification via Scryme Chat: ${error.message}`);
  }
}

/**
 * Custom admin-configured error notification dispatcher.
 * Checks database settings (system:error:alerts:enabled, system:error:alerts:minStatus, system:admin:chat:workspaceSlug, system:admin:chat:channelSlug)
 * and notifies system administrators in Scryme Chat when severe errors occur.
 */
export async function notifySystemAdminsOfError(errorInfo: SystemErrorAlertOptions): Promise<void> {
  try {
    // 1. Fetch settings from GlobalSetting DB table with env fallbacks
    let alertsEnabled = true;
    let minStatus = 500;
    let workspaceSlug =
      env.SCRYME_SYSTEM_WORKSPACE_SLUG ||
      process.env.SCRYME_SYSTEM_WORKSPACE_SLUG ||
      "system-admins";
    let channelSlug =
      env.SCRYME_SYSTEM_CHANNEL_SLUG ||
      process.env.SCRYME_SYSTEM_CHANNEL_SLUG ||
      "system-alerts";

    try {
      const settings = await db.globalSetting.findMany({
        where: {
          key: {
            in: [
              "system:error:alerts:enabled",
              "system:error:alerts:minStatus",
              "system:admin:chat:workspaceSlug",
              "system:admin:chat:channelSlug",
            ],
          },
        },
      });

      const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

      if (settingsMap.has("system:error:alerts:enabled")) {
        alertsEnabled = settingsMap.get("system:error:alerts:enabled") === "true";
      }
      if (settingsMap.has("system:error:alerts:minStatus")) {
        minStatus = parseInt(settingsMap.get("system:error:alerts:minStatus")!, 10);
      }
      if (settingsMap.get("system:admin:chat:workspaceSlug")) {
        workspaceSlug = settingsMap.get("system:admin:chat:workspaceSlug")!;
      }
      if (settingsMap.get("system:admin:chat:channelSlug")) {
        channelSlug = settingsMap.get("system:admin:chat:channelSlug")!;
      }
    } catch (dbErr: any) {
      // Fallback silently to defaults/env if DB lookup fails
    }

    if (!alertsEnabled || errorInfo.status < minStatus) {
      return;
    }

    const timestamp = new Date().toISOString();
    const formattedContent = [
      `🚨 **System Exception Alert** [HTTP ${errorInfo.status}]`,
      `**Method / Path:** \`${errorInfo.method || "UNKNOWN"} ${errorInfo.path || "/"}\``,
      `**Error Code:** \`${errorInfo.code || "INTERNAL_SERVER_ERROR"}\``,
      `**Message:** ${errorInfo.message}`,
      errorInfo.correlationId ? `**Correlation ID:** \`${errorInfo.correlationId}\`` : null,
      errorInfo.organizationId ? `**Tenant ID:** \`${errorInfo.organizationId}\`` : null,
      errorInfo.userId ? `**User ID:** \`${errorInfo.userId}\`` : null,
      errorInfo.sentryEventId ? `**Sentry Event:** \`${errorInfo.sentryEventId}\`` : null,
      `**Timestamp:** ${timestamp}`,
    ]
      .filter(Boolean)
      .join("\n");

    const scrymeClient = new ScrymeChatApiClient();
    await scrymeClient.sendMessage(workspaceSlug, channelSlug, {
      content: formattedContent,
    });
  } catch (error: any) {
    console.error(`Failed to dispatch error notification to Scryme Chat: ${error.message}`);
  }
}
