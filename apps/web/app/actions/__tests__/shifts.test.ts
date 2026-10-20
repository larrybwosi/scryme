import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @repo/db
vi.mock("@repo/db", () => ({
  db: {
    staffShift: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      findFirstOrThrow: vi.fn(),
      deleteMany: vi.fn(),
    },
    member: {
      findFirst: vi.fn(),
    },
    inventoryLocation: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      findFirstOrThrow: vi.fn(),
    },
    department: {
      findFirst: vi.fn(),
    },
    staffBreak: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    organizationSettings: {
      findUnique: vi.fn(),
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
  getStaffShifts,
  createStaffShift,
  updateStaffShift,
  deleteStaffShift,
  addStaffBreak,
  deleteStaffBreak,
  updateBranchLocationCoordinates,
} from "../shifts";

describe("Staff Shifts Server Actions - Security Hardening", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getStaffShifts", () => {
    it("should return error if unauthenticated", async () => {
      (getServerAuth as any).mockResolvedValue(null);

      const result = await getStaffShifts();
      expect(result).toEqual({ success: false, error: "Unauthorized" });
      expect(db.staffShift.findMany).not.toHaveBeenCalled();
    });

    it("should fetch staff shifts scoped to organizationId", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        role: "ADMIN",
      });
      (db.staffShift.findMany as any).mockResolvedValue([{ id: "shift-1" }]);

      const result = await getStaffShifts("mem-1");
      expect(result).toEqual({ success: true, data: [{ id: "shift-1" }] });
      expect(db.staffShift.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: "org-1",
            memberId: "mem-1",
          }),
        }),
      );
    });
  });

  describe("createStaffShift", () => {
    it("should reject creation if member belongs to another organization", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        role: "ADMIN",
      });
      (db.member.findFirst as any).mockResolvedValue(null);

      const result = await createStaffShift({
        memberId: "foreign-member",
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "17:00",
      });

      expect(result).toEqual({
        success: false,
        error: "Member not found in organization",
      });
      expect(db.staffShift.create).not.toHaveBeenCalled();
    });

    it("should reject creation if location belongs to another organization", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        role: "ADMIN",
      });
      (db.member.findFirst as any).mockResolvedValue({ id: "mem-1" });
      (db.staffShift.findMany as any).mockResolvedValue([]);
      (db.inventoryLocation.findFirst as any).mockResolvedValue(null);

      const result = await createStaffShift({
        memberId: "mem-1",
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "17:00",
        locationId: "foreign-loc",
      });

      expect(result).toEqual({
        success: false,
        error: "Location not found or belongs to another organization",
      });
      expect(db.inventoryLocation.findFirst).toHaveBeenCalledWith({
        where: { id: "foreign-loc", organizationId: "org-1" },
      });
      expect(db.staffShift.create).not.toHaveBeenCalled();
    });
  });

  describe("updateStaffShift", () => {
    it("should reject update if shift belongs to another org", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        role: "ADMIN",
      });
      (db.staffShift.findFirst as any).mockResolvedValue(null);

      const result = await updateStaffShift("foreign-shift", { startTime: "10:00" });
      expect(result).toEqual({ success: false, error: "Shift not found" });
    });

    it("should reject update if relational location belongs to another org", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        role: "ADMIN",
      });
      (db.staffShift.findFirst as any).mockResolvedValue({
        id: "shift-1",
        organizationId: "org-1",
        memberId: "mem-1",
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "17:00",
        isActive: true,
      });
      (db.inventoryLocation.findFirst as any).mockResolvedValue(null);

      const result = await updateStaffShift("shift-1", { locationId: "foreign-loc" });
      expect(result).toEqual({
        success: false,
        error: "Location not found or belongs to another organization",
      });
      expect(db.staffShift.updateMany).not.toHaveBeenCalled();
    });

    it("should update shift using updateMany scoped by organizationId", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        role: "ADMIN",
      });
      (db.staffShift.findFirst as any).mockResolvedValue({
        id: "shift-1",
        organizationId: "org-1",
        memberId: "mem-1",
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "17:00",
        isActive: true,
      });
      (db.staffShift.findMany as any).mockResolvedValue([]);
      (db.staffBreak.findMany as any).mockResolvedValue([]);
      (db.staffShift.updateMany as any).mockResolvedValue({ count: 1 });
      (db.staffShift.findFirstOrThrow as any).mockResolvedValue({
        id: "shift-1",
        startTime: "10:00",
      });

      const result = await updateStaffShift("shift-1", { startTime: "10:00" });

      expect(result).toEqual({
        success: true,
        data: { id: "shift-1", startTime: "10:00" },
      });
      expect(db.staffShift.updateMany).toHaveBeenCalledWith({
        where: { id: "shift-1", organizationId: "org-1" },
        data: expect.objectContaining({ startTime: "10:00" }),
      });
    });
  });

  describe("deleteStaffShift", () => {
    it("should delete shift using deleteMany scoped by organizationId", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        role: "ADMIN",
      });
      (db.staffShift.findFirst as any).mockResolvedValue({
        id: "shift-1",
        organizationId: "org-1",
        memberId: "mem-1",
      });
      (db.staffShift.deleteMany as any).mockResolvedValue({ count: 1 });

      const result = await deleteStaffShift("shift-1");

      expect(result).toEqual({ success: true });
      expect(db.staffShift.deleteMany).toHaveBeenCalledWith({
        where: { id: "shift-1", organizationId: "org-1" },
      });
    });
  });

  describe("deleteStaffBreak", () => {
    it("should reject break deletion if break belongs to foreign organization shift", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        role: "ADMIN",
      });
      (db.staffBreak.findFirst as any).mockResolvedValue(null);

      const result = await deleteStaffBreak("break-1");
      expect(result).toEqual({ success: false, error: "Break not found" });
      expect(db.staffBreak.deleteMany).not.toHaveBeenCalled();
    });

    it("should delete break using deleteMany scoped by shift.organizationId", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        role: "ADMIN",
      });
      (db.staffBreak.findFirst as any).mockResolvedValue({
        id: "break-1",
        shift: { organizationId: "org-1", memberId: "mem-1" },
      });
      (db.staffBreak.deleteMany as any).mockResolvedValue({ count: 1 });

      const result = await deleteStaffBreak("break-1");

      expect(result).toEqual({ success: true });
      expect(db.staffBreak.deleteMany).toHaveBeenCalledWith({
        where: { id: "break-1", shift: { organizationId: "org-1" } },
      });
    });
  });

  describe("updateBranchLocationCoordinates", () => {
    it("should update location using updateMany scoped by organizationId", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        role: "ADMIN",
      });
      (db.inventoryLocation.updateMany as any).mockResolvedValue({ count: 1 });
      (db.inventoryLocation.findFirstOrThrow as any).mockResolvedValue({
        id: "loc-1",
        latitude: -1.286389,
      });

      const result = await updateBranchLocationCoordinates("loc-1", {
        latitude: -1.286389,
      });

      expect(result).toEqual({
        success: true,
        data: { id: "loc-1", latitude: -1.286389 },
      });
      expect(db.inventoryLocation.updateMany).toHaveBeenCalledWith({
        where: { id: "loc-1", organizationId: "org-1" },
        data: expect.objectContaining({ latitude: -1.286389 }),
      });
    });
  });
});
