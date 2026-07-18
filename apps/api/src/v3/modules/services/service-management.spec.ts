import { Test, TestingModule } from '@nestjs/testing';
import { ServiceManagementService } from './application/services/service-management.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';

describe('ServiceManagementService', () => {
  let service: ServiceManagementService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceManagementService,
        {
          provide: PrismaService,
          useValue: {
            client: {
              serviceCategory: {
                create: vi.fn(),
                findMany: vi.fn(),
                findFirst: vi.fn(),
                update: vi.fn(),
                delete: vi.fn(),
              },
              service: {
                create: vi.fn(),
                findMany: vi.fn(),
                findUnique: vi.fn(),
                findFirst: vi.fn(),
                update: vi.fn(),
                delete: vi.fn(),
              },
              serviceResource: {
                create: vi.fn(),
                findMany: vi.fn(),
                findFirst: vi.fn(),
                count: vi.fn(),
                update: vi.fn(),
                delete: vi.fn(),
              },
              member: {
                count: vi.fn(),
              },
              taxRate: {
                count: vi.fn(),
              },
              productVariant: {
                count: vi.fn(),
              },
              v3ApiClient: {
                create: vi.fn(),
              }
            }
          },
        },
      ],
    }).compile();

    service = module.get<ServiceManagementService>(ServiceManagementService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateCategory', () => {
    it('should update a category if it belongs to the organization', async () => {
      const orgId = 'org1';
      const catId = 'cat1';
      const dto = { name: 'Updated Name' };

      vi.spyOn(prisma.client.serviceCategory, 'findFirst').mockResolvedValue({ id: catId, organizationId: orgId } as any);
      vi.spyOn(prisma.client.serviceCategory, 'update').mockResolvedValue({ id: catId, ...dto } as any);

      const result = await service.updateCategory(orgId, catId, dto);

      expect(prisma.client.serviceCategory.findFirst).toHaveBeenCalledWith({
        where: { id: catId, organizationId: orgId }
      });
      expect(prisma.client.serviceCategory.update).toHaveBeenCalledWith({
        where: { id: catId },
        data: dto
      });
      expect(result.name).toBe(dto.name);
    });

    it('should throw NotFoundException if category does not exist for the org', async () => {
      vi.spyOn(prisma.client.serviceCategory, 'findFirst').mockResolvedValue(null);

      await expect(service.updateCategory('org1', 'cat1', { name: 'New' }))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('updateService', () => {
    it('should update a service and its relations', async () => {
        const orgId = 'org1';
        const serviceId = 'srv1';
        const dto = {
            name: 'New Service Name',
            staffIds: ['member1'],
            resourceIds: ['res1']
        };

        vi.spyOn(prisma.client.service, 'findFirst').mockResolvedValue({ id: serviceId, organizationId: orgId } as any);
        vi.spyOn(prisma.client.service, 'update').mockResolvedValue({ id: serviceId, ...dto } as any);
        vi.spyOn(prisma.client.member, 'count').mockResolvedValue(1);
        vi.spyOn(prisma.client.serviceResource, 'count').mockResolvedValue(1);

        await service.updateService(orgId, serviceId, dto);

        expect(prisma.client.service.update).toHaveBeenCalledWith({
            where: { id: serviceId },
            data: expect.objectContaining({
                name: dto.name,
                staff: {
                    deleteMany: {},
                    create: [{ memberId: 'member1' }]
                },
                resources: {
                    deleteMany: {},
                    create: [{ resourceId: 'res1' }]
                }
            })
        });
    });
  });
});
