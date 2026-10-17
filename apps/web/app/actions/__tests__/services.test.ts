import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @repo/db
vi.mock("@repo/db", () => {
  function MockDecimal(val: any) {
    return val;
  }
  return {
    db: {
      serviceCategory: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        updateMany: vi.fn(),
        deleteMany: vi.fn(),
      },
      service: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        updateMany: vi.fn(),
        deleteMany: vi.fn(),
      },
    },
    PricingModel: {
      FIXED: "FIXED",
      HOURLY: "HOURLY",
      VARIABLE: "VARIABLE",
    },
    DepositType: {
      FIXED: "FIXED",
      PERCENTAGE: "PERCENTAGE",
    },
    Decimal: MockDecimal as any,
  };
});

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
  getServiceCategories,
  createServiceCategory,
  updateServiceCategory,
  deleteServiceCategory,
  getServices,
  getService,
  createService,
  updateService,
  deleteService,
} from "../services";

describe("Services & Categories Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Service Category Actions", () => {
    it("getServiceCategories returns empty list if unauthenticated", async () => {
      (getServerAuth as any).mockResolvedValue(null);
      const res = await getServiceCategories();
      expect(res).toEqual([]);
      expect(db.serviceCategory.findMany).not.toHaveBeenCalled();
    });

    it("getServiceCategories returns categories for tenant", async () => {
      (getServerAuth as any).mockResolvedValue({ organizationId: "org-1" });
      (db.serviceCategory.findMany as any).mockResolvedValue([
        { id: "cat-1", name: "Grooming", organizationId: "org-1" },
      ]);

      const res = await getServiceCategories();
      expect(res).toEqual([{ id: "cat-1", name: "Grooming", organizationId: "org-1" }]);
      expect(db.serviceCategory.findMany).toHaveBeenCalledWith({
        where: { organizationId: "org-1" },
        orderBy: { name: "asc" },
      });
    });

    it("createServiceCategory throws if unauthenticated", async () => {
      (getServerAuth as any).mockResolvedValue(null);
      await expect(
        createServiceCategory({ name: "Consultation" })
      ).rejects.toThrow("Unauthorized");
    });

    it("updateServiceCategory uses updateMany scoped by organizationId", async () => {
      (getServerAuth as any).mockResolvedValue({ organizationId: "org-1" });
      (db.serviceCategory.updateMany as any).mockResolvedValue({ count: 1 });
      (db.serviceCategory.findFirst as any).mockResolvedValue({
        id: "cat-1",
        name: "Updated Name",
        organizationId: "org-1",
      });

      const result = await updateServiceCategory("cat-1", { name: "Updated Name" });

      expect(db.serviceCategory.updateMany).toHaveBeenCalledWith({
        where: { id: "cat-1", organizationId: "org-1" },
        data: { name: "Updated Name", description: undefined },
      });
      expect(result).toEqual({ id: "cat-1", name: "Updated Name", organizationId: "org-1" });
    });

    it("updateServiceCategory throws if category is not found in tenant", async () => {
      (getServerAuth as any).mockResolvedValue({ organizationId: "org-1" });
      (db.serviceCategory.updateMany as any).mockResolvedValue({ count: 0 });

      await expect(
        updateServiceCategory("cat-foreign", { name: "Updated Name" })
      ).rejects.toThrow("Service category not found");
    });

    it("deleteServiceCategory uses deleteMany scoped by organizationId", async () => {
      (getServerAuth as any).mockResolvedValue({ organizationId: "org-1" });
      (db.serviceCategory.deleteMany as any).mockResolvedValue({ count: 1 });

      const result = await deleteServiceCategory("cat-1");

      expect(db.serviceCategory.deleteMany).toHaveBeenCalledWith({
        where: { id: "cat-1", organizationId: "org-1" },
      });
      expect(result).toEqual({ success: true });
    });
  });

  describe("Service Actions", () => {
    it("createService rejects cross-tenant categoryId", async () => {
      (getServerAuth as any).mockResolvedValue({ organizationId: "org-1" });
      (db.serviceCategory.findFirst as any).mockResolvedValue(null);

      await expect(
        createService({
          name: "Haircut",
          sku: "HC-1",
          categoryId: "foreign-cat",
          pricingModel: "FIXED" as any,
          price: 50,
        })
      ).rejects.toThrow("Invalid service category");

      expect(db.serviceCategory.findFirst).toHaveBeenCalledWith({
        where: { id: "foreign-cat", organizationId: "org-1" },
      });
      expect(db.service.create).not.toHaveBeenCalled();
    });

    it("createService creates service when category belongs to tenant", async () => {
      (getServerAuth as any).mockResolvedValue({ organizationId: "org-1" });
      (db.serviceCategory.findFirst as any).mockResolvedValue({
        id: "cat-1",
        organizationId: "org-1",
      });
      (db.service.create as any).mockResolvedValue({
        id: "srv-1",
        name: "Haircut",
        organizationId: "org-1",
      });

      const res = await createService({
        name: "Haircut",
        sku: "HC-1",
        categoryId: "cat-1",
        pricingModel: "FIXED" as any,
        price: 50,
      });

      expect(res).toEqual({ id: "srv-1", name: "Haircut", organizationId: "org-1" });
      expect(db.service.create).toHaveBeenCalled();
    });

    it("updateService rejects cross-tenant categoryId when updating categoryId", async () => {
      (getServerAuth as any).mockResolvedValue({ organizationId: "org-1" });
      (db.serviceCategory.findFirst as any).mockResolvedValue(null);

      await expect(
        updateService("srv-1", { categoryId: "foreign-cat" })
      ).rejects.toThrow("Invalid service category");

      expect(db.service.updateMany).not.toHaveBeenCalled();
    });

    it("updateService uses updateMany scoped by organizationId", async () => {
      (getServerAuth as any).mockResolvedValue({ organizationId: "org-1" });
      (db.service.updateMany as any).mockResolvedValue({ count: 1 });
      (db.service.findFirst as any).mockResolvedValue({
        id: "srv-1",
        name: "New Name",
        organizationId: "org-1",
      });

      const res = await updateService("srv-1", { name: "New Name" });

      expect(db.service.updateMany).toHaveBeenCalledWith({
        where: { id: "srv-1", organizationId: "org-1" },
        data: expect.objectContaining({ name: "New Name" }),
      });
      expect(res).toEqual({ id: "srv-1", name: "New Name", organizationId: "org-1" });
    });

    it("deleteService uses deleteMany scoped by organizationId", async () => {
      (getServerAuth as any).mockResolvedValue({ organizationId: "org-1" });
      (db.service.deleteMany as any).mockResolvedValue({ count: 1 });

      const res = await deleteService("srv-1");

      expect(db.service.deleteMany).toHaveBeenCalledWith({
        where: { id: "srv-1", organizationId: "org-1" },
      });
      expect(res).toEqual({ success: true });
    });
  });
});
