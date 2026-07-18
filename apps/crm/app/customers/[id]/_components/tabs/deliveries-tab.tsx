'use client';

import React, { useState } from 'react';
import { Truck, Package, MapPin, Calendar, Hash, ChevronDown, ChevronUp, Plus, X, CalendarIcon } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import type { CustomerWithRelations } from '@/lib/types';
import { createFulfillmentAction } from '@/app/actions/fulfillments';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
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
import { cn } from '@repo/ui/lib/utils';

interface DeliveriesTabProps {
  customer: CustomerWithRelations;
}

function DeliveryRow({ delivery, transaction }: { delivery: any, transaction: any }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-accent/50 transition-colors"
      >
        {/* Icon */}
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Truck size={15} className="text-primary" />
        </div>

        {/* Core info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13.5px] font-semibold text-foreground">{transaction.number}</span>
            <StatusBadge status={delivery.status} size="sm" />
          </div>
          <p className="text-[12px] text-muted-foreground mt-0.5 truncate">
            {delivery.deliveryNotes || 'No notes'}
          </p>
        </div>

        {/* Date */}
        <div className="text-right flex-shrink-0">
          <p className="text-[12px] font-medium text-foreground">
            {formatDate(delivery.scheduledAt)}
          </p>
          <p className="text-[11px] text-muted-foreground">Scheduled</p>
        </div>

        {/* Expand toggle */}
        <div className="ml-2 text-muted-foreground">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border bg-muted/30 px-5 py-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Hash size={11} className="text-muted-foreground" />
                <span className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Tracking
                </span>
              </div>
              <p className="text-[12.5px] font-medium text-foreground font-mono">
                {delivery.trackingNumber || 'N/A'}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Truck size={11} className="text-muted-foreground" />
                <span className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Carrier
                </span>
              </div>
              <p className="text-[12.5px] font-medium text-foreground">{delivery.carrier || 'Unassigned'}</p>
            </div>
            {delivery.deliveredAt && (
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar size={11} className="text-muted-foreground" />
                  <span className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Delivered
                  </span>
                </div>
                <p className="text-[12.5px] font-medium text-foreground">
                  {formatDate(delivery.deliveredAt)}
                </p>
              </div>
            )}
            <div className="col-span-2 sm:col-span-3">
              <div className="flex items-center gap-1.5 mb-1">
                <MapPin size={11} className="text-muted-foreground" />
                <span className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Notes
                </span>
              </div>
              <p className="text-[12.5px] text-foreground">{delivery.deliveryNotes || 'None'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const FULFILLMENT_TYPES = ['DELIVERY', 'SHIPPING', 'PICKUP', 'IMMEDIATE'];
const FULFILLMENT_STATUSES = ['PENDING', 'PREPARING', 'READY', 'IN_TRANSIT', 'DELIVERED', 'SHIPPED', 'COMPLETED', 'CANCELLED'];

export function DeliveriesTab({ customer }: DeliveriesTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    transactionId: '',
    type: 'DELIVERY' as any,
    status: 'PENDING' as any,
    deliveryNotes: '',
    scheduledAt: new Date().toISOString().split('T')[0],
    carrier: '',
    trackingNumber: '',
  });

  const deliveries = customer.transactions.flatMap(t =>
    t.fulfillments.map(f => ({ ...f, transaction: t }))
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filtered =
    filterStatus === 'All' ? deliveries : deliveries.filter((d) => d.status === filterStatus);

  const handleAdd = async () => {
    if (!form.transactionId || !form.scheduledAt) return;

    setLoading(true);
    const result = await createFulfillmentAction({
      transactionId: form.transactionId,
      type: form.type,
      status: form.status,
      deliveryNotes: form.deliveryNotes,
      carrier: form.carrier,
      trackingNumber: form.trackingNumber,
      scheduledAt: new Date(form.scheduledAt),
    });
    setLoading(false);

    if (result.success) {
      toast.success('Delivery logged successfully');
      setForm({
        transactionId: '',
        type: 'DELIVERY',
        status: 'PENDING',
        deliveryNotes: '',
        scheduledAt: new Date().toISOString().split('T')[0],
        carrier: '',
        trackingNumber: '',
      });
      setShowForm(false);
    } else {
      toast.error(result.error || 'Failed to log delivery');
    }
  };

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-[15px] font-bold text-foreground">Deliveries</h3>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            {deliveries.length} total deliveries
          </p>
        </div>
        <Button
          variant={showForm ? "secondary" : "default"}
          onClick={() => setShowForm((v) => !v)}
          className="h-9 gap-1.5 text-[12.5px] font-semibold px-4 py-2"
        >
          {showForm ? <X size={13} /> : <Plus size={13} />}
          {showForm ? 'Cancel' : 'Log Delivery'}
        </Button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="mb-5 bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
          <h4 className="text-[13px] font-bold text-foreground">New Delivery</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Select Order *
              </label>
              <Select
                value={form.transactionId}
                onValueChange={(val) => setForm((f) => ({ ...f, transactionId: val }))}
              >
                <SelectTrigger className="w-full bg-background h-9">
                  <SelectValue placeholder="Select an order..." />
                </SelectTrigger>
                <SelectContent>
                  {customer.transactions.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.number} - {t.type} ({t.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Type
              </label>
              <Select
                value={form.type}
                onValueChange={(val) => setForm((f) => ({ ...f, type: val as any }))}
              >
                <SelectTrigger className="w-full bg-background h-9">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {FULFILLMENT_TYPES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Status
              </label>
              <Select
                value={form.status}
                onValueChange={(val) => setForm((f) => ({ ...f, status: val as any }))}
              >
                <SelectTrigger className="w-full bg-background h-9">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {FULFILLMENT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Carrier
              </label>
              <input
                value={form.carrier}
                onChange={(e) => setForm((f) => ({ ...f, carrier: e.target.value }))}
                placeholder="e.g. FedEx, DHL"
                className="w-full text-[13px] bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Tracking Number
              </label>
              <input
                value={form.trackingNumber}
                onChange={(e) => setForm((f) => ({ ...f, trackingNumber: e.target.value }))}
                placeholder="TRK-XXXXXXXX"
                className="w-full text-[13px] bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Scheduled Date *
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal text-sm h-9 px-3",
                      !form.scheduledAt && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    {form.scheduledAt ? format(new Date(form.scheduledAt), "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={form.scheduledAt ? new Date(form.scheduledAt) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        const yyyy = date.getFullYear();
                        const mm = String(date.getMonth() + 1).padStart(2, '0');
                        const dd = String(date.getDate()).padStart(2, '0');
                        setForm((f) => ({ ...f, scheduledAt: `${yyyy}-${mm}-${dd}` }));
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="col-span-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Delivery Notes
              </label>
              <textarea
                value={form.deliveryNotes}
                onChange={(e) => setForm((f) => ({ ...f, deliveryNotes: e.target.value }))}
                placeholder="Any special instructions..."
                rows={2}
                className="w-full text-[13px] bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleAdd}
              disabled={loading || !form.transactionId || !form.scheduledAt}
              className="text-[12.5px] font-semibold h-9 px-5"
            >
              {loading ? 'Logging...' : 'Log Delivery'}
            </Button>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {['All', ...FULFILLMENT_STATUSES].map((s) => {
          const isActive = filterStatus === s;
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`text-[11.5px] font-medium px-3 py-1 rounded-full border transition-colors ${
                isActive
                  ? 'bg-primary text-white border-primary'
                  : 'bg-background text-muted-foreground border-border hover:border-primary hover:text-foreground'
              }`}
            >
              {s}
            </button>
          );
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No deliveries found"
          description={
            filterStatus === 'All'
              ? 'No deliveries have been logged for this customer.'
              : `No deliveries with status "${filterStatus}".`
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((d) => (
            <DeliveryRow key={d.id} delivery={d} transaction={(d as any).transaction} />
          ))}
        </div>
      )}
    </div>
  );
}
