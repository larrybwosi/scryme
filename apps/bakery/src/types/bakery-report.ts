// types/bakery-report.ts

export interface ReportPeriod {
  startDate: Date;
  endDate: Date;
  title: string;
}

export interface ProductionSummary {
  totalBatchesPlanned: number;
  totalBatchesCompleted: number;
  totalBatchesCancelled: number;
  totalQuantityProduced: number;
  cancellationRate: number; // Corrected from string to number
}

export interface ProductPerformance {
  recipeId: string;
  recipeName: string;
  batchesCompleted: number;
  totalQuantityProduced: number;
}

export interface BakerPerformance {
  bakerId?: string | null; // Changed to optional for 'Unknown Baker' case
  bakerName: string;
  batchesCompleted: number;
  totalQuantityProduced: number;
}

export interface FinancialSummary {
  totalIngredientCost: number;
  totalRevenueFromBakerySales: number;
  estimatedProfit: number;
  totalCostOfWaste: number; // Added field for consistency
}

export interface IngredientConsumption {
  variantId: string;
  variantName: string;
  totalQuantityUsed: number;
  unit: string;
}

// --- NEWLY ADDED TYPES ---

export interface WasteSummary {
  totalDisposedBatches: number;
  totalDisposedQuantity: number;
  disposalByReason: Record<string, number>; // e.g., { "EXPIRED": 10, "DAMAGED": 5 }
  costOfWaste: number;
  wasteRate: number;
}

export interface ProductProfitability {
  recipeId: string;
  recipeName: string;
  totalQuantityProduced: number;
  totalCostOfProduction: number;
  totalQuantitySold: number;
  totalRevenue: number;
  estimatedProfit: number;
  profitMargin: number;
}

export interface ProductionVsSales {
  recipeId: string;
  recipeName: string;
  quantityProduced: number;
  quantitySold: number;
  sellThroughRate: number;
}

// --- UPDATED MAIN DATA STRUCTURE ---

// This is the main structure for our raw report data
export interface BakeryReportData {
  period: ReportPeriod;
  productionSummary: ProductionSummary;
  financialSummary: FinancialSummary;
  wasteSummary: WasteSummary; // Added
  topProductsByBatches: ProductPerformance[];
  topProductsByQuantity: ProductPerformance[];
  bakerPerformance: BakerPerformance[];
  ingredientConsumption: IngredientConsumption[];
  productProfitability: ProductProfitability[]; // Added
  productionVsSales: ProductionVsSales[]; // Added
}

// This is the final output structure that the PDF component expects
export interface GeneratedBakeryReport {
  reportData: BakeryReportData;
  geminiAnalysis: string; // The natural language summary from Gemini
}

export interface BakeryReportOptions {
  customDates?: { startDate: Date; endDate: Date };
  bakerId?: string;
  recipeId?: string;
  categoryId?: string;
}
