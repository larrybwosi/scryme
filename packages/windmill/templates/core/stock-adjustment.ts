/**
 * Core: Stock Adjustment Created
 * Path: f/dealio/core/stock-adjustment
 *
 * This is a professional template for stock adjustment monitoring and approval.
 */

export async function main(
  data: {
    organizationId: string;
    adjustmentId: string;
    variantName: string;
    locationName: string;
    quantity: number;
    reason: string;
    notes?: string;
    correlationId?: string;
  },
  env: {
    DEALIO_API_URL: string;
    DEALIO_API_KEY: string;
    DISCORD_WEBHOOK_URL?: string;
  },
) {
  const {
    organizationId,
    adjustmentId,
    variantName,
    locationName,
    quantity,
    reason,
  } = data;

  console.log(
    `[StockAdjustment] Monitoring ${adjustmentId}: ${variantName} at ${locationName} by ${quantity}`,
  );

  // High-value adjustments might require human intervention.
  // For this template, we auto-approve standard adjustments.

  const response = await fetch(
    `${env.DEALIO_API_URL}/api/v3/webhooks/windmill/approval`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.DEALIO_API_KEY}`,
      },
      body: JSON.stringify({
        jobId: process.env.WM_JOB_ID || "local-test",
        organizationId,
        status: "COMPLETED",
        correlationId: data.correlationId || "none",
        completedAt: new Date().toISOString(),
        decision: "APPROVED",
        decidedBy: "Windmill Inventory Bot",
        entityId: adjustmentId,
        entityType: "StockAdjustment",
        workflowRef: "f/dealio/core/stock-adjustment",
        comments: "Standard inventory adjustment processed.",
        triggeredAt: new Date().toISOString(),
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to submit adjustment callback: ${response.status} ${errorText}`,
    );
  }

  return await response.json();
}
