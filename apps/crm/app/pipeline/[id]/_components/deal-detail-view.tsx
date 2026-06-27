"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  TrendingUp,
  Building2,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import { DetailTabs, type TabId } from "@/components/crm/detail-tabs";
import { NotesTab } from "@/components/crm/notes-tab";
import { FollowUpsTab } from "@/components/crm/followups-tab";
import { ActivitiesTab } from "@/components/crm/activities-tab";
import { format } from "date-fns";

interface DealDetailViewProps {
  deal: any;
}

function TabContent({ deal, tab }: { deal: any; tab: TabId }) {
  const adaptedDeal = {
    ...deal,
    crmRecord: deal,
    crmRecordId: deal.id,
    organizationId: deal.organizationId,
  };

  switch (tab) {
    case "notes":
      return <NotesTab customer={adaptedDeal as any} />;
    case "activities":
      return <ActivitiesTab customer={adaptedDeal as any} />;
    case "followups":
      return <FollowUpsTab customer={adaptedDeal as any} />;
    default:
      return <NotesTab customer={adaptedDeal as any} />;
  }
}

function DetailViewInner({ deal }: DealDetailViewProps) {
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") as TabId) ?? "notes";

  const counts: Partial<Record<TabId, number>> = {
    notes: deal.notes?.length || 0,
    activities: deal.activities?.length || 0,
    followups: deal.followUps?.length || 0,
  };

  const availableTabs: TabId[] = ["notes", "activities", "followups"];

  const amount = deal.data.amount
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(deal.data.amount)
    : "—";

  const expectedCloseDate = deal.data.expectedCloseDate
    ? format(new Date(deal.data.expectedCloseDate), "MMM d, yyyy")
    : null;

  const associatedCompany = deal.targetAssociations?.find(
    (a: any) => a.sourceRecord?.businessAccount,
  )?.sourceRecord?.businessAccount;

  const associatedContact = deal.targetAssociations?.find(
    (a: any) => a.sourceRecord?.customer,
  )?.sourceRecord?.customer;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-card flex-shrink-0">
        <Link
          href="/pipeline"
          className="flex items-center gap-1.5 text-[12.5px] font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} />
          Pipeline
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-[12.5px] font-semibold text-foreground">
          {deal.data.name}
        </span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Deal Info Panel */}
        <div className="w-[320px] flex-shrink-0 border-r border-border overflow-y-auto p-6 custom-scrollbar">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold">{deal.data.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-[11px] font-bold rounded uppercase">
                  {deal.data.stage?.replace("_", " ")}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-sm">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <DollarSign size={14} />
                  <span>Amount</span>
                </div>
                <div className="text-base font-bold">{amount}</div>
              </div>

              <div className="text-sm">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <TrendingUp size={14} />
                  <span>Probability</span>
                </div>
                <div>{deal.data.probability}%</div>
              </div>

              <div className="text-sm">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Calendar size={14} />
                  <span>Expected Close</span>
                </div>
                <div>{expectedCloseDate || "Not set"}</div>
              </div>
            </div>

            <div className="pt-4 border-t border-border space-y-4">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Associations
              </div>

              {associatedCompany && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                    <Building2 size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold truncate">
                      {associatedCompany.name}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Company
                    </div>
                  </div>
                </div>
              )}

              {associatedContact && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                    <UserIcon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold truncate">
                      {associatedContact.name}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Contact
                    </div>
                  </div>
                </div>
              )}

              {!associatedCompany && !associatedContact && (
                <div className="text-sm text-muted-foreground italic">
                  No associations
                </div>
              )}
            </div>

            {deal.data.description && (
              <div className="pt-4 border-t border-border">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Description
                </div>
                <p className="text-[13px] text-foreground leading-relaxed whitespace-pre-wrap">
                  {deal.data.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <DetailTabs
            activeTab={tab}
            customerId={deal.id}
            counts={counts}
            availableTabs={availableTabs}
          />
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <TabContent deal={deal} tab={tab} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function DealDetailView({ deal }: DealDetailViewProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen text-muted-foreground text-sm">
          Loading...
        </div>
      }
    >
      <DetailViewInner deal={deal} />
    </Suspense>
  );
}
