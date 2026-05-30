'use client';

import React, { useState } from 'react';
import { CalendarClock, CheckCircle2, Circle, Clock, Plus, X, AlertTriangle } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
import type { Customer, FollowUp, FollowUpPriority, FollowUpStatus } from '../../../../../lib/mock-data';
import { StatusBadge } from '../../../../../components/ui/status-badge';
import { EmptyState } from '../../../../../components/ui/empty-state';

interface FollowUpsTabProps {
  customer: Customer;
}

function FollowUpCard({
  followUp,
  onComplete,
}: {
  followUp: FollowUp;
  onComplete: (id: string) => void;
}) {
  const isCompleted = followUp.status === 'Completed';
  const isOverdue = followUp.status === 'Overdue';
  const daysUntilDue = Math.ceil(
    (new Date(followUp.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div
      className={cn(
        'bg-card border rounded-xl p-4 transition-opacity',
        isCompleted ? 'border-border opacity-60' : isOverdue ? 'border-destructive/30' : 'border-border'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Complete toggle */}
        <button
          onClick={() => !isCompleted && onComplete(followUp.id)}
          className="mt-0.5 flex-shrink-0"
          aria-label={isCompleted ? 'Completed' : 'Mark as complete'}
          disabled={isCompleted}
        >
          {isCompleted ? (
            <CheckCircle2 size={18} className="text-status-success" />
          ) : (
            <Circle size={18} className="text-muted-foreground hover:text-primary transition-colors" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                'text-[13.5px] font-semibold',
                isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
              )}
            >
              {followUp.title}
            </span>
            <StatusBadge status={followUp.priority} size="sm" />
            <StatusBadge status={followUp.status} size="sm" />
          </div>

          {followUp.description && (
            <p className="text-[12.5px] text-muted-foreground mt-1 leading-relaxed">
              {followUp.description}
            </p>
          )}

          <div className="flex items-center gap-4 mt-3">
            {/* Due date */}
            <div className="flex items-center gap-1.5">
              {isOverdue ? (
                <AlertTriangle size={12} className="text-destructive" />
              ) : (
                <Clock size={12} className="text-muted-foreground" />
              )}
              <span
                className={cn(
                  'text-[11.5px] font-medium',
                  isOverdue ? 'text-destructive' : isCompleted ? 'text-muted-foreground' : daysUntilDue <= 2 ? 'text-status-warning' : 'text-muted-foreground'
                )}
              >
                {isCompleted
                  ? `Completed ${followUp.completedDate ? new Date(followUp.completedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}`
                  : isOverdue
                  ? `Overdue · ${new Date(followUp.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                  : daysUntilDue === 0
                  ? 'Due today'
                  : daysUntilDue === 1
                  ? 'Due tomorrow'
                  : `Due ${new Date(followUp.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                }
              </span>
            </div>

            {/* Assigned to */}
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                {followUp.assignedToInitials}
              </div>
              <span className="text-[11.5px] text-muted-foreground">{followUp.assignedTo}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const PRIORITIES: FollowUpPriority[] = ['High', 'Medium', 'Low'];
const STATUSES: FollowUpStatus[] = ['Pending', 'Completed', 'Overdue', 'Cancelled'];

export function FollowUpsTab({ customer }: FollowUpsTabProps) {
  const [followUps, setFollowUps] = useState<FollowUp[]>(
    [...customer.followUps].sort((a, b) => {
      const order: Record<FollowUpStatus, number> = { Overdue: 0, Pending: 1, Cancelled: 2, Completed: 3 };
      const byStatus = order[a.status] - order[b.status];
      if (byStatus !== 0) return byStatus;
      const priorityOrder: Record<FollowUpPriority, number> = { High: 0, Medium: 1, Low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
  );
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [form, setForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'Medium' as FollowUpPriority,
    assignedTo: 'You',
  });

  const filtered =
    filterStatus === 'All' ? followUps : followUps.filter((f) => f.status === filterStatus);

  const pendingCount = followUps.filter((f) => f.status === 'Pending').length;
  const overdueCount = followUps.filter((f) => f.status === 'Overdue').length;

  const handleComplete = (id: string) => {
    setFollowUps((prev) =>
      prev.map((f) =>
        f.id === id
          ? { ...f, status: 'Completed', completedDate: new Date().toISOString() }
          : f
      )
    );
  };

  const handleAdd = () => {
    if (!form.title.trim() || !form.dueDate) return;
    const fu: FollowUp = {
      id: `fu-new-${Date.now()}`,
      customerId: customer.id,
      title: form.title.trim(),
      description: form.description.trim(),
      dueDate: form.dueDate,
      priority: form.priority,
      status: 'Pending',
      assignedTo: form.assignedTo || 'You',
      assignedToInitials: form.assignedTo
        ? form.assignedTo.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
        : 'YO',
    };
    setFollowUps((prev) => [fu, ...prev]);
    setForm({ title: '', description: '', dueDate: '', priority: 'Medium', assignedTo: 'You' });
    setShowForm(false);
  };

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-[15px] font-bold text-foreground">Follow-ups</h3>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            {pendingCount} pending
            {overdueCount > 0 && (
              <> &middot; <span className="text-destructive font-medium">{overdueCount} overdue</span></>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-2 rounded-lg bg-primary text-white border border-primary hover:bg-primary/90 transition-colors"
        >
          {showForm ? <X size={13} /> : <Plus size={13} />}
          {showForm ? 'Cancel' : 'Add Follow-up'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="mb-5 bg-card border border-primary/30 rounded-xl p-5">
          <h4 className="text-[13px] font-bold text-foreground mb-4">New Follow-up</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Title *</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Send renewal proposal"
                className="w-full text-[13px] bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Due Date *</label>
              <input type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} className="w-full text-[13px] bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Priority</label>
              <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as FollowUpPriority }))} className="w-full text-[13px] bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors">
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Assigned To</label>
              <input value={form.assignedTo} onChange={(e) => setForm((f) => ({ ...f, assignedTo: e.target.value }))} placeholder="Team member name" className="w-full text-[13px] bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors" />
            </div>
            <div className="col-span-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="What needs to happen?"
                rows={2}
                className="w-full text-[13px] bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button onClick={handleAdd} disabled={!form.title.trim() || !form.dueDate} className="text-[12.5px] font-semibold px-5 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Save Follow-up
            </button>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {['All', ...STATUSES].map((s) => (
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
        <EmptyState icon={CalendarClock} title="No follow-ups found" description={filterStatus === 'All' ? 'No follow-ups recorded for this customer.' : `No follow-ups with status "${filterStatus}".`} />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((f) => <FollowUpCard key={f.id} followUp={f} onComplete={handleComplete} />)}
        </div>
      )}
    </div>
  );
}
