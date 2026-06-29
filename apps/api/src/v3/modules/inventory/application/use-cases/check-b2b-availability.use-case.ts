import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CheckB2BAvailabilityDto } from "../dto/check-b2b-availability.dto";

@Injectable()
export class CheckB2BAvailabilityUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(organizationId: string, dto: CheckB2BAvailabilityDto) {
    // 1. Resolve Location
    let locationId = dto.locationId;

    if (!locationId) {
      if (dto.customerId) {
        const customer = await this.prisma.client.customer.findUnique({
          where: { id: dto.customerId },
          select: { defaultLocationId: true },
        });
        locationId = customer?.defaultLocationId || undefined;
      }

      if (!locationId && dto.businessAccountId) {
        const businessAccount =
          await this.prisma.client.businessAccount.findUnique({
            where: { id: dto.businessAccountId },
            select: { defaultLocationId: true },
          });
        locationId = businessAccount?.defaultLocationId || undefined;
      }

      if (!locationId) {
        const defaultLocation =
          await this.prisma.client.inventoryLocation.findFirst({
            where: { organizationId, isDefault: true },
            select: { id: true },
          });
        locationId = defaultLocation?.id;
      }
    }

    if (!locationId) {
      throw new BadRequestException(
        "Location could not be resolved. Please provide a locationId.",
      );
    }

    // 2. Fetch Stock for Variants at Location
    const stocks = await this.prisma.client.productVariantStock.findMany({
      where: {
        locationId,
        variantId: { in: dto.variantIds },
        organizationId,
      },
      select: {
        variantId: true,
        availableStock: true,
      },
    });

    /**
     * OPTIMIZATION (Bolt ⚡): Replaced O(N*M) lookup with O(N+M) Map.
     * Indexing the stocks by variantId allows for constant-time lookups
     * during the mapping phase, which is more efficient for large lists.
     */
    const stockMap = new Map(stocks.map((s) => [s.variantId, s.availableStock]));

    return dto.variantIds.map((variantId) => {
      const stockQty = stockMap.get(variantId);
      return {
        variantId,
        locationId,
        availableStock: stockQty ? stockQty.toNumber() : 0,
      };
    });
  }
}
