import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { RegisterDeviceDto, SwitchOrgDto } from "../dto/android.dto";

@Injectable()
export class AndroidUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(v3Context: any, user: any) {
    const { organizationId, memberId } = v3Context;

    const organization = await this.prisma.client.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        currency: true,
        timeZone: true,
      },
    });

    if (!organization) {
      throw new NotFoundException("Organization not found");
    }

    let member = null;
    if (memberId) {
      member = await this.prisma.client.member.findUnique({
        where: { id: memberId },
        select: {
          id: true,
          role: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
            },
          },
        },
      });
    }

    // Fetch user's available organizations/memberships
    const userId = user?.id || member?.user?.id;
    let memberships: Array<{ organizationId: string; name: string; slug: string; role: string }> = [];

    if (userId) {
      const userMemberships = await this.prisma.client.member.findMany({
        where: {
          userId,
          deletedAt: null,
          organization: { isSuspended: false },
        },
        select: {
          role: true,
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      memberships = userMemberships.map((m) => ({
        organizationId: m.organization.id,
        name: m.organization.name,
        slug: m.organization.slug,
        role: m.role,
      }));
    }

    // Fetch organization locations accessible to android devices
    const locations = await this.prisma.client.location.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
        isPrimary: true,
      },
    });

    return {
      user: {
        id: userId || null,
        email: user?.email || member?.user?.email || null,
        name: user?.name || member?.user?.name || null,
        image: user?.image || member?.user?.image || null,
      },
      member: member ? { id: member.id, role: member.role } : null,
      activeOrganization: organization,
      memberships,
      locations,
    };
  }

  async switchOrganization(v3Context: any, user: any, dto: SwitchOrgDto) {
    const userId = user?.id;
    if (!userId) {
      throw new ForbiddenException("User context required to switch organization");
    }

    // Verify user belongs to target organization
    const member = await this.prisma.client.member.findFirst({
      where: {
        organizationId: dto.organizationId,
        userId,
        deletedAt: null,
        organization: { isSuspended: false },
      },
      select: {
        id: true,
        role: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            currency: true,
            timeZone: true,
          },
        },
      },
    });

    if (!member) {
      throw new ForbiddenException("You are not an active member of this organization");
    }

    // Update user's activeOrganizationId in database
    await this.prisma.client.user.update({
      where: { id: userId },
      data: { activeOrganizationId: dto.organizationId },
    });

    return {
      success: true,
      activeOrganization: member.organization,
      member: {
        id: member.id,
        role: member.role,
      },
    };
  }

  async registerDevice(v3Context: any, dto: RegisterDeviceDto) {
    const { organizationId, memberId } = v3Context;

    // Register or update DeviceRegistry for Android app
    const registry = await this.prisma.client.deviceRegistry.upsert({
      where: {
        serialNumber: dto.deviceId,
      },
      create: {
        serialNumber: dto.deviceId,
        deviceName: dto.modelName || `Android Device (${dto.deviceId.slice(0, 8)})`,
        organizationId,
        deviceType: "ANDROID_APP",
        status: "ACTIVE",
        appVersion: dto.appVersion || "1.0.0",
        metadata: {
          osVersion: dto.osVersion,
          pushToken: dto.pushToken,
          registeredByMemberId: memberId,
          ...(dto.metadata || {}),
        },
      },
      update: {
        organizationId,
        deviceName: dto.modelName || undefined,
        status: "ACTIVE",
        appVersion: dto.appVersion || undefined,
        lastSeenAt: new Date(),
        metadata: {
          osVersion: dto.osVersion,
          pushToken: dto.pushToken,
          updatedByMemberId: memberId,
          ...(dto.metadata || {}),
        },
      },
    });

    return {
      success: true,
      device: {
        id: registry.id,
        deviceId: registry.serialNumber,
        deviceName: registry.deviceName,
        status: registry.status,
        appVersion: registry.appVersion,
        lastSeenAt: registry.lastSeenAt,
      },
    };
  }

  async getDashboardSummary(v3Context: any) {
    const { organizationId } = v3Context;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [salesAggregate, pendingOrdersCount, lowStockCount, totalCustomers] =
      await Promise.all([
        this.prisma.client.saleTransaction.aggregate({
          where: {
            organizationId,
            createdAt: { gte: todayStart },
          },
          _sum: { totalAmount: true },
          _count: { id: true },
        }),
        this.prisma.client.order.count({
          where: {
            organizationId,
            status: { in: ["PENDING", "PROCESSING", "CONFIRMED"] },
          },
        }),
        this.prisma.client.productVariantStock.count({
          where: {
            organizationId,
            currentStock: { lte: 5 },
          },
        }),
        this.prisma.client.customer.count({
          where: { organizationId },
        }),
      ]);

    return {
      todaySales: {
        totalAmount: salesAggregate._sum.totalAmount || 0,
        transactionCount: salesAggregate._count.id || 0,
      },
      pendingOrdersCount,
      lowStockCount,
      totalCustomers,
    };
  }
}
