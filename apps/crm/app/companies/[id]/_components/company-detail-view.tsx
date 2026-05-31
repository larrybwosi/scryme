'use client';

import React from 'react';
import { Building2, ArrowLeft, Users, TrendingUp, DollarSign } from 'lucide-react';
import Link from 'next/link';

interface CompanyDetailViewProps {
  company: any;
}

export function CompanyDetailView({ company }: CompanyDetailViewProps) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
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

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-xl bg-primary/15 flex items-center justify-center text-primary font-bold text-2xl">
              {company.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{company.name}</h1>
              <p className="text-muted-foreground">Tax ID: {company.taxId || 'N/A'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
             <div className="bg-card p-6 rounded-xl border border-border">
                <div className="flex items-center gap-3 mb-2">
                    <Users size={18} className="text-primary" />
                    <span className="text-sm font-medium text-muted-foreground">Total Customers</span>
                </div>
                <p className="text-2xl font-bold">{company.customers?.length || 0}</p>
             </div>
             <div className="bg-card p-6 rounded-xl border border-border">
                <div className="flex items-center gap-3 mb-2">
                    <TrendingUp size={18} className="text-status-success" />
                    <span className="text-sm font-medium text-muted-foreground">Transactions</span>
                </div>
                <p className="text-2xl font-bold">{company.transactions?.length || 0}</p>
             </div>
             <div className="bg-card p-6 rounded-xl border border-border">
                <div className="flex items-center gap-3 mb-2">
                    <DollarSign size={18} className="text-status-info" />
                    <span className="text-sm font-medium text-muted-foreground">Created At</span>
                </div>
                <p className="text-2xl font-bold text-[16px]">{new Date(company.createdAt).toLocaleDateString()}</p>
             </div>
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
             <div className="px-6 py-4 border-b border-border bg-muted/30">
                <h3 className="font-bold">Associated Customers</h3>
             </div>
             <div className="divide-y divide-border">
                {company.customers?.length > 0 ? company.customers.map((customer: any) => (
                    <Link key={customer.id} href={`/customers/${customer.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                {customer.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-sm font-semibold">{customer.name}</p>
                                <p className="text-xs text-muted-foreground">{customer.email}</p>
                            </div>
                        </div>
                        <span className="text-xs px-2 py-1 bg-accent rounded-full font-medium">
                            {customer.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </Link>
                )) : (
                    <div className="p-8 text-center text-muted-foreground">No customers associated with this company.</div>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
