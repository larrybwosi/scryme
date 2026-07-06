import { Injectable, ConflictException, NotFoundException, Inject } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateServiceDto, CreateServiceCategoryDto, UpdateServiceDto, UpdateServiceCategoryDto, UpdateServiceResourceDto, CreateServiceResourceDto } from "../dto/service.dto";
import { notificationEngine } from "@repo/notifications";
import * as crypto from "crypto";

@Injectable()
export class ServiceManagementService {
  constructor(private readonly prisma: PrismaService) {}

  async createCategory(orgId: string, dto: CreateServiceCategoryDto) {
    return this.prisma.serviceCategory.create({
      data: {
        ...dto,
        organizationId: orgId,
      },
    });
  }

  async updateCategory(orgId: string, id: string, dto: UpdateServiceCategoryDto) {
    const category = await this.prisma.serviceCategory.findFirst({
        where: { id, organizationId: orgId }
    });

    if (!category) throw new NotFoundException("Category not found");

    return this.prisma.serviceCategory.update({
        where: { id },
        data: dto
    });
  }

  async deleteCategory(orgId: string, id: string) {
    const category = await this.prisma.serviceCategory.findFirst({
        where: { id, organizationId: orgId }
    });

    if (!category) throw new NotFoundException("Category not found");

    return this.prisma.serviceCategory.delete({
        where: { id }
    });
  }

  async getCategories(orgId: string) {
    return this.prisma.serviceCategory.findMany({
      where: { organizationId: orgId },
      include: { subcategories: true },
    });
  }

  async createService(orgId: string, dto: CreateServiceDto) {
    const { staffIds, resourceIds, materials, taxRateIds, ...serviceData } = dto;

    // Check for existing SKU
    const existing = await this.prisma.service.findUnique({
      where: { sku: dto.sku },
    });

    if (existing) {
      throw new ConflictException(`Service with SKU ${dto.sku} already exists`);
    }

    return this.prisma.service.create({
      data: {
        ...serviceData,
        organizationId: orgId,
        staff: staffIds ? {
          create: staffIds.map(id => ({ memberId: id }))
        } : undefined,
        resources: resourceIds ? {
          create: resourceIds.map(id => ({ resourceId: id }))
        } : undefined,
        materials: materials ? {
          create: materials.map(m => ({ variantId: m.variantId, quantity: m.quantity }))
        } : undefined,
        taxRates: taxRateIds ? {
          create: taxRateIds.map(id => ({ taxRateId: id }))
        } : undefined,
      },
    });
  }

  async updateService(orgId: string, id: string, dto: UpdateServiceDto) {
    const service = await this.prisma.service.findFirst({
        where: { id, organizationId: orgId }
    });

    if (!service) throw new NotFoundException("Service not found");

    const { staffIds, resourceIds, materials, taxRateIds, ...serviceData } = dto;

    return this.prisma.service.update({
        where: { id },
        data: {
            ...serviceData,
            staff: staffIds ? {
                deleteMany: {},
                create: staffIds.map(id => ({ memberId: id }))
            } : undefined,
            resources: resourceIds ? {
                deleteMany: {},
                create: resourceIds.map(id => ({ resourceId: id }))
            } : undefined,
            materials: materials ? {
                deleteMany: {},
                create: materials.map(m => ({ variantId: m.variantId, quantity: m.quantity }))
            } : undefined,
            taxRates: taxRateIds ? {
                deleteMany: {},
                create: taxRateIds.map(id => ({ taxRateId: id }))
            } : undefined,
        }
    });
  }

  async deleteService(orgId: string, id: string) {
    const service = await this.prisma.service.findFirst({
        where: { id, organizationId: orgId }
    });

    if (!service) throw new NotFoundException("Service not found");

    return this.prisma.service.delete({
        where: { id }
    });
  }

  async getServices(orgId: string, options?: { isActive?: boolean }) {
    return this.prisma.service.findMany({
      where: {
          organizationId: orgId,
          ...(options?.isActive !== undefined ? { isActive: options.isActive } : {}),
      },
      include: {
        category: true,
        staff: { include: { member: { include: { user: true } } } },
        resources: { include: { resource: true } }
      },
    });
  }

  async getServiceById(orgId: string, id: string) {
    const service = await this.prisma.service.findFirst({
      where: { id, organizationId: orgId },
      include: {
        category: true,
        staff: { include: { member: { include: { user: true } } } },
        resources: { include: { resource: true } },
        materials: { include: { variant: true } },
        taxRates: { include: { taxRate: true } }
      },
    });

    if (!service) throw new NotFoundException("Service not found");
    return service;
  }

  async createResource(orgId: string, dto: CreateServiceResourceDto) {
    return this.prisma.serviceResource.create({
        data: {
            ...dto,
            organizationId: orgId
        }
    });
  }

  async updateResource(orgId: string, id: string, dto: UpdateServiceResourceDto) {
    const resource = await this.prisma.serviceResource.findFirst({
        where: { id, organizationId: orgId }
    });

    if (!resource) throw new NotFoundException("Resource not found");

    return this.prisma.serviceResource.update({
        where: { id },
        data: dto
    });
  }

  async deleteResource(orgId: string, id: string) {
    const resource = await this.prisma.serviceResource.findFirst({
        where: { id, organizationId: orgId }
    });

    if (!resource) throw new NotFoundException("Resource not found");

    return this.prisma.serviceResource.delete({
        where: { id }
    });
  }

  async getResources(orgId: string) {
    return this.prisma.serviceResource.findMany({
        where: { organizationId: orgId }
    });
  }

  async registerCustomerApp(orgId: string, name: string) {
      const clientId = `client_${crypto.randomBytes(8).toString('hex')}`;
      const clientSecret = crypto.randomBytes(32).toString('hex');

      return this.prisma.v3ApiClient.create({
          data: {
              organizationId: orgId,
              name,
              clientId,
              clientSecret, // In production, this should be hashed
              scopes: ["read", "write", "customer"],
          }
      });
  }
}
