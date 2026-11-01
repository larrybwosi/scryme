'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FormattedBatch,
  Recipe,
  ProductionStage,
  StageTimer,
  TemperatureLog,
  IngredientLotTrace,
  ProductionExecutionState,
  WasteReasonCode,
} from '@/types/bakery';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import { Badge } from '@repo/ui/components/ui/badge';
import { Checkbox } from '@repo/ui/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/ui/dialog';
import {
  Play,
  Pause,
  RotateCcw,
  Thermometer,
  Scale,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Snowflake,
  ClipboardCheck,
  ChevronRight,
  ChevronLeft,
  X,
  PackageCheck,
  Tag,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateBakersPercentages } from './ProductionTicket';

export interface ProductionWorkstationProps {
  batch: FormattedBatch;
  recipe?: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
  onCompleteBatch?: (batch: FormattedBatch) => void;
  onSaveExecutionState?: (batchId: string, state: ProductionExecutionState) => void;
}

export const STAGE_CONFIG: Record<
  ProductionStage,
  {
    stepNumber: number;
    title: string;
    description: string;
    icon: React.ElementType;
    defaultSteps: { id: string; label: string }[];
    hasTimer?: boolean;
    defaultTimerMinutes?: number;
    hasTemperatureLog?: boolean;
    defaultTempType?: 'OVEN' | 'CORE_INTERNAL' | 'AMBIENT' | 'DOUGH';
  }
> = {
  [ProductionStage.SCALING_PREP]: {
    stepNumber: 1,
    title: 'Scaling & Prep',
    description: 'Scale dry and liquid ingredients accurately. Verify lot tracking numbers.',
    icon: Scale,
    defaultSteps: [
      { id: 'scale_dry', label: 'Weigh and sift all dry flours and leaveners' },
      { id: 'scale_wet', label: 'Measure liquids and temperature check water' },
      { id: 'verify_lots', label: 'Record supplier lot/batch numbers for raw materials' },
    ],
  },
  [ProductionStage.MIXING]: {
    stepNumber: 2,
    title: 'Mixing & Hydration',
    description: 'Incorporate ingredients and develop gluten structure.',
    icon: RotateCcw,
    defaultSteps: [
      { id: 'mix_autolyse', label: 'Combine flour and water for initial hydration (autolyse)' },
      { id: 'mix_salt_yeast', label: 'Add salt, yeast/starter, and mix to target gluten window' },
      { id: 'mix_temp', label: 'Verify final desired dough temperature (DDT)' },
    ],
    hasTemperatureLog: true,
    defaultTempType: 'DOUGH',
  },
  [ProductionStage.PROOFING]: {
    stepNumber: 3,
    title: 'Proofing & Fermentation',
    description: 'Control fermentation temperature and monitor dough expansion.',
    icon: Clock,
    defaultSteps: [
      { id: 'proof_bulk', label: 'Bulk fermentation with scheduled stretch and folds' },
      { id: 'proof_shape', label: 'Divide, pre-shape, and bench rest dough pieces' },
      { id: 'proof_final', label: 'Final shape and transfer to proofing baskets/pans' },
    ],
    hasTimer: true,
    defaultTimerMinutes: 45,
    hasTemperatureLog: true,
    defaultTempType: 'AMBIENT',
  },
  [ProductionStage.BAKING]: {
    stepNumber: 4,
    title: 'Baking (Oven)',
    description: 'Bake at target temperature with steam injection.',
    icon: Flame,
    defaultSteps: [
      { id: 'oven_preheat', label: 'Confirm oven preheated to recipe target temperature' },
      { id: 'oven_score', label: 'Score loaves and load into deck with initial steam injection' },
      { id: 'oven_vent', label: 'Vent steam for final crust color and gelatinization' },
    ],
    hasTimer: true,
    defaultTimerMinutes: 25,
    hasTemperatureLog: true,
    defaultTempType: 'OVEN',
  },
  [ProductionStage.COOLING]: {
    stepNumber: 5,
    title: 'Cooling & Rest',
    description: 'Allow internal moisture distribution and core temperature drop.',
    icon: Snowflake,
    defaultSteps: [
      { id: 'cool_racks', label: 'Transfer baked products onto open wire cooling racks' },
      { id: 'cool_temp', label: 'Verify core internal temperature falls below 35°C before packaging' },
    ],
    hasTemperatureLog: true,
    defaultTempType: 'CORE_INTERNAL',
  },
  [ProductionStage.QUALITY_AUDIT]: {
    stepNumber: 6,
    title: 'Quality Audit & Yield',
    description: 'Audit crust, crumb structure, record sellable yield and defects.',
    icon: ClipboardCheck,
    defaultSteps: [
      { id: 'audit_visual', label: 'Visual audit: crust color, blister, expansion & shape' },
      { id: 'audit_weight', label: 'Random sample weight verification against planned tolerance' },
      { id: 'audit_defects', label: 'Segregate rejects and log standardized waste reason code' },
    ],
  },
};

export const STAGE_ORDER: ProductionStage[] = [
  ProductionStage.SCALING_PREP,
  ProductionStage.MIXING,
  ProductionStage.PROOFING,
  ProductionStage.BAKING,
  ProductionStage.COOLING,
  ProductionStage.QUALITY_AUDIT,
];

export function ProductionWorkstation({
  batch,
  recipe,
  isOpen,
  onClose,
  onCompleteBatch,
  onSaveExecutionState,
}: ProductionWorkstationProps) {
  const activeRecipe = recipe || batch.recipe;
  const multiplier = Number(batch.recipeMultiplier || 1);

  const initialIngredients = useMemo(() => {
    const list =
      (activeRecipe as any)?.ingredients ||
      (batch as any)?.ingredients ||
      [];
    const { rows } = calculateBakersPercentages(list, multiplier);
    return rows.map((r) => ({
      ingredientVariantId: r.id,
      ingredientName: r.name,
      requiredQuantity: r.scaledQuantity,
      consumedQuantity: r.scaledQuantity,
      unitSymbol: r.unitSymbol,
      lotNumber: '',
      supplierBatchNumber: '',
      verified: false,
    }));
  }, [activeRecipe, batch, multiplier]);

  // Execution state
  const [currentStage, setCurrentStage] = useState<ProductionStage>(
    batch.executionState?.currentStage || ProductionStage.SCALING_PREP
  );
  const [completedStages, setCompletedStages] = useState<ProductionStage[]>(
    batch.executionState?.stagesCompleted || []
  );
  const [stepChecklist, setStepChecklist] = useState<Record<string, boolean>>(
    batch.executionState?.stageSteps || {}
  );
  const [temperatureLogs, setTemperatureLogs] = useState<TemperatureLog[]>(
    batch.executionState?.temperatureLogs || []
  );
  const [ingredientLots, setIngredientLots] = useState<IngredientLotTrace[]>(
    batch.executionState?.ingredientLots && batch.executionState.ingredientLots.length > 0
      ? batch.executionState.ingredientLots
      : initialIngredients
  );

  // Timers state
  const [timers, setTimers] = useState<Record<string, StageTimer>>(() => {
    if (batch.executionState?.timers) return batch.executionState.timers;

    const initial: Record<string, StageTimer> = {};
    const bakeTime = (activeRecipe as any)?.bakeTime || 25;

    initial[ProductionStage.PROOFING] = {
      id: `timer_${ProductionStage.PROOFING}`,
      stage: ProductionStage.PROOFING,
      label: 'Proofing & Fermentation Timer',
      durationMinutes: 45,
      remainingSeconds: 45 * 60,
      isRunning: false,
    };

    initial[ProductionStage.BAKING] = {
      id: `timer_${ProductionStage.BAKING}`,
      stage: ProductionStage.BAKING,
      label: 'Oven Bake Timer',
      durationMinutes: Number(bakeTime),
      remainingSeconds: Number(bakeTime) * 60,
      isRunning: false,
    };

    return initial;
  });

  // Active temperature input for current stage
  const [inputRecordedTemp, setInputRecordedTemp] = useState<string>('');
  const [inputTempNotes, setInputTempNotes] = useState<string>('');

  // Countdown timer interval
  useEffect(() => {
    const activeRunning = Object.values(timers).filter((t) => t.isRunning);
    if (activeRunning.length === 0) return;

    const interval = setInterval(() => {
      setTimers((prev) => {
        const next = { ...prev };
        let updated = false;

        Object.keys(next).forEach((key) => {
          const t = next[key];
          if (t && t.isRunning && t.remainingSeconds > 0) {
            next[key] = {
              ...t,
              remainingSeconds: t.remainingSeconds - 1,
              completedAt: t.remainingSeconds - 1 === 0 ? new Date().toISOString() : undefined,
            };
            updated = true;
          }
        });

        return updated ? next : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timers]);

  const toggleTimer = (stage: ProductionStage) => {
    setTimers((prev) => {
      const current = prev[stage];
      if (!current) return prev;
      return {
        ...prev,
        [stage]: {
          ...current,
          isRunning: !current.isRunning,
          startedAt: current.startedAt || new Date().toISOString(),
        },
      };
    });
  };

  const resetTimer = (stage: ProductionStage) => {
    setTimers((prev) => {
      const current = prev[stage];
      if (!current) return prev;
      return {
        ...prev,
        [stage]: {
          ...current,
          isRunning: false,
          remainingSeconds: current.durationMinutes * 60,
          completedAt: undefined,
        },
      };
    });
  };

  const handleToggleStep = (stepId: string) => {
    setStepChecklist((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  const handleAddTemperatureLog = () => {
    const val = parseFloat(inputRecordedTemp);
    if (isNaN(val)) return;

    const cfg = STAGE_CONFIG[currentStage];
    const newLog: TemperatureLog = {
      id: `temp_${Date.now()}`,
      stage: currentStage,
      type: cfg.defaultTempType || 'OVEN',
      targetTempCelsius: (activeRecipe as any)?.temperatureCelsius || undefined,
      recordedTempCelsius: val,
      loggedAt: new Date().toISOString(),
      notes: inputTempNotes || undefined,
    };

    setTemperatureLogs((prev) => [newLog, ...prev]);
    setInputRecordedTemp('');
    setInputTempNotes('');
  };

  const handleUpdateLot = (
    index: number,
    field: keyof IngredientLotTrace,
    value: any
  ) => {
    setIngredientLots((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = {
          ...next[index],
          [field]: value,
        };
      }
      return next;
    });
  };

  const markStageCompleted = (stage: ProductionStage) => {
    if (!completedStages.includes(stage)) {
      setCompletedStages((prev) => [...prev, stage]);
    }
  };

  const currentStageIndex = STAGE_ORDER.indexOf(currentStage);
  const currentConfig = STAGE_CONFIG[currentStage];
  const activeTimer = timers[currentStage];

  const formatTimerDisplay = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSaveState = () => {
    if (!onSaveExecutionState) return;
    const state: ProductionExecutionState = {
      currentStage,
      stagesCompleted: completedStages,
      stageSteps: stepChecklist,
      temperatureLogs,
      timers,
      ingredientLots,
    };
    onSaveExecutionState(batch.id, state);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl w-full h-[92vh] p-0 flex flex-col bg-background overflow-hidden border-border shadow-2xl">
        {/* WORKSTATION TOP BAR */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-lg font-bold tracking-tight">
                  Kitchen Workstation: {activeRecipe?.name || batch.name}
                </DialogTitle>
                <Badge variant="outline" className="font-mono text-xs">
                  {batch.batchNumber}
                </Badge>
                <Badge
                  className={cn(
                    'text-[10px] uppercase font-bold tracking-wider',
                    batch.runType === 'ON_DEMAND'
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  )}
                >
                  {batch.runType === 'ON_DEMAND' ? 'On-Demand Order' : 'Make-To-Stock'}
                </Badge>
                {batch.orderReference && (
                  <Badge variant="secondary" className="font-mono text-xs">
                    REF: {batch.orderReference}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Target: {batch.plannedQuantity} {batch.unit?.symbol || 'pcs'} • Multiplier: {multiplier.toFixed(2)}x • Operator: {batch.leadBaker?.name || batch.baker || 'Unassigned'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveState}
              className="text-xs font-medium h-9"
            >
              Save Progress
            </Button>
            {onCompleteBatch && (
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 gap-1.5"
                onClick={() => {
                  onClose();
                  onCompleteBatch(batch);
                }}
              >
                <CheckCircle2 className="h-4 w-4" /> Finalize &amp; Audit
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* STAGES STEPPER BAR */}
        <div className="grid grid-cols-6 border-b border-border bg-muted/20">
          {STAGE_ORDER.map((stg, idx) => {
            const cfg = STAGE_CONFIG[stg];
            const Icon = cfg.icon;
            const isCurrent = currentStage === stg;
            const isDone = completedStages.includes(stg);

            return (
              <button
                key={stg}
                type="button"
                onClick={() => setCurrentStage(stg)}
                className={cn(
                  'flex items-center gap-2.5 px-4 py-3 text-left transition-all border-r last:border-r-0 border-border/50 relative',
                  isCurrent
                    ? 'bg-background font-semibold text-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                )}
              >
                <div
                  className={cn(
                    'h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors',
                    isDone
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                  )}
                >
                  {isDone ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                </div>
                <div className="min-w-0">
                  <div className="text-xs truncate">{cfg.title}</div>
                </div>
                {isCurrent && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            );
          })}
        </div>

        {/* WORKSTATION MAIN CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT 8 COLS: ACTIVE STAGE EXECUTION */}
          <div className="lg:col-span-8 space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                    <currentConfig.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      Stage {currentStageIndex + 1}: {currentConfig.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {currentConfig.description}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={completedStages.includes(currentStage) ? 'secondary' : 'default'}
                  onClick={() => markStageCompleted(currentStage)}
                  className="text-xs gap-1.5 h-8 font-semibold"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {completedStages.includes(currentStage) ? 'Stage Completed' : 'Complete Stage'}
                </Button>
              </div>

              {/* STAGE STEP CHECKLIST */}
              <div className="space-y-3">
                <Label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                  Workstation Step Checklist
                </Label>
                <div className="space-y-2">
                  {currentConfig.defaultSteps.map((step) => {
                    const checked = !!stepChecklist[step.id];
                    return (
                      <label
                        key={step.id}
                        className={cn(
                          'flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none',
                          checked
                            ? 'border-emerald-500/30 bg-emerald-500/5 text-foreground'
                            : 'border-border/60 hover:bg-muted/40 text-muted-foreground'
                        )}
                      >
                        <span className={cn('text-sm', checked && 'font-medium text-foreground')}>
                          {step.label}
                        </span>
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => handleToggleStep(step.id)}
                          className="h-5 w-5 rounded-md"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* INGREDIENT LOT & CONSUMPTION TABLE (Prominent on Scaling & Prep / Mixing) */}
              {(currentStage === ProductionStage.SCALING_PREP || currentStage === ProductionStage.MIXING) && (
                <div className="mt-6 pt-6 border-t border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                        Ingredient Consumption &amp; Lot Traceability
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Record raw material lot numbers from suppliers to ensure food safety compliance.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/40 border-b border-border text-muted-foreground">
                        <tr>
                          <th className="p-2.5 font-semibold">Ingredient</th>
                          <th className="p-2.5 font-semibold text-right w-24">Required</th>
                          <th className="p-2.5 font-semibold text-right w-24">Consumed</th>
                          <th className="p-2.5 font-semibold w-40">Lot / Batch #</th>
                          <th className="p-2.5 font-semibold text-center w-16">Verified</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {ingredientLots.map((item, idx) => (
                          <tr key={item.ingredientVariantId || idx} className="hover:bg-muted/20">
                            <td className="p-2.5 font-medium text-foreground">
                              {item.ingredientName}
                            </td>
                            <td className="p-2.5 text-right font-mono tabular-nums">
                              {item.requiredQuantity} <span className="text-[10px] text-muted-foreground">{item.unitSymbol}</span>
                            </td>
                            <td className="p-2.5 text-right font-mono">
                              <Input
                                type="number"
                                step="0.01"
                                value={item.consumedQuantity}
                                onChange={(e) => handleUpdateLot(idx, 'consumedQuantity', parseFloat(e.target.value) || 0)}
                                className="h-7 w-20 text-right text-xs font-mono px-1.5"
                              />
                            </td>
                            <td className="p-2.5">
                              <Input
                                placeholder="e.g. LOT-2025-04A"
                                value={item.lotNumber}
                                onChange={(e) => handleUpdateLot(idx, 'lotNumber', e.target.value)}
                                className="h-7 text-xs font-mono px-2"
                              />
                            </td>
                            <td className="p-2.5 text-center">
                              <Checkbox
                                checked={item.verified}
                                onCheckedChange={(val) => handleUpdateLot(idx, 'verified', !!val)}
                                className="mx-auto"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* STAGE NAVIGATION */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentStageIndex === 0}
                onClick={() => setCurrentStage(STAGE_ORDER[currentStageIndex - 1]!)}
                className="gap-2 text-xs"
              >
                <ChevronLeft className="h-4 w-4" /> Previous Stage
              </Button>

              <span className="text-xs text-muted-foreground">
                Stage {currentStageIndex + 1} of {STAGE_ORDER.length}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={currentStageIndex === STAGE_ORDER.length - 1}
                onClick={() => {
                  markStageCompleted(currentStage);
                  setCurrentStage(STAGE_ORDER[currentStageIndex + 1]!);
                }}
                className="gap-2 text-xs"
              >
                Next Stage <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* RIGHT 4 COLS: TIMERS & TEMPERATURE LOGGING WIDGETS */}
          <div className="lg:col-span-4 space-y-6">
            {/* COUNTDOWN STAGE TIMER */}
            {activeTimer && (
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      {activeTimer.label}
                    </h4>
                  </div>
                  {activeTimer.remainingSeconds === 0 && (
                    <Badge variant="destructive" className="animate-pulse text-[10px]">
                      Time Finished
                    </Badge>
                  )}
                </div>

                <div className="flex flex-col items-center justify-center py-4 bg-muted/20 rounded-xl border border-border/40">
                  <div className="text-4xl font-black font-mono tracking-wider tabular-nums text-foreground">
                    {formatTimerDisplay(activeTimer.remainingSeconds)}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 uppercase font-semibold">
                    Preset: {activeTimer.durationMinutes} minutes
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className={cn(
                      'flex-1 text-xs font-bold gap-1.5 h-9',
                      activeTimer.isRunning
                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                        : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                    )}
                    onClick={() => toggleTimer(currentStage)}
                  >
                    {activeTimer.isRunning ? (
                      <>
                        <Pause className="h-3.5 w-3.5" /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5" /> Start Timer
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => resetTimer(currentStage)}
                    className="h-9 px-3 text-xs"
                    title="Reset Timer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* TEMPERATURE LOGGER */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-primary" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Temperature Logging
                  </h4>
                </div>
                {(activeRecipe as any)?.temperatureCelsius && (
                  <span className="text-[10px] font-mono font-semibold text-muted-foreground">
                    Target: {(activeRecipe as any).temperatureCelsius}°C
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    Recorded Temperature (°C)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 215.5"
                      value={inputRecordedTemp}
                      onChange={(e) => setInputRecordedTemp(e.target.value)}
                      className="h-9 text-sm font-mono"
                    />
                    <Button
                      size="sm"
                      onClick={handleAddTemperatureLog}
                      disabled={!inputRecordedTemp}
                      className="h-9 text-xs font-semibold px-4"
                    >
                      Log
                    </Button>
                  </div>
                </div>

                <Input
                  placeholder="Notes (e.g. deck 2 upper oven)"
                  value={inputTempNotes}
                  onChange={(e) => setInputTempNotes(e.target.value)}
                  className="h-8 text-xs"
                />

                {/* LOG HISTORY */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                    Recent Logs ({temperatureLogs.length})
                  </span>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                    {temperatureLogs.length === 0 ? (
                      <p className="text-xs text-muted-foreground/60 italic">No temperature readings logged yet.</p>
                    ) : (
                      temperatureLogs.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/40 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-foreground">
                              {log.recordedTempCelsius}°C
                            </span>
                            <Badge variant="outline" className="text-[9px] py-0 h-4">
                              {log.type}
                            </Badge>
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(log.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
