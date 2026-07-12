import { Test, TestingModule } from '@nestjs/testing';
import { DepartmentUseCase } from '../department.use-case';
import { PrismaService } from '@/prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('DepartmentUseCase', () => {
  let useCase: DepartmentUseCase;
  let prisma: PrismaService;

  const mockPrisma = {
    client: {
      department: {
        create: vi.fn(),
        update: vi.fn(),
      },
      member: {
        findFirst: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepartmentUseCase,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    useCase = module.get<DepartmentUseCase>(DepartmentUseCase);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('createDepartment', () => {
    it('should throw BadRequestException if headId does not belong to organization', async () => {
      const organizationId = 'org1';
      const dto = { name: 'IT', headId: 'invalid-member-id' };

      mockPrisma.client.member.findFirst.mockResolvedValue(null);

      await expect(useCase.createDepartment(organizationId, dto, 'actor1'))
        .rejects.toThrow(BadRequestException);

      expect(mockPrisma.client.member.findFirst).toHaveBeenCalledWith({
        where: { id: dto.headId, organizationId },
      });
    });

    it('should create department if headId is valid', async () => {
      const organizationId = 'org1';
      const dto = { name: 'IT', headId: 'valid-member-id' };

      mockPrisma.client.member.findFirst.mockResolvedValue({ id: 'valid-member-id' });
      mockPrisma.client.department.create.mockResolvedValue({ id: 'dept1', ...dto });

      const result = await useCase.createDepartment(organizationId, dto, 'actor1');

      expect(result.id).toBe('dept1');
      expect(mockPrisma.client.department.create).toHaveBeenCalled();
    });
  });

  describe('updateDepartment', () => {
    it('should throw BadRequestException if headId does not belong to organization', async () => {
      const organizationId = 'org1';
      const id = 'dept1';
      const dto = { headId: 'invalid-member-id' };

      mockPrisma.client.member.findFirst.mockResolvedValue(null);

      await expect(useCase.updateDepartment(organizationId, id, dto, 'actor1'))
        .rejects.toThrow(BadRequestException);
    });
  });
});
