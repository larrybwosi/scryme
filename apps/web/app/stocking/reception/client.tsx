"use client";

import React, { useState, useEffect } from "react";
import {
  PackageCheck,
  Truck,
  Layers,
  Search,
  Calendar,
  FileText,
  Building2,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  Plus,
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@repo/ui/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@repo/ui/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { Textarea } from "@repo/ui/components/ui/textarea";
import {
  fetchReceptionOverviewData,
  receivePurchaseStockWithBatches,
  receiveTransferStockWithBatches,
} from "./actions";

export default function StockReceptionClient() {
  const [activeTab, setActiveTab] = useState("purchases");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [data, setData] = useState<{
    pendingPurchases: any[];
    pendingTransfers: any[];
    batchList: any[];
    locations: any[];
  }>({
    pendingPurchases: [],
    pendingTransfers: [],
    batchList: [],
    locations: [],
  });

  // Modal State for PO Reception
  const [selectedPO, setSelectedPO] = useState<any | null>(null);
  const [poForm, setPoForm] = useState<{
    locationId: string;
    documentRef: string;
    notes: string;
    items: {
      purchaseItemId: string;
      productName: string;
      variantName: string;
      pendingQuantity: number;
      quantity: number;
      batchNumber: string;
      supplierBatchNumber: string;
      expiryDate: string;
      unitCost: number;
    }[];
  }>({
    locationId: "",
    documentRef: "",
    notes: "",
    items: [],
  });

  // Modal State for Transfer Reception
  const [selectedTransfer, setSelectedTransfer] = useState<any | null>(null);
  const [transferForm, setTransferForm] = useState<{
    documentRef: string;
    notes: string;
    items: {
      transferItemId: string;
      productName: string;
      variantName: string;
      pendingQuantity: number;
      quantity: number;
      batchNumber: string;
      supplierBatchNumber: string;
      expiryDate: string;
    }[];
  }>({
    documentRef: "",
    notes: "",
    items: [],
  });

  const loadData = async (query = search) => {
    setLoading(true);
    try {
      const res = await fetchReceptionOverviewData(query);
      setData(res);
    } catch (err) {
      console.error("Failed to load reception data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenPoModal = (po: any) => {
    setSelectedPO(po);
    const defaultLocation = data.locations[0]?.id || "";
    setPoForm({
      locationId: defaultLocation,
      documentRef: "",
      notes: "",
      items: po.items.map((item: any) => ({
        purchaseItemId: item.id,
        productName: item.productName,
        variantName: item.variantName,
        pendingQuantity: item.pendingQuantity,
        quantity: item.pendingQuantity,
        batchNumber: `BATCH-${Date.now().toString().slice(-6)}`,
        supplierBatchNumber: "",
        expiryDate: "",
        unitCost: item.unitCost,
      })),
    });
  };

  const handleOpenTransferModal = (transfer: any) => {
    setSelectedTransfer(transfer);
    setTransferForm({
      documentRef: "",
      notes: "",
      items: transfer.items.map((item: any) => ({
        transferItemId: item.id,
        productName: item.productName,
        variantName: item.variantName,
        pendingQuantity: item.pendingQuantity,
        quantity: item.pendingQuantity,
        batchNumber: `XFER-${transfer.transferNumber.slice(-4)}-${Date.now().toString().slice(-4)}`,
        supplierBatchNumber: "",
        expiryDate: "",
      })),
    });
  };

  const handleSubmitPoReception = async () => {
    if (!selectedPO) return;
    setSubmitting(true);
    try {
      await receivePurchaseStockWithBatches({
        purchaseId: selectedPO.id,
        locationId: poForm.locationId,
        documentRef: poForm.documentRef,
        notes: poForm.notes,
        items: poForm.items
          .filter(i => i.quantity > 0)
          .map(i => ({
            purchaseItemId: i.purchaseItemId,
            quantity: Number(i.quantity),
            batchNumber: i.batchNumber,
            supplierBatchNumber: i.supplierBatchNumber,
            expiryDate: i.expiryDate ? new Date(i.expiryDate) : undefined,
            unitCost: Number(i.unitCost),
          })),
      });
      setSelectedPO(null);
      await loadData();
    } catch (err: any) {
      alert("Failed to process stock reception: " + (err?.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitTransferReception = async () => {
    if (!selectedTransfer) return;
    setSubmitting(true);
    try {
      await receiveTransferStockWithBatches({
        transferId: selectedTransfer.id,
        documentRef: transferForm.documentRef,
        notes: transferForm.notes,
        items: transferForm.items
          .filter(i => i.quantity > 0)
          .map(i => ({
            transferItemId: i.transferItemId,
            quantity: Number(i.quantity),
            batchNumber: i.batchNumber,
            supplierBatchNumber: i.supplierBatchNumber,
            expiryDate: i.expiryDate ? new Date(i.expiryDate) : undefined,
          })),
      });
      setSelectedTransfer(null);
      await loadData();
    } catch (err: any) {
      alert("Failed to receive transfer stock: " + (err?.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <PackageCheck className="h-8 w-8 text-primary" />
            Stock Reception & Traceability
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Receive supplier shipments from POs and internal transfers. Record batch numbers, expiry dates, and delivery documents for full production genealogy.
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending PO Deliveries</CardTitle>
            <PackageCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.pendingPurchases.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready for warehouse receiving</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In-Transit Transfers</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.pendingTransfers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Inter-location transfers pending receipt</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Stock Batches</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.batchList.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Tracked with batch & expiry metadata</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="purchases" className="flex items-center gap-2">
            <PackageCheck className="h-4 w-4" />
            Supplier POs ({data.pendingPurchases.length})
          </TabsTrigger>
          <TabsTrigger value="transfers" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Transfers ({data.pendingTransfers.length})
          </TabsTrigger>
          <TabsTrigger value="batches" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Batch Traceability
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Pending Purchase Orders */}
        <TabsContent value="purchases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Purchase Deliveries</CardTitle>
              <CardDescription>
                Select a purchase order to receive stock into inventory and register batch details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-8 text-center text-muted-foreground">Loading pending purchases...</div>
              ) : data.pendingPurchases.length === 0 ? (
                <div className="py-12 text-center border rounded-lg bg-muted/20">
                  <PackageCheck className="mx-auto h-12 w-12 text-muted-foreground/60" />
                  <h3 className="mt-2 text-sm font-semibold text-foreground">No pending PO deliveries</h3>
                  <p className="text-xs text-muted-foreground mt-1">All purchase order shipments have been received.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.pendingPurchases.map((po: any) => (
                    <div
                      key={po.id}
                      className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base text-foreground">{po.purchaseNumber}</span>
                          <Badge variant={po.status === "PARTIALLY_RECEIVED" ? "outline" : "default"}>
                            {po.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5" />
                            {po.supplierName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            Order Date: {new Date(po.orderDate).toLocaleDateString()}
                          </span>
                          <span>Items: {po.items.length}</span>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground flex flex-wrap gap-2">
                          {po.items.map((i: any) => (
                            <span key={i.id} className="bg-muted px-2 py-0.5 rounded">
                              {i.productName} ({i.pendingQuantity} pending)
                            </span>
                          ))}
                        </div>
                      </div>

                      <Button onClick={() => handleOpenPoModal(po)} className="flex items-center gap-2">
                        <PackageCheck className="h-4 w-4" />
                        Receive Shipment
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Pending Transfers */}
        <TabsContent value="transfers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>In-Transit Inter-Location Transfers</CardTitle>
              <CardDescription>
                Receive shipped stock transfers into destination inventory and assign stock batch tracking.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-8 text-center text-muted-foreground">Loading transfers...</div>
              ) : data.pendingTransfers.length === 0 ? (
                <div className="py-12 text-center border rounded-lg bg-muted/20">
                  <Truck className="mx-auto h-12 w-12 text-muted-foreground/60" />
                  <h3 className="mt-2 text-sm font-semibold text-foreground">No pending transfers</h3>
                  <p className="text-xs text-muted-foreground mt-1">There are no in-transit transfers awaiting reception.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.pendingTransfers.map((transfer: any) => (
                    <div
                      key={transfer.id}
                      className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base text-foreground">{transfer.transferNumber}</span>
                          <Badge variant="secondary">{transfer.status}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <span>{transfer.fromLocationName}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium text-foreground">{transfer.toLocationName}</span>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground flex flex-wrap gap-2">
                          {transfer.items.map((i: any) => (
                            <span key={i.id} className="bg-muted px-2 py-0.5 rounded">
                              {i.productName} ({i.pendingQuantity} pending)
                            </span>
                          ))}
                        </div>
                      </div>

                      <Button onClick={() => handleOpenTransferModal(transfer)} className="flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Receive Transfer Stock
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Batch Traceability */}
        <TabsContent value="batches" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Stock Batch & Genealogy Traceability</CardTitle>
                <CardDescription>
                  Audit supplier batch numbers, expiry dates, purchase orders, and current warehouse levels.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2 max-w-xs w-full">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search batch or supplier..."
                  value={search}
                  onChange={e => {
                    setSearch(e.target.value);
                    loadData(e.target.value);
                  }}
                  className="h-9"
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-8 text-center text-muted-foreground">Loading batch data...</div>
              ) : data.batchList.length === 0 ? (
                <div className="py-12 text-center border rounded-lg bg-muted/20">
                  <Layers className="mx-auto h-12 w-12 text-muted-foreground/60" />
                  <h3 className="mt-2 text-sm font-semibold text-foreground">No stock batches found</h3>
                  <p className="text-xs text-muted-foreground mt-1">Receive POs or transfers to populate batch traceability records.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border rounded-md">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground text-xs uppercase border-b">
                      <tr>
                        <th className="px-4 py-3 font-medium">Batch No / Supplier Batch</th>
                        <th className="px-4 py-3 font-medium">Product / Variant</th>
                        <th className="px-4 py-3 font-medium">Supplier</th>
                        <th className="px-4 py-3 font-medium">PO Ref</th>
                        <th className="px-4 py-3 font-medium">Location</th>
                        <th className="px-4 py-3 font-medium">Current Stock</th>
                        <th className="px-4 py-3 font-medium">Expiry Date</th>
                        <th className="px-4 py-3 font-medium">Received Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.batchList.map((batch: any) => (
                        <tr key={batch.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 font-medium text-foreground">
                            <div>{batch.batchNumber || "N/A"}</div>
                            {batch.supplierBatchNumber && (
                              <div className="text-xs text-muted-foreground">
                                Supplier: {batch.supplierBatchNumber}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-foreground">{batch.productName}</div>
                            <div className="text-xs text-muted-foreground">{batch.variantName} ({batch.sku})</div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{batch.supplierName}</td>
                          <td className="px-4 py-3 font-mono text-xs text-primary">{batch.purchaseNumber}</td>
                          <td className="px-4 py-3 text-muted-foreground">{batch.locationName}</td>
                          <td className="px-4 py-3 font-bold text-foreground">
                            {batch.currentQuantity} / {batch.initialQuantity}
                          </td>
                          <td className="px-4 py-3">
                            {batch.expiryDate ? (
                              <span className="text-xs font-medium px-2 py-0.5 rounded bg-muted">
                                {new Date(batch.expiryDate).toLocaleDateString()}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">N/A</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {new Date(batch.receivedDate).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* PO Reception Modal */}
      <Dialog open={!!selectedPO} onOpenChange={open => !open && setSelectedPO(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackageCheck className="h-5 w-5 text-primary" />
              Receive Purchase Delivery - {selectedPO?.purchaseNumber}
            </DialogTitle>
            <DialogDescription>
              Record received quantities, supplier batch numbers, and expiry dates for supplier {selectedPO?.supplierName}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Destination Location</Label>
                <Select
                  value={poForm.locationId}
                  onValueChange={val => setPoForm(prev => ({ ...prev, locationId: val }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.locations.map((loc: any) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Delivery Note / Invoice Ref</Label>
                <Input
                  className="mt-1"
                  placeholder="e.g. DN-2025-0994"
                  value={poForm.documentRef}
                  onChange={e => setPoForm(prev => ({ ...prev, documentRef: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Delivery Notes / Receiving Remarks</Label>
              <Textarea
                className="mt-1 h-20"
                placeholder="Notes on packaging condition, temperature check, or delivery time..."
                value={poForm.notes}
                onChange={e => setPoForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <div className="border rounded-md p-4 space-y-4 bg-muted/10">
              <h4 className="text-sm font-semibold text-foreground border-b pb-2">Delivery Line Items</h4>
              {poForm.items.map((item, idx) => (
                <div key={item.purchaseItemId} className="p-3 border rounded-md bg-card space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-sm text-foreground">{item.productName}</span>
                      <span className="text-xs text-muted-foreground ml-2">({item.variantName})</span>
                    </div>
                    <Badge variant="outline">Pending: {item.pendingQuantity}</Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <Label className="text-xs">Receive Qty</Label>
                      <Input
                        type="number"
                        className="mt-1"
                        min={0}
                        max={item.pendingQuantity}
                        value={item.quantity}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setPoForm(prev => {
                            const newItems = [...prev.items];
                            newItems[idx].quantity = val;
                            return { ...prev, items: newItems };
                          });
                        }}
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Internal Batch No</Label>
                      <Input
                        className="mt-1"
                        value={item.batchNumber}
                        onChange={e => {
                          const val = e.target.value;
                          setPoForm(prev => {
                            const newItems = [...prev.items];
                            newItems[idx].batchNumber = val;
                            return { ...prev, items: newItems };
                          });
                        }}
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Supplier Batch No</Label>
                      <Input
                        className="mt-1"
                        placeholder="Supplier lot #"
                        value={item.supplierBatchNumber}
                        onChange={e => {
                          const val = e.target.value;
                          setPoForm(prev => {
                            const newItems = [...prev.items];
                            newItems[idx].supplierBatchNumber = val;
                            return { ...prev, items: newItems };
                          });
                        }}
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Expiry Date</Label>
                      <Input
                        type="date"
                        className="mt-1"
                        value={item.expiryDate}
                        onChange={e => {
                          const val = e.target.value;
                          setPoForm(prev => {
                            const newItems = [...prev.items];
                            newItems[idx].expiryDate = val;
                            return { ...prev, items: newItems };
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPO(null)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitPoReception} disabled={submitting}>
              {submitting ? "Processing..." : "Confirm Stock Reception"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Reception Modal */}
      <Dialog open={!!selectedTransfer} onOpenChange={open => !open && setSelectedTransfer(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              Receive Stock Transfer - {selectedTransfer?.transferNumber}
            </DialogTitle>
            <DialogDescription>
              Verify received items transferred from {selectedTransfer?.fromLocationName} to {selectedTransfer?.toLocationName}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs">Delivery Document / Waybill Ref</Label>
              <Input
                className="mt-1"
                placeholder="Waybill reference or driver slip"
                value={transferForm.documentRef}
                onChange={e => setTransferForm(prev => ({ ...prev, documentRef: e.target.value }))}
              />
            </div>

            <div>
              <Label className="text-xs">Reception Remarks</Label>
              <Textarea
                className="mt-1 h-20"
                placeholder="Condition of received stock..."
                value={transferForm.notes}
                onChange={e => setTransferForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <div className="border rounded-md p-4 space-y-4 bg-muted/10">
              <h4 className="text-sm font-semibold text-foreground border-b pb-2">Transferred Items</h4>
              {transferForm.items.map((item, idx) => (
                <div key={item.transferItemId} className="p-3 border rounded-md bg-card space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-sm text-foreground">{item.productName}</span>
                      <span className="text-xs text-muted-foreground ml-2">({item.variantName})</span>
                    </div>
                    <Badge variant="outline">Pending: {item.pendingQuantity}</Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Received Qty</Label>
                      <Input
                        type="number"
                        className="mt-1"
                        min={0}
                        max={item.pendingQuantity}
                        value={item.quantity}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setTransferForm(prev => {
                            const newItems = [...prev.items];
                            newItems[idx].quantity = val;
                            return { ...prev, items: newItems };
                          });
                        }}
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Batch Number</Label>
                      <Input
                        className="mt-1"
                        value={item.batchNumber}
                        onChange={e => {
                          const val = e.target.value;
                          setTransferForm(prev => {
                            const newItems = [...prev.items];
                            newItems[idx].batchNumber = val;
                            return { ...prev, items: newItems };
                          });
                        }}
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Expiry Date</Label>
                      <Input
                        type="date"
                        className="mt-1"
                        value={item.expiryDate}
                        onChange={e => {
                          const val = e.target.value;
                          setTransferForm(prev => {
                            const newItems = [...prev.items];
                            newItems[idx].expiryDate = val;
                            return { ...prev, items: newItems };
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTransfer(null)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitTransferReception} disabled={submitting}>
              {submitting ? "Processing..." : "Confirm Transfer Receipt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
