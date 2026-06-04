'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { CustomerProfilePanel } from './customer-profile-panel';
import { DetailTabs, type TabId } from './detail-tabs';
import { NotesTab } from './tabs/notes-tab';
import { DeliveriesTab } from './tabs/deliveries-tab';
import { InvoicesTab } from './tabs/invoices-tab';
import { OrdersTab } from './tabs/orders-tab';
import { ConversationsTab } from './tabs/conversations-tab';
import { FollowUpsTab } from './tabs/followups-tab';
import type {
  Customer,
  Invoice,
  InvoiceItem,
  Transaction,
  Fulfillment,
  FulfillmentItem,
  CrmRecord,
  CrmActivity,
  CrmNote,
  Member,
  TransactionItem
} from '@repo/db';

type CustomerWithRelations = Customer & {
  invoices: (Invoice & { items: InvoiceItem[] })[];
  transactions: (Transaction & {
    fulfillments: (Fulfillment & { items: FulfillmentItem[] })[];
    items: TransactionItem[];
  })[];
  crmRecord: (CrmRecord & {
    activities: (CrmActivity & { member: Member | null })[];
    notes: (CrmNote & { createdBy: Member | null })[];
  }) | null;
};

interface CustomerDetailViewProps {
  customer: CustomerWithRelations;
}

function TabContent({ customer, tab }: { customer: CustomerWithRelations; tab: TabId }) {
  switch (tab) {
    case 'notes':
      return <NotesTab customer={customer} />;
    case 'deliveries':
      return <DeliveriesTab customer={customer} />;
    case 'invoices':
      return <InvoicesTab customer={customer} />;
    case 'orders':
      return <OrdersTab customer={customer} />;
    case 'conversations':
      return <ConversationsTab customer={customer} />;
    case 'followups':
      return <FollowUpsTab customer={customer} />;
    default:
      return <NotesTab customer={customer} />;
  }
}

function DetailViewInner({ customer }: CustomerDetailViewProps) {
  const searchParams = useSearchParams();
  const tab = (searchParams.get('tab') as TabId) ?? 'notes';

  const counts: Partial<Record<TabId, number>> = {
    notes: customer.crmRecord?.notes?.length || 0,
    deliveries: customer.transactions?.reduce((sum: number, t) => sum + (t.fulfillments?.length || 0), 0) || 0,
    invoices: customer.invoices?.length || 0,
    orders: customer.transactions?.length || 0,
    conversations: customer.crmRecord?.activities?.length || 0,
    followups: 0,
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-card flex-shrink-0">
        <Link
          href="/customers"
          className="flex items-center gap-1.5 text-[12.5px] font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} />
          Customers
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-[12.5px] font-semibold text-foreground">{customer.name}</span>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left profile panel — sticky, scrollable independently */}
        <div className="w-[320px] flex-shrink-0 border-r border-border overflow-y-auto p-4 custom-scrollbar">
          <CustomerProfilePanel customer={customer} />
        </div>

        {/* Right content — tabs + panel */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <DetailTabs activeTab={tab} customerId={customer.id} counts={counts} />
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <TabContent customer={customer} tab={tab} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CustomerDetailView({ customer }: CustomerDetailViewProps) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-muted-foreground text-sm">Loading...</div>}>
      <DetailViewInner customer={customer} />
    </Suspense>
  );
}
