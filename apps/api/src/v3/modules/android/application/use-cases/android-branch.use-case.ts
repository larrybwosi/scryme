import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class AndroidBranchUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async getBranchLocations(v3Context: any) {
    const { organizationId } = v3Context;

    const locations = await this.prisma.client.inventoryLocation.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
    });

    return {
      locations: locations.map((loc) => {
        const contactObj = (loc.contact as Record<string, any>) || {};
        const addressObj = (loc.address as Record<string, any>) || {};
        const addressStr = typeof loc.address === "string" ? loc.address : addressObj.street || addressObj.address || "";
        const phoneStr = contactObj.phone || contactObj.telephone || "";

        return {
          id: loc.id,
          name: loc.name,
          code: loc.code || loc.id.slice(0, 6),
          address: addressStr,
          phone: phoneStr,
          locationType: loc.locationType || "STORE",
          latitude: loc.latitude ? Number(loc.latitude) : null,
          longitude: loc.longitude ? Number(loc.longitude) : null,
          geofenceRadiusMeters: loc.geofenceRadiusMeters ? Number(loc.geofenceRadiusMeters) : 100,
          isDefault: loc.isDefault || false,
          isActive: loc.isActive ?? true,
        };
      }),
    };
  }

  async getBranchDetails(v3Context: any, id: string) {
    const { organizationId } = v3Context;

    const location = await this.prisma.client.inventoryLocation.findFirst({
      where: { id, organizationId },
    });

    if (!location) {
      throw new NotFoundException(`Branch location '${id}' not found`);
    }

    const contactObj = (location.contact as Record<string, any>) || {};
    const addressObj = (location.address as Record<string, any>) || {};
    const addressStr = typeof location.address === "string" ? location.address : addressObj.street || addressObj.address || "";
    const phoneStr = contactObj.phone || contactObj.telephone || "";

    return {
      id: location.id,
      name: location.name,
      code: location.code || location.id.slice(0, 6),
      address: addressStr,
      phone: phoneStr,
      locationType: location.locationType || "STORE",
      latitude: location.latitude ? Number(location.latitude) : null,
      longitude: location.longitude ? Number(location.longitude) : null,
      geofenceRadiusMeters: location.geofenceRadiusMeters ? Number(location.geofenceRadiusMeters) : 100,
      isDefault: location.isDefault || false,
      isActive: location.isActive ?? true,
    };
  }

  async getBranchActivity(v3Context: any, id: string, limit = 20) {
    const { organizationId } = v3Context;

    const location = await this.prisma.client.inventoryLocation.findFirst({
      where: { id, organizationId },
    });

    if (!location) {
      throw new NotFoundException(`Branch location '${id}' not found`);
    }

    const logs = await this.prisma.client.attendanceLog.findMany({
      where: {
        organizationId,
        OR: [{ checkInLocationId: id }, { checkOutLocationId: id }],
      },
      include: {
        member: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: { checkInTime: "desc" },
      take: limit,
    });

    return {
      activity: logs.map((log) => ({
        id: log.id,
        memberId: log.memberId,
        memberName: log.member?.user?.name || "Staff Member",
        memberAvatar: log.member?.user?.image || null,
        checkInTime: log.checkInTime.toISOString(),
        checkOutTime: log.checkOutTime?.toISOString() || null,
        shiftStatus: log.shiftStatus || "UNSCHEDULED",
        verificationMethod: log.verificationMethod,
        isLocationVerified: log.isLocationVerified,
        distanceMeters: log.distanceMeters,
        notes: log.notes,
      })),
    };
  }

  async getBranchSales(v3Context: any, id: string, limit = 20) {
    const { organizationId } = v3Context;

    const location = await this.prisma.client.inventoryLocation.findFirst({
      where: { id, organizationId },
    });

    if (!location) {
      throw new NotFoundException(`Branch location '${id}' not found`);
    }

    const transactions = await this.prisma.client.transaction.findMany({
      where: {
        organizationId,
        locationId: id,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        member: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return {
      sales: transactions.map((tx) => ({
        id: tx.id,
        transactionNumber: tx.id.slice(-8).toUpperCase(),
        totalAmount: Number(tx.finalTotal),
        currencyCode: tx.currencyCode || "USD",
        customerName: tx.customer?.name || "Walk-in Customer",
        cashierName: tx.member?.user?.name || "Staff",
        status: tx.cancelledAt ? "CANCELLED" : tx.completedAt ? "COMPLETED" : "CONFIRMED",
        createdAt: tx.createdAt.toISOString(),
      })),
    };
  }

  async getBranchStockMovements(v3Context: any, id: string, limit = 20) {
    const { organizationId } = v3Context;

    const location = await this.prisma.client.inventoryLocation.findFirst({
      where: { id, organizationId },
    });

    if (!location) {
      throw new NotFoundException(`Branch location '${id}' not found`);
    }

    const movements = await this.prisma.client.stockMovement.findMany({
      where: {
        OR: [{ fromLocationId: id }, { toLocationId: id }],
      },
      include: {
        variant: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
        fromLocation: {
          select: {
            id: true,
            name: true,
          },
        },
        toLocation: {
          select: {
            id: true,
            name: true,
          },
        },
        member: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { movementDate: "desc" },
      take: limit,
    });

    return {
      movements: movements.map((m) => {
        const isIncoming = m.toLocationId === id;
        return {
          id: m.id,
          variantName: m.variant?.product?.name || "Product Item",
          quantity: Number(m.quantity),
          movementType: m.movementType,
          direction: isIncoming ? "IN" : "OUT",
          fromLocationName: m.fromLocation?.name || null,
          toLocationName: m.toLocation?.name || null,
          performedBy: m.member?.user?.name || "Staff",
          timestamp: m.movementDate.toISOString(),
          notes: m.notes,
        };
      }),
    };
  }
}
