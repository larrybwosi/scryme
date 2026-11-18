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
        taskTimeEntry: {
          findMany: vi.fn(),
          findFirst: vi.fn(),
          create: vi.fn(),
          updateMany: vi.fn(),
          deleteMany: vi.fn(),
          aggregate: vi.fn().mockResolvedValue({ _sum: { hours: 0 } }),
        },
        staffShift: {
          findMany: vi.fn().mockResolvedValue([]),
        },
      },
    };

    const mockFCM: any = {
      sendToMembers: vi.fn().mockResolvedValue({ success: true }),
    };
    const mockRealtime: any = {
      publish: vi.fn().mockResolvedValue(true),
    };
    useCase = new TaskUseCase(mockPrisma, mockFCM, mockRealtime);
  });

  
  describe('manageAssignees', () => {
    it('should assign multiple members with primary owner and allocated hours', async () => {
      mockPrisma.client.task.findFirst.mockResolvedValue({
        id: 'task_1',
        taskKey: 'DEV-1',
        title: 'Feature A',
        organizationId: 'org_1',
      });
      mockPrisma.client.member.findMany.mockResolvedValue([
        { id: 'member_1' },
        { id: 'member_2' },
      ]);
      mockPrisma.client.task.findFirst.mockResolvedValueOnce({
        id: 'task_1',
        taskKey: 'DEV-1',
        title: 'Feature A',
        organizationId: 'org_1',
      }).mockResolvedValueOnce({
        id: 'task_1',
        taskKey: 'DEV-1',
        title: 'Feature A',
        assignees: [
          { memberId: 'member_1', isPrimary: true, allocatedHours: 6 },
          { memberId: 'member_2', isPrimary: false, allocatedHours: 4 },
        ],
      });

      await useCase.manageAssignees('org_1', 'task_1', {
        assignees: [
          { memberId: 'member_1', isPrimary: true, allocatedHours: 6 },
          { memberId: 'member_2', isPrimary: false, allocatedHours: 4 },
        ],
      });

      expect(mockPrisma.client.taskAssignee.createMany).toHaveBeenCalledWith({
        data: [
          { taskId: 'task_1', memberId: 'member_1', isPrimary: true, allocatedHours: 6 },
          { taskId: 'task_1', memberId: 'member_2', isPrimary: false, allocatedHours: 4 },
        ],
      });
    });
  });

  describe('createTask', () => {
    it('should create task with integrations (sprint, booking, batch) and structured assignees', async () => {
      mockPrisma.client.project.findFirst.mockResolvedValue({
        id: 'prj_1',
        key: 'PRJ',
        organizationId: 'org_1',
      });
      mockPrisma.client.projectSprint = { findFirst: vi.fn().mockResolvedValue({ id: 'sprint_1' }) };
      mockPrisma.client.serviceBooking = { findFirst: vi.fn().mockResolvedValue({ id: 'bkg_1' }) };
      mockPrisma.client.batch = {
        findFirst: vi.fn().mockResolvedValue({ id: 'batch_1' }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      };
      mockPrisma.client.member.findMany.mockResolvedValue([
        { id: 'member_1' },
        { id: 'member_2' },
      ]);
      mockPrisma.client.task.count.mockResolvedValue(10);
      mockPrisma.client.task.create.mockResolvedValue({
        id: 'task_new',
        taskKey: 'PRJ-11',
        title: 'Integrated Task',
        sprintId: 'sprint_1',
        bookingId: 'bkg_1',
      });

      const dto = {
        projectId: 'prj_1',
        title: 'Integrated Task',
        sprintId: 'sprint_1',
        bookingId: 'bkg_1',
        batchId: 'batch_1',
        assignees: [
          { memberId: 'member_1', isPrimary: true, allocatedHours: 5 },
          { memberId: 'member_2', isPrimary: false, allocatedHours: 3 },
        ],
      };

      const result = await useCase.createTask('org_1', dto as any, 'member_1');
      expect(result.taskKey).toBe('PRJ-11');
      expect(mockPrisma.client.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            sprintId: 'sprint_1',
            bookingId: 'bkg_1',
            assignees: {
              create: [
                { memberId: 'member_1', isPrimary: true, allocatedHours: 5 },
                { memberId: 'member_2', isPrimary: false, allocatedHours: 3 },
              ],
            },
          }),
        }),
      );
      expect(mockPrisma.client.batch.updateMany).toHaveBeenCalledWith({
        where: { id: 'batch_1', organizationId: 'org_1' },
        data: { taskId: 'task_new' },
      });
    });

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

    it('should include billable and lock metadata in weekly timesheet entries', async () => {
      const weekStartDate = new Date('2026-10-12');
      mockPrisma.client.taskTimeEntry.findMany.mockResolvedValue([
        {
          id: 'entry_1',
          memberId: 'member_1',
          member: { user: { name: 'Alice', email: 'alice@scryme.tech' } },
          task: { taskKey: 'DEV-1', title: 'Feature A', projectId: 'prj_1' },
          hours: 6,
          date: weekStartDate,
          category: 'SUPPORT',
          isBillable: true,
          isLocked: true,
        },
        {
          id: 'entry_2',
          memberId: 'member_1',
          member: { user: { name: 'Alice', email: 'alice@scryme.tech' } },
          task: null,
          hours: 4,
          date: weekStartDate,
          category: 'MEETING',
          isBillable: false,
          isLocked: false,
        },
      ]);

      const result = await useCase.getWeeklyTimesheets('org_1', undefined, weekStartDate);

      expect(mockPrisma.client.taskTimeEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: {
              gte: weekStartDate,
              lt: new Date(weekStartDate.getTime() + 7 * 24 * 60 * 60 * 1000),
            },
          }),
        }),
      );
      expect(result).toHaveLength(1);
      expect(result[0].totalHours).toBe(10);
      expect(result[0].billableHours).toBe(6);
      expect(result[0].status).toBe('APPROVED');
      expect(result[0].entries[0]).toMatchObject({
        category: 'SUPPORT',
        isBillable: true,
        isLocked: true,
      });
    });

    it('should process (approve/reject) weekly timesheet and lock the reviewed week', async () => {
      const weekStartDate = new Date('2026-10-12');
      const weekEnd = new Date(weekStartDate.getTime() + 7 * 24 * 60 * 60 * 1000);

      const result = await useCase.processWeeklyTimesheet('org_1', 'ts_123', 'manager_1', {
        action: 'APPROVE',
        weekStartDate,
        notes: 'Looks good',
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('APPROVED');
      expect(result.reviewedById).toBe('manager_1');
      expect(mockPrisma.client.taskTimeEntry.updateMany).toHaveBeenCalledWith({
        where: {
          organizationId: 'org_1',
          date: { gte: weekStartDate, lt: weekEnd },
          OR: [
            { id: 'ts_123' },
            { memberId: 'ts_123' },
          ],
        },
        data: { isLocked: true },
      });
    });

    it('should reject deleting an approved and locked time entry', async () => {
      mockPrisma.client.taskTimeEntry.findFirst.mockResolvedValue({
        id: 'entry_1',
        organizationId: 'org_1',
        taskId: 'task_1',
        isLocked: true,
      });

      await expect(
        useCase.deleteTimeEntry('org_1', 'task_1', 'entry_1'),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrisma.client.taskTimeEntry.deleteMany).not.toHaveBeenCalled();
    });
  });
});
