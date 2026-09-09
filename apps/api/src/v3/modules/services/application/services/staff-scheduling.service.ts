import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { BookingStatus, ScheduleOverrideType } from "@repo/db";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { PrismaService } from "@/prisma/prisma.service";

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const ACTIVE_BOOKING_STATUSES = [
  BookingStatus.REQUESTED,
  BookingStatus.SCHEDULED,
  BookingStatus.IN_PROGRESS,
];

type AvailabilityOptions = {
  organizationId?: string;
  locationId?: string;
  excludeBookingId?: string;
};

@Injectable()
export class StaffSchedulingService {
  constructor(private readonly prisma: PrismaService) {}

  private validateTimeRange(startTime: string, endTime: string) {
    if (!TIME_PATTERN.test(startTime) || !TIME_PATTERN.test(endTime)) {
      throw new BadRequestException("Times must use the HH:mm 24-hour format");
    }
    if (this.toMinutes(endTime) <= this.toMinutes(startTime)) {
      throw new BadRequestException("End time must be after start time");
    }
  }

  private toMinutes(time: string) {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  }

  private async getTimezone(organizationId: string) {
    const settings = await this.prisma.client.organizationSettings.findUnique({
      where: { organizationId },
      select: { defaultTimezone: true },
    });
    return settings?.defaultTimezone || "UTC";
  }

  async createShift(
    orgId: string,
    memberId: string,
    data: {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      locationId?: string;
      effectiveFrom?: Date;
      effectiveUntil?: Date;
      isActive?: boolean;
    },
  ) {
    this.validateTimeRange(data.startTime, data.endTime);
    if (data.dayOfWeek < 0 || data.dayOfWeek > 6) {
      throw new BadRequestException("dayOfWeek must be between 0 and 6");
    }
    if (
      data.effectiveFrom &&
      data.effectiveUntil &&
      data.effectiveUntil < data.effectiveFrom
    ) {
      throw new BadRequestException("effectiveUntil must follow effectiveFrom");
    }

    const member = await this.prisma.client.member.findFirst({
      where: { id: memberId, organizationId: orgId },
    });
    if (!member) throw new NotFoundException("Active member not found");

    const overlap = await this.prisma.client.staffShift.findFirst({
      where: {
        organizationId: orgId,
        memberId,
        dayOfWeek: data.dayOfWeek,
        isActive: true,
        startTime: { lt: data.endTime },
        endTime: { gt: data.startTime },
        OR: [
          { effectiveUntil: null },
          { effectiveUntil: { gte: data.effectiveFrom || new Date(0) } },
        ],
      },
    });
    if (overlap) throw new ConflictException("Shift overlaps an active shift");

    return this.prisma.client.staffShift.create({
      data: { ...data, memberId, organizationId: orgId },
    });
  }

  async getStaffShifts(orgId: string, memberId: string) {
    return this.getShifts(orgId, { memberId });
  }

  async getShifts(
    orgId: string,
    filters: {
      memberId?: string;
      dayOfWeek?: number;
      isActive?: boolean;
      locationId?: string;
      from?: Date;
      to?: Date;
    },
  ) {
    return this.prisma.client.staffShift.findMany({
      where: {
        organizationId: orgId,
        ...(filters.memberId ? { memberId: filters.memberId } : {}),
        ...(filters.dayOfWeek !== undefined
          ? { dayOfWeek: filters.dayOfWeek }
          : {}),
        ...(filters.isActive !== undefined
          ? { isActive: filters.isActive }
          : {}),
        ...(filters.locationId
          ? { OR: [{ locationId: null }, { locationId: filters.locationId }] }
          : {}),
        ...(filters.from
          ? { OR: [{ effectiveUntil: null }, { effectiveUntil: { gte: filters.from } }] }
          : {}),
        ...(filters.to
          ? { OR: [{ effectiveFrom: null }, { effectiveFrom: { lte: filters.to } }] }
          : {}),
      },
      include: {
        breaks: true,
        member: {
          select: {
            id: true,
            role: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
  }

  async addBreak(
    orgId: string,
    shiftId: string,
    data: { startTime: string; endTime: string; description?: string },
  ) {
    this.validateTimeRange(data.startTime, data.endTime);
    const shift = await this.prisma.client.staffShift.findFirst({
      where: { id: shiftId, organizationId: orgId },
    });
    if (!shift) throw new NotFoundException("Shift not found");
    if (shift.startTime && shift.endTime && (
      this.toMinutes(data.startTime) < this.toMinutes(shift.startTime) ||
      this.toMinutes(data.endTime) > this.toMinutes(shift.endTime)
    )) {
      throw new BadRequestException("Break must be inside the shift");
    }
    const existingBreak = await this.prisma.client.staffBreak.findFirst?.({
      where: {
        shiftId,
        startTime: { lt: data.endTime },
        endTime: { gt: data.startTime },
      },
    });
    if (existingBreak) throw new ConflictException("Break overlaps an existing break");
    return this.prisma.client.staffBreak.create({ data: { ...data, shiftId } });
  }

  async createOverride(
    orgId: string,
    memberId: string,
    data: {
      type: ScheduleOverrideType;
      startTime: Date;
      endTime: Date;
      reason?: string;
      locationId?: string;
      approvedById?: string;
    },
  ) {
    if (data.endTime <= data.startTime) {
      throw new BadRequestException("Override end must follow its start");
    }
    const member = await this.prisma.client.member.findFirst({
      where: { id: memberId, organizationId: orgId },
      select: { id: true },
    });
    if (!member) throw new NotFoundException("Member not found");

    return this.prisma.client.staffScheduleOverride.create({
      data: { ...data, organizationId: orgId, memberId },
    });
  }

  async deleteOverride(orgId: string, overrideId: string) {
    const result = await this.prisma.client.staffScheduleOverride.deleteMany({
      where: { id: overrideId, organizationId: orgId },
    });
    if (!result.count) throw new NotFoundException("Schedule override not found");
    return { deleted: true };
  }

  async getOverrides(orgId: string, from: Date, to: Date, memberId?: string) {
    if (to <= from) throw new BadRequestException("Invalid date range");
    return this.prisma.client.staffScheduleOverride.findMany({
      where: {
        organizationId: orgId,
        ...(memberId ? { memberId } : {}),
        startTime: { lt: to },
        endTime: { gt: from },
      },
      include: {
        member: { select: { id: true, user: { select: { name: true, email: true, image: true } } } },
      },
      orderBy: { startTime: "asc" },
    });
  }

  async checkStaffAvailability(
    memberId: string,
    startTime: Date,
    endTime: Date,
    options: AvailabilityOptions = {},
  ) {
    if (endTime <= startTime) {
      throw new BadRequestException("Availability end must follow its start");
    }
    const member = await this.prisma.client.member.findFirst({
      where: {
        id: memberId,
        ...(options.organizationId
          ? { organizationId: options.organizationId }
          : {}),
        isActive: true,
      },
      select: { organizationId: true },
    });
    if (!member) return { available: false, reasons: ["STAFF_NOT_FOUND"] };

    const orgId = options.organizationId || member.organizationId;
    const timezone = await this.getTimezone(orgId);
    const localStart = toZonedTime(startTime, timezone);
    const localEnd = toZonedTime(endTime, timezone);
    const localDayStart = new Date(localStart);
    localDayStart.setHours(0, 0, 0, 0);
    const utcDayStart = fromZonedTime(localDayStart, timezone);
    const localDayEnd = new Date(localDayStart);
    localDayEnd.setDate(localDayEnd.getDate() + 1);
    const utcDayEnd = fromZonedTime(localDayEnd, timezone);

    const [shifts, overrides, conflict] = await Promise.all([
      this.prisma.client.staffShift.findMany({
        where: {
          organizationId: orgId,
          memberId,
          dayOfWeek: localStart.getDay(),
          isActive: true,
          OR: [{ locationId: null }, ...(options.locationId ? [{ locationId: options.locationId }] : [])],
          AND: [
            { OR: [{ effectiveFrom: null }, { effectiveFrom: { lte: utcDayEnd } }] },
            { OR: [{ effectiveUntil: null }, { effectiveUntil: { gte: utcDayStart } }] },
          ],
        },
        include: { breaks: true },
      }),
      this.prisma.client.staffScheduleOverride.findMany({
        where: {
          organizationId: orgId,
          memberId,
          startTime: { lt: endTime },
          endTime: { gt: startTime },
          ...(options.locationId
            ? { OR: [{ locationId: null }, { locationId: options.locationId }] }
            : {}),
        },
      }),
      this.prisma.client.serviceBooking.findFirst({
        where: {
          organizationId: orgId,
          ...(options.excludeBookingId ? { id: { not: options.excludeBookingId } } : {}),
          status: { in: ACTIVE_BOOKING_STATUSES },
          scheduledStartTime: { lt: endTime },
          scheduledEndTime: { gt: startTime },
          staff: { some: { memberId } },
        },
        select: { id: true },
      }),
    ]);

    const reasons: string[] = [];
    const blockingOverride = overrides.find(item =>
      item.type === ScheduleOverrideType.UNAVAILABLE ||
      item.type === ScheduleOverrideType.LEAVE ||
      item.type === ScheduleOverrideType.BLACKOUT,
    );
    if (blockingOverride) reasons.push(blockingOverride.type);
    if (conflict) reasons.push("BOOKING_CONFLICT");

    const workingOverride = overrides.some(
      item =>
        item.type === ScheduleOverrideType.WORKING &&
        item.startTime <= startTime &&
        item.endTime >= endTime,
    );
    const startMinutes = localStart.getHours() * 60 + localStart.getMinutes();
    const endMinutes = localEnd.getHours() * 60 + localEnd.getMinutes();
    const coveredByShift = shifts.some(shift => {
      const covered =
        startMinutes >= this.toMinutes(shift.startTime) &&
        endMinutes <= this.toMinutes(shift.endTime);
      const onBreak = shift.breaks.some(
        item =>
          startMinutes < this.toMinutes(item.endTime) &&
          endMinutes > this.toMinutes(item.startTime),
      );
      if (onBreak) reasons.push("BREAK");
      return covered && !onBreak;
    });
    if (!workingOverride && !coveredByShift) reasons.push("OUTSIDE_SHIFT");

    return { available: reasons.length === 0, reasons: [...new Set(reasons)] };
  }

  async isStaffAvailable(memberId: string, startTime: Date, endTime: Date) {
    const dayOfWeek = startTime.getDay();
    const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
    const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();
    const shifts = await this.prisma.client.staffShift.findMany({
      where: { memberId, dayOfWeek, isActive: true },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        breaks: { select: { id: true, startTime: true, endTime: true } },
      },
    });
    return shifts.some(shift => {
      const covered = startMinutes >= this.toMinutes(shift.startTime) && endMinutes <= this.toMinutes(shift.endTime);
      const onBreak = shift.breaks.some(item =>
        startMinutes < this.toMinutes(item.endTime) && endMinutes > this.toMinutes(item.startTime),
      );
      return covered && !onBreak;
    });
  }

  async getCoverage(orgId: string, from: Date, to: Date, locationId?: string) {
    const [shifts, overrides, bookings] = await Promise.all([
      this.getShifts(orgId, { isActive: true, locationId, from, to }),
      this.getOverrides(orgId, from, to),
      this.prisma.client.serviceBooking.findMany({
        where: {
          organizationId: orgId,
          scheduledStartTime: { lt: to },
          scheduledEndTime: { gt: from },
          status: { in: ACTIVE_BOOKING_STATUSES },
          ...(locationId ? { locationId } : {}),
        },
        select: { id: true, status: true, staff: { select: { memberId: true } } },
      }),
    ]);
    const unassigned = bookings.filter(item => item.staff.length === 0).length;
    return {
      shiftCount: shifts.length,
      overrideCount: overrides.length,
      activeBookings: bookings.length,
      unassignedBookings: unassigned,
      coverageStatus: unassigned > 0 ? "ATTENTION" : "COVERED",
    };
  }
}
