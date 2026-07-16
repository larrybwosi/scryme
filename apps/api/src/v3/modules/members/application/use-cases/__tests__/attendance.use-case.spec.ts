import { Test, TestingModule } from "@nestjs/testing";
import { AttendanceUseCase } from "../attendance.use-case";
import { PrismaService } from "@/prisma/prisma.service";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { NotFoundException, BadRequestException } from "@nestjs/common";

describe("AttendanceUseCase", () => {
  let useCase: AttendanceUseCase;
  let prisma: PrismaService;

  const mockPrisma = {
    client: {
      attendanceLog: {
        findMany: vi.fn(),
        count: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      member: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      inventoryLocation: {
        findFirst: vi.fn(),
      },
      $transaction: vi.fn(cb => cb(mockPrisma.client)),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceUseCase,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    useCase = module.get<AttendanceUseCase>(AttendanceUseCase);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
  });

  describe("checkIn", () => {
    const orgId = "org1";
    const memberId = "m1";
    const locationId = "loc1";
    const dto = { locationId, notes: "test notes" };

    it("should throw NotFoundException if location does not belong to organization", async () => {
      mockPrisma.client.inventoryLocation.findFirst.mockResolvedValue(null);

      await expect(useCase.checkIn(orgId, memberId, dto)).rejects.toThrow(NotFoundException);
      expect(mockPrisma.client.inventoryLocation.findFirst).toHaveBeenCalledWith({
        where: { id: locationId, organizationId: orgId },
        select: { id: true },
      });
    });

    it("should throw BadRequestException if member is already checked in", async () => {
      mockPrisma.client.inventoryLocation.findFirst.mockResolvedValue({ id: locationId });
      mockPrisma.client.attendanceLog.findFirst.mockResolvedValue({ id: "active-log-id" });

      await expect(useCase.checkIn(orgId, memberId, dto)).rejects.toThrow(BadRequestException);
      expect(mockPrisma.client.attendanceLog.findFirst).toHaveBeenCalledWith({
        where: { organizationId: orgId, memberId, checkOutTime: null },
      });
    });

    it("should successfully check in and update member status", async () => {
      mockPrisma.client.inventoryLocation.findFirst.mockResolvedValue({ id: locationId });
      mockPrisma.client.attendanceLog.findFirst.mockResolvedValue(null);
      mockPrisma.client.attendanceLog.create.mockResolvedValue({ id: "new-log-id" });

      const result = await useCase.checkIn(orgId, memberId, dto);

      expect(result.id).toBe("new-log-id");
      expect(mockPrisma.client.attendanceLog.create).toHaveBeenCalled();
      expect(mockPrisma.client.member.update).toHaveBeenCalledWith({
        where: { id: memberId },
        data: expect.objectContaining({
          isCheckedIn: true,
          status: "ONLINE",
        }),
      });
    });
  });

  describe("checkOut", () => {
    const orgId = "org1";
    const memberId = "m1";
    const locationId = "loc1";
    const dto = { locationId, notes: "checkout notes" };
    const activeLog = { id: "log1", checkInTime: new Date(Date.now() - 60000), checkInLocationId: "loc-in" };

    it("should throw NotFoundException if checkout location does not belong to organization", async () => {
      mockPrisma.client.inventoryLocation.findFirst.mockResolvedValue(null);

      await expect(useCase.checkOut(orgId, memberId, dto)).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if member is not checked in", async () => {
      mockPrisma.client.inventoryLocation.findFirst.mockResolvedValue({ id: locationId });
      mockPrisma.client.attendanceLog.findFirst.mockResolvedValue(null);

      await expect(useCase.checkOut(orgId, memberId, dto)).rejects.toThrow(BadRequestException);
    });

    it("should successfully check out and update member status", async () => {
      mockPrisma.client.inventoryLocation.findFirst.mockResolvedValue({ id: locationId });
      mockPrisma.client.attendanceLog.findFirst.mockResolvedValue(activeLog);
      mockPrisma.client.attendanceLog.update.mockResolvedValue({ ...activeLog, checkOutTime: new Date() });

      await useCase.checkOut(orgId, memberId, dto);

      expect(mockPrisma.client.attendanceLog.update).toHaveBeenCalled();
      expect(mockPrisma.client.member.update).toHaveBeenCalledWith({
        where: { id: memberId },
        data: expect.objectContaining({
          isCheckedIn: false,
          status: "OFFLINE",
        }),
      });
    });
  });

  describe("getMemberStatus", () => {
    it("should throw NotFoundException if member not found", async () => {
      mockPrisma.client.member.findFirst.mockResolvedValue(null);
      await expect(useCase.getMemberStatus("org1", "m1")).rejects.toThrow(NotFoundException);
    });

    it("should return member status", async () => {
      const mockMember = { id: "m1", status: "ONLINE", isCheckedIn: true };
      mockPrisma.client.member.findFirst.mockResolvedValue(mockMember);

      const result = await useCase.getMemberStatus("org1", "m1");
      expect(result).toEqual(mockMember);
      expect(mockPrisma.client.member.findFirst).toHaveBeenCalledWith({
        where: { id: "m1", organizationId: "org1" },
        select: expect.any(Object),
      });
    });
  });

  describe("getAttendanceLogs", () => {
    it("should return paginated attendance logs with selected fields", async () => {
      const mockLogs = [
        {
          id: "1",
          memberId: "m1",
          checkInTime: new Date(),
          checkInLocationId: "l1",
          member: {
            id: "m1",
            user: { name: "Test Member" },
          },
          checkInLocation: { name: "Location 1" },
        },
      ];

      mockPrisma.client.attendanceLog.count.mockResolvedValue(1);
      mockPrisma.client.attendanceLog.findMany.mockResolvedValue(mockLogs);

      const result = await useCase.getAttendanceLogs("org1", { page: 1, limit: 10 });

      expect(result.items).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.items[0].member.user.name).toBe("Test Member");

      // Verify that findMany was called with select
      expect(mockPrisma.client.attendanceLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({
            id: true,
            memberId: true,
            member: expect.objectContaining({
              select: expect.objectContaining({
                user: expect.objectContaining({
                  select: { name: true }
                }),
              }),
            }),
          }),
        }),
      );
    });
  });
});
