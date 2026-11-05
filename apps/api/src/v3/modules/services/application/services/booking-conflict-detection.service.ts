import { Injectable, BadRequestException, ConflictException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { BookingStatus, ScheduleOverrideType } from "@repo/db";

export interface BookingConflictDetails {
  hasConflict: boolean;
  canOverride: boolean;
  conflicts: {
    type:
      | "STAFF_UNAVAILABLE"
      | "STAFF_SHIFT_MISMATCH"
      | "STAFF_OVERLAP"
      | "STAFF_CAPACITY_OVERLOAD"
      | "LOCATION_CAPACITY_EXCEEDED"
      | "ROOM_OVERLAP"
      | "CUSTOMER_DOUBLE_BOOKING";
    message: string;
    resourceId?: string;
    resourceName?: string;
    details?: any;
  }[];
}

@Injectable()
export class BookingConflictDetectionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Performs multi-dimensional conflict detection across:
   * 1. Staff schedule overrides (LEAVE, UNAVAILABLE, BLACKOUT)
   * 2. Existing overlapping staff bookings
   * 3. Staff weekly capacity / utilization checks
   * 4. Customer double-booking detection
   * 5. Location or room capacity constraints
   */
  async detectConflicts(params: {
    orgId: string;
    startTime: Date;
    endTime: Date;
    staffMemberIds?: string[];
    customerId?: string;
    locationId?: string;
    excludeBookingId?: string;
  }): Promise<BookingConflictDetails> {
    const { orgId, startTime, endTime, staffMemberIds = [], customerId, locationId, excludeBookingId } = params;
    const conflicts: BookingConflictDetails["conflicts"] = [];

    const activeBookingStatuses = [
      BookingStatus.REQUESTED,
      BookingStatus.PENDING,
      BookingStatus.CONFIRMED,
      BookingStatus.ASSIGNED,
      BookingStatus.SCHEDULED,
      BookingStatus.IN_PROGRESS,
    ];

    // 1. Staff Conflicts
    for (const memberId of staffMemberIds) {
      // 1a. Check Member existence
      const member = await this.prisma.client.member.findFirst({
        where: { id: memberId, organizationId: orgId },
        include: { user: { select: { name: true } } },
      });
      const staffName = member?.user?.name || `Staff (${memberId})`;

      // 1b. Check overrides (Leave, Blackout, Unavailable)
      const override = await this.prisma.client.staffScheduleOverride.findFirst({
        where: {
          organizationId: orgId,
          memberId,
          startTime: { lt: endTime },
          endTime: { gt: startTime },
          type: { in: [ScheduleOverrideType.LEAVE, ScheduleOverrideType.UNAVAILABLE, ScheduleOverrideType.BLACKOUT] },
        },
      });

      if (override) {
        conflicts.push({
          type: "STAFF_UNAVAILABLE",
          message: `${staffName} is marked ${override.type.toLowerCase()} during this time window.`,
          resourceId: memberId,
          resourceName: staffName,
          details: { overrideId: override.id, reason: override.reason, overrideType: override.type },
        });
      }

      // 1c. Check existing overlapping bookings for this staff member
      const overlappingStaffBooking = await this.prisma.client.bookingStaff.findFirst({
        where: {
          memberId,
          booking: {
            organizationId: orgId,
            ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
            status: { in: activeBookingStatuses },
            scheduledStartTime: { lt: endTime },
            scheduledEndTime: { gt: startTime },
          },
        },
        include: {
          booking: {
            select: { id: true, serviceName: true, scheduledStartTime: true, scheduledEndTime: true },
          },
        },
      });

      if (overlappingStaffBooking) {
        conflicts.push({
          type: "STAFF_OVERLAP",
          message: `${staffName} already has another booking (${overlappingStaffBooking.booking.serviceName}) scheduled at this time.`,
          resourceId: memberId,
          resourceName: staffName,
          details: { overlappingBooking: overlappingStaffBooking.booking },
        });
      }

      // 1d. Check weekly capacity overload (>100% capacity)
      const startOfWeek = new Date(startTime);
      startOfWeek.setUTCDate(startTime.getUTCDate() - startTime.getUTCDay());
      startOfWeek.setUTCHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setUTCDate(endOfWeek.getUTCDate() + 7);

      const [weeklyBookings, weeklyShifts] = await Promise.all([
        this.prisma.client.serviceBooking.findMany({
          where: {
            organizationId: orgId,
            staff: { some: { memberId } },
            status: { in: activeBookingStatuses },
            scheduledStartTime: { gte: startOfWeek, lt: endOfWeek },
            ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
          },
          select: { scheduledStartTime: true, scheduledEndTime: true },
        }),
        this.prisma.client.staffShift.findMany({
          where: {
            organizationId: orgId,
            memberId,
            isActive: true,
          },
          select: { startTime: true, endTime: true },
        }),
      ]);

      let scheduledWeeklyHours = weeklyShifts.reduce((acc, shift) => {
        const [sh, sm] = shift.startTime.split(":").map(Number);
        const [eh, em] = shift.endTime.split(":").map(Number);
        const hours = (eh * 60 + em - (sh * 60 + sm)) / 60;
        return acc + (hours > 0 ? hours : 0);
      }, 0);
      if (scheduledWeeklyHours <= 0) scheduledWeeklyHours = 40;

      const bookedWeeklyHours = weeklyBookings.reduce((acc, b) => {
        const bStart = b.scheduledStartTime.getTime();
        const bEnd = b.scheduledEndTime ? b.scheduledEndTime.getTime() : bStart + 60 * 60000;
        return acc + Math.max(0, (bEnd - bStart) / (1000 * 60 * 60));
      }, 0);

      const newBookingHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      const totalProjectedHours = bookedWeeklyHours + newBookingHours;

      if (totalProjectedHours > scheduledWeeklyHours) {
        conflicts.push({
          type: "STAFF_CAPACITY_OVERLOAD",
          message: `${staffName} is projected at ${Math.round((totalProjectedHours / scheduledWeeklyHours) * 100)}% capacity (${totalProjectedHours.toFixed(1)}h / ${scheduledWeeklyHours}h limit).`,
          resourceId: memberId,
          resourceName: staffName,
          details: {
            projectedHours: totalProjectedHours,
            capacityHours: scheduledWeeklyHours,
            utilizationPercent: Math.round((totalProjectedHours / scheduledWeeklyHours) * 100),
          },
        });
      }
    }

    // 2. Customer Double-Booking Detection
    if (customerId) {
      const customerOverlap = await this.prisma.client.serviceBooking.findFirst({
        where: {
          organizationId: orgId,
          customerId,
          ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
          status: { in: activeBookingStatuses },
          scheduledStartTime: { lt: endTime },
          scheduledEndTime: { gt: startTime },
        },
        select: { id: true, scheduledStartTime: true, scheduledEndTime: true, serviceName: true },
      });

      if (customerOverlap) {
        conflicts.push({
          type: "CUSTOMER_DOUBLE_BOOKING",
          message: `Customer already has an active booking for "${customerOverlap.serviceName}" at this time.`,
          details: {
            existingBookingId: customerOverlap.id,
            startTime: customerOverlap.scheduledStartTime,
            endTime: customerOverlap.scheduledEndTime,
          },
        });
      }
    }

    // 3. Location / Station Capacity Conflicts
    if (locationId) {
      const location = await this.prisma.client.inventoryLocation.findFirst({
        where: { id: locationId, organizationId: orgId },
      });

      if (location) {
        const overlappingBookingsCount = await this.prisma.client.serviceBooking.count({
          where: {
            organizationId: orgId,
            locationId,
            ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
            status: { in: activeBookingStatuses },
            scheduledStartTime: { lt: endTime },
            scheduledEndTime: { gt: startTime },
          },
        });

        const customFields = (location.customFields as Record<string, any>) || {};
        const maxCapacity = customFields.maxConcurrentBookings || customFields.capacity || 10;

        if (overlappingBookingsCount >= maxCapacity) {
          conflicts.push({
            type: "LOCATION_CAPACITY_EXCEEDED",
            message: `Location "${location.name}" has reached its maximum simultaneous capacity (${maxCapacity} bookings).`,
            resourceId: locationId,
            resourceName: location.name,
            details: { maxCapacity, activeBookings: overlappingBookingsCount },
          });
        }
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      canOverride: true,
      conflicts,
    };
  }

  /**
   * Throws ConflictException if hard conflicts are detected and override is not permitted.
   */
  async assertNoConflicts(params: {
    orgId: string;
    startTime: Date;
    endTime: Date;
    staffMemberIds?: string[];
    customerId?: string;
    locationId?: string;
    excludeBookingId?: string;
    allowOverride?: boolean;
  }): Promise<BookingConflictDetails> {
    const result = await this.detectConflicts(params);
    if (result.hasConflict && !params.allowOverride) {
      const descriptions = result.conflicts.map((c) => c.message).join(" ");
      throw new ConflictException(`Scheduling conflict detected: ${descriptions}`);
    }
    return result;
  }
}
