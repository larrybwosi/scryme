/**
 * Bakery Expiry Monitor & HITL Disposal
 *
 * Monitors for expiring batches and handles Human-In-The-Loop disposal decisions.
 * This script handles both the periodic check and the disposal action.
 */

export async function main(
  data: {
    action: 'check-expiration' | 'submit-disposal';
    organizationId: string;
    // Fields for submit-disposal
    batchId?: string;
    disposalAction?: 'DISPOSE' | 'REPURPOSE' | 'QUALITY_CHECK';
    disposalReason?: string;
    notes?: string;
    correlationId?: string;
  },
  env: {
    DEALIO_API_URL: string;
    DEALIO_API_KEY: string;
    SLACK_WEBHOOK_URL?: string;
    DISCORD_WEBHOOK_URL?: string;
    MANAGER_EMAIL?: string;
  }
) {
  if (data.action === 'check-expiration') {
    return await checkExpiration(data.organizationId, env);
  } else if (data.action === 'submit-disposal') {
    return await submitDisposal(data, env);
  } else {
    throw new Error(`Unknown action: ${data.action}`);
  }
}

async function checkExpiration(organizationId: string, env: any) {
  console.log(`Running expiry check for organization: ${organizationId}`);

  const response = await fetch(`${env.DEALIO_API_URL}/api/v2/bakery/batches/automate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.DEALIO_API_KEY}`,
      'x-organization-id': organizationId
    },
    body: JSON.stringify({ action: 'check-expiration' })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to run expiry logic: ${response.status} ${errorText}`);
  }

  return { success: true, message: 'Expiry check triggered' };
}

async function submitDisposal(data: any, env: any) {
  console.log(`Submitting disposal decision for batch ${data.batchId} in org ${data.organizationId}`);

  const response = await fetch(`${env.DEALIO_API_URL}/api/v3/webhooks/windmill/bakery/disposal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.DEALIO_API_KEY}`,
      'x-organization-id': data.organizationId
    },
    body: JSON.stringify({
      batchId: data.batchId,
      action: data.disposalAction,
      disposalReason: data.disposalReason,
      notes: data.notes,
      decidedBy: 'Windmill Automation',
      organizationId: data.organizationId,
      correlationId: data.correlationId,
      completedAt: new Date().toISOString()
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to submit disposal callback: ${response.status} ${errorText}`);
  }

  return await response.json();
}
