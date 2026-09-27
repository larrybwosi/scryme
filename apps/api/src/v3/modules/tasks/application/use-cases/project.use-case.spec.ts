import { describe, beforeEach, it, expect, vi } from "vitest";
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ProjectUseCase } from './project.use-case';

describe('ProjectUseCase', () => {
  let useCase: ProjectUseCase;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      client: {
        project: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
          count: vi.fn(),
          create: vi.fn(),
          updateMany: vi.fn(),
          deleteMany: vi.fn(),
        },
        member: {
          findFirst: vi.fn(),
        },
        department: {
          findFirst: vi.fn(),
        },
        projectMember: {
          upsert: vi.fn(),
          deleteMany: vi.fn(),
        },
      },
    };

    useCase = new ProjectUseCase(mockPrisma);
  });

  describe('createProject', () => {
    it('should create a project when key is unique and relations are valid', async () => {
      mockPrisma.client.project.findFirst.mockResolvedValue(null);
      mockPrisma.client.project.create.mockResolvedValue({
        id: 'prj_1',
        name: 'New App',
        key: 'NEWAPP',
        organizationId: 'org_1',
      });

      const dto = { name: 'New App', key: 'NEWAPP' };
      const result = await useCase.createProject('org_1', dto as any, 'member_1');

      expect(result.id).toEqual('prj_1');
      expect(mockPrisma.client.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: 'org_1',
            key: 'NEWAPP',
          }),
        }),
      );
    });

    it('should throw ConflictException if project key exists', async () => {
      mockPrisma.client.project.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(
        useCase.createProject('org_1', { name: 'New App', key: 'EXIST' } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getProject', () => {
    it('should throw NotFoundException if project not found for organization', async () => {
      mockPrisma.client.project.findFirst.mockResolvedValue(null);

      await expect(useCase.getProject('org_1', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProject', () => {
    it('should update project with updateMany for strict multi-tenant isolation', async () => {
      mockPrisma.client.project.findFirst.mockResolvedValue({ id: 'prj_1', organizationId: 'org_1' });
      mockPrisma.client.project.updateMany.mockResolvedValue({ count: 1 });

      const dto = { name: 'Updated Name' };
      await useCase.updateProject('org_1', 'prj_1', dto as any);

      expect(mockPrisma.client.project.updateMany).toHaveBeenCalledWith({
        where: { id: 'prj_1', organizationId: 'org_1' },
        data: expect.objectContaining({ name: 'Updated Name' }),
      });
    });
  });

  describe('deleteProject', () => {
    it('should delete project using deleteMany filtered by organizationId', async () => {
      mockPrisma.client.project.findFirst.mockResolvedValue({ id: 'prj_1', organizationId: 'org_1' });
      mockPrisma.client.project.deleteMany.mockResolvedValue({ count: 1 });

      const result = await useCase.deleteProject('org_1', 'prj_1');

      expect(result.success).toBe(true);
      expect(mockPrisma.client.project.deleteMany).toHaveBeenCalledWith({
        where: { id: 'prj_1', organizationId: 'org_1' },
      });
    });
  });
});
