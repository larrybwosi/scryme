'use client';

import { useState, useEffect, useCallback } from 'react';
import { Check, RefreshCw, Package, ArrowRight, FileText, X as XIcon, Truck, Calendar, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/pos-auth-store';
import { FileReceiveDialog } from '@/components/file-receive';
import posthog from 'posthog-js';

// --- Interfaces matching Rust Data Structures ---

interface IncomingVariant {
  id: string;
  name: string;
  sku: string;
  displayName: string;
}

interface IncomingItem {
  id: string;
  quantity: string; // Updated to match Rust struct
  variant: IncomingVariant;
  unitCost?: number; // Check if this is also a string in Rust (it appears to be Option<String>)
}

interface IncomingShipment {
  id: string;
  type: 'PURCHASE_ORDER' | 'STOCK_TRANSFER';
  referenceNumber: string;
  source: string;
  date: string;
  status: string;
  itemCount: number;
  items: IncomingItem[];
  receiveApiUrl: string;
}

interface IncomingResponse {
  data: IncomingShipment[];
}

// Payload Interfaces
interface DeliveryItem {
  variantId: string;
  quantity: number;
  receivedQuantity?: number;
  unitCost?: number;
  purchaseItemId?: string;
  acceptedQuantity?: number;
  rejectedQuantity?: number;
  rejectionReason?: string;
  batchNumber?: string;
  expiryDate?: string;
  notes?: string;
}

// Local State for Form Inputs
interface ItemInputState {
  receivedQty: string;
  rejectedQty: string;
  rejectionReason: string;
  notes: string;
  batchNumber: string;
  expiryDate: Date | undefined;
}

export default function StockAcceptancePage() {
  const { currentLocation } = useAuthStore();
  const locationId = currentLocation?.id;

  const [shipments, setShipments] = useState<IncomingShipment[]>([]);
  const [loading, setLoading] = useState(false);

  // Selection & View State
  const [selectedShipment, setSelectedShipment] = useState<IncomingShipment | null>(null);
  const [view, setView] = useState<'list' | 'receive'>('list');

  // Form State
  const [itemInputs, setItemInputs] = useState<Record<string, ItemInputState>>({});
  const [globalNotes, setGlobalNotes] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchShipments = useCallback(async () => {
    if (!locationId) return;
    setLoading(true);
    try {
      const response = await invoke<IncomingResponse>('fetch_incoming_shipments', {
        locationId,
      });
      setShipments(response.data);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load incoming shipments');
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  // Initialize data
  useEffect(() => {
    if (locationId) {
      fetchShipments();
    }
  }, [locationId, fetchShipments]);

  // Reset form when selecting shipment
  useEffect(() => {
    if (selectedShipment) {
      const initialInputs: Record<string, ItemInputState> = {};
      selectedShipment.items.forEach(item => {
        initialInputs[item.id] = {
          receivedQty: item.quantity.toString(), // Default to expected
          rejectedQty: '0',
          rejectionReason: '',
          notes: '',
          batchNumber: '',
          expiryDate: undefined,
        };
      });
      setItemInputs(initialInputs);
      setGlobalNotes('');
      setAttachedFiles([]);
    }
  }, [selectedShipment]);


  const handleOpenReceive = (shipment: IncomingShipment) => {
    setSelectedShipment(shipment);
    setView('receive');
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedShipment(null);
  };

  const handleInputChange = (itemId: string, field: keyof ItemInputState, value: string | Date | undefined) => {
    setItemInputs(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
  };

  const handleFileReceived = (path: string) => {
    if (!attachedFiles.includes(path)) {
      setAttachedFiles(prev => [...prev, path]);
      toast.success('Document attached');
    }
  };

  const removeFile = (path: string) => {
    setAttachedFiles(prev => prev.filter(p => p !== path));
  };

  const calculateStats = (itemId: string) => {
    const input = itemInputs[itemId];
    if (!input) return { accepted: 0, valid: true };

    const total = parseFloat(input.receivedQty || '0');
    const rejected = parseFloat(input.rejectedQty || '0');
    const accepted = total - rejected;

    return {
      accepted: accepted >= 0 ? accepted : 0,
      valid: accepted >= 0,
    };
  };

  const handleSubmitReceipt = async () => {
    if (!selectedShipment || !locationId) return;

    // Validate inputs
    for (const item of selectedShipment.items) {
      const stats = calculateStats(item.id);
      if (!stats.valid) {
        toast.error(`Invalid quantities for ${item.variant.sku}`);
        return;
      }
      const input = itemInputs[item.id];
      if (parseFloat(input.rejectedQty) > 0 && !input.rejectionReason) {
        toast.error(`Rejection reason required for ${item.variant.sku}`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Map inputs to DeliveryItem payload
      const itemsPayload: DeliveryItem[] = selectedShipment.items
        .map(item => {
          const input = itemInputs[item.id];
          const received = parseFloat(input.receivedQty || '0');
          const rejected = parseFloat(input.rejectedQty || '0');
          const accepted = received - rejected;

          return {
            variantId: item.variant.id,
            quantity: typeof item.quantity === 'string' ? parseInt(item.quantity, 10) : item.quantity,
            receivedQuantity: received,
            unitCost: typeof item.unitCost === 'string' ? parseFloat(item.unitCost) : item.unitCost,
            purchaseItemId: selectedShipment.type === 'PURCHASE_ORDER' ? item.id : undefined,
            acceptedQuantity: accepted,
            rejectedQuantity: rejected > 0 ? rejected : undefined,
            rejectionReason: rejected > 0 ? input.rejectionReason : undefined,
            batchNumber: input.batchNumber || undefined,
            expiryDate: input.expiryDate ? format(input.expiryDate, 'yyyy-MM-dd') : undefined,
            notes: input.notes || undefined,
          };
        })
        .filter(i => (i.receivedQuantity ?? 0) > 0); // Filter based on received, not just expected

      if (itemsPayload.length === 0) {
        toast.error('No items marked as received');
        setIsSubmitting(false);
        return;
      }

      const commonPayload = {
        locationId,
        items: itemsPayload,
        notes: globalNotes || undefined,
      };

      if (selectedShipment.type === 'PURCHASE_ORDER') {
        await invoke('receive_purchase_order', {
          purchaseId: selectedShipment.id,
          payload: commonPayload,
          filePaths: attachedFiles.length > 0 ? attachedFiles : undefined,
        });
      } else {
        await invoke('receive_stock_transfer', {
          transferId: selectedShipment.id,
          payload: commonPayload,
          filePaths: attachedFiles.length > 0 ? attachedFiles : undefined,
        });
      }

      posthog.capture('stock_delivery_accepted', {
        shipment_id: selectedShipment.id,
        shipment_type: selectedShipment.type,
        items_count: itemsPayload.length,
        reference_number: selectedShipment.referenceNumber,
      });
      toast.success('Shipment received successfully');
      handleBackToList();
      fetchShipments(); // Refresh list
    } catch (error: any) {
      console.error('Receipt error:', error);
      toast.error('Failed to submit receipt', { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (view === 'receive' && selectedShipment) {
    return (
      <div className="p-6 space-y-6 max-w-full mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBackToList}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Receive Shipment: {selectedShipment.referenceNumber}</h1>
              <p className="text-muted-foreground mt-1">
                From {selectedShipment.source} • {new Date(selectedShipment.date).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
             <Button variant="outline" onClick={handleBackToList} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReceipt}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Confirm Receipt
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Items ({selectedShipment.items.length})</h3>
            <div className="grid gap-4">
              {selectedShipment.items.map(item => {
                const input = itemInputs[item.id] || {};
                const { accepted, valid } = calculateStats(item.id);

                return (
                  <Card key={item.id} className="p-4 border-l-4 border-l-primary/20">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      {/* Item Info */}
                      <div className="md:col-span-4 space-y-1">
                        <div className="font-medium">{item.variant.displayName}</div>
                        <div className="text-xs text-muted-foreground font-mono">{item.variant.sku}</div>
                        <Badge variant="outline" className="mt-1">
                          Expected: {item.quantity}
                        </Badge>
                      </div>

                      {/* Inputs */}
                      <div className="md:col-span-8 space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Received Qty</Label>
                            <Input
                              type="number"
                              min="0"
                              value={input.receivedQty}
                              onChange={e => handleInputChange(item.id, 'receivedQty', e.target.value)}
                              className="h-8"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Rejected Qty</Label>
                            <Input
                              type="number"
                              min="0"
                              value={input.rejectedQty}
                              onChange={e => handleInputChange(item.id, 'rejectedQty', e.target.value)}
                              className={`h-8 ${parseFloat(input.rejectedQty) > 0 ? 'border-red-300 bg-red-50' : ''}`}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-green-600">Accepted</Label>
                            <div
                              className={`h-8 px-3 flex items-center border rounded-md bg-muted ${!valid ? 'text-red-500 font-bold' : ''}`}
                            >
                              {valid ? accepted : 'Error'}
                            </div>
                          </div>
                        </div>

                        {/* Optional Details */}
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            placeholder="Batch Number (Optional)"
                            className="h-8 text-xs"
                            value={input.batchNumber}
                            onChange={e => handleInputChange(item.id, 'batchNumber', e.target.value)}
                          />
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  'h-8 justify-start text-left font-normal',
                                  !input.expiryDate && 'text-muted-foreground'
                                )}
                              >
                                <Calendar className="mr-2 h-3 w-3" />
                                {input.expiryDate ? format(input.expiryDate, 'PPP') : <span>Expiry Date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={input.expiryDate}
                                onSelect={date => handleInputChange(item.id, 'expiryDate', date)}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        {/* Rejection Reason - Conditional */}
                        {parseFloat(input.rejectedQty) > 0 && (
                          <Input
                            placeholder="Reason for rejection (Required)"
                            className="h-8 text-xs border-red-200"
                            value={input.rejectionReason}
                            onChange={e => handleInputChange(item.id, 'rejectionReason', e.target.value)}
                          />
                        )}

                        <Input
                          placeholder="Notes for this item..."
                          className="h-8 text-xs"
                          value={input.notes}
                          onChange={e => handleInputChange(item.id, 'notes', e.target.value)}
                        />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
            <Card>
               <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wider">Receipt Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Files */}
                <div className="space-y-3">
                  <Label className="flex justify-between">
                    <span>Documents (Invoice, Delivery Note)</span>
                    <span className="text-xs text-muted-foreground">{attachedFiles.length} attached</span>
                  </Label>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {attachedFiles.map((file, i) => (
                      <div key={i} className="flex justify-between items-center bg-muted p-2 rounded text-xs">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{file.split(/[\\/]/).pop()}</span>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5 flex-shrink-0"
                          onClick={() => removeFile(file)}
                        >
                          <XIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <FileReceiveDialog onFileReceived={handleFileReceived} />
                </div>

                {/* Global Notes */}
                <div className="space-y-3">
                  <Label>Receipt Notes</Label>
                  <Textarea
                    placeholder="General notes about this delivery..."
                    value={globalNotes}
                    onChange={e => setGlobalNotes(e.target.value)}
                    className="resize-none h-32"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-full mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Incoming Shipments</h1>
          <p className="text-muted-foreground mt-1">Receive Purchase Orders and Stock Transfers</p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchShipments} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" /> Expected Deliveries
          </CardTitle>
          <CardDescription>Select a shipment to verify contents and record receipt.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shipments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                    No incoming shipments found for this location.
                  </TableCell>
                </TableRow>
              ) : (
                shipments.map(shipment => (
                  <TableRow key={shipment.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(shipment.date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono">{shipment.referenceNumber}</span>
                    </TableCell>
                    <TableCell>{shipment.source}</TableCell>
                    <TableCell>
                      <Badge variant={shipment.type === 'PURCHASE_ORDER' ? 'default' : 'secondary'}>
                        {shipment.type === 'PURCHASE_ORDER' ? 'Purchase Order' : 'Transfer'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span>{shipment.itemCount}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => handleOpenReceive(shipment)}>
                        Receive
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
