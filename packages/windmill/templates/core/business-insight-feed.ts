/**
 * Core: Business Insight Feed
 * Path: f/dealio/core/business-insight-feed
 *
 * Professional template for processing and distributing business insight reports.
 */

export async function main(
  data: {
    organizationId: string,
    reportName: string,
    period: string,
    summary: any,
    topProducts: any[],
    lowStockItems: any[],
    correlationId?: string,
  },
  env: {
    DEALIO_API_URL: string;
    DEALIO_API_KEY: string;
    DISCORD_WEBHOOK_URL?: string;
  }
) {
  const { organizationId, reportName, period, summary } = data;

  console.log(`[BusinessInsight] Processing "${reportName}" for ${organizationId} (${period})`);

  // Log the successful report generation/distribution
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
      summary: `Business Insights Distributed: "${reportName}" (${period})`,
      workflowRef: 'f/dealio/core/business-insight-feed',
      triggeredAt: new Date().toISOString()
    })
  });

  return await response.json();
}
