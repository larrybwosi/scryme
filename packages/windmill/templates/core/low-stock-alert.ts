/**
 * Core: Low Stock Alert
 * Path: f/dealio/core/low-stock-alert
 *
 * Professional template for inventory monitoring and alerting.
 */

export async function main(
  data: {
    organizationId: string,
    stockItemId: string,
    productName: string,
    currentQuantity: number,
    reorderPoint: number,
    warehouseId?: string,
    correlationId?: string,
  },
  env: {
    DEALIO_API_URL: string;
    DEALIO_API_KEY: string;
    DISCORD_WEBHOOK_URL?: string;
  }
) {
  const { organizationId, productName, currentQuantity, reorderPoint } = data;

  console.log(`[LowStockAlert] ${productName} is low: ${currentQuantity} (Threshold: ${reorderPoint})`);

  // Forward to outcome API for tracking/auditing
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
      summary: `Inventory Alert: ${productName} stock is low (${currentQuantity}).`,
      workflowRef: 'f/dealio/core/low-stock-alert',
      relatedEntityType: 'ProductVariant',
      relatedEntityId: data.stockItemId,
      triggeredAt: new Date().toISOString()
    })
  });

  return await response.json();
}
