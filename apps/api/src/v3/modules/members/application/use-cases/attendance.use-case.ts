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
} from "../dto/attendance.dto";
import { AuditLogAction, AuditEntityType } from "@repo/db";

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
        // ⚡ Bolt Optimization: Replace broad 'include' with targeted 'select' to reduce payload size and DB I/O.
        select: {
          id: true,
          memberId: true,
          checkInTime: true,
          checkOutTime: true,
          checkInLocationId: true,
          checkOutLocationId: true,
          durationMinutes: true,
          notes: true,
          isAutoCheckout: true,
          createdAt: true,
          updatedAt: true,
          member: {
            select: {
              id: true,
              user: { select: { name: true } },
            },
          },
          checkInLocation: { select: { name: true } },
          checkOutLocation: { select: { name: true } },
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
    const activeLog = await this.prisma.client.attendanceLog.findFirst({
      where: { memberId, checkOutTime: null },
    });

    if (activeLog) {
      throw new BadRequestException("Member is already checked in");
    }

    return this.prisma.client.$transaction(async tx => {
      const log = await tx.attendanceLog.create({
        data: {
          organizationId,
          memberId,
          checkInTime: new Date(),
          checkInLocationId: dto.locationId,
          notes: dto.notes,
        },
      });

      await tx.member.update({
        where: { id: memberId },
        data: {
          isCheckedIn: true,
          lastCheckInTime: new Date(),
          currentCheckInLocationId: dto.locationId,
          currentAttendanceLogId: log.id,
          status: "ONLINE",
        },
      });

      return log;
    });
  }

  async checkOut(organizationId: string, memberId: string, dto: CheckOutDto) {
    const activeLog = await this.prisma.client.attendanceLog.findFirst({
      where: { memberId, checkOutTime: null },
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
    const member = await this.prisma.client.member.findUnique({
      where: { id: memberId, organizationId },
      select: {
        id: true,
        status: true,
        isCheckedIn: true,
        lastCheckInTime: true,
        currentCheckInLocationId: true,
      },
    });

    if (!member) throw new NotFoundException("Member not found");
    return member;
  }
}
