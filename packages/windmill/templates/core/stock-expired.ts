/**
 * Core: Stock Expired
 * Path: f/dealio/core/stock-expired
 *
 * Professional template for processing expired inventory notifications.
 */

export async function main(
  data: {
    organizationId: string,
    batchId: string,
    variantName: string,
    quantity: number,
    expiredAt: string,
    correlationId?: string,
  },
  env: {
    DEALIO_API_URL: string;
    DEALIO_API_KEY: string;
    DISCORD_WEBHOOK_URL?: string;
  }
) {
  const { organizationId, variantName, quantity, expiredAt } = data;

  console.log(`[StockExpired] ${variantName} (Batch: ${data.batchId}) expired on ${expiredAt}. Qty: ${quantity}`);

  const response = await fetch(`${env.DEALIO_API_URL}/api/v3/webhooks/windmill/outcome`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.DEALIO_API_KEY}`,
    },
    body: JSON.stringify({
      jobId: process.env.WM_JOB_ID || 'local-test',
      organizationId,
      status: 'COMPLETED',
      correlationId: data.correlationId || 'none',
      completedAt: new Date().toISOString(),
      summary: `Loss Prevention: ${quantity} units of ${variantName} expired.`,
      workflowRef: 'f/dealio/core/stock-expired',
      relatedEntityType: 'StockBatch',
      relatedEntityId: data.batchId,
      triggeredAt: new Date().toISOString()
    })
  });

  return await response.json();
}
