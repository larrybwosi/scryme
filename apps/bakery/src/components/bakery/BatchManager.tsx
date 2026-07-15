"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@repo/ui/components/ui/sheet";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import { Label } from "@repo/ui/components/ui/label";
import {
  Plus,
  Clock,
  AlertTriangle,
  RefreshCw,
  ClipboardCheck,
  Search,
  Loader2,
  MoreHorizontal,
  Play,
  CheckCircle2,
  XCircle,
  Eye,
  Edit,
  Copy,
  Layers,
  Zap,
  ShieldCheck,
  Factory,
  Check,
  Filter,
  MoreVertical,
  Printer,
  Package,
  Calendar,
  Download,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@repo/ui/components/ui/skeleton";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { format, isValid } from "date-fns";
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
import { Badge } from "@repo/ui/components/ui/badge";
import { Separator } from "@repo/ui/components/ui/separator";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/common/data-pagination";

// Hooks & Types
import {
  useBatches,
  useCancelBatch,
  useCompleteBatch,
  useStartBatch,
  useDuplicateBatch,
  useRecipes,
  useListIngredients,
  useBakers,
  useCreateBatch,
} from "@/hooks/bakery";

import {
  BatchStatus,
  FormattedBatch,
  UnifiedBatchDetails,
} from "@/types/bakery";

// Components
import { BatchForm } from "@/components/bakery/BatchForm";
import { BatchView } from "@/components/bakery/BatchViewSheet";
import { BatchLabel } from "@/components/bakery/BatchLabel";
import { BatchCard } from "@/components/bakery/BatchCard";
import { SmartProductionWizard } from "@/components/bakery/SmartProductionWizard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog";
import { getStatusStyles } from "@/utils/status-styles";
import { LocationSelect } from "@/components/common/location-select";
import { CreateEditTemplate } from "@/components/bakery/CreateEditTemplate";

// ---------------------------------------------------------------------------
// Static config
// ---------------------------------------------------------------------------

const STATUS_META: Record<
  string,
  { label: string; dot: string; text: string }
> = {
  [BatchStatus.PLANNED]: {
    label: "Planned",
    dot: "bg-slate-400",
    text: "text-slate-700 dark:text-slate-300",
  },
  [BatchStatus.IN_PROGRESS]: {
    label: "In progress",
    dot: "bg-blue-500",
    text: "text-blue-700 dark:text-blue-400",
  },
  [BatchStatus.COMPLETED]: {
    label: "Completed",
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  [BatchStatus.CANCELLED]: {
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

export default function BatchManager() {
  const [selectedBatch, setSelectedBatch] = useState<FormattedBatch | null>(
    null,
  );
  const [qualityCheckBatch, setQualityCheckBatch] =
    useState<FormattedBatch | null>(null);
  const [isSmartWizardOpen, setIsSmartWizardOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isQualityCheckOpen, setIsQualityCheckOpen] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [printingBatch, setPrintingBatch] = useState<FormattedBatch | null>(
    null,
  );

  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [successBatch, setSuccessBatch] = useState<FormattedBatch | null>(null);

  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [batchToTemplate, setBatchToTemplate] = useState<FormattedBatch | null>(
    null,
  );

  const [qcChecks, setQcChecks] = useState({
    visual: false,
    weight: false,
    temperature: false,
  });
  const [actualProducedQty, setActualProducedQty] = useState<string>("0");
  const [spoiltQty, setSpoiltQty] = useState<string>("0");
  const [spoilageReason, setSpoilageReason] = useState<string>("none");
  const [qcNotes, setQcNotes] = useState<string>("");

  const [localSearchTerm, setLocalSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [sortBy, setSortBy] = useState<string>("createdAt_desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setPage(1);
  }, [statusFilter, locationFilter, sortBy, localSearchTerm]);

  const {
    data: batchesData,
    isLoading: loadingBatches,
    error: fetchError,
    refetch,
  } = useBatches({
    status: statusFilter,
    locationId: locationFilter,
    sortBy: sortBy,
    page,
    limit,
  });

  const { data: recipes = [] } = useRecipes();
  const { data: ingredients = [] } = useListIngredients();
  const { data: bakers = [] } = useBakers();

  const startBatchMutation = useStartBatch();
  const completeBatchMutation = useCompleteBatch();
  const cancelBatchMutation = useCancelBatch();
  const createBatchMutation = useCreateBatch();
  const { mutate: duplicateBatch, isPending: isDuplicating } =
    useDuplicateBatch();

  const batches: FormattedBatch[] =
    batchesData?.data?.filter(
      (b: any) => b && typeof b === "object" && "batchNumber" in b,
    ) || [];

  const totalCount: number =
    (batchesData?.metadata?.total ?? batchesData?.metadata?.meta?.total) ??
    batches.length;

  const filteredBatches = useMemo(() => {
    const term = localSearchTerm.toLowerCase();
    return batches.filter((batch) => {
      const matchesSearch =
        (batch.name?.toLowerCase().includes(term) ?? false) ||
        (batch.recipe?.name?.toLowerCase().includes(term) ?? false) ||
        (batch.batchNumber?.toLowerCase().includes(term) ?? false) ||
        (batch.tags?.some((tag) => tag.toLowerCase().includes(term)) ?? false);
      return matchesSearch;
    });
  }, [batches, localSearchTerm]);

  const statusSummary = useMemo(() => {
    return {
      inProgress: batches.filter((b) => b.status === BatchStatus.IN_PROGRESS)
        .length,
      planned: batches.filter((b) => b.status === BatchStatus.PLANNED).length,
      completed: batches.filter((b) => b.status === BatchStatus.COMPLETED)
        .length,
    };
  }, [batches]);

  const handleStartBatch = (batchId: string) =>
    startBatchMutation.mutate(batchId);
  const handleCancelBatch = (batchId: string) =>
    cancelBatchMutation.mutate(batchId);

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredBatches.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredBatches.map((b) => b.id)));
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  useKeyboardShortcuts({
    n: () => setIsCreateDialogOpen(true),
    f: () => {
      const searchInput = document.getElementById(
        "batch-search",
      ) as HTMLInputElement;
      searchInput?.focus();
    },
    "/": () => {
      const searchInput = document.getElementById(
        "batch-search",
      ) as HTMLInputElement;
      searchInput?.focus();
    },
    v: () => setViewMode((prev) => (prev === "table" ? "grid" : "table")),
    s: () => setIsSmartWizardOpen(true),
  });

  const handleDuplicate = (batchId: string) => {
    duplicateBatch(batchId, {
      onSuccess: () => toast.success("Production run duplicated"),
      onError: () => toast.error("Could not duplicate run. Try again."),
    });
  };

  const handlePrintLabel = (batch: FormattedBatch) => {
    setPrintingBatch(batch);
    setIsPrintDialogOpen(true);
  };

  const [selectedStockBatches, setSelectedStockBatches] = useState<
    Record<string, { stockBatchId: string; quantity: number }>
  >({});

  const initiateCompletion = (batch: FormattedBatch) => {
    setQualityCheckBatch(batch);
    setQcChecks({ visual: false, weight: false, temperature: false });
    setActualProducedQty(batch.plannedQuantity.toString());
    setSpoiltQty("0");
    setSelectedStockBatches({});
    setIsQualityCheckOpen(true);
  };

  const confirmBatchCompletion = () => {
    if (!qualityCheckBatch) return;
    const ingredientConsumptions = Object.values(selectedStockBatches);
    completeBatchMutation.mutate(
      {
        batchId: qualityCheckBatch.id,
        data: {
          actualQuantity: parseFloat(actualProducedQty),
          wasteQuantity: parseFloat(spoiltQty),
          wasteReason: spoilageReason,
          notes: qcNotes,
          qcData: { checks: qcChecks },
          ingredientConsumptions,
        },
      },
      {
        onSuccess: (data: any) => {
          setIsQualityCheckOpen(false);
          setSuccessBatch(data || qualityCheckBatch);
          setIsSuccessDialogOpen(true);
        },
        onError: () =>
          toast.error(
            "Could not complete batch. Review the audit details and try again.",
          ),
      },
    );
  };

  const isQcPassed = qcChecks.visual && qcChecks.weight && qcChecks.temperature;

  const handleSmartCreate = async (data: any) => {
    try {
      const scheduledDate =
        data.scheduledDate && isValid(new Date(data.scheduledDate))
          ? new Date(data.scheduledDate)
          : new Date();
      const recipe = recipes.find((r) => r.id === data.recipeId);

      if (!recipe) {
        toast.error("Selected recipe not found");
        return;
      }

      await createBatchMutation.mutateAsync({
        recipeId: data.recipeId,
        plannedQuantity: data.quantity,
        systemUnitId: recipe.systemUnitId,
        orgUnitId: recipe.orgUnitId,
        date: scheduledDate,
        time: format(scheduledDate, "HH:mm"),
        leadBakerId: data.leadBakerId === "none" ? undefined : data.leadBakerId,
        assistantBakerIds: data.assistantBakerIds || [],
        recipeMultiplier: data.multiplier || 1.0,
        notes: data.notes || `Smart Provision run for ${recipe.name}`,
      } as any);
      toast.success("Production run scheduled");
      setIsSmartWizardOpen(false);
    } catch (err: any) {
      console.error("Smart Provision failed:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to schedule production run";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto pb-10">
      {/* Page header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Production batches
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Schedule, run, and reconcile manufacturing orders across
              locations.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2 text-xs font-medium"
              onClick={() => refetch()}
              disabled={loadingBatches}
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", loadingBatches && "animate-spin")}
              />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2 text-xs font-medium"
              onClick={() => setIsSmartWizardOpen(true)}
            >
              <Zap className="h-3.5 w-3.5" />
              Smart Provision
            </Button>
            <Button
              size="sm"
              className="h-9 gap-2 text-xs font-medium"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              New batch
            </Button>
          </div>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Planned
          </p>
          <p className="text-2xl font-semibold tabular-nums mt-1">
            {statusSummary.planned}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            In progress
          </p>
          <p className="text-2xl font-semibold tabular-nums mt-1 text-blue-600 dark:text-blue-400">
            {statusSummary.inProgress}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Completed
          </p>
          <p className="text-2xl font-semibold tabular-nums mt-1 text-emerald-600 dark:text-emerald-400">
            {statusSummary.completed}
          </p>
        </div>
      </div>

      {/* Control panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-card p-3 rounded-lg border border-border">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 min-w-[220px] md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              id="batch-search"
              placeholder="Search by ID, formula, or tag"
              value={localSearchTerm}
              onChange={(e) => setLocalSearchTerm(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-9 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value={BatchStatus.PLANNED}>Planned</SelectItem>
              <SelectItem value={BatchStatus.IN_PROGRESS}>
                In progress
              </SelectItem>
              <SelectItem value={BatchStatus.COMPLETED}>Completed</SelectItem>
              <SelectItem value={BatchStatus.CANCELLED}>Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-44 h-9 text-sm">
              <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt_desc">Newest first</SelectItem>
              <SelectItem value="createdAt_asc">Oldest first</SelectItem>
              <SelectItem value="scheduledStartAt_asc">
                Scheduled time
              </SelectItem>
              <SelectItem value="plannedQuantity_desc">
                Planned yield
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
              <span className="text-xs text-muted-foreground font-medium">
                {selectedIds.size} selected
              </span>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs font-medium"
              >
                <Printer className="h-3.5 w-3.5 mr-1.5" />
                Print labels
              </Button>
              <Separator orientation="vertical" className="h-5" />
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs font-medium text-muted-foreground"
            onClick={() => setViewMode(viewMode === "grid" ? "table" : "grid")}
          >
            <Layers className="h-3.5 w-3.5" />
            {viewMode === "grid" ? "Table view" : "Grid view"}
          </Button>
        </div>
      </div>

      {/* Main table */}
      {viewMode === "table" ? (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border bg-muted/40">
                <TableHead className="w-[44px] pl-4">
                  <Checkbox
                    checked={
                      selectedIds.size > 0 &&
                      selectedIds.size === filteredBatches.length
                    }
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground py-3">
                  Batch
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground text-right">
                  Planned yield
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">
                  Scheduled
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">
                  Lead baker
                </TableHead>
                <TableHead className="w-[56px] pr-4" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingBatches
                ? Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i} className="border-border">
                      <TableCell colSpan={7} className="py-4 px-4">
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : filteredBatches.map((batch) => (
                    <TableRow
                      key={batch.id}
                      className={cn(
                        "group border-border",
                        selectedIds.has(batch.id)
                          ? "bg-primary/[0.03]"
                          : "hover:bg-muted/30",
                      )}
                    >
                      <TableCell className="pl-4">
                        <Checkbox
                          checked={selectedIds.has(batch.id)}
                          onCheckedChange={() => toggleSelect(batch.id)}
                        />
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex flex-col">
                          <span className="font-mono text-xs font-medium text-foreground">
                            {batch.batchNumber || "N/A"}
                          </span>
                          <span className="text-[13px] text-muted-foreground">
                            {batch.recipe?.name || "Unknown recipe"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusIndicator status={batch.status} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm font-medium">
                        {batch.plannedQuantity}
                        <span className="text-xs text-muted-foreground font-normal ml-1">
                          {batch.unit?.symbol || ""}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(
                          new Date(batch.scheduledStartAt),
                          "MMM d, HH:mm",
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-foreground">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                            {batch.leadBaker?.name?.charAt(0) || "—"}
                          </div>
                          <span
                            className={cn(
                              !batch.leadBaker?.name && "text-muted-foreground",
                            )}
                          >
                            {batch.leadBaker?.name || "Unassigned"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel className="text-xs text-muted-foreground">
                              Actions
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedBatch(batch);
                                setIsViewDialogOpen(true);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" /> View details
                            </DropdownMenuItem>
                            {batch.status === BatchStatus.PLANNED && (
                              <DropdownMenuItem
                                onClick={() => handleStartBatch(batch.id)}
                              >
                                <Play className="mr-2 h-4 w-4" /> Start batch
                              </DropdownMenuItem>
                            )}
                            {batch.status === BatchStatus.IN_PROGRESS && (
                              <DropdownMenuItem
                                onClick={() => initiateCompletion(batch)}
                              >
                                <ClipboardCheck className="mr-2 h-4 w-4" />{" "}
                                Complete &amp; audit
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handlePrintLabel(batch)}
                            >
                              <Printer className="mr-2 h-4 w-4" /> Print label
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDuplicate(batch.id)}
                            >
                              <Copy className="mr-2 h-4 w-4" /> Duplicate
                            </DropdownMenuItem>
                            {(batch.status === BatchStatus.PLANNED ||
                              batch.status === BatchStatus.IN_PROGRESS) && (
                              <DropdownMenuItem
                                onClick={() => handleCancelBatch(batch.id)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <XCircle className="mr-2 h-4 w-4" /> Cancel
                                batch
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>

          {!loadingBatches && filteredBatches.length === 0 && (
            <div className="py-16 text-center">
              <Factory className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-foreground">
                No batches match your filters
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Try adjusting search or status filters.
              </p>
              <Button
                variant="link"
                size="sm"
                className="text-xs mt-1"
                onClick={() => {
                  setLocalSearchTerm("");
                  setStatusFilter("all");
                }}
              >
                Reset filters
              </Button>
            </div>
          )}

          {!loadingBatches && filteredBatches.length > 0 && (
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/20">
              <p className="text-xs text-muted-foreground">
                Showing{" "}
                <span className="font-medium text-foreground">
                  {filteredBatches.length}
                </span>{" "}
                of{" "}
                <span className="font-medium text-foreground">
                  {totalCount}
                </span>{" "}
                batches
              </p>
              <Pagination
                currentPage={page}
                pageSize={limit}
                totalItems={totalCount}
                totalPages={Math.ceil(totalCount / limit)}
                onPageChange={setPage}
                onPageSizeChange={setLimit}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {loadingBatches
            ? Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="h-48">
                  <CardContent className="p-4">
                    <Skeleton className="h-full w-full" />
                  </CardContent>
                </Card>
              ))
            : filteredBatches.map((batch) => (
                <BatchCard
                  key={batch.id}
                  batch={batch}
                  onView={(b) => {
                    setSelectedBatch(b);
                    setIsViewDialogOpen(true);
                  }}
                  onStart={() => handleStartBatch(batch.id)}
                  onComplete={(b) => initiateCompletion(b)}
                  onCancel={() => handleCancelBatch(batch.id)}
                  onEdit={(b) => {
                    setSelectedBatch(b);
                    setIsEditDialogOpen(true);
                  }}
                  onDuplicate={(id) => handleDuplicate(id)}
                  onPrint={(b) => handlePrintLabel(b)}
                  onSaveTemplate={(b) => {
                    setBatchToTemplate(b);
                    setIsTemplateDialogOpen(true);
                  }}
                  isStarting={startBatchMutation.isPending}
                  isCompleting={completeBatchMutation.isPending}
                  isCancelling={cancelBatchMutation.isPending}
                  isDuplicating={isDuplicating}
                />
              ))}
        </div>
      )}

      {/* Sheets & Dialogs */}
      <Sheet open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <SheetContent className="w-full sm:max-w-3xl p-0">
          <div className="px-6 py-5 border-b border-border">
            <SheetHeader>
              <SheetTitle className="text-lg font-semibold">
                New production batch
              </SheetTitle>
              <SheetDescription className="text-sm text-muted-foreground">
                Define the recipe, quantity, and schedule for a new batch.
              </SheetDescription>
            </SheetHeader>
          </div>
          <div className="p-6 overflow-y-auto h-[calc(100vh-6.5rem)]">
            <BatchForm
              onSuccess={() => setIsCreateDialogOpen(false)}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={isQualityCheckOpen} onOpenChange={setIsQualityCheckOpen}>
        <SheetContent className="w-full sm:max-w-2xl p-0">
          <div className="px-6 py-5 border-b border-border">
            <SheetHeader>
              <SheetTitle className="text-lg font-semibold">
                Complete batch &amp; quality audit
              </SheetTitle>
              <SheetDescription className="text-sm text-muted-foreground">
                Confirm output quality and record final yield before closing
                this run.
              </SheetDescription>
            </SheetHeader>
          </div>

          <div className="p-6 space-y-7 overflow-y-auto h-[calc(100vh-9rem)]">
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Batch
                </span>
                <span className="font-mono text-sm font-medium mt-0.5">
                  {qualityCheckBatch?.batchNumber}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Target yield
                </span>
                <span className="text-sm font-medium mt-0.5">
                  {qualityCheckBatch?.plannedQuantity}{" "}
                  {qualityCheckBatch?.unit?.symbol || ""}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Quality checks
              </Label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { key: "visual", label: "Visual standard (color / texture)" },
                  { key: "weight", label: "Weight verification" },
                  { key: "temperature", label: "Core temperature check" },
                ].map((check) => (
                  <label
                    key={check.key}
                    className="flex items-center justify-between p-3 rounded-md border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <span className="text-sm text-foreground">
                      {check.label}
                    </span>
                    <Checkbox
                      checked={(qcChecks as any)[check.key]}
                      onCheckedChange={(val) =>
                        setQcChecks((prev) => ({ ...prev, [check.key]: !!val }))
                      }
                    />
                  </label>
                ))}
              </div>
              {!isQcPassed && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  All checks must pass before this batch can be committed.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Actual yield
                </Label>
                <Input
                  type="number"
                  value={actualProducedQty}
                  onChange={(e) => setActualProducedQty(e.target.value)}
                  className="h-10 text-sm font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Waste / defects
                </Label>
                <Input
                  type="number"
                  value={spoiltQty}
                  onChange={(e) => setSpoiltQty(e.target.value)}
                  className="h-10 text-sm font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Inspector notes
              </Label>
              <Textarea
                value={qcNotes}
                onChange={(e) => setQcNotes(e.target.value)}
                placeholder="Record any deviations or observations"
                className="min-h-[100px] text-sm"
              />
            </div>
          </div>

          <div className="p-4 border-t border-border bg-muted/20 flex justify-end gap-2 sticky bottom-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsQualityCheckOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="px-6"
              disabled={!isQcPassed || completeBatchMutation.isPending}
              onClick={confirmBatchCompletion}
            >
              {completeBatchMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Complete batch"
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* View overlays */}
      {selectedBatch && (
        <BatchView
          batchId={selectedBatch.id}
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
        />
      )}

      <Sheet open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <SheetContent className="w-full sm:max-w-3xl p-0">
          <div className="px-6 py-5 border-b border-border">
            <SheetHeader>
              <SheetTitle className="text-lg font-semibold">
                Edit batch
              </SheetTitle>
              <SheetDescription className="text-sm text-muted-foreground">
                Update parameters for this run.
              </SheetDescription>
            </SheetHeader>
          </div>
          <div className="p-6 overflow-y-auto h-[calc(100vh-6.5rem)]">
            {selectedBatch && (
              <BatchForm
                batch={selectedBatch}
                onSuccess={() => setIsEditDialogOpen(false)}
                onCancel={() => setIsEditDialogOpen(false)}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {isSmartWizardOpen && (
        <SmartProductionWizard
          recipes={recipes}
          inventory={ingredients}
          bakers={bakers}
          onCreateBatch={handleSmartCreate}
          onClose={() => setIsSmartWizardOpen(false)}
        />
      )}

      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent className="max-w-sm p-0 overflow-hidden">
          <div className="px-6 pt-6 pb-5">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">
                  Batch completed
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  This run has been committed to stock and closed out.
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 pb-6 space-y-4">
            <div className="rounded-md border border-border bg-muted/30 px-4 py-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground block">
                  Batch number
                </span>
                <span className="font-mono text-sm font-medium">
                  {successBatch?.batchNumber}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  if (successBatch?.batchNumber) {
                    navigator.clipboard.writeText(successBatch.batchNumber);
                    toast.success("Batch number copied");
                  }
                }}
              >
                <Copy className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border border-border px-3 py-2.5">
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground block mb-0.5">
                  Recipe
                </span>
                <span className="text-sm font-medium truncate block">
                  {successBatch?.recipe?.name || "—"}
                </span>
              </div>
              <div className="rounded-md border border-border px-3 py-2.5">
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground block mb-0.5">
                  Final yield
                </span>
                <span className="text-sm font-medium block">
                  {successBatch?.actualQuantity || actualProducedQty}{" "}
                  {successBatch?.unit?.symbol || ""}
                </span>
              </div>
            </div>

            <Button
              className="w-full h-9"
              onClick={() => setIsSuccessDialogOpen(false)}
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-base font-semibold">
              Label preview
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center p-6 bg-muted/30 rounded-lg border border-dashed border-border">
            {printingBatch && <BatchLabel batch={printingBatch} />}
          </div>
          <DialogFooter className="mt-6 flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPrintDialogOpen(false)}
            >
              Close
            </Button>
            <Button size="sm" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateEditTemplate
        isOpen={isTemplateDialogOpen}
        onOpenChange={setIsTemplateDialogOpen}
        template={null}
        initialData={
          batchToTemplate
            ? {
                name: `${batchToTemplate.name} Template`,
                recipeId: batchToTemplate.recipe.id,
                quantity: batchToTemplate.plannedQuantity,
                systemUnitId: batchToTemplate.unit.id,
                notes: batchToTemplate.notes || "",
              }
            : undefined
        }
      />
    </div>
  );
}
