import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { RegisterDeviceDto, SwitchOrgDto } from "../dto/android.dto";

@Injectable()
export class AndroidUseCase {
  constructor(private readonly prisma: PrismaService) {}

  private getCurrencySymbol(currency: string): string {
    const symbolMap: Record<string, string> = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      KES: "KSh",
      NGN: "₦",
      JPY: "¥",
      CAD: "CA$",
      AUD: "A$",
      INR: "₹",
      GHS: "GH₵",
      ZAR: "R",
      UGX: "UGX",
      TZS: "TZS",
      RWF: "RF",
      ETB: "Br",
    };
    return symbolMap[currency?.toUpperCase()] || currency || "$";
  }

  async getMe(v3Context: any, user: any) {
    const { organizationId, memberId } = v3Context;

    const organization = await this.prisma.client.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        settings: {
          select: {
            defaultCurrency: true,
            defaultTimezone: true,
            country: true,
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException("Organization not found");
    }

    const currency = organization.settings?.defaultCurrency || "USD";
    const currencySymbol = this.getCurrencySymbol(currency);

    const activeOrganization = {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      logo: organization.logo,
      currency,
      currencySymbol,
      settings: organization.settings || {
        defaultCurrency: currency,
        defaultTimezone: "UTC",
        country: null,
      },
    };

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

    // Fetch organization inventory locations accessible to android devices
    const locations = await this.prisma.client.inventoryLocation.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        code: true,
        isDefault: true,
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
      activeOrganization,
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
        organizationId: true,
      },
    });

    if (!member) {
      throw new ForbiddenException("You are not an active member of this organization");
    }

    const targetOrg = await this.prisma.client.organization.findUnique({
      where: { id: dto.organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        settings: {
          select: {
            defaultCurrency: true,
            defaultTimezone: true,
            country: true,
          },
        },
      },
    });

    if (!targetOrg) {
      throw new NotFoundException("Target organization not found");
    }

    const currency = targetOrg.settings?.defaultCurrency || "USD";
    const currencySymbol = this.getCurrencySymbol(currency);

    const activeOrganization = {
      id: targetOrg.id,
      name: targetOrg.name,
      slug: targetOrg.slug,
      logo: targetOrg.logo,
      currency,
      currencySymbol,
      settings: targetOrg.settings || {
        defaultCurrency: currency,
        defaultTimezone: "UTC",
        country: null,
      },
    };

    // Update user's activeOrganizationId in database
    await this.prisma.client.user.update({
      where: { id: userId },
      data: { activeOrganizationId: dto.organizationId },
    });

    return {
      success: true,
      activeOrganization,
      member: {
        id: member.id,
        role: member.role,
      },
    };
  }

  async registerDevice(v3Context: any, dto: RegisterDeviceDto) {
    const { organizationId, memberId } = v3Context;

    // Find default or fallback location for device registry
    const defaultLocation = await this.prisma.client.inventoryLocation.findFirst({
      where: { organizationId, isDefault: true },
      select: { id: true },
    }) || await this.prisma.client.inventoryLocation.findFirst({
      where: { organizationId },
      select: { id: true },
    });

    if (!defaultLocation) {
      throw new NotFoundException("No location found for organization");
    }

    // Find existing device by id or serialNumber
    const existingDevice = await this.prisma.client.deviceRegistry.findFirst({
      where: {
        OR: [
          { id: dto.deviceId },
          { serialNumber: dto.deviceId },
        ],
        organizationId,
      },
    });

    let registry;
    if (existingDevice) {
      registry = await this.prisma.client.deviceRegistry.update({
        where: { id: existingDevice.id },
        data: {
          deviceName: dto.modelName || existingDevice.deviceName,
          status: "ACTIVE",
          lastSeenAt: new Date(),
          metadata: {
            ...(existingDevice.metadata as object || {}),
            appVersion: dto.appVersion,
            osVersion: dto.osVersion,
            pushToken: dto.pushToken,
            updatedByMemberId: memberId,
            ...(dto.metadata || {}),
          },
        },
      });
    } else {
      registry = await this.prisma.client.deviceRegistry.create({
        data: {
          serialNumber: dto.deviceId,
          deviceName: dto.modelName || `Android Device (${dto.deviceId.slice(0, 8)})`,
          organizationId,
          locationId: defaultLocation.id,
          deviceType: "MOBILE_POS",
          status: "ACTIVE",
          metadata: {
            appVersion: dto.appVersion,
            osVersion: dto.osVersion,
            pushToken: dto.pushToken,
            registeredByMemberId: memberId,
            ...(dto.metadata || {}),
          },
        },
      });
    }

    const metadata = (registry.metadata as Record<string, any>) || {};

    return {
      success: true,
      device: {
        id: registry.id,
        deviceId: registry.serialNumber || registry.id,
        deviceName: registry.deviceName,
        status: registry.status,
        appVersion: metadata.appVersion || dto.appVersion || "1.0.0",
        lastSeenAt: registry.lastSeenAt,
      },
    };
  }

  async getDashboardSummary(v3Context: any) {
    const { organizationId } = v3Context;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [salesAggregate, lowStockCount, totalCustomers] =
      await Promise.all([
        this.prisma.client.transaction.aggregate({
          where: {
            organizationId,
            createdAt: { gte: todayStart },
            status: "COMPLETED",
          },
          _sum: { totalPaid: true },
          _count: { _all: true },
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
        totalAmount: Number(salesAggregate._sum.totalPaid || 0),
        transactionCount: salesAggregate._count._all || 0,
      },
      lowStockCount,
      totalCustomers,
    };
  }
}
