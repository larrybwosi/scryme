"use client";

import Link from "next/link";
import React, { useState } from "react";

export default function NotesAndDocsPage() {
  return (
    <div className="flex flex-col w-full pb-16">
<div className="flex flex-col w-full">
{/*  Document Action Header  */}
<header className="w-full flex items-center justify-between pb-space-lg mb-space-lg">
{/*  Breadcrumb & Document State  */}
<div className="flex items-center gap-space-sm min-w-0">
<div className="flex items-center gap-1.5 font-body-sm text-body-sm text-outline truncate">
<span className="hover:text-on-surface transition-colors cursor-pointer">Nexus 2.0 Redesign</span>
<span className="text-outline-variant">/</span>
<span className="hover:text-on-surface transition-colors cursor-pointer">Docs &amp; Notes</span>
<span className="text-outline-variant">/</span>
<span className="text-on-surface font-medium truncate">Sprint 14 Review</span>
</div>
<div className="h-3 w-px bg-surface-container-highest mx-1"></div>
{/*  Live Sync Pill  */}
<div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-surface-container-low text-on-surface-variant font-label-badge text-label-badge">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse"></span>
<span className="text-on-surface">3 active</span>
<div className="flex items-center -space-x-1.5 ml-1">
<div className="w-4 h-4 rounded-full bg-primary-container flex items-center justify-center text-[9px] font-bold text-on-primary-container ring-1 ring-surface">ER</div>
<div className="w-4 h-4 rounded-full bg-secondary-container flex items-center justify-center text-[9px] font-bold text-on-secondary-container ring-1 ring-surface">MK</div>
<div className="w-4 h-4 rounded-full bg-surface-container-high flex items-center justify-center text-[9px] font-bold text-outline ring-1 ring-surface">TL</div>
</div>
</div>
</div>
{/*  Actions Rail  */}
<div className="flex items-center gap-space-sm shrink-0">
<button className="h-7 px-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1.5 font-body-sm text-body-sm" title="Export to Markdown" type="button">
<span className="material-symbols-outlined text-[15px] text-outline">download</span>
<span>Export .md</span>
</button>
<button className="h-7 px-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1.5 font-body-sm text-body-sm" title="Share with Workspace" type="button">
<span className="material-symbols-outlined text-[15px] text-outline">ios_share</span>
<span>Share</span>
</button>
<div className="h-4 w-px bg-surface-container-highest"></div>
{/*  Toggle Right Rail Comments  */}
<button className="h-7 px-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors flex items-center gap-1.5 font-body-sm text-body-sm" id="toggleCommentsBtn" type="button">
<span className="material-symbols-outlined text-[15px] text-primary">chat_bubble</span>
<span>Comments</span>
<span className="px-1 py-0.2 rounded-sm bg-primary-container text-on-primary-container font-label-kbd text-[10px]">3</span>
</button>
</div>
</header>
{/*  Main Canvas: Two-Panel Master Detail Grid  */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start relative">
{/*  Left Document Body (Editor & Reader)  */}
<article className="lg:col-span-8 flex flex-col gap-space-xl">
{/*  Sticky Format & AI Micro-Bar  */}
<div className="sticky top-14 z-30 flex items-center justify-between px-3 py-1.5 rounded-lg bg-surface-container/95 backdrop-blur-md shadow-md">
<div className="flex items-center gap-1">
<button className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container-highest transition-colors" title="Heading 1" type="button">
<span className="material-symbols-outlined text-[16px]">format_h1</span>
</button>
<button className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container-highest transition-colors" title="Heading 2" type="button">
<span className="material-symbols-outlined text-[16px]">format_h2</span>
</button>
<div className="w-px h-3.5 bg-surface-container-highest mx-1"></div>
<button className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container-highest transition-colors" title="Bold (⌘B)" type="button">
<span className="material-symbols-outlined text-[16px]">format_bold</span>
</button>
<button className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container-highest transition-colors" title="Italic (⌘I)" type="button">
<span className="material-symbols-outlined text-[16px]">format_italic</span>
</button>
<button className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container-highest transition-colors" title="Code Block (⌘E)" type="button">
<span className="material-symbols-outlined text-[16px]">code</span>
</button>
<button className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container-highest transition-colors" title="Insert Link (⌘K)" type="button">
<span className="material-symbols-outlined text-[16px]">link</span>
</button>
<button className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container-highest transition-colors" title="Checklist" type="button">
<span className="material-symbols-outlined text-[16px]">check_box</span>
</button>
</div>
<div className="flex items-center gap-1.5">
<button className="px-2 py-0.5 rounded-lg bg-surface-container-highest hover:bg-primary-container text-on-surface hover:text-on-primary-container transition-all flex items-center gap-1 font-label-badge text-label-badge" type="button">
<span className="material-symbols-outlined text-[13px] text-primary">auto_awesome</span>
<span>AI Summarize</span>
</button>
<span className="font-label-kbd text-label-kbd text-outline">Saved</span>
</div>
</div>
{/*  Document Header & Metadata  */}
<section className="flex flex-col gap-space-md">
{/*  Title  */}
<h1 className="font-display-lg text-display-lg text-on-surface tracking-tight">
          Sprint 14 Design &amp; Scope Review Notes
        </h1>
{/*  Meta Line  */}
<div className="flex flex-wrap items-center gap-space-md font-body-sm text-body-sm text-outline">
<div className="flex items-center gap-1.5 text-on-surface">
<div className="w-4 h-4 rounded-full bg-primary-container flex items-center justify-center text-[10px] font-semibold text-on-primary-container">ER</div>
<span className="font-medium">Elena Rostova</span>
</div>
<span>•</span>
<span className="flex items-center gap-1">
<span className="material-symbols-outlined text-[14px]">schedule</span>
            Updated 2 hours ago
          </span>
<span>•</span>
<span>6 min read</span>
<span>•</span>
<span className="text-primary font-label-code text-label-code">REV-2024-S14</span>
</div>
{/*  Tags  */}
<div className="flex flex-wrap items-center gap-1.5 pt-1">
<span className="px-2 py-0.5 rounded-lg bg-surface-container font-label-badge text-label-badge text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer">
            #Nexus-2.0
          </span>
<span className="px-2 py-0.5 rounded-lg bg-surface-container font-label-badge text-label-badge text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer">
            #Architecture
          </span>
<span className="px-2 py-0.5 rounded-lg bg-surface-container font-label-badge text-label-badge text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer">
            #Design-Review
          </span>
<span className="px-2 py-0.5 rounded-lg bg-surface-container-high font-label-badge text-label-badge text-primary flex items-center gap-1">
<span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
            Client Approved
          </span>
</div>
</section>
{/*  Executive Summary (Callout Surface)  */}
<section className="p-space-lg rounded-xl bg-surface-container-low shadow-sm flex flex-col gap-space-sm relative overflow-hidden">
<div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-container"></div>
<div className="flex items-center gap-2 text-primary font-headline-sm text-headline-sm">
<span className="material-symbols-outlined text-[18px]">verified</span>
<span>Executive Summary &amp; Milestone Sign-off</span>
</div>
<p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
          The team concluded the final scope audit for Sprint 14. Key deliverables include the migrated master-detail canvas, sub-16ms layout rendering for boards, and real-time state synchronization via WebSocket channels. Client leadership approved the interaction specification with two revisions regarding offline mutation handling.
        </p>
</section>
{/*  Key Architectural Decisions (Interactive List)  */}
<section className="flex flex-col gap-space-md">
<div className="flex items-center justify-between">
<h2 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
<span className="text-primary font-label-code text-body-sm font-semibold">01</span>
            Key Architecture &amp; Product Decisions
          </h2>
<span className="font-label-badge text-label-badge text-outline">4 of 4 Verified</span>
</div>
<div className="flex flex-col gap-1.5 bg-surface-container-lowest rounded-xl p-space-sm">
{/*  Item 1  */}
<div className="group flex items-start gap-space-md p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container transition-all">
<input defaultChecked={true} className="mt-1 w-3.5 h-3.5 rounded bg-surface-container border-0 accent-primary-container cursor-pointer shrink-0" type="checkbox"/>
<div className="flex flex-col gap-1 min-w-0 flex-1">
<div className="flex items-center justify-between gap-2">
<span className="font-body-md text-body-md text-on-surface font-medium line-through opacity-80">
                  Switch from REST polling to bidirectional STOMP over WebSockets for canvas changes
                </span>
<span className="shrink-0 px-1.5 py-0.5 rounded-lg bg-surface-container-high font-label-badge text-[10px] text-primary">Consensus</span>
</div>
<p className="font-body-sm text-body-sm text-outline">
                Reduces p99 message arrival time from 780ms to &lt;24ms under continuous multi-cursor updates.
              </p>
<div className="flex items-center gap-space-md mt-1">
<div className="flex items-center gap-1 font-body-sm text-[11px] text-outline">
<span className="material-symbols-outlined text-[13px]">person</span>
<span>Liam Chen</span>
</div>
<div className="flex items-center gap-1 font-body-sm text-[11px] text-outline">
<span className="material-symbols-outlined text-[13px]">schedule</span>
<span>Merged in #1042</span>
</div>
</div>
</div>
</div>
{/*  Item 2  */}
<div className="group flex items-start gap-space-md p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container transition-all">
<input defaultChecked={true} className="mt-1 w-3.5 h-3.5 rounded bg-surface-container border-0 accent-primary-container cursor-pointer shrink-0" type="checkbox"/>
<div className="flex flex-col gap-1 min-w-0 flex-1">
<div className="flex items-center justify-between gap-2">
<span className="font-body-md text-body-md text-on-surface font-medium line-through opacity-80">
                  Adopt localized optimistic UI state with rollbacks on 409 Conflict
                </span>
<span className="shrink-0 px-1.5 py-0.5 rounded-lg bg-surface-container-high font-label-badge text-[10px] text-primary">Frontend</span>
</div>
<p className="font-body-sm text-body-sm text-outline">
                Tasks now show instantaneous checkmark responses; conflict queues surface non-blocking toast prompts.
              </p>
<div className="flex items-center gap-space-md mt-1">
<div className="flex items-center gap-1 font-body-sm text-[11px] text-outline">
<span className="material-symbols-outlined text-[13px]">person</span>
<span>Elena Rostova</span>
</div>
<div className="flex items-center gap-1 font-body-sm text-[11px] text-outline">
<span className="material-symbols-outlined text-[13px]">tune</span>
<span>IndexedDB Queue</span>
</div>
</div>
</div>
</div>
{/*  Item 3  */}
<div className="group flex items-start gap-space-md p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container transition-all">
<input defaultChecked={true} className="mt-1 w-3.5 h-3.5 rounded bg-surface-container border-0 accent-primary-container cursor-pointer shrink-0" type="checkbox"/>
<div className="flex flex-col gap-1 min-w-0 flex-1">
<div className="flex items-center justify-between gap-2">
<span className="font-body-md text-body-md text-on-surface font-medium line-through opacity-80">
                  Enforce strict 4px outer radius boundary across cards, badges, and modals
                </span>
<span className="shrink-0 px-1.5 py-0.5 rounded-lg bg-surface-container-high font-label-badge text-[10px] text-outline">Design System</span>
</div>
<p className="font-body-sm text-body-sm text-outline">
                Eliminates visual roundness inconsistencies between web and native macOS client wrappers.
              </p>
<div className="flex items-center gap-space-md mt-1">
<div className="flex items-center gap-1 font-body-sm text-[11px] text-outline">
<span className="material-symbols-outlined text-[13px]">person</span>
<span>Marcus Vance</span>
</div>
</div>
</div>
</div>
{/*  Item 4  */}
<div className="group flex items-start gap-space-md p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container transition-all">
<input defaultChecked={true} className="mt-1 w-3.5 h-3.5 rounded bg-surface-container border-0 accent-primary-container cursor-pointer shrink-0" type="checkbox"/>
<div className="flex flex-col gap-1 min-w-0 flex-1">
<div className="flex items-center justify-between gap-2">
<span className="font-body-md text-body-md text-on-surface font-medium line-through opacity-80">
                  Deprecate legacy Markdown parser in favor of lexical abstract syntax tree
                </span>
<span className="shrink-0 px-1.5 py-0.5 rounded-lg bg-surface-container-high font-label-badge text-[10px] text-primary">Core RFC</span>
</div>
<p className="font-body-sm text-body-sm text-outline">
                Enables inline code playground execution and structured database embeds directly in doc pages.
              </p>
<div className="flex items-center gap-space-md mt-1">
<div className="flex items-center gap-1 font-body-sm text-[11px] text-outline">
<span className="material-symbols-outlined text-[13px]">person</span>
<span>Dev Team</span>
</div>
</div>
</div>
</div>
</div>
</section>
{/*  Architecture RFC & Code Snippet  */}
<section className="flex flex-col gap-space-md">
<h2 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
<span className="text-primary font-label-code text-body-sm font-semibold">02</span>
          RFC: State Propagation Pipeline (STOMP Client)
        </h2>
<p className="font-body-md text-body-md text-on-surface-variant">
          Below is the canonical pipeline contract for registering transient mutations across shared note canvases. Clients acknowledge receipts through sequence monotonicity:
        </p>
{/*  Monospace Code Box  */}
<div className="rounded-xl bg-surface-container-lowest overflow-hidden shadow-sm">
<div className="px-space-md py-2 bg-surface-container-low flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="w-2.5 h-2.5 rounded-full bg-error/70"></span>
<span className="w-2.5 h-2.5 rounded-full bg-outline-variant/70"></span>
<span className="w-2.5 h-2.5 rounded-full bg-primary/70"></span>
<span className="font-label-code text-label-code text-outline ml-2">syncWorker.ts</span>
</div>
<button className="text-outline hover:text-on-surface flex items-center gap-1 font-label-kbd text-label-kbd transition-colors" type="button">
<span className="material-symbols-outlined text-[13px]">content_copy</span>
<span>Copy</span>
</button>
</div>
<pre className="p-space-md font-label-code text-label-code text-on-surface overflow-x-auto leading-relaxed"><code><span className="text-primary-container">interface</span> <span className="text-secondary-fixed">CanvasSyncPacket</span>&lt;T = DocumentDelta&gt; &#123;
  <span className="text-outline">revisionId</span>: <span className="text-primary">number</span>;
  <span className="text-outline">docKey</span>: <span className="text-primary">string</span>;
  <span className="text-outline">originatorSession</span>: <span className="text-primary">string</span>;
  <span className="text-outline">payload</span>: T;
  <span className="text-outline">timestamp</span>: <span className="text-primary">number</span>;
&#125;

<span className="text-primary-container">export async function</span> <span className="text-secondary-fixed">dispatchOptimisticMutation</span>(
  delta: DocumentDelta
): <span className="text-primary">Promise</span>&lt;SyncResult&gt; &#123;
  <span className="text-tertiary-container">// 1. Write immediate transient layer to local IndexedDB store</span>
  <span className="text-primary-container">await</span> localStore.stage(delta);

  <span className="text-tertiary-container">// 2. Transmit through active WebSocket pipe</span>
  <span className="text-primary-container">return</span> socketCluster.send(<span className="text-on-surface-variant">"/nexus/v2/docs/sync"</span>, delta);
&#125;</code></pre>
</div>
{/*  Latency / Ingestion Benchmarks Inline Visual  */}
<div className="p-space-md rounded-xl bg-surface-container-low flex flex-col gap-space-sm">
<div className="flex items-center justify-between text-body-sm font-body-sm">
<span className="text-on-surface font-medium flex items-center gap-1.5">
<span className="material-symbols-outlined text-primary text-[16px]">speed</span>
              Ingestion Latency Distribution (ms)
            </span>
<span className="text-outline font-label-kbd text-label-kbd">N=14,200 events</span>
</div>
{/*  SVG Visual Chart Sparkline / Density Bars  */}
<div className="h-20 w-full flex items-end gap-1.5 pt-2">
<div className="flex-1 bg-surface-container rounded-t flex flex-col justify-end h-[28%] group relative cursor-pointer hover:bg-primary-container transition-colors">
<div className="hidden group-hover:block absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface font-label-kbd text-[10px] whitespace-nowrap">p50: 4.2ms</div>
</div>
<div className="flex-1 bg-surface-container rounded-t flex flex-col justify-end h-[42%] group relative cursor-pointer hover:bg-primary-container transition-colors"></div>
<div className="flex-1 bg-surface-container rounded-t flex flex-col justify-end h-[68%] group relative cursor-pointer hover:bg-primary-container transition-colors"></div>
<div className="flex-1 bg-primary-container rounded-t flex flex-col justify-end h-[94%] group relative cursor-pointer hover:bg-primary transition-colors">
<div className="hidden group-hover:block absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface font-label-kbd text-[10px] whitespace-nowrap">Modal: 11.8ms</div>
</div>
<div className="flex-1 bg-surface-container rounded-t flex flex-col justify-end h-[56%] group relative cursor-pointer hover:bg-primary-container transition-colors"></div>
<div className="flex-1 bg-surface-container rounded-t flex flex-col justify-end h-[34%] group relative cursor-pointer hover:bg-primary-container transition-colors"></div>
<div className="flex-1 bg-surface-container rounded-t flex flex-col justify-end h-[22%] group relative cursor-pointer hover:bg-primary-container transition-colors"></div>
<div className="flex-1 bg-surface-container rounded-t flex flex-col justify-end h-[14%] group relative cursor-pointer hover:bg-primary-container transition-colors"></div>
<div className="flex-1 bg-surface-container rounded-t flex flex-col justify-end h-[9%] group relative cursor-pointer hover:bg-primary-container transition-colors">
<div className="hidden group-hover:block absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface font-label-kbd text-[10px] whitespace-nowrap">p99: 23.4ms</div>
</div>
</div>
<div className="flex justify-between font-label-code text-[11px] text-outline pt-1">
<span>2ms</span>
<span>8ms</span>
<span className="text-primary font-medium">12ms (Target)</span>
<span>20ms</span>
<span>30ms</span>
</div>
</div>
</section>
{/*  Action Items & Assignments Table  */}
<section className="flex flex-col gap-space-md pb-space-xl">
<div className="flex items-center justify-between">
<h2 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
<span className="text-primary font-label-code text-body-sm font-semibold">03</span>
            Sprint Action Items &amp; Ownership
          </h2>
<button className="text-primary hover:text-primary-fixed flex items-center gap-1 font-body-sm text-body-sm font-medium transition-colors" type="button">
<span className="material-symbols-outlined text-[15px]">add</span>
<span>Create Linear Issue</span>
</button>
</div>
<div className="w-full rounded-xl bg-surface-container-lowest overflow-hidden shadow-sm">
<table className="w-full text-left border-collapse font-body-sm text-body-sm">
<thead>
<tr className="bg-surface-container-low text-outline font-label-badge text-[11px] uppercase tracking-wider">
<th className="py-2.5 px-3 font-semibold">Issue Key</th>
<th className="py-2.5 px-3 font-semibold">Task Description</th>
<th className="py-2.5 px-3 font-semibold">Assignee</th>
<th className="py-2.5 px-3 font-semibold">Target</th>
<th className="py-2.5 px-3 font-semibold text-right">Status</th>
</tr>
</thead>
<tbody className="divide-y divide-surface-container text-on-surface-variant">
{/*  Row 1  */}
<tr className="hover:bg-surface-container/50 transition-colors">
<td className="py-2.5 px-3 font-label-code text-label-code text-primary whitespace-nowrap">NEX-412</td>
<td className="py-2.5 px-3 text-on-surface font-medium truncate max-w-[240px]">Wire WebSocket reconnect exponential backoff</td>
<td className="py-2.5 px-3">
<div className="flex items-center gap-1.5">
<div className="w-4 h-4 rounded-full bg-primary-container text-[9px] text-on-primary-container font-bold flex items-center justify-center">LC</div>
<span className="text-on-surface truncate">L. Chen</span>
</div>
</td>
<td className="py-2.5 px-3 text-outline font-label-code text-[11px]">Nov 02</td>
<td className="py-2.5 px-3 text-right">
<span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-surface-container-high text-primary font-label-badge text-[11px]">
<span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    In Progress
                  </span>
</td>
</tr>
{/*  Row 2  */}
<tr className="hover:bg-surface-container/50 transition-colors">
<td className="py-2.5 px-3 font-label-code text-label-code text-primary whitespace-nowrap">NEX-418</td>
<td className="py-2.5 px-3 text-on-surface font-medium truncate max-w-[240px]">Replace legacy drop shadows with matte elevation</td>
<td className="py-2.5 px-3">
<div className="flex items-center gap-1.5">
<div className="w-4 h-4 rounded-full bg-secondary-container text-[9px] text-on-secondary-container font-bold flex items-center justify-center">MV</div>
<span className="text-on-surface truncate">M. Vance</span>
</div>
</td>
<td className="py-2.5 px-3 text-outline font-label-code text-[11px]">Nov 03</td>
<td className="py-2.5 px-3 text-right">
<span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-surface-container-high text-on-surface font-label-badge text-[11px]">
<span className="material-symbols-outlined text-[13px] text-outline">check_circle</span>
                    Ready
                  </span>
</td>
</tr>
{/*  Row 3  */}
<tr className="hover:bg-surface-container/50 transition-colors">
<td className="py-2.5 px-3 font-label-code text-label-code text-primary whitespace-nowrap">NEX-421</td>
<td className="py-2.5 px-3 text-on-surface font-medium truncate max-w-[240px]">Document token contract export pipeline</td>
<td className="py-2.5 px-3">
<div className="flex items-center gap-1.5">
<div className="w-4 h-4 rounded-full bg-tertiary-container text-[9px] text-on-tertiary-container font-bold flex items-center justify-center">ER</div>
<span className="text-on-surface truncate">E. Rostova</span>
</div>
</td>
<td className="py-2.5 px-3 text-outline font-label-code text-[11px]">Nov 04</td>
<td className="py-2.5 px-3 text-right">
<span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-surface-container text-outline font-label-badge text-[11px]">
<span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
                    Todo
                  </span>
</td>
</tr>
{/*  Row 4  */}
<tr className="hover:bg-surface-container/50 transition-colors">
<td className="py-2.5 px-3 font-label-code text-label-code text-primary whitespace-nowrap">NEX-425</td>
<td className="py-2.5 px-3 text-on-surface font-medium truncate max-w-[240px]">Conduct automated a11y &amp; contrast sweep</td>
<td className="py-2.5 px-3">
<div className="flex items-center gap-1.5">
<div className="w-4 h-4 rounded-full bg-surface-container-highest text-[9px] text-on-surface font-bold flex items-center justify-center">TL</div>
<span className="text-on-surface truncate">T. Lin</span>
</div>
</td>
<td className="py-2.5 px-3 text-outline font-label-code text-[11px]">Nov 05</td>
<td className="py-2.5 px-3 text-right">
<span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-surface-container text-outline font-label-badge text-[11px]">
<span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
                    Todo
                  </span>
</td>
</tr>
</tbody>
</table>
</div>
</section>
</article>
{/*  Right Rail: Linear-Themed Threaded Comments Drawer  */}
<aside className="lg:col-span-4 sticky top-14 flex flex-col gap-space-md p-space-md rounded-xl bg-surface-container-low shadow-sm" id="commentsRail">
{/*  Drawer Header  */}
<div className="flex items-center justify-between pb-space-sm border-b border-surface-container-high/60">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-[18px] text-primary">chat</span>
<span className="font-headline-sm text-headline-sm text-on-surface">Threaded Discussion</span>
<span className="px-1.5 py-0.5 rounded bg-surface-container-highest font-label-badge text-[10px] text-outline">3 total</span>
</div>
<div className="flex items-center gap-1">
<button className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container transition-colors" title="Filter unresolved" type="button">
<span className="material-symbols-outlined text-[16px]">filter_list</span>
</button>
<button className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container transition-colors" id="closeDrawerBtn" title="Collapse sidebar" type="button">
<span className="material-symbols-outlined text-[16px]">close</span>
</button>
</div>
</div>
{/*  Comment Thread 1  */}
<div className="flex flex-col gap-2 p-2.5 rounded-lg bg-surface-container-lowest transition-all hover:bg-surface-container">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<div className="w-5 h-5 rounded-full bg-primary-container text-[10px] font-bold text-on-primary-container flex items-center justify-center">LC</div>
<span className="font-body-sm text-body-sm font-medium text-on-surface">Liam Chen</span>
<span className="font-label-badge text-[10px] text-outline">1h ago</span>
</div>
<button className="text-outline hover:text-primary transition-colors text-[11px] font-label-badge flex items-center gap-0.5" type="button">
<span className="material-symbols-outlined text-[13px]">check</span>
            Resolve
          </button>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant leading-normal">
          For the WebSocket reconnect policy, are we capping the maximum exponential backoff interval at 30 seconds or 60 seconds during sustained network partitions?
        </p>
{/*  Reply sub-thread  */}
<div className="mt-1 pl-3 flex flex-col gap-1 border-l-2 border-surface-container-high">
<div className="flex items-center gap-1.5">
<div className="w-4 h-4 rounded-full bg-tertiary-container text-[9px] font-bold text-on-tertiary-container flex items-center justify-center">ER</div>
<span className="font-body-sm text-[11px] font-medium text-on-surface">Elena Rostova</span>
<span className="font-label-badge text-[10px] text-outline">35m ago</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant">
            Capped at 30s. We also trigger immediate probe upon window <code className="px-1 py-0.5 rounded bg-surface-container font-label-code text-[10px] text-primary">focus</code> event.
          </p>
</div>
</div>
{/*  Comment Thread 2  */}
<div className="flex flex-col gap-2 p-2.5 rounded-lg bg-surface-container-lowest transition-all hover:bg-surface-container">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<div className="w-5 h-5 rounded-full bg-secondary-container text-[10px] font-bold text-on-secondary-container flex items-center justify-center">MV</div>
<span className="font-body-sm text-body-sm font-medium text-on-surface">Marcus Vance</span>
<span className="font-label-badge text-[10px] text-outline">18m ago</span>
</div>
<button className="text-outline hover:text-primary transition-colors text-[11px] font-label-badge flex items-center gap-0.5" type="button">
<span className="material-symbols-outlined text-[13px]">check</span>
            Resolve
          </button>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant leading-normal">
          Checked the 4px radii across token exports. All Figma variables have been calibrated to <code className="px-1 py-0.5 rounded bg-surface-container font-label-code text-[10px] text-primary">--radius-sm: 0.25rem</code>.
        </p>
</div>
{/*  Quick Reply Box  */}
<form className="flex flex-col gap-2 mt-1" onSubmit={(e) => e.preventDefault()}>
<div className="relative rounded-lg bg-surface-container-lowest focus-within:ring-1 focus-within:ring-primary-container transition-all">
<textarea className="w-full bg-transparent p-2.5 font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none resize-none" placeholder="Reply to thread or press 'M' to comment..." rows={3}></textarea>
<div className="flex items-center justify-between px-2.5 pb-2">
<div className="flex items-center gap-1 text-outline">
<button className="p-1 hover:text-on-surface transition-colors" title="Mention collaborator (@)" type="button">
<span className="material-symbols-outlined text-[15px]">alternate_email</span>
</button>
<button className="p-1 hover:text-on-surface transition-colors" title="Reference issue (#)" type="button">
<span className="material-symbols-outlined text-[15px]">tag</span>
</button>
<button className="p-1 hover:text-on-surface transition-colors" title="Attach file" type="button">
<span className="material-symbols-outlined text-[15px]">attach_file</span>
</button>
</div>
<button className="h-6 px-2.5 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm flex items-center gap-1 transition-colors" type="submit">
<span>Comment</span>
<span className="font-label-kbd text-label-kbd opacity-80">⌘↵</span>
</button>
</div>
</div>
</form>
{/*  Linked linear tasks context widget  */}
<div className="p-2.5 rounded-lg bg-surface-container-lowest flex flex-col gap-1.5 mt-auto">
<span className="font-label-badge text-label-badge text-outline uppercase tracking-wider">Document References</span>
<div className="flex items-center justify-between text-body-sm font-body-sm text-on-surface">
<span className="truncate">Sprint 14 Milestone Tracker</span>
<span className="font-label-kbd text-label-kbd text-primary">82% done</span>
</div>
<div className="w-full h-1 bg-surface-container rounded-full overflow-hidden">
<div className="h-full bg-primary-container rounded-full" style={{width: "82%"}}></div>
</div>
</div>
</aside>
</div>
</div>

    </div>
  );
}
