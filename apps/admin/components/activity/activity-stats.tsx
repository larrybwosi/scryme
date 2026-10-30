"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Activity, ShoppingCart, LogIn, Building2 } from "lucide-react";

interface ActivityStatsProps {
  stats: {
    totalActivities: number;
    posSalesCount: number;
    loginCount: number;
    activeOrgs: number;
  };
}

export function ActivityStats({ stats }: ActivityStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            Total Activity Logs
          </CardTitle>
          <Activity className="size-4 text-primary" aria-hidden="true" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {stats.totalActivities.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Logged system & user events
          </p>
        </CardContent>
      </Card>

      <Card className="border border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            POS & Terminal Sales
          </CardTitle>
          <ShoppingCart
            className="size-4 text-emerald-500"
            aria-hidden="true"
          />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {stats.posSalesCount.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            POS transactions processed
          </p>
        </CardContent>
      </Card>

      <Card className="border border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            Login Sessions
          </CardTitle>
          <LogIn className="size-4 text-blue-500" aria-hidden="true" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {stats.loginCount.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            User authentication sessions
          </p>
        </CardContent>
      </Card>

      <Card className="border border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            Active Organizations
          </CardTitle>
          <Building2 className="size-4 text-amber-500" aria-hidden="true" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {stats.activeOrgs.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Active workspaces in logs
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
