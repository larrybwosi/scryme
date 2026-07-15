import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import { Progress } from "@repo/ui/components/ui/progress";
import {
  Clock,
  Package,
  AlertCircle,
  TrendingUp,
  Factory,
  ArrowRight,
  Download,
  DollarSign,
  Lightbulb,
  Settings,
  Users,
  BookOpen,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { useBakeryData } from "@/hooks/bakery";
import { cn, useFormattedCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { Skeleton } from "@repo/ui/components/ui/skeleton";
import { Batch, FormattedBatch, StockItem } from "@/types/bakery";

// Mock helper for the export function - ensure this is imported or defined in your utils
const saveReport = async (filename: string, content: string) => {
  const blob = new Blob([content], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
};

const STATUS_META: Record<
  string,
  { label: string; dot: string; text: string }
> = {
  COMPLETED: {
    label: "Completed",
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  IN_PROGRESS: {
    label: "In progress",
    dot: "bg-blue-500",
    text: "text-blue-700 dark:text-blue-400",
  },
  PLANNED: {
    label: "Planned",
    dot: "bg-slate-400",
    text: "text-slate-700 dark:text-slate-300",
  },
  CANCELLED: {
    label: "Cancelled",
    dot: "bg-red-400",
    text: "text-red-700 dark:text-red-400",
  },
};

function StatusIndicator({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? {
    label: status?.replace("_", " ") || "Unknown",
    dot: "bg-slate-300",
    text: "text-slate-600",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        meta.text,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

const StatCard = ({ title, value, subtext, icon: Icon }: any) => (
  <Card className="border-border bg-card shadow-none">
    <CardContent className="p-5">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {title}
          </p>
          <div>
            <h3 className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
              {value}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>
          </div>
        </div>
        <div className="bg-muted p-2 rounded-md text-muted-foreground">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function Overview({
  setActiveTab,
}: {
  setActiveTab: (tab: string) => void;
}) {
  const { data, isLoading, error } = useBakeryData();
  const formatCurrency = useFormattedCurrency();
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [walkthroughStep, setWalkthroughStep] = useState(0);

  useEffect(() => {
    const shouldShow =
      localStorage.getItem("bakery_show_walkthrough") === "true";
    if (shouldShow) {
      setShowWalkthrough(true);
    }
  }, []);

  const completeWalkthrough = () => {
    localStorage.removeItem("bakery_show_walkthrough");
    localStorage.setItem("bakery_walkthrough_completed", "true");
    setShowWalkthrough(false);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    console.log(error);
    return (
      <div className="flex flex-col items-center justify-center mt-20 space-y-3">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm font-medium text-foreground">
          {error ? "Unable to reach the server" : "No data available"}
        </p>
        <p className="text-xs text-muted-foreground">
          Check your connection and try again.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
          className="text-xs font-medium mt-1"
        >
          Retry
        </Button>
      </div>
    );
  }

  const {
    summary = {
      totalBatches: 0,
      activeBatches: 0,
      completedToday: 0,
      lowStockItems: 0,
    },
    recentBatches = [],
    lowStockIngredients = [],
    stockData = [],
    averageRecipeCost = 0,
    recipesByCategory = {},
    totalInventoryValue = 0,
  } = data;

  const handleExport = async () => {
    try {
      const csv =
        "Batch ID,Product,Date,Status\n" +
        recentBatches
          .map(
            (b: FormattedBatch) =>
              `${b.batchNumber},${b.recipe.name},${new Date(b.productionDate || "").toLocaleDateString()},${b.status}`,
          )
          .join("\n");

      await saveReport(
        `bakery-export-${new Date().toISOString().split("T")[0]}.csv`,
        csv,
      );
      toast.success("Report downloaded");
    } catch (e) {
      toast.error("Export failed. Try again.");
    }
  };

  const walkthroughSteps = [
    {
      title: "Welcome to Scryme Bakery",
      description:
        "You're in local mode. Production can be managed without an active internet connection.",
      icon: Factory,
      action: "Next",
    },
    {
      title: "Configure your system",
      description:
        "Set up production locations, units, and batch numbering formats in System Configuration.",
      icon: Settings,
      action: "Next",
    },
    {
      title: "Build your team",
      description:
        "Add bakers in the Operator Matrix and assign roles and specialties to track efficiency.",
      icon: Users,
      action: "Next",
    },
    {
      title: "Define formulas",
      description:
        "Create master recipes and production templates to standardize output and automate batches.",
      icon: BookOpen,
      action: "Get started",
    },
  ];

  if (showWalkthrough) {
    const step = walkthroughSteps[walkthroughStep];
    const StepIcon = step.icon;

    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md border-border shadow-sm">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3 text-primary">
              <StepIcon className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg font-semibold">
              {step.title}
            </CardTitle>
            <CardDescription className="text-sm">
              {step.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center gap-1.5 mt-3">
              {walkthroughSteps.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 rounded-full transition-all",
                    i === walkthroughStep
                      ? "w-6 bg-primary"
                      : "w-1.5 bg-primary/20",
                  )}
                />
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between gap-3 pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={completeWalkthrough}
              className="text-muted-foreground text-xs font-medium"
            >
              Skip tour
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (walkthroughStep < walkthroughSteps.length - 1) {
                  setWalkthroughStep((prev) => prev + 1);
                } else {
                  completeWalkthrough();
                }
              }}
              className="text-xs font-medium px-6"
            >
              {step.action} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Welcome banner for fresh installs */}
      {!isLoading && !error && data?.summary?.totalBatches === 0 && (
        <Card className="border-border border-dashed shadow-none">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row items-center gap-6 p-6">
              <div className="bg-primary/10 p-3 rounded-lg shrink-0">
                <Lightbulb className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 text-center md:text-left space-y-1">
                <h3 className="text-base font-semibold text-foreground">
                  Set up your production environment
                </h3>
                <p className="text-sm text-muted-foreground max-w-xl">
                  Your workspace is ready. Start by defining a master recipe or
                  a production template.
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("recipes")}
                  className="text-xs font-medium"
                >
                  Add recipe
                </Button>
                <Button
                  size="sm"
                  onClick={() => setActiveTab("templates")}
                  className="text-xs font-medium"
                >
                  Create template
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Completed today"
          value={summary.completedToday}
          subtext="Batches finalized today"
          icon={TrendingUp}
        />
        <StatCard
          title="In progress"
          value={summary.activeBatches}
          subtext="Production runs active"
          icon={Factory}
        />
        <StatCard
          title="Stock alerts"
          value={lowStockIngredients.length}
          subtext="Items below reorder point"
          icon={AlertCircle}
        />
        <StatCard
          title="Inventory value"
          value={formatCurrency(totalInventoryValue)}
          subtext="Total material on hand"
          icon={DollarSign}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Recent batches */}
        <Card className="lg:col-span-8 border-border shadow-none overflow-hidden flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border py-4 px-5">
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                Recent batches
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Latest manufacturing activity
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs font-medium"
                onClick={handleExport}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" /> Export
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-xs font-medium"
                onClick={() => setActiveTab("batches")}
              >
                View all <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border bg-muted/40">
                  <TableHead className="text-xs font-medium text-muted-foreground py-3 pl-5">
                    Batch
                  </TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground">
                    Recipe
                  </TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground">
                    Date
                  </TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground pr-5">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentBatches.slice(0, 6).map((batch: FormattedBatch) => (
                  <TableRow
                    key={batch.id}
                    className="border-border hover:bg-muted/30"
                  >
                    <TableCell className="py-3 pl-5">
                      <span className="font-mono text-xs font-medium text-foreground">
                        {batch.batchNumber}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-sm text-foreground">
                      {batch.recipe.name}
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(
                          batch.productionDate || "",
                        ).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="py-3 pr-5">
                      <StatusIndicator status={batch.status} />
                    </TableCell>
                  </TableRow>
                ))}
                {recentBatches.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-14 text-center text-sm text-muted-foreground"
                    >
                      No production records yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="border-border shadow-none">
            <CardHeader className="border-b border-border py-4 px-5">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-semibold text-foreground">
                  Inventory levels
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {stockData.slice(0, 5).map((item: StockItem) => {
                const perc = Math.min(
                  ((item.current ?? 0) / (item.max ?? 1)) * 100,
                  100,
                );
                const isLow = (item.current ?? 0) <= (item.reorder ?? 0);
                return (
                  <div key={item.id} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground truncate pr-3">
                        {item.name}
                      </span>
                      <span
                        className={cn(
                          "tabular-nums font-medium",
                          isLow
                            ? "text-red-600 dark:text-red-400"
                            : "text-foreground",
                        )}
                      >
                        {item.current ?? 0}{" "}
                        <span className="text-[11px] text-muted-foreground font-normal">
                          {item.unit}
                        </span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          isLow ? "bg-red-500" : "bg-primary",
                        )}
                        style={{ width: `${perc}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {stockData.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No inventory data available
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border shadow-none">
            <CardContent className="p-5">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
                <div>
                  <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Avg. production cost
                  </span>
                  <p className="text-xl font-semibold text-foreground tabular-nums mt-0.5">
                    {formatCurrency(averageRecipeCost)}
                  </p>
                </div>
                <div className="h-9 w-9 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <div className="space-y-2.5">
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground block">
                  Top categories
                </span>
                {Object.entries(recipesByCategory)
                  .slice(0, 3)
                  .map(([cat, count]) => (
                    <div
                      key={cat}
                      className="flex justify-between items-center"
                    >
                      <span className="text-sm text-foreground">{cat}</span>
                      <Badge
                        variant="secondary"
                        className="text-xs font-medium"
                      >
                        {count as any}
                      </Badge>
                    </div>
                  ))}
                {Object.keys(recipesByCategory).length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No recipe data available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
