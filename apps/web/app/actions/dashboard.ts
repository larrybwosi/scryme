"use server";

import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  subDays,
  subYears,
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

export type HeatmapDay = {
  date: string; // "YYYY-MM-DD"
  count: number;
  revenue: number;
  level: 0 | 1 | 2 | 3 | 4;
};

export type CategoryDistribution = {
  name: string;
  value: number;
  percentage: number;
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
  heatmapData: HeatmapDay[];
  categoryDistribution: CategoryDistribution[];
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
      previousStart = startOfWeek(subMonths(now, 1));
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
      previousEnd = subMonths(now, 1);
      periodLabel = "vs last month";
      break;
  }

  const yearAgo = subYears(now, 1);

  let currentTransactions: Array<{
    id: string;
    finalTotal: any;
    createdAt: Date;
    items: Array<{
      quantity: number;
      variantId: string;
      productName: string | null;
      variantName: string | null;
    }>;
  }> = [];

  let previousTransactions: typeof currentTransactions = [];
  let yearlyTransactions: Array<{
    createdAt: Date;
    finalTotal: any;
  }> = [];

  try {
    // Fetch transactions for current, previous, and past 1 year for heatmap in parallel
    const [currentRes, previousRes, yearlyRes] = await Promise.all([
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
      db.transaction.findMany({
        where: {
          organizationId: orgId,
          createdAt: {
            gte: yearAgo,
            lte: now,
          },
          status: {
            in: ["COMPLETED", "CONFIRMED"],
          },
        },
        select: {
          createdAt: true,
          finalTotal: true,
        },
      }),
    ]);

    currentTransactions = currentRes;
    previousTransactions = previousRes;
    yearlyTransactions = yearlyRes;
  } catch (error) {
    console.error("Failed to load dashboard transactions:", error);
  }

  // Basic Stats Calculation
  const currentRevenue = currentTransactions.reduce(
    (acc, t) => acc + Number(t.finalTotal || 0),
    0,
  );
  const previousRevenue = previousTransactions.reduce(
    (acc, t) => acc + Number(t.finalTotal || 0),
    0,
  );

  const currentSalesCount = currentTransactions.length;
  const previousSalesCount = previousTransactions.length;

  const currentAvgRevenue =
    currentSalesCount > 0 ? currentRevenue / currentSalesCount : 0;
  const previousAvgRevenue =
    previousSalesCount > 0 ? previousRevenue / previousSalesCount : 0;

  const currentTotalItems = currentTransactions.reduce(
    (acc, t) => acc + (t.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0),
    0,
  );
  const previousTotalItems = previousTransactions.reduce(
    (acc, t) => acc + (t.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0),
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

  // Popular Products (by units sold) & Category breakdown
  const productSalesMap = new Map<string, { name: string; sales: number }>();
  currentTransactions.forEach(t => {
    (t.items || []).forEach(item => {
      const name = item.productName || item.variantName || "Item";
      const key = item.variantId || name;
      const existing = productSalesMap.get(key) || {
        name: `${name} ${item.variantName && item.variantName !== name ? item.variantName : ""}`.trim(),
        sales: 0,
      };
      existing.sales += item.quantity || 0;
      productSalesMap.set(key, existing);
    });
  });

  const colors = ["#F97316", "#A855F7", "#3B82F6", "#22C55E", "#EAB308", "#EC4899", "#14B8A6"];
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

  // Category / Product Grouping Distribution
  const totalUnits = popularProducts.reduce((acc, p) => acc + p.sales, 0);
  const categoryDistribution: CategoryDistribution[] = popularProducts.map((p) => ({
    name: p.name,
    value: p.sales,
    percentage: totalUnits > 0 ? Math.round((p.sales / totalUnits) * 100) : 0,
    color: p.color,
  }));

  // Chart Data preparation
  const intervalDays = eachDayOfInterval({
    start: currentStart,
    end: currentEnd < now ? currentEnd : now,
  });

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

    let prevDay: Date;
    if (timeframe === "week") {
      prevDay = subMonths(day, 1);
    } else if (timeframe === "year") {
      prevDay = subMonths(day, 12);
    } else {
      prevDay = subMonths(day, 1);
    }

    const prevDayKey = getDayKey(prevDay);
    const prevDayTransactions = previousByDay.get(prevDayKey) || [];

    const currentDayRev = dayTransactions.reduce(
      (acc, t) => acc + Number(t.finalTotal || 0),
      0,
    );
    const prevDayRev = prevDayTransactions.reduce(
      (acc, t) => acc + Number(t.finalTotal || 0),
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

  // Calculate Heatmap Data for past 365 days
  const yearlyByDay = new Map<string, { count: number; revenue: number }>();
  yearlyTransactions.forEach(t => {
    const key = getDayKey(new Date(t.createdAt));
    const curr = yearlyByDay.get(key) || { count: 0, revenue: 0 };
    curr.count += 1;
    curr.revenue += Number(t.finalTotal || 0);
    yearlyByDay.set(key, curr);
  });

  const yearInterval = eachDayOfInterval({
    start: yearAgo,
    end: now,
  });

  // Determine max count for level mapping
  let maxDailyCount = 1;
  yearlyByDay.forEach(val => {
    if (val.count > maxDailyCount) maxDailyCount = val.count;
  });

  const heatmapData: HeatmapDay[] = yearInterval.map(day => {
    const key = getDayKey(day);
    const info = yearlyByDay.get(key) || { count: 0, revenue: 0 };
    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (info.count > 0) {
      const ratio = info.count / maxDailyCount;
      if (ratio <= 0.25) level = 1;
      else if (ratio <= 0.5) level = 2;
      else if (ratio <= 0.75) level = 3;
      else level = 4;
    }

    return {
      date: key,
      count: info.count,
      revenue: info.revenue,
      level,
    };
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
    heatmapData,
    categoryDistribution,
  };
}
