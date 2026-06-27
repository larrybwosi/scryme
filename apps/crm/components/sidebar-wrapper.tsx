"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";

const AUTH_ROUTES = [
  "/login",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
];

export function SidebarWrapper() {
  const pathname = usePathname();
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname?.startsWith(route));

  if (isAuthRoute) {
    return null;
  }

  return <Sidebar />;
}
