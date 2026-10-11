"use client";

import { Card } from "@repo/ui/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@repo/ui/components/ui/chart";
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  Maximize2,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  HelpCircle,
  DollarSign,
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/ui/tooltip";
import { getCurrencySymbol } from "../../lib/utils";

interface RevenueChartProps {
  data: { date: string; current: number; previous: number }[];
  totalValue: string;
  change: number;
  periodLabel: string;
  currency?: string;
}

const chartConfig = {
  current: {
    label: "Current period",
    color: "#3B82F6",
  },
  previous: {
    label: "Previous period",
    color: "#94A3B8",
  },
} satisfies ChartConfig;

export function RevenueChart({
  data,
  totalValue,
  change,
  periodLabel,
  currency = "USD",
}: RevenueChartProps) {
  const isPositive = change >= 0;
  const symbol = getCurrencySymbol(currency);

  return (
    <Card className="p-6 bg-card border-border shadow-sm h-full flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                <DollarSign className="h-4 w-4" />
              </span>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                Total Revenue
              </h3>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" aria-label="Revenue information">
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Revenue trends comparing current period to previous timeframe.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-baseline gap-2.5 pt-1">
              <span className="text-3xl font-extrabold tracking-tight text-foreground">
                {totalValue}
              </span>
              <div
                className={`flex items-center text-xs font-semibold ${
                  isPositive
                    ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                    : "text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20"
                } px-2 py-0.5 rounded-full`}>
                {isPositive ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {Math.abs(change).toFixed(1)}%
              </div>
              <span className="text-muted-foreground text-xs font-medium">
                {periodLabel}
              </span>
            </div>
          </div>
          <div className="flex gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  aria-label="Maximize chart">
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Maximize</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  aria-label="More options">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>More options</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 mb-3 text-xs">
          <div className="flex items-center gap-1.5 font-medium">
            <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            <span className="text-foreground">Current Period</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <div className="h-2.5 w-2.5 rounded-full bg-slate-400 dark:bg-slate-600" />
            <span className="text-muted-foreground">Previous Period</span>
          </div>
        </div>
      </div>

      <div className="h-[200px] w-full">
        <ChartContainer config={chartConfig} className="aspect-auto h-full w-full">
          <LineChart data={data}>
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              opacity={0.6}
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              dy={6}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(value) =>
                `${symbol}${value >= 1000 ? (value / 1000).toFixed(1) + "k" : value}`
              }
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="previous"
              stroke="#94A3B8"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fillOpacity={1}
              fill="url(#previousRevenueGradient)"
            />
            <Area
              type="monotone"
              dataKey="current"
              stroke="#3B82F6"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#currentRevenueGradient)"
              activeDot={{ r: 5, strokeWidth: 2, fill: "#3B82F6" }}
            />
          </AreaChart>
        </ChartContainer>
      </div>

      <div className="mt-3 pt-3 border-t border-border/40 flex justify-between items-center text-xs text-muted-foreground">
        <span>Real-time POS & Web revenue sync</span>
        <Button
          variant="link"
          className="text-xs font-semibold text-primary p-0 h-auto hover:text-primary/80">
          View Detailed Report →
        </Button>
      </div>
    </Card>
  );
}
