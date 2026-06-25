"use client";

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Building2, Users, FileText, Activity as ActivityIcon } from 'lucide-react';
import Link from 'next/link';
import { DetailTabs, type TabId } from '@/components/crm/detail-tabs';
import { NotesTab } from '@/components/crm/notes-tab';
import { FollowUpsTab } from '@/components/crm/followups-tab';
import { ActivitiesTab } from '@/components/crm/activities-tab';
import { cn } from '@repo/ui/lib/utils';

interface CompanyDetailViewProps {
  company: any;
}

function TabContent({ company, tab }: { company: any; tab: TabId }) {
  // Adaptation to match what components expect
  const adaptedCompany = {
    ...company,
    crmRecord: company.crmRecord || { id: company.crmRecordId, notes: [], activities: [], followUps: [] },
    crmRecordId: company.crmRecordId,
    organizationId: company.organizationId,
  };

  switch (tab) {
    case 'notes':
      return <NotesTab customer={adaptedCompany as any} />;
    case 'activities':
      return <ActivitiesTab customer={adaptedCompany as any} />;
    case 'followups':
      return <FollowUpsTab customer={adaptedCompany as any} />;
    case 'contacts':
      return <ContactsTab company={company} />;
    case 'orders':
      return <OrdersTab company={company} />;
    default:
      return <NotesTab customer={adaptedCompany as any} />;
  }
}

function ContactsTab({ company }: { company: any }) {
    const contacts = company.customers || [];
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold">Contacts</h3>
            {contacts.length === 0 ? (
                <p className="text-muted-foreground text-sm">No contacts associated with this company.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {contacts.map((contact: any) => (
                        <Link key={contact.id} href={`/customers/${contact.id}`} className="block p-4 border border-border rounded-xl hover:border-primary transition-colors">
                            <div className="font-semibold">{contact.name}</div>
                            <div className="text-sm text-muted-foreground">{contact.email || 'No email'}</div>
                            <div className="text-sm text-muted-foreground">{contact.phone || 'No phone'}</div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

function OrdersTab({ company }: { company: any }) {
    const transactions = company.transactions || [];
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold">Transactions</h3>
            {transactions.length === 0 ? (
                <p className="text-muted-foreground text-sm">No transactions found.</p>
            ) : (
                <div className="space-y-3">
                    {transactions.map((t: any) => (
                        <div key={t.id} className="p-4 border border-border rounded-xl flex items-center justify-between">
                            <div>
                                <div className="font-semibold">{t.invoiceNumber || t.id}</div>
                                <div className="text-sm text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</div>
                            </div>
                            <div className="font-bold text-lg">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(t.total)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function DetailViewInner({ company }: CompanyDetailViewProps) {
  const searchParams = useSearchParams();
  const tab = (searchParams.get('tab') as TabId) ?? 'notes';

  const counts: Partial<Record<TabId, number>> = {
    notes: company.crmRecord?.notes?.length || 0,
    activities: company.crmRecord?.activities?.length || 0,
    followups: company.crmRecord?.followUps?.length || 0,
    contacts: company.customers?.length || 0,
    orders: company.transactions?.length || 0,
  };

  const availableTabs: TabId[] = ['notes', 'activities', 'contacts', 'orders', 'followups'];

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-card flex-shrink-0">
        <Link
          href="/companies"
          className="flex items-center gap-1.5 text-[12.5px] font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} />
          Companies
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-[12.5px] font-semibold text-foreground">{company.name}</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Company Info Panel */}
        <div className="w-[320px] flex-shrink-0 border-r border-border overflow-y-auto p-6 custom-scrollbar">
           <div className="space-y-6">
              <div className="flex flex-col items-center text-center">
                 <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                    <Building2 size={32} />
                 </div>
                 <h2 className="text-xl font-bold">{company.name}</h2>
                 <p className="text-sm text-muted-foreground">Business Account</p>
              </div>

              <div className="space-y-4">
                 <div className="text-sm">
                    <div className="text-muted-foreground font-medium mb-1">Tax ID / KRA PIN</div>
                    <div className="font-medium">{company.taxId || 'Not provided'}</div>
                 </div>

                 <div className="text-sm">
                    <div className="text-muted-foreground font-medium mb-1">Total Spent</div>
                    <div className="text-lg font-bold text-foreground">
                       {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                          company.transactions?.reduce((sum: number, t: any) => sum + (t.total || 0), 0) || 0
                       )}
                    </div>
                 </div>
              </div>

              <div className="pt-4 border-t border-border">
                 <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</div>
                 <div className="grid grid-cols-2 gap-2">
                    <button className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border hover:bg-muted transition-colors text-[11px] font-medium">
                       <Users size={16} className="text-primary" />
                       Add Contact
                    </button>
                    <button className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border hover:bg-muted transition-colors text-[11px] font-medium">
                       <FileText size={16} className="text-primary" />
                       New Invoice
                    </button>
                 </div>
              </div>
           </div>
        </div>

        {/* Right content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <DetailTabs activeTab={tab} customerId={company.id} counts={counts} availableTabs={availableTabs} />
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <TabContent company={company} tab={tab} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CompanyDetailView({ company }: CompanyDetailViewProps) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-muted-foreground text-sm">Loading...</div>}>
      <DetailViewInner company={company} />
    </Suspense>
  );
}
