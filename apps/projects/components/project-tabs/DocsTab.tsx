"use client";

import { Input } from "@repo/ui/components/ui/input";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select";
import React, { useState, useRef } from "react";
import { Search, Plus, X, UploadCloud, FileText, Paperclip, Check, Loader2 } from "lucide-react";
import {
  useProjectDocuments,
  useCreateProjectDocument,
  useUploadFile,
} from "@/lib/hooks/use-projects";
import { ProjectDocument } from "@/lib/api";

export function DocsTab({ projectId }: { projectId: string }) {
  const { data: docs = [], isLoading } = useProjectDocuments(projectId);
  const createDocMutation = useCreateProjectDocument(projectId);
  const uploadFileMutation = useUploadFile();

  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<ProjectDocument["type"]>("RFC");
  const [newSummary, setNewSummary] = useState("");
  const [newContent, setNewContent] = useState("");

  const [attachedFiles, setAttachedFiles] = useState<{ id: string; name: string; url: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const markdownInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

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

  const handleImportMarkdown = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        if (!newTitle.trim()) {
          const derivedTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
          setNewTitle(derivedTitle);
        }
        setNewContent((prev) => (prev ? `${prev}\n\n${content}` : content));
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleUploadAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const res = await uploadFileMutation.mutateAsync(file);
      const fileUrl = res.shortUrl || res.url;
      const fileRecord = {
        id: res.id || `att-${Date.now()}`,
        name: file.name,
        url: fileUrl,
      };
      setAttachedFiles((prev) => [...prev, fileRecord]);
      const markdownLink = `\n\n[Attachment: ${file.name}](${fileUrl})`;
      setNewContent((prev) => prev + markdownLink);
    } catch (err) {
      console.error("Failed to upload document attachment:", err);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

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
    setAttachedFiles([]);
    setIsCreateOpen(false);
  };

  return (
    <div className="flex flex-col w-full gap-6">
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
            <Search className="h-3.5 w-3.5" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search specifications..."
              className="h-7 border-0 bg-transparent shadow-none focus-visible:ring-0 font-body-sm text-body-sm text-on-surface placeholder:text-outline w-44 md:w-56"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="h-8 px-3 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>New Document</span>
          </button>
        </div>
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-lg bg-surface-container-low border border-outline-variant/50 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                Create Specification / RFC
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
                  placeholder="e.g. Distributed Telemetry Multiplexing Protocol"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full h-8 bg-surface-container border-outline-variant text-on-surface text-body-sm focus-visible:border-primary-container"
                />
              </div>

              <div>
                <label className="block text-body-sm font-medium text-on-surface mb-1">Type</label>
                <Select value={newType} onValueChange={(val) => setNewType(val as ProjectDocument["type"])}>
                  <SelectTrigger className="w-full h-8 bg-surface-container border-outline-variant text-on-surface text-body-sm">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-container border-outline-variant text-on-surface">
                    <SelectItem value="RFC">RFC</SelectItem>
                    <SelectItem value="SPEC">Architecture Spec</SelectItem>
                    <SelectItem value="PLAN">Release Plan</SelectItem>
                    <SelectItem value="GUIDE">Guide</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-body-sm font-medium text-on-surface mb-1">Summary</label>
                <Input
                  type="text"
                  placeholder="Brief abstract"
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  className="w-full h-8 bg-surface-container border-outline-variant text-on-surface text-body-sm focus-visible:border-primary-container"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-body-sm font-medium text-on-surface">Content (Markdown)</label>
                  <div className="flex items-center gap-2">
                    <input
                      ref={markdownInputRef}
                      type="file"
                      accept=".md,.markdown,.txt"
                      onChange={handleImportMarkdown}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => markdownInputRef.current?.click()}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                    >
                      <FileText className="h-3 w-3" />
                      <span>Import .md/.txt</span>
                    </button>

                    <input
                      ref={attachmentInputRef}
                      type="file"
                      onChange={handleUploadAttachment}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => attachmentInputRef.current?.click()}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline disabled:opacity-50"
                    >
                      {isUploading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <UploadCloud className="h-3 w-3" />
                      )}
                      <span>{isUploading ? "Uploading..." : "Upload File"}</span>
                    </button>
                  </div>
                </div>

                <Textarea
                  rows={5}
                  placeholder="Full document body (Markdown)... Or import from a Markdown/text file."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full p-2.5 bg-surface-container border-outline-variant text-on-surface font-mono text-xs leading-relaxed focus-visible:border-primary-container"
                />
              </div>

              {attachedFiles.length > 0 && (
                <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-surface-container border border-outline-variant/30">
                  <div className="text-[11px] font-label-badge uppercase tracking-wider text-outline flex items-center gap-1">
                    <Paperclip className="h-3 w-3" />
                    <span>Attached Documents ({attachedFiles.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {attachedFiles.map((file) => (
                      <a
                        key={file.id}
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-surface-container-high text-[11px] text-on-surface hover:text-primary transition-colors border border-outline-variant/20"
                      >
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span className="truncate max-w-[200px]">{file.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-body-sm text-outline hover:text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createDocMutation.isPending || isUploading}
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