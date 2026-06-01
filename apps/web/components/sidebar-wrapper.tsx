'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';

export function SidebarWrapper() {
  const pathname = usePathname();

  const noSidebarRoutes = ['/login', '/sign-up', '/create-org', '/reset-password'];
  const showSidebar = !noSidebarRoutes.includes(pathname);

  if (!showSidebar) return null;

  return <Sidebar />;
}
