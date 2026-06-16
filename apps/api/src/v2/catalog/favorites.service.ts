import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import type { V2ApiContext } from "@repo/shared/server";

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async getFavorites(ctx: V2ApiContext) {
    const { organizationId, customerId } = ctx;
    if (!customerId) throw new BadRequestException("Customer ID is required");

    return this.prisma.client.favorite.findMany({
      where: { organizationId, customerId },
      include: {
        product: {
          include: {
            category: true,
            variants: {
              include: {
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
