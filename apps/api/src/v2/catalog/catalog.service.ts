import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { RedisService } from "../../redis/redis.service";
import type { V2ApiContext } from "@repo/shared/server";
import { SupplierService } from "@repo/suppliers/server";
import { ProductType } from "@repo/db";

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supplierService: SupplierService,
    private readonly redis: RedisService,
  ) {}

  async getProducts(ctx: V2ApiContext, query: any) {
    const { organizationId } = ctx;
    const cacheKey = `v2:catalog:products:${organizationId}:${JSON.stringify(query)}`;

    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return cached;

    const page = Math.max(1, parseInt(query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || "10", 10)));
    const search = query.search || "";
    const categoryId = query.categoryId;
    const status = query.status;
    const inStock = query.inStock === "true";
    const featured = query.isFeatured === "true";
    const requestedFields = query.fields
      ? (query.fields as string).split(",").map((f) => f.trim())
      : null;

    const skip = (page - 1) * limit;

    try {
      const where: any = {
        organizationId,
        type: ProductType.FINISHED_GOOD,
        ...(status ? { status } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { sku: { contains: search, mode: "insensitive" } },
                {
                  variants: {
                    some: { sku: { contains: search, mode: "insensitive" } },
                  },
                },
              ],
            }
          : {}),
        ...(categoryId ? { categoryId } : {}),
        ...(featured ? { isFeatured: true } : {}),
        ...(inStock
          ? {
              variants: {
                some: {
                  variantStocks: {
                    some: {
                      availableStock: { gt: 0 },
                    },
                  },
                },
              },
            }
          : {}),
      };

      const [products, total] = await Promise.all([
        this.prisma.client.product.findMany({
          where,
          skip,
          take: limit,
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            sku: true,
            barcode: true,
            categoryId: true,
            isActive: true,
            imageUrls: true,
            createdAt: true,
            updatedAt: true,
            type: true,
            pointsOnPurchase: true,
            brand: true,
            rating: true,
            lowStockThreshold: true,
            isNew: true,
            tags: true,
            isFeatured: true,
            slug: true,
            defaultLocationId: true,
            loyaltyPointsOverride: true,
            category: { select: { id: true, name: true } },
            variants: {
              select: {
                id: true,
                name: true,
                sku: true,
                barcode: true,
                attributes: true,
                isActive: true,
                reorderPoint: true,
                reorderQty: true,
                lowStockAlert: true,
                buyingPrice: true,
                wholesalePrice: true,
                retailPrice: true,
                isPopular: true,
                isNew: true,
                promotionalPrice: true,
                pointsOnPurchase: true,
                loyaltyPointsOverride: true,
                baseUnitId: true,
                baseOrgUnitId: true,
                baseUnit: true,
                baseOrgUnit: true,
                variantStocks: {
                  select: { availableStock: true, locationId: true },
                },
              },
            },
          },
        }),
        this.prisma.client.product.count({ where }),
      ]);

      let shaped = products.map((p) => {
        return {
          ...p,
          id: p.sku,
          internalId: p.id,
          images: p.imageUrls || null,
          variants: p.variants.map((v) => {
            const totalStock =
              v.variantStocks?.reduce(
                (sum, s) => sum + Number(s.availableStock),
                0,
              ) || 0;
            return {
              id: v.id,
              name: v.name,
              sku: v.sku,
              price: v.retailPrice,
              cost: v.buyingPrice,
              retailPrice: v.retailPrice,
              buyingPrice: v.buyingPrice,
              totalStock,
              stockByLocation: v.variantStocks?.map((s) => ({
                locationId: s.locationId,
                stock: s.availableStock,
              })),
            };
          }),
        };
      });

      if (requestedFields && requestedFields.length > 0) {
        shaped = shaped.map((p) => {
          const filteredProduct: any = {};
          requestedFields.forEach((field) => {
            if (field in p) filteredProduct[field] = (p as any)[field];
          });
          return filteredProduct;
        });
      }

      const result = {
        products: shaped,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };

      await this.redis.setex(cacheKey, 300, result);
      return result;
    } catch (error) {
      throw new InternalServerErrorException("Failed to fetch products");
    }
  }

  async getProduct(ctx: V2ApiContext, id: string) {
    const { organizationId } = ctx;
    const product = await this.prisma.client.product.findFirst({
      where: { id, organizationId },
      include: {
        category: true,
        variants: {
          include: {
            variantStocks: true,
            baseUnit: true,
            baseOrgUnit: true,
          },
        },
        // ingredients: {
        //   include: {
        //     ingredient: true,
        //   },
        // },
      },
    });

    if (!product) throw new NotFoundException("Product not found");
    return product;
  }

  async createProduct(ctx: V2ApiContext, data: any) {
    const { organizationId } = ctx;
    return this.prisma.client.product.create({
      data: { ...data, organizationId },
    });
  }

  async updateProduct(ctx: V2ApiContext, id: string, data: any) {
    const { organizationId } = ctx;
    return this.prisma.client.product.update({
      where: { id, organizationId },
      data,
    });
  }

  async deleteProduct(ctx: V2ApiContext, id: string) {
    const { organizationId } = ctx;
    return this.prisma.client.product.delete({
      where: { id, organizationId },
    });
  }

  async getCategories(ctx: V2ApiContext) {
    const { organizationId } = ctx;
    const cacheKey = `v2:catalog:categories:${organizationId}`;
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return cached;

    try {
      const categories = await this.prisma.client.category.findMany({
        where: { organizationId },
        select: {
          id: true,
          name: true,
          description: true,
          parentId: true,
          color: true,
          code: true,
          _count: { select: { products: true } },
        },
        orderBy: { name: "asc" },
      });

      const map = new Map<string, any>();
      const roots: any[] = [];

      for (const cat of categories) {
        map.set(cat.id, {
          ...cat,
          productCount: cat._count.products,
          children: [],
        });
      }

      for (const node of map.values()) {
        if (node.parentId && map.has(node.parentId)) {
          map.get(node.parentId)!.children.push(node);
        } else {
          roots.push(node);
        }
      }

      const result = { categories: roots, total: categories.length };
      await this.redis.setex(cacheKey, 3600, result);
      return result;
    } catch (error) {
      throw new InternalServerErrorException("Failed to fetch categories");
    }
  }

  async getCategory(ctx: V2ApiContext, id: string) {
    const { organizationId } = ctx;
    const category = await this.prisma.client.category.findFirst({
      where: { id, organizationId },
    });
    if (!category) throw new NotFoundException("Category not found");
    return { data: category };
  }

  async createCategory(ctx: V2ApiContext, data: any) {
    const { organizationId } = ctx;
    return this.prisma.client.category.create({
      data: { ...data, organizationId },
    });
  }

  async updateCategory(ctx: V2ApiContext, id: string, data: any) {
    const { organizationId } = ctx;
    return this.prisma.client.category.update({
      where: { id, organizationId },
      data,
    });
  }

  async deleteCategory(ctx: V2ApiContext, id: string) {
    const { organizationId } = ctx;
    return this.prisma.client.category.delete({
      where: { id, organizationId },
    });
  }

  async getVariants(ctx: V2ApiContext, query: any) {
    const { organizationId } = ctx;
    const { page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    return this.prisma.client.productVariant.findMany({
      where: { product: { organizationId } },
      include: { product: true, variantStocks: true },
      skip,
      take: Number(limit),
    });
  }

  async getSearchSuggestions(ctx: V2ApiContext, query: string) {
    const { organizationId } = ctx;
    return this.prisma.client.product.findMany({
      where: {
        organizationId,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { sku: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: { id: true, name: true, sku: true },
    });
  }

  async getCatalogStats(ctx: V2ApiContext) {
    const { organizationId } = ctx;
    const [totalProducts, totalCategories, outOfStock] = await Promise.all([
      this.prisma.client.product.count({ where: { organizationId } }),
      this.prisma.client.category.count({ where: { organizationId } }),
      this.prisma.client.productVariant.count({
        where: {
          product: { organizationId },
          variantStocks: { some: { availableStock: { lte: 0 } } },
        },
      }),
    ]);

    return { totalProducts, totalCategories, outOfStock };
  }

  /**
   * Delegated Supplier Methods
   * Logic is maintained in SupplierService as per HEAD branch structure
   */
  async getSuppliers(ctx: V2ApiContext) {
    return this.supplierService.getSuppliers(ctx);
  }

  async getSupplier(ctx: V2ApiContext, id: string) {
    return this.supplierService.getSupplier(ctx, id);
  }

  async createSupplierDocument(
    ctx: V2ApiContext,
    supplierId: string,
    data: any,
  ) {
    return this.supplierService.createSupplierDocument(ctx, supplierId, data);
  }

  async createQualityIncident(ctx: V2ApiContext, data: any) {
    return this.supplierService.createQualityIncident(ctx, data);
  }

  async getQualityIncidents(ctx: V2ApiContext, query: any) {
    return this.supplierService.getQualityIncidents(ctx, query);
  }

  async initiateRecall(ctx: V2ApiContext, data: any) {
    return this.supplierService.initiateRecall(ctx, data);
  }

  async getRecalls(ctx: V2ApiContext) {
    return this.supplierService.getRecalls(ctx);
  }

  async getRecallImpact(ctx: V2ApiContext, id: string) {
    return this.supplierService.getRecallImpact(ctx, id);
  }
}
