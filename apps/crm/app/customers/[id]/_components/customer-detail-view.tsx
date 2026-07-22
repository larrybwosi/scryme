"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CustomerProfilePanel } from "./customer-profile-panel";
import { DetailTabs, type TabId } from "@/components/crm/detail-tabs";
import { NotesTab } from "@/components/crm/notes-tab";
import { DeliveriesTab } from "./tabs/deliveries-tab";
import { InvoicesTab } from "./tabs/invoices-tab";
import { OrdersTab } from "./tabs/orders-tab";
import { ConversationsTab } from "./tabs/conversations-tab";
import { FollowUpsTab } from "@/components/crm/followups-tab";
import { ActivitiesTab } from "@/components/crm/activities-tab";
import type { CustomerWithRelations } from "@/lib/types";

interface CustomerDetailViewProps {
  customer: CustomerWithRelations;
  currency?: string;
}

function TabContent({
  customer,
  tab,
  currency,
}: {
  customer: CustomerWithRelations;
  tab: TabId;
  currency: string;
}) {
  switch (tab) {
    case "notes":
      return <NotesTab customer={customer} />;
    case "activities":
      return <ActivitiesTab customer={customer} />;
    case "deliveries":
      return <DeliveriesTab customer={customer} />;
    case "invoices":
      return <InvoicesTab customer={customer} currency={currency} />;
    case "orders":
      return <OrdersTab customer={customer} currency={currency} />;
    case "conversations":
      return <ConversationsTab customer={customer} />;
    case "followups":
      return <FollowUpsTab customer={customer} />;
    default:
      return <NotesTab customer={customer} />;
  }
}

function DetailViewInner({ customer, currency = "USD" }: CustomerDetailViewProps) {
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") as TabId) ?? "notes";

  const counts: Partial<Record<TabId, number>> = {
    notes: customer.crmRecord?.notes?.length || 0,
    activities: customer.crmRecord?.activities?.length || 0,
    deliveries:
      customer.transactions?.reduce(
        (sum: number, t: any) => sum + (t.fulfillments?.length || 0),
        0,
      ) || 0,
    invoices: customer.invoices?.length || 0,
    orders: customer.transactions?.length || 0,
    conversations: customer.crmRecord?.activities?.length || 0,
    followups: customer.crmRecord?.followUps?.length || 0,
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-card shrink-0">
        <Link
          href="/customers"
          className="flex items-center gap-1.5 text-[12.5px] font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} />
          Customers
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-[12.5px] font-semibold text-foreground">
          {customer.name}
        </span>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left profile panel — sticky, scrollable independently */}
        <div className="w-[320px] shrink-0 border-r border-border overflow-y-auto p-4 custom-scrollbar">
          <CustomerProfilePanel customer={customer} currency={currency} />
        </div>

        {/* Right content — tabs + panel */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <DetailTabs
            activeTab={tab}
            customerId={customer.id}
            counts={counts}
            availableTabs={[
              "notes",
              "activities",
              "deliveries",
              "invoices",
              "orders",
              "conversations",
              "followups",
            ]}
          />
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <TabContent customer={customer} tab={tab} currency={currency} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CustomerDetailView({ customer, currency = "USD" }: CustomerDetailViewProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen text-muted-foreground text-sm">
          Loading...
        </div>
      }
    >
      <DetailViewInner customer={customer} currency={currency} />
    </Suspense>
  );
}
