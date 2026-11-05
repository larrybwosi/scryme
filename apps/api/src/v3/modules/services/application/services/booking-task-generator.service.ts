import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { ChecklistStage, TaskStatus, TaskPriority } from "@repo/db";

@Injectable()
export class BookingTaskGeneratorService {
  private readonly logger = new Logger(BookingTaskGeneratorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates operational tasks and checklist items for a confirmed booking based on service templates.
   */
  async generateTasksForBooking(params: {
    orgId: string;
    bookingId: string;
    assigneeMemberId?: string;
  }): Promise<{ createdTasksCount: number; createdItemsCount: number }> {
    const { orgId, bookingId, assigneeMemberId } = params;

    const booking = await this.prisma.client.serviceBooking.findFirst({
      where: { id: bookingId, organizationId: orgId },
      include: {
        service: {
          include: {
            checklistTemplates: {
              where: { isActive: true },
              include: { items: { orderBy: { order: "asc" } } },
            },
          },
        },
        staff: true,
      },
    });

    if (!booking) {
      this.logger.warn(`Cannot generate tasks: booking ${bookingId} not found in org ${orgId}`);
      return { createdTasksCount: 0, createdItemsCount: 0 };
    }

    // Determine default assignee if not passed
    const defaultAssigneeId = assigneeMemberId || booking.staff[0]?.memberId;

    let createdTasksCount = 0;
    let createdItemsCount = 0;

    const templates = booking.service.checklistTemplates;

    if (templates.length > 0) {
      for (const template of templates) {
        // Create a task for this checklist template
        const task = await this.prisma.client.bookingTask.create({
          data: {
            organizationId: orgId,
            bookingId,
            title: `${booking.serviceName} - ${template.title}`,
            description: template.description || `Automated service checklist task for booking ${booking.id}`,
            status: TaskStatus.TODO,
            priority: TaskPriority.MEDIUM,
            assignedToId: defaultAssigneeId,
            dueDate: booking.scheduledStartTime,
          },
        });
        createdTasksCount++;

        // Create checklist items for this task
        for (const itemTemplate of template.items) {
          await this.prisma.client.bookingChecklistItem.create({
            data: {
              bookingId,
              taskId: task.id,
              title: itemTemplate.title,
              description: itemTemplate.description,
              stage: itemTemplate.stage,
              isRequired: itemTemplate.isRequired,
              isCompleted: false,
              order: itemTemplate.order,
            },
          });
          createdItemsCount++;
        }
      }
    } else {
      // Default fallback: create standard 3-stage tasks (Pre-Service, In-Service, Post-Service)
      const stages: { stage: ChecklistStage; title: string; defaultChecklists: string[] }[] = [
        {
          stage: ChecklistStage.PRE_SERVICE,
          title: `Pre-Service Setup: ${booking.serviceName}`,
          defaultChecklists: ["Verify customer appointment details", "Prepare workstation and sanitized tools", "Confirm equipment readiness"],
        },
        {
          stage: ChecklistStage.IN_SERVICE,
          title: `Service Execution: ${booking.serviceName}`,
          defaultChecklists: ["Perform service according to customer preferences", "Record any consumables or materials used"],
        },
        {
          stage: ChecklistStage.POST_SERVICE,
          title: `Post-Service & Handover: ${booking.serviceName}`,
          defaultChecklists: ["Workstation cleanup and sanitation", "Customer satisfaction check & handover", "Update booking completion"],
        },
      ];

      for (const stageDef of stages) {
        const task = await this.prisma.client.bookingTask.create({
          data: {
            organizationId: orgId,
            bookingId,
            title: stageDef.title,
            stage: stageDef.stage,
            status: TaskStatus.TODO,
            priority: TaskPriority.MEDIUM,
            assignedToId: defaultAssigneeId,
            dueDate: booking.scheduledStartTime,
          },
        });
        createdTasksCount++;

        let order = 0;
        for (const checkItem of stageDef.defaultChecklists) {
          await this.prisma.client.bookingChecklistItem.create({
            data: {
              bookingId,
              taskId: task.id,
              title: checkItem,
              stage: stageDef.stage,
              isRequired: true,
              isCompleted: false,
              order: order++,
            },
          });
          createdItemsCount++;
        }
      }
    }

    return { createdTasksCount, createdItemsCount };
  }
}
