// fallow-ignore-next-line unused-files
import { db } from '@repo/db';
import { sendNotification } from '../src/services/notification';

/**
 * @name Discord Sales Report
 * @description Fetches sales data, calculates branch performance, best sellers, and sends a report to Discord.
 */
export async function main(
  data: {
    organizationId: string;
    period: 'daily' | 'weekly' | 'monthly';
    templateName?: string;
  }
) {
  const { organizationId, period, templateName = 'DISCORD_SALES_REPORT' } = data;

  const now = new Date();
  let startDate: Date;
  let prevStartDate: Date;
  let prevEndDate: Date;

  if (period === 'daily') {
    startDate = new Date(now.setHours(0, 0, 0, 0));
    prevStartDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
    prevEndDate = new Date(startDate.getTime() - 1);
  } else if (period === 'weekly') {
    const day = now.getDay() || 7;
    startDate = new Date(now.setHours(0, 0, 0, 0));
    startDate.setDate(startDate.getDate() - day + 1);
    prevStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    prevEndDate = new Date(startDate.getTime() - 1);
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    prevEndDate = new Date(startDate.getTime() - 1);
  }

  // 1. Fetch current period transactions
  const currentTransactions = await db.transaction.findMany({
    where: {
      organizationId,
      type: 'POS_SALE',
      status: 'COMPLETED',
      createdAt: { gte: startDate }
    },
    include: {
      location: true,
      items: true
    }
  });

  // 2. Fetch previous period transactions
  const prevTransactions = await db.transaction.findMany({
    where: {
      organizationId,
      type: 'POS_SALE',
      status: 'COMPLETED',
      createdAt: { gte: prevStartDate, lte: prevEndDate }
    },
    include: {
      location: true
    }
  });

  // 3. Calculate metrics
  const totalRevenue = currentTransactions.reduce((sum, tx) => sum + Number(tx.finalTotal), 0);

  // Branch Performance
  const branchStats = new Map<string, { name: string; current: number; prev: number }>();

  currentTransactions.forEach(tx => {
    const loc = tx.location.name;
    const stats = branchStats.get(loc) || { name: loc, current: 0, prev: 0 };
    stats.current += Number(tx.finalTotal);
    branchStats.set(loc, stats);
  });

  prevTransactions.forEach(tx => {
    const loc = tx.location.name;
    const stats = branchStats.get(loc) || { name: loc, current: 0, prev: 0 };
    stats.prev += Number(tx.finalTotal);
    branchStats.set(loc, stats);
  });

  const branchPerformance = Array.from(branchStats.values()).map(b => ({
    branch: b.name,
    revenue: b.current.toFixed(2),
    growth: b.prev > 0 ? (((b.current - b.prev) / b.prev) * 100).toFixed(2) + '%' : 'N/A'
  }));

  // Best Sellers
  const productSales = new Map<string, { name: string; quantity: number; revenue: number }>();
  currentTransactions.forEach(tx => {
    tx.items.forEach(item => {
      const stats = productSales.get(item.variantId) || { name: item.productName, quantity: 0, revenue: 0 };
      stats.quantity += item.quantity;
      stats.revenue += Number(item.lineTotal);
      productSales.set(item.variantId, stats);
    });
  });

  const bestSellers = Array.from(productSales.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map(p => ({
      name: p.name,
      revenue: p.revenue.toFixed(2),
      qty: p.quantity
    }));

  // 4. Send Notification
  await sendNotification({
    organizationId,
    templateName,
    data: {
      period: period.toUpperCase(),
      totalRevenue: totalRevenue.toFixed(2),
      branches: branchPerformance,
      bestSellers: bestSellers,
      generatedAt: new Date().toLocaleString()
    },
    channels: ['DISCORD']
  });

  return {
    success: true,
    totalRevenue,
    branches: branchPerformance.length,
    bestSellers: bestSellers.length
  };
}
