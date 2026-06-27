"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { Skeleton } from "@repo/ui/components/ui/skeleton";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import {
  AlertCircle,
  Package,
  TrendingDown,
  AlertTriangle,
  Clock,
  Search,
  Truck,
  DollarSign,
  Box,
  Edit,
  Tag,
  List,
  Filter,
  ArrowUpDown,
  MoreVertical,
  Download,
  Plus,
} from "lucide-react";
import { Alert, AlertDescription } from "@repo/ui/components/ui/alert";
import { useListIngredients } from "@/hooks/bakery";
import { useFormattedCurrency } from "@/lib/utils";
import { Ingredient } from "@/types/bakery";
import { cn } from "@/lib/utils";
import { IngredientFormDialog } from "@/components/bakery/IngredientForm";
import BulkReceiveDialog from "@/components/bakery/IngredientReceive";
import { RestockDialog } from "@/components/bakery/RestockDialog";
import { BulkRestock } from "@/components/bakery/BulkRestock";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";

// ─── UI Helpers ─────────────────────────────────────────────────────────────

const getStockStatus = (current: number, reorder: number, max: number) => {
  const percentage = max > 0 ? (current / max) * 100 : 0;
  if (current <= reorder)
    return {
      label: "Critical Shortage",
      className:
        "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50",
    };
  if (percentage < 30)
    return {
      label: "Low Stock",
      className:
        "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50",
    };
  return {
    label: "Optimal",
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50",
  };
};

function MetricCard({
  title,
  value,
  subtext,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  subtext: string;
  icon: any;
}) {
  return (
    <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm border-none shadow-none bg-transparent">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-3.5 w-3.5 text-muted-foreground/50" />
      </CardHeader>
      <CardContent className="p-0 mt-1">
        <div className="text-xl font-bold text-foreground tabular-nums tracking-tight">
          {value}
        </div>
        <p className="text-[10px] text-muted-foreground/70 font-medium mt-0.5">
          {subtext}
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Main Manager Component ──────────────────────────────────────────────────

export default function IngredientManager() {
  const { data: ingredients, isLoading, error, refetch } = useListIngredients();
  const formatCurrency = useFormattedCurrency();

  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "dense">("dense");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "CRITICAL" | "LOW" | "OPTIMAL"
  >("ALL");

  // State for Dialogs
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkReceiveOpen, setIsBulkReceiveOpen] = useState(false);
  const [isBulkRestockOpen, setIsBulkRestockOpen] = useState(false);
  const [isRestockOpen, setIsRestockOpen] = useState(false);

  // State for Editing
  const [selectedIngredient, setSelectedIngredient] =
    useState<Ingredient | null>(null);

  const filteredIngredients = useMemo(() => {
    if (!ingredients) return [];
    return ingredients.filter((i) => {
      const matchesSearch =
        i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.category?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.tags?.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase()),
        );

      const status = getStockStatus(i.currentStock, i.reorderLevel, i.maxStock);
      let matchesStatus = true;
      if (statusFilter === "CRITICAL")
        matchesStatus = status.label === "Critical Shortage";
      else if (statusFilter === "LOW")
        matchesStatus = status.label === "Low Stock";
      else if (statusFilter === "OPTIMAL")
        matchesStatus = status.label === "Optimal";

      return matchesSearch && matchesStatus;
    });
  }, [ingredients, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    if (!ingredients)
      return { total: 0, lowStock: 0, totalValue: 0, avgUsage: 0 };
    const lowStock = ingredients.filter(
      (i) => i.currentStock <= i.reorderLevel,
    ).length;
    const totalValue = ingredients.reduce(
      (sum, i) => sum + i.currentStock * Number(i.unitPrice),
      0,
    );
    const avgUsage = ingredients.length
      ? ingredients.reduce((sum, i) => sum + i.averageUsagePerWeek, 0) /
        ingredients.length
      : 0;

    return { total: ingredients.length, lowStock, totalValue, avgUsage };
  }, [ingredients]);

  const handleOpenCreateForm = () => {
    setSelectedIngredient(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setIsFormOpen(true);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredIngredients.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredIngredients.map((i) => i.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  useKeyboardShortcuts({
    n: () => handleOpenCreateForm(),
    b: () => setIsBulkReceiveOpen(true),
    f: () => {
      const searchInput = document.getElementById(
        "ingredient-search",
      ) as HTMLInputElement;
      searchInput?.focus();
    },
    "/": () => {
      const searchInput = document.getElementById(
        "ingredient-search",
      ) as HTMLInputElement;
      searchInput?.focus();
    },
    v: () => setViewMode((prev) => (prev === "grid" ? "dense" : "grid")),
  });

  if (error) {
    return (
      <Alert
        variant="destructive"
        className="border-red-200 bg-red-50 text-red-800"
      >
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Inventory subsystem failure: {error.message}
          {refetch && (
            <Button
              variant="link"
              onClick={() => refetch()}
              className="h-auto p-0 ml-2 font-bold text-red-900 underline"
            >
              Retry Handshake
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      {/* Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 rounded-lg border border-border/50 bg-card/30 backdrop-blur-sm">
        <MetricCard
          title="Total SKUs"
          value={stats.total}
          subtext="Unique raw materials"
          icon={Package}
        />
        <MetricCard
          title="Supply Alerts"
          value={stats.lowStock}
          subtext="Requiring replenishment"
          icon={AlertTriangle}
        />
        <MetricCard
          title="Asset Value"
          value={formatCurrency(stats.totalValue)}
          subtext="Total capital at hand"
          icon={DollarSign}
        />
        <MetricCard
          title="Throughput"
          value={stats.avgUsage.toFixed(1)}
          subtext="Avg usage per week"
          icon={TrendingDown}
        />
      </div>

      {/* Control Panel */}
      <Card className="border-none shadow-none bg-transparent">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
              <Input
                id="ingredient-search"
                placeholder="Search materials, SKUs, tags..."
                className="pl-9 h-10 border-border/60 focus-visible:ring-primary/20 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 border-border/60"
                >
                  <Filter className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Stock Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setStatusFilter("ALL")}>
                  {statusFilter === "ALL" && <span className="mr-2">✓</span>}{" "}
                  All Materials
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setStatusFilter("CRITICAL")}
                  className="text-red-600"
                >
                  {statusFilter === "CRITICAL" && (
                    <span className="mr-2">✓</span>
                  )}{" "}
                  Critical Shortage
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setStatusFilter("LOW")}
                  className="text-amber-600"
                >
                  {statusFilter === "LOW" && <span className="mr-2">✓</span>}{" "}
                  Low Stock
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setStatusFilter("OPTIMAL")}
                  className="text-emerald-600"
                >
                  {statusFilter === "OPTIMAL" && (
                    <span className="mr-2">✓</span>
                  )}{" "}
                  Optimal
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 mr-2 animate-in fade-in slide-in-from-right-2">
                <span className="text-xs font-bold text-muted-foreground">
                  {selectedIds.size} selected
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 text-xs border-border/60"
                >
                  Restock
                </Button>
                <Button size="sm" variant="destructive" className="h-9 text-xs">
                  Deactivate
                </Button>
                <div className="h-4 w-px bg-border/60 mx-1" />
              </div>
            )}

            <Button
              variant="outline"
              className="h-10 gap-2 text-xs border-border/60 font-medium hidden md:flex"
              onClick={() =>
                setViewMode(viewMode === "grid" ? "dense" : "grid")
              }
            >
              {viewMode === "grid" ? (
                <List className="h-4 w-4" />
              ) : (
                <Box className="h-4 w-4" />
              )}
              {viewMode === "grid" ? "Table View" : "Grid View"}
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 border-border/60"
            >
              <Download className="h-4 w-4 text-muted-foreground" />
            </Button>

            <Button
              variant="outline"
              className="h-10 gap-2 border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold"
              onClick={() => setIsBulkRestockOpen(true)}
            >
              <Truck className="h-4 w-4" />
              Bulk Restock
            </Button>

            <Button
              className="h-10 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-sm px-4"
              onClick={handleOpenCreateForm}
            >
              <Plus className="h-4 w-4" />
              Add Material
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Content Area */}
      {viewMode === "dense" ? (
        <div className="rounded-lg border border-border/50 bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={
                      selectedIds.size > 0 &&
                      selectedIds.size === filteredIngredients.length
                    }
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground py-4">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors">
                    Material / SKU <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground text-right">
                  Inventory
                </TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground text-right">
                  Standard Cost
                </TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground text-right">
                  Avg Usage
                </TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground">
                  Last Received
                </TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={8} className="py-4">
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : filteredIngredients.map((ingredient) => {
                    const status = getStockStatus(
                      ingredient.currentStock,
                      ingredient.reorderLevel,
                      ingredient.maxStock,
                    );
                    const daysAgo = Math.floor(
                      (new Date().getTime() -
                        new Date(ingredient.lastRestocked).getTime()) /
                        86400000,
                    );

                    return (
                      <TableRow
                        key={ingredient.id}
                        className={cn(
                          "group transition-colors",
                          selectedIds.has(ingredient.id)
                            ? "bg-primary/[0.03] hover:bg-primary/[0.05]"
                            : "hover:bg-muted/30",
                        )}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(ingredient.id)}
                            onCheckedChange={() => toggleSelect(ingredient.id)}
                          />
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground text-sm tracking-tight">
                              {ingredient.name}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-bold text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded uppercase tracking-widest">
                                {ingredient.sku || "NO-SKU"}
                              </span>
                              {ingredient.category && (
                                <span className="text-[10px] font-medium text-muted-foreground/80 flex items-center gap-1 border-l pl-2 border-border/60">
                                  <Tag className="h-2.5 w-2.5 opacity-50" />{" "}
                                  {ingredient.category.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] uppercase font-bold tracking-wider border-none px-2 py-0.5",
                              status.className,
                            )}
                          >
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold font-mono text-sm">
                          <span
                            className={cn(
                              ingredient.currentStock <= ingredient.reorderLevel
                                ? "text-red-600"
                                : "text-foreground",
                            )}
                          >
                            {ingredient.currentStock}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-medium ml-1 uppercase">
                            {ingredient.unit.symbol}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium font-mono text-sm text-foreground">
                          {formatCurrency(Number(ingredient.unitPrice))}
                        </TableCell>
                        <TableCell className="text-right font-medium font-mono text-sm text-muted-foreground">
                          {ingredient.averageUsagePerWeek.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-medium">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 opacity-40" />
                            {isNaN(daysAgo)
                              ? "—"
                              : daysAgo === 0
                                ? "Received Today"
                                : `${daysAgo}d ago`}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedIngredient(ingredient);
                                  setIsRestockOpen(true);
                                }}
                              >
                                <Plus className="mr-2 h-4 w-4" /> Restock Item
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleOpenEditForm(ingredient)}
                              >
                                <Edit className="mr-2 h-4 w-4" /> Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <ArrowUpDown className="mr-2 h-4 w-4" /> Adjust
                                Inventory
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                Deactivate Material
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
            </TableBody>
          </Table>

          {!isLoading && filteredIngredients.length === 0 && (
            <div className="py-20 text-center">
              <Package className="h-10 w-10 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-sm font-bold text-muted-foreground">
                No materials matching your criteria
              </p>
              <Button
                variant="link"
                className="text-xs mt-1"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("ALL");
                }}
              >
                Clear all filters
              </Button>
            </div>
          )}

          <div className="p-4 border-t border-border/50 bg-muted/20 flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Showing {filteredIngredients.length} of {stats.total} entries
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-bold border-border/60"
                disabled
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-bold border-border/60"
                disabled
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-xl" />
            ))
          ) : filteredIngredients.length > 0 ? (
            filteredIngredients.map((ingredient) => {
              const status = getStockStatus(
                ingredient.currentStock,
                ingredient.reorderLevel,
                ingredient.maxStock,
              );
              const daysAgo = Math.floor(
                (new Date().getTime() -
                  new Date(ingredient.lastRestocked).getTime()) /
                  86400000,
              );

              return (
                <Card
                  key={ingredient.id}
                  className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-primary/20 border-border/50 bg-card/50 backdrop-blur-sm"
                >
                  <CardHeader className="pb-4 border-b border-border/30">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[8px] uppercase tracking-[0.1em] px-1.5 py-0 border-none font-black",
                              status.className,
                            )}
                          >
                            {status.label}
                          </Badge>
                        </div>
                        <CardTitle className="text-base font-bold tracking-tight text-foreground truncate pr-2">
                          {ingredient.name}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[9px] text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded tracking-widest uppercase">
                            {ingredient.sku || "NO-SKU"}
                          </span>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        onClick={() => handleOpenEditForm(ingredient)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="p-0">
                    <div className="grid grid-cols-2 divide-x divide-border/30 border-b border-border/30">
                      <div className="p-5 flex flex-col items-center justify-center bg-muted/10">
                        <span className="text-[9px] uppercase tracking-[0.15em] font-black text-muted-foreground/60 mb-2">
                          Inventory
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span
                            className={cn(
                              "text-3xl font-black tabular-nums tracking-tighter",
                              ingredient.currentStock <= ingredient.reorderLevel
                                ? "text-red-600"
                                : "text-foreground",
                            )}
                          >
                            {ingredient.currentStock}
                          </span>
                          <span className="text-xs text-muted-foreground font-bold uppercase">
                            {ingredient.unit.symbol}
                          </span>
                        </div>
                      </div>
                      <div className="p-5 flex flex-col justify-center gap-3">
                        <div className="flex flex-col">
                          <span className="text-[8px] uppercase tracking-widest font-black text-muted-foreground/50">
                            Unit Cost
                          </span>
                          <span className="font-bold text-sm text-foreground tabular-nums">
                            {formatCurrency(Number(ingredient.unitPrice))}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] uppercase tracking-widest font-black text-muted-foreground/50">
                            Wkly Forecast
                          </span>
                          <span className="font-bold text-sm text-foreground tabular-nums">
                            {ingredient.averageUsagePerWeek.toFixed(1)}{" "}
                            <span className="text-[10px] text-muted-foreground/60">
                              {ingredient.unit.symbol}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 flex items-center justify-between bg-muted/5">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[7px] uppercase font-black text-muted-foreground/40 tracking-tighter">
                            Thresholds
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-red-600/80">
                              {ingredient.reorderLevel}
                            </span>
                            <div className="w-8 h-1 bg-muted rounded-full overflow-hidden">
                              <div
                                className="bg-primary h-full"
                                style={{ width: "60%" }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-emerald-600/80">
                              {ingredient.maxStock}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[7px] uppercase font-black text-muted-foreground/40 tracking-tighter">
                          Last Receipt
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/70">
                          <Clock className="h-3 w-3 opacity-50" />
                          {isNaN(daysAgo)
                            ? "Unknown"
                            : daysAgo === 0
                              ? "Today"
                              : `${daysAgo}d ago`}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full py-24 text-center border-2 border-dashed border-border/50 rounded-2xl bg-card/30">
              <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                Inventory System Empty
              </h3>
              <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto">
                No materials match your current search or filters. Try adjusting
                your parameters or add a new material.
              </p>
              <Button
                className="bg-primary font-bold shadow-md h-11 px-8 rounded-full"
                onClick={handleOpenCreateForm}
              >
                Register First Material
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Overlays */}
      <IngredientFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        ingredient={selectedIngredient || undefined}
      />

      <BulkReceiveDialog
        open={isBulkReceiveOpen}
        onClose={() => setIsBulkReceiveOpen(false)}
        ingredients={ingredients || []}
        onSuccess={() => setIsBulkReceiveOpen(false)}
      />

      <RestockDialog
        open={isRestockOpen}
        onOpenChange={setIsRestockOpen}
        selectedIngredient={selectedIngredient}
      />

      <BulkRestock
        open={isBulkRestockOpen}
        onOpenChange={setIsBulkRestockOpen}
      />
    </div>
  );
}
