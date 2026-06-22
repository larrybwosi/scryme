import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { CreateRawMaterialInput, UpdateRawMaterialInput } from '../validations/raw-materials';
import { toast } from 'sonner';
import { isTauri, isOfflineMode } from '../sdk';
import sdk from '../sdk';
import { tauriInvoke } from '../tauri-bridge';

import { Ingredient } from '@/types/bakery';

export const useRawMaterials = () => {
  return useQuery<Ingredient[]>({
    queryKey: ['ingredients'],
    queryFn: async () => {
      if (isTauri() || isOfflineMode()) {
        return tauriInvoke<Ingredient[]>('get_ingredients');
      }
      const data = await sdk.bakery.getIngredients();
      return data as Ingredient[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useRawMaterial = (productId: string) => {
  return useQuery<Ingredient>({
    queryKey: ['ingredient', productId],
    queryFn: async () => {
      if (isTauri() || isOfflineMode()) {
        const ingredients = await tauriInvoke<Ingredient[]>('get_ingredients');
        return ingredients.find(i => i.id === productId || (i as any).productId === productId) as Ingredient;
      }
      const ingredients = await sdk.bakery.getIngredients();
      return ingredients.find((i: any) => i.id === productId || i.productId === productId) as Ingredient;
    },
    enabled: !!productId,
  });
};

export const useCreateRawMaterial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRawMaterialInput) => {
      if (isTauri() || isOfflineMode()) {
        const ingredientData = {
          name: data.name,
          sku: data.sku,
          categoryId: data.categoryId,
          unitPrice: data.buyingPrice,
          reorderLevel: data.reorderPoint,
          unitId: data.baseUnitId || data.baseOrgUnitId,
          stockingUnitId: data.stockingUnitId || data.stockingOrgUnitId,
          unitsPerContainer: data.unitsPerContainer,
          organizationId: 'local-org',
          currentStock: 0,
          maxStock: (data.reorderPoint || 0) * 2,
        };
        return tauriInvoke('create_ingredient', { userId: 'local-user', ingredient: ingredientData });
      }
      return sdk.bakery.createIngredient(data);
    },
    onSuccess: () => {
      // Invalidate and refetch raw materials list
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
    },
    onError: (error: any) => {
      throw new Error(error.response?.data?.message || error.message || 'Failed to create raw material');
    },
  });
};

interface GenerateRawMaterialRequest {
  prompt: string;
}

interface GeneratedRawMaterial {
  name: string;
  categoryId: string;
  description?: string;
  sku?: string;
  buyingPrice: number;
  reorderPoint: number;
  baseUnitId: string;
}

interface GenerateRawMaterialResponse {
  materials: GeneratedRawMaterial[];
  message: string;
}

interface UseGenerateRawMaterialOptions {
  onSuccess?: (data: GenerateRawMaterialResponse) => void;
  onError?: (error: Error) => void;
}

export function useGenerateRawMaterialAdvanced(options: UseGenerateRawMaterialOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: GenerateRawMaterialRequest): Promise<GenerateRawMaterialResponse> => {
      try {
        const response = await sdk.client.post('/bakery/recipes/generate', data);

        if (!response.materials || !Array.isArray(response.materials)) {
          // If the backend returns a single generated recipe instead of multiple materials,
          // adapt it to the expected format if possible, or throw error.
          // For now, keeping it consistent with what generateRecipeAi seems to return.
          return {
             materials: [response],
             message: "AI Generation Complete"
          } as any;
        }

        return response;
      } catch (error: any) {
        if (error.response) {
          // Server responded with error status
          throw new Error(error.response.data.message || `Server error: ${error.response.status}`, { cause: error });
        }
        throw error;
      }
    },

    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });

      toast('AI Generation Complete', {
        description: `Successfully generated ${data.materials.length} material(s)`,
      });

      options.onSuccess?.(data);
    },

    onError: (error: Error) => {
      console.error('AI generation error:', error);

      toast.error('AI Generation Failed',{
        description: error.message,
      });

      options.onError?.(error);
    },
  });
}

export const useUpdateRawMaterial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateRawMaterialInput }) => {
      if (isTauri() || isOfflineMode()) {
        const ingredientData = {
          id,
          name: data.name,
          sku: data.sku,
          categoryId: data.categoryId,
          unitPrice: data.buyingPrice,
          reorderLevel: data.reorderPoint,
          unitId: data.baseUnitId || data.baseOrgUnitId,
          stockingUnitId: data.stockingUnitId || data.stockingOrgUnitId,
          unitsPerContainer: data.unitsPerContainer,
        };
        return tauriInvoke('update_ingredient', { userId: 'local-user', ingredient: ingredientData });
      }
      return sdk.bakery.updateIngredient(id, data);
    },
    onSuccess: (data, variables) => {
      // Invalidate both the list and the specific raw material
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      queryClient.invalidateQueries({ queryKey: ['ingredient', variables.id] });
    },
    onError: (error: any) => {
      throw new Error(error.response?.data?.message || error.message || 'Failed to update raw material');
    },
  });
};

export const useDeleteRawMaterial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (isTauri() || isOfflineMode()) {
        return tauriInvoke('delete_ingredient', { userId: 'local-user', id });
      }
      return sdk.bakery.deleteIngredient(id);
    },
    onSuccess: () => {
      // Invalidate raw materials list
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
    },
    onError: (error: any) => {
      throw new Error(error.response?.data?.message || error.message || 'Failed to delete raw material');
    },
  });
};
