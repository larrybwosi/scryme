import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @repo/db
vi.mock("@repo/db", () => ({
  db: {
    driver: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      findFirstOrThrow: vi.fn(),
      deleteMany: vi.fn(),
    },
    vehicle: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    deliveryPartner: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
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
  getDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
  getDriverDetail,
} from "../drivers";

describe("Driver Server Actions - Security & BOLA Isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getDrivers", () => {
    it("should return error if unauthenticated", async () => {
      (getServerAuth as any).mockResolvedValue(null);

      const result = await getDrivers();
      expect(result).toEqual({ success: false, error: "Unauthorized" });
      expect(db.driver.findMany).not.toHaveBeenCalled();
    });

    it("should fetch drivers scoped strictly to organizationId", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
      });
      (db.driver.findMany as any).mockResolvedValue([{ id: "driver-1", name: "John Doe" }]);

      const result = await getDrivers();
      expect(result).toEqual({ success: true, data: [{ id: "driver-1", name: "John Doe" }] });
      expect(db.driver.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: "org-1" },
        }),
      );
    });
  });

  describe("createDriver", () => {
    it("should return error if unauthenticated", async () => {
      (getServerAuth as any).mockResolvedValue(null);

      const result = await createDriver({ name: "John Doe", phone: "1234567890" });
      expect(result).toEqual({ success: false, error: "Unauthorized" });
    });

    it("should reject creation if vehicleId belongs to another organization", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
      });
      (db.vehicle.findFirst as any).mockResolvedValue(null);

      const result = await createDriver({
        name: "John Doe",
        phone: "1234567890",
        vehicleId: "foreign-vehicle-id",
      });

      expect(result).toEqual({
        success: false,
        error: "Vehicle not found or belongs to another organization",
      });
      expect(db.vehicle.findFirst).toHaveBeenCalledWith({
        where: { id: "foreign-vehicle-id", organizationId: "org-1" },
        select: { id: true },
      });
      expect(db.driver.create).not.toHaveBeenCalled();
    });

    it("should reject creation if deliveryPartnerId belongs to another organization", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
      });
      (db.deliveryPartner.findFirst as any).mockResolvedValue(null);

      const result = await createDriver({
        name: "John Doe",
        phone: "1234567890",
        deliveryPartnerId: "foreign-partner-id",
      });

      expect(result).toEqual({
        success: false,
        error: "Delivery partner not found or belongs to another organization",
      });
      expect(db.deliveryPartner.findFirst).toHaveBeenCalledWith({
        where: { id: "foreign-partner-id", organizationId: "org-1" },
        select: { id: true },
      });
      expect(db.driver.create).not.toHaveBeenCalled();
    });

    it("should create driver when relational IDs belong to session organization", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
      });
      (db.vehicle.findFirst as any).mockResolvedValue({ id: "v-1" });
      (db.deliveryPartner.findFirst as any).mockResolvedValue({ id: "p-1" });
      (db.driver.create as any).mockResolvedValue({
        id: "driver-1",
        name: "John Doe",
        organizationId: "org-1",
      });

      const result = await createDriver({
        name: "John Doe",
        phone: "1234567890",
        vehicleId: "v-1",
        deliveryPartnerId: "p-1",
      });

      expect(result).toEqual({
        success: true,
        data: { id: "driver-1", name: "John Doe", organizationId: "org-1" },
      });
      expect(db.driver.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: "org-1",
          name: "John Doe",
          vehicleId: "v-1",
          deliveryPartnerId: "p-1",
        }),
      });
    });
  });

  describe("updateDriver", () => {
    it("should return error if unauthenticated", async () => {
      (getServerAuth as any).mockResolvedValue(null);

      const result = await updateDriver("driver-1", { name: "Updated Name" });
      expect(result).toEqual({ success: false, error: "Unauthorized" });
    });

    it("should reject update if vehicleId belongs to another organization", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
      });
      (db.vehicle.findFirst as any).mockResolvedValue(null);

      const result = await updateDriver("driver-1", { vehicleId: "foreign-vehicle-id" });
      expect(result).toEqual({
        success: false,
        error: "Vehicle not found or belongs to another organization",
      });
      expect(db.driver.updateMany).not.toHaveBeenCalled();
    });

    it("should return error if updateMany affects 0 rows", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
      });
      (db.driver.updateMany as any).mockResolvedValue({ count: 0 });

      const result = await updateDriver("driver-1", { name: "Updated Name" });
      expect(result).toEqual({ success: false, error: "Driver not found or access denied" });
      expect(db.driver.updateMany).toHaveBeenCalledWith({
        where: { id: "driver-1", organizationId: "org-1" },
        data: expect.objectContaining({ name: "Updated Name" }),
      });
    });

    it("should update driver using updateMany scoped by id and organizationId", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
      });
      (db.driver.updateMany as any).mockResolvedValue({ count: 1 });
      (db.driver.findFirstOrThrow as any).mockResolvedValue({
        id: "driver-1",
        name: "Updated Name",
        organizationId: "org-1",
      });

      const result = await updateDriver("driver-1", { name: "Updated Name" });
      expect(result).toEqual({
        success: true,
        data: { id: "driver-1", name: "Updated Name", organizationId: "org-1" },
      });
      expect(db.driver.updateMany).toHaveBeenCalledWith({
        where: { id: "driver-1", organizationId: "org-1" },
        data: expect.objectContaining({ name: "Updated Name" }),
      });
      expect(db.driver.findFirstOrThrow).toHaveBeenCalledWith({
        where: { id: "driver-1", organizationId: "org-1" },
      });
    });
  });

  describe("deleteDriver", () => {
    it("should return error if unauthenticated", async () => {
      (getServerAuth as any).mockResolvedValue(null);

      const result = await deleteDriver("driver-1");
      expect(result).toEqual({ success: false, error: "Unauthorized" });
    });

    it("should return error if deleteMany affects 0 rows", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
      });
      (db.driver.deleteMany as any).mockResolvedValue({ count: 0 });

      const result = await deleteDriver("driver-1");
      expect(result).toEqual({ success: false, error: "Driver not found or access denied" });
    });

    it("should delete driver using deleteMany scoped by id and organizationId", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
      });
      (db.driver.deleteMany as any).mockResolvedValue({ count: 1 });

      const result = await deleteDriver("driver-1");
      expect(result).toEqual({ success: true });
      expect(db.driver.deleteMany).toHaveBeenCalledWith({
        where: { id: "driver-1", organizationId: "org-1" },
      });
    });
  });

  describe("getDriverDetail", () => {
    it("should return error if unauthenticated", async () => {
      (getServerAuth as any).mockResolvedValue(null);

      const result = await getDriverDetail("driver-1");
      expect(result).toEqual({ success: false, error: "Unauthorized" });
    });

    it("should fetch driver detail using findFirst scoped by id and organizationId", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
      });
      (db.driver.findFirst as any).mockResolvedValue({ id: "driver-1", name: "John Doe" });

      const result = await getDriverDetail("driver-1");
      expect(result).toEqual({ success: true, data: { id: "driver-1", name: "John Doe" } });
      expect(db.driver.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "driver-1", organizationId: "org-1" },
        }),
      );
    });

    it("should return error if driver is not found", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
      });
      (db.driver.findFirst as any).mockResolvedValue(null);

      const result = await getDriverDetail("driver-1");
      expect(result).toEqual({ success: false, error: "Driver not found" });
    });
  });
});
