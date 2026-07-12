import { Test, TestingModule } from '@nestjs/testing';
import { MemberUseCase } from '../member.use-case';
import { PrismaService } from '@/prisma/prisma.service';
import { MemberRole, MembershipStatus } from '@repo/db';
import { BadRequestException } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('MemberUseCase', () => {
  let useCase: MemberUseCase;
  let prisma: PrismaService;

  const mockPrisma = {
    client: {
      member: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn(),
      },
      department: {
        count: vi.fn(),
      },
      customRole: {
        count: vi.fn(),
      },
      roleGroup: {
        count: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
      approvalRequest: {
        create: vi.fn(),
      },
      $transaction: vi.fn((cb) => cb(mockPrisma.client)),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemberUseCase,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    useCase = module.get<MemberUseCase>(MemberUseCase);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('getMembers', () => {
    it('should return paginated members', async () => {
      const mockMembers = [
        {
          id: '1',
          role: MemberRole.EMPLOYEE,
          membershipStatus: MembershipStatus.ACTIVE,
          isActive: true,
          status: 'OFFLINE',
          createdAt: new Date(),
          updatedAt: new Date(),
          user: { id: 'u1', name: 'Test User', email: 'test@example.com' },
        },
      ];

      mockPrisma.client.member.count.mockResolvedValue(1);
      mockPrisma.client.member.findMany.mockResolvedValue(mockMembers);

      const result = await useCase.getMembers('org1', { page: 1, limit: 10 });

      expect(result.items).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.items[0].user.email).toBe('test@example.com');
    });
  });

  describe('createMember', () => {
    it('should create a new member and user if not exists', async () => {
      const dto = {
        email: 'new@example.com',
        name: 'New User',
        role: MemberRole.EMPLOYEE,
      };

      mockPrisma.client.user.findUnique.mockResolvedValue(null);
      mockPrisma.client.user.create.mockResolvedValue({ id: 'u2', email: dto.email });
      mockPrisma.client.member.findUnique.mockResolvedValue(null);
      mockPrisma.client.member.create.mockResolvedValue({
        id: 'm2',
        ...dto,
        membershipStatus: MembershipStatus.ACTIVE,
        isActive: true,
      });

      const result = await useCase.createMember('org1', dto);

      expect(result.id).toBe('m2');
      expect(mockPrisma.client.user.create).toHaveBeenCalled();
      expect(mockPrisma.client.member.create).toHaveBeenCalled();
    });

    it('should throw error if user is already a member', async () => {
      const dto = {
        email: 'existing@example.com',
        name: 'Existing',
        role: MemberRole.EMPLOYEE,
      };

      mockPrisma.client.user.findUnique.mockResolvedValue({ id: 'u3', email: dto.email });
      mockPrisma.client.member.findUnique.mockResolvedValue({ id: 'm3' });

      await expect(useCase.createMember('org1', dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw error if department IDs are invalid', async () => {
      const dto = {
        email: 'new@example.com',
        name: 'New User',
        role: MemberRole.EMPLOYEE,
        departmentIds: ['invalid-dept'],
      };

      mockPrisma.client.department.count.mockResolvedValue(0);

      await expect(useCase.createMember('org1', dto)).rejects.toThrow(BadRequestException);
    });
  });
});
