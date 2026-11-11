"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { Check, Link2, MessageSquare, User, Clock, Hash, Save, Loader2 } from "lucide-react";
import {
  useProjects,
  useProjectDocuments,
  useCreateProjectDocument,
  useUpdateProjectDocument,
  useMembers,
} from "@/lib/hooks/use-projects";
import { toast } from "sonner";

interface CommentItem {
  id: string;
  author: string;
  avatar: string;
  text: string;
  time: string;
}

export default function NotesAndDocsPage() {
  const { data: projects = [], isLoading: isProjectsLoading } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  const activeProjectId = selectedProjectId || (projects[0]?.id || "");
  const { data: docs = [], isLoading: isDocsLoading } = useProjectDocuments(activeProjectId);
  const { data: members = [] } = useMembers();

  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const activeDoc = docs.find((d) => d.id === selectedDocId) || docs[0];

  const createDocMutation = useCreateProjectDocument(activeProjectId);
  const updateDocMutation = useUpdateProjectDocument(activeProjectId);

  const [docTitle, setDocTitle] = useState("");
  const [docSummary, setDocSummary] = useState("");
  const [docContent, setDocContent] = useState("");
  const [isLiveSync, setIsLiveSync] = useState(true);
  const [showComments, setShowComments] = useState(true);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState("");
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (activeDoc) {
      setSelectedDocId(activeDoc.id);
      setDocTitle(activeDoc.title);
      setDocSummary(activeDoc.summary || "");
      setDocContent(activeDoc.content || "");
    } else {
      setSelectedDocId("");
      setDocTitle("Project RFC & Architecture Notes");
      setDocSummary("Overview of key architectural decisions, goals, and technical specs.");
      setDocContent(
        "## 01 Technical Decisions & Overview\nDocument architecture specifications, RFC notes, and implementation guidelines here.\n\n## 02 Key Deliverables & Action Items\n- Define database migrations and schemas\n- Verify API contracts and client integration\n- Validate permissions and real-time syncing"
      );
    }
  }, [activeDoc?.id, activeDoc?.title, activeDoc?.summary, activeDoc?.content]);

  const handleSaveDocument = async () => {
    if (!docTitle.trim()) {
      toast.error("Document title is required");
      return;
    }
    if (!activeProjectId) {
      toast.error("Please select a project first");
      return;
    }

    try {
      setIsSaving(true);
      if (activeDoc?.id) {
        await updateDocMutation.mutateAsync({
          documentId: activeDoc.id,
          data: {
            title: docTitle.trim(),
            summary: docSummary.trim() || undefined,
            content: docContent.trim() || undefined,
          },
        });
        toast.success("Document saved successfully");
      } else {
        const created = await createDocMutation.mutateAsync({
          title: docTitle.trim(),
          type: "RFC",
          summary: docSummary.trim() || undefined,
          content: docContent.trim() || undefined,
          status: "DRAFT",
        });
        setSelectedDocId(created.id);
        toast.success("New specification created and saved");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to save document");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const currentMember = members[0];
    const authorName = currentMember?.name || "Team Member";
    const authorAvatar =
      currentMember?.avatarUrl ||
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=faces";

    const comment: CommentItem = {
      id: `c-${Date.now()}`,
      author: authorName,
      avatar: authorAvatar,
      text: newComment.trim(),
      time: "Just now",
    };

    setComments((prev) => [...prev, comment]);
    setNewComment("");
    toast.success("Note added to discussion");
  };

  const handleCopyLink = () => {
    setCopied(true);
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
    }
    setTimeout(() => setCopied(false), 2000);
  };

  const activeProject = projects.find((p) => p.id === activeProjectId);

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="flex flex-col w-full">
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 mb-2 border-b border-outline-variant/30">
          <div className="flex flex-wrap items-center gap-3">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-body-sm text-outline">
              <Link href="/projects" className="hover:text-on-surface">
                {activeProject?.name || "Projects"}
              </Link>
              <span>/</span>
              <span>Docs & Notes</span>
              <span>/</span>
              <span className="text-on-surface font-medium truncate max-w-[200px]">
                {docTitle || "Review Notes"}
              </span>
            </nav>

            <button
              type="button"
              onClick={() => setIsLiveSync(!isLiveSync)}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-label-badge font-label-badge transition-colors ${
                isLiveSync
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : "bg-surface-container text-outline"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isLiveSync ? "bg-emerald-400 animate-pulse" : "bg-outline"}`}></span>
              <span>{isLiveSync ? "Live Sync Active" : "Offline Mode"}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {projects.length > 0 && (
              <select
                value={activeProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  setSelectedDocId("");
                }}
                className="h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}

            {docs.length > 0 && (
              <select
                value={activeDoc?.id || ""}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm max-w-[180px]"
              >
                {docs.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={handleSaveDocument}
              disabled={isSaving}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm transition-colors shadow-sm disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              <span>{isSaving ? "Saving..." : "Save Notes"}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm border border-outline-variant/30 transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
              <span>{copied ? "Copied!" : "Copy Link"}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowComments(!showComments)}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg font-body-sm text-body-sm border border-outline-variant/30 transition-colors ${
                showComments
                  ? "bg-primary-container text-on-primary-container"
                  : "bg-surface-container text-on-surface hover:bg-surface-container-high"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Comments ({comments.length})</span>
            </button>
          </div>
        </div>

        {(isProjectsLoading || isDocsLoading) && (
          <div className="py-8 text-center text-outline text-body-sm">
            Loading notes and documents...
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-2">
          <div className={`${showComments ? "lg:col-span-8" : "lg:col-span-12"} flex flex-col gap-6`}>
            <div className="p-6 rounded-lg bg-surface-container-low border border-outline-variant/30 shadow-sm flex flex-col gap-5">
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="Document / RFC Title..."
                className="font-display-lg text-display-lg text-on-surface tracking-tight bg-transparent focus:outline-none border-b border-transparent focus:border-outline-variant/50 pb-1 w-full"
              />

              <div className="flex flex-wrap items-center gap-4 text-[12px] text-outline font-label-code pb-4 border-b border-outline-variant/20">
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  <span>
                    Authored by {activeDoc?.author?.user?.name || members[0]?.name || "Team Member"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    {activeDoc?.updatedAt
                      ? `Updated ${new Date(activeDoc.updatedAt).toLocaleDateString()}`
                      : "Live Document"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5" />
                  <span>{activeDoc?.type || "RFC"} Reference</span>
                </div>
              </div>

              <div>
                <label className="block text-body-sm font-medium text-outline mb-1">Summary</label>
                <input
                  type="text"
                  value={docSummary}
                  onChange={(e) => setDocSummary(e.target.value)}
                  placeholder="Brief summary or abstract of this technical specification..."
                  className="w-full px-3 py-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary-container"
                />
              </div>

              <div>
                <label className="block text-body-sm font-medium text-outline mb-1">Body Content (Markdown)</label>
                <textarea
                  rows={14}
                  value={docContent}
                  onChange={(e) => setDocContent(e.target.value)}
                  placeholder="Document body, architecture specs, decisions, and meeting notes (supports Markdown)..."
                  className="w-full p-4 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary-container font-mono text-xs leading-relaxed"
                />
              </div>
            </div>
          </div>

          {showComments && (
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
                  <h3 className="font-headline-sm text-body-md text-on-surface font-semibold">Threaded Review Notes</h3>
                  <span className="text-[11px] font-label-code text-outline">{comments.length} Comments</span>
                </div>

                <div className="flex flex-col gap-3 max-h-[460px] overflow-y-auto">
                  {comments.length === 0 ? (
                    <div className="p-6 text-center text-outline text-body-sm border border-dashed border-outline-variant/30 rounded-lg">
                      No review comments yet. Start the discussion below.
                    </div>
                  ) : (
                    comments.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 rounded-lg bg-surface-container border border-outline-variant/20 flex flex-col gap-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img src={c.avatar} alt={c.author} className="w-5 h-5 rounded-full object-cover" />
                            <span className="text-body-sm font-medium text-on-surface">{c.author}</span>
                          </div>
                          <span className="text-[10px] text-outline">{c.time}</span>
                        </div>
                        <p className="text-[12px] text-on-surface-variant leading-snug">{c.text}</p>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddComment} className="flex flex-col gap-2 pt-2 border-t border-outline-variant/30">
                  <textarea
                    rows={2}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Leave feedback or RFC note..."
                    className="w-full p-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary-container"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-3 py-1 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm transition-colors"
                    >
                      Post Note
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
