import { Injectable, NotFoundException, BadRequestException, ConflictException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { BookingStatus, BookingEventSource, TaskStatus, ProjectTaskStatus } from "@repo/db";
import { BookingConflictDetectionService, BookingConflictDetails } from "./booking-conflict-detection.service";
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
   * REQUESTED / PENDING -> CONFIRMED -> ASSIGNED -> IN_PROGRESS -> COMPLETED
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
   * Transition booking state with business logic verification, soft conflict warnings, override capability,
   * audit logging, and automated bidirectional task synchronization.
   */
  async transitionStatus(params: {
    orgId: string;
    bookingId: string;
    targetStatus: BookingStatus;
    actorMemberId?: string;
    reason?: string;
    source?: BookingEventSource;
    staffMemberIds?: string[];
    overrideConflict?: boolean;
    projectId?: string;
  }) {
    const {
      orgId,
      bookingId,
      targetStatus,
      actorMemberId,
      reason,
      source = BookingEventSource.ADMIN,
      staffMemberIds,
      overrideConflict = false,
      projectId,
    } = params;

    const booking = await this.prisma.client.serviceBooking.findFirst({
      where: { id: bookingId, organizationId: orgId },
      include: { staff: true, customer: true },
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
    const assignedStaff =
      staffMemberIds && staffMemberIds.length > 0 ? staffMemberIds : booking.staff.map((s) => s.memberId);

    let conflictResult: BookingConflictDetails | null = null;
    if (
      (targetStatus === BookingStatus.CONFIRMED ||
        targetStatus === BookingStatus.ASSIGNED ||
        targetStatus === BookingStatus.SCHEDULED) &&
      assignedStaff.length > 0 &&
      booking.scheduledEndTime
    ) {
      conflictResult = await this.conflictDetector.assertNoConflicts({
        orgId,
        startTime: booking.scheduledStartTime,
        endTime: booking.scheduledEndTime,
        staffMemberIds: assignedStaff,
        customerId: booking.customerId || undefined,
        locationId: booking.locationId || undefined,
        excludeBookingId: booking.id,
        allowOverride: overrideConflict,
      });
    }

    // If staff members were specified during transition, update relations
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
        metadata: {
          ...(reason ? { reason } : {}),
          ...(overrideConflict ? { overriddenConflicts: conflictResult?.conflicts || [] } : {}),
        },
      },
    });

    // Bidirectional Task Synchronization
    await this.syncTasksForBookingStatus(orgId, bookingId, targetStatus);

    // Trigger Automated Task Generation upon confirmation or assignment if no tasks exist
    if (targetStatus === BookingStatus.CONFIRMED || targetStatus === BookingStatus.ASSIGNED) {
      const existingTaskCount = await this.prisma.client.bookingTask.count({
        where: { bookingId },
      });
      if (existingTaskCount === 0) {
        await this.taskGenerator.generateTasksForBooking({
          orgId,
          bookingId,
          assigneeMemberId: assignedStaff[0],
          projectId,
        });
      }
    }

    return {
      ...updated,
      conflicts: conflictResult?.conflicts || [],
    };
  }

  /**
   * Assign or reassign staff members to a booking with conflict inspection and audit logging.
   */
  async assignStaff(params: {
    orgId: string;
    bookingId: string;
    staffMemberIds: string[];
    actorMemberId?: string;
    reason?: string;
    overrideConflict?: boolean;
  }) {
    const { orgId, bookingId, staffMemberIds, actorMemberId, reason, overrideConflict = false } = params;

    const booking = await this.prisma.client.serviceBooking.findFirst({
      where: { id: bookingId, organizationId: orgId },
      include: { staff: true },
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${bookingId} not found`);
    }

    let conflictResult: BookingConflictDetails | null = null;
    if (staffMemberIds.length > 0 && booking.scheduledEndTime) {
      conflictResult = await this.conflictDetector.assertNoConflicts({
        orgId,
        startTime: booking.scheduledStartTime,
        endTime: booking.scheduledEndTime,
        staffMemberIds,
        locationId: booking.locationId || undefined,
        excludeBookingId: booking.id,
        allowOverride: overrideConflict,
      });
    }

    // Replace assigned staff
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

    // Reassign existing BookingTasks and StaffTasks to the primary staff member if one is assigned
    if (staffMemberIds.length > 0) {
      const primaryAssignee = staffMemberIds[0];
      await this.prisma.client.bookingTask.updateMany({
        where: { bookingId },
        data: { assignedToId: primaryAssignee },
      });
      await this.prisma.client.staffTask.updateMany({
        where: { bookingId },
        data: { memberId: primaryAssignee },
      });
    }

    // Audit event for staff assignment
    await this.prisma.client.bookingEvent.create({
      data: {
        organizationId: orgId,
        bookingId,
        source: BookingEventSource.ADMIN,
        type: "STAFF_ASSIGNMENT_UPDATED",
        actorMemberId,
        metadata: {
          assignedStaffIds: staffMemberIds,
          reason,
          overriddenConflicts: conflictResult?.conflicts || [],
        },
      },
    });

    return {
      success: true,
      assignedStaffIds: staffMemberIds,
      conflicts: conflictResult?.conflicts || [],
    };
  }

  /**
   * Synchronizes project and mobile tasks when booking status transitions.
   */
  private async syncTasksForBookingStatus(orgId: string, bookingId: string, status: BookingStatus) {
    const taskStatus =
      status === BookingStatus.IN_PROGRESS
        ? TaskStatus.IN_PROGRESS
        : status === BookingStatus.COMPLETED
          ? TaskStatus.COMPLETED
          : status === BookingStatus.CANCELLED
            ? TaskStatus.CANCELLED
            : null;

    const projectTaskStatus =
      status === BookingStatus.IN_PROGRESS
        ? ProjectTaskStatus.IN_PROGRESS
        : status === BookingStatus.COMPLETED
          ? ProjectTaskStatus.DONE
          : status === BookingStatus.CANCELLED
            ? ProjectTaskStatus.CANCELED
            : null;

    if (taskStatus) {
      await this.prisma.client.bookingTask.updateMany({
        where: { bookingId, organizationId: orgId },
        data: {
          status: taskStatus,
          ...(status === BookingStatus.COMPLETED ? { completedAt: new Date() } : {}),
        },
      });
      await this.prisma.client.staffTask.updateMany({
        where: { bookingId, organizationId: orgId },
        data: { status: taskStatus },
      });
    }

    if (projectTaskStatus) {
      await this.prisma.client.task.updateMany({
        where: { bookingId, organizationId: orgId },
        data: { status: projectTaskStatus },
      });
    }
  }

  /**
   * Toggles or marks a checklist item completed.
   * If all items on a task are completed, marks the task completed.
   * If all checklist items across the entire booking are completed, auto-advances booking to COMPLETED.
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

    // Check if the parent task should be marked completed
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

    const isAllCompleted = totalItems > 0 && totalItems === completedItems;

    // Auto-advance booking to COMPLETED if all checklist items are done
    if (isAllCompleted) {
      const booking = await this.prisma.client.serviceBooking.findFirst({
        where: { id: bookingId, organizationId: orgId },
        select: { status: true },
      });

      if (booking && booking.status !== BookingStatus.COMPLETED && booking.status !== BookingStatus.CANCELLED) {
        await this.prisma.client.serviceBooking.update({
          where: { id: bookingId },
          data: {
            status: BookingStatus.COMPLETED,
            actualEndTime: new Date(),
            revision: { increment: 1 },
          },
        });

        await this.prisma.client.bookingEvent.create({
          data: {
            organizationId: orgId,
            bookingId,
            source: BookingEventSource.SYSTEM,
            type: "AUTO_COMPLETED_CHECKLIST_PROGRESS",
            actorMemberId: memberId,
            fromStatus: booking.status,
            toStatus: BookingStatus.COMPLETED,
            metadata: { message: "All service checklist items marked completed" },
          },
        });
      }
    }

    return {
      item: updatedItem,
      progress: {
        total: totalItems,
        completed: completedItems,
        isAllCompleted,
      },
    };
  }
}
