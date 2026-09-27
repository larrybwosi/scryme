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
});
