"use client";

import React, { useState } from "react";
import {
  useProjectDocuments,
  useCreateProjectDocument,
} from "@/lib/hooks/use-projects";
import { ProjectDocument } from "@/lib/api";

export function DocsTab({ projectId }: { projectId: string }) {
  const { data: docs = [], isLoading } = useProjectDocuments(projectId);
  const createDocMutation = useCreateProjectDocument(projectId);

  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<ProjectDocument["type"]>("RFC");
  const [newSummary, setNewSummary] = useState("");
  const [newContent, setNewContent] = useState("");

  const filteredDocs = docs.filter((d) => {
    if (search) {
      const q = search.toLowerCase();
      return (
        d.title.toLowerCase().includes(q) ||
        (d.summary && d.summary.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const activeDoc = docs.find((d) => d.id === selectedDocId) || docs[0];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !projectId) return;

    const created = await createDocMutation.mutateAsync({
      title: newTitle.trim(),
      type: newType,
      summary: newSummary.trim() || undefined,
      content: newContent.trim() || undefined,
      status: "DRAFT",
    });

    setSelectedDocId(created.id);
    setNewTitle("");
    setNewSummary("");
    setNewContent("");
    setIsCreateOpen(false);
  };

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Top Header & Search */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
            Documents & Architecture RFCs
          </h2>
          <p className="text-body-sm text-outline">
            Technical specifications & proposals ({docs.length})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-low border border-outline-variant/30 text-outline focus-within:text-on-surface">
            <span className="material-symbols-outlined text-[14px]">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search specifications..."
              className="bg-transparent font-body-sm text-body-sm text-on-surface focus:outline-none placeholder:text-outline w-44 md:w-56"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="h-8 px-3 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm flex items-center gap-1.5 shadow-sm transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>New Document</span>
          </button>
        </div>
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-lg bg-surface-container-low border border-outline-variant/50 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Create Specification / RFC</h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="w-6 h-6 rounded flex items-center justify-center text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <form onSubmit={handleCreate} className="flex flex-col gap-4 mt-4">
              <div>
                <label className="block text-body-sm font-medium text-on-surface mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Telemetry Multiplexing Protocol"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full h-8 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary-container"
                />
              </div>
              <div>
                <label className="block text-body-sm font-medium text-on-surface mb-1">Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as ProjectDocument["type"])}
                  className="w-full h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm"
                >
                  <option value="RFC">RFC</option>
                  <option value="SPEC">Architecture Spec</option>
                  <option value="PLAN">Release Plan</option>
                  <option value="GUIDE">Guide</option>
                </select>
              </div>
              <div>
                <label className="block text-body-sm font-medium text-on-surface mb-1">Summary</label>
                <input
                  type="text"
                  placeholder="Brief abstract"
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  className="w-full h-8 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary-container"
                />
              </div>
              <div>
                <label className="block text-body-sm font-medium text-on-surface mb-1">Content</label>
                <textarea
                  rows={4}
                  placeholder="Full document body (Markdown)..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full p-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary-container"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
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

      {isLoading && (
        <div className="p-8 text-center text-outline text-body-sm">
          Loading documents...
        </div>
      )}

      {!isLoading && docs.length === 0 && (
        <div className="p-12 rounded-lg bg-surface-container-low border border-dashed border-outline-variant/30 text-center text-outline text-body-sm">
          No technical documents or RFCs in this project yet.
        </div>
      )}

      {!isLoading && docs.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left List Rail */}
          <div className="xl:col-span-5 flex flex-col gap-2.5">
            {filteredDocs.map((doc) => {
              const isSelected = activeDoc && doc.id === activeDoc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  className={`p-4 rounded-lg border transition-all cursor-pointer flex flex-col gap-2 ${
                    isSelected
                      ? "bg-surface-container-high border-primary-container shadow-sm"
                      : "bg-surface-container-low border-outline-variant/30 hover:bg-surface-container"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-label-code text-[11px] text-primary font-semibold">
                      {doc.type}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-label-badge uppercase ${
                        doc.status === "APPROVED"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : doc.status === "REVIEW"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-surface-container text-outline"
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>
                  <h4 className="font-headline-sm text-body-md text-on-surface font-medium line-clamp-1">{doc.title}</h4>
                  <p className="text-[12px] text-outline line-clamp-2">{doc.summary || doc.content || "No summary"}</p>
                </div>
              );
            })}
          </div>

          {/* Right Document Preview Canvas */}
          {activeDoc && (
            <div className="xl:col-span-7 flex flex-col gap-4">
              <div className="p-6 rounded-lg bg-surface-container-low border border-outline-variant/30 shadow-sm flex flex-col gap-5">
                <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
                  <div className="flex items-center gap-2">
                    <span className="font-label-code text-body-md text-primary font-bold">{activeDoc.type}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
                    <span className="text-[12px] text-outline">{activeDoc.status}</span>
                  </div>
                  <span className="text-[11px] font-label-code text-outline">
                    {new Date(activeDoc.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>

                <div>
                  <h3 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-semibold">
                    {activeDoc.title}
                  </h3>
                </div>

                {activeDoc.summary && (
                  <div className="p-4 rounded-lg bg-surface-container-lowest border border-outline-variant/20 flex flex-col gap-2">
                    <div className="text-[11px] font-label-badge uppercase tracking-wider text-primary">Summary</div>
                    <p className="text-body-md text-on-surface-variant leading-relaxed">{activeDoc.summary}</p>
                  </div>
                )}

                <div className="flex flex-col gap-3 text-body-md text-on-surface leading-relaxed">
                  <h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold flex items-center gap-2">
                    <span className="w-1.5 h-3.5 bg-primary rounded-full"></span>
                    Document Content
                  </h4>
                  <p className="text-body-sm text-on-surface-variant whitespace-pre-wrap">
                    {activeDoc.content || "No extended body content recorded for this document."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
