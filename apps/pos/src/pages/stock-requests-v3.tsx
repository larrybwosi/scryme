'use client';

import { useState } from 'react';
import { Button } from '@repo/ui/components/ui/button';
import { Label } from '@repo/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/ui/select';
import { Badge } from '@repo/ui/components/ui/badge';
import { ScrollArea } from '@repo/ui/components/ui/scroll-area';
import { Input } from '@repo/ui/components/ui/input';
import {
  Package,
  Trash2,
  Send,
  Building2,
  Loader2,
  Search,
  PackageSearch,
  ArrowDownToLine,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';
import { useAuthStore } from '@/store/pos-auth-store';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'sonner';
import { usePosLocations } from '@/hooks/locations';
import { PosProduct, usePosProducts } from '@/hooks/products';

interface RequestItem {
  id: string;
  variantId: string;
  productName: string;
  variantName: string;
  quantity: number;
  stock: number;
}

export default function StockRequestV3() {
  const { currentLocation } = useAuthStore();
  const { locations } = usePosLocations();
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState<RequestItem[]>([]);
  const [fromLocationId, setFromLocationId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { products: searchResults, isLoading: isLoadingProducts } = usePosProducts({
    search: searchTerm,
    category: 'all',
    enabled: searchTerm.length >= 2,
  });

  const addItem = (product: PosProduct, variantId: string) => {
    const variant = product.variants.find(v => v.variantId === variantId);
    if (!variant) return;

    if (items.find(i => i.variantId === variantId)) {
        toast.error("Item already in list");
        return;
    }

    setItems([...items, {
        id: Math.random().toString(36).substring(7),
        variantId,
        productName: product.productName,
        variantName: variant.variantName,
        quantity: 1,
        stock: variant.stock
    }]);
    setSearchTerm('');
  };

  const updateQty = (id: string, qty: number) => {
    setItems(items.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const handleSubmit = async () => {
    if (!fromLocationId || items.length === 0) return;
    setIsSubmitting(true);
    try {
        await invoke('submit_stock_request', {
            payload: {
                toLocationId: fromLocationId, // Source for request
                items: items.map(i => ({ variantId: i.variantId, quantity: i.quantity })),
                notes: "V3 Stock Request"
            }
        });
        toast.success("Request submitted");
        setItems([]);
        setFromLocationId('');
    } catch (e: any) {
        toast.error(e.message || "Failed to submit request");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold">New Stock Request (V3)</h1>
            <p className="text-muted-foreground">Request inventory from other locations</p>
        </div>
        <Button onClick={handleSubmit} disabled={isSubmitting || items.length === 0 || !fromLocationId}>
            {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <ArrowDownToLine className="mr-2" />}
            Submit Request
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
            <div className="p-4 bg-card border rounded-lg space-y-4">
                <Label>Search Products</Label>
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or barcode..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                {searchResults.length > 0 && (
                    <ScrollArea className="h-64 border rounded-md">
                        {searchResults.map(p => (
                            <div key={p.productId} className="p-2 border-b">
                                <p className="font-medium">{p.productName}</p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {p.variants.map(v => (
                                        <Button key={v.variantId} size="sm" variant="outline" onClick={() => addItem(p, v.variantId)}>
                                            {v.variantName} ({v.stock})
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </ScrollArea>
                )}
            </div>

            <div className="p-4 bg-card border rounded-lg">
                <Label>Requested Items</Label>
                <ScrollArea className="h-96 mt-4">
                    {items.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg mb-2">
                            <div>
                                <p className="font-medium">{item.productName}</p>
                                <p className="text-xs text-muted-foreground">{item.variantName}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <Input
                                    type="number"
                                    className="w-20"
                                    value={item.quantity}
                                    onChange={e => updateQty(item.id, parseInt(e.target.value))}
                                />
                                <Button size="icon" variant="ghost" onClick={() => removeItem(item.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    {items.length === 0 && (
                        <div className="flex flex-col items-center py-20 text-muted-foreground">
                            <PackageSearch className="h-12 w-12 mb-2 opacity-20" />
                            <p>No items added yet</p>
                        </div>
                    )}
                </ScrollArea>
            </div>
        </div>

        <div className="space-y-6">
            <div className="p-4 bg-card border rounded-lg space-y-4">
                <Label>Source Branch</Label>
                <Select value={fromLocationId} onValueChange={setFromLocationId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select source branch" />
                    </SelectTrigger>
                    <SelectContent>
                        {locations.filter(l => l.id !== currentLocation?.id).map(l => (
                            <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="p-4 bg-card border rounded-lg space-y-2">
                <h3 className="font-semibold">Summary</h3>
                <div className="flex justify-between text-sm">
                    <span>Total SKUs</span>
                    <span>{items.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span>Total Units</span>
                    <span>{items.reduce((acc, i) => acc + i.quantity, 0)}</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
