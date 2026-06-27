/**
 * Bakery Stale Batch Cleanup
 *
 * Triggers the hourly cleanup of stale bakery batches.
 */

export async function main(
  data: {
    organizationId: string;
    gracePeriodHours?: string;
  },
  env: {
    DEALIO_API_URL: string;
    DEALIO_API_KEY: string;
    SLACK_WEBHOOK_URL?: string;
    DISCORD_WEBHOOK_URL?: string;
  },
) {
  const gracePeriodHours = data.gracePeriodHours || "4";
  console.log(
    `Triggering stale batch cleanup for organization: ${data.organizationId} (Grace period: ${gracePeriodHours}h)`,
  );

  const response = await fetch(
    `${env.DEALIO_API_URL}/api/v2/bakery/batches/automate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.DEALIO_API_KEY}`,
        "x-organization-id": data.organizationId,
      },
      body: JSON.stringify({
        action: "cleanup",
        gracePeriodHours,
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to trigger stale cleanup: ${response.status} ${errorText}`,
    );
  }

  const result = await response.json();
  console.log("Successfully triggered stale cleanup:", result);

  // Notifications
  const message = `🧹 *Bakery Stale Batch Cleanup Triggered*\n*Status:* Hourly cleanup process initiated for org ${data.organizationId}.`;

  if (env.SLACK_WEBHOOK_URL) {
    await fetch(env.SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message }),
    });
  }

  if (env.DISCORD_WEBHOOK_URL) {
    await fetch(env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message.replace(/\*/g, "**") }),
    });
  }

  return {
    success: true,
    organizationId: data.organizationId,
    timestamp: new Date().toISOString(),
  };
}
