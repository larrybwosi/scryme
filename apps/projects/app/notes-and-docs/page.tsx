"use client";

import Link from "next/link";
import { useState } from "react";
import { FileText, Plus, Search, BookOpen, Clock, Tag } from "lucide-react";

export default function NotesAndDocsPage() {
  const [docs, setDocs] = useState([
    {
      id: "1",
      title: "Sprint 14 Design & Scope Review Notes",
      category: "Meeting Notes",
      author: "Elena Rostova",
      updatedAt: "2h ago",
      snippet: "Key architecture choices for real-time telemetry streaming and state propagation pipeline."
    },
    {
      id: "2",
      title: "RFC-8819: Realtime Memory-Sharded Synchronization Protocol",
      category: "Architecture RFC",
      author: "Arbian Musaf",
      updatedAt: "1d ago",
      snippet: "Low latency WebSocket frame compression and state synchronization across edge worker nodes."
    },
    {
      id: "3",
      title: "WebGL Hardware Buffer Context Lifecycle Standard",
      category: "Engineering Guide",
      author: "Elena Rostova",
      updatedAt: "3d ago",
      snippet: "Memory retention bounds, instanced vertex buffer management, and off-screen canvas disposal."
    }
  ]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2E3039]/50 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span className="text-[#5E6AD2]">Nexus 2.0</span>
            <span>/</span>
            <span className="text-slate-200 font-medium">Notes & Docs</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">
            Technical Documentation & RFCs
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Architecture specs, engineering meeting notes, and technical standards.
          </p>
        </div>

        <Link
          href="/new"
          className="inline-flex items-center gap-1.5 bg-[#5E6AD2] hover:bg-[#717DE3] text-white px-3 py-1.5 rounded-md text-xs font-medium transition-all shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Document</span>
        </Link>
      </div>

      {/* Grid of Documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {docs.map((doc) => (
          <div
            key={doc.id}
            className="bg-[#12141A] border border-[#2E3039] hover:border-[#5E6AD2]/50 rounded-lg p-4 space-y-3 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase bg-[#171922] text-[#5E6AD2] border border-[#2E3039]">
                {doc.category}
              </span>
              <span className="text-[11px] font-mono text-slate-500">{doc.updatedAt}</span>
            </div>

            <Link href="#" className="text-sm font-semibold text-slate-200 group-hover:text-[#5E6AD2] transition-colors block">
              {doc.title}
            </Link>

            <p className="text-xs text-slate-400 leading-relaxed">
              {doc.snippet}
            </p>

            <div className="pt-2 border-t border-[#2E3039]/50 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>Author: {doc.author}</span>
              <span className="text-[#5E6AD2] group-hover:underline">Read Spec →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
