'use client';

import React, { useState } from 'react';
import { Receipt, Download, ChevronDown, ChevronUp, Plus, X, AlertCircle } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
import type { Customer, Invoice, InvoiceStatus } from '../../../../../lib/mock-data';
import { formatCurrency } from '../../../../../lib/mock-data';
import { StatusBadge } from '../../../../../components/ui/status-badge';
import { EmptyState } from '../../../../../components/ui/empty-state';

interface InvoicesTabProps {
  customer: Customer;
}

function InvoiceRow({ invoice }: { invoice: Invoice }) {
  const [expanded, setExpanded] = useState(false);
  const balance = invoice.total - invoice.amountPaid;
  const isOverdue = invoice.status === 'Overdue';

  return (
    <div
      className={cn(
        'bg-card border rounded-xl overflow-hidden',
        isOverdue ? 'border-destructive/30' : 'border-border'
      )}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-accent/50 transition-colors"
      >
        {/* Icon */}
        <div
          className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
            isOverdue ? 'bg-destructive/10' : 'bg-primary/10'
          )}
        >
          {isOverdue ? (
            <AlertCircle size={15} className="text-destructive" />
          ) : (
            <Receipt size={15} className="text-primary" />
          )}
        </div>

        {/* Core info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13.5px] font-semibold text-foreground font-mono">
              {invoice.invoiceNumber}
            </span>
            <StatusBadge status={invoice.status} size="sm" />
          </div>
          <p className="text-[12px] text-muted-foreground mt-0.5 truncate">{invoice.items}</p>
        </div>

        {/* Amount */}
        <div className="text-right flex-shrink-0">
          <p className="text-[13.5px] font-bold text-foreground">{formatCurrency(invoice.total)}</p>
          {balance > 0 && invoice.status !== 'Void' && (
            <p className="text-[11px] text-destructive font-medium">
              {formatCurrency(balance)} due
            </p>
          )}
        </div>

        <div className="ml-2 text-muted-foreground">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {/* Expanded */}
      {expanded && (
        <div className="border-t border-border bg-muted/30 px-5 py-4">
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
            <div>
              <p className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Issue Date
              </p>
              <p className="text-[12.5px] text-foreground">
                {new Date(invoice.date).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                })}
              </p>
            </div>
            <div>
              <p className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Due Date
              </p>
              <p className={cn('text-[12.5px]', isOverdue ? 'text-destructive font-semibold' : 'text-foreground')}>
                {new Date(invoice.dueDate).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                })}
              </p>
            </div>
            <div>
              <p className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Subtotal
              </p>
              <p className="text-[12.5px] text-foreground">{formatCurrency(invoice.subtotal)}</p>
            </div>
            <div>
              <p className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Tax
              </p>
              <p className="text-[12.5px] text-foreground">{formatCurrency(invoice.tax)}</p>
            </div>
            <div>
              <p className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Amount Paid
              </p>
              <p className="text-[12.5px] text-status-success font-semibold">
                {formatCurrency(invoice.amountPaid)}
              </p>
            </div>
            <div>
              <p className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Balance Due
              </p>
              <p className={cn('text-[12.5px] font-bold', balance > 0 ? 'text-destructive' : 'text-status-success')}>
                {formatCurrency(balance)}
              </p>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-accent transition-colors">
              <Download size={12} />
              Download PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const INVOICE_STATUSES: InvoiceStatus[] = ['Draft', 'Sent', 'Paid', 'Overdue', 'Void'];

export function InvoicesTab({ customer }: InvoicesTabProps) {
  const [invoices, setInvoices] = useState<Invoice[]>(customer.invoices);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [form, setForm] = useState({
    items: '',
    subtotal: '',
    tax: '',
    date: '',
    dueDate: '',
    status: 'Draft' as InvoiceStatus,
  });

  const filtered =
    filterStatus === 'All' ? invoices : invoices.filter((inv) => inv.status === filterStatus);

  const overdueCount = invoices.filter((inv) => inv.status === 'Overdue').length;
  const totalOpen = invoices
    .filter((inv) => inv.status !== 'Paid' && inv.status !== 'Void')
    .reduce((sum, inv) => sum + (inv.total - inv.amountPaid), 0);

  const handleAdd = () => {
    const sub = parseFloat(form.subtotal) || 0;
    const tax = parseFloat(form.tax) || 0;
    if (!form.items.trim() || !form.date || !form.dueDate) return;
    const inv: Invoice = {
      id: `inv-new-${Date.now()}`,
      customerId: customer.id,
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      date: form.date,
      dueDate: form.dueDate,
      items: form.items.trim(),
      subtotal: sub,
      tax: tax,
      total: sub + tax,
      amountPaid: 0,
      status: form.status,
    };
    setInvoices((prev) => [inv, ...prev]);
    setForm({ items: '', subtotal: '', tax: '', date: '', dueDate: '', status: 'Draft' });
    setShowForm(false);
  };

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-[15px] font-bold text-foreground">Invoices</h3>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            {invoices.length} invoices &middot;{' '}
            <span className="text-destructive font-medium">{overdueCount} overdue</span>
            {totalOpen > 0 && (
              <> &middot; <span className="font-medium">{formatCurrency(totalOpen)} outstanding</span></>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-2 rounded-lg bg-primary text-white border border-primary hover:bg-primary/90 transition-colors"
        >
          {showForm ? <X size={13} /> : <Plus size={13} />}
          {showForm ? 'Cancel' : 'New Invoice'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="mb-5 bg-card border border-primary/30 rounded-xl p-5">
          <h4 className="text-[13px] font-bold text-foreground mb-4">New Invoice</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Line Items / Description *
              </label>
              <input
                value={form.items}
                onChange={(e) => setForm((f) => ({ ...f, items: e.target.value }))}
                placeholder="e.g. 3x Product A, Setup Fee"
                className="w-full text-[13px] bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Subtotal ($)
              </label>
              <input
                type="number"
                value={form.subtotal}
                onChange={(e) => setForm((f) => ({ ...f, subtotal: e.target.value }))}
                placeholder="0.00"
                className="w-full text-[13px] bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Tax ($)
              </label>
              <input
                type="number"
                value={form.tax}
                onChange={(e) => setForm((f) => ({ ...f, tax: e.target.value }))}
                placeholder="0.00"
                className="w-full text-[13px] bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Issue Date *
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full text-[13px] bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Due Date *
              </label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                className="w-full text-[13px] bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as InvoiceStatus }))}
                className="w-full text-[13px] bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors"
              >
                {INVOICE_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={handleAdd}
              disabled={!form.items.trim() || !form.date || !form.dueDate}
              className="text-[12.5px] font-semibold px-5 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Create Invoice
            </button>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {['All', ...INVOICE_STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`text-[11.5px] font-medium px-3 py-1 rounded-full border transition-colors ${
              filterStatus === s
                ? 'bg-primary text-white border-primary'
                : 'bg-background text-muted-foreground border-border hover:border-primary hover:text-foreground'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No invoices found"
          description={
            filterStatus === 'All'
              ? 'No invoices have been created for this customer.'
              : `No invoices with status "${filterStatus}".`
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((inv) => (
            <InvoiceRow key={inv.id} invoice={inv} />
          ))}
        </div>
      )}
    </div>
  );
}
