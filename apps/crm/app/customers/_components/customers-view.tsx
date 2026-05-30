'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  ArrowUpDown,
  Globe,
} from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
import { customers, getCustomerStats, formatCurrency, type CustomerStatus, type CustomerType } from '../../../lib/mock-data';
import { StatCard } from '../../../components/ui/stat-card';
import { StatusBadge } from '../../../components/ui/status-badge';

const PAGE_SIZE = 10;

const STATUS_OPTIONS: Array<CustomerStatus | 'All'> = ['All', 'Active', 'VIP', 'Lead', 'Inactive'];
const TYPE_OPTIONS: Array<CustomerType | 'All'> = ['All', 'B2C', 'B2B', 'Enterprise'];

export function CustomersView() {
  const stats = getCustomerStats();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | 'All'>('All');
  const [typeFilter, setTypeFilter] = useState<CustomerType | 'All'>('All');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const matchesSearch =
        search === '' ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.company.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
      const matchesType = typeFilter === 'All' || c.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [search, statusFilter, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(page, totalPages);
  const paged = filtered.slice((safeCurrentPage - 1) * PAGE_SIZE, safeCurrentPage * PAGE_SIZE);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
    setPage(1);
  }

  function handleStatusChange(s: CustomerStatus | 'All') {
    setStatusFilter(s);
    setPage(1);
  }

  function handleTypeChange(t: CustomerType | 'All') {
    setTypeFilter(t);
    setPage(1);
  }

  const startItem = filtered.length === 0 ? 0 : (safeCurrentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(safeCurrentPage * PAGE_SIZE, filtered.length);

  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
      {/* Page Header */}
      <div className="px-8 pt-7 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-foreground">Customers</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Manage and track all your customer relationships.
            </p>
          </div>
          <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-[13px] font-semibold hover:bg-primary/90 transition-colors">
            <Plus size={15} />
            Add Customer
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <StatCard
            title="Total Customers"
            value={stats.total}
            sub={`${stats.active} active · ${stats.leads} leads`}
            icon={Users}
            iconColor="text-primary"
            iconBg="bg-primary/10"
            trend={{ value: '12%', positive: true }}
          />
          <StatCard
            title="VIP Accounts"
            value={stats.vip}
            sub="Highest value tier"
            icon={TrendingUp}
            iconColor="text-amber-600"
            iconBg="bg-amber-50"
            trend={{ value: '2', positive: true }}
          />
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            sub="All-time across customers"
            icon={DollarSign}
            iconColor="text-status-success"
            iconBg="bg-status-success/10"
            trend={{ value: '8.4%', positive: true }}
          />
          <StatCard
            title="Avg. Order Value"
            value={isNaN(stats.avgOrderValue) ? '$0' : formatCurrency(stats.avgOrderValue)}
            sub={`Open invoices: ${stats.openInvoices}`}
            icon={ShoppingCart}
            iconColor="text-status-info"
            iconBg="bg-status-info/10"
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="flex-1 px-8 pb-8">
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, company or email..."
                value={search}
                onChange={handleSearchChange}
                className="w-full pl-9 pr-3 py-2 text-[13px] bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            {/* Status Filters */}
            <div className="flex items-center gap-1.5">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors',
                    statusFilter === s
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background border border-border text-muted-foreground hover:bg-accent'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-1.5 border-l border-border pl-3">
              {TYPE_OPTIONS.map((t) => (
                <button
                  key={t}
                  onClick={() => handleTypeChange(t)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors',
                    typeFilter === t
                      ? 'bg-foreground text-background'
                      : 'bg-background border border-border text-muted-foreground hover:bg-accent'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      Customer <ArrowUpDown size={11} className="opacity-50" />
                    </div>
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Company
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Location
                  </th>
                  <th className="text-right px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="text-right px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Health
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-16 text-[13px] text-muted-foreground">
                      No customers match your filters.
                    </td>
                  </tr>
                ) : (
                  paged.map((customer) => (
                    <tr
                      key={customer.id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      {/* Customer */}
                      <td className="px-5 py-3.5">
                        <Link href={`/customers/${customer.id}`} className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-[13px] flex-shrink-0">
                            {customer.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <div className="text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors">
                              {customer.name}
                            </div>
                            <div className="text-[11.5px] text-muted-foreground">{customer.email}</div>
                          </div>
                        </Link>
                      </td>

                      {/* Company */}
                      <td className="px-4 py-3.5">
                        <div className="text-[13px] text-foreground font-medium">{customer.company}</div>
                        <div className="text-[11.5px] text-muted-foreground">{customer.industry}</div>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3.5">
                        <StatusBadge status={customer.type} size="sm" />
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <StatusBadge status={customer.status} dot />
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
                          <Globe size={12} className="opacity-60" />
                          {customer.city}, {customer.country}
                        </div>
                      </td>

                      {/* Revenue */}
                      <td className="px-4 py-3.5 text-right">
                        <span className="text-[13px] font-semibold text-foreground">
                          {formatCurrency(customer.totalRevenue)}
                        </span>
                      </td>

                      {/* Orders */}
                      <td className="px-4 py-3.5 text-right">
                        <span className="text-[13px] text-foreground">{customer.totalOrders}</span>
                      </td>

                      {/* Health Score */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden w-16">
                            <div
                              className={cn(
                                'h-full rounded-full',
                                customer.healthScore >= 80
                                  ? 'bg-status-success'
                                  : customer.healthScore >= 50
                                  ? 'bg-status-warning'
                                  : 'bg-destructive'
                              )}
                              style={{ width: `${customer.healthScore}%` }}
                            />
                          </div>
                          <span
                            className={cn(
                              'text-[11.5px] font-semibold w-7',
                              customer.healthScore >= 80
                                ? 'text-status-success'
                                : customer.healthScore >= 50
                                ? 'text-status-warning'
                                : 'text-destructive'
                            )}
                          >
                            {customer.healthScore}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/customers/${customer.id}`}
                            className="px-2.5 py-1.5 text-[11.5px] font-medium bg-primary/8 text-primary rounded-md hover:bg-primary/15 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            View
                          </Link>
                          <button className="p-1.5 rounded-md text-muted-foreground hover:bg-accent transition-colors opacity-0 group-hover:opacity-100">
                            <MoreHorizontal size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-border bg-muted/20">
            <p className="text-[12.5px] text-muted-foreground">
              {filtered.length === 0
                ? 'No results'
                : `Showing ${startItem}–${endItem} of ${filtered.length} customers`}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                className="p-1.5 rounded-md border border-border text-muted-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    'w-7 h-7 rounded-md text-[12px] font-medium transition-colors',
                    p === safeCurrentPage
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border text-muted-foreground hover:bg-accent'
                  )}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                className="p-1.5 rounded-md border border-border text-muted-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
