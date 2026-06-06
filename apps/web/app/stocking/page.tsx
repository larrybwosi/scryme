import React from 'react';
import { PageHeader } from "../../components/page-header";
import {
  getStockDashboardStats,
  getStockMovementsChartData,
  getStockDistributionByLocation
} from "../actions/stock-management";
import { Card, CardContent } from "@repo/ui/components/ui/card";
import {
  TrendingUp,
  Package,
  ArrowLeftRight,
  AlertTriangle
} from "lucide-react";
import { StockCharts } from "../../components/stocking/stock-charts";

export default async function StockingDashboard() {
  const [stats, movementData, distributionData] = await Promise.all([
    getStockDashboardStats(),
    getStockMovementsChartData(),
    getStockDistributionByLocation()
  ]);

  if (!stats) return <div>Failed to load stats.</div>;

  const statCards = [
    {
      title: "Total Products",
      value: stats.totalProducts,
      icon: Package,
      description: "Across all categories",
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      title: "Total Items",
      value: stats.totalStockItems.toLocaleString(),
      icon: TrendingUp,
      description: "Current physical stock",
      color: "text-green-600",
      bg: "bg-green-50"
    },
    {
      title: "Pending Transfers",
      value: stats.pendingTransfers,
      icon: ArrowLeftRight,
      description: "Awaiting action",
      color: "text-amber-600",
      bg: "bg-amber-50"
    },
    {
      title: "Low Stock Alerts",
      value: stats.lowStockAlerts,
      icon: AlertTriangle,
      description: "Requires attention",
      color: "text-red-600",
      bg: "bg-red-50"
    }
  ];

  return (
    <div className="flex flex-col gap-6 p-8 bg-gray-50/50 min-h-screen">
      <PageHeader
        title="Stocking Dashboard"
        description="Monitor inventory health, stock movements, and distribution across locations."
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                  <p className="text-xs text-gray-400 mt-1">{stat.description}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <StockCharts movementData={movementData} distributionData={distributionData} />
    </div>
  );
}
