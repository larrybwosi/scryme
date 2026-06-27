/**
 * Unit Conversion and Product Variant Utilities
 * Handles conversions between system units, organization units, and product-specific units
 */

// ============================================================================
// TYPES
// ============================================================================

export type UnitType =
  | "MASS"
  | "VOLUME"
  | "LENGTH"
  | "AREA"
  | "COUNT"
  | "TIME"
  | "TEMPERATURE"
  | "ENERGY"
  | "CUSTOM";

export type IndustryCategory =
  | "UNIVERSAL"
  | "FOOD_SERVICE"
  | "RETAIL"
  | "MANUFACTURING"
  | "HEALTHCARE"
  | "CONSTRUCTION"
  | "AGRICULTURE"
  | "HOSPITALITY"
  | "OTHER";

export interface BaseUnit {
  id: string;
  name: string;
  symbol: string;
  abbreviation?: string | null;
  pluralName?: string | null;
  type: UnitType;
  category: IndustryCategory;
  isActive: boolean;
  description?: string | null;
}

export interface SystemUnit extends BaseUnit {
  isBaseUnit: boolean;
  isMetric: boolean;
}

export interface OrganizationUnit extends BaseUnit {
  organizationId: string;
  baseSystemUnitId?: string | null;
  conversionFactor?: number | null;
  conversionOffset?: number | null;
}

export type AnyUnit = SystemUnit | OrganizationUnit;

export interface UnitConversion {
  fromUnitId: string;
  toUnitId: string;
  factor: number;
  offset: number;
  isApproximate?: boolean;
}

export interface ProductUnitConversion extends UnitConversion {
  productId: string;
  priority: number;
}

export interface ProductVariantUnit {
  baseUnitId?: string | null;
  baseOrgUnitId?: string | null;
  stockingUnitId?: string | null;
  stockingOrgUnitId?: string | null;
}

export interface VariantSellingUnit {
  id: string;
  variantId: string;
  systemUnitId?: string | null;
  orgUnitId?: string | null;
  retailPrice?: number | null;
  wholesalePrice?: number | null;
  conversionMultiplier?: number | null;
  isActive: boolean;
}

export interface ConversionResult {
  value: number;
  fromUnit: string; // unit symbol
  toUnit: string; // unit symbol
  isApproximate: boolean;
  conversionPath?: string[]; // for debugging multi-step conversions
}

export interface ConversionError {
  error: string;
  code:
    | "INCOMPATIBLE_TYPES"
    | "NO_CONVERSION_PATH"
    | "INVALID_UNIT"
    | "DIVISION_BY_ZERO";
}

// ============================================================================
// CORE CONVERSION UTILITIES
// ============================================================================

export class UnitConverter {
  private systemConversions: Map<string, UnitConversion[]> = new Map();
  private orgConversions: Map<string, UnitConversion[]> = new Map();
  private productConversions: Map<string, ProductUnitConversion[]> = new Map();

  constructor(
    systemConversions: UnitConversion[] = [],
    orgConversions: UnitConversion[] = [],
    productConversions: ProductUnitConversion[] = [],
  ) {
    this.loadConversions(systemConversions, orgConversions, productConversions);
  }

  /**
   * Load conversions into memory for fast lookup
   */
  private loadConversions(
    systemConversions: UnitConversion[],
    orgConversions: UnitConversion[],
    productConversions: ProductUnitConversion[],
  ): void {
    // Load system conversions
    systemConversions.forEach((conv) => {
      if (!this.systemConversions.has(conv.fromUnitId)) {
        this.systemConversions.set(conv.fromUnitId, []);
      }
      this.systemConversions.get(conv.fromUnitId)!.push(conv);
    });

    // Load org conversions
    orgConversions.forEach((conv) => {
      if (!this.orgConversions.has(conv.fromUnitId)) {
        this.orgConversions.set(conv.fromUnitId, []);
      }
      this.orgConversions.get(conv.fromUnitId)!.push(conv);
    });

    // Load product conversions (grouped by product)
    productConversions.forEach((conv) => {
      const key = `${conv.productId}:${conv.fromUnitId}`;
      if (!this.productConversions.has(key)) {
        this.productConversions.set(key, []);
      }
      this.productConversions.get(key)!.push(conv);
    });
  }

  /**
   * Convert value between units
   * Priority: Product-specific > Organization > System
   */
  convert(
    value: number,
    fromUnitId: string,
    toUnitId: string,
    productId?: string,
  ): ConversionResult | ConversionError {
    if (value === 0) {
      return {
        value: 0,
        fromUnit: fromUnitId,
        toUnit: toUnitId,
        isApproximate: false,
      };
    }

    if (fromUnitId === toUnitId) {
      return {
        value,
        fromUnit: fromUnitId,
        toUnit: toUnitId,
        isApproximate: false,
      };
    }

    // 1. Try product-specific conversion first
    if (productId) {
      const productConv = this.findProductConversion(
        productId,
        fromUnitId,
        toUnitId,
      );
      if (productConv) {
        return this.applyConversion(value, productConv, fromUnitId, toUnitId);
      }
    }

    // 2. Try organization conversion
    const orgConv = this.findDirectConversion(
      fromUnitId,
      toUnitId,
      this.orgConversions,
    );
    if (orgConv) {
      return this.applyConversion(value, orgConv, fromUnitId, toUnitId);
    }

    // 3. Try system conversion
    const systemConv = this.findDirectConversion(
      fromUnitId,
      toUnitId,
      this.systemConversions,
    );
    if (systemConv) {
      return this.applyConversion(value, systemConv, fromUnitId, toUnitId);
    }

    // 4. Try multi-step conversion
    const path = this.findConversionPath(fromUnitId, toUnitId);
    if (path) {
      return this.applyConversionPath(value, path);
    }

    return {
      error: "No conversion path found between units",
      code: "NO_CONVERSION_PATH",
    };
  }

  /**
   * Apply a single conversion
   */
  private applyConversion(
    value: number,
    conversion: UnitConversion,
    fromUnit: string,
    toUnit: string,
  ): ConversionResult {
    const factor = Number(conversion.factor);
    const offset = Number(conversion.offset);
    const result = value * factor + offset;

    return {
      value: result,
      fromUnit,
      toUnit,
      isApproximate: conversion.isApproximate || false,
    };
  }

  /**
   * Apply a chain of conversions
   */
  private applyConversionPath(
    value: number,
    path: UnitConversion[],
  ): ConversionResult {
    let result = value;
    let isApproximate = false;
    const conversionPath: string[] = [];

    for (const conv of path) {
      const factor = Number(conv.factor);
      const offset = Number(conv.offset);
      result = result * factor + offset;

      if (conv.isApproximate) {
        isApproximate = true;
      }

      conversionPath.push(`${conv.fromUnitId} -> ${conv.toUnitId}`);
    }

    return {
      value: result,
      fromUnit: path[0].fromUnitId,
      toUnit: path[path.length - 1].toUnitId,
      isApproximate,
      conversionPath,
    };
  }

  /**
   * Find product-specific conversion
   */
  private findProductConversion(
    productId: string,
    fromUnitId: string,
    toUnitId: string,
  ): ProductUnitConversion | null {
    const key = `${productId}:${fromUnitId}`;
    const conversions = this.productConversions.get(key) || [];

    // Find matching conversion and return highest priority
    const matches = conversions
      .filter((c) => c.toUnitId === toUnitId)
      .sort((a, b) => b.priority - a.priority);

    return matches[0] || null;
  }

  /**
   * Find direct conversion in a conversion map
   */
  private findDirectConversion(
    fromUnitId: string,
    toUnitId: string,
    conversionMap: Map<string, UnitConversion[]>,
  ): UnitConversion | null {
    const conversions = conversionMap.get(fromUnitId) || [];
    return conversions.find((c) => c.toUnitId === toUnitId) || null;
  }

  /**
   * Find conversion path using BFS (for multi-step conversions)
   */
  private findConversionPath(
    fromUnitId: string,
    toUnitId: string,
  ): UnitConversion[] | null {
    const queue: { unitId: string; path: UnitConversion[] }[] = [
      { unitId: fromUnitId, path: [] },
    ];
    const visited = new Set<string>([fromUnitId]);

    while (queue.length > 0) {
      const { unitId, path } = queue.shift()!;

      // Check system conversions
      const systemConvs = this.systemConversions.get(unitId) || [];
      for (const conv of systemConvs) {
        if (conv.toUnitId === toUnitId) {
          return [...path, conv];
        }

        if (!visited.has(conv.toUnitId)) {
          visited.add(conv.toUnitId);
          queue.push({
            unitId: conv.toUnitId,
            path: [...path, conv],
          });
        }
      }

      // Check org conversions
      const orgConvs = this.orgConversions.get(unitId) || [];
      for (const conv of orgConvs) {
        if (conv.toUnitId === toUnitId) {
          return [...path, conv];
        }

        if (!visited.has(conv.toUnitId)) {
          visited.add(conv.toUnitId);
          queue.push({
            unitId: conv.toUnitId,
            path: [...path, conv],
          });
        }
      }
    }

    return null;
  }

  /**
   * Get inverse conversion (toUnit -> fromUnit)
   */
  convertInverse(
    value: number,
    fromUnitId: string,
    toUnitId: string,
    productId?: string,
  ): ConversionResult | ConversionError {
    return this.convert(value, toUnitId, fromUnitId, productId);
  }
}

// ============================================================================
// PRODUCT VARIANT UTILITIES
// ============================================================================

export class ProductVariantUnitHelper {
  /**
   * Get the effective base unit (system or org)
   */
  static getBaseUnit(variant: ProductVariantUnit): {
    id: string;
    type: "system" | "org";
  } | null {
    if (variant.baseUnitId) {
      return { id: variant.baseUnitId, type: "system" };
    }
    if (variant.baseOrgUnitId) {
      return { id: variant.baseOrgUnitId, type: "org" };
    }
    return null;
  }

  /**
   * Get the effective stocking unit (system or org)
   */
  static getStockingUnit(variant: ProductVariantUnit): {
    id: string;
    type: "system" | "org";
  } | null {
    if (variant.stockingUnitId) {
      return { id: variant.stockingUnitId, type: "system" };
    }
    if (variant.stockingOrgUnitId) {
      return { id: variant.stockingOrgUnitId, type: "org" };
    }
    return null;
  }

  /**
   * Check if variant uses custom organization units
   */
  static usesOrgUnits(variant: ProductVariantUnit): boolean {
    return !!(variant.baseOrgUnitId || variant.stockingOrgUnitId);
  }

  /**
   * Check if variant uses only system units
   */
  static usesOnlySystemUnits(variant: ProductVariantUnit): boolean {
    return !!(
      (variant.baseUnitId || variant.stockingUnitId) &&
      !variant.baseOrgUnitId &&
      !variant.stockingOrgUnitId
    );
  }

  /**
   * Convert quantity from stocking unit to base unit
   */
  static convertStockingToBase(
    quantity: number,
    variant: ProductVariantUnit,
    converter: UnitConverter,
    productId?: string,
  ): ConversionResult | ConversionError {
    const baseUnit = this.getBaseUnit(variant);
    const stockingUnit = this.getStockingUnit(variant);

    if (!baseUnit || !stockingUnit) {
      return {
        error: "Missing base or stocking unit",
        code: "INVALID_UNIT",
      };
    }

    return converter.convert(quantity, stockingUnit.id, baseUnit.id, productId);
  }

  /**
   * Convert quantity from base unit to stocking unit
   */
  static convertBaseToStocking(
    quantity: number,
    variant: ProductVariantUnit,
    converter: UnitConverter,
    productId?: string,
  ): ConversionResult | ConversionError {
    const baseUnit = this.getBaseUnit(variant);
    const stockingUnit = this.getStockingUnit(variant);

    if (!baseUnit || !stockingUnit) {
      return {
        error: "Missing base or stocking unit",
        code: "INVALID_UNIT",
      };
    }

    return converter.convert(quantity, baseUnit.id, stockingUnit.id, productId);
  }
}

// ============================================================================
// SELLING UNIT UTILITIES
// ============================================================================

export class SellingUnitHelper {
  /**
   * Get the effective unit (system or org) from a selling unit
   */
  static getUnit(sellingUnit: VariantSellingUnit): {
    id: string;
    type: "system" | "org";
  } | null {
    if (sellingUnit.systemUnitId) {
      return { id: sellingUnit.systemUnitId, type: "system" };
    }
    if (sellingUnit.orgUnitId) {
      return { id: sellingUnit.orgUnitId, type: "org" };
    }
    return null;
  }

  /**
   * Convert selling unit quantity to base unit quantity
   */
  static convertToBase(
    quantity: number,
    sellingUnit: VariantSellingUnit,
    baseUnitId: string,
    converter: UnitConverter,
    productId?: string,
  ): ConversionResult | ConversionError {
    const unit = this.getUnit(sellingUnit);

    if (!unit) {
      return {
        error: "Invalid selling unit",
        code: "INVALID_UNIT",
      };
    }

    // Use cached conversion multiplier if available
    if (sellingUnit.conversionMultiplier) {
      const multiplier = Number(sellingUnit.conversionMultiplier);
      return {
        value: quantity * multiplier,
        fromUnit: unit.id,
        toUnit: baseUnitId,
        isApproximate: false,
      };
    }

    // Otherwise, use converter
    return converter.convert(quantity, unit.id, baseUnitId, productId);
  }

  /**
   * Convert base unit quantity to selling unit quantity
   */
  static convertFromBase(
    quantity: number,
    sellingUnit: VariantSellingUnit,
    baseUnitId: string,
    converter: UnitConverter,
    productId?: string,
  ): ConversionResult | ConversionError {
    const unit = this.getUnit(sellingUnit);

    if (!unit) {
      return {
        error: "Invalid selling unit",
        code: "INVALID_UNIT",
      };
    }

    // Use cached conversion multiplier if available
    if (sellingUnit.conversionMultiplier) {
      const multiplier = Number(sellingUnit.conversionMultiplier);
      if (multiplier === 0) {
        return {
          error: "Division by zero",
          code: "DIVISION_BY_ZERO",
        };
      }
      return {
        value: quantity / multiplier,
        fromUnit: baseUnitId,
        toUnit: unit.id,
        isApproximate: false,
      };
    }

    // Otherwise, use converter
    return converter.convert(quantity, baseUnitId, unit.id, productId);
  }

  /**
   * Calculate price per base unit
   */
  static getPricePerBaseUnit(
    sellingUnit: VariantSellingUnit,
    baseUnitId: string,
    converter: UnitConverter,
    productId?: string,
    priceType: "retail" | "wholesale" = "retail",
  ): number | null {
    const price =
      priceType === "retail"
        ? sellingUnit.retailPrice
        : sellingUnit.wholesalePrice;

    if (!price) return null;

    const conversionResult = this.convertToBase(
      1,
      sellingUnit,
      baseUnitId,
      converter,
      productId,
    );

    if ("error" in conversionResult) return null;

    return Number(price) / conversionResult.value;
  }

  /**
   * Find best selling unit for a given quantity
   */
  static findBestSellingUnit(
    quantity: number,
    baseUnitId: string,
    sellingUnits: VariantSellingUnit[],
    converter: UnitConverter,
    productId?: string,
  ): VariantSellingUnit | null {
    const activeUnits = sellingUnits.filter((u) => u.isActive);

    if (activeUnits.length === 0) return null;

    // Convert all units to base for comparison
    const unitsWithBaseQty = activeUnits
      .map((unit) => {
        const conversion = this.convertFromBase(
          quantity,
          unit,
          baseUnitId,
          converter,
          productId,
        );

        if ("error" in conversion) return null;

        return {
          unit,
          baseQuantity: conversion.value,
        };
      })
      .filter(
        (item): item is { unit: VariantSellingUnit; baseQuantity: number } =>
          item !== null,
      );

    // Find unit where converted quantity is closest to a whole number
    const best = unitsWithBaseQty.reduce((prev, curr) => {
      const prevRemainder = Math.abs(
        prev.baseQuantity - Math.round(prev.baseQuantity),
      );
      const currRemainder = Math.abs(
        curr.baseQuantity - Math.round(curr.baseQuantity),
      );

      return currRemainder < prevRemainder ? curr : prev;
    });

    return best.unit;
  }
}

// ============================================================================
// PRICE CALCULATION UTILITIES
// ============================================================================

export class PriceCalculator {
  /**
   * Calculate total price for a quantity in a specific selling unit
   */
  static calculatePrice(
    quantity: number,
    sellingUnit: VariantSellingUnit,
    priceType: "retail" | "wholesale" = "retail",
  ): number | null {
    const price =
      priceType === "retail"
        ? sellingUnit.retailPrice
        : sellingUnit.wholesalePrice;

    if (!price) return null;

    return quantity * Number(price);
  }

  /**
   * Calculate price for base unit quantity using a specific selling unit
   */
  static calculatePriceFromBase(
    baseQuantity: number,
    baseUnitId: string,
    sellingUnit: VariantSellingUnit,
    converter: UnitConverter,
    productId?: string,
    priceType: "retail" | "wholesale" = "retail",
  ): number | null {
    const conversionResult = SellingUnitHelper.convertFromBase(
      baseQuantity,
      sellingUnit,
      baseUnitId,
      converter,
      productId,
    );

    if ("error" in conversionResult) return null;

    return this.calculatePrice(conversionResult.value, sellingUnit, priceType);
  }

  /**
   * Get the best price for a given base quantity across all selling units
   */
  static getBestPrice(
    baseQuantity: number,
    baseUnitId: string,
    sellingUnits: VariantSellingUnit[],
    converter: UnitConverter,
    productId?: string,
    priceType: "retail" | "wholesale" = "retail",
  ): { price: number; sellingUnit: VariantSellingUnit } | null {
    const activeUnits = sellingUnits.filter((u) => u.isActive);

    const prices = activeUnits
      .map((unit) => {
        const price = this.calculatePriceFromBase(
          baseQuantity,
          baseUnitId,
          unit,
          converter,
          productId,
          priceType,
        );

        if (price === null) return null;

        return { price, sellingUnit: unit };
      })
      .filter(
        (item): item is { price: number; sellingUnit: VariantSellingUnit } =>
          item !== null,
      );

    if (prices.length === 0) return null;

    // Return lowest price
    return prices.reduce((prev, curr) =>
      curr.price < prev.price ? curr : prev,
    );
  }
}

// ============================================================================
// INVENTORY CALCULATION UTILITIES
// ============================================================================

export class InventoryCalculator {
  /**
   * Calculate total inventory value in base units
   */
  static calculateInventoryValue(
    stockLevel: number,
    baseUnitId: string,
    sellingUnits: VariantSellingUnit[],
    converter: UnitConverter,
    productId?: string,
    priceType: "retail" | "wholesale" = "wholesale",
  ): number | null {
    const bestPrice = PriceCalculator.getBestPrice(
      stockLevel,
      baseUnitId,
      sellingUnits,
      converter,
      productId,
      priceType,
    );

    return bestPrice?.price || null;
  }

  /**
   * Calculate reorder quantity in stocking units
   */
  static calculateReorderQuantity(
    currentStock: number,
    reorderPoint: number,
    reorderQty: number,
    variant: ProductVariantUnit,
    converter: UnitConverter,
    productId?: string,
  ): ConversionResult | ConversionError {
    if (currentStock >= reorderPoint) {
      return {
        value: 0,
        fromUnit: "",
        toUnit: "",
        isApproximate: false,
      };
    }

    const quantityNeeded = reorderQty;

    return ProductVariantUnitHelper.convertBaseToStocking(
      quantityNeeded,
      variant,
      converter,
      productId,
    );
  }

  /**
   * Check if stock is below reorder point
   */
  static needsReorder(currentStock: number, reorderPoint: number): boolean {
    return currentStock <= reorderPoint;
  }

  /**
   * Calculate stock coverage (days of inventory)
   */
  static calculateStockCoverage(
    currentStock: number,
    averageDailyUsage: number,
  ): number {
    if (averageDailyUsage === 0) return Infinity;
    return currentStock / averageDailyUsage;
  }
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

export class UnitValidator {
  /**
   * Validate that two units are compatible (same type)
   */
  static areCompatible(unit1: BaseUnit, unit2: BaseUnit): boolean {
    return unit1.type === unit2.type;
  }

  /**
   * Validate selling unit setup
   */
  static validateSellingUnit(sellingUnit: VariantSellingUnit): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Must have either system or org unit (not both)
    if (!sellingUnit.systemUnitId && !sellingUnit.orgUnitId) {
      errors.push(
        "Selling unit must reference either a system unit or organization unit",
      );
    }
    if (sellingUnit.systemUnitId && sellingUnit.orgUnitId) {
      errors.push(
        "Selling unit cannot reference both system and organization units",
      );
    }

    // Must have at least one price
    if (!sellingUnit.retailPrice && !sellingUnit.wholesalePrice) {
      errors.push(
        "Selling unit must have at least one price (retail or wholesale)",
      );
    }

    // Prices must be positive
    if (sellingUnit.retailPrice && Number(sellingUnit.retailPrice) <= 0) {
      errors.push("Retail price must be positive");
    }
    if (sellingUnit.wholesalePrice && Number(sellingUnit.wholesalePrice) <= 0) {
      errors.push("Wholesale price must be positive");
    }

    // Conversion multiplier must be positive if set
    if (
      sellingUnit.conversionMultiplier &&
      Number(sellingUnit.conversionMultiplier) <= 0
    ) {
      errors.push("Conversion multiplier must be positive");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate product variant unit setup
   */
  static validateProductVariantUnits(variant: ProductVariantUnit): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Must have a base unit
    if (!variant.baseUnitId && !variant.baseOrgUnitId) {
      errors.push("Product variant must have a base unit");
    }

    // Cannot have both system and org base unit
    if (variant.baseUnitId && variant.baseOrgUnitId) {
      errors.push(
        "Product variant cannot have both system and organization base units",
      );
    }

    // Cannot have both system and org stocking unit
    if (variant.stockingUnitId && variant.stockingOrgUnitId) {
      errors.push(
        "Product variant cannot have both system and organization stocking units",
      );
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

export class UnitFormatter {
  /**
   * Format quantity with unit symbol
   */
  static formatQuantity(
    quantity: number,
    unit: BaseUnit,
    options: {
      decimals?: number;
      locale?: string;
    } = {},
  ): string {
    const { decimals = 2, locale = "en-US" } = options;

    const formatted = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    }).format(quantity);

    return `${formatted} ${unit.symbol}`;
  }

  /**
   * Format price with currency
   */
  static formatPrice(
    price: number,
    currency: string = "USD",
    locale: string = "en-US",
  ): string {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(price);
  }

  /**
   * Format price per unit
   */
  static formatPricePerUnit(
    price: number,
    unit: BaseUnit,
    currency: string = "USD",
    locale: string = "en-US",
  ): string {
    const formattedPrice = this.formatPrice(price, currency, locale);
    return `${formattedPrice}/${unit.symbol}`;
  }

  /**
   * Format conversion result
   */
  static formatConversion(
    result: ConversionResult,
    fromUnit: BaseUnit,
    toUnit: BaseUnit,
    options: {
      decimals?: number;
      locale?: string;
    } = {},
  ): string {
    const { decimals = 2, locale = "en-US" } = options;

    const fromQty = this.formatQuantity(Number(result.fromUnit), fromUnit, {
      decimals,
      locale,
    });
    const toQty = this.formatQuantity(result.value, toUnit, {
      decimals,
      locale,
    });

    const approx = result.isApproximate ? "≈ " : "";
    return `${fromQty} = ${approx}${toQty}`;
  }
}

export const converter = new UnitConverter();
export const priceCalculator = new PriceCalculator();
