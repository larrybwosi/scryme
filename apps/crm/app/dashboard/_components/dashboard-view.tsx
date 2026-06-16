"use client";

import React from "react";
import useSWR from "swr";
import {
  Users,
  UserPlus,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Calendar,
} from "lucide-react";
import {
  LineChart,
  Line,
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
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/ui/avatar";
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

  const { data: salesData, isLoading: salesLoading } = useSWR(
    organizationId ? ["dashboard-sales", organizationId] : null,
    () => getSalesData(organizationId!)
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar bg-background/50">
      <div className="px-8 pt-7 pb-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Welcome back! Here's what's happening with your business today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="h-9 gap-2">
              <Calendar size={15} />
              Last 30 Days
            </Button>
            <Button size="sm" className="h-9">
              Download Report
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Revenue"
            value={statsLoading ? "..." : `$${stats?.revenue.toLocaleString()}`}
            trend={{ value: "12.5%", positive: true }}
            icon={DollarSign}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
          />
          <StatCard
            title="Active Leads"
            value={statsLoading ? "..." : stats?.activeLeads || 0}
            trend={{ value: "8.2%", positive: true }}
            icon={UserPlus}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
          />
          <StatCard
            title="Total Customers"
            value={statsLoading ? "..." : stats?.totalCustomers || 0}
            trend={{ value: "4.1%", positive: true }}
            icon={Users}
            iconColor="text-purple-600"
            iconBg="bg-purple-50"
          />
          <StatCard
            title="Open Deals"
            value={statsLoading ? "..." : stats?.openDeals || 0}
            trend={{ value: "2.4%", positive: false }}
            icon={TrendingUp}
            iconColor="text-orange-600"
            iconBg="bg-orange-50"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Overview Chart */}
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-8">
              <div className="space-y-1">
                <CardTitle className="text-base font-semibold">Sales Overview</CardTitle>
                <CardDescription className="text-xs">
                  Monthly sales performance and trends
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical size={16} />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesData || []}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="hsl(var(--primary))"
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
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-6">
              <div className="space-y-1">
                <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
                <CardDescription className="text-xs">
                  Latest updates from your CRM
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {activityLoading ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">Loading activity...</div>
                ) : activity?.length === 0 ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">No recent activity</div>
                ) : (
                  activity?.map((act: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center font-semibold text-xs",
                        act.type === 'customer' ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
                      )}>
                        {act.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-foreground truncate">
                          {act.name}
                        </p>
                        <p className="text-[12px] text-muted-foreground truncate">
                          {act.action}
                        </p>
                      </div>
                      <div className="text-[11px] text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <Button variant="ghost" className="w-full mt-6 text-[13px] text-primary hover:text-primary/80 h-9">
                View All Activity
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
