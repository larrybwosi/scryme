"use client";

import { Card } from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface CategoryDistributionProps {
  data: Array<{
    name: string;
    value: number;
    percentage: number;
    color: string;
  }>;
  totalSales?: number;
  currency?: string;
}

export function CategoryDistributionChart({
  data,
  totalSales = 125000,
  currency = "USD",
}: CategoryDistributionProps) {
  const chartData = data && data.length > 0 ? data : [
    { name: "Electronics", value: 85000, percentage: 68, color: "#3B82F6" },
    { name: "Fashion", value: 25000, percentage: 20, color: "#A855F7" },
    { name: "Health & Wellness", value: 10000, percentage: 8, color: "#EAB308" },
    { name: "Home & Living", value: 5000, percentage: 4, color: "#EC4899" },
  ];

  const displayTotal = totalSales || chartData.reduce((acc, curr) => acc + curr.value, 0);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <Card className="p-6 bg-card border-border/60 shadow-xs rounded-2xl h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
            Top Categories
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground h-7 px-2.5 rounded-lg"
          >
            See All
          </Button>
        </div>

        <div className="relative h-[180px] w-full flex items-center justify-center my-2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={75}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const dataPoint = payload[0].payload;
                    return (
                      <div className="bg-popover text-popover-foreground border border-border/80 px-3 py-1.5 rounded-xl shadow-md text-xs font-semibold">
                        {dataPoint.name}: {formatCurrency(dataPoint.value)} ({dataPoint.percentage}%)
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-[11px] font-medium text-muted-foreground">Total Sales</span>
            <span className="text-base font-bold text-foreground mt-0.5">
              {formatCurrency(displayTotal)}
            </span>
          </div>
        </div>

        <div className="space-y-3 mt-4 pt-2 border-t border-border/40">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-medium text-foreground">{item.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-foreground">
                  {formatCurrency(item.value)}
                </span>
                <span className="font-bold text-muted-foreground w-8 text-right font-mono text-[11px]">
                  {item.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
