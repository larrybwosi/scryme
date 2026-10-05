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
        systemUnit: {
          findUnique: vi.fn(),
          findFirst: vi.fn(),
        },
        organizationUnit: {
          findFirst: vi.fn(),
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

  describe("Recipe Creation Validation & Unit Auto-Resolution", () => {
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
      prismaMock.client.systemUnit.findUnique.mockResolvedValue({ id: "unit-kg" });
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
      prismaMock.client.systemUnit.findUnique.mockResolvedValue({ id: "unit-kg" });
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

    it("should throw BadRequestException if a unit ID does not exist in systemUnit or organizationUnit", async () => {
      prismaMock.client.systemUnit.findUnique.mockResolvedValue(null);
      prismaMock.client.organizationUnit.findFirst.mockResolvedValue(null);

      const dto: CreateRecipeDto = {
        name: "Sourdough",
        categoryId: "cat-1",
        producesVariantId: "var-prod-1",
        yieldQuantity: 10,
        systemUnitId: "non-existent-unit",
        ingredients: [validIngredient],
      };

      await expect(service.createRecipe("org-1", dto)).rejects.toThrow(BadRequestException);
    });

    it("should auto-reassign custom orgUnit passed in systemUnitId field", async () => {
      prismaMock.client.systemUnit.findUnique.mockResolvedValue(null);
      prismaMock.client.organizationUnit.findFirst.mockImplementation(({ where }) => {
        if (where.id === "custom-org-unit") return Promise.resolve({ id: "custom-org-unit" });
        if (where.id === "unit-g") return Promise.resolve(null);
        return Promise.resolve(null);
      });

      // Mock ingredient unit as system unit
      prismaMock.client.systemUnit.findUnique.mockImplementation(({ where }) => {
        if (where.id === "unit-g") return Promise.resolve({ id: "unit-g" });
        return Promise.resolve(null);
      });

      const dto: CreateRecipeDto = {
        name: "Sourdough",
        categoryId: "cat-1",
        producesVariantId: "var-prod-1",
        yieldQuantity: 10,
        systemUnitId: "custom-org-unit", // Passed as systemUnitId, but actually an org unit
        ingredients: [validIngredient],
      };

      const mockCreatedRecipe = { id: "rec-1", name: "Sourdough", organizationId: "org-1" };
      prismaMock.client.recipe.create.mockResolvedValue(mockCreatedRecipe);

      const result = await service.createRecipe("org-1", dto);
      expect(result).toEqual(mockCreatedRecipe);
      expect(prismaMock.client.recipe.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            systemUnitId: undefined,
            orgUnitId: "custom-org-unit",
          }),
        }),
      );
    });

    it("should resolve unit by fallback symbol/name search when direct ID lookup yields null (e.g. count-pcs -> pc)", async () => {
      prismaMock.client.systemUnit.findUnique.mockResolvedValue(null);
      prismaMock.client.organizationUnit.findFirst.mockResolvedValue(null);
      prismaMock.client.systemUnit.findFirst.mockImplementation(({ where }: any) => {
        const hasPc = where?.OR?.some((cond: any) => cond.symbol?.equals === "pc");
        if (hasPc) {
          return Promise.resolve({ id: "sys-pc-id" });
        }
        if (where?.OR?.some((cond: any) => cond.symbol?.equals === "g" || cond.symbol?.equals === "unit-g")) {
          return Promise.resolve({ id: "sys-g-id" });
        }
        return Promise.resolve(null);
      });

      const dto: CreateRecipeDto = {
        name: "Croissant",
        categoryId: "cat-1",
        producesVariantId: "var-prod-1",
        yieldQuantity: 12,
        systemUnitId: "count-pcs",
        ingredients: [validIngredient],
      };

      const mockCreatedRecipe = { id: "rec-2", name: "Croissant", organizationId: "org-1" };
      prismaMock.client.recipe.create.mockResolvedValue(mockCreatedRecipe);

      const result = await service.createRecipe("org-1", dto);
      expect(result).toEqual(mockCreatedRecipe);
      expect(prismaMock.client.recipe.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            systemUnitId: "sys-pc-id",
          }),
        }),
      );
    });

    it("should create a recipe with all fields including temperature, servingSize, totalTime, costPrice, and preparationNotes", async () => {
      prismaMock.client.systemUnit.findUnique.mockResolvedValue({ id: "unit-kg" });

      const dto: CreateRecipeDto = {
        name: "Grand Sourdough",
        categoryId: "cat-1",
        producesVariantId: "var-prod-1",
        yieldQuantity: 10,
        systemUnitId: "unit-kg",
        costPrice: 25.50,
        description: "Special sourdough formula",
        prepTime: 45,
        bakeTime: 35,
        totalTime: 80,
        difficulty: "EXPERT",
        temperatureCelsius: 230,
        servingSize: "1 loaf",
        instructions: "1. Mix flour and water\n2. Ferment for 12h",
        notes: "Keep ambient temp at 24C",
        tags: ["sourdough", "artisan"],
        ingredients: [
          {
            ingredientVariantId: "flour-var-1",
            quantity: 5,
            systemUnitId: "unit-kg",
            preparationNotes: "Cold water hydration, sifted flour",
          },
        ],
      };

      const mockCreatedRecipe = { id: "rec-full-1", name: "Grand Sourdough", organizationId: "org-1" };
      prismaMock.client.recipe.create.mockResolvedValue(mockCreatedRecipe);

      const result = await service.createRecipe("org-1", dto);
      expect(result).toEqual(mockCreatedRecipe);
      expect(prismaMock.client.recipe.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: "Grand Sourdough",
          costPrice: 25.50,
          prepTime: 45,
          bakeTime: 35,
          totalTime: 80,
          difficulty: "EXPERT",
          temperatureCelsius: 230,
          servingSize: "1 loaf",
          instructions: "1. Mix flour and water\n2. Ferment for 12h",
          notes: "Keep ambient temp at 24C",
          tags: ["sourdough", "artisan"],
          ingredients: {
            create: [
              {
                ingredientVariantId: "flour-var-1",
                quantity: 5,
                systemUnitId: "unit-kg",
                orgUnitId: undefined,
                preparationNotes: "Cold water hydration, sifted flour",
              },
            ],
          },
        }),
        include: expect.anything(),
      });
    });

    it("should update a recipe and switch yield unit cleanly from system unit to org unit", async () => {
      prismaMock.client.recipe.findFirst.mockResolvedValue({
        id: "rec-1",
        organizationId: "org-1",
        systemUnitId: "sys-unit-old",
        orgUnitId: null,
      });

      prismaMock.client.systemUnit.findUnique.mockResolvedValue(null);
      prismaMock.client.organizationUnit.findFirst.mockResolvedValue({ id: "org-unit-new" });

      const mockUpdatedRecipe = {
        id: "rec-1",
        name: "Sourdough Updated",
        organizationId: "org-1",
        systemUnitId: null,
        orgUnitId: "org-unit-new",
      };
      prismaMock.client.recipe.update.mockResolvedValue(mockUpdatedRecipe);

      const result = await service.updateRecipe("org-1", "rec-1", {
        name: "Sourdough Updated",
        orgUnitId: "org-unit-new",
        temperatureCelsius: 220,
        servingSize: "2 loaves",
        costPrice: 18.0,
      });

      expect(result).toEqual(mockUpdatedRecipe);
      expect(prismaMock.client.recipe.update).toHaveBeenCalledWith({
        where: { id: "rec-1", organizationId: "org-1" },
        data: expect.objectContaining({
          name: "Sourdough Updated",
          systemUnitId: null,
          orgUnitId: "org-unit-new",
          temperatureCelsius: 220,
          servingSize: "2 loaves",
          costPrice: 18.0,
        }),
        include: expect.anything(),
      });
    });

    it("should create recipe successfully when system unit is valid", async () => {
      prismaMock.client.systemUnit.findUnique.mockResolvedValue({ id: "unit-kg" });

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
