import { Test, TestingModule } from '@nestjs/testing';
import { BakeryService } from '../bakery.service';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthService } from '../../../auth/auth.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('BakeryService Baker Management Security', () => {
  let service: BakeryService;
  let prisma: PrismaService;

  const mockPrisma = {
    client: {
      bakeryBaker: {
        create: vi.fn(),
        update: vi.fn(),
        findFirst: vi.fn(),
        delete: vi.fn(),
      },
      bakerySettings: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      member: {
        findFirst: vi.fn(),
      },
    },
  };

  const mockAuthService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BakeryService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    service = module.get<BakeryService>(BakeryService);
    prisma = module.get<PrismaService>(PrismaService);

    vi.clearAllMocks();
  });

  describe('addBaker', () => {
    it('SECURITY FIX: should only allow adding members from the same organization', async () => {
      const orgId = 'org-1';
      const victimMemberId = 'victim-member-id';
      const ctx = { organizationId: orgId } as any;

      // Mock settings lookup
      mockPrisma.client.bakerySettings.findUnique.mockResolvedValue({ id: 'settings-1', organizationId: orgId });

      // Mock member lookup returning null (member not in org or doesn't exist)
      mockPrisma.client.member.findFirst.mockResolvedValue(null);

      await expect(service.addBaker(ctx, { memberId: victimMemberId }))
        .rejects.toThrow(BadRequestException);

      expect(mockPrisma.client.member.findFirst).toHaveBeenCalledWith({
        where: { id: victimMemberId, organizationId: orgId }
      });
      expect(mockPrisma.client.bakeryBaker.create).not.toHaveBeenCalled();
    });

    it('SECURITY FIX: should prevent mass assignment of bakerySettingsId', async () => {
      const orgId = 'org-1';
      const memberId = 'member-1';
      const ctx = { organizationId: orgId } as any;

      mockPrisma.client.bakerySettings.findUnique.mockResolvedValue({ id: 'settings-1', organizationId: orgId });
      mockPrisma.client.member.findFirst.mockResolvedValue({ id: memberId, organizationId: orgId });
      mockPrisma.client.bakeryBaker.create.mockResolvedValue({ id: 'baker-1' });

      await service.addBaker(ctx, {
        memberId,
        bakerySettingsId: 'malicious-settings-id',
        specialties: ['bread']
      });

      expect(mockPrisma.client.bakeryBaker.create).toHaveBeenCalledWith({
        data: {
          memberId,
          specialties: ['bread'],
          isActive: true,
          bakerySettingsId: 'settings-1', // Should use the one from settings lookup, not the input
        }
      });
    });
  });

  describe('updateBaker', () => {
    it('SECURITY FIX: should prevent mass assignment of sensitive fields during update', async () => {
      const orgId = 'org-1';
      const bakerId = 'baker-1';
      const ctx = { organizationId: orgId } as any;

      // Mock ownership check
      mockPrisma.client.bakeryBaker.findFirst.mockResolvedValue({ id: bakerId, bakerySettingsId: 'settings-1' });
      mockPrisma.client.bakeryBaker.update.mockResolvedValue({ id: bakerId });

      await service.updateBaker(ctx, bakerId, {
        specialties: ['pastry'],
        bakerySettingsId: 'attacker-settings-id', // Mass assignment attempt
        memberId: 'attacker-member-id', // Mass assignment attempt
      });

      expect(mockPrisma.client.bakeryBaker.update).toHaveBeenCalledWith({
        where: { id: bakerId },
        data: {
          specialties: ['pastry'],
          isActive: undefined, // Not provided
        }
      });

      const updateData = mockPrisma.client.bakeryBaker.update.mock.calls[0][0].data;
      expect(updateData).not.toHaveProperty('bakerySettingsId');
      expect(updateData).not.toHaveProperty('memberId');
    });
  });
});
