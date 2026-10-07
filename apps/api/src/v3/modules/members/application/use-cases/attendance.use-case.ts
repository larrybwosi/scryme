import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import {
  CheckInDto,
  CheckOutDto,
  AttendanceQueryDto,
  ShiftAttendanceStatus,
  AttendanceVerificationMethod,
} from "../dto/attendance.dto";

export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

@Injectable()
export class AttendanceUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async getAttendanceLogs(organizationId: string, query: AttendanceQueryDto) {
    const {
      page = 1,
      limit = 20,
      memberId,
      locationId,
      startDate,
      endDate,
    } = query;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };
    if (memberId) where.memberId = memberId;
    if (locationId) where.checkInLocationId = locationId;
    if (startDate || endDate) {
      where.checkInTime = {};
      if (startDate) where.checkInTime.gte = new Date(startDate);
      if (endDate) where.checkInTime.lte = new Date(endDate);
    }

    const [total, items] = await Promise.all([
      this.prisma.client.attendanceLog.count({ where }),
      this.prisma.client.attendanceLog.findMany({
        where,
        select: {
          id: true,
          memberId: true,
          checkInTime: true,
          checkOutTime: true,
          checkInLocationId: true,
          checkOutLocationId: true,
          durationMinutes: true,
          shiftId: true,
          shiftStatus: true,
          verificationMethod: true,
          isLocationVerified: true,
          latitude: true,
          longitude: true,
          distanceMeters: true,
          notes: true,
          isAutoCheckout: true,
          createdAt: true,
          updatedAt: true,
          member: {
            select: {
              id: true,
              user: { select: { name: true, email: true, image: true } },
            },
          },
          checkInLocation: { select: { id: true, name: true, branchCode: true } },
          checkOutLocation: { select: { id: true, name: true } },
          shift: { select: { id: true, startTime: true, endTime: true, dayOfWeek: true } },
        },
        skip,
        take: limit,
        orderBy: { checkInTime: "desc" },
      }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async checkIn(organizationId: string, memberId: string, dto: CheckInDto) {
    if (!dto.locationId && !dto.branchCode) {
      throw new BadRequestException("Either locationId or branchCode must be provided");
    }

    // SECURITY (Sentinel): Verify location ownership & details
    const locationWhere: any = { organizationId };
    if (dto.locationId) {
      locationWhere.id = dto.locationId;
    } else if (dto.branchCode) {
      locationWhere.branchCode = dto.branchCode;
    }

    const location = await this.prisma.client.inventoryLocation.findFirst({
      where: locationWhere,
      select: {
        id: true,
        name: true,
        branchCode: true,
        latitude: true,
        longitude: true,
        radiusMeters: true,
      },
    });

    if (!location) {
      throw new NotFoundException("Location not found");
    }

    const activeLog = await this.prisma.client.attendanceLog.findFirst({
      where: { organizationId, memberId, checkOutTime: null },
    });

    if (activeLog) {
      throw new BadRequestException("Member is already checked in");
    }

    const checkInTime = new Date();

    // 1. Determine Physical Verification
    let isLocationVerified = false;
    let distanceMeters: number | null = null;
    let verificationMethod = dto.verificationMethod || AttendanceVerificationMethod.WEB_PORTAL;

    if (dto.verificationMethod === AttendanceVerificationMethod.POS_DEVICE) {
      isLocationVerified = true;
    } else if (dto.verificationMethod === AttendanceVerificationMethod.MANAGER_OVERRIDE) {
      isLocationVerified = true;
    } else if (dto.branchCode && location.branchCode && dto.branchCode === location.branchCode) {
      isLocationVerified = true;
      verificationMethod = dto.verificationMethod || AttendanceVerificationMethod.QR_SCAN;
    } else if (
      dto.latitude !== undefined &&
      dto.longitude !== undefined &&
      location.latitude !== null &&
      location.latitude !== undefined &&
      location.longitude !== null &&
      location.longitude !== undefined
    ) {
      distanceMeters = calculateHaversineDistance(
        dto.latitude,
        dto.longitude,
        location.latitude,
        location.longitude,
      );
      const allowedRadius = location.radiusMeters || 100;
      isLocationVerified = distanceMeters <= allowedRadius;
      verificationMethod = dto.verificationMethod || AttendanceVerificationMethod.GPS_GEOFENCE;
    }

    // 2. Determine Automatic Shift Matching & Status
    const dayOfWeek = checkInTime.getDay(); // 0 = Sunday, 6 = Saturday
    const candidateShifts = await this.prisma.client.staffShift.findMany({
      where: {
        organizationId,
        memberId,
        isActive: true,
        dayOfWeek,
        OR: [{ locationId: location.id }, { locationId: null }],
      },
    });

    let matchedShiftId: string | null = null;
    let shiftStatus: ShiftAttendanceStatus = ShiftAttendanceStatus.UNSCHEDULED;

    if (candidateShifts.length > 0) {
      const shift = candidateShifts[0];
      matchedShiftId = shift.id;

      const [startHours, startMins] = shift.startTime.split(":").map(Number);
      const scheduledStart = new Date(checkInTime);
      scheduledStart.setHours(startHours, startMins, 0, 0);

      const diffMins = (checkInTime.getTime() - scheduledStart.getTime()) / 60000;

      if (diffMins > 15) {
        shiftStatus = ShiftAttendanceStatus.LATE;
      } else if (diffMins < -15) {
        shiftStatus = ShiftAttendanceStatus.EARLY;
      } else {
        shiftStatus = ShiftAttendanceStatus.ON_TIME;
      }
    }

    return this.prisma.client.$transaction(async tx => {
      const log = await tx.attendanceLog.create({
        data: {
          organizationId,
          memberId,
          checkInTime,
          checkInLocationId: location.id,
          shiftId: matchedShiftId,
          shiftStatus,
          verificationMethod,
          isLocationVerified,
          latitude: dto.latitude ?? null,
          longitude: dto.longitude ?? null,
          distanceMeters,
          notes: dto.notes,
        },
      });

      await tx.member.update({
        where: { id: memberId },
        data: {
          isCheckedIn: true,
          lastCheckInTime: checkInTime,
          currentCheckInLocationId: location.id,
          currentAttendanceLogId: log.id,
          status: "ONLINE",
        },
      });

      return log;
    });
  }

  async checkOut(organizationId: string, memberId: string, dto: CheckOutDto) {
    if (dto.locationId) {
      const location = await this.prisma.client.inventoryLocation.findFirst({
        where: { id: dto.locationId, organizationId },
        select: { id: true },
      });

      if (!location) {
        throw new NotFoundException("Location not found");
      }
    }

    const activeLog = await this.prisma.client.attendanceLog.findFirst({
      where: { organizationId, memberId, checkOutTime: null },
    });

    if (!activeLog) {
      throw new BadRequestException("Member is not checked in");
    }

    const checkOutTime = new Date();
    const durationMinutes = Math.round(
      (checkOutTime.getTime() - activeLog.checkInTime.getTime()) / 60000,
    );

    return this.prisma.client.$transaction(async tx => {
      const log = await tx.attendanceLog.update({
        where: { id: activeLog.id },
        data: {
          checkOutTime,
          checkOutLocationId: dto.locationId || activeLog.checkInLocationId,
          durationMinutes,
          notes: dto.notes || activeLog.notes,
          isAutoCheckout: dto.isAutoCheckout ?? false,
        },
      });

      await tx.member.update({
        where: { id: memberId },
        data: {
          isCheckedIn: false,
          currentCheckInLocationId: null,
          currentAttendanceLogId: null,
          status: "OFFLINE",
        },
      });

      return log;
    });
  }

  async getMemberStatus(organizationId: string, memberId: string) {
    const member = await this.prisma.client.member.findFirst({
      where: { id: memberId, organizationId },
      select: {
        id: true,
        status: true,
        isCheckedIn: true,
        lastCheckInTime: true,
        currentCheckInLocationId: true,
        currentAttendanceLog: {
          select: {
            id: true,
            checkInTime: true,
            checkInLocation: { select: { id: true, name: true } },
            shiftStatus: true,
            verificationMethod: true,
            isLocationVerified: true,
          },
        },
      },
    });

    if (!member) throw new NotFoundException("Member not found");
    return member;
  }

  async getLiveAdherence(organizationId: string, locationId?: string) {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const shiftWhere: any = {
      organizationId,
      isActive: true,
      dayOfWeek,
    };
    if (locationId) {
      shiftWhere.OR = [{ locationId }, { locationId: null }];
    }

    const [todayShifts, todayLogs] = await Promise.all([
      this.prisma.client.staffShift.findMany({
        where: shiftWhere,
        include: {
          member: {
            select: {
              id: true,
              isCheckedIn: true,
              user: { select: { name: true, email: true, image: true } },
            },
          },
        },
      }),
      this.prisma.client.attendanceLog.findMany({
        where: {
          organizationId,
          checkInTime: { gte: startOfDay },
          ...(locationId ? { checkInLocationId: locationId } : {}),
        },
        include: {
          member: {
            select: {
              id: true,
              isCheckedIn: true,
              user: { select: { name: true, email: true, image: true } },
            },
          },
          checkInLocation: { select: { id: true, name: true } },
        },
        orderBy: { checkInTime: "desc" },
      }),
    ]);

    return {
      date: now.toISOString(),
      dayOfWeek,
      shifts: todayShifts,
      logs: todayLogs,
    };
  }
}
