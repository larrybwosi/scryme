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
import type {
  Customer,
  Conversation,
  ConversationChannel,
  ConversationDirection,
} from '../../../../../lib/mock-data';
import { StatusBadge } from '../../../../../components/ui/status-badge';
import { EmptyState } from '../../../../../components/ui/empty-state';

interface ConversationsTabProps {
  customer: Customer;
}

function channelIcon(channel: ConversationChannel) {
  switch (channel) {
    case 'Phone': return Phone;
    case 'Email': return Mail;
    case 'Video Call': return Video;
    default: return MessageSquare;
  }
}

function ConversationCard({ convo }: { convo: Conversation }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = channelIcon(convo.channel);

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
            <span className="text-[13.5px] font-semibold text-foreground">{convo.subject}</span>
            <StatusBadge status={convo.channel} size="sm" />
            <span className="flex items-center gap-0.5 text-[10.5px] font-medium text-muted-foreground">
              {convo.direction === 'Inbound' ? (
                <ArrowDownLeft size={11} className="text-status-success" />
              ) : (
                <ArrowUpRight size={11} className="text-blue-500" />
              )}
              {convo.direction}
            </span>
          </div>
          <p className="text-[12px] text-muted-foreground mt-0.5 line-clamp-2">{convo.summary}</p>
        </div>

        {/* Meta */}
        <div className="text-right flex-shrink-0 ml-2">
          <p className="text-[12px] font-medium text-foreground">
            {new Date(convo.date).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            })}
          </p>
          {convo.duration && (
            <div className="flex items-center gap-1 justify-end mt-0.5">
              <Clock size={10} className="text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">{convo.duration}</span>
            </div>
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border bg-muted/30 px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
              {convo.loggedByInitials}
            </div>
            <span className="text-[11.5px] text-muted-foreground">
              Logged by <span className="font-semibold text-foreground">{convo.loggedBy}</span>
            </span>
          </div>
          <p className="text-[13px] text-foreground leading-relaxed">{convo.summary}</p>
        </div>
      )}
    </div>
  );
}

const CHANNELS: ConversationChannel[] = ['Phone', 'Email', 'In-Person', 'Chat', 'Video Call'];
const DIRECTIONS: ConversationDirection[] = ['Inbound', 'Outbound'];

export function ConversationsTab({ customer }: ConversationsTabProps) {
  const [conversations, setConversations] = useState<Conversation[]>(customer.conversations);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    subject: '',
    summary: '',
    channel: 'Phone' as ConversationChannel,
    direction: 'Outbound' as ConversationDirection,
    duration: '',
    date: new Date().toISOString().split('T')[0],
  });

  const handleAdd = () => {
    if (!form.subject.trim() || !form.summary.trim()) return;
    const convo: Conversation = {
      id: `conv-new-${Date.now()}`,
      customerId: customer.id,
      channel: form.channel,
      direction: form.direction,
      date: form.date,
      subject: form.subject.trim(),
      summary: form.summary.trim(),
      loggedBy: 'You',
      loggedByInitials: 'YO',
      duration: form.duration || undefined,
    };
    setConversations((prev) => [convo, ...prev]);
    setForm({ subject: '', summary: '', channel: 'Phone', direction: 'Outbound', duration: '', date: new Date().toISOString().split('T')[0] });
    setShowForm(false);
  };

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-[15px] font-bold text-foreground">Conversations</h3>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            {conversations.length} logged interactions
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
            <div className="col-span-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Subject *</label>
              <input
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder="e.g. Quarterly review call"
                className="w-full text-[13px] bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Channel</label>
              <select value={form.channel} onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value as ConversationChannel }))} className="w-full text-[13px] bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors">
                {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Direction</label>
              <select value={form.direction} onChange={(e) => setForm((f) => ({ ...f, direction: e.target.value as ConversationDirection }))} className="w-full text-[13px] bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors">
                {DIRECTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="w-full text-[13px] bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Duration</label>
              <input value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} placeholder="e.g. 25 min" className="w-full text-[13px] bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors" />
            </div>
            <div className="col-span-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Summary *</label>
              <textarea
                value={form.summary}
                onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                placeholder="Summarise what was discussed…"
                rows={3}
                className="w-full text-[13px] bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button onClick={handleAdd} disabled={!form.subject.trim() || !form.summary.trim()} className="text-[12.5px] font-semibold px-5 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Save Conversation
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {conversations.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No conversations logged" description="Log your first interaction with this customer to build a communication history." />
      ) : (
        <div className="flex flex-col gap-3">
          {conversations.map((c) => <ConversationCard key={c.id} convo={c} />)}
        </div>
      )}
    </div>
  );
}
