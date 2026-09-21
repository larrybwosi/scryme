import { Test, TestingModule } from "@nestjs/testing";
import { ProductionService } from "../application/services/production.service";
import { ProductionReportService } from "../reports/production-report.service";
import { PrismaService } from "@/prisma/prisma.service";
import { V3AuthCoreService } from "@/v3/modules/auth-core/infrastructure/services/v3-auth-core.service";
import { ConflictException, BadRequestException } from "@nestjs/common";
import { CreateRecipeDto, CreateProductionCategoryDto } from "../application/dto/production.dto";
import { describe, beforeEach, it, expect, vi } from "vitest";

describe("ProductionService - Category and Recipe Validation", () => {
  let service: ProductionService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      client: {
        bakeryCategory: {
          findFirst: vi.fn(),
          create: vi.fn(),
          update: vi.fn(),
          delete: vi.fn(),
          findMany: vi.fn(),
        },
        recipe: {
          create: vi.fn(),
          update: vi.fn(),
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductionService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: V3AuthCoreService, useValue: {} },
        { provide: ProductionReportService, useValue: {} },
      ],
    }).compile();

    service = module.get<ProductionService>(ProductionService);
  });

  describe("Category Creation & Uniqueness", () => {
    it("should create a category successfully when name is unique", async () => {
      const dto: CreateProductionCategoryDto = { name: "Breads", description: "Fresh breads" };
      prismaMock.client.bakeryCategory.findFirst.mockResolvedValue(null);
      prismaMock.client.bakeryCategory.create.mockResolvedValue({
        id: "cat-1",
        name: "Breads",
        description: "Fresh breads",
        organizationId: "org-1",
      });

      const result = await service.createCategory("org-1", dto);
      expect(result).toEqual({ id: "cat-1", name: "Breads", description: "Fresh breads", organizationId: "org-1" });
      expect(prismaMock.client.bakeryCategory.findFirst).toHaveBeenCalledWith({
        where: { organizationId: "org-1", name: { equals: "Breads", mode: "insensitive" } },
      });
    });

    it("should throw ConflictException when category name already exists in org", async () => {
      const dto: CreateProductionCategoryDto = { name: "Breads" };
      prismaMock.client.bakeryCategory.findFirst.mockResolvedValue({ id: "cat-1", name: "Breads" });

      await expect(service.createCategory("org-1", dto)).rejects.toThrow(ConflictException);
    });

    it("should throw ConflictException on update if updated category name collides", async () => {
      prismaMock.client.bakeryCategory.findFirst.mockResolvedValue({ id: "cat-2", name: "Pastries" });

      await expect(service.updateCategory("org-1", "cat-1", { name: "Pastries" })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe("Recipe Creation Validation", () => {
    const validIngredient = {
      ingredientVariantId: "var-1",
      quantity: 500,
      systemUnitId: "unit-g",
    };

    it("should throw BadRequestException if no yield unit is provided", async () => {
      const dto: CreateRecipeDto = {
        name: "Sourdough",
        categoryId: "cat-1",
        producesVariantId: "var-prod-1",
        yieldQuantity: 10,
        ingredients: [validIngredient],
      };

      await expect(service.createRecipe("org-1", dto)).rejects.toThrow(
        "At least one yield unit (system or organization) must be selected.",
      );
    });

    it("should throw BadRequestException if ingredients array is empty", async () => {
      const dto: CreateRecipeDto = {
        name: "Sourdough",
        categoryId: "cat-1",
        producesVariantId: "var-prod-1",
        yieldQuantity: 10,
        systemUnitId: "unit-kg",
        ingredients: [],
      };

      await expect(service.createRecipe("org-1", dto)).rejects.toThrow("At least one ingredient is required.");
    });

    it("should throw BadRequestException if an ingredient lacks a unit", async () => {
      const dto: CreateRecipeDto = {
        name: "Sourdough",
        categoryId: "cat-1",
        producesVariantId: "var-prod-1",
        yieldQuantity: 10,
        systemUnitId: "unit-kg",
        ingredients: [{ ingredientVariantId: "var-1", quantity: 100 }],
      };

      await expect(service.createRecipe("org-1", dto)).rejects.toThrow(
        "Each ingredient must have a unit (system or organization) selected.",
      );
    });

    it("should create recipe successfully when all validation rules pass", async () => {
      const dto: CreateRecipeDto = {
        name: "Sourdough",
        categoryId: "cat-1",
        producesVariantId: "var-prod-1",
        yieldQuantity: 10,
        systemUnitId: "unit-kg",
        ingredients: [validIngredient],
      };

      const mockCreatedRecipe = { id: "rec-1", name: "Sourdough", organizationId: "org-1" };
      prismaMock.client.recipe.create.mockResolvedValue(mockCreatedRecipe);

      const result = await service.createRecipe("org-1", dto);
      expect(result).toEqual(mockCreatedRecipe);
      expect(prismaMock.client.recipe.create).toHaveBeenCalled();
    });
  });
});
