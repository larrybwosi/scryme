import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { FavoriteDto } from '../dto/favorite.dto';

@Injectable()
export class FavoritesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async getFavorites(organizationId: string, customerId: string) {
    if (!customerId) throw new BadRequestException('customerId is required');
    return this.prisma.client.favorite.findMany({
      where: { organizationId, customerId },
      include: { product: true },
    });
  }

  async addFavorite(organizationId: string, dto: FavoriteDto) {
    if (!dto.customerId) throw new Error('customerId is required');

    // Verify product exists and belongs to organization
    const product = await this.prisma.client.product.findFirst({
      where: { id: dto.productId, organizationId },
    });

    if (!product) throw new NotFoundException('Product not found');

    // Check if already favorited
    const existing = await this.prisma.client.favorite.findUnique({
      where: {
        customerId_productId: {
          customerId: dto.customerId,
          productId: dto.productId,
        },
      },
    });

    if (existing) return existing;

    return this.prisma.client.favorite.create({
      data: {
        organizationId,
        customerId: dto.customerId,
        productId: dto.productId,
      },
    });
  }

  async removeFavorite(organizationId: string, dto: FavoriteDto) {
    if (!dto.customerId) throw new Error('customerId is required');

    try {
      return await this.prisma.client.favorite.delete({
        where: {
          customerId_productId: {
            customerId: dto.customerId,
            productId: dto.productId,
          },
        },
      });
    } catch (e) {
      throw new NotFoundException('Favorite not found');
    }
  }
}
