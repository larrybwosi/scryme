'use client';

import React, { useState } from 'react';
import { Truck, Package, MapPin, Calendar, Hash, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@repo/ui/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/ui/select';
import { Button } from '@repo/ui/components/ui/button';
import type { Customer, Delivery, DeliveryStatus } from '../../../../../lib/mock-data';
import { StatusBadge } from '../../../../../components/ui/status-badge';
import { EmptyState } from '../../../../../components/ui/empty-state';

interface DeliveriesTabProps {
  customer: Customer;
}

function DeliveryRow({ delivery }: { delivery: Delivery }) {
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
            <span className="text-[13.5px] font-semibold text-foreground">{delivery.orderRef}</span>
            <StatusBadge status={delivery.status} size="sm" />
          </div>
          <p className="text-[12px] text-muted-foreground mt-0.5 truncate">{delivery.items}</p>
        </div>

        {/* Date */}
        <div className="text-right flex-shrink-0">
          <p className="text-[12px] font-medium text-foreground">
            {new Date(delivery.scheduledDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
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
                {delivery.trackingNumber}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Truck size={11} className="text-muted-foreground" />
                <span className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Driver
                </span>
              </div>
              <p className="text-[12.5px] font-medium text-foreground">{delivery.driver}</p>
            </div>
            {delivery.deliveredDate && (
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar size={11} className="text-muted-foreground" />
                  <span className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Delivered
                  </span>
                </div>
                <p className="text-[12.5px] font-medium text-foreground">
                  {new Date(delivery.deliveredDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            )}
            <div className="col-span-2 sm:col-span-3">
              <div className="flex items-center gap-1.5 mb-1">
                <MapPin size={11} className="text-muted-foreground" />
                <span className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Delivery Address
                </span>
              </div>
              <p className="text-[12.5px] text-foreground">{delivery.address}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const DELIVERY_STATUSES: DeliveryStatus[] = ['Pending', 'In Transit', 'Delivered', 'Cancelled', 'Failed'];

export function DeliveriesTab({ customer }: DeliveriesTabProps) {
  const [deliveries, setDeliveries] = useState<Delivery[]>(customer.deliveries);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [form, setForm] = useState({
    orderRef: '',
    items: '',
    address: customer.address + ', ' + customer.city,
    scheduledDate: '',
    driver: '',
    status: 'Pending' as DeliveryStatus,
  });

  const filtered =
    filterStatus === 'All' ? deliveries : deliveries.filter((d) => d.status === filterStatus);

  const handleAdd = () => {
    if (!form.orderRef.trim() || !form.scheduledDate) return;
    const newDelivery: Delivery = {
      id: `del-new-${Date.now()}`,
      customerId: customer.id,
      orderRef: form.orderRef.trim(),
      items: form.items || 'General items',
      address: form.address,
      status: form.status,
      driver: form.driver || 'Unassigned',
      scheduledDate: form.scheduledDate,
      trackingNumber: `TRK${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
    };
    setDeliveries((prev) => [newDelivery, ...prev]);
    setForm({
      orderRef: '',
      items: '',
      address: customer.address + ', ' + customer.city,
      scheduledDate: '',
      driver: '',
      status: 'Pending',
    });
    setIsDialogOpen(false);
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

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-1.5">
              <Plus size={13} />
              Log Delivery
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>New Delivery</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Order Ref *</label>
                  <input
                    value={form.orderRef}
                    onChange={(e) => setForm((f) => ({ ...f, orderRef: e.target.value }))}
                    placeholder="ORD-XXXX"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Driver</label>
                  <input
                    value={form.driver}
                    onChange={(e) => setForm((f) => ({ ...f, driver: e.target.value }))}
                    placeholder="Driver name"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Scheduled Date *</label>
                  <input
                    type="date"
                    value={form.scheduledDate}
                    onChange={(e) => setForm((f) => ({ ...f, scheduledDate: e.target.value }))}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => setForm({ ...form, status: v as DeliveryStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DELIVERY_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Items</label>
                <input
                  value={form.items}
                  onChange={(e) => setForm((f) => ({ ...f, items: e.target.value }))}
                  placeholder="e.g. 2x Widget A, 1x Widget B"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Delivery Address</label>
                <input
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={!form.orderRef.trim() || !form.scheduledDate}>
                Log Delivery
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {['All', ...DELIVERY_STATUSES].map((s) => (
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
            <DeliveryRow key={d.id} delivery={d} />
          ))}
        </div>
      )}
    </div>
  );
}
