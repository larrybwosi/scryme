// fallow-ignore-file unused-files, complexity, code-duplication
import { db } from "@repo/db";
import { notificationEngine } from "../../src/services/notification";

/**
 * @name Business Transaction Report
 * @description Fetches transaction data for a specified period and sends an aggregated report to admins and specified users.
 */
export async function main(data: {
  organizationId: string;
  period: "daily" | "weekly" | "monthly" | "custom";
  startDate?: string;
  endDate?: string;
  recipientUserIds?: string[];
  templateName?: string;
  channels?: string[];
}) {
  const {
    organizationId,
    period,
    startDate: customStart,
    endDate: customEnd,
    recipientUserIds = [],
    templateName = "BUSINESS_TRANSACTION_REPORT",
    channels = ["EMAIL", "DISCORD"],
  } = data;

  const now = new Date();
  const endDate = new Date(now);
  let startDate: Date;

  if (period === "daily") {
    startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
  } else if (period === "weekly") {
    startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
    const day = startDate.getDay() || 7;
    startDate.setDate(startDate.getDate() - day + 1);
  } else if (period === "monthly") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  } else if (period === "custom" && customStart) {
    startDate = new Date(customStart);
    if (customEnd) {
      endDate.setTime(new Date(customEnd).getTime());
    }
  } else {
    // Default to daily if period is invalid or missing start for custom
    startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
  }

  // 1. Fetch transactions for the period
  const transactions = await db.transaction.findMany({
    where: {
      organizationId,
      status: "COMPLETED",
      createdAt: { gte: startDate, lte: endDate },
    },
    include: {
      location: true,
      items: true,
      payments: true,
    },
  });

  // 2. Aggregate metrics
  const totalRevenue = transactions.reduce(
    (sum: number, tx: any) => sum + Number(tx.finalTotal),
    0,
  );
  const transactionCount = transactions.length;

  // Branch Performance
  const branchStats = new Map<
    string,
    { name: string; revenue: number; count: number }
  >();
  transactions.forEach((tx: any) => {
    const loc = tx.location.name;
    const stats = branchStats.get(loc) || { name: loc, revenue: 0, count: 0 };
    stats.revenue += Number(tx.finalTotal);
    stats.count += 1;
    branchStats.set(loc, stats);
  });

  const branchPerformance = Array.from(branchStats.values()).map((b) => ({
    branch: b.name,
    revenue: b.revenue.toFixed(2),
    transactions: b.count,
  }));

  // Payment Methods
  const paymentStats = new Map<string, number>();
  transactions.forEach((tx: any) => {
    tx.payments.forEach((p: any) => {
      const method = p.method;
      const current = paymentStats.get(method) || 0;
      paymentStats.set(method, current + Number(p.amount));
    });
  });

  const paymentBreakdown = Array.from(paymentStats.entries()).map(
    ([method, amount]) => ({
      method,
      amount: amount.toFixed(2),
    }),
  );

  // Best Sellers
  const productSales = new Map<
    string,
    { name: string; quantity: number; revenue: number }
  >();
  transactions.forEach((tx: any) => {
    tx.items.forEach((item: any) => {
      const key = item.variantId;
      const stats = productSales.get(key) || {
        name: item.productName,
        quantity: 0,
        revenue: 0,
      };
      stats.quantity += item.quantity;
      stats.revenue += Number(item.lineTotal);
      productSales.set(key, stats);
    });
  });

  const bestSellers = Array.from(productSales.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map((p) => ({
      name: p.name,
      revenue: p.revenue.toFixed(2),
      qty: p.quantity,
    }));

  // 3. Resolve Recipients (Admins + Custom List)
  const recipients = {
    roles: ["OWNER", "ADMIN"],
    userIds: recipientUserIds,
  };

  // 4. Send Notification
  const reportData = {
    period: period.toUpperCase(),
    startDate: startDate.toLocaleDateString(),
    endDate: endDate.toLocaleDateString(),
    totalRevenue: totalRevenue.toFixed(2),
    transactionCount,
    branches: branchPerformance,
    payments: paymentBreakdown,
    bestSellers: bestSellers,
    generatedAt: new Date().toLocaleString(),
  };

  try {
    await notificationEngine.notify({
      organizationId,
      templateName,
      data: reportData,
      recipients,
      channels,
    });
  } catch (error: any) {
    console.error(
      `Failed to send business transaction report: ${error.message}`,
    );
    throw error;
  }

  return {
    success: true,
    metrics: {
      totalRevenue,
      transactionCount,
      branches: branchPerformance.length,
      bestSellers: bestSellers.length,
    },
  };
}
