"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import {
  TrendingUp,
  Clock,
  DollarSign,
  FileCheck,
} from "lucide-react";

interface FinanceStatsProps {
  stats: {
    totalExpenses: number;
    pendingApprovals: number;
    monthlySpend: number;
  };
}

export function FinanceStats({
  stats,
  currency = "KES",
}: FinanceStatsProps & { currency?: string }) {
  const cards = [
    {
      title: "Total Paid Expenses",
      value: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
      }).format(stats.totalExpenses),
      icon: DollarSign,
      trend: "+12.5%",
      trendUp: false,
      description: "Total since beginning",
    },
    {
      title: "Monthly Spend",
      value: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
      }).format(stats.monthlySpend),
      icon: TrendingUp,
      trend: "+4.3%",
      trendUp: true,
      description: "Spend in current month",
    },
    {
      title: "Pending Approvals",
      value: stats.pendingApprovals.toString(),
      icon: Clock,
      description: "Requires your attention",
      color: "text-amber-500",
    },
    {
      title: "Efficiency Rate",
      value: "94%",
      icon: FileCheck,
      description: "Approved vs Submitted",
      color: "text-emerald-500",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
      {cards.map((card, i) => (
        <Card key={i} className="border-border bg-card shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className={`h-4 w-4 ${card.color || "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{card.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {card.trend && (
                <span
                  className={card.trendUp ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-rose-600 dark:text-rose-400 font-medium"}>
                  {card.trend}{" "}
                </span>
              )}
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
