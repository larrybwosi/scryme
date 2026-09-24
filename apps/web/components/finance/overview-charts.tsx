"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@repo/ui/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import { TrendingUp, PieChart as PieIcon, Zap } from "lucide-react";
import { Badge } from "@repo/ui/components/ui/badge";

interface OverviewChartsProps {
  data: {
    monthlyTrends?: Array<{
      month: string;
      total: number;
      utilities: number;
      general: number;
    }>;
    categoryBreakdown?: Array<{
      name: string;
      amount: number;
    }>;
    utilityVsGeneral?: {
      utilities: number;
      general: number;
    };
  };
  currency?: string;
}

const barChartConfig = {
  general: {
    label: "General Expenses",
    color: "#3b82f6",
  },
  utilities: {
    label: "Utility Bills",
    color: "#f59e0b",
  },
} satisfies ChartConfig;

const CATEGORY_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#6366f1",
];

export function FinanceOverviewCharts({ data, currency = "USD" }: OverviewChartsProps) {
  const monthlyTrends = data.monthlyTrends || [];
  const categoryBreakdown = data.categoryBreakdown || [];
  const utilityVsGeneral = data.utilityVsGeneral || { utilities: 0, general: 0 };

  const totalUtilityVsGeneral = utilityVsGeneral.utilities + utilityVsGeneral.general;
  const utilityPercent = totalUtilityVsGeneral > 0
    ? Math.round((utilityVsGeneral.utilities / totalUtilityVsGeneral) * 100)
    : 0;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* 6-Month Expense Trends Chart */}
      <Card className="border-border/60 shadow-none">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              6-Month Spending Trend
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Monthly breakdown of general operating expenses vs utility bills
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-sm bg-blue-500" />
              <span className="text-muted-foreground font-medium">General</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-sm bg-amber-500" />
              <span className="text-muted-foreground font-medium">Utilities</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-[240px] w-full">
            <ChartContainer config={barChartConfig}>
              <BarChart data={monthlyTrends}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="general" stackId="a" fill="#3b82f6" radius={[0, 0, 2, 2]} />
                <Bar dataKey="utilities" stackId="a" fill="#f59e0b" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      {/* Category Distribution & Utility Ratio Chart */}
      <Card className="border-border/60 shadow-none">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-emerald-500" />
              Expense Distribution & Overheads
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Spend distribution across categories & utility account ratio
            </p>
          </div>
          {utilityPercent > 0 && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              <Zap className="w-3 h-3 mr-1 text-amber-500" />
              {utilityPercent}% Utilities
            </Badge>
          )}
        </CardHeader>
        <CardContent className="pt-4">
          {categoryBreakdown.length === 0 ? (
            <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">
              No category expense data recorded yet
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center h-[240px]">
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      dataKey="amount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {categoryBreakdown.map((_, idx) => (
                        <Cell
                          key={`cell-${idx}`}
                          fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(val: any) => formatCurrency(Number(val))}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {categoryBreakdown.map((cat, idx) => (
                  <div key={cat.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                      />
                      <span className="truncate font-medium">{cat.name}</span>
                    </div>
                    <span className="font-semibold text-foreground shrink-0 ml-2">
                      {formatCurrency(cat.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
