import { Injectable, NotFoundException, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { Decimal } from "decimal.js";
import {
  IngredientProjectionItemDto,
  ProductionProjectionDto,
  PlanPurchaseOrderDto,
} from "../dto/production-on-demand.dto";

@Injectable()
export class ProductionProjectionService {
  private readonly logger = new Logger(ProductionProjectionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async calculateIngredientProjections(
    organizationId: string,
    recipeId: string,
    plannedQuantity: number,
    locationId?: string,
  ): Promise<ProductionProjectionDto> {
    const recipe = await this.prisma.client.recipe.findFirst({
      where: { id: recipeId, organizationId },
      include: {
        ingredients: {
          include: {
            ingredientVariant: {
              include: {
                baseUnit: true,
                baseOrgUnit: true,
                reorderRules: {
                  where: { organizationId, isActive: true },
                  include: { preferredSupplier: true },
                },
              },
            },
            systemUnit: true,
            orgUnit: true,
          },
        },
      },
    });

    if (!recipe) {
      throw new NotFoundException(`Recipe with ID ${recipeId} not found`);
    }

    const recipeYieldQty = Number(recipe.yieldQuantity || 1);
    const multiplier = plannedQuantity > 0 && recipeYieldQty > 0
      ? plannedQuantity / recipeYieldQty
      : 1;

    const variantIds = recipe.ingredients
      .map((i) => i.ingredientVariantId)
      .filter((id): id is string => Boolean(id));

    const variantStocks = await this.prisma.client.productVariantStock.findMany({
      where: {
        organizationId,
        variantId: { in: variantIds },
        ...(locationId ? { locationId } : {}),
      },
    });

    const stockMap = new Map<string, number>();
    for (const vs of variantStocks) {
      const current = stockMap.get(vs.variantId) || 0;
      stockMap.set(vs.variantId, current + Number(vs.availableStock || 0));
    }

    let hasSufficientStock = true;
    let totalShortageCost = 0;
    let maxLeadTimeDays = 0;
    const ingredientProjections: IngredientProjectionItemDto[] = [];

    for (const ing of recipe.ingredients) {
      if (!ing.ingredientVariant || !ing.ingredientVariantId) continue;

      const v = ing.ingredientVariant;
      const baseReqQty = Number(ing.quantity || 0) * multiplier;
      const currentStock = stockMap.get(ing.ingredientVariantId) || 0;
      const shortage = Math.max(0, baseReqQty - currentStock);

      const unit =
        ing.systemUnit?.symbol ||
        ing.orgUnit?.symbol ||
        v.baseUnit?.symbol ||
        v.baseOrgUnit?.symbol ||
        "units";

      const unitCost = Number(v.buyingPrice || 0);
      const projectedCost = shortage * unitCost;

      const rule = v.reorderRules?.[0];
      const leadTimeDays = rule?.leadTimeDays ?? 3;
      const preferredSupplierId = rule?.preferredSupplierId || undefined;

      if (shortage > 0) {
        hasSufficientStock = false;
        totalShortageCost += projectedCost;
        if (leadTimeDays > maxLeadTimeDays) {
          maxLeadTimeDays = leadTimeDays;
        }
      }

      ingredientProjections.push({
        variantId: ing.ingredientVariantId,
        ingredientName: v.name,
        sku: v.sku || undefined,
        requiredQuantity: Number(baseReqQty.toFixed(4)),
        currentStock: Number(currentStock.toFixed(4)),
        shortageQuantity: Number(shortage.toFixed(4)),
        unit,
        unitCost,
        projectedCost: Number(projectedCost.toFixed(2)),
        preferredSupplierId,
        leadTimeDays,
      });
    }

    const estimatedProductionMinutes = Number(recipe.totalTime || (Number(recipe.prepTime || 0) + Number(recipe.bakeTime || 0)) || 60);

    const earliestDate = new Date();
    if (!hasSufficientStock) {
      earliestDate.setDate(earliestDate.getDate() + maxLeadTimeDays);
    }
    earliestDate.setMinutes(earliestDate.getMinutes() + estimatedProductionMinutes);

    return {
      recipeId: recipe.id,
      recipeName: recipe.name,
      plannedQuantity,
      estimatedProductionMinutes,
      maxLeadTimeDays,
      earliestCompletionDate: earliestDate.toISOString(),
      hasSufficientStock,
      totalShortageCost: Number(totalShortageCost.toFixed(2)),
      ingredients: ingredientProjections,
    };
  }

  async planPurchases(
    organizationId: string,
    dto: PlanPurchaseOrderDto,
    memberId?: string,
  ) {
    let recipeId = dto.recipeId;
    let plannedQuantity = dto.plannedQuantity || 1;
    let locationId = dto.locationId;

    if (dto.batchId) {
      const batch = await this.prisma.client.batch.findFirst({
        where: { id: dto.batchId, organizationId },
      });
      if (!batch) {
        throw new NotFoundException(`Batch with ID ${dto.batchId} not found`);
      }
      recipeId = batch.recipeId;
      plannedQuantity = Number(batch.plannedQuantity);
      locationId = locationId || batch.outputLocationId || undefined;
    }

    if (!recipeId) {
      throw new BadRequestException("Either batchId or recipeId must be provided to plan purchases");
    }

    if (!locationId) {
      const defaultLoc = await this.prisma.client.inventoryLocation.findFirst({
        where: { organizationId, isDefault: true },
      });
      locationId = defaultLoc?.id;
    }

    if (!locationId) {
      const anyLoc = await this.prisma.client.inventoryLocation.findFirst({
        where: { organizationId },
      });
      locationId = anyLoc?.id;
    }

    if (!locationId) {
      throw new BadRequestException("No inventory location found for organization to plan purchase");
    }

    const projection = await this.calculateIngredientProjections(
      organizationId,
      recipeId,
      plannedQuantity,
      locationId,
    );

    const shortageItems = projection.ingredients.filter((i) => i.shortageQuantity > 0);
    if (shortageItems.length === 0) {
      return {
        message: "All required ingredients are in stock. No purchase order required.",
        shortageCount: 0,
        purchaseOrders: [],
      };
    }

    let defaultSupplier = dto.supplierId
      ? await this.prisma.client.supplier.findFirst({
          where: { id: dto.supplierId, organizationId },
        })
      : null;

    if (!defaultSupplier) {
      defaultSupplier = await this.prisma.client.supplier.findFirst({
        where: { organizationId, isActive: true },
      });
    }

    if (!defaultSupplier) {
      defaultSupplier = await this.prisma.client.supplier.create({
        data: {
          name: "Default Raw Material Supplier",
          code: `SUP-${Date.now().toString().slice(-6)}`,
          type: "MANUFACTURER" as any,
          primaryContact: "Procurement",
          isActive: true,
        } as any,
      });
    }

    const poNumber = `PO-DEMAND-${Date.now().toString().slice(-6)}`;
    const totalAmount = shortageItems.reduce((acc, curr) => acc + (curr.projectedCost || 0), 0);

    let creatorMemberId = memberId;
    if (!creatorMemberId) {
      const firstMember = await this.prisma.client.member.findFirst({
        where: { organizationId },
      });
      creatorMemberId = firstMember?.id || "";
    }

    const purchase = await this.prisma.client.purchase.create({
      data: {
        organizationId,
        purchaseNumber: poNumber,
        supplierId: defaultSupplier.id,
        memberId: creatorMemberId,
        status: (dto.autoApprove ? "ORDERED" : "DRAFT") as any,
        subTotal: new Decimal(totalAmount),
        totalAmount: new Decimal(totalAmount),
        currency: "KES",
        notes: `On-Demand Production Purchase Plan for Recipe ${projection.recipeName}${dto.batchId ? ` (Batch: ${dto.batchId})` : ""}`,
        items: {
          create: shortageItems.map((item) => ({
            variantId: item.variantId,
            orderedQuantity: Math.ceil(item.shortageQuantity),
            unitCost: new Decimal(item.unitCost || 0),
            totalCost: new Decimal(item.projectedCost || 0),
          })),
        },
      } as any,
      include: {
        supplier: true,
        items: true,
      },
    });

    return {
      message: `Purchase plan created successfully as ${purchase.purchaseNumber}`,
      shortageCount: shortageItems.length,
      purchaseOrderId: purchase.id,
      purchaseNumber: purchase.purchaseNumber,
      totalAmount,
      supplier: (purchase as any).supplier?.name || defaultSupplier.name,
      items: (purchase as any).items,
    };
  }
}
