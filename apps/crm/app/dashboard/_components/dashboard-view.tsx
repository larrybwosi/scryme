"use client";

import React from "react";
import useSWR from "swr";
import {
  Users,
  UserPlus,
  TrendingUp,
  DollarSign,
  MoreVertical,
  Calendar,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { cn } from "@repo/ui/lib/utils";
import { StatCard } from "../../../components/ui/stat-card";
import { useOrg } from "../../../components/org-context";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { getDashboardStats, getRecentActivity, getSalesData } from "../../actions/dashboard";
import { formatDistanceToNow } from "date-fns";

export function DashboardView() {
  const { organizationId } = useOrg();

  const { data: stats, isLoading: statsLoading } = useSWR(
    organizationId ? ["dashboard-stats", organizationId] : null,
    () => getDashboardStats(organizationId!)
  );

  const { data: activity, isLoading: activityLoading } = useSWR(
    organizationId ? ["dashboard-activity", organizationId] : null,
    () => getRecentActivity(organizationId!)
  );

  const { data: salesData } = useSWR(
    organizationId ? ["dashboard-sales", organizationId] : null,
    () => getSalesData(organizationId!)
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
      {/* Page Header */}
      <div className="flex-shrink-0 border-b border-border bg-card/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[17px] font-bold text-foreground tracking-tight">Dashboard</h1>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Welcome back — here&apos;s what&apos;s happening today.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-[12.5px]">
              <Calendar size={13} />
              Last 30 Days
            </Button>
            <Button size="sm" className="h-8 text-[12.5px]">
              Download Report
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pt-5 pb-6">
        {/* KPI cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard
            title="Total Revenue"
            value={statsLoading ? "—" : `$${(stats?.revenue || 0).toLocaleString()}`}
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

        {/* Charts + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Sales chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="space-y-0.5">
                <CardTitle className="text-[14px] font-semibold">Sales Overview</CardTitle>
                <CardDescription className="text-[11.5px]">
                  Monthly revenue performance
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreVertical size={14} />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesData || []}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                      dy={8}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                      tickFormatter={(v: number) => `$${v}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-card)",
                        borderColor: "var(--color-border)",
                        borderRadius: "8px",
                        fontSize: "12px",
                        boxShadow: "var(--shadow-md)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="var(--color-primary)"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorSales)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="space-y-0.5">
                <CardTitle className="text-[14px] font-semibold">Recent Activity</CardTitle>
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
                            : "bg-blue-100 text-blue-600 dark:bg-blue-950/40"
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
      </div>
    </div>
  );
}
