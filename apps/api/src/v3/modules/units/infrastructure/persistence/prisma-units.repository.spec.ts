import { describe, it, expect, beforeEach, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { PrismaUnitsRepository } from "./prisma-units.repository";
import { PrismaService } from "@/prisma/prisma.service";
import { UnitType, IndustryCategory } from "@repo/db";

describe("PrismaUnitsRepository", () => {
  let repository: PrismaUnitsRepository;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      client: {
        systemUnit: {
          findMany: vi.fn(),
        },
        organizationUnit: {
          findMany: vi.fn(),
        },
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaUnitsRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repository = module.get<PrismaUnitsRepository>(PrismaUnitsRepository);
  });

  describe("findManySystemUnits", () => {
    it("should query the database on first call and populate the cache", async () => {
      const dbUnits = [
        {
          id: "sys-1",
          name: "Kilogram",
          symbol: "kg",
          type: UnitType.MASS,
          category: IndustryCategory.UNIVERSAL,
          isBaseUnit: true,
          isMetric: true,
          isActive: true,
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          updatedAt: new Date("2026-01-01T00:00:00.000Z"),
          abbreviation: null,
          pluralName: null,
          sortOrder: null,
          description: null,
        },
      ];

      prisma.client.systemUnit.findMany.mockResolvedValue(dbUnits);

      // First call
      const results1 = await repository.findManySystemUnits();
      expect(prisma.client.systemUnit.findMany).toHaveBeenCalledTimes(1);
      expect(results1).toHaveLength(1);
      expect(results1[0].id).toBe("sys-1");

      // Second call (should be served from cache, no database query)
      const results2 = await repository.findManySystemUnits();
      expect(prisma.client.systemUnit.findMany).toHaveBeenCalledTimes(1); // Still 1
      expect(results2).toEqual(results1);
    });

    it("should filter the cache in-memory when lastSync is provided", async () => {
      const dbUnits = [
        {
          id: "sys-1",
          name: "Kilogram",
          symbol: "kg",
          type: UnitType.MASS,
          category: IndustryCategory.UNIVERSAL,
          isBaseUnit: true,
          isMetric: true,
          isActive: true,
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          updatedAt: new Date("2026-01-01T00:00:00.000Z"),
          abbreviation: null,
          pluralName: null,
          sortOrder: null,
          description: null,
        },
        {
          id: "sys-2",
          name: "Liter",
          symbol: "L",
          type: UnitType.VOLUME,
          category: IndustryCategory.UNIVERSAL,
          isBaseUnit: true,
          isMetric: true,
          isActive: true,
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          updatedAt: new Date("2026-07-20T00:00:00.000Z"),
          abbreviation: null,
          pluralName: null,
          sortOrder: null,
          description: null,
        },
      ];

      prisma.client.systemUnit.findMany.mockResolvedValue(dbUnits);

      // Warm up cache
      await repository.findManySystemUnits();
      expect(prisma.client.systemUnit.findMany).toHaveBeenCalledTimes(1);

      // Call with lastSync (should filter in-memory, no database query)
      const lastSync = new Date("2026-03-01T00:00:00.000Z");
      const results = await repository.findManySystemUnits(lastSync);

      expect(prisma.client.systemUnit.findMany).toHaveBeenCalledTimes(1); // Still 1
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("sys-2"); // sys-2 is newer than lastSync
    });
  });

  describe("findManyOrganizationUnits", () => {
    it("should not cache organization-specific units", async () => {
      const dbUnits = [
        {
          id: "org-u-1",
          organizationId: "org-1",
          name: "Custom Box",
          symbol: "box",
          type: UnitType.COUNT,
          category: IndustryCategory.UNIVERSAL,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          abbreviation: null,
          pluralName: null,
          description: null,
          baseSystemUnitId: null,
          conversionFactor: null,
          conversionOffset: null,
        },
      ];

      prisma.client.organizationUnit.findMany.mockResolvedValue(dbUnits);

      await repository.findManyOrganizationUnits("org-1");
      await repository.findManyOrganizationUnits("org-1");

      // Organization units are dynamic and tenant-isolated, so they are not cached in memory.
      // They should be queried every time.
      expect(prisma.client.organizationUnit.findMany).toHaveBeenCalledTimes(2);
    });
  });
});
