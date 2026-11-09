import { describe, beforeEach, it, expect, vi } from "vitest";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { ShiftsUseCase } from "./shifts.use-case";

describe("ShiftsUseCase", () => {
  let useCase: ShiftsUseCase;
  let mockPrisma: any;
  let mockFirebase: any;

  beforeEach(() => {
    mockPrisma = {
      client: {
        staffShift: {
          findMany: vi.fn(),
          findFirst: vi.fn(),
          findFirstOrThrow: vi.fn(),
          create: vi.fn(),
          updateMany: vi.fn(),
          deleteMany: vi.fn(),
        },
        member: {
          findFirst: vi.fn(),
        },
        inventoryLocation: {
          findFirst: vi.fn(),
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
          findMany: vi.fn(),
          findFirst: vi.fn(),
          create: vi.fn(),
          updateMany: vi.fn(),
        },
        $transaction: vi.fn(),
      },
    };

    mockFirebase = {
      sendToMembers: vi.fn().mockResolvedValue({}),
    };

    useCase = new ShiftsUseCase(mockPrisma, mockFirebase);
  });

  describe("createStaffShift", () => {
    it("should create staff shift when valid", async () => {
      mockPrisma.client.member.findFirst.mockResolvedValue({ id: "member_1", organizationId: "org_1" });
      mockPrisma.client.staffShift.findMany.mockResolvedValue([]);
      mockPrisma.client.staffShift.create.mockResolvedValue({
        id: "shift_1",
        memberId: "member_1",
        dayOfWeek: 1,
        startTime: "08:00",
        endTime: "17:00",
      });

      const dto = { memberId: "member_1", dayOfWeek: 1, startTime: "08:00", endTime: "17:00" };
      const result = await useCase.createStaffShift("org_1", dto as any);

      expect(result.id).toEqual("shift_1");
      expect(mockPrisma.client.staffShift.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: "org_1",
            memberId: "member_1",
            dayOfWeek: 1,
          }),
        }),
      );
    });

    it("should throw BadRequestException if end time <= start time", async () => {
      mockPrisma.client.member.findFirst.mockResolvedValue({ id: "member_1", organizationId: "org_1" });

      const dto = { memberId: "member_1", dayOfWeek: 1, startTime: "17:00", endTime: "08:00" };
      await expect(useCase.createStaffShift("org_1", dto as any)).rejects.toThrow(BadRequestException);
    });

    it("should parallelize relational lookups with select projections in createStaffShift", async () => {
      mockPrisma.client.member.findFirst.mockResolvedValue({ id: "member_1" });
      mockPrisma.client.inventoryLocation.findFirst.mockResolvedValue({ id: "loc_1" });
      mockPrisma.client.department.findFirst.mockResolvedValue({ id: "dept_1" });
      mockPrisma.client.staffShift.findMany.mockResolvedValue([]);
      mockPrisma.client.staffShift.create.mockResolvedValue({ id: "shift_1" });

      const dto = {
        memberId: "member_1",
        dayOfWeek: 2,
        startTime: "09:00",
        endTime: "18:00",
        locationId: "loc_1",
        departmentId: "dept_1",
      };

      const result = await useCase.createStaffShift("org_1", dto as any);
      expect(result.id).toEqual("shift_1");

      expect(mockPrisma.client.member.findFirst).toHaveBeenCalledWith({
        where: { id: "member_1", organizationId: "org_1" },
        select: { id: true },
      });
      expect(mockPrisma.client.inventoryLocation.findFirst).toHaveBeenCalledWith({
        where: { id: "loc_1", organizationId: "org_1" },
        select: { id: true },
      });
      expect(mockPrisma.client.department.findFirst).toHaveBeenCalledWith({
        where: { id: "dept_1", organizationId: "org_1" },
        select: { id: true },
      });
    });

    it("should throw BadRequestException when member is not found in organization", async () => {
      mockPrisma.client.member.findFirst.mockResolvedValue(null);

      const dto = { memberId: "invalid_member", dayOfWeek: 1, startTime: "08:00", endTime: "17:00" };
      await expect(useCase.createStaffShift("org_1", dto as any)).rejects.toThrow(
        "Member not found in organization",
      );
    });

    it("should throw BadRequestException when location is not found in organization", async () => {
      mockPrisma.client.member.findFirst.mockResolvedValue({ id: "member_1" });
      mockPrisma.client.inventoryLocation.findFirst.mockResolvedValue(null);

      const dto = {
        memberId: "member_1",
        dayOfWeek: 1,
        startTime: "08:00",
        endTime: "17:00",
        locationId: "invalid_loc",
      };
      await expect(useCase.createStaffShift("org_1", dto as any)).rejects.toThrow(
        "Location not found or belongs to another organization",
      );
    });

    it("should throw BadRequestException when department is not found in organization", async () => {
      mockPrisma.client.member.findFirst.mockResolvedValue({ id: "member_1" });
      mockPrisma.client.department.findFirst.mockResolvedValue(null);

      const dto = {
        memberId: "member_1",
        dayOfWeek: 1,
        startTime: "08:00",
        endTime: "17:00",
        departmentId: "invalid_dept",
      };
      await expect(useCase.createStaffShift("org_1", dto as any)).rejects.toThrow(
        "Department not found or belongs to another organization",
      );
    });
  });

  describe("updateStaffShift", () => {
    it("should update shift using updateMany for multi-tenant isolation", async () => {
      mockPrisma.client.staffShift.findFirst.mockResolvedValue({
        id: "shift_1",
        organizationId: "org_1",
        memberId: "member_1",
        dayOfWeek: 1,
        startTime: "08:00",
        endTime: "17:00",
        isActive: true,
      });
      mockPrisma.client.staffShift.findMany.mockResolvedValue([]);
      mockPrisma.client.staffBreak.findMany.mockResolvedValue([]);
      mockPrisma.client.staffShift.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.client.staffShift.findFirstOrThrow.mockResolvedValue({ id: "shift_1", startTime: "09:00" });

      const dto = { startTime: "09:00" };
      const result = await useCase.updateStaffShift("org_1", "shift_1", dto as any);

      expect(result.startTime).toEqual("09:00");
      expect(mockPrisma.client.staffShift.updateMany).toHaveBeenCalledWith({
        where: { id: "shift_1", organizationId: "org_1" },
        data: expect.objectContaining({ startTime: "09:00" }),
      });
    });

    it("should parallelize relational lookups with select projections in updateStaffShift", async () => {
      mockPrisma.client.staffShift.findFirst.mockResolvedValue({
        id: "shift_1",
        organizationId: "org_1",
        memberId: "member_1",
        dayOfWeek: 1,
        startTime: "08:00",
        endTime: "17:00",
        isActive: false,
      });
      mockPrisma.client.inventoryLocation.findFirst.mockResolvedValue({ id: "loc_2" });
      mockPrisma.client.department.findFirst.mockResolvedValue({ id: "dept_2" });
      mockPrisma.client.staffShift.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.client.staffShift.findFirstOrThrow.mockResolvedValue({ id: "shift_1", locationId: "loc_2" });

      const dto = {
        locationId: "loc_2",
        departmentId: "dept_2",
      };

      const result = await useCase.updateStaffShift("org_1", "shift_1", dto as any);
      expect(result.id).toEqual("shift_1");

      expect(mockPrisma.client.inventoryLocation.findFirst).toHaveBeenCalledWith({
        where: { id: "loc_2", organizationId: "org_1" },
        select: { id: true },
      });
      expect(mockPrisma.client.department.findFirst).toHaveBeenCalledWith({
        where: { id: "dept_2", organizationId: "org_1" },
        select: { id: true },
      });
    });

    it("should throw BadRequestException when updating to invalid location", async () => {
      mockPrisma.client.staffShift.findFirst.mockResolvedValue({
        id: "shift_1",
        organizationId: "org_1",
        memberId: "member_1",
        dayOfWeek: 1,
        startTime: "08:00",
        endTime: "17:00",
        isActive: true,
      });
      mockPrisma.client.inventoryLocation.findFirst.mockResolvedValue(null);

      const dto = { locationId: "invalid_loc" };
      await expect(useCase.updateStaffShift("org_1", "shift_1", dto as any)).rejects.toThrow(
        "Location not found or belongs to another organization",
      );
    });

    it("should throw BadRequestException when updating to invalid department", async () => {
      mockPrisma.client.staffShift.findFirst.mockResolvedValue({
        id: "shift_1",
        organizationId: "org_1",
        memberId: "member_1",
        dayOfWeek: 1,
        startTime: "08:00",
        endTime: "17:00",
        isActive: true,
      });
      mockPrisma.client.department.findFirst.mockResolvedValue(null);

      const dto = { departmentId: "invalid_dept" };
      await expect(useCase.updateStaffShift("org_1", "shift_1", dto as any)).rejects.toThrow(
        "Department not found or belongs to another organization",
      );
    });
  });

  describe("deleteStaffShift", () => {
    it("should delete shift using deleteMany scoped by organizationId", async () => {
      mockPrisma.client.staffShift.findFirst.mockResolvedValue({ id: "shift_1", organizationId: "org_1" });
      mockPrisma.client.staffShift.deleteMany.mockResolvedValue({ count: 1 });

      const result = await useCase.deleteStaffShift("org_1", "shift_1");

      expect(result.success).toBe(true);
      expect(mockPrisma.client.staffShift.deleteMany).toHaveBeenCalledWith({
        where: { id: "shift_1", organizationId: "org_1" },
      });
    });
  });
});
