"use server";

import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  subDays,
  subWeeks,
  subMonths,
  subQuarters,
  subYears,
  eachDayOfInterval,
  format,
  startOfYear,
  endOfYear,
} from "date-fns";

export type DashboardStats = {
  totalProducts: {
    value: number;
    change: number;
  };
  totalSales: {
    value: number;
    change: number;
  };
  totalIncome: {
    value: number;
    change: number;
  };
  totalExpenses: {
    value: number;
    change: number;
  };
};

export type ChartDataPoint = {
  date: string;
  oneTime: number;
  recurring: number;
  current: number;
  previous: number;
};

export type MetricChartPoint = {
  date: string;
  current: number;
  previous: number;
};

export type PopularProduct = {
  id: string;
  name: string;
  stocks: number;
  price: number;
  sales: number;
  earnings: number;
  image?: string;
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

export type RecentActivityItem = {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  type: "order" | "stock" | "promo" | "system";
  badgeText: string;
  badgeVariant?: "blue" | "red" | "purple" | "gray";
};

export type DashboardData = {
  stats: DashboardStats;
  totalRevenue: {
    value: number;
    change: number;
    chartData: ChartDataPoint[];
  };
  popularProducts: PopularProduct[];
  categoryDistribution: CategoryDistribution[];
  categoryTotalSales: number;
  heatmapData: HeatmapDay[];
  recentActivity: RecentActivityItem[];
  periodLabel: string;
  averageOrderValue: {
    value: number;
    change: number;
    chartData: MetricChartPoint[];
  };
  averageSales: {
    value: number;
    change: number;
    chartData: MetricChartPoint[];
  };
  totalSessions: {
    value: number;
    change: number;
    chartData: MetricChartPoint[];
  };
};

export async function getDashboardData(
  timeframe: string = "month",
  compareMode: string = "previous_period",
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

  const isCompareLastYear = compareMode === "last_year";

  switch (timeframe) {
    case "today":
      currentStart = startOfDay(now);
      currentEnd = endOfDay(now);
      if (isCompareLastYear) {
        previousStart = startOfDay(subYears(now, 1));
        previousEnd = endOfDay(subYears(now, 1));
        periodLabel = "vs same day last year";
      } else {
        previousStart = startOfDay(subDays(now, 1));
        previousEnd = endOfDay(subDays(now, 1));
        periodLabel = "vs yesterday";
      }
      break;

    case "week":
      currentStart = startOfWeek(now);
      currentEnd = endOfWeek(now);
      if (isCompareLastYear) {
        previousStart = startOfWeek(subYears(now, 1));
        previousEnd = endOfWeek(subYears(now, 1));
        periodLabel = "vs same week last year";
      } else {
        previousStart = startOfWeek(subWeeks(now, 1));
        previousEnd = endOfWeek(subWeeks(now, 1));
        periodLabel = "vs last week";
      }
      break;

    case "quarter":
      currentStart = startOfQuarter(now);
      currentEnd = endOfQuarter(now);
      if (isCompareLastYear) {
        previousStart = startOfQuarter(subYears(now, 1));
        previousEnd = endOfQuarter(subYears(now, 1));
        periodLabel = "vs same quarter last year";
      } else {
        previousStart = startOfQuarter(subQuarters(now, 1));
        previousEnd = endOfQuarter(subQuarters(now, 1));
        periodLabel = "vs last quarter";
      }
      break;

    case "year":
      currentStart = startOfYear(now);
      currentEnd = endOfYear(now);
      previousStart = startOfYear(subYears(now, 1));
      previousEnd = endOfYear(subYears(now, 1));
      periodLabel = "vs last year";
      break;

    case "all":
      currentStart = subYears(now, 5);
      currentEnd = now;
      previousStart = subYears(currentStart, 5);
      previousEnd = currentStart;
      periodLabel = "all time";
      break;

    case "month":
    default:
      currentStart = startOfMonth(now);
      currentEnd = endOfMonth(now);
      if (isCompareLastYear) {
        previousStart = startOfMonth(subYears(now, 1));
        previousEnd = endOfMonth(subYears(now, 1));
        periodLabel = "vs same month last year";
      } else {
        previousStart = startOfMonth(subMonths(now, 1));
        previousEnd = endOfMonth(subMonths(now, 1));
        periodLabel = "vs last month";
      }
      break;
  }

  // 26 weeks (~6 months) for heatmap fitting half-width gracefully
  const sixMonthsAgo = subWeeks(now, 26);

  let totalProductsCount = 0;
  let previousProductsCount = 0;
  let currentTransactions: Array<{
    id: string;
    number: string;
    finalTotal: any;
    createdAt: Date;
    type: string;
    customer?: { name?: string | null } | null;
    items: Array<{
      quantity: number;
      unitPrice: any;
      variantId: string;
      productName: string | null;
      variantName: string | null;
      variant?: {
        product?: {
          id: string;
          name: string;
          imageUrls?: string[];
          category?: { name: string } | null;
        } | null;
        variantStocks?: Array<{ currentStock: any }>;
      } | null;
    }>;
  }> = [];

  let previousTransactions: typeof currentTransactions = [];
  let heatmapTransactions: Array<{
    createdAt: Date;
    finalTotal: any;
  }> = [];
  let currentExpensesTotal = 0;
  let previousExpensesTotal = 0;
  let lowStockVariants: Array<{
    id: string;
    currentStock: any;
    reorderPoint: any;
    product: { name: string };
  }> = [];

  try {
    const [
      productsCount,
      prevProductsCount,
      currentRes,
      previousRes,
      heatmapRes,
      currentExpensesRes,
      previousExpensesRes,
      lowStockRes,
    ] = await Promise.all([
      db.product.count({
        where: {
          organizationId: orgId,
          isArchived: false,
        },
      }),
      db.product.count({
        where: {
          organizationId: orgId,
          isArchived: false,
          createdAt: {
            lte: previousEnd,
          },
        },
      }),
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
          number: true,
          finalTotal: true,
          createdAt: true,
          type: true,
          customer: {
            select: { name: true },
          },
          items: {
            select: {
              quantity: true,
              unitPrice: true,
              variantId: true,
              productName: true,
              variantName: true,
              variant: {
                select: {
                  product: {
                    select: {
                      id: true,
                      name: true,
                      imageUrls: true,
                      category: { select: { name: true } },
                    },
                  },
                  variantStocks: {
                    select: { currentStock: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
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
          number: true,
          finalTotal: true,
          createdAt: true,
          type: true,
          customer: {
            select: { name: true },
          },
          items: {
            select: {
              quantity: true,
              unitPrice: true,
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
            gte: sixMonthsAgo,
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
      db.expense.aggregate({
        where: {
          organizationId: orgId,
          deletedAt: null,
          expenseDate: {
            gte: currentStart,
            lte: currentEnd,
          },
          status: {
            in: ["PAID", "APPROVED"],
          },
        },
        _sum: { amount: true },
      }),
      db.expense.aggregate({
        where: {
          organizationId: orgId,
          deletedAt: null,
          expenseDate: {
            gte: previousStart,
            lte: previousEnd,
          },
          status: {
            in: ["PAID", "APPROVED"],
          },
        },
        _sum: { amount: true },
      }),
      db.productVariantStock.findMany({
        where: {
          organizationId: orgId,
          product: { isArchived: false },
        },
        select: {
          id: true,
          currentStock: true,
          reorderPoint: true,
          product: {
            select: { name: true },
          },
        },
        take: 10,
      }),
    ]);

    totalProductsCount = productsCount;
    previousProductsCount = prevProductsCount;
    currentTransactions = currentRes as any;
    previousTransactions = previousRes as any;
    heatmapTransactions = heatmapRes;
    currentExpensesTotal = Number(currentExpensesRes._sum.amount || 0);
    previousExpensesTotal = Number(previousExpensesRes._sum.amount || 0);
    lowStockVariants = (lowStockRes as any[]).filter(
      (v) =>
        v.reorderPoint !== null &&
        Number(v.currentStock || 0) <= Number(v.reorderPoint || 0),
    );
  } catch (error) {
    console.error("Failed to load dashboard transactions:", error);
  }

  // Basic Stats Calculation
  const currentIncome = currentTransactions.reduce(
    (acc, t) => acc + Number(t.finalTotal || 0),
    0,
  );
  const previousIncome = previousTransactions.reduce(
    (acc, t) => acc + Number(t.finalTotal || 0),
    0,
  );

  const currentSalesCount = currentTransactions.length;
  const previousSalesCount = previousTransactions.length;

  const currentExpenses = currentExpensesTotal;
  const previousExpenses = previousExpensesTotal;

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Number((((current - previous) / previous) * 100).toFixed(1));
  };

  // Average Order Value (AOV)
  const currentAOV =
    currentSalesCount > 0 ? currentIncome / currentSalesCount : 0;
  const previousAOV =
    previousSalesCount > 0 ? previousIncome / previousSalesCount : 0;

  // Process Popular Products & Category breakdown
  const productMap = new Map<
    string,
    {
      id: string;
      name: string;
      category: string;
      stocks: number;
      price: number;
      sales: number;
      earnings: number;
      image?: string;
    }
  >();

  const categoryMap = new Map<string, number>();

  currentTransactions.forEach((t) => {
    (t.items || []).forEach((item) => {
      const pName = item.productName || item.variant?.product?.name || "Product";
      const key = item.variant?.product?.id || item.variantId || pName;
      const catName = item.variant?.product?.category?.name || "General";

      const qty = item.quantity || 0;
      const price = Number(item.unitPrice || 0);
      const earnings = qty * price;

      const currentStockVal = (item.variant?.variantStocks || []).reduce(
        (sum, s) => sum + Number(s.currentStock || 0),
        0,
      );

      const existing = productMap.get(key) || {
        id: key,
        name: pName,
        category: catName,
        stocks: currentStockVal,
        price: price,
        sales: 0,
        earnings: 0,
        image: item.variant?.product?.imageUrls?.[0],
      };

      existing.sales += qty;
      existing.earnings += earnings;
      if (price > 0) existing.price = price;
      productMap.get(key) || productMap.set(key, existing);

      categoryMap.set(catName, (categoryMap.get(catName) || 0) + earnings);
    });
  });

  const categoryColors = [
    "#3B82F6", // Blue
    "#A855F7", // Purple
    "#EAB308", // Yellow / Amber
    "#EC4899", // Pink
    "#22C55E", // Green
  ];

  const popularProducts: PopularProduct[] = Array.from(productMap.values())
    .sort((a, b) => b.earnings - a.earnings)
    .slice(0, 5)
    .map((p, idx) => ({
      ...p,
      color: categoryColors[idx % categoryColors.length],
    }));

  const catEntries = Array.from(categoryMap.entries()).sort(
    (a, b) => b[1] - a[1],
  );
  const categoryTotalSales = catEntries.reduce((sum, [, val]) => sum + val, 0);

  const categoryDistribution: CategoryDistribution[] = catEntries
    .slice(0, 4)
    .map(([name, value], index) => ({
      name,
      value,
      percentage:
        categoryTotalSales > 0
          ? Math.round((value / categoryTotalSales) * 100)
          : 0,
      color: categoryColors[index % categoryColors.length],
    }));

  const intervalDays = eachDayOfInterval({
    start: currentStart,
    end: currentEnd < now ? currentEnd : now,
  });

  const getDayKey = (date: Date) => format(date, "yyyy-MM-dd");

  const currentByDay = new Map<string, typeof currentTransactions>();
  currentTransactions.forEach((t) => {
    const key = getDayKey(new Date(t.createdAt));
    const list = currentByDay.get(key) || [];
    list.push(t);
    currentByDay.set(key, list);
  });

  const previousByDay = new Map<string, typeof previousTransactions>();
  previousTransactions.forEach((t) => {
    const key = getDayKey(new Date(t.createdAt));
    const list = previousByDay.get(key) || [];
    list.push(t);
    previousByDay.set(key, list);
  });

  const chartData: ChartDataPoint[] = intervalDays.map((day) => {
    const dayStr = format(day, "MMM d");
    const dayKey = getDayKey(day);
    const dayTransactions = currentByDay.get(dayKey) || [];

    const totalRev = dayTransactions.reduce(
      (acc, t) => acc + Number(t.finalTotal || 0),
      0,
    );

    const recurringRev = dayTransactions
      .filter((t) => t.type === "SUBSCRIPTION")
      .reduce((acc, t) => acc + Number(t.finalTotal || 0), 0);

    const oneTimeRev = totalRev - recurringRev;

    return {
      date: dayStr,
      oneTime: Math.round(oneTimeRev),
      recurring: Math.round(recurringRev),
      current: totalRev,
      previous: 0,
    };
  });

  // Calculate AOV, Average Sales, and Total Sessions charts per day
  const aovChartData: MetricChartPoint[] = intervalDays.map((day) => {
    const dayStr = format(day, "MMM d");
    const dayKey = getDayKey(day);
    const dayTx = currentByDay.get(dayKey) || [];
    const count = dayTx.length;
    const rev = dayTx.reduce((acc, t) => acc + Number(t.finalTotal || 0), 0);
    const aov = count > 0 ? Math.round(rev / count) : 0;

    return {
      date: dayStr,
      current: aov,
      previous: 0,
    };
  });

  const averageSalesChartData: MetricChartPoint[] = intervalDays.map((day) => {
    const dayStr = format(day, "MMM d");
    const dayKey = getDayKey(day);
    const dayTx = currentByDay.get(dayKey) || [];
    const count = dayTx.length;

    return {
      date: dayStr,
      current: count,
      previous: 0,
    };
  });

  const totalSessionsChartData: MetricChartPoint[] = intervalDays.map((day) => {
    const dayStr = format(day, "MMM d");
    const dayKey = getDayKey(day);
    const dayTx = currentByDay.get(dayKey) || [];
    // Approximate active customer interactions / transactions
    const count = dayTx.length;

    return {
      date: dayStr,
      current: count,
      previous: 0,
    };
  });

  const yearlyByDay = new Map<string, { count: number; revenue: number }>();
  heatmapTransactions.forEach((t) => {
    const key = getDayKey(new Date(t.createdAt));
    const curr = yearlyByDay.get(key) || { count: 0, revenue: 0 };
    curr.count += 1;
    curr.revenue += Number(t.finalTotal || 0);
    yearlyByDay.set(key, curr);
  });

  const heatmapInterval = eachDayOfInterval({
    start: sixMonthsAgo,
    end: now,
  });

  let maxDailyCount = 1;
  yearlyByDay.forEach((val) => {
    if (val.count > maxDailyCount) maxDailyCount = val.count;
  });

  const heatmapData: HeatmapDay[] = heatmapInterval.map((day) => {
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

  const recentActivity: RecentActivityItem[] = [];

  currentTransactions.slice(0, 4).forEach((t) => {
    recentActivity.push({
      id: t.id,
      title: `Order #${t.number}`,
      subtitle: `${t.customer?.name || "Customer"} • ${format(new Date(t.createdAt), "d MMM yy")}`,
      date: format(new Date(t.createdAt), "d MMM yy"),
      type: "order",
      badgeText: "New Order",
      badgeVariant: "blue",
    });
  });

  lowStockVariants.slice(0, 2).forEach((v) => {
    recentActivity.push({
      id: `stock-${v.id}`,
      title: "Low Stock Alert",
      subtitle: `${v.product.name} (${v.currentStock ?? 0} in stock)`,
      date: format(now, "d MMM yy"),
      type: "stock",
      badgeText: "Low Stock",
      badgeVariant: "red",
    });
  });

  // Average daily sales volume
  const totalDays = Math.max(intervalDays.length, 1);
  const avgDailySales = Number((currentSalesCount / totalDays).toFixed(1));
  const prevDays = Math.max(intervalDays.length, 1);
  const prevAvgDailySales = Number((previousSalesCount / prevDays).toFixed(1));

  return {
    stats: {
      totalProducts: {
        value: totalProductsCount,
        change: calculateChange(totalProductsCount, previousProductsCount),
      },
      totalSales: {
        value: currentSalesCount,
        change: calculateChange(currentSalesCount, previousSalesCount),
      },
      totalIncome: {
        value: currentIncome,
        change: calculateChange(currentIncome, previousIncome),
      },
      totalExpenses: {
        value: currentExpenses,
        change: calculateChange(currentExpenses, previousExpenses),
      },
    },
    totalRevenue: {
      value: currentIncome,
      change: calculateChange(currentIncome, previousIncome),
      chartData,
    },
    popularProducts,
    categoryDistribution,
    categoryTotalSales,
    heatmapData,
    recentActivity,
    periodLabel,
    averageOrderValue: {
      value: Math.round(currentAOV),
      change: calculateChange(currentAOV, previousAOV),
      chartData: aovChartData,
    },
    averageSales: {
      value: avgDailySales,
      change: calculateChange(avgDailySales, prevAvgDailySales),
      chartData: averageSalesChartData,
    },
    totalSessions: {
      value: currentSalesCount,
      change: calculateChange(currentSalesCount, previousSalesCount),
      chartData: totalSessionsChartData,
    },
  };
}
