'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@repo/ui/components/ui/dialog";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import { ScrollArea } from "@repo/ui/components/ui/scroll-area";
import {
  Truck,
  Plus,
  MapPin,
  Package,
  CheckCircle2,
  Clock,
  ClipboardCheck
} from 'lucide-react';
import { getTransactionById, createFulfillment, updateFulfillmentStatus, reconcileFulfillment } from '../../app/actions/sales';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from "@repo/ui/lib/utils";

interface ManageDeliveryModalProps {
  transaction: any;
  isOpen: boolean;
  onClose: () => void;
}

export function ManageDeliveryModal({ transaction: initialTransaction, isOpen, onClose }: ManageDeliveryModalProps) {
  const [transaction, setTransaction] = useState<any>(initialTransaction);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (initialTransaction && isOpen) {
      fetchTransaction();
    }
  }, [initialTransaction, isOpen]);

  const fetchTransaction = async () => {
    if (!initialTransaction) return;
    setIsLoading(true);
    try {
      const data = await getTransactionById(initialTransaction.id);
      setTransaction(data);
    } catch (error) {
      toast.error("Failed to refresh transaction details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFulfillment = async () => {
    if (!transaction) return;
    setIsCreating(true);
    try {
      // Simplification: Ship all remaining items
      const items = transaction.items.map((item: any) => ({
        transactionItemId: item.id,
        quantity: item.quantity,
      }));

      await createFulfillment({
        transactionId: transaction.id,
        type: 'DELIVERY' as any,
        items,
        pickupLocationId: transaction.locationId,
      });
      toast.success("Fulfillment created successfully");
      fetchTransaction();
    } catch (error) {
      toast.error("Failed to create fulfillment");
    } finally {
      setIsCreating(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: any) => {
    try {
      await updateFulfillmentStatus(id, status);
      toast.success(`Fulfillment marked as ${status}`);
      fetchTransaction();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleReconcile = async (id: string) => {
    try {
      await reconcileFulfillment(id, { notes: 'Reconciled from management modal' });
      toast.success("Delivery reconciled");
      fetchTransaction();
    } catch (error) {
      toast.error("Failed to reconcile delivery");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-zinc-50">
        <DialogHeader className="p-6 bg-white border-b border-zinc-200">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-zinc-100 rounded-lg">
              <Truck className="w-5 h-5 text-zinc-600" />
            </div>
            <div>
              <DialogTitle className="text-lg">Manage Deliveries</DialogTitle>
              <p className="text-xs text-zinc-500 font-mono">{transaction?.number}</p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-6 space-y-6">
            {isLoading && !transaction ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-zinc-900 border-t-transparent" />
              </div>
            ) : (
              <>
                {/* Existing Fulfillments */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    <Package className="w-3.5 h-3.5" />
                    Delivery Registry ({transaction?.fulfillments?.length || 0})
                  </h3>

                  {transaction?.fulfillments?.length > 0 ? (
                    transaction.fulfillments.map((f: any) => (
                      <div key={f.id} className="bg-white border border-zinc-200 rounded-xl p-4 space-y-4 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "p-2 rounded-lg",
                              f.status === 'DELIVERED' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                            )}>
                              <Truck className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-zinc-900">{f.type}</p>
                              <p className="text-[10px] text-zinc-400 font-mono">{f.id.slice(-8).toUpperCase()}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className={cn(
                            "text-[10px] uppercase",
                            f.status === 'DELIVERED' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            f.status === 'SHIPPED' ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-zinc-50"
                          )}>
                            {f.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-[11px]">
                          <div className="flex items-center gap-2 text-zinc-500">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Created {format(new Date(f.createdAt), 'MMM d, HH:mm')}</span>
                          </div>
                          <div className="flex items-center gap-2 text-zinc-500">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{transaction.location?.name}</span>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-zinc-50">
                          {f.status === 'PENDING' && (
                            <Button size="sm" variant="outline" className="h-8 text-[11px] flex-1" onClick={() => handleStatusUpdate(f.id, 'SHIPPED')}>
                              Mark as Shipped
                            </Button>
                          )}
                          {f.status === 'SHIPPED' && (
                            <Button size="sm" variant="outline" className="h-8 text-[11px] flex-1" onClick={() => handleStatusUpdate(f.id, 'DELIVERED')}>
                              Mark as Delivered
                            </Button>
                          )}
                          {!f.isReconciled && (f.status === 'DELIVERED' || f.status === 'COMPLETED') && (
                            <Button size="sm" variant="outline" className="h-8 text-[11px] flex-1 gap-1.5" onClick={() => handleReconcile(f.id)}>
                              <ClipboardCheck className="w-3.5 h-3.5" /> Reconcile
                            </Button>
                          )}
                          {f.isReconciled && (
                            <Badge variant="outline" className="h-8 flex-1 justify-center bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Reconciled
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white border border-dashed border-zinc-200 rounded-xl p-8 text-center">
                      <p className="text-zinc-400 text-xs font-medium">No delivery records found for this transaction.</p>
                    </div>
                  )}
                </div>

                {(!transaction?.fulfillments || transaction.fulfillments.length === 0) && (
                   <Button
                    className="w-full gap-2 bg-zinc-900 text-white hover:bg-zinc-800"
                    onClick={handleCreateFulfillment}
                    disabled={isCreating}
                   >
                    <Plus className="w-4 h-4" />
                    {isCreating ? 'Creating...' : 'Initialize New Delivery'}
                   </Button>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 bg-white border-t border-zinc-200">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
