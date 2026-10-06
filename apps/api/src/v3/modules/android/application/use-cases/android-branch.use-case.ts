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
      locations: locations.map((loc) => ({
        id: loc.id,
        name: loc.name,
        code: loc.code || loc.id.slice(0, 6),
        address: loc.address || "",
        phone: loc.phone || "",
        isDefault: loc.isDefault || false,
      })),
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

    return {
      id: location.id,
      name: location.name,
      code: location.code || location.id.slice(0, 6),
      address: location.address || "",
      phone: location.phone || "",
      isDefault: location.isDefault || false,
    };
  }
}
