/**
 * Finance: Budget Exceeded Alert
 * Path: f/dealio/finance/budget-exceeded
 */
export async function main(
  organizationId: string,
  budgetId: string,
  budgetName: string,
  amountUsed: number,
  totalBudget: number,
  currency: string,
) {
  const percentage = (amountUsed / totalBudget) * 100;
  console.log(
    `[BudgetExceeded] Budget "${budgetName}" is at ${percentage.toFixed(1)}%`,
  );
  return { success: true };
}
