"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";

export function SidebarWrapper() {
  const pathname = usePathname();

  const noSidebarRoutes = [
    "/login",
    "/sign-up",
    "/create-org",
    "/reset-password",
    "/banned",
    "/unauthorized",
  ];
  const showSidebar =
    !noSidebarRoutes.includes(pathname) && !pathname.startsWith("/invite");

  if (!showSidebar) return null;

  return <Sidebar />;
}
