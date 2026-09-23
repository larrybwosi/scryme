"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Activity,
  TrendingUp,
  Share2,
  Layers,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Clock,
  Radio,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/components/ui/card";
import { Badge } from "@repo/ui/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@repo/ui/components/ui/tabs";

interface DashboardChartsProps {
  growthTrend: Array<{
    date: string;
    users: number;
    organizations: number;
    transactions: number;
    volume: number;
  }>;
  acquisitionSources: Array<{
    source: string;
    count: number;
  }>;
  subscriptionTiers: Array<{
    tier: string;
    count: number;
  }>;
  recentAuditLogs: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    description: string;
    createdAt: Date | string;
    status: string;
    actorName: string | null;
    actorEmail: string | null;
    organizationId: string | null;
  }>;
  integrations: {
    sentryEnabled?: boolean;
    sentryProject?: string;
    openpanelEnabled?: boolean;
    openpanelClientId?: string;
    posthogEnabled?: boolean;
    posthogApiKey?: string;
    scrymeChatBaseUrl?: string;
    adminWorkspaceStatus?: string;
  };
}

const COLORS = [
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#8b5cf6", // violet-500
  "#f59e0b", // amber-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
  "#6366f1", // indigo-500
  "#84cc16", // lime-500
];

export function DashboardCharts({
  growthTrend,
  acquisitionSources,
  subscriptionTiers,
  recentAuditLogs,
  integrations,
}: DashboardChartsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="h-[380px] animate-pulse bg-card" />
        <Card className="h-[380px] animate-pulse bg-card" />
      </div>
    );
  }

  // Formatting date labels (e.g. "Oct 12")
  const formattedTrend = growthTrend.map((item) => {
    const parts = item.date.split("-");
    const month = new Date(Number(parts[0]), Number(parts[1]) - 1, 1).toLocaleString("en-US", {
      month: "short",
    });
    return {
      ...item,
      displayDate: `${month} ${parts[2]}`,
    };
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Time-Series Growth & Transaction Trend */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
              <TrendingUp className="size-4 text-primary" />
              Platform Growth & Activity (30 Days)
            </CardTitle>

            <CardDescription className="text-xs text-muted-foreground">
              Daily user signups, organization registrations, and transaction volume over time.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Registrations & Growth</TabsTrigger>
              <TabsTrigger value="transactions">Sales & Operations</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formattedTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorOrgs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                  <XAxis
                    dataKey="displayDate"
                    className="text-[11px] fill-muted-foreground"
                    tickLine={false}
                  />
                  <YAxis className="text-[11px] fill-muted-foreground" tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      borderRadius: "0.5rem",
                      color: "var(--foreground)",
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }} />
                  <Area
                    type="monotone"
                    dataKey="users"
                    name="Users Created"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorUsers)"
                  />
                  <Area
                    type="monotone"
                    dataKey="organizations"
                    name="Organizations Created"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorOrgs)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="transactions" className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                  <XAxis dataKey="displayDate" className="text-[11px] fill-muted-foreground" tickLine={false} />
                  <YAxis className="text-[11px] fill-muted-foreground" tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      borderRadius: "0.5rem",
                      color: "var(--foreground)",
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }} />
                  <Bar dataKey="transactions" name="Transactions Completed" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Two Column Section: Acquisition Sources & Subscriptions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Acquisition Source Breakdown */}
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                <Share2 className="size-4 text-primary" />
                User Acquisition Sources
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Distribution of acquisition channels across all users.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {acquisitionSources.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No acquisition source data available.</p>
            ) : (
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <div className="h-[220px] w-full sm:w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={acquisitionSources}
                        dataKey="count"
                        nameKey="source"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {acquisitionSources.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          borderColor: "var(--border)",
                          borderRadius: "0.5rem",
                          color: "var(--foreground)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-1/2">
                  {acquisitionSources.slice(0, 6).map((item, idx) => (
                    <div key={item.source} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="size-3 rounded-full"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        <span className="font-medium text-foreground">{item.source}</span>
                      </div>
                      <span className="font-semibold tabular-nums text-muted-foreground">{item.count} users</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscription Tier Distribution */}
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                <Layers className="size-4 text-primary" />
                Subscription Tiers Distribution
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Breakdown of active plan tiers across organizations.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {subscriptionTiers.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No active subscription data available.</p>
            ) : (
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subscriptionTiers} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                    <XAxis type="number" className="text-[11px] fill-muted-foreground" tickLine={false} allowDecimals={false} />
                    <YAxis dataKey="tier" type="category" className="text-[11px] fill-muted-foreground" tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        borderColor: "var(--border)",
                        borderRadius: "0.5rem",
                        color: "var(--foreground)",
                      }}
                    />
                    <Bar dataKey="count" name="Organizations" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analytics & Telemetry Integration Health Status */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Radio className="size-4 text-primary" />
              Telemetry & Analytics Integrations Status
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Integration health, event collection status, and provider dashboards.
            </CardDescription>
          </div>
          <Link href="/integrations" className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
            Configure Integrations
            <ArrowUpRight className="size-3" />
          </Link>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-2">
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-secondary/20 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">OpenPanel Analytics</span>
              {integrations.openpanelEnabled ? (
                <Badge variant="secondary" className="gap-1 bg-emerald-500/10 text-emerald-500">
                  <CheckCircle2 className="size-3" />
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1 text-muted-foreground">
                  <XCircle className="size-3" />
                  Disabled
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {integrations.openpanelEnabled
                ? `Client ID: ${integrations.openpanelClientId || "Configured"}`
                : "Not configured or disabled"}
            </p>
          </div>

          <div className="flex flex-col gap-2 rounded-lg border border-border bg-secondary/20 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">PostHog Analytics</span>
              {integrations.posthogEnabled ? (
                <Badge variant="secondary" className="gap-1 bg-emerald-500/10 text-emerald-500">
                  <CheckCircle2 className="size-3" />
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1 text-muted-foreground">
                  <XCircle className="size-3" />
                  Disabled
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {integrations.posthogEnabled ? "Event pipeline connected" : "Not configured or disabled"}
            </p>
          </div>

          <div className="flex flex-col gap-2 rounded-lg border border-border bg-secondary/20 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">Sentry Monitoring</span>
              {integrations.sentryEnabled ? (
                <Badge variant="secondary" className="gap-1 bg-emerald-500/10 text-emerald-500">
                  <CheckCircle2 className="size-3" />
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1 text-muted-foreground">
                  <XCircle className="size-3" />
                  Disabled
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {integrations.sentryEnabled
                ? `Project: ${integrations.sentryProject || "Default"}`
                : "Not configured"}
            </p>
          </div>

          <div className="flex flex-col gap-2 rounded-lg border border-border bg-secondary/20 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">Scryme Chat Alerts</span>
              <Badge variant="secondary" className="gap-1 bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="size-3" />
                {integrations.adminWorkspaceStatus || "Configured"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {integrations.scrymeChatBaseUrl ? "Notification gateway ready" : "Local fallback"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recent System Operations & Non-Sensitive Audit Feed */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Activity className="size-4 text-primary" />
              Recent System Operations & Audit Feed
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Real-time audit log of operations and system activities across organizations (non-sensitive details).
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {recentAuditLogs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No recent system operations logged.</p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {recentAuditLogs.map((log) => (
                <div key={log.id} className="flex flex-col justify-between gap-2 py-3 sm:flex-row sm:items-center">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-7 items-center justify-center rounded-full bg-primary/10">
                      <Clock className="size-3.5 text-primary" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground">{log.action}</span>
                        <Badge variant="outline" className="text-[10px] uppercase font-mono">
                          {log.entityType}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{log.description}</p>
                      {log.actorEmail && (
                        <span className="text-[11px] text-muted-foreground/80">
                          By: {log.actorName || log.actorEmail}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="tabular-nums">
                      {new Date(log.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <Badge
                      variant={log.status === "SUCCESS" ? "secondary" : "destructive"}
                      className="text-[10px]"
                    >
                      {log.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
