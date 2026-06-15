"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  FileCheck,
  CreditCard,
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
      color: "text-yellow-600",
    },
    {
      title: "Efficiency Rate",
      value: "94%",
      icon: FileCheck,
      description: "Approved vs Submitted",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
      {cards.map((card, i) => (
        <Card key={i} className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              {card.title}
            </CardTitle>
            <card.icon className={`h-4 w-4 ${card.color || "text-gray-400"}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-gray-500 mt-1">
              {card.trend && (
                <span
                  className={card.trendUp ? "text-green-600" : "text-red-600"}>
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
