"use client";

import Link from "next/link";
import React, { useState } from "react";

interface CommentItem {
  id: string;
  author: string;
  avatar: string;
  text: string;
  time: string;
}

export default function NotesAndDocsPage() {
  const [docTitle, setDocTitle] = useState("Sprint 14 Design & Scope Review Notes");
  const [isLiveSync, setIsLiveSync] = useState(true);
  const [showComments, setShowComments] = useState(true);
  const [comments, setComments] = useState<CommentItem[]>([
    {
      id: "c1",
      author: "Marcus Vance",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=faces",
      text: "Can we ensure STOMP heartbeat timeouts are parameterized under experimental flags?",
      time: "2 hours ago",
    },
    {
      id: "c2",
      author: "Sarah Chen",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop&crop=faces",
      text: "Validated that tokens conform to WCAG 2.1 AA 4.5:1 ratio across high-contrast themes.",
      time: "35 mins ago",
    },
  ]);
  const [newComment, setNewComment] = useState("");
  const [copied, setCopied] = useState(false);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment: CommentItem = {
      id: `c-${Date.now()}`,
      author: "Elena Rostova",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=faces",
      text: newComment.trim(),
      time: "Just now",
    };

    setComments([...comments, comment]);
    setNewComment("");
  };

  const handleCopyLink = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="flex flex-col w-full">
        {/* Document Action Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 mb-2 border-b border-outline-variant/30">
          <div className="flex items-center gap-3">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-body-sm text-outline">
              <Link href="/projects" className="hover:text-on-surface">Nexus 2.0 Redesign</Link>
              <span>/</span>
              <span>Docs & Notes</span>
              <span>/</span>
              <span className="text-on-surface font-medium">Sprint 14 Review</span>
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

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm border border-outline-variant/30 transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">
                {copied ? "check" : "link"}
              </span>
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
              <span className="material-symbols-outlined text-[15px]">comment</span>
              <span>Comments ({comments.length})</span>
            </button>
          </div>
        </div>

        {/* Split Canvas: Editor & Comments Rail */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-2">
          {/* Main Document Content Canvas */}
          <div className={`${showComments ? "lg:col-span-8" : "lg:col-span-12"} flex flex-col gap-6`}>
            <div className="p-6 rounded-lg bg-surface-container-low border border-outline-variant/30 shadow-sm flex flex-col gap-6">
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="font-display-lg text-display-lg text-on-surface tracking-tight bg-transparent focus:outline-none border-b border-transparent focus:border-outline-variant/50 pb-1"
              />

              {/* Document Meta Row */}
              <div className="flex flex-wrap items-center gap-4 text-[12px] text-outline font-label-code pb-4 border-b border-outline-variant/20">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px]">person</span>
                  <span>Authored by Elena Rostova</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px]">schedule</span>
                  <span>Updated 12m ago</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px]">tag</span>
                  <span>RFC-8819 Reference</span>
                </div>
              </div>

              {/* Document Body Sections */}
              <div className="flex flex-col gap-4 text-body-lg text-on-surface leading-relaxed">
                <div>
                  <h2 className="font-headline-md text-headline-md text-on-surface font-semibold mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-primary rounded-full"></span>
                    01 Key Architecture & Product Decisions
                  </h2>
                  <p className="text-on-surface-variant text-body-md">
                    The Nexus 2.0 initiative consolidates the real-time collaboration canvas with high-performance WebGL viewports. During Sprint 14, our primary goal is to achieve sub-16ms latency during multi-tenant token synchronization and board state shifts.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-surface-container-lowest border border-outline-variant/20 flex flex-col gap-2">
                  <div className="text-[11px] font-label-badge uppercase tracking-wider text-primary">Decided Pattern</div>
                  <div className="text-body-sm font-medium text-on-surface">STOMP over WebSocket with Fallback HTTP Long-Polling</div>
                  <p className="text-[12px] text-outline">
                    Client applications connect through the V3RealtimeGateway, subscribing to individual project channels (`presence:project:[id]`).
                  </p>
                </div>

                <div>
                  <h2 className="font-headline-md text-headline-md text-on-surface font-semibold mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-secondary rounded-full"></span>
                    02 Sprint Action Items & Ownership
                  </h2>
                  <div className="flex flex-col gap-2 text-body-sm">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[16px]">check_box</span>
                      <span>SCR-104: Finalize interactive real-time telemetry component canvas (Assigned: Elena)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[16px]">check_box</span>
                      <span>SCR-102: Memory-mapped buffer recycling in WebGL viewport (Assigned: Marcus)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-outline text-[16px]">check_box_outline_blank</span>
                      <span>SCR-103: Automated design tokens compiler CLI distribution (Assigned: Sarah)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Rail: Threaded Comments Panel */}
          {showComments && (
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
                  <h3 className="font-headline-sm text-body-md text-on-surface font-semibold">Threaded Review Notes</h3>
                  <span className="text-[11px] font-label-code text-outline">{comments.length} Comments</span>
                </div>

                {/* Comment List */}
                <div className="flex flex-col gap-3 max-h-[460px] overflow-y-auto">
                  {comments.map((c) => (
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
                  ))}
                </div>

                {/* New Comment Input */}
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
                      className="px-3 py-1 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm"
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
