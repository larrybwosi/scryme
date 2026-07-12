const UnitType = {
  MASS: "MASS",
  VOLUME: "VOLUME",
  LENGTH: "LENGTH",
  AREA: "AREA",
  COUNT: "COUNT",
  TIME: "TIME",
} as const;

const IndustryCategory = {
  UNIVERSAL: "UNIVERSAL",
} as const;

// System Units data definition
const units = [
  // MASS
  {
    name: "Kilogram",
    symbol: "kg",
    pluralName: "Kilograms",
    type: UnitType.MASS,
    category: IndustryCategory.UNIVERSAL,
    isBaseUnit: true,
    isMetric: true,
    sortOrder: 1,
  },
  {
    name: "Gram",
    symbol: "g",
    pluralName: "Grams",
    type: UnitType.MASS,
    category: IndustryCategory.UNIVERSAL,
    isBaseUnit: false,
    isMetric: true,
    sortOrder: 2,
  },
  {
    name: "Milligram",
    symbol: "mg",
    pluralName: "Milligrams",
    type: UnitType.MASS,
    category: IndustryCategory.UNIVERSAL,
    isBaseUnit: false,
    isMetric: true,
    sortOrder: 3,
  },
  {
    name: "Pound",
    symbol: "lb",
    pluralName: "Pounds",
    type: UnitType.MASS,
    category: IndustryCategory.UNIVERSAL,
    isBaseUnit: false,
    isMetric: false,
    sortOrder: 4,
  },
  {
    name: "Ounce",
    symbol: "oz",
    pluralName: "Ounces",
    type: UnitType.MASS,
    category: IndustryCategory.UNIVERSAL,
    isBaseUnit: false,
    isMetric: false,
    sortOrder: 5,
  },

  // VOLUME
  {
    name: "Liter",
    symbol: "L",
    pluralName: "Liters",
    type: UnitType.VOLUME,
    category: IndustryCategory.UNIVERSAL,
    isBaseUnit: true,
    isMetric: true,
    sortOrder: 1,
  },
  {
    name: "Milliliter",
    symbol: "mL",
    pluralName: "Milliliters",
    type: UnitType.VOLUME,
    category: IndustryCategory.UNIVERSAL,
    isBaseUnit: false,
    isMetric: true,
    sortOrder: 2,
  },
  {
    name: "US Gallon",
    symbol: "gal",
    pluralName: "US Gallons",
    type: UnitType.VOLUME,
    category: IndustryCategory.UNIVERSAL,
    isBaseUnit: false,
    isMetric: false,
    sortOrder: 3,
  },
  {
    name: "US Quart",
    symbol: "qt",
    pluralName: "US Quarts",
    type: UnitType.VOLUME,
    category: IndustryCategory.UNIVERSAL,
    isBaseUnit: false,
    isMetric: false,
    sortOrder: 4,
  },
  {
    name: "US Pint",
    symbol: "pt",
    pluralName: "US Pints",
    type: UnitType.VOLUME,
    category: IndustryCategory.UNIVERSAL,
    isBaseUnit: false,
    isMetric: false,
    sortOrder: 5,
  },
  {
    name: "US Cup",
    symbol: "cup",
    pluralName: "US Cups",
    type: UnitType.VOLUME,
    category: IndustryCategory.UNIVERSAL,
    isBaseUnit: false,
    isMetric: false,
    sortOrder: 6,
  },
  {
    name: "Fluid Ounce",
    symbol: "fl oz",
    pluralName: "Fluid Ounces",
    type: UnitType.VOLUME,
    category: IndustryCategory.UNIVERSAL,
    isBaseUnit: false,
    isMetric: false,
    sortOrder: 7,
  },

  // LENGTH
  {
    name: "Meter",
    symbol: "m",
    pluralName: "Meters",
    type: UnitType.LENGTH,
    category: IndustryCategory.UNIVERSAL,
    isBaseUnit: true,
    isMetric: true,
    sortOrder: 1,
  },
  {
    name: "Centimeter",
    symbol: "cm",
    pluralName: "Centimeters",
    type: UnitType.LENGTH,
    category: IndustryCategory.UNIVERSAL,
    isBaseUnit: false,
    isMetric: true,
    sortOrder: 2,
  },
  {
    name: "Millimeter",
    symbol: "mm",
    pluralName: "Millimeters",
    type: UnitType.LENGTH,
    category: IndustryCategory.UNIVERSAL,
    isBaseUnit: false,
    isMetric: true,
    sortOrder: 3,
  },
  {
    name: "Inch",
    symbol: "in",
    pluralName: "Inches",
    type: UnitType.LENGTH,
    category: IndustryCategory.UNIVERSAL,
    isBaseUnit: false,
    isMetric: false,
    sortOrder: 4,
  },
  {
    name: "Foot",
    symbol: "ft",
    pluralName: "Feet",
    type: UnitType.LENGTH,
    category: IndustryCategory.UNIVERSAL,
    isBaseUnit: false,
    isMetric: false,
    sortOrder: 5,
  },

  // AREA
  {
    name: "Square Meter",
    symbol: "m²",
    pluralName: "Square Meters",
    type: UnitType.AREA,
    category: IndustryCategory.UNIVERSAL,
    isBaseUnit: true,
    isMetric: true,
    sortOrder: 1,
  },
  {
    name: "Square Foot",
    symbol: "ft²",
    pluralName: "Square Feet",
    type: UnitType.AREA,
    category: IndustryCategory.UNIVERSAL,
    isBaseUnit: false,
    isMetric: false,
    sortOrder: 2,
  },

  // COUNT
  {
    name: "Piece",
    symbol: "pc",
    pluralName: "Pieces",
    type: UnitType.COUNT,
    category: IndustryCategory.UNIVERSAL,
    isBaseUnit: true,
    isMetric: false,
    sortOrder: 1,
  },
  {
    name: "Dozen",
    symbol: "doz",
    pluralName: "Dozens",
    type: UnitType.COUNT,
    category: IndustryCategory.UNIVERSAL,
    isBaseUnit: false,
    isMetric: false,
    sortOrder: 2,
  },
  {
    name: "Pack",
    symbol: "pk",
    pluralName: "Packs",
    type: UnitType.COUNT,
    category: IndustryCategory.UNIVERSAL,
    isBaseUnit: false,
    isMetric: false,
    sortOrder: 3,
  },
  {
    name: "Case",
    symbol: "cs",
    pluralName: "Cases",
    type: UnitType.COUNT,
    category: IndustryCategory.UNIVERSAL,
    isBaseUnit: false,
    isMetric: false,
    sortOrder: 4,
  },
  {
    name: "Pallet",
    symbol: "pal",
    pluralName: "Pallets",
    type: UnitType.COUNT,
    category: IndustryCategory.UNIVERSAL,
    isBaseUnit: false,
    isMetric: false,
    sortOrder: 5,
  },

  // TIME
  {
    name: "Second",
    symbol: "s",
    pluralName: "Seconds",
    type: UnitType.TIME,
    category: IndustryCategory.UNIVERSAL,
    isBaseUnit: true,
    isMetric: true,
    sortOrder: 1,
  },
  {
    name: "Minute",
    symbol: "min",
    pluralName: "Minutes",
    type: UnitType.TIME,
    category: IndustryCategory.UNIVERSAL,
    isBaseUnit: false,
    isMetric: true,
    sortOrder: 2,
  },
  {
    name: "Hour",
    symbol: "hr",
    pluralName: "Hours",
    type: UnitType.TIME,
    category: IndustryCategory.UNIVERSAL,
    isBaseUnit: false,
    isMetric: true,
    sortOrder: 3,
  },
  {
    name: "Day",
    symbol: "d",
    pluralName: "Days",
    type: UnitType.TIME,
    category: IndustryCategory.UNIVERSAL,
    isBaseUnit: false,
    isMetric: true,
    sortOrder: 4,
  },
];

const conversions = [
  // MASS (base: kg)
  { from: "kg", to: "g", factor: 1000 },
  { from: "g", to: "kg", factor: 0.001 },
  { from: "kg", to: "mg", factor: 1000000 },
  { from: "mg", to: "kg", factor: 0.000001 },
  { from: "g", to: "mg", factor: 1000 },
  { from: "mg", to: "g", factor: 0.001 },
  { from: "kg", to: "lb", factor: 2.20462 },
  { from: "lb", to: "kg", factor: 0.453592 },
  { from: "kg", to: "oz", factor: 35.274 },
  { from: "oz", to: "kg", factor: 0.0283495 },
  { from: "lb", to: "oz", factor: 16 },
  { from: "oz", to: "lb", factor: 0.0625 },

  // VOLUME (base: L)
  { from: "L", to: "mL", factor: 1000 },
  { from: "mL", to: "L", factor: 0.001 },
  { from: "L", to: "gal", factor: 0.264172 },
  { from: "gal", to: "L", factor: 3.78541 },
  { from: "L", to: "qt", factor: 1.05669 },
  { from: "qt", to: "L", factor: 0.946353 },
  { from: "L", to: "pt", factor: 2.11338 },
  { from: "pt", to: "L", factor: 0.473176 },
  { from: "L", to: "cup", factor: 4.22675 },
  { from: "cup", to: "L", factor: 0.236588 },
  { from: "L", to: "fl oz", factor: 33.814 },
  { from: "fl oz", to: "L", factor: 0.0295735 },

  // LENGTH (base: m)
  { from: "m", to: "cm", factor: 100 },
  { from: "cm", to: "m", factor: 0.01 },
  { from: "m", to: "mm", factor: 1000 },
  { from: "mm", to: "m", factor: 0.001 },
  { from: "cm", to: "mm", factor: 10 },
  { from: "mm", to: "cm", factor: 0.1 },
  { from: "m", to: "in", factor: 39.3701 },
  { from: "in", to: "m", factor: 0.0254 },
  { from: "m", to: "ft", factor: 3.28084 },
  { from: "ft", to: "m", factor: 0.3048 },
  { from: "ft", to: "in", factor: 12 },
  { from: "in", to: "ft", factor: 0.0833333 },

  // AREA (base: m2)
  { from: "m²", to: "ft²", factor: 10.7639 },
  { from: "ft²", to: "m²", factor: 0.092903 },

  // COUNT
  { from: "doz", to: "pc", factor: 12 },
  { from: "pc", to: "doz", factor: 1 / 12 },

  // TIME (base: s)
  { from: "min", to: "s", factor: 60 },
  { from: "s", to: "min", factor: 1 / 60 },
  { from: "hr", to: "s", factor: 3600 },
  { from: "s", to: "hr", factor: 1 / 3600 },
  { from: "hr", to: "min", factor: 60 },
  { from: "min", to: "hr", factor: 1 / 60 },
  { from: "d", to: "hr", factor: 24 },
  { from: "hr", to: "d", factor: 1 / 24 },
];

async function seedUnits(prisma: any) {
  console.log("Seeding system units...");
  for (const unit of units) {
    await prisma.systemUnit.upsert({
      where: { symbol: unit.symbol },
      update: unit,
      create: unit,
    });
  }
}

async function seedConversions(prisma: any) {
  console.log("Seeding unit conversions...");
  const unitMap = new global.Map<string, string>();
  const dbUnits = await prisma.systemUnit.findMany();
  dbUnits.forEach((u: any) => unitMap.set(u.symbol, u.id));

  for (const conv of conversions) {
    const fromId = unitMap.get(conv.from);
    const toId = unitMap.get(conv.to);

    if (fromId && toId) {
      await prisma.unitConversion.upsert({
        where: {
          fromUnitId_toUnitId: { fromUnitId: fromId, toUnitId: toId },
        },
        update: { factor: conv.factor },
        create: {
          fromUnitId: fromId,
          toUnitId: toId,
          factor: conv.factor,
        },
      });
    }
  }
}

async function main() {
  let prisma: any;
  try {
    prisma = (await import("../src/client")).prisma;
  } catch (err) {
    prisma = (await import("../packages/db/src/client")).prisma;
  }

  await seedUnits(prisma);
  await seedConversions(prisma);

  console.log("Seed completed successfully.");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
