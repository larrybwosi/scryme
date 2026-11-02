import { describe, beforeEach, it, expect, vi } from "vitest";
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TaskUseCase } from './task.use-case';

describe('TaskUseCase', () => {
  let useCase: TaskUseCase;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      client: {
        project: {
          findFirst: vi.fn(),
        },
        task: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
          count: vi.fn(),
          create: vi.fn(),
          updateMany: vi.fn(),
          deleteMany: vi.fn(),
        },
        member: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
        taskLabel: {
          findMany: vi.fn(),
          create: vi.fn(),
        },
        taskAssignee: {
          deleteMany: vi.fn(),
          createMany: vi.fn(),
        },
        taskDependency: {
          upsert: vi.fn(),
          deleteMany: vi.fn(),
        },
        taskComment: {
          create: vi.fn(),
        },
        taskActivityLog: {
          create: vi.fn(),
        },
      },
    };

    useCase = new TaskUseCase(mockPrisma);
  });

  describe('createTask', () => {
    it('should create task and generate auto-incrementing taskKey per project', async () => {
      mockPrisma.client.project.findFirst.mockResolvedValue({
        id: 'prj_1',
        key: 'PRJ',
        organizationId: 'org_1',
      });
      mockPrisma.client.task.count.mockResolvedValue(5);
      mockPrisma.client.task.create.mockResolvedValue({
        id: 'task_1',
        taskKey: 'PRJ-6',
        title: 'New Feature',
      });

      const dto = { projectId: 'prj_1', title: 'New Feature' };
      const result = await useCase.createTask('org_1', dto as any, 'member_1');

      expect(result.taskKey).toEqual('PRJ-6');
      expect(mockPrisma.client.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            taskNumber: 6,
            taskKey: 'PRJ-6',
            organizationId: 'org_1',
          }),
        }),
      );
    });

    it('should throw BadRequestException if project does not belong to organization', async () => {
      mockPrisma.client.project.findFirst.mockResolvedValue(null);

      await expect(
        useCase.createTask('org_1', { projectId: 'invalid', title: 'Task' } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('addDependency', () => {
    it('should throw BadRequestException if task depends on itself', async () => {
      mockPrisma.client.task.findFirst.mockResolvedValue({ id: 'task_1', organizationId: 'org_1' });

      await expect(
        useCase.addDependency('org_1', 'task_1', { dependsOnTaskId: 'task_1' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create task dependency when valid', async () => {
      mockPrisma.client.task.findFirst
        .mockResolvedValueOnce({ id: 'task_1', organizationId: 'org_1' })
        .mockResolvedValueOnce({ id: 'task_2', organizationId: 'org_1' });

      mockPrisma.client.taskDependency.upsert.mockResolvedValue({
        taskId: 'task_1',
        dependsOnTaskId: 'task_2',
        type: 'BLOCKS',
      });

      const result = await useCase.addDependency('org_1', 'task_1', {
        dependsOnTaskId: 'task_2',
      } as any);

      expect(result.type).toEqual('BLOCKS');
    });
  });

  describe('getMemberPerformance', () => {
    it('should compute member KPIs accurately', async () => {
      mockPrisma.client.member.findFirst.mockResolvedValue({
        id: 'member_1',
        role: 'ENGINEER',
        user: { name: 'Alice Developer', email: 'alice@scryme.tech' },
      });

      const now = new Date();
      mockPrisma.client.task.findMany.mockResolvedValue([
        {
          id: 'task_1',
          taskKey: 'DEV-1',
          title: 'Implement auth',
          status: 'DONE',
          dueDate: new Date(now.getTime() + 86400000),
          startDate: new Date(now.getTime() - 86400000),
          updatedAt: now,
          estimatedHours: 8,
          actualHours: 7,
          project: { id: 'prj_1', name: 'Core', key: 'DEV' },
        },
        {
          id: 'task_2',
          taskKey: 'DEV-2',
          title: 'Overdue bug',
          status: 'IN_PROGRESS',
          dueDate: new Date(now.getTime() - 86400000),
          startDate: new Date(now.getTime() - 172800000),
          updatedAt: now,
          estimatedHours: 4,
          actualHours: 2,
          project: { id: 'prj_1', name: 'Core', key: 'DEV' },
        },
      ]);

      mockPrisma.client.taskTimeEntry = {
        findMany: vi.fn().mockResolvedValue([
          { hours: 7, date: now },
          { hours: 2, date: now },
        ]),
        aggregate: vi.fn().mockResolvedValue({ _sum: { hours: 9 } }),
      };

      mockPrisma.client.staffShift = {
        findMany: vi.fn().mockResolvedValue([
          { startTime: '09:00', endTime: '17:00', isActive: true, dayOfWeek: 1 },
          { startTime: '09:00', endTime: '17:00', isActive: true, dayOfWeek: 2 },
          { startTime: '09:00', endTime: '17:00', isActive: true, dayOfWeek: 3 },
          { startTime: '09:00', endTime: '17:00', isActive: true, dayOfWeek: 4 },
          { startTime: '09:00', endTime: '17:00', isActive: true, dayOfWeek: 5 },
        ]),
      };

      const result = await useCase.getMemberPerformance('org_1', 'member_1');
      expect(result.member.name).toBe('Alice Developer');
      expect(result.kpis.totalTasks).toBe(2);
      expect(result.kpis.completedTasks).toBe(1);
      expect(result.kpis.velocity).toBe(1);
      expect(result.kpis.onTimeCompletionRate).toBe(100);
      expect(result.kpis.overdueTaskCount).toBe(1);
      expect(result.kpis.totalActualHours).toBe(9);
    });

    it('should throw NotFoundException if member does not exist', async () => {
      mockPrisma.client.member.findFirst.mockResolvedValue(null);

      await expect(
        useCase.getMemberPerformance('org_1', 'invalid_member'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('weeklyTimesheets', () => {
    it('should submit weekly timesheet successfully', async () => {
      mockPrisma.client.member.findFirst.mockResolvedValue({
        id: 'member_1',
        user: { name: 'Alice' },
      });
      mockPrisma.client.taskTimeEntry = {
        ...mockPrisma.client.taskTimeEntry,
        aggregate: vi.fn().mockResolvedValue({ _sum: { hours: 38.5 } }),
      };

      const result = await useCase.submitWeeklyTimesheet('org_1', 'member_1', {
        weekStartDate: new Date('2026-10-12'),
        notes: 'Submitted for sprint review',
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('SUBMITTED');
      expect(result.totalHours).toBe(38.5);
    });

    it('should process (approve/reject) weekly timesheet', async () => {
      const result = await useCase.processWeeklyTimesheet('org_1', 'ts_123', 'manager_1', {
        action: 'APPROVE',
        notes: 'Looks good',
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('APPROVED');
      expect(result.reviewedById).toBe('manager_1');
    });
  });
});
