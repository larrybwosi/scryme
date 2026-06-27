import { useMemo, useCallback, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  UnitConverter,
  ProductVariantUnitHelper,
  SellingUnitHelper,
  PriceCalculator,
  InventoryCalculator,
  UnitValidator,
  UnitFormatter,
  type ConversionResult,
  type ConversionError,
  type VariantSellingUnit,
  type ProductVariantUnit,
  type UnitConversion,
  type ProductUnitConversion,
  type BaseUnit,
  type UnitType,
  type SystemUnit,
  type OrganizationUnit,
  type AnyUnit,
} from "./utilities";
import axios from "axios";

// ============================================================================
// QUERY KEYS
// ============================================================================

const queryKeys = {
  systemConversions: () => ["system-conversions"],
  orgConversions: (orgId: string) => ["org-conversions", orgId],
  productConversions: (orgId: string) => ["product-conversions", orgId],
  unitConverter: (orgId: string) => ["unit-converter", orgId],
  variantUnits: (variantId: string) => ["variant-units", variantId],
  variantSellingUnits: (variantId: string) => [
    "variant-selling-units",
    variantId,
  ],
  systemUnits: (filters?: { type?: UnitType; category?: string }) =>
    ["systemUnits", filters] as const,
  organizationUnits: (organizationId: string, filters?: { type?: UnitType }) =>
    ["organizationUnits", organizationId, filters] as const,
  sellingUnits: (variantId: string) => ["sellingUnits", variantId] as const,
} as const;

// ============================================================================
// API FUNCTIONS
// ============================================================================

const api = {
  fetchSystemConversions: async () => {
    const response = await fetch("/api/units/system-conversions");
    if (!response.ok) throw new Error("Failed to fetch system conversions");
    return response.json();
  },

  fetchOrgConversions: async (orgId: string) => {
    const response = await fetch(`/api/units/org-conversions?orgId=${orgId}`);
    if (!response.ok)
      throw new Error("Failed to fetch organization conversions");
    return response.json();
  },

  fetchProductConversions: async (orgId: string) => {
    const response = await fetch(
      `/api/units/product-conversions?orgId=${orgId}`,
    );
    if (!response.ok) throw new Error("Failed to fetch product conversions");
    return response.json();
  },

  fetchVariantUnits: async (variantId: string) => {
    const response = await fetch(`/api/variants/${variantId}/units`);
    if (!response.ok) throw new Error("Failed to fetch variant units");
    return response.json();
  },
} as const;

// ============================================================================
// REACT HOOKS
// ============================================================================

/**
 * Hook to initialize and use unit converter with TanStack Query
 */
export function useUnitConverter(organizationId?: string | null) {
  const {
    data: systemConv,
    isLoading: systemLoading,
    error: systemError,
  } = useQuery({
    queryKey: queryKeys.systemConversions(),
    queryFn: api.fetchSystemConversions,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const {
    data: orgConv,
    isLoading: orgLoading,
    error: orgError,
  } = useQuery({
    queryKey: queryKeys.orgConversions(organizationId!),
    queryFn: () => api.fetchOrgConversions(organizationId!),
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  const {
    data: productConv,
    isLoading: productLoading,
    error: productError,
  } = useQuery({
    queryKey: queryKeys.productConversions(organizationId!),
    queryFn: () => api.fetchProductConversions(organizationId!),
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  const converter = useMemo(() => {
    if (!systemConv || !orgConv || !productConv) return null;

    return new UnitConverter(systemConv, orgConv, productConv);
  }, [systemConv, orgConv, productConv]);

  const loading = systemLoading || orgLoading || productLoading;
  const error = systemError || orgError || productError;

  return {
    converter,
    loading,
    error: error ? (error as Error).message : null,
  };
}

/**
 * Optimized hook for converting between units with caching
 */
export function useUnitConversion(
  fromUnitId: string,
  toUnitId: string,
  productId?: string,
  organizationId?: string | null,
) {
  const {
    converter,
    loading,
    error: loadError,
  } = useUnitConverter(organizationId);

  // Cache conversion results for better performance
  const convert = useCallback(
    (value: number): ConversionResult | ConversionError | null => {
      if (!converter) return null;
      return converter.convert(value, fromUnitId, toUnitId, productId);
    },
    [converter, fromUnitId, toUnitId, productId],
  );

  return {
    convert,
    loading,
    error: loadError,
  };
}

/**
 * Optimized hook for managing product variant units with TanStack Query
 */
export function useProductVariantUnits(variantId: string) {
  const {
    data,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: queryKeys.variantUnits(variantId),
    queryFn: () => api.fetchVariantUnits(variantId),
    enabled: !!variantId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    select: (data) => ({
      variant: data.variant as ProductVariantUnit,
      sellingUnits: (data.sellingUnits || []) as VariantSellingUnit[],
    }),
  });

  const baseUnit = useMemo(
    () =>
      data?.variant ? ProductVariantUnitHelper.getBaseUnit(data.variant) : null,
    [data?.variant],
  );

  const stockingUnit = useMemo(
    () =>
      data?.variant
        ? ProductVariantUnitHelper.getStockingUnit(data.variant)
        : null,
    [data?.variant],
  );

  return {
    variant: data?.variant || null,
    sellingUnits: data?.sellingUnits || [],
    baseUnit,
    stockingUnit,
    loading,
    error: error ? (error as Error).message : null,
  };
}

/**
 * Optimized hook for calculating prices with memoization
 */
export function usePriceCalculation(
  variantId?: string,
  organizationId?: string | null,
) {
  const {
    variant,
    sellingUnits,
    baseUnit,
    loading: unitsLoading,
  } = useProductVariantUnits(variantId || "");
  const { converter, loading: converterLoading } =
    useUnitConverter(organizationId);

  const calculatePrice = useCallback(
    (
      quantity: number,
      sellingUnitId: string,
      priceType: "retail" | "wholesale" = "retail",
    ): number | null => {
      const sellingUnit = sellingUnits.find((u) => u.id === sellingUnitId);
      if (!sellingUnit) return null;

      return PriceCalculator.calculatePrice(quantity, sellingUnit, priceType);
    },
    [sellingUnits],
  );

  const calculatePriceFromBase = useCallback(
    (
      baseQuantity: number,
      sellingUnitId: string,
      priceType: "retail" | "wholesale" = "retail",
    ): number | null => {
      if (!converter || !baseUnit) return null;

      const sellingUnit = sellingUnits.find((u) => u.id === sellingUnitId);
      if (!sellingUnit) return null;

      return PriceCalculator.calculatePriceFromBase(
        baseQuantity,
        baseUnit.id,
        sellingUnit,
        converter,
        variantId,
        priceType,
      );
    },
    [converter, baseUnit, sellingUnits, variantId],
  );

  const getBestPrice = useCallback(
    (baseQuantity: number, priceType: "retail" | "wholesale" = "retail") => {
      if (!converter || !baseUnit) return null;

      return PriceCalculator.getBestPrice(
        baseQuantity,
        baseUnit.id,
        sellingUnits,
        converter,
        variantId,
        priceType,
      );
    },
    [converter, baseUnit, sellingUnits, variantId],
  );

  // New function specifically for recipe ingredient cost calculation
  const calculateIngredientCost = useCallback(
    (
      ingredientVariantId: string,
      quantity: number,
      unitId: string,
      priceType: "retail" | "wholesale" = "retail",
    ): number | null => {
      if (!ingredientVariantId || !quantity || !unitId) return null;

      // For recipe ingredients, we typically want wholesale prices
      return calculatePrice(quantity, unitId, priceType);
    },
    [calculatePrice],
  );

  return {
    calculatePrice,
    calculatePriceFromBase,
    getBestPrice,
    calculateIngredientCost, // Add the new function
    loading: unitsLoading || converterLoading,
    sellingUnits,
    baseUnit,
  };
}
/**
 * Optimized hook for inventory calculations
 */
export function useInventoryCalculations(
  variantId: string,
  organizationId?: string | null,
) {
  const {
    variant,
    sellingUnits,
    baseUnit,
    loading: unitsLoading,
  } = useProductVariantUnits(variantId);
  const { converter, loading: converterLoading } =
    useUnitConverter(organizationId);

  const calculateInventoryValue = useCallback(
    (
      stockLevel: number,
      priceType: "retail" | "wholesale" = "wholesale",
    ): number | null => {
      if (!converter || !baseUnit) return null;

      return InventoryCalculator.calculateInventoryValue(
        stockLevel,
        baseUnit.id,
        sellingUnits,
        converter,
        variantId,
        priceType,
      );
    },
    [converter, baseUnit, sellingUnits, variantId],
  );

  const needsReorder = useCallback(
    (currentStock: number, reorderPoint: number): boolean => {
      return InventoryCalculator.needsReorder(currentStock, reorderPoint);
    },
    [],
  );

  const calculateStockCoverage = useCallback(
    (currentStock: number, averageDailyUsage: number): number => {
      return InventoryCalculator.calculateStockCoverage(
        currentStock,
        averageDailyUsage,
      );
    },
    [],
  );

  return {
    calculateInventoryValue,
    needsReorder,
    calculateStockCoverage,
    loading: unitsLoading || converterLoading,
  };
}

/**
 * Mutation hook for updating variant units
 */
export function useUpdateVariantUnits(variantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updatedData: Partial<ProductVariantUnit>) => {
      const response = await fetch(`/api/variants/${variantId}/units`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      if (!response.ok) throw new Error("Failed to update variant units");
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.variantUnits(variantId),
      });
    },
  });
}

/**
 * Prefetch hook for unit conversions
 */
export function usePrefetchUnitConversions(organizationId?: string | null) {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.systemConversions(),
      queryFn: api.fetchSystemConversions,
    });

    if (organizationId) {
      queryClient.prefetchQuery({
        queryKey: queryKeys.orgConversions(organizationId),
        queryFn: () => api.fetchOrgConversions(organizationId),
      });

      queryClient.prefetchQuery({
        queryKey: queryKeys.productConversions(organizationId),
        queryFn: () => api.fetchProductConversions(organizationId),
      });
    }
  }, [queryClient, organizationId]);
}

// ============================================================================
// API CLIENT
// ============================================================================

const apiClient = axios.create({
  baseURL: "/api",
});

// ============================================================================
// QUERY KEYS
// ============================================================================

// ============================================================================
// FETCH HOOKS
// ============================================================================

/**
 * Hook to fetch system units
 */
export function useSystemUnits(options?: {
  type?: UnitType;
  category?: string;
  enabled?: boolean;
}) {
  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: queryKeys.systemUnits({
      type: options?.type,
      category: options?.category,
    }),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.type) params.set("type", options.type);
      if (options?.category) params.set("category", options.category);

      const response = await apiClient.get<SystemUnit[]>(
        `/units/system?${params.toString()}`,
      );
      return response.data;
    },
    enabled: options?.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    units: data || [],
    loading: isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : "Unknown error"
      : null,
    isFetching,
  };
}

/**
 * Hook to fetch organization units
 */
export function useOrganizationUnits(
  organizationId: string,
  options?: {
    type?: UnitType;
    enabled?: boolean;
  },
) {
  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: queryKeys.organizationUnits(organizationId, {
      type: options?.type,
    }),
    queryFn: async () => {
      const response = await apiClient.get<OrganizationUnit[]>(
        `/units/organization?orgId=${organizationId}`,
      );

      let filtered = response.data;
      if (options?.type) {
        filtered = filtered.filter(
          (u: OrganizationUnit) => u.type === options.type,
        );
      }

      return filtered;
    },
    enabled: options?.enabled !== false && !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    units: data || [],
    loading: isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : "Unknown error"
      : null,
    isFetching,
  };
}

/**
 * Hook to fetch all units (system + organization)
 */
export function useAllUnits(
  organizationId: string,
  options?: {
    type?: UnitType;
    enabled?: boolean;
  },
) {
  const {
    units: systemUnits,
    loading: systemLoading,
    error: systemError,
  } = useSystemUnits({ type: options?.type, enabled: options?.enabled });

  const {
    units: orgUnits,
    loading: orgLoading,
    error: orgError,
  } = useOrganizationUnits(organizationId, {
    type: options?.type,
    enabled: options?.enabled,
  });

  const allUnits = useMemo<AnyUnit[]>(
    () => [...systemUnits, ...orgUnits],
    [systemUnits, orgUnits],
  );

  const loading = systemLoading || orgLoading;
  const error = systemError || orgError;

  return { units: allUnits, systemUnits, orgUnits, loading, error };
}

// ============================================================================
// SELECTION HOOKS
// ============================================================================

/**
 * Hook to manage unit selection with validation
 */
export function useUnitSelection(options?: {
  initialValue?: string | null;
  allowedTypes?: UnitType[];
  required?: boolean;
  onChange?: (unitId: string | null) => void;
}) {
  const [value, setValue] = useState<string | null>(
    options?.initialValue || null,
  );
  const [touched, setTouched] = useState(false);

  const error = useMemo(() => {
    if (!touched) return null;
    if (options?.required && !value) {
      return "Unit is required";
    }
    return null;
  }, [value, touched, options?.required]);

  const handleChange = useCallback(
    (newValue: string | null) => {
      setValue(newValue);
      setTouched(true);
      options?.onChange?.(newValue);
    },
    [options],
  );

  const reset = useCallback(() => {
    setValue(options?.initialValue || null);
    setTouched(false);
  }, [options?.initialValue]);

  return {
    value,
    setValue: handleChange,
    error,
    touched,
    setTouched,
    reset,
  };
}

/**
 * Hook to manage multiple unit selection
 */
export function useMultiUnitSelection(options?: {
  initialValues?: string[];
  maxSelections?: number;
  minSelections?: number;
  onChange?: (unitIds: string[]) => void;
}) {
  const [values, setValues] = useState<string[]>(options?.initialValues || []);
  const [touched, setTouched] = useState(false);

  const error = useMemo(() => {
    if (!touched) return null;

    if (options?.minSelections && values.length < options.minSelections) {
      return `Select at least ${options.minSelections} unit${options.minSelections > 1 ? "s" : ""}`;
    }

    if (options?.maxSelections && values.length > options.maxSelections) {
      return `Maximum ${options.maxSelections} units allowed`;
    }

    return null;
  }, [values, touched, options]);

  const handleChange = useCallback(
    (newValues: string[]) => {
      setValues(newValues);
      setTouched(true);
      options?.onChange?.(newValues);
    },
    [options],
  );

  const addUnit = useCallback(
    (unitId: string) => {
      if (!values.includes(unitId)) {
        const newValues = [...values, unitId];
        handleChange(newValues);
      }
    },
    [values, handleChange],
  );

  const removeUnit = useCallback(
    (unitId: string) => {
      const newValues = values.filter((id) => id !== unitId);
      handleChange(newValues);
    },
    [values, handleChange],
  );

  const toggleUnit = useCallback(
    (unitId: string) => {
      if (values.includes(unitId)) {
        removeUnit(unitId);
      } else {
        addUnit(unitId);
      }
    },
    [values, addUnit, removeUnit],
  );

  const reset = useCallback(() => {
    setValues(options?.initialValues || []);
    setTouched(false);
  }, [options?.initialValues]);

  return {
    values,
    setValues: handleChange,
    addUnit,
    removeUnit,
    toggleUnit,
    error,
    touched,
    setTouched,
    reset,
  };
}

// ============================================================================
// VARIANT UNITS HOOKS
// ============================================================================

interface VariantUnitsData {
  variant: {
    baseUnitId: string | null;
    baseOrgUnitId: string | null;
    stockingUnitId: string | null;
    stockingOrgUnitId: string | null;
  };
}

/**
 * Hook to fetch and manage variant units
 */
export function useVariantUnits(variantId: string) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.variantUnits(variantId),
    queryFn: async (): Promise<VariantUnitsData> => {
      const response = await apiClient.get(`/variants/${variantId}/units`);
      return response.data;
    },
    enabled: !!variantId,
  });

  const updateUnitsMutation = useMutation({
    mutationFn: async (updates: {
      baseUnitId?: string | null;
      baseOrgUnitId?: string | null;
      stockingUnitId?: string | null;
      stockingOrgUnitId?: string | null;
    }) => {
      const response = await apiClient.post(
        `/variants/${variantId}/update-units`,
        updates,
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Update the cache with the new data
      queryClient.setQueryData(
        queryKeys.variantUnits(variantId),
        (old: VariantUnitsData) => ({
          ...old,
          variant: { ...old.variant, ...data },
        }),
      );
    },
  });

  const baseUnit = useMemo(() => {
    const baseUnitId = data?.variant.baseUnitId;
    const baseOrgUnitId = data?.variant.baseOrgUnitId;
    return {
      id: baseUnitId || baseOrgUnitId,
      type: baseUnitId ? ("system" as const) : ("org" as const),
    };
  }, [data?.variant.baseUnitId, data?.variant.baseOrgUnitId]);

  const stockingUnit = useMemo(() => {
    const stockingUnitId = data?.variant.stockingUnitId;
    const stockingOrgUnitId = data?.variant.stockingOrgUnitId;
    return {
      id: stockingUnitId || stockingOrgUnitId,
      type: stockingUnitId ? ("system" as const) : ("org" as const),
    };
  }, [data?.variant.stockingUnitId, data?.variant.stockingOrgUnitId]);

  const updateUnits = useCallback(
    async (updates: Parameters<typeof updateUnitsMutation.mutateAsync>[0]) => {
      try {
        const result = await updateUnitsMutation.mutateAsync(updates);
        return { success: true, data: result };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        };
      }
    },
    [updateUnitsMutation],
  );

  return {
    baseUnitId: data?.variant.baseUnitId || null,
    baseOrgUnitId: data?.variant.baseOrgUnitId || null,
    stockingUnitId: data?.variant.stockingUnitId || null,
    stockingOrgUnitId: data?.variant.stockingOrgUnitId || null,
    baseUnit,
    stockingUnit,
    loading: isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : "Unknown error"
      : null,
    updateUnits,
    isUpdating: updateUnitsMutation.isPending,
  };
}

/**
 * Hook to manage selling units for a variant
 */
export function useSellingUnits(variantId: string) {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.sellingUnits(variantId),
    queryFn: async () => {
      const response = await apiClient.get(`/variants/${variantId}/units`);
      return response.data.sellingUnits || [];
    },
    enabled: !!variantId,
  });

  const createMutation = useMutation({
    mutationFn: async (createData: {
      systemUnitId?: string | null;
      orgUnitId?: string | null;
      retailPrice?: number | null;
      wholesalePrice?: number | null;
      conversionMultiplier?: number | null;
    }) => {
      const response = await apiClient.post(
        `/variants/${variantId}/selling-units`,
        createData,
      );
      return response.data;
    },
    onSuccess: (newUnit) => {
      queryClient.setQueryData(
        queryKeys.sellingUnits(variantId),
        (old: any[] = []) => [...old, newUnit],
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      unitId,
      updates,
    }: {
      unitId: string;
      updates: any;
    }) => {
      const response = await apiClient.patch(
        `/variants/${variantId}/selling-units/${unitId}`,
        updates,
      );
      return response.data;
    },
    onSuccess: (updatedUnit) => {
      queryClient.setQueryData(
        queryKeys.sellingUnits(variantId),
        (old: any[] = []) =>
          old.map((unit) => (unit.id === updatedUnit.id ? updatedUnit : unit)),
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (unitId: string) => {
      await apiClient.delete(`/variants/${variantId}/selling-units/${unitId}`);
      return unitId;
    },
    onSuccess: (deletedUnitId) => {
      queryClient.setQueryData(
        queryKeys.sellingUnits(variantId),
        (old: any[] = []) => old.filter((unit) => unit.id !== deletedUnitId),
      );
    },
  });

  const createSellingUnit = useCallback(
    async (data: Parameters<typeof createMutation.mutateAsync>[0]) => {
      try {
        const result = await createMutation.mutateAsync(data);
        return { success: true, data: result };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        };
      }
    },
    [createMutation],
  );

  const updateSellingUnit = useCallback(
    async (unitId: string, updates: any) => {
      try {
        const result = await updateMutation.mutateAsync({ unitId, updates });
        return { success: true, data: result };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        };
      }
    },
    [updateMutation],
  );

  const deleteSellingUnit = useCallback(
    async (unitId: string) => {
      try {
        await deleteMutation.mutateAsync(unitId);
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        };
      }
    },
    [deleteMutation],
  );

  return {
    sellingUnits: data || [],
    loading: isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : "Unknown error"
      : null,
    refetch,
    createSellingUnit,
    updateSellingUnit,
    deleteSellingUnit,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// ============================================================================
// UNIT FILTERING HOOKS
// ============================================================================

/**
 * Hook to filter units by search query
 */
export function useUnitSearch(units: AnyUnit[], initialQuery = "") {
  const [query, setQuery] = useState(initialQuery);

  const filteredUnits = useMemo(() => {
    if (!query.trim()) return units;

    const searchLower = query.toLowerCase();
    return units.filter(
      (unit) =>
        unit.name.toLowerCase().includes(searchLower) ||
        unit.symbol.toLowerCase().includes(searchLower) ||
        unit.abbreviation?.toLowerCase().includes(searchLower) ||
        unit.description?.toLowerCase().includes(searchLower),
    );
  }, [units, query]);

  return {
    query,
    setQuery,
    filteredUnits,
    hasResults: filteredUnits.length > 0,
    resultCount: filteredUnits.length,
  };
}

/**
 * Hook to group units by type
 */
export function useGroupedUnits(units: AnyUnit[]) {
  const grouped = useMemo(() => {
    const groups: Record<string, AnyUnit[]> = {};

    units.forEach((unit) => {
      if (!groups[unit.type]) {
        groups[unit.type] = [];
      }
      groups[unit.type].push(unit);
    });

    // Sort units within each group by name
    Object.keys(groups).forEach((type) => {
      groups[type].sort((a, b) => a.name.localeCompare(b.name));
    });

    return groups;
  }, [units]);

  const types = useMemo(() => Object.keys(grouped).sort(), [grouped]);

  return { grouped, types };
}

/**
 * Hook to filter and paginate units
 */
export function usePaginatedUnits(
  units: AnyUnit[],
  options?: {
    pageSize?: number;
    initialPage?: number;
  },
) {
  const pageSize = options?.pageSize || 10;
  const [currentPage, setCurrentPage] = useState(options?.initialPage || 1);

  const totalPages = Math.ceil(units.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  const paginatedUnits = useMemo(
    () => units.slice(startIndex, endIndex),
    [units, startIndex, endIndex],
  );

  const goToPage = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
      }
    },
    [totalPages],
  );

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const previousPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  return {
    units: paginatedUnits,
    currentPage,
    totalPages,
    pageSize,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    goToPage,
    nextPage,
    previousPage,
    totalUnits: units.length,
  };
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook to get unit by ID
 */
export function useUnitById(unitId: string | null, units: AnyUnit[]) {
  return useMemo(
    () => units.find((u) => u.id === unitId) || null,
    [unitId, units],
  );
}

/**
 * Hook to validate unit compatibility
 */
export function useUnitCompatibility(
  unitId1: string | null,
  unitId2: string | null,
  units: AnyUnit[],
) {
  const unit1 = useUnitById(unitId1, units);
  const unit2 = useUnitById(unitId2, units);

  const isCompatible = useMemo(() => {
    if (!unit1 || !unit2) return false;
    return unit1.type === unit2.type;
  }, [unit1, unit2]);

  return {
    unit1,
    unit2,
    isCompatible,
    type: unit1?.type,
  };
}
