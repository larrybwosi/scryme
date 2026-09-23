import { useQuery } from "@tanstack/react-query";
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
  return {
    mutate: () => {
      console.warn("Location creation is not supported in Bakery client. Use Web App settings.");
    },
    mutateAsync: async () => {
      throw new Error("Location creation is not supported in Bakery client. Use Web App settings.");
    },
  };
};

export const useUpdateLocation = (_locationId: string) => {
  return {
    mutate: () => {
      console.warn("Location updates are not supported in Bakery client. Use Web App settings.");
    },
    mutateAsync: async () => {
      throw new Error("Location updates are not supported in Bakery client. Use Web App settings.");
    },
  };
};

export const useDeleteLocation = () => {
  return {
    mutate: () => {
      console.warn("Location deletion is not supported in Bakery client. Use Web App settings.");
    },
    mutateAsync: async () => {
      throw new Error("Location deletion is not supported in Bakery client. Use Web App settings.");
    },
  };
};

export const useGetLocation = (
  locationId: string,
  options: { enabled?: boolean } = {},
) => {
  const { enabled = true } = options;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["location", locationId],
    queryFn: async () => {
      const res = await sdk.pos.listLocations();
      const locations = res?.locations || res?.data || [];
      const match = locations.find((l: any) => l.id === locationId);
      return match || null;
    },
    enabled: enabled && !!locationId,
  });

  return { data: data || null, isLoading, refetch, error };
};
