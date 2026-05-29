/**
 * Finance: High Value Transaction Alert
 * Path: f/dealio/finance/high-value-alert
 */
export async function main(
  organizationId: string,
  transactionId: string,
  amount: number,
  currency: string,
  type: string
) {
  console.log(`[HighValueAlert] Large ${type} detected: ${currency} ${amount}`);
  return { success: true };
}
