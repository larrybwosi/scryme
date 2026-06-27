import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  SupplierUI as Supplier,
  ProductSupplier,
  Delivery,
  SupplierAnalytics,
  PriceHistoryEntry,
} from "../../types/index";
import axios from "axios";

const suppliers = {
  list: async (): Promise<any> =>
    axios.get(`/api/suppliers`).then((res) => res.data),
  create: async (data: any): Promise<any> =>
    axios.post(`/api/suppliers`, data).then((res) => res.data),
  get: async (supplierId: string): Promise<any> =>
    axios.get(`/api/suppliers/${supplierId}`).then((res) => res.data),
  update: async (supplierId: string, data: any): Promise<any> =>
    axios.patch(`/api/suppliers/${supplierId}`, data).then((res) => res.data),
  delete: async (supplierId: string): Promise<any> =>
    axios.delete(`/api/suppliers/${supplierId}`).then((res) => res.data),
  products: {
    list: async (supplierId: string): Promise<any> =>
      axios
        .get(`/api/suppliers/${supplierId}/products`)
        .then((res) => res.data),
    create: async (supplierId: string, data: any): Promise<any> =>
      axios
        .post(`/api/suppliers/${supplierId}/products`, data)
        .then((res) => res.data),
    delete: async (supplierId: string, productId: string): Promise<any> =>
      axios
        .delete(`/api/suppliers/${supplierId}/products`, {
          data: { productId },
        })
        .then((res) => res.data),
    updatePrice: async (
      supplierId: string,
      productId: string,
      data: { costPrice: number },
    ): Promise<any> =>
      axios
        .patch(`/api/suppliers/${supplierId}/products/${productId}/price`, data)
        .then((res) => res.data),
    bulkUpdate: async (supplierId: string, data: any): Promise<any> =>
      axios
        .post(`/api/suppliers/${supplierId}/products/bulk`, data)
        .then((res) => res.data),
  },
  analytics: async (supplierId: string): Promise<SupplierAnalytics> =>
    axios.get(`/api/suppliers/${supplierId}/analytics`).then((res) => res.data),
  priceHistory: async (
    supplierId: string,
    variantId?: string,
  ): Promise<PriceHistoryEntry[]> =>
    axios
      .get(`/api/suppliers/${supplierId}/price-history`, {
        params: { variantId },
      })
      .then((res) => res.data),
};

export const useListSuppliers = () => {
  return useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => await suppliers.list(),
  });
};

export const useCreateSupplier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => await suppliers.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
};

export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      supplierId,
      data,
    }: {
      supplierId: string;
      data: any;
    }) => await suppliers.update(supplierId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
};

export const useGetSupplier = (supplierId: string) => {
  return useQuery({
    queryKey: ["supplier", supplierId],
    queryFn: async () => await suppliers.get(supplierId),
    enabled: !!supplierId,
  });
};

export const useListSupplierProducts = (supplierId: string) => {
  return useQuery({
    queryKey: ["supplier-products", supplierId],
    queryFn: async () => {
      const response = await suppliers.products.list(supplierId);
      return response.data || [];
    },
    enabled: !!supplierId,
  });
};

export const useDeleteSupplierProduct = (supplierId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) =>
      await suppliers.products.delete(supplierId, productId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["supplier-products", supplierId],
      });
    },
  });
};

export const useAddProductSupplier = (supplierId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) =>
      await suppliers.products.create(supplierId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["supplier-products", supplierId],
      });
    },
  });
};

export const useUpdateProductPrice = (supplierId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      productId,
      costPrice,
    }: {
      productId: string;
      costPrice: number;
    }) =>
      await suppliers.products.updatePrice(supplierId, productId, {
        costPrice,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["supplier-products", supplierId],
      });
      queryClient.invalidateQueries({
        queryKey: ["supplier-price-history", supplierId],
      });
    },
  });
};

export const useBulkUpdateSupplierProducts = (supplierId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) =>
      await suppliers.products.bulkUpdate(supplierId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["supplier-products", supplierId],
      });
    },
  });
};

export const useGetSupplierDeliveries = (supplierId: string) => {
  return useQuery({
    queryKey: ["supplier-deliveries", supplierId],
    queryFn: async () => {
      const response = await axios.get(
        `/api/suppliers/${supplierId}/deliveries`,
      );
      return (response.data.data || []) as Delivery[];
    },
    enabled: !!supplierId,
  });
};

export const useGetSupplierAnalytics = (supplierId: string) => {
  return useQuery({
    queryKey: ["supplier-analytics", supplierId],
    queryFn: async () => await suppliers.analytics(supplierId),
    enabled: !!supplierId,
  });
};

export const useGetSupplierPriceHistory = (
  supplierId: string,
  variantId?: string,
) => {
  return useQuery({
    queryKey: ["supplier-price-history", supplierId, variantId],
    queryFn: async () => await suppliers.priceHistory(supplierId, variantId),
    enabled: !!supplierId,
  });
};
