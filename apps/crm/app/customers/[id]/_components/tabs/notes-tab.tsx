'use client';

import React, { useState } from 'react';
import { Pin, PinOff, StickyNote, User, Plus, X } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
import type { Customer, Note } from '../../../../../lib/mock-data';
import { EmptyState } from '../../../../../components/ui/empty-state';

interface NotesTabProps {
  customer: Customer;
}

function NoteCard({
  note,
  onTogglePin,
}: {
  note: Note;
  onTogglePin: (_id: string) => void;
}) {
  return (
    <div
      className={cn(
        'relative bg-card rounded-xl border p-4 group transition-shadow hover:shadow-sm',
        note.pinned ? 'border-primary/30 bg-primary/[0.02]' : 'border-border'
      )}
    >
      {note.pinned && (
        <div className="absolute top-3 right-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded-md">
            Pinned
          </span>
        </div>
      )}
      <p className="text-[13.5px] text-foreground leading-relaxed whitespace-pre-wrap pr-16">
        {note.content}
      </p>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
            {note.authorInitials}
          </div>
          <span className="text-[11.5px] text-muted-foreground">{note.author}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">
            {new Date(note.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          <button
            onClick={() => onTogglePin(note.id)}
            className="p-1 rounded hover:bg-accent transition-colors opacity-0 group-hover:opacity-100"
            aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
          >
            {note.pinned ? (
              <PinOff size={12} className="text-primary" />
            ) : (
              <Pin size={12} className="text-muted-foreground" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function NotesTab({ customer }: NotesTabProps) {
  const [notes, setNotes] = useState<Note[]>(
    [...customer.notes].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
  );
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');

  const handleTogglePin = (id: string) => {
    setNotes((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n));
      return [...updated].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    });
  };

  const handleAdd = () => {
    if (!content.trim()) return;
    const newNote: Note = {
      id: `note-new-${Date.now()}`,
      customerId: customer.id,
      content: content.trim(),
      author: 'You',
      authorInitials: 'YO',
      createdAt: new Date().toISOString(),
      pinned: false,
    };
    setNotes((prev) => [newNote, ...prev]);
    setContent('');
    setShowForm(false);
  };

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-[15px] font-bold text-foreground">Notes</h3>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            {notes.length} {notes.length === 1 ? 'note' : 'notes'} on this customer
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className={cn(
            'flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-2 rounded-lg border transition-colors',
            showForm
              ? 'bg-muted text-muted-foreground border-border'
              : 'bg-primary text-white border-primary hover:bg-primary/90'
          )}
        >
          {showForm ? <X size={13} /> : <Plus size={13} />}
          {showForm ? 'Cancel' : 'Add Note'}
        </button>
      </div>

      {/* Compose form */}
      {showForm && (
        <div className="mb-5 bg-card border border-primary/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
              <User size={13} className="text-primary" />
            </div>
            <div className="flex-1">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write a note about this customer…"
                rows={4}
                className="w-full bg-transparent text-[13.5px] text-foreground placeholder:text-muted-foreground resize-none outline-none leading-relaxed"
                autoFocus
              />
              <div className="flex items-center justify-between pt-3 border-t border-border mt-2">
                <span className="text-[11px] text-muted-foreground">
                  {content.length} characters
                </span>
                <button
                  onClick={handleAdd}
                  disabled={!content.trim()}
                  className="text-[12.5px] font-semibold px-4 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Save Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notes list */}
      {notes.length === 0 ? (
        <EmptyState
          icon={StickyNote}
          title="No notes yet"
          description="Add your first note to track important details about this customer."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} onTogglePin={handleTogglePin} />
          ))}
        </div>
      )}
    </div>
  );
}
