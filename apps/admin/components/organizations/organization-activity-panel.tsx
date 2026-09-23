"use client";

import {
  Users,
  MapPin,
  Receipt,
  Smartphone,
  Package,
  DollarSign,
  Activity,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/components/ui/card";
import { Badge } from "@repo/ui/components/ui/badge";

interface OrganizationActivityPanelProps {
  usage: {
    memberCount: number;
    locationCount: number;
    transactionCount: number;
    deviceCount: number;
    batchCount: number;
    totalSalesVolume: number;
  };
  activityLogs: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    description: string;
    createdAt: Date | string;
    status: string;
    severity: string;
    actorName: string | null;
    actorEmail: string | null;
  }>;
  acquisitionSource?: string | null;
}

export function OrganizationActivityPanel({
  usage,
  activityLogs,
  acquisitionSource,
}: OrganizationActivityPanelProps) {
  const metricCards = [
    { label: "Members", value: usage.memberCount, icon: Users },
    { label: "Active Locations", value: usage.locationCount, icon: MapPin },
    { label: "Transactions", value: usage.transactionCount, icon: Receipt },
    { label: "POS Devices", value: usage.deviceCount, icon: Smartphone },
    { label: "Stock Batches", value: usage.batchCount, icon: Package },
    {
      label: "Sales Volume",
      value: `$${usage.totalSalesVolume.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      icon: DollarSign,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Usage & Operations Metric Cards */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-semibold text-foreground">
              Organization Operations & Usage Overview
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Non-sensitive aggregated operational statistics and platform utilization metrics.
            </CardDescription>
          </div>
          {acquisitionSource && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Acquisition Source:</span>
              <Badge variant="outline">{acquisitionSource}</Badge>
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-2">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {metricCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="flex flex-col gap-1 rounded-lg border border-border bg-secondary/20 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">{card.label}</span>
                    <Icon className="size-3.5 text-primary" />
                  </div>
                  <span className="text-lg font-semibold tabular-nums text-foreground">
                    {card.value}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Activity & Operations Feed */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Activity className="size-4 text-primary" />
            Recent Organization Activity & Operations
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Recent activity log and administrative events for this organization (sensitive payload details excluded).
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          {activityLogs.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No recent activity logs recorded for this organization.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {activityLogs.map((log) => (
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
                          Actor: {log.actorName || log.actorEmail}
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
