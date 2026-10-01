"use client";

import { useEffect } from "react";
import { useOrganizationStore } from "../lib/stores/organization-store";

export function OrganizationInitializer({ initialOrganization }: { initialOrganization?: any }) {
  const fetchOrganization = useOrganizationStore(state => state.fetchOrganization);
  const setOrganization = useOrganizationStore(state => state.setOrganization);
  const isInitialized = useOrganizationStore(state => state.isInitialized);

  useEffect(() => {
    if (initialOrganization) {
      setOrganization(initialOrganization);
    } else if (!isInitialized) {
      fetchOrganization();
    }
  }, [initialOrganization, isInitialized, fetchOrganization, setOrganization]);

  return null;
}
