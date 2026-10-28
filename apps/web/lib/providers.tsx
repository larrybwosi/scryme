"use client";

import * as React from "react";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@repo/ui/components/ui/tooltip";
import { RealtimeProvider } from "@repo/shared/realtime/client";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "@repo/ui/components/ui/sonner";
import { TopLoader } from "../components/top-loader";
import { OrganizationInitializer } from "../components/organization-initializer";
import { OrgPresenceTracker } from "../components/org-presence-tracker";
import { ModuleProvider } from "@/providers/module-provider";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <NuqsAdapter>
        <TooltipProvider>
          <RealtimeProvider>
            <ModuleProvider>
              <OrganizationInitializer />
              <OrgPresenceTracker />
              <TopLoader />
              {children}
              <Toaster />
            </ModuleProvider>
          </RealtimeProvider>
        </TooltipProvider>
      </NuqsAdapter>
    </ThemeProvider>
  );
}
