import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { IProductRepository } from "../../domain/repositories/product-repository.interface";
import { Product } from "../../domain/entities/product.entity";
import { PaginationQueryDto } from "@/v3/common/utils/pagination";

@Injectable()
export class PrismaProductRepository implements IProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByOrganization(
    organizationId: string,
    pagination?: PaginationQueryDto,
  ): Promise<Product[]> {
    const products = await this.prisma.client.product.findMany({
      where: { organizationId },
      take: pagination?.limit,
      skip: pagination?.offset,
      select: {
        id: true,
        name: true,
        description: true,
        organizationId: true,
        categoryId: true,
        createdAt: true,
        updatedAt: true,
        sku: true,
        slug: true,
        imageUrls: true,
        customFields: true,
        brand: true,
        rating: true,
        isNew: true,
        detailedDescription: true,
        tags: true,
        isFeatured: true,
        isActive: true,
        pointsOnPurchase: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        variants: {
          select: {
            id: true,
            name: true,
            sku: true,
            retailPrice: true,
          },
        },
        reviews: {
          where: { isVisible: true },
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            customer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            favorites: true,
          },
        },
      },
    });
    return products.map(
      (p) =>
        new Product(
          p.id,
          p.name,
          p.description,
          p.organizationId,
          p.categoryId,
          p.createdAt,
          p.updatedAt,
          p.sku,
          p.slug,
          p.imageUrls,
          p.category,
          p.variants.map((v) => ({
            id: v.id,
            name: v.name,
            sku: v.sku,
            retailPrice: v.retailPrice ? Number(v.retailPrice) : null,
          })),
          p.customFields,
          p.brand,
          p.rating,
          p.isNew,
          p.detailedDescription,
          p.tags,
          p.isFeatured,
          p.isActive,
          p.pointsOnPurchase,
          p.reviews,
          p._count?.favorites ?? 0,
        ),
    );
  }

  async findById(id: string): Promise<Product | null> {
    const p = await this.prisma.client.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        organizationId: true,
        categoryId: true,
        createdAt: true,
        updatedAt: true,
        sku: true,
        slug: true,
        imageUrls: true,
        customFields: true,
        brand: true,
        rating: true,
        isNew: true,
        detailedDescription: true,
        tags: true,
        isFeatured: true,
        isActive: true,
        pointsOnPurchase: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        variants: {
          select: {
            id: true,
            name: true,
            sku: true,
            retailPrice: true,
          },
        },
        reviews: {
          where: { isVisible: true },
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            customer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            favorites: true,
          },
        },
      },
    });
    if (!p) return null;
    return new Product(
      p.id,
      p.name,
      p.description,
      p.organizationId,
      p.categoryId,
      p.createdAt,
      p.updatedAt,
      p.sku,
      p.slug,
      p.imageUrls,
      p.category,
      p.variants.map((v) => ({
        id: v.id,
        name: v.name,
        sku: v.sku,
        retailPrice: v.retailPrice ? Number(v.retailPrice) : null,
      })),
      p.customFields,
      p.brand,
      p.rating,
      p.isNew,
      p.detailedDescription,
      p.tags,
      p.isFeatured,
      p.isActive,
      p.pointsOnPurchase,
      p.reviews,
      p._count?.favorites ?? 0,
    );
  }

  async save(product: Product): Promise<Product> {
    const p = await this.prisma.client.product.upsert({
      where: { id: product.id },
      update: {
        name: product.name,
        description: product.description,
        customFields: product.customFields !== undefined ? product.customFields : undefined,
      },
      create: {
        id: product.id,
        name: product.name,
        description: product.description,
        organization: { connect: { id: product.organizationId } },
        sku: product.sku || `PROD-${Date.now()}`,
        category: { connect: { id: product.categoryId } },
        customFields: product.customFields !== undefined ? product.customFields : undefined,
      },
      select: {
        id: true,
        name: true,
        description: true,
        organizationId: true,
        categoryId: true,
        createdAt: true,
        updatedAt: true,
        sku: true,
        slug: true,
        imageUrls: true,
        customFields: true,
        brand: true,
        rating: true,
        isNew: true,
        detailedDescription: true,
        tags: true,
        isFeatured: true,
        isActive: true,
        pointsOnPurchase: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        variants: {
          select: {
            id: true,
            name: true,
            sku: true,
            retailPrice: true,
          },
        },
        reviews: {
          where: { isVisible: true },
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            customer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            favorites: true,
          },
        },
      },
    });
    return new Product(
      p.id,
      p.name,
      p.description,
      p.organizationId,
      p.categoryId,
      p.createdAt,
      p.updatedAt,
      p.sku,
      p.slug,
      p.imageUrls,
      p.category,
      p.variants.map((v) => ({
        id: v.id,
        name: v.name,
        sku: v.sku,
        retailPrice: v.retailPrice ? Number(v.retailPrice) : null,
      })),
      p.customFields,
      p.brand,
      p.rating,
      p.isNew,
      p.detailedDescription,
      p.tags,
      p.isFeatured,
      p.isActive,
      p.pointsOnPurchase,
      p.reviews,
      p._count?.favorites ?? 0,
    );
  }
}
