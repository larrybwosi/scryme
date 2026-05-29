/**
 * Core: Expense Approval Workflow
 * Path: f/dealio/core/expense-approval
 *
 * This is a professional template for human-in-the-loop expense approval.
 */

export async function main(
  data: {
    organizationId: string,
    expenseId: string,
    expenseNumber: string,
    requestedBy: string,
    amount: number,
    currency: string,
    description: string,
    correlationId?: string,
  },
  env: {
    DEALIO_API_URL: string;
    DEALIO_API_KEY: string;
    DISCORD_WEBHOOK_URL?: string;
  }
) {
  const { organizationId, expenseId, expenseNumber, requestedBy, amount, currency, description } = data;

  console.log(`[ExpenseApproval] Processing ${expenseNumber} for ${requestedBy}: ${currency} ${amount}`);

  // In a real scenario, this would send a Discord/Slack message with buttons
  // or an email to the manager. For this template, we simulate an approval.

  const decision = 'APPROVED'; // Simulate a decision
  const decidedBy = 'Windmill Manager Bot';

  const response = await fetch(`${env.DEALIO_API_URL}/api/v3/webhooks/windmill/approval`, {
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
      decision,
      decidedBy,
      entityId: expenseId,
      entityType: 'Expense',
      workflowRef: 'f/dealio/core/expense-approval',
      comments: 'Automatically approved via Windmill professional template.',
      triggeredAt: new Date().toISOString()
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to submit approval callback: ${response.status} ${errorText}`);
  }

  return await response.json();
}
