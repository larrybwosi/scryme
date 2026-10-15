"use client";

import { useMemo, useState } from "react";
import { Card } from "@repo/ui/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui/components/ui/tooltip";
import { HeatmapDay } from "../../app/actions/dashboard";
import { Activity, Calendar, Zap, DollarSign } from "lucide-react";
import { format, parseISO, getDay, startOfWeek, addDays } from "date-fns";
import { getCurrencySymbol } from "../../lib/utils";

interface SalesHeatmapProps {
  data: HeatmapDay[];
  currency?: string;
}

export function SalesHeatmap({ data, currency = "USD" }: SalesHeatmapProps) {
  const [metric, setMetric] = useState<"count" | "revenue">("count");
  const symbol = getCurrencySymbol(currency);

  // Group days by week columns for GitHub style grid
  const { weeks, monthLabels, stats } = useMemo(() => {
    if (!data || data.length === 0) {
      return { weeks: [], monthLabels: [], stats: { totalTransactions: 0, activeDays: 0, maxDaily: 0, totalRevenue: 0 } };
    }

    const firstDate = parseISO(data[0].date);
    const gridStart = startOfWeek(firstDate, { weekStartsOn: 0 }); // Sunday start

    // Map date string -> HeatmapDay
    const dataMap = new Map<string, HeatmapDay>();
    let totalTx = 0;
    let activeDays = 0;
    let maxCount = 0;
    let totalRev = 0;

    data.forEach((item) => {
      dataMap.set(item.date, item);
      totalTx += item.count;
      totalRev += item.revenue;
      if (item.count > 0) activeDays += 1;
      if (item.count > maxCount) maxCount = item.count;
    });

    // Build weeks array (53 columns x 7 rows)
    const weeksList: { dateStr: string; day: HeatmapDay | null; dayOfWeek: number }[][] = [];
    const months: { label: string; weekIndex: number }[] = [];
    let currentWeek: { dateStr: string; day: HeatmapDay | null; dayOfWeek: number }[] = [];
    let lastMonth = -1;

    let curr = gridStart;
    const lastDate = parseISO(data[data.length - 1].date);

    let weekIndex = 0;

    while (curr <= lastDate || (currentWeek.length > 0 && getDay(curr) !== 0)) {
      const dateStr = format(curr, "yyyy-MM-dd");
      const dayOfWeek = getDay(curr);
      const month = curr.getMonth();

      if (dayOfWeek === 0 && currentWeek.length > 0) {
        weeksList.push(currentWeek);
        currentWeek = [];
        weekIndex += 1;
      }

      if (month !== lastMonth && dayOfWeek === 0) {
        months.push({
          label: format(curr, "MMM"),
          weekIndex,
        });
        lastMonth = month;
      }

      const item = dataMap.get(dateStr) || null;
      currentWeek.push({
        dateStr,
        day: item,
        dayOfWeek,
      });

      curr = addDays(curr, 1);
    }

    if (currentWeek.length > 0) {
      weeksList.push(currentWeek);
    }

    return {
      weeks: weeksList,
      monthLabels: months,
      stats: {
        totalTransactions: totalTx,
        activeDays,
        maxDaily: maxCount,
        totalRevenue: totalRev,
      },
    };
  }, [data]);

  const levelColor = (level: number) => {
    switch (level) {
      case 1:
        return "bg-emerald-200 dark:bg-emerald-950/80 border-emerald-300/40 dark:border-emerald-800/40";
      case 2:
        return "bg-emerald-400 dark:bg-emerald-700/90 border-emerald-500/50";
      case 3:
        return "bg-emerald-500 dark:bg-emerald-500 border-emerald-600/50";
      case 4:
        return "bg-emerald-600 dark:bg-emerald-400 border-emerald-700/50";
      case 0:
      default:
        return "bg-muted/40 hover:bg-muted/70 dark:bg-slate-800/40 border-transparent";
    }
  };

  const formatCurrencyValue = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <Card className="p-6 bg-card border-border shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-500" /> Sales Activity & Consistency
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Daily transaction breakdown and operational activity heat grid over the last 365 days
          </p>
        </div>

        {/* Quick summary badges */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5 bg-muted/50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-border/50">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-muted-foreground">Active Days:</span>
            <span className="text-foreground font-bold">{stats.activeDays}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-muted/50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-border/50">
            <Calendar className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-muted-foreground">Total Sales:</span>
            <span className="text-foreground font-bold">{stats.totalTransactions.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-muted/50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-border/50">
            <DollarSign className="h-3.5 w-3.5 text-primary" />
            <span className="text-muted-foreground">Total Revenue:</span>
            <span className="text-foreground font-bold">{formatCurrencyValue(stats.totalRevenue)}</span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <TooltipProvider delayDuration={50}>
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[760px]">
            {/* Month Header Row */}
            <div className="flex text-[11px] text-muted-foreground font-medium mb-2 pl-8">
              {monthLabels.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    position: "relative",
                    left: `${m.weekIndex * 14}px`,
                    marginRight: idx < monthLabels.length - 1 ? "0px" : "auto",
                  }}
                  className="absolute"
                >
                  {m.label}
                </div>
              ))}
            </div>

            <div className="pt-5 flex gap-1">
              {/* Day of Week Labels Column */}
              <div className="grid grid-rows-7 gap-1 text-[10px] text-muted-foreground font-medium pr-2 select-none h-[104px]">
                <span className="leading-[12px] flex items-center">Sun</span>
                <span className="leading-[12px] flex items-center opacity-0">Mon</span>
                <span className="leading-[12px] flex items-center">Tue</span>
                <span className="leading-[12px] flex items-center opacity-0">Wed</span>
                <span className="leading-[12px] flex items-center">Thu</span>
                <span className="leading-[12px] flex items-center opacity-0">Fri</span>
                <span className="leading-[12px] flex items-center">Sat</span>
              </div>

              {/* Grid Columns (Weeks) */}
              <div className="flex gap-1 flex-1">
                {weeks.map((week, wIdx) => (
                  <div key={wIdx} className="grid grid-rows-7 gap-1">
                    {week.map((cell) => {
                      const day = cell.day;
                      const formattedDate = day
                        ? format(parseISO(day.date), "EEEE, MMM d, yyyy")
                        : format(parseISO(cell.dateStr), "EEEE, MMM d, yyyy");

                      const count = day ? day.count : 0;
                      const revenue = day ? day.revenue : 0;
                      const level = day ? day.level : 0;

                      return (
                        <Tooltip key={cell.dateStr}>
                          <TooltipTrigger asChild>
                            <div
                              className={`w-3 h-3 rounded-[2.5px] border transition-all duration-150 cursor-pointer ${levelColor(
                                level
                              )} hover:ring-2 hover:ring-primary/50 hover:scale-110 z-0 hover:z-10`}
                            />
                          </TooltipTrigger>
                          <TooltipContent className="p-2.5 bg-popover text-popover-foreground border border-border shadow-lg text-xs space-y-1">
                            <div className="font-semibold">{formattedDate}</div>
                            <div className="flex items-center gap-3 text-muted-foreground">
                              <span>
                                <strong className="text-foreground font-bold">{count}</strong> sales
                              </span>
                              <span>•</span>
                              <span>
                                <strong className="text-foreground font-bold">
                                  {formatCurrencyValue(revenue)}
                                </strong>
                              </span>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </TooltipProvider>

      {/* Footer / Legend */}
      <div className="mt-4 pt-3 border-t border-border/50 flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-2">
        <div className="flex items-center gap-2">
          <span>Daily volume intensity:</span>
          <span className="font-medium text-foreground">0 — {stats.maxDaily} transactions/day</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] mr-1">Less</span>
          <div className="w-3 h-3 rounded-[2.5px] bg-muted/40 dark:bg-slate-800/40" />
          <div className="w-3 h-3 rounded-[2.5px] bg-emerald-200 dark:bg-emerald-950/80" />
          <div className="w-3 h-3 rounded-[2.5px] bg-emerald-400 dark:bg-emerald-700/90" />
          <div className="w-3 h-3 rounded-[2.5px] bg-emerald-500 dark:bg-emerald-500" />
          <div className="w-3 h-3 rounded-[2.5px] bg-emerald-600 dark:bg-emerald-400" />
          <span className="text-[11px] ml-1">More</span>
        </div>
      </div>
    </Card>
  );
}
