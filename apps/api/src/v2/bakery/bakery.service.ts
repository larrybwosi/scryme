import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { Prisma } from "@/prisma/client";
import { AuthService } from "../../auth/auth.service";
import { type V2ApiContext } from "@repo/shared/api/v2";
import {
  validateDeviceKey,
  createMemberToken,
} from "@repo/shared/api/v2";
import { FastifyRequest } from "fastify";
import { CookieSerializeOptions } from "@fastify/cookie";
import axios from "axios";
import { env } from "@repo/env";
import { Decimal } from "decimal.js";

@Injectable()
export class BakeryService {
  private readonly logger = new Logger(BakeryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async getAttendanceStatus(ctx: V2ApiContext) {
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

  async getCategory(ctx: V2ApiContext, id: string) {
    const { organizationId } = ctx;
    return this.prisma.client.bakeryCategory.findFirst({
      where: { id, organizationId },
    });
  }

  async getIngredientRecords(ctx: V2ApiContext) {
    const { organizationId } = ctx;
    return this.prisma.client.stockMovement.findMany({
      where: {
        organizationId,
        variant: {
          product: {
            type: "RAW_MATERIAL" as any,
          },
        },
      },
      /**
       * ⚡ Bolt: Performance Optimization
       * Replacing broad 'include' with targeted 'select' to reduce over-fetching.
       * Reduces database I/O, network payload size, and serialization overhead.
       */
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
  /**
   * Calculates production statistics for a given organization and date range.
   * ⚡ Bolt: Optimized using database-level aggregation and grouping to avoid O(N) in-memory processing.
   * This reduces memory usage and network overhead, especially for organizations with many batches.
   */
  async getProductionStats(organizationId: string, startDate: Date, endDate: Date) {
    const where = {
      organizationId,
      completedAt: {
        gte: startDate,
        lte: endDate,
      },
      status: "COMPLETED" as any,
    };

    // Use Prisma's aggregate and groupBy for efficient database-level calculations
    const [aggregation, groups] = await Promise.all([
      this.prisma.client.batch.aggregate({
        where,
        _count: { _all: true },
        _sum: { wasteQuantity: true },
      }),
      this.prisma.client.batch.groupBy({
        where,
        by: ["recipeId"],
        _sum: {
          actualQuantity: true,
          wasteQuantity: true,
        },
      }),
    ]);

    const recipeIds = groups.map((g) => g.recipeId);

    // Fetch only necessary recipe details for the recipes found in the batches
    const recipes = await this.prisma.client.recipe.findMany({
      where: { id: { in: recipeIds } },
      select: {
        id: true,
        name: true,
        systemUnit: { select: { symbol: true } },
        orgUnit: { select: { symbol: true } },
      },
    });

    const recipeMap = new Map(recipes.map((r) => [r.id, r]));

    const recipeStats = groups.map((g) => {
      const recipe = recipeMap.get(g.recipeId);
      return {
        name: recipe?.name || "Unknown",
        quantity: Number(g._sum.actualQuantity || 0),
        unit:
          recipe?.systemUnit?.symbol || recipe?.orgUnit?.symbol || "",
        waste: Number(g._sum.wasteQuantity || 0),
      };
    });

    const topRecipes = [...recipeStats]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return {
      totalBatches: aggregation._count._all,
      totalWaste: Number(aggregation._sum.wasteQuantity || 0),
      topRecipes,
      recipeStats,
    };
  }

  async getBakeryOverview(ctx: V2ApiContext) {
    const { organizationId } = ctx;
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
      lowStockItems,
      lowStockPreview,
      totalValueData,
    ] = await Promise.all([
      /**
       * ⚡ Bolt: Optimized batch retrieval.
       * Using targeted select and limited fetch to 10 items for the dashboard preview.
       */
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
      /**
       * ⚡ Bolt: Database-level counting.
       * Shifting summary statistics to O(1) database counts to ensure accuracy
       * even when the number of records exceeds the UI fetch limit.
       */
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
      /**
       * ⚡ Bolt: Database-level field comparison.
       * Using Prisma's field comparison (Prisma.ProductVariantStockScalarFieldEnum)
       * to filter low stock items at the database level instead of in-memory.
       */
      this.prisma.client.productVariantStock.count({
        where: {
          organizationId,
          variant: { product: { type: "RAW_MATERIAL" as any } },
          availableStock: {
            lte: Prisma.ProductVariantStockScalarFieldEnum.reorderPoint,
          },
        },
      }),
      this.prisma.client.productVariantStock.findMany({
        where: {
          organizationId,
          variant: { product: { type: "RAW_MATERIAL" as any } },
          availableStock: {
            lte: Prisma.ProductVariantStockScalarFieldEnum.reorderPoint,
          },
        },
        take: 10,
        select: {
          id: true,
          availableStock: true,
          reorderPoint: true,
          reorderQty: true,
          variant: {
            select: {
              name: true,
              sku: true,
              baseUnit: { select: { symbol: true } },
              baseOrgUnit: { select: { symbol: true } },
            },
          },
        },
      }),
      /**
       * ⚡ Bolt: Targeted inventory value query.
       * Fetching only required numeric fields for total value calculation
       * to minimize network traffic and memory usage.
       */
      this.prisma.client.productVariantStock.findMany({
        where: {
          organizationId,
          variant: { product: { type: "RAW_MATERIAL" as any } },
        },
        select: {
          availableStock: true,
          variant: { select: { buyingPrice: true } },
        },
      }),
    ]);

    // Hydrate category names for the grouped results
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

    const totalInventoryValue = totalValueData.reduce(
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
      stockData: lowStockIngredients, // Reuse the low stock preview as dashboard stock data
      summary: {
        totalBatches,
        activeBatches,
        completedToday,
        lowStockItems,
      },
    };
  }

  /**
   * List all ingredients (raw materials) for the bakery.
   * Includes both RAW_MATERIAL products and products produced by recipes.
   */
  async getIngredients(ctx: V2ApiContext) {
    const { organizationId } = ctx;
    const variants = await this.prisma.client.productVariant.findMany({
      where: {
        product: {
          organizationId,
        },
        OR: [
          { product: { type: "RAW_MATERIAL" as any } },
          { producedByRecipe: { isNot: null } },
        ],
      },
      /**
       * ⚡ Bolt: Performance Optimization
       * Using 'select' instead of 'include' to fetch only essential scalar fields and relations.
       * This reduces database I/O, network payload size, and memory usage during serialization.
       */
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
        maxStock: v.reorderQty || (v.reorderPoint ? Number(v.reorderPoint) * 2 : 0),
        unit: v.baseUnit || v.baseOrgUnit || { symbol: "" },
        category: v.product.category,
        tags: v.tags,
        lastRestocked: v.updatedAt,
        averageUsagePerWeek: 0,
        totalUsed: 0,
      };
    });
  }

  // Recipes
  /**
   * List all production recipes.
   * ⚡ Bolt: Optimized query using 'select' to exclude heavy text fields
   */
  async getRecipes(ctx: V2ApiContext) {
    const { organizationId } = ctx;
    return this.prisma.client.recipe.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        description: true,
        categoryId: true,
        producesVariantId: true,
        yieldQuantity: true,
        prepTime: true,
        bakeTime: true,
        totalTime: true,
        costPrice: true,
        difficulty: true,
        temperatureCelsius: true,
        servingSize: true,
        tags: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        systemUnit: {
          select: {
            id: true,
            name: true,
            symbol: true,
          },
        },
        orgUnit: {
          select: {
            id: true,
            name: true,
            symbol: true,
          },
        },
        producesVariant: {
          select: {
            id: true,
            name: true,
            sku: true,
            product: {
              select: {
                id: true,
                name: true,
                imageUrls: true,
              },
            },
          },
        },
      },
    });
  }

  async getRecipe(ctx: V2ApiContext, id: string) {
    const { organizationId } = ctx;
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
            systemUnit: true,
            orgUnit: true,
          },
        },
      },
    });
    if (!recipe) throw new NotFoundException("Recipe not found");
    return recipe;
  }

  async duplicateRecipe(ctx: V2ApiContext, id: string) {
    const { organizationId } = ctx;
    const recipe = await this.prisma.client.recipe.findFirst({
      where: { id, organizationId },
      include: {
        ingredients: true,
        // steps: true,
        // equipments: true,
      },
    });

    if (!recipe) throw new NotFoundException("Recipe not found");

    const { id: _, createdAt: __, updatedAt: ___, ...recipeData } = recipe;

    return this.prisma.client.recipe.create({
      data: {
        ...recipeData,
        name: `${recipeData.name} (Copy)`,
        ingredients: {
          create: recipe.ingredients.map(
            ({ id: _, recipeId: __, ...ing }) => ing,
          ),
        },
        // steps: {
        //   create: recipe.steps.map(({ id: _, recipeId: __, ...step }) => step),
        // },
        // equipments: {
        //   create: recipe.equipments.map(({ id: _, recipeId: __, ...eq }) => eq),
        // },
      },
    });
  }

  async generateRecipeAi(ctx: V2ApiContext, prompt: string) {
    // This is a placeholder for actual AI generation logic
    // For now, it returns a mock recipe or could call an AI service
    this.logger.log(`Generating recipe for prompt: ${prompt}`);
    return {
      name: "AI Generated Recipe",
      description: `Generated based on: ${prompt}`,
      ingredients: [],
      steps: [],
    };
  }

  // fallow-ignore-next-line complexity
  async generateBatchNumber(organizationId: string, tx?: any) {
    const prisma = tx || this.prisma.client;
    const settings = await prisma.bakerySettings.findUnique({
      where: { organizationId },
    });

    const prefix = settings?.batchPrefix || "BAT";
    const separator = settings?.batchSeparator || "-";
    const dateFormat = settings?.batchDateFormat || "YYYYMMDD";
    const sequenceLength = parseInt(settings?.batchSequence || "4");

    let dateStr = "";
    const now = new Date();
    if (dateFormat === "YYYYMMDD") {
      dateStr = now.toISOString().split("T")[0].replace(/-/g, "");
    } else if (dateFormat === "YYMM") {
      dateStr =
        now.getFullYear().toString().slice(-2) +
        (now.getMonth() + 1).toString().padStart(2, "0");
    }

    const count = await prisma.batch.count({ where: { organizationId } });
    const sequence = (count + 1).toString().padStart(sequenceLength, "0");

    const parts = [prefix, dateStr, sequence].filter(Boolean);
    return parts.join(separator);
  }

  async duplicateBatch(ctx: V2ApiContext, id: string) {
    const { organizationId } = ctx;
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

    // Generate a new batch number
    const newBatchNumber = await this.generateBatchNumber(organizationId);

    return this.prisma.client.batch.create({
      data: {
        ...batchData,
        batchNumber: newBatchNumber,
        status: "PLANNED",
      } as any,
    });
  }

  async duplicateTemplate(ctx: V2ApiContext, id: string) {
    const { organizationId } = ctx;
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

  async createBatchFromTemplate(ctx: V2ApiContext, id: string) {
    const { organizationId } = ctx;
    const template = await this.prisma.client.template.findUnique({
      where: { id, organizationId },
    });

    if (!template) throw new NotFoundException("Template not found");

    // Generate a new batch number
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
  async createRecipe(ctx: V2ApiContext, data: any) {
    const { organizationId } = ctx;

    // 🛡️ Sentinel: Use explicit field mapping to prevent mass assignment of sensitive internal fields like organizationId
    const {
      name,
      categoryId,
      producesVariantId,
      yieldQuantity,
      systemUnitId,
      orgUnitId,
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
      ingredients,
    } = data;

    return this.prisma.client.recipe.create({
      data: {
        name,
        categoryId,
        producesVariantId,
        yieldQuantity,
        systemUnitId,
        orgUnitId,
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
        organizationId,
        ingredients: ingredients
          ? {
              create: ingredients.map((ing: any) => ({
                ingredientVariantId: ing.ingredientVariantId,
                quantity: ing.quantity,
                systemUnitId: ing.systemUnitId,
                orgUnitId: ing.orgUnitId,
                preparationNotes: ing.preparationNotes,
              })),
            }
          : undefined,
      },
    });
  }

  async updateRecipe(ctx: V2ApiContext, id: string, data: any) {
    const { organizationId } = ctx;
    const { ingredients, organizationId: _, id: __, ...rest } = data;

    return this.prisma.client.recipe.update({
      where: { id, organizationId },
      data: {
        ...rest,
        ingredients: ingredients
          ? {
              deleteMany: {},
              create: ingredients.map((ing: any) => ({
                ingredientVariantId: ing.ingredientVariantId,
                quantity: ing.quantity,
                systemUnitId: ing.systemUnitId,
                orgUnitId: ing.orgUnitId,
                preparationNotes: ing.preparationNotes,
              })),
            }
          : undefined,
      },
    });
  }

  async deleteRecipe(ctx: V2ApiContext, id: string) {
    const { organizationId } = ctx;
    return this.prisma.client.recipe.delete({
      where: { id, organizationId },
    });
  }

  // Batches
  /**
   * List all production batches.
   * ⚡ Bolt: Performance Optimization
   * Replaced broad 'include' with targeted 'select' to exclude heavy fields like 'qcData'.
   * This reduces network payload size and database I/O. Added a default limit to
   * prevent performance degradation on large datasets without breaking the existing array contract.
   */
  async getBatches(ctx: V2ApiContext, query: any) {
    const { organizationId } = ctx;
    const { status, recipeId, limit = 100, page = 1 } = query;
    const where: any = { organizationId };
    if (status) where.status = status;
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

  async getBatch(ctx: V2ApiContext, id: string) {
    const { organizationId } = ctx;
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

  async createBatch(ctx: V2ApiContext, data: any) {
    const { organizationId } = ctx;

    // Always generate the batch number, ignoring any manual input from the client
    const batchNumber = await this.generateBatchNumber(organizationId);

    // 🛡️ Sentinel: Use explicit field mapping to prevent mass assignment of sensitive internal fields like organizationId
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

    // Process scheduledStartAt if date and time are provided
    let scheduledStartAt = providedScheduledStartAt;
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
        systemUnitId,
        orgUnitId,
        recipeMultiplier,
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

  async updateBatch(ctx: V2ApiContext, id: string, data: any) {
    const { organizationId } = ctx;

    // Strip organizationId and id from data to prevent mass assignment
    const { organizationId: _, id: __, assistantBakerIds, ...updateData } = data;

    return this.prisma.client.batch.update({
      where: { id, organizationId },
      data: {
        ...updateData,
        assistantBakers: assistantBakerIds
          ? {
              set: assistantBakerIds.map((id: string) => ({ id })),
            }
          : undefined,
      },
    });
  }

  async deleteBatch(ctx: V2ApiContext, id: string) {
    const { organizationId } = ctx;
    return this.prisma.client.batch.delete({
      where: { id, organizationId },
    });
  }

  async startBatch(ctx: V2ApiContext, id: string) {
    const { organizationId } = ctx;
    return this.prisma.client.batch.update({
      where: { id, organizationId },
      data: {
        status: "IN_PROGRESS" as any,
        startedAt: new Date(),
      },
    });
  }

  async completeBatch(ctx: V2ApiContext, id: string, data: any) {
    const organizationId = ctx.organizationId;
    const { actualQuantity, wasteQuantity, ingredientConsumptions, notes } =
      data;

    const batch = await this.prisma.client.batch.findUnique({
      where: { id, organizationId },
      include: { recipe: { include: { producesVariant: true } } },
    });

    if (!batch) throw new NotFoundException("Batch not found");

    const grossQuantity = Number(actualQuantity || 0);
    const waste = Number(wasteQuantity || 0);
    const netQuantity = Math.max(0, grossQuantity - waste);

    return await this.prisma.client.$transaction(async tx => {
      // 1. Update batch status
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
        },
      });

      // 2. Process Ingredient Consumptions
      if (ingredientConsumptions && ingredientConsumptions.length > 0) {
        /**
         * ⚡ Bolt: Performance Optimization (N+1 Query Elimination)
         * We pre-fetch all stock batches in a single query and aggregate updates
         * to minimize database roundtrips and improve transaction throughput.
         */
        const stockBatchIds = ingredientConsumptions.map(
          (c: any) => c.stockBatchId,
        );

        // 🛡️ Sentinel: Enforce multi-tenant isolation by scoping stock batch lookup to the organization.
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

        const stockBatchMap = new Map(stockBatches.map((sb) => [sb.id, sb]));

        const consumptionData = [];
        const movementData = [];
        const stockBatchUpdates = new Map<string, Decimal>();
        const variantStockUpdates = new Map<
          string,
          { variantId: string; locationId: string; quantity: Decimal }
        >();

        // 2a. Aggregate and Validate Quantities
        // We aggregate by stockBatchId first to ensure total consumption from a single batch
        // doesn't exceed its available stock (intra-request validation).
        for (const consumption of ingredientConsumptions) {
          const stockBatch = stockBatchMap.get(consumption.stockBatchId);
          if (!stockBatch) {
            throw new NotFoundException(`Stock batch ${consumption.stockBatchId} not found`);
          }

          const qty = new Decimal(consumption.quantity);
          const currentTotal = stockBatchUpdates.get(consumption.stockBatchId) || new Decimal(0);
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
            movementType: "PRODUCTION_OUT" as any,
            memberId: ctx.memberId!,
            organizationId,
            notes: `Consumed in Batch ${batch.batchNumber}`,
          });

          // Aggregate variant stock updates
          const vsKey = `${stockBatch.variantId}_${stockBatch.locationId}`;
          const currentVs = variantStockUpdates.get(vsKey) || {
            variantId: stockBatch.variantId,
            locationId: stockBatch.locationId,
            quantity: new Decimal(0),
          };
          currentVs.quantity = currentVs.quantity.add(qty);
          variantStockUpdates.set(vsKey, currentVs);
        }

        // Batch inserts for consumption records and movements
        await tx.batchIngredientConsumption.createMany({ data: consumptionData });
        await tx.stockMovement.createMany({ data: movementData });

        // Batch execute all aggregated stock updates concurrently
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

      // 3. Adjust stock for produced variant
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
              movementType: "PRODUCTION_IN" as any,
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

  async getBatchTraceability(ctx: V2ApiContext, id: string) {
    const { organizationId } = ctx;
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

  async cancelBatch(ctx: V2ApiContext, id: string) {
    const { organizationId } = ctx;
    return this.prisma.client.batch.update({
      where: { id, organizationId },
      data: {
        status: "CANCELLED" as any,
        cancelledAt: new Date(),
      },
    });
  }

  // Templates
  /**
   * List all production templates.
   * ⚡ Bolt: Optimized query by pruning deep relations (Member/User) and adding required relations (schedules/assistantBakers).
   * This reduces payload size significantly while ensuring the frontend has all required data in a single request.
   */
  async getTemplates(ctx: V2ApiContext) {
    const { organizationId } = ctx;
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

  async createTemplate(ctx: V2ApiContext, data: any) {
    const { organizationId } = ctx;

    // 🛡️ Sentinel: Use explicit field mapping to prevent mass assignment of sensitive internal fields like organizationId
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
        systemUnitId,
        orgUnitId,
        recipeMultiplier,
        duration,
        leadBakerId,
        notes,
        isActive,
        shelfLifeDays,
        organizationId,
      } as any,
    });
  }

  async updateTemplate(ctx: V2ApiContext, id: string, data: any) {
    const { organizationId } = ctx;

    // Strip organizationId and id from data to prevent mass assignment
    const { organizationId: _, id: __, ...updateData } = data;

    return this.prisma.client.template.update({
      where: { id, organizationId },
      data: updateData,
    });
  }

  async deleteTemplate(ctx: V2ApiContext, id: string) {
    const { organizationId } = ctx;
    return this.prisma.client.template.delete({
      where: { id, organizationId },
    });
  }

  // Categories
  async getCategories(ctx: V2ApiContext) {
    const { organizationId } = ctx;
    return this.prisma.client.bakeryCategory.findMany({
      where: { organizationId },
      include: {
        _count: { select: { recipes: true } },
      },
    });
  }

  async createCategory(ctx: V2ApiContext, data: any) {
    const { organizationId } = ctx;

    // 🛡️ Sentinel: Use explicit field mapping to prevent mass assignment of sensitive internal fields like organizationId
    const { name, description } = data;

    return this.prisma.client.bakeryCategory.create({
      data: {
        name,
        description,
        organizationId,
      },
    });
  }

  async updateCategory(ctx: V2ApiContext, id: string, data: any) {
    const { organizationId } = ctx;

    // Strip organizationId and id from data to prevent mass assignment
    const { organizationId: _, id: __, ...updateData } = data;

    return this.prisma.client.bakeryCategory.update({
      where: { id, organizationId },
      data: updateData,
    });
  }

  async deleteCategory(ctx: V2ApiContext, id: string) {
    const { organizationId } = ctx;
    return this.prisma.client.bakeryCategory.delete({
      where: { id, organizationId },
    });
  }

  // Settings & Bakers
  async getSettings(ctx: V2ApiContext) {
    const { organizationId } = ctx;
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

  async updateSettings(ctx: V2ApiContext, data: any) {
    const { organizationId } = ctx;

    // Strip organizationId and id from data to prevent mass assignment
    const { organizationId: _, id: __, ...updateData } = data;

    return this.prisma.client.bakerySettings.update({
      where: { organizationId },
      data: updateData,
    });
  }

  /**
   * List all bakers associated with the organization's bakery settings.
   * ⚡ Bolt: Optimized query by pruning Member and User relations to only include display fields.
   */
  async getBakers(ctx: V2ApiContext) {
    const { organizationId } = ctx;
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

  async addBaker(ctx: V2ApiContext, data: any) {
    const { organizationId } = ctx;
    const { memberId, specialties, isActive } = data;

    // 🛡️ Sentinel: Verify that the member belongs to the same organization to prevent IDOR
    const member = await this.prisma.client.member.findFirst({
      where: { id: memberId, organizationId },
    });

    if (!member) {
      throw new ForbiddenException("Member not found in this organization.");
    }

    const settings = await this.getSettings(ctx);

    // 🛡️ Sentinel: Use explicit whitelisting to prevent mass assignment of sensitive internal fields
    return this.prisma.client.bakeryBaker.create({
      data: {
        memberId,
        specialties,
        isActive: isActive !== undefined ? isActive : true,
        bakerySettingsId: settings.id,
      },
    });
  }

  async updateBaker(ctx: V2ApiContext, id: string, data: any) {
    const { organizationId } = ctx;
    const baker = await this.prisma.client.bakeryBaker.findFirst({
      where: { id, bakerySettings: { organizationId } },
    });
    if (!baker) throw new NotFoundException("Baker not found");

    // 🛡️ Sentinel: Explicitly destructure allowed fields to prevent mass assignment
    const { specialties, isActive } = data;

    return this.prisma.client.bakeryBaker.update({
      where: { id },
      data: {
        specialties,
        isActive,
      },
    });
  }

  async removeBaker(ctx: V2ApiContext, id: string) {
    const { organizationId } = ctx;
    const baker = await this.prisma.client.bakeryBaker.findFirst({
      where: { id, bakerySettings: { organizationId } },
    });
    if (!baker) throw new NotFoundException("Baker not found");

    return this.prisma.client.bakeryBaker.delete({
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

    return this.authService.auth.api.getSession({ headers: request.headers });
  }

  async processSSO(session: any, ctx: V2ApiContext) {
    const userId = session.user.id;
    const organizationId = ctx.organizationId;

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
      let targetLocationId = ctx.locationId;
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
          notes: "Checked in via Bakery SSO",
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

  async getPartners(ctx: V2ApiContext) {
    const { organizationId } = ctx;
    return this.prisma.client.deliveryPartner.findMany({
      where: { organizationId },
    });
  }

  async createPartner(ctx: V2ApiContext, data: any) {
    const { organizationId } = ctx;

    // 🛡️ Sentinel: Use explicit field mapping to prevent mass assignment of sensitive internal fields like organizationId
    const {
      name,
      email,
      phone,
      address,
      commissionRate,
      fixedFee,
      benefitType,
      reconciliationPolicy,
      isActive,
    } = data;

    return this.prisma.client.deliveryPartner.create({
      data: {
        name,
        email,
        phone,
        address,
        commissionRate,
        fixedFee,
        benefitType,
        reconciliationPolicy,
        isActive,
        organizationId,
      } as any,
    });
  }

  async getPartner(ctx: V2ApiContext, id: string) {
    const { organizationId } = ctx;
    return this.prisma.client.deliveryPartner.findFirst({
      where: { id, organizationId },
      include: { walletLogs: { take: 20, orderBy: { createdAt: "desc" } } },
    });
  }

  async updatePartner(ctx: V2ApiContext, id: string, data: any) {
    const { organizationId } = ctx;

    // Strip organizationId and id from data to prevent mass assignment
    const { organizationId: _, id: __, ...updateData } = data;

    return this.prisma.client.deliveryPartner.update({
      where: { id, organizationId },
      data: updateData,
    });
  }

  async adjustPartnerWallet(ctx: V2ApiContext, id: string, data: any) {
    const { organizationId } = ctx;
    const partner = await this.prisma.client.deliveryPartner.findFirst({
      where: { id, organizationId },
    });
    if (!partner) throw new NotFoundException("Partner not found");

    const newBalance = Number(partner.walletBalance) + Number(data.amount);
    return this.prisma.client.$transaction([
      this.prisma.client.deliveryPartner.update({
        where: { id },
        data: { walletBalance: newBalance },
      }),
      this.prisma.client.partnerWalletLog.create({
        data: {
          partnerId: id,
          amount: data.amount,
          balanceAfter: newBalance,
          transactionType: data.type || "ADJUSTMENT",
          notes: data.notes,
        },
      }),
    ]);
  }

  async dispatchDelivery(ctx: V2ApiContext, data: any) {
    const { organizationId, memberId } = ctx;
    const { transactionId, partnerId, driverId, notes } = data;

    return this.prisma.client.$transaction(async tx => {
      const transaction = await tx.transaction.findFirst({
        where: { id: transactionId, organizationId },
      });

      if (!transaction) throw new NotFoundException("Transaction not found");

      const fulfillment = await tx.fulfillment.create({
        data: {
          transactionId,
          type: "DELIVERY" as any,
          status: "IN_TRANSIT" as any,
          driverId: driverId,
          deliveryNotes: notes,
          dispatchedAt: new Date(),
        },
      });

      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          deliveryPartnerId: partnerId,
        },
      });

      return fulfillment;
    });
  }

  async reconcileDelivery(ctx: V2ApiContext, data: any) {
    const { organizationId, memberId } = ctx;
    const { fulfillmentId, status, notes } = data;

    return this.prisma.client.$transaction(async tx => {
      const fulfillment = await tx.fulfillment.findFirst({
        where: {
          id: fulfillmentId,
          transaction: { organizationId },
        },
      });

      if (!fulfillment) throw new NotFoundException("Fulfillment not found");

      const updatedFulfillment = await tx.fulfillment.update({
        where: { id: fulfillmentId },
        data: {
          status: (status === "DELIVERED" ? "DELIVERED" : "CANCELLED") as any,
          deliveredAt: status === "DELIVERED" ? new Date() : null,
          deliveryNotes: notes || fulfillment.deliveryNotes,
        },
      });

      return updatedFulfillment;
    });
  }

  async getActiveDeliveries(ctx: V2ApiContext) {
    const { organizationId } = ctx;
    return this.prisma.client.fulfillment.findMany({
      where: {
        transaction: { organizationId },
        status: { in: ["PENDING", "IN_TRANSIT"] },
        type: "DELIVERY",
      },
      include: {
        transaction: { include: { customer: true, deliveryPartner: true } },
        driver: true,
      },
    });
  }

  async createIngredient(ctx: V2ApiContext, data: any) {
    const { organizationId } = ctx;
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

    const finalReorderPoint = reorderPoint !== undefined ? reorderPoint : reorderLevel;

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

  async updateIngredient(ctx: V2ApiContext, id: string, data: any) {
    const { organizationId } = ctx;
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

    const finalReorderPoint = reorderPoint !== undefined ? reorderPoint : reorderLevel;

    return this.prisma.client.$transaction(async tx => {
      // Find the product first to get its variant
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
            reorderPoint: finalReorderPoint !== undefined ? finalReorderPoint : undefined,
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

  async deleteIngredient(ctx: V2ApiContext, id: string) {
    const { organizationId } = ctx;
    return this.prisma.client.product.delete({
      where: { id, organizationId },
    });
  }

  async receiveIngredients(ctx: V2ApiContext, data: any) {
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

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // 🛡️ Sentinel: Enforce multi-tenant isolation by scoping product variant lookup to the organization
        const variant = await tx.productVariant.findFirst({
          where: {
            id: line.ingredientId,
            product: { organizationId },
          },
          select: { productId: true },
        });

        if (!variant) {
          throw new NotFoundException(
            `Ingredient with ID ${line.ingredientId} not found`,
          );
        }

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

        await tx.productVariantStock.upsert({
          where: {
            variantId_locationId: {
              variantId: line.ingredientId,
              locationId,
            },
          },
          update: {
            currentStock: { increment: line.quantity },
            availableStock: { increment: line.quantity },
          },
          create: {
            organizationId,
            productId: variant.productId,
            variantId: line.ingredientId,
            locationId,
            currentStock: line.quantity,
            availableStock: line.quantity,
          } as any,
        });

        await tx.stockMovement.create({
          data: {
            organizationId,
            variantId: line.ingredientId,
            stockBatchId: batch.id,
            quantity: line.quantity,
            toLocationId: locationId,
            movementType: "PURCHASE_RECEIPT" as any,
            memberId: memberId!,
            referenceId: receipt.id,
            referenceType: "StockReceipt",
            notes: `Received via Bakery GRN ${receiptReference}`,
          },
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
          maxContentLength: 5 * 1024 * 1024, // 5MB limit for release metadata
        },
      );

      // Tauri updater expects 204 if already on the latest version
      // Remove 'v' prefix if present for comparison
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
            // Fetch signature with auth headers if needed
            const sigResponse = await axios.get(sigAsset.browser_download_url, {
              headers,
              responseType: "text",
              timeout: 5000,
              maxContentLength: 1024 * 1024, // 1MB limit for signature
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
}
