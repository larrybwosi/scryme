"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useModules } from "@/providers/module-provider";

interface ModuleRouteGuardProps {
  moduleKey: string;
  children: React.ReactNode;
}

export function ModuleRouteGuard({
  moduleKey,
  children,
}: ModuleRouteGuardProps) {
  const { isModuleEnabled, isLoading } = useModules();
  const router = useRouter();
  const pathname = usePathname();

  const isEnabled = isModuleEnabled(moduleKey);

  useEffect(() => {
    if (!isLoading && !isEnabled) {
      console.warn(`Module [${moduleKey}] is disabled. Redirecting from ${pathname} to /dashboard`);
      router.replace("/dashboard");
    }
  }, [isLoading, isEnabled, moduleKey, pathname, router]);

  if (isLoading) {
    return null;
  }

  if (!isEnabled) {
    return null;
  }

  return <>{children}</>;
}
