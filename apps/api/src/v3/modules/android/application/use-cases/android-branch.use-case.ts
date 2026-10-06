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
          isDefault: loc.isDefault || false,
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
      isDefault: location.isDefault || false,
    };
  }
}
