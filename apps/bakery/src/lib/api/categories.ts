import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import sdk from '@/lib/sdk';

export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  parentId?: string | null;
  totalValue: number;
  createdAt: string;
  isActive?: boolean;
  requiresApproval?: boolean;
  code?: string;
  defaultBudget?: number;
  status?: 'active' | 'inactive';
  children?: Category[];
}


export interface GeneratedCategory {
  name: string;
  description: string;
  code: string;
  color: string;
  defaultBudget: number;
}

  const paths = {
    list: async (): Promise<any> =>
      sdk.catalog.getCategories(),
    create: async (data: Partial<Category>): Promise<any> =>
      sdk.catalog.createCategory(data),
    get: async (categoryId: string): Promise<any> =>
      sdk.catalog.getCategory(categoryId),
    update: async (
      categoryId: string,
      data: Partial<Category>
    ): Promise<any> =>
      sdk.catalog.updateCategory(categoryId, data),
    delete: async (categoryId: string): Promise<any> =>
      sdk.catalog.deleteCategory(categoryId),

    generateAICategories: async (aiDescription: string): Promise<any> =>
      sdk.client.post(
          `/catalog/categories/ai?type=product`,
          {
            prompt: aiDescription,
          },
          { timeout: 60000 }
        ),

    saveGeneratedCategories: async (
      generatedCategories: GeneratedCategory[]
    ): Promise<any> =>
      sdk.client.put(`/catalog/categories/ai?type=product`, {
          categories: generatedCategories
        }),
  };

// Categories
export const useListCategories = () => {
  const {data, isLoading, error, refetch} = useQuery({
    queryKey: ['categories'],
    queryFn: async () => await paths.list(),
  });
  return { data: data?.categories || [], isLoading, error, refetch };
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, Partial<Category>>({
    mutationFn: async data => await paths.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, Partial<Category>>({
    mutationFn: async data => await paths.update(data.id!, data),
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['category',data?.data?.id] });
      toast.success('Category updated successfully');
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, string>({
    mutationFn: async categoryId => await paths.delete(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

export const useGetCategory = (categoryId: string) => {
  return useQuery<any, Error>({
    queryKey: ['category',categoryId],
    queryFn: async () => await paths.get(categoryId),
    enabled: !!categoryId,
  });
};

export const useGenerateAICategories = () => {

  return useMutation({
    mutationFn: async (aiDescription: string) =>
      await paths.generateAICategories(aiDescription),
  });
};

// Hook for saving generated categories
export const useSaveGeneratedCategories = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, GeneratedCategory[]>({
    mutationFn: async (generatedCategories: GeneratedCategory[]) =>
      await paths.saveGeneratedCategories(generatedCategories),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};