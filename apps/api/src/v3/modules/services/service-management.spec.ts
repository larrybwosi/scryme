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
                findFirstOrThrow: vi.fn(),
                update: vi.fn(),
                updateMany: vi.fn(),
                delete: vi.fn(),
                deleteMany: vi.fn(),
              },
              service: {
                create: vi.fn(),
                findMany: vi.fn(),
                findUnique: vi.fn(),
                findFirst: vi.fn(),
                findFirstOrThrow: vi.fn(),
                update: vi.fn(),
                updateMany: vi.fn(),
                delete: vi.fn(),
                deleteMany: vi.fn(),
              },
              serviceStaffAssignment: {
                deleteMany: vi.fn(),
                createMany: vi.fn(),
              },
              serviceResourceAssignment: {
                deleteMany: vi.fn(),
                createMany: vi.fn(),
              },
              serviceMaterial: {
                deleteMany: vi.fn(),
                createMany: vi.fn(),
              },
              serviceTaxRate: {
                deleteMany: vi.fn(),
                createMany: vi.fn(),
              },
              serviceResource: {
                create: vi.fn(),
                findMany: vi.fn(),
                findFirst: vi.fn(),
                findFirstOrThrow: vi.fn(),
                count: vi.fn(),
                update: vi.fn(),
                updateMany: vi.fn(),
                delete: vi.fn(),
                deleteMany: vi.fn(),
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
    it('should update a category using updateMany for multi-tenant isolation', async () => {
      const orgId = 'org1';
      const catId = 'cat1';
      const dto = { name: 'Updated Name' };

      vi.spyOn(prisma.client.serviceCategory, 'findFirst').mockResolvedValue({ id: catId, organizationId: orgId } as any);
      vi.spyOn(prisma.client.serviceCategory, 'updateMany').mockResolvedValue({ count: 1 } as any);
      vi.spyOn(prisma.client.serviceCategory, 'findFirstOrThrow').mockResolvedValue({ id: catId, organizationId: orgId, ...dto } as any);

      const result = await service.updateCategory(orgId, catId, dto);

      expect(prisma.client.serviceCategory.findFirst).toHaveBeenCalledWith({
        where: { id: catId, organizationId: orgId }
      });
      expect(prisma.client.serviceCategory.updateMany).toHaveBeenCalledWith({
        where: { id: catId, organizationId: orgId },
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

  describe('deleteCategory', () => {
    it('should delete a category using deleteMany scoped to organizationId', async () => {
      const orgId = 'org1';
      const catId = 'cat1';
      const mockCategory = { id: catId, organizationId: orgId, name: 'Cat to Delete' };

      vi.spyOn(prisma.client.serviceCategory, 'findFirst').mockResolvedValue(mockCategory as any);
      vi.spyOn(prisma.client.serviceCategory, 'deleteMany').mockResolvedValue({ count: 1 } as any);

      const result = await service.deleteCategory(orgId, catId);

      expect(prisma.client.serviceCategory.deleteMany).toHaveBeenCalledWith({
        where: { id: catId, organizationId: orgId }
      });
      expect(result).toEqual(mockCategory);
    });
  });

  describe('updateService', () => {
    it('should update a service using updateMany for tenant isolation and handle relations', async () => {
        const orgId = 'org1';
        const serviceId = 'srv1';
        const dto = {
            name: 'New Service Name',
            staffIds: ['member1'],
            resourceIds: ['res1']
        };

        const mockUpdatedService = { id: serviceId, organizationId: orgId, name: dto.name };

        vi.spyOn(prisma.client.service, 'findFirst').mockResolvedValue({ id: serviceId, organizationId: orgId } as any);
        vi.spyOn(prisma.client.service, 'updateMany').mockResolvedValue({ count: 1 } as any);
        vi.spyOn(prisma.client.member, 'count').mockResolvedValue(1);
        vi.spyOn(prisma.client.serviceResource, 'count').mockResolvedValue(1);
        vi.spyOn(service, 'getServiceById').mockResolvedValue(mockUpdatedService as any);

        const result = await service.updateService(orgId, serviceId, dto);

        expect(prisma.client.service.updateMany).toHaveBeenCalledWith({
            where: { id: serviceId, organizationId: orgId },
            data: expect.objectContaining({
                name: dto.name,
            })
        });
        expect(prisma.client.serviceStaffAssignment.deleteMany).toHaveBeenCalledWith({ where: { serviceId } });
        expect(prisma.client.serviceStaffAssignment.createMany).toHaveBeenCalledWith({
          data: [{ serviceId, memberId: 'member1' }]
        });
        expect(prisma.client.serviceResourceAssignment.deleteMany).toHaveBeenCalledWith({ where: { serviceId } });
        expect(prisma.client.serviceResourceAssignment.createMany).toHaveBeenCalledWith({
          data: [{ serviceId, resourceId: 'res1' }]
        });
        expect(result).toEqual(mockUpdatedService);
    });
  });

  describe('deleteService', () => {
    it('should delete a service using deleteMany scoped to organizationId', async () => {
      const orgId = 'org1';
      const serviceId = 'srv1';
      const mockService = { id: serviceId, organizationId: orgId, name: 'Service to Delete' };

      vi.spyOn(prisma.client.service, 'findFirst').mockResolvedValue(mockService as any);
      vi.spyOn(prisma.client.service, 'deleteMany').mockResolvedValue({ count: 1 } as any);

      const result = await service.deleteService(orgId, serviceId);

      expect(prisma.client.service.deleteMany).toHaveBeenCalledWith({
        where: { id: serviceId, organizationId: orgId }
      });
      expect(result).toEqual(mockService);
    });
  });

  describe('updateResource & deleteResource', () => {
    it('should update a service resource using updateMany and findFirstOrThrow', async () => {
      const orgId = 'org1';
      const resId = 'res1';
      const dto = { name: 'Updated Resource' };

      vi.spyOn(prisma.client.serviceResource, 'findFirst').mockResolvedValue({ id: resId, organizationId: orgId } as any);
      vi.spyOn(prisma.client.serviceResource, 'updateMany').mockResolvedValue({ count: 1 } as any);
      vi.spyOn(prisma.client.serviceResource, 'findFirstOrThrow').mockResolvedValue({ id: resId, organizationId: orgId, ...dto } as any);

      const result = await service.updateResource(orgId, resId, dto);

      expect(prisma.client.serviceResource.updateMany).toHaveBeenCalledWith({
        where: { id: resId, organizationId: orgId },
        data: dto
      });
      expect(result.name).toBe(dto.name);
    });

    it('should delete a service resource using deleteMany scoped to organizationId', async () => {
      const orgId = 'org1';
      const resId = 'res1';
      const mockRes = { id: resId, organizationId: orgId, name: 'Oven' };

      vi.spyOn(prisma.client.serviceResource, 'findFirst').mockResolvedValue(mockRes as any);
      vi.spyOn(prisma.client.serviceResource, 'deleteMany').mockResolvedValue({ count: 1 } as any);

      const result = await service.deleteResource(orgId, resId);

      expect(prisma.client.serviceResource.deleteMany).toHaveBeenCalledWith({
        where: { id: resId, organizationId: orgId }
      });
      expect(result).toEqual(mockRes);
    });
  });

  describe('getServicesPaginated', () => {
    it('should query active services paginated and select only required columns', async () => {
      const orgId = 'org1';
      const pagination = { limit: 10, offset: 5 };
      const mockServices = [
        { id: 'srv1', name: 'Haircut', category: { id: 'cat1', name: 'Grooming' } }
      ];

      vi.spyOn(prisma.client.service, 'findMany').mockResolvedValue(mockServices as any);

      const result = await service.getServicesPaginated(orgId, pagination);

      expect(prisma.client.service.findMany).toHaveBeenCalledWith({
        where: { organizationId: orgId },
        take: 10,
        skip: 5,
        select: expect.objectContaining({
          id: true,
          name: true,
          category: {
            select: {
              id: true,
              name: true,
            }
          }
        }),
      });

      expect(result).toEqual(mockServices);
    });
  });

  describe('registerCustomerApp', () => {
    it('should hash the clientSecret and return raw clientSecret along with the client', async () => {
      const orgId = 'org1';
      const name = 'Test App';
      const mockClient = {
        id: 'client1',
        organizationId: orgId,
        name,
        clientId: 'client_123',
        clientSecret: 'hashed_secret',
        scopes: ['read', 'write', 'customer'],
      };

      vi.spyOn(prisma.client.v3ApiClient, 'create').mockResolvedValue(mockClient as any);

      const result = await service.registerCustomerApp(orgId, name);

      expect(prisma.client.v3ApiClient.create).toHaveBeenCalledWith({
        data: {
          organizationId: orgId,
          name,
          clientId: expect.stringMatching(/^client_[a-f0-9]{16}$/),
          clientSecret: expect.stringMatching(/^[a-f0-9]{64}$/), // SHA-256 hash length is 64 hex characters
          scopes: ['read', 'write', 'customer'],
        },
      });

      expect(result.clientId).toBe(mockClient.clientId);
      // result.clientSecret should be the raw (unhashed) hex string which is 64 characters long
      expect(result.clientSecret).toHaveLength(64);
      expect(result.clientSecret).not.toBe('hashed_secret');
    });
  });
});
