"use client";

import { Card } from "@repo/ui/components/ui/card";
import { HeatmapDay } from "../../app/actions/dashboard";
import { useMemo } from "react";
import { parseISO, format, startOfWeek, addDays, getDay } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui/components/ui/tooltip";

interface SalesHeatmapProps {
  data: HeatmapDay[];
  currency?: string;
}

export function SalesHeatmap({ data, currency = "USD" }: SalesHeatmapProps) {
  const { weeks, monthLabels, stats } = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        weeks: [],
        monthLabels: [],
        stats: { totalTransactions: 0, activeDays: 0, maxDaily: 0, totalRevenue: 0 },
      };
    }

    const firstDate = parseISO(data[0].date);
    const gridStart = startOfWeek(firstDate, { weekStartsOn: 0 }); // Sunday start

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
        return "bg-indigo-200 dark:bg-indigo-950/80 border-indigo-300/40";
      case 2:
        return "bg-indigo-400 dark:bg-indigo-700/90 border-indigo-500/50";
      case 3:
        return "bg-indigo-500 dark:bg-indigo-500 border-indigo-600/50";
      case 4:
        return "bg-indigo-600 dark:bg-indigo-400 border-indigo-700/50";
      case 0:
      default:
        return "bg-muted/50 hover:bg-muted/80 dark:bg-slate-800/40 border-transparent";
    }
  };

  const formatCurrencyValue = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <Card className="p-6 bg-card border-border/60 shadow-xs rounded-2xl h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span>
              Sales Activity Heatmap
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Daily sales consistency & transaction intensity over 26 weeks
            </p>
          </div>
        </div>

        <TooltipProvider delayDuration={50}>
          <div className="overflow-x-auto pb-2">
            <div className="min-w-fit">
              <div className="flex text-[10px] text-muted-foreground font-medium mb-1 pl-6 relative h-4">
                {monthLabels.map((m, idx) => (
                  <div
                    key={idx}
                    style={{
                      position: "absolute",
                      left: `${m.weekIndex * 13 + 24}px`,
                    }}
                  >
                    {m.label}
                  </div>
                ))}
              </div>

              <div className="flex gap-1 pt-1">
                <div className="grid grid-rows-7 gap-1 text-[9px] text-muted-foreground font-medium pr-1 select-none">
                  <span className="h-2.5 leading-[10px] flex items-center">S</span>
                  <span className="h-2.5 leading-[10px] flex items-center opacity-0">M</span>
                  <span className="h-2.5 leading-[10px] flex items-center">T</span>
                  <span className="h-2.5 leading-[10px] flex items-center opacity-0">W</span>
                  <span className="h-2.5 leading-[10px] flex items-center">T</span>
                  <span className="h-2.5 leading-[10px] flex items-center opacity-0">F</span>
                  <span className="h-2.5 leading-[10px] flex items-center">S</span>
                </div>

                <div className="flex gap-1">
                  {weeks.map((week, wIdx) => (
                    <div key={wIdx} className="grid grid-rows-7 gap-1">
                      {week.map((cell) => {
                        const day = cell.day;
                        const formattedDate = day
                          ? format(parseISO(day.date), "EEE, MMM d, yyyy")
                          : format(parseISO(cell.dateStr), "EEE, MMM d, yyyy");

                        const count = day ? day.count : 0;
                        const revenue = day ? day.revenue : 0;
                        const level = day ? day.level : 0;

                        return (
                          <Tooltip key={cell.dateStr}>
                            <TooltipTrigger asChild>
                              <div
                                className={`w-2.5 h-2.5 rounded-[2px] border transition-all duration-150 cursor-pointer ${levelColor(
                                  level,
                                )} hover:ring-1 hover:ring-indigo-500 z-0 hover:z-10`}
                              />
                            </TooltipTrigger>
                            <TooltipContent className="p-2 bg-popover text-popover-foreground border border-border shadow-md text-xs space-y-0.5">
                              <div className="font-semibold text-[11px]">{formattedDate}</div>
                              <div className="flex items-center gap-2 text-muted-foreground text-[10px]">
                                <span>
                                  <strong className="text-foreground">{count}</strong> sales
                                </span>
                                <span>•</span>
                                <span>
                                  <strong className="text-foreground">
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
      </div>

      <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Active: <strong className="text-foreground">{stats.activeDays} days</strong></span>

        <div className="flex items-center gap-1 text-[10px]">
          <span>Less</span>
          <div className="w-2.5 h-2.5 rounded-[2px] bg-muted/50 dark:bg-slate-800/40" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-indigo-200 dark:bg-indigo-950/80" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-indigo-400 dark:bg-indigo-700/90" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-indigo-500 dark:bg-indigo-500" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-indigo-600 dark:bg-indigo-400" />
          <span>More</span>
        </div>
      </div>
    </Card>
  );
}
