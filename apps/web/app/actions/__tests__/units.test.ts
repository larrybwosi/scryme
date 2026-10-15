import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @repo/db
vi.mock("@repo/db", () => ({
  db: {
    systemUnit: {
      findMany: vi.fn(),
    },
    organizationUnit: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findFirstOrThrow: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    orgUnitConversion: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findFirstOrThrow: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
  Decimal: class Decimal {
    val: any;
    constructor(val: any) {
      this.val = val;
    }
  },
  UnitType: {
    WEIGHT: "WEIGHT",
    VOLUME: "VOLUME",
    COUNT: "COUNT",
  },
}));

// Mock @repo/auth/server
vi.mock("@repo/auth/server", () => ({
  getServerAuth: vi.fn(),
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import {
  getSystemUnits,
  getOrganizationUnits,
  createOrganizationUnit,
  updateOrganizationUnit,
  deleteOrganizationUnit,
  getOrgUnitConversions,
  createOrgUnitConversion,
  updateOrgUnitConversion,
  deleteOrgUnitConversion,
} from "../units";

describe("Organization Unit Management Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSystemUnits", () => {
    it("should return active system units", async () => {
      (db.systemUnit.findMany as any).mockResolvedValue([
        { id: "sys-1", name: "Kilogram" },
      ]);

      const result = await getSystemUnits();
      expect(result).toEqual([{ id: "sys-1", name: "Kilogram" }]);
      expect(db.systemUnit.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: [{ type: "asc" }, { name: "asc" }],
      });
    });
  });

  describe("getOrganizationUnits", () => {
    it("should return empty array when unauthenticated", async () => {
      (getServerAuth as any).mockResolvedValue(null);

      const result = await getOrganizationUnits();
      expect(result).toEqual([]);
      expect(db.organizationUnit.findMany).not.toHaveBeenCalled();
    });

    it("should fetch organization units scoped to organizationId", async () => {
      (getServerAuth as any).mockResolvedValue({ organizationId: "org-1" });
      (db.organizationUnit.findMany as any).mockResolvedValue([
        { id: "unit-1", name: "Box" },
      ]);

      const result = await getOrganizationUnits();
      expect(result).toEqual([{ id: "unit-1", name: "Box" }]);
      expect(db.organizationUnit.findMany).toHaveBeenCalledWith({
        where: { organizationId: "org-1" },
        include: { baseSystemUnit: true },
        orderBy: [{ type: "asc" }, { name: "asc" }],
      });
    });
  });

  describe("createOrganizationUnit", () => {
    it("should throw error if unauthenticated", async () => {
      (getServerAuth as any).mockResolvedValue(null);

      await expect(
        createOrganizationUnit({
          name: "Box",
          symbol: "bx",
          type: "COUNT" as any,
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("should create organization unit attached to context.organizationId", async () => {
      (getServerAuth as any).mockResolvedValue({ organizationId: "org-1" });
      (db.organizationUnit.create as any).mockResolvedValue({
        id: "unit-1",
        name: "Box",
      });

      const result = await createOrganizationUnit({
        name: "Box",
        symbol: "bx",
        type: "COUNT" as any,
        conversionFactor: 12,
      });

      expect(result).toEqual({ id: "unit-1", name: "Box" });
      expect(db.organizationUnit.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: "Box",
          symbol: "bx",
          organizationId: "org-1",
        }),
      });
    });
  });

  describe("updateOrganizationUnit", () => {
    it("should throw error if unit does not belong to organization", async () => {
      (getServerAuth as any).mockResolvedValue({ organizationId: "org-1" });
      (db.organizationUnit.findFirst as any).mockResolvedValue(null);

      await expect(
        updateOrganizationUnit("foreign-unit", { name: "New Name" })
      ).rejects.toThrow("Organization unit not found");

      expect(db.organizationUnit.findFirst).toHaveBeenCalledWith({
        where: { id: "foreign-unit", organizationId: "org-1" },
      });
      expect(db.organizationUnit.updateMany).not.toHaveBeenCalled();
    });

    it("should update unit using updateMany scoped by organizationId", async () => {
      (getServerAuth as any).mockResolvedValue({ organizationId: "org-1" });
      (db.organizationUnit.findFirst as any).mockResolvedValue({
        id: "unit-1",
        organizationId: "org-1",
      });
      (db.organizationUnit.updateMany as any).mockResolvedValue({ count: 1 });
      (db.organizationUnit.findFirstOrThrow as any).mockResolvedValue({
        id: "unit-1",
        name: "Updated Box",
      });

      const result = await updateOrganizationUnit("unit-1", {
        name: "Updated Box",
      });

      expect(result).toEqual({ id: "unit-1", name: "Updated Box" });
      expect(db.organizationUnit.updateMany).toHaveBeenCalledWith({
        where: { id: "unit-1", organizationId: "org-1" },
        data: expect.objectContaining({ name: "Updated Box" }),
      });
    });
  });

  describe("deleteOrganizationUnit", () => {
    it("should throw error if unit to delete does not belong to organization", async () => {
      (getServerAuth as any).mockResolvedValue({ organizationId: "org-1" });
      (db.organizationUnit.findFirst as any).mockResolvedValue(null);

      await expect(deleteOrganizationUnit("foreign-unit")).rejects.toThrow(
        "Organization unit not found"
      );
      expect(db.organizationUnit.deleteMany).not.toHaveBeenCalled();
    });

    it("should delete unit using deleteMany scoped by organizationId", async () => {
      (getServerAuth as any).mockResolvedValue({ organizationId: "org-1" });
      (db.organizationUnit.findFirst as any).mockResolvedValue({
        id: "unit-1",
        organizationId: "org-1",
      });
      (db.organizationUnit.deleteMany as any).mockResolvedValue({ count: 1 });

      await deleteOrganizationUnit("unit-1");

      expect(db.organizationUnit.deleteMany).toHaveBeenCalledWith({
        where: { id: "unit-1", organizationId: "org-1" },
      });
    });
  });

  describe("createOrgUnitConversion", () => {
    it("should throw error if fromUnit belongs to a different organization", async () => {
      (getServerAuth as any).mockResolvedValue({ organizationId: "org-1" });
      (db.organizationUnit.findFirst as any)
        .mockResolvedValueOnce(null) // fromUnit not found in org-1
        .mockResolvedValueOnce({ id: "unit-2", organizationId: "org-1" }); // toUnit found

      await expect(
        createOrgUnitConversion({
          fromUnitId: "foreign-unit-1",
          toUnitId: "unit-2",
          factor: 10,
        })
      ).rejects.toThrow("Invalid fromUnit or toUnit for this organization");

      expect(db.orgUnitConversion.create).not.toHaveBeenCalled();
    });

    it("should throw error if toUnit belongs to a different organization", async () => {
      (getServerAuth as any).mockResolvedValue({ organizationId: "org-1" });
      (db.organizationUnit.findFirst as any)
        .mockResolvedValueOnce({ id: "unit-1", organizationId: "org-1" })
        .mockResolvedValueOnce(null); // toUnit not found in org-1

      await expect(
        createOrgUnitConversion({
          fromUnitId: "unit-1",
          toUnitId: "foreign-unit-2",
          factor: 10,
        })
      ).rejects.toThrow("Invalid fromUnit or toUnit for this organization");

      expect(db.orgUnitConversion.create).not.toHaveBeenCalled();
    });

    it("should create conversion when both units belong to organization", async () => {
      (getServerAuth as any).mockResolvedValue({ organizationId: "org-1" });
      (db.organizationUnit.findFirst as any)
        .mockResolvedValueOnce({ id: "unit-1", organizationId: "org-1" })
        .mockResolvedValueOnce({ id: "unit-2", organizationId: "org-1" });

      (db.orgUnitConversion.create as any).mockResolvedValue({
        id: "conv-1",
        fromUnitId: "unit-1",
        toUnitId: "unit-2",
      });

      const result = await createOrgUnitConversion({
        fromUnitId: "unit-1",
        toUnitId: "unit-2",
        factor: 10,
      });

      expect(result).toEqual({
        id: "conv-1",
        fromUnitId: "unit-1",
        toUnitId: "unit-2",
      });
      expect(db.orgUnitConversion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          fromUnitId: "unit-1",
          toUnitId: "unit-2",
          organizationId: "org-1",
        }),
      });
    });
  });

  describe("updateOrgUnitConversion", () => {
    it("should throw error if conversion does not belong to organization", async () => {
      (getServerAuth as any).mockResolvedValue({ organizationId: "org-1" });
      (db.orgUnitConversion.findFirst as any).mockResolvedValue(null);

      await expect(
        updateOrgUnitConversion("foreign-conv", { factor: 5 })
      ).rejects.toThrow("Conversion not found");

      expect(db.orgUnitConversion.updateMany).not.toHaveBeenCalled();
    });

    it("should update conversion using updateMany scoped by organizationId", async () => {
      (getServerAuth as any).mockResolvedValue({ organizationId: "org-1" });
      (db.orgUnitConversion.findFirst as any).mockResolvedValue({
        id: "conv-1",
        organizationId: "org-1",
      });
      (db.orgUnitConversion.updateMany as any).mockResolvedValue({ count: 1 });
      (db.orgUnitConversion.findFirstOrThrow as any).mockResolvedValue({
        id: "conv-1",
        factor: 5,
      });

      const result = await updateOrgUnitConversion("conv-1", { factor: 5 });

      expect(result).toEqual({ id: "conv-1", factor: 5 });
      expect(db.orgUnitConversion.updateMany).toHaveBeenCalledWith({
        where: { id: "conv-1", organizationId: "org-1" },
        data: expect.objectContaining({ factor: expect.any(Object) }),
      });
    });
  });

  describe("deleteOrgUnitConversion", () => {
    it("should throw error if conversion to delete does not belong to organization", async () => {
      (getServerAuth as any).mockResolvedValue({ organizationId: "org-1" });
      (db.orgUnitConversion.findFirst as any).mockResolvedValue(null);

      await expect(deleteOrgUnitConversion("foreign-conv")).rejects.toThrow(
        "Conversion not found"
      );
      expect(db.orgUnitConversion.deleteMany).not.toHaveBeenCalled();
    });

    it("should delete conversion using deleteMany scoped by organizationId", async () => {
      (getServerAuth as any).mockResolvedValue({ organizationId: "org-1" });
      (db.orgUnitConversion.findFirst as any).mockResolvedValue({
        id: "conv-1",
        organizationId: "org-1",
      });
      (db.orgUnitConversion.deleteMany as any).mockResolvedValue({ count: 1 });

      await deleteOrgUnitConversion("conv-1");

      expect(db.orgUnitConversion.deleteMany).toHaveBeenCalledWith({
        where: { id: "conv-1", organizationId: "org-1" },
      });
    });
  });
});
