'use client';

import React, { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@repo/ui/lib/utils';
import {
  StickyNote,
  Truck,
  Receipt,
  ShoppingBag,
  MessageSquare,
  CalendarClock,
} from 'lucide-react';

export type TabId = 'notes' | 'deliveries' | 'invoices' | 'orders' | 'conversations' | 'followups';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

const TABS: Tab[] = [
  { id: 'notes', label: 'Notes', icon: StickyNote },
  { id: 'deliveries', label: 'Deliveries', icon: Truck },
  { id: 'invoices', label: 'Invoices', icon: Receipt },
  { id: 'orders', label: 'Orders & Sales', icon: ShoppingBag },
  { id: 'conversations', label: 'Conversations', icon: MessageSquare },
  { id: 'followups', label: 'Follow-ups', icon: CalendarClock },
];

interface DetailTabsProps {
  activeTab: TabId;
  customerId: string;
  counts?: Partial<Record<TabId, number>>;
}

export function DetailTabs({ activeTab, customerId, counts }: DetailTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleTabChange = useCallback(
    (tabId: TabId) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', tabId);
      router.replace(`/customers/${customerId}?${params.toString()}`, { scroll: false });
    },
    [router, searchParams, customerId]
  );

  return (
    <div className="border-b border-border bg-card">
      <div className="flex items-center overflow-x-auto px-6 custom-scrollbar" style={{ scrollbarHeight: 'none' }}>
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          const count = counts?.[tab.id];
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-3.5 text-[13px] font-medium border-b-2 whitespace-nowrap transition-colors',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              )}
            >
              <tab.icon size={14} />
              {tab.label}
              {count !== undefined && count > 0 && (
                <span
                  className={cn(
                    'text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center',
                    isActive
                      ? 'bg-primary/15 text-primary'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { TABS };
