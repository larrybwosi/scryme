'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@repo/ui/components/ui/card';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/ui/select';
import { ScrollArea } from '@repo/ui/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetFooter,
} from '@repo/ui/components/ui/sheet';
import { Checkbox } from '@repo/ui/components/ui/checkbox';
import { Label } from '@repo/ui/components/ui/label';
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
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Copy,
  FileJson,
  LayoutList,
  LayoutGrid,
  ArrowUpDown,
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
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@repo/ui/components/ui/skeleton';
import { Textarea } from '@repo/ui/components/ui/textarea';
import { format, isValid } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui/components/ui/dropdown-menu';
import { Badge } from '@repo/ui/components/ui/badge';
import { cn } from '@/lib/utils';
import { Pagination } from '@/components/common/data-pagination';

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
} from '@/hooks/bakery';

import { BatchStatus, FormattedBatch, UnifiedBatchDetails } from '@/types/bakery';

// Components
import { BatchForm } from '@/components/bakery/BatchForm';
import { BatchView } from '@/components/bakery/BatchViewSheet';
import { BatchLabel } from '@/components/bakery/BatchLabel';
import { BatchCard } from '@/components/bakery/BatchCard';
import { SmartProductionWizard } from '@/components/bakery/SmartProductionWizard';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/components/ui/dialog';
import { getStatusStyles } from '@/utils/status-styles';
import { LocationSelect } from '@/components/common/location-select';
import { CreateEditTemplate } from '@/components/bakery/CreateEditTemplate';

// fallow-ignore-next-line complexity
export default function BatchManager() {
  const [selectedBatch, setSelectedBatch] = useState<FormattedBatch | null>(null);
  const [qualityCheckBatch, setQualityCheckBatch] = useState<FormattedBatch | null>(null);
  const [isSmartWizardOpen, setIsSmartWizardOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isQualityCheckOpen, setIsQualityCheckOpen] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [printingBatch, setPrintingBatch] = useState<FormattedBatch | null>(null);

  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [successBatch, setSuccessBatch] = useState<FormattedBatch | null>(null);

  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [batchToTemplate, setBatchToTemplate] = useState<FormattedBatch | null>(null);

  const [qcChecks, setQcChecks] = useState({ visual: false, weight: false, temperature: false });
  const [actualProducedQty, setActualProducedQty] = useState<string>('0');
  const [spoiltQty, setSpoiltQty] = useState<string>('0');
  const [spoilageReason, setSpoilageReason] = useState<string>('none');
  const [qcNotes, setQcNotes] = useState<string>('');

  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [sortBy, setSortBy] = useState<string>('createdAt_desc');
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
  const { mutate: duplicateBatch, isPending: isDuplicating } = useDuplicateBatch();

  const batches: FormattedBatch[] =
    batchesData?.data?.filter((b: any) => b && typeof b === 'object' && 'batchNumber' in b) || [];

  const filteredBatches = useMemo(() => {
    const term = localSearchTerm.toLowerCase();
    return batches.filter(batch => {
      const matchesSearch =
        batch.name.toLowerCase().includes(term) ||
        batch.recipe.name.toLowerCase().includes(term) ||
        batch.batchNumber.toLowerCase().includes(term) ||
        batch.tags?.some(tag => tag.toLowerCase().includes(term));
      return matchesSearch;
    });
  }, [batches, localSearchTerm]);

  const handleStartBatch = (batchId: string) => startBatchMutation.mutate(batchId);
  const handleCancelBatch = (batchId: string) => cancelBatchMutation.mutate(batchId);

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredBatches.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredBatches.map(b => b.id)));
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  useKeyboardShortcuts({
    'n': () => setIsCreateDialogOpen(true),
    'f': () => {
      const searchInput = document.getElementById('batch-search') as HTMLInputElement;
      searchInput?.focus();
    },
    '/': () => {
      const searchInput = document.getElementById('batch-search') as HTMLInputElement;
      searchInput?.focus();
    },
    'v': () => setViewMode(prev => (prev === 'table' ? 'grid' : 'table')),
    's': () => setIsSmartWizardOpen(true),
  });

  const handleDuplicate = (batchId: string) => {
    duplicateBatch(batchId, {
      onSuccess: () => toast.success('Production run duplicated successfully'),
      onError: () => toast.error('Failed to duplicate run'),
    });
  };

  const handlePrintLabel = (batch: FormattedBatch) => {
    setPrintingBatch(batch);
    setIsPrintDialogOpen(true);
  };

  const [selectedStockBatches, setSelectedStockBatches] = useState<Record<string, { stockBatchId: string, quantity: number }>>({});

  const initiateCompletion = (batch: FormattedBatch) => {
    setQualityCheckBatch(batch);
    setQcChecks({ visual: false, weight: false, temperature: false });
    setActualProducedQty(batch.plannedQuantity.toString());
    setSpoiltQty('0');
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
          ingredientConsumptions
        },
      },
      {
        onSuccess: (data: any) => {
          setIsQualityCheckOpen(false);
          setSuccessBatch(data || qualityCheckBatch);
          setIsSuccessDialogOpen(true);
        },
      }
    );
  };

  const isQcPassed = qcChecks.visual && qcChecks.weight && qcChecks.temperature;

  const handleSmartCreate = async (data: any) => {
    try {
      const scheduledDate = data.scheduledDate && isValid(new Date(data.scheduledDate)) ? new Date(data.scheduledDate) : new Date();
      const recipe = recipes.find(r => r.id === data.recipeId);
      await createBatchMutation.mutateAsync({
        batchId: data.batchId,
        recipeId: data.recipeId,
        plannedQuantity: data.quantity,
        date: scheduledDate,
        time: format(scheduledDate, 'HH:mm'),
        leadBakerId: data.leadBakerId,
        recipeMultiplier: data.multiplier || 1.0,
        notes: `Smart Provision run for ${recipe?.name}`,
      } as any);
      toast.success('Production run scheduled');
      setIsSmartWizardOpen(false);
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      {/* Control Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-card/40 p-4 rounded-xl border border-border/40 backdrop-blur-md">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <Input
              id="batch-search"
              placeholder="Search batches, formulas, or tags..."
              value={localSearchTerm}
              onChange={e => setLocalSearchTerm(e.target.value)}
              className="pl-10 h-11 border-border/50 bg-background/50 focus-visible:ring-primary/10 transition-all rounded-lg"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 h-11 border-border/50 bg-background/50 rounded-lg">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value={BatchStatus.PLANNED}>Planned</SelectItem>
              <SelectItem value={BatchStatus.IN_PROGRESS}>In Progress</SelectItem>
              <SelectItem value={BatchStatus.COMPLETED}>Completed</SelectItem>
              <SelectItem value={BatchStatus.CANCELLED}>Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
           {selectedIds.size > 0 && (
             <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                <Button size="sm" variant="outline" className="h-9 border-border/60 font-bold text-xs uppercase tracking-wider">
                  Bulk Print
                </Button>
                <div className="h-4 w-px bg-border/60 mx-1" />
             </div>
           )}

           <Button variant="outline" className="h-10 gap-2 text-xs border-border/60 font-medium hidden sm:flex" onClick={() => setIsSmartWizardOpen(true)}>
             <Zap className="h-4 w-4 text-primary" />
             Smart Provision
           </Button>

           <Button variant="outline" className="h-10 gap-2 text-xs border-border/60 font-medium" onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}>
              <Layers className="h-4 w-4" />
              {viewMode === 'grid' ? 'Table View' : 'Grid View'}
           </Button>

           <Button className="h-10 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-sm px-4" onClick={() => setIsCreateDialogOpen(true)}>
             <Plus className="h-4 w-4" />
             Provision Run
           </Button>
        </div>
      </div>

      {/* Main Table */}
      {viewMode === 'table' ? (
        <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-md overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="hover:bg-transparent border-border/30">
                <TableHead className="w-[50px] pl-6">
                  <Checkbox checked={selectedIds.size > 0 && selectedIds.size === filteredBatches.length} onCheckedChange={toggleSelectAll} />
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-[0.1em] text-muted-foreground/70 py-5">
                  Production ID & Formula
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-[0.1em] text-muted-foreground/70">Status</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-[0.1em] text-muted-foreground/70 text-right">Planned Yield</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-[0.1em] text-muted-foreground/70">Scheduled Window</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-[0.1em] text-muted-foreground/70">Lead Operator</TableHead>
                <TableHead className="w-[80px] pr-6"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingBatches ? (
                 Array.from({ length: 6 }).map((_, i) => (
                   <TableRow key={i}><TableCell colSpan={7} className="py-6 px-6"><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                 ))
              ) : filteredBatches.map(batch => (
                <TableRow key={batch.id} className={cn("group transition-all border-border/20", selectedIds.has(batch.id) ? "bg-primary/[0.04]" : "hover:bg-muted/10")}>
                  <TableCell className="pl-6">
                    <Checkbox checked={selectedIds.has(batch.id)} onCheckedChange={() => toggleSelect(batch.id)} />
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-xs font-bold text-foreground/90 tracking-tight">{batch.batchNumber}</span>
                      <span className="text-[11px] text-muted-foreground/80 font-semibold">{batch.recipe.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('text-[9px] uppercase font-bold tracking-widest border-none px-2.5 py-1 rounded-full shadow-sm', getStatusStyles(batch.status))}>
                      {batch.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold tabular-nums text-sm">
                    {batch.plannedQuantity} <span className="text-[10px] text-muted-foreground/50 font-medium uppercase tracking-tighter ml-0.5">{batch.unit.symbol}</span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground/90 font-medium">
                    <div className="flex items-center gap-2">
                       <div className="h-2 w-2 rounded-full bg-primary/20 animate-pulse" />
                       {format(new Date(batch.scheduledStartAt), 'MMM dd, HH:mm')}
                    </div>
                  </TableCell>
                  <TableCell className="text-[13px] font-semibold text-foreground/80">
                     <div className="flex items-center gap-2">
                       <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground border border-border/50">
                         {batch.leadBaker?.name?.charAt(0) || '?'}
                       </div>
                       {batch.leadBaker?.name || 'Unassigned'}
                     </div>
                  </TableCell>
                  <TableCell className="text-right">
                     <DropdownMenu>
                       <DropdownMenuTrigger asChild>
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                           <MoreVertical className="h-4 w-4" />
                         </Button>
                       </DropdownMenuTrigger>
                       <DropdownMenuContent align="end" className="w-48">
                         <DropdownMenuLabel>Production Actions</DropdownMenuLabel>
                         <DropdownMenuSeparator />
                         <DropdownMenuItem onClick={() => { setSelectedBatch(batch); setIsViewDialogOpen(true); }}>
                           <Eye className="mr-2 h-4 w-4" /> View Full Specs
                         </DropdownMenuItem>
                         {batch.status === BatchStatus.PLANNED && (
                           <DropdownMenuItem onClick={() => handleStartBatch(batch.id)} className="text-primary font-bold">
                             <Play className="mr-2 h-4 w-4" /> Initialize Run
                           </DropdownMenuItem>
                         )}
                         {batch.status === BatchStatus.IN_PROGRESS && (
                           <DropdownMenuItem onClick={() => initiateCompletion(batch)} className="text-emerald-600 font-bold">
                             <ClipboardCheck className="mr-2 h-4 w-4" /> Quality Audit & Yield
                           </DropdownMenuItem>
                         )}
                         <DropdownMenuSeparator />
                         <DropdownMenuItem onClick={() => handlePrintLabel(batch)}>
                            <Printer className="mr-2 h-4 w-4" /> Print Label
                         </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => handleDuplicate(batch.id)}>
                            <Copy className="mr-2 h-4 w-4" /> Duplicate Config
                         </DropdownMenuItem>
                         {(batch.status === BatchStatus.PLANNED || batch.status === BatchStatus.IN_PROGRESS) && (
                           <DropdownMenuItem onClick={() => handleCancelBatch(batch.id)} className="text-red-600">
                             <XCircle className="mr-2 h-4 w-4" /> Terminate Run
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
             <div className="py-20 text-center">
                <Factory className="h-10 w-10 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-sm font-bold text-muted-foreground">No active manufacturing orders found</p>
                <Button variant="link" className="text-xs mt-1" onClick={() => { setLocalSearchTerm(''); setStatusFilter('all'); }}>Reset filters</Button>
             </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
           {loadingBatches ? (
             Array.from({ length: 8 }).map((_, i) => <Card key={i} className="h-48"><CardContent className="p-4"><Skeleton className="h-full w-full" /></CardContent></Card>)
           ) : filteredBatches.map(batch => (
             <BatchCard
                key={batch.id}
                batch={batch}
                onView={(b) => { setSelectedBatch(b); setIsViewDialogOpen(true); }}
                onStart={() => handleStartBatch(batch.id)}
                onComplete={(b) => initiateCompletion(b)}
                onCancel={() => handleCancelBatch(batch.id)}
                onEdit={(b) => { setSelectedBatch(b); setIsEditDialogOpen(true); }}
                onDuplicate={(id) => handleDuplicate(id)}
                onPrint={(b) => handlePrintLabel(b)}
                onSaveTemplate={(b) => { setBatchToTemplate(b); setIsTemplateDialogOpen(true); }}
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
        <SheetContent className="w-full sm:max-w-3xl p-0 border-l border-border/50">
          <div className="px-6 py-6 border-b border-border/30 bg-muted/20">
            <SheetHeader>
              <SheetTitle className="text-xl font-bold tracking-tight">Provision Manufacturing Order</SheetTitle>
              <SheetDescription className="font-medium text-muted-foreground">Define parameters for a new production batch.</SheetDescription>
            </SheetHeader>
          </div>
          <div className="p-6 overflow-y-auto h-[calc(100vh-8rem)]">
            <BatchForm onSuccess={() => setIsCreateDialogOpen(false)} onCancel={() => setIsCreateDialogOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={isQualityCheckOpen} onOpenChange={setIsQualityCheckOpen}>
        <SheetContent className="w-full sm:max-w-2xl p-0 border-l border-border/50">
          <div className="px-6 py-6 border-b border-border/30 bg-muted/20">
            <SheetHeader>
              <SheetTitle className="text-xl font-bold tracking-tight">Production Quality Audit</SheetTitle>
              <SheetDescription className="font-medium text-muted-foreground">Verify output standards and record final yield.</SheetDescription>
            </SheetHeader>
          </div>

          <div className="p-8 space-y-8 overflow-y-auto h-[calc(100vh-10rem)]">
             <div className="bg-muted/30 p-4 rounded-lg border border-border/50 flex justify-between items-center">
                <div className="flex flex-col">
                   <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest mb-1">Batch ID</span>
                   <span className="font-bold text-lg">{qualityCheckBatch?.batchNumber}</span>
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest mb-1">Target Quantity</span>
                   <span className="font-bold text-lg">{qualityCheckBatch?.plannedQuantity} {qualityCheckBatch?.unit.symbol}</span>
                </div>
             </div>

             <div className="space-y-4">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/80">Compliance Verification</Label>
                <div className="grid grid-cols-1 gap-3">
                   {['Visual Standard (Color/Texture)', 'Weight Verification', 'Core Temperature Check'].map((check, i) => (
                      <div key={check} className="flex items-center justify-between p-3 rounded-lg border border-border/60 hover:bg-muted/20 transition-colors">
                         <span className="text-sm font-bold">{check}</span>
                         <Checkbox
                            checked={i === 0 ? qcChecks.visual : i === 1 ? qcChecks.weight : qcChecks.temperature}
                            onCheckedChange={(val) => setQcChecks(prev => ({...prev, [i === 0 ? 'visual' : i === 1 ? 'weight' : 'temperature']: !!val}))}
                         />
                      </div>
                   ))}
                </div>
             </div>

             <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                   <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/80">Actual Gross Yield</Label>
                   <Input
                      type="number"
                      value={actualProducedQty}
                      onChange={e => setActualProducedQty(e.target.value)}
                      className="font-bold text-lg h-12"
                   />
                </div>
                <div className="space-y-2">
                   <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/80">Waste / Defects</Label>
                   <Input
                      type="number"
                      value={spoiltQty}
                      onChange={e => setSpoiltQty(e.target.value)}
                      className="font-bold text-lg h-12 text-destructive"
                   />
                </div>
             </div>

             <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/80">Final Inspector Remarks</Label>
                <Textarea
                   value={qcNotes}
                   onChange={e => setQcNotes(e.target.value)}
                   placeholder="Enter any deviations or observations..."
                   className="min-h-[120px] font-medium"
                />
             </div>
          </div>

          <div className="p-6 border-t border-border/30 bg-muted/20 flex justify-end gap-3 sticky bottom-0">
             <Button variant="ghost" className="font-bold" onClick={() => setIsQualityCheckOpen(false)}>Cancel</Button>
             <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-black px-10 shadow-lg disabled:opacity-50"
                disabled={!isQcPassed || completeBatchMutation.isPending}
                onClick={confirmBatchCompletion}
             >
                {completeBatchMutation.isPending ? <Loader2 className="animate-spin" /> : 'AUTHORIZE & COMMIT'}
             </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* View Overlays */}
      {selectedBatch && (
        <BatchView batchId={selectedBatch.id} open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen} />
      )}

      <Sheet open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <SheetContent className="w-full sm:max-w-3xl p-0 border-l border-border/50">
          <div className="px-6 py-6 border-b border-border/30 bg-muted/20">
            <SheetHeader>
              <SheetTitle className="text-xl font-bold tracking-tight">Modify Production Run</SheetTitle>
              <SheetDescription className="font-medium text-muted-foreground">Update parameters for this active run.</SheetDescription>
            </SheetHeader>
          </div>
          <div className="p-6 overflow-y-auto h-[calc(100vh-8rem)]">
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
        <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-emerald-600 p-8 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <CheckCircle className="h-32 w-32 -mr-16 -mt-16" />
            </div>
            <div className="relative z-10">
              <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <Check className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-1">Production Complete</h3>
              <p className="text-emerald-100 text-sm">Batch has been successfully authorized and committed to stock.</p>
            </div>
          </div>

          <div className="p-6 space-y-6 bg-white dark:bg-slate-950">
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-2 group/batch relative">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Official Batch Number</span>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-mono font-bold text-slate-900 dark:text-slate-50 tracking-tight select-all">
                    {successBatch?.batchNumber}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-slate-200 dark:hover:bg-slate-800"
                    onClick={() => {
                      if (successBatch?.batchNumber) {
                        navigator.clipboard.writeText(successBatch.batchNumber);
                        toast.success('Batch number copied to clipboard');
                      }
                    }}
                  >
                    <Copy className="h-4 w-4 text-slate-500" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Recipe</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate block">
                    {successBatch?.recipe?.name || '—'}
                  </span>
                </div>
                <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Final Yield</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 block">
                    {successBatch?.actualQuantity || actualProducedQty} {successBatch?.unit?.symbol || ''}
                  </span>
                </div>
              </div>
            </div>

            <Button
              className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-50 dark:hover:bg-slate-200 dark:text-slate-900 font-bold h-11"
              onClick={() => setIsSuccessDialogOpen(false)}
            >
              Close Window
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
        <DialogContent className="max-w-md p-6">
           <DialogHeader className="mb-6">
              <DialogTitle className="text-xl font-bold">Production Label Preview</DialogTitle>
           </DialogHeader>
           <div className="flex justify-center p-6 bg-muted/50 rounded-xl border border-dashed border-border/60">
              {printingBatch && <BatchLabel batch={printingBatch} />}
           </div>
           <DialogFooter className="mt-8 flex gap-2 sm:justify-center">
              <Button variant="outline" className="font-bold" onClick={() => setIsPrintDialogOpen(false)}>Close Preview</Button>
              <Button className="font-bold shadow-md" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" /> Dispatch to Thermal
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
                notes: batchToTemplate.notes || '',
              }
            : undefined
        }
      />
    </div>
  );
}
