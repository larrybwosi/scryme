import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskController } from '../task.controller';
import { TaskUseCase } from '../../../application/use-cases/task.use-case';

describe('TaskController', () => {
  let controller: TaskController;
  let taskUseCase: any;

  beforeEach(() => {
    taskUseCase = {
      createTask: vi.fn(),
      listTasks: vi.fn(),
      getTask: vi.fn(),
      listLabels: vi.fn(),
      createLabel: vi.fn(),
      getWorkspaceContext: vi.fn(),
    };
    controller = new TaskController(taskUseCase as unknown as TaskUseCase);
  });

  it('should call listLabels when listLabels is invoked', async () => {
    const ctx = { organizationId: 'org_123', orgSlug: 'org', memberId: 'mem_1' } as any;
    taskUseCase.listLabels.mockResolvedValue([{ id: 'lbl_1', name: 'Bug' }]);

    const res = await controller.listLabels(ctx, 'proj_1');
    expect(taskUseCase.listLabels).toHaveBeenCalledWith('org_123', 'proj_1');
    expect(res).toEqual([{ id: 'lbl_1', name: 'Bug' }]);
  });

  it('should call getTask when getTask is invoked with a valid id', async () => {
    const ctx = { organizationId: 'org_123', orgSlug: 'org', memberId: 'mem_1' } as any;
    taskUseCase.getTask.mockResolvedValue({ id: 'task_1', title: 'Test Task' });

    const res = await controller.getTask(ctx, 'task_1');
    expect(taskUseCase.getTask).toHaveBeenCalledWith('org_123', 'task_1');
    expect(res).toEqual({ id: 'task_1', title: 'Test Task' });
  });
});
