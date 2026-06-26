"use client";

import React from "react";
import useSWR from "swr";
import { Activity, Clock, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useOrg } from "../../../components/org-context";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { cn } from "@repo/ui/lib/utils";

export function ActivitiesView() {
  const { organizationId } = useOrg();
  const { data: activities, isLoading } = useSWR(
    organizationId ? ["activities", organizationId] : null,
    async () => {
      const res = await fetch(`/api/activities?organizationId=${organizationId}`);
      if (!res.ok) return [];
      return res.json();
    }
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
      <div className="flex-shrink-0 border-b border-border bg-card/50 px-6 py-4">
        <h1 className="text-[17px] font-bold text-foreground tracking-tight">Recent Activities</h1>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          A real-time log of all CRM interactions.
        </p>
      </div>

      <div className="px-6 py-6 max-w-4xl">
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-semibold">Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                        </div>
                    ) : !activities?.length ? (
                        <div className="flex items-center justify-center py-12 text-muted-foreground text-sm italic">
                            No activities found.
                        </div>
                    ) : (
                        activities.map((act: any) => (
                            <div key={act.id} className="flex gap-4">
                                <div className="mt-1 w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                    <Activity size={14} className="text-muted-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-medium text-foreground">
                                            {act.member?.user?.name || "System"}
                                        </p>
                                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                            <Clock size={12} />
                                            {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}
                                        </div>
                                    </div>
                                    <p className="text-[13px] text-muted-foreground mt-0.5">
                                        {act.description}
                                    </p>
                                    {act.type && (
                                        <span className="inline-block mt-2 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                                            {act.type}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
