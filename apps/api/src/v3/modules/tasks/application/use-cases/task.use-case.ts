import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { FirebaseMessagingService } from '@/common/firebase/firebase-messaging.service';
import { ApiRealtimeService } from '@/common/services/realtime.service';
import {
  AddTaskCommentDto,
  AddTaskDependencyDto,
  CreateTaskDto,
  CreateTaskLabelDto,
  CreateTaskTimeEntryDto,
  ManageTaskAssigneesDto,
  TaskFilterDto,
  UpdateTaskDto,
} from '../../dtos/task.dto';

@Injectable()
export class TaskUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly firebaseMessagingService: FirebaseMessagingService,
    private readonly realtimeService?: ApiRealtimeService,
  ) {}

  async createTask(organizationId: string, dto: CreateTaskDto, currentMemberId?: string) {
    const project = await this.prisma.client.project.findFirst({
      where: { id: dto.projectId, organizationId },
    });
    if (!project) {
      throw new BadRequestException('Project not found or does not belong to this organization');
    }

    if (dto.milestoneId) {
      const milestone = await this.prisma.client.projectMilestone.findFirst({
        where: { id: dto.milestoneId, organizationId, projectId: dto.projectId },
      });
      if (!milestone) {
        throw new BadRequestException("Milestone not found within this project");
      }
    }

    if (dto.sprintId) {
      const sprint = await this.prisma.client.projectSprint.findFirst({
        where: { id: dto.sprintId, organizationId, projectId: dto.projectId },
      });
      if (!sprint) {
        throw new BadRequestException("Sprint not found within this project");
      }
    }

    if (dto.bookingId) {
      const booking = await this.prisma.client.serviceBooking.findFirst({
        where: { id: dto.bookingId, organizationId },
      });
      if (!booking) {
        throw new BadRequestException("Service booking not found within this organization");
      }
    }

    if (dto.batchId) {
      const batch = await this.prisma.client.batch.findFirst({
        where: { id: dto.batchId, organizationId },
      });
      if (!batch) {
        throw new BadRequestException("Production batch not found within this organization");
      }
    }

    if (dto.parentTaskId) {
      const parentTask = await this.prisma.client.task.findFirst({
        where: { id: dto.parentTaskId, organizationId, projectId: dto.projectId },
      });
      if (!parentTask) {
        throw new BadRequestException('Parent task not found within this project');
      }
    }

    let assigneesToCreate: { memberId: string; isPrimary: boolean; allocatedHours?: number }[] = [];
    if (dto.assignees && dto.assignees.length > 0) {
      assigneesToCreate = dto.assignees.map((a, idx) => ({
        memberId: a.memberId,
        isPrimary: a.isPrimary ?? (idx === 0),
        allocatedHours: a.allocatedHours,
      }));
    } else if (dto.assigneeIds && dto.assigneeIds.length > 0) {
      assigneesToCreate = dto.assigneeIds.map((mId, idx) => ({
        memberId: mId,
        isPrimary: idx === 0,
        allocatedHours: undefined,
      }));
    }

    const uniqueAssigneeIds = Array.from(new Set(assigneesToCreate.map((a) => a.memberId)));

    if (uniqueAssigneeIds.length > 0) {
      const validMembers = await this.prisma.client.member.findMany({
        where: { id: { in: uniqueAssigneeIds }, organizationId },
        select: { id: true },
      });
      if (validMembers.length !== uniqueAssigneeIds.length) {
        throw new BadRequestException('One or more assignees do not belong to this organization');
      }
    }

    if (dto.labelIds && dto.labelIds.length > 0) {
      const validLabels = await this.prisma.client.taskLabel.findMany({
        where: { id: { in: dto.labelIds }, organizationId },
        select: { id: true },
      });
      if (validLabels.length !== dto.labelIds.length) {
        throw new BadRequestException('One or more task labels do not belong to this organization');
      }
    }

    const taskCount = await this.prisma.client.task.count({
      where: { projectId: dto.projectId },
    });
    const taskNumber = taskCount + 1;
    const taskKey = `${project.key}-${taskNumber}`;

    const task = await this.prisma.client.task.create({
      data: {
        organizationId,
        projectId: dto.projectId,
        taskNumber,
        taskKey,
        title: dto.title,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        startDate: dto.startDate,
        dueDate: dto.dueDate,
        estimatedHours: dto.estimatedHours,
        parentTaskId: dto.parentTaskId,
        milestoneId: dto.milestoneId,
        sprintId: dto.sprintId,
        bookingId: dto.bookingId,
        createdById: currentMemberId,
        assignees: assigneesToCreate.length > 0
          ? {
              create: assigneesToCreate.map((item) => ({
                memberId: item.memberId,
                isPrimary: !!item.isPrimary,
                allocatedHours: item.allocatedHours !== undefined ? item.allocatedHours : null,
              })),
            }
          : undefined,
        labels: dto.labelIds?.length
          ? {
              create: dto.labelIds.map((labelId) => ({ labelId })),
            }
          : undefined,
        activityLogs: {
          create: {
            actorId: currentMemberId,
            action: 'TASK_CREATED',
            details: { title: dto.title, taskKey },
          },
        },
      },
      include: {
        project: { select: { id: true, name: true, key: true } },
        createdBy: { select: { id: true, user: { select: { name: true, email: true } } } },
        assignees: {
          include: { member: { select: { id: true, user: { select: { name: true, email: true } } } } },
        },
        labels: { include: { label: true } },
        milestone: { select: { id: true, title: true, status: true, dueDate: true } },
        sprint: { select: { id: true, name: true, status: true, startDate: true, endDate: true } },
        booking: { select: { id: true, serviceName: true, status: true, scheduledStartTime: true, scheduledEndTime: true, customer: { select: { id: true, name: true, phone: true, email: true } } } },
        batches: { select: { id: true, batchNumber: true, runType: true, orderReference: true, status: true } },
        subtasks: { select: { id: true, taskKey: true, title: true, status: true, priority: true } },
        _count: { select: { comments: true, subtasks: true } },
      },
    });

    // If a production batch is linked, associate it with this task
    if (dto.batchId) {
      await this.prisma.client.batch.updateMany({
        where: { id: dto.batchId, organizationId },
        data: { taskId: task.id },
      });
    }

    // Send FCM push notification to assignees
    if (uniqueAssigneeIds.length > 0) {
      this.firebaseMessagingService
        .sendToMembers(uniqueAssigneeIds, {
          title: `New Task Assigned: [${task.taskKey}]`,
          body: `${task.title} in project ${project.name}`,
          data: {
            eventType: 'TASK_ASSIGNED',
            taskId: task.id,
            taskKey: task.taskKey,
            organizationId,
          },
        })
        .catch(() => {});
    }

    return task;
  }

  async getTask(organizationId: string, taskId: string) {
    const task = await this.prisma.client.task.findFirst({
      where: { id: taskId, organizationId },
      include: {
        project: { select: { id: true, name: true, key: true } },
        createdBy: { select: { id: true, user: { select: { name: true, email: true } } } },
        parentTask: { select: { id: true, taskKey: true, title: true } },
        milestone: { select: { id: true, title: true, status: true, dueDate: true } },
        subtasks: {
          select: {
            id: true,
            taskKey: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
          },
        },
        assignees: {
          include: { member: { select: { id: true, user: { select: { name: true, email: true } } } } },
        },
        labels: { include: { label: true } },
        dependencies: {
          include: {
            dependsOnTask: { select: { id: true, taskKey: true, title: true, status: true } },
          },
        },
        dependents: {
          include: {
            task: { select: { id: true, taskKey: true, title: true, status: true } },
          },
        },
        timeEntries: {
          orderBy: { date: "desc" },
          include: { member: { select: { id: true, user: { select: { name: true, email: true } } } } },
        },
        comments: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: { select: { id: true, user: { select: { name: true, email: true } } } },
          },
        },
        activityLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            actor: { select: { id: true, user: { select: { name: true, email: true } } } },
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async listTasks(organizationId: string, filter: TaskFilterDto) {
    const { projectId, status, priority, assigneeId, milestoneId, sprintId, bookingId, batchId, parentTaskId, search, page = 1, limit = 20 } = filter;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };

    if (projectId) {
      where.projectId = projectId;
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (assigneeId) {
      where.assignees = {
        some: { memberId: assigneeId },
      };
    }

    if (milestoneId) {
      where.milestoneId = milestoneId;
    }

    if (sprintId) {
      where.sprintId = sprintId;
    }

    if (bookingId) {
      where.bookingId = bookingId;
    }

    if (batchId) {
      where.batches = {
        some: { id: batchId },
      };
    }

    if (parentTaskId) {
      where.parentTaskId = parentTaskId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { taskKey: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.client.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          project: { select: { id: true, name: true, key: true } },
          assignees: {
            include: { member: { select: { id: true, user: { select: { name: true, email: true } } } } },
          },
          labels: { include: { label: true } },
          _count: { select: { comments: true, subtasks: true } },
        },
      }),
      this.prisma.client.task.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateTask(organizationId: string, taskId: string, dto: UpdateTaskDto, currentMemberId?: string) {
    const existing = await this.prisma.client.task.findFirst({
      where: { id: taskId, organizationId },
      include: { assignees: true },
    });

    if (!existing) {
      throw new NotFoundException('Task not found');
    }

    if (dto.parentTaskId) {
      if (dto.parentTaskId === taskId) {
        throw new BadRequestException('A task cannot be its own parent');
      }
      const parentTask = await this.prisma.client.task.findFirst({
        where: { id: dto.parentTaskId, organizationId, projectId: existing.projectId },
      });
      if (!parentTask) {
        throw new BadRequestException('Parent task not found within this project');
      }
    }

    await this.prisma.client.task.updateMany({
      where: { id: taskId, organizationId },
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        startDate: dto.startDate,
        dueDate: dto.dueDate,
        estimatedHours: dto.estimatedHours,
        actualHours: dto.actualHours,
        parentTaskId: dto.parentTaskId,
      },
    });

    // Log update activity
    await this.prisma.client.taskActivityLog.create({
      data: {
        taskId,
        actorId: currentMemberId,
        action: 'TASK_UPDATED',
        details: JSON.parse(JSON.stringify({ changes: dto })),
      },
    });

    // Notify assignees of task update
    const assigneeMemberIds = existing.assignees.map((a) => a.memberId);
    if (assigneeMemberIds.length > 0) {
      this.firebaseMessagingService
        .sendToMembers(assigneeMemberIds, {
          title: `Task Updated: [${existing.taskKey}]`,
          body: `${existing.title} status/details updated`,
          data: {
            eventType: 'TASK_UPDATED',
            taskId: existing.id,
            taskKey: existing.taskKey,
            organizationId,
          },
        })
        .catch(() => {});
    }

    return this.getTask(organizationId, taskId);
  }

  async deleteTask(organizationId: string, taskId: string) {
    const existing = await this.prisma.client.task.findFirst({
      where: { id: taskId, organizationId },
    });

    if (!existing) {
      throw new NotFoundException('Task not found');
    }

    await this.prisma.client.task.deleteMany({
      where: { id: taskId, organizationId },
    });

    return { success: true, id: taskId };
  }

  async manageAssignees(organizationId: string, taskId: string, dto: ManageTaskAssigneesDto, currentMemberId?: string) {
    const task = await this.prisma.client.task.findFirst({
      where: { id: taskId, organizationId },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    let assigneesToSave: { memberId: string; isPrimary: boolean; allocatedHours?: number }[] = [];
    if (dto.assignees && dto.assignees.length > 0) {
      assigneesToSave = dto.assignees.map((a, idx) => ({
        memberId: a.memberId,
        isPrimary: a.isPrimary ?? (idx === 0),
        allocatedHours: a.allocatedHours,
      }));
    } else if (dto.memberIds && dto.memberIds.length > 0) {
      assigneesToSave = dto.memberIds.map((mId, idx) => ({
        memberId: mId,
        isPrimary: idx === 0,
        allocatedHours: undefined,
      }));
    }

    const uniqueMemberIds = Array.from(new Set(assigneesToSave.map((a) => a.memberId)));

    if (uniqueMemberIds.length > 0) {
      const validMembers = await this.prisma.client.member.findMany({
        where: { id: { in: uniqueMemberIds }, organizationId },
        select: { id: true },
      });
      if (validMembers.length !== uniqueMemberIds.length) {
        throw new BadRequestException('One or more assignees do not belong to this organization');
      }
    }

    await this.prisma.client.taskAssignee.deleteMany({
      where: { taskId },
    });

    if (assigneesToSave.length > 0) {
      await this.prisma.client.taskAssignee.createMany({
        data: assigneesToSave.map((item) => ({
          taskId,
          memberId: item.memberId,
          isPrimary: !!item.isPrimary,
          allocatedHours: item.allocatedHours !== undefined ? item.allocatedHours : null,
        })),
      });

      this.firebaseMessagingService
        .sendToMembers(uniqueMemberIds, {
          title: `Task Assignment: [${task.taskKey}]`,
          body: `You were assigned to ${task.title}`,
          data: {
            eventType: 'TASK_ASSIGNED',
            taskId: task.id,
            taskKey: task.taskKey,
            organizationId,
          },
        })
        .catch(() => {});

      if (this.realtimeService) {
        this.realtimeService
          .publish(`tasks:${organizationId}`, 'task:assigned', {
            taskId: task.id,
            taskKey: task.taskKey,
            title: task.title,
            memberIds: uniqueMemberIds,
          })
          .catch(() => {});
        this.realtimeService
          .publish(`tasks:${organizationId}`, 'task:updated', { id: task.id })
          .catch(() => {});
      }
    }

    await this.prisma.client.taskActivityLog.create({
      data: {
        taskId,
        actorId: currentMemberId,
        action: 'ASSIGNEES_UPDATED',
        details: { assignees: assigneesToSave },
      },
    });

    return this.getTask(organizationId, taskId);
  }

  async addDependency(organizationId: string, taskId: string, dto: AddTaskDependencyDto) {
    const task = await this.prisma.client.task.findFirst({
      where: { id: taskId, organizationId },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (taskId === dto.dependsOnTaskId) {
      throw new BadRequestException('A task cannot depend on itself');
    }

    const dependsOnTask = await this.prisma.client.task.findFirst({
      where: { id: dto.dependsOnTaskId, organizationId },
    });
    if (!dependsOnTask) {
      throw new BadRequestException('Target dependency task does not belong to this organization');
    }

    const dependency = await this.prisma.client.taskDependency.upsert({
      where: {
        taskId_dependsOnTaskId: {
          taskId,
          dependsOnTaskId: dto.dependsOnTaskId,
        },
      },
      create: {
        taskId,
        dependsOnTaskId: dto.dependsOnTaskId,
        type: dto.type || 'BLOCKS',
      },
      update: {
        type: dto.type || 'BLOCKS',
      },
    });

    return dependency;
  }

  async removeDependency(organizationId: string, taskId: string, dependsOnTaskId: string) {
    const task = await this.prisma.client.task.findFirst({
      where: { id: taskId, organizationId },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.prisma.client.taskDependency.deleteMany({
      where: { taskId, dependsOnTaskId },
    });

    return { success: true, taskId, dependsOnTaskId };
  }

  async addComment(organizationId: string, taskId: string, dto: AddTaskCommentDto, currentMemberId: string) {
    const task = await this.prisma.client.task.findFirst({
      where: { id: taskId, organizationId },
      include: { assignees: true },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const author = await this.prisma.client.member.findFirst({
      where: { id: currentMemberId, organizationId },
    });
    if (!author) {
      throw new BadRequestException('Author member does not belong to this organization');
    }

    const comment = await this.prisma.client.taskComment.create({
      data: {
        taskId,
        authorId: currentMemberId,
        content: dto.content,
      },
      include: {
        author: { select: { id: true, user: { select: { name: true, email: true } } } },
      },
    });

    await this.prisma.client.taskActivityLog.create({
      data: {
        taskId,
        actorId: currentMemberId,
        action: 'COMMENT_ADDED',
        details: { commentId: comment.id },
      },
    });

    // Notify task assignees
    const assigneeIds = task.assignees.map((a) => a.memberId).filter((id) => id !== currentMemberId);
    if (assigneeIds.length > 0) {
      this.firebaseMessagingService
        .sendToMembers(assigneeIds, {
          title: `New Comment on [${task.taskKey}]`,
          body: `${comment.author?.user?.name || 'A teammate'}: ${dto.content.slice(0, 80)}`,
          data: {
            eventType: 'TASK_COMMENT_ADDED',
            taskId: task.id,
            taskKey: task.taskKey,
            organizationId,
          },
        })
        .catch(() => {});
    }

    return comment;
  }

  async createLabel(organizationId: string, dto: CreateTaskLabelDto) {
    if (dto.projectId) {
      const project = await this.prisma.client.project.findFirst({
        where: { id: dto.projectId, organizationId },
      });
      if (!project) {
        throw new BadRequestException('Project not found or does not belong to this organization');
      }
    }

    const label = await this.prisma.client.taskLabel.create({
      data: {
        organizationId,
        projectId: dto.projectId,
        name: dto.name,
        color: dto.color || '#6B7280',
      },
    });

    return label;
  }

  async listLabels(organizationId: string, projectId?: string) {
    const labels = await this.prisma.client.taskLabel.findMany({
      where: {
        organizationId,
        OR: projectId ? [{ projectId }, { projectId: null }] : undefined,
      },
      orderBy: { name: 'asc' },
    });

    return labels;
  }
  async addTimeEntry(organizationId: string, taskId: string | undefined, dto: CreateTaskTimeEntryDto, currentMemberId: string) {
    const actualTaskId = dto.taskId || (taskId && taskId !== "general" ? taskId : undefined);

    let task: any = null;
    if (actualTaskId) {
      task = await this.prisma.client.task.findFirst({
        where: { id: actualTaskId, organizationId },
      });
      if (!task) {
        throw new NotFoundException("Task not found");
      }
    }

    const member = await this.prisma.client.member.findFirst({
      where: { id: currentMemberId, organizationId },
    });
    if (!member) {
      throw new BadRequestException("Member does not belong to this organization");
    }

    const timeEntry = await this.prisma.client.taskTimeEntry.create({
      data: {
        organizationId,
        taskId: actualTaskId || null,
        memberId: currentMemberId,
        hours: dto.hours,
        description: dto.description,
        date: dto.date || new Date(),
        category: dto.category || (actualTaskId ? null : "OPERATION"),
        isBillable: dto.isBillable !== undefined ? dto.isBillable : true,
        isLocked: false,
      },
      include: {
        member: { select: { id: true, user: { select: { name: true, email: true } } } },
        task: { select: { id: true, taskKey: true, title: true } },
      },
    });

    if (actualTaskId) {
      const totalHours = await this.prisma.client.taskTimeEntry.aggregate({
        where: { taskId: actualTaskId },
        _sum: { hours: true },
      });
      await this.prisma.client.task.updateMany({
        where: { id: actualTaskId, organizationId },
        data: { actualHours: totalHours._sum.hours || 0 },
      });
    }

    return timeEntry;
  }

  async listTimeEntries(organizationId: string, taskId?: string) {
    const where: any = { organizationId };
    if (taskId && taskId !== "all") {
      where.taskId = taskId;
    }

    return this.prisma.client.taskTimeEntry.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        member: { select: { id: true, user: { select: { name: true, email: true } } } },
        task: { select: { id: true, taskKey: true, title: true, projectId: true } },
      },
    });
  }

  async deleteTimeEntry(organizationId: string, taskId: string | undefined, entryId: string) {
    const entry = await this.prisma.client.taskTimeEntry.findFirst({
      where: { id: entryId, organizationId },
    });
    if (!entry) {
      throw new NotFoundException("Time entry not found");
    }

    if (entry.isLocked) {
      throw new BadRequestException("Cannot delete an approved and locked time entry");
    }

    const linkedTaskId = entry.taskId;

    await this.prisma.client.taskTimeEntry.deleteMany({
      where: { id: entryId, organizationId },
    });

    if (linkedTaskId) {
      const totalHours = await this.prisma.client.taskTimeEntry.aggregate({
        where: { taskId: linkedTaskId },
        _sum: { hours: true },
      });
      await this.prisma.client.task.updateMany({
        where: { id: linkedTaskId, organizationId },
        data: { actualHours: totalHours._sum.hours || 0 },
      });
    }

    return { success: true, id: entryId };
  }

  async getSubtasks(organizationId: string, taskId: string) {
    const task = await this.prisma.client.task.findFirst({
      where: { id: taskId, organizationId },
    });
    if (!task) {
      throw new NotFoundException("Task not found");
    }

    return this.prisma.client.task.findMany({
      where: { parentTaskId: taskId, organizationId },
      orderBy: { taskNumber: "asc" },
      include: {
        assignees: {
          include: { member: { select: { id: true, user: { select: { name: true, email: true } } } } },
        },
        subtasks: { select: { id: true, taskKey: true, title: true, status: true, priority: true } },
        _count: { select: { comments: true, subtasks: true } },
      },
    });
  }

  async getCalendarEvents(organizationId: string, projectId?: string) {
    const taskWhere: any = { organizationId };
    const milestoneWhere: any = { organizationId };
    const sprintWhere: any = { organizationId };

    if (projectId) {
      taskWhere.projectId = projectId;
      milestoneWhere.projectId = projectId;
      sprintWhere.projectId = projectId;
    }

    const [tasks, milestones, sprints] = await Promise.all([
      this.prisma.client.task.findMany({
        where: taskWhere,
        orderBy: { dueDate: "asc" },
        select: {
          id: true,
          taskKey: true,
          title: true,
          status: true,
          priority: true,
          startDate: true,
          dueDate: true,
          projectId: true,
          project: { select: { id: true, name: true, key: true } },
          assignees: {
            include: { member: { select: { id: true, user: { select: { name: true, email: true } } } } },
          },
        },
      }),
      this.prisma.client.projectMilestone.findMany({
        where: milestoneWhere,
        orderBy: { dueDate: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          dueDate: true,
          projectId: true,
          project: { select: { id: true, name: true, key: true } },
        },
      }),
      this.prisma.client.projectSprint.findMany({
        where: sprintWhere,
        orderBy: { startDate: "asc" },
        select: {
          id: true,
          name: true,
          goal: true,
          status: true,
          startDate: true,
          endDate: true,
          projectId: true,
          project: { select: { id: true, name: true, key: true } },
        },
      }),
    ]);

    return {
      tasks,
      milestones,
      sprints,
    };
  }

  async getMemberPerformance(
    organizationId: string,
    memberId: string,
    filter?: { from?: Date; to?: Date },
  ) {
    const member = await this.prisma.client.member.findFirst({
      where: { id: memberId, organizationId },
      include: { user: { select: { name: true, email: true, image: true } } },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const fromDate = filter?.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = filter?.to || new Date();

    const [tasks, timeEntries, shifts] = await Promise.all([
      this.prisma.client.task.findMany({
        where: {
          organizationId,
          assignees: { some: { memberId } },
          updatedAt: { gte: fromDate, lte: toDate },
        },
        include: {
          project: { select: { id: true, name: true, key: true } },
        },
      }),
      this.prisma.client.taskTimeEntry.findMany({
        where: {
          organizationId,
          memberId,
          date: { gte: fromDate, lte: toDate },
        },
      }),
      this.prisma.client.staffShift.findMany({
        where: {
          organizationId,
          memberId,
          isActive: true,
        },
      }),
    ]);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'DONE');
    const velocity = completedTasks.length;

    let onTimeCount = 0;
    let overdueCount = 0;
    let totalResolutionHours = 0;
    let resolvedWithDurationCount = 0;

    for (const t of tasks) {
      const isDone = t.status === 'DONE';
      if (isDone) {
        if (t.dueDate) {
          if (new Date(t.updatedAt).getTime() <= new Date(t.dueDate).getTime()) {
            onTimeCount++;
          }
        } else {
          onTimeCount++;
        }

        if (t.startDate) {
          const durHours = Math.max(
            0.5,
            (new Date(t.updatedAt).getTime() - new Date(t.startDate).getTime()) / (1000 * 60 * 60),
          );
          totalResolutionHours += durHours;
          resolvedWithDurationCount++;
        }
      } else if (t.dueDate && new Date(t.dueDate).getTime() < Date.now()) {
        overdueCount++;
      }
    }

    const onTimeRate = completedTasks.length > 0 ? Math.round((onTimeCount / completedTasks.length) * 100) : 100;
    const avgResolutionHours = resolvedWithDurationCount > 0 ? Math.round((totalResolutionHours / resolvedWithDurationCount) * 10) / 10 : 0;

    const totalActualHours = timeEntries.reduce((acc, curr) => acc + Number(curr.hours), 0);
    const totalEstimatedHours = tasks.reduce((acc, curr) => acc + (Number(curr.estimatedHours) || 0), 0);

    let weeklyShiftHours = 0;
    for (const s of shifts) {
      const [startH, startM] = s.startTime.split(':').map(Number);
      const [endH, endM] = s.endTime.split(':').map(Number);
      const minutes = (endH * 60 + endM) - (startH * 60 + startM);
      if (minutes > 0) {
        weeklyShiftHours += minutes / 60;
      }
    }

    const daysCount = Math.max(1, Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)));
    const expectedCapacityHours = weeklyShiftHours > 0 ? Math.round((weeklyShiftHours / 7) * daysCount) : 40;
    const capacityUtilizationRate = expectedCapacityHours > 0 ? Math.round((totalActualHours / expectedCapacityHours) * 100) : 0;

    return {
      member: {
        id: member.id,
        name: member.user?.name || 'Member',
        email: member.user?.email || '',
        role: member.role,
        image: member.user?.image || null,
      },
      period: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      },
      kpis: {
        onTimeCompletionRate: onTimeRate,
        velocity,
        totalTasks,
        completedTasks: completedTasks.length,
        capacityUtilizationRate,
        overdueTaskCount: overdueCount,
        averageResolutionHours: avgResolutionHours,
        totalActualHours,
        totalEstimatedHours,
        expectedCapacityHours,
      },
      recentTasks: tasks.slice(0, 10).map((t) => ({
        id: t.id,
        taskKey: t.taskKey,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        actualHours: t.actualHours,
        estimatedHours: t.estimatedHours,
        project: t.project,
      })),
    };
  }

  async getWeeklyTimesheets(
    organizationId: string,
    memberId?: string,
    weekStartDate?: Date,
  ) {
    const start = weekStartDate ? new Date(weekStartDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

    const where: any = {
      organizationId,
      date: { gte: start, lte: end },
    };
    if (memberId) {
      where.memberId = memberId;
    }

    const entries = await this.prisma.client.taskTimeEntry.findMany({
      where,
      include: {
        member: { select: { id: true, user: { select: { name: true, email: true } } } },
        task: { select: { id: true, taskKey: true, title: true, projectId: true } },
      },
      orderBy: { date: 'asc' },
    });

    const memberMap = new Map<string, any>();

    for (const entry of entries) {
      const mId = entry.memberId;
      if (!memberMap.has(mId)) {
        memberMap.set(mId, {
          memberId: mId,
          memberName: entry.member?.user?.name || 'Member',
          memberEmail: entry.member?.user?.email || '',
          weekStartDate: start.toISOString(),
          totalHours: 0,
          billableHours: 0,
          entries: [],
          status: 'SUBMITTED',
        });
      }

      const record = memberMap.get(mId);
      const hoursNum = Number(entry.hours);
      record.totalHours += hoursNum;
      if (entry.isBillable !== false) {
        record.billableHours += hoursNum;
      }
      if (entry.isLocked) {
        record.status = 'APPROVED';
      }
      record.entries.push({
        id: entry.id,
        taskId: entry.taskId,
        taskKey: entry.task?.taskKey,
        taskTitle: entry.task?.title,
        hours: hoursNum,
        description: entry.description,
        date: entry.date,
      });
    }

    return Array.from(memberMap.values());
  }

  async submitWeeklyTimesheet(
    organizationId: string,
    memberId: string,
    dto: { weekStartDate: Date; notes?: string },
  ) {
    const member = await this.prisma.client.member.findFirst({
      where: { id: memberId, organizationId },
      include: { user: { select: { name: true, email: true } } },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const weekStart = new Date(dto.weekStartDate);
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    const totalHours = await this.prisma.client.taskTimeEntry.aggregate({
      where: {
        organizationId,
        memberId,
        date: { gte: weekStart, lte: weekEnd },
      },
      _sum: { hours: true },
    });

    return {
      success: true,
      memberId,
      weekStartDate: weekStart.toISOString(),
      totalHours: Number(totalHours._sum.hours || 0),
      status: 'SUBMITTED',
      submittedAt: new Date().toISOString(),
      notes: dto.notes || null,
    };
  }

  async processWeeklyTimesheet(
    organizationId: string,
    timesheetId: string,
    reviewerMemberId: string | null,
    dto: { action: 'APPROVE' | 'REJECT'; notes?: string },
  ) {
    if (dto.action === 'APPROVE') {
      await this.prisma.client.taskTimeEntry.updateMany({
        where: {
          organizationId,
          OR: [
            { id: timesheetId },
            { memberId: timesheetId },
          ],
        },
        data: {
          isLocked: true,
        },
      });
    }

    return {
      success: true,
      timesheetId,
      status: dto.action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      reviewedById: reviewerMemberId,
      reviewedAt: new Date().toISOString(),
      notes: dto.notes || null,
    };
  }

  async getTeamPerformance(
    organizationId: string,
    filter?: { from?: Date; to?: Date },
  ) {
    const fromDate = filter?.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = filter?.to || new Date();

    const members = await this.prisma.client.member.findMany({
      where: { organizationId },
      include: { user: { select: { name: true, email: true, image: true } } },
    });

    const memberStats = await Promise.all(
      members.map((m) => this.getMemberPerformance(organizationId, m.id, { from: fromDate, to: toDate }))
    );

    const totalMembers = memberStats.length;
    const avgOnTime = totalMembers > 0
      ? Math.round(memberStats.reduce((acc, curr) => acc + curr.kpis.onTimeCompletionRate, 0) / totalMembers)
      : 100;
    const totalVelocity = memberStats.reduce((acc, curr) => acc + curr.kpis.velocity, 0);
    const totalHoursLogged = memberStats.reduce((acc, curr) => acc + curr.kpis.totalActualHours, 0);
    const avgCapacity = totalMembers > 0
      ? Math.round(memberStats.reduce((acc, curr) => acc + curr.kpis.capacityUtilizationRate, 0) / totalMembers)
      : 0;

    return {
      period: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      },
      squadOverview: {
        averageOnTimeCompletionRate: avgOnTime,
        totalVelocity,
        totalHoursLogged,
        averageCapacityUtilization: avgCapacity,
        activeMemberCount: totalMembers,
      },
      leaderboard: memberStats.map((ms) => ({
        member: ms.member,
        kpis: ms.kpis,
      })),
    };
  }
}
