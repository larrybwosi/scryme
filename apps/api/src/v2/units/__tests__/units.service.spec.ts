import { describe, it, expect, beforeEach, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { UnitsService } from "../units.service";
import { PrismaService } from "@/prisma/prisma.service";
import type { V2ApiContext } from "@repo/shared/api/v2";

describe("UnitsService (V2)", () => {
  let service: UnitsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      client: {
        systemUnit: {
          findMany: vi.fn(),
        },
        organizationUnit: {
          findMany: vi.fn(),
          updateMany: vi.fn(),
          findFirst: vi.fn(),
        },
        unitConversion: {
          findMany: vi.fn(),
        },
        orgUnitConversion: {
          findMany: vi.fn(),
        },
        productUnitConversion: {
          findMany: vi.fn(),
        },
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UnitsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<UnitsService>(UnitsService);
  });

  describe("getSystemUnits", () => {
    it("should query database on first call and serve from cache on subsequent calls", async () => {
      const mockUnits = [
        {
          id: "sys-1",
          name: "Kilogram",
          symbol: "kg",
          sortOrder: 1,
          isActive: true,
          updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        },
        {
          id: "sys-2",
          name: "Gram",
          symbol: "g",
          sortOrder: 2,
          isActive: true,
          updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        },
        {
          id: "sys-3",
          name: "Inactive Unit",
          symbol: "inactive",
          sortOrder: 3,
          isActive: false,
          updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        },
      ];

      prisma.client.systemUnit.findMany.mockResolvedValue(mockUnits);

      // First call: Queries Prisma
      const results1 = await service.getSystemUnits();
      expect(prisma.client.systemUnit.findMany).toHaveBeenCalledTimes(1);
      expect(results1).toHaveLength(2); // Inactive unit filtered out
      expect(results1[0].id).toBe("sys-1");
      expect(results1[1].id).toBe("sys-2");

      // Second call: Serves from cache, no DB queries
      const results2 = await service.getSystemUnits();
      expect(prisma.client.systemUnit.findMany).toHaveBeenCalledTimes(1);
      expect(results2).toEqual(results1);
    });
  });

  describe("syncUnits", () => {
    it("should serve system units from the cache and correctly filter them based on lastSync", async () => {
      const mockUnits = [
        {
          id: "sys-1",
          name: "Kilogram",
          symbol: "kg",
          updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        },
        {
          id: "sys-2",
          name: "Liter",
          symbol: "L",
          updatedAt: new Date("2026-06-01T00:00:00.000Z"),
        },
      ];

      prisma.client.systemUnit.findMany.mockResolvedValue(mockUnits);
      prisma.client.organizationUnit.findMany.mockResolvedValue([]);
      prisma.client.unitConversion.findMany.mockResolvedValue([]);
      prisma.client.orgUnitConversion.findMany.mockResolvedValue([]);
      prisma.client.productUnitConversion.findMany.mockResolvedValue([]);

      const ctx: V2ApiContext = { organizationId: "org-123" } as any;

      // sync with lastSync older than both units (should return both)
      const res1 = await service.syncUnits(ctx, "2025-01-01T00:00:00.000Z");
      expect(prisma.client.systemUnit.findMany).toHaveBeenCalledTimes(1);
      expect(res1.systemUnits).toHaveLength(2);

      // sync with lastSync after sys-1 but before sys-2 (should only return sys-2, served from cache)
      const res2 = await service.syncUnits(ctx, "2026-03-01T00:00:00.000Z");
      expect(prisma.client.systemUnit.findMany).toHaveBeenCalledTimes(1); // Call count remains 1 (served from cache)
      expect(res2.systemUnits).toHaveLength(1);
      expect(res2.systemUnits[0].id).toBe("sys-2");
    });
  });
});
