import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { IProductRepository } from '../../domain/repositories/product-repository.interface';
import { Product } from '../../domain/entities/product.entity';
import { PaginationQueryDto } from '@/v3/common/utils/pagination';

@Injectable()
export class PrismaProductRepository implements IProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByOrganization(organizationId: string, pagination?: PaginationQueryDto): Promise<Product[]> {
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
      },
    });
    return products.map(
      p => new Product(p.id, p.name, p.description, p.organizationId, p.categoryId, p.createdAt, p.updatedAt)
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
      },
    });
    if (!p) return null;
    return new Product(p.id, p.name, p.description, p.organizationId, p.categoryId, p.createdAt, p.updatedAt);
  }

  async save(product: Product): Promise<Product> {
    const p = await this.prisma.client.product.upsert({
      where: { id: product.id },
      update: {
        name: product.name,
        description: product.description,
      },
      create: {
        id: product.id,
        name: product.name,
        description: product.description,
        organization: { connect: { id: product.organizationId } },
        sku: product.sku || `PROD-${Date.now()}`,
        category: { connect: { id: product.categoryId } },
      },
    });
    return new Product(p.id, p.name, p.description, p.organizationId, p.categoryId, p.createdAt, p.updatedAt);
  }
}
