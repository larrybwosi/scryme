'use client';

import React, { useMemo } from 'react';
import { FormattedBatch, Recipe } from '@/types/bakery';
import { format } from 'date-fns';
import { Button } from '@repo/ui/components/ui/button';
import { Printer } from 'lucide-react';

export interface ProductionTicketProps {
  batch: FormattedBatch;
  recipe?: Recipe | null;
  onClose?: () => void;
}

export interface ScaledIngredientRow {
  id: string;
  name: string;
  isFlour: boolean;
  scaledQuantity: number;
  unitSymbol: string;
  bakersPercentage: number;
  preparationNotes?: string;
  lotNumber?: string;
}

export function calculateBakersPercentages(
  ingredients: any[],
  recipeMultiplier: number = 1
): { rows: ScaledIngredientRow[]; totalFlourWeight: number } {
  if (!ingredients || ingredients.length === 0) {
    return { rows: [], totalFlourWeight: 0 };
  }

  // 1. Identify all flour ingredients and compute base flour weight
  let totalFlourWeight = 0;
  ingredients.forEach(ing => {
    const isFlour =
      ing.isFlour ||
      ing.ingredientVariant?.product?.name?.toLowerCase().includes('flour') ||
      ing.ingredientVariant?.name?.toLowerCase().includes('flour') ||
      ing.name?.toLowerCase().includes('flour');
    const scaledQty = (Number(ing.quantity) || 0) * recipeMultiplier;
    if (isFlour) {
      totalFlourWeight += scaledQty;
    }
  });

  // If no flour is explicitly flagged, default the highest mass ingredient or total ingredients as base
  if (totalFlourWeight <= 0) {
    const maxQty = Math.max(...ingredients.map(ing => (Number(ing.quantity) || 0) * recipeMultiplier));
    totalFlourWeight = maxQty > 0 ? maxQty : 1;
  }

  // 2. Map rows with scaled quantity and baker's percentage
  const rows: ScaledIngredientRow[] = ingredients.map(ing => {
    const isFlour =
      ing.isFlour ||
      ing.ingredientVariant?.product?.name?.toLowerCase().includes('flour') ||
      ing.ingredientVariant?.name?.toLowerCase().includes('flour') ||
      ing.name?.toLowerCase().includes('flour');
    const scaledQty = (Number(ing.quantity) || 0) * recipeMultiplier;
    const bakersPercentage =
      ing.bakersPercentage !== undefined && ing.bakersPercentage !== null
        ? Number(ing.bakersPercentage)
        : totalFlourWeight > 0
          ? Number(((scaledQty / totalFlourWeight) * 100).toFixed(1))
          : 0;

    const unitSymbol =
      ing.systemUnit?.symbol ||
      ing.orgUnit?.symbol ||
      ing.unit?.symbol ||
      ing.ingredientVariant?.baseUnit?.symbol ||
      'g';

    const name =
      ing.ingredientVariant?.product?.name ||
      ing.ingredientVariant?.name ||
      ing.name ||
      'Unnamed Ingredient';

    return {
      id: ing.id || ing.ingredientVariantId || name,
      name,
      isFlour: !!isFlour,
      scaledQuantity: Number(scaledQty.toFixed(2)),
      unitSymbol,
      bakersPercentage,
      preparationNotes: ing.preparationNotes,
    };
  });

  return { rows, totalFlourWeight };
}

export function ProductionTicket({ batch, recipe, onClose }: ProductionTicketProps) {
  const activeRecipe = recipe || batch.recipe;
  const multiplier = Number(batch.recipeMultiplier || 1);

  const ingredientsList = useMemo(() => {
    return (
      (activeRecipe as any)?.ingredients ||
      (batch as any)?.ingredients ||
      []
    );
  }, [activeRecipe, batch]);

  const { rows, totalFlourWeight } = useMemo(() => {
    return calculateBakersPercentages(ingredientsList, multiplier);
  }, [ingredientsList, multiplier]);

  const scheduledDate = batch.scheduledStartAt ? new Date(batch.scheduledStartAt) : new Date();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white text-black p-8 font-sans print:p-0 print:m-0 print:w-full print:max-w-none print:shadow-none shadow-lg border border-slate-200 rounded-xl my-4">
      {/* Screen-only Print Bar */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-200 print:hidden">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Workstation Production Ticket</h2>
          <p className="text-xs text-slate-500">
            Scaled formulation, Baker's percentages, and kitchen floor checklist.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
          <Button size="sm" onClick={handlePrint} className="bg-slate-900 text-white hover:bg-slate-800 gap-2">
            <Printer className="h-4 w-4" /> Print Ticket (A4)
          </Button>
        </div>
      </div>

      {/* TICKET HEADER */}
      <div className="border-b-2 border-black pb-4 mb-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest bg-black text-white px-2 py-0.5 rounded">
                {batch.runType === 'ON_DEMAND' ? 'ON-DEMAND ORDER' : 'MAKE-TO-STOCK'}
              </span>
              {batch.orderReference && (
                <span className="text-xs font-mono font-semibold border border-black px-2 py-0.5 rounded">
                  REF: {batch.orderReference}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tight">
              {activeRecipe?.name || batch.name}
            </h1>
            <p className="text-xs text-slate-600 font-mono">
              Batch #{batch.batchNumber} | UUID: {batch.id.slice(0, 8)}
            </p>
          </div>

          <div className="text-right">
            <div className="text-3xl font-black tabular-nums">
              {batch.plannedQuantity}
              <span className="text-sm font-semibold uppercase ml-1">{batch.unit?.symbol || 'pcs'}</span>
            </div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Multiplier: {multiplier.toFixed(2)}x
            </div>
          </div>
        </div>

        {/* METADATA STRIP */}
        <div className="grid grid-cols-4 gap-4 mt-4 pt-3 border-t border-dashed border-slate-300 text-xs">
          <div>
            <span className="font-bold uppercase text-[10px] text-slate-500 block">Scheduled Date</span>
            <span className="font-medium">{format(scheduledDate, 'PPp')}</span>
          </div>
          <div>
            <span className="font-bold uppercase text-[10px] text-slate-500 block">Lead Baker</span>
            <span className="font-medium">{batch.leadBaker?.name || batch.baker || 'Unassigned'}</span>
          </div>
          <div>
            <span className="font-bold uppercase text-[10px] text-slate-500 block">Oven / Bake Spec</span>
            <span className="font-medium">
              {(activeRecipe as any)?.temperatureCelsius ? `${(activeRecipe as any).temperatureCelsius}°C` : 'Standard'} | {(activeRecipe as any)?.bakeTime || '—'} min
            </span>
          </div>
          <div>
            <span className="font-bold uppercase text-[10px] text-slate-500 block">Base Flour Weight</span>
            <span className="font-mono font-semibold">{totalFlourWeight.toFixed(2)} g (100%)</span>
          </div>
        </div>
      </div>

      {/* RECIPE FORMULATION TABLE */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-black">
            Recipe Formulation &amp; Baker's Percentages
          </h2>
          <span className="text-[10px] text-slate-500 font-mono">
            {rows.length} Ingredients Scaled
          </span>
        </div>

        <table className="w-full text-xs text-left border border-black border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-black text-black">
              <th className="p-2 font-bold w-8 text-center border-r border-black">#</th>
              <th className="p-2 font-bold border-r border-black">Ingredient Name</th>
              <th className="p-2 font-bold text-right border-r border-black w-24">Scaled Qty</th>
              <th className="p-2 font-bold text-right border-r border-black w-20">Baker's %</th>
              <th className="p-2 font-bold border-r border-black w-44">Preparation Notes</th>
              <th className="p-2 font-bold border-r border-black w-28">Lot / Batch #</th>
              <th className="p-2 font-bold text-center w-12">Check</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 border-b border-black">
            {rows.map((row, idx) => (
              <tr key={row.id} className={row.isFlour ? 'bg-amber-50/40 font-semibold' : ''}>
                <td className="p-2 text-center border-r border-black font-mono text-[11px]">{idx + 1}</td>
                <td className="p-2 border-r border-black">
                  <div className="flex items-center gap-1.5">
                    <span>{row.name}</span>
                    {row.isFlour && (
                      <span className="text-[9px] uppercase px-1 py-0.2 bg-amber-200 text-amber-900 rounded font-bold">
                        Flour Base
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-2 text-right border-r border-black font-mono font-bold">
                  {row.scaledQuantity} <span className="font-normal text-[10px]">{row.unitSymbol}</span>
                </td>
                <td className="p-2 text-right border-r border-black font-mono">
                  {row.bakersPercentage.toFixed(1)}%
                </td>
                <td className="p-2 border-r border-black text-[11px] text-slate-700">
                  {row.preparationNotes || '—'}
                </td>
                <td className="p-2 border-r border-black text-center">
                  <div className="h-4 border-b border-dotted border-slate-400"></div>
                </td>
                <td className="p-2 text-center">
                  <div className="w-3.5 h-3.5 border border-black rounded-sm mx-auto"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* WORKSTATION STAGES CHECKLIST */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="border border-black p-3 rounded">
          <h3 className="text-xs font-bold uppercase tracking-wider mb-2 border-b border-black pb-1">
            Standard Production Stages
          </h3>
          <div className="space-y-2 text-xs">
            {[
              { id: 'stage_1', name: '1. Scaling & Prep', note: 'Weigh all dry/wet items. Verify lots.' },
              { id: 'stage_2', name: '2. Mixing', note: 'Check dough hydration and gluten window.' },
              { id: 'stage_3', name: '3. Proofing & Fermentation', note: 'Target temp: 26-28°C. Check volume.' },
              { id: 'stage_4', name: '4. Baking (Oven)', note: 'Preheated oven. Steam injection if required.' },
              { id: 'stage_5', name: '5. Cooling', note: 'Racks at room temperature until core < 35°C.' },
              { id: 'stage_6', name: '6. Quality Audit', note: 'Audit crust, crumb, weight, and defects.' },
            ].map(stage => (
              <div key={stage.id} className="flex items-start justify-between gap-2 border-b border-slate-100 pb-1.5 last:border-0">
                <div>
                  <span className="font-bold block text-[11px]">{stage.name}</span>
                  <span className="text-[10px] text-slate-500">{stage.note}</span>
                </div>
                <div className="flex items-center gap-2 pt-0.5">
                  <div className="w-4 h-4 border border-black rounded-sm"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BAKE & QUALITY LOG */}
        <div className="border border-black p-3 rounded flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-2 border-b border-black pb-1">
              Workstation Log &amp; Quality Audit
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-600">Oven Temp Recorded (°C):</span>
                <span className="w-24 border-b border-black inline-block">&nbsp;</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-600">Core Temp Recorded (°C):</span>
                <span className="w-24 border-b border-black inline-block">&nbsp;</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-600">Actual Sellable Yield:</span>
                <span className="w-24 border-b border-black inline-block">&nbsp;</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-600">Waste / Defect Quantity:</span>
                <span className="w-24 border-b border-black inline-block">&nbsp;</span>
              </div>
              <div className="pt-1">
                <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Waste Reason (Circle):
                </span>
                <div className="flex flex-wrap gap-1 text-[9px] font-semibold font-mono">
                  {['BURNT', 'UNDERCOOKED', 'SHAPE_DEFECT', 'CONTAMINATED', 'DOUGH_FAILURE', 'OVER_PROOFED', 'OTHER'].map(code => (
                    <span key={code} className="border border-slate-400 px-1 py-0.5 rounded">
                      {code}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 mt-2 flex justify-between items-end text-[10px]">
            <div>
              <span className="block text-slate-500">Baker Signature:</span>
              <div className="w-32 border-b border-black mt-3"></div>
            </div>
            <div>
              <span className="block text-slate-500">Auditor Signature:</span>
              <div className="w-32 border-b border-black mt-3"></div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER BARCODE / QR VISUAL */}
      <div className="border-t-2 border-black pt-3 flex items-center justify-between">
        <div className="text-[10px] text-slate-600">
          <span className="font-bold">Scryme Bakery Production Systems</span> • Batch Execution Ticket
        </div>

        {/* Visual Barcode for Desktop Kitchen Scanner */}
        <div className="flex flex-col items-center">
          <div className="h-8 w-44 bg-black/5 border border-black flex items-center justify-center tracking-[0.4em] font-mono text-[9px] font-bold">
            *{batch.batchNumber}*
          </div>
          <span className="text-[8px] font-mono mt-0.5">{batch.id}</span>
        </div>
      </div>
    </div>
  );
}
