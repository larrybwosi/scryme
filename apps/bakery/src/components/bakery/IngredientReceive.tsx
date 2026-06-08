'use client';

import { useState, useCallback } from 'react';
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// shadcn components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@repo/ui/components/ui/dialog';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/ui/select';
import { Calendar } from '@repo/ui/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/components/ui/popover';
import { Separator } from '@repo/ui/components/ui/separator';
import { Badge } from '@repo/ui/components/ui/badge';
import { ScrollArea } from '@repo/ui/components/ui/scroll-area';
import { Switch } from '@repo/ui/components/ui/switch';
import { SupplierSelect } from '@/components/common/supplier-select';
import { AdvancedUnitSelector } from '@/components/common/units/advance-select';

// icons
import {
  Truck,
  Plus,
  Trash2,
  Loader2,
  Check,
  CalendarIcon,
  ListPlus,
  DollarSign,
  Paperclip,
  X,
  FileText,
  Image,
  File,
  AlertCircle,
  Package,
  Hash,
  Upload,
  Box,
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useUnits } from '@/lib/units/hooks';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Ingredient {
  id: string;
  name: string;
  sku: string;
  unitPrice: number;
  unit: { symbol: string };
  stockingUnitId?: string;
  stockingOrgUnitId?: string;
  unitsPerContainer?: number;
}

interface GRNLine {
  ingredientId: string;
  quantity: number;
  unitCost: number;
  supplier: string;
  lotNumber: string;
  manufactureDate: Date | undefined;
  expiryDate: Date | undefined;
  notes: string;
  // Container fields
  useContainer?: boolean;
  containerUnitId?: string;
  containerUnitType?: 'system' | 'org';
  unitsPerContainer?: number;
  numContainers?: number;
  pricePerContainer?: number;
}

interface BulkReceiveFormData {
  receiptReference: string;
  receiptDate: Date;
  lines: GRNLine[];
  attachments: UploadedFile[];
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return <Image className="h-4 w-4 text-violet-500" />;
  if (type === 'application/pdf') return <FileText className="h-4 w-4 text-red-500" />;
  return <File className="h-4 w-4 text-slate-400" />;
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionHeading({
  icon,
  label,
  count,
  action,
}: {
  icon: React.ReactNode;
  label: string;
  count?: number;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2.5">
        <span className="flex items-center justify-center h-6 w-6 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
          {icon}
        </span>
        <span className="text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-200">{label}</span>
        {count !== undefined && (
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5 rounded-full">
            {count}
          </Badge>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

function DatePickerField({
  value,
  onChange,
  placeholder = 'Pick date',
  hasError,
}: {
  value: Date | undefined;
  onChange: (d: Date | undefined) => void;
  placeholder?: string;
  hasError?: boolean;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'h-8 w-full justify-start text-left font-normal text-xs px-2',
            !value && 'text-slate-400',
            hasError && 'border-red-400 focus-visible:ring-red-400'
          )}
        >
          <CalendarIcon className="mr-2 h-3 w-3 text-slate-400 shrink-0" />
          {value ? format(value, 'MMM d, yyyy') : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value} onSelect={onChange} initialFocus />
      </PopoverContent>
    </Popover>
  );
}

function AttachmentZone({
  files,
  onAdd,
  onRemove,
}: {
  files: UploadedFile[];
  onAdd: (files: UploadedFile[]) => void;
  onRemove: (id: string) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = useCallback(
    (rawFiles: FileList | null) => {
      if (!rawFiles) return;
      const newFiles: UploadedFile[] = [];
      Array.from(rawFiles).forEach(file => {
        const reader = new FileReader();
        reader.onload = e => {
          newFiles.push({
            id: `${Date.now()}-${file.name}`,
            name: file.name,
            size: file.size,
            type: file.type,
            dataUrl: e.target?.result as string,
          });
          if (newFiles.length === rawFiles.length) onAdd(newFiles);
        };
        reader.readAsDataURL(file);
      });
    },
    [onAdd]
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={e => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={cn(
          'relative flex flex-col items-center justify-center gap-2 rounded border border-dashed px-4 py-6 text-center transition-colors cursor-pointer',
          isDragging
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/30'
            : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900/40'
        )}
        onClick={() => document.getElementById('grn-file-input')?.click()}
      >
        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800">
          <Upload className="h-4 w-4 text-slate-500" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Drop files here or <span className="text-blue-600 dark:text-blue-400">click to browse</span>
          </p>
        </div>
        <input
          id="grn-file-input"
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.csv"
          className="sr-only"
          onChange={e => processFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {files.map(f => (
            <li
              key={f.id}
              className="flex items-center gap-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5"
            >
              {getFileIcon(f.type)}
              <span className="flex-1 text-xs text-slate-700 dark:text-slate-300 truncate">{f.name}</span>
              <span className="text-[10px] text-slate-400 shrink-0">{formatBytes(f.size)}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={() => onRemove(f.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function BulkReceiveDialog({
  open,
  onClose,
  ingredients,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  ingredients: Ingredient[];
  onSuccess: (data: BulkReceiveFormData) => void;
}) {
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const { systemUnits, orgUnits } = useUnits();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BulkReceiveFormData>({
    defaultValues: {
      receiptReference: `GRN-${new Date().getTime().toString().slice(-6)}`,
      receiptDate: new Date(),
      lines: [],
      attachments: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });
  const watchLines = useWatch({ control, name: 'lines' });

  const grandTotal = watchLines?.reduce((s, l) => {
    if (l.useContainer) {
      return s + (l.numContainers || 0) * (l.pricePerContainer || 0);
    }
    return s + (l.quantity || 0) * (l.unitCost || 0);
  }, 0) || 0;

  const handleAddLine = () =>
    append({
      ingredientId: '',
      quantity: 0,
      unitCost: 0,
      supplier: '',
      lotNumber: '',
      manufactureDate: undefined,
      expiryDate: undefined,
      notes: '',
      useContainer: false,
      containerUnitId: '',
      containerUnitType: 'system',
      unitsPerContainer: 0,
      numContainers: 0,
      pricePerContainer: 0,
    });
  // 1. Define the mutation
  const receiveMutation = useMutation({
    mutationFn: async (payload: BulkReceiveFormData) => {
      // Normalize lines before sending
      const normalizedPayload = {
        ...payload,
        lines: payload.lines.map(line => {
          if (line.useContainer) {
            return {
              ...line,
              quantity: (line.numContainers || 0) * (line.unitsPerContainer || 0),
              unitCost: (line.unitsPerContainer || 0) > 0 ? (line.pricePerContainer || 0) / (line.unitsPerContainer || 0) : 0,
            };
          }
          return line;
        })
      };
      const response = await axios.post('/api/bakery/ingredients/receive', normalizedPayload);
      return response.data;
    },
    onSuccess: (responseData, variables) => {
      toast.success(
        `GRN ${variables.receiptReference} posted — ${variables.lines.length} line(s).`
      );
      reset();
      setAttachments([]);
      onSuccess(variables);
      onClose();
    },
    onError: (error: any) => {
      // Extract the error message from the API response if available
      const errorMessage = error.response?.data?.error || 'Failed to commit Goods Receipt Note. Please try again.';
      toast.error(errorMessage);
    },
  });

  // 2. Update the onSubmit handler
  const onSubmit = (data: BulkReceiveFormData) => {
    if (data.lines.length === 0) {
      toast.error('Add at least one material line before posting.');
      return;
    }

    // Attach any files/attachments to the payload
    data.attachments = attachments;

    // Trigger the mutation
    receiveMutation.mutate(data);
  };

  const handleClose = () => {
    reset();
    setAttachments([]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="max-w-[95vw] lg:max-w-7xl h-[90vh] flex flex-col gap-0 p-0 overflow-hidden rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl">
        <form id="bulk-receive-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full overflow-hidden">
          <div className="shrink-0 px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-9 w-9 rounded-md bg-blue-600 shadow-sm">
                  <Truck className="h-4 w-4 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    Goods Receipt Note
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Record inbound deliveries and update stock.
                  </DialogDescription>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Total Value
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums flex items-center">
                      <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                      {grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="shrink-0 grid grid-cols-1 sm:grid-cols-3 gap-4 px-6 py-3 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <Label className="text-xs font-semibold text-slate-500 w-24 shrink-0">Reference No.</Label>
              <div className="relative flex-1">
                <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                <Input
                  {...register('receiptReference', { required: true })}
                  className={cn('h-8 pl-7 font-mono text-xs', errors.receiptReference && 'border-red-400')}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Label className="text-xs font-semibold text-slate-500 w-24 shrink-0">Received Date</Label>
              <div className="flex-1">
                <Controller
                  control={control}
                  name="receiptDate"
                  rules={{ required: true }}
                  render={({ field }) => (
                    <DatePickerField value={field.value} onChange={field.onChange} placeholder="Select date" hasError={!!errors.receiptDate} />
                  )}
                />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden relative bg-slate-50/30 dark:bg-slate-900/10">
            <ScrollArea className="h-full w-full">
              <div className="p-6 space-y-6">
                <div>
                  <SectionHeading icon={<Package className="h-3.5 w-3.5" />} label="Material Lines" count={fields.length} action={<Button type="button" variant="outline" size="sm" onClick={handleAddLine} className="h-7 text-xs px-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"><Plus className="h-3 w-3 mr-1" />Add Line</Button>} />
                  <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-medium">
                          <tr>
                            <th className="px-3 py-2 font-semibold w-8 text-center">#</th>
                            <th className="px-3 py-2 font-semibold min-w-[180px]">Material</th>
                            <th className="px-3 py-2 font-semibold w-[80px]">Mode</th>
                            <th className="px-3 py-2 font-semibold min-w-[200px]">Qty & Cost Config</th>
                            <th className="px-3 py-2 font-semibold w-[120px]">Lot Number</th>
                            <th className="px-3 py-2 font-semibold w-[120px]">Expiry</th>
                            <th className="px-3 py-2 font-semibold min-w-[160px]">Supplier & Remarks</th>
                            <th className="px-3 py-2 font-semibold w-10 text-center"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                          {fields.length === 0 ? (
                            <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400"><ListPlus className="h-8 w-8 mb-1 opacity-50 mx-auto" />No materials added</td></tr>
                          ) : (
                            fields.map((field, index) => {
                              const line = watchLines?.[index];
                              const selectedIngId = line?.ingredientId;
                              const ingredient = ingredients.find(i => i.id === selectedIngId);
                              const useContainer = line?.useContainer;

                              const handleIngredientSelect = (val: string) => {
                                setValue(`lines.${index}.ingredientId`, val);
                                const matched = ingredients.find(i => i.id === val);

                                // Priority 1: Backend stocking unit
                                if (matched?.stockingUnitId || matched?.stockingOrgUnitId) {
                                  setValue(`lines.${index}.useContainer`, true);
                                  setValue(`lines.${index}.containerUnitId`, matched.stockingUnitId || matched.stockingOrgUnitId);
                                  setValue(`lines.${index}.containerUnitType`, matched.stockingUnitId ? 'system' : 'org');
                                  setValue(`lines.${index}.unitsPerContainer`, matched.unitsPerContainer || 1);
                                } else {
                                  setValue(`lines.${index}.useContainer`, false);
                                }
                              };

                              return (
                                <tr key={field.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors group">
                                  <td className="px-3 py-2 text-center text-slate-400 font-mono text-[10px]">{index + 1}</td>
                                  <td className="px-3 py-2">
                                    <Select value={selectedIngId} onValueChange={handleIngredientSelect}>
                                      <SelectTrigger className="h-8 text-xs bg-transparent border-slate-200"><SelectValue placeholder="Item…" /></SelectTrigger>
                                      <SelectContent>
                                        {ingredients.map(ing => (
                                          <SelectItem key={ing.id} value={ing.id} className="text-xs">{ing.name} <span className="ml-2 text-[10px] text-slate-400 font-mono">{ing.sku}</span></SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </td>
                                  <td className="px-3 py-2 text-center"><Switch checked={useContainer} onCheckedChange={(val) => setValue(`lines.${index}.useContainer`, val)} className="scale-75" /></td>
                                  <td className="px-3 py-2">
                                    {useContainer ? (
                                      <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center gap-1">
                                          <div className="w-32">
                                            <AdvancedUnitSelector
                                              value={line.containerUnitId}
                                              onValueChange={(id, type) => {
                                                setValue(`lines.${index}.containerUnitId`, id || '');
                                                setValue(`lines.${index}.containerUnitType`, type);

                                                const unit = [...systemUnits, ...orgUnits].find(u => u.id === id);
                                                if (unit && 'conversionFactor' in unit && unit.conversionFactor) {
                                                  setValue(`lines.${index}.unitsPerContainer`, unit.conversionFactor);
                                                }
                                              }}
                                              className="h-7 text-[10px]"
                                              placeholder="Unit"
                                            />
                                          </div>
                                          <Input type="number" placeholder="Num" {...register(`lines.${index}.numContainers`, { valueAsNumber: true })} className="h-7 w-12 text-[10px]" />
                                          <span className="text-[10px] text-slate-400">×</span>
                                          <Input type="number" placeholder="Qty/Cont" {...register(`lines.${index}.unitsPerContainer`, { valueAsNumber: true })} className="h-7 text-[10px] w-14" />
                                          <span className="text-[10px] text-slate-400">@</span>
                                          <Input type="number" placeholder="Price/Cont" {...register(`lines.${index}.pricePerContainer`, { valueAsNumber: true })} className="h-7 text-[10px] w-16" />
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <Input type="number" {...register(`lines.${index}.quantity`, { valueAsNumber: true })} className="h-8 text-right text-xs w-24" placeholder="Qty" />
                                        <Input type="number" {...register(`lines.${index}.unitCost`, { valueAsNumber: true })} className="h-8 text-right text-xs w-24" placeholder="Unit Cost" />
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-3 py-2"><Input {...register(`lines.${index}.lotNumber`)} placeholder="Lot #" className="h-8 font-mono text-[10px] uppercase" /></td>
                                  <td className="px-3 py-2">
                                    <Controller
                                      control={control}
                                      name={`lines.${index}.expiryDate`}
                                      render={({ field }) => (
                                        <DatePickerField value={field.value} onChange={field.onChange} placeholder="Expiry" />
                                      )}
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <div className="flex flex-col gap-1">
                                      <Controller
                                        control={control}
                                        name={`lines.${index}.supplier`}
                                        render={({ field }) => (
                                          <SupplierSelect value={field.value} onValueChange={field.onChange} placeholder="Supplier" className="h-7 text-[10px]" />
                                        )}
                                      />
                                      <Input {...register(`lines.${index}.notes`)} placeholder="Notes" className="h-7 text-[10px]" />
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 text-center pt-3">
                                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100" onClick={() => remove(index)}>
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                <Separator className="bg-slate-200" />
                <div className="pb-4">
                  <SectionHeading icon={<Paperclip className="h-3.5 w-3.5" />} label="Supporting Documents" count={attachments.length || undefined} />
                  <div className="max-w-2xl"><AttachmentZone files={attachments} onAdd={newFiles => setAttachments(prev => [...prev, ...newFiles])} onRemove={id => setAttachments(prev => prev.filter(f => f.id !== id))} /></div>
                </div>
              </div>
            </ScrollArea>
          </div>

          <div className="shrink-0 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-between z-10">
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              Verify all line items before posting to inventory ledger.
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={handleClose} disabled={isSubmitting} className="h-8">Cancel</Button>
              <Button type="submit" size="sm" disabled={isSubmitting || fields.length === 0} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px] h-8">
                {isSubmitting ? <><Loader2 className="h-3 w-3 mr-2 animate-spin" />Posting...</> : <><Check className="h-3.5 w-3.5 mr-2" />Post GRN</>}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default BulkReceiveDialog;
