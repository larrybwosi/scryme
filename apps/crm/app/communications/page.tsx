'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Search,
  CheckCheck,
  Phone,
  Settings,
  Plus,
  Sparkles,
} from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Textarea } from '@repo/ui/components/ui/textarea';
import { Badge } from '@repo/ui/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@repo/ui/components/ui/dialog';
import Link from 'next/link';
import {
  getCommunicationThreads,
  getThreadMessages,
  getWhatsappTemplates,
  sendWhatsappMessage,
} from '@/app/actions/whatsapp';

interface Thread {
  id: string;
  participantPhone: string;
  participantName?: string | null;
  lastMessageAt: string | Date;
  unreadCount: number;
  messages?: Message[];
  crmRecord?: any;
}

interface Message {
  id: string;
  direction: 'INBOUND' | 'OUTBOUND';
  content: string;
  status: string;
  createdAt: string | Date;
  senderMember?: any;
}

interface Template {
  id: string;
  name: string;
  category: string;
  language: string;
  status: string;
}

export default function CommunicationsPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [newRecipientPhone, setNewRecipientPhone] = useState('');
  const [newMessageText, setNewMessageText] = useState('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const fetchThreads = async () => {
    try {
      const res = await getCommunicationThreads();
      if (res.success && res.data) {
        setThreads(res.data as unknown as Thread[]);
      }
    } catch (e) {
      console.error('Failed to fetch threads', e);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await getWhatsappTemplates();
      if (res.success && res.data) {
        setTemplates(res.data as unknown as Template[]);
      }
    } catch (e) {
      console.error('Failed to fetch templates', e);
    }
  };

  useEffect(() => {
    fetchThreads();
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (!activeThreadId) return;
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const res = await getThreadMessages(activeThreadId);
        if (res.success && res.data) {
          setMessages(res.data as unknown as Message[]);
        }
      } catch (e) {
        console.error('Failed to fetch messages', e);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [activeThreadId]);

  const handleSendMessage = async (recipientPhone: string, text: string, templateName?: string) => {
    if (!recipientPhone || (!text && !templateName)) return;

    try {
      const res = await sendWhatsappMessage({
        recipientPhone,
        text,
        templateName: templateName || undefined,
      });

      if (res.success) {
        setReplyText('');
        setNewMessageText('');
        setIsNewModalOpen(false);
        fetchThreads();
        if (activeThreadId) {
          const msgRes = await getThreadMessages(activeThreadId);
          if (msgRes.success && msgRes.data) {
            setMessages(msgRes.data as unknown as Message[]);
          }
        }
      }
    } catch (e) {
      console.error('Failed to send message', e);
    }
  };

  const activeThread = threads.find((t) => t.id === activeThreadId);

  const filteredThreads = threads.filter(
    (t) =>
      t.participantPhone.includes(searchQuery) ||
      (t.participantName && t.participantName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex h-[calc(100vh-60px)] w-full bg-background overflow-hidden">
      {/* Thread List Sidebar */}
      <div className="w-80 border-r border-border flex flex-col shrink-0 bg-card">
        <div className="p-4 border-b border-border flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-emerald-500" />
            <h1 className="font-semibold text-lg">WhatsApp</h1>
          </div>
          <div className="flex items-center gap-1">
            <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
              <DialogTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New WhatsApp Conversation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Recipient Phone Number</label>
                    <Input
                      placeholder="+254712345678"
                      value={newRecipientPhone}
                      onChange={(e) => setNewRecipientPhone(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Message Body</label>
                    <Textarea
                      placeholder="Type your message..."
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => handleSendMessage(newRecipientPhone, newMessageText)}
                  >
                    Send Message
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Link href="/settings/integrations/whatsapp">
              <Button size="icon" variant="ghost" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search phone or contact..."
              className="pl-8 text-xs h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {filteredThreads.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No conversation threads found.
            </div>
          ) : (
            filteredThreads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => setActiveThreadId(thread.id)}
                className={`w-full text-left p-3 flex flex-col gap-1 transition-colors hover:bg-accent/50 ${
                  activeThreadId === thread.id ? 'bg-accent' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm truncate">
                    {thread.participantName || thread.participantPhone}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(thread.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="truncate">{thread.participantPhone}</span>
                  {thread.unreadCount > 0 && (
                    <Badge className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.2">
                      {thread.unreadCount}
                    </Badge>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Conversation Window */}
      {activeThread ? (
        <div className="flex-1 flex flex-col h-full bg-background">
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between bg-card">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-sm">
                {(activeThread.participantName || activeThread.participantPhone).substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-sm">
                  {activeThread.participantName || activeThread.participantPhone}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {activeThread.participantPhone}
                </div>
              </div>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="text-center py-8 text-xs text-muted-foreground">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">No messages in this thread yet.</div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 text-sm space-y-1 ${
                      msg.direction === 'OUTBOUND'
                        ? 'bg-emerald-600 text-white rounded-br-none'
                        : 'bg-card border border-border text-foreground rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <div
                      className={`text-[10px] flex items-center justify-end gap-1 ${
                        msg.direction === 'OUTBOUND' ? 'text-emerald-100' : 'text-muted-foreground'
                      }`}
                    >
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {msg.direction === 'OUTBOUND' && <CheckCheck className="h-3 w-3" />}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Reply Composer */}
          <div className="p-3 border-t border-border bg-card space-y-2">
            {templates.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                  <Sparkles className="h-3 w-3 text-amber-500" /> Templates:
                </span>
                {templates.map((tpl) => (
                  <Button
                    key={tpl.id}
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 shrink-0"
                    onClick={() => {
                      handleSendMessage(activeThread.participantPhone, `[Template: ${tpl.name}]`, tpl.name);
                    }}
                  >
                    {tpl.name}
                  </Button>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Textarea
                placeholder="Type your reply..."
                className="min-h-[44px] max-h-32 text-xs"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white self-end"
                onClick={() => handleSendMessage(activeThread.participantPhone, replyText)}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6">
          <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium">Select a conversation thread to start messaging</p>
          <p className="text-xs">Or click + to start a new WhatsApp chat with a client or supplier</p>
        </div>
      )}
    </div>
  );
}
