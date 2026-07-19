"use client";

import React from "react";
import useSWR from "swr";
import {
  Users,
  UserPlus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  MoreVertical,
  Calendar,
  ArrowUpRight,
  Target,
  Clock,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
  Bar,
  BarChart,
  Line,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { cn } from "@repo/ui/lib/utils";
import { StatCard } from "../../../components/ui/stat-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import {
  getDashboardStats,
  getRecentActivity,
  getCustomerData,
  getPipelineData,
  getDealSourceData,
  getTopDeals,
} from "../../actions/dashboard";
import { formatDistanceToNow } from "date-fns";

const formatCurrency = (value: number, currency: string = "USD") => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: value >= 100000 ? "compact" : "standard",
    }).format(value);
  } catch (e) {
    return `${currency} ${value.toLocaleString()}`;
  }
};

// Palette pulled from the existing design tokens (var(--color-*)) so charts
// stay in sync with light/dark theme automatically.
const SOURCE_COLORS = [
  "var(--color-primary)",
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#8b5cf6", // violet
];

const STAGE_COLORS: Record<string, string> = {
  Lead: "#94a3b8",
  Qualified: "#60a5fa",
  Proposal: "#a78bfa",
  Negotiation: "#f59e0b",
  Won: "#10b981",
};

function ChartCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="space-y-0.5">
          <CardTitle className="text-[14px] font-semibold">{title}</CardTitle>
          <CardDescription className="text-[11.5px]">
            {description}
          </CardDescription>
        </div>
        {action ?? (
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <MoreVertical size={14} />
          </Button>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

const tooltipStyle = {
  backgroundColor: "var(--color-card)",
  borderColor: "var(--color-border)",
  borderRadius: "8px",
  fontSize: "12px",
  boxShadow: "var(--shadow-md)",
};

const axisTick = { fontSize: 11, fill: "var(--color-muted-foreground)" };

export function DashboardView() {
  const { data: stats, isLoading: statsLoading } = useSWR(
    "dashboard-stats",
    () => getDashboardStats(),
  );

  const { data: activity, isLoading: activityLoading } = useSWR(
    "dashboard-activity",
    () => getRecentActivity(),
  );

  const { data: customerData, isLoading: customerLoading } = useSWR(
    "dashboard-customers",
    () => getCustomerData(),
  );

  const { data: pipelineData, isLoading: pipelineLoading } = useSWR(
    "dashboard-pipeline",
    () => getPipelineData(),
  );

  const { data: sourceData, isLoading: sourceLoading } = useSWR(
    "dashboard-deal-sources",
    () => getDealSourceData(),
  );

  const { data: topDeals, isLoading: topDealsLoading } = useSWR(
    "dashboard-top-deals",
    () => getTopDeals(),
  );

  const totalSourceValue = (sourceData || []).reduce(
    (sum: number, s: any) => sum + (s.value || 0),
    0,
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar bg-muted/20">
      {/* Page Header */}
      <div className="flex-shrink-0 border-b border-border bg-card/70 backdrop-blur-sm px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[17px] font-bold text-foreground tracking-tight">
              Dashboard
            </h1>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Welcome back — here&apos;s what&apos;s happening today.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-[12.5px]"
            >
              <Calendar size={13} />
              Last 30 Days
            </Button>
            <Button size="sm" className="h-8 text-[12.5px] gap-1.5">
              Download Report
              <ArrowUpRight size={13} />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pt-5 pb-6 space-y-4">
        {/* KPI cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            title="Total Revenue"
            value={
              statsLoading
                ? "—"
                : formatCurrency(stats?.revenue || 0, stats?.currency || "USD")
            }
            trend={{ value: "12.5%", positive: true }}
            icon={DollarSign}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50 dark:bg-emerald-950/30"
          />
          <StatCard
            title="Active Leads"
            value={statsLoading ? "—" : stats?.activeLeads || 0}
            trend={{ value: "8.2%", positive: true }}
            icon={UserPlus}
            iconColor="text-blue-600"
            iconBg="bg-blue-50 dark:bg-blue-950/30"
          />
          <StatCard
            title="Total Customers"
            value={statsLoading ? "—" : stats?.totalCustomers || 0}
            trend={{ value: "4.1%", positive: true }}
            icon={Users}
            iconColor="text-violet-600"
            iconBg="bg-violet-50 dark:bg-violet-950/30"
          />
          <StatCard
            title="Open Deals"
            value={statsLoading ? "—" : stats?.openDeals || 0}
            trend={{ value: "2.4%", positive: false }}
            icon={TrendingUp}
            iconColor="text-orange-600"
            iconBg="bg-orange-50 dark:bg-orange-950/30"
          />
        </div>

        {/* Row 2: Revenue trend + Deal sources */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ChartCard
            title="Revenue & Customer Growth"
            description="Monthly recurring revenue vs. new customers"
            className="lg:col-span-2"
          >
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={customerData || []}>
                  <defs>
                    <linearGradient
                      id="colorRevenue"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="var(--color-primary)"
                        stopOpacity={0.18}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-primary)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--color-border)"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={axisTick}
                    dy={8}
                  />
                  <YAxis
                    yAxisId="left"
                    axisLine={false}
                    tickLine={false}
                    tick={axisTick}
                    tickFormatter={(v: number) => String(v)}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={axisTick}
                    tickFormatter={(v: number) =>
                      v >= 1000 ? `${v / 1000}k` : String(v)
                    }
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend
                    wrapperStyle={{ fontSize: 11 }}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="customers"
                    name="New Customers"
                    fill="#60a5fa"
                    radius={[4, 4, 0, 0]}
                    barSize={18}
                    opacity={0.85}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard
            title="Deals by Source"
            description="Where won deals originated"
          >
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceData || []}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {(sourceData || []).map((entry: any, i: number) => (
                      <Cell
                        key={entry.name}
                        fill={SOURCE_COLORS[i % SOURCE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-1">
              {(sourceData || []).map((entry: any, i: number) => {
                const pct = totalSourceValue
                  ? Math.round((entry.value / totalSourceValue) * 100)
                  : 0;
                return (
                  <div
                    key={entry.name}
                    className="flex items-center justify-between text-[11.5px]"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor:
                            SOURCE_COLORS[i % SOURCE_COLORS.length],
                        }}
                      />
                      <span className="text-muted-foreground truncate">
                        {entry.name}
                      </span>
                    </div>
                    <span className="font-medium text-foreground flex-shrink-0">
                      {pct}%
                    </span>
                  </div>
                );
              })}
              {sourceLoading && (
                <div className="text-center py-2 text-[11.5px] text-muted-foreground">
                  Loading…
                </div>
              )}
            </div>
          </ChartCard>
        </div>

        {/* Row 3: Pipeline funnel + Recent activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ChartCard
            title="Sales Pipeline"
            description="Open deal value by stage"
            className="lg:col-span-2"
          >
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={pipelineData || []}
                  layout="vertical"
                  margin={{ left: 8 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="var(--color-border)"
                  />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={axisTick}
                    tickFormatter={(v: number) =>
                      v >= 1000 ? `$${v / 1000}k` : `$${v}`
                    }
                  />
                  <YAxis
                    type="category"
                    dataKey="stage"
                    axisLine={false}
                    tickLine={false}
                    tick={axisTick}
                    width={90}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: any) => formatCurrency(Number(v))}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22}>
                    {(pipelineData || []).map((entry: any) => (
                      <Cell
                        key={entry.stage}
                        fill={
                          STAGE_COLORS[entry.stage] || "var(--color-primary)"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {pipelineLoading && (
              <div className="text-center py-2 text-[11.5px] text-muted-foreground">
                Loading pipeline…
              </div>
            )}
          </ChartCard>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="space-y-0.5">
                <CardTitle className="text-[14px] font-semibold">
                  Recent Activity
                </CardTitle>
                <CardDescription className="text-[11.5px]">
                  Latest CRM updates
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activityLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                  </div>
                ) : !activity?.length ? (
                  <div className="text-center py-8 text-[12.5px] text-muted-foreground">
                    No recent activity
                  </div>
                ) : (
                  activity.map((act: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center font-semibold text-[11px] flex-shrink-0",
                          act.type === "customer"
                            ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40"
                            : "bg-blue-100 text-blue-600 dark:bg-blue-950/40",
                        )}
                      >
                        {act.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-medium text-foreground truncate">
                          {act.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {act.action}
                        </p>
                      </div>
                      <div className="text-[10.5px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                        {formatDistanceToNow(new Date(act.createdAt), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <Button
                variant="ghost"
                className="w-full mt-5 text-[12.5px] text-primary hover:text-primary/80 h-8"
              >
                View All Activity
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Row 4: Top deals table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="space-y-0.5">
              <CardTitle className="text-[14px] font-semibold">
                Top Open Deals
              </CardTitle>
              <CardDescription className="text-[11.5px]">
                Highest-value deals currently in progress
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-[12px] gap-1">
              View pipeline
              <ArrowUpRight size={12} />
            </Button>
          </CardHeader>
          <CardContent className="px-0">
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-[11px] uppercase tracking-wide">
                    <th className="text-left font-medium px-6 py-2">Deal</th>
                    <th className="text-left font-medium px-6 py-2">Stage</th>
                    <th className="text-left font-medium px-6 py-2">Owner</th>
                    <th className="text-right font-medium px-6 py-2">Value</th>
                    <th className="text-right font-medium px-6 py-2">Closes</th>
                  </tr>
                </thead>
                <tbody>
                  {topDealsLoading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-8 text-muted-foreground"
                      >
                        Loading deals…
                      </td>
                    </tr>
                  ) : !topDeals?.length ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No open deals
                      </td>
                    </tr>
                  ) : (
                    topDeals.map((deal: any) => (
                      <tr
                        key={deal.id}
                        className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors"
                      >
                        <td className="px-6 py-3 font-medium text-foreground">
                          {deal.name}
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium"
                            style={{
                              backgroundColor: `${STAGE_COLORS[deal.stage] || "var(--color-primary)"}1A`,
                              color:
                                STAGE_COLORS[deal.stage] ||
                                "var(--color-primary)",
                            }}
                          >
                            {deal.stage}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-muted-foreground">
                          {deal.owner}
                        </td>
                        <td className="px-6 py-3 text-right font-semibold text-foreground">
                          {formatCurrency(deal.value)}
                        </td>
                        <td className="px-6 py-3 text-right text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Clock size={11} />
                            {deal.closeDate}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
