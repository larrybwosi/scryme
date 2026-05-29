/**
 * Core: Stock Transfer Created
 * Path: f/dealio/core/stock-transfer-created
 */
export async function main(
  organizationId: string,
  transferId: string,
  transferNumber: string,
  fromLocation: string,
  toLocation: string,
  priority: string,
  items: any[]
) {
  console.log(`[StockTransfer] Created: ${transferNumber} from ${fromLocation} to ${toLocation}`);
  return { success: true };
}
