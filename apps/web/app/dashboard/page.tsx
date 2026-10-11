import { Metadata } from "next";
import { getServerAuth } from "@repo/auth/server";
import { getDashboardData } from "../actions/dashboard";
import { DashboardHeader } from "../../components/dashboard/dashboard-header";
import { StatCard } from "../../components/dashboard/stat-card";
import { RevenueChart } from "../../components/dashboard/revenue-chart";
import { PopularProducts } from "../../components/dashboard/popular-products";
import { SalesHeatmap } from "../../components/dashboard/sales-heatmap";
import { CategoryDistributionChart } from "../../components/dashboard/category-distribution-chart";
import { AverageOrderValueChart } from "../../components/dashboard/average-order-value-chart";
import { AverageSalesChart } from "../../components/dashboard/average-sales-chart";
import { format } from "date-fns";
import { Suspense } from "react";
import { db } from "@repo/db";
import { redirect } from "next/navigation";
import { DashboardSkeleton } from "./loading";

export const metadata: Metadata = {
  title: "Dashboard | Scryme",
  description:
    "View organization key performance indicators, sales activity heatmap, revenue trends, and operational metrics.",
};

async function DashboardContent({
  auth,
  timeframe,
}: {
  auth: NonNullable<Awaited<ReturnType<typeof getServerAuth>>>;
  timeframe: string;
}) {
  const [data, organization] = await Promise.all([
    getDashboardData(timeframe),
    db.organization.findUnique({
      where: { id: auth.organizationId },
      include: { settings: true },
    }),
  ]);

  const currency = organization?.settings?.defaultCurrency || "USD";
  const today = format(new Date(), "EEEE, dd MMMM yyyy");

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <>
      <DashboardHeader userName={auth.user.name} date={today} />

      {/* Top Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Sales Performance"
          value={formatCurrency(data.stats.salesPerformance.value)}
          change={data.stats.salesPerformance.change}
          label={data.periodLabel}
          icon="revenue"
          showTooltip
          tooltipText="Total completed transaction revenue for the selected period."
        />
        <StatCard
          title="Total Volume"
          value={data.stats.totalSales.value.toLocaleString()}
          change={data.stats.totalSales.change}
          label={data.periodLabel}
          icon="sales"
          showTooltip
          tooltipText="Total count of completed transactions."
        />
        <StatCard
          title="Average Revenue / Sale"
          value={formatCurrency(data.stats.averageRevenue.value)}
          change={data.stats.averageRevenue.change}
          label={data.periodLabel}
          icon="avg-revenue"
          showTooltip
          tooltipText="Average revenue generated per transaction."
        />
        <StatCard
          title="Items / Order"
          value={data.stats.averageOrder.value.toFixed(1)}
          change={data.stats.averageOrder.change}
          label={data.periodLabel}
          icon="avg-order"
          showTooltip
          tooltipText="Average number of items per completed order."
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart
            data={data.totalRevenue.chartData}
            totalValue={formatCurrency(data.totalRevenue.value)}
            change={data.totalRevenue.change}
            periodLabel={data.periodLabel}
            currency={currency}
          />
        </div>
        <div className="lg:col-span-1">
          <PopularProducts products={data.popularProducts} />
        </div>
      </div>

      {/* GitHub Style Sales Activity Heatmap Row */}
      <div>
        <SalesHeatmap data={data.heatmapData} currency={currency} />
      </div>

      {/* Bottom Metrics & Category Breakdown Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <CategoryDistributionChart data={data.categoryDistribution} />
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
      </div>
    </>
  );
}

export default async function DashboardPage(props: {
  searchParams: Promise<{ timeframe?: string }>;
}) {
  const searchParams = await props.searchParams;
  const timeframe = searchParams.timeframe || "month";

  const auth = await getServerAuth();

  if (!auth || !auth.organizationId) {
    redirect("/login");
  }

  return (
    <div className="p-6 md:p-8 max-w-(--breakpoint-2xl) mx-auto bg-background min-h-screen space-y-6">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent auth={auth} timeframe={timeframe} />
      </Suspense>
    </div>
  );
}
