import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiResponse } from "../tanstack-axios";
import { toast } from "sonner";
import { Supplier } from "@/components/suppliers/types";
import axios from "axios";

  const suppliers = {
    list: async (): Promise<ApiResponse<Supplier[]>> =>
      axios.get(`/api/suppliers`).then(res => res.data),
    create: async ( data: any): Promise<ApiResponse<Supplier>> =>
      axios.post(`/api/suppliers`, data).then(res => res.data),
    get: async ( supplierId: string): Promise<ApiResponse<Supplier>> =>
      axios.get(`/api/suppliers/${supplierId}`).then(res => res),
    update: async (
      supplierId: string,
      data: Partial<Supplier>
    ): Promise<ApiResponse<Supplier>> =>
      axios.patch(`/api/suppliers/${supplierId}`, data).then(res => res.data),
    delete: async ( supplierId: string): Promise<ApiResponse<void>> =>
      axios.delete(`/api/suppliers/${supplierId}`).then(res => res.data),
    search: async (
      query: string,
      filters?: Record<string, any>
    ): Promise<ApiResponse<Supplier[]>> =>
      axios
        .get(`/api/suppliers/search`, {
          params: { q: query, ...filters },
        })
        .then(res => res.data),
    products: {
      list: async ( supplierId: string): Promise<ApiResponse<ProductSupplier[]>> =>
        axios.get(`/api/suppliers/${supplierId}/products`).then(res => res.data),
      create: async (
        supplierId: string,
        data: AddProductSupplierPayload
      ): Promise<ApiResponse<ProductSupplier>> =>
        axios.post(`/api/suppliers/${supplierId}/products`, data).then(res => res.data),
      delete: async ( supplierId: string, productId: string): Promise<ApiResponse<void>> =>
        axios
          .delete(`/api/suppliers/${supplierId}/products`, { data: { productId } })
          .then(res => res.data),
    },
  };
export const useListSuppliers = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => await suppliers.list(),
  });
  return { data: data?.data || [], isLoading, error, refetch };
};

export const useSuppliers = useListSuppliers;

export const useSearchSuppliers = () => {

  return useMutation<ApiResponse<Supplier[]>, Error, { query: string; filters?: Record<string, any> }>({
    mutationFn: async ({ query, filters }) => await suppliers.search( query, filters),
  });
};

export const useCreateSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<Supplier>, Error, any>({
    mutationFn: async data => await suppliers.create( data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
};

export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<Supplier>, Error, { supplierId: string; data: any }>({
    mutationFn: async ({ supplierId, data }) => await suppliers.update( supplierId, data),
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier', data?.data?.id] });
      toast.success('Supplier updated successfully');
    },
  });
};

export const useDeleteSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<void>, Error, string>({
    mutationFn: async supplierId => await suppliers.delete( supplierId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
};

export const useGetSupplier = (supplierId: string) => {
  return useQuery({
    queryKey: ['supplier', supplierId],
    queryFn: async () => (await suppliers.get( supplierId)).data,
    enabled: !!supplierId,
  });
};

export interface ProductSupplier {
  id: string;
  productId: string;
  supplierId: string;
  costPrice: number;
  supplierSku: string | null;
  minimumOrderQuantity: number | null;
  packagingUnit: string | null;
  isPreferred: boolean;
  product: {
    id: string;
    name: string;
    sku: string;
    category: {
      name: string;
      color: string;
    };
  };
}

// Supplier Page Hooks
export const useListSupplierProducts = (supplierId: string) => {
  return useQuery<ProductSupplier[], Error>({
    queryKey: ['supplier-products', supplierId],
    queryFn: async () => {
      const response = await axios.get(`/api/suppliers/${supplierId}/products`);
      return response.data.data || [];
    },
    enabled: !!supplierId,
  });
};

export const useDeleteSupplierProduct = (supplierId: string) => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<void>, Error, string>({
    mutationFn: async productId => await suppliers.products.delete( supplierId, productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-products', supplierId] });
      toast.success('Product removed from supplier');
    },
  });
};



export interface AddProductSupplierPayload {
  productId: string;
  costPrice: number;
  supplierSku?: string;
  minimumOrderQuantity?: number;
  packagingUnit?: string;
  isPreferred: boolean;
}


export const useAddProductSupplier = ( supplierId: string) => {
  const queryClient = useQueryClient();

  return useMutation<ProductSupplier, Error, AddProductSupplierPayload>({
    mutationFn: async data => await (await suppliers.products.create( supplierId, data)).data,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-products', supplierId] });
      toast.success('Product added to supplier');
    },
  });
};

export interface DeliveryItem {
  id: string;
  name: string;
  sku: string;
  quantityReceived: number;
  unit: string;
}

export interface Delivery {
  id: string;
  purchaseNumber: string;
  status: string;
  deliveryDate: string | null;
  expectedDate: string | null;
  supplierName: string;
  totalAmount: number;
  items: DeliveryItem[];
}

export const useGetSupplierDeliveries = (supplierId: string) => {
  return useQuery({
    queryKey: ['supplier-deliveries', supplierId],
    queryFn: async (): Promise<Delivery[]> => {
      const response = await fetch(`/api/suppliers/${supplierId}/deliveries`);
      const result = await response.json();
      return result.data || [];
    },
    enabled: !!supplierId,
  });
};
