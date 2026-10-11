import { ProductVariantQueryDto } from "../../../catalog/application/dto/product.dto";
import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  Logger,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { MovementType } from "@repo/db";

import { V3AuthCoreService } from "../../../auth-core/infrastructure/services/v3-auth-core.service";
import { type V3ApiContext } from "@repo/shared/api/v3";
import { validateDeviceKey, createMemberToken } from "@repo/shared/api/v2";
import { FastifyRequest } from "fastify";
import { CookieSerializeOptions } from "@fastify/cookie";
import axios from "axios";
import { env } from "@repo/env";
import { Decimal } from "decimal.js";
import { isSafeUrl } from "@repo/shared/server";
import {
  CreateRecipeDto,
  UpdateRecipeDto,
  CreateBatchDto,
  UpdateBatchDto,
  CompleteBatchDto,
  CreateTemplateDto,
  UpdateTemplateDto,
  CreateProductionCategoryDto,
  UpdateProductionCategoryDto,
  UpdateProductionSettingsDto,
  AddBakerDto,
  UpdateBakerDto,
  ReceiveIngredientsDto,
  CreateIngredientDto,
  UpdateIngredientDto,
  CreateQualityIncidentDto,
  UpdateQualityIncidentDto,
  DispatchStagedBatchDto,
  DisposeStagedStockDto,
} from "../dto/production.dto";


function getUnitSearchTerms(candidate: string): string[] {
  const terms = new Set<string>();
  const trimmed = candidate.trim();
  if (!trimmed) return [];

  terms.add(trimmed);

  const parts = trimmed.split(/[-_]+/);
  for (const part of parts) {
    if (part) {
      terms.add(part);
      if (part.endsWith('s') && part.length > 1) {
        terms.add(part.slice(0, -1));
      }
    }
  }

  if (trimmed.endsWith('s') && trimmed.length > 1) {
    terms.add(trimmed.slice(0, -1));
  }

  return Array.from(terms);
}

function cleanUnitId(id?: string | null): string | undefined {
  if (!id || (typeof id === 'string' && id.trim() === '')) return undefined;
  return id;
}

@Injectable()
export class ProductionService {
  private readonly logger = new Logger(ProductionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authCoreService: V3AuthCoreService,
  ) {}

  private async resolveUnitId(
    systemUnitId?: string | null,
    orgUnitId?: string | null,
    organizationId?: string,
    label: string = 'unit',
  ): Promise<{ systemUnitId?: string; orgUnitId?: string }> {
    const sysId = cleanUnitId(systemUnitId);
    const customId = cleanUnitId(orgUnitId);

    if (!sysId && !customId) {
      return {};
    }

    const candidate = sysId || customId;

    if (candidate) {
      const systemUnit = await this.prisma.client.systemUnit.findUnique({
        where: { id: candidate },
        select: { id: true },
      });

      if (systemUnit) {
        return { systemUnitId: candidate, orgUnitId: undefined };
      }

      const orgUnit = await this.prisma.client.organizationUnit.findFirst({
        where: {
          id: candidate,
          ...(organizationId ? { organizationId } : {}),
        },
        select: { id: true },
      });

      if (orgUnit) {
        return { systemUnitId: undefined, orgUnitId: candidate };
      }

      const searchTerms = getUnitSearchTerms(candidate);
      if (searchTerms.length > 0) {
        const sysFallback = await this.prisma.client.systemUnit.findFirst({
          where: {
            OR: searchTerms.flatMap((term) => [
              { symbol: { equals: term, mode: 'insensitive' } },
              { name: { equals: term, mode: 'insensitive' } },
            ]),
          },
          select: { id: true },
        });

        if (sysFallback) {
          return { systemUnitId: sysFallback.id, orgUnitId: undefined };
        }

        const orgFallback = await this.prisma.client.organizationUnit.findFirst({
          where: {
            ...(organizationId ? { organizationId } : {}),
            OR: searchTerms.flatMap((term) => [
              { symbol: { equals: term, mode: 'insensitive' } },
              { name: { equals: term, mode: 'insensitive' } },
            ]),
          },
          select: { id: true },
        });

        if (orgFallback) {
          return { systemUnitId: undefined, orgUnitId: orgFallback.id };
        }
      }

      throw new BadRequestException(
        `The specified ${label} '${candidate}' was not found as a valid System Unit or Organization Unit.`,
      );
    }

    return {};
  }

  async getAttendanceStatus(ctx: V3ApiContext) {
    if (!ctx.memberId) {
      throw new UnauthorizedException("Member authentication required.");
    }
    const { organizationId, memberId } = ctx;
    const member = await this.prisma.client.member.findFirst({
      where: { id: memberId, organizationId },
      select: {
        id: true,
        status: true,
        isCheckedIn: true,
        lastCheckInTime: true,
        currentCheckInLocationId: true,
      },
    });

    if (!member) throw new NotFoundException("Member not found");
    return member;
  }

  async getCategory(organizationId: string, id: string) {
    return this.prisma.client.bakeryCategory.findFirst({
      where: { id, organizationId },
    });
  }

  async getIngredientRecords(organizationId: string) {
    return this.prisma.client.stockMovement.findMany({
      where: {
        organizationId,
        variant: {
          product: {
            type: "RAW_MATERIAL" as any,
          },
        },
      },
      select: {
        id: true,
        quantity: true,
        movementType: true,
        createdAt: true,
        notes: true,
        variant: {
          select: {
            id: true,
            name: true,
            sku: true,
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        fromLocation: {
          select: {
            id: true,
            name: true,
          },
        },
        toLocation: {
          select: {
            id: true,
            name: true,
          },
        },
        member: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async getProductionOverview(organizationId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      batches,
      recipesCount,
      bakersCount,
      recipeStats,
      recipeGroups,
      totalBatches,
      activeBatches,
      completedToday,
      rawMaterialStocks,
    ] = await Promise.all([
      this.prisma.client.batch.findMany({
        where: { organizationId },
        take: 10,
        orderBy: { scheduledStartAt: "desc" },
        select: {
          id: true,
          batchNumber: true,
          status: true,
          scheduledStartAt: true,
          actualQuantity: true,
          completedAt: true,
          recipe: { select: { id: true, name: true } },
          leadBaker: {
            select: {
              id: true,
              member: {
                select: {
                  id: true,
                  user: { select: { name: true, image: true } },
                },
              },
            },
          },
        },
      }),
      this.prisma.client.recipe.count({ where: { organizationId } }),
      this.prisma.client.bakeryBaker.count({
        where: { bakerySettings: { organizationId } },
      }),
      this.prisma.client.recipe.aggregate({
        where: { organizationId },
        _avg: { costPrice: true },
      }),
      this.prisma.client.recipe.groupBy({
        where: { organizationId },
        by: ["categoryId"],
        _count: { _all: true },
      }),
      this.prisma.client.batch.count({ where: { organizationId } }),
      this.prisma.client.batch.count({
        where: { organizationId, status: "IN_PROGRESS" as any },
      }),
      this.prisma.client.batch.count({
        where: {
          organizationId,
          status: "COMPLETED" as any,
          completedAt: { gte: today },
        },
      }),
      this.prisma.client.productVariantStock.findMany({
        where: {
          organizationId,
          variant: { product: { type: "RAW_MATERIAL" as any } },
        },
        select: {
          id: true,
          availableStock: true,
          reorderPoint: true,
          reorderQty: true,
          variant: {
            select: {
              name: true,
              sku: true,
              buyingPrice: true,
              baseUnit: { select: { symbol: true } },
              baseOrgUnit: { select: { symbol: true } },
            },
          },
        },
      }),
    ]);

    const lowStockIngredientsAll = rawMaterialStocks.filter((s: any) =>
      Number(s.availableStock) <= Number(s.reorderPoint ?? 5)
    );
    const lowStockItems = lowStockIngredientsAll.length;
    const lowStockPreview = lowStockIngredientsAll.slice(0, 10);

    const categoryIds = recipeGroups
      .map(g => g.categoryId)
      .filter((id): id is string => !!id);
    const categories = await this.prisma.client.bakeryCategory.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });
    const categoryMap = new Map(categories.map(c => [c.id, c.name]));

    const recipesByCategory: Record<string, number> = {};
    recipeGroups.forEach(g => {
      const catName = g.categoryId
        ? categoryMap.get(g.categoryId) || "Uncategorized"
        : "Uncategorized";
      recipesByCategory[catName] =
        (recipesByCategory[catName] || 0) + g._count._all;
    });

    const lowStockIngredients = lowStockPreview.map((s: any) => ({
      id: s.id,
      name: s.variant.name,
      sku: s.variant.sku,
      current: Number(s.availableStock),
      reorder: Number(s.reorderPoint || 0),
      max: Number(
        s.reorderQty || (s.reorderPoint ? Number(s.reorderPoint) * 2 : 100),
      ),
      unit: s.variant.baseUnit?.symbol || s.variant.baseOrgUnit?.symbol || "",
    }));

    const totalInventoryValue = rawMaterialStocks.reduce(
      (acc, s: any) =>
        acc + Number(s.availableStock) * Number(s.variant.buyingPrice || 0),
      0,
    );

    return {
      recentBatches: batches.map(b => ({
        ...b,
        productionDate: b.scheduledStartAt,
      })),
      recipesCount,
      bakersCount,
      averageRecipeCost: Number(recipeStats._avg.costPrice || 0),
      recipesByCategory,
      totalInventoryValue,
      lowStockIngredients,
      stockData: lowStockIngredients,
      summary: {
        totalBatches,
        activeBatches,
        completedToday,
        lowStockItems,
      },
    };
  }

  async getIngredients(organizationId: string) {
    const variants = await this.prisma.client.productVariant.findMany({
      where: {
        product: {
          organizationId,
          type: "RAW_MATERIAL" as any,
        },
      },
      select: {
        id: true,
        productId: true,
        name: true,
        sku: true,
        buyingPrice: true,
        reorderPoint: true,
        reorderQty: true,
        tags: true,
        updatedAt: true,
        product: {
          select: {
            id: true,
            name: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        baseUnit: true,
        baseOrgUnit: true,
        variantStocks: {
          select: {
            locationId: true,
            availableStock: true,
          },
        },
      },
    });

    return variants.map(v => {
      const currentStock = v.variantStocks.reduce(
        (sum, s) => sum + Number(s.availableStock || 0),
        0,
      );
      return {
        id: v.id,
        productId: v.productId,
        name: v.name || v.product.name,
        sku: v.sku,
        unitPrice: Number(v.buyingPrice || 0),
        currentStock,
        reorderLevel: v.reorderPoint || 0,
        maxStock:
          v.reorderQty || (v.reorderPoint ? Number(v.reorderPoint) * 2 : 0),
        unit: v.baseUnit || v.baseOrgUnit || { symbol: "" },
        category: v.product.category,
        tags: v.tags,
        lastRestocked: v.updatedAt,
        averageUsagePerWeek: 0,
        totalUsed: 0,
      };
    });
  }

  async getRecipes(organizationId: string) {
    return this.prisma.client.recipe.findMany({
      where: { organizationId },
      include: {
        category: true,
        systemUnit: true,
        orgUnit: true,
        producesVariant: {
          include: {
            product: true,
          },
        },
        ingredients: {
          include: {
            ingredientVariant: {
              include: { product: true },
            },
            subRecipe: {
              include: {
                category: true,
                producesVariant: { include: { product: true } },
              },
            },
            systemUnit: true,
            orgUnit: true,
          },
        },
      },
    });
  }

  async getRecipe(organizationId: string, id: string) {
    const recipe = await this.prisma.client.recipe.findFirst({
      where: { id, organizationId },
      include: {
        category: true,
        systemUnit: true,
        orgUnit: true,
        ingredients: {
          include: {
            ingredientVariant: {
              include: { product: true },
            },
            subRecipe: {
              include: {
                category: true,
                producesVariant: { include: { product: true } },
              },
            },
            systemUnit: true,
            orgUnit: true,
          },
        },
      },
    });
    if (!recipe) throw new NotFoundException("Recipe not found");
    return recipe;
  }

  async duplicateRecipe(organizationId: string, id: string) {
    const recipe = await this.prisma.client.recipe.findFirst({
      where: { id, organizationId },
      include: {
        ingredients: true,
      },
    });

    if (!recipe) throw new NotFoundException("Recipe not found");

    const { id: _, createdAt: __, updatedAt: ___, ...recipeData } = recipe;

    const resolvedYieldUnit = await this.resolveUnitId(
      recipeData.systemUnitId,
      recipeData.orgUnitId,
      organizationId,
      "recipe yield unit",
    );

    const resolvedIngredients = await Promise.all(
      recipe.ingredients.map(async ({ id: _, recipeId: __, ...ing }) => {
        const resolvedIngUnit = await this.resolveUnitId(
          ing.systemUnitId,
          ing.orgUnitId,
          organizationId,
          `ingredient '${ing.ingredientVariantId}' unit`,
        );
        return {
          ...ing,
          systemUnitId: resolvedIngUnit.systemUnitId,
          orgUnitId: resolvedIngUnit.orgUnitId,
        };
      }),
    );

    return this.prisma.client.recipe.create({
      data: {
        ...recipeData,
        name: `${recipeData.name} (Copy)`,
        systemUnitId: resolvedYieldUnit.systemUnitId,
        orgUnitId: resolvedYieldUnit.orgUnitId,
        ingredients: {
          create: resolvedIngredients,
        },
      },
    });
  }

  async generateRecipeAi(prompt: string) {
    this.logger.log(`Generating recipe for prompt: ${prompt}`);
    return {
      name: "AI Generated Recipe",
      description: `Generated based on: ${prompt}`,
      ingredients: [],
      steps: [],
    };
  }

  async generateBatchNumber(organizationId: string, tx?: any) {
    const prisma = tx || this.prisma.client;
    const settings = await prisma.bakerySettings.findUnique({
      where: { organizationId },
    });

    const prefix = settings?.batchPrefix || "BAT";
    const separator = settings?.batchSeparator || "-";
    const dateFormat = settings?.batchDateFormat || "YYYYMMDD";
    const sequenceLength = parseInt(settings?.batchSequence || "4");
    const genType = settings?.batchGenerationType || "SEQUENCE";

    let dateStr = "";
    const now = new Date();
    if (dateFormat === "YYYYMMDD") {
      dateStr = now.toISOString().split("T")[0].replace(/-/g, "");
    } else if (dateFormat === "YYMM") {
      dateStr =
        now.getFullYear().toString().slice(-2) +
        (now.getMonth() + 1).toString().padStart(2, "0");
    }

    let codePart = "";
    if (genType === "RANDOM") {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let rand = "";
      for (let i = 0; i < sequenceLength; i++) {
        rand += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      codePart = rand;
    } else {
      const count = await prisma.batch.count({ where: { organizationId } });
      codePart = (count + 1).toString().padStart(sequenceLength, "0");
    }

    const parts = [prefix, dateStr, codePart].filter(Boolean);
    return parts.join(separator);
  }

  async duplicateBatch(organizationId: string, id: string) {
    const batch = await this.prisma.client.batch.findUnique({
      where: { id, organizationId },
    });

    if (!batch) throw new NotFoundException("Batch not found");

    const {
      id: _,
      batchNumber: __,
      status: ___,
      startedAt: ____,
      completedAt: _____,
      cancelledAt: ______,
      ...batchData
    } = batch;

    const newBatchNumber = await this.generateBatchNumber(organizationId);

    return this.prisma.client.batch.create({
      data: {
        ...batchData,
        batchNumber: newBatchNumber,
        status: "PLANNED",
      } as any,
    });
  }

  async duplicateTemplate(organizationId: string, id: string) {
    const template = await this.prisma.client.template.findUnique({
      where: { id, organizationId },
    });

    if (!template) throw new NotFoundException("Template not found");

    const { id: _, createdAt: __, updatedAt: ___, ...templateData } = template;

    return this.prisma.client.template.create({
      data: {
        ...templateData,
        name: `${templateData.name} (Copy)`,
      } as any,
    });
  }

  async createBatchFromTemplate(organizationId: string, id: string) {
    const template = await this.prisma.client.template.findUnique({
      where: { id, organizationId },
    });

    if (!template) throw new NotFoundException("Template not found");

    const batchNumber = await this.generateBatchNumber(organizationId);

    return this.prisma.client.batch.create({
      data: {
        organization: { connect: { id: organizationId } },
        recipe: { connect: { id: template.recipeId } },
        leadBaker: template.leadBakerId
          ? { connect: { id: template.leadBakerId } }
          : undefined,
        plannedQuantity: (template as any).defaultQuantity || template.quantity,
        batchNumber,
        status: "PLANNED",
        notes: `Created from template: ${template.name}`,
        scheduledStartAt: new Date(),
      } as any,
    });
  }

  async createRecipe(organizationId: string, data: CreateRecipeDto) {
    const {
      name,
      categoryId,
      producesVariantId,
      yieldQuantity,
      costPrice,
      description,
      prepTime,
      bakeTime,
      totalTime,
      difficulty,
      temperatureCelsius,
      servingSize,
      instructions,
      notes,
      tags,
      isArchived,
      ingredients,
    } = data;

    const rawSystemUnitId = cleanUnitId(data.systemUnitId);
    const rawOrgUnitId = cleanUnitId(data.orgUnitId);

    if (!rawSystemUnitId && !rawOrgUnitId) {
      throw new BadRequestException("At least one yield unit (system or organization) must be selected.");
    }

    if (!ingredients || ingredients.length === 0) {
      throw new BadRequestException("At least one ingredient is required.");
    }

    for (const ing of ingredients) {
      const ingSysId = cleanUnitId(ing.systemUnitId);
      const ingOrgId = cleanUnitId(ing.orgUnitId);
      if (!ingSysId && !ingOrgId) {
        throw new BadRequestException("Each ingredient must have a unit (system or organization) selected.");
      }
    }

    const totalFlour = ingredients
      .filter((i) => i.isFlour)
      .reduce((acc, i) => acc + (Number(i.quantity) || 0), 0);

    // ⚡ Bolt Optimization: Concurrently resolve yield unit and ingredient units with Promise.all,
    // collapsing sequential O(N) database unit lookups into a single concurrent roundtrip.
    const [resolvedYieldUnit, resolvedIngredients] = await Promise.all([
      this.resolveUnitId(
        rawSystemUnitId,
        rawOrgUnitId,
        organizationId,
        "recipe yield unit",
      ),
      Promise.all(
        ingredients.map(async (ing) => {
          if (!ing.ingredientVariantId && !ing.subRecipeId) {
            throw new BadRequestException("Each ingredient must specify either a product variant or a sub-recipe.");
          }

          const ingSysId = cleanUnitId(ing.systemUnitId);
          const ingOrgId = cleanUnitId(ing.orgUnitId);

          const resolvedIngUnit = await this.resolveUnitId(
            ingSysId,
            ingOrgId,
            organizationId,
            `ingredient unit`,
          );

          if (!resolvedIngUnit.systemUnitId && !resolvedIngUnit.orgUnitId) {
            throw new BadRequestException("Each ingredient must have a valid unit selected.");
          }

          const bakersPct = ing.bakersPercentage !== undefined && ing.bakersPercentage !== null
            ? ing.bakersPercentage
            : (totalFlour > 0 ? (Number(ing.quantity) / totalFlour) * 100 : null);

          return {
            ingredientVariantId: ing.ingredientVariantId || undefined,
            subRecipeId: ing.subRecipeId || undefined,
            isFlour: Boolean(ing.isFlour),
            bakersPercentage: bakersPct,
            quantity: ing.quantity,
            systemUnitId: resolvedIngUnit.systemUnitId,
            orgUnitId: resolvedIngUnit.orgUnitId,
            preparationNotes: ing.preparationNotes,
          };
        }),
      ),
    ]);

    if (!resolvedYieldUnit.systemUnitId && !resolvedYieldUnit.orgUnitId) {
      throw new BadRequestException("At least one valid yield unit (system or organization) must be selected.");
    }

    return this.prisma.client.recipe.create({
      data: {
        name,
        categoryId,
        producesVariantId,
        yieldQuantity,
        systemUnitId: resolvedYieldUnit.systemUnitId,
        orgUnitId: resolvedYieldUnit.orgUnitId,
        costPrice,
        description,
        prepTime,
        bakeTime,
        totalTime,
        difficulty: difficulty as any,
        temperatureCelsius,
        servingSize,
        instructions,
        notes,
        tags,
        organizationId,
        ingredients: {
          create: resolvedIngredients,
        },
      },
      include: {
        category: true,
        systemUnit: true,
        orgUnit: true,
        producesVariant: {
          include: {
            product: true,
          },
        },
        ingredients: {
          include: {
            ingredientVariant: {
              include: { product: true },
            },
            subRecipe: {
              include: {
                category: true,
                producesVariant: { include: { product: true } },
              },
            },
            systemUnit: true,
            orgUnit: true,
          },
        },
      },
    });
  }

  async updateRecipe(organizationId: string, id: string, data: UpdateRecipeDto) {
    const { ingredients, isArchived, ...rest } = data;

    const existing = await this.prisma.client.recipe.findFirst({
      where: { id, organizationId },
    });
    if (!existing) throw new NotFoundException("Recipe not found");

    let resolvedYieldUnit: { systemUnitId?: string; orgUnitId?: string } | undefined = undefined;

    if (rest.systemUnitId !== undefined || rest.orgUnitId !== undefined || rest.yieldQuantity !== undefined) {
      const sysUnit = rest.systemUnitId !== undefined
        ? cleanUnitId(rest.systemUnitId)
        : (rest.orgUnitId !== undefined ? undefined : existing.systemUnitId);
      const orgUnit = rest.orgUnitId !== undefined
        ? cleanUnitId(rest.orgUnitId)
        : (rest.systemUnitId !== undefined ? undefined : existing.orgUnitId);

      if (!sysUnit && !orgUnit) {
        throw new BadRequestException("At least one yield unit (system or organization) must be selected.");
      }

      resolvedYieldUnit = await this.resolveUnitId(
        sysUnit,
        orgUnit,
        organizationId,
        "recipe yield unit",
      );

      if (!resolvedYieldUnit.systemUnitId && !resolvedYieldUnit.orgUnitId) {
        throw new BadRequestException("At least one valid yield unit (system or organization) must be selected.");
      }
    }

    let resolvedIngredients: any[] | undefined = undefined;

    if (ingredients !== undefined) {
      if (!ingredients || ingredients.length === 0) {
        throw new BadRequestException("Ingredients list cannot be empty.");
      }

      const totalFlour = ingredients
        .filter((i) => i.isFlour)
        .reduce((acc, i) => acc + (Number(i.quantity) || 0), 0);

      // ⚡ Bolt Optimization: Parallelize ingredient unit lookups using Promise.all
      // to avoid sequential O(N) database queries during recipe updates.
      resolvedIngredients = await Promise.all(
        ingredients.map(async (ing) => {
          if (!ing.ingredientVariantId && !ing.subRecipeId) {
            throw new BadRequestException("Each ingredient must specify either a product variant or a sub-recipe.");
          }

          const ingSysId = cleanUnitId(ing.systemUnitId);
          const ingOrgId = cleanUnitId(ing.orgUnitId);

          if (!ingSysId && !ingOrgId) {
            throw new BadRequestException("Each ingredient must have a unit (system or organization) selected.");
          }

          const resolvedIngUnit = await this.resolveUnitId(
            ingSysId,
            ingOrgId,
            organizationId,
            `ingredient unit`,
          );

          if (!resolvedIngUnit.systemUnitId && !resolvedIngUnit.orgUnitId) {
            throw new BadRequestException("Each ingredient must have a valid unit selected.");
          }

          const bakersPct = ing.bakersPercentage !== undefined && ing.bakersPercentage !== null
            ? ing.bakersPercentage
            : (totalFlour > 0 ? (Number(ing.quantity) / totalFlour) * 100 : null);

          return {
            ingredientVariantId: ing.ingredientVariantId || undefined,
            subRecipeId: ing.subRecipeId || undefined,
            isFlour: Boolean(ing.isFlour),
            bakersPercentage: bakersPct,
            quantity: ing.quantity,
            systemUnitId: resolvedIngUnit.systemUnitId,
            orgUnitId: resolvedIngUnit.orgUnitId,
            preparationNotes: ing.preparationNotes,
          };
        }),
      );
    }

    return this.prisma.client.recipe.update({
      where: { id, organizationId },
      data: {
        ...rest,
        systemUnitId: resolvedYieldUnit ? (resolvedYieldUnit.systemUnitId ?? null) : undefined,
        orgUnitId: resolvedYieldUnit ? (resolvedYieldUnit.orgUnitId ?? null) : undefined,
        difficulty: rest.difficulty as any,
        ingredients: resolvedIngredients
          ? {
              deleteMany: {},
              create: resolvedIngredients,
            }
          : undefined,
      },
      include: {
        category: true,
        systemUnit: true,
        orgUnit: true,
        producesVariant: {
          include: {
            product: true,
          },
        },
        ingredients: {
          include: {
            ingredientVariant: {
              include: { product: true },
            },
            subRecipe: {
              include: {
                category: true,
                producesVariant: { include: { product: true } },
              },
            },
            systemUnit: true,
            orgUnit: true,
          },
        },
      },
    });
  }

  async deleteRecipe(organizationId: string, id: string) {
    return this.prisma.client.recipe.delete({
      where: { id, organizationId },
    });
  }

  async getBatches(organizationId: string, query: any) {
    const { status, recipeId, limit = 100, page = 1 } = query;
    const where: any = { organizationId };
    if (status && status !== "all") where.status = status;
    if (recipeId) where.recipeId = recipeId;

    const skip = (Number(page) - 1) * Number(limit);

    return this.prisma.client.batch.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { scheduledStartAt: "desc" },
      select: {
        id: true,
        batchNumber: true,
        organizationId: true,
        recipeId: true,
        status: true,
        plannedQuantity: true,
        actualQuantity: true,
        systemUnitId: true,
        orgUnitId: true,
        recipeMultiplier: true,
        scheduledStartAt: true,
        startedAt: true,
        completedAt: true,
        cancelledAt: true,
        duration: true,
        notes: true,
        productionDate: true,
        expiresAt: true,
        expirationStatus: true,
        shelfLifeDays: true,
        wasteQuantity: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
        recipe: {
          select: {
            id: true,
            name: true,
            yieldQuantity: true,
            systemUnitId: true,
          },
        },
        leadBaker: {
          select: {
            id: true,
            member: {
              select: {
                id: true,
                user: {
                  select: { id: true, name: true, email: true, image: true },
                },
              },
            },
          },
        },
        assistantBakers: {
          select: {
            id: true,
            member: {
              select: {
                id: true,
                user: {
                  select: { id: true, name: true, email: true, image: true },
                },
              },
            },
          },
        },
        systemUnit: { select: { id: true, name: true, symbol: true } },
        orgUnit: { select: { id: true, name: true, symbol: true } },
      },
    });
  }

  async getBatch(organizationId: string, id: string) {
    const batch = await this.prisma.client.batch.findFirst({
      where: { id, organizationId },
      include: {
        recipe: {
          include: {
            ingredients: {
              include: {
                ingredientVariant: {
                  include: {
                    product: true,
                    stockBatches: {
                      where: { currentQuantity: { gt: 0 } },
                      orderBy: { expiryDate: "asc" },
                    },
                  },
                },
                systemUnit: true,
              },
            },
          },
        },
        leadBaker: { include: { member: { include: { user: true } } } },
        assistantBakers: { include: { member: { include: { user: true } } } },
      },
    });
    if (!batch) throw new NotFoundException("Batch not found");
    return batch;
  }

  async createBatch(organizationId: string, data: CreateBatchDto) {
    const cleanedSysUnitId = cleanUnitId(data.systemUnitId);
    const cleanedOrgUnitId = cleanUnitId(data.orgUnitId);

    if (!cleanedSysUnitId && !cleanedOrgUnitId) {
      throw new BadRequestException("At least one unit (system or organization) must be selected.");
    }

    const batchNumber = await this.generateBatchNumber(organizationId);

    const {
      recipeId,
      plannedQuantity,
      systemUnitId,
      orgUnitId,
      recipeMultiplier,
      leadBakerId,
      notes,
      outputLocationId,
      tags,
      assistantBakerIds,
      date,
      time,
      scheduledStartAt: providedScheduledStartAt,
    } = data;

    let scheduledStartAt: Date | undefined = providedScheduledStartAt
      ? new Date(providedScheduledStartAt)
      : undefined;

    if (!scheduledStartAt && date && time) {
      const [hours, minutes] = time.split(":").map(Number);
      const d = new Date(date);
      d.setHours(hours, minutes, 0, 0);
      scheduledStartAt = d;
    }

    return this.prisma.client.batch.create({
      data: {
        recipeId,
        plannedQuantity,
        systemUnitId: cleanUnitId(systemUnitId),
        orgUnitId: cleanUnitId(orgUnitId),
        recipeMultiplier: recipeMultiplier ?? 1.0,
        leadBakerId,
        notes,
        outputLocationId,
        tags,
        batchNumber,
        scheduledStartAt: scheduledStartAt || new Date(),
        organizationId,
        assistantBakers: assistantBakerIds?.length
          ? {
              connect: assistantBakerIds.map((id: string) => ({ id })),
            }
          : undefined,
      },
    });
  }

  async updateBatch(organizationId: string, id: string, data: UpdateBatchDto) {
    const { assistantBakerIds, status, ...updateData } = data;
    if (updateData.systemUnitId !== undefined) updateData.systemUnitId = cleanUnitId(updateData.systemUnitId);
    if (updateData.orgUnitId !== undefined) updateData.orgUnitId = cleanUnitId(updateData.orgUnitId);

    return this.prisma.client.batch.update({
      where: { id, organizationId },
      data: {
        ...updateData,
        status: status as any,
        assistantBakers: assistantBakerIds
          ? {
              set: assistantBakerIds.map((id: string) => ({ id })),
            }
          : undefined,
      },
    });
  }

  async deleteBatch(organizationId: string, id: string) {
    return this.prisma.client.batch.delete({
      where: { id, organizationId },
    });
  }

  async startBatch(organizationId: string, id: string) {
    return this.prisma.client.batch.update({
      where: { id, organizationId },
      data: {
        status: "IN_PROGRESS" as any,
        startedAt: new Date(),
      },
    });
  }

  async completeBatch(ctx: V3ApiContext, id: string, data: CompleteBatchDto) {
    const organizationId = ctx.organizationId;
    const { actualQuantity, wasteQuantity, ingredientConsumptions, notes } = data;

    const batch = await this.prisma.client.batch.findUnique({
      where: { id, organizationId },
      include: { recipe: { include: { producesVariant: true } } },
    });

    if (!batch) throw new NotFoundException("Batch not found");

    const grossQuantity = Number(actualQuantity || 0);
    const waste = Number(wasteQuantity || 0);
    const netQuantity = Math.max(0, grossQuantity - waste);

    const settings = await this.prisma.client.bakerySettings.findUnique({
      where: { organizationId },
    });
    const enableStaging = settings?.enableProductionStaging ?? false;

    let stagingData: any = {
      stagedQuantity: 0,
      dispatchedQuantity: 0,
      stagingWasteQuantity: 0,
      stagingStatus: "NOT_STAGED",
    };

    if (enableStaging && netQuantity > 0) {
      stagingData = {
        stagedQuantity: netQuantity,
        dispatchedQuantity: 0,
        stagingWasteQuantity: 0,
        stagingStatus: "STAGED",
      };
    }

    return await this.prisma.client.$transaction(async tx => {
      const updatedBatch = await tx.batch.update({
        where: { id, organizationId },
        data: {
          actualQuantity: grossQuantity,
          status: "COMPLETED" as any,
          completedAt: new Date(),
          qcData: data.qcData,
          wasteQuantity: waste,
          wasteReason: data.wasteReason,
          notes: notes || (batch as any).notes,
          ...stagingData,
        },
      });

      if (ingredientConsumptions && ingredientConsumptions.length > 0) {
        const stockBatchIds = ingredientConsumptions.map((c: any) => c.stockBatchId);

        const stockBatches = await tx.stockBatch.findMany({
          where: {
            id: { in: stockBatchIds },
            organizationId,
          },
        });

        if (stockBatches.length !== new Set(stockBatchIds).size) {
          throw new ForbiddenException(
            "Access denied to one or more requested stock batches.",
          );
        }

        const stockBatchMap = new Map(stockBatches.map(sb => [sb.id, sb]));

        const consumptionData = [];
        const movementData = [];
        const stockBatchUpdates = new Map<string, Decimal>();
        const variantStockUpdates = new Map<
          string,
          { variantId: string; locationId: string; quantity: Decimal }
        >();

        for (const consumption of ingredientConsumptions) {
          const stockBatch = stockBatchMap.get(consumption.stockBatchId);
          if (!stockBatch) {
            throw new NotFoundException(
              `Stock batch ${consumption.stockBatchId} not found`,
            );
          }

          const qty = new Decimal(consumption.quantity);
          const currentTotal =
            stockBatchUpdates.get(consumption.stockBatchId) || new Decimal(0);
          const newTotal = currentTotal.add(qty);

          if (stockBatch.currentQuantity.lt(newTotal)) {
            throw new BadRequestException(
              `Insufficient stock in batch ${stockBatch.batchNumber || stockBatch.id}. Requested: ${newTotal}, Available: ${stockBatch.currentQuantity}`,
            );
          }

          stockBatchUpdates.set(consumption.stockBatchId, newTotal);

          consumptionData.push({
            batchId: id,
            stockBatchId: consumption.stockBatchId,
            quantity: consumption.quantity,
            organizationId,
          });

          movementData.push({
            variantId: stockBatch.variantId,
            stockBatchId: stockBatch.id,
            fromLocationId: stockBatch.locationId,
            quantity: consumption.quantity,
            movementType: MovementType.PRODUCTION_OUT,
            memberId: ctx.memberId!,
            organizationId,
            notes: `Consumed in Batch ${batch.batchNumber}`,
          });

          const vsKey = `${stockBatch.variantId}_${stockBatch.locationId}`;
          const currentVs = variantStockUpdates.get(vsKey) || {
            variantId: stockBatch.variantId,
            locationId: stockBatch.locationId,
            quantity: new Decimal(0),
          };
          currentVs.quantity = currentVs.quantity.add(qty);
          variantStockUpdates.set(vsKey, currentVs);
        }

        await tx.batchIngredientConsumption.createMany({
          data: consumptionData,
        });
        await tx.stockMovement.createMany({ data: movementData });

        const updatePromises = [];

        for (const [sbId, qty] of stockBatchUpdates.entries()) {
          updatePromises.push(
            tx.stockBatch.update({
              where: { id: sbId },
              data: { currentQuantity: { decrement: qty } },
            }),
          );
        }

        for (const vs of variantStockUpdates.values()) {
          updatePromises.push(
            tx.productVariantStock.update({
              where: {
                variantId_locationId: {
                  variantId: vs.variantId,
                  locationId: vs.locationId,
                },
              },
              data: {
                currentStock: { decrement: vs.quantity },
                availableStock: { decrement: vs.quantity },
              },
            }),
          );
        }

        await Promise.all(updatePromises);
      }

      if (batch.recipe.producesVariantId && netQuantity > 0) {
        const locationId = batch.outputLocationId || ctx.locationId;
        if (locationId) {
          const producedStockBatch = await tx.stockBatch.create({
            data: {
              variantId: batch.recipe.producesVariantId,
              batchNumber: batch.batchNumber,
              locationId: locationId,
              initialQuantity: netQuantity,
              currentQuantity: netQuantity,
              purchasePrice: batch.recipe.costPrice || 0,
              organizationId,
              productionBatchId: batch.id,
              receivedDate: new Date(),
              expiryDate: updatedBatch.expiresAt,
            } as any,
          });

          await tx.productVariantStock.upsert({
            where: {
              variantId_locationId: {
                variantId: batch.recipe.producesVariantId,
                locationId: locationId,
              },
            },
            update: {
              currentStock: { increment: netQuantity },
              availableStock: { increment: netQuantity },
            },
            create: {
              productId: (batch.recipe.producesVariant as any).productId,
              variantId: batch.recipe.producesVariantId,
              locationId: locationId,
              currentStock: netQuantity,
              availableStock: netQuantity,
              organizationId,
            } as any,
          });

          await tx.stockMovement.create({
            data: {
              variantId: batch.recipe.producesVariantId,
              stockBatchId: producedStockBatch.id,
              toLocationId: locationId,
              quantity: netQuantity,
              movementType: MovementType.PRODUCTION_IN,
              memberId: ctx.memberId!,
              organizationId,
              notes: `Produced from Batch ${batch.batchNumber} (Net yield after waste)`,
            },
          });
        }
      }

      return updatedBatch;
    });
  }


  async getStagedBatches(ctx: V3ApiContext) {
    const organizationId = ctx.organizationId;
    return this.prisma.client.batch.findMany({
      where: {
        organizationId,
        status: "COMPLETED" as any,
        stagingStatus: {
          in: ["STAGED", "PARTIALLY_DISPATCHED"] as any,
        },
      },
      include: {
        recipe: {
          include: {
            producesVariant: {
              include: {
                product: true,
              },
            },
          },
        },
        outputLocation: true,
        dispatches: {
          include: {
            toLocation: true,
            dispatchedBy: {
              include: { user: true },
            },
          },
          orderBy: { dispatchedAt: "desc" },
        },
      },
      orderBy: { completedAt: "desc" },
    });
  }

  async dispatchStagedBatch(
    ctx: V3ApiContext,
    batchId: string,
    data: DispatchStagedBatchDto,
  ) {
    const organizationId = ctx.organizationId;
    const { toLocationId, quantity, notes } = data;

    const dispatchQty = Number(quantity);
    if (dispatchQty <= 0) {
      throw new BadRequestException("Dispatch quantity must be greater than zero");
    }

    const batch = await this.prisma.client.batch.findFirst({
      where: { id: batchId, organizationId },
      include: {
        recipe: { include: { producesVariant: true } },
      },
    });

    if (!batch) {
      throw new NotFoundException("Batch not found");
    }

    if (batch.status !== "COMPLETED") {
      throw new BadRequestException("Only completed batches can be dispatched");
    }

    const totalStaged = Number(batch.stagedQuantity || 0);
    const currentDispatched = Number(batch.dispatchedQuantity || 0);
    const currentWaste = Number(batch.stagingWasteQuantity || 0);
    const availableToDispatch = Math.max(0, totalStaged - currentDispatched - currentWaste);

    if (dispatchQty > availableToDispatch) {
      throw new BadRequestException(
        `Cannot dispatch ${dispatchQty}. Available staged quantity is ${availableToDispatch}`,
      );
    }

    const toLocation = await this.prisma.client.inventoryLocation.findFirst({
      where: { id: toLocationId, organizationId },
    });
    if (!toLocation) {
      throw new NotFoundException("Destination Front Office location not found");
    }

    return await this.prisma.client.$transaction(async (tx) => {
      const newDispatched = currentDispatched + dispatchQty;
      const newStagingStatus =
        newDispatched + currentWaste >= totalStaged
          ? "FULLY_DISPATCHED"
          : "PARTIALLY_DISPATCHED";

      const updatedBatch = await tx.batch.update({
        where: { id: batchId },
        data: {
          dispatchedQuantity: newDispatched,
          stagingStatus: newStagingStatus as any,
        },
      });

      const dispatchLog = await tx.batchDispatch.create({
        data: {
          batchId,
          toLocationId,
          quantity: dispatchQty,
          dispatchedById: ctx.memberId!,
          notes,
          organizationId,
        },
      });

      if (batch.recipe.producesVariantId) {
        const variantId = batch.recipe.producesVariantId;
        const productId = (batch.recipe.producesVariant as any).productId;

        await tx.productVariantStock.upsert({
          where: {
            variantId_locationId: {
              variantId,
              locationId: toLocationId,
            },
          },
          update: {
            currentStock: { increment: dispatchQty },
            availableStock: { increment: dispatchQty },
          },
          create: {
            productId,
            variantId,
            locationId: toLocationId,
            currentStock: dispatchQty,
            availableStock: dispatchQty,
            organizationId,
          } as any,
        });

        const frontOfficeStockBatch = await tx.stockBatch.create({
          data: {
            variantId,
            batchNumber: `${batch.batchNumber}-FO`,
            locationId: toLocationId,
            initialQuantity: dispatchQty,
            currentQuantity: dispatchQty,
            purchasePrice: batch.recipe.costPrice || 0,
            organizationId,
            productionBatchId: batch.id,
            receivedDate: new Date(),
            expiryDate: batch.expiresAt,
          } as any,
        });

        const fromLocationId = batch.outputLocationId || ctx.locationId;
        await tx.stockMovement.create({
          data: {
            variantId,
            stockBatchId: frontOfficeStockBatch.id,
            fromLocationId,
            toLocationId,
            quantity: dispatchQty,
            movementType: MovementType.TRANSFER,
            memberId: ctx.memberId!,
            organizationId,
            notes: notes || `Dispatched from Batch ${batch.batchNumber} to Front Office (${toLocation.name})`,
          },
        });
      }

      return {
        dispatchLog,
        batch: updatedBatch,
      };
    });
  }

  async disposeStagedStock(
    ctx: V3ApiContext,
    batchId: string,
    data: DisposeStagedStockDto,
  ) {
    const organizationId = ctx.organizationId;
    const { quantity, reason, notes } = data;

    const wasteQty = Number(quantity);
    if (wasteQty <= 0) {
      throw new BadRequestException("Waste quantity must be greater than zero");
    }

    const batch = await this.prisma.client.batch.findFirst({
      where: { id: batchId, organizationId },
      include: { recipe: true },
    });

    if (!batch) {
      throw new NotFoundException("Batch not found");
    }

    const totalStaged = Number(batch.stagedQuantity || 0);
    const currentDispatched = Number(batch.dispatchedQuantity || 0);
    const currentWaste = Number(batch.stagingWasteQuantity || 0);
    const availableToDispatch = Math.max(0, totalStaged - currentDispatched - currentWaste);

    if (wasteQty > availableToDispatch) {
      throw new BadRequestException(
        `Cannot dispose ${wasteQty}. Available staged quantity is ${availableToDispatch}`,
      );
    }

    return await this.prisma.client.$transaction(async (tx) => {
      const newWaste = currentWaste + wasteQty;
      let newStagingStatus = batch.stagingStatus;
      if (currentDispatched + newWaste >= totalStaged) {
        newStagingStatus = currentDispatched === 0 ? ("DISPOSED" as any) : ("FULLY_DISPATCHED" as any);
      }

      const updatedBatch = await tx.batch.update({
        where: { id: batchId },
        data: {
          stagingWasteQuantity: newWaste,
          stagingStatus: newStagingStatus as any,
        },
      });

      if (batch.recipe.producesVariantId) {
        const locationId = batch.outputLocationId || ctx.locationId;
        if (locationId) {
          await tx.productVariantStock.updateMany({
            where: {
              variantId: batch.recipe.producesVariantId,
              locationId,
              organizationId,
            },
            data: {
              currentStock: { decrement: wasteQty },
              availableStock: { decrement: wasteQty },
            },
          });

          await tx.stockMovement.create({
            data: {
              variantId: batch.recipe.producesVariantId,
              fromLocationId: locationId,
              quantity: wasteQty,
              movementType: MovementType.ADJUSTMENT_OUT,
              memberId: ctx.memberId!,
              organizationId,
              notes: notes || `Staging disposal for Batch ${batch.batchNumber}: ${reason || "Spoiled/Damaged"}`,
            },
          });
        }
      }

      return updatedBatch;
    });
  }

  async getBatchTraceability(organizationId: string, id: string) {
    const batch = await this.prisma.client.batch.findFirst({
      where: { id, organizationId },
      include: {
        recipe: true,
        ingredientConsumptions: {
          include: {
            stockBatch: {
              include: {
                variant: { include: { product: true } },
                supplier: true,
                productionBatch: {
                  include: { recipe: true },
                },
              },
            },
          },
        },
        qualityIncidents: true,
      },
    });

    if (!batch) throw new NotFoundException("Batch not found");
    return batch;
  }

  async cancelBatch(organizationId: string, id: string) {
    return this.prisma.client.batch.update({
      where: { id, organizationId },
      data: {
        status: "CANCELLED" as any,
        cancelledAt: new Date(),
      },
    });
  }

  async getTemplates(organizationId: string) {
    return this.prisma.client.template.findMany({
      where: { organizationId },
      include: {
        recipe: true,
        schedules: true,
        assistantBakers: {
          select: {
            id: true,
            member: {
              select: {
                id: true,
                user: {
                  select: { id: true, name: true, email: true, image: true },
                },
              },
            },
          },
        },
        leadBaker: {
          select: {
            id: true,
            member: {
              select: {
                id: true,
                user: {
                  select: { id: true, name: true, email: true, image: true },
                },
              },
            },
          },
        },
      },
    });
  }

  async createTemplate(organizationId: string, data: CreateTemplateDto) {
    const {
      name,
      recipeId,
      quantity,
      systemUnitId,
      orgUnitId,
      recipeMultiplier,
      duration,
      leadBakerId,
      notes,
      isActive,
      shelfLifeDays,
    } = data;

    return this.prisma.client.template.create({
      data: {
        name,
        recipeId,
        quantity,
        systemUnitId: cleanUnitId(systemUnitId),
        orgUnitId: cleanUnitId(orgUnitId),
        recipeMultiplier,
        duration,
        leadBakerId,
        notes,
        isActive: isActive !== undefined ? isActive : true,
        shelfLifeDays,
        organizationId,
      } as any,
    });
  }

  async updateTemplate(organizationId: string, id: string, data: UpdateTemplateDto) {
    const cleanData = { ...data };
    if (cleanData.systemUnitId !== undefined) cleanData.systemUnitId = cleanUnitId(cleanData.systemUnitId);
    if (cleanData.orgUnitId !== undefined) cleanData.orgUnitId = cleanUnitId(cleanData.orgUnitId);
    return this.prisma.client.template.update({
      where: { id, organizationId },
      data: cleanData,
    });
  }

  async deleteTemplate(organizationId: string, id: string) {
    return this.prisma.client.template.delete({
      where: { id, organizationId },
    });
  }

  async getCategories(organizationId: string) {
    return this.prisma.client.bakeryCategory.findMany({
      where: { organizationId },
      include: {
        _count: { select: { recipes: true } },
      },
    });
  }

  async createCategory(organizationId: string, data: CreateProductionCategoryDto) {
    const { name, description } = data;

    const existing = await this.prisma.client.bakeryCategory.findFirst({
      where: {
        organizationId,
        name: { equals: name.trim(), mode: "insensitive" },
      },
    });

    if (existing) {
      throw new ConflictException(`A category with the name "${name.trim()}" already exists.`);
    }

    return this.prisma.client.bakeryCategory.create({
      data: {
        name: name.trim(),
        description,
        organizationId,
      },
    });
  }

  async updateCategory(organizationId: string, id: string, data: UpdateProductionCategoryDto) {
    if (data.name) {
      const existing = await this.prisma.client.bakeryCategory.findFirst({
        where: {
          organizationId,
          name: { equals: data.name.trim(), mode: "insensitive" },
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException(`A category with the name "${data.name.trim()}" already exists.`);
      }
    }

    return this.prisma.client.bakeryCategory.update({
      where: { id, organizationId },
      data: {
        ...data,
        name: data.name ? data.name.trim() : undefined,
      },
    });
  }

  async deleteCategory(organizationId: string, id: string) {
    return this.prisma.client.bakeryCategory.delete({
      where: { id, organizationId },
    });
  }

  async getSettings(organizationId: string) {
    let settings = await this.prisma.client.bakerySettings.findUnique({
      where: { organizationId },
      include: {
        defaultBaker: { include: { member: { include: { user: true } } } },
      },
    });

    if (!settings) {
      settings = await this.prisma.client.bakerySettings.create({
        data: { organizationId },
        include: {
          defaultBaker: { include: { member: { include: { user: true } } } },
        },
      });
    }

    return settings;
  }

  async updateSettings(organizationId: string, data: UpdateProductionSettingsDto) {
    return this.prisma.client.bakerySettings.update({
      where: { organizationId },
      data: data as any,
    });
  }

  async getBakers(organizationId: string) {
    return this.prisma.client.bakeryBaker.findMany({
      where: { bakerySettings: { organizationId } },
      select: {
        id: true,
        bakerySettingsId: true,
        memberId: true,
        specialties: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        member: {
          select: {
            id: true,
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
      },
    });
  }

  async addBaker(organizationId: string, data: AddBakerDto) {
    const { memberId, specialties, isActive, isDefault } = data;

    const member = await this.prisma.client.member.findFirst({
      where: { id: memberId, organizationId },
    });

    if (!member) {
      throw new ForbiddenException("Member not found in this organization.");
    }

    const settings = await this.getSettings(organizationId);

    const baker = await this.prisma.client.bakeryBaker.create({
      data: {
        memberId,
        specialties: specialties || [],
        isActive: isActive !== undefined ? isActive : true,
        bakerySettingsId: settings.id,
      },
    });

    if (isDefault) {
      await this.prisma.client.bakerySettings.update({
        where: { id: settings.id },
        data: { defaultBakerId: baker.id },
      });
    }

    return baker;
  }

  async updateBaker(organizationId: string, id: string, data: UpdateBakerDto) {
    const baker = await this.prisma.client.bakeryBaker.findFirst({
      where: { id, bakerySettings: { organizationId } },
    });
    if (!baker) throw new NotFoundException("Baker not found");

    const { specialties, isActive, isDefault } = data;

    const updatedBaker = await this.prisma.client.bakeryBaker.update({
      where: { id },
      data: {
        specialties,
        isActive,
      },
    });

    if (isDefault !== undefined) {
      const settings = await this.getSettings(organizationId);
      if (isDefault) {
        await this.prisma.client.bakerySettings.update({
          where: { id: settings.id },
          data: { defaultBakerId: id },
        });
      } else if (settings.defaultBakerId === id) {
        await this.prisma.client.bakerySettings.update({
          where: { id: settings.id },
          data: { defaultBakerId: null },
        });
      }
    }

    return updatedBaker;
  }

  async removeBaker(organizationId: string, id: string) {
    const baker = await this.prisma.client.bakeryBaker.findFirst({
      where: { id, bakerySettings: { organizationId } },
    });
    if (!baker) throw new NotFoundException("Baker not found");

    return this.prisma.client.bakeryBaker.delete({
      where: { id },
    });
  }

  async getQualityIncident(organizationId: string, id: string) {
    const incident = await this.prisma.client.qualityIncident.findFirst({
      where: { id, organizationId },
      include: {
        reportedBy: {
          select: {
            id: true,
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        },
        batch: { select: { id: true, batchNumber: true } },
        stockBatch: { select: { id: true, batchNumber: true } },
      },
    });

    if (!incident) throw new NotFoundException("Quality incident not found");
    return incident;
  }

  async getQualityIncidents(organizationId: string) {
    return this.prisma.client.qualityIncident.findMany({
      where: { organizationId },
      include: {
        reportedBy: {
          select: {
            id: true,
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        },
        batch: { select: { id: true, batchNumber: true } },
        stockBatch: { select: { id: true, batchNumber: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async createQualityIncident(organizationId: string, memberId: string, data: CreateQualityIncidentDto) {
    const incidentCount = await this.prisma.client.qualityIncident.count({
      where: { organizationId },
    });
    const incidentNumber = `INC-${Date.now()}-${incidentCount + 1}`;

    return this.prisma.client.qualityIncident.create({
      data: {
        incidentNumber,
        title: data.title,
        description: data.description,
        severity: (data.severity || "low") as any,
        batchId: data.batchId,
        stockBatchId: data.stockBatchId,
        supplierId: data.supplierId,
        reportedById: memberId,
        organizationId,
      },
    });
  }

  async updateQualityIncident(organizationId: string, id: string, data: UpdateQualityIncidentDto) {
    const incident = await this.prisma.client.qualityIncident.findFirst({
      where: { id, organizationId },
    });

    if (!incident) throw new NotFoundException("Quality incident not found");

    return this.prisma.client.qualityIncident.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        severity: data.severity as any,
        status: data.status,
      },
    });
  }

  async deleteQualityIncident(organizationId: string, id: string) {
    const incident = await this.prisma.client.qualityIncident.findFirst({
      where: { id, organizationId },
    });

    if (!incident) throw new NotFoundException("Quality incident not found");

    return this.prisma.client.qualityIncident.delete({
      where: { id },
    });
  }

  async validateDevice(apiKey: string, ipAddress: string) {
    return validateDeviceKey(this.prisma.client, apiKey, ipAddress);
  }

  getCookieOptions(maxAgeSeconds: number): CookieSerializeOptions {
    return {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: maxAgeSeconds,
      domain: env.NEXT_PUBLIC_COOKIE_DOMAIN,
    };
  }

  async getDashboardSession(req: FastifyRequest) {
    const protocol = req.protocol;
    const host = req.hostname;
    const url = `${protocol}://${host}${req.raw.url}`;

    const request = new Request(url, {
      method: req.method,
      headers: req.headers as HeadersInit,
    });

    return this.authCoreService.verifyToken(request.headers.get("authorization")?.replace("Bearer ", "") || "");
  }

  async processSSO(session: any, organizationId: string, locationId?: string) {
    const userId = session.user.id;

    const member = await this.prisma.client.member.findFirst({
      where: {
        userId: userId,
        organizationId: organizationId,
      },
      select: {
        id: true,
        role: true,
        isCheckedIn: true,
        currentAttendanceLogId: true,
        organizationId: true,
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    if (!member || !member.user.email) {
      throw new UnauthorizedException(
        "Member not found or incomplete profile.",
      );
    }

    let attendanceLogId = member.currentAttendanceLogId;

    if (!member.isCheckedIn || !attendanceLogId) {
      let targetLocationId = locationId;
      if (!targetLocationId) {
        const location = await this.prisma.client.inventoryLocation.findFirst({
          where: { organizationId: organizationId, isActive: true },
          select: { id: true },
        });
        targetLocationId = location?.id;
      }

      if (!targetLocationId) {
        throw new BadRequestException("No valid location found for check-in.");
      }

      const newLog = await this.prisma.client.attendanceLog.create({
        data: {
          memberId: member.id,
          organizationId: organizationId,
          checkInTime: new Date(),
          checkInLocationId: targetLocationId,
          notes: "Checked in via Production SSO",
        },
        select: { id: true },
      });

      await this.prisma.client.member.update({
        where: { id: member.id },
        data: {
          isCheckedIn: true,
          currentCheckInLocationId: targetLocationId,
          currentAttendanceLogId: newLog.id,
        },
      });

      attendanceLogId = newLog.id;
    }

    const token = await createMemberToken(
      member.id,
      organizationId,
      attendanceLogId!,
    );

    this.logger.log(
      `Member ${member.id} authenticated via SSO for org ${organizationId}`,
    );

    return { token, member };
  }

  async createIngredient(organizationId: string, data: CreateIngredientDto) {
    const {
      name,
      sku,
      categoryId,
      description,
      buyingPrice,
      reorderPoint,
      reorderLevel,
      baseUnitId,
      baseOrgUnitId,
      stockingUnitId,
      stockingOrgUnitId,
    } = data;

    const finalReorderPoint =
      reorderPoint !== undefined ? reorderPoint : reorderLevel;

    return this.prisma.client.$transaction(async tx => {
      const product = await tx.product.create({
        data: {
          name,
          description,
          categoryId,
          organizationId,
          sku: sku || `RM-${Date.now()}`,
          type: "RAW_MATERIAL" as any,
          variants: {
            create: [
              {
                name,
                sku: sku || `RM-${Date.now()}-VAR`,
                buyingPrice: buyingPrice || 0,
                reorderPoint: finalReorderPoint || 0,
                baseUnitId,
                baseOrgUnitId,
                stockingUnitId,
                stockingOrgUnitId,
                attributes: {},
              },
            ],
          },
        },
        include: { variants: true },
      });

      return product;
    });
  }

  async updateIngredient(organizationId: string, id: string, data: UpdateIngredientDto) {
    const {
      name,
      sku,
      categoryId,
      description,
      buyingPrice,
      reorderPoint,
      reorderLevel,
      baseUnitId,
      baseOrgUnitId,
      stockingUnitId,
      stockingOrgUnitId,
    } = data;

    const finalReorderPoint =
      reorderPoint !== undefined ? reorderPoint : reorderLevel;

    return this.prisma.client.$transaction(async tx => {
      const product = await tx.product.findFirst({
        where: { id, organizationId },
        include: { variants: true },
      });

      if (!product) throw new NotFoundException("Ingredient not found");

      const updatedProduct = await tx.product.update({
        where: { id, organizationId },
        data: {
          name,
          description,
          categoryId,
        },
      });

      if (product.variants.length > 0) {
        await tx.productVariant.update({
          where: { id: product.variants[0].id },
          data: {
            name,
            sku,
            buyingPrice,
            reorderPoint:
              finalReorderPoint !== undefined ? finalReorderPoint : undefined,
            baseUnitId,
            baseOrgUnitId,
            stockingUnitId,
            stockingOrgUnitId,
          },
        });
      }

      return updatedProduct;
    });
  }

  async deleteIngredient(organizationId: string, id: string) {
    return this.prisma.client.product.delete({
      where: { id, organizationId },
    });
  }

  async receiveIngredients(ctx: V3ApiContext, data: ReceiveIngredientsDto) {
    const { organizationId, memberId, locationId } = ctx;
    const { lines, receiptReference, receiptDate, notes } = data;

    if (!locationId)
      throw new BadRequestException("Location ID required in context");

    return this.prisma.client.$transaction(async tx => {
      const receipt = await tx.stockReceipt.create({
        data: {
          organization: { connect: { id: organizationId } },
          member: { connect: { id: memberId! } },
          receivedDate: receiptDate ? new Date(receiptDate) : new Date(),
          notes: `GRN: ${receiptReference}. ${notes || ""}`,
        } as any,
      });

      const ingredientIds = lines.map((line: any) => line.ingredientId);
      const variants = await tx.productVariant.findMany({
        where: {
          id: { in: ingredientIds },
          product: { organizationId },
        },
        select: {
          id: true,
          productId: true,
        },
      });

      const variantMap = new Map(variants.map(v => [v.id, v]));

      // ⚡ Bolt Optimization: Validate all ingredients first and aggregate stock updates
      // by unique variantId in-memory to prevent row-lock contention and reduce database roundtrips.
      const variantStockUpdates = new Map<
        string,
        { productId: string; totalQuantity: number }
      >();

      for (const line of lines) {
        const variant = variantMap.get(line.ingredientId);

        if (!variant) {
          throw new NotFoundException(
            `Ingredient with ID ${line.ingredientId} not found`,
          );
        }

        const existing = variantStockUpdates.get(line.ingredientId);
        if (existing) {
          existing.totalQuantity += line.quantity;
        } else {
          variantStockUpdates.set(line.ingredientId, {
            productId: variant.productId,
            totalQuantity: line.quantity,
          });
        }
      }

      // ⚡ Bolt Optimization: Create stock batches and movements for received ingredient lines.
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const batch = await tx.stockBatch.create({
          data: {
            organizationId,
            variantId: line.ingredientId,
            locationId,
            batchNumber: line.lotNumber || `BAT-${Date.now()}-${i}`,
            initialQuantity: line.quantity,
            currentQuantity: line.quantity,
            purchasePrice: line.unitCost,
            receivedDate: receiptDate ? new Date(receiptDate) : new Date(),
            expiryDate: line.expiryDate ? new Date(line.expiryDate) : null,
            supplierId: line.supplier,
            stockReceiptId: receipt.id,
          } as any,
        });

        await tx.stockMovement.create({
          data: {
            organizationId,
            variantId: line.ingredientId,
            stockBatchId: batch.id,
            quantity: line.quantity,
            toLocationId: locationId,
            movementType: MovementType.PURCHASE_RECEIPT,
            memberId: memberId!,
            referenceId: receipt.id,
            referenceType: "StockReceipt",
            notes: `Received via Production GRN ${receiptReference}`,
          },
        });
      }

      // ⚡ Bolt Optimization: Update productVariantStock exactly once per unique variantId
      // to eliminate row lock contention and redundant database updates.
      for (const [variantId, updateInfo] of variantStockUpdates.entries()) {
        await tx.productVariantStock.upsert({
          where: {
            variantId_locationId: {
              variantId,
              locationId,
            },
          },
          update: {
            currentStock: { increment: updateInfo.totalQuantity },
            availableStock: { increment: updateInfo.totalQuantity },
          },
          create: {
            organizationId,
            productId: updateInfo.productId,
            variantId,
            locationId,
            currentStock: updateInfo.totalQuantity,
            availableStock: updateInfo.totalQuantity,
          } as any,
        });
      }

      return receipt;
    });
  }

  async getUpdate(target: string, currentVersion: string) {
    const owner = env.GITHUB_OWNER;
    const repo = env.GITHUB_REPO;
    const token = env.GITHUB_TOKEN;

    const headers: any = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Dealio-API",
    };
    if (token) {
      headers["Authorization"] = `token ${token}`;
    }

    try {
      const { data: release } = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/releases/latest`,
        {
          headers,
          timeout: 10000,
          maxContentLength: 5 * 1024 * 1024,
        },
      );

      const latestVersion = release.tag_name.startsWith("v")
        ? release.tag_name.substring(1)
        : release.tag_name;
      const normalizedCurrentVersion = currentVersion.startsWith("v")
        ? currentVersion.substring(1)
        : currentVersion;

      if (latestVersion === normalizedCurrentVersion) {
        return null;
      }

      let asset = null;
      let signature = null;

      for (const a of release.assets) {
        const name = a.name as string;
        if (name.endsWith(".sig")) continue;

        let matches = false;
        if (target === "windows-x86_64") {
          matches = name.includes(".msi.zip") || name.includes(".exe.zip");
        } else if (target === "darwin-x86_64") {
          matches =
            (name.includes(".app.tar.gz") &&
              !name.includes("aarch64") &&
              !name.includes("arm64")) ||
            name.includes("universal");
        } else if (target === "darwin-aarch64") {
          matches =
            (name.includes(".app.tar.gz") &&
              (name.includes("aarch64") || name.includes("arm64"))) ||
            name.includes("universal");
        } else if (target === "linux-x86_64") {
          matches = name.includes(".AppImage.tar.gz");
        }

        if (matches) {
          const sigAsset = release.assets.find(
            (s: any) => s.name === `${name}.sig`,
          );
          if (sigAsset) {
            asset = a;
            if (!(await isSafeUrl(sigAsset.browser_download_url))) {
              this.logger.warn(
                `Insecure signature download URL blocked: ${sigAsset.browser_download_url}`,
              );
              return null;
            }
            const sigResponse = await axios.get(sigAsset.browser_download_url, {
              headers,
              responseType: "text",
              timeout: 5000,
              maxContentLength: 1024 * 1024,
            });
            signature = sigResponse.data.trim();
            break;
          }
        }
      }

      if (!asset || !signature) {
        return null;
      }

      return {
        version: release.tag_name,
        notes: release.body,
        pub_date: release.published_at,
        url: asset.browser_download_url,
        signature: signature,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch update from GitHub: ${error.message}`);
      return null;
    }
  }

  async getVariants(organizationId: string, query: ProductVariantQueryDto) {
    const pageNum = Number(query.page) || 1;
    const limitNum = Number(query.limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      product: {
        organizationId,
      },
    };

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
      where.product.isActive = query.isActive;
    }

    if (query.productType) {
      where.product.type = query.productType;
    }

    if (query.categoryId) {
      where.product.categoryId = query.categoryId;
    }

    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { name: { contains: term, mode: "insensitive" } },
        { sku: { contains: term, mode: "insensitive" } },
        { barcode: { contains: term, mode: "insensitive" } },
        { product: { name: { contains: term, mode: "insensitive" } } },
        { product: { sku: { contains: term, mode: "insensitive" } } },
      ];
    }

    const validSortFields = [
      "createdAt",
      "updatedAt",
      "name",
      "sku",
      "retailPrice",
      "wholesalePrice",
      "buyingPrice",
    ];
    const sortField = validSortFields.includes(query.sortBy || "")
      ? query.sortBy!
      : "createdAt";
    const sortDirection = query.sortOrder || "desc";
    const orderBy = { [sortField]: sortDirection };

    const [variants, totalCount] = await Promise.all([
      this.prisma.client.productVariant.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              type: true,
              categoryId: true,
              isActive: true,
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
              defaultLocation: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                },
              },
            },
          },
          variantStocks: {
            where: query.locationId ? { locationId: query.locationId } : undefined,
            select: {
              currentStock: true,
              availableStock: true,
              location: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.client.productVariant.count({ where }),
    ]);

    const mappedData = variants.map((v) => {
      const location = v.variantStocks?.[0]?.location || v.product.defaultLocation || null;
      const stockQuantity = v.variantStocks?.reduce((acc, curr) => acc + (Number(curr.currentStock) || 0), 0) ?? 0;

      return {
        id: v.id,
        productId: v.productId,
        name: v.name,
        sku: v.sku,
        barcode: v.barcode,
        productType: v.product.type,
        retailPrice: v.retailPrice ? Number(v.retailPrice) : null,
        wholesalePrice: v.wholesalePrice ? Number(v.wholesalePrice) : null,
        buyingPrice: v.buyingPrice ? Number(v.buyingPrice) : null,
        costPrice: v.buyingPrice ? Number(v.buyingPrice) : null,
        stockQuantity,
        isActive: v.isActive,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
        product: v.product ? {
          id: v.product.id,
          name: v.product.name,
        } : null,
        category: v.product.category ? {
          id: v.product.category.id,
          name: v.product.category.name,
        } : null,
        location: location ? {
          id: location.id,
          name: location.name,
          address: location.address,
        } : null,
      };
    });

    return {
      data: mappedData,
      totalCount,
      currentPage: pageNum,
      totalPages: Math.ceil(totalCount / limitNum) || 1,
      limit: limitNum,
    };
  }
}
