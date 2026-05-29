import { UnitType, IndustryCategory } from '@repo/db';

export class SystemUnit {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly symbol: string,
    public readonly type: UnitType,
    public readonly category: IndustryCategory,
    public readonly isBaseUnit: boolean,
    public readonly isMetric: boolean,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly abbreviation?: string | null,
    public readonly pluralName?: string | null,
    public readonly sortOrder?: number | null,
    public readonly description?: string | null,
  ) {}
}

export class OrganizationUnit {
  constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly name: string,
    public readonly symbol: string,
    public readonly type: UnitType,
    public readonly category: IndustryCategory,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly abbreviation?: string | null,
    public readonly pluralName?: string | null,
    public readonly description?: string | null,
    public readonly baseSystemUnitId?: string | null,
    public readonly conversionFactor?: number | null,
    public readonly conversionOffset?: number | null,
  ) {}
}
