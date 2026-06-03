import { useState, ChangeEvent, useEffect } from 'react';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import { Textarea } from '@repo/ui/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@repo/ui/components/ui/dialog';
import { ShoppingCart, Loader2, Package, Truck, FileText, Upload, X, AlertCircle, Box, Save } from 'lucide-react';
import { Alert, AlertDescription } from '@repo/ui/components/ui/alert';
import { Switch } from '@repo/ui/components/ui/switch';
import { Checkbox } from '@repo/ui/components/ui/checkbox';
import { toast } from 'sonner';
import { useRestockInventory } from '@/lib/api/inventory';
import { useFormattedCurrency } from '@/lib/utils';
import { SupplierSelect } from '@/components/common/supplier-select';
import { AdvancedUnitSelector } from '@/components/common/units/advance-select';
import { useUpdateRawMaterial } from '@/lib/hooks/raw-materials';
import { useUnits } from '@/lib/units/hooks';

interface RestockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIngredient: any;
}

export function RestockDialog({ open, onOpenChange, selectedIngredient }: RestockDialogProps) {
  const [restockForm, setRestockForm] = useState({
    quantity: 0,
    unitPrice: 0,
    notes: '',
    supplierId: '',
    useContainer: false,
    containerUnitId: '',
    containerUnitType: 'system' as 'system' | 'org',
    unitsPerContainer: 0,
    numContainers: 0,
    pricePerContainer: 0,
    saveAsDefault: false,
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const formatCurrency = useFormattedCurrency();
  const { mutateAsync: restockInventory, isPending: isSubmitting } = useRestockInventory();
  const updateRawMaterial = useUpdateRawMaterial();
  const { systemUnits, orgUnits } = useUnits();

  // Load defaults from DB configuration
  useEffect(() => {
    if (open && selectedIngredient) {
      const stockingUnitId = selectedIngredient.stockingUnitId || selectedIngredient.stockingOrgUnitId;
      const stockingUnitType = selectedIngredient.stockingUnitId ? 'system' : 'org';

      setRestockForm(prev => ({
        ...prev,
        useContainer: !!stockingUnitId,
        containerUnitId: stockingUnitId || '',
        containerUnitType: stockingUnitType,
        unitsPerContainer: selectedIngredient.unitsPerContainer || 0,
        supplierId: prev.supplierId || '', // keep supplier if already selected
      }));
    }
  }, [open, selectedIngredient]);


  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setSelectedFiles(prev => [...prev, ...files]);
    setUploadError(null);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (files: File[]): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    const uploadToast = toast.loading(`Uploading ${files.length} file(s)...`);

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch('/api/upload?file=true', {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) throw new Error(`Failed to upload ${file.name}`);
        const data = await response.json();
        if (!data.url) throw new Error(`No URL returned for ${file.name}`);
        uploadedUrls.push(data.url);
      }
      toast.success(`Successfully uploaded ${files.length} file(s)`, { id: uploadToast });
      return uploadedUrls;
    } catch (error) {
      toast.error('File upload failed', { id: uploadToast });
      throw error;
    }
  };

  const handleRestock = async () => {
    try {
      let documentUrls: string[] = [];
      if (selectedFiles.length > 0) {
        setIsUploading(true);
        try { documentUrls = await uploadFiles(selectedFiles); } finally { setIsUploading(false); }
      }

      const finalQuantity = restockForm.useContainer
        ? restockForm.numContainers * restockForm.unitsPerContainer
        : restockForm.quantity;

      const finalUnitPrice = restockForm.useContainer
        ? (restockForm.unitsPerContainer > 0 ? restockForm.pricePerContainer / restockForm.unitsPerContainer : 0)
        : restockForm.unitPrice;

      // 1. Perform Restock
      await restockInventory({
        productId: selectedIngredient.id,
        unitQuantity: finalQuantity,
        variantId: selectedIngredient.ingredientId,
        supplierId: restockForm.supplierId,
        purchasePrice: finalUnitPrice,
        notes: restockForm.notes,
        documentUrls,
      });

      // 2. Save defaults if requested
      if (restockForm.saveAsDefault && restockForm.useContainer) {
        await updateRawMaterial.mutateAsync({
          id: selectedIngredient.id,
          data: {
            stockingUnitId: restockForm.containerUnitType === 'system' ? restockForm.containerUnitId : undefined,
            stockingOrgUnitId: restockForm.containerUnitType === 'org' ? restockForm.containerUnitId : undefined,
            unitsPerContainer: restockForm.unitsPerContainer,
          }
        });
      }

      toast.success('Inventory restocked successfully', {
        description: `${finalQuantity} ${selectedIngredient?.unit?.symbol || 'units'} added to inventory.`
      });

      setRestockForm({
        quantity: 0,
        unitPrice: 0,
        notes: '',
        supplierId: '',
        useContainer: false,
        containerUnitId: '',
        containerUnitType: 'system',
        unitsPerContainer: 0,
        numContainers: 0,
        pricePerContainer: 0,
        saveAsDefault: false,
      });
      setSelectedFiles([]);
      setUploadError(null);
      onOpenChange(false);
    } catch (error) {
      console.error('Restock error:', error);
      setUploadError('An error occurred during restock.');
      toast.error('Failed to restock inventory');
    }
  };

  const totalQuantity = restockForm.useContainer
    ? restockForm.numContainers * restockForm.unitsPerContainer
    : restockForm.quantity;

  const totalCost = restockForm.useContainer
    ? restockForm.numContainers * restockForm.pricePerContainer
    : restockForm.quantity * restockForm.unitPrice;

  const isFormValid = (restockForm.useContainer
    ? (restockForm.numContainers > 0 && restockForm.pricePerContainer > 0 && restockForm.containerUnitId)
    : (restockForm.quantity > 0 && restockForm.unitPrice > 0))
    && restockForm.supplierId.trim() !== '';

  const isProcessing = isSubmitting || isUploading;

  const containerUnit = [...systemUnits, ...orgUnits].find(u => u.id === restockForm.containerUnitId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-slate-900 dark:text-slate-100">
            <Package className="h-5 w-5 text-orange-600 dark:text-orange-500" />
            Restock {selectedIngredient?.name}
          </DialogTitle>
          <DialogDescription className="text-slate-500">Record inbound receipts and update inventory levels.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {uploadError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{uploadError}</AlertDescription>
            </Alert>
          )}

          {/* Supplier Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Truck className="h-4 w-4 text-slate-500" />
              <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-200">Supplier Integration</h3>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Authorized Supplier *</Label>
              <SupplierSelect
                value={restockForm.supplierId}
                onValueChange={(id) => setRestockForm({...restockForm, supplierId: id})}
                placeholder="Search and select vendor..."
              />
            </div>
          </div>

          {/* Mode Switch */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="space-y-0.5">
              <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Container-based Restock</Label>
              <p className="text-xs text-slate-500">Enable for items received in bags, boxes, or crates.</p>
            </div>
            <Switch
              checked={restockForm.useContainer}
              onCheckedChange={(checked) => setRestockForm({...restockForm, useContainer: checked})}
            />
          </div>

          {/* Purchase Details Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Box className="h-4 w-4 text-slate-500" />
              <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-200">
                {restockForm.useContainer ? 'Container Specifications' : 'Direct Quantity'}
              </h3>
            </div>

            {restockForm.useContainer ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="containerUnit" className="text-xs font-medium">Container Unit Type *</Label>
                    <AdvancedUnitSelector
                      value={restockForm.containerUnitId}
                      onValueChange={(id, type) => {
                        const unit = [...systemUnits, ...orgUnits].find(u => u.id === id);
                        const factor = (unit as any)?.conversionFactor || 1;
                        setRestockForm({
                          ...restockForm,
                          containerUnitId: id || '',
                          containerUnitType: type,
                          unitsPerContainer: factor
                        });
                      }}
                      placeholder="e.g. Bag, Box"
                      disabled={isProcessing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unitsPerContainer" className="text-xs font-medium">
                      Units per {containerUnit?.name || 'Container'}
                    </Label>
                    <div className="relative">
                      <Input
                        id="unitsPerContainer"
                        type="number"
                        min="0"
                        step="0.01"
                        value={restockForm.unitsPerContainer || ''}
                        onChange={e => setRestockForm({ ...restockForm, unitsPerContainer: parseFloat(e.target.value) || 0 })}
                        placeholder="0"
                        disabled={isProcessing}
                        className="pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                        {selectedIngredient?.unit?.symbol || 'UOM'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 italic">Default is defined in unit settings, but can be overridden.</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="numContainers" className="text-xs font-medium">
                      Number of {containerUnit?.pluralName || containerUnit?.name || 'Containers'} *
                    </Label>
                    <Input
                      id="numContainers"
                      type="number"
                      min="0"
                      value={restockForm.numContainers || ''}
                      onChange={e => setRestockForm({ ...restockForm, numContainers: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                      disabled={isProcessing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pricePerContainer" className="text-xs font-medium">
                      Price per {containerUnit?.name || 'Container'} *
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                      <Input
                        id="pricePerContainer"
                        type="number"
                        min="0"
                        step="0.01"
                        value={restockForm.pricePerContainer || ''}
                        onChange={e => setRestockForm({ ...restockForm, pricePerContainer: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                        disabled={isProcessing}
                        className="pl-7"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 pt-1">
                  <Checkbox
                    id="saveAsDefault"
                    checked={restockForm.saveAsDefault}
                    onCheckedChange={(checked) => setRestockForm({ ...restockForm, saveAsDefault: !!checked })}
                  />
                  <Label htmlFor="saveAsDefault" className="text-xs text-slate-500 cursor-pointer flex items-center gap-1.5">
                    <Save className="h-3 w-3" /> Save this unit as default stocking unit for {selectedIngredient?.name}
                  </Label>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-xs font-medium">Quantity *</Label>
                  <div className="relative">
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      step="0.01"
                      value={restockForm.quantity || ''}
                      onChange={e => setRestockForm({ ...restockForm, quantity: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                      disabled={isProcessing}
                      className="pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                      {selectedIngredient?.unit?.symbol || 'UOM'}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitPrice" className="text-xs font-medium">Unit Price *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                    <Input
                      id="unitPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={restockForm.unitPrice || ''}
                      onChange={e => setRestockForm({ ...restockForm, unitPrice: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      disabled={isProcessing}
                      className="pl-7"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notes Section */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium text-slate-700 dark:text-slate-300">Audit Notes</Label>
            <Textarea
              id="notes"
              value={restockForm.notes}
              onChange={e => setRestockForm({ ...restockForm, notes: e.target.value })}
              placeholder="Record batch numbers, quality remarks, or delivery reference..."
              rows={2}
              disabled={isProcessing}
              className="resize-none text-sm"
            />
          </div>

          {/* Order Summary */}
          <div className="bg-linear-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-2 border-orange-200 dark:border-orange-800/50 p-5 rounded-xl shadow-sm">
            <div className="space-y-2">
              {restockForm.useContainer && (
                <div className="flex justify-between items-center text-xs text-orange-800 dark:text-orange-300 font-medium bg-orange-200/30 dark:bg-orange-900/30 px-2 py-1 rounded">
                  <span>Configuration</span>
                  <span>{restockForm.numContainers} × {restockForm.unitsPerContainer} {selectedIngredient?.unit?.symbol} per {containerUnit?.name || 'Unit'}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-700 dark:text-slate-400">Total Net Quantity</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {totalQuantity.toLocaleString()} {selectedIngredient?.unit?.symbol || 'UOM'}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-orange-200 dark:border-orange-800/50 pt-2">
                <span className="text-base font-bold text-orange-900 dark:text-orange-100">Total Capital Outlay</span>
                <span className="text-xl font-bold text-orange-600 dark:text-orange-500">{formatCurrency(totalCost)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing} className="flex-1 border-slate-200 dark:border-slate-800">
              Cancel
            </Button>
            <Button
              onClick={handleRestock}
              className="flex-1 bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 text-white shadow-md shadow-orange-600/20"
              disabled={isProcessing || !isFormValid}
            >
              {isProcessing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</> : <><ShoppingCart className="h-4 w-4 mr-2" /> Commit to Inventory</>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
