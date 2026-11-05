import { Injectable, NotFoundException, BadRequestException, ConflictException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { BookingStatus, BookingEventSource, TaskStatus } from "@repo/db";
import { BookingConflictDetectionService } from "./booking-conflict-detection.service";
import { BookingTaskGeneratorService } from "./booking-task-generator.service";

@Injectable()
export class BookingLifecycleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly conflictDetector: BookingConflictDetectionService,
    private readonly taskGenerator: BookingTaskGeneratorService,
  ) {}

  /**
   * Allowed state transitions for the full booking lifecycle.
   * PENDING -> CONFIRMED -> ASSIGNED -> IN_PROGRESS -> COMPLETED
   * Any state (except COMPLETED/CANCELLED) can transition to CANCELLED.
   */
  private readonly validTransitions: Record<BookingStatus, BookingStatus[]> = {
    REQUESTED: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.SCHEDULED, BookingStatus.CANCELLED],
    PENDING: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
    CONFIRMED: [BookingStatus.ASSIGNED, BookingStatus.SCHEDULED, BookingStatus.IN_PROGRESS, BookingStatus.CANCELLED],
    ASSIGNED: [BookingStatus.IN_PROGRESS, BookingStatus.CANCELLED, BookingStatus.SCHEDULED],
    SCHEDULED: [BookingStatus.ASSIGNED, BookingStatus.IN_PROGRESS, BookingStatus.CANCELLED, BookingStatus.NOSHOW],
    IN_PROGRESS: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
    COMPLETED: [],
    CANCELLED: [],
    NOSHOW: [],
  };

  /**
   * Transition booking state with business logic verification, conflict detection, and automated task generation.
   */
  async transitionStatus(params: {
    orgId: string;
    bookingId: string;
    targetStatus: BookingStatus;
    actorMemberId?: string;
    reason?: string;
    source?: BookingEventSource;
    staffMemberIds?: string[];
  }) {
    const { orgId, bookingId, targetStatus, actorMemberId, reason, source = BookingEventSource.ADMIN, staffMemberIds } = params;

    const booking = await this.prisma.client.serviceBooking.findFirst({
      where: { id: bookingId, organizationId: orgId },
      include: { staff: true },
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${bookingId} not found`);
    }

    // Check transition validity
    const allowed = this.validTransitions[booking.status] || [];
    if (!allowed.includes(targetStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${booking.status} to ${targetStatus}. Allowed: ${allowed.join(", ") || "none"}`,
      );
    }

    // If assigning staff or confirming booking, run conflict detection
    const assignedStaff = staffMemberIds && staffMemberIds.length > 0 ? staffMemberIds : booking.staff.map((s) => s.memberId);
    if (
      (targetStatus === BookingStatus.CONFIRMED || targetStatus === BookingStatus.ASSIGNED || targetStatus === BookingStatus.SCHEDULED) &&
      assignedStaff.length > 0 &&
      booking.scheduledEndTime
    ) {
      await this.conflictDetector.assertNoConflicts({
        orgId,
        startTime: booking.scheduledStartTime,
        endTime: booking.scheduledEndTime,
        staffMemberIds: assignedStaff,
        locationId: booking.locationId || undefined,
        excludeBookingId: booking.id,
      });
    }

    // If new staff members were specified during ASSIGNED transition, update relations
    if (staffMemberIds && staffMemberIds.length > 0) {
      await this.prisma.client.bookingStaff.deleteMany({
        where: { bookingId },
      });
      for (const mId of staffMemberIds) {
        await this.prisma.client.bookingStaff.create({
          data: {
            bookingId,
            memberId: mId,
          },
        });
      }
    }

    // Update the booking record
    const updated = await this.prisma.client.serviceBooking.update({
      where: { id: bookingId },
      data: {
        status: targetStatus,
        revision: { increment: 1 },
        ...(targetStatus === BookingStatus.IN_PROGRESS ? { actualStartTime: new Date() } : {}),
        ...(targetStatus === BookingStatus.COMPLETED ? { actualEndTime: new Date() } : {}),
      },
    });

    // Record audit event
    await this.prisma.client.bookingEvent.create({
      data: {
        organizationId: orgId,
        bookingId,
        source,
        type: `LIFECYCLE_${targetStatus}`,
        actorMemberId,
        fromStatus: booking.status,
        toStatus: targetStatus,
        metadata: reason ? { reason } : undefined,
      },
    });

    // Trigger Automated Task Generation upon confirmation or payment
    if (targetStatus === BookingStatus.CONFIRMED) {
      await this.taskGenerator.generateTasksForBooking({
        orgId,
        bookingId,
        assigneeMemberId: assignedStaff[0],
      });
    }

    return updated;
  }

  /**
   * Toggles or marks a checklist item completed and checks if all required items are done.
   */
  async updateChecklistItem(params: {
    orgId: string;
    bookingId: string;
    itemId: string;
    isCompleted: boolean;
    memberId?: string;
  }) {
    const { orgId, bookingId, itemId, isCompleted, memberId } = params;

    const item = await this.prisma.client.bookingChecklistItem.findFirst({
      where: { id: itemId, bookingId },
      include: { task: true },
    });

    if (!item) {
      throw new NotFoundException("Checklist item not found");
    }

    const updatedItem = await this.prisma.client.bookingChecklistItem.update({
      where: { id: itemId },
      data: {
        isCompleted,
        completedById: isCompleted ? memberId : null,
        completedAt: isCompleted ? new Date() : null,
      },
    });

    // Check if the parent task should be marked DONE
    if (item.taskId) {
      const remainingIncomplete = await this.prisma.client.bookingChecklistItem.count({
        where: { taskId: item.taskId, isCompleted: false },
      });

      if (remainingIncomplete === 0) {
        await this.prisma.client.bookingTask.update({
          where: { id: item.taskId },
          data: {
            status: TaskStatus.COMPLETED,
            completedAt: new Date(),
          },
        });
      } else {
        await this.prisma.client.bookingTask.update({
          where: { id: item.taskId },
          data: {
            status: TaskStatus.IN_PROGRESS,
            completedAt: null,
          },
        });
      }
    }

    // Evaluate total booking checklist progress
    const totalItems = await this.prisma.client.bookingChecklistItem.count({
      where: { bookingId },
    });
    const completedItems = await this.prisma.client.bookingChecklistItem.count({
      where: { bookingId, isCompleted: true },
    });

    return {
      item: updatedItem,
      progress: {
        total: totalItems,
        completed: completedItems,
        isAllCompleted: totalItems > 0 && totalItems === completedItems,
      },
    };
  }
}
