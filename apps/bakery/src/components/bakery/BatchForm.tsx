'use client';

import { useState, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Loader2,
  Calendar as CalendarIcon,
  Clock,
  FileText,
  Layers,
  ChefHat,
  MapPin,
  Timer,
  Undo2,
  Save,
  AlertCircle,
  Users,
  Check,
  BookOpen,
  LayoutTemplate,
  Info,
  Sparkles,
  ChevronRight,
  Tag,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import { Textarea } from '@repo/ui/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/ui/select';
import { Calendar } from '@repo/ui/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/components/ui/popover';
import { Badge } from '@repo/ui/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/components/ui/tooltip';

import { cn } from '@/lib/utils';
import { BatchStatus } from '@/types/bakery';
import { BatchInput, batchSchema } from '@/validations/bakery';
import { useCreateBatch, useRecipes, useTemplates, useUpdateBatch, useBakers } from '@/hooks/bakery';
import { useUnits } from '@/lib/units/hooks';
import { AdvancedUnitSelector } from '@/components/common/units/advance-select';
import { LocationSelect } from '@/components/common/location-select';
import { TagInput } from '@repo/ui/components/ui/tag-input';

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<BatchStatus, { label: string; color: string; dot: string }> = {
  [BatchStatus.PLANNED]: {
    label: 'Planned',
    color: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100',
    dot: 'bg-slate-400',
  },
  [BatchStatus.IN_PROGRESS]: {
    label: 'In Progress',
    color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50',
    dot: 'bg-blue-500',
  },
  [BatchStatus.COMPLETED]: {
    label: 'Completed',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50',
    dot: 'bg-emerald-500',
  },
  [BatchStatus.CANCELLED]: {
    label: 'Cancelled',
    color: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-50',
    dot: 'bg-red-400',
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({
  step,
  title,
  description,
  icon: Icon,
}: {
  step: number;
  title: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-xs font-bold">
        {step}
      </div>
      <div className="flex-1 pt-0.5">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">{title}</h3>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help shrink-0" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[220px] text-xs leading-relaxed">
          {children}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function FieldLabel({
  children,
  hint,
  required,
  error,
}: {
  children: React.ReactNode;
  hint?: React.ReactNode;
  required?: boolean;
  error?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5 mb-1.5">
      <Label className={cn('text-sm font-medium', error ? 'text-destructive' : 'text-foreground')}>{children}</Label>
      {required && <span className="text-destructive text-xs">*</span>}
      {hint && <FieldHint>{hint}</FieldHint>}
      {error && <AlertCircle className="h-3.5 w-3.5 text-destructive" />}
    </div>
  );
}

function SectionDivider() {
  return <div className="border-t border-border my-8" />;
}

// ─── Source selector: Recipe vs Template ─────────────────────────────────────

type SourceMode = 'recipe' | 'template';

function SourceSelector({
  mode,
  onModeChange,
  recipes,
  templates,
  recipeId,
  templateId,
  onRecipeChange,
  onTemplateChange,
}: {
  mode: SourceMode;
  onModeChange: (m: SourceMode) => void;
  recipes: any[];
  templates: any[];
  recipeId: string;
  templateId?: string;
  onRecipeChange: (id: string) => void;
  onTemplateChange: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onModeChange('recipe')}
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all',
            mode === 'recipe'
              ? 'border-primary bg-primary text-primary-foreground shadow-sm'
              : 'border-input bg-background text-muted-foreground hover:border-accent hover:bg-accent'
          )}
        >
          <BookOpen className={cn('h-4 w-4 shrink-0', mode === 'recipe' ? 'text-primary-foreground' : 'text-muted-foreground')} />
          <div>
            <div className="text-sm font-medium leading-none">From Recipe</div>
            <div className={cn('text-xs mt-1', mode === 'recipe' ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
              Choose a recipe directly
            </div>
          </div>
        </button>
        <button
          type="button"
          onClick={() => onModeChange('template')}
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all',
            mode === 'template'
              ? 'border-primary bg-primary text-primary-foreground shadow-sm'
              : 'border-input bg-background text-muted-foreground hover:border-accent hover:bg-accent'
          )}
        >
          <LayoutTemplate className={cn('h-4 w-4 shrink-0', mode === 'template' ? 'text-primary-foreground' : 'text-muted-foreground')} />
          <div>
            <div className="text-sm font-medium leading-none">From Template</div>
            <div className={cn('text-xs mt-1', mode === 'template' ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
              Pre-fill from saved config
            </div>
          </div>
        </button>
      </div>

      {/* Selection dropdown */}
      {mode === 'recipe' ? (
        <Select value={recipeId} onValueChange={onRecipeChange}>
          <SelectTrigger className="w-full h-10 bg-background">
            <SelectValue placeholder="Search and select a recipe…" />
          </SelectTrigger>
          <SelectContent>
            {recipes.map((r: any) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div className="space-y-2">
          <Select value={templateId || ''} onValueChange={onTemplateChange}>
            <SelectTrigger className="w-full h-10 bg-background">
              <SelectValue placeholder="Choose a saved template…" />
            </SelectTrigger>
            <SelectContent>
              {templates?.map((t: any) => (
                <SelectItem key={t.id} value={t.id}>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    {t.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {templateId && (
            <p className="text-xs text-emerald-600 flex items-center gap-1.5 px-1">
              <Check className="h-3.5 w-3.5" />
              Template applied — form fields have been pre-filled. You can still edit them.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

interface BatchFormProps {
  batch?: any;
  onCancel: () => void;
  onSuccess?: () => void;
}

export function BatchForm({ batch, onCancel, onSuccess }: BatchFormProps) {
  const isEditing = !!batch;

  const { data: recipes = [], isLoading: loadingRecipes } = useRecipes();
  const { data: bakers = [], isLoading: loadingBakers } = useBakers();
  const { data: templates = [], isLoading: loadingTemplates } = useTemplates();
  const { systemUnits } = useUnits();

  const createBatchMutation = useCreateBatch();
  const updateBatchMutation = useUpdateBatch();

  const [sourceMode, setSourceMode] = useState<SourceMode>(batch?.createdFromTemplateId ? 'template' : 'recipe');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<any>({
    resolver: zodResolver(batchSchema),
    defaultValues: useMemo(() => {
      const defaultDate = batch?.scheduledStartAt ? new Date(batch.scheduledStartAt) : new Date();
      return {
        recipeId: batch?.recipeId || '',
        plannedQuantity: batch?.plannedQuantity || 1,
        systemUnitId: batch?.systemUnitId || undefined,
        orgUnitId: batch?.orgUnitId || batch?.unitId || undefined,
        status: batch?.status || BatchStatus.PLANNED,
        leadBakerId: batch?.leadBakerId || undefined,
        assistantBakerIds: batch?.assistantBakerIds || [],
        duration: batch?.duration ? Number(batch.duration) : undefined,
        notes: batch?.notes || '',
        createdFromTemplateId: batch?.createdFromTemplateId || undefined,
        outputLocationId: batch?.outputLocationId || undefined,
        date: defaultDate,
        time: batch?.scheduledStartAt ? format(new Date(batch.scheduledStartAt), 'HH:mm') : '09:00',
        shelfLifeDays: batch?.shelfLifeDays || undefined,
        tags: batch?.tags || [],
      };
    }, [batch]),
  });

  const watchedValues = watch();

  const handleBatchUnitChange = useCallback(
    (value: string | undefined, type: 'system' | 'org') => {
      setValue('systemUnitId', type === 'system' ? value : undefined, { shouldDirty: true });
      setValue('orgUnitId', type === 'org' ? value : undefined, { shouldDirty: true });
    },
    [setValue]
  );

  const handleTemplateSelect = useCallback(
    (templateId: string) => {
      const template = templates?.find((t: any) => t.id === templateId);
      if (template) {
        const opt = { shouldDirty: true, shouldValidate: true };
        setValue('createdFromTemplateId', templateId, opt);
        setValue('recipeId', template.recipeId, opt);
        setValue('plannedQuantity', template.quantity, opt);
        setValue('duration', template.duration ? Number(template.duration) : undefined, opt);
        if (template.leadBakerId) setValue('leadBakerId', template.leadBakerId, opt);
        setValue('assistantBakerIds', (template as any).assistantBakerIds || [], opt);
        if (template.shelfLifeDays) setValue('shelfLifeDays', template.shelfLifeDays, opt);

        // Handle units from template
        if (template.systemUnitId) {
          setValue('systemUnitId', template.systemUnitId, opt);
          setValue('orgUnitId', undefined, opt);
        } else if (template.orgUnitId) {
          setValue('orgUnitId', template.orgUnitId, opt);
          setValue('systemUnitId', undefined, opt);
        } else if ((template as any).unitId) {
          // Fallback for legacy data
          const isSystem = systemUnits.some((u: any) => u.id === (template as any).unitId);
          setValue('systemUnitId', isSystem ? (template as any).unitId : undefined, opt);
          setValue('orgUnitId', !isSystem ? (template as any).unitId : undefined, opt);
        }
      }
    },
    [templates, setValue, systemUnits]
  );

  const toggleAssistantBaker = (bakerId: string) => {
    const current = watchedValues.assistantBakerIds || [];
    const next = current.includes(bakerId) ? current.filter((id: string) => id !== bakerId) : [...current, bakerId];
    setValue('assistantBakerIds', next, { shouldDirty: true });
  };

  const handleFormSubmit = async (data: BatchInput, e?: React.BaseSyntheticEvent) => {
    const shouldAddAnother = (e?.nativeEvent as any)?.submitter?.name === 'add-another';

    try {
      if (isEditing && batch) {
        await updateBatchMutation.mutateAsync({ ...data, id: batch.id });
      } else {
        await createBatchMutation.mutateAsync(data);
      }

      if (shouldAddAnother && !isEditing) {
        // Keep some values for next batch
        setValue('recipeId', data.recipeId);
        setValue('plannedQuantity', data.plannedQuantity);
        setValue('leadBakerId', data.leadBakerId);
        toast.success('Batch created. Ready for next one.');
      } else {
        toast.success(isEditing ? 'Batch updated successfully' : 'Batch created successfully');
        onSuccess?.();
      }
    } catch {
      toast.error('Failed to save batch. Please try again.');
    }
  };

  const isLoading =
    createBatchMutation.isPending ||
    updateBatchMutation.isPending ||
    loadingRecipes ||
    loadingBakers ||
    loadingTemplates;

  const activeBakers = bakers.filter((b: any) => b.isActive);
  const availableAssistants = activeBakers.filter((b: any) => b.id !== watchedValues.leadBakerId);
  const selectedAssistantCount = watchedValues.assistantBakerIds?.length || 0;

  const currentStatus = watchedValues.status as BatchStatus;
  const statusConfig = STATUS_CONFIG[currentStatus];

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="flex flex-col min-h-[calc(100vh-80px)] sm:min-h-0 bg-background"
    >
      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 border-b bg-background sticky top-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 p-2 bg-primary rounded-lg">
            <Layers className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold text-foreground leading-none">
                {isEditing ? `Batch #${batch.batchNumber}` : 'New Production Batch'}
              </h2>
              {isEditing && statusConfig && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border',
                    statusConfig.color
                  )}
                >
                  <span className={cn('w-1.5 h-1.5 rounded-full', statusConfig.dot)} />
                  {statusConfig.label}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isEditing
                ? 'Update batch parameters, schedule, or personnel.'
                : 'Fill in the details below to schedule a new production run.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isEditing && (
            <Select
              value={watchedValues.status}
              onValueChange={v => setValue('status', v as BatchStatus, { shouldDirty: true })}
            >
              <SelectTrigger className="h-8 w-[150px] text-xs font-medium border-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(BatchStatus).map(s => {
                  const cfg = STATUS_CONFIG[s];
                  return (
                    <SelectItem key={s} value={s} className="text-xs">
                      <div className="flex items-center gap-2">
                        <span className={cn('w-2 h-2 rounded-full', cfg.dot)} />
                        {cfg.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground h-8 px-3 text-xs"
          >
            Cancel
          </Button>
          {!isEditing && (
            <Button
              type="submit"
              name="add-another"
              variant="outline"
              size="sm"
              disabled={isLoading || !isDirty}
              className="h-8 px-4 text-xs border-primary text-primary hover:bg-primary/5 font-medium transition-all"
            >
              Save & Add Another
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={isLoading || !isDirty}
            className="h-8 px-4 text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-medium transition-all active:scale-[0.98]"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5 mr-1.5" />
            )}
            {isEditing ? 'Save Changes' : 'Create Batch'}
          </Button>
        </div>
      </div>

      {/* ── BODY ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 flex-1 overflow-y-auto pb-20 sm:pb-0">
        {/* LEFT: Main fields */}
        <div className="lg:col-span-8 px-6 py-8 border-r border-slate-100">
          {/* ── STEP 1: Source ──────────────────────────────────────── */}
          <SectionHeader
            step={1}
            title="Source Material"
            description="Choose a recipe directly or apply a pre-configured template to auto-fill the form."
            icon={BookOpen}
          />
          <SourceSelector
            mode={sourceMode}
            onModeChange={setSourceMode}
            recipes={recipes}
            templates={templates}
            recipeId={watchedValues.recipeId}
            templateId={watchedValues.createdFromTemplateId}
            onRecipeChange={id => setValue('recipeId', id, { shouldDirty: true })}
            onTemplateChange={handleTemplateSelect}
          />

          <SectionDivider />

          {/* ── STEP 2: Quantity & Output ────────────────────────────── */}
          <SectionHeader
            step={2}
            title="Output Configuration"
            description="Set the production quantity, measurement unit, and where the finished goods will be stored."
            icon={Layers}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <FieldLabel
                required
                error={!!errors.plannedQuantity}
                hint="The number of units you plan to produce in this batch. Must be greater than 0."
              >
                Target Quantity
              </FieldLabel>
              <div className="flex shadow-sm rounded-lg overflow-hidden border border-input focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-1 transition-shadow">
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  {...register('plannedQuantity', { valueAsNumber: true })}
                  className={cn(
                    'rounded-none border-0 border-r shadow-none focus-visible:ring-0 bg-background',
                    errors.plannedQuantity && 'bg-destructive/5'
                  )}
                />
                <div className="min-w-[140px] border-0">
                  <AdvancedUnitSelector
                    value={watchedValues.systemUnitId || watchedValues.orgUnitId}
                    onValueChange={handleBatchUnitChange}
                    className="rounded-none border-0 shadow-none h-full"
                  />
                </div>
              </div>
              {errors.plannedQuantity && (
                <p className="text-xs text-destructive mt-1">{errors.plannedQuantity.message as string}</p>
              )}
            </div>

            <div>
              <FieldLabel hint="The storage area or shelf where completed goods will be placed after production.">
                <MapPin className="inline h-3.5 w-3.5 mr-1 text-muted-foreground" />
                Output Location
              </FieldLabel>
              <LocationSelect
                value={watchedValues.outputLocationId || ''}
                onValueChange={v => setValue('outputLocationId', v, { shouldDirty: true })}
              />
              <p className="text-xs text-muted-foreground mt-1">Optional — leave blank to assign later</p>
            </div>
          </div>

          <SectionDivider />

          {/* ── STEP 3: Production Log ───────────────────────────────── */}
          <SectionHeader
            step={3}
            title="Production Log"
            description="Document any internal notes. These are visible to kitchen staff during production."
            icon={FileText}
          />
          <div className="space-y-5">
            <div>
              <FieldLabel hint="Internal remarks such as quality flags, substitutions, or alerts for this batch only.">
                Quality & Batch Notes
              </FieldLabel>
              <Textarea
                {...register('notes')}
                placeholder="e.g. Oven 2 runs hot — reduce temp by 10°C. Check texture at 22 min."
                className="min-h-[130px] resize-none text-sm leading-relaxed"
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                <FieldLabel hint="Add keywords to categorize and search for this batch later.">Tags</FieldLabel>
              </div>
              <TagInput
                tags={watchedValues.tags || []}
                onChange={tags => setValue('tags', tags, { shouldDirty: true })}
                placeholder="e.g. rush-order, vip-client, gluten-free"
              />
            </div>
          </div>
        </div>

        {/* RIGHT: Sidebar */}
        <div className="lg:col-span-4 px-5 py-8 bg-muted/30 space-y-8">
          {/* ── Scheduling ──────────────────────────────────────────── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Schedule</h3>
            </div>

            <div className="space-y-4">
              <div>
                <FieldLabel hint="The date this batch is scheduled to begin production.">Production Date</FieldLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start font-normal bg-background h-10 text-sm border-input"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      {watchedValues.date ? format(watchedValues.date, 'PPP') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={watchedValues.date}
                      onSelect={d => setValue('date', d || new Date(), { shouldDirty: true })}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel hint="Time of day the batch should begin (24-hour format).">Start Time</FieldLabel>
                  <div className="relative">
                    <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input type="time" {...register('time')} className="pl-9 bg-background h-10 text-sm border-input" />
                  </div>
                </div>
                <div>
                  <FieldLabel hint="Estimated production time in minutes. Used for scheduling and capacity planning.">
                    Duration
                  </FieldLabel>
                  <div className="relative">
                    <Timer className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="number"
                      min={1}
                      placeholder="mins"
                      {...register('duration', { valueAsNumber: true })}
                      className="pl-9 bg-background h-10 text-sm border-input"
                    />
                  </div>
                </div>
              </div>

              <div>
                <FieldLabel hint="How many days the finished product remains sellable after production. Used for expiry labelling.">
                  Shelf Life (days)
                </FieldLabel>
                <Input
                  type="number"
                  min={1}
                  placeholder="e.g. 5"
                  {...register('shelfLifeDays', { valueAsNumber: true })}
                  className="bg-background h-10 text-sm border-input"
                />
              </div>
            </div>
          </div>

          {/* ── Personnel ────────────────────────────────────────────── */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ChefHat className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Personnel</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Assign the baker responsible and any supporting staff.</p>

            <div className="space-y-4">
              <div>
                <FieldLabel hint="The baker who leads and is accountable for this production batch.">
                  Lead Baker
                </FieldLabel>
                <Select
                  value={watchedValues.leadBakerId || ''}
                  onValueChange={v => setValue('leadBakerId', v, { shouldDirty: true })}
                >
                  <SelectTrigger className="bg-background h-10 text-sm border-input">
                    <SelectValue placeholder="Assign a lead baker…" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeBakers.map((b: any) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <FieldLabel hint="Additional bakers who will assist during this batch. The lead baker is excluded.">
                  <Users className="inline h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  Assistant Bakers
                  {selectedAssistantCount > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs font-medium py-0 h-4">
                      {selectedAssistantCount}
                    </Badge>
                  )}
                </FieldLabel>

                <div className="border border-input rounded-lg bg-background overflow-hidden">
                  {availableAssistants.length === 0 ? (
                    <div className="px-4 py-5 text-center">
                      <Users className="h-5 w-5 text-muted-foreground mx-auto mb-1.5" />
                      <p className="text-xs text-muted-foreground">
                        {watchedValues.leadBakerId
                          ? 'No other active bakers available.'
                          : 'Select a lead baker first.'}
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-[200px] overflow-y-auto divide-y divide-border">
                      {availableAssistants.map((baker: any) => {
                        const isSelected = watchedValues.assistantBakerIds?.includes(baker.id);
                        return (
                          <button
                            key={baker.id}
                            type="button"
                            onClick={() => toggleAssistantBaker(baker.id)}
                            className={cn(
                              'flex items-center gap-3 w-full px-4 py-2.5 text-left text-sm transition-colors',
                              isSelected ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent'
                            )}
                          >
                            <div
                              className={cn(
                                'flex h-4 w-4 items-center justify-center rounded border flex-shrink-0 transition-colors',
                                isSelected ? 'bg-primary-foreground border-primary-foreground' : 'border-input'
                              )}
                            >
                              {isSelected && <Check className="h-3 w-3 text-primary" />}
                            </div>
                            <span className="font-medium truncate">{baker.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER (mobile only) ───────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 flex items-center justify-end gap-3 px-6 py-4 border-t bg-background sm:hidden z-20">
        <Button type="button" variant="outline" onClick={onCancel} size="sm" className="flex-1">
          <Undo2 className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={isLoading || !isDirty}
          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {isEditing ? 'Save' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
