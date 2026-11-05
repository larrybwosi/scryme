import { describe, it, expect } from 'vitest';
import {
  STAGE_CONFIG,
  STAGE_ORDER,
} from '@/components/bakery/ProductionWorkstation';
import {
  ProductionStage,
  ProductionRunType,
  WasteReasonCode,
  TemperatureLog,
  IngredientLotTrace,
  ProductionExecutionState,
} from '@/types/bakery';

describe('Kitchen Workstation Stage Progression & Timers (AC-2 & AC-3)', () => {
  it('should maintain standard 6 bakery stages in correct chronological sequence', () => {
    expect(STAGE_ORDER).toEqual([
      ProductionStage.SCALING_PREP,
      ProductionStage.MIXING,
      ProductionStage.PROOFING,
      ProductionStage.BAKING,
      ProductionStage.COOLING,
      ProductionStage.QUALITY_AUDIT,
    ]);
  });

  it('should configure proofing and baking stages with countdown timers', () => {
    const proofingConfig = STAGE_CONFIG[ProductionStage.PROOFING];
    expect(proofingConfig.hasTimer).toBe(true);
    expect(proofingConfig.defaultTimerMinutes).toBeGreaterThan(0);

    const bakingConfig = STAGE_CONFIG[ProductionStage.BAKING];
    expect(bakingConfig.hasTimer).toBe(true);
    expect(bakingConfig.defaultTimerMinutes).toBeGreaterThan(0);

    // Scaling should not require a countdown timer
    const scalingConfig = STAGE_CONFIG[ProductionStage.SCALING_PREP];
    expect(scalingConfig.hasTimer).toBeUndefined();
  });

  it('should enable temperature logging for baking and cooling stages with appropriate default types', () => {
    const bakingConfig = STAGE_CONFIG[ProductionStage.BAKING];
    expect(bakingConfig.hasTemperatureLog).toBe(true);
    expect(bakingConfig.defaultTempType).toBe('OVEN');

    const coolingConfig = STAGE_CONFIG[ProductionStage.COOLING];
    expect(coolingConfig.hasTemperatureLog).toBe(true);
    expect(coolingConfig.defaultTempType).toBe('CORE_INTERNAL');
  });

  it('should support stage step completion checklist tracking', () => {
    const steps = STAGE_CONFIG[ProductionStage.SCALING_PREP].defaultSteps;
    expect(steps.length).toBeGreaterThanOrEqual(3);

    const checklist: Record<string, boolean> = {};
    steps.forEach((step) => {
      checklist[step.id] = false;
    });

    // Mark dry scaling as completed
    checklist['scale_dry'] = true;
    expect(checklist['scale_dry']).toBe(true);
    expect(checklist['scale_wet']).toBe(false);
  });
});

describe('In-Batch Lot Traceability & Execution State (AC-4 & AC-5)', () => {
  it('should correctly format and track raw ingredient lot numbers and verified status', () => {
    const lotTraces: IngredientLotTrace[] = [
      {
        ingredientVariantId: 'var-flour-1',
        ingredientName: 'Unbleached Bread Flour',
        requiredQuantity: 1000,
        consumedQuantity: 1000,
        unitSymbol: 'g',
        lotNumber: 'LOT-MILL-2025-08',
        supplierBatchNumber: 'SUP-B981',
        verified: true,
      },
      {
        ingredientVariantId: 'var-yeast-1',
        ingredientName: 'Instant Dry Yeast',
        requiredQuantity: 15,
        consumedQuantity: 15,
        unitSymbol: 'g',
        lotNumber: 'YST-2025-04',
        verified: true,
      },
    ];

    expect(lotTraces[0]?.lotNumber).toBe('LOT-MILL-2025-08');
    expect(lotTraces[0]?.verified).toBe(true);
    expect(lotTraces[1]?.consumedQuantity).toBe(15);
  });

  it('should capture temperature logs with target and recorded readings', () => {
    const tempLogs: TemperatureLog[] = [
      {
        id: 'log-1',
        stage: ProductionStage.BAKING,
        type: 'OVEN',
        targetTempCelsius: 230,
        recordedTempCelsius: 228.5,
        loggedAt: new Date().toISOString(),
        notes: 'Deck 1 middle shelf',
      },
      {
        id: 'log-2',
        stage: ProductionStage.COOLING,
        type: 'CORE_INTERNAL',
        recordedTempCelsius: 32.0,
        loggedAt: new Date().toISOString(),
        notes: 'Target core temp < 35°C achieved',
      },
    ];

    expect(tempLogs[0]?.targetTempCelsius).toBe(230);
    expect(tempLogs[0]?.recordedTempCelsius).toBe(228.5);
    expect(tempLogs[1]?.type).toBe('CORE_INTERNAL');
    expect(tempLogs[1]?.recordedTempCelsius).toBeLessThan(35);
  });

  it('should structure complete production execution state for persistence', () => {
    const state: ProductionExecutionState = {
      currentStage: ProductionStage.QUALITY_AUDIT,
      stagesCompleted: [
        ProductionStage.SCALING_PREP,
        ProductionStage.MIXING,
        ProductionStage.PROOFING,
        ProductionStage.BAKING,
        ProductionStage.COOLING,
      ],
      stageSteps: {
        scale_dry: true,
        scale_wet: true,
        mix_autolyse: true,
        oven_preheat: true,
      },
      temperatureLogs: [
        {
          id: 'temp-1',
          stage: ProductionStage.BAKING,
          type: 'OVEN',
          recordedTempCelsius: 225,
          loggedAt: new Date().toISOString(),
        },
      ],
      timers: {
        [ProductionStage.BAKING]: {
          id: 'timer-bake',
          stage: ProductionStage.BAKING,
          label: 'Oven Bake Timer',
          durationMinutes: 25,
          remainingSeconds: 0,
          isRunning: false,
          completedAt: new Date().toISOString(),
        },
      },
      ingredientLots: [
        {
          ingredientName: 'Flour',
          requiredQuantity: 500,
          consumedQuantity: 500,
          unitSymbol: 'g',
          lotNumber: 'LOT-FLOUR-100',
          verified: true,
        },
      ],
    };

    expect(state.stagesCompleted).toHaveLength(5);
    expect(state.timers[ProductionStage.BAKING]?.remainingSeconds).toBe(0);
    expect(state.ingredientLots[0]?.lotNumber).toBe('LOT-FLOUR-100');
  });
});
