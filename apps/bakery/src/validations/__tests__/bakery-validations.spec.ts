import { describe, it, expect } from "vitest";
import { recipeSchema, bakeryCategorySchema, batchSchema } from "../bakery";

describe("Bakery App Validations - Category, Recipe & Batch Schemas", () => {
  describe("bakeryCategorySchema", () => {
    it("should pass with valid category name and optional description", () => {
      const result = bakeryCategorySchema.safeParse({
        name: "Artisan Breads",
        description: "Fresh sourdough and traditional loaves",
      });
      expect(result.success).toBe(true);
    });

    it("should fail when category name is empty", () => {
      const result = bakeryCategorySchema.safeParse({
        name: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Category name is required");
      }
    });
  });

  describe("recipeSchema", () => {
    const validIngredient = {
      ingredientVariantId: "variant-123",
      quantity: 500,
      systemUnitId: "unit-grams",
    };

    it("should pass when recipe has name, category, producesVariantId, yield unit, and at least 1 ingredient", () => {
      const result = recipeSchema.safeParse({
        name: "Classic Sourdough",
        categoryId: "cat-123",
        producesVariantId: "prod-variant-123",
        yieldQuantity: 1,
        systemUnitId: "unit-loaves",
        ingredients: [validIngredient],
      });
      expect(result.success).toBe(true);
    });

    it("should pass with all recipe fields provided including EXPERT difficulty and ingredient preparationNotes", () => {
      const fullRecipe = {
        name: "Artisan Baguette",
        categoryId: "cat-123",
        producesVariantId: "prod-variant-123",
        yieldQuantity: 12,
        systemUnitId: "unit-pcs",
        costPrice: 15.5,
        prepTime: 30,
        bakeTime: 25,
        totalTime: 55,
        difficulty: "EXPERT",
        temperatureCelsius: 240,
        servingSize: "1 baguette",
        instructions: "1. Autolyse\n2. Bulk ferment\n3. Shape and bake",
        notes: "Steam oven for 10 mins",
        tags: ["french", "artisan"],
        ingredients: [
          {
            ingredientVariantId: "flour-1",
            quantity: 1000,
            systemUnitId: "unit-g",
            preparationNotes: "Unbleached bread flour, sifted",
          },
        ],
      };
      const result = recipeSchema.safeParse(fullRecipe);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.difficulty).toBe("EXPERT");
        expect(result.data.temperatureCelsius).toBe(240);
        expect(result.data.servingSize).toBe("1 baguette");
        expect(result.data.ingredients[0].preparationNotes).toBe("Unbleached bread flour, sifted");
      }
    });

    it("should handle empty or NaN strings for optional numeric fields gracefully", () => {
      const recipeWithEmptyStrings = {
        name: "Brioche",
        categoryId: "cat-123",
        producesVariantId: "prod-variant-123",
        yieldQuantity: 1,
        systemUnitId: "unit-loaves",
        costPrice: "",
        prepTime: "",
        bakeTime: "",
        totalTime: "",
        temperatureCelsius: "",
        ingredients: [validIngredient],
      };
      const result = recipeSchema.safeParse(recipeWithEmptyStrings);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.costPrice).toBeUndefined();
        expect(result.data.prepTime).toBeUndefined();
        expect(result.data.bakeTime).toBeUndefined();
        expect(result.data.temperatureCelsius).toBeUndefined();
      }
    });

    it("should fail when ingredients list is empty", () => {
      const result = recipeSchema.safeParse({
        name: "Classic Sourdough",
        categoryId: "cat-123",
        producesVariantId: "prod-variant-123",
        yieldQuantity: 1,
        systemUnitId: "unit-loaves",
        ingredients: [],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("At least one ingredient is required");
      }
    });

    it("should fail when neither systemUnitId nor orgUnitId is provided for yield", () => {
      const result = recipeSchema.safeParse({
        name: "Classic Sourdough",
        categoryId: "cat-123",
        producesVariantId: "prod-variant-123",
        yieldQuantity: 1,
        ingredients: [validIngredient],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "At least one yield unit (system or organization) must be selected for the recipe"
        );
      }
    });

    it("should fail when an ingredient has no unit specified", () => {
      const result = recipeSchema.safeParse({
        name: "Classic Sourdough",
        categoryId: "cat-123",
        producesVariantId: "prod-variant-123",
        yieldQuantity: 1,
        systemUnitId: "unit-loaves",
        ingredients: [
          {
            ingredientVariantId: "variant-123",
            quantity: 500,
          },
        ],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "At least one unit (system or organization) must be selected for the ingredient"
        );
      }
    });
  });

  describe("batchSchema", () => {
    const validBatch = {
      recipeId: "recipe-123",
      plannedQuantity: 10,
      systemUnitId: "unit-loaves",
      date: new Date(),
      time: "08:00",
    };

    it("should pass when valid batch data with systemUnitId is provided", () => {
      const result = batchSchema.safeParse(validBatch);
      expect(result.success).toBe(true);
    });

    it("should pass when valid batch data with orgUnitId is provided", () => {
      const result = batchSchema.safeParse({
        ...validBatch,
        systemUnitId: undefined,
        orgUnitId: "custom-unit-123",
      });
      expect(result.success).toBe(true);
    });

    it("should fail when neither systemUnitId nor orgUnitId is provided", () => {
      const result = batchSchema.safeParse({
        ...validBatch,
        systemUnitId: undefined,
        orgUnitId: undefined,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "At least one unit (system or organization) must be selected for the batch quantity"
        );
        expect(result.error.issues[0].path).toEqual(["systemUnitId"]);
      }
    });
  });
});
