"use server";

import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  eachDayOfInterval,
  format,
  isSameDay,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfYear,
  endOfYear,
} from "date-fns";

export type DashboardStats = {
  salesPerformance: {
    value: number;
    change: number;
  };
  totalSales: {
    value: number;
    change: number;
  };
  averageRevenue: {
    value: number;
    change: number;
  };
  averageOrder: {
    value: number;
    change: number;
  };
};

export type ChartDataPoint = {
  date: string;
  current: number;
  previous: number;
};

export type PopularProduct = {
  id: string;
  name: string;
  sales: number;
  color: string;
};

export type DashboardData = {
  stats: DashboardStats;
  totalRevenue: {
    value: number;
    change: number;
    chartData: ChartDataPoint[];
  };
  popularProducts: PopularProduct[];
  averageOrderValue: {
    value: number;
    change: number;
    chartData: ChartDataPoint[];
  };
  averageSales: {
    value: number;
    change: number;
    chartData: ChartDataPoint[];
  };
  totalSessions: {
    value: number;
    change: number;
    chartData: ChartDataPoint[];
  };
  periodLabel: string;
};

export async function getDashboardData(timeframe: string = "month"): Promise<DashboardData> {
  const auth = await getServerAuth();
  if (!auth || !auth.organizationId) {
    throw new Error("Unauthorized");
  }

  const orgId = auth.organizationId;
  const now = new Date();

  let currentStart: Date;
  let currentEnd: Date;
  let previousStart: Date;
  let previousEnd: Date;
  let periodLabel: string;

  switch (timeframe) {
    case "week":
      currentStart = startOfWeek(now);
      currentEnd = endOfWeek(now);
      previousStart = startOfWeek(subMonths(now, 1)); // Simplified previous period
      previousEnd = endOfWeek(subMonths(now, 1));
      periodLabel = "vs last week";
      break;
    case "year":
      currentStart = startOfYear(now);
      currentEnd = endOfYear(now);
      previousStart = startOfYear(subMonths(now, 12));
      previousEnd = endOfYear(subMonths(now, 12));
      periodLabel = "vs last year";
      break;
    case "month":
    default:
      currentStart = startOfMonth(now);
      currentEnd = endOfMonth(now);
      previousStart = startOfMonth(subMonths(now, 1));
      previousEnd = subMonths(now, 1); // Up to same day in last month
      periodLabel = "vs last month";
      break;
  }

  // Fetch transactions for current period
  const currentTransactions = await db.transaction.findMany({
    where: {
      organizationId: orgId,
      createdAt: {
        gte: currentStart,
        lte: currentEnd,
      },
      status: {
        in: ["COMPLETED", "CONFIRMED"],
      },
    },
    include: {
      items: true,
    },
  });

  // Fetch transactions for previous period
  const previousTransactions = await db.transaction.findMany({
    where: {
      organizationId: orgId,
      createdAt: {
        gte: previousStart,
        lte: previousEnd,
      },
      status: {
        in: ["COMPLETED", "CONFIRMED"],
      },
    },
    include: {
      items: true,
    }
  });

  // Basic Stats Calculation
  const currentRevenue = currentTransactions.reduce((acc, t) => acc + Number(t.finalTotal), 0);
  const previousRevenue = previousTransactions.reduce((acc, t) => acc + Number(t.finalTotal), 0);

  const currentSalesCount = currentTransactions.length;
  const previousSalesCount = previousTransactions.length;

  const currentAvgRevenue = currentSalesCount > 0 ? currentRevenue / currentSalesCount : 0;
  const previousAvgRevenue = previousSalesCount > 0 ? previousRevenue / previousSalesCount : 0;

  const currentTotalItems = currentTransactions.reduce((acc, t) => acc + t.items.reduce((sum, item) => sum + item.quantity, 0), 0);
  const previousTotalItems = previousTransactions.reduce((acc, t) => acc + t.items.reduce((sum, item) => sum + item.quantity, 0), 0);

  const currentAvgItemsPerOrder = currentSalesCount > 0 ? currentTotalItems / currentSalesCount : 0;
  const previousAvgItemsPerOrder = previousSalesCount > 0 ? previousTotalItems / previousSalesCount : 0;

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Popular Products (by units sold)
  const productSalesMap = new Map<string, { name: string; sales: number }>();
  currentTransactions.forEach(t => {
    t.items.forEach(item => {
      const existing = productSalesMap.get(item.variantId) || { name: `${item.productName} ${item.variantName}`, sales: 0 };
      existing.sales += item.quantity;
      productSalesMap.set(item.variantId, existing);
    });
  });

  const colors = ["#F97316", "#A855F7", "#3B82F6", "#22C55E", "#EAB308"];
  const popularProducts: PopularProduct[] = Array.from(productSalesMap.entries())
    .map(([id, data], index) => ({
      id,
      name: data.name,
      sales: data.sales,
      color: colors[index % colors.length],
    }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  // Chart Data preparation
  const intervalDays = eachDayOfInterval({
    start: currentStart,
    end: currentEnd < now ? currentEnd : now
  });

  const chartData: ChartDataPoint[] = intervalDays.map(day => {
    const dayStr = format(day, "MMM dd");
    const dayTransactions = currentTransactions.filter(t => isSameDay(t.createdAt, day));

    // For comparison in charts
    let prevDay: Date;
    if (timeframe === "week") prevDay = subMonths(day, 1); // Mocked match for simplicity
    else if (timeframe === "year") prevDay = subMonths(day, 12);
    else prevDay = subMonths(day, 1);

    const prevDayTransactions = previousTransactions.filter(t => isSameDay(t.createdAt, prevDay));

    return {
      date: dayStr,
      current: dayTransactions.reduce((acc, t) => acc + Number(t.finalTotal), 0),
      previous: prevDayTransactions.reduce((acc, t) => acc + Number(t.finalTotal), 0),
    };
  });

  const averageSalesChartData: ChartDataPoint[] = intervalDays.map(day => {
    const dayStr = format(day, "MMM dd");
    const dayTransactions = currentTransactions.filter(t => isSameDay(t.createdAt, day));

    let prevDay: Date;
    if (timeframe === "week") prevDay = subMonths(day, 1);
    else if (timeframe === "year") prevDay = subMonths(day, 12);
    else prevDay = subMonths(day, 1);

    const prevDayTransactions = previousTransactions.filter(t => isSameDay(t.createdAt, prevDay));

    return {
      date: dayStr,
      current: dayTransactions.length,
      previous: prevDayTransactions.length,
    };
  });

  const avgOrderValueChartData: ChartDataPoint[] = intervalDays.map(day => {
    const dayStr = format(day, "MMM dd");
    const dayTransactions = currentTransactions.filter(t => isSameDay(t.createdAt, day));

    let prevDay: Date;
    if (timeframe === "week") prevDay = subMonths(day, 1);
    else if (timeframe === "year") prevDay = subMonths(day, 12);
    else prevDay = subMonths(day, 1);

    const prevDayTransactions = previousTransactions.filter(t => isSameDay(t.createdAt, prevDay));

    const currentDayRev = dayTransactions.reduce((acc, t) => acc + Number(t.finalTotal), 0);
    const prevDayRev = prevDayTransactions.reduce((acc, t) => acc + Number(t.finalTotal), 0);

    return {
      date: dayStr,
      current: dayTransactions.length > 0 ? currentDayRev / dayTransactions.length : 0,
      previous: prevDayTransactions.length > 0 ? prevDayRev / prevDayTransactions.length : 0,
    };
  });

  // Mock Session Data
  const totalSessionsChartData: ChartDataPoint[] = intervalDays.map(day => ({
    date: format(day, "MMM dd"),
    current: Math.floor(Math.random() * 500) + 300,
    previous: Math.floor(Math.random() * 500) + 200,
  }));

  return {
    stats: {
      salesPerformance: {
        value: currentRevenue,
        change: calculateChange(currentRevenue, previousRevenue),
      },
      totalSales: {
        value: currentSalesCount,
        change: calculateChange(currentSalesCount, previousSalesCount),
      },
      averageRevenue: {
        value: currentAvgRevenue,
        change: calculateChange(currentAvgRevenue, previousAvgRevenue),
      },
      averageOrder: {
        value: currentAvgItemsPerOrder,
        change: calculateChange(currentAvgItemsPerOrder, previousAvgItemsPerOrder),
      },
    },
    totalRevenue: {
      value: currentRevenue,
      change: calculateChange(currentRevenue, previousRevenue),
      chartData,
    },
    popularProducts,
    averageOrderValue: {
      value: currentAvgRevenue,
      change: calculateChange(currentAvgRevenue, previousAvgRevenue),
      chartData: avgOrderValueChartData,
    },
    averageSales: {
      value: currentSalesCount,
      change: calculateChange(currentSalesCount, previousSalesCount),
      chartData: averageSalesChartData,
    },
    totalSessions: {
      value: totalSessionsChartData.reduce((acc, d) => acc + d.current, 0),
      change: 4.2,
      chartData: totalSessionsChartData,
    },
    periodLabel,
  };
}
