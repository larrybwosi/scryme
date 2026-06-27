/**
 * Customer Synced
 * Path: f/dealio/customer_synced
 */

export async function main(
  organizationId: string,
  customerId: string,
  name: string,
  email?: string,
  action?: "created" | "updated",
  provider?: string,
) {
  console.log(
    `[CustomerSynced] Customer ${name} (${customerId}) ${action} via ${provider}`,
  );

  return {
    success: true,
    customerId,
    timestamp: new Date().toISOString(),
  };
}
