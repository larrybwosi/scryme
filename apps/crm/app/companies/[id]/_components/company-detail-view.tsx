"use client";
/* eslint-disable @next/next/no-img-element */

import React, { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Building2, Users, FileText, Activity as ActivityIcon } from 'lucide-react';
import Link from 'next/link';
import { DetailTabs, type TabId } from '@/components/crm/detail-tabs';
import { NotesTab } from '@/components/crm/notes-tab';
import { FollowUpsTab } from '@/components/crm/followups-tab';
import { ActivitiesTab } from '@/components/crm/activities-tab';
import { cn } from '@repo/ui/lib/utils';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@repo/ui/components/ui/dialog';
import { CustomerForm } from '../../../customers/_components/customer-form';
import { createInvoiceAction } from '@/app/actions/invoices';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/ui/select';
import { Calendar as CalendarComponent } from '@repo/ui/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/components/ui/popover';
import { format } from 'date-fns';

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
    const contacts = company.contacts || [];
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = (searchParams.get('tab') as TabId) ?? 'notes';

  const counts: Partial<Record<TabId, number>> = {
    notes: company.crmRecord?.notes?.length || 0,
    activities: company.crmRecord?.activities?.length || 0,
    followups: company.crmRecord?.followUps?.length || 0,
    contacts: company.contacts?.length || 0,
    orders: company.transactions?.length || 0,
  };

  const availableTabs: TabId[] = ['notes', 'activities', 'contacts', 'orders', 'followups'];

  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);

  // New Invoice form state
  const [selectedContactId, setSelectedContactId] = useState('');
  const [invoiceItemName, setInvoiceItemName] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoicePostingDate, setInvoicePostingDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceDueDate, setInvoiceDueDate] = useState('');
  const [isInvoiceSubmitting, setIsInvoiceSubmitting] = useState(false);

  const contacts = company.contacts || [];

  const handleInvoiceCreate = async () => {
    const amount = parseFloat(invoiceAmount) || 0;
    if (!selectedContactId || !invoiceItemName.trim() || !invoicePostingDate || amount <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsInvoiceSubmitting(true);
    try {
      const result = await createInvoiceAction({
        customerId: selectedContactId,
        postingDate: new Date(invoicePostingDate),
        dueDate: invoiceDueDate ? new Date(invoiceDueDate) : undefined,
        status: 'DRAFT',
        items: [
          {
            itemCode: 'GENERIC',
            itemName: invoiceItemName.trim(),
            quantity: 1,
            rate: amount,
            amount: amount,
          }
        ]
      });

      if (result.success) {
        toast.success('B2B Invoice created successfully');
        setIsNewInvoiceOpen(false);
        // Reset form
        setSelectedContactId('');
        setInvoiceItemName('');
        setInvoiceAmount('');
        setInvoiceDueDate('');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to create invoice');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to create invoice');
    } finally {
      setIsInvoiceSubmitting(false);
    }
  };

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
                 {company.logoUrl ? (
                    <img
                       src={company.logoUrl}
                       className="w-16 h-16 rounded-xl object-contain border border-border mb-4 bg-background p-1"
                       alt={`${company.name} Logo`}
                    />
                 ) : (
                    <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4" style={company.customTheme ? { backgroundColor: `${company.customTheme}15`, color: company.customTheme } : {}}>
                       <Building2 size={32} />
                    </div>
                 )}
                 <h2 className="text-xl font-bold">{company.name}</h2>
                 <div className="flex items-center gap-1.5 mt-1 justify-center">
                    <span className="text-xs text-muted-foreground">Business Account</span>
                    {company.isEnterprise && (
                       <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/10 text-amber-500 rounded border border-amber-500/20 uppercase tracking-wider">
                          Enterprise
                       </span>
                    )}
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="text-sm">
                    <div className="text-muted-foreground font-medium mb-1">Tax ID / KRA PIN</div>
                    <div className="font-medium">{company.taxId || 'Not provided'}</div>
                 </div>

                 {company.customTheme && (
                    <div className="text-sm">
                       <div className="text-muted-foreground font-medium mb-1">Brand Theme Color</div>
                       <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: company.customTheme }} />
                          <span className="font-mono text-xs">{company.customTheme}</span>
                       </div>
                    </div>
                 )}

                 {company.discountPercentage !== undefined && company.discountPercentage !== null && (
                    <div className="text-sm">
                       <div className="text-muted-foreground font-medium mb-1">B2B Discount Rate</div>
                       <div className="font-semibold text-status-success">{company.discountPercentage}% off</div>
                    </div>
                 )}

                 {company.paymentTermsDays !== undefined && company.paymentTermsDays !== null && (
                    <div className="text-sm">
                       <div className="text-muted-foreground font-medium mb-1">Payment Terms</div>
                       <div className="font-medium">{company.paymentTermsDays} Days Net</div>
                    </div>
                 )}

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
                    <button
                       onClick={() => setIsAddContactOpen(true)}
                       className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border hover:bg-muted transition-colors text-[11px] font-medium"
                    >
                       <Users size={16} className="text-primary" />
                       Add Contact
                    </button>
                    <button
                       onClick={() => setIsNewInvoiceOpen(true)}
                       className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border hover:bg-muted transition-colors text-[11px] font-medium"
                    >
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

      {/* Add Contact Sheet */}
      <Sheet open={isAddContactOpen} onOpenChange={setIsAddContactOpen}>
         <SheetContent className="sm:max-w-[440px] overflow-y-auto">
            <SheetHeader>
               <SheetTitle>Add Contact to {company.name}</SheetTitle>
            </SheetHeader>
            <CustomerForm
               initialData={{
                  name: '',
                  email: '',
                  phone: '',
                  company: company.name,
                  businessAccountId: company.id,
                  customerType: 'B2B',
                  isActive: true,
               } as any}
               onSuccess={() => {
                  setIsAddContactOpen(false);
                  toast.success('Contact added successfully');
                  router.refresh();
               }}
               type="CONTACT"
            />
         </SheetContent>
      </Sheet>

      {/* New Invoice Dialog */}
      <Dialog open={isNewInvoiceOpen} onOpenChange={setIsNewInvoiceOpen}>
         <DialogContent className="sm:max-w-[440px]">
            <DialogHeader>
               <DialogTitle>New B2B Invoice</DialogTitle>
            </DialogHeader>
            {contacts.length === 0 ? (
               <div className="py-6 text-center space-y-4">
                  <p className="text-sm text-muted-foreground">
                     This company does not have any contacts yet. Please add a contact first before creating an invoice.
                  </p>
                  <Button
                     onClick={() => {
                        setIsNewInvoiceOpen(false);
                        setIsAddContactOpen(true);
                     }}
                     className="px-4 py-2 text-xs font-semibold"
                  >
                     Add Contact
                  </Button>
               </div>
            ) : (
               <div className="space-y-4 py-2">
                  <div>
                     <label className="text-[11px] font-semibold text-muted-foreground uppercase block mb-1.5">
                        Select Contact *
                     </label>
                     <Select
                        value={selectedContactId}
                        onValueChange={(val) => setSelectedContactId(val)}
                     >
                        <SelectTrigger className="w-full h-9 bg-background">
                           <SelectValue placeholder="Select a contact..." />
                        </SelectTrigger>
                        <SelectContent>
                           {contacts.map((c: any) => (
                              <SelectItem key={c.id} value={c.id}>
                                 {c.name} ({c.email || 'No email'})
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </div>
                  <div>
                     <label className="text-[11px] font-semibold text-muted-foreground uppercase block mb-1.5">
                        Description *
                     </label>
                     <input
                        value={invoiceItemName}
                        onChange={(e) => setInvoiceItemName(e.target.value)}
                        placeholder="e.g. Monthly Consulting Fee"
                        className="w-full text-[13px] bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors"
                     />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase block mb-1.5">
                           Amount ($) *
                        </label>
                        <input
                           type="number"
                           value={invoiceAmount}
                           onChange={(e) => setInvoiceAmount(e.target.value)}
                           placeholder="0.00"
                           className="w-full text-[13px] bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors"
                        />
                     </div>
                     <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase block mb-1.5">
                           Issue Date *
                        </label>
                        <Popover>
                           <PopoverTrigger asChild>
                              <Button
                                 variant="outline"
                                 className={cn(
                                    "w-full justify-start text-left font-normal text-sm h-9 px-3",
                                    !invoicePostingDate && "text-muted-foreground"
                                 )}
                              >
                                 <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                                 {invoicePostingDate ? format(new Date(invoicePostingDate), "PPP") : <span>Pick a date</span>}
                              </Button>
                           </PopoverTrigger>
                           <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                 mode="single"
                                 selected={invoicePostingDate ? new Date(invoicePostingDate) : undefined}
                                 onSelect={(date) => {
                                    if (date) {
                                       const yyyy = date.getFullYear();
                                       const mm = String(date.getMonth() + 1).padStart(2, '0');
                                       const dd = String(date.getDate()).padStart(2, '0');
                                       setInvoicePostingDate(`${yyyy}-${mm}-${dd}`);
                                    }
                                 }}
                                 initialFocus
                              />
                           </PopoverContent>
                        </Popover>
                     </div>
                  </div>
                  <div>
                     <label className="text-[11px] font-semibold text-muted-foreground uppercase block mb-1.5">
                        Due Date
                     </label>
                     <Popover>
                        <PopoverTrigger asChild>
                           <Button
                              variant="outline"
                              className={cn(
                                 "w-full justify-start text-left font-normal text-sm h-9 px-3",
                                 !invoiceDueDate && "text-muted-foreground"
                              )}
                           >
                              <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                              {invoiceDueDate ? format(new Date(invoiceDueDate), "PPP") : <span>Pick a date</span>}
                           </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                           <CalendarComponent
                              mode="single"
                              selected={invoiceDueDate ? new Date(invoiceDueDate) : undefined}
                              onSelect={(date) => {
                                 if (date) {
                                    const yyyy = date.getFullYear();
                                    const mm = String(date.getMonth() + 1).padStart(2, '0');
                                    const dd = String(date.getDate()).padStart(2, '0');
                                    setInvoiceDueDate(`${yyyy}-${mm}-${dd}`);
                                 } else {
                                    setInvoiceDueDate('');
                                 }
                              }}
                              initialFocus
                           />
                        </PopoverContent>
                     </Popover>
                  </div>
                  <DialogFooter className="pt-4">
                     <Button
                        onClick={handleInvoiceCreate}
                        disabled={isInvoiceSubmitting || !selectedContactId || !invoiceItemName.trim() || !invoiceAmount}
                        className="px-5 py-2 font-semibold h-9 ml-auto"
                     >
                        {isInvoiceSubmitting ? 'Creating...' : 'Create Invoice'}
                     </Button>
                  </DialogFooter>
               </div>
            )}
         </DialogContent>
      </Dialog>
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
