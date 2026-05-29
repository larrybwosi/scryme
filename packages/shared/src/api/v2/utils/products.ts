import { PrismaClient, Prisma } from '@repo/db';
import { formatVariantDisplayName } from './tokens';

interface GetPosProductsParams {
  prisma: PrismaClient;
  organizationId: string;
  locationId: string;
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
}

export async function getPosProducts({
  prisma,
  organizationId,
  locationId,
  page = 1,
  limit = 50,
  search = '',
  categoryId = 'all',
}: GetPosProductsParams) {
  try {
    const skip = (page - 1) * limit;

    const searchFilter: Prisma.ProductWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            {
              variants: {
                some: {
                  OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { sku: { contains: search, mode: 'insensitive' } },
                    { barcode: { contains: search, mode: 'insensitive' } },
                  ],
                },
              },
            },
          ],
        }
      : {};

    const categoryFilter: Prisma.ProductWhereInput =
      categoryId && categoryId !== 'all' ? { category: { name: categoryId } } : {};

    const whereClause: Prisma.ProductWhereInput = {
      organizationId,
      type: 'FINISHED_GOOD',
      isActive: true,
      ...searchFilter,
      ...categoryFilter,
    };

    const priceListSelect = {
      where: {
        priceList: {
          isActive: true,
        },
      },
      select: {
        id: true,
        price: true,
        minQuantity: true,
        maxQuantity: true,
        priceList: {
          select: {
            id: true,
            code: true,
            name: true,
            priority: true,
            validFrom: true,
            validTo: true,
          },
        },
      },
    };

    const [total, productsRaw] = await (prisma as any).$transaction([
      (prisma as any).product.count({ where: whereClause }),
      (prisma as any).product.findMany({
        where: whereClause,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          imageUrls: true,
          category: { select: { name: true } },
          variants: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              sku: true,
              barcode: true,
              retailPrice: true,
              wholesalePrice: true,
              baseUnit: { select: { id: true, name: true } },
              baseOrgUnit: { select: { id: true, name: true } },
              priceListItems: {
                ...priceListSelect,
                where: {
                  ...priceListSelect.where,
                  sellingUnitId: null,
                },
              },
              sellingUnits: {
                where: { isActive: true },
                select: {
                  id: true,
                  retailPrice: true,
                  wholesalePrice: true,
                  conversionMultiplier: true,
                  systemUnit: { select: { id: true, name: true } },
                  orgUnit: { select: { id: true, name: true } },
                  priceListItems: priceListSelect,
                },
              },
              variantStocks: {
                where: { locationId },
                select: { availableStock: true },
              },
            },
          },
        },
      }),
    ]);

    const formattedProducts = productsRaw
      .map((product: any) => {
        let productTotalStock = 0;

        const variants = product.variants.map((variant: any) => {
          const stock = variant.variantStocks.reduce((sum: number, s: any) => sum + (Number(s.availableStock) || 0), 0);
          productTotalStock += stock;

          const sellableUnits: any[] = [];
          const baseUnitId = variant.baseUnit?.id || variant.baseOrgUnit?.id || 'base';
          const baseUnitName = variant.baseUnit?.name || variant.baseOrgUnit?.name || 'Unit';

          const formatPricing = (items: any[]) => {
            return (
              items?.map(item => ({
                price: Number(item.price),
                minQty: item.minQuantity,
                maxQty: item.maxQuantity,
                listId: item.priceList.id,
                listName: item.priceList.name,
                listCode: item.priceList.code,
                priority: item.priceList.priority,
                validFrom: item.priceList.validFrom,
                validTo: item.priceList.validTo,
              })) || []
            );
          };

          if (variant.retailPrice || variant.wholesalePrice) {
            sellableUnits.push({
              unitId: baseUnitId,
              unitName: baseUnitName,
              price: Number(variant.retailPrice) || 0,
              wholesalePrice: Number(variant.wholesalePrice) || 0,
              conversion: 1.0,
              isBaseUnit: true,
              pricing: formatPricing(variant.priceListItems),
            });
          }

          variant.sellingUnits.forEach((unit: any) => {
            const unitId = unit.systemUnit?.id || unit.orgUnit?.id;
            const unitName = unit.systemUnit?.name || unit.orgUnit?.name;
            if (unitId === baseUnitId) return;

            if (unitName && (unit.retailPrice || unit.wholesalePrice)) {
              sellableUnits.push({
                unitId: unitId,
                unitName: unitName,
                price: Number(unit.retailPrice) || 0,
                wholesalePrice: Number(unit.wholesalePrice) || 0,
                conversion: Number(unit.conversionMultiplier) || 1,
                isBaseUnit: false,
                pricing: formatPricing(unit.priceListItems),
              });
            }
          });

          return {
            variantId: variant.id,
            name: variant.name,
            sku: variant.sku,
            barcode: variant.barcode,
            stock,
            sellableUnits,
          };
        });

        if (variants.length === 0) return null;

        return {
          productId: product.id,
          name: product.name,
          category: product.category?.name || 'Uncategorized',
          imageUrl: product.imageUrls?.[0] || null,
          totalStock: productTotalStock,
          variants,
        };
      })
      .filter(Boolean);

    return {
      products: formattedProducts,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    };
  } catch (error) {
    console.error('Error fetching POS products:', error);
    throw new Error('Could not fetch products for POS.');
  }
}

interface GetPosProductsDeltaParams {
  prisma: PrismaClient;
  organizationId: string;
  locationId: string;
  lastSync: string;
  page?: number;
  limit?: number;
}

export async function getPosProductsDelta({
  prisma,
  organizationId,
  locationId,
  lastSync,
  page = 1,
  limit = 50,
}: GetPosProductsDeltaParams) {
  try {
    const skip = (page - 1) * limit;
    const lastSyncDate = new Date(lastSync);

    const whereClause: Prisma.ProductWhereInput = {
      organizationId,
      type: 'FINISHED_GOOD',
      isActive: true,
      OR: [
        { updatedAt: { gt: lastSyncDate } },
        { createdAt: { gt: lastSyncDate } },
        {
          variants: {
            some: {
              OR: [
                { updatedAt: { gt: lastSyncDate } },
                { createdAt: { gt: lastSyncDate } },
                {
                  sellingUnits: {
                    some: {
                      OR: [{ updatedAt: { gt: lastSyncDate } }, { createdAt: { gt: lastSyncDate } }],
                    },
                  },
                },
                {
                  variantStocks: {
                    some: {
                      locationId: locationId,
                      lastUpdated: { gt: lastSyncDate },
                    },
                  },
                },
              ],
            },
          },
        },
      ],
    };

    const priceListSelect = {
      where: {
        priceList: { isActive: true },
      },
      select: {
        id: true,
        price: true,
        minQuantity: true,
        maxQuantity: true,
        priceList: {
          select: {
            id: true,
            code: true,
            name: true,
            priority: true,
            validFrom: true,
            validTo: true,
          },
        },
      },
    };

    const [total, productsRaw] = await (prisma as any).$transaction([
      (prisma as any).product.count({ where: whereClause }),
      (prisma as any).product.findMany({
        where: whereClause,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          imageUrls: true,
          updatedAt: true,
          createdAt: true,
          category: { select: { name: true } },
          variants: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              sku: true,
              barcode: true,
              retailPrice: true,
              wholesalePrice: true,
              updatedAt: true,
              baseUnit: { select: { id: true, name: true } },
              baseOrgUnit: { select: { id: true, name: true } },
              priceListItems: {
                ...priceListSelect,
                where: {
                  ...priceListSelect.where,
                  sellingUnitId: null,
                },
              },
              sellingUnits: {
                where: { isActive: true },
                select: {
                  id: true,
                  retailPrice: true,
                  wholesalePrice: true,
                  conversionMultiplier: true,
                  systemUnit: { select: { id: true, name: true } },
                  orgUnit: { select: { id: true, name: true } },
                  priceListItems: priceListSelect,
                },
              },
              variantStocks: {
                where: { locationId },
                select: { availableStock: true },
              },
            },
          },
        },
      }),
    ]);

    const formattedProducts = productsRaw
      .map((product: any) => {
        let productTotalStock = 0;

        const variants = product.variants.map((variant: any) => {
          const stock = variant.variantStocks.reduce((sum: number, s: any) => sum + (Number(s.availableStock) || 0), 0);
          productTotalStock += stock;

          const sellableUnits: any[] = [];
          const baseUnitId = variant.baseUnit?.id || variant.baseOrgUnit?.id || 'base';
          const baseUnitName = variant.baseUnit?.name || variant.baseOrgUnit?.name || 'Unit';

          const formatPricing = (items: any[]) => {
            return (
              items?.map(item => ({
                price: Number(item.price),
                minQty: item.minQuantity,
                maxQty: item.maxQuantity,
                listId: item.priceList.id,
                listName: item.priceList.name,
                listCode: item.priceList.code,
                priority: item.priceList.priority,
                validFrom: item.priceList.validFrom,
                validTo: item.priceList.validTo,
              })) || []
            );
          };

          if (variant.retailPrice || variant.wholesalePrice) {
            sellableUnits.push({
              unitId: baseUnitId,
              unitName: baseUnitName,
              price: Number(variant.retailPrice) || 0,
              wholesalePrice: Number(variant.wholesalePrice) || 0,
              conversion: 1.0,
              isBaseUnit: true,
              pricing: formatPricing(variant.priceListItems),
            });
          }

          variant.sellingUnits.forEach((unit: any) => {
            const unitId = unit.systemUnit?.id || unit.orgUnit?.id;
            const unitName = unit.systemUnit?.name || unit.orgUnit?.name;
            if (unitId === baseUnitId) return;

            if (unitName && (unit.retailPrice || unit.wholesalePrice)) {
              sellableUnits.push({
                unitId: unitId,
                unitName: unitName,
                price: Number(unit.retailPrice) || 0,
                wholesalePrice: Number(unit.wholesalePrice) || 0,
                conversion: Number(unit.conversionMultiplier) || 1,
                isBaseUnit: false,
                pricing: formatPricing(unit.priceListItems),
              });
            }
          });

          return {
            variantId: variant.id,
            name: variant.name,
            sku: variant.sku,
            barcode: variant.barcode,
            stock,
            sellableUnits,
            updatedAt: variant.updatedAt,
          };
        });

        if (variants.length === 0) return null;

        return {
          productId: product.id,
          name: product.name,
          category: product.category?.name || 'Uncategorized',
          imageUrl: product.imageUrls?.[0] || null,
          totalStock: productTotalStock,
          variants,
          updatedAt: product.updatedAt,
          createdAt: product.createdAt,
        };
      })
      .filter(Boolean);

    return {
      products: formattedProducts,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
      syncTimestamp: new Date(),
    };
  } catch (error) {
    console.error('Error fetching POS delta products:', error);
    throw new Error('Could not fetch delta products for POS.');
  }
}
