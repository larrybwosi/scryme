/**
 * Bakery Daily Batch Generator
 *
 * Triggers the daily generation of bakery batches and notifies stakeholders.
 */

export async function main(
  data: {
    organizationId: string;
  },
  env: {
    DEALIO_API_URL: string;
    DEALIO_API_KEY: string;
    SLACK_WEBHOOK_URL?: string;
    DISCORD_WEBHOOK_URL?: string;
  }
) {
  console.log(`Triggering daily batch generation for organization: ${data.organizationId}`);

  const response = await fetch(`${env.DEALIO_API_URL}/api/v2/bakery/batches/automate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.DEALIO_API_KEY}`,
      'x-organization-id': data.organizationId // Ensure org context
    },
    body: JSON.stringify({ action: 'generate' })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to trigger daily generation: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  console.log('Successfully triggered daily generation:', result);

  // Notifications
  const message = `🍞 *Bakery Daily Batch Generation Triggered*\n*Status:* Automated process initiated for org ${data.organizationId}.`;

  if (env.SLACK_WEBHOOK_URL) {
    await fetch(env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message })
    });
  }

  if (env.DISCORD_WEBHOOK_URL) {
    await fetch(env.DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message.replace(/\*/g, '**') })
    });
  }

  return {
    success: true,
    organizationId: data.organizationId,
    timestamp: new Date().toISOString()
  };
}
