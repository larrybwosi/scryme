/**
 * Bakery Daily Waste & Yield Report
 *
 * Generates a report of bakery production, waste, and yield.
 */

export async function main(
  data: {
    organizationId: string;
  },
  env: {
    DEALIO_API_URL: string;
    DEALIO_API_KEY: string;
    MANAGER_EMAIL?: string;
    SLACK_WEBHOOK_URL?: string;
    DISCORD_WEBHOOK_URL?: string;
    // For Email, we might need a dedicated email service resource in Windmill,
    // but for now we'll assume a generic SMTP or similar if provided,
    // or just use a mock fetch if we had an internal mailer.
    // In Windmill, it's better to use the 'email' resource type.
  },
) {
  console.log(
    `Generating waste & yield report for organization: ${data.organizationId}`,
  );

  const response = await fetch(
    `${env.DEALIO_API_URL}/api/bakery/reports/revenue`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${env.DEALIO_API_KEY}`,
        "x-organization-id": data.organizationId,
      },
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch report data: ${response.status} ${errorText}`,
    );
  }

  const reportData = await response.json();
  const { summary } = reportData;

  console.log("Report Data summary:", summary);

  const message = `📈 *Bakery Daily Production & Waste Report*
*Total Batches:* ${summary.totalBatches}
*Waste Quantity:* ${summary.totalWaste}
*Total Yield Value:* ${summary.totalRetailValue}`;

  // Slack
  if (env.SLACK_WEBHOOK_URL) {
    await fetch(env.SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message }),
    });
  }

  // Discord
  if (env.DISCORD_WEBHOOK_URL) {
    await fetch(env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message.replace(/\*/g, "**") }),
    });
  }

  // Email (Simplified mock or logic)
  if (env.MANAGER_EMAIL) {
    console.log(`Email report would be sent to ${env.MANAGER_EMAIL}`);
    // In a real Windmill environment, you'd use a dedicated Email resource.
  }

  return {
    success: true,
    summary,
    timestamp: new Date().toISOString(),
  };
}
