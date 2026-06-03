"use client";

import { Card } from "@repo/ui/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from "@repo/ui/components/ui/chart";
import { Area, AreaChart, XAxis, YAxis, CartesianGrid } from "recharts";
import { Maximize2, MoreHorizontal, TrendingUp, HelpCircle } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@repo/ui/components/ui/tooltip";

interface AverageSalesChartProps {
  data: { date: string; current: number; previous: number }[];
  value: string | number;
  change: number;
  periodLabel: string;
}

const chartConfig = {
  current: {
    label: "Current",
    color: "#F97316",
  },
  previous: {
    label: "Previous",
    color: "#FDE6D2",
  },
} satisfies ChartConfig;

export function AverageSalesChart({ data, value, change, periodLabel }: AverageSalesChartProps) {
  const isPositive = change >= 0;
  return (
    <Card className="p-6 bg-white border-none shadow-sm h-full">
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
               Average Sales
            </h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-3 w-3 text-muted-foreground/50" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Daily average sales volume.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{value}</span>
            <div className={`flex items-center text-xs font-medium ${isPositive ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'} px-1.5 py-0.5 rounded-full`}>
              <TrendingUp className={`h-3 w-3 mr-1 ${!isPositive && 'rotate-180'}`} />
              {Math.abs(change).toFixed(1)}%
            </div>
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

      <div className="flex items-center gap-4 mb-4 text-[10px]">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-orange-500" />
          <span>Current</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-orange-100" />
          <span>Previous</span>
        </div>
      </div>

      <div className="h-[150px] w-full">
        <ChartContainer config={chartConfig}>
          <AreaChart data={data}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={false}
            />
            <YAxis
               axisLine={false}
               tickLine={false}
               tick={{ fontSize: 10, fill: '#9ca3af' }}
               tickFormatter={(val) => val >= 1000 ? (val/1000).toFixed(1) + 'k' : val}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="current"
              stroke="var(--color-current)"
              fill="rgba(249, 115, 22, 0.1)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="previous"
              stroke="var(--color-previous)"
              fill="transparent"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
          <span>{data[0]?.date}</span>
          <span>{data[data.length-1]?.date}</span>
      </div>
    </Card>
  );
}
