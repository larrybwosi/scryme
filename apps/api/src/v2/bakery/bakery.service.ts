import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { AuthService } from "../../auth/auth.service";
import {
  validateDeviceKey,
  createMemberToken,
  type V2ApiContext,
} from "@repo/shared/server";
import { FastifyRequest } from "fastify";
import { CookieSerializeOptions } from "@fastify/cookie";
import axios from "axios";
import { env } from "@repo/env";

@Injectable()
export class BakeryService {
  private readonly logger = new Logger(BakeryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async getCategory(ctx: V2ApiContext, id: string) {
    const { organizationId } = ctx;
    return this.prisma.client.bakeryCategory.findUnique({
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
      include: {
        variant: {
          include: { product: true },
        },
        fromLocation: true,
        toLocation: true,
        member: { include: { user: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }
  async getBakeryOverview(ctx: V2ApiContext) {
    const { organizationId } = ctx;
    const [batches, recipes, bakers] = await Promise.all([
      this.prisma.client.batch.findMany({
        where: { organizationId },
        take: 5,
        orderBy: { scheduledStartAt: "desc" },
        include: {
          recipe: true,
          leadBaker: { include: { member: { include: { user: true } } } },
        },
      }),
      this.prisma.client.recipe.count({ where: { organizationId } }),
      this.prisma.client.bakeryBaker.count({
        where: { bakerySettings: { organizationId } },
      }),
    ]);

    return {
      recentBatches: batches,
      recipesCount: recipes,
      bakersCount: bakers,
      averageRecipeCost: 0,
      recipesByCategory: {},
      totalInventoryValue: 0,
      summary: {
        totalBatches: batches.length,
        activeBatches: batches.filter((b: any) => b.status === "IN_PROGRESS")
          .length,
        completedToday: batches.filter((b: any) => b.status === "COMPLETED")
          .length,
        lowStockItems: 0,
      },
    };
  }

  /**
   * List all ingredients (raw materials) for the bakery.
   */
  async getIngredients(ctx: V2ApiContext) {
    const { organizationId } = ctx;
    return this.prisma.client.productVariant.findMany({
      where: {
        product: {
          organizationId,
          type: "RAW_MATERIAL" as any,
        },
      },
      take: 500, // Safety limit
      select: {
        id: true,
        name: true,
        sku: true,
        buyingPrice: true,
        reorderPoint: true,
        reorderQty: true,
        isActive: true,
        tags: true,
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
        baseUnit: {
          select: {
            id: true,
            name: true,
            symbol: true,
          },
        },
      },
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
      take: 200, // Safety limit
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
    return this.prisma.client.recipe.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  async updateRecipe(ctx: V2ApiContext, id: string, data: any) {
    const { organizationId } = ctx;
    return this.prisma.client.recipe.update({
      where: { id, organizationId },
      data,
    });
  }

  async deleteRecipe(ctx: V2ApiContext, id: string) {
    const { organizationId } = ctx;
    return this.prisma.client.recipe.delete({
      where: { id, organizationId },
    });
  }

  // Batches
  async getBatches(ctx: V2ApiContext, query: any) {
    const { organizationId } = ctx;
    const { status, recipeId } = query;
    const where: any = { organizationId };
    if (status) where.status = status;
    if (recipeId) where.recipeId = recipeId;

    return this.prisma.client.batch.findMany({
      where,
      include: {
        recipe: true,
        leadBaker: { include: { member: { include: { user: true } } } },
        systemUnit: true,
        orgUnit: true,
      },
      orderBy: { scheduledStartAt: "desc" },
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

    const { date, time, batchNumber: _, ...rest } = data;

    // Process scheduledStartAt if date and time are provided
    let scheduledStartAt = data.scheduledStartAt;
    if (!scheduledStartAt && date && time) {
      const [hours, minutes] = time.split(":").map(Number);
      const d = new Date(date);
      d.setHours(hours, minutes, 0, 0);
      scheduledStartAt = d;
    }

    return this.prisma.client.batch.create({
      data: {
        ...rest,
        batchNumber,
        scheduledStartAt: scheduledStartAt || new Date(),
        organizationId,
      },
    });
  }

  async updateBatch(ctx: V2ApiContext, id: string, data: any) {
    const { organizationId } = ctx;
    return this.prisma.client.batch.update({
      where: { id, organizationId },
      data,
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
    const { organizationId } = ctx;
    const { actualQuantity, wasteQuantity, ingredientConsumptions, notes } =
      data;

    const batch = await this.prisma.client.batch.findUnique({
      where: { id },
      include: { recipe: { include: { producesVariant: true } } },
    });

    if (!batch) throw new NotFoundException("Batch not found");

    const grossQuantity = Number(actualQuantity || 0);
    const waste = Number(wasteQuantity || 0);
    const netQuantity = Math.max(0, grossQuantity - waste);

    return await this.prisma.client.$transaction(async (tx) => {
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
        for (const consumption of ingredientConsumptions) {
          const stockBatch = await tx.stockBatch.findUnique({
            where: { id: consumption.stockBatchId },
          });

          if (!stockBatch)
            throw new NotFoundException(
              `Stock batch ${consumption.stockBatchId} not found`,
            );

          // Assuming currentQuantity is a Prisma Decimal
          if (stockBatch.currentQuantity.lt(consumption.quantity)) {
            throw new BadRequestException(
              `Insufficient stock in batch ${stockBatch.batchNumber || stockBatch.id}`,
            );
          }

          await tx.batchIngredientConsumption.create({
            data: {
              batchId: id,
              stockBatchId: consumption.stockBatchId,
              quantity: consumption.quantity,
              organizationId,
            },
          });

          await tx.stockBatch.update({
            where: { id: consumption.stockBatchId },
            data: {
              currentQuantity: { decrement: consumption.quantity },
            },
          });

          await tx.stockMovement.create({
            data: {
              variantId: stockBatch.variantId,
              stockBatchId: stockBatch.id,
              fromLocationId: stockBatch.locationId,
              quantity: consumption.quantity,
              movementType: "PRODUCTION_OUT" as any,
              memberId: ctx.memberId!,
              organizationId,
              notes: `Consumed in Batch ${batch.batchNumber}`,
            },
          });

          await tx.productVariantStock.update({
            where: {
              variantId_locationId: {
                variantId: stockBatch.variantId,
                locationId: stockBatch.locationId,
              },
            },
            data: {
              currentStock: { decrement: consumption.quantity },
              availableStock: { decrement: consumption.quantity },
            },
          });
        }
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
  async getTemplates(ctx: V2ApiContext) {
    const { organizationId } = ctx;
    return this.prisma.client.template.findMany({
      where: { organizationId },
      include: {
        recipe: true,
        leadBaker: { include: { member: { include: { user: true } } } },
      },
    });
  }

  async createTemplate(ctx: V2ApiContext, data: any) {
    const { organizationId } = ctx;
    return this.prisma.client.template.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  async updateTemplate(ctx: V2ApiContext, id: string, data: any) {
    const { organizationId } = ctx;
    return this.prisma.client.template.update({
      where: { id, organizationId },
      data,
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
    return this.prisma.client.bakeryCategory.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  async updateCategory(ctx: V2ApiContext, id: string, data: any) {
    const { organizationId } = ctx;
    return this.prisma.client.bakeryCategory.update({
      where: { id, organizationId },
      data,
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
    return this.prisma.client.bakerySettings.update({
      where: { organizationId },
      data,
    });
  }

  async getBakers(ctx: V2ApiContext) {
    const { organizationId } = ctx;
    return this.prisma.client.bakeryBaker.findMany({
      where: { bakerySettings: { organizationId } },
      include: {
        member: { include: { user: true } },
      },
    });
  }

  async addBaker(ctx: V2ApiContext, data: any) {
    const settings = await this.getSettings(ctx);
    return this.prisma.client.bakeryBaker.create({
      data: {
        ...data,
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

    return this.prisma.client.bakeryBaker.update({
      where: { id },
      data,
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
    return this.prisma.client.deliveryPartner.create({
      data: { ...data, organizationId },
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
    return this.prisma.client.deliveryPartner.update({
      where: { id, organizationId },
      data,
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

    return this.prisma.client.$transaction(async (tx) => {
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

    return this.prisma.client.$transaction(async (tx) => {
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

  async receiveIngredients(ctx: V2ApiContext, data: any) {
    const { organizationId, memberId, locationId } = ctx;
    const { lines, receiptReference, receiptDate, notes } = data;

    if (!locationId)
      throw new BadRequestException("Location ID required in context");

    return this.prisma.client.$transaction(async (tx) => {
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
        const variant = await tx.productVariant.findUnique({
          where: { id: line.ingredientId },
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
        { headers },
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
