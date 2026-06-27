import { invoke } from "@tauri-apps/api/core";
import { isTauri } from "./sdk";

export const tauriInvoke = async <T>(
  command: string,
  args?: Record<string, any>,
): Promise<T> => {
  if (!isTauri()) {
    console.warn(
      `Tauri command [${command}] called outside of Tauri environment.`,
    );
    // Return safe defaults for common commands to prevent UI crashes in browser-based tests
    if (command === "get_settings") {
      return {
        organizationId: "local-org",
        authMode: "LOCAL",
        isEnabled: true,
      } as unknown as T;
    }
    if (command === "get_overview") {
      return {
        summary: {
          totalBatches: 0,
          activeBatches: 0,
          completedToday: 0,
          lowStockItems: 0,
        },
        recentBatches: [],
        lowStockIngredients: [],
        stockData: [],
        averageRecipeCost: 0,
        recipesByCategory: {},
        totalInventoryValue: 0,
      } as unknown as T;
    }
    if (command.startsWith("get_")) {
      return [] as unknown as T;
    }
    return null as unknown as T;
  }

  try {
    console.log(`Invoking Tauri command: ${command} with args:`, args);
    return await invoke<T>(command, args);
  } catch (error) {
    console.error(`Tauri invoke error [${command}]:`, error);
    throw error;
  }
};
