"use client";

import React from "react";
import {
  Activity,
  Circle,
  Clock,
  CheckCircle2,
  Mail,
  Phone,
  StickyNote,
  UserPlus,
  TrendingUp,
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

interface ActivitiesTabProps {
  customer: any;
}

const ACTIVITY_ICONS: Record<string, any> = {
  CREATION: UserPlus,
  UPDATE: Activity,
  EMAIL: Mail,
  CALL: Phone,
  NOTE: StickyNote,
  DEAL_MOVE: TrendingUp,
};

const ACTIVITY_COLORS: Record<string, string> = {
  CREATION: "text-blue-600 bg-blue-50",
  UPDATE: "text-amber-600 bg-amber-50",
  EMAIL: "text-purple-600 bg-purple-50",
  CALL: "text-green-600 bg-green-50",
  NOTE: "text-orange-600 bg-orange-50",
  DEAL_MOVE: "text-indigo-600 bg-indigo-50",
};

export function ActivitiesTab({ customer }: ActivitiesTabProps) {
  const activities = customer.crmRecord?.activities || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-[15px] font-bold text-foreground">
            Activity Timeline
          </h3>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            History of all interactions and updates
          </p>
        </div>
      </div>

      {activities.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No activity recorded"
          description="Activity will appear here as you interact with this customer."
        />
      ) : (
        <div className="relative space-y-6 before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-linear-to-b before:from-border before:via-border before:to-transparent">
          {activities.map((activity: any, idx: number) => {
            const Icon = ACTIVITY_ICONS[activity.type] || Activity;
            const colorClass =
              ACTIVITY_COLORS[activity.type] ||
              "text-muted-foreground bg-muted";

            return (
              <div
                key={activity.id}
                className="relative flex items-start gap-4"
              >
                <div
                  className={cn(
                    "relative z-10 w-8 h-8 rounded-full border-4 border-background flex items-center justify-center shrink-0 shadow-sm",
                    colorClass,
                  )}
                >
                  <Icon size={14} />
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-[13.5px] font-semibold text-foreground">
                      {activity.description}
                    </p>
                    <time className="text-[11.5px] text-muted-foreground whitespace-nowrap">
                      {formatDate(activity.createdAt)}
                    </time>
                  </div>
                  {activity.member && (
                    <p className="text-[12px] text-muted-foreground">
                      by{" "}
                      <span className="font-medium text-foreground">
                        {activity.member.user?.name || activity.member.email}
                      </span>
                    </p>
                  )}
                  {activity.metadata && (
                    <div className="mt-2 p-3 bg-muted/40 rounded-lg border border-border/50">
                      {/* We could render detailed changes here */}
                      <pre className="text-[11px] text-muted-foreground overflow-auto">
                        {JSON.stringify(activity.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
