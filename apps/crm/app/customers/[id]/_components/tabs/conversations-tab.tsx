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
  Clock,
} from 'lucide-react';
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
    setIsDialogOpen(false);
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

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-1.5">
              <Plus size={13} />
              Log Conversation
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Log Conversation</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Subject *</label>
                <input
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  placeholder="e.g. Quarterly review call"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Channel</label>
                  <Select
                    value={form.channel}
                    onValueChange={(v) => setForm({ ...form, channel: v as ConversationChannel })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CHANNELS.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Direction</label>
                  <Select
                    value={form.direction}
                    onValueChange={(v) => setForm({ ...form, direction: v as ConversationDirection })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIRECTIONS.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Duration</label>
                  <input
                    value={form.duration}
                    onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                    placeholder="e.g. 25 min"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Summary *</label>
                <textarea
                  value={form.summary}
                  onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                  placeholder="Summarise what was discussed…"
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={!form.subject.trim() || !form.summary.trim()}>
                Save Conversation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

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
