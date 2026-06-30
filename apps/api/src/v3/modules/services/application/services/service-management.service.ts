import { Injectable, ConflictException, NotFoundException, Inject } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateServiceDto, CreateServiceCategoryDto } from "../dto/service.dto";
import { notificationEngine } from "@repo/notifications";

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

  async getServices(orgId: string) {
    return this.prisma.service.findMany({
      where: { organizationId: orgId },
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

  async createResource(orgId: string, data: { name: string, type?: string }) {
    return this.prisma.serviceResource.create({
        data: {
            ...data,
            organizationId: orgId
        }
    });
  }

  async getResources(orgId: string) {
    return this.prisma.serviceResource.findMany({
        where: { organizationId: orgId }
    });
  }
}
