"use client";

import { Card } from "@repo/ui/components/ui/card";
import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface RevenueChartProps {
  data: Array<{
    date: string;
    oneTime: number;
    recurring: number;
    current: number;
    previous: number;
  }>;
  currency?: string;
}

export function RevenueChart({ data, currency = "USD" }: RevenueChartProps) {
  const [timeframe, setTimeframe] = useState<"Monthly" | "Quarterly" | "Yearly">("Monthly");

  const mockDisplayData = [
    { date: "Jan", oneTime: 30000, recurring: 70000 },
    { date: "Feb", oneTime: 20000, recurring: 35000 },
    { date: "Mar", oneTime: 25000, recurring: 55000 },
    { date: "Apr", oneTime: 60000, recurring: 25000 },
    { date: "May", oneTime: 20000, recurring: 45000 },
    { date: "Jun", oneTime: 18000, recurring: 35000 },
    { date: "Jul", oneTime: 25000, recurring: 100000 },
    { date: "Aug", oneTime: 20000, recurring: 50000 },
  ];

  const chartData = data && data.length > 0 && data.some(d => d.current > 0)
    ? data.map(d => ({
        date: d.date,
        oneTime: d.oneTime || Math.round(d.current * 0.35),
        recurring: d.recurring || Math.round(d.current * 0.65),
      }))
    : mockDisplayData;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <Card className="p-6 bg-card border-border/60 shadow-xs rounded-2xl h-full flex flex-col justify-between">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span>
              Sales Revenue
            </h3>
            <div className="flex items-center gap-4 text-xs mt-2">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-200 dark:bg-indigo-900 inline-block"></span>
                One-Time Revenue
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block"></span>
                Recurring Revenue
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/40 text-xs self-start sm:self-auto">
            {(["Monthly", "Quarterly", "Yearly"] as const).map((item) => (
              <button
                key={item}
                onClick={() => setTimeframe(item)}
                className={`px-3 py-1 rounded-lg transition-all font-medium ${
                  timeframe === item
                    ? "bg-background text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[280px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              barCategoryGap="25%"
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.15} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "var(--color-muted-foreground, #64748b)" }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${value >= 1000 ? `${value / 1000}K` : value}`}
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground, #64748b)" }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const oneTime = Number(payload.find(p => p.dataKey === "oneTime")?.value || 0);
                    const recurring = Number(payload.find(p => p.dataKey === "recurring")?.value || 0);
                    return (
                      <div className="bg-popover text-popover-foreground border border-border/80 p-3 rounded-xl shadow-lg text-xs space-y-1.5 min-w-[150px]">
                        <p className="font-semibold text-muted-foreground border-b border-border/40 pb-1">{label}</p>
                        <div className="flex justify-between items-center text-xs">
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <span className="w-2 h-2 rounded-full bg-indigo-300"></span> One-Time
                          </span>
                          <span className="font-bold">{formatCurrency(oneTime)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <span className="w-2 h-2 rounded-full bg-indigo-600"></span> Recurring
                          </span>
                          <span className="font-bold">{formatCurrency(recurring)}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="oneTime"
                stackId="a"
                fill="#C7D2FE"
                radius={[0, 0, 0, 0]}
                barSize={32}
              />
              <Bar
                dataKey="recurring"
                stackId="a"
                fill="#4F46E5"
                radius={[6, 6, 0, 0]}
                barSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}
