/**
 * Core: Stock Request Workflow
 * Path: f/dealio/core/stock-request
 *
 * Professional template for processing and approving stock requests.
 */

export async function main(
  data: {
    organizationId: string;
    requestId: string;
    requestNumber: string;
    requestedBy: string;
    totalCost: number;
    items?: { variantName: string; quantity: number }[];
    correlationId?: string;
  },
  env: {
    DEALIO_API_URL: string;
    DEALIO_API_KEY: string;
    DISCORD_WEBHOOK_URL?: string;
  },
) {
  const { organizationId, requestId, requestNumber, requestedBy, totalCost } =
    data;

  console.log(
    `[StockRequest] Processing ${requestNumber} for ${requestedBy}: Total ${totalCost}`,
  );

  // Forward to outcome API for tracking
  const response = await fetch(
    `${env.DEALIO_API_URL}/api/v3/webhooks/windmill/outcome`,
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
        summary: `Stock Request ${requestNumber} received and logged.`,
        workflowRef: "f/dealio/core/stock-request",
        relatedEntityType: "StockRequest",
        relatedEntityId: requestId,
        triggeredAt: new Date().toISOString(),
      }),
    },
  );

  return await response.json();
}
