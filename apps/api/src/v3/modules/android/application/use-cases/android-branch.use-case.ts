import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import {
  AndroidCreateBranchDto,
  AndroidUpdateBranchDto,
  AndroidUpdateBranchCoordinatesDto,
} from "../dto/android-auth.dto";

@Injectable()
export class AndroidBranchUseCase {
  constructor(private readonly prisma: PrismaService) {}

  private mapLocationToDto(loc: any) {
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
      geofenceRadiusMeters: loc.radiusMeters ? Number(loc.radiusMeters) : 100,
      isDefault: loc.isDefault || false,
      isActive: loc.isActive ?? true,
    };
  }

  async getBranchLocations(v3Context: any) {
    const { organizationId } = v3Context;

    const locations = await this.prisma.client.inventoryLocation.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
    });

    return {
      locations: locations.map((loc) => this.mapLocationToDto(loc)),
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

    return this.mapLocationToDto(location);
  }

  async createBranch(v3Context: any, dto: AndroidCreateBranchDto) {
    const { organizationId } = v3Context;

    const created = await this.prisma.client.inventoryLocation.create({
      data: {
        organizationId,
        name: dto.name,
        code: dto.code || undefined,
        address: dto.address ? { street: dto.address } : undefined,
        contact: dto.phone ? { phone: dto.phone } : undefined,
        locationType: (dto.locationType as any) || "RETAIL_SHOP",
        latitude: dto.latitude !== undefined && dto.latitude !== null ? dto.latitude : undefined,
        longitude: dto.longitude !== undefined && dto.longitude !== null ? dto.longitude : undefined,
        radiusMeters: dto.geofenceRadiusMeters !== undefined && dto.geofenceRadiusMeters !== null ? dto.geofenceRadiusMeters : 100,
      },
    });

    return this.mapLocationToDto(created);
  }

  async updateBranch(v3Context: any, id: string, dto: AndroidUpdateBranchDto) {
    const { organizationId } = v3Context;

    const existing = await this.prisma.client.inventoryLocation.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new NotFoundException(`Branch location '${id}' not found`);
    }

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.code !== undefined) data.code = dto.code;
    if (dto.address !== undefined) data.address = { street: dto.address };
    if (dto.phone !== undefined) data.contact = { phone: dto.phone };
    if (dto.locationType !== undefined) data.locationType = dto.locationType as any;
    if (dto.latitude !== undefined) data.latitude = dto.latitude;
    if (dto.longitude !== undefined) data.longitude = dto.longitude;
    if (dto.geofenceRadiusMeters !== undefined) data.radiusMeters = dto.geofenceRadiusMeters;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    await this.prisma.client.inventoryLocation.updateMany({
      where: { id, organizationId },
      data,
    });

    const updated = await this.prisma.client.inventoryLocation.findFirstOrThrow({
      where: { id, organizationId },
    });

    return this.mapLocationToDto(updated);
  }

  async updateBranchCoordinates(
    v3Context: any,
    id: string,
    dto: AndroidUpdateBranchCoordinatesDto
  ) {
    const { organizationId } = v3Context;

    const updated = await this.prisma.client.inventoryLocation.updateMany({
      where: { id, organizationId },
      data: {
        latitude: dto.latitude,
        longitude: dto.longitude,
      },
    });

    if (updated.count === 0) {
      throw new NotFoundException(`Branch location '${id}' not found`);
    }

    const location = await this.prisma.client.inventoryLocation.findFirstOrThrow({
      where: { id, organizationId },
    });

    return this.mapLocationToDto(location);
  }

  async deleteBranch(v3Context: any, id: string) {
    const { organizationId } = v3Context;

    const existing = await this.prisma.client.inventoryLocation.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new NotFoundException(`Branch location '${id}' not found`);
    }

    await this.prisma.client.inventoryLocation.deleteMany({
      where: { id, organizationId },
    });

    return { success: true };
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
