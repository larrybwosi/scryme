import { Injectable, ConflictException, NotFoundException, BadRequestException, Inject } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateServiceDto, CreateServiceCategoryDto, UpdateServiceDto, UpdateServiceCategoryDto, UpdateServiceResourceDto, CreateServiceResourceDto } from "../dto/service.dto";
import { notificationEngine } from "@repo/notifications";
import * as crypto from "crypto";

@Injectable()
export class ServiceManagementService {
  constructor(private readonly prisma: PrismaService) {}

  async createCategory(orgId: string, dto: CreateServiceCategoryDto) {
    if (dto.parentId) {
      const parent = await this.prisma.client.serviceCategory.findFirst({
        where: { id: dto.parentId, organizationId: orgId }
      });
      if (!parent) {
        throw new BadRequestException("Parent category does not exist or does not belong to this organization");
      }
    }

    return this.prisma.client.serviceCategory.create({
      data: {
        ...dto,
        organizationId: orgId,
      },
    });
  }

  async updateCategory(orgId: string, id: string, dto: UpdateServiceCategoryDto) {
    const category = await this.prisma.client.serviceCategory.findFirst({
        where: { id, organizationId: orgId }
    });

    if (!category) throw new NotFoundException("Category not found");

    if (dto.parentId) {
      const parent = await this.prisma.client.serviceCategory.findFirst({
        where: { id: dto.parentId, organizationId: orgId }
      });
      if (!parent) {
        throw new BadRequestException("Parent category does not exist or does not belong to this organization");
      }
    }

    return this.prisma.client.serviceCategory.update({
        where: { id },
        data: dto
    });
  }

  async deleteCategory(orgId: string, id: string) {
    const category = await this.prisma.client.serviceCategory.findFirst({
        where: { id, organizationId: orgId }
    });

    if (!category) throw new NotFoundException("Category not found");

    return this.prisma.client.serviceCategory.delete({
        where: { id }
    });
  }

  async getCategories(orgId: string) {
    return this.prisma.client.serviceCategory.findMany({
      where: { organizationId: orgId },
      include: { subcategories: true },
    });
  }

  async createService(orgId: string, dto: CreateServiceDto) {
    const { staffIds, resourceIds, materials, taxRateIds, ...serviceData } = dto;

    // Validate category
    const category = await this.prisma.client.serviceCategory.findFirst({
      where: { id: dto.categoryId, organizationId: orgId }
    });
    if (!category) {
      throw new BadRequestException("Service category does not exist or does not belong to this organization");
    }

    // Validate staff
    if (staffIds && staffIds.length > 0) {
      const staffCount = await this.prisma.client.member.count({
        where: { id: { in: staffIds }, organizationId: orgId }
      });
      if (staffCount !== staffIds.length) {
        throw new BadRequestException("One or more staff members are invalid or do not belong to this organization");
      }
    }

    // Validate resources
    if (resourceIds && resourceIds.length > 0) {
      const resourceCount = await this.prisma.client.serviceResource.count({
        where: { id: { in: resourceIds }, organizationId: orgId }
      });
      if (resourceCount !== resourceIds.length) {
        throw new BadRequestException("One or more service resources are invalid or do not belong to this organization");
      }
    }

    // Validate tax rates
    if (taxRateIds && taxRateIds.length > 0) {
      const taxRateCount = await this.prisma.client.taxRate.count({
        where: { id: { in: taxRateIds }, organizationId: orgId }
      });
      if (taxRateCount !== taxRateIds.length) {
        throw new BadRequestException("One or more tax rates are invalid or do not belong to this organization");
      }
    }

    // Validate materials (product variants)
    if (materials && materials.length > 0) {
      const variantIds = materials.map(m => m.variantId);
      const variantsCount = await this.prisma.client.productVariant.count({
        where: { id: { in: variantIds }, product: { organizationId: orgId } }
      });
      if (variantsCount !== variantIds.length) {
        throw new BadRequestException("One or more materials (variants) are invalid or do not belong to this organization");
      }
    }

    // Check for existing SKU
    const existing = await this.prisma.client.service.findUnique({
      where: { sku: dto.sku },
    });

    if (existing) {
      throw new ConflictException(`Service with SKU ${dto.sku} already exists`);
    }

    return this.prisma.client.service.create({
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
    const service = await this.prisma.client.service.findFirst({
        where: { id, organizationId: orgId }
    });

    if (!service) throw new NotFoundException("Service not found");

    const { staffIds, resourceIds, materials, taxRateIds, ...serviceData } = dto;

    // Validate category if updating it
    if (dto.categoryId) {
      const category = await this.prisma.client.serviceCategory.findFirst({
        where: { id: dto.categoryId, organizationId: orgId }
      });
      if (!category) {
        throw new BadRequestException("Service category does not exist or does not belong to this organization");
      }
    }

    // Validate staff
    if (staffIds && staffIds.length > 0) {
      const staffCount = await this.prisma.client.member.count({
        where: { id: { in: staffIds }, organizationId: orgId }
      });
      if (staffCount !== staffIds.length) {
        throw new BadRequestException("One or more staff members are invalid or do not belong to this organization");
      }
    }

    // Validate resources
    if (resourceIds && resourceIds.length > 0) {
      const resourceCount = await this.prisma.client.serviceResource.count({
        where: { id: { in: resourceIds }, organizationId: orgId }
      });
      if (resourceCount !== resourceIds.length) {
        throw new BadRequestException("One or more service resources are invalid or do not belong to this organization");
      }
    }

    // Validate tax rates
    if (taxRateIds && taxRateIds.length > 0) {
      const taxRateCount = await this.prisma.client.taxRate.count({
        where: { id: { in: taxRateIds }, organizationId: orgId }
      });
      if (taxRateCount !== taxRateIds.length) {
        throw new BadRequestException("One or more tax rates are invalid or do not belong to this organization");
      }
    }

    // Validate materials (product variants)
    if (materials && materials.length > 0) {
      const variantIds = materials.map(m => m.variantId);
      const variantsCount = await this.prisma.client.productVariant.count({
        where: { id: { in: variantIds }, product: { organizationId: orgId } }
      });
      if (variantsCount !== variantIds.length) {
        throw new BadRequestException("One or more materials (variants) are invalid or do not belong to this organization");
      }
    }

    return this.prisma.client.service.update({
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
    const service = await this.prisma.client.service.findFirst({
        where: { id, organizationId: orgId }
    });

    if (!service) throw new NotFoundException("Service not found");

    return this.prisma.client.service.delete({
        where: { id }
    });
  }

  async getServices(orgId: string, options?: { isActive?: boolean }) {
    /**
     * OPTIMIZATION (Bolt ⚡): Replaced broad Prisma 'include' with a targeted nested 'select' block.
     * This avoids over-fetching massive related tables from Member (e.g. settings, tags, emergency contact info, etc.)
     * and User (e.g. password, notification preferences) which are not used in list views.
     * This reduces database I/O, network payloads, and NestJS serialization overhead.
     */
    return this.prisma.client.service.findMany({
      where: {
          organizationId: orgId,
          ...(options?.isActive !== undefined ? { isActive: options.isActive } : {}),
      },
      select: {
        id: true,
        name: true,
        description: true,
        sku: true,
        organizationId: true,
        categoryId: true,
        pricingModel: true,
        price: true,
        minPrice: true,
        requiresDeposit: true,
        depositAmount: true,
        depositType: true,
        estimatedDuration: true,
        bufferTimeBefore: true,
        bufferTimeAfter: true,
        isActive: true,
        customFields: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        staff: {
          select: {
            id: true,
            serviceId: true,
            memberId: true,
            member: {
              select: {
                id: true,
                organizationId: true,
                userId: true,
                role: true,
                membershipStatus: true,
                isActive: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    isActive: true,
                  },
                },
              },
            },
          },
        },
        resources: {
          select: {
            id: true,
            serviceId: true,
            resourceId: true,
            resource: {
              select: {
                id: true,
                name: true,
                type: true,
                isActive: true,
              },
            },
          },
        },
      },
    });
  }

  async getServiceById(orgId: string, id: string) {
    const service = await this.prisma.client.service.findFirst({
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
    return this.prisma.client.serviceResource.create({
        data: {
            ...dto,
            organizationId: orgId
        }
    });
  }

  async updateResource(orgId: string, id: string, dto: UpdateServiceResourceDto) {
    const resource = await this.prisma.client.serviceResource.findFirst({
        where: { id, organizationId: orgId }
    });

    if (!resource) throw new NotFoundException("Resource not found");

    return this.prisma.client.serviceResource.update({
        where: { id },
        data: dto
    });
  }

  async deleteResource(orgId: string, id: string) {
    const resource = await this.prisma.client.serviceResource.findFirst({
        where: { id, organizationId: orgId }
    });

    if (!resource) throw new NotFoundException("Resource not found");

    return this.prisma.client.serviceResource.delete({
        where: { id }
    });
  }

  async getResources(orgId: string) {
    return this.prisma.client.serviceResource.findMany({
        where: { organizationId: orgId }
    });
  }

  async registerCustomerApp(orgId: string, name: string) {
      const clientId = `client_${crypto.randomBytes(8).toString('hex')}`;
      const clientSecret = crypto.randomBytes(32).toString('hex');

      return this.prisma.client.v3ApiClient.create({
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
