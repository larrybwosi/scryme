import { useState } from 'react';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@repo/ui/components/ui/dialog';
import { ShoppingCart, Loader2, Package, Trash2, Plus, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { useRestockInventory } from '@/lib/api/inventory';
import { SupplierSelect } from '@/components/common/supplier-select';
import { AdvancedUnitSelector } from '@/components/common/units/advance-select';
import { useListIngredients } from '@/hooks/bakery';
import { useUnits } from '@/lib/units/hooks';
import {
  calculateLineQuantity,
  calculateLineUnitCost,
  calculateLineTotal,
  calculateGrandTotal
} from '@/lib/units/calculations';
import { ScrollArea } from '@repo/ui/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/ui/select';

interface BulkRestockProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface RestockEntry {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  quantity: number;
  unitId: string;
  unitType: 'system' | 'org';
  unitsPerContainer: number;
  unitPrice: number;
  baseUnitSymbol: string;
}

export function BulkRestock({ open, onOpenChange }: BulkRestockProps) {
  const [entries, setEntries] = useState<RestockEntry[]>([]);
  const [supplierId, setSupplierId] = useState('');
  const { data: ingredients } = useListIngredients();
  const { systemUnits, orgUnits } = useUnits();
  const { mutateAsync: restockInventory, isPending: isSubmitting } = useRestockInventory();

  console.log('ingredients', ingredients);
  const addEntry = () => {
    setEntries([...entries, {
      id: Math.random().toString(36).substr(2, 9),
      productId: '',
      variantId: '',
      name: '',
      quantity: 0,
      unitId: '',
      unitType: 'system',
      unitsPerContainer: 0,
      unitPrice: 0,
      baseUnitSymbol: ''
    }]);
  };

  const removeEntry = (id: string) => {
    setEntries(entries.filter(e => e.id !== id));
  };

  const updateEntry = (id: string, updates: Partial<RestockEntry>) => {
    setEntries(entries.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const handleSelectIngredient = (id: string, ingredient: any) => {
    updateEntry(id, {
      productId: ingredient.id,
      variantId: ingredient.ingredientId,
      name: ingredient.name,
      baseUnitSymbol: ingredient.unit?.symbol || 'UOM',
      unitId: ingredient.stockingUnitId || ingredient.stockingOrgUnitId || '',
      unitType: ingredient.stockingUnitId ? 'system' : 'org',
      unitsPerContainer: ingredient.unitsPerContainer || 0
    });
  };

  const entryToCalcLine = (entry: RestockEntry) => ({
    useContainer: !!entry.unitId,
    numContainers: entry.quantity,
    unitsPerContainer: entry.unitsPerContainer,
    pricePerContainer: entry.unitPrice,
    quantity: entry.quantity,
    unitCost: entry.unitPrice
  });

  const handleBulkRestock = async () => {
    if (!supplierId) {
      toast.error('Please select a supplier');
      return;
    }

    const validEntries = entries.filter(e => e.productId && e.quantity > 0);
    if (validEntries.length === 0) {
      toast.error('No valid entries to restock');
      return;
    }

    try {
      for (const entry of validEntries) {
        const line = entryToCalcLine(entry);
        const finalQuantity = calculateLineQuantity(line);
        const finalUnitPrice = calculateLineUnitCost(line);

        await restockInventory({
          productId: entry.productId,
          variantId: entry.variantId,
          unitQuantity: finalQuantity,
          supplierId,
          purchasePrice: finalUnitPrice,
          notes: 'Bulk Reception',
        });
      }

      toast.success('Bulk restock completed successfully');
      setEntries([]);
      setSupplierId('');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to complete bulk restock');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-orange-600" />
            Bulk Stock Reception
          </DialogTitle>
          <DialogDescription>Record multiple raw material receipts in a single session.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Supplier</Label>
              <SupplierSelect
                value={supplierId}
                onValueChange={setSupplierId}
                placeholder="Select supplier for this shipment..."
              />
            </div>
          </div>

          <div className="flex-1 overflow-hidden border rounded-md">
            <ScrollArea className="h-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Raw Material</TableHead>
                    <TableHead className="w-[120px]">Num Containers</TableHead>
                    <TableHead className="w-[200px]">Container Unit</TableHead>
                    <TableHead className="w-[120px]">Units/Container</TableHead>
                    <TableHead className="w-[120px]">Price/Container</TableHead>
                    <TableHead>Total (Converted)</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <Select
                          value={entry.productId}
                          onValueChange={(val) => {
                            const ing = ingredients?.find(i => i.id === val);
                            if (ing) handleSelectIngredient(entry.id, ing);
                          }}
                        >
                          <SelectTrigger className="w-full h-10">
                            <SelectValue placeholder="Select Material..." />
                          </SelectTrigger>
                          <SelectContent>
                            {ingredients?.map(ing => (
                              <SelectItem key={ing.id} value={ing.id}>{ing.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={entry.quantity || ''}
                          onChange={e => updateEntry(entry.id, { quantity: parseFloat(e.target.value) || 0 })}
                          placeholder="0"
                        />
                      </TableCell>
                      <TableCell>
                        <AdvancedUnitSelector
                          value={entry.unitId}
                          onValueChange={(id, type) => {
                            const unit = [...systemUnits, ...orgUnits].find(u => u.id === id);
                            const factor = (unit as any)?.conversionFactor || 1;
                            updateEntry(entry.id, {
                              unitId: id || '',
                              unitType: type,
                              unitsPerContainer: factor
                            });
                          }}
                          placeholder="Select Unit"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={entry.unitsPerContainer || ''}
                          onChange={e => updateEntry(entry.id, { unitsPerContainer: parseFloat(e.target.value) || 0 })}
                          placeholder="0"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">$</span>
                          <Input
                            className="pl-5"
                            type="number"
                            value={entry.unitPrice || ''}
                            onChange={e => updateEntry(entry.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                            placeholder="0.00"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        <div className="flex flex-col">
                          <span>{calculateLineQuantity(entryToCalcLine(entry)).toLocaleString()} {entry.baseUnitSymbol}</span>
                          <span className="text-[10px] text-slate-500">Total: ${calculateLineTotal(entryToCalcLine(entry)).toFixed(2)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => removeEntry(entry.id)}>
                          <Trash2 className="h-4 w-4 text-rose-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="p-4">
                <Button variant="outline" size="sm" onClick={addEntry} className="w-full border-dashed">
                  <Plus className="h-4 w-4 mr-2" /> Add Item
                </Button>
              </div>
            </ScrollArea>
          </div>

          <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <div className="flex gap-4 items-center">
               <Calculator className="h-5 w-5 text-slate-400" />
               <div className="text-sm">
                  <span className="text-slate-500">Total Shipment Value:</span>
                  <span className="ml-2 font-bold text-lg">
                    ${calculateGrandTotal(entries.map(entryToCalcLine)).toFixed(2)}
                  </span>
               </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button
                onClick={handleBulkRestock}
                className="bg-orange-600 hover:bg-orange-700 text-white"
                disabled={isSubmitting || entries.length === 0}
              >
                {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</> : <><ShoppingCart className="h-4 w-4 mr-2" /> Commit Bulk Restock</>}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
