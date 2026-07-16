"use client";

import * as React from "react";
import { TooltipProvider } from "@repo/ui/components/ui/tooltip";
import { RealtimeProvider } from "@repo/shared/realtime/client";
// import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "@repo/ui/components/ui/sonner";
import { TopLoader } from "../components/top-loader";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    // <NuqsAdapter>
    <TooltipProvider>
      <RealtimeProvider>
        <TopLoader />
        {children}
        <Toaster />
      </RealtimeProvider>
    </TooltipProvider>
    // </NuqsAdapter>
  );
}
