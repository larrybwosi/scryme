"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@repo/ui/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
} from "recharts";
import {
  ShoppingBag,
  DollarSign,
  Users,
  Clock,
  ArrowUpRight,
  Target,
} from "lucide-react";

import { formatCurrency as formatCurrencyUtil, getCurrencySymbol } from "../../../lib/utils";

export function StaffPerformance({
  stats,
  transactions,
  currency = "USD",
}: {
  stats: any;
  transactions: any[];
  currency?: string;
}) {
  const formatCurrency = (amount: number) => {
    return formatCurrencyUtil(amount, currency);
  };
  const symbol = getCurrencySymbol(currency);

  // Prepare chart data from recent transactions
  // This is a simplified version, ideally we'd have daily aggregates from the server
  const chartData = transactions
    .slice(0, 7)
    .reverse()
    .map(tx => ({
      name: new Date(tx.createdAt).toLocaleDateString("en-US", {
        weekday: "short",
      }),
      amount: Number(tx.finalTotal),
    }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sales Velocity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.monthlySalesCount}</div>
            <div className="flex items-center text-xs text-emerald-600 dark:text-emerald-400 mt-1">
              <ArrowUpRight size={12} className="mr-1" />
              <span>Transactions this month</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue Contribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(stats.monthlySalesValue)}
            </div>
            <div className="flex items-center text-xs text-blue-600 dark:text-blue-400 mt-1">
              <Target size={12} className="mr-1" />
              <span>Monthly revenue target: 85%</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Ticket
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(stats.avgTransactionValue)}
            </div>
            <div className="flex items-center text-xs text-purple-600 dark:text-purple-400 mt-1">
              <ShoppingBag size={12} className="mr-1" />
              <span>Per customer interaction</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground">
              Recent Sales Trend
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Daily revenue from last 7 transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={val => `${symbol}${val}`}
                  />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--muted) / 0.5)" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      backgroundColor: "hsl(var(--card))",
                      color: "hsl(var(--foreground))",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    itemStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Bar
                    dataKey="amount"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground">
              Performance Breakdown
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Detailed metrics across different categories
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Attendance Reliability</span>
                <span className="font-semibold text-foreground">98%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[98%]" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Transaction Accuracy</span>
                <span className="font-semibold text-foreground">99.5%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[99.5%]" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Upselling Performance</span>
                <span className="font-semibold text-foreground">65%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 w-[65%]" />
              </div>
            </div>
            <div className="pt-4 border-t border-border">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                  Excellent
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-primary rounded-full" />
                  Stable
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-purple-500 rounded-full" />
                  Improving
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
