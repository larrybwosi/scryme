"use client";

import React, { useState } from "react";
import { StickyNote, User, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import type { CustomerWithRelations } from "@/lib/types";
import { createNote, updateNote, deleteNote } from "@/app/actions/notes";
import { toast } from "sonner";
import { formatDate, getDisplayTime } from "@/lib/utils";

interface NotesTabProps {
  customer: CustomerWithRelations;
}

function NoteCard({
  note,
  onEdit,
  onDelete,
}: {
  note: any;
  onEdit: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(note.content);
  const [loading, setLoading] = useState(false);

  const authorName =
    note.createdBy?.user?.name || note.createdBy?.email || "System";
  const initials = authorName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleUpdate = async () => {
    if (!editedContent.trim()) return;
    setLoading(true);
    try {
      await onEdit(note.id, editedContent.trim());
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update note");
    } finally {
      setLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="relative bg-card rounded-xl border p-4 border-primary/30 shadow-sm">
        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          rows={3}
          className="w-full bg-transparent text-[13.5px] text-foreground placeholder:text-muted-foreground resize-none outline-none leading-relaxed"
          autoFocus
        />
        <div className="flex items-center justify-between pt-3 border-t border-border mt-2">
          <span className="text-[11px] text-muted-foreground">
            {editedContent.length} characters
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsEditing(false);
                setEditedContent(note.content);
              }}
              disabled={loading}
              className="text-[11.5px] font-semibold px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              disabled={loading || !editedContent.trim() || editedContent === note.content}
              className="text-[11.5px] font-semibold px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    );
  }

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
        <div className="flex items-center gap-4">
          <span className="text-[11px] text-muted-foreground">
            {getDisplayTime(note.createdAt, note.updatedAt)}
          </span>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setIsEditing(true)}
              className="text-[11px] text-primary hover:underline font-medium"
            >
              Edit
            </button>
            <span className="text-[11px] text-muted-foreground">·</span>
            <button
              onClick={() => {
                if (confirm("Are you sure you want to delete this note?")) {
                  onDelete(note.id);
                }
              }}
              className="text-[11px] text-destructive hover:underline font-medium"
            >
              Delete
            </button>
          </div>
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
      await createNote({
        content: content.trim(),
        recordId: customer.crmRecordId,
      });

      toast.success("Note added successfully");
      setContent("");
      setShowForm(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to add note");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (id: string, newContent: string) => {
    try {
      await updateNote(id, newContent);
      toast.success("Note updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update note");
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNote(id);
      toast.success("Note deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete note");
    }
  };

  return (
    <div>
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
            <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
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
            <NoteCard key={note.id} note={note} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
