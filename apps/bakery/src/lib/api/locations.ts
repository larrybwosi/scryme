import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import sdk, { isTauri, isOfflineMode } from "@/lib/sdk";

export const useListLocations = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      if (isTauri() || isOfflineMode()) {
        return { locations: [] };
      }
      return sdk.pos.listLocations();
    },
  });

  return { data, isLoading, error };
};

export const useCreateLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => sdk.client.post("/inventory/locations", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });
};

export const useUpdateLocation = (locationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) =>
      sdk.client.patch(`/inventory/locations/${locationId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      queryClient.invalidateQueries({ queryKey: ["location", locationId] });
    },
  });
};

export const useDeleteLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (locationId: string) =>
      sdk.client.delete(`/inventory/locations/${locationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });
};

export const useGetLocation = (
  locationId: string,
  options: { enabled?: boolean } = {},
) => {
  const { enabled = true } = options;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["location", locationId],
    queryFn: () => sdk.client.get(`/inventory/locations/${locationId}`),
    enabled: enabled && !!locationId,
  });

  return { data: (data as any)?.data || [], isLoading, refetch, error };
};
