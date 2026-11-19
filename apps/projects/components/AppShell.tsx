"use client";

import React, { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { CommandPalette } from "@/components/CommandPalette";
import { SIDEBAR_COLLAPSED_KEY } from "@/lib/navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true");
    } catch {
      // Storage can be unavailable in restricted contexts.
    }
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((previous) => {
      const next = !previous;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {
        // Storage can be unavailable in restricted contexts.
      }
      return next;
    });
  }, []);

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div
        className={`flex min-h-screen flex-col transition-[padding] duration-200 motion-reduce:transition-none ${
          collapsed ? "lg:pl-14" : "lg:pl-60"
        }`}
      >
        <Header collapsed={collapsed} onOpenMenu={() => setMobileOpen(true)} />
        <main className="relative min-h-screen w-full bg-surface px-4 pb-16 pt-16 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
      <CommandPalette />
      <Toaster
        theme="dark"
        position="top-right"
        visibleToasts={3}
        closeButton
        toastOptions={{
          duration: 4000,
          classNames: {
            toast:
              "border border-outline-variant bg-surface-container-high text-on-surface font-body-sm",
            error: "border-error/40",
            success: "border-primary/40",
          },
        }}
      />
    </div>
  );
}
