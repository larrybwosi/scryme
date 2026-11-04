"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@repo/ui/components/ui/tabs";
import {
  LayoutDashboard,
  LineChart,
  Boxes,
} from "lucide-react";
import { DashboardHeader, WidgetVisibility } from "../../components/dashboard/dashboard-header";
import { StatCard } from "../../components/dashboard/stat-card";
import { RevenueChart } from "../../components/dashboard/revenue-chart";
import { CategoryDistributionChart } from "../../components/dashboard/category-distribution-chart";
import { RecentActivity } from "../../components/dashboard/recent-activity";
import { SalesHeatmap } from "../../components/dashboard/sales-heatmap";
import { PopularProducts } from "../../components/dashboard/popular-products";
import { AverageOrderValueChart } from "../../components/dashboard/average-order-value-chart";
import { AverageSalesChart } from "../../components/dashboard/average-sales-chart";
import { TotalSessionsChart } from "../../components/dashboard/total-sessions-chart";
import { DashboardData } from "../actions/dashboard";

interface DashboardClientProps {
  data: DashboardData;
  userName: string;
  date: string;
  currency: string;
  initialTab?: string;
}

export function DashboardClient({
  data,
  userName,
  date,
  currency,
  initialTab = "overview",
}: DashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [widgets, setWidgets] = useState<WidgetVisibility>({
    statCards: true,
    revenueChart: true,
    categoryDistribution: true,
    recentActivity: true,
    salesHeatmap: true,
    popularProducts: true,
    averageOrderValue: true,
    averageSales: true,
    totalSessions: true,
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("scryme_dashboard_widgets");
      if (saved) {
        setWidgets(JSON.parse(saved));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    const params = new URLSearchParams(searchParams);
    params.set("tab", val);
    router.push(`/dashboard?${params.toString()}`);
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="space-y-6">
      <DashboardHeader
        userName={userName}
        date={date}
        widgets={widgets}
        onWidgetsChange={setWidgets}
      />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6">
        <TabsList className="bg-muted/80 p-1 rounded-xl border border-border/50 inline-flex">
          <TabsTrigger
            value="overview"
            className="flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">
            <LayoutDashboard className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">
            <LineChart className="w-4 h-4" />
            Analytics / Sales
          </TabsTrigger>
          <TabsTrigger
            value="inventory"
            className="flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">
            <Boxes className="w-4 h-4" />
            Inventory & Activity
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview" className="mt-0 space-y-6 outline-none">
          {widgets.statCards && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <StatCard
                title="Total Products"
                value={data.stats.totalProducts.value.toLocaleString()}
                change={data.stats.totalProducts.change}
                icon="products"
              />
              <StatCard
                title="Total Sales"
                value={data.stats.totalSales.value.toLocaleString()}
                change={data.stats.totalSales.change}
                icon="sales"
              />
              <StatCard
                title="Total Income"
                value={formatCurrency(data.stats.totalIncome.value)}
                change={data.stats.totalIncome.change}
                icon="income"
              />
              <StatCard
                title="Total Expenses"
                value={formatCurrency(data.stats.totalExpenses.value)}
                change={data.stats.totalExpenses.change}
                icon="expenses"
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {widgets.revenueChart && (
              <div className={widgets.categoryDistribution ? "lg:col-span-2" : "lg:col-span-3"}>
                <RevenueChart
                  data={data.totalRevenue.chartData}
                  currency={currency}
                />
              </div>
            )}
            {widgets.categoryDistribution && (
              <div className={widgets.revenueChart ? "lg:col-span-1" : "lg:col-span-3"}>
                <CategoryDistributionChart
                  data={data.categoryDistribution}
                  totalSales={data.categoryTotalSales}
                  currency={currency}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {widgets.recentActivity && (
              <RecentActivity data={data.recentActivity} />
            )}
            {widgets.salesHeatmap && (
              <SalesHeatmap data={data.heatmapData} currency={currency} />
            )}
          </div>

          {widgets.popularProducts && (
            <div>
              <PopularProducts products={data.popularProducts} currency={currency} />
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Analytics & Sales */}
        <TabsContent value="analytics" className="mt-0 space-y-6 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RevenueChart
                data={data.totalRevenue.chartData}
                currency={currency}
              />
            </div>
            <div className="lg:col-span-1">
              <CategoryDistributionChart
                data={data.categoryDistribution}
                totalSales={data.categoryTotalSales}
                currency={currency}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AverageOrderValueChart
              data={data.averageOrderValue.chartData}
              value={formatCurrency(data.averageOrderValue.value)}
              change={data.averageOrderValue.change}
              periodLabel={data.periodLabel}
              currency={currency}
            />
            <AverageSalesChart
              data={data.averageSales.chartData}
              value={data.averageSales.value.toLocaleString()}
              change={data.averageSales.change}
              periodLabel={data.periodLabel}
            />
            <TotalSessionsChart
              data={data.totalSessions.chartData}
              value={data.totalSessions.value.toLocaleString()}
              change={data.totalSessions.change}
              periodLabel={data.periodLabel}
            />
          </div>
        </TabsContent>

        {/* Tab 3: Inventory & Activity */}
        <TabsContent value="inventory" className="mt-0 space-y-6 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentActivity data={data.recentActivity} />
            <SalesHeatmap data={data.heatmapData} currency={currency} />
          </div>

          <div>
            <PopularProducts products={data.popularProducts} currency={currency} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
