"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { isTauri, isOfflineMode } from "@/lib/sdk";
import sdk from "@/lib/sdk";
import { tauriInvoke } from "@/lib/tauri-bridge";

// Types (copied from main file for completeness)
type UnitType =
  | "MASS"
  | "VOLUME"
  | "LENGTH"
  | "AREA"
  | "COUNT"
  | "TIME"
  | "TEMPERATURE"
  | "ENERGY"
  | "CUSTOM";

type IndustryCategory =
  | "UNIVERSAL"
  | "FOOD_SERVICE"
  | "RETAIL"
  | "MANUFACTURING"
  | "HEALTHCARE"
  | "CONSTRUCTION"
  | "AGRICULTURE"
  | "HOSPITALITY"
  | "OTHER";

interface SystemUnit {
  id: string;
  name: string;
  symbol: string;
  abbreviation?: string | null;
  pluralName?: string | null;
  type: UnitType;
  category: IndustryCategory;
  isBaseUnit: boolean;
  isMetric: boolean;
  description?: string | null;
  isActive: boolean;
}

interface OrganizationUnit {
  id: string;
  organizationId: string;
  name: string;
  symbol: string;
  abbreviation?: string | null;
  pluralName?: string | null;
  type: UnitType;
  category: IndustryCategory;
  description?: string | null;
  isActive: boolean;
  baseSystemUnitId?: string | null;
  conversionFactor?: number | null;
  conversionOffset?: number | null;
}

// API functions
const fetchSystemUnits = async (): Promise<SystemUnit[]> => {
  if (isTauri() || isOfflineMode()) {
    return tauriInvoke<SystemUnit[]>("get_system_units");
  }
  return sdk.client.get("/units/system");
};

const fetchOrganizationUnits = async (): Promise<OrganizationUnit[]> => {
  if (isTauri() || isOfflineMode()) {
    return tauriInvoke<OrganizationUnit[]>("get_organization_units", {
      organizationId: "local-org",
    });
  }
  return sdk.client.get(`/units/organization`);
};

const createOrganizationUnit = async (
  data: Partial<OrganizationUnit>,
): Promise<OrganizationUnit> => {
  if (isTauri() || isOfflineMode()) {
    return tauriInvoke<OrganizationUnit>("create_organization_unit", {
      userId: "local-user",
      unit: { ...data, organizationId: "local-org", isActive: true },
    });
  }
  return sdk.client.post("/units/organization", data);
};

const updateOrganizationUnit = async (
  unitId: string,
  data: Partial<OrganizationUnit>,
): Promise<OrganizationUnit> => {
  if (isTauri() || isOfflineMode()) {
    await tauriInvoke("update_organization_unit", {
      userId: "local-user",
      unit: { id: unitId, ...data, organizationId: "local-org" },
    });
    return {
      id: unitId,
      ...data,
      organizationId: "local-org",
    } as OrganizationUnit;
  }
  return sdk.client.patch(`/units/organization/${unitId}`, data);
};

const deleteOrganizationUnit = async (unitId: string): Promise<void> => {
  if (isTauri() || isOfflineMode()) {
    await tauriInvoke("delete_organization_unit", {
      userId: "local-user",
      id: unitId,
    });
    return;
  }
  return sdk.client.delete(`/units/organization/${unitId}`);
};

// Main hook
export function useUnits() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"all" | "system" | "custom">(
    "all",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<UnitType | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<
    IndustryCategory | "all"
  >("all");

  // Queries
  const {
    data: systemUnits = [],
    isLoading: systemLoading,
    error: systemError,
  } = useQuery({
    queryKey: ["systemUnits"],
    queryFn: fetchSystemUnits,
  });

  const {
    data: orgUnits = [],
    isLoading: orgLoading,
    error: orgError,
  } = useQuery({
    queryKey: ["organizationUnits"],
    queryFn: () => fetchOrganizationUnits(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createOrganizationUnit,
    onSuccess: (newUnit) => {
      queryClient.setQueryData(
        ["organizationUnits"],
        (old: OrganizationUnit[] = []) => [...old, newUnit],
      );
      toast.success("Unit created successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to create unit");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      unitId,
      data,
    }: {
      unitId: string;
      data: Partial<OrganizationUnit>;
    }) => updateOrganizationUnit(unitId, data),
    onSuccess: (updatedUnit) => {
      queryClient.setQueryData(
        ["organizationUnits"],
        (old: OrganizationUnit[] = []) =>
          old.map((unit) => (unit.id === updatedUnit.id ? updatedUnit : unit)),
      );
      toast.success("Unit updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to update unit");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOrganizationUnit,
    onSuccess: (_, unitId) => {
      queryClient.setQueryData(
        ["organizationUnits"],
        (old: OrganizationUnit[] = []) =>
          old.filter((unit) => unit.id !== unitId),
      );
      toast.success("Unit deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to delete unit");
    },
  });

  // Filtered units
  const filteredUnits = useMemo(() => {
    let units: (SystemUnit | OrganizationUnit)[];

    if (activeTab === "all") {
      units = [...systemUnits, ...orgUnits];
    } else if (activeTab === "system") {
      units = systemUnits;
    } else {
      units = orgUnits;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      units = units.filter(
        (u) =>
          u.name.toLowerCase().includes(query) ||
          u.symbol.toLowerCase().includes(query) ||
          u.abbreviation?.toLowerCase().includes(query),
      );
    }

    // Type filter
    if (typeFilter !== "all") {
      units = units.filter((u) => u.type === typeFilter);
    }

    // Category filter
    if (categoryFilter !== "all") {
      units = units.filter((u) => u.category === categoryFilter);
    }

    return units;
  }, [
    systemUnits,
    orgUnits,
    activeTab,
    searchQuery,
    typeFilter,
    categoryFilter,
  ]);

  // Group by type for list display
  const groupedUnits = useMemo(() => {
    const groups: Record<string, (SystemUnit | OrganizationUnit)[]> = {};

    filteredUnits.forEach((unit) => {
      if (!groups[unit.type]) {
        groups[unit.type] = [];
      }
      groups[unit.type].push(unit);
    });

    return groups;
  }, [filteredUnits]);

  const loading = systemLoading || orgLoading;

  return {
    // State
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    categoryFilter,
    setCategoryFilter,

    // Data
    systemUnits,
    orgUnits,
    filteredUnits,
    groupedUnits,
    loading,

    // Mutations
    createMutation: createMutation.mutateAsync,
    updateMutation: updateMutation.mutateAsync,
    deleteMutation: deleteMutation.mutateAsync,

    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

    // Helpers
    isSystemUnit: (unit: SystemUnit | OrganizationUnit): unit is SystemUnit => {
      return "isBaseUnit" in unit;
    },
  };
}
