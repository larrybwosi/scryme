import { useState, useEffect } from 'react';
import { usePosProducts } from '@/hooks/products';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@repo/ui/components/ui/dialog';
import { Label } from '@repo/ui/components/ui/label';
import { Plus, Pencil, Trash2, Search, Printer, Loader2, Wrench } from 'lucide-react';
import { Badge } from '@repo/ui/components/ui/badge';
import { Checkbox } from '@repo/ui/components/ui/checkbox';
import { invoke } from '@tauri-apps/api/core';
import { LabelService } from '@/lib/label-service';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { usePosStore } from '@/store/store';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@repo/ui/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/ui/components/ui/tooltip';

export default function ProductManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { products, triggerSync } = usePosProducts({ search: searchTerm, category: 'all', pageSize: 1000 });
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  useEffect(() => {
    const handleBarcodeScanned = (e: any) => {
      const barcode = e.detail.barcode;
      setScannedBarcode(barcode);
      setEditingProduct(null);
      setIsDialogOpen(true);
    };
    window.addEventListener('barcode-scanned-for-registration', handleBarcodeScanned as any);
    return () => window.removeEventListener('barcode-scanned-for-registration', handleBarcodeScanned as any);
  }, []);

  const [isServiceState, setIsServiceState] = useState(false);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const barcode = formData.get('barcode') as string;
    const categoryInput = formData.get('category') as string;
    const category = isServiceState ? (categoryInput || 'Services') : (categoryInput || 'General');
    const stockVal = isServiceState ? 999999 : (parseInt(formData.get('stock') as string) || 0);

    const productData = {
      productId: editingProduct?.productId || uuidv4(),
      name: formData.get('productName'),
      category: category,
      barcode: barcode,
      isService: isServiceState,
      price: parseFloat(formData.get('price') as string),
      stock: stockVal,
      variants: editingProduct?.variants?.map((v: any, idx: number) => idx === 0 ? { ...v, barcode, stock: stockVal } : v) || [{
          variantId: uuidv4(),
          name: 'Default',
          sku: '',
          barcode: barcode,
          stock: stockVal,
          sellableUnits: [{
              unitId: uuidv4(),
              unitName: isServiceState ? 'Service' : 'Unit',
              conversion: 1,
              price: parseFloat(formData.get('price') as string),
              isBaseUnit: true
          }]
      }],
      location_id: 'standalone'
    };

    try {
      if (editingProduct) {
        await invoke('update_local_product_command', { product: productData });
        toast.success('Product updated');
      } else {
        await invoke('create_local_product_command', { product: productData });
        toast.success('Product created');
      }
      setIsDialogOpen(false);
      setEditingProduct(null);
      triggerSync();
    } catch (error) {
      toast.error('Failed to save product');
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await invoke('delete_local_product_command', { productId: productToDelete, locationId: 'standalone' });
      toast.success('Product deleted');
      triggerSync();
      setProductToDelete(null);
    } catch (error) {
      toast.error('Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <TooltipProvider>
    <div className="p-6 space-y-6">
      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && !isDeleting && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. This will permanently delete the product.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleDelete(); }} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</> : 'Delete Product'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Product Management</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingProduct(null);
            setScannedBarcode('');
            setIsServiceState(false);
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingProduct(null); setScannedBarcode(''); setIsServiceState(false); }}>
              <Plus className="mr-2 h-4 w-4" /> Add Item / Service
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Item' : 'Add New Product / Service'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex items-center space-x-2 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                <Checkbox
                  id="isService"
                  checked={isServiceState}
                  onCheckedChange={(checked) => setIsServiceState(!!checked)}
                />
                <Label htmlFor="isService" className="font-semibold cursor-pointer text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-purple-600" /> This item is a Service (labor, consultation, repair, treatment)
                </Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="productName">{isServiceState ? 'Service Name' : 'Product Name'}</Label>
                <Input id="productName" name="productName" defaultValue={editingProduct?.productName || editingProduct?.name} required placeholder={isServiceState ? 'e.g. General Consultation / Equipment Repair' : 'e.g. Item Name'} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" name="category" defaultValue={editingProduct?.category || (isServiceState ? 'Services' : 'General')} placeholder="e.g. Services, OTC Medicine, Hardware" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode / Code</Label>
                <Input id="barcode" name="barcode" defaultValue={scannedBarcode || editingProduct?.barcode || editingProduct?.variants?.[0]?.barcode} placeholder="Scan or enter barcode / service code" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input id="price" name="price" type="number" step="0.01" defaultValue={editingProduct?.price || editingProduct?.variants?.[0]?.price || editingProduct?.variants?.[0]?.sellableUnits?.[0]?.price} required />
                </div>
                {!isServiceState && (
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock</Label>
                    <Input id="stock" name="stock" type="number" defaultValue={editingProduct?.stock || editingProduct?.variants?.[0]?.stock} required />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="submit">Save {isServiceState ? 'Service' : 'Product'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product: any) => (
              <TableRow key={product.productId}>
                <TableCell className="font-medium flex items-center gap-2">
                  {product.productName || product.name}
                  {(product.isService || product.category?.toLowerCase() === 'services' || product.category?.toLowerCase() === 'service') && (
                    <Badge className="bg-purple-600 hover:bg-purple-700 text-white text-[10px] gap-1 font-bold uppercase">
                      <Wrench className="w-3 h-3" /> Service
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>{product.price || product.variants?.[0]?.price || product.variants?.[0]?.sellableUnits?.[0]?.price}</TableCell>
                <TableCell>
                  {(product.isService || product.category?.toLowerCase() === 'services' || product.category?.toLowerCase() === 'service') ? (
                    <span className="text-muted-foreground text-xs font-medium italic">Unlimited</span>
                  ) : (
                    product.stock || product.variants?.[0]?.stock
                  )}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Tooltip><TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Print Barcode" onClick={async () => {
                      try {
                        const currency = usePosStore.getState().settings.receiptConfig.currency || 'USD';
                        await LabelService.printLabels([{
                          id: product.productId, name: product.productName, barcode: product.barcode || product.sku || product.productId,
                          price: product.price || product.variants?.[0]?.price || 0, currency, quantity: 1
                        }], { size: '50x30', showPrice: true, showSku: true, showName: true, barcodeType: 'code128', printerName: 'default' });
                        toast.success('Label sent to printer');
                      } catch (err) { toast.error('Printing failed'); }
                    }}><Printer className="h-4 w-4" /></Button>
                  </TooltipTrigger><TooltipContent>Print Barcode</TooltipContent></Tooltip>

                  <Tooltip><TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Edit Product" onClick={() => {
                      setEditingProduct(product);
                      setIsServiceState(!!product.isService || product.category?.toLowerCase() === 'services' || product.category?.toLowerCase() === 'service');
                      setIsDialogOpen(true);
                    }}>
                      <Pencil className="h-4 w-4" /></Button>
                  </TooltipTrigger><TooltipContent>Edit Product</TooltipContent></Tooltip>

                  <Tooltip><TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive" aria-label="Delete Product" onClick={() => setProductToDelete(product.productId)}>
                      <Trash2 className="h-4 w-4" /></Button>
                  </TooltipTrigger><TooltipContent>Delete Product</TooltipContent></Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
    </TooltipProvider>
  );
}
