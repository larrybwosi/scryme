'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  Phone,
  Mail,
  Video,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  X,
  Clock,
} from 'lucide-react';
import { StatusBadge } from '../../../../../components/ui/status-badge';
import { EmptyState } from '../../../../../components/ui/empty-state';
import type { Customer, CrmRecord, CrmActivity, Member } from '@repo/db';
import { createActivity } from '../../../../actions/activities';
import { toast } from 'sonner';
import { formatDate } from '../../../../lib/utils';

interface ConversationsTabProps {
  customer: Customer & {
    crmRecord: (CrmRecord & {
      activities: (CrmActivity & { member: Member | null })[]
    }) | null
  };
}

function channelIcon(channel: string) {
  switch (channel) {
    case 'PHONE': return Phone;
    case 'EMAIL': return Mail;
    case 'VIDEO': return Video;
    default: return MessageSquare;
  }
}

function ConversationCard({ convo }: { convo: CrmActivity & { member: Member | null } }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = channelIcon(convo.type);

  // Extract direction and duration from metadata if available
  const metadata = convo.metadata as any || {};
  const direction = metadata.direction || 'Outbound';
  const duration = metadata.duration;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-accent/50 transition-colors"
      >
        {/* Channel icon */}
        <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon size={14} className="text-muted-foreground" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13.5px] font-semibold text-foreground">{convo.type}</span>
            <StatusBadge status={convo.type} size="sm" />
            <span className="flex items-center gap-0.5 text-[10.5px] font-medium text-muted-foreground">
              {direction === 'Inbound' ? (
                <ArrowDownLeft size={11} className="text-status-success" />
              ) : (
                <ArrowUpRight size={11} className="text-blue-500" />
              )}
              {direction}
            </span>
          </div>
          <p className="text-[12px] text-muted-foreground mt-0.5 line-clamp-2">{convo.description}</p>
        </div>

        {/* Meta */}
        <div className="text-right flex-shrink-0 ml-2">
          <p className="text-[12px] font-medium text-foreground">
            {formatDate(convo.createdAt)}
          </p>
          {duration && (
            <div className="flex items-center gap-1 justify-end mt-0.5">
              <Clock size={10} className="text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">{duration}</span>
            </div>
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border bg-muted/30 px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
              {convo.member?.name?.slice(0, 2).toUpperCase() || 'SYS'}
            </div>
            <span className="text-[11.5px] text-muted-foreground">
              Logged by <span className="font-semibold text-foreground">{convo.member?.name || 'System'}</span>
            </span>
          </div>
          <p className="text-[13px] text-foreground leading-relaxed whitespace-pre-wrap">{convo.description}</p>
        </div>
      )}
    </div>
  );
}

const CHANNELS = [
  { label: 'Phone', value: 'PHONE' },
  { label: 'Email', value: 'EMAIL' },
  { label: 'In-Person', value: 'IN_PERSON' },
  { label: 'Chat', value: 'CHAT' },
  { label: 'Video Call', value: 'VIDEO' },
];
const DIRECTIONS = ['Inbound', 'Outbound'];

export function ConversationsTab({ customer }: ConversationsTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    type: 'PHONE',
    description: '',
    direction: 'Outbound',
    duration: '',
  });

  const activities = customer.crmRecord?.activities || [];

  const handleAdd = async () => {
    if (!form.description.trim() || !customer.crmRecordId) return;

    setLoading(true);
    try {
      await createActivity({
        type: form.type,
        description: form.description.trim(),
        recordId: customer.crmRecordId,
        metadata: {
          direction: form.direction,
          duration: form.duration,
        }
      }, customer.organizationId);

      toast.success('Conversation logged successfully');
      setForm({ type: 'PHONE', description: '', direction: 'Outbound', duration: '' });
      setShowForm(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to log conversation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-[15px] font-bold text-foreground">Conversations</h3>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            {activities.length} logged interactions
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-2 rounded-lg bg-primary text-white border border-primary hover:bg-primary/90 transition-colors"
        >
          {showForm ? <X size={13} /> : <Plus size={13} />}
          {showForm ? 'Cancel' : 'Log Conversation'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="mb-5 bg-card border border-primary/30 rounded-xl p-5">
          <h4 className="text-[13px] font-bold text-foreground mb-4">Log Conversation</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Channel</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="w-full text-[13px] bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors"
              >
                {CHANNELS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Direction</label>
              <select
                value={form.direction}
                onChange={(e) => setForm((f) => ({ ...f, direction: e.target.value }))}
                className="w-full text-[13px] bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors"
              >
                {DIRECTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Duration</label>
              <input
                value={form.duration}
                onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                placeholder="e.g. 25 min"
                className="w-full text-[13px] bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors"
              />
            </div>
            <div className="col-span-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Summary *</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Summarise what was discussed…"
                rows={4}
                className="w-full text-[13px] bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={handleAdd}
              disabled={loading || !form.description.trim()}
              className="text-[12.5px] font-semibold px-5 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : 'Save Conversation'}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {activities.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No conversations logged" description="Log your first interaction with this customer to build a communication history." />
      ) : (
        <div className="flex flex-col gap-3">
          {activities.map((c) => <ConversationCard key={c.id} convo={c} />)}
        </div>
      )}
    </div>
  );
}
