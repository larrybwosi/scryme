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

export async function getDashboardData(
  timeframe: string = "month",
): Promise<DashboardData> {
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

  // Fetch transactions for both current and previous periods concurrently in parallel using Promise.all
  // and select only required fields for extreme optimization
  const [currentTransactions, previousTransactions] = await Promise.all([
    db.transaction.findMany({
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
      select: {
        id: true,
        finalTotal: true,
        createdAt: true,
        items: {
          select: {
            quantity: true,
            variantId: true,
            productName: true,
            variantName: true,
          },
        },
      },
    }),
    db.transaction.findMany({
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
      select: {
        id: true,
        finalTotal: true,
        createdAt: true,
        items: {
          select: {
            quantity: true,
            variantId: true,
            productName: true,
            variantName: true,
          },
        },
      },
    }),
  ]);

  // Basic Stats Calculation
  const currentRevenue = currentTransactions.reduce(
    (acc, t) => acc + Number(t.finalTotal),
    0,
  );
  const previousRevenue = previousTransactions.reduce(
    (acc, t) => acc + Number(t.finalTotal),
    0,
  );

  const currentSalesCount = currentTransactions.length;
  const previousSalesCount = previousTransactions.length;

  const currentAvgRevenue =
    currentSalesCount > 0 ? currentRevenue / currentSalesCount : 0;
  const previousAvgRevenue =
    previousSalesCount > 0 ? previousRevenue / previousSalesCount : 0;

  const currentTotalItems = currentTransactions.reduce(
    (acc, t) => acc + t.items.reduce((sum, item) => sum + item.quantity, 0),
    0,
  );
  const previousTotalItems = previousTransactions.reduce(
    (acc, t) => acc + t.items.reduce((sum, item) => sum + item.quantity, 0),
    0,
  );

  const currentAvgItemsPerOrder =
    currentSalesCount > 0 ? currentTotalItems / currentSalesCount : 0;
  const previousAvgItemsPerOrder =
    previousSalesCount > 0 ? previousTotalItems / previousSalesCount : 0;

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Popular Products (by units sold)
  const productSalesMap = new Map<string, { name: string; sales: number }>();
  currentTransactions.forEach(t => {
    t.items.forEach(item => {
      const existing = productSalesMap.get(item.variantId) || {
        name: `${item.productName} ${item.variantName}`,
        sales: 0,
      };
      existing.sales += item.quantity;
      productSalesMap.set(item.variantId, existing);
    });
  });

  const colors = ["#F97316", "#A855F7", "#3B82F6", "#22C55E", "#EAB308"];
  const popularProducts: PopularProduct[] = Array.from(
    productSalesMap.entries(),
  )
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
    end: currentEnd < now ? currentEnd : now,
  });

  // Optimize performance from O(N * D) to O(N + D) using Map-based date groupings
  const getDayKey = (date: Date) => {
    return format(date, "yyyy-MM-dd");
  };

  const currentByDay = new Map<string, typeof currentTransactions>();
  currentTransactions.forEach(t => {
    const key = getDayKey(new Date(t.createdAt));
    let list = currentByDay.get(key);
    if (!list) {
      list = [];
      currentByDay.set(key, list);
    }
    list.push(t);
  });

  const previousByDay = new Map<string, typeof previousTransactions>();
  previousTransactions.forEach(t => {
    const key = getDayKey(new Date(t.createdAt));
    let list = previousByDay.get(key);
    if (!list) {
      list = [];
      previousByDay.set(key, list);
    }
    list.push(t);
  });

  const chartData: ChartDataPoint[] = [];
  const averageSalesChartData: ChartDataPoint[] = [];
  const avgOrderValueChartData: ChartDataPoint[] = [];
  const totalSessionsChartData: ChartDataPoint[] = [];

  intervalDays.forEach(day => {
    const dayStr = format(day, "MMM dd");
    const dayKey = getDayKey(day);
    const dayTransactions = currentByDay.get(dayKey) || [];

    // For comparison in charts
    let prevDay: Date;
    if (timeframe === "week") {
      prevDay = subMonths(day, 1); // Mocked match for simplicity
    } else if (timeframe === "year") {
      prevDay = subMonths(day, 12);
    } else {
      prevDay = subMonths(day, 1);
    }

    const prevDayKey = getDayKey(prevDay);
    const prevDayTransactions = previousByDay.get(prevDayKey) || [];

    const currentDayRev = dayTransactions.reduce(
      (acc, t) => acc + Number(t.finalTotal),
      0,
    );
    const prevDayRev = prevDayTransactions.reduce(
      (acc, t) => acc + Number(t.finalTotal),
      0,
    );

    chartData.push({
      date: dayStr,
      current: currentDayRev,
      previous: prevDayRev,
    });

    averageSalesChartData.push({
      date: dayStr,
      current: dayTransactions.length,
      previous: prevDayTransactions.length,
    });

    avgOrderValueChartData.push({
      date: dayStr,
      current: dayTransactions.length > 0 ? currentDayRev / dayTransactions.length : 0,
      previous: prevDayTransactions.length > 0 ? prevDayRev / prevDayTransactions.length : 0,
    });

    totalSessionsChartData.push({
      date: dayStr,
      current: 0,
      previous: 0,
    });
  });

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
        change: calculateChange(
          currentAvgItemsPerOrder,
          previousAvgItemsPerOrder,
        ),
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
