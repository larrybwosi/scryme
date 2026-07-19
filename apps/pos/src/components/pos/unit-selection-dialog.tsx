import { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@repo/ui/components/ui/dialog';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@repo/ui/components/ui/toggle-group';
import { Minus, Plus, ShoppingCart, Package, Info } from 'lucide-react';
import { cn, useFormattedCurrency } from '@/lib/utils';
import { Badge } from '@repo/ui/components/ui/badge';
import { ScrollArea } from '@repo/ui/components/ui/scroll-area';

interface Unit {
  unitId: string;
  unitName: string;
  price: number | string;
  wholesalePrice?: number | string;
  isBaseUnit?: boolean;
  stock?: number;
}

interface Variant {
  variantId: string;
  name: string;
  sku?: string;
  stock?: number;
  sellableUnits: Unit[];
}

interface Product {
  productId: string;
  name: string;
  productName?: string;
  imageUrl?: string;
  category?: string;
  variants: Variant[];
}

interface UnitSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
  pricingMode: 'retail' | 'wholesale';
  onConfirm: (variant: Variant, unit: Unit, quantity: number) => void;
  initialVariantId?: string;
  initialUnitId?: string;
  initialQuantity?: number;
  customPriceCalculator?: (variantId: string, unitId: string, isBaseUnit?: boolean) => number | null;
  title?: string;
  confirmLabel?: string;
}

export function UnitSelectionDialog({
  open,
  onOpenChange,
  product,
  pricingMode,
  onConfirm,
  initialVariantId,
  initialUnitId,
  initialQuantity = 1,
  customPriceCalculator,
  title,
  confirmLabel = 'Add to Cart',
}: UnitSelectionDialogProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    initialVariantId || product.variants[0]?.variantId || ''
  );
  const [selectedUnitId, setSelectedUnitId] = useState<string>(initialUnitId || '');
  const [quantity, setQuantity] = useState<number>(initialQuantity);
  const formatCurrency = useFormattedCurrency();

  // Reset state when product or open state changes
  useEffect(() => {
    if (open) {
      const variantId = initialVariantId || product.variants[0]?.variantId || '';
      setSelectedVariantId(variantId);

      const variant = product.variants.find(v => v.variantId === variantId);
      const unitId = initialUnitId || variant?.sellableUnits[0]?.unitId || '';
      setSelectedUnitId(unitId);
      setQuantity(initialQuantity);
    }
  }, [open, product, initialVariantId, initialUnitId, initialQuantity]);

  const currentVariant = useMemo(
    () => product.variants.find(v => v.variantId === selectedVariantId) || product.variants[0],
    [product.variants, selectedVariantId]
  );

  const currentUnit = useMemo(
    () => currentVariant?.sellableUnits.find(u => u.unitId === selectedUnitId) || currentVariant?.sellableUnits[0],
    [currentVariant, selectedUnitId]
  );

  const stock = currentVariant?.stock ?? 0;
  const isOutOfStock = stock <= 0;

  const price = useMemo(() => {
    if (!currentUnit || !currentVariant) return 0;

    if (customPriceCalculator) {
      const customPrice = customPriceCalculator(currentVariant.variantId, currentUnit.unitId, !!currentUnit.isBaseUnit);
      if (customPrice !== null) return customPrice;
    }

    if (pricingMode === 'wholesale') {
      const wp = Number(currentUnit.wholesalePrice);
      return wp > 0 ? wp : Number(currentUnit.price);
    }
    return Number(currentUnit.price);
  }, [currentUnit, currentVariant, pricingMode, customPriceCalculator]);

  const handleConfirm = () => {
    if (currentVariant && currentUnit) {
      onConfirm(currentVariant, { ...currentUnit, price }, quantity);
      onOpenChange(false);
    }
  };

  const handleQtyChange = (val: number) => {
    const newQty = Math.max(1, val);
    if (newQty <= stock || stock === 0) {
       setQuantity(newQty);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden gap-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-xl font-bold">
            {title || `Select Unit: ${product.productName || product.name}`}
          </DialogTitle>
          <div className="flex items-center gap-2 mt-1">
             <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-semibold opacity-70">
                {product.category}
             </Badge>
             {currentVariant?.sku && (
               <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                 <Package className="w-3 h-3" /> {currentVariant.sku}
               </span>
             )}
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Variant Selection (if multiple) */}
          {product.variants.length > 1 && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Variant</Label>
              <ToggleGroup
                type="single"
                value={selectedVariantId}
                onValueChange={(val) => {
                  if (val) {
                    setSelectedVariantId(val);
                    const v = product.variants.find(varnt => varnt.variantId === val);
                    if (v?.sellableUnits.length) {
                       setSelectedUnitId(v.sellableUnits[0].unitId);
                    }
                  }
                }}
                className="justify-start flex-wrap gap-2"
              >
                {product.variants.map((v) => (
                  <ToggleGroupItem
                    key={v.variantId}
                    value={v.variantId}
                    variant="outline"
                    className="h-9 px-4 rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary"
                  >
                    {v.name}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          )}

          {/* Unit Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Selling Unit</Label>
            {currentVariant?.sellableUnits.length <= 4 ? (
              <ToggleGroup
                type="single"
                value={selectedUnitId}
                onValueChange={(val) => val && setSelectedUnitId(val)}
                className="grid grid-cols-2 sm:grid-cols-4 gap-2"
              >
                {currentVariant.sellableUnits.map((u) => (
                  <ToggleGroupItem
                    key={u.unitId}
                    value={u.unitId}
                    variant="outline"
                    className="h-10 px-2 flex flex-col gap-0 rounded-md data-[state=on]:border-primary data-[state=on]:bg-primary/5 data-[state=on]:text-primary"
                  >
                    <span className="text-xs font-bold">{u.unitName}</span>
                    <span className="text-[10px] opacity-70">
                       {formatCurrency(Number(u.price))}
                    </span>
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            ) : (
              <ScrollArea className="h-[120px] rounded-md border p-2">
                <div className="grid grid-cols-1 gap-1">
                   {currentVariant?.sellableUnits.map((u) => (
                     <button
                       key={u.unitId}
                       onClick={() => setSelectedUnitId(u.unitId)}
                       className={cn(
                         "flex items-center justify-between p-2 rounded-md transition-colors text-left",
                         selectedUnitId === u.unitId ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                       )}
                     >
                       <span className="text-sm font-medium">{u.unitName}</span>
                       <span className={cn("text-xs", selectedUnitId === u.unitId ? "text-primary-foreground/80" : "text-muted-foreground")}>
                         {formatCurrency(Number(u.price))}
                       </span>
                     </button>
                   ))}
                </div>
              </ScrollArea>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="space-y-1">
              <Label className="text-sm font-semibold">Quantity</Label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-md"
                  aria-label="Decrease quantity"
                  onClick={() => handleQtyChange(quantity - 1)}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => handleQtyChange(parseInt(e.target.value) || 1)}
                  className="w-16 text-center text-lg font-bold h-10 border-none bg-transparent focus-visible:ring-0 no-spinners"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-md"
                  aria-label="Increase quantity"
                  onClick={() => handleQtyChange(quantity + 1)}
                  disabled={stock > 0 && quantity >= stock}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Price</div>
              <div className="text-2xl font-black text-primary">
                {formatCurrency(price * quantity)}
              </div>
              <div className="text-[10px] text-muted-foreground">
                 {formatCurrency(price)} per {currentUnit?.unitName}
              </div>
            </div>
          </div>

          {stock > 0 && stock < 20 && (
             <div className="flex items-center gap-2 p-2 rounded-md bg-amber-50 text-amber-700 border border-amber-100 text-[11px] font-medium">
                <Info className="w-3.5 h-3.5" />
                Low stock alert: Only {stock} {currentUnit?.unitName} available in inventory.
             </div>
          )}
          {isOutOfStock && (
             <div className="flex items-center gap-2 p-2 rounded-md bg-destructive/10 text-destructive border border-destructive/20 text-[11px] font-medium">
                <Info className="w-3.5 h-3.5" />
                This product variant is currently out of stock.
             </div>
          )}
        </div>

        <DialogFooter className="p-6 pt-0 flex gap-2">
          <DialogClose asChild>
            <Button variant="outline" className="flex-1 h-12 text-base font-bold rounded-xl">
              Cancel
            </Button>
          </DialogClose>
          <Button
            className="flex-[2] h-12 text-base font-bold rounded-xl shadow-lg"
            disabled={isOutOfStock || !currentUnit}
            onClick={handleConfirm}
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}