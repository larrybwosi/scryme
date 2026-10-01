import { create } from "zustand";
import { getOrganizationSettings } from "../../app/actions/organization";
import { getCurrencySymbol } from "../utils";

interface OrganizationState {
  organization: any | null;
  currency: string;
  currencySymbol: string;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  fetchOrganization: () => Promise<void>;
  setOrganization: (org: any) => void;
}

export const useOrganizationStore = create<OrganizationState>((set, get) => ({
  organization: null,
  currency: "USD",
  currencySymbol: "$",
  isLoading: false,
  isInitialized: false,
  error: null,
  fetchOrganization: async () => {
    if (get().isLoading) return;
    set({ isLoading: true, error: null });
    try {
      const org = await getOrganizationSettings();
      if (org) {
        const currency = org.settings?.defaultCurrency || "USD";
        const currencySymbol = getCurrencySymbol(currency);
        set({
          organization: org,
          currency,
          currencySymbol,
          isInitialized: true,
          isLoading: false,
        });
      } else {
        set({ isInitialized: true, isLoading: false });
      }
    } catch (err: any) {
      set({
        error: err?.message || "Failed to load organization settings",
        isLoading: false,
        isInitialized: true,
      });
    }
  },
  setOrganization: (org: any) => {
    if (!org) return;
    const currency = org.settings?.defaultCurrency || "USD";
    const currencySymbol = getCurrencySymbol(currency);
    set({
      organization: org,
      currency,
      currencySymbol,
      isInitialized: true,
    });
  },
}));
