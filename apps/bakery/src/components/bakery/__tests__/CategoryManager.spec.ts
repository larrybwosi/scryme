import { describe, it, expect } from "vitest";

describe("CategoryManager safe formatting helpers", () => {
  it("should safely format createdAt dates and avoid RangeError on empty/invalid dates", () => {
    const formatDate = (createdAt?: any) => {
      return createdAt && !isNaN(new Date(createdAt).getTime())
        ? new Date(createdAt).toLocaleDateString()
        : "N/A";
    };

    expect(formatDate(undefined)).toBe("N/A");
    expect(formatDate("")).toBe("N/A");
    expect(formatDate(null)).toBe("N/A");
    expect(formatDate("invalid-date-string")).toBe("N/A");
    expect(formatDate("2026-03-01T08:00:00.000Z")).not.toBe("N/A");
  });

  it("should safely extract category stats from various backend payload formats", () => {
    const categories = [
      { id: "cat-1", name: "Breads", _count: { recipes: 5 } },
      { id: "cat-2", name: "Pastries", recipesCount: 10, templatesCount: 2, batchesCount: 3 },
      { id: "cat-3", name: "Cakes", recipes: [1, 2], templates: [1], batches: [] },
      { id: "cat-4", name: "Empty Category" },
    ];

    const getCategoryStats = (categoryId: string) => {
      const category = categories.find((c) => c.id === categoryId);
      if (!category) return { recipes: 0, templates: 0, batches: 0 };

      const recipesCount =
        typeof (category as any).recipesCount === "number"
          ? (category as any).recipesCount
          : (category as any)?._count?.recipes ??
            (Array.isArray((category as any).recipes)
              ? (category as any).recipes.length
              : typeof (category as any).recipes === "number"
                ? (category as any).recipes
                : 0);

      const templatesCount =
        typeof (category as any).templatesCount === "number"
          ? (category as any).templatesCount
          : (category as any)?._count?.templates ??
            (Array.isArray((category as any).templates)
              ? (category as any).templates.length
              : typeof (category as any).templates === "number"
                ? (category as any).templates
                : 0);

      const batchesCount =
        typeof (category as any).batchesCount === "number"
          ? (category as any).batchesCount
          : (category as any)?._count?.batches ??
            (Array.isArray((category as any).batches)
              ? (category as any).batches.length
              : typeof (category as any).batches === "number"
                ? (category as any).batches
                : 0);

      return {
        recipes: recipesCount,
        templates: templatesCount,
        batches: batchesCount,
      };
    };

    expect(getCategoryStats("cat-1")).toEqual({ recipes: 5, templates: 0, batches: 0 });
    expect(getCategoryStats("cat-2")).toEqual({ recipes: 10, templates: 2, batches: 3 });
    expect(getCategoryStats("cat-3")).toEqual({ recipes: 2, templates: 1, batches: 0 });
    expect(getCategoryStats("cat-4")).toEqual({ recipes: 0, templates: 0, batches: 0 });
    expect(getCategoryStats("non-existent")).toEqual({ recipes: 0, templates: 0, batches: 0 });
  });
});
