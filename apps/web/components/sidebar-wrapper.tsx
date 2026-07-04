"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@repo/ui/components/ui/sheet";
import { Button } from "@repo/ui/components/ui/button";
import { Menu } from "lucide-react";
import { useState, useEffect } from "react";

export function SidebarWrapper() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const noSidebarRoutes = [
    "/login",
    "/sign-up",
    "/create-org",
    "/reset-password",
  ];
  const showSidebar = !noSidebarRoutes.includes(pathname);

  if (!showSidebar) return null;

  return (
    <>
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-white">
              <Menu size={20} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[280px]">
             <SheetHeader className="sr-only">
              <SheetTitle>Navigation Menu</SheetTitle>
            </SheetHeader>
            <Sidebar className="w-full border-r-0" />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
