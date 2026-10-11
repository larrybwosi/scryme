"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@repo/ui/lib/utils";
import {
  LayoutDashboard,
  Truck,
  Users,
  CheckCircle2,
  Building2,
} from "lucide-react";

const tabs = [
  { label: "Overview", href: "/sales/deliveries", icon: LayoutDashboard },
  { label: "Deliveries & Dispatches", href: "/sales/deliveries/list", icon: Truck },
  { label: "Drivers & Fleet", href: "/sales/deliveries/drivers", icon: Users },
  { label: "Reconciliation", href: "/sales/deliveries/reconciliation", icon: CheckCircle2 },
  { label: "Partners & Settings", href: "/sales/deliveries/partners", icon: Building2 },
];

export function DeliveriesTabs() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1 border-b border-border/60 pb-px overflow-x-auto">
      {tabs.map((tab) => {
        const isActive =
          tab.href === "/sales/deliveries"
            ? pathname === "/sales/deliveries"
            : pathname.startsWith(tab.href);
        const Icon = tab.icon;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors relative whitespace-nowrap rounded-t-lg",
              isActive
                ? "text-primary bg-primary/5 font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            )}
          >
            <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
            {tab.label}
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
