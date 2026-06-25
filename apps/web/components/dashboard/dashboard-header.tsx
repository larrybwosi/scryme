"use client";

import { Calendar, ChevronDown, Settings2 } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import { useRouter, useSearchParams } from "next/navigation";

interface DashboardHeaderProps {
  userName: string;
  date: string;
}

export function DashboardHeader({ userName, date }: DashboardHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const timeframe = searchParams.get("timeframe") || "month";

  const setTimeframe = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("timeframe", value);
    router.push(`/dashboard?${params.toString()}`);
  };

  const timeframeLabels: Record<string, string> = {
    week: "This Week",
    month: "This Month",
    year: "This Year",
  };

  return (
    <div className="flex justify-between items-end mb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Hey, {userName}</h1>
        <p className="text-sm text-muted-foreground">{date}</p>
      </div>

      <div className="flex gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="bg-black text-white hover:bg-black/90 hover:text-white border-none h-9">
              <Calendar className="mr-2 h-4 w-4" />
              {timeframeLabels[timeframe]}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTimeframe("week")}>
              This Week
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTimeframe("month")}>
              This Month
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTimeframe("year")}>
              This Year
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="bg-white border-slate-200 h-9">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1">
                  <div className="h-4 w-4 rounded-full border border-white bg-slate-100 flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  </div>
                  <div className="h-4 w-4 rounded-full border border-white bg-slate-800 flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                  </div>
                </div>
                <span>
                  Compare: Last {timeframe === "year" ? "Year" : "Month"}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Previous Period</DropdownMenuItem>
            <DropdownMenuItem>Last Year</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          size="sm"
          className="bg-white border-slate-200 h-9">
          <Settings2 className="mr-2 h-4 w-4" />
          Edit Widget
        </Button>
      </div>
    </div>
  );
}
