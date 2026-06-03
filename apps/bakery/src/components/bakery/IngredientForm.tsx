import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import { Textarea } from '@repo/ui/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@repo/ui/components/ui/dialog';
import { CategorySelect } from '@/components/common/category-select';
import { AdvancedUnitSelector } from '@/components/common/units/advance-select';
import { useCreateRawMaterial, useUpdateRawMaterial } from '@/lib/hooks/raw-materials';
import { useUnits } from '@/lib/units/hooks';
import { CreateRawMaterialInput } from '@/lib/validations/raw-materials';
import { TagInput } from '@repo/ui/components/ui/tag-input';
import { Loader2, Box, DollarSign, Scale, AlignLeft, Edit, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface IngredientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ingredient?: any | null; // Pass the ingredient to edit, or null for creating
}

export function IngredientFormDialog({ open, onOpenChange, ingredient }: IngredientFormDialogProps) {
  const createRawMaterial = useCreateRawMaterial();
  const updateRawMaterial = useUpdateRawMaterial();

  const [selectedUnitId, setSelectedUnitId] = useState<string | undefined>(undefined);
  const [selectedUnitType, setSelectedUnitType] = useState<'system' | 'org'>('system');

  const [selectedStockingUnitId, setSelectedStockingUnitId] = useState<string | undefined>(undefined);
  const [selectedStockingUnitType, setSelectedStockingUnitType] = useState<'system' | 'org'>('system');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<CreateRawMaterialInput & { categoryId: string; tags?: string[] }>();

  // Populate form when editing
  useEffect(() => {
    if (open && ingredient) {
      reset({
        name: ingredient.name,
        buyingPrice: ingredient.unitPrice ? Number(ingredient.unitPrice) : undefined,
        description: ingredient.description || '',
        categoryId: ingredient.category?.id || '',
        tags: ingredient.tags || [],
        unitsPerContainer: ingredient.unitsPerContainer || 0,
      });
      if (ingredient.unit?.id) {
        setSelectedUnitId(ingredient.unit.id);
        setSelectedUnitType('system');
      }
      if (ingredient.stockingUnit?.id) {
        setSelectedStockingUnitId(ingredient.stockingUnit.id);
        setSelectedStockingUnitType('system');
      } else {
        setSelectedStockingUnitId(undefined);
      }
    } else if (open && !ingredient) {
      reset({
        name: '',
        buyingPrice: undefined,
        description: '',
        categoryId: '',
        tags: [],
      });
      setSelectedUnitId(undefined);
      setSelectedUnitType('system');
      setSelectedStockingUnitId(undefined);
    }
  }, [open, ingredient, reset]);

  const isEditing = !!ingredient;
  const isPending = createRawMaterial.isPending || updateRawMaterial.isPending;

  const onSubmit = async (data: CreateRawMaterialInput & { categoryId: string }) => {
    try {
      const formData = {
        ...data,
        baseUnitId: selectedUnitType === 'system' ? selectedUnitId : undefined,
        baseOrgUnitId: selectedUnitType === 'org' ? selectedUnitId : undefined,
        stockingUnitId: selectedStockingUnitType === 'system' ? selectedStockingUnitId : undefined,
        stockingOrgUnitId: selectedStockingUnitType === 'org' ? selectedStockingUnitId : undefined,
      };

      if (isEditing) {
        await updateRawMaterial.mutateAsync({ id: ingredient.productId, data: formData });
        toast.success('Material updated successfully.');
      } else {
        await createRawMaterial.mutateAsync(formData);
        toast.success('Material provisioned successfully.');
      }

      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to save material.');
    }
  };

  const handleUnitChange = (value: string | undefined, type: 'system' | 'org') => {
    setSelectedUnitId(value);
    setSelectedUnitType(type);
  };

  const { orgUnits, systemUnits } = useUnits();

  const handleStockingUnitChange = (value: string | undefined, type: 'system' | 'org') => {
    setSelectedStockingUnitId(value);
    setSelectedStockingUnitType(type);

    // Auto-populate unitsPerContainer from unit's conversionFactor
    if (value) {
      const unit = [...systemUnits, ...orgUnits].find(u => u.id === value);
      if (unit) {
        const factor = (unit as any)?.conversionFactor || 1;
        setValue('unitsPerContainer', factor);
      }
    }
  };

  const nameValue = watch('name');
  const categoryIdValue = watch('categoryId');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              {isEditing ? <Edit className="h-5 w-5 text-blue-600" /> : <Box className="h-5 w-5 text-blue-600" />}
              {isEditing ? 'Edit Raw Material' : 'Provision Raw Material'}
            </DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update master record.' : 'Create new master record.'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <AlignLeft className="h-3.5 w-3.5" /> Identity & Classification
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="name" className="text-xs text-slate-600">Material Name *</Label>
                <Input id="name" {...register('name', { required: 'Required' })} placeholder="e.g. Bread Flour" disabled={isPending} className={cn('h-9', errors.name && 'border-red-500')} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">Classification Group</Label>
                <CategorySelect onValueChange={value => setValue('categoryId', value)} value={categoryIdValue} placeholder="Select category" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="buyingPrice" className="text-xs text-slate-600">Standard Cost (Base)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input id="buyingPrice" type="number" step="0.01" {...register('buyingPrice', { valueAsNumber: true, min: 0 })} placeholder="0.00" disabled={isPending} className="pl-8 h-9" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Scale className="h-3.5 w-3.5" /> Unit of Measure (UOM) Configuration
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 rounded-md">
                <Label className="text-xs text-slate-600">Base Inventory Unit *</Label>
                <AdvancedUnitSelector value={selectedUnitId || ''} onValueChange={handleUnitChange} placeholder="Select base UOM..." disabled={isPending} />
              </div>
              <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 rounded-md">
                <Label className="text-xs text-slate-600">Default Stocking Unit</Label>
                <AdvancedUnitSelector value={selectedStockingUnitId || ''} onValueChange={handleStockingUnitChange} placeholder="e.g. Bag, Box..." disabled={isPending} />
              </div>
              {selectedStockingUnitId && (
                <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 rounded-md sm:col-span-2">
                  <Label htmlFor="unitsPerContainer" className="text-xs text-slate-600">Standard Units per Container</Label>
                  <div className="relative">
                    <Input id="unitsPerContainer" type="number" step="0.01" {...register('unitsPerContainer', { valueAsNumber: true, min: 0 })} placeholder="e.g. 25" disabled={isPending} className="h-9" />
                  </div>
                  <p className="text-[10px] text-slate-400">The amount of base units in one container (e.g., 25 kg in a bag).</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs text-slate-600">Technical Specifications / Notes</Label>
            <Textarea id="description" {...register('description')} rows={2} disabled={isPending} className="resize-none text-sm" />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-1.5">
              <Tag className="h-3.5 w-3.5 text-slate-400" />
              <Label className="text-xs text-slate-600">Tags</Label>
            </div>
            <TagInput
              tags={watch('tags') || []}
              onChange={tags => setValue('tags', tags, { shouldDirty: true })}
              placeholder="Add keywords (e.g. organic, bulk, refrigerated)"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]" disabled={isPending || !nameValue}>
              {isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Committing...</> : isEditing ? 'Update Record' : 'Provision Record'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
