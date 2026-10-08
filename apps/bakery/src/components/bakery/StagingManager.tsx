import React, { useState } from 'react';
import {
  PackageCheck,
  Send,
  Trash2,
  History,
  Layers,
  Building2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Clock,
  Loader2,
} from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@repo/ui/components/ui/card';
import { Badge } from '@repo/ui/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@repo/ui/components/ui/dialog';
import { toast } from 'sonner';
import { useStagedBatches, useDispatchStagedBatch, useDisposeStagedStock } from '@/hooks/bakery';
import { LocationSelect } from '@/components/common/location-select';
import { useListLocations } from '@/lib/api/locations';
import { formatVariantName } from '@/lib/utils';
import { format } from 'date-fns';

export function StagingManager() {
  const { data: stagedBatches, isLoading, isError } = useStagedBatches() as any;
  const dispatchMutation = useDispatchStagedBatch();
  const disposeMutation = useDisposeStagedStock();
  const { data: locationsData } = useListLocations();
  const locationsList = React.useMemo(() => {
    if (!locationsData) return [];
    if (Array.isArray(locationsData)) return locationsData;
    return (locationsData as any).locations || (locationsData as any).data || [];
  }, [locationsData]);

  const [selectedBatch, setSelectedBatch] = useState<any | null>(null);
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [disposeModalOpen, setDisposeModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  // Form states
  const [targetLocationId, setTargetLocationId] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [wasteReason, setWasteReason] = useState('');

  const batches = Array.isArray(stagedBatches) ? stagedBatches : [];

  const handleOpenDispatch = (batch: any) => {
    setSelectedBatch(batch);
    const totalStaged = Number(batch.stagedQuantity || 0);
    const currentDispatched = Number(batch.dispatchedQuantity || 0);
    const currentWaste = Number(batch.stagingWasteQuantity || 0);
    const available = Math.max(0, totalStaged - currentDispatched - currentWaste);

    setQuantity(available);
    setTargetLocationId('');
    setNotes('');
    setDispatchModalOpen(true);
  };

  const handleOpenDispose = (batch: any) => {
    setSelectedBatch(batch);
    const totalStaged = Number(batch.stagedQuantity || 0);
    const currentDispatched = Number(batch.dispatchedQuantity || 0);
    const currentWaste = Number(batch.stagingWasteQuantity || 0);
    const available = Math.max(0, totalStaged - currentDispatched - currentWaste);

    setQuantity(available > 0 ? 1 : 0);
    setWasteReason('');
    setNotes('');
    setDisposeModalOpen(true);
  };

  const handleOpenHistory = (batch: any) => {
    setSelectedBatch(batch);
    setHistoryModalOpen(true);
  };

  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;
    if (!targetLocationId) {
      toast.error('Please select a Front Office location');
      return;
    }
    if (!quantity || Number(quantity) <= 0) {
      toast.error('Please enter a valid quantity to dispatch');
      return;
    }

    try {
      await dispatchMutation.mutateAsync({
        id: selectedBatch.id,
        data: {
          toLocationId: targetLocationId,
          quantity: Number(quantity),
          notes,
        },
      });
      const targetLocation = locationsList.find((loc: any) => loc.id === targetLocationId);
      const locName = targetLocation?.name || 'Front Office / POS';
      toast.success(`Successfully dispatched ${quantity} items to ${locName}`);
      setDispatchModalOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to dispatch items');
    }
  };

  const handleDisposeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;
    if (!quantity || Number(quantity) <= 0) {
      toast.error('Please enter a valid waste quantity');
      return;
    }

    try {
      await disposeMutation.mutateAsync({
        id: selectedBatch.id,
        data: {
          quantity: Number(quantity),
          reason: wasteReason,
          notes,
        },
      });
      toast.success(`Logged ${quantity} items as staging waste`);
      setDisposeModalOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to log staging waste');
    }
  };

  // Metrics
  const totalStagedCount = batches.length;
  const totalItemsAwaitingDispatch = batches.reduce((sum: number, b: any) => {
    const staged = Number(b.stagedQuantity || 0);
    const dispatched = Number(b.dispatchedQuantity || 0);
    const waste = Number(b.stagingWasteQuantity || 0);
    return sum + Math.max(0, staged - dispatched - waste);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Staged Batches
              </p>
              <p className="text-2xl font-bold text-foreground mt-1">{totalStagedCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400">
              <PackageCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Items Ready for POS
              </p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {totalItemsAwaitingDispatch.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Front Office Destination
              </p>
              <p className="text-sm font-semibold text-foreground mt-1">
                Retail Shop / POS Counter
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table / List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <PackageCheck className="h-5 w-5 text-primary" />
            Staged Items & Front Office Dispatch
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 flex items-center justify-center text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span>Loading staged batches...</span>
            </div>
          ) : isError ? (
            <div className="py-12 text-center text-destructive flex flex-col items-center gap-2">
              <AlertCircle className="h-8 w-8" />
              <span>Failed to load staged production batches.</span>
            </div>
          ) : batches.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="font-semibold text-foreground">No Items Currently Staged</p>
              <p className="text-xs max-w-sm">
                Completed production batches requiring dispatch will appear here. Turn on &quot;Enable Production Staging&quot; in settings if not already active.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider font-bold">
                  <tr>
                    <th className="px-4 py-3 rounded-l-md">Batch / Product</th>
                    <th className="px-4 py-3">Staged Qty</th>
                    <th className="px-4 py-3">Dispatched</th>
                    <th className="px-4 py-3">Available</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Completed Date</th>
                    <th className="px-4 py-3 text-right rounded-r-md">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {batches.map((batch: any) => {
                    const staged = Number(batch.stagedQuantity || 0);
                    const dispatched = Number(batch.dispatchedQuantity || 0);
                    const waste = Number(batch.stagingWasteQuantity || 0);
                    const available = Math.max(0, staged - dispatched - waste);

                    const productName = formatVariantName(
                      batch.recipe?.producesVariant?.product?.name || batch.recipe?.name || 'Production Item',
                      batch.recipe?.producesVariant?.name || ''
                    );

                    return (
                      <tr key={batch.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-foreground">{batch.batchNumber}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-xs">{productName}</div>
                        </td>
                        <td className="px-4 py-3 font-mono font-medium">{staged}</td>
                        <td className="px-4 py-3 font-mono text-emerald-600 dark:text-emerald-400">{dispatched}</td>
                        <td className="px-4 py-3 font-mono font-bold text-primary">{available}</td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={
                              batch.stagingStatus === 'PARTIALLY_DISPATCHED'
                                ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                            }
                          >
                            {batch.stagingStatus || 'STAGED'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {batch.completedAt ? format(new Date(batch.completedAt), 'MMM d, yyyy HH:mm') : '-'}
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <Button
                            size="sm"
                            disabled={available <= 0}
                            onClick={() => handleOpenDispatch(batch)}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                          >
                            <Send className="h-3.5 w-3.5 mr-1.5" />
                            Dispatch to POS
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={available <= 0}
                            onClick={() => handleOpenDispose(batch)}
                            className="text-destructive hover:bg-destructive/10"
                            title="Log Waste/Spoilage"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenHistory(batch)}
                            title="Dispatch History"
                          >
                            <History className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dispatch Modal */}
      <Dialog open={dispatchModalOpen} onOpenChange={setDispatchModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Dispatch to Front Office / POS
            </DialogTitle>
            <DialogDescription>
              Transfer staged items from production kitchen to Front Office sellable stock.
            </DialogDescription>
          </DialogHeader>

          {selectedBatch && (
            <form onSubmit={handleDispatchSubmit} className="space-y-4 py-2">
              <div className="p-3 bg-muted/60 rounded-lg text-xs space-y-1">
                <p className="font-semibold text-foreground">
                  Batch: {selectedBatch.batchNumber}
                </p>
                <p className="text-muted-foreground">
                  Product:{' '}
                  {formatVariantName(
                    selectedBatch.recipe?.producesVariant?.product?.name || selectedBatch.recipe?.name,
                    selectedBatch.recipe?.producesVariant?.name || ''
                  )}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Target Front Office / Retail Location
                </label>
                <LocationSelect
                  value={targetLocationId}
                  onValueChange={setTargetLocationId}
                  placeholder="Select Front Office location..."
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Quantity to Move
                </label>
                <Input
                  type="number"
                  step="any"
                  min="0.0001"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Enter quantity"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Notes (Optional)
                </label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Sent with morning delivery tray"
                />
              </div>

              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={() => setDispatchModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={dispatchMutation.isPending}>
                  {dispatchMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Confirm Dispatch
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Staging Waste Modal */}
      <Dialog open={disposeModalOpen} onOpenChange={setDisposeModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Log Staging Waste / Disposal
            </DialogTitle>
            <DialogDescription>
              Record spoiled or damaged staged inventory before dispatch.
            </DialogDescription>
          </DialogHeader>

          {selectedBatch && (
            <form onSubmit={handleDisposeSubmit} className="space-y-4 py-2">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Quantity Wasted
                </label>
                <Input
                  type="number"
                  step="any"
                  min="0.0001"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Enter wasted quantity"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Reason for Disposal
                </label>
                <Input
                  value={wasteReason}
                  onChange={(e) => setWasteReason(e.target.value)}
                  placeholder="e.g. Dropped during movement, over-baked"
                />
              </div>

              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={() => setDisposeModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="destructive" disabled={disposeMutation.isPending}>
                  {disposeMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Record Waste
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* History Modal */}
      <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Dispatch Logs & History
            </DialogTitle>
          </DialogHeader>

          {selectedBatch && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-muted/60 rounded-lg text-xs space-y-1">
                <p className="font-semibold">Batch: {selectedBatch.batchNumber}</p>
                <p className="text-muted-foreground">
                  Staged Qty: {selectedBatch.stagedQuantity} | Dispatched: {selectedBatch.dispatchedQuantity}
                </p>
              </div>

              {!selectedBatch.dispatches || selectedBatch.dispatches.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  No dispatches recorded yet for this batch.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedBatch.dispatches.map((log: any) => (
                    <div
                      key={log.id}
                      className="p-3 border border-border rounded-lg text-xs flex items-center justify-between"
                    >
                      <div>
                        <p className="font-semibold text-foreground flex items-center gap-1">
                          <ArrowRight className="h-3 w-3 text-primary" />
                          {log.quantity} units moved to {log.toLocation?.name || locationsList.find((l: any) => l.id === log.toLocationId)?.name || 'Front Office / POS'}
                        </p>
                        {log.notes && <p className="text-muted-foreground mt-0.5">{log.notes}</p>}
                      </div>
                      <div className="text-right text-[10px] text-muted-foreground">
                        <p className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(log.dispatchedAt), 'MMM d, HH:mm')}
                        </p>
                        {log.dispatchedBy?.user?.name && (
                          <p className="mt-0.5">By {log.dispatchedBy.user.name}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setHistoryModalOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
