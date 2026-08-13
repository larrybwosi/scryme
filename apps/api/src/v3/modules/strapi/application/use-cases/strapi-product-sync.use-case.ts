import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import {
  StrapiV4Provider,
  StrapiProductAttributes,
  StrapiClientConfig,
} from "../../infrastructure/providers/strapi-v4.provider";
import { StrapiConnectionUseCase } from "./strapi-connection.use-case";
import { SyncDirection, SyncStatus, EntitySyncType } from "@repo/db";

interface ProductSyncResult {
  syncLogId: string;
  totalItems: number;
  successCount: number;
  failureCount: number;
  skippedCount: number;
  errors: string[];
}

@Injectable()
export class StrapiProductSyncUseCase {
  private readonly logger = new Logger(StrapiProductSyncUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly strapiProvider: StrapiV4Provider,
    private readonly connectionUseCase: StrapiConnectionUseCase,
  ) {}

  // ──────────────────────────────────────────────────────────────────
  // Public entry points
  // ──────────────────────────────────────────────────────────────────

  /**
   * OUTBOUND: Push Scryme products to Strapi.
   * Creates or updates Strapi entries based on EcommerceProductMapping records.
   */
  async syncOutbound(
    organizationId: string,
    connectionId: string,
    triggeredBy = "manual",
  ): Promise<ProductSyncResult> {
    const { config, syncLog } = await this.initSync(
      organizationId,
      connectionId,
      SyncDirection.OUTBOUND,
      triggeredBy,
    );

    const errors: string[] = [];
    let successCount = 0;
    let failureCount = 0;
    const skippedCount = 0;

    try {
      // Fetch all products for this org (with variants and inventory)
      const products = await this.prisma.client.product.findMany({
        where: { organizationId },
        include: {
          variants: {
            include: {
              variantStocks: {
                include: { location: true },
              },
              priceListItems: {
                include: { priceList: true },
                take: 1,
                orderBy: { createdAt: "asc" },
              },
            },
          },
          category: true,
        },
      });

      const totalItems = products.length;

      // ⚡ Bolt Optimization: Batch pre-fetch all product mappings to eliminate N+1 queries.
      const productIds = products.map((p) => p.id);
      const mappings = await this.prisma.client.ecommerceProductMapping.findMany({
        where: {
          connectionId,
          productId: { in: productIds },
          variantId: null, // top-level product mapping
        },
      });
      const mappingMap = new Map<string, any>(
        mappings.map((m) => [m.productId, m]),
      );

      // ⚡ Bolt Optimization: Parallelize outbound product sync in small controlled batches (concurrency = 10)
      // to prevent database connection pool exhaustion and external API rate limiting, while achieving massive speedup.
      const BATCH_SIZE = 10;
      for (let i = 0; i < products.length; i += BATCH_SIZE) {
        const chunk = products.slice(i, i + BATCH_SIZE);
        await Promise.all(
          chunk.map(async (product) => {
            try {
              // Build location stock map across all variants
              const locationStock = this.buildLocationStockMap((product as any).variants as any[]);

              // Check for existing mapping using pre-fetched cache
              const mapping = mappingMap.get(product.id);

              const strapiPayload: Partial<StrapiProductAttributes> = {
                name: product.name,
                slug: (product as any).slug ?? this.toSlug(product.name),
                description: (product as any).description ?? undefined,
                sku: (product as any).sku ?? undefined,
                active: true,
                publishedAt: new Date().toISOString(),
                locationStock,
              };

              // Merge lowest variant price as default product price
              const lowestPrice = this.getLowestVariantPrice((product as any).variants as any[]);
              if (lowestPrice !== undefined) strapiPayload.price = lowestPrice;

              if (mapping?.externalProductId) {
                // UPDATE existing Strapi entry
                await this.strapiProvider.updateProduct(
                  config,
                  Number(mapping.externalProductId),
                  strapiPayload,
                );

                await this.prisma.client.ecommerceProductMapping.update({
                  where: { id: mapping.id },
                  data: {
                    externalData: strapiPayload as any,
                    lastSyncedAt: new Date(),
                  },
                });
              } else {
                // CREATE new Strapi entry
                const created = await this.strapiProvider.createProduct(config, strapiPayload);
                const strapiId = String(created.data.id);

                await this.prisma.client.ecommerceProductMapping.create({
                  data: {
                    connectionId,
                    productId: product.id,
                    organizationId,
                    externalProductId: strapiId,
                    externalSku: (product as any).sku ?? undefined,
                    externalData: strapiPayload as any,
                    lastSyncedAt: new Date(),
                    syncInventory: true,
                    syncPrice: true,
                    syncStatus: true,
                  },
                });
              }

              successCount++;
            } catch (err: any) {
              failureCount++;
              const msg = `Product ${product.id} (${product.name}): ${err.message}`;
              errors.push(msg);
              this.logger.error(msg);
            }
          })
        );
      }

      await this.finishSync(syncLog.id, {
        status: failureCount === 0 ? SyncStatus.COMPLETED : SyncStatus.PARTIALLY_COMPLETED,
        totalItems,
        successCount,
        failureCount,
        skippedCount,
        errors,
      });

      return {
        syncLogId: syncLog.id,
        totalItems,
        successCount,
        failureCount,
        skippedCount,
        errors,
      };
    } catch (err: any) {
      await this.finishSync(syncLog.id, {
        status: SyncStatus.FAILED,
        errors: [err.message],
      });
      throw err;
    }
  }

  /**
   * INBOUND: Pull products from Strapi and upsert into Scryme catalog.
   */
  async syncInbound(
    organizationId: string,
    connectionId: string,
    triggeredBy = "manual",
  ): Promise<ProductSyncResult> {
    const { config, strapiConfig, syncLog } = await this.initSync(
      organizationId,
      connectionId,
      SyncDirection.INBOUND,
      triggeredBy,
    );

    const errors: string[] = [];
    let successCount = 0;
    let failureCount = 0;
    const skippedCount = 0;
    let totalItems = 0;

    try {
      let page = 1;
      let hasMore = true;

      // ⚡ Bolt Optimization: Pre-fetch all categories for the organization to eliminate N+1 queries.
      const existingCategories = await this.prisma.client.category.findMany({
        where: { organizationId },
      });
      const categoryMap = new Map<string, string>(
        existingCategories.map((c) => [c.name.toLowerCase(), c.id]),
      );

      while (hasMore) {
        const strapiProducts = await this.strapiProvider.getProducts(config, {
          page,
          pageSize: 100,
          populate: ["images", "categories", "variants"],
        });

        totalItems = strapiProducts.meta.pagination.total;
        hasMore = page < strapiProducts.meta.pagination.pageCount;
        page++;

        // ⚡ Bolt Optimization: Batch pre-fetch product mappings for the current page of entries to avoid N+1 queries.
        const externalProductIds = strapiProducts.data.map((entry) => String(entry.id));
        const currentMappings = await this.prisma.client.ecommerceProductMapping.findMany({
          where: {
            connectionId,
            externalProductId: { in: externalProductIds },
          },
        });
        const currentMappingMap = new Map<string, any>(
          currentMappings.map((m) => [m.externalProductId, m]),
        );

        for (const entry of strapiProducts.data) {
          try {
            const attrs = entry.attributes;

            // Resolve or create a local category
            const categoryId = await this.resolveCategory(
              organizationId,
              attrs.categories?.data?.[0]?.attributes?.name ?? "Imported",
              categoryMap,
            );

            // Check for existing mapping using pre-fetched cache
            const mapping = currentMappingMap.get(String(entry.id));

            if (mapping) {
              // Update existing local product
              await this.prisma.client.product.update({
                where: { id: mapping.productId },
                data: {
                  name: attrs.name,
                  description: attrs.description ?? null,
                },
              });

              await this.prisma.client.ecommerceProductMapping.update({
                where: { id: mapping.id },
                data: {
                  externalData: attrs as any,
                  lastSyncedAt: new Date(),
                  externalSku: attrs.sku ?? undefined,
                },
              });
            } else {
              // Create new local product
              const sku = attrs.sku ?? `STRAPI-${entry.id}-${Date.now()}`;
              const newProduct = await this.prisma.client.product.create({
                data: {
                  organizationId,
                  name: attrs.name,
                  description: attrs.description ?? null,
                  sku,
                  categoryId,
                },
              });

              // Create a base variant
              const variant = await this.prisma.client.productVariant.create({
                data: {
                  productId: newProduct.id,
                  attributes: {},
                  name: "Default",
                  sku,
                  buyingPrice: 0 as any,
                },
              });

              await this.prisma.client.ecommerceProductMapping.create({
                data: {
                  connectionId,
                  productId: newProduct.id,
                  variantId: variant.id,
                  organizationId,
                  externalProductId: String(entry.id),
                  externalSku: attrs.sku ?? undefined,
                  externalData: attrs as any,
                  lastSyncedAt: new Date(),
                  syncInventory: true,
                  syncPrice: true,
                  syncStatus: true,
                },
              });
            }

            successCount++;
          } catch (err: any) {
            failureCount++;
            const msg = `Strapi entry ${entry.id}: ${err.message}`;
            errors.push(msg);
            this.logger.error(msg);
          }
        }
      }

      await this.finishSync(syncLog.id, {
        status: failureCount === 0 ? SyncStatus.COMPLETED : SyncStatus.PARTIALLY_COMPLETED,
        totalItems,
        successCount,
        failureCount,
        skippedCount,
        errors,
      });

      return { syncLogId: syncLog.id, totalItems, successCount, failureCount, skippedCount, errors };
    } catch (err: any) {
      await this.finishSync(syncLog.id, { status: SyncStatus.FAILED, errors: [err.message] });
      throw err;
    }
  }

  // ──────────────────────────────────────────────────────────────────
  // Internal helpers
  // ──────────────────────────────────────────────────────────────────

  private async initSync(
    organizationId: string,
    connectionId: string,
    direction: SyncDirection,
    triggeredBy: string,
  ) {
    const conn = await this.connectionUseCase.getConnectionOrThrow(organizationId, connectionId);
    const strapiConfig = await this.connectionUseCase.getConfigOrThrow(organizationId, connectionId);

    const config: StrapiClientConfig = {
      strapiUrl: strapiConfig.strapiUrl,
      apiToken: strapiConfig.apiToken,
      graphqlPath: strapiConfig.graphqlPath,
    };

    const syncLog = await this.prisma.client.ecommerceSyncLog.create({
      data: {
        connectionId,
        organizationId,
        syncType: EntitySyncType.PRODUCTS,
        syncDirection: direction,
        status: SyncStatus.IN_PROGRESS,
        triggeredBy,
        startedAt: new Date(),
      },
    });

    // Mark connection as currently syncing
    await this.prisma.client.ecommerceConnection.update({
      where: { id: connectionId },
      data: { lastSyncAt: new Date() },
    });

    return { conn, config, strapiConfig, syncLog };
  }

  private async finishSync(
    syncLogId: string,
    data: {
      status: SyncStatus;
      totalItems?: number;
      successCount?: number;
      failureCount?: number;
      skippedCount?: number;
      errors?: string[];
    },
  ) {
    const now = new Date();
    await this.prisma.client.ecommerceSyncLog.update({
      where: { id: syncLogId },
      data: {
        status: data.status,
        totalItems: data.totalItems ?? 0,
        successCount: data.successCount ?? 0,
        failureCount: data.failureCount ?? 0,
        skippedCount: data.skippedCount ?? 0,
        errors: data.errors?.length ? data.errors : undefined,
        completedAt: now,
      },
    });
  }

  private buildLocationStockMap(variants: any[]): Record<string, number> {
    const map: Record<string, number> = {};
    for (const variant of variants) {
      for (const item of variant.variantStocks ?? []) {
        const locId = item.locationId;
        map[locId] = (map[locId] ?? 0) + (item.currentStock ?? 0);
      }
    }
    return map;
  }

  private getLowestVariantPrice(variants: any[]): number | undefined {
    const prices = variants.flatMap((v) =>
      (v.priceListItems ?? []).map((pl: any) => Number(pl.price)),
    );
    if (!prices.length) return undefined;
    return Math.min(...prices);
  }

  /**
   * Resolves or creates a category, using an in-memory Map cache to avoid N+1 database queries.
   */
  private async resolveCategory(
    organizationId: string,
    name: string,
    categoryMap: Map<string, string>,
  ): Promise<string> {
    const key = name.toLowerCase();
    const cachedId = categoryMap.get(key);
    if (cachedId) {
      return cachedId;
    }

    let cat = await this.prisma.client.category.findFirst({
      where: { organizationId, name },
    });
    if (!cat) {
      cat = await this.prisma.client.category.create({
        data: { organizationId, name, code: name.toUpperCase() },
      });
    }
    categoryMap.set(key, cat.id);
    return cat.id;
  }

  private toSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }
}
