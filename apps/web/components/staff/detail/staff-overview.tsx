"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  CreditCard,
  DollarSign,
  UserCheck,
} from "lucide-react";

export function StaffOverview({ stats }: { stats: any }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const statCards = [
    {
      title: "Total Sales",
      value: formatCurrency(stats.totalSalesValue),
      subValue: `${stats.totalSalesCount} transactions`,
      icon: DollarSign,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Monthly Sales",
      value: formatCurrency(stats.monthlySalesValue),
      subValue: `${stats.monthlySalesCount} this month`,
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Avg. Transaction",
      value: formatCurrency(stats.avgTransactionValue),
      subValue: "Per successful sale",
      icon: ShoppingBag,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      title: "Attendance",
      value: stats.attendanceCount,
      subValue: "Total check-ins",
      icon: UserCheck,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, i) => (
        <Card key={i} className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              {stat.title}
            </CardTitle>
            <div className={`${stat.bg} ${stat.color} p-2 rounded-lg`}>
              <stat.icon size={16} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-gray-500 mt-1">{stat.subValue}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
