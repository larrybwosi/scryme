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
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui/components/ui/tooltip";

interface RevenueChartProps {
  data: { date: string; current: number; previous: number }[];
  totalValue: string;
  change: number;
  periodLabel: string;
}

const chartConfig = {
  current: {
    label: "Current period",
    color: "#000000",
  },
  previous: {
    label: "Previous period",
    color: "#E5E7EB",
  },
} satisfies ChartConfig;

export function RevenueChart({
  data,
  totalValue,
  change,
  periodLabel,
}: RevenueChartProps) {
  const isPositive = change >= 0;

  return (
    <Card className="p-6 bg-white border-none shadow-sm h-full">
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Total Revenue
            </h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-3 w-3 text-muted-foreground/50" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Total revenue generated from all sources.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{totalValue}</span>
            <div
              className={`flex items-center text-xs font-medium ${isPositive ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"} px-1.5 py-0.5 rounded-full`}>
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
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 mb-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-black" />
          <span>Current</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-gray-200" />
          <span>Previous</span>
        </div>
      </div>

      <div className="h-[200px] w-full">
        <ChartContainer config={chartConfig}>
          <LineChart data={data}>
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              stroke="#f0f0f0"
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#9ca3af" }}
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
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              tickFormatter={value =>
                `$${value >= 1000 ? (value / 1000).toFixed(1) + "k" : value}`
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
          className="text-xs font-semibold text-black p-0 h-auto">
          View More
        </Button>
      </div>
    </Card>
  );
}
