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

const StatCard = ({ title, value, subtext, icon: Icon }: any) => (
  <Card className="border-border/40 bg-card/50 backdrop-blur-md shadow-[0_2px_4px_rgba(0,0,0,0.02)] overflow-hidden transition-all hover:shadow-md hover:border-primary/20 group">
    <CardContent className="p-6">
      <div className="flex justify-between items-start">
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70">
            {title}
          </p>
          <div className="space-y-1">
            <h3 className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {value}
            </h3>
            <p className="text-[11px] font-medium text-muted-foreground/60 flex items-center gap-1">
              <span className="inline-block w-1 h-1 rounded-full bg-primary/30" />
              {subtext}
            </p>
          </div>
        </div>
        <div className="bg-primary/[0.03] p-3 rounded-xl border border-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
          <Icon className="h-5 w-5" />
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    console.log(error);
    return (
      <div className="flex flex-col items-center justify-center mt-20 space-y-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
          {error ? "System communication error" : "No data available"}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
          className="text-[10px] font-black uppercase tracking-widest"
        >
          Retry Connection
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

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "IN_PROGRESS":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "PLANNED":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      default:
        return "bg-slate-500/10 text-slate-600 border-slate-500/20";
    }
  };

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
      toast.success("Report generated successfully");
    } catch (e) {
      toast.error("Export failed");
    }
  };

  const walkthroughSteps = [
    {
      title: "Welcome to Scryme Bakery",
      description:
        "You're now in Local Mode. This allows you to manage production even without an active internet connection.",
      icon: Factory,
      action: "Next",
    },
    {
      title: "Configure Your System",
      description:
        "First, head to System Configuration to set up your production locations, units, and batch numbering formats.",
      icon: Settings,
      action: "Next",
    },
    {
      title: "Build Your Team",
      description:
        "Add your bakers in the Operator Matrix. You can assign roles and specialties to track production efficiency.",
      icon: Users,
      action: "Next",
    },
    {
      title: "Define Formulas",
      description:
        "Create your master recipes and production templates to standardize your output and automate daily batches.",
      icon: BookOpen,
      action: "Get Started",
    },
  ];

  if (showWalkthrough) {
    const step = walkthroughSteps[walkthroughStep];
    const StepIcon = step.icon;

    return (
      <div className="flex items-center justify-center min-h-[60vh] animate-in fade-in zoom-in duration-500">
        <Card className="w-full max-w-lg border-primary/20 shadow-2xl bg-white/90 backdrop-blur-md">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 text-primary">
              <StepIcon className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-black tracking-tight">
              {step.title}
            </CardTitle>
            <CardDescription className="text-base font-medium">
              {step.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center gap-2 mt-4">
              {walkthroughSteps.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === walkthroughStep
                      ? "w-8 bg-primary"
                      : "w-2 bg-primary/20",
                  )}
                />
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between gap-4 pt-6">
            <Button
              variant="ghost"
              onClick={completeWalkthrough}
              className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]"
            >
              Skip Tour
            </Button>
            <Button
              onClick={() => {
                if (walkthroughStep < walkthroughSteps.length - 1) {
                  setWalkthroughStep((prev) => prev + 1);
                } else {
                  completeWalkthrough();
                }
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest text-[10px] px-8"
            >
              {step.action} <ArrowRight className="ml-2 h-3 w-3" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-16">
      {/* Welcome Banner for fresh installs */}
      {!isLoading && !error && data?.summary?.totalBatches === 0 && (
        <Card className="border-primary/20 bg-primary/5 border-dashed overflow-hidden shadow-none">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row items-center gap-8 p-10">
              <div className="bg-primary/10 p-5 rounded-3xl">
                <Lightbulb className="h-10 w-10 text-primary" />
              </div>
              <div className="flex-1 text-center md:text-left space-y-2">
                <h3 className="text-xl font-bold tracking-tight text-primary">
                  Initialize Production Environment
                </h3>
                <p className="text-sm text-muted-foreground/80 font-medium max-w-xl">
                  Welcome to your bakery ERP. The local system is ready for data
                  entry. Start by defining your master recipes or production
                  templates.
                </p>
              </div>
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setActiveTab("recipes")}
                  className="font-bold text-xs uppercase tracking-widest h-12 px-6"
                >
                  Add Recipe
                </Button>
                <Button
                  size="lg"
                  onClick={() => setActiveTab("templates")}
                  className="bg-primary font-bold text-xs uppercase tracking-widest h-12 px-8 shadow-lg shadow-primary/20"
                >
                  Create Template
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard
          title="Daily Throughput"
          value={summary.completedToday}
          subtext="Batches finalized today"
          icon={TrendingUp}
        />
        <StatCard
          title="Active Routing"
          value={summary.activeBatches}
          subtext="Production runs in progress"
          icon={Factory}
        />
        <StatCard
          title="Supply Alerts"
          value={lowStockIngredients.length}
          subtext="Items requiring attention"
          icon={AlertCircle}
        />
        <StatCard
          title="Asset Valuation"
          value={formatCurrency(totalInventoryValue)}
          subtext="Total material capital"
          icon={DollarSign}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Production Ledger */}
        <Card className="lg:col-span-8 border-border/40 bg-card/40 backdrop-blur-md shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/30 bg-muted/5 py-5 px-8">
            <div className="space-y-1">
              <CardTitle className="text-xs font-bold uppercase tracking-[0.1em] text-foreground/80">
                Production Ledger
              </CardTitle>
              <p className="text-[11px] text-muted-foreground/60 font-medium">
                Live monitoring of recent manufacturing cycles
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-4 text-[10px] font-bold uppercase tracking-widest border-border/60 hover:bg-background"
                onClick={handleExport}
              >
                <Download className="mr-2 h-3.5 w-3.5 opacity-60" /> Export
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-4 text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/5"
                onClick={() => setActiveTab("batches")}
              >
                Full History <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow className="hover:bg-transparent border-border/20">
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 py-4 pl-8">
                    Manufacturing ID
                  </TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 py-4">
                    Product / Formula
                  </TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 py-4">
                    Timestamp
                  </TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 py-4 text-center pr-8">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentBatches.slice(0, 6).map((batch: FormattedBatch) => (
                  <TableRow
                    key={batch.id}
                    className="hover:bg-muted/20 transition-all border-border/20 group"
                  >
                    <TableCell className="py-4 pl-8">
                      <span className="font-mono text-xs font-bold text-foreground/80 bg-muted/50 px-2 py-1 rounded">
                        {batch.batchNumber}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="font-semibold text-sm text-foreground/90">
                        {batch.recipe.name}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground/80">
                        <Clock className="h-3.5 w-3.5 opacity-40" />
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
                    <TableCell className="py-4 text-center pr-8">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px] font-bold uppercase tracking-widest border-none px-2.5 py-1 rounded-full shadow-sm",
                          getStatusStyles(batch.status),
                        )}
                      >
                        {batch.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {recentBatches.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-20 text-center text-xs font-medium text-muted-foreground/40 uppercase tracking-widest"
                    >
                      No production records found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Sidebar Cards */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="border-border/40 bg-card/40 backdrop-blur-md shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border/30 bg-muted/5 py-5 px-8">
              <div className="flex items-center gap-3">
                <Package className="h-4 w-4 text-primary/70" />
                <CardTitle className="text-xs font-bold uppercase tracking-[0.1em] text-foreground/80">
                  Inventory Velocity
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-5">
                {stockData.slice(0, 5).map((item: StockItem) => {
                  const perc = Math.min(
                    ((item.current ?? 0) / (item.max ?? 1)) * 100,
                    100,
                  );
                  const isLow = (item.current ?? 0) <= (item.reorder ?? 0);
                  return (
                    <div key={item.id} className="space-y-2">
                      <div className="flex justify-between text-[11px] font-semibold uppercase tracking-tight">
                        <span className="text-muted-foreground/80 truncate pr-4">
                          {item.name}
                        </span>
                        <span
                          className={cn(
                            "tabular-nums",
                            isLow
                              ? "text-red-500 font-bold"
                              : "text-foreground/90",
                          )}
                        >
                          {item.current ?? 0}{" "}
                          <span className="text-[9px] text-muted-foreground/50 lowercase">
                            {item.unit}
                          </span>
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            isLow
                              ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                              : "bg-primary",
                          )}
                          style={{ width: `${perc}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-primary/[0.02] backdrop-blur-md shadow-sm overflow-hidden p-8 border-dashed">
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  Avg Production Cost
                </span>
                <p className="text-2xl font-bold text-foreground tabular-nums tracking-tight">
                  {formatCurrency(averageRecipeCost)}
                </p>
              </div>
              <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
            <div className="space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 block mb-2">
                Top Classifications
              </span>
              {Object.entries(recipesByCategory)
                .slice(0, 3)
                .map(([cat, count]) => (
                  <div
                    key={cat}
                    className="flex justify-between items-center group py-1"
                  >
                    <span className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-tight">
                      {cat}
                    </span>
                    <Badge
                      variant="secondary"
                      className="font-bold text-[10px] bg-background text-primary border border-primary/10 px-2 py-0"
                    >
                      {count as any} Formulas
                    </Badge>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
