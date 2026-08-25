"use client"

import type { ReactNode } from "react"
import { TooltipProvider } from "@repo/ui/components/ui/tooltip"
import { Toaster } from "@repo/ui/components/ui/sonner"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider delayDuration={200}>
      {children}
      <Toaster position="top-right" richColors />
    </TooltipProvider>
  )
}
