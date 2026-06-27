/**
 * Core: Purchase Approval Workflow
 * Path: f/dealio/core/purchase-approval
 *
 * This is a professional template for human-in-the-loop purchase order approval.
 */

export async function main(
  data: {
    organizationId: string;
    purchaseOrderId: string;
    orderNumber: string;
    requestedBy: string;
    totalAmount: number;
    currency: string;
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
    purchaseOrderId,
    orderNumber,
    requestedBy,
    totalAmount,
    currency,
  } = data;

  console.log(
    `[PurchaseApproval] Processing PO ${orderNumber} for ${requestedBy}: ${currency} ${totalAmount}`,
  );

  // Simulate a decision
  const decision = "APPROVED";
  const decidedBy = "Windmill PO Auditor";

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
        decision,
        decidedBy,
        entityId: purchaseOrderId,
        entityType: "PurchaseOrder",
        workflowRef: "f/dealio/core/purchase-approval",
        comments: "PO verified and approved.",
        triggeredAt: new Date().toISOString(),
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to submit PO approval callback: ${response.status} ${errorText}`,
    );
  }

  return await response.json();
}
