"use client";

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { DetailTabs, type TabId } from '@/components/crm/detail-tabs';
import { NotesTab } from '@/components/crm/notes-tab';
import { FollowUpsTab } from '@/components/crm/followups-tab';
import { ActivitiesTab } from '@/components/crm/activities-tab';

interface LeadDetailViewProps {
  lead: any;
}

function TabContent({ lead, tab }: { lead: any; tab: TabId }) {
  // Adaptation to match what components expect
  const adaptedLead = {
    ...lead,
    crmRecord: lead,
    crmRecordId: lead.id,
    organizationId: lead.organizationId,
  };

  switch (tab) {
    case 'notes':
      return <NotesTab customer={adaptedLead as any} />;
    case 'activities':
      return <ActivitiesTab customer={adaptedLead as any} />;
    case 'followups':
      return <FollowUpsTab customer={adaptedLead as any} />;
    default:
      return <NotesTab customer={adaptedLead as any} />;
  }
}

function DetailViewInner({ lead }: LeadDetailViewProps) {
  const searchParams = useSearchParams();
  const tab = (searchParams.get('tab') as TabId) ?? 'notes';

  const counts: Partial<Record<TabId, number>> = {
    notes: lead.notes?.length || 0,
    activities: lead.activities?.length || 0,
    followups: lead.followUps?.length || 0,
  };

  const availableTabs: TabId[] = ['notes', 'activities', 'followups'];

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-card flex-shrink-0">
        <Link
          href="/leads"
          className="flex items-center gap-1.5 text-[12.5px] font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} />
          Leads
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-[12.5px] font-semibold text-foreground">{lead.data.name}</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Simple Lead Info */}
        <div className="w-[320px] flex-shrink-0 border-r border-border overflow-y-auto p-6 custom-scrollbar">
           <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold">{lead.data.name}</h2>
                <p className="text-sm text-muted-foreground">{lead.data.company || 'No Company'}</p>
              </div>

              <div className="space-y-3">
                 <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Contact Info</div>
                 <div className="text-sm">
                    <div className="text-muted-foreground">Email</div>
                    <div>{lead.data.email || 'N/A'}</div>
                 </div>
                 <div className="text-sm">
                    <div className="text-muted-foreground">Phone</div>
                    <div>{lead.data.phone || 'N/A'}</div>
                 </div>
                 <div className="text-sm">
                    <div className="text-muted-foreground">Source</div>
                    <div>{lead.data.source || 'N/A'}</div>
                 </div>
              </div>

              <div className="space-y-3">
                 <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Custom Fields</div>
                 {Object.entries(lead.data).map(([key, value]) => {
                    if (['name', 'email', 'phone', 'company', 'source', 'status'].includes(key)) return null;
                    return (
                        <div key={key} className="text-sm">
                            <div className="text-muted-foreground capitalize">{key}</div>
                            <div>{String(value)}</div>
                        </div>
                    )
                 })}
              </div>
           </div>
        </div>

        {/* Right content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* We reuse DetailTabs but might need to filter them for leads */}
          <DetailTabs activeTab={tab} customerId={lead.id} counts={counts} availableTabs={availableTabs} />
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <TabContent lead={lead} tab={tab} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function LeadDetailView({ lead }: LeadDetailViewProps) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-muted-foreground text-sm">Loading...</div>}>
      <DetailViewInner lead={lead} />
    </Suspense>
  );
}
