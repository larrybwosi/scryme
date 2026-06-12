import { getServerAuth } from "@repo/auth/server";
import { redirect } from "next/navigation";
import { getDashboardData } from "../actions/dashboard";
import { DashboardHeader } from "../../components/dashboard/dashboard-header";
import { StatCard } from "../../components/dashboard/stat-card";
import { RevenueChart } from "../../components/dashboard/revenue-chart";
import { PopularProducts } from "../../components/dashboard/popular-products";
import { AverageOrderValueChart } from "../../components/dashboard/average-order-value-chart";
import { AverageSalesChart } from "../../components/dashboard/average-sales-chart";
import { TotalSessionsChart } from "../../components/dashboard/total-sessions-chart";
import { format } from "date-fns";
import { Suspense } from "react";
import { db } from "@repo/db";

export default async function DashboardPage(props: {
  searchParams: Promise<{ timeframe?: string }>;
}) {
  const searchParams = await props.searchParams;
  const timeframe = searchParams.timeframe || "month";

  const auth = await getServerAuth();
  if (!auth) {
    redirect("/login?callbackUrl=/dashboard");
  }

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
    <div className="p-8 max-w-(--breakpoint-2xl) mx-auto">
      <Suspense fallback={<div>Loading dashboard...</div>}>
        <DashboardHeader userName={auth.user.name} date={today} />

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard
            title="Sales performance"
            value={formatCurrency(data.stats.salesPerformance.value)}
            change={data.stats.salesPerformance.change}
            label={data.periodLabel}
            icon="revenue"
          />
          <StatCard
            title="Total Sales"
            value={data.stats.totalSales.value.toLocaleString()}
            change={data.stats.totalSales.change}
            label={data.periodLabel}
            icon="sales"
          />
          <StatCard
            title="Average Revenue"
            value={formatCurrency(data.stats.averageRevenue.value)}
            change={data.stats.averageRevenue.change}
            label={data.periodLabel}
            icon="avg-revenue"
          />
          <StatCard
            title="Average Order"
            value={data.stats.averageOrder.value.toFixed(1)}
            change={data.stats.averageOrder.change}
            label={data.periodLabel}
            icon="avg-order"
          />
        </div>

        {/* Main Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <RevenueChart
              data={data.totalRevenue.chartData}
              totalValue={formatCurrency(data.totalRevenue.value)}
              change={data.totalRevenue.change}
              periodLabel={data.periodLabel}
            />
          </div>
          <div>
            <PopularProducts products={data.popularProducts} />
          </div>
        </div>

        {/* Bottom Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AverageOrderValueChart
            data={data.averageOrderValue.chartData}
            value={formatCurrency(data.averageOrderValue.value)}
            change={data.averageOrderValue.change}
            periodLabel={data.periodLabel}
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
      </Suspense>
    </div>
  );
}
