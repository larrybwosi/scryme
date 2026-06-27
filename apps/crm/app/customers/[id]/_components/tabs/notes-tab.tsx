"use client";

import React, { useState } from "react";
import { StickyNote, User, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import type { CustomerWithRelations } from "@/lib/types";
import { createNote } from "@/app/actions/notes";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

interface NotesTabProps {
  customer: CustomerWithRelations;
}

function NoteCard({ note }: { note: any }) {
  const authorName =
    note.createdBy?.user?.name || note.createdBy?.email || "System";
  const initials = authorName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={cn(
        "relative bg-card rounded-xl border p-4 group transition-shadow hover:shadow-sm border-border",
      )}
    >
      <p className="text-[13.5px] text-foreground leading-relaxed whitespace-pre-wrap">
        {note.content}
      </p>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
            {initials}
          </div>
          <span className="text-[11.5px] text-muted-foreground">
            {authorName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">
            {formatDate(note.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function NotesTab({ customer }: NotesTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const notes = customer.crmRecord?.notes || [];

  const handleAdd = async () => {
    if (!content.trim() || !customer.crmRecordId) return;

    setLoading(true);
    try {
      await createNote(
        {
          content: content.trim(),
          recordId: customer.crmRecordId,
        },
        customer.organizationId,
      );

      toast.success("Note added successfully");
      setContent("");
      setShowForm(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to add note");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-[15px] font-bold text-foreground">Notes</h3>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            {notes.length} {notes.length === 1 ? "note" : "notes"} on this
            customer
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-2 rounded-lg border transition-colors",
            showForm
              ? "bg-muted text-muted-foreground border-border"
              : "bg-primary text-white border-primary hover:bg-primary/90",
          )}
        >
          {showForm ? <X size={13} /> : <Plus size={13} />}
          {showForm ? "Cancel" : "Add Note"}
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
                  disabled={loading || !content.trim()}
                  className="text-[12.5px] font-semibold px-4 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Saving..." : "Save Note"}
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
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      )}
    </div>
  );
}
