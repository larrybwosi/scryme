import { ScrymeChatApiClient } from "@repo/scryme";
import { env } from "@repo/env";

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
    const scrymeClient = new ScrymeChatApiClient(apiUrl, clientId, clientSecret);
    await scrymeClient.sendMessage(workspaceSlug, channelSlug, {
      content,
    });
  } catch (error: any) {
    console.error(`Failed to send system notification via Scryme Chat: ${error.message}`);
  }
}
