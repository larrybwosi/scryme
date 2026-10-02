// fallow-ignore-next-line unused-files
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/ui/card';
import { Button } from '@repo/ui/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/ui/table';
import { Badge } from '@repo/ui/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@repo/ui/components/ui/dialog';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/ui/select';
import { Truck, MapPin, Loader2, CheckCircle2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import sdk from '@/lib/sdk';
import { Skeleton } from '@repo/ui/components/ui/skeleton';
import { toast } from 'sonner';

export function DeliveryTracker() {
  const queryClient = useQueryClient();
  const [reconcilingDelivery, setReconcilingDelivery] = useState<any>(null);

  const [status, setStatus] = useState('DELIVERED');
  const [recipientName, setRecipientName] = useState('');
  const [notes, setNotes] = useState('');

  const { data: deliveries, isLoading } = useQuery({
    queryKey: ['active-deliveries'],
    queryFn: () => sdk.client.get('/deliveries/active'),
  });

  const reconcileMutation = useMutation({
    mutationFn: (data: any) => sdk.client.post('/deliveries/reconcile', data),
    onSuccess: () => {
      toast.success('Delivery reconciled successfully');
      queryClient.invalidateQueries({ queryKey: ['active-deliveries'] });
      setReconcilingDelivery(null);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to reconcile delivery');
    },
  });

  const resetForm = () => {
    setStatus('DELIVERED');
    setRecipientName('');
    setNotes('');
  };

  const handleOpenReconcile = (delivery: any) => {
    resetForm();
    setReconcilingDelivery(delivery);
  };

  const handleReconcileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reconcilingDelivery) return;

    reconcileMutation.mutate({
      fulfillmentId: reconcilingDelivery.id,
      status,
      notes,
      pod: recipientName
        ? {
            recipientName,
          }
        : undefined,
    });
  };

  if (isLoading) return <Skeleton className="h-[400px] w-full" />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Truck className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Transit</p>
                <h3 className="text-2xl font-bold">{(deliveries as any[])?.length || 0}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Active Shipments</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Partner / Driver</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(deliveries as any[])?.map((delivery) => (
                <TableRow key={delivery.id}>
                  <TableCell className="font-mono font-bold">
                    #{delivery.transaction?.number || delivery.id.slice(-6)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {delivery.transaction?.deliveryPartner?.name || 'In-house'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {delivery.driver?.name || 'Unassigned Driver'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      {delivery.transaction?.customer?.name || 'Guest'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge>{delivery.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={() => handleOpenReconcile(delivery)}
                    >
                      Reconcile
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!deliveries || (deliveries as any[]).length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No active deliveries at the moment.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Reconcile Delivery Dialog */}
      <Dialog
        open={!!reconcilingDelivery}
        onOpenChange={(open) => !open && setReconcilingDelivery(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reconcile Delivery Shipment</DialogTitle>
            <DialogDescription>
              Submit final delivery status and Proof of Delivery (POD) for Order #
              {reconcilingDelivery?.transaction?.number || reconcilingDelivery?.id.slice(-6)}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleReconcileSubmit} className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold">Delivery Outcome Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DELIVERED">Delivered (Success)</SelectItem>
                  <SelectItem value="FAILED">Delivery Failed</SelectItem>
                  <SelectItem value="RETURNED">Package Returned</SelectItem>
                  <SelectItem value="CANCELLED">Order Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-semibold">Recipient Name / Signature Reference</Label>
              <Input
                placeholder="Name of person who signed / accepted delivery"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Reconciliation Notes</Label>
              <Input
                placeholder="Optional delivery notes or incident report"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setReconcilingDelivery(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={reconcileMutation.isPending}>
                {reconcileMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Submit Reconciliation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
