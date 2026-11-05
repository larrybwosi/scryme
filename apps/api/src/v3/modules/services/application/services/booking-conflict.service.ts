import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { BookingStatus } from "@repo/db";
import { StaffSchedulingService } from "./staff-scheduling.service";
import { BookingConflictWarning, CheckBookingConflictsDto } from "../dto/booking-conflict.dto";

const ACTIVE_BOOKING_STATUSES = [
  BookingStatus.REQUESTED,
  BookingStatus.SCHEDULED,
  BookingStatus.IN_PROGRESS,
];

@Injectable()
export class BookingConflictService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly staffSchedulingService: StaffSchedulingService,
  ) {}

  /**
   * Multi-dimensional conflict detection for service bookings and task assignments.
   * Checks:
   * 1. Staff Shift Overlap & Active Service Bookings
   * 2. Staff Weekly Capacity Overload (>100% / >40h or scheduled weekly hours)
   * 3. Service Resource Overlap
   * 4. Customer Double-Booking
   * 5. Location Operating Hours Violation
   */
  async checkConflicts(
    orgId: string,
    dto: CheckBookingConflictsDto,
  ): Promise<{ hasConflicts: boolean; warnings: BookingConflictWarning[]; canOverride: boolean }> {
    const warnings: BookingConflictWarning[] = [];

    // Pre-fetch service details
    const service = await this.prisma.client.service.findFirst({
      where: { id: dto.serviceId, organizationId: orgId },
      include: {
        staff: { select: { memberId: true } },
        resources: { select: { resourceId: true } },
      },
    });

    if (!service) {
      throw new NotFoundException("Service not found");
    }

    const startTime = new Date(dto.scheduledStartTime);
    const duration = service.estimatedDuration || 60;
    const endTime = dto.scheduledEndTime
      ? new Date(dto.scheduledEndTime)
      : new Date(startTime.getTime() + duration * 60000);

    const totalStartTime = new Date(startTime.getTime() - (service.bufferTimeBefore || 0) * 60000);
    const totalEndTime = new Date(endTime.getTime() + (service.bufferTimeAfter || 0) * 60000);

    const staffIds = (dto.staffIds && dto.staffIds.length > 0)
      ? dto.staffIds
      : service.staff.map((s) => s.memberId);

    const resourceIds = (dto.resourceIds && dto.resourceIds.length > 0)
      ? dto.resourceIds
      : service.resources.map((r) => r.resourceId);

    // 1 & 2. Staff validations (shift, overlap, capacity)
    if (staffIds.length > 0) {
      const startOfWeek = new Date(startTime);
      startOfWeek.setUTCDate(startTime.getUTCDate() - startTime.getUTCDay());
      startOfWeek.setUTCHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setUTCDate(endOfWeek.getUTCDate() + 7);

      await Promise.all(
        staffIds.map(async (memberId) => {
          // Check shift availability
          const availability = await this.staffSchedulingService.checkStaffAvailability(
            memberId,
            startTime,
            endTime,
            {
              organizationId: orgId,
              locationId: dto.locationId,
              excludeBookingId: dto.excludeBookingId,
            },
          );

          if (!availability.available) {
            if (availability.reasons.includes("BOOKING_CONFLICT")) {
              warnings.push({
                code: "STAFF_BOOKING_OVERLAP",
                message: `Staff member is already committed to an overlapping booking during this time.`,
                memberId,
                details: { reasons: availability.reasons },
              });
            } else {
              warnings.push({
                code: "STAFF_SHIFT_CONFLICT",
                message: `Staff member has a shift conflict or is outside working hours (${availability.reasons.join(", ")}).`,
                memberId,
                details: { reasons: availability.reasons },
              });
            }
          }

          // Check weekly capacity
          const [weeklyBookings, weeklyShifts] = await Promise.all([
            this.prisma.client.serviceBooking.findMany({
              where: {
                organizationId: orgId,
                staff: { some: { memberId } },
                status: { in: ACTIVE_BOOKING_STATUSES },
                scheduledStartTime: { gte: startOfWeek, lt: endOfWeek },
                ...(dto.excludeBookingId ? { id: { not: dto.excludeBookingId } } : {}),
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
          if (scheduledWeeklyHours <= 0) scheduledWeeklyHours = 40; // Default capacity 40h/week

          const bookedWeeklyHours = weeklyBookings.reduce((acc, b) => {
            const bStart = b.scheduledStartTime.getTime();
            const bEnd = b.scheduledEndTime ? b.scheduledEndTime.getTime() : bStart + 60 * 60000;
            return acc + Math.max(0, (bEnd - bStart) / (1000 * 60 * 60));
          }, 0);

          const newBookingHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
          const totalProjectedHours = bookedWeeklyHours + newBookingHours;

          if (totalProjectedHours > scheduledWeeklyHours) {
            warnings.push({
              code: "STAFF_CAPACITY_OVERLOAD",
              message: `Staff member is projected at ${Math.round((totalProjectedHours / scheduledWeeklyHours) * 100)}% capacity (${totalProjectedHours.toFixed(1)}h / ${scheduledWeeklyHours}h weekly limit).`,
              memberId,
              details: {
                projectedHours: totalProjectedHours,
                capacityHours: scheduledWeeklyHours,
                utilizationPercent: Math.round((totalProjectedHours / scheduledWeeklyHours) * 100),
              },
            });
          }
        }),
      );
    }

    // 3. Resource Overlap Check
    if (resourceIds.length > 0) {
      const conflictingResourceBooking = await this.prisma.client.serviceBooking.findFirst({
        where: {
          organizationId: orgId,
          ...(dto.excludeBookingId ? { id: { not: dto.excludeBookingId } } : {}),
          status: { in: ACTIVE_BOOKING_STATUSES },
          scheduledStartTime: { lt: totalEndTime },
          scheduledEndTime: { gt: totalStartTime },
          resources: { some: { resourceId: { in: resourceIds } } },
        },
        select: {
          resources: {
            where: { resourceId: { in: resourceIds } },
            select: { resourceId: true },
          },
        },
      });

      if (conflictingResourceBooking && conflictingResourceBooking.resources.length > 0) {
        for (const res of conflictingResourceBooking.resources) {
          warnings.push({
            code: "RESOURCE_OVERLAP",
            message: `Resource is already booked during this time interval.`,
            resourceId: res.resourceId,
          });
        }
      }
    }

    // 4. Customer Double-Booking Check
    if (dto.customerId) {
      const customerOverlap = await this.prisma.client.serviceBooking.findFirst({
        where: {
          organizationId: orgId,
          customerId: dto.customerId,
          ...(dto.excludeBookingId ? { id: { not: dto.excludeBookingId } } : {}),
          status: { in: ACTIVE_BOOKING_STATUSES },
          scheduledStartTime: { lt: endTime },
          scheduledEndTime: { gt: startTime },
        },
        select: { id: true, scheduledStartTime: true, scheduledEndTime: true, serviceName: true },
      });

      if (customerOverlap) {
        warnings.push({
          code: "CUSTOMER_DOUBLE_BOOKING",
          message: `Customer already has an active booking for "${customerOverlap.serviceName}" at this time.`,
          customerId: dto.customerId,
          details: {
            existingBookingId: customerOverlap.id,
            startTime: customerOverlap.scheduledStartTime,
            endTime: customerOverlap.scheduledEndTime,
          },
        });
      }
    }

    // 5. Location Operating Hours Check
    if (dto.locationId) {
      const location = await this.prisma.client.inventoryLocation.findFirst({
        where: { id: dto.locationId, organizationId: orgId },
        select: { id: true, name: true, settings: true },
      });

      if (location && location.settings && typeof location.settings === "object") {
        const settings = location.settings as Record<string, any>;
        const operatingHoursStr = settings.operatingHours;
        if (operatingHoursStr && typeof operatingHoursStr === "string" && operatingHoursStr.includes("-")) {
          const [openStr, closeStr] = operatingHoursStr.split("-").map((s: string) => s.trim());
          const [openH, openM] = openStr.split(":").map(Number);
          const [closeH, closeM] = closeStr.split(":").map(Number);

          const bookingStartMinutes = startTime.getUTCHours() * 60 + startTime.getUTCMinutes();
          const bookingEndMinutes = endTime.getUTCHours() * 60 + endTime.getUTCMinutes();
          const locationOpenMinutes = openH * 60 + (openM || 0);
          const locationCloseMinutes = closeH * 60 + (closeM || 0);

          if (bookingStartMinutes < locationOpenMinutes || bookingEndMinutes > locationCloseMinutes) {
            warnings.push({
              code: "LOCATION_HOURS_VIOLATION",
              message: `Scheduled booking slot (${startTime.toISOString().slice(11, 16)} - ${endTime.toISOString().slice(11, 16)}) falls outside location operating hours (${operatingHoursStr}).`,
              details: {
                locationId: location.id,
                locationName: location.name,
                operatingHours: operatingHoursStr,
              },
            });
          }
        }
      }
    }

    return {
      hasConflicts: warnings.length > 0,
      warnings,
      canOverride: true,
    };
  }
}
