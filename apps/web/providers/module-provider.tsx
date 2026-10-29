"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { EffectiveModuleResolution } from "@repo/shared/constants";
import { getEffectiveModulesServerAction } from "@/app/actions/organization";

interface ModuleContextType {
  modules: EffectiveModuleResolution[];
  isLoading: boolean;
  isModuleEnabled: (moduleKey: string) => boolean;
  refetchModules: () => Promise<void>;
}

const ModuleContext = createContext<ModuleContextType>({
  modules: [],
  isLoading: true,
  isModuleEnabled: () => true,
  refetchModules: async () => {},
});

export function ModuleProvider({ children }: { children: React.ReactNode }) {
  const [modules, setModules] = useState<EffectiveModuleResolution[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchModules = async () => {
    try {
      const res = await getEffectiveModulesServerAction();
      setModules(res);
    } catch (err) {
      console.error("Failed to fetch effective modules:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();

    // Periodic check every 10 minutes (600,000 ms)
    const interval = setInterval(() => {
      fetchModules();
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const isModuleEnabled = (moduleKey: string): boolean => {
    if (isLoading && modules.length === 0) return true; // Default to true while loading initial state
    const mod = modules.find((m) => m.moduleKey === moduleKey);
    return mod ? mod.isEnabled : true;
  };

  return (
    <ModuleContext.Provider
      value={{
        modules,
        isLoading,
        isModuleEnabled,
        refetchModules: fetchModules,
      }}
    >
      {children}
    </ModuleContext.Provider>
  );
}

export function useModules() {
  return useContext(ModuleContext);
}
