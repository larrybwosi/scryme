import { useState, useEffect } from 'react';
import {
  Barcode,
  Search,
  Printer,
  Trash2,
  Plus,
  Settings2,
  Package,
  Layers,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { invoke } from '@tauri-apps/api/core';
import { BarcodeService } from '@/lib/barcode-service';
import { LabelService, type PrintLabelItem, type LabelPrintConfig, type LabelSize } from '@/lib/label-service';
import { usePosStore } from '@/store/store';

export default function BarcodePrintingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [previewBarcode, setPreviewBarcode] = useState<string | null>(null);
  const [printQueue, setPrintQueue] = useState<PrintLabelItem[]>([]);
  const [printers, setPrinters] = useState<string[]>([]);
  const [config, setConfig] = useState<LabelPrintConfig & { nameFontSize?: number; priceFontSize?: number }>({
    size: '50x30',
    showPrice: true,
    showSku: true,
    showName: true,
    barcodeType: 'code128',
    printerName: 'default',
    nameFontSize: 1,
    priceFontSize: 2
  });

  const currency = usePosStore(state => state.settings.receiptConfig.currency || 'USD');

  useEffect(() => {
    const loadPrinters = async () => {
      const list = await LabelService.getAvailablePrinters();
      setPrinters(list);
      if (list.length > 0 && config.printerName === 'default') {
        // Find a default label printer if exists
        const labelPrinter = list.find(p => p.toLowerCase().includes('label'));
        if (labelPrinter) {
          setConfig(prev => ({ ...prev, printerName: labelPrinter }));
        }
      }
    };

    loadPrinters();
  }, [config.printerName]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      // Query the backend for products
      const response = await invoke<any>('search_products_command', {
        query: searchQuery,
        limit: 20
      });
      setSearchResults(response.products || []);

      // Auto-preview first result
      if (response.products?.length > 0) {
        generatePreview(response.products[0]);
      }
    } catch (err) {
      toast.error('Search failed', { description: String(err) });
    } finally {
      setIsSearching(false);
    }
  };

  const generatePreview = async (product: any) => {
    try {
      const barcode = product.barcode || product.sku || product.productId;
      const dataUrl = await BarcodeService.generate(barcode, config.barcodeType as any, {
        height: 15,
        scale: 2
      });
      setPreviewBarcode(dataUrl);
    } catch (err) {
      setPreviewBarcode(null);
    }
  };

  const addToQueue = (product: any) => {
    const existing = printQueue.find(item => item.id === product.productId);
    if (existing) {
      setPrintQueue(prev => prev.map(item =>
        item.id === product.productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      const newItem: PrintLabelItem = {
        id: product.productId,
        name: product.productName,
        sku: product.sku,
        barcode: product.barcode || product.sku || product.productId,
        price: product.sellableUnits?.[0]?.price || 0,
        currency: currency,
        category: product.category,
        quantity: 1
      };
      setPrintQueue(prev => [...prev, newItem]);
    }
    toast.success('Added to queue', { description: product.productName });
  };

  const removeFromQueue = (id: string) => {
    setPrintQueue(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty < 1) return;
    setPrintQueue(prev => prev.map(item =>
      item.id === id ? { ...item, quantity: qty } : item
    ));
  };

  const handlePrint = async () => {
    if (printQueue.length === 0) {
      toast.error('Queue is empty');
      return;
    }

    const printPromise = LabelService.printLabels(printQueue, config);

    toast.promise(printPromise, {
      loading: 'Sending labels to printer...',
      success: 'Labels sent successfully',
      error: (err) => `Printing failed: ${err.message}`
    });

    try {
      await printPromise;
      // Optionally clear queue after success?
      // setPrintQueue([]);
    } catch (e) {
      // Error handled by toast.promise
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Barcode Printing Center</h1>
          <p className="text-muted-foreground">Search products and generate professional labels for your inventory.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setPrintQueue([])} disabled={printQueue.length === 0}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Queue
          </Button>
          <Button size="lg" onClick={handlePrint} disabled={printQueue.length === 0}>
            <Printer className="h-5 w-5 mr-2" />
            Print Labels ({printQueue.reduce((acc, i) => acc + i.quantity, 0)})
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Left Column: Search & Inventory */}
        <div className="lg:col-span-8 flex flex-col space-y-6 min-h-0">
          <Card className="flex flex-col min-h-0">
            <CardHeader className="pb-3">
              <CardTitle>Product Lookup</CardTitle>
              <CardDescription>Find products to add to your printing queue.</CardDescription>
              <div className="flex gap-2 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products by name or SKU..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <Button onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 overflow-hidden">
              <ScrollArea className="h-full pr-4">
                {searchResults.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {searchResults.map((product) => (
                      <div
                        key={product.productId}
                        onClick={() => generatePreview(product)}
                        className="group relative flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors shadow-sm cursor-pointer"
                      >
                        <div className="h-12 w-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                          <Package className="h-6 w-6 text-zinc-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold truncate">{product.productName}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <span>SKU: {product.sku || 'N/A'}</span>
                            <span className="h-1 w-1 rounded-full bg-zinc-300" />
                            <span>{currency} {product.sellableUnits?.[0]?.price || 0}</span>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={() => addToQueue(product)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="h-16 w-16 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                      <Barcode className="h-8 w-8 text-zinc-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">No products selected</h3>
                      <p className="text-muted-foreground max-w-xs mx-auto">
                        Search for products above to start building your print queue.
                      </p>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Queue & Settings */}
        <div className="lg:col-span-4 flex flex-col space-y-6 min-h-0">
          <Card className="flex flex-col min-h-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-blue-500" />
                  Print Queue ({printQueue.length})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 overflow-hidden">
              <ScrollArea className="h-full pr-4">
                {printQueue.length > 0 ? (
                  <div className="space-y-3">
                    {printQueue.map((item) => (
                      <div key={item.id} className="p-3 rounded-lg border bg-zinc-50 dark:bg-zinc-900/50 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{item.name}</div>
                            <div className="text-[10px] text-muted-foreground truncate">{item.barcode}</div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => removeFromQueue(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              -
                            </Button>
                            <Input
                              type="number"
                              className="h-7 w-12 text-center p-0"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              +
                            </Button>
                          </div>
                          <Badge variant="outline">Label(s)</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-muted-foreground text-sm">
                    Your queue is empty
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Barcode className="h-4 w-4" />
                Live Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-[2/1] w-full bg-white rounded-lg border flex flex-col items-center justify-center p-4">
                 {previewBarcode ? (
                   <>
                    <img src={previewBarcode} alt="Barcode Preview" className="max-w-full h-auto" />
                    <span className="text-[10px] text-zinc-500 mt-2 font-mono">Sample Rendering</span>
                   </>
                 ) : (
                   <div className="text-zinc-400 text-xs text-center">
                     <Barcode className="h-8 w-8 mx-auto mb-2 opacity-20" />
                     Select a product to preview
                   </div>
                 )}
              </div>
            </CardContent>
            <Separator />
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings2 className="h-4 w-4" />
                Print Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Target Printer</Label>
                <Select
                  value={config.printerName}
                  onValueChange={(v) => setConfig(prev => ({ ...prev, printerName: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select printer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">System Default (Label)</SelectItem>
                    {printers.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Label Size</Label>
                <Select
                  value={config.size}
                  onValueChange={(v: LabelSize) => setConfig(prev => ({ ...prev, size: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50x30">50mm x 30mm (Standard)</SelectItem>
                    <SelectItem value="40x25">40mm x 25mm</SelectItem>
                    <SelectItem value="30x20">30mm x 20mm (Small)</SelectItem>
                    <SelectItem value="100x50">100mm x 50mm (Large)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-name" className="text-sm">Display Product Name</Label>
                  <Switch
                    id="show-name"
                    checked={config.showName}
                    onCheckedChange={(v) => setConfig(prev => ({ ...prev, showName: v }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-price" className="text-sm">Display Price</Label>
                  <Switch
                    id="show-price"
                    checked={config.showPrice}
                    onCheckedChange={(v) => setConfig(prev => ({ ...prev, showPrice: v }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-sku" className="text-sm">Display SKU</Label>
                  <Switch
                    id="show-sku"
                    checked={config.showSku}
                    onCheckedChange={(v) => setConfig(prev => ({ ...prev, showSku: v }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Barcode Type</Label>
                <Select
                  value={config.barcodeType}
                  onValueChange={(v: string) => setConfig(prev => ({ ...prev, barcodeType: v as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="code128">Standard Barcode (Code128)</SelectItem>
                    <SelectItem value="ean13">EAN-13</SelectItem>
                    <SelectItem value="ean8">EAN-8</SelectItem>
                    <SelectItem value="upca">UPC-A</SelectItem>
                    <SelectItem value="qr">QR Code</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name Size</Label>
                  <Select
                    value={String(config.nameFontSize)}
                    onValueChange={(v) => setConfig(prev => ({ ...prev, nameFontSize: parseInt(v) }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Normal</SelectItem>
                      <SelectItem value="2">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Price Size</Label>
                  <Select
                    value={String(config.priceFontSize)}
                    onValueChange={(v) => setConfig(prev => ({ ...prev, priceFontSize: parseInt(v) }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Normal</SelectItem>
                      <SelectItem value="2">Large</SelectItem>
                      <SelectItem value="3">Extra Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-zinc-50 dark:bg-zinc-900/50 p-4 border-t">
              <div className="flex items-start gap-3">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-[10px] text-muted-foreground">
                  Ensure your label printer is loaded with the selected size. Using incorrect sizes may result in misaligned prints.
                </p>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
