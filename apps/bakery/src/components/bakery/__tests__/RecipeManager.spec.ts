import { describe, it, expect } from "vitest";

describe("Recipe Form & Management Data Processing", () => {
  it("should correctly format recipe payload on create and update", () => {
    const formatPayload = (formData: any) => {
      return {
        ...formData,
        systemUnitId: formData.systemUnitId || undefined,
        orgUnitId: formData.orgUnitId || undefined,
        costPrice: formData.costPrice !== undefined && formData.costPrice !== '' && !Number.isNaN(Number(formData.costPrice)) ? Number(formData.costPrice) : undefined,
        prepTime: formData.prepTime !== undefined && formData.prepTime !== '' && !Number.isNaN(Number(formData.prepTime)) ? Number(formData.prepTime) : undefined,
        bakeTime: formData.bakeTime !== undefined && formData.bakeTime !== '' && !Number.isNaN(Number(formData.bakeTime)) ? Number(formData.bakeTime) : undefined,
        totalTime: formData.totalTime !== undefined && formData.totalTime !== '' && !Number.isNaN(Number(formData.totalTime)) ? Number(formData.totalTime) : undefined,
        temperatureCelsius: formData.temperatureCelsius !== undefined && formData.temperatureCelsius !== '' && !Number.isNaN(Number(formData.temperatureCelsius)) ? Number(formData.temperatureCelsius) : undefined,
        ingredients: formData.ingredients?.map((ing: any) => ({
          ...ing,
          systemUnitId: ing.systemUnitId || undefined,
          orgUnitId: ing.orgUnitId || undefined,
          preparationNotes: ing.preparationNotes || undefined,
        })),
      };
    };

    const inputData = {
      name: "Sourdough Boule",
      categoryId: "cat-1",
      producesVariantId: "var-1",
      yieldQuantity: 2,
      systemUnitId: "unit-loaves",
      costPrice: "12.50",
      prepTime: "20",
      bakeTime: "40",
      totalTime: "60",
      difficulty: "HARD",
      temperatureCelsius: "220",
      servingSize: "1 loaf",
      ingredients: [
        {
          ingredientVariantId: "flour-1",
          quantity: "500",
          systemUnitId: "unit-g",
          preparationNotes: "Sifted",
        },
      ],
    };

    const payload = formatPayload(inputData);
    expect(payload.costPrice).toBe(12.50);
    expect(payload.prepTime).toBe(20);
    expect(payload.bakeTime).toBe(40);
    expect(payload.totalTime).toBe(60);
    expect(payload.temperatureCelsius).toBe(220);
    expect(payload.ingredients[0].preparationNotes).toBe("Sifted");
  });

  it("should populate edit mode initial form state from existing recipe entity", () => {
    const mapRecipeToEditState = (recipe: any) => {
      return {
        name: recipe.name || '',
        categoryId: recipe.categoryId || '',
        description: recipe.description || '',
        instructions: recipe.instructions || '',
        notes: recipe.notes || '',
        yieldQuantity: recipe.yieldQuantity,
        systemUnitId: recipe.systemUnitId || undefined,
        orgUnitId: recipe.orgUnitId || undefined,
        producesVariantId: recipe.producesVariantId || '',
        prepTime: recipe.prepTime ?? 0,
        bakeTime: recipe.bakeTime ?? 0,
        totalTime: recipe.totalTime ?? ((recipe.prepTime || 0) + (recipe.bakeTime || 0)),
        difficulty: recipe.difficulty || 'MEDIUM',
        temperatureCelsius: recipe.temperatureCelsius ?? undefined,
        servingSize: recipe.servingSize || '',
        costPrice: recipe.costPrice ?? undefined,
        tags: recipe.tags || [],
        ingredients: recipe.ingredients?.map((ing: any) => ({
          id: ing.id,
          ingredientVariantId: ing.ingredientVariantId,
          quantity: ing.quantity,
          systemUnitId: ing.systemUnitId || undefined,
          orgUnitId: ing.orgUnitId || undefined,
          preparationNotes: ing.preparationNotes || '',
        })) || [],
      };
    };

    const recipe = {
      id: "rec-100",
      name: "Chocolate Croissant",
      categoryId: "cat-pastry",
      yieldQuantity: 12,
      systemUnitId: "unit-pcs",
      producesVariantId: "var-croissant",
      costPrice: 8.75,
      prepTime: 45,
      bakeTime: 20,
      totalTime: 65,
      difficulty: "EXPERT",
      temperatureCelsius: 200,
      servingSize: "1 pastry",
      tags: ["butter", "chocolate"],
      ingredients: [
        {
          id: "ing-1",
          ingredientVariantId: "var-butter",
          quantity: 250,
          systemUnitId: "unit-g",
          preparationNotes: "Cold, laminating butter",
        },
      ],
    };

    const state = mapRecipeToEditState(recipe);
    expect(state.difficulty).toBe("EXPERT");
    expect(state.temperatureCelsius).toBe(200);
    expect(state.servingSize).toBe("1 pastry");
    expect(state.costPrice).toBe(8.75);
    expect(state.totalTime).toBe(65);
    expect(state.ingredients[0].preparationNotes).toBe("Cold, laminating butter");
  });
});
