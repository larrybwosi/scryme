'use client';

import { memo, useEffect, useState } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@repo/ui/components/ui/sheet';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import { Textarea } from '@repo/ui/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/ui/tabs';
import { Recipe } from '@/types/bakery';
import { Save, Plus, Trash2, Loader2, Sparkles, AlertCircle, Cpu, FileText, Layers, Settings, Cloud } from 'lucide-react';
import { AdvancedUnitSelector } from '@/components/common/units/advance-select';
import {
  useCreateRecipe,
  useUpdateRecipe,
  useBakeryCategories,
  useListIngredients,
  useGenerateRecipeAi,
  useBakerySettings,
} from '@/hooks/bakery';
import { recipeSchema } from '@/validations/bakery';
import { ProductVariantsSelect } from '@/components/common/product-variant-select';
import { TagInput } from '@repo/ui/components/ui/tag-input';
import { Alert, AlertDescription, AlertTitle } from '@repo/ui/components/ui/alert';
import { toast } from 'sonner';
import { useFormattedCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface CreateEditRecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipe?: Recipe | null;
  mode: 'create' | 'edit';
  addAnother?: boolean;
}

function SelectSkeleton() {
  return <div className="h-9 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse"></div>;
}

function IngredientFormSkeleton() {
  return (
    <div className="grid grid-cols-[1fr_120px_140px_40px] gap-3 items-center p-2">
      <div className="h-9 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse"></div>
      <div className="h-9 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse"></div>
      <div className="h-9 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse"></div>
      <div className="h-9 w-9 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse"></div>
    </div>
  );
}

function FormSection({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800 first:border-0 first:pt-0">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-tight">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function CreateEditRecipeDialog({ open, onOpenChange, recipe, mode }: CreateEditRecipeDialogProps) {
  const formattedCurrency = useFormattedCurrency();
  const { data: categories, isLoading: loadingCategories } = useBakeryCategories();
  const { data: ingredients, isLoading: loadingIngredients } = useListIngredients();
  const { data: settings } = useBakerySettings();

  const [activeTab, setActiveTab] = useState('manual');
  const [aiPrompt, setAiPrompt] = useState('');

  const createRecipe = useCreateRecipe();
  const updateRecipe = useUpdateRecipe();
  const generateRecipeAi = useGenerateRecipeAi();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      name: '',
      categoryId: '',
      yieldQuantity: 1,
      systemUnitId: undefined,
      orgUnitId: undefined,
      ingredients: [],
      description: '',
      instructions: '',
      notes: '',
      tags: [],
      producesVariantId: '',
      prepTime: 0,
      bakeTime: 0,
      difficulty: 'MEDIUM',
    },
  });

  const { fields: ingredientFields, append, remove } = useFieldArray({
    control,
    name: 'ingredients',
  });

  const watchIngredients = useWatch({ control, name: 'ingredients' });
  const categoryId = useWatch({ control, name: 'categoryId' });
  const systemUnitId = useWatch({ control, name: 'systemUnitId' });
  const orgUnitId = useWatch({ control, name: 'orgUnitId' });
  const producesVariantId = useWatch({ control, name: 'producesVariantId' });
  const tags = useWatch({ control, name: 'tags' }) || [];
  const difficulty = useWatch({ control, name: 'difficulty' }) || 'MEDIUM';

  useEffect(() => {
    if (recipe && mode === 'edit') {
      reset({
        name: recipe.name,
        categoryId: recipe.categoryId || '',
        description: recipe.description || '',
        instructions: recipe.instructions || '',
        notes: recipe.notes || '',
        yieldQuantity: recipe.yieldQuantity,
        systemUnitId: (recipe.yieldUnit as any)?.id || recipe.yieldUnit,
        producesVariantId: recipe.producesVariantId,
        prepTime: recipe.prepTime || 0,
        bakeTime: recipe.bakeTime || 0,
        difficulty: recipe.difficulty || 'MEDIUM',
        tags: recipe.tags || [],
        ingredients: recipe.ingredients?.map(ing => ({
          ingredientVariantId: ing.ingredientVariantId,
          quantity: ing.quantity,
          systemUnitId: (ing.unit as any)?.id || ing.unit,
        })) || [],
      });
    } else {
      reset({
        name: '',
        categoryId: '',
        yieldQuantity: 1,
        ingredients: [],
        description: '',
        instructions: '',
        notes: '',
        tags: [],
        producesVariantId: '',
        prepTime: 0,
        bakeTime: 0,
        difficulty: 'MEDIUM',
      });
    }
  }, [recipe, mode, reset]);

  const onSubmit = async (data: any) => {
    try {
      if (mode === 'edit' && recipe) {
        await updateRecipe.mutateAsync({ id: recipe.id, ...data });
        toast.success('Recipe updated successfully');
      } else {
        await createRecipe.mutateAsync(data);
        toast.success('Recipe created successfully');
      }
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to save recipe');
    }
  };

  const handleGenerateRecipe = async () => {
    if (!aiPrompt.trim()) return;
    try {
      const generatedData = await generateRecipeAi.mutateAsync({ prompt: aiPrompt });
      if (generatedData) {
        reset(generatedData);
        setActiveTab('manual');
        toast.success('Recipe generated successfully! Please review the details.');
      }
    } catch (error) {
      // Error handled by mutation state
    }
  };

  const addIngredientRow = () => {
    append({ ingredientVariantId: '', quantity: 0, systemUnitId: '' });
  };

  const handleIngredientUnitChange = (index: number) => (value: string | undefined, type: 'system' | 'org') => {
    setValue(`ingredients.${index}.systemUnitId` as any, type === 'system' ? value : undefined);
    setValue(`ingredients.${index}.orgUnitId` as any, type === 'org' ? value : undefined);
  };

  const isGenerating = generateRecipeAi.isPending;
  const isSubmitting = createRecipe.isPending || updateRecipe.isPending;
  const ingredientErrors = errors.ingredients as any;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-4xl overflow-y-auto p-0 flex flex-col gap-0 border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
        <div className="flex-none p-6 space-y-1 bg-white dark:bg-slate-950 border-b">
          <SheetHeader>
            <SheetTitle className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tighter">
              {mode === 'create' ? 'PROVISION NEW FORMULA' : 'REVISE CONFIGURATION'}
            </SheetTitle>
            <SheetDescription className="text-sm font-medium text-slate-500 uppercase tracking-widest">
              {mode === 'create' ? 'Initialize new master recipe data' : `Updating ${recipe?.name}`}
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex-1 px-6 py-6 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-sm grid-cols-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl mb-6">
              <TabsTrigger
                value="manual"
                className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-primary"
              >
                <Settings className="h-3.5 w-3.5" />
                Standard Entry
              </TabsTrigger>
              <TabsTrigger
                value="ai"
                className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600"
              >
                <Sparkles className="h-3.5 w-3.5" />
                AI Assist
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ai" className="space-y-4">
              {!(settings as any)?.apiKey ? (
                <div className="flex flex-col items-center justify-center text-center p-8 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-sm">
                  <Cloud className="h-10 w-10 text-slate-300 mb-3" />
                  <h3 className="font-semibold text-slate-700">Cloud Sync Required</h3>
                  <p className="text-xs text-slate-500 max-w-xs mt-1">
                    AI recipe generation requires a connection to the Scryme server. Please configure your API key in Settings.
                  </p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => (window.location.href = "/settings")}>
                    Go to Settings
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-8 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-sm">
                  <div className="h-12 w-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full flex items-center justify-center mb-4">
                    <Cpu className="h-6 w-6" />
                  </div>
                  <div className="space-y-1 max-w-md mb-6">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">Recipe Copilot</h3>
                    <p className="text-sm text-slate-500">
                      Describe your product requirements. The AI will automatically provision ingredients from your
                      existing master data.
                    </p>
                  </div>

                  {generateRecipeAi.isError && (
                    <Alert variant="destructive" className="max-w-lg text-left mb-6">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Generation Failed</AlertTitle>
                      <AlertDescription>
                        {(generateRecipeAi.error as any)?.response?.data?.error ||
                          'Failed to process request. Please refine your prompt.'}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="w-full max-w-xl space-y-4">
                    <Textarea
                      placeholder="e.g. 'Standard sourdough boule, yielding 10 units, using high-hydration technique...'"
                      className="min-h-[140px] resize-none text-sm bg-slate-50 dark:bg-slate-950 border-slate-200"
                      value={aiPrompt}
                      onChange={e => setAiPrompt(e.target.value)}
                      disabled={isGenerating}
                    />
                    <Button
                      onClick={handleGenerateRecipe}
                      disabled={isGenerating || !aiPrompt.trim()}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing Requirements...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" /> Generate Configuration
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="manual">
              <form
                id="recipe-form"
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-8 bg-white dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
              >
                <FormSection title="Core Information" icon={FileText}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-xs font-medium text-slate-500 uppercase">
                        Recipe Name *
                      </Label>
                      <Input
                        id="name"
                        {...register('name')}
                        placeholder="Enter recipe code or name"
                        disabled={isSubmitting}
                        className="h-9"
                      />
                      {errors.name && <p className="text-xs text-red-500">{(errors.name as any).message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="categoryId" className="text-xs font-medium text-slate-500 uppercase">
                        Category *
                      </Label>
                      {loadingCategories ? (
                        <SelectSkeleton />
                      ) : (
                        <Select
                          value={categoryId}
                          onValueChange={value => setValue('categoryId', value)}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger className={cn('h-9', errors.categoryId && 'border-red-500')}>
                            <SelectValue placeholder="Select classification" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories?.map(category => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {errors.categoryId && <p className="text-xs text-red-500">{(errors.categoryId as any).message}</p>}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="description" className="text-xs font-medium text-slate-500 uppercase">
                      Formula Description
                    </Label>
                    <Textarea
                      id="description"
                      {...register('description')}
                      placeholder="Brief overview of the product or process..."
                      rows={2}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-slate-500 uppercase">Yield Output *</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          {...register('yieldQuantity', { valueAsNumber: true })}
                          placeholder="Qty"
                          className="w-24 h-9"
                          disabled={isSubmitting}
                        />
                        <div className="flex-1">
                          <AdvancedUnitSelector
                            value={systemUnitId || orgUnitId || undefined}
                            onValueChange={(val, type) => {
                              setValue('systemUnitId', type === 'system' ? val : undefined);
                              setValue('orgUnitId', type === 'org' ? val : undefined);
                            }}
                            disabled={isSubmitting}
                            placeholder="Unit"
                          />
                        </div>
                      </div>
                      {(errors.yieldQuantity || errors.systemUnitId) && (
                        <p className="text-xs text-red-500">Output quantity and unit are required</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-slate-500 uppercase">Produces Product Variant *</Label>
                      <ProductVariantsSelect
                        value={producesVariantId}
                        onValueChange={val => setValue('producesVariantId', val)}
                        disabled={isSubmitting}
                        placeholder="Link to inventory item"
                      />
                      {errors.producesVariantId && (
                        <p className="text-xs text-red-500">Must link to an inventory variant</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-500 uppercase">Search Tags</Label>
                    <TagInput
                      tags={tags}
                      onChange={tags => setValue('tags', tags)}
                      placeholder="Add searchable labels"
                    />
                  </div>
                </FormSection>

                <FormSection title="Technical Parameters" icon={Settings}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-slate-500 uppercase">Prep Time (min)</Label>
                      <Input
                        type="number"
                        {...register('prepTime', { valueAsNumber: true })}
                        disabled={isSubmitting}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-slate-500 uppercase">Bake Time (min)</Label>
                      <Input
                        type="number"
                        {...register('bakeTime', { valueAsNumber: true })}
                        disabled={isSubmitting}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-slate-500 uppercase">Complexity</Label>
                      <Select
                        value={difficulty}
                        onValueChange={value => setValue('difficulty', value as any)}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select complexity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EASY">Level 1 - Easy</SelectItem>
                          <SelectItem value="MEDIUM">Level 2 - Medium</SelectItem>
                          <SelectItem value="HARD">Level 3 - Complex</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </FormSection>

                <FormSection title="Bill of Materials (BOM)" icon={Layers}>
                  <div className="rounded-md border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 grid grid-cols-[1fr_120px_140px_40px] gap-3 px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <div>Material Component</div>
                      <div>Requirement</div>
                      <div>UOM</div>
                      <div></div>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {loadingIngredients ? (
                        <>
                          <IngredientFormSkeleton />
                          <IngredientFormSkeleton />
                        </>
                      ) : (
                        <>
                          {ingredientFields.map((field, index) => {
                            const currentIng = watchIngredients?.[index];
                            const ingUnitValue = currentIng?.systemUnitId || currentIng?.orgUnitId;

                            return (
                              <div
                                key={field.id}
                                className="grid grid-cols-[1fr_120px_140px_40px] gap-3 items-start px-3 py-2 bg-white dark:bg-slate-950"
                              >
                                <div>
                                  <Select
                                    value={currentIng?.ingredientVariantId || ''}
                                    onValueChange={value => setValue(`ingredients.${index}.ingredientVariantId` as any, value)}
                                    disabled={isSubmitting}
                                  >
                                    <SelectTrigger
                                      className={cn(
                                        'h-9',
                                        ingredientErrors?.[index] && 'border-red-500'
                                      )}
                                    >
                                      <SelectValue placeholder="Select material" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {ingredients?.map(ing => (
                                        <SelectItem key={ing.id} value={ing.id}>
                                          {ing.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    {...register(`ingredients.${index}.quantity` as any, { valueAsNumber: true })}
                                    disabled={isSubmitting}
                                    className={cn(
                                      'h-9 text-right tabular-nums',
                                      ingredientErrors?.[index] && 'border-red-500'
                                    )}
                                  />
                                </div>

                                <div>
                                  <AdvancedUnitSelector
                                    value={ingUnitValue || undefined}
                                    onValueChange={handleIngredientUnitChange(index)}
                                    disabled={isSubmitting}
                                    placeholder="Unit"
                                  />
                                </div>

                                <div className="flex items-center justify-center pt-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => remove(index)}
                                    disabled={isSubmitting}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}

                          {ingredientFields.length === 0 && (
                            <div className="py-8 text-center text-sm text-slate-500 bg-slate-50/50 dark:bg-slate-900/20">
                              No materials configured for this recipe.
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addIngredientRow}
                    disabled={isSubmitting}
                    className="border-dashed border-slate-300 text-slate-600 w-full sm:w-auto mt-2"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Material Line
                  </Button>
                </FormSection>

                <FormSection title="Standard Operating Procedure (SOP)" icon={FileText}>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="instructions" className="text-xs font-medium text-slate-500 uppercase">
                        Execution Steps
                      </Label>
                      <Textarea
                        id="instructions"
                        {...register('instructions')}
                        placeholder="1. Step one..."
                        rows={5}
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="notes" className="text-xs font-medium text-slate-500 uppercase">
                        Quality Notes
                      </Label>
                      <Textarea
                        id="notes"
                        {...register('notes')}
                        placeholder="Tolerances, QC steps, or internal routing notes"
                        disabled={isSubmitting}
                        rows={3}
                      />
                    </div>
                  </div>
                </FormSection>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex-none flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="recipe-form"
            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
            disabled={isSubmitting || activeTab === 'ai'}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Committing...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" /> {mode === 'create' ? 'Create Configuration' : 'Update Configuration'}
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default memo(CreateEditRecipeDialog);
