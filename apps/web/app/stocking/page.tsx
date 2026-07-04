import React from "react";
import { PageHeader } from "@/components/page-header";
import {
  getStockDashboardStats,
  getStockMovementsChartData,
  getStockDistributionByLocation,
} from "@/app/actions/stock-management";
import { Card, CardContent } from "@repo/ui/components/ui/card";
import {
  TrendingUp,
  Package,
  ArrowLeftRight,
  AlertTriangle,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import { StockCharts } from "@/components/stocking/stock-charts";

export default async function StockingDashboard({
  searchParams,
}: {
  searchParams: Promise<{
    locationId?: string;
    search?: string;
  }>;
}) {
  const params = await searchParams;

  const [stats, movementData, distributionData] = await Promise.all([
    getStockDashboardStats(),
    getStockMovementsChartData(),
    getStockDistributionByLocation(),
  ]);

  if (!stats) return <div>Failed to load stats.</div>;

  const statCards = [
    {
      title: "Total Products",
      value: stats.totalProducts,
      icon: Package,
      description: "Across all categories",
      color: "text-blue-600",
      bg: "bg-blue-50",
      link: "/stocking/list",
    },
    {
      title: "Stock Requests",
      value: "View All",
      icon: ShoppingCart,
      description: "Manage branch requests",
      color: "text-purple-600",
      bg: "bg-purple-50",
      link: "/stocking/requests",
    },
    {
      title: "Pending Transfers",
      value: stats.pendingTransfers,
      icon: ArrowLeftRight,
      description: "Awaiting action",
      color: "text-amber-600",
      bg: "bg-amber-50",
      link: "/stocking/transfers",
    },
    {
      title: "Low Stock Alerts",
      value: stats.lowStockAlerts,
      icon: AlertTriangle,
      description: "Requires attention",
      color: "text-red-600",
      bg: "bg-red-50",
      link: "/stocking/reorder-rules",
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-8 bg-gray-50/50 min-h-screen">
      <PageHeader
        title="Stocking Dashboard"
        description="Monitor inventory health, stock movements, and distribution across locations."
        icon={<TrendingUp size={24} />}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <Link key={i} href={stat.link}>
            <Card className="hover:border-blue-200 transition-colors cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      {stat.title}
                    </p>
                    <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {stat.description}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bg}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <StockCharts
        movementData={movementData}
        distributionData={distributionData}
      />
    </div>
  );
}
