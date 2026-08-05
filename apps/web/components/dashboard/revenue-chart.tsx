"use client";

import { Card } from "@repo/ui/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@repo/ui/components/ui/chart";
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  Maximize2,
  MoreHorizontal,
  TrendingUp,
  HelpCircle,
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/ui/tooltip";

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
    color: "hsl(var(--primary))",
  },
  previous: {
    label: "Previous period",
    color: "hsl(var(--muted))",
  },
} satisfies ChartConfig;

import { getCurrencySymbol } from "../../lib/utils";

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
    <Card className="p-6 bg-card border-border shadow-sm h-full">
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Total Revenue
            </h3>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" aria-label="Revenue information">
                  <HelpCircle className="h-3 w-3 text-muted-foreground/50" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Total revenue generated from all sources.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">
              {totalValue}
            </span>
            <div
              className={`flex items-center text-xs font-medium ${
                isPositive
                  ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                  : "text-red-600 dark:text-red-400 bg-red-500/10"
              } px-1.5 py-0.5 rounded-full`}>
              <TrendingUp
                className={`h-3 w-3 mr-1 ${!isPositive && "rotate-180"}`}
              />
              {Math.abs(change).toFixed(1)}%
            </div>
            <span className="text-muted-foreground text-xs font-normal">
              {periodLabel}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
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
                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
                aria-label="More options">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>More options</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 mb-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <span className="text-muted-foreground">Current</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-muted" />
          <span className="text-muted-foreground">Previous</span>
        </div>
      </div>

      <div className="h-[200px] w-full">
        <ChartContainer config={chartConfig}>
          <LineChart data={data}>
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              interval="preserveStartEnd"
              ticks={
                data.length > 0
                  ? [
                      data[0]?.date,
                      data[Math.floor(data.length / 2)]?.date,
                      data[data.length - 1]?.date,
                    ]
                  : []
              }
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={value =>
                `${symbol}${value >= 1000 ? (value / 1000).toFixed(1) + "k" : value}`
              }
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="current"
              stroke="var(--color-current)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="previous"
              stroke="var(--color-previous)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </div>

      <div className="mt-4 flex justify-end">
        <Button
          variant="link"
          className="text-xs font-semibold text-primary p-0 h-auto hover:text-primary/80">
          View More
        </Button>
      </div>
    </Card>
  );
}
