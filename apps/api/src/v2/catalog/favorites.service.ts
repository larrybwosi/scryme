import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import type { V2ApiContext } from "@repo/shared/api/v2";

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async getFavorites(ctx: V2ApiContext) {
    const { organizationId, customerId } = ctx;
    if (!customerId) throw new BadRequestException("Customer ID is required");

    return this.prisma.client.favorite.findMany({
      where: { organizationId, customerId },
      /**
       * ⚡ Bolt: Performance Optimization
       * Replaced broad 'include' with targeted 'select' to reduce over-fetching.
       * Reduces database I/O and network payload size by selecting only essential fields.
       */
      select: {
        id: true,
        productId: true,
        customerId: true,
        organizationId: true,
        createdAt: true,
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            imageUrls: true,
            categoryId: true,
            category: { select: { id: true, name: true } },
            variants: {
              select: {
                id: true,
                name: true,
                sku: true,
                retailPrice: true,
                buyingPrice: true,
                baseUnit: true,
                baseOrgUnit: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async addFavorite(ctx: V2ApiContext, productId: string) {
    const { organizationId, customerId } = ctx;
    if (!customerId) throw new BadRequestException("Customer ID is required");

    return this.prisma.client.favorite.upsert({
      where: {
        customerId_productId: {
          customerId,
          productId,
        },
      },
      create: {
        organizationId,
        customerId,
        productId,
      },
      update: {}, // Do nothing if already exists
    });
  }

  async removeFavorite(ctx: V2ApiContext, productId: string) {
    const { customerId } = ctx;
    if (!customerId) throw new BadRequestException("Customer ID is required");

    try {
      return await this.prisma.client.favorite.delete({
        where: {
          customerId_productId: {
            customerId,
            productId,
          },
        },
      });
    } catch (error) {
      // If it doesn't exist, just ignore
      return null;
    }
  }

  async isFavorite(ctx: V2ApiContext, productId: string) {
    const { customerId } = ctx;
    if (!customerId) return false;

    const favorite = await this.prisma.client.favorite.findUnique({
      where: {
        customerId_productId: {
          customerId,
          productId,
        },
      },
    });

    return !!favorite;
  }
}
