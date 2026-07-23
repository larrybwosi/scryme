import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateOrganizationDto, UpdateOrganizationDto, BanUserDto } from "../../application/dto/admin.dto";
import { MemberRole, MembershipStatus } from "@repo/db";

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Organization Operations ---

  async listOrganizations() {
    return this.prisma.client.organization.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            members: true,
            products: true,
          },
        },
      },
    });
  }

  async getOrganizationDetails(id: string) {
    const org = await this.prisma.client.organization.findUnique({
      where: { id },
      include: {
        settings: true,
        _count: {
          select: {
            members: true,
            products: true,
            transactions: true,
          },
        },
      },
    });

    if (!org) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    return org;
  }

  async createOrganization(dto: CreateOrganizationDto) {
    // Check slug uniqueness
    const existing = await this.prisma.client.organization.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new BadRequestException(`Organization slug "${dto.slug}" is already taken`);
    }

    return this.prisma.client.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          logo: dto.logo,
          description: dto.description,
        },
      });

      // Create default settings
      await tx.organizationSettings.create({
        data: {
          organizationId: org.id,
          defaultCurrency: "USD",
          defaultTimezone: "UTC",
        },
      });

      return org;
    });
  }

  async updateOrganization(id: string, dto: UpdateOrganizationDto) {
    // Verify it exists
    await this.getOrganizationDetails(id);

    if (dto.slug) {
      const existing = await this.prisma.client.organization.findFirst({
        where: {
          slug: dto.slug,
          NOT: { id },
        },
      });

      if (existing) {
        throw new BadRequestException(`Organization slug "${dto.slug}" is already taken`);
      }
    }

    return this.prisma.client.organization.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.slug,
        logo: dto.logo,
        description: dto.description,
      },
    });
  }

  async deleteOrganization(id: string) {
    // Verify it exists
    await this.getOrganizationDetails(id);

    // Soft-delete
    return this.prisma.client.organization.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  // --- Member Operations ---

  async listMembers(query?: { isActive?: boolean; role?: string; organizationId?: string }) {
    const where: any = {};
    if (query?.isActive !== undefined) {
      where.isActive = query.isActive;
    }
    if (query?.role) {
      where.role = query.role as any;
    }
    if (query?.organizationId) {
      where.organizationId = query.organizationId;
    }

    return this.prisma.client.member.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            isActive: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  // --- User Operations & Banning ---

  async listUsers() {
    return this.prisma.client.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        banned: true,
        banReason: true,
        banExpires: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            members: true,
          },
        },
      },
    });
  }

  async banUser(id: string, dto: BanUserDto) {
    const user = await this.prisma.client.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const banReason = dto.banReason || "Violated terms of service";
    const banExpires = dto.banExpires ? new Date(dto.banExpires) : null;

    return this.prisma.client.$transaction(async (tx) => {
      // 1. Update the user
      const updatedUser = await tx.user.update({
        where: { id },
        data: {
          banned: true,
          banReason,
          banExpires,
          isActive: false,
        },
      });

      // 2. Suspend all associated organization member roles
      await tx.member.updateMany({
        where: { userId: id },
        data: {
          isActive: false,
          membershipStatus: MembershipStatus.SUSPENDED,
          banReason,
        },
      });

      return updatedUser;
    });
  }

  async unbanUser(id: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.prisma.client.$transaction(async (tx) => {
      // 1. Update the user
      const updatedUser = await tx.user.update({
        where: { id },
        data: {
          banned: false,
          banReason: null,
          banExpires: null,
          isActive: true,
        },
      });

      // 2. Re-activate all associated organization member roles
      await tx.member.updateMany({
        where: { userId: id },
        data: {
          isActive: true,
          membershipStatus: MembershipStatus.ACTIVE,
          banReason: null,
        },
      });

      return updatedUser;
    });
  }

  // --- Connected Apps & System Logs ---

  async listConnectedApps() {
    return this.prisma.client.oAuthClient.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async listSystemLogs() {
    // Try ActionAuditLog, fall back to empty array if query fails
    try {
      return await this.prisma.client.actionAuditLog.findMany({
        take: 100,
        orderBy: { createdAt: "desc" },
        include: {
          member: {
            select: {
              id: true,
              role: true,
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });
    } catch {
      // Fall back to empty array if table not populated or accessible
      return [];
    }
  }

  // --- Statistics Overview ---

  async getStats() {
    const [
      totalUsers,
      activeUsers,
      totalOrgs,
      totalMembers,
      activeDevices,
      totalConnectedApps,
    ] = await Promise.all([
      this.prisma.client.user.count(),
      this.prisma.client.user.count({ where: { isActive: true, banned: { not: true } } }),
      this.prisma.client.organization.count({ where: { deletedAt: null } }),
      this.prisma.client.member.count({ where: { isActive: true, deletedAt: null } }),
      this.prisma.client.deviceRegistry.count({ where: { status: "ACTIVE" } }),
      this.prisma.client.oAuthClient.count(),
    ]);

    return {
      totalUsers,
      activeUsers,
      totalOrganizations: totalOrgs,
      totalMembers,
      activeDevices,
      totalConnectedApps,
    };
  }
}
