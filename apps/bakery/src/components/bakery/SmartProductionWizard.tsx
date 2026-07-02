'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import { Badge } from '@repo/ui/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/ui/select';
import {
  ChevronRight,
  ChevronLeft,
  Check,
  AlertTriangle,
  Clock,
  Package,
  TrendingUp,
  Loader2,
  CheckCircle2,
  X,
  Search,
  Layers,
  Zap,
  BarChart2,
  User,
  Calendar,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { cn, useFormattedCurrency } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { isValid } from 'date-fns';
import { Recipe } from '@/types/bakery';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  product: { name: string };
  baseUnit: { name: string; symbol: string };
  retailPrice: number;
  wholesalePrice: number;
}

// interface Recipe {
//   id: string;
//   name: string;
//   yieldQuantity: number;
//   yieldUnit?: { name: string; symbol: string };
//   producesVariant?: ProductVariant;
//   ingredients: Array<{
//     quantity: number;
//     conversionFactor?: number; // ✅ Add this
//     unit?: { name: string; symbol: string };
//     ingredientVariant?: {
//       id: string;
//       name: string;
//       product?: { name: string };
//       buyingPrice: number;
//       baseUnit?: { name: string; symbol: string }; // ✅ Add this too
//     };
//     ingredientVariantId?: string;
//     name?: string;
//     buyingPrice?: number;
//   }>;
//   prepTime?: number;
//   bakeTime?: number;
//   totalTime?: number;
// }

interface InventoryItem {
  variantId?: string;
  totalQuantity?: number;
  currentStock?: number;
  unit?: { name?: string; symbol?: string } | string;
  ingredientId?: string;
  id?: string;
}

interface BatchCalculation {
  recipeId: string;
  recipeName: string;
  quantity: number;
  multiplier: number;
  materials: Array<{
    variantId: string;
    variantName: string;
    productName: string;
    required: number;
    available: number;
    unit: string;
    availableUnit: string;
    sufficient: boolean;
    cost: number;
  }>;
  totalCost: number;
  estimatedRevenue: number;
  estimatedProfit: number;
  estimatedMargin: number;
  totalTime: number;
  canProduce: boolean;
}

interface WizardProps {
  recipes: Recipe[];
  inventory: InventoryItem[];
  bakers?: any[];
  onCreateBatch: (calculation: BatchCalculation & { scheduledDate?: Date; leadBakerId?: string; assistantBakerIds?: string[] }) => Promise<void>;
  onClose: () => void;
}

// ─── Step config ──────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Select Master Recipe', icon: FileText },
  { id: 2, label: 'Bill of Materials', icon: Layers },
  { id: 3, label: 'Execution Plan', icon: CheckCircle2 },
];

// ─── Stat Card ────────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  subtext,
  positive,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  positive?: boolean;
}) {
  return (
    <div className="flex flex-col rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 shadow-sm">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      <div className="mt-1 flex items-baseline gap-2">
        <span
          className={cn(
            'text-xl font-semibold tracking-tight tabular-nums',
            positive === true && 'text-emerald-600 dark:text-emerald-500',
            positive === false && 'text-red-600 dark:text-red-500',
            positive === undefined && 'text-slate-900 dark:text-slate-50'
          )}
        >
          {value}
        </span>
      </div>
      {subtext && <span className="mt-1 text-xs text-slate-400">{subtext}</span>}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SmartProductionWizard({ recipes, inventory, bakers = [], onCreateBatch, onClose }: WizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date>(new Date());
  const [selectedLeadBakerId, setSelectedLeadBakerId] = useState<string>('');
  const [selectedAssistantBakerIds, setSelectedAssistantBakerIds] = useState<string[]>([]);
  const formatCurrency = useFormattedCurrency()

  // ── Inventory map ────────────────────────────────────────────────────────────
  const inventoryMap = useMemo(() => {
    const map = new Map<string, InventoryItem>();
    inventory.forEach(item => {
      const key = item.ingredientId || item.id || item.variantId;
      if (key) map.set(key, item);
    });
    return map;
  }, [inventory]);

  // ── Batch calculation ─────────────────────────────────────────────────────────
  const batchCalculation = useMemo<BatchCalculation | null>(() => {
    if (!selectedRecipe || quantity <= 0) return null;

    const multiplier = quantity / (Number(selectedRecipe.yieldQuantity) || 1);
    const materials = (selectedRecipe.ingredients || []).map(ing => {
      const recipeRequired = Number(ing.quantity) * multiplier;
      const ingredientId = ing.ingredientVariant?.id || ing.ingredientVariantId || '';
      const inventoryItem = ingredientId ? inventoryMap.get(ingredientId) : undefined;

      // Inventory is usually tracked in Base Units (e.g., kg)
      const available = Number(inventoryItem?.currentStock || inventoryItem?.totalQuantity || 0);
      const availableUnit = ing.ingredientVariant?.baseUnit?.symbol || 'units';

      // Normalize required quantity to Base Unit for comparison
      // e.g., 200g * 0.001 = 0.2kg
      const factor = ing.conversionFactor ?? 1;
      const requiredInBaseUnit = recipeRequired * factor;

      // Proper comparison: 80kg >= 0.2kg
      const sufficient = available >= requiredInBaseUnit;
      const cost = requiredInBaseUnit * Number(ing.ingredientVariant?.buyingPrice || ing.buyingPrice || 0);

      return {
        variantId: ingredientId,
        variantName: ing.ingredientVariant?.name || ing.name || 'Unknown',
        productName: ing.ingredientVariant?.product?.name || ing.name || 'Unknown Product',
        required: recipeRequired, // Display in recipe units (200)
        available, // Display in base units (80)
        unit: ing.unit?.symbol || 'units',
        availableUnit, // New field for display
        sufficient,
        cost,
      };
    });

    const totalCost = materials.reduce((sum, m) => sum + m.cost, 0);
    const unitRevenue = Number(selectedRecipe.producesVariant?.retailPrice || 0);
    const estimatedRevenue = quantity * unitRevenue;
    const estimatedProfit = estimatedRevenue - totalCost;
    const estimatedMargin = estimatedRevenue > 0 ? (estimatedProfit / estimatedRevenue) * 100 : 0;
    const canProduce = materials.every(m => m.sufficient);
    const totalTime = (selectedRecipe.totalTime || 0) * Math.ceil(multiplier);

    return {
      recipeId: selectedRecipe.id,
      recipeName: selectedRecipe.name,
      quantity,
      multiplier,
      materials,
      totalCost,
      estimatedRevenue,
      estimatedProfit,
      estimatedMargin,
      totalTime,
      canProduce,
    };
  }, [selectedRecipe, quantity, inventoryMap]);

  // ── Filtered recipes ──────────────────────────────────────────────────────────
  const filteredRecipes = useMemo(() => {
    if (!searchTerm) return recipes;
    const term = searchTerm.toLowerCase();
    return recipes.filter(
      r =>
        r.name.toLowerCase().includes(term) ||
        r.producesVariant?.name?.toLowerCase().includes(term) ||
        r.producesVariant?.product?.name?.toLowerCase().includes(term)
    );
  }, [recipes, searchTerm]);

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const handleNext = () => currentStep < STEPS.length && setCurrentStep(s => s + 1);
  const handleBack = () => currentStep > 1 && setCurrentStep(s => s - 1);

  const handleSubmit = async () => {
    if (!batchCalculation?.canProduce) return;
    setIsSubmitting(true);
    try {
      await onCreateBatch({
        ...batchCalculation,
        scheduledDate,
        leadBakerId: selectedLeadBakerId,
        assistantBakerIds: selectedAssistantBakerIds,
      });
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  const suggestOptimalQuantity = () => {
    if (!selectedRecipe) return;
    const limitingFactors = selectedRecipe.ingredients.map(ing => {
      const id = ing.ingredientVariant?.id || ing.ingredientVariantId || '';
      const inv = id ? inventoryMap.get(id) : undefined;
      const available = Number(inv?.currentStock || inv?.totalQuantity || 0);
      const factor = ing.conversionFactor ?? 1;
      const requiredPerYieldUnit = (Number(ing.quantity) * factor) / Number(selectedRecipe.yieldQuantity);
      if (requiredPerYieldUnit <= 0) return Infinity;
      return available / requiredPerYieldUnit;
    });
    setQuantity(Math.max(0, Math.floor(Math.min(...limitingFactors))));
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl"
      >
        {/* ── Header & Stepper ── */}
        <div className="flex-none border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-6 py-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 tracking-tight">
                New Production Run
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Configure recipes, verify inventory, and schedule batches.
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Enterprise Stepper */}
          <div className="flex items-center w-full max-w-2xl">
            {STEPS.map((step, idx) => {
              const isActive = currentStep === step.id;
              const isPast = currentStep > step.id;
              return (
                <div key={step.id} className="flex items-center relative flex-1 last:flex-none">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors',
                        isActive
                          ? 'border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500'
                          : isPast
                            ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-50 dark:bg-slate-50 dark:text-slate-900'
                            : 'border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-900'
                      )}
                    >
                      {isPast ? <Check className="h-4 w-4" /> : step.id}
                    </div>
                    <span
                      className={cn(
                        'text-sm font-medium whitespace-nowrap',
                        isActive
                          ? 'text-blue-600 dark:text-blue-500'
                          : isPast
                            ? 'text-slate-900 dark:text-slate-50'
                            : 'text-slate-400'
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div
                      className={cn(
                        'h-px flex-1 mx-4',
                        isPast ? 'bg-slate-900 dark:bg-slate-50' : 'bg-slate-200 dark:bg-slate-800'
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Content Area ── */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-950 p-6">
          <AnimatePresence mode="wait">
            {/* ─────────── STEP 1: RECIPE SELECTION ─────────── */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search recipes, products, or SKUs..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="h-9 pl-9 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm"
                    />
                  </div>
                  <span className="text-sm text-slate-500">{filteredRecipes.length} records found</span>
                </div>

                {/* Data Table Approach for Step 1 */}
                <div className="rounded-md border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-3 font-medium">Recipe Code / Name</th>
                        <th className="px-4 py-3 font-medium">Target Product</th>
                        <th className="px-4 py-3 font-medium text-right">Standard Yield</th>
                        <th className="px-4 py-3 font-medium text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {filteredRecipes.map(recipe => {
                        const variant = recipe.producesVariant;
                        const isSelected = selectedRecipe?.id === recipe.id;
                        const allAvailable = (recipe.ingredients || []).every(ing => {
                          const id = ing.ingredientVariant?.id || ing.ingredientVariantId || '';
                          const inv = id ? inventoryMap.get(id) : undefined;
                          const available = Number(inv?.currentStock || inv?.totalQuantity || 0);
                          const factor = ing.conversionFactor ?? 1; // ✅ apply factor
                          const requiredInBaseUnit = Number(ing.quantity) * factor;
                          return available >= requiredInBaseUnit;
                        });

                        return (
                          <tr
                            key={recipe.id}
                            onClick={() => {
                              setSelectedRecipe(recipe);
                              setQuantity(recipe.yieldQuantity);
                            }}
                            className={cn(
                              'cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50',
                              isSelected ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'bg-white dark:bg-slate-950'
                            )}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div
                                  className={cn(
                                    'w-4 h-4 rounded-full border flex items-center justify-center shrink-0',
                                    isSelected
                                      ? 'border-blue-600 bg-blue-600'
                                      : 'border-slate-300 dark:border-slate-700'
                                  )}
                                >
                                  {isSelected && <Check className="h-3 w-3 text-white" />}
                                </div>
                                <div>
                                  <p className="font-medium text-slate-900 dark:text-slate-100">{recipe.name}</p>
                                  <p className="text-xs text-slate-500 font-mono mt-0.5">{variant?.sku || 'NO-SKU'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                              {variant?.product?.name || '—'}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                              {recipe.yieldQuantity} {typeof recipe.yieldUnit === 'object' ? recipe.yieldUnit?.symbol : recipe.yieldUnit}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {allAvailable ? (
                                <Badge
                                  variant="outline"
                                  className="border-emerald-200 text-emerald-700 bg-emerald-50 font-normal hover:bg-emerald-50"
                                >
                                  In Stock
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="border-amber-200 text-amber-700 bg-amber-50 font-normal hover:bg-amber-50"
                                >
                                  Low Stock
                                </Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {filteredRecipes.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-12 text-center text-slate-500">
                            No matching recipes found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* ─────────── STEP 2: BILL OF MATERIALS ─────────── */}
            {currentStep === 2 && selectedRecipe && batchCalculation && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Configuration Row */}
                <div className="flex flex-col sm:flex-row sm:items-end gap-4 p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                  <div className="flex-1">
                    <Label className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2 block">
                      Target Production Quantity
                    </Label>
                    <div className="flex items-center gap-3">
                      <div className="relative w-48">
                        <Input
                          type="number"
                          value={quantity}
                          onChange={e => setQuantity(Math.max(0, Number(e.target.value)))}
                          className="h-10 text-lg font-semibold tabular-nums pr-12"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                          {(typeof selectedRecipe.yieldUnit === 'object' ? selectedRecipe.yieldUnit?.symbol : selectedRecipe.yieldUnit) || 'u'}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        onClick={suggestOptimalQuantity}
                        className="h-10 border-slate-300 text-slate-700 hover:bg-slate-100"
                      >
                        <Zap className="h-4 w-4 mr-2 text-blue-600" />
                        Calc Max Yield
                      </Button>
                    </div>
                  </div>
                  <div className="text-right border-l border-slate-200 dark:border-slate-800 pl-4 hidden sm:block">
                    <p className="text-xs text-slate-500 mb-1">Batch Multiplier</p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                      {batchCalculation.multiplier.toFixed(2)}x
                    </p>
                  </div>
                </div>

                {/* BOM Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Bill of Materials (BOM)
                    </h3>
                    {!batchCalculation.canProduce && (
                      <span className="text-xs font-medium text-red-600 flex items-center gap-1.5">
                        <AlertCircle className="h-4 w-4" /> Shortages detected
                      </span>
                    )}
                  </div>
                  <div className="rounded-md border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="px-4 py-3 font-medium">Material Component</th>
                          <th className="px-4 py-3 font-medium text-right">Required Amt</th>
                          <th className="px-4 py-3 font-medium text-right">Available Stock</th>
                          <th className="px-4 py-3 font-medium text-center w-24">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
                        {batchCalculation.materials.map(mat => (
                          <tr key={mat.variantId} className={cn(!mat.sufficient && 'bg-red-50/50 dark:bg-red-900/10')}>
                            <td className="px-4 py-3">
                              <p className="font-medium text-slate-900 dark:text-slate-100">{mat.productName}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{mat.variantName}</p>
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums text-slate-900 dark:text-slate-100 font-medium">
                              {mat.required.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{' '}
                              <span className="text-slate-400 font-normal">{mat.unit}</span>
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                              {mat.available.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{' '}
                              <span className="text-slate-400">{mat.availableUnit}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {mat.sufficient ? (
                                <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                              ) : (
                                <Badge
                                  variant="destructive"
                                  className="bg-red-100 text-red-700 hover:bg-red-100 border-none rounded-sm font-semibold px-2"
                                >
                                  Short
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─────────── STEP 3: EXECUTION PLAN ─────────── */}
            {currentStep === 3 && batchCalculation && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {!batchCalculation.canProduce && (
                  <div className="flex items-center gap-3 p-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <div>
                      <h4 className="text-sm font-semibold text-red-800 dark:text-red-300">Production Blocked</h4>
                      <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">
                        Inventory shortages must be resolved before scheduling this run.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Left Column: Forms */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 border-b pb-2">
                        Schedule & Assignment
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-slate-500">Launch Date</Label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                              type="date"
                              className="pl-9 h-9 text-sm border-slate-200"
                              value={isValid(scheduledDate) ? scheduledDate.toISOString().split('T')[0] : ''}
                              onChange={e => {
                                const d = new Date(e.target.value);
                                if (isValid(d)) setScheduledDate(d);
                              }}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-slate-500">Lead Baker</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
                            <Select
                              value={selectedLeadBakerId}
                              onValueChange={val => {
                                setSelectedLeadBakerId(val);
                                // Remove from assistants if selected as lead
                                if (val) {
                                  setSelectedAssistantBakerIds(prev => prev.filter(id => id !== val));
                                }
                              }}
                            >
                              <SelectTrigger className="h-9 pl-9">
                                <SelectValue placeholder="Default/Auto-assign" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Default/Auto-assign</SelectItem>
                                {bakers.map(b => (
                                  <SelectItem key={b.id} value={b.id}>
                                    {b.name || 'Unknown Operator'}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        <Label className="text-xs font-medium text-slate-500">Assistant Bakers</Label>
                        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border rounded-md border-slate-200 dark:border-slate-800">
                          {bakers.filter(b => b.id !== selectedLeadBakerId).map(b => (
                            <label key={b.id} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 p-1 rounded">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                                checked={selectedAssistantBakerIds.includes(b.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedAssistantBakerIds(prev => [...prev, b.id]);
                                  } else {
                                    setSelectedAssistantBakerIds(prev => prev.filter(id => id !== b.id));
                                  }
                                }}
                              />
                              <span className="truncate">{b.name}</span>
                            </label>
                          ))}
                          {bakers.filter(b => b.id !== selectedLeadBakerId).length === 0 && (
                            <span className="text-xs text-slate-400 col-span-2 italic">No other active bakers available.</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 border-b pb-2">
                        Financial Projections
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <MetricCard label="Estimated Cost" value={`${formatCurrency(batchCalculation.totalCost)}`} />
                        <MetricCard
                          label="Projected Revenue"
                          value={`${formatCurrency(batchCalculation.estimatedRevenue)}`}
                        />
                        <MetricCard
                          label="Gross Profit"
                          value={`${formatCurrency(batchCalculation.estimatedProfit)}`}
                          positive={batchCalculation.estimatedProfit >= 0}
                        />
                        <MetricCard
                          label="Profit Margin"
                          value={`${batchCalculation.estimatedMargin.toFixed(1)}%`}
                          positive={batchCalculation.estimatedMargin >= 0}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Run Summary */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 border-b pb-2">
                      Run Summary
                    </h3>
                    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 p-4">
                      <dl className="space-y-4 text-sm">
                        <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                          <dt className="text-slate-500">Target Product</dt>
                          <dd className="font-medium text-slate-900 dark:text-slate-100 text-right">
                            {selectedRecipe?.producesVariant?.product?.name || '—'}
                            <div className="text-xs text-slate-400 font-normal">
                              {selectedRecipe?.producesVariant?.sku}
                            </div>
                          </dd>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                          <dt className="text-slate-500">Master Recipe</dt>
                          <dd className="font-medium text-slate-900 dark:text-slate-100 text-right">
                            {selectedRecipe?.name || '—'}
                          </dd>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                          <dt className="text-slate-500">Production Volume</dt>
                          <dd className="font-medium text-slate-900 dark:text-slate-100 text-right">
                            {quantity} {(typeof selectedRecipe?.yieldUnit === 'object' ? selectedRecipe?.yieldUnit?.symbol : selectedRecipe?.yieldUnit) || 'units'}
                          </dd>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                          <dt className="text-slate-500">BOM Line Items</dt>
                          <dd className="font-medium text-slate-900 dark:text-slate-100 text-right">
                            {batchCalculation.materials.length}
                          </dd>
                        </div>
                        <div className="flex justify-between pt-1">
                          <dt className="text-slate-500">Est. Processing Time</dt>
                          <dd className="font-medium text-slate-900 dark:text-slate-100 text-right flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            {batchCalculation.totalTime} min
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Footer / Actions $ ── */}
        <div className="flex-none border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-6 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={currentStep === 1 ? onClose : handleBack}
            disabled={isSubmitting}
            className="text-slate-600 hover:text-slate-900"
          >
            {currentStep === 1 ? (
              'Cancel'
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" /> Previous Step
              </>
            )}
          </Button>

          {currentStep < STEPS.length ? (
            <Button
              onClick={handleNext}
              disabled={currentStep === 1 && !selectedRecipe}
              className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
            >
              Next Step <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!batchCalculation?.canProduce || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Committing Run...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" /> Schedule Production Run
                </>
              )}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
