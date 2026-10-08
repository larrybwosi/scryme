import { Test, TestingModule } from "@nestjs/testing";
import { AttendanceUseCase, calculateHaversineDistance } from "../attendance.use-case";
import { PrismaService } from "@/prisma/prisma.service";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { AttendanceVerificationMethod, ShiftAttendanceStatus } from "../../dto/attendance.dto";

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
      staffShift: {
        findMany: vi.fn(),
      },
      $transaction: vi.fn(cb => cb(mockPrisma.client)),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceUseCase,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    useCase = module.get<AttendanceUseCase>(AttendanceUseCase);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it("should calculate Haversine distance correctly", () => {
    // Distance between two points in NYC (~1.5km)
    const dist = calculateHaversineDistance(40.7128, -74.006, 40.725, -74.006);
    expect(dist).toBeGreaterThan(1300);
    expect(dist).toBeLessThan(1500);
  });

  describe("checkIn", () => {
    const orgId = "org1";
    const memberId = "m1";
    const locationId = "loc1";
    const dto = { locationId, notes: "test notes" };

    it("should throw BadRequestException if neither locationId nor branchCode is provided", async () => {
      await expect(useCase.checkIn(orgId, memberId, {})).rejects.toThrow(BadRequestException);
    });

    it("should throw NotFoundException if location does not belong to organization", async () => {
      mockPrisma.client.inventoryLocation.findFirst.mockResolvedValue(null);

      await expect(useCase.checkIn(orgId, memberId, dto)).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if member is already checked in", async () => {
      mockPrisma.client.inventoryLocation.findFirst.mockResolvedValue({ id: locationId });
      mockPrisma.client.attendanceLog.findFirst.mockResolvedValue({ id: "active-log-id" });

      await expect(useCase.checkIn(orgId, memberId, dto)).rejects.toThrow(BadRequestException);
    });

    it("should successfully check in with GPS verification and automatic shift matching", async () => {
      mockPrisma.client.inventoryLocation.findFirst.mockResolvedValue({
        id: locationId,
        latitude: 40.7128,
        longitude: -74.006,
        radiusMeters: 200,
      });
      mockPrisma.client.attendanceLog.findFirst.mockResolvedValue(null);
      mockPrisma.client.staffShift.findMany.mockResolvedValue([
        {
          id: "shift1",
          startTime: `${new Date().getHours()}:${new Date().getMinutes()}`,
          endTime: "17:00",
        },
      ]);
      mockPrisma.client.attendanceLog.create.mockResolvedValue({ id: "new-log-id" });

      const result = await useCase.checkIn(orgId, memberId, {
        locationId,
        latitude: 40.7128,
        longitude: -74.006,
        verificationMethod: AttendanceVerificationMethod.GPS_GEOFENCE,
      });

      expect(result.id).toBe("new-log-id");
      expect(mockPrisma.client.attendanceLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          shiftId: "shift1",
          shiftStatus: ShiftAttendanceStatus.ON_TIME,
          verificationMethod: AttendanceVerificationMethod.GPS_GEOFENCE,
          isLocationVerified: true,
        }),
      });
    });

    it("should mark shiftStatus as LATE if checking in > 15 mins after shift start", async () => {
      mockPrisma.client.inventoryLocation.findFirst.mockResolvedValue({ id: locationId });
      mockPrisma.client.attendanceLog.findFirst.mockResolvedValue(null);
      mockPrisma.client.staffShift.findMany.mockResolvedValue([
        {
          id: "shift1",
          startTime: "00:01", // Way earlier today
          endTime: "17:00",
        },
      ]);
      mockPrisma.client.attendanceLog.create.mockResolvedValue({ id: "new-log-id" });

      await useCase.checkIn(orgId, memberId, {
        locationId,
        verificationMethod: AttendanceVerificationMethod.MANAGER_OVERRIDE,
      });

      expect(mockPrisma.client.attendanceLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          shiftStatus: ShiftAttendanceStatus.LATE,
          isLocationVerified: true,
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
});
