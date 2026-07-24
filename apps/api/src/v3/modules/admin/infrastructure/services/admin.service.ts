import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  BanUserDto,
  SetGlobalSettingDto,
  DefineTierDto,
  UpdateSubscriptionDto,
  RecordCustomPaymentDto,
  CreateIntegrationDefinitionDto,
  UpdateIntegrationDefinitionDto,
} from "../../application/dto/admin.dto";
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

  // --- Global Settings Operations ---

  async listGlobalSettings() {
    return this.prisma.client.globalSetting.findMany({
      orderBy: { key: "asc" },
    });
  }

  async setGlobalSetting(dto: SetGlobalSettingDto) {
    return this.prisma.client.globalSetting.upsert({
      where: { key: dto.key },
      update: { value: dto.value },
      create: { key: dto.key, value: dto.value },
    });
  }

  async deleteGlobalSetting(key: string) {
    const existing = await this.prisma.client.globalSetting.findUnique({
      where: { key },
    });
    if (!existing) {
      throw new NotFoundException(`Global setting with key "${key}" not found`);
    }
    return this.prisma.client.globalSetting.delete({
      where: { key },
    });
  }

  // --- Global Tiers Operations (Plan limits/attributes) ---

  async listTiers(): Promise<DefineTierDto[]> {
    const setting = await this.prisma.client.globalSetting.findUnique({
      where: { key: "system:tiers" },
    });
    if (!setting) {
      return [];
    }
    try {
      return JSON.parse(setting.value);
    } catch {
      return [];
    }
  }

  async defineTier(dto: DefineTierDto) {
    const currentTiers = await this.listTiers();
    const existingIndex = currentTiers.findIndex((t) => t.slug === dto.slug);

    const tierData: DefineTierDto = {
      slug: dto.slug,
      name: dto.name,
      price: dto.price,
      description: dto.description || "",
      limits: dto.limits || {},
      features: dto.features || [],
    };

    if (existingIndex > -1) {
      currentTiers[existingIndex] = tierData;
    } else {
      currentTiers.push(tierData);
    }

    await this.prisma.client.globalSetting.upsert({
      where: { key: "system:tiers" },
      update: { value: JSON.stringify(currentTiers) },
      create: { key: "system:tiers", value: JSON.stringify(currentTiers) },
    });

    return tierData;
  }

  async deleteTier(slug: string) {
    const currentTiers = await this.listTiers();
    const filtered = currentTiers.filter((t) => t.slug !== slug);

    if (filtered.length === currentTiers.length) {
      throw new NotFoundException(`Tier with slug "${slug}" not found`);
    }

    await this.prisma.client.globalSetting.update({
      where: { key: "system:tiers" },
      data: { value: JSON.stringify(filtered) },
    });

    return { success: true, message: `Tier with slug "${slug}" deleted successfully` };
  }

  // --- Organization Subscriptions ---

  async getOrganizationSubscription(orgId: string) {
    await this.getOrganizationDetails(orgId);

    const sub = await this.prisma.client.subscription.findUnique({
      where: { organizationId: orgId },
    });

    if (!sub) {
      return {
        organizationId: orgId,
        tierSlug: "free",
        dodoCustomerId: null,
        dodoSubscriptionId: null,
        dodoPriceId: null,
        dodoCurrentPeriodEnd: null,
      };
    }

    return {
      id: sub.id,
      organizationId: sub.organizationId,
      tierSlug: sub.dodoPriceId || "free",
      dodoCustomerId: sub.dodoCustomerId,
      dodoSubscriptionId: sub.dodoSubscriptionId,
      dodoPriceId: sub.dodoPriceId,
      dodoCurrentPeriodEnd: sub.dodoCurrentPeriodEnd,
    };
  }

  async updateOrganizationSubscription(orgId: string, dto: UpdateSubscriptionDto) {
    await this.getOrganizationDetails(orgId);

    const currentPeriodEnd = dto.dodoCurrentPeriodEnd ? new Date(dto.dodoCurrentPeriodEnd) : null;

    return this.prisma.client.subscription.upsert({
      where: { organizationId: orgId },
      update: {
        dodoPriceId: dto.tierSlug,
        dodoCustomerId: dto.dodoCustomerId || null,
        dodoSubscriptionId: dto.dodoSubscriptionId || null,
        dodoCurrentPeriodEnd: currentPeriodEnd,
      },
      create: {
        organizationId: orgId,
        dodoPriceId: dto.tierSlug,
        dodoCustomerId: dto.dodoCustomerId || null,
        dodoSubscriptionId: dto.dodoSubscriptionId || null,
        dodoCurrentPeriodEnd: currentPeriodEnd,
      },
    });
  }

  // --- System Payments Tracking ---

  async listSystemPayments() {
    return this.prisma.client.mpesaPaymentRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
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

  async recordCustomPayment(dto: RecordCustomPaymentDto) {
    await this.getOrganizationDetails(dto.organizationId);

    const firstMember = await this.prisma.client.member.findFirst({
      where: { organizationId: dto.organizationId },
    });

    if (!firstMember) {
      throw new BadRequestException(
        `Organization "${dto.organizationId}" has no members to associate the payment with`,
      );
    }

    return this.prisma.client.$transaction(async (tx) => {
      const payReq = await tx.mpesaPaymentRequest.create({
        data: {
          organizationId: dto.organizationId,
          memberId: firstMember.id,
          checkoutRequestId: `admin-${Date.now()}`,
          merchantRequestId: `admin-merchant-${Date.now()}`,
          amount: dto.amount,
          phoneNumber: dto.phoneNumber,
          reference: dto.reference,
          status: "SUCCESS",
          resultCode: 0,
          resultDescription: dto.notes || "Admin recorded custom plan payment",
          mpesaReceiptNumber: dto.reference,
          transactionDate: new Date(),
        },
      });

      if (dto.tierSlug) {
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

        await tx.subscription.upsert({
          where: { organizationId: dto.organizationId },
          update: {
            dodoPriceId: dto.tierSlug,
            dodoCurrentPeriodEnd: oneYearFromNow,
            dodoSubscriptionId: `custom-sub-${dto.reference}`,
          },
          create: {
            organizationId: dto.organizationId,
            dodoPriceId: dto.tierSlug,
            dodoCurrentPeriodEnd: oneYearFromNow,
            dodoSubscriptionId: `custom-sub-${dto.reference}`,
          },
        });
      }

      return payReq;
    });
  }

  // --- Global Integration Definitions Operations ---

  async listIntegrationDefinitions() {
    return this.prisma.client.integrationDefinition.findMany({
      orderBy: { name: "asc" },
    });
  }

  async createIntegrationDefinition(dto: CreateIntegrationDefinitionDto) {
    const existing = await this.prisma.client.integrationDefinition.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new BadRequestException(`Integration with slug "${dto.slug}" already exists`);
    }

    return this.prisma.client.integrationDefinition.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description || null,
        logoUrl: dto.logoUrl || null,
        category: dto.category,
        authType: dto.authType,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });
  }

  async updateIntegrationDefinition(id: string, dto: UpdateIntegrationDefinitionDto) {
    const existing = await this.prisma.client.integrationDefinition.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Integration definition with ID ${id} not found`);
    }

    if (dto.slug && dto.slug !== existing.slug) {
      const duplicate = await this.prisma.client.integrationDefinition.findUnique({
        where: { slug: dto.slug },
      });
      if (duplicate) {
        throw new BadRequestException(`Integration with slug "${dto.slug}" already exists`);
      }
    }

    return this.prisma.client.integrationDefinition.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description !== undefined ? dto.description : undefined,
        logoUrl: dto.logoUrl !== undefined ? dto.logoUrl : undefined,
        category: dto.category,
        authType: dto.authType,
        isActive: dto.isActive !== undefined ? dto.isActive : undefined,
      },
    });
  }

  async deleteIntegrationDefinition(id: string) {
    const existing = await this.prisma.client.integrationDefinition.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Integration definition with ID ${id} not found`);
    }

    return this.prisma.client.integrationDefinition.delete({
      where: { id },
    });
  }

  // --- Active Organization Integrations List ---

  async listActiveOrganizationIntegrations() {
    return this.prisma.client.organizationIntegration.findMany({
      where: { isActive: true },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        integrationDefinition: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  }
}
