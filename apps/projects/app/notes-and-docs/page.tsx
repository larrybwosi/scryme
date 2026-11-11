"use client";

import { Input } from "@repo/ui/components/ui/input";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select";
import Link from "next/link";
import React, { useState } from "react";
import { Check, Link2, Plus, X, FileText, User, Calendar, BookOpen, Search, ArrowRight } from "lucide-react";
import { useProjects, useProjectDocuments, useCreateProjectDocument, ProjectDocument } from "@/lib/hooks/use-projects";
import { toast } from "sonner";

export default function NotesAndDocsPage() {
  const { data: projects = [], isLoading: isProjectsLoading } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  const currentProjectId = selectedProjectId || (projects[0]?.id || "");
  const currentProject = projects.find((p) => p.id === currentProjectId);

  const { data: docs = [], isLoading: isDocsLoading, refetch: refetchDocs } = useProjectDocuments(currentProjectId);
  const createDocMutation = useCreateProjectDocument(currentProjectId);

  const [activeDocId, setActiveDocId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  // New Document Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<ProjectDocument["type"]>("RFC");
  const [newSummary, setNewSummary] = useState("");
  const [newContent, setNewContent] = useState("");

  const filteredDocs = docs.filter((d) => {
    const q = search.toLowerCase();
    return d.title.toLowerCase().includes(q) || (d.summary || "").toLowerCase().includes(q);
  });

  const activeDoc = docs.find((d) => d.id === activeDocId) || filteredDocs[0];

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Link copied to clipboard");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !currentProjectId) return;

    try {
      const created = await createDocMutation.mutateAsync({
        title: newTitle.trim(),
        type: newType,
        summary: newSummary.trim() || undefined,
        content: newContent.trim() || undefined,
        status: "DRAFT",
      });

      toast.success("Document created successfully");
      setIsCreateOpen(false);
      setNewTitle("");
      setNewSummary("");
      setNewContent("");
      await refetchDocs();
      if (created?.id) {
        setActiveDocId(created.id);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create document");
    }
  };

  if (isProjectsLoading) {
    return (
      <div className="flex flex-col w-full pb-16 p-8 text-outline text-body-sm">
        Loading projects and specifications...
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[400px] p-8 text-center rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-low">
        <BookOpen className="h-10 w-10 text-outline mb-3" />
        <h2 className="text-body-lg font-semibold text-on-surface">No Projects Available</h2>
        <p className="text-body-sm text-outline max-w-sm mt-1 mb-4">
          Create your first project to start drafting architectural RFCs, specifications, and release guides.
        </p>
        <Link
          href="/new?type=PROJECT"
          className="px-4 py-2 rounded-lg bg-primary-container text-on-primary-container font-headline-sm text-body-sm hover:brightness-110 transition-all inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Project
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="flex flex-col w-full">
        {/* Document Action Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 mb-2 border-b border-outline-variant/30">
          <div className="flex flex-wrap items-center gap-3">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-body-sm text-outline">
              <Link href="/projects" className="hover:text-on-surface">Projects</Link>
              <span>/</span>
              <span className="text-on-surface font-medium">{currentProject?.name || "Select Project"}</span>
              <span>/</span>
              <span className="text-on-surface font-medium">Notes & Docs</span>
            </nav>

            {/* Project Selector */}
            <Select value={currentProjectId} onValueChange={(val) => { setSelectedProjectId(val); setActiveDocId(""); }}>
              <SelectTrigger className="h-8 bg-surface-container border-outline-variant text-on-surface text-body-sm min-w-[160px]">
                <SelectValue placeholder="Select Project" />
              </SelectTrigger>
              <SelectContent className="bg-surface-container border-outline-variant text-on-surface">
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-low border border-outline-variant/30 text-outline focus-within:text-on-surface">
              <Search className="h-3.5 w-3.5" />
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search specs..."
                className="h-6 border-0 bg-transparent shadow-none focus-visible:ring-0 font-body-sm text-body-sm text-on-surface placeholder:text-outline w-36 md:w-48 px-1"
              />
            </div>

            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm border border-outline-variant/30 transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Link2 className="h-3.5 w-3.5" />}
              <span>{copied ? "Copied!" : "Share Link"}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm transition-all shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Document</span>
            </button>
          </div>
        </div>

        {/* Modal: Create Document */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-lg rounded-xl bg-surface-container border border-outline-variant/50 p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Create Document / RFC
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="w-6 h-6 rounded flex items-center justify-center text-outline hover:text-on-surface"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleCreate} className="flex flex-col gap-4 mt-4">
                <div>
                  <label className="block text-body-sm font-medium text-on-surface mb-1">Document Title</label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Distributed Telemetry Protocol Spec"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full h-8 bg-surface-container-high border-outline-variant text-on-surface text-body-sm"
                  />
                </div>
                <div>
                  <label className="block text-body-sm font-medium text-on-surface mb-1">Document Category</label>
                  <Select value={newType} onValueChange={(val) => setNewType(val as ProjectDocument["type"])}>
                    <SelectTrigger className="w-full h-8 bg-surface-container-high border-outline-variant text-on-surface text-body-sm">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-surface-container-high border-outline-variant text-on-surface">
                      <SelectItem value="RFC">RFC (Request for Comments)</SelectItem>
                      <SelectItem value="SPEC">Architecture Specification</SelectItem>
                      <SelectItem value="PLAN">Sprint / Release Plan</SelectItem>
                      <SelectItem value="GUIDE">Technical Guide</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-body-sm font-medium text-on-surface mb-1">Summary Abstract</label>
                  <Input
                    type="text"
                    placeholder="Brief architectural overview or objective"
                    value={newSummary}
                    onChange={(e) => setNewSummary(e.target.value)}
                    className="w-full h-8 bg-surface-container-high border-outline-variant text-on-surface text-body-sm"
                  />
                </div>
                <div>
                  <label className="block text-body-sm font-medium text-on-surface mb-1">Document Body (Markdown)</label>
                  <Textarea
                    rows={5}
                    placeholder="Write detailed specifications, interfaces, and architecture decisions..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full p-2 bg-surface-container-high border-outline-variant text-on-surface text-body-sm"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/30">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-3 py-1.5 rounded-lg text-body-sm text-outline hover:text-on-surface"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createDocMutation.isPending}
                    className="px-4 py-1.5 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm disabled:opacity-50"
                  >
                    {createDocMutation.isPending ? "Creating..." : "Save Document"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Content Section */}
        {isDocsLoading && (
          <div className="p-12 text-center text-outline text-body-sm">
            Loading project specifications and technical notes...
          </div>
        )}

        {!isDocsLoading && docs.length === 0 && (
          <div className="p-12 rounded-xl bg-surface-container-low border border-dashed border-outline-variant/30 text-center flex flex-col items-center justify-center">
            <FileText className="h-10 w-10 text-outline mb-2" />
            <h3 className="text-body-md font-semibold text-on-surface">No documents in this project yet</h3>
            <p className="text-body-sm text-outline max-w-sm mt-1 mb-4">
              Draft architectural specifications, design review notes, or RFCs linked directly to this project.
            </p>
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-primary-container text-on-primary-container font-headline-sm text-body-sm hover:brightness-110 flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create First Document</span>
            </button>
          </div>
        )}

        {!isDocsLoading && docs.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-2">
            {/* Left Documents Rail */}
            <div className="lg:col-span-4 flex flex-col gap-2.5">
              <div className="text-[11px] font-label-badge text-outline uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Documents & Specs ({filteredDocs.length})</span>
                <span>Type</span>
              </div>
              <div className="flex flex-col gap-2 max-h-[750px] overflow-y-auto pr-1">
                {filteredDocs.map((doc) => {
                  const isSelected = activeDoc?.id === doc.id;
                  return (
                    <div
                      key={doc.id}
                      onClick={() => setActiveDocId(doc.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                        isSelected
                          ? "bg-surface-container border-primary-container shadow-sm"
                          : "bg-surface-container-low border-outline-variant/30 hover:bg-surface-container/60 hover:border-outline-variant"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-label-code text-[11px] font-bold text-primary">
                          {doc.type}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-label-badge uppercase ${
                            doc.status === "APPROVED"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : doc.status === "REVIEW"
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-surface-container-high text-outline"
                          }`}
                        >
                          {doc.status}
                        </span>
                      </div>
                      <h4 className="font-headline-sm text-body-md text-on-surface font-semibold line-clamp-1">
                        {doc.title}
                      </h4>
                      <p className="text-[12px] text-outline line-clamp-2">
                        {doc.summary || doc.content || "No abstract available"}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-outline pt-1 mt-1 border-t border-outline-variant/20">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(doc.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                        <span className="text-primary hover:underline flex items-center gap-0.5">
                          Read <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Canvas: Document Inspector & Reading View */}
            {activeDoc && (
              <div className="lg:col-span-8 flex flex-col gap-4">
                <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/30 shadow-sm flex flex-col gap-5">
                  <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
                    <div className="flex items-center gap-2">
                      <span className="font-label-code text-body-md text-primary font-bold">{activeDoc.type}</span>
                      <span className="w-1 h-1 rounded-full bg-outline"></span>
                      <span className="text-xs text-outline uppercase font-mono">{activeDoc.status}</span>
                    </div>
                    <span className="text-xs font-label-code text-outline">
                      Last modified {new Date(activeDoc.updatedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </span>
                  </div>

                  <div>
                    <h2 className="font-display-lg text-display-lg text-on-surface font-bold tracking-tight">
                      {activeDoc.title}
                    </h2>
                  </div>

                  {activeDoc.author && (
                    <div className="flex items-center gap-2 text-xs text-outline pb-2 border-b border-outline-variant/20">
                      <User className="h-3.5 w-3.5 text-primary" />
                      <span>Author: {activeDoc.author.user?.name || "Team Member"}</span>
                    </div>
                  )}

                  {activeDoc.summary && (
                    <div className="p-4 rounded-lg bg-surface-container border border-outline-variant/30 flex flex-col gap-1.5">
                      <div className="text-[11px] font-label-badge uppercase tracking-wider text-primary">Abstract & Scope</div>
                      <p className="text-body-md text-on-surface-variant leading-relaxed">
                        {activeDoc.summary}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 text-body-md text-on-surface leading-relaxed pt-2">
                    <h3 className="font-headline-md text-headline-md text-on-surface font-semibold flex items-center gap-2">
                      <span className="w-1.5 h-4 bg-primary rounded-full"></span>
                      Document Body
                    </h3>
                    <div className="p-4 rounded-lg bg-surface-container-lowest border border-outline-variant/20 font-body-md text-on-surface whitespace-pre-wrap leading-relaxed min-h-[220px]">
                      {activeDoc.content || "No body content provided for this document."}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
