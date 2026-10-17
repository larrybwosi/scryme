import { Metadata } from "next";
import { getServerAuth } from "@repo/auth/server";
import { getDashboardData } from "../actions/dashboard";
import { DashboardHeader } from "../../components/dashboard/dashboard-header";
import { StatCard } from "../../components/dashboard/stat-card";
import { RevenueChart } from "../../components/dashboard/revenue-chart";
import { CategoryDistributionChart } from "../../components/dashboard/category-distribution-chart";
import { RecentActivity } from "../../components/dashboard/recent-activity";
import { SalesHeatmap } from "../../components/dashboard/sales-heatmap";
import { PopularProducts } from "../../components/dashboard/popular-products";
import { format } from "date-fns";
import { Suspense } from "react";
import { db } from "@repo/db";
import { redirect } from "next/navigation";
import { DashboardSkeleton } from "./loading";

export const metadata: Metadata = {
  title: "Dashboard | Scryme",
  description:
    "View key metrics, sales revenue, top category distribution, recent activity, sales heatmap, and top products.",
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

      {/* Top 4 Key Metric Stat Cards */}
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

      {/* Row 2: Sales Revenue Bar Chart (2 cols) & Top Categories Donut Chart (1 col) */}
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

      {/* Row 3: Recent Activity (1 col) & Half-width Sales Heatmap (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity data={data.recentActivity} />
        <SalesHeatmap data={data.heatmapData} currency={currency} />
      </div>

      {/* Row 4: Top Products Table */}
      <div>
        <PopularProducts products={data.popularProducts} currency={currency} />
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
