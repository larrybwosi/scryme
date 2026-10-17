"use client";

import { Card } from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { History, ShoppingBag, AlertTriangle, Tag, Laptop } from "lucide-react";
import { RecentActivityItem } from "../../app/actions/dashboard";

interface RecentActivityProps {
  data: RecentActivityItem[];
}

export function RecentActivity({ data }: RecentActivityProps) {
  const getIcon = (type: RecentActivityItem["type"]) => {
    switch (type) {
      case "order":
        return <ShoppingBag className="h-4 w-4 text-blue-500" />;
      case "stock":
        return <AlertTriangle className="h-4 w-4 text-rose-500" />;
      case "promo":
        return <Tag className="h-4 w-4 text-purple-500" />;
      case "system":
        return <Laptop className="h-4 w-4 text-slate-500" />;
    }
  };

  const getIconBg = (type: RecentActivityItem["type"]) => {
    switch (type) {
      case "order":
        return "bg-blue-50 dark:bg-blue-950/40";
      case "stock":
        return "bg-rose-50 dark:bg-rose-950/40";
      case "promo":
        return "bg-purple-50 dark:bg-purple-950/40";
      case "system":
        return "bg-slate-100 dark:bg-slate-800/60";
    }
  };

  const getBadgeStyle = (type: RecentActivityItem["type"]) => {
    switch (type) {
      case "order":
        return "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-200/50";
      case "stock":
        return "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-200/50";
      case "promo":
        return "bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border-purple-200/50";
      case "system":
        return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/50";
    }
  };

  return (
    <Card className="p-6 bg-card border-border/60 shadow-xs rounded-2xl h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            Recent Activity
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground h-7 px-2.5 rounded-lg"
          >
            See All
          </Button>
        </div>

        <div className="space-y-3">
          {data.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-xl border border-border/40 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-xl flex items-center justify-center shrink-0 ${getIconBg(
                    item.type,
                  )}`}
                >
                  {getIcon(item.type)}
                </div>
                <div>
                  <h5 className="text-xs font-semibold text-foreground">
                    {item.title}
                  </h5>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
              </div>

              <span
                className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border shrink-0 ${getBadgeStyle(
                  item.type,
                )}`}
              >
                {item.badgeText}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
