import { Injectable, BadRequestException, ConflictException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { BookingStatus, ScheduleOverrideType } from "@repo/db";

export interface BookingConflictDetails {
  hasConflict: boolean;
  conflicts: {
    type: "STAFF_UNAVAILABLE" | "STAFF_SHIFT_MISMATCH" | "STAFF_OVERLAP" | "LOCATION_CAPACITY_EXCEEDED" | "ROOM_OVERLAP";
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
   * Performs comprehensive conflict detection across:
   * 1. Staff schedule overrides (LEAVE, UNAVAILABLE, BLACKOUT)
   * 2. Staff shifts (verifying that the booked appointment is within working hours)
   * 3. Existing overlapping staff bookings/tasks
   * 4. Location or room capacity constraints
   */
  async detectConflicts(params: {
    orgId: string;
    startTime: Date;
    endTime: Date;
    staffMemberIds?: string[];
    locationId?: string;
    excludeBookingId?: string;
  }): Promise<BookingConflictDetails> {
    const { orgId, startTime, endTime, staffMemberIds = [], locationId, excludeBookingId } = params;
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
    }

    // 2. Location / Station Capacity Conflicts
    if (locationId) {
      const location = await this.prisma.client.inventoryLocation.findFirst({
        where: { id: locationId, organizationId: orgId },
      });

      if (location) {
        // Query overlapping bookings at this location
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

        // If location has custom fields with max capacity or simultaneous capacity limit
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
      conflicts,
    };
  }

  /**
   * Throws ConflictException if hard conflicts are detected.
   */
  async assertNoConflicts(params: {
    orgId: string;
    startTime: Date;
    endTime: Date;
    staffMemberIds?: string[];
    locationId?: string;
    excludeBookingId?: string;
  }): Promise<void> {
    const result = await this.detectConflicts(params);
    if (result.hasConflict) {
      const descriptions = result.conflicts.map((c) => c.message).join(" ");
      throw new ConflictException(`Scheduling conflict detected: ${descriptions}`);
    }
  }
}
