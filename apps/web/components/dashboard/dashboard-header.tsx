"use client";

import { Calendar, ChevronDown, Settings2, Check } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@repo/ui/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@repo/ui/components/ui/dialog";
import { Switch } from "@repo/ui/components/ui/switch";
import { Label } from "@repo/ui/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export interface WidgetVisibility {
  statCards: boolean;
  revenueChart: boolean;
  categoryDistribution: boolean;
  recentActivity: boolean;
  salesHeatmap: boolean;
  popularProducts: boolean;
  averageOrderValue: boolean;
  averageSales: boolean;
  totalSessions: boolean;
}

const DEFAULT_WIDGET_VISIBILITY: WidgetVisibility = {
  statCards: true,
  revenueChart: true,
  categoryDistribution: true,
  recentActivity: true,
  salesHeatmap: true,
  popularProducts: true,
  averageOrderValue: true,
  averageSales: true,
  totalSessions: true,
};

interface DashboardHeaderProps {
  userName: string;
  date: string;
  widgets?: WidgetVisibility;
  onWidgetsChange?: (widgets: WidgetVisibility) => void;
}

export function DashboardHeader({
  userName,
  date,
  widgets,
  onWidgetsChange,
}: DashboardHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const timeframe = searchParams.get("timeframe") || "month";
  const compare = searchParams.get("compare") || "previous_period";

  const [isWidgetDialogOpen, setIsWidgetDialogOpen] = useState(false);
  const [localWidgets, setLocalWidgets] = useState<WidgetVisibility>(
    widgets || DEFAULT_WIDGET_VISIBILITY,
  );

  useEffect(() => {
    if (widgets) {
      setLocalWidgets(widgets);
    }
  }, [widgets]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set(key, value);
    router.push(`/dashboard?${params.toString()}`);
  };

  const timeframeLabels: Record<string, string> = {
    today: "Today",
    week: "This Week",
    month: "This Month",
    quarter: "This Quarter",
    year: "This Year",
    all: "All Time",
  };

  const compareLabels: Record<string, string> = {
    previous_period: "Previous Period",
    last_year: "Last Year",
  };

  const getCompareButtonLabel = () => {
    if (compare === "last_year") return "Compare: Last Year";
    if (timeframe === "year") return "Compare: Last Year";
    if (timeframe === "week") return "Compare: Last Week";
    if (timeframe === "today") return "Compare: Yesterday";
    if (timeframe === "quarter") return "Compare: Last Quarter";
    return "Compare: Last Month";
  };

  const handleSaveWidgets = () => {
    if (onWidgetsChange) {
      onWidgetsChange(localWidgets);
    }
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          "scryme_dashboard_widgets",
          JSON.stringify(localWidgets),
        );
      } catch (e) {
        // ignore quota/security errors
      }
    }
    setIsWidgetDialogOpen(false);
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Hey, {userName}
        </h1>
        <p className="text-sm text-muted-foreground">{date}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* Timeframe Selector Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground border-none h-9 font-medium shadow-xs">
              <Calendar className="mr-2 h-4 w-4" />
              {timeframeLabels[timeframe] || "This Month"}
              <ChevronDown className="ml-1.5 h-3.5 w-3.5 opacity-80" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold">
              Select Timeframe
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex items-center justify-between cursor-pointer"
              onClick={() => updateParam("timeframe", "today")}>
              Today
              {timeframe === "today" && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center justify-between cursor-pointer"
              onClick={() => updateParam("timeframe", "week")}>
              This Week
              {timeframe === "week" && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center justify-between cursor-pointer"
              onClick={() => updateParam("timeframe", "month")}>
              This Month
              {timeframe === "month" && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center justify-between cursor-pointer"
              onClick={() => updateParam("timeframe", "quarter")}>
              This Quarter
              {timeframe === "quarter" && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center justify-between cursor-pointer"
              onClick={() => updateParam("timeframe", "year")}>
              This Year
              {timeframe === "year" && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center justify-between cursor-pointer"
              onClick={() => updateParam("timeframe", "all")}>
              All Time
              {timeframe === "all" && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Compare Selector Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="bg-card border-border hover:bg-accent hover:text-accent-foreground h-9 shadow-xs font-medium text-foreground">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1">
                  <div className="h-4 w-4 rounded-full border border-background bg-muted flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
                  </div>
                  <div className="h-4 w-4 rounded-full border border-background bg-primary flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                  </div>
                </div>
                <span>{getCompareButtonLabel()}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold">
              Comparison Mode
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex items-center justify-between cursor-pointer"
              onClick={() => updateParam("compare", "previous_period")}>
              <span>Previous Period</span>
              {compare === "previous_period" && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center justify-between cursor-pointer"
              onClick={() => updateParam("compare", "last_year")}>
              <span>Last Year</span>
              {compare === "last_year" && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Edit Widget Button & Modal */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsWidgetDialogOpen(true)}
          className="bg-card border-border hover:bg-accent hover:text-accent-foreground h-9 shadow-xs font-medium text-foreground">
          <Settings2 className="mr-2 h-4 w-4 text-muted-foreground" />
          Edit Widgets
        </Button>
      </div>

      <Dialog open={isWidgetDialogOpen} onOpenChange={setIsWidgetDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Configure Dashboard Widgets</DialogTitle>
            <DialogDescription>
              Choose which widget cards and sections appear on your dashboard.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="w-statcards" className="text-sm font-medium">
                Key Performance Stat Cards
              </Label>
              <Switch
                id="w-statcards"
                checked={localWidgets.statCards}
                onCheckedChange={(c) =>
                  setLocalWidgets((prev) => ({ ...prev, statCards: c }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="w-revenue" className="text-sm font-medium">
                Sales Revenue Chart
              </Label>
              <Switch
                id="w-revenue"
                checked={localWidgets.revenueChart}
                onCheckedChange={(c) =>
                  setLocalWidgets((prev) => ({ ...prev, revenueChart: c }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="w-category" className="text-sm font-medium">
                Category Distribution Donut
              </Label>
              <Switch
                id="w-category"
                checked={localWidgets.categoryDistribution}
                onCheckedChange={(c) =>
                  setLocalWidgets((prev) => ({ ...prev, categoryDistribution: c }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="w-recent" className="text-sm font-medium">
                Recent Orders & Activity
              </Label>
              <Switch
                id="w-recent"
                checked={localWidgets.recentActivity}
                onCheckedChange={(c) =>
                  setLocalWidgets((prev) => ({ ...prev, recentActivity: c }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="w-heatmap" className="text-sm font-medium">
                Sales Activity Heatmap
              </Label>
              <Switch
                id="w-heatmap"
                checked={localWidgets.salesHeatmap}
                onCheckedChange={(c) =>
                  setLocalWidgets((prev) => ({ ...prev, salesHeatmap: c }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="w-products" className="text-sm font-medium">
                Top Popular Products
              </Label>
              <Switch
                id="w-products"
                checked={localWidgets.popularProducts}
                onCheckedChange={(c) =>
                  setLocalWidgets((prev) => ({ ...prev, popularProducts: c }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsWidgetDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveWidgets}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
