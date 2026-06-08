'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@repo/ui/lib/utils';

const tabs = [
  { label: 'Overview', href: '/finance' },
  { label: 'Expenses', href: '/finance/expenses' },
  { label: 'Purchases', href: '/finance/purchases' },
  { label: 'Utilities', href: '/finance/utilities' },
  { label: 'Approvals', href: '/finance/approvals' },
];

export function FinanceTabs() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1 border-b pb-px">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors relative",
              isActive
                ? "text-[#34A853]"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {tab.label}
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#34A853]" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
