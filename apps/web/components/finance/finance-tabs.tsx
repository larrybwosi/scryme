"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@repo/ui/lib/utils";

const tabs = [
  { label: "Overview", href: "/finance" },
  { label: "Expenses", href: "/finance/expenses" },
  { label: "Purchases", href: "/finance/purchases" },
  { label: "Petty Cash", href: "/finance/petty-cash" },
  { label: "Utilities", href: "/finance/utilities" },
  { label: "Approvals", href: "/finance/approvals" },
  { label: "Settings", href: "/finance/settings" },
];

export function FinanceTabs() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1 border-b border-border pb-px overflow-x-auto">
      {tabs.map(tab => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap",
              isActive
                ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}>
            {tab.label}
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-emerald-400" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
