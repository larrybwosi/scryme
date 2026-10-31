"use client";

import React, { useState } from "react";

interface DocumentItem {
  id: string;
  title: string;
  type: "RFC" | "Architecture Spec" | "Release Plan" | "Guide";
  author: string;
  status: "Draft" | "Review" | "Approved" | "Deprecated";
  updatedAt: string;
  summary: string;
}

const DOCUMENTS: DocumentItem[] = [
  {
    id: "RFC-8819",
    title: "Realtime Memory-Sharded Synchronization Protocol",
    type: "RFC",
    author: "Marcus Vance",
    status: "Approved",
    updatedAt: "2 hours ago",
    summary:
      "Specification for memory-mapped buffer pooling across distributed WebSocket workers with STOMP failover routing.",
  },
  {
    id: "SPEC-204",
    title: "Kinetic UI Tokens & Design Variable Contract",
    type: "Architecture Spec",
    author: "Elena Rostova",
    status: "Approved",
    updatedAt: "Yesterday",
    summary:
      "Defines color tokens, typography scales, spacing tokens, and contrast boundary algorithms conforming to Scryme Kinetic Precision.",
  },
  {
    id: "PLAN-14",
    title: "Sprint 14 Release Candidate Verification Plan",
    type: "Release Plan",
    author: "Sarah Chen",
    status: "Review",
    updatedAt: "3 days ago",
    summary:
      "Test matrices, regression test scopes, and deployment validation checklist for the Nexus 2.0 Beta release candidate.",
  },
  {
    id: "RFC-8822",
    title: "Zero-Latency Client State Hydro-Hydration",
    type: "RFC",
    author: "David Kim",
    status: "Draft",
    updatedAt: "5 days ago",
    summary:
      "Proposes instant local optimistic updates with conflict-free replicated data types (CRDTs) on high-frequency board columns.",
  },
];

export function DocsTab() {
  const [docs, setDocs] = useState<DocumentItem[]>(DOCUMENTS);
  const [selectedDocId, setSelectedDocId] = useState<string>("RFC-8819");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const filteredDocs = docs.filter((d) => {
    if (filterType !== "all" && d.type.toLowerCase() !== filterType.toLowerCase()) return false;
    if (search) {
      const q = search.toLowerCase();
      return d.title.toLowerCase().includes(q) || d.id.toLowerCase().includes(q);
    }
    return true;
  });

  const activeDoc = docs.find((d) => d.id === selectedDocId) || docs[0];

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Top Header & Search */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
            Repository Documents & RFCs
          </h2>
          <p className="text-body-sm text-outline">
            PRJ-204 Technical Specifications • {docs.length} Documents
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

          <div className="flex items-center gap-1 bg-surface-container-lowest p-1 rounded-lg border border-outline-variant/30 text-body-sm">
            {["all", "RFC", "Architecture Spec", "Release Plan"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFilterType(t)}
                className={`px-2 py-0.5 rounded text-[11px] font-label-code ${
                  filterType === t
                    ? "bg-surface-container-high text-on-surface font-medium"
                    : "text-outline hover:text-on-surface"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dual Column Layout: Document List (Left) + Document Reader (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left List Rail */}
        <div className="xl:col-span-5 flex flex-col gap-2.5">
          {filteredDocs.map((doc) => {
            const isSelected = doc.id === activeDoc.id;
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
                  <span className="font-label-code text-[11px] text-primary font-semibold">{doc.id}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-label-badge uppercase ${
                      doc.status === "Approved"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : doc.status === "Review"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-surface-container text-outline"
                    }`}
                  >
                    {doc.status}
                  </span>
                </div>
                <h4 className="font-headline-sm text-body-md text-on-surface font-medium line-clamp-1">{doc.title}</h4>
                <p className="text-[12px] text-outline line-clamp-2">{doc.summary}</p>
                <div className="flex items-center justify-between pt-1 border-t border-outline-variant/20 text-[11px] text-outline">
                  <span>{doc.author}</span>
                  <span>{doc.updatedAt}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Document Preview Canvas */}
        <div className="xl:col-span-7 flex flex-col gap-4">
          <div className="p-6 rounded-lg bg-surface-container-low border border-outline-variant/30 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
              <div className="flex items-center gap-2">
                <span className="font-label-code text-body-md text-primary font-bold">{activeDoc.id}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
                <span className="text-[12px] text-outline">{activeDoc.type}</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-label-code text-[11px]">
                {activeDoc.status}
              </span>
            </div>

            <div>
              <h3 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-semibold">
                {activeDoc.title}
              </h3>
              <p className="text-[12px] text-outline mt-1">
                Authored by {activeDoc.author} • Last revision {activeDoc.updatedAt}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-surface-container-lowest border border-outline-variant/20 flex flex-col gap-2">
              <div className="text-[11px] font-label-badge uppercase tracking-wider text-primary">Executive Summary</div>
              <p className="text-body-md text-on-surface-variant leading-relaxed">{activeDoc.summary}</p>
            </div>

            <div className="flex flex-col gap-3 text-body-md text-on-surface leading-relaxed">
              <h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-primary rounded-full"></span>
                Technical Specification Details
              </h4>
              <p className="text-body-sm text-on-surface-variant">
                This specification guarantees deterministic state convergence across all concurrent connected clients. Under high message velocity (exceeding 200 state events/sec), the internal ring buffer drops non-essential cursor updates while preserving transactional board and task transitions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
