import { useState, useEffect } from 'react';
import { usePosProducts } from '@/hooks/products';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@repo/ui/components/ui/dialog';
import { Label } from '@repo/ui/components/ui/label';
import { Plus, Pencil, Trash2, Search, Printer } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { LabelService } from '@/lib/label-service';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { usePosStore } from '@/store/store';

export default function ProductManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { products, triggerSync } = usePosProducts({ search: searchTerm, category: 'all', pageSize: 1000 });
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');

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

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const barcode = formData.get('barcode') as string;
    const productData = {
      productId: editingProduct?.productId || uuidv4(),
      name: formData.get('productName'),
      category: 'General',
      barcode: barcode,
      price: parseFloat(formData.get('price') as string),
      stock: parseInt(formData.get('stock') as string) || 0,
      variants: editingProduct?.variants?.map((v: any, idx: number) => (idx === 0 ? { ...v, barcode } : v)) || [
        {
          variantId: uuidv4(),
          name: 'Default',
          sku: '',
          barcode: barcode,
          stock: parseInt(formData.get('stock') as string) || 0,
          sellableUnits: [
            {
              unitId: uuidv4(),
              unitName: 'Unit',
              conversion: 1,
              price: parseFloat(formData.get('price') as string),
              isBaseUnit: true,
            },
          ],
        },
      ],
      location_id: 'standalone',
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

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await invoke('delete_local_product_command', { productId, locationId: 'standalone' });
      toast.success('Product deleted');
      triggerSync();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Product Management</h1>
        <Dialog
          open={isDialogOpen}
          onOpenChange={open => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingProduct(null);
              setScannedBarcode('');
            }
          }}
        >
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingProduct(null);
                setScannedBarcode('');
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="productName">Product Name</Label>
                <Input id="productName" name="productName" defaultValue={editingProduct?.productName} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  name="barcode"
                  defaultValue={scannedBarcode || editingProduct?.barcode || editingProduct?.variants?.[0]?.barcode}
                  placeholder="Scan or enter barcode"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    defaultValue={editingProduct?.price || editingProduct?.variants?.[0]?.price}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    name="stock"
                    type="number"
                    defaultValue={editingProduct?.stock || editingProduct?.variants?.[0]?.stock}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save Product</Button>
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
          onChange={e => setSearchTerm(e.target.value)}
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
                <TableCell className="font-medium">{product.productName || product.name}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>
                  {product.price || product.variants?.[0]?.price || product.variants?.[0]?.sellableUnits?.[0]?.price}
                </TableCell>
                <TableCell>{product.stock || product.variants?.[0]?.stock}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Print Barcode"
                    onClick={async () => {
                      try {
                        const currency = usePosStore.getState().settings.receiptConfig.currency || 'USD';
                        await LabelService.printLabels(
                          [
                            {
                              id: product.productId,
                              name: product.productName,
                              barcode: product.barcode || product.sku || product.productId,
                              price: product.price || product.variants?.[0]?.price || 0,
                              currency,
                              quantity: 1,
                            },
                          ],
                          {
                            size: '50x30',
                            showPrice: true,
                            showSku: true,
                            showName: true,
                            barcodeType: 'code128',
                            printerName: 'default',
                          }
                        );
                        toast.success('Label sent to printer');
                      } catch (err) {
                        toast.error('Printing failed');
                      }
                    }}
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingProduct(product);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => handleDelete(product.productId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
