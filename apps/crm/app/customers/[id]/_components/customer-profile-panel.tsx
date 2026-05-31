'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Phone,
  Globe,
  MapPin,
  Star,
  Edit2,
  ShoppingCart,
  DollarSign,
  FileText,
  User,
  Building2,
  Tag,
} from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
import type { Customer } from '../../../../lib/mock-data';
import { formatCurrency } from '../../../../lib/mock-data';
import { StatusBadge } from '../../../../components/ui/status-badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@repo/ui/components/ui/sheet';
import { CustomerForm } from '../../_components/customer-form';

interface CustomerProfilePanelProps {
  customer: any;
}

function HealthRing({ score }: { score: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 80 ? 'var(--status-success)' : score >= 50 ? 'var(--status-warning)' : 'var(--destructive)';

  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg width="64" height="64" className="-rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="var(--border)" strokeWidth="5" />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[13px] font-bold text-foreground">{score}</span>
      </div>
    </div>
  );
}

export function CustomerProfilePanel({ customer }: CustomerProfilePanelProps) {
  const router = useRouter();
  const initials = customer.name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="w-[300px] flex-shrink-0 flex flex-col gap-4">
      {/* Identity Card */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-xl">
            {initials}
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <button className="p-2 rounded-lg border border-border hover:bg-accent transition-colors">
                <Edit2 size={13} className="text-muted-foreground" />
              </button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-[440px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Edit Customer</SheetTitle>
              </SheetHeader>
              <CustomerForm
                initialData={{
                  id: customer.id,
                  name: customer.name,
                  email: customer.email || '',
                  phone: customer.phone || '',
                  company: customer.company || customer.businessAccount?.name || '',
                  customerType: customer.customerType || 'B2C',
                  taxId: customer.taxId || '',
                  isActive: customer.isActive ?? true,
                  deliveryNotes: customer.deliveryNotes || '',
                }}
                onSuccess={() => {
                  router.refresh();
                }}
              />
            </SheetContent>
          </Sheet>
        </div>

        <div className="mb-3">
          <h2 className="text-[16px] font-bold text-foreground">{customer.name}</h2>
          <div className="flex items-center gap-1.5 mt-1">
            <Building2 size={12} className="text-muted-foreground" />
            <span className="text-[12.5px] text-muted-foreground">{customer.company || customer.businessAccount?.name || 'Individual'}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          <StatusBadge status={customer.isActive ? 'Active' : 'Inactive'} dot />
          <StatusBadge status={customer.customerType || 'B2C'} />
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5 text-[12.5px]">
            <Mail size={13} className="text-muted-foreground flex-shrink-0" />
            <a href={`mailto:${customer.email}`} className="text-primary hover:underline truncate">
              {customer.email}
            </a>
          </div>
          <div className="flex items-center gap-2.5 text-[12.5px]">
            <Phone size={13} className="text-muted-foreground flex-shrink-0" />
            <span className="text-foreground">{customer.phone}</span>
          </div>
          {customer.website && (
            <div className="flex items-center gap-2.5 text-[12.5px]">
              <Globe size={13} className="text-muted-foreground flex-shrink-0" />
              <a
                href={`https://${customer.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline truncate"
              >
                {customer.website}
              </a>
            </div>
          )}
          <div className="flex items-start gap-2.5 text-[12.5px]">
            <MapPin size={13} className="text-muted-foreground flex-shrink-0 mt-0.5" />
            <span className="text-muted-foreground">
              {customer.address}, {customer.city}, {customer.country}
            </span>
          </div>
        </div>

        {/* Tags */}
        {customer.tags && customer.tags.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-1.5 mb-2">
              <Tag size={11} className="text-muted-foreground" />
              <span className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
                Tags
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {customer.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="text-[10.5px] font-medium bg-accent text-accent-foreground border border-border px-2 py-0.5 rounded-md"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-4">
          Quick Stats
        </h3>
        <div className="space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <DollarSign size={13} className="text-primary" />
              </div>
              <span className="text-[12.5px] text-muted-foreground truncate">Total Revenue</span>
            </div>
            <span className="text-[13px] font-bold text-foreground flex-shrink-0">
              {formatCurrency(customer.totalRevenue || 0)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-status-info/10 flex items-center justify-center flex-shrink-0">
                <ShoppingCart size={13} className="text-status-info" />
              </div>
              <span className="text-[12.5px] text-muted-foreground truncate">Total Orders</span>
            </div>
            <span className="text-[13px] font-bold text-foreground flex-shrink-0">{customer.totalOrders || customer.transactions?.length || 0}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-status-warning/10 flex items-center justify-center flex-shrink-0">
                <FileText size={13} className="text-status-warning" />
              </div>
              <span className="text-[12.5px] text-muted-foreground truncate">Open Invoices</span>
            </div>
            <span
              className={cn(
                'text-[13px] font-bold flex-shrink-0',
                (customer.openInvoices || 0) > 0 ? 'text-destructive' : 'text-foreground'
              )}
            >
              {customer.openInvoices || 0}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                <Star size={13} className="text-amber-500" />
              </div>
              <span className="text-[12.5px] text-muted-foreground truncate">Loyalty Points</span>
            </div>
            <span className="text-[13px] font-bold text-foreground flex-shrink-0">
              {(customer.loyaltyPoints || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Health Score */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-4">
          Account Health
        </h3>
        <div className="flex items-center gap-4">
          <HealthRing score={customer.healthScore || 70} />
          <div>
            <p className="text-[13px] font-semibold text-foreground">
              {(customer.healthScore || 70) >= 80
                ? 'Excellent'
                : (customer.healthScore || 70) >= 65
                ? 'Good'
                : (customer.healthScore || 70) >= 50
                ? 'Fair'
                : 'At Risk'}
            </p>
            <p className="text-[11.5px] text-muted-foreground mt-0.5">
              Score out of 100
            </p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-border space-y-2">
          <div className="flex items-center justify-between text-[11.5px]">
            <span className="text-muted-foreground">Engagement</span>
            <span className="font-medium text-foreground">
              {(customer.healthScore || 70) >= 80 ? 'High' : (customer.healthScore || 70) >= 50 ? 'Medium' : 'Low'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11.5px]">
            <span className="text-muted-foreground">Payment Risk</span>
            <span className={cn('font-medium', (customer.openInvoices || 0) > 0 ? 'text-status-warning' : 'text-status-success')}>
              {(customer.openInvoices || 0) > 0 ? 'Moderate' : 'Low'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11.5px]">
            <span className="text-muted-foreground">Industry</span>
            <span className="font-medium text-foreground">{customer.industry || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Account Manager */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
          Account Manager
        </h3>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-foreground/10 flex items-center justify-center text-foreground font-bold text-[12px]">
            {customer.accountManagerInitials || 'UN'}
          </div>
          <div>
            <p className="text-[13px] font-semibold text-foreground">{customer.accountManager || 'Unassigned'}</p>
            <div className="flex items-center gap-1">
              <User size={10} className="text-muted-foreground" />
              <p className="text-[11px] text-muted-foreground">Senior Account Manager</p>
            </div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-border text-[11.5px] text-muted-foreground">
          Customer since{' '}
          <span className="font-medium text-foreground">
            {new Date(customer.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>
    </aside>
  );
}
