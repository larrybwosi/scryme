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
    shiftTradeRequest: {
      findFirst: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    organizationSettings: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((promises) => Promise.all(promises)),
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
  requestShiftTrade,
  processShiftTrade,
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
        select: { id: true },
      });
      expect(db.staffShift.create).not.toHaveBeenCalled();
    });

    it("should reject creation if department belongs to another organization", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        role: "ADMIN",
      });
      (db.member.findFirst as any).mockResolvedValue({ id: "mem-1" });
      (db.inventoryLocation.findFirst as any).mockResolvedValue({ id: "loc-1" });
      (db.department.findFirst as any).mockResolvedValue(null);

      const result = await createStaffShift({
        memberId: "mem-1",
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "17:00",
        locationId: "loc-1",
        departmentId: "foreign-dept",
      });

      expect(result).toEqual({
        success: false,
        error: "Department not found or belongs to another organization",
      });
      expect(db.department.findFirst).toHaveBeenCalledWith({
        where: { id: "foreign-dept", organizationId: "org-1" },
        select: { id: true },
      });
      expect(db.staffShift.create).not.toHaveBeenCalled();
    });

    it("should create shift successfully with parallel relational validations", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        role: "ADMIN",
      });
      (db.member.findFirst as any).mockResolvedValue({ id: "mem-1" });
      (db.inventoryLocation.findFirst as any).mockResolvedValue({ id: "loc-1" });
      (db.department.findFirst as any).mockResolvedValue({ id: "dept-1" });
      (db.staffShift.findMany as any).mockResolvedValue([]);
      (db.staffShift.create as any).mockResolvedValue({ id: "new-shift-1" });

      const result = await createStaffShift({
        memberId: "mem-1",
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "17:00",
        locationId: "loc-1",
        departmentId: "dept-1",
      });

      expect(result).toEqual({
        success: true,
        data: { id: "new-shift-1" },
      });
      expect(db.member.findFirst).toHaveBeenCalledWith({
        where: { id: "mem-1", organizationId: "org-1" },
        select: { id: true },
      });
      expect(db.inventoryLocation.findFirst).toHaveBeenCalledWith({
        where: { id: "loc-1", organizationId: "org-1" },
        select: { id: true },
      });
      expect(db.department.findFirst).toHaveBeenCalledWith({
        where: { id: "dept-1", organizationId: "org-1" },
        select: { id: true },
      });
      expect(db.staffShift.create).toHaveBeenCalled();
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
      expect(db.inventoryLocation.findFirst).toHaveBeenCalledWith({
        where: { id: "foreign-loc", organizationId: "org-1" },
        select: { id: true },
      });
      expect(db.staffShift.updateMany).not.toHaveBeenCalled();
    });

    it("should reject update if relational department belongs to another org", async () => {
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
      (db.department.findFirst as any).mockResolvedValue(null);

      const result = await updateStaffShift("shift-1", { departmentId: "foreign-dept" });
      expect(result).toEqual({
        success: false,
        error: "Department not found or belongs to another organization",
      });
      expect(db.department.findFirst).toHaveBeenCalledWith({
        where: { id: "foreign-dept", organizationId: "org-1" },
        select: { id: true },
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

  describe("requestShiftTrade - Security Hardening", () => {
    it("should reject shift trade if caller is not the shift owner", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-1",
      });
      (db.staffShift.findFirst as any).mockImplementation(({ where }: any) => {
        if (where.id === "shift-1") return Promise.resolve({ id: "shift-1", memberId: "other-mem" });
        return Promise.resolve(null);
      });

      const result = await requestShiftTrade({ shiftId: "shift-1" });
      expect(result).toEqual({ success: false, error: "You can only trade or swap your own shifts" });
    });

    it("should reject shift trade if offeredShift belongs to another organization", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-1",
      });
      (db.staffShift.findFirst as any).mockImplementation(({ where }: any) => {
        if (where.id === "shift-1" && where.organizationId === "org-1") {
          return Promise.resolve({ id: "shift-1", memberId: "mem-1" });
        }
        return Promise.resolve(null);
      });

      const result = await requestShiftTrade({
        shiftId: "shift-1",
        offeredShiftId: "foreign-shift",
      });
      expect(result).toEqual({
        success: false,
        error: "Offered shift not found or belongs to another organization",
      });
    });

    it("should reject shift trade if targetMember belongs to another organization", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-1",
      });
      (db.staffShift.findFirst as any).mockImplementation(({ where }: any) => {
        if (where.id === "shift-1" && where.organizationId === "org-1") {
          return Promise.resolve({ id: "shift-1", memberId: "mem-1" });
        }
        return Promise.resolve(null);
      });
      (db.member.findFirst as any).mockResolvedValue(null);

      const result = await requestShiftTrade({
        shiftId: "shift-1",
        targetMemberId: "foreign-member",
      });
      expect(result).toEqual({
        success: false,
        error: "Target member not found or belongs to another organization",
      });
      expect(db.member.findFirst).toHaveBeenCalledWith({
        where: { id: "foreign-member", organizationId: "org-1" },
        select: { id: true },
      });
    });

    it("should create shift trade request when all foreign references are valid and tenant-isolated", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-1",
      });
      (db.staffShift.findFirst as any).mockImplementation(({ where }: any) => {
        if (where.id === "shift-1" && where.organizationId === "org-1") {
          return Promise.resolve({ id: "shift-1", memberId: "mem-1" });
        }
        if (where.id === "offered-1" && where.organizationId === "org-1") {
          return Promise.resolve({ id: "offered-1", memberId: "mem-2" });
        }
        return Promise.resolve(null);
      });
      (db.member.findFirst as any).mockResolvedValue({ id: "mem-2" });
      (db.shiftTradeRequest.create as any).mockResolvedValue({ id: "trade-1", status: "PENDING" });

      const result = await requestShiftTrade({
        shiftId: "shift-1",
        offeredShiftId: "offered-1",
        targetMemberId: "mem-2",
        type: "SWAP",
      });

      expect(result).toEqual({ success: true, data: { id: "trade-1", status: "PENDING" } });
      expect(db.shiftTradeRequest.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: "org-1",
          requesterMemberId: "mem-1",
          targetMemberId: "mem-2",
          shiftId: "shift-1",
          offeredShiftId: "offered-1",
          type: "SWAP",
          status: "PENDING",
        }),
        include: expect.any(Object),
      });
    });
  });

  describe("processShiftTrade - Security Hardening", () => {
    it("should cancel trade request using updateMany scoped by organizationId", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-1",
        role: "MEMBER",
      });
      (db.shiftTradeRequest.findFirst as any).mockResolvedValue({
        id: "trade-1",
        organizationId: "org-1",
        requesterMemberId: "mem-1",
      });
      (db.shiftTradeRequest.updateMany as any).mockResolvedValue({ count: 1 });

      const result = await processShiftTrade("trade-1", "CANCEL");
      expect(result).toEqual({ success: true });
      expect(db.shiftTradeRequest.updateMany).toHaveBeenCalledWith({
        where: { id: "trade-1", organizationId: "org-1" },
        data: { status: "CANCELLED" },
      });
    });

    it("should reject trade request using updateMany scoped by organizationId", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "admin-1",
        role: "ADMIN",
      });
      (db.shiftTradeRequest.findFirst as any).mockResolvedValue({
        id: "trade-1",
        organizationId: "org-1",
        requesterMemberId: "mem-1",
      });
      (db.shiftTradeRequest.updateMany as any).mockResolvedValue({ count: 1 });

      const result = await processShiftTrade("trade-1", "REJECT");
      expect(result).toEqual({ success: true });
      expect(db.shiftTradeRequest.updateMany).toHaveBeenCalledWith({
        where: { id: "trade-1", organizationId: "org-1" },
        data: { status: "REJECTED", approvedById: "admin-1" },
      });
    });

    it("should reject approval if targetMember belongs to another organization", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "admin-1",
        role: "ADMIN",
      });
      (db.shiftTradeRequest.findFirst as any).mockResolvedValue({
        id: "trade-1",
        organizationId: "org-1",
        shiftId: "shift-1",
        offeredShiftId: "offered-1",
        targetMemberId: "foreign-mem",
        requesterMemberId: "mem-1",
        type: "SWAP",
        shift: { id: "shift-1" },
        offeredShift: { id: "offered-1" },
      });
      (db.member.findFirst as any).mockResolvedValue(null);

      const result = await processShiftTrade("trade-1", "APPROVE");
      expect(result).toEqual({ success: false, error: "Target member not found in organization" });
      expect(db.staffShift.updateMany).not.toHaveBeenCalled();
    });

    it("should approve swap trade request using updateMany scoped by organizationId", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "admin-1",
        role: "ADMIN",
      });
      (db.shiftTradeRequest.findFirst as any).mockResolvedValue({
        id: "trade-1",
        organizationId: "org-1",
        shiftId: "shift-1",
        offeredShiftId: "offered-1",
        targetMemberId: "mem-2",
        requesterMemberId: "mem-1",
        type: "SWAP",
        shift: { id: "shift-1" },
        offeredShift: { id: "offered-1" },
      });
      (db.member.findFirst as any).mockResolvedValue({ id: "mem-2" });
      (db.staffShift.updateMany as any).mockResolvedValue({ count: 1 });
      (db.shiftTradeRequest.updateMany as any).mockResolvedValue({ count: 1 });

      const result = await processShiftTrade("trade-1", "APPROVE");
      expect(result).toEqual({ success: true });
      expect(db.staffShift.updateMany).toHaveBeenCalledWith({
        where: { id: "shift-1", organizationId: "org-1" },
        data: { memberId: "mem-2" },
      });
      expect(db.staffShift.updateMany).toHaveBeenCalledWith({
        where: { id: "offered-1", organizationId: "org-1" },
        data: { memberId: "mem-1" },
      });
      expect(db.shiftTradeRequest.updateMany).toHaveBeenCalledWith({
        where: { id: "trade-1", organizationId: "org-1" },
        data: { status: "APPROVED", approvedById: "admin-1" },
      });
    });
  });
});
