"use client";

import React, { createContext, useContext, ReactNode } from "react";

interface OrgContextType {
  organizationId: string;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

export function OrgProvider({
  children,
  organizationId,
}: {
  children: ReactNode;
  organizationId: string;
}) {
  return (
    <OrgContext.Provider value={{ organizationId }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const context = useContext(OrgContext);
  if (context === undefined) {
    throw new Error("useOrg must be used within an OrgProvider");
  }
  return context;
}
