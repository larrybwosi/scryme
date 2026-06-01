import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Product, ProductType, ProductVariant } from '@repo/sdk/src/index';
import sdk from '@/lib/sdk';

// Define the shape of your paginated response if needed for variants
interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  limit: number;
}

interface ExtendedProduct extends Product {
  category: {
    id: string;
    name: string;
  };
  stockLevel: number;
  lowStockThreshold: number;
  variants: ProductVariant[];
}

const products = {
  list: async (locationId?: string): Promise<ExtendedProduct[]> => {
    const res = await sdk.catalog.getProducts({ locationId });
    return res.data;
  },
  create: (data: Partial<Product>): Promise<Product> =>
    sdk.catalog.createProduct(data),
  get: (productId: string): Promise<Product> =>
    sdk.catalog.getProduct(productId),
  update: (productId: string, data: Partial<Product>): Promise<Product> =>
    sdk.catalog.updateProduct(productId, data),
  delete: (productId: string): Promise<void> =>
    sdk.catalog.deleteProduct(productId),

  variants: {
    // Search method for the complex hook
    search: (params: URLSearchParams): Promise<PaginatedResponse<ProductVariant>> =>
      sdk.catalog.getVariants(Object.fromEntries(params.entries())),

    list: (productId: string): Promise<ProductVariant[]> =>
      sdk.client.get(`/catalog/products/${productId}/variants`),
    create: (
      productId: string,
      data: Partial<ProductVariant>
    ): Promise<ProductVariant> =>
      sdk.client.post(`/catalog/products/${productId}/variants`, data),
    get: (productId: string, variantId: string): Promise<ProductVariant> =>
      sdk.client.get(`/catalog/products/${productId}/variants/${variantId}`),
    restock: (
      productId: string,
      variantId: string,
      data: unknown
    ): Promise<ProductVariant> =>
      sdk.client.post(`/catalog/products/${productId}/variants/${variantId}/restock`, data),
    update: (
      productId: string,
      variantId: string,
      data: Partial<ProductVariant>
    ): Promise<ProductVariant> =>
      sdk.client.patch(`/catalog/products/${productId}/variants/${variantId}`, data),
    delete: (productId: string, variantId: string): Promise<void> =>
      sdk.client.delete(`/catalog/products/${productId}/variants/${variantId}`),
  },
};

// --- Hooks ---

export const useListProducts = (inLocation: boolean = false) => {
  const { data, refetch, error, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => await products.list(),
  });

  return {
    data: data || [],
    isLoading,
    isError: !!error,
    error,
    refetch,
  };
};

interface UseProductVariantsOptions {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  locationId?: string;
  productType?: ProductType;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  includeLocation?: boolean;
}

export const useProductVariants = (options: UseProductVariantsOptions = {}) => {

  const {
    page = 1,
    limit = 20,
    search,
    categoryId,
    productType,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    isActive,
    includeLocation = false,
  } = options;


  const queryKey = [
    'product-variants-search',
    {
      page,
      limit,
      search,
      categoryId,
      productType,
      sortBy,
      sortOrder,
      isActive,
      includeLocation,
    },
  ];

  const { data, refetch, error, isLoading, isFetching } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
        includeLocation: includeLocation.toString(),
        ...(search && { search }),
        ...(categoryId && { categoryId }),
        ...(productType && { productType }),
        ...(isActive !== undefined && { isActive: isActive.toString() }),
      });

      return await products.variants.search(params);
    },
    staleTime: 1000 * 60 * 5,
  });

  return {
    data: data?.data || [],
    totalCount: data?.totalCount || 0,
    currentPage: data?.currentPage || page,
    totalPages: data?.totalPages || 0,
    limit: data?.limit || limit,
    isLoading,
    isFetching,
    isError: !!error,
    error,
    refetch,
  };
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation<Product, Error, Partial<Product>>({
    mutationFn: async data => await products.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useUpdateProduct = (productId: string) => {
  const queryClient = useQueryClient();

  return useMutation<Product, Error, Partial<Product>>({
    mutationFn: async data => await products.update(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async productId => await products.delete(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useGetProduct = (productId?: string) => {
  const { data, refetch, error, isLoading } = useQuery<Product & { locations?: any[] }, Error>({
    queryKey: ['product', productId],
    queryFn: async () => await products.get(productId!),
    enabled: !!productId,
  });

  return {
    data: data || null,
    locations: (data as any)?.locations || [],
    isLoading,
    isError: !!error,
    error,
    refetch
  };
};

// --- Product Variants Hooks ---

export const useListProductVariants = (productId: string) => {
  const { data, refetch, error, isLoading } = useQuery<ProductVariant[], Error>({
    queryKey: ['product-variants', productId],
    queryFn: async () => await products.variants.list(productId),
    enabled: !!productId,
  });

  return {
    data: data || [],
    isLoading,
    isError: !!error,
    error,
    refetch
  };
};

export const useCreateProductVariant = (productId: string) => {
  const queryClient = useQueryClient();

  return useMutation<ProductVariant, Error, Partial<ProductVariant>>({
    mutationFn: async data => await products.variants.create(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
    },
  });
};

export const useUpdateProductVariant = (productId: string, variantId: string) => {
  const queryClient = useQueryClient();

  return useMutation<ProductVariant, Error, Partial<ProductVariant>>({
    mutationFn: async data => await products.variants.update(productId, variantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
      queryClient.invalidateQueries({ queryKey: ['product-variant', productId, variantId] });
    },
  });
};

export const useDeleteProductVariant = (productId: string) => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async variantId => await products.variants.delete(productId, variantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
    },
  });
};

export const useGetProductVariant = (productId: string, variantId: string) => {
  return useQuery<ProductVariant, Error>({
    queryKey: ['product-variant', productId, variantId],
    queryFn: async () => await products.variants.get(productId, variantId),
    enabled: !!productId && !!variantId,
  });
};
