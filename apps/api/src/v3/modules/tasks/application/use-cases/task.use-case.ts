import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import {
  AddTaskCommentDto,
  AddTaskDependencyDto,
  CreateTaskDto,
  CreateTaskLabelDto,
  ManageTaskAssigneesDto,
  TaskFilterDto,
  UpdateTaskDto,
} from '../../dtos/task.dto';

@Injectable()
export class TaskUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async createTask(organizationId: string, dto: CreateTaskDto, currentMemberId?: string) {
    const project = await this.prisma.client.project.findFirst({
      where: { id: dto.projectId, organizationId },
    });
    if (!project) {
      throw new BadRequestException('Project not found or does not belong to this organization');
    }

    if (dto.parentTaskId) {
      const parentTask = await this.prisma.client.task.findFirst({
        where: { id: dto.parentTaskId, organizationId, projectId: dto.projectId },
      });
      if (!parentTask) {
        throw new BadRequestException('Parent task not found within this project');
      }
    }

    if (dto.assigneeIds && dto.assigneeIds.length > 0) {
      const validMembers = await this.prisma.client.member.findMany({
        where: { id: { in: dto.assigneeIds }, organizationId },
        select: { id: true },
      });
      if (validMembers.length !== dto.assigneeIds.length) {
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
        createdById: currentMemberId,
        assignees: dto.assigneeIds?.length
          ? {
              create: dto.assigneeIds.map((memberId) => ({ memberId })),
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
        subtasks: { select: { id: true, taskKey: true, title: true, status: true, priority: true } },
        _count: { select: { comments: true, subtasks: true } },
      },
    });

    return task;
  }

  async getTask(organizationId: string, taskId: string) {
    const task = await this.prisma.client.task.findFirst({
      where: { id: taskId, organizationId },
      include: {
        project: { select: { id: true, name: true, key: true } },
        createdBy: { select: { id: true, user: { select: { name: true, email: true } } } },
        parentTask: { select: { id: true, taskKey: true, title: true } },
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
    const { projectId, status, priority, assigneeId, search, page = 1, limit = 20 } = filter;
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

    if (dto.memberIds.length > 0) {
      const validMembers = await this.prisma.client.member.findMany({
        where: { id: { in: dto.memberIds }, organizationId },
        select: { id: true },
      });
      if (validMembers.length !== dto.memberIds.length) {
        throw new BadRequestException('One or more assignees do not belong to this organization');
      }
    }

    await this.prisma.client.taskAssignee.deleteMany({
      where: { taskId },
    });

    if (dto.memberIds.length > 0) {
      await this.prisma.client.taskAssignee.createMany({
        data: dto.memberIds.map((memberId) => ({
          taskId,
          memberId,
        })),
      });
    }

    await this.prisma.client.taskActivityLog.create({
      data: {
        taskId,
        actorId: currentMemberId,
        action: 'ASSIGNEES_UPDATED',
        details: { memberIds: dto.memberIds },
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
}
