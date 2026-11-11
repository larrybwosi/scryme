import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @repo/db
vi.mock("@repo/db", () => ({
  LocationType: {
    RETAIL_SHOP: "RETAIL_SHOP",
    WAREHOUSE: "WAREHOUSE",
  },
  StorageUnitType: {
    SHELF: "SHELF",
  },
  UnitType: {
    PIECE: "PIECE",
  },
  db: {
    inventoryLocation: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    member: {
      findFirst: vi.fn(),
    },
    storageZone: {
      findFirst: vi.fn(),
    },
    storageUnit: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(async (arg: any) => {
      if (typeof arg === "function") {
        return arg({
          inventoryLocation: {
            updateMany: vi.fn(),
            create: vi.fn(async (params: any) => ({ id: "loc-new", ...params.data })),
            update: vi.fn(async (params: any) => ({ id: params.where.id, ...params.data })),
          },
        });
      }
      return Promise.all(arg);
    }),
  },
}));

// Mock auth context helper
vi.mock("../auth", () => ({
  getOrganizationContext: vi.fn(),
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { db } from "@repo/db";
import { getOrganizationContext } from "../auth";
import { createLocation, updateLocation, createUnit } from "../locations";

describe("Locations Server Actions - Concurrent Relational Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createLocation", () => {
    it("should throw error if unauthenticated", async () => {
      (getOrganizationContext as any).mockResolvedValue(null);

      await expect(
        createLocation({
          name: "Warehouse 1",
          locationType: "WAREHOUSE" as any,
        }),
      ).rejects.toThrow("Unauthorized");
    });

    it("should reject creation if parent location does not belong to organization", async () => {
      (getOrganizationContext as any).mockResolvedValue({
        organizationId: "org-1",
      });
      (db.inventoryLocation.findFirst as any).mockResolvedValue(null);
      (db.member.findFirst as any).mockResolvedValue({ id: "mem-1" });

      await expect(
        createLocation({
          name: "Sub Location",
          locationType: "WAREHOUSE" as any,
          parentLocationId: "foreign-parent-id",
          managerId: "mem-1",
        }),
      ).rejects.toThrow("Invalid parent location ID or unauthorized");

      expect(db.inventoryLocation.findFirst).toHaveBeenCalledWith({
        where: { id: "foreign-parent-id", organizationId: "org-1" },
        select: { id: true },
      });
      expect(db.member.findFirst).toHaveBeenCalledWith({
        where: { id: "mem-1", organizationId: "org-1" },
        select: { id: true },
      });
    });

    it("should reject creation if manager does not belong to organization", async () => {
      (getOrganizationContext as any).mockResolvedValue({
        organizationId: "org-1",
      });
      (db.inventoryLocation.findFirst as any).mockResolvedValue({ id: "parent-1" });
      (db.member.findFirst as any).mockResolvedValue(null);

      await expect(
        createLocation({
          name: "Sub Location",
          locationType: "WAREHOUSE" as any,
          parentLocationId: "parent-1",
          managerId: "foreign-manager-id",
        }),
      ).rejects.toThrow("Invalid manager ID or unauthorized");

      expect(db.inventoryLocation.findFirst).toHaveBeenCalledWith({
        where: { id: "parent-1", organizationId: "org-1" },
        select: { id: true },
      });
      expect(db.member.findFirst).toHaveBeenCalledWith({
        where: { id: "foreign-manager-id", organizationId: "org-1" },
        select: { id: true },
      });
    });

    it("should parallelize parent and manager lookups concurrently and create location", async () => {
      (getOrganizationContext as any).mockResolvedValue({
        organizationId: "org-1",
      });
      (db.inventoryLocation.findFirst as any).mockResolvedValue({ id: "parent-1" });
      (db.member.findFirst as any).mockResolvedValue({ id: "mem-1" });

      const result = await createLocation({
        name: "Regional Warehouse",
        locationType: "WAREHOUSE" as any,
        parentLocationId: "parent-1",
        managerId: "mem-1",
      });

      expect(result).toMatchObject({
        name: "Regional Warehouse",
        organizationId: "org-1",
        parentLocationId: "parent-1",
        managerId: "mem-1",
      });

      expect(db.inventoryLocation.findFirst).toHaveBeenCalledWith({
        where: { id: "parent-1", organizationId: "org-1" },
        select: { id: true },
      });
      expect(db.member.findFirst).toHaveBeenCalledWith({
        where: { id: "mem-1", organizationId: "org-1" },
        select: { id: true },
      });
    });
  });

  describe("updateLocation", () => {
    it("should throw error if unauthenticated", async () => {
      (getOrganizationContext as any).mockResolvedValue(null);

      await expect(
        updateLocation("loc-1", {
          name: "Updated Name",
        }),
      ).rejects.toThrow("Unauthorized");
    });

    it("should reject update if location not found in organization", async () => {
      (getOrganizationContext as any).mockResolvedValue({
        organizationId: "org-1",
      });
      (db.inventoryLocation.findFirst as any).mockResolvedValue(null);

      await expect(
        updateLocation("loc-foreign", {
          name: "Updated Name",
        }),
      ).rejects.toThrow("Location not found or unauthorized");
    });

    it("should reject update if location is set as its own parent", async () => {
      (getOrganizationContext as any).mockResolvedValue({
        organizationId: "org-1",
      });
      (db.inventoryLocation.findFirst as any).mockResolvedValue({ id: "loc-1" });

      await expect(
        updateLocation("loc-1", {
          parentLocationId: "loc-1",
        }),
      ).rejects.toThrow("Location cannot be its own parent");
    });

    it("should reject update if parent location does not belong to organization", async () => {
      (getOrganizationContext as any).mockResolvedValue({
        organizationId: "org-1",
      });
      (db.inventoryLocation.findFirst as any)
        .mockResolvedValueOnce({ id: "loc-1" }) // target location lookup
        .mockResolvedValueOnce(null); // parent validation lookup
      (db.member.findFirst as any).mockResolvedValue({ id: "mem-1" });

      await expect(
        updateLocation("loc-1", {
          parentLocationId: "foreign-parent-id",
          managerId: "mem-1",
        }),
      ).rejects.toThrow("Invalid parent location ID or unauthorized");

      expect(db.inventoryLocation.findFirst).toHaveBeenCalledWith({
        where: { id: "foreign-parent-id", organizationId: "org-1" },
        select: { id: true },
      });
      expect(db.member.findFirst).toHaveBeenCalledWith({
        where: { id: "mem-1", organizationId: "org-1" },
        select: { id: true },
      });
    });

    it("should reject update if manager does not belong to organization", async () => {
      (getOrganizationContext as any).mockResolvedValue({
        organizationId: "org-1",
      });
      (db.inventoryLocation.findFirst as any)
        .mockResolvedValueOnce({ id: "loc-1" }) // target location lookup
        .mockResolvedValueOnce({ id: "parent-1" }); // parent validation lookup
      (db.member.findFirst as any).mockResolvedValue(null);

      await expect(
        updateLocation("loc-1", {
          parentLocationId: "parent-1",
          managerId: "foreign-manager-id",
        }),
      ).rejects.toThrow("Invalid manager ID or unauthorized");

      expect(db.inventoryLocation.findFirst).toHaveBeenCalledWith({
        where: { id: "parent-1", organizationId: "org-1" },
        select: { id: true },
      });
      expect(db.member.findFirst).toHaveBeenCalledWith({
        where: { id: "foreign-manager-id", organizationId: "org-1" },
        select: { id: true },
      });
    });

    it("should parallelize parent and manager lookups concurrently and update location", async () => {
      (getOrganizationContext as any).mockResolvedValue({
        organizationId: "org-1",
      });
      (db.inventoryLocation.findFirst as any)
        .mockResolvedValueOnce({ id: "loc-1" }) // target location lookup
        .mockResolvedValueOnce({ id: "parent-1" }); // parent validation lookup
      (db.member.findFirst as any).mockResolvedValue({ id: "mem-1" });

      const result = await updateLocation("loc-1", {
        name: "Renamed Location",
        parentLocationId: "parent-1",
        managerId: "mem-1",
      });

      expect(result).toMatchObject({
        id: "loc-1",
        name: "Renamed Location",
        parentLocationId: "parent-1",
        managerId: "mem-1",
      });

      expect(db.inventoryLocation.findFirst).toHaveBeenCalledWith({
        where: { id: "parent-1", organizationId: "org-1" },
        select: { id: true },
      });
      expect(db.member.findFirst).toHaveBeenCalledWith({
        where: { id: "mem-1", organizationId: "org-1" },
        select: { id: true },
      });
    });
  });

  describe("createUnit", () => {
    it("should throw error if unauthenticated", async () => {
      (getOrganizationContext as any).mockResolvedValue(null);

      await expect(
        createUnit({
          name: "Unit A1",
          unitType: "SHELF" as any,
          locationId: "loc-1",
        }),
      ).rejects.toThrow("Unauthorized");
    });

    it("should reject creation if target location does not belong to organization", async () => {
      (getOrganizationContext as any).mockResolvedValue({
        organizationId: "org-1",
      });
      (db.inventoryLocation.findFirst as any).mockResolvedValue(null);
      (db.storageZone.findFirst as any).mockResolvedValue({ id: "zone-1" });

      await expect(
        createUnit({
          name: "Unit A1",
          unitType: "SHELF" as any,
          locationId: "foreign-loc",
          zoneId: "zone-1",
        }),
      ).rejects.toThrow("Invalid location ID or unauthorized");

      expect(db.inventoryLocation.findFirst).toHaveBeenCalledWith({
        where: { id: "foreign-loc", organizationId: "org-1" },
        select: { id: true },
      });
      expect(db.storageZone.findFirst).toHaveBeenCalledWith({
        where: { id: "zone-1", locationId: "foreign-loc", organizationId: "org-1" },
        select: { id: true },
      });
    });

    it("should reject creation if target zone does not belong to organization and location", async () => {
      (getOrganizationContext as any).mockResolvedValue({
        organizationId: "org-1",
      });
      (db.inventoryLocation.findFirst as any).mockResolvedValue({ id: "loc-1" });
      (db.storageZone.findFirst as any).mockResolvedValue(null);

      await expect(
        createUnit({
          name: "Unit A1",
          unitType: "SHELF" as any,
          locationId: "loc-1",
          zoneId: "foreign-zone",
        }),
      ).rejects.toThrow("Invalid zone ID or unauthorized");

      expect(db.inventoryLocation.findFirst).toHaveBeenCalledWith({
        where: { id: "loc-1", organizationId: "org-1" },
        select: { id: true },
      });
      expect(db.storageZone.findFirst).toHaveBeenCalledWith({
        where: { id: "foreign-zone", locationId: "loc-1", organizationId: "org-1" },
        select: { id: true },
      });
    });

    it("should parallelize location and zone lookups concurrently and create unit", async () => {
      (getOrganizationContext as any).mockResolvedValue({
        organizationId: "org-1",
      });
      (db.inventoryLocation.findFirst as any).mockResolvedValue({ id: "loc-1" });
      (db.storageZone.findFirst as any).mockResolvedValue({ id: "zone-1" });
      (db.storageUnit.create as any).mockResolvedValue({
        id: "unit-1",
        name: "Unit A1",
        locationId: "loc-1",
        zoneId: "zone-1",
        organizationId: "org-1",
      });

      const result = await createUnit({
        name: "Unit A1",
        unitType: "SHELF" as any,
        locationId: "loc-1",
        zoneId: "zone-1",
      });

      expect(result).toMatchObject({
        id: "unit-1",
        name: "Unit A1",
        locationId: "loc-1",
        zoneId: "zone-1",
        organizationId: "org-1",
      });

      expect(db.inventoryLocation.findFirst).toHaveBeenCalledWith({
        where: { id: "loc-1", organizationId: "org-1" },
        select: { id: true },
      });
      expect(db.storageZone.findFirst).toHaveBeenCalledWith({
        where: { id: "zone-1", locationId: "loc-1", organizationId: "org-1" },
        select: { id: true },
      });
      expect(db.storageUnit.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: "Unit A1",
          locationId: "loc-1",
          zoneId: "zone-1",
          organizationId: "org-1",
        }),
      });
    });

    it("should create unit without zone lookup when zoneId is not provided", async () => {
      (getOrganizationContext as any).mockResolvedValue({
        organizationId: "org-1",
      });
      (db.inventoryLocation.findFirst as any).mockResolvedValue({ id: "loc-1" });
      (db.storageUnit.create as any).mockResolvedValue({
        id: "unit-2",
        name: "Floor Unit",
        locationId: "loc-1",
        organizationId: "org-1",
      });

      const result = await createUnit({
        name: "Floor Unit",
        unitType: "SHELF" as any,
        locationId: "loc-1",
      });

      expect(result).toMatchObject({
        id: "unit-2",
        name: "Floor Unit",
        locationId: "loc-1",
      });
      expect(db.inventoryLocation.findFirst).toHaveBeenCalledWith({
        where: { id: "loc-1", organizationId: "org-1" },
        select: { id: true },
      });
      expect(db.storageZone.findFirst).not.toHaveBeenCalled();
    });
  });
});
