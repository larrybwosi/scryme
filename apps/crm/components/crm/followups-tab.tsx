'use client';

import React, { useState, useEffect } from 'react';
import { CalendarClock, CheckCircle2, Circle, Clock, Plus, X, AlertTriangle, CalendarIcon } from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';
import { Calendar } from '@repo/ui/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/ui/select';
import { format } from 'date-fns';
import { cn } from '@repo/ui/lib/utils';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDate, getDisplayTime } from "@/lib/utils";
import type { CustomerWithRelations } from '@/lib/types';
import { createFollowUp, updateFollowUp } from '@/app/actions/follow-ups';
import { getOrganizationMembers } from '@/app/actions/members';
import { toast } from 'sonner';

interface FollowUpsTabProps {
  customer: CustomerWithRelations;
}

function FollowUpCard({
  followUp,
  onComplete,
  onEdit,
  members,
}: {
  followUp: any;
  onComplete: (id: string) => void;
  onEdit: (id: string, data: any) => Promise<void>;
  members: any[];
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    title: followUp.title,
    description: followUp.description || '',
    dueDate: new Date(followUp.dueDate).toISOString().split('T')[0],
    priority: followUp.priority,
    type: followUp.type,
    assignedToId: followUp.assignedToId || '',
    isRecurring: followUp.isRecurring,
    recurringInterval: followUp.recurringInterval || 'WEEKLY',
  });

  const isCompleted = followUp.status === 'COMPLETED';
  const isOverdue = followUp.status === 'OVERDUE' || (!isCompleted && new Date(followUp.dueDate) < new Date());
  const daysUntilDue = Math.ceil(
    (new Date(followUp.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const assignedToName = followUp.assignedTo?.user?.name || 'Unassigned';
  const assignedToInitials = assignedToName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const handleUpdate = async () => {
    if (!editForm.title.trim()) return;
    setLoading(true);
    try {
      await onEdit(followUp.id, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        dueDate: new Date(editForm.dueDate),
        priority: editForm.priority,
        type: editForm.type,
        assignedToId: editForm.assignedToId || null,
        isRecurring: editForm.isRecurring,
        recurringInterval: editForm.isRecurring ? editForm.recurringInterval : null,
      });
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update follow-up');
    } finally {
      setLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="bg-card rounded-xl border p-5 border-primary/30 shadow-sm space-y-4">
        <h4 className="text-[13px] font-bold text-foreground">Edit Follow-up</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Title *</label>
            <input
              value={editForm.title}
              onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Send renewal proposal"
              className="w-full text-[13px] bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Due Date *</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal text-sm h-9 px-3",
                    !editForm.dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                  {editForm.dueDate ? format(new Date(editForm.dueDate), "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={editForm.dueDate ? new Date(editForm.dueDate) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      const yyyy = date.getFullYear();
                      const mm = String(date.getMonth() + 1).padStart(2, '0');
                      const dd = String(date.getDate()).padStart(2, '0');
                      setEditForm((f) => ({ ...f, dueDate: `${yyyy}-${mm}-${dd}` }));
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Priority</label>
            <Select
              value={editForm.priority}
              onValueChange={(val) => setEditForm((f) => ({ ...f, priority: val as any }))}
            >
              <SelectTrigger className="w-full h-9 bg-background">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Type</label>
            <Select
              value={editForm.type}
              onValueChange={(val) => setEditForm((f) => ({ ...f, type: val as any }))}
            >
              <SelectTrigger className="w-full h-9 bg-background">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CALL">Call</SelectItem>
                <SelectItem value="MEETING">Meeting</SelectItem>
                <SelectItem value="EMAIL">Email</SelectItem>
                <SelectItem value="PREPARATION">Preparation</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 flex items-center justify-between py-1 bg-muted/10 px-3 rounded-lg border border-border">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={editForm.isRecurring}
                  onChange={(e) => setEditForm((f) => ({ ...f, isRecurring: e.target.checked }))}
                  className="sr-only"
                />
                <div className={cn(
                  "w-8 h-4 rounded-full transition-colors",
                  editForm.isRecurring ? "bg-primary" : "bg-muted"
                )} />
                <div className={cn(
                  "absolute left-0.5 w-3 h-3 rounded-full bg-white transition-transform",
                  editForm.isRecurring ? "translate-x-4" : "translate-x-0"
                )} />
              </div>
              <span className="text-[12.5px] font-medium text-foreground group-hover:text-primary transition-colors">Recurring Follow-up</span>
            </label>

            {editForm.isRecurring && (
              <Select
                value={editForm.recurringInterval}
                onValueChange={(val) => setEditForm((f) => ({ ...f, recurringInterval: val }))}
              >
                <SelectTrigger className="w-[120px] h-8 bg-background">
                  <SelectValue placeholder="Select interval" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAILY">Daily</SelectItem>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="col-span-2">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Assigned To</label>
            <Select
              value={editForm.assignedToId || "unassigned"}
              onValueChange={(val) => setEditForm((f) => ({ ...f, assignedToId: val === "unassigned" ? "" : val }))}
            >
              <SelectTrigger className="w-full h-9 bg-background">
                <SelectValue placeholder="Select member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.user.name || m.user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Description</label>
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="What needs to happen?"
              rows={2}
              className="w-full text-[13px] bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors resize-none"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => {
              setIsEditing(false);
              setEditForm({
                title: followUp.title,
                description: followUp.description || '',
                dueDate: new Date(followUp.dueDate).toISOString().split('T')[0],
                priority: followUp.priority,
                type: followUp.type,
                assignedToId: followUp.assignedToId || '',
                isRecurring: followUp.isRecurring,
                recurringInterval: followUp.recurringInterval || 'WEEKLY',
              });
            }}
            className="h-9 px-4 text-[12.5px]"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={loading || !editForm.title.trim()}
            className="text-[12.5px] font-semibold h-9 px-5"
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-card rounded-xl border p-4 transition-opacity group relative',
        isCompleted ? 'border-border opacity-60' : isOverdue ? 'border-destructive/30' : 'border-border'
      )}
    >
      {/* Actions */}
      <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setIsEditing(true)}
          className="text-[11px] text-primary hover:underline font-medium"
        >
          Edit
        </button>
      </div>

      <div className="flex items-start gap-3">
        {/* Complete toggle */}
        <button
          onClick={() => !isCompleted && onComplete(followUp.id)}
          className="mt-0.5 shrink-0"
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
          <div className="flex items-center gap-2 flex-wrap pr-8">
            <span
              className={cn(
                'text-[13.5px] font-semibold',
                isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
              )}
            >
              {followUp.title}
            </span>
            <StatusBadge status={followUp.type} size="sm" />
            <StatusBadge status={followUp.priority} size="sm" />
            <StatusBadge status={followUp.status} size="sm" />
            {followUp.isRecurring && (
              <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase">
                {followUp.recurringInterval}
              </span>
            )}
          </div>

          {followUp.description && (
            <p className="text-[12.5px] text-muted-foreground mt-1 leading-relaxed">
              {followUp.description}
            </p>
          )}

          <div className="flex items-center gap-4 mt-3 flex-wrap">
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
                  ? `Completed ${followUp.completedAt ? formatDate(followUp.completedAt) : ''}`
                  : isOverdue
                  ? `Overdue · ${formatDate(followUp.dueDate)}`
                  : daysUntilDue === 0
                  ? 'Due today'
                  : daysUntilDue === 1
                  ? 'Due tomorrow'
                  : `Due ${formatDate(followUp.dueDate)}`
                }
              </span>
            </div>

            {/* Assigned to */}
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                {assignedToInitials}
              </div>
              <span className="text-[11.5px] text-muted-foreground">{assignedToName}</span>
            </div>

            {/* Created / Updated info */}
            <div className="text-[11px] text-muted-foreground ml-auto shrink-0">
              {getDisplayTime(followUp.createdAt, followUp.updatedAt)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const STATUSES = ['PENDING', 'COMPLETED', 'OVERDUE', 'CANCELLED'];

export function FollowUpsTab({ customer }: FollowUpsTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [members, setMembers] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    priority: 'MEDIUM' as any,
    type: 'OTHER' as any,
    assignedToId: '',
    isRecurring: false,
    recurringInterval: 'WEEKLY',
  });

  useEffect(() => {
    async function fetchMembers() {
      try {
        const data = await getOrganizationMembers();
        setMembers(data);
      } catch (error) {
        console.error('Failed to fetch members', error);
      }
    }
    fetchMembers();
  }, []);

  const followUps = customer.crmRecord?.followUps || [];

  const filtered =
    filterStatus === 'All' ? followUps : followUps.filter((f) => f.status === filterStatus);

  const pendingCount = followUps.filter((f) => f.status === 'PENDING').length;
  const overdueCount = followUps.filter((f) => f.status === 'OVERDUE' || (f.status === 'PENDING' && new Date(f.dueDate) < new Date())).length;

  const handleComplete = async (id: string) => {
    try {
      await updateFollowUp(id, { status: 'COMPLETED' });
      toast.success('Follow-up completed');
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete follow-up');
    }
  };

  const handleEdit = async (id: string, updatedData: any) => {
    try {
      await updateFollowUp(id, updatedData);
      toast.success('Follow-up updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update follow-up');
      throw error;
    }
  };

  const handleAdd = async () => {
    if (!form.title.trim() || !form.dueDate || !customer.crmRecordId) return;

    setLoading(true);
    try {
      await createFollowUp({
        title: form.title.trim(),
        description: form.description.trim(),
        dueDate: new Date(form.dueDate),
        priority: form.priority,
        type: form.type,
        recordId: customer.crmRecordId,
        status: 'PENDING',
        assignedToId: form.assignedToId || null,
        isRecurring: form.isRecurring,
        recurringInterval: form.isRecurring ? form.recurringInterval : null,
      });

      toast.success('Follow-up created');
      setForm({
        title: '',
        description: '',
        dueDate: new Date().toISOString().split('T')[0],
        priority: 'MEDIUM',
        type: 'OTHER',
        assignedToId: '',
        isRecurring: false,
        recurringInterval: 'WEEKLY',
      });
      setShowForm(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create follow-up');
    } finally {
      setLoading(false);
    }
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
        <Button
          variant={showForm ? "secondary" : "default"}
          onClick={() => setShowForm((v) => !v)}
          className="h-9 gap-1.5 text-[12.5px] font-semibold px-4 py-2"
        >
          {showForm ? <X size={13} /> : <Plus size={13} />}
          {showForm ? 'Cancel' : 'Add Follow-up'}
        </Button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="mb-5 bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
          <h4 className="text-[13px] font-bold text-foreground">New Follow-up</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Title *</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Send renewal proposal"
                className="w-full text-[13px] bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Due Date *</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal text-sm h-9 px-3",
                      !form.dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    {form.dueDate ? format(new Date(form.dueDate), "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.dueDate ? new Date(form.dueDate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        const yyyy = date.getFullYear();
                        const mm = String(date.getMonth() + 1).padStart(2, '0');
                        const dd = String(date.getDate()).padStart(2, '0');
                        setForm((f) => ({ ...f, dueDate: `${yyyy}-${mm}-${dd}` }));
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Priority</label>
              <Select
                value={form.priority}
                onValueChange={(val) => setForm((f) => ({ ...f, priority: val as any }))}
              >
                <SelectTrigger className="w-full h-9 bg-background">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Type</label>
              <Select
                value={form.type}
                onValueChange={(val) => setForm((f) => ({ ...f, type: val as any }))}
              >
                <SelectTrigger className="w-full h-9 bg-background">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CALL">Call</SelectItem>
                  <SelectItem value="MEETING">Meeting</SelectItem>
                  <SelectItem value="EMAIL">Email</SelectItem>
                  <SelectItem value="PREPARATION">Preparation</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 flex items-center justify-between py-1 bg-muted/10 px-3 rounded-lg border border-border">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={form.isRecurring}
                    onChange={(e) => setForm((f) => ({ ...f, isRecurring: e.target.checked }))}
                    className="sr-only"
                  />
                  <div className={cn(
                    "w-8 h-4 rounded-full transition-colors",
                    form.isRecurring ? "bg-primary" : "bg-muted"
                  )} />
                  <div className={cn(
                    "absolute left-0.5 w-3 h-3 rounded-full bg-white transition-transform",
                    form.isRecurring ? "translate-x-4" : "translate-x-0"
                  )} />
                </div>
                <span className="text-[12.5px] font-medium text-foreground group-hover:text-primary transition-colors">Recurring Follow-up</span>
              </label>

              {form.isRecurring && (
                <Select
                  value={form.recurringInterval}
                  onValueChange={(val) => setForm((f) => ({ ...f, recurringInterval: val }))}
                >
                  <SelectTrigger className="w-[120px] h-8 bg-background">
                    <SelectValue placeholder="Select interval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">Daily</SelectItem>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="col-span-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Assigned To</label>
              <Select
                value={form.assignedToId || "unassigned"}
                onValueChange={(val) => setForm((f) => ({ ...f, assignedToId: val === "unassigned" ? "" : val }))}
              >
                <SelectTrigger className="w-full h-9 bg-background">
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.user.name || m.user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="What needs to happen?"
                rows={2}
                className="w-full text-[13px] bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleAdd}
              disabled={loading || !form.title.trim() || !form.dueDate}
              className="text-[12.5px] font-semibold h-9 px-5"
            >
              {loading ? 'Saving...' : 'Save Follow-up'}
            </Button>
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
          {filtered.map((f) => <FollowUpCard key={f.id} followUp={f} onComplete={handleComplete} onEdit={handleEdit} members={members} />)}
        </div>
      )}
    </div>
  );
}
