import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @repo/db
vi.mock("@repo/db", () => ({
  db: {
    staffTask: {
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
    staffShift: {
      findFirst: vi.fn(),
    },
    inventoryLocation: {
      findFirst: vi.fn(),
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
  getStaffTasks,
  createStaffTask,
  updateStaffTask,
  deleteStaffTask,
} from "../tasks";

describe("Staff Tasks Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getStaffTasks", () => {
    it("should return error if unauthenticated", async () => {
      (getServerAuth as any).mockResolvedValue(null);

      const result = await getStaffTasks();
      expect(result).toEqual({ success: false, error: "Unauthorized" });
      expect(db.staffTask.findMany).not.toHaveBeenCalled();
    });

    it("should fetch staff tasks scoped to organizationId", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-1",
      });
      (db.staffTask.findMany as any).mockResolvedValue([{ id: "task-1", title: "Test Task" }]);

      const result = await getStaffTasks({ status: "TODO" });
      expect(result).toEqual({ success: true, data: [{ id: "task-1", title: "Test Task" }] });
      expect(db.staffTask.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: "org-1",
            status: "TODO",
          }),
        }),
      );
    });
  });

  describe("createStaffTask", () => {
    it("should return error if unauthenticated", async () => {
      (getServerAuth as any).mockResolvedValue(null);

      const result = await createStaffTask({ title: "New Task" });
      expect(result).toEqual({ success: false, error: "Unauthorized" });
    });

    it("should reject creation if title is empty", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-1",
      });

      const result = await createStaffTask({ title: "  " });
      expect(result).toEqual({ success: false, error: "Title is required" });
    });

    it("should reject creation if memberId belongs to another organization", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-1",
      });
      (db.member.findFirst as any).mockResolvedValue(null);

      const result = await createStaffTask({
        title: "Clean Kitchen",
        memberId: "foreign-member-id",
      });

      expect(result).toEqual({
        success: false,
        error: "Assigned staff member not found or belongs to another organization",
      });
      expect(db.member.findFirst).toHaveBeenCalledWith({
        where: { id: "foreign-member-id", organizationId: "org-1" },
        select: { id: true },
      });
      expect(db.staffTask.create).not.toHaveBeenCalled();
    });

    it("should create staff task successfully when relational IDs are valid", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-1",
      });
      (db.member.findFirst as any).mockResolvedValue({ id: "mem-2" });
      (db.staffShift.findFirst as any).mockResolvedValue({ id: "shift-1" });
      (db.inventoryLocation.findFirst as any).mockResolvedValue({ id: "loc-1" });
      (db.staffTask.create as any).mockResolvedValue({
        id: "task-1",
        title: "Clean Kitchen",
        organizationId: "org-1",
      });

      const result = await createStaffTask({
        title: "Clean Kitchen",
        memberId: "mem-2",
        shiftId: "shift-1",
        locationId: "loc-1",
      });

      expect(result).toEqual({
        success: true,
        data: { id: "task-1", title: "Clean Kitchen", organizationId: "org-1" },
      });
      expect(db.staffTask.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: "org-1",
          title: "Clean Kitchen",
          memberId: "mem-2",
          shiftId: "shift-1",
          locationId: "loc-1",
        }),
        include: expect.any(Object),
      });
    });
  });

  describe("updateStaffTask", () => {
    it("should return error if task does not exist or belongs to another org", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-1",
      });
      (db.staffTask.findFirst as any).mockResolvedValue(null);

      const result = await updateStaffTask("task-1", { title: "Updated" });
      expect(result).toEqual({ success: false, error: "Task not found" });
    });

    it("should reject update if locationId belongs to another org", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-1",
      });
      (db.staffTask.findFirst as any).mockResolvedValue({ id: "task-1", organizationId: "org-1" });
      (db.inventoryLocation.findFirst as any).mockResolvedValue(null);

      const result = await updateStaffTask("task-1", { locationId: "foreign-loc" });
      expect(result).toEqual({
        success: false,
        error: "Location not found or belongs to another organization",
      });
      expect(db.staffTask.updateMany).not.toHaveBeenCalled();
    });

    it("should update task using updateMany scoped by id and organizationId", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-1",
      });
      (db.staffTask.findFirst as any).mockResolvedValue({ id: "task-1", organizationId: "org-1" });
      (db.staffTask.updateMany as any).mockResolvedValue({ count: 1 });
      (db.staffTask.findFirstOrThrow as any).mockResolvedValue({
        id: "task-1",
        title: "Updated Title",
        status: "IN_PROGRESS",
      });

      const result = await updateStaffTask("task-1", {
        title: "Updated Title",
        status: "IN_PROGRESS",
      });

      expect(result).toEqual({
        success: true,
        data: { id: "task-1", title: "Updated Title", status: "IN_PROGRESS" },
      });
      expect(db.staffTask.updateMany).toHaveBeenCalledWith({
        where: { id: "task-1", organizationId: "org-1" },
        data: expect.objectContaining({
          title: "Updated Title",
          status: "IN_PROGRESS",
        }),
      });
    });
  });

  describe("deleteStaffTask", () => {
    it("should return error if task not found", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-1",
      });
      (db.staffTask.findFirst as any).mockResolvedValue(null);

      const result = await deleteStaffTask("task-1");
      expect(result).toEqual({ success: false, error: "Task not found" });
    });

    it("should delete task using deleteMany scoped by id and organizationId", async () => {
      (getServerAuth as any).mockResolvedValue({
        organizationId: "org-1",
        memberId: "mem-1",
      });
      (db.staffTask.findFirst as any).mockResolvedValue({ id: "task-1", organizationId: "org-1" });
      (db.staffTask.deleteMany as any).mockResolvedValue({ count: 1 });

      const result = await deleteStaffTask("task-1");
      expect(result).toEqual({ success: true });
      expect(db.staffTask.deleteMany).toHaveBeenCalledWith({
        where: { id: "task-1", organizationId: "org-1" },
      });
    });
  });
});
