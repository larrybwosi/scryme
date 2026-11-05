import { describe, it, expect } from 'vitest';
import { calculateBakersPercentages } from '@/components/bakery/ProductionTicket';
import { WasteReasonCode, ProductionRunType, ProductionStage } from '@/types/bakery';
import { batchSchema } from '@/validations/bakery';

describe('Production Ticket & Baker\'s Percentage Calculations (AC-6)', () => {
  it('should accurately calculate baker\'s percentages based on total flour weight (100% base)', () => {
    const ingredients = [
      {
        id: 'ing-flour-bread',
        name: 'Bread Flour (High Protein)',
        isFlour: true,
        quantity: 800,
        unit: { symbol: 'g' },
        preparationNotes: 'Sifted',
      },
      {
        id: 'ing-flour-rye',
        name: 'Whole Grain Rye Flour',
        isFlour: true,
        quantity: 200,
        unit: { symbol: 'g' },
        preparationNotes: 'Stoneground',
      },
      {
        id: 'ing-water',
        name: 'Filtered Water (26°C)',
        isFlour: false,
        quantity: 750,
        unit: { symbol: 'g' },
      },
      {
        id: 'ing-salt',
        name: 'Fine Sea Salt',
        isFlour: false,
        quantity: 20,
        unit: { symbol: 'g' },
      },
      {
        id: 'ing-starter',
        name: 'Sourdough Levain',
        isFlour: false,
        quantity: 200,
        unit: { symbol: 'g' },
      },
    ];

    // Total flour weight = 800g + 200g = 1000g (100%)
    const { rows, totalFlourWeight } = calculateBakersPercentages(ingredients, 1.0);

    expect(totalFlourWeight).toBe(1000);
    expect(rows).toHaveLength(5);

    // Bread flour: 800 / 1000 = 80.0%
    const breadFlourRow = rows.find(r => r.name.includes('Bread Flour'));
    expect(breadFlourRow?.bakersPercentage).toBe(80.0);
    expect(breadFlourRow?.scaledQuantity).toBe(800);
    expect(breadFlourRow?.isFlour).toBe(true);
    expect(breadFlourRow?.preparationNotes).toBe('Sifted');

    // Rye flour: 200 / 1000 = 20.0%
    const ryeFlourRow = rows.find(r => r.name.includes('Rye'));
    expect(ryeFlourRow?.bakersPercentage).toBe(20.0);
    expect(ryeFlourRow?.scaledQuantity).toBe(200);

    // Water: 750 / 1000 = 75.0% hydration
    const waterRow = rows.find(r => r.name.includes('Water'));
    expect(waterRow?.bakersPercentage).toBe(75.0);
    expect(waterRow?.scaledQuantity).toBe(750);
    expect(waterRow?.isFlour).toBe(false);

    // Salt: 20 / 1000 = 2.0%
    const saltRow = rows.find(r => r.name.includes('Salt'));
    expect(saltRow?.bakersPercentage).toBe(2.0);
    expect(saltRow?.scaledQuantity).toBe(20);
  });

  it('should scale ingredients proportionally when recipe multiplier is applied', () => {
    const ingredients = [
      {
        name: 'Organic Wheat Flour',
        isFlour: true,
        quantity: 500,
        unit: { symbol: 'g' },
      },
      {
        name: 'Salt',
        isFlour: false,
        quantity: 10,
        unit: { symbol: 'g' },
      },
    ];

    const multiplier = 3.5;
    const { rows, totalFlourWeight } = calculateBakersPercentages(ingredients, multiplier);

    expect(totalFlourWeight).toBe(1750); // 500 * 3.5
    expect(rows[0]?.scaledQuantity).toBe(1750);
    expect(rows[0]?.bakersPercentage).toBe(100.0);
    expect(rows[1]?.scaledQuantity).toBe(35); // 10 * 3.5
    expect(rows[1]?.bakersPercentage).toBe(2.0); // 35 / 1750 = 2%
  });

  it('should handle recipes where flour is detected by ingredient name substring', () => {
    const ingredients = [
      {
        ingredientVariant: {
          name: 'Tipo 00 Pizza Flour',
        },
        quantity: 1000,
        unit: { symbol: 'g' },
      },
      {
        name: 'Olive Oil',
        quantity: 30,
        unit: { symbol: 'g' },
      },
    ];

    const { rows, totalFlourWeight } = calculateBakersPercentages(ingredients, 1.0);
    expect(totalFlourWeight).toBe(1000);
    expect(rows[0]?.isFlour).toBe(true);
    expect(rows[0]?.bakersPercentage).toBe(100.0);
    expect(rows[1]?.bakersPercentage).toBe(3.0);
  });
});

describe('Batch Validation with Dual-Mode & Waste Reason Codes (AC-1 & AC-5)', () => {
  it('should validate make-to-stock batch schema successfully', () => {
    const validMakeToStock = {
      recipeId: 'rec-1',
      plannedQuantity: 24,
      systemUnitId: 'unit-pcs',
      date: new Date(),
      time: '06:00',
      runType: 'MAKE_TO_STOCK',
    };

    const res = batchSchema.safeParse(validMakeToStock);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.runType).toBe('MAKE_TO_STOCK');
    }
  });

  it('should validate on-demand batch with order reference and tags', () => {
    const validOnDemand = {
      recipeId: 'rec-custom-cake',
      plannedQuantity: 1,
      systemUnitId: 'unit-cake',
      date: new Date(),
      time: '14:30',
      runType: 'ON_DEMAND',
      orderReference: 'POS-ORD-9021',
      tags: ['custom-order', 'wedding', 'order:POS-ORD-9021'],
    };

    const res = batchSchema.safeParse(validOnDemand);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.runType).toBe('ON_DEMAND');
      expect(res.data.orderReference).toBe('POS-ORD-9021');
      expect(res.data.tags).toContain('custom-order');
    }
  });

  it('should define all 7 required bakery waste reason codes', () => {
    const expectedCodes = [
      'BURNT',
      'UNDERCOOKED',
      'SHAPE_DEFECT',
      'CONTAMINATED',
      'DOUGH_FAILURE',
      'OVER_PROOFED',
      'OTHER',
    ];

    expectedCodes.forEach(code => {
      expect(WasteReasonCode[code as keyof typeof WasteReasonCode]).toBe(code);
    });
  });

  it('should define all 6 required production execution stages in standard bakery order', () => {
    expect(ProductionStage.SCALING_PREP).toBe('SCALING_PREP');
    expect(ProductionStage.MIXING).toBe('MIXING');
    expect(ProductionStage.PROOFING).toBe('PROOFING');
    expect(ProductionStage.BAKING).toBe('BAKING');
    expect(ProductionStage.COOLING).toBe('COOLING');
    expect(ProductionStage.QUALITY_AUDIT).toBe('QUALITY_AUDIT');
  });
});
