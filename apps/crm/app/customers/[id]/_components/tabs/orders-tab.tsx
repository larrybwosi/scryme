'use client';

import React, { useState } from 'react';
import { ShoppingBag, TrendingUp, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import type { Customer, Order, OrderStatus, OrderChannel } from '../../../../../lib/mock-data';
import { formatCurrency } from '../../../../../lib/mock-data';
import { StatusBadge } from '../../../../../components/ui/status-badge';
import { EmptyState } from '../../../../../components/ui/empty-state';

interface OrdersTabProps {
  customer: Customer;
}

function OrderRow({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-accent/50 transition-colors"
      >
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <ShoppingBag size={15} className="text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13.5px] font-semibold text-foreground font-mono">
              {order.orderNumber}
            </span>
            <StatusBadge status={order.status} size="sm" />
            <StatusBadge status={order.type} size="sm" />
          </div>
          <p className="text-[12px] text-muted-foreground mt-0.5 truncate">{order.items}</p>
        </div>

        <div className="text-right flex-shrink-0">
          <p className="text-[13.5px] font-bold text-foreground">{formatCurrency(order.total)}</p>
          <p className="text-[11px] text-muted-foreground">
            {new Date(order.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>

        <div className="ml-2 text-muted-foreground">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border bg-muted/30 px-5 py-4">
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
            <div>
              <p className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Items Count</p>
              <p className="text-[12.5px] text-foreground">{order.itemCount}</p>
            </div>
            <div>
              <p className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Subtotal</p>
              <p className="text-[12.5px] text-foreground">{formatCurrency(order.subtotal)}</p>
            </div>
            <div>
              <p className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Discount</p>
              <p className="text-[12.5px] text-status-success">
                {order.discount > 0 ? `-${formatCurrency(order.discount)}` : '—'}
              </p>
            </div>
            <div>
              <p className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Tax</p>
              <p className="text-[12.5px] text-foreground">{formatCurrency(order.tax)}</p>
            </div>
            <div>
              <p className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Channel</p>
              <p className="text-[12.5px] text-foreground">{order.channel}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const ORDER_STATUSES: OrderStatus[] = ['Pending', 'Processing', 'Completed', 'Cancelled', 'Refunded'];
const ORDER_CHANNELS: OrderChannel[] = ['POS', 'Online', 'B2B', 'Phone'];

export function OrdersTab({ customer }: OrdersTabProps) {
  const [orders, setOrders] = useState<Order[]>(customer.orders);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [form, setForm] = useState({
    items: '',
    subtotal: '',
    discount: '',
    tax: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Processing' as OrderStatus,
    type: 'Online' as OrderChannel,
  });

  const filtered =
    filterStatus === 'All' ? orders : orders.filter((o) => o.status === filterStatus);

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const completedCount = orders.filter((o) => o.status === 'Completed').length;

  const handleAdd = () => {
    const sub = parseFloat(form.subtotal) || 0;
    const disc = parseFloat(form.discount) || 0;
    const tax = parseFloat(form.tax) || 0;
    if (!form.items.trim() || !form.date) return;
    const order: Order = {
      id: `ord-new-${Date.now()}`,
      customerId: customer.id,
      orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
      type: form.type,
      date: form.date,
      itemCount: form.items.split(',').length,
      items: form.items.trim(),
      subtotal: sub,
      discount: disc,
      tax: tax,
      total: sub - disc + tax,
      status: form.status,
      channel: form.type,
    };
    setOrders((prev) => [order, ...prev]);
    setForm({ items: '', subtotal: '', discount: '', tax: '', date: new Date().toISOString().split('T')[0], status: 'Processing', type: 'Online' });
    setShowForm(false);
  };

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-[15px] font-bold text-foreground">Orders &amp; Sales</h3>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            {orders.length} orders &middot; {completedCount} completed &middot;{' '}
            <span className="font-medium">{formatCurrency(totalRevenue)} total</span>
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-2 rounded-lg bg-primary text-white border border-primary hover:bg-primary/90 transition-colors"
        >
          {showForm ? <X size={13} /> : <Plus size={13} />}
          {showForm ? 'Cancel' : 'New Order'}
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: TrendingUp, color: 'text-primary' },
          { label: 'Completed', value: completedCount.toString(), icon: ShoppingBag, color: 'text-status-success' },
          { label: 'Avg. Order', value: orders.length ? formatCurrency(totalRevenue / orders.length) : '—', icon: TrendingUp, color: 'text-status-info' },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl px-4 py-3">
            <p className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              {s.label}
            </p>
            <p className={`text-[15px] font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="mb-5 bg-card border border-primary/30 rounded-xl p-5">
          <h4 className="text-[13px] font-bold text-foreground mb-4">New Order</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Items *</label>
              <input
                value={form.items}
                onChange={(e) => setForm((f) => ({ ...f, items: e.target.value }))}
                placeholder="e.g. Product A x2, Service B"
                className="w-full text-[13px] bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Subtotal ($)</label>
              <input type="number" value={form.subtotal} onChange={(e) => setForm((f) => ({ ...f, subtotal: e.target.value }))} placeholder="0.00" className="w-full text-[13px] bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Discount ($)</label>
              <input type="number" value={form.discount} onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value }))} placeholder="0.00" className="w-full text-[13px] bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Tax ($)</label>
              <input type="number" value={form.tax} onChange={(e) => setForm((f) => ({ ...f, tax: e.target.value }))} placeholder="0.00" className="w-full text-[13px] bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Date *</label>
              <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="w-full text-[13px] bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Channel</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as OrderChannel }))} className="w-full text-[13px] bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors">
                {ORDER_CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as OrderStatus }))} className="w-full text-[13px] bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors">
                {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button onClick={handleAdd} disabled={!form.items.trim() || !form.date} className="text-[12.5px] font-semibold px-5 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Create Order
            </button>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {['All', ...ORDER_STATUSES].map((s) => (
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
        <EmptyState icon={ShoppingBag} title="No orders found" description={filterStatus === 'All' ? 'No orders placed by this customer yet.' : `No orders with status "${filterStatus}".`} />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((o) => <OrderRow key={o.id} order={o} />)}
        </div>
      )}
    </div>
  );
}
