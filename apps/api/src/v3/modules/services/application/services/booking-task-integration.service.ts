import { Injectable, NotFoundException, BadRequestException, forwardRef, Inject } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { BookingStatus, ProjectTaskPriority, ProjectTaskStatus, TaskPriority, TaskStatus } from "@repo/db";
import { BookingService } from "./booking.service";
import { GenerateBookingTasksDto } from "../dto/booking-conflict.dto";

@Injectable()
export class BookingTaskIntegrationService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => BookingService))
    private readonly bookingService: BookingService,
  ) {}

  /**
   * Auto-provisions or retrieves default "Service Operations" Project for the organization.
   */
  async getOrCreateServiceOperationsProject(orgId: string, memberId?: string) {
    let project = await this.prisma.client.project.findFirst({
      where: { organizationId: orgId, key: "SRV" },
    });

    if (!project) {
      project = await this.prisma.client.project.create({
        data: {
          organizationId: orgId,
          name: "Service Operations",
          key: "SRV",
          description: "Operational delivery tasks generated from customer service bookings.",
          ownerId: memberId,
        },
      });
    }

    return project;
  }

  /**
   * Generates both Task (in Project) and StaffTask (on Shift/Staff) from an existing ServiceBooking.
   * Clones checklist items from Service.taskChecklistTemplate.
   */
  async generateTasksForBooking(
    orgId: string,
    bookingId: string,
    dto: GenerateBookingTasksDto = {},
    actorMemberId?: string,
  ) {
    const booking = await this.prisma.client.serviceBooking.findFirst({
      where: { id: bookingId, organizationId: orgId },
      include: {
        service: true,
        customer: true,
        staff: { select: { memberId: true } },
      },
    });

    if (!booking) throw new NotFoundException("Booking not found");

    const targetProject = dto.projectId
      ? await this.prisma.client.project.findFirst({
          where: { id: dto.projectId, organizationId: orgId },
        })
      : await this.getOrCreateServiceOperationsProject(orgId, actorMemberId);

    if (!targetProject) {
      throw new BadRequestException("Target project not found");
    }

    // Extract checklist from service template or custom template
    let checklistItems: Array<{ id?: string; title: string; completed: boolean; required?: boolean }> = [];
    if (dto.includeChecklist !== false && booking.service.taskChecklistTemplate) {
      const template = booking.service.taskChecklistTemplate as any;
      if (Array.isArray(template)) {
        checklistItems = template.map((item: any, idx: number) => ({
          id: `item_${idx + 1}`,
          title: typeof item === "string" ? item : (item.title || `Task item ${idx + 1}`),
          completed: false,
          required: typeof item === "object" ? !!item.required : false,
        }));
      }
    }

    const assignedStaffIds = booking.staff.map((s) => s.memberId);
    const primaryStaffId = assignedStaffIds[0] || actorMemberId;

    const taskTitle = dto.titleOverride
      ? dto.titleOverride
      : `Deliver ${booking.serviceName} - ${booking.customer?.name || "Guest"}`;

    const taskDesc = `Automated booking task for Booking #${booking.id}.\nCustomer: ${booking.customer?.name || "N/A"}\nStart: ${booking.scheduledStartTime.toISOString()}`;

    // 1. Create or link Task in targetProject
    const taskCount = await this.prisma.client.task.count({
      where: { projectId: targetProject.id },
    });
    const taskNumber = taskCount + 1;
    const taskKey = `${targetProject.key}-${taskNumber}`;

    const durationMinutes = (booking.scheduledEndTime
      ? booking.scheduledEndTime.getTime() - booking.scheduledStartTime.getTime()
      : (booking.service.estimatedDuration || 60) * 60000) / 60000;
    const estimatedHours = durationMinutes / 60;

    const taskStatus =
      booking.status === BookingStatus.IN_PROGRESS
        ? ProjectTaskStatus.IN_PROGRESS
        : booking.status === BookingStatus.COMPLETED
          ? ProjectTaskStatus.DONE
          : booking.status === BookingStatus.CANCELLED
            ? ProjectTaskStatus.CANCELED
            : ProjectTaskStatus.TODO;

    const createdTask = await this.prisma.client.task.create({
      data: {
        organizationId: orgId,
        projectId: targetProject.id,
        taskNumber,
        taskKey,
        title: taskTitle,
        description: taskDesc,
        status: taskStatus,
        priority: ProjectTaskPriority.MEDIUM,
        startDate: booking.scheduledStartTime,
        dueDate: booking.scheduledEndTime || new Date(booking.scheduledStartTime.getTime() + durationMinutes * 60000),
        estimatedHours,
        bookingId: booking.id,
        createdById: actorMemberId,
        assignees: assignedStaffIds.length
          ? {
              create: assignedStaffIds.map((mId, idx) => ({
                memberId: mId,
                isPrimary: idx === 0,
                allocatedHours: estimatedHours / assignedStaffIds.length,
              })),
            }
          : undefined,
      },
    });

    // 2. Create StaffTask for mobile/shift roster
    const staffTaskStatus =
      booking.status === BookingStatus.IN_PROGRESS
        ? TaskStatus.IN_PROGRESS
        : booking.status === BookingStatus.COMPLETED
          ? TaskStatus.COMPLETED
          : booking.status === BookingStatus.CANCELLED
            ? TaskStatus.CANCELLED
            : TaskStatus.TODO;

    const createdStaffTask = await this.prisma.client.staffTask.create({
      data: {
        organizationId: orgId,
        title: taskTitle,
        description: taskDesc,
        priority: TaskPriority.MEDIUM,
        status: staffTaskStatus,
        dueDate: booking.scheduledEndTime || booking.scheduledStartTime,
        memberId: primaryStaffId,
        locationId: booking.locationId,
        bookingId: booking.id,
        checklist: checklistItems.length ? checklistItems : undefined,
        createdById: actorMemberId,
      },
    });

    return {
      success: true,
      bookingId: booking.id,
      task: createdTask,
      staffTask: createdStaffTask,
    };
  }

  /**
   * Syncs task statuses when a booking transitions state.
   */
  async onBookingStatusChanged(orgId: string, bookingId: string, newStatus: BookingStatus) {
    const projectTaskStatus =
      newStatus === BookingStatus.IN_PROGRESS
        ? ProjectTaskStatus.IN_PROGRESS
        : newStatus === BookingStatus.COMPLETED
          ? ProjectTaskStatus.DONE
          : newStatus === BookingStatus.CANCELLED
            ? ProjectTaskStatus.CANCELED
            : undefined;

    const staffTaskStatus =
      newStatus === BookingStatus.IN_PROGRESS
        ? TaskStatus.IN_PROGRESS
        : newStatus === BookingStatus.COMPLETED
          ? TaskStatus.COMPLETED
          : newStatus === BookingStatus.CANCELLED
            ? TaskStatus.CANCELLED
            : undefined;

    const updates: Promise<any>[] = [];

    if (projectTaskStatus) {
      updates.push(
        this.prisma.client.task.updateMany({
          where: { organizationId: orgId, bookingId },
          data: { status: projectTaskStatus },
        }),
      );
    }

    if (staffTaskStatus) {
      updates.push(
        this.prisma.client.staffTask.updateMany({
          where: { organizationId: orgId, bookingId },
          data: { status: staffTaskStatus },
        }),
      );
    }

    await Promise.all(updates);
  }

  /**
   * When a Task or StaffTask is marked DONE/COMPLETED, complete the corresponding ServiceBooking
   * and deduct materials if booking is still open.
   */
  async onTaskCompleted(orgId: string, taskId: string, memberId: string, taskType: "project" | "staff" = "project") {
    let bookingId: string | null = null;

    if (taskType === "project") {
      const task = await this.prisma.client.task.findFirst({
        where: { id: taskId, organizationId: orgId },
        select: { bookingId: true },
      });
      bookingId = task?.bookingId || null;
    } else {
      const staffTask = await this.prisma.client.staffTask.findFirst({
        where: { id: taskId, organizationId: orgId },
        select: { bookingId: true },
      });
      bookingId = staffTask?.bookingId || null;
    }

    if (!bookingId) return { updated: false, reason: "No linked booking" };

    const booking = await this.prisma.client.serviceBooking.findFirst({
      where: { id: bookingId, organizationId: orgId },
      select: { id: true, status: true },
    });

    if (booking && booking.status !== BookingStatus.COMPLETED && booking.status !== BookingStatus.CANCELLED) {
      await this.bookingService.completeBooking(orgId, booking.id, memberId, {
        actualEndTime: new Date().toISOString(),
      });
      return { updated: true, bookingId: booking.id, status: BookingStatus.COMPLETED };
    }

    return { updated: false, reason: "Booking already finalized" };
  }
}
