import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { AuthService } from "../../../auth/auth.service";
import { type V3ApiContext } from "@repo/shared/api/v2";
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
} from "../dto/production.dto";

@Injectable()
export class ProductionService {
  private readonly logger = new Logger(ProductionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

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
        },
        OR: [
          { product: { type: "RAW_MATERIAL" as any } },
          { producedByRecipe: { isNot: null } },
        ],
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

    return this.prisma.client.recipe.create({
      data: {
        ...recipeData,
        name: `${recipeData.name} (Copy)`,
        ingredients: {
          create: recipe.ingredients.map(
            ({ id: _, recipeId: __, ...ing }) => ing,
          ),
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
        difficulty: difficulty as any,
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

  async updateRecipe(organizationId: string, id: string, data: UpdateRecipeDto) {
    const { ingredients, ...rest } = data;

    return this.prisma.client.recipe.update({
      where: { id, organizationId },
      data: {
        ...rest,
        difficulty: rest.difficulty as any,
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
        systemUnitId,
        orgUnitId,
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
            movementType: "PRODUCTION_OUT" as any,
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
        systemUnitId,
        orgUnitId,
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
    return this.prisma.client.template.update({
      where: { id, organizationId },
      data,
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

    return this.prisma.client.bakeryCategory.create({
      data: {
        name,
        description,
        organizationId,
      },
    });
  }

  async updateCategory(organizationId: string, id: string, data: UpdateProductionCategoryDto) {
    return this.prisma.client.bakeryCategory.update({
      where: { id, organizationId },
      data,
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
    const { memberId, specialties, isActive } = data;

    const member = await this.prisma.client.member.findFirst({
      where: { id: memberId, organizationId },
    });

    if (!member) {
      throw new ForbiddenException("Member not found in this organization.");
    }

    const settings = await this.getSettings(organizationId);

    return this.prisma.client.bakeryBaker.create({
      data: {
        memberId,
        specialties: specialties || [],
        isActive: isActive !== undefined ? isActive : true,
        bakerySettingsId: settings.id,
      },
    });
  }

  async updateBaker(organizationId: string, id: string, data: UpdateBakerDto) {
    const baker = await this.prisma.client.bakeryBaker.findFirst({
      where: { id, bakerySettings: { organizationId } },
    });
    if (!baker) throw new NotFoundException("Baker not found");

    const { specialties, isActive } = data;

    return this.prisma.client.bakeryBaker.update({
      where: { id },
      data: {
        specialties,
        isActive,
      },
    });
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

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        const variant = variantMap.get(line.ingredientId);

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
            notes: `Received via Production GRN ${receiptReference}`,
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
}
