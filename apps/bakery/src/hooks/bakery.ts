import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import sdk from "@/lib/sdk";
import { tauriInvoke } from "@/lib/tauri-bridge";
import { isTauri, isOfflineMode } from "@/lib/sdk";
import {
  FormattedBatch,
  Recipe,
  Template,
  BakeryCategory,
  Ingredient,
  BakeryBaker,
  BakerySettings,
  BakeryBranding,
  OverviewData,
  StockItem,
} from "@/types/bakery";
import { BakeryBatchListResponse } from "@repo/sdk";

// fallow-ignore-next-line unused-types
export type { StockItem, OverviewData };

// Batches
export const useBatches = (filters?: any) => {
  return useQuery({
    queryKey: ["batches", filters],
    queryFn: async () => {
      if (isTauri() && isOfflineMode()) {
        const data = await tauriInvoke<FormattedBatch[]>("get_batches");
        return {
          data,
          metadata: { total: data.length, page: 1, limit: 100, totalPages: 1 },
        };
      }
      const resp = await sdk.bakery.getBatches(filters);
      return {
        data: (Array.isArray(resp)
          ? resp
          : resp?.data || []) as unknown as FormattedBatch[],
        metadata: !Array.isArray(resp) ? resp?.metadata || resp?.meta : undefined,
      };
    },
  });
};

export const useBatchById = (id: string) => {
  return useQuery({
    queryKey: ["batches", id],
    queryFn: async () => {
      if (isTauri() && isOfflineMode()) {
        const batches = await tauriInvoke<FormattedBatch[]>("get_batches");
        return batches.find((b) => b.id === id) as FormattedBatch;
      }
      const data = await sdk.bakery.getBatch(id);
      return data as unknown as FormattedBatch;
    },
  });
};

export const useBatchTraceability = (id: string) => {
  return useQuery({
    queryKey: ["batches", id, "traceability"],
    queryFn: async () => {
      if (isTauri() && isOfflineMode()) {
        return tauriInvoke("get_batch_traceability", { id });
      }
      return sdk.bakery.getBatchTraceability(id);
    },
    enabled: !!id,
  });
};

export const useCreateBatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => {
      if (isTauri() && isOfflineMode()) {
        return tauriInvoke("create_batch", {
          userId: "local-user",
          input: { ...data, organizationId: "local-org" },
        });
      }
      return sdk.bakery.createBatch(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["batches"] }),
  });
};

// Recipes
export const useRecipes = () => {
  return useQuery({
    queryKey: ["recipes"],
    queryFn: async () => {
      if (isTauri() && isOfflineMode()) {
        return tauriInvoke<Recipe[]>("get_recipes");
      }
      const data = await sdk.bakery.getRecipes();
      return (Array.isArray(data)
        ? data
        : data?.data || []) as unknown as Recipe[];
    },
  });
};

export const useRecipe = (id: string) => {
  return useQuery({
    queryKey: ["recipe", id],
    queryFn: async () => {
      if (isTauri() && isOfflineMode()) {
        const recipes = await tauriInvoke<Recipe[]>("get_recipes");
        return recipes.find((r) => r.id === id) as Recipe;
      }
      const data = await sdk.bakery.getRecipe(id);
      return data as unknown as Recipe;
    },
  });
};

export const useCreateRecipe = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => {
      if (isTauri() && isOfflineMode()) {
        return tauriInvoke("create_recipe", {
          userId: "local-user",
          input: { ...data, organizationId: "local-org" },
        });
      }
      return sdk.bakery.createRecipe(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recipes"] }),
  });
};

// Scaling logic integration
// fallow-ignore-next-line unused-exports
export const useScaleRecipe = () => {
  return useMutation({
    mutationFn: async ({
      recipeId,
      targetYield,
    }: {
      recipeId: string;
      targetYield: number;
    }) => {
      if (isTauri() && isOfflineMode()) {
        return tauriInvoke("scale_recipe", { recipeId, targetYield });
      }
      return null;
    },
  });
};

// Templates
export const useTemplates = () => {
  return useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      if (isTauri() && isOfflineMode()) {
        return tauriInvoke<Template[]>("get_templates");
      }
      const data = await sdk.bakery.getTemplates();
      return (Array.isArray(data)
        ? data
        : data?.data || []) as unknown as Template[];
    },
  });
};

// Settings & Bakers
export const useBakerySettings = () => {
  return useQuery({
    queryKey: ["bakerySettings"],
    queryFn: async () => {
      if (isTauri() && isOfflineMode()) {
        return tauriInvoke<BakerySettings>("get_settings", {
          organizationId: "local-org",
        });
      }
      const data = await sdk.bakery.getSettings();
      return data as unknown as BakerySettings;
    },
  });
};

export const useBakers = () => {
  return useQuery({
    queryKey: ["bakers"],
    queryFn: async () => {
      if (isTauri() && isOfflineMode()) {
        return tauriInvoke<BakeryBaker[]>("get_bakers");
      }
      const data = await sdk.bakery.getBakers();
      return (Array.isArray(data)
        ? data
        : data?.data || []) as unknown as BakeryBaker[];
    },
  });
};

// Overview
export const useBakeryData = () => {
  return useQuery({
    queryKey: ["bakeryOverview"],
    queryFn: async () => {
      if (isTauri() && isOfflineMode()) {
        return tauriInvoke<OverviewData>("get_overview", {
          organizationId: "local-org",
        });
      }
      const data = await sdk.bakery.getOverview();
      return data as unknown as OverviewData;
    },
  });
};

// Ingredients
export {
  useRawMaterials as useListIngredients,
  useCreateRawMaterial as useCreateIngredient,
  useUpdateRawMaterial as useUpdateIngredient,
  useDeleteRawMaterial as useDeleteIngredient,
} from "@/lib/hooks/raw-materials";

// Categories
export const useBakeryCategories = () => {
  return useQuery({
    queryKey: ["bakeryCategories"],
    queryFn: async () => {
      if (isTauri() && isOfflineMode()) {
        return tauriInvoke<BakeryCategory[]>("get_categories");
      }
      const data = await sdk.bakery.getCategories();
      return (Array.isArray(data)
        ? data
        : data?.data || []) as unknown as BakeryCategory[];
    },
  });
};

export const useUpdateRecipe = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => {
      if (isTauri() && isOfflineMode()) {
        return tauriInvoke("update_recipe", {
          userId: "local-user",
          recipe: { id, ...data },
        });
      }
      return sdk.bakery.updateRecipe(id, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recipes"] }),
  });
};

export const useDeleteRecipe = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (isTauri() && isOfflineMode()) {
        return tauriInvoke("delete_recipe", { userId: "local-user", id });
      }
      return sdk.bakery.deleteRecipe(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recipes"] }),
  });
};

export const useUpdateBatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => {
      if (isTauri() && isOfflineMode()) {
        return tauriInvoke("update_batch", {
          userId: "local-user",
          input: { id, ...data },
        });
      }
      return sdk.bakery.updateBatch(id, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["batches"] }),
  });
};

// fallow-ignore-next-line unused-exports
export const useDeleteBatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (isTauri() && isOfflineMode()) {
        return tauriInvoke("delete_batch", { userId: "local-user", id });
      }
      return sdk.bakery.deleteBatch(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["batches"] }),
  });
};

export const useStartBatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (isTauri() && isOfflineMode()) {
        return tauriInvoke("update_batch_status", {
          userId: "local-user",
          id,
          status: "IN_PROGRESS",
        });
      }
      return sdk.bakery.startBatch(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["batches"] }),
  });
};

export const useCompleteBatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ batchId, data }: any) => {
      if (isTauri() && isOfflineMode()) {
        return tauriInvoke("update_batch_status", {
          userId: "local-user",
          id: batchId,
          status: "COMPLETED",
        });
      }
      return sdk.bakery.completeBatch(batchId, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["batches"] }),
  });
};

export const useCancelBatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (isTauri() && isOfflineMode()) {
        return tauriInvoke("update_batch_status", {
          userId: "local-user",
          id,
          status: "CANCELLED",
        });
      }
      return sdk.bakery.cancelBatch(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["batches"] }),
  });
};

export const useDuplicateBatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (isTauri() && isOfflineMode()) {
        // Mock duplicate for now or implement in Rust
        return tauriInvoke("get_batches").then((batches: any) => {
          const batch = batches.find((b: any) => b.id === id);
          if (!batch) throw new Error("Batch not found");
          return tauriInvoke("create_batch", {
            userId: "local-user",
            input: {
              ...batch,
              id: undefined,
              batchNumber: undefined,
              name: `${batch.name} (Copy)`,
              status: "PLANNED",
              recipeId: batch.recipe.id,
              plannedQuantity: batch.plannedQuantity,
              date: new Date().toISOString(),
              time: format(new Date(), "HH:mm"),
            },
          });
        });
      }
      return sdk.bakery.duplicateBatch(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["batches"] }),
  });
};

export const useCreateTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => {
      if (isTauri() && isOfflineMode()) {
        return tauriInvoke("create_template", {
          userId: "local-user",
          template: { ...data, organizationId: "local-org" },
        });
      }
      return sdk.bakery.createTemplate(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["templates"] }),
  });
};

export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, data }: any) => {
      if (isTauri() && isOfflineMode()) {
        return tauriInvoke("update_template", {
          userId: "local-user",
          template: { id: templateId, ...data },
        });
      }
      return sdk.bakery.updateTemplate(templateId, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["templates"] }),
  });
};

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (isTauri() && isOfflineMode()) {
        return tauriInvoke("delete_template", { userId: "local-user", id });
      }
      return sdk.bakery.deleteTemplate(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["templates"] }),
  });
};

export const useDuplicateTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (isTauri() && isOfflineMode()) {
        return tauriInvoke("get_templates").then((templates: any) => {
          const template = templates.find((t: any) => t.id === id);
          if (!template) throw new Error("Template not found");
          return tauriInvoke("create_template", {
            userId: "local-user",
            template: {
              ...template,
              id: undefined,
              name: `${template.name} (Copy)`,
            },
          });
        });
      }
      return sdk.bakery.duplicateTemplate(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["templates"] }),
  });
};

export const useCreateBatchFromTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (isTauri() && isOfflineMode()) {
        return tauriInvoke("get_templates").then((templates: any) => {
          const template = templates.find((t: any) => t.id === id);
          if (!template) throw new Error("Template not found");
          return tauriInvoke("create_batch", {
            userId: "local-user",
            input: {
              name: template.name,
              recipeId: template.recipeId,
              plannedQuantity: template.quantity,
              status: "PLANNED",
              organizationId: "local-org",
              date: new Date().toISOString(),
              time: format(new Date(), "HH:mm"),
            },
          });
        });
      }
      return sdk.bakery.createBatchFromTemplate(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["batches"] }),
  });
};

export const useCreateBakeryCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => {
      if (isTauri() && isOfflineMode()) {
        return tauriInvoke("create_category", {
          userId: "local-user",
          category: { ...data, organizationId: "local-org" },
        });
      }
      return sdk.bakery.createCategory(data);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["bakeryCategories"] }),
  });
};

export const useUpdateBakeryCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: any) => {
      if (isTauri() && isOfflineMode()) {
        return tauriInvoke("update_category", {
          userId: "local-user",
          category: { id, ...data },
        });
      }
      return sdk.bakery.updateCategory(id, data);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["bakeryCategories"] }),
  });
};

export const useDeleteBakeryCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (isTauri() && isOfflineMode()) {
        return tauriInvoke("delete_category", { userId: "local-user", id });
      }
      return sdk.bakery.deleteCategory(id);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["bakeryCategories"] }),
  });
};

export const useGenerateRecipeAi = () => {
  return useMutation({
    mutationFn: async ({ prompt }: { prompt: string }) => {
      if (isTauri() && isOfflineMode()) {
        throw new Error(
          "AI Recipe Generation is not available in offline mode",
        );
      }
      return sdk.bakery.generateRecipeAi(prompt);
    },
  });
};

export function useBakeryBranding() {
  const [branding, setBranding] = useState<BakeryBranding>(() => {
    const saved = localStorage.getItem("bakery_branding");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse branding", e);
      }
    }
    return {
      name: "Scryme Bakery",
      logoUrl: "",
      colors: {
        primary: "#f59e0b", // amber-500
        secondary: "#64748b", // slate-500
        accent: "#3b82f6", // blue-500
      },
    };
  });

  useEffect(() => {
    localStorage.setItem("bakery_branding", JSON.stringify(branding));
  }, [branding]);

  return { branding, setBranding };
}

export function useBakerySettingsManagement() {
  const {
    data: settings,
    isLoading: settingsLoading,
    error: settingsError,
  } = useBakerySettings();
  const {
    data: bakers,
    isLoading: bakersLoading,
    error: bakersError,
  } = useBakers();
  const { branding, setBranding } = useBakeryBranding();
  const queryClient = useQueryClient();

  const updateSettings = useMutation({
    mutationFn: (data: any) => {
      if (isTauri() && isOfflineMode()) {
        return tauriInvoke("update_settings", {
          userId: "local-user",
          settings: data,
        });
      }
      return sdk.bakery.updateSettings(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bakerySettings"] });
      queryClient.invalidateQueries({ queryKey: ["bakeryOverview"] });
    },
  });

  const addBaker = useMutation({
    mutationFn: (data: any) => {
      if (isTauri() && isOfflineMode()) {
        return tauriInvoke("create_baker", {
          userId: "local-user",
          baker: { ...data, organizationId: "local-org" },
        });
      }
      return sdk.bakery.addBaker(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bakers"] }),
  });

  const removeBaker = useMutation({
    mutationFn: (bakerId: string) => {
      if (isTauri() && isOfflineMode()) {
        return tauriInvoke("delete_baker", {
          userId: "local-user",
          id: bakerId,
        });
      }
      return sdk.bakery.removeBaker(bakerId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bakers"] }),
  });

  const updateBaker = useMutation({
    mutationFn: ({ bakerId, data }: any) => {
      if (isTauri() && isOfflineMode()) {
        return tauriInvoke("update_baker", {
          userId: "local-user",
          baker: { id: bakerId, ...data },
        });
      }
      return sdk.bakery.updateBaker(bakerId, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bakers"] }),
  });

  return {
    settings,
    branding,
    setBranding,
    isLoading: settingsLoading || bakersLoading,
    error: settingsError || bakersError,
    updateSettings: updateSettings.mutate,
    updateSettingsAsync: updateSettings.mutateAsync,
    isUpdating: updateSettings.isPending,
    bakers,
    addBaker: addBaker.mutate,
    addBakerAsync: addBaker.mutateAsync,
    isAddingBaker: addBaker.isPending,
    updateBaker: updateBaker.mutate,
    updateBakerAsync: updateBaker.mutateAsync,
    isUpdatingBaker: updateBaker.isPending,
    removeBaker: removeBaker.mutate,
    removeBakerAsync: removeBaker.mutateAsync,
    isRemovingBaker: removeBaker.isPending,
  };
}
