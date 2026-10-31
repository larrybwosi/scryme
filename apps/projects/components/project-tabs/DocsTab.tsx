"use client";

import Link from "next/link";
import React, { useState } from "react";

export function DocsTab() {
  return (
    <div className="flex flex-col w-full">
<div className="flex flex-col w-full pb-16">
{/*  Top Ambient Glow  */}
<div className="relative w-full h-0">
<div className="absolute -top-12 left-1/4 w-96 h-48 bg-primary-container/10 blur-[100px] pointer-events-none rounded-full"></div>
<div className="absolute -top-12 right-1/4 w-80 h-36 bg-secondary-container/15 blur-[90px] pointer-events-none rounded-full"></div>
</div>
{/*  Project Header Section  */}
<header className="flex flex-col gap-space-lg pt-4 pb-space-lg border-b border-outline-variant/20">
<div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
{/*  Breadcrumbs & Identity  */}
<div className="flex flex-col gap-1">
<nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-body-sm font-body-sm text-outline">
<span className="hover:text-on-surface transition-colors cursor-pointer">Projects</span>
<span className="text-outline-variant">/</span>
<span className="font-label-code text-label-code text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer">PRJ-204</span>
<span className="text-outline-variant">/</span>
<span className="text-on-surface font-medium">Nexus 2.0 Redesign</span>
</nav>
<div className="flex flex-wrap items-center gap-space-md mt-1">
<h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Nexus 2.0 Redesign</h1>
<div className="flex items-center gap-2">
<span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-surface-container-high border border-outline-variant/40 text-[11px] font-label-badge text-on-surface">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse"></span>
              Live Pipeline
            </span>
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface-container border border-outline-variant/30 text-[11px] font-label-badge text-on-surface-variant">
<span className="material-symbols-outlined text-[13px] text-error">priority_high</span>
              High Priority
            </span>
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface-container border border-outline-variant/30 text-[11px] font-label-badge text-outline">
<span className="material-symbols-outlined text-[13px]">calendar_today</span>
              Oct 29, 2024
            </span>
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface-container-high border border-outline-variant/40 text-[11px] font-label-badge text-primary font-medium">
<span className="material-symbols-outlined text-[13px]">vital_signs</span>
              94% Health
            </span>
</div>
</div>
</div>
{/*  Action Buttons  */}
<div className="flex items-center gap-2 self-start md:self-auto">
<button className="h-8 px-2.5 rounded-lg bg-surface-container border border-outline-variant/30 hover:bg-surface-container-high hover:border-outline text-on-surface-variant hover:text-on-surface text-body-sm font-body-sm flex items-center gap-1.5 transition-all" type="button">
<span className="material-symbols-outlined text-[15px]">share</span>
<span>Share</span>
</button>
<button className="h-8 px-2.5 rounded-lg bg-surface-container border border-outline-variant/30 hover:bg-surface-container-high hover:border-outline text-on-surface-variant hover:text-on-surface text-body-sm font-body-sm flex items-center gap-1.5 transition-all" id="copyUrlBtn" type="button">
<span className="material-symbols-outlined text-[15px]">link</span>
<span id="copyUrlText">Copy URL</span>
</button>
<button className="h-8 px-2.5 rounded-lg bg-surface-container border border-outline-variant/30 hover:bg-surface-container-high hover:border-outline text-on-surface-variant hover:text-on-surface text-body-sm font-body-sm flex items-center gap-1.5 transition-all" type="button">
<span className="material-symbols-outlined text-[15px]">edit_note</span>
<span>Edit Spec</span>
</button>
<button className="h-8 px-3 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container text-body-sm font-headline-sm flex items-center gap-1.5 shadow-sm transition-all" type="button">
<span className="material-symbols-outlined text-[16px]">add</span>
<span>New Issue</span>
</button>
</div>
</div>
{/*  Project Metrics KPI Summary Strip  */}
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
{/*  Metric 1  */}
<div className="flex flex-col p-3 rounded-lg bg-surface-container-low border border-outline-variant/30 hover:border-outline/50 transition-colors">
<div className="flex items-center justify-between text-outline">
<span className="text-[11px] font-label-badge uppercase tracking-wider">Execution State</span>
<span className="material-symbols-outlined text-[14px]">insights</span>
</div>
<div className="flex items-baseline gap-2 mt-1.5">
<span className="font-headline-md text-headline-md text-on-surface">68%</span>
<span className="font-label-code text-body-sm text-primary">+4.2%</span>
</div>
<div className="w-full bg-surface-container-highest h-1 rounded-full mt-2 overflow-hidden">
<div className="bg-primary-container h-full rounded-full" style={{width: "68%"}}></div>
</div>
</div>
{/*  Metric 2  */}
<div className="flex flex-col p-3 rounded-lg bg-surface-container-low border border-outline-variant/30 hover:border-outline/50 transition-colors">
<div className="flex items-center justify-between text-outline">
<span className="text-[11px] font-label-badge uppercase tracking-wider">Active Sprint</span>
<span className="material-symbols-outlined text-[14px]">cached</span>
</div>
<div className="flex items-baseline gap-2 mt-1.5">
<span className="font-headline-md text-headline-md text-on-surface">Sprint 14</span>
<span className="font-body-sm text-body-sm text-outline">4d left</span>
</div>
<div className="text-[11px] font-label-code text-on-surface-variant mt-2 flex items-center gap-1">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
          28/41 points closed
        </div>
</div>
{/*  Metric 3  */}
<div className="flex flex-col p-3 rounded-lg bg-surface-container-low border border-outline-variant/30 hover:border-outline/50 transition-colors">
<div className="flex items-center justify-between text-outline">
<span className="text-[11px] font-label-badge uppercase tracking-wider">Hours Logged</span>
<span className="material-symbols-outlined text-[14px]">timer</span>
</div>
<div className="flex items-baseline gap-2 mt-1.5">
<span className="font-headline-md text-headline-md text-on-surface">142h</span>
<span className="font-body-sm text-body-sm text-outline font-label-code">/ 180h target</span>
</div>
<div className="text-[11px] font-label-code text-primary mt-2 flex items-center gap-1">
<span className="material-symbols-outlined text-[12px]">trending_up</span>
          Pacing on schedule
        </div>
</div>
{/*  Metric 4  */}
<div className="flex flex-col p-3 rounded-lg bg-surface-container-low border border-outline-variant/30 hover:border-outline/50 transition-colors">
<div className="flex items-center justify-between text-outline">
<span className="text-[11px] font-label-badge uppercase tracking-wider">Cap Utilization</span>
<span className="material-symbols-outlined text-[14px]">account_balance_wallet</span>
</div>
<div className="flex items-baseline gap-2 mt-1.5">
<span className="font-headline-md text-headline-md text-on-surface font-label-code">$19,880</span>
<span className="font-body-sm text-body-sm text-outline">79.5%</span>
</div>
<div className="w-full bg-surface-container-highest h-1 rounded-full mt-2 overflow-hidden">
<div className="bg-secondary h-full rounded-full" style={{width: "79.5%"}}></div>
</div>
</div>
{/*  Metric 5  */}
<div className="flex flex-col p-3 rounded-lg bg-surface-container-low border border-outline-variant/30 hover:border-outline/50 transition-colors col-span-2 sm:col-span-1">
<div className="flex items-center justify-between text-outline">
<span className="text-[11px] font-label-badge uppercase tracking-wider">Squad Roster</span>
<span className="material-symbols-outlined text-[14px]">group</span>
</div>
<div className="flex items-center justify-between mt-1.5">
<span className="font-headline-md text-headline-md text-on-surface">6 members</span>
<div className="flex -space-x-1.5 overflow-hidden">
<span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-container text-on-primary-container text-[10px] font-bold ring-2 ring-surface">ER</span>
<span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold ring-2 ring-surface">MK</span>
<span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-surface-container-highest text-on-surface text-[10px] font-bold ring-2 ring-surface">AN</span>
<span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-surface-bright text-outline text-[10px] font-bold ring-2 ring-surface">+3</span>
</div>
</div>
<div className="text-[11px] font-label-code text-on-surface-variant mt-2">
          Sync lead: <span className="text-on-surface">E. Rostova</span>
</div>
</div>
</div>
{/*  Project Sub-Tabs Navigation  */}
<nav aria-label="Project Sub Navigation" className="flex items-center gap-1 overflow-x-auto border-b border-outline-variant/30 -mb-space-lg pt-2 scrollbar-none">
<button className="px-3.5 py-2.5 font-body-sm text-body-sm text-outline hover:text-on-surface transition-colors border-b-2 border-transparent hover:border-outline-variant whitespace-nowrap" type="button">
        Overview
      </button>
<button className="px-3.5 py-2.5 font-body-sm text-body-sm text-outline hover:text-on-surface transition-colors border-b-2 border-transparent hover:border-outline-variant flex items-center gap-1.5 whitespace-nowrap" type="button">
<span>Issues</span>
<span className="px-1.5 py-0.2 rounded-full bg-surface-container text-[10px] font-label-code text-outline">58</span>
</button>
<button className="px-3.5 py-2.5 font-body-sm text-body-sm text-outline hover:text-on-surface transition-colors border-b-2 border-transparent hover:border-outline-variant whitespace-nowrap" type="button">
        Cycles &amp; Sprints
      </button>
<button className="px-3.5 py-2.5 font-body-sm text-body-sm text-outline hover:text-on-surface transition-colors border-b-2 border-transparent hover:border-outline-variant flex items-center gap-1.5 whitespace-nowrap" type="button">
<span>Milestones</span>
<span className="px-1.5 py-0.2 rounded-full bg-surface-container text-[10px] font-label-code text-outline">4</span>
</button>
{/*  ACTIVE TAB  */}
<button className="px-3.5 py-2.5 font-headline-sm text-body-sm text-on-surface border-b-2 border-primary-container flex items-center gap-2 whitespace-nowrap relative" type="button">
<span className="material-symbols-outlined text-[16px] text-primary">description</span>
<span>Documents &amp; RFCs</span>
<span className="px-1.5 py-0.2 rounded-full bg-primary-container text-on-primary-container text-[10px] font-label-code font-bold">6</span>
<span className="absolute -bottom-px left-0 right-0 h-0.5 bg-primary-container shadow-[0_0_8px_rgba(94,106,210,0.8)]"></span>
</button>
<button className="px-3.5 py-2.5 font-body-sm text-body-sm text-outline hover:text-on-surface transition-colors border-b-2 border-transparent hover:border-outline-variant whitespace-nowrap" type="button">
        Team &amp; Access
      </button>
<button className="px-3.5 py-2.5 font-body-sm text-body-sm text-outline hover:text-on-surface transition-colors border-b-2 border-transparent hover:border-outline-variant whitespace-nowrap" type="button">
        Analytics &amp; Telemetry
      </button>
</nav>
</header>
{/*  Main View Container: Content Canvas + Right Utility Rail  */}
<div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mt-6 items-start">
{/*  LEFT / MAIN REPOSITORY (9 Columns on XL)  */}
<div className="xl:col-span-8 2xl:col-span-9 flex flex-col gap-6">
{/*  1. Top Controls Bar  */}
<div className="flex flex-col gap-3 p-3.5 rounded-lg bg-surface-container-low border border-outline-variant/30">
<div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
{/*  Live Search Input  */}
<div className="relative flex-1">
<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[16px] pointer-events-none">search</span>
<input className="w-full h-8 pl-9 pr-8 bg-surface-container border border-outline-variant/40 rounded-lg text-on-surface placeholder:text-outline font-body-sm text-body-sm focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all" id="docSearchInput" placeholder="Search documents, RFCs, PRDs, meeting notes... (Press '/' to focus)" type="text"/>
<span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-label-kbd text-label-kbd text-outline bg-surface-container-high px-1 py-0.5 rounded border border-outline-variant/30">/</span>
</div>
{/*  Action Buttons  */}
<div className="flex items-center gap-2">
<button className="h-8 px-2.5 rounded-lg bg-surface-container border border-outline-variant/40 hover:bg-surface-container-high hover:border-outline text-on-surface-variant hover:text-on-surface font-body-sm text-body-sm flex items-center gap-1.5 transition-colors" type="button">
<span className="material-symbols-outlined text-[15px]">file_upload</span>
<span>Import Markdown</span>
</button>
<button className="h-8 px-3 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm flex items-center gap-1.5 transition-colors shadow-sm" type="button">
<span className="material-symbols-outlined text-[16px]">add</span>
<span>New Document</span>
</button>
</div>
</div>
{/*  Filter Strips: Category and Status  */}
<div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-outline-variant/20">
{/*  Category Pills  */}
<div className="flex flex-wrap items-center gap-1.5" id="categoryPillGroup">
<button className="category-pill active-pill px-2.5 py-1 rounded-lg bg-surface-container-high text-on-surface font-body-sm text-body-sm border border-primary-container/60 transition-all flex items-center gap-1.5" data-filter="all" type="button">
<span>All</span>
<span className="text-[10px] font-label-code text-primary bg-primary-container/20 px-1 rounded">6</span>
</button>
<button className="category-pill px-2.5 py-1 rounded-lg bg-surface-container/60 hover:bg-surface-container text-on-surface-variant hover:text-on-surface font-body-sm text-body-sm border border-outline-variant/30 transition-all flex items-center gap-1.5" data-filter="rfc" type="button">
<span>Architecture RFCs</span>
<span className="text-[10px] font-label-code text-outline bg-surface-container-highest px-1 rounded">3</span>
</button>
<button className="category-pill px-2.5 py-1 rounded-lg bg-surface-container/60 hover:bg-surface-container text-on-surface-variant hover:text-on-surface font-body-sm text-body-sm border border-outline-variant/30 transition-all flex items-center gap-1.5" data-filter="spec" type="button">
<span>Specifications</span>
<span className="text-[10px] font-label-code text-outline bg-surface-container-highest px-1 rounded">2</span>
</button>
<button className="category-pill px-2.5 py-1 rounded-lg bg-surface-container/60 hover:bg-surface-container text-on-surface-variant hover:text-on-surface font-body-sm text-body-sm border border-outline-variant/30 transition-all flex items-center gap-1.5" data-filter="notes" type="button">
<span>Meeting Notes</span>
<span className="text-[10px] font-label-code text-outline bg-surface-container-highest px-1 rounded">1</span>
</button>
</div>
{/*  Status Dropdown / Selectors  */}
<div className="flex items-center gap-1.5">
<span className="text-[11px] font-label-badge text-outline uppercase tracking-wider mr-1">Status:</span>
<div className="inline-flex rounded-lg bg-surface-container border border-outline-variant/30 p-0.5">
<button className="status-btn px-2 py-0.5 rounded text-[11px] font-body-sm text-on-surface bg-surface-container-high transition-colors" type="button">All</button>
<button className="status-btn px-2 py-0.5 rounded text-[11px] font-body-sm text-outline hover:text-on-surface transition-colors" type="button">Approved</button>
<button className="status-btn px-2 py-0.5 rounded text-[11px] font-body-sm text-outline hover:text-on-surface transition-colors" type="button">In Review</button>
<button className="status-btn px-2 py-0.5 rounded text-[11px] font-body-sm text-outline hover:text-on-surface transition-colors" type="button">Draft</button>
</div>
</div>
</div>
</div>
{/*  2. Pinned & Flagship Spec Card  */}
<section className="relative rounded-lg bg-surface-container-low border border-primary-container/40 p-5 overflow-hidden transition-all hover:border-primary-container">
{/*  Visual Accent Header Beam  */}
<div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-container via-secondary to-primary-container/20"></div>
<div className="flex flex-col gap-4">
{/*  Card Header & Metadata  */}
<div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
<div className="flex flex-col gap-1.5">
<div className="flex items-center gap-2 flex-wrap">
<span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary-container/20 text-primary border border-primary-container/30 text-[11px] font-label-code font-semibold">
<span className="material-symbols-outlined text-[13px]">push_pin</span>
                  PINNED FLAGSHIP
                </span>
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-highest border border-outline-variant/40 text-on-surface text-[11px] font-label-badge font-bold tracking-wide">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                  APPROVED &amp; LOCKED
                </span>
<span className="font-label-code text-label-code text-outline">v2.4.0-rc</span>
</div>
<h2 className="font-headline-md text-headline-md text-on-surface hover:text-primary transition-colors cursor-pointer flex items-center gap-2 mt-1">
                RFC-8819: Realtime Memory-Sharded Synchronization Protocol
                <span className="material-symbols-outlined text-[18px] text-outline">open_in_new</span>
</h2>
</div>
{/*  Author & Last Edit Badge  */}
<div className="flex items-center gap-2.5 sm:self-start bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant/30">
<div className="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-[11px] font-bold">
                ER
              </div>
<div className="flex flex-col leading-tight">
<span className="font-body-sm text-body-sm text-on-surface font-medium">Elena Rostova</span>
<span className="text-[10px] font-label-code text-outline">Edited 2h ago</span>
</div>
</div>
</div>
{/*  Abstract Summary  */}
<p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
            Memory-sharded WebGL instanced frame replication with hybrid logical clocks (HLC) and ZSTD delta compression. Solves state divergence across high-concurrency client sockets while maintaining sub-12ms frame reconciliation under saturated uplinks.
          </p>
{/*  Interactive Code Snippet Box  */}
<div className="rounded-lg bg-surface-container-lowest border border-outline-variant/40 overflow-hidden font-label-code">
<div className="flex items-center justify-between px-3.5 py-1.5 bg-surface-container border-b border-outline-variant/30 text-outline text-[11px]">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-[13px] text-primary">data_object</span>
<span className="text-on-surface-variant font-medium">protocol/nexus_frame_buffer.ts</span>
<span className="text-[10px] text-outline-variant">TypeScript</span>
</div>
<div className="flex items-center gap-2">
<button className="flex items-center gap-1 hover:text-on-surface transition-colors cursor-pointer" id="copyCodeBtn" type="button">
<span className="material-symbols-outlined text-[13px]">content_copy</span>
<span id="copyCodeText">Copy</span>
</button>
</div>
</div>
<pre className="p-3.5 text-label-code text-on-surface overflow-x-auto leading-5 text-[12px]"><code><span className="text-secondary font-semibold">export interface</span> <span className="text-primary-fixed">NexusFrameBuffer</span> &#123;
  <span className="text-outline">readOnly</span> epochId: <span className="text-secondary">string</span>;            <span className="text-outline-variant">// RFC-4122 v4 monotonic stream UUID</span>
  <span className="text-outline">readOnly</span> shardOffset: <span className="text-secondary">number</span>;        <span className="text-outline-variant">// Memory partition range [0..63]</span>
  hlcTimestamp: <span className="text-secondary">bigint</span>;               <span className="text-outline-variant">// Hybrid Logical Clock nanos</span>
  instancedMeshPayload: <span className="text-primary">ArrayBuffer</span>;  <span className="text-outline-variant">// WebGL GPU Vertex instance batch</span>
  zstdDeltaHash: <span className="text-secondary">string</span>;              <span className="text-outline-variant">// SHA-256 state signature</span>
  reconciliationState: <span className="text-secondary-fixed">"COMMITTED"</span> | <span className="text-secondary-fixed">"SHARD_EVICTED"</span>;
&#125;</code></pre>
</div>
{/*  Key Stats & Footnote Metadata  */}
<div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-outline-variant/20">
<div className="flex items-center gap-4 text-body-sm font-body-sm text-outline">
<span className="flex items-center gap-1.5 hover:text-on-surface transition-colors cursor-pointer">
<span className="material-symbols-outlined text-[16px] text-primary">forum</span>
<span className="text-on-surface font-medium">14</span> comments
              </span>
<span className="flex items-center gap-1.5 hover:text-on-surface transition-colors cursor-pointer">
<span className="material-symbols-outlined text-[16px]">history</span>
<span className="text-on-surface font-medium">3</span> revisions
              </span>
<span className="flex items-center gap-1.5 text-on-surface-variant">
<span className="material-symbols-outlined text-[16px] text-primary">verified_user</span>
<span className="text-on-surface font-medium">4</span> signed off
              </span>
</div>
{/*  Linked Issues  */}
<div className="flex items-center gap-2">
<span className="text-[11px] font-label-badge text-outline">Linked Issues:</span>
<a className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container border border-outline-variant/40 hover:border-outline text-primary font-label-code text-body-sm transition-colors" href="/projects/prj-204">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                SCR-104
              </a>
<a className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container border border-outline-variant/40 hover:border-outline text-primary font-label-code text-body-sm transition-colors" href="/projects/prj-204">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                SCR-106
              </a>
</div>
</div>
</div>
</section>
{/*  3. Repository Document Cards Grid  */}
<section className="flex flex-col gap-3">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<h3 className="font-headline-sm text-headline-sm text-on-surface">Repository Documents</h3>
<span className="text-body-sm font-label-code text-outline" id="docCountDisplay">(5 items)</span>
</div>
<div className="flex items-center gap-1 text-[11px] font-body-sm text-outline">
<span>Sort by:</span>
<button className="text-on-surface font-medium hover:underline flex items-center gap-0.5" type="button">
              Recent activity
              <span className="material-symbols-outlined text-[14px]">arrow_drop_down</span>
</button>
</div>
</div>
<div className="grid grid-cols-1 gap-2.5" id="documentsList">
{/*  Doc 1: PRD-204  */}
<article className="group doc-row flex flex-col md:flex-row md:items-center justify-between p-3.5 rounded-lg bg-surface-container-low border border-outline-variant/30 hover:border-outline-variant hover:bg-surface-container transition-all" data-category="spec prd" data-status="approved">
<div className="flex items-start gap-3">
<div className="w-8 h-8 rounded-lg bg-surface-container-high border border-outline-variant/40 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors">
<span className="material-symbols-outlined text-[18px]">menu_book</span>
</div>
<div className="flex flex-col">
<div className="flex items-center gap-2 flex-wrap">
<span className="font-label-code text-label-code text-primary font-semibold">PRD-204</span>
<span className="text-outline-variant">·</span>
<span className="px-1.5 py-0.2 rounded bg-surface-container text-[10px] font-label-badge text-outline border border-outline-variant/20 uppercase">PRD</span>
<span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-primary-container/20 text-primary text-[10px] font-label-badge font-medium">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                    Approved
                  </span>
</div>
<h4 className="font-headline-sm text-body-lg text-on-surface group-hover:text-primary transition-colors cursor-pointer mt-0.5">
                  Nexus 2.0 Product Requirements &amp; Scope
                </h4>
<p className="text-body-sm font-body-sm text-outline line-clamp-1 mt-0.5">
                  Core redesign specifications, business objectives, latency SLA thresholds, and targeted user journeys for V2 launch.
                </p>
</div>
</div>
<div className="flex items-center gap-4 mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-outline-variant/20 shrink-0">
<div className="flex items-center gap-2">
<span className="w-5 h-5 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-[10px] font-bold">ER</span>
<span className="text-body-sm font-body-sm text-on-surface-variant">Elena Rostova</span>
</div>
<span className="text-body-sm font-label-code text-outline">Oct 18</span>
<button className="w-7 h-7 rounded hover:bg-surface-container-highest flex items-center justify-center text-outline hover:text-on-surface transition-colors" type="button">
<span className="material-symbols-outlined text-[18px]">more_vert</span>
</button>
</div>
</article>
{/*  Doc 2: RFC-8824  */}
<article className="group doc-row flex flex-col md:flex-row md:items-center justify-between p-3.5 rounded-lg bg-surface-container-low border border-outline-variant/30 hover:border-outline-variant hover:bg-surface-container transition-all" data-category="rfc" data-status="approved">
<div className="flex items-start gap-3">
<div className="w-8 h-8 rounded-lg bg-surface-container-high border border-outline-variant/40 flex items-center justify-center text-secondary shrink-0 group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors">
<span className="material-symbols-outlined text-[18px]">palette</span>
</div>
<div className="flex flex-col">
<div className="flex items-center gap-2 flex-wrap">
<span className="font-label-code text-label-code text-primary font-semibold">RFC-8824</span>
<span className="text-outline-variant">·</span>
<span className="px-1.5 py-0.2 rounded bg-surface-container text-[10px] font-label-badge text-outline border border-outline-variant/20 uppercase">RFC</span>
<span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-primary-container/20 text-primary text-[10px] font-label-badge font-medium">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                    Approved
                  </span>
</div>
<h4 className="font-headline-sm text-body-lg text-on-surface group-hover:text-primary transition-colors cursor-pointer mt-0.5">
                  WebGL Canvas Shading &amp; OKLCH Color Space Engine
                </h4>
<p className="text-body-sm font-body-sm text-outline line-clamp-1 mt-0.5">
                  Perceptually uniform color transitions, wide gamut support, and custom fragment shaders for high-DPI canvases.
                </p>
</div>
</div>
<div className="flex items-center gap-4 mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-outline-variant/20 shrink-0">
<div className="flex items-center gap-2">
<span className="w-5 h-5 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container text-[10px] font-bold">MK</span>
<span className="text-body-sm font-body-sm text-on-surface-variant">Marcus Kane</span>
</div>
<span className="text-body-sm font-label-code text-outline">Oct 22</span>
<button className="w-7 h-7 rounded hover:bg-surface-container-highest flex items-center justify-center text-outline hover:text-on-surface transition-colors" type="button">
<span className="material-symbols-outlined text-[18px]">more_vert</span>
</button>
</div>
</article>
{/*  Doc 3: SPEC-108  */}
<article className="group doc-row flex flex-col md:flex-row md:items-center justify-between p-3.5 rounded-lg bg-surface-container-low border border-outline-variant/30 hover:border-outline-variant hover:bg-surface-container transition-all" data-category="spec" data-status="in-review">
<div className="flex items-start gap-3">
<div className="w-8 h-8 rounded-lg bg-surface-container-high border border-outline-variant/40 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors">
<span className="material-symbols-outlined text-[18px]">table_rows</span>
</div>
<div className="flex flex-col">
<div className="flex items-center gap-2 flex-wrap">
<span className="font-label-code text-label-code text-primary font-semibold">SPEC-108</span>
<span className="text-outline-variant">·</span>
<span className="px-1.5 py-0.2 rounded bg-surface-container text-[10px] font-label-badge text-outline border border-outline-variant/20 uppercase">Spec</span>
<span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-surface-container-highest text-on-surface-variant text-[10px] font-label-badge font-medium">
<span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
                    In Review
                  </span>
</div>
<h4 className="font-headline-sm text-body-lg text-on-surface group-hover:text-primary transition-colors cursor-pointer mt-0.5">
                  Virtual DOM 100k Row Virtualization Architecture
                </h4>
<p className="text-body-sm font-body-sm text-outline line-clamp-1 mt-0.5">
                  Dynamic windowing algorithm with binary search node offsets and zero garbage-collector churn during 120fps inertia scrolling.
                </p>
</div>
</div>
<div className="flex items-center gap-4 mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-outline-variant/20 shrink-0">
<div className="flex items-center gap-2">
<span className="w-5 h-5 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface text-[10px] font-bold">AN</span>
<span className="text-body-sm font-body-sm text-on-surface-variant">Alex Nazeer</span>
</div>
<span className="text-body-sm font-label-code text-outline">Yesterday</span>
<button className="w-7 h-7 rounded hover:bg-surface-container-highest flex items-center justify-center text-outline hover:text-on-surface transition-colors" type="button">
<span className="material-symbols-outlined text-[18px]">more_vert</span>
</button>
</div>
</article>
{/*  Doc 4: SEC-441  */}
<article className="group doc-row flex flex-col md:flex-row md:items-center justify-between p-3.5 rounded-lg bg-surface-container-low border border-outline-variant/30 hover:border-outline-variant hover:bg-surface-container transition-all" data-category="rfc security" data-status="in-review">
<div className="flex items-start gap-3">
<div className="w-8 h-8 rounded-lg bg-surface-container-high border border-outline-variant/40 flex items-center justify-center text-error shrink-0 group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors">
<span className="material-symbols-outlined text-[18px]">security</span>
</div>
<div className="flex flex-col">
<div className="flex items-center gap-2 flex-wrap">
<span className="font-label-code text-label-code text-primary font-semibold">SEC-441</span>
<span className="text-outline-variant">·</span>
<span className="px-1.5 py-0.2 rounded bg-surface-container text-[10px] font-label-badge text-outline border border-outline-variant/20 uppercase">Security</span>
<span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-surface-container-highest text-on-surface-variant text-[10px] font-label-badge font-medium">
<span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
                    In Review
                  </span>
</div>
<h4 className="font-headline-sm text-body-lg text-on-surface group-hover:text-primary transition-colors cursor-pointer mt-0.5">
                  Zero-Trust STOMP Socket Authentication &amp; Token Rotation
                </h4>
<p className="text-body-sm font-body-sm text-outline line-clamp-1 mt-0.5">
                  Ephemeral mutual TLS binding, hardware key assertion, and automated 15-minute cryptographically signed nonce handshakes.
                </p>
</div>
</div>
<div className="flex items-center gap-4 mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-outline-variant/20 shrink-0">
<div className="flex items-center gap-2">
<span className="w-5 h-5 rounded-full bg-surface-bright flex items-center justify-center text-on-surface text-[10px] font-bold">TL</span>
<span className="text-body-sm font-body-sm text-on-surface-variant">Tanya Liu</span>
</div>
<span className="text-body-sm font-label-code text-outline">Oct 23</span>
<button className="w-7 h-7 rounded hover:bg-surface-container-highest flex items-center justify-center text-outline hover:text-on-surface transition-colors" type="button">
<span className="material-symbols-outlined text-[18px]">more_vert</span>
</button>
</div>
</article>
{/*  Doc 5: Meeting Notes  */}
<article className="group doc-row flex flex-col md:flex-row md:items-center justify-between p-3.5 rounded-lg bg-surface-container-low border border-outline-variant/30 hover:border-outline-variant hover:bg-surface-container transition-all" data-category="notes" data-status="published">
<div className="flex items-start gap-3">
<div className="w-8 h-8 rounded-lg bg-surface-container-high border border-outline-variant/40 flex items-center justify-center text-outline shrink-0 group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors">
<span className="material-symbols-outlined text-[18px]">event_note</span>
</div>
<div className="flex flex-col">
<div className="flex items-center gap-2 flex-wrap">
<span className="font-label-code text-label-code text-on-surface-variant font-semibold">NOTE-S14</span>
<span className="text-outline-variant">·</span>
<span className="px-1.5 py-0.2 rounded bg-surface-container text-[10px] font-label-badge text-outline border border-outline-variant/20 uppercase">Notes</span>
<span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-surface-container-highest text-on-surface text-[10px] font-label-badge font-medium">
                    Published
                  </span>
</div>
<h4 className="font-headline-sm text-body-lg text-on-surface group-hover:text-primary transition-colors cursor-pointer mt-0.5">
                  Sprint 14 Design &amp; Scope Review Meeting Notes
                </h4>
<p className="text-body-sm font-body-sm text-outline line-clamp-1 mt-0.5">
                  Decisions on WebGL canvas fallbacks for legacy hardware, removal of Safari 14 polyfills, and updated release timelines.
                </p>
</div>
</div>
<div className="flex items-center gap-4 mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-outline-variant/20 shrink-0">
<div className="flex items-center gap-2">
<span className="w-5 h-5 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-[10px] font-bold">ER</span>
<span className="text-body-sm font-body-sm text-on-surface-variant">Elena Rostova</span>
</div>
<span className="text-body-sm font-label-code text-outline">3h ago</span>
<button className="w-7 h-7 rounded hover:bg-surface-container-highest flex items-center justify-center text-outline hover:text-on-surface transition-colors" type="button">
<span className="material-symbols-outlined text-[18px]">more_vert</span>
</button>
</div>
</article>
</div>
</section>
</div>
{/*  RIGHT / UTILITY RAIL (3 Columns on XL)  */}
<aside className="xl:col-span-4 2xl:col-span-3 flex flex-col gap-6">
{/*  Quick Templates Module  */}
<div className="flex flex-col p-4 rounded-lg bg-surface-container-low border border-outline-variant/30">
<div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
<div className="flex items-center gap-1.5">
<span className="material-symbols-outlined text-[16px] text-primary">dynamic_feed</span>
<h4 className="font-headline-sm text-body-sm text-on-surface">Quick Templates</h4>
</div>
<span className="text-[10px] font-label-code text-outline">3 ready</span>
</div>
<div className="flex flex-col gap-2 mt-3">
{/*  Template 1  */}
<button className="group flex items-start gap-2.5 p-2 rounded-lg hover:bg-surface-container border border-transparent hover:border-outline-variant/40 text-left transition-all" type="button">
<div className="w-7 h-7 rounded bg-surface-container-high border border-outline-variant/30 flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary-container shrink-0 mt-0.5">
<span className="material-symbols-outlined text-[14px]">architecture</span>
</div>
<div className="flex flex-col">
<span className="font-body-sm text-body-sm text-on-surface font-medium group-hover:text-primary transition-colors">New RFC Template</span>
<span className="text-[11px] font-body-sm text-outline">Standard schema with motivation, caveats &amp; tradeoffs</span>
</div>
</button>
{/*  Template 2  */}
<button className="group flex items-start gap-2.5 p-2 rounded-lg hover:bg-surface-container border border-transparent hover:border-outline-variant/40 text-left transition-all" type="button">
<div className="w-7 h-7 rounded bg-surface-container-high border border-outline-variant/30 flex items-center justify-center text-secondary group-hover:bg-primary-container group-hover:text-on-primary-container shrink-0 mt-0.5">
<span className="material-symbols-outlined text-[14px]">developer_board</span>
</div>
<div className="flex flex-col">
<span className="font-body-sm text-body-sm text-on-surface font-medium group-hover:text-primary transition-colors">Engineering Design Doc (EDD)</span>
<span className="text-[11px] font-body-sm text-outline">API contracts, DB migration plans &amp; rollback runbooks</span>
</div>
</button>
{/*  Template 3  */}
<button className="group flex items-start gap-2.5 p-2 rounded-lg hover:bg-surface-container border border-transparent hover:border-outline-variant/40 text-left transition-all" type="button">
<div className="w-7 h-7 rounded bg-surface-container-high border border-outline-variant/30 flex items-center justify-center text-outline group-hover:bg-primary-container group-hover:text-on-primary-container shrink-0 mt-0.5">
<span className="material-symbols-outlined text-[14px]">history_edu</span>
</div>
<div className="flex flex-col">
<span className="font-body-sm text-body-sm text-on-surface font-medium group-hover:text-primary transition-colors">Post-Mortem Spec</span>
<span className="text-[11px] font-body-sm text-outline">Blameless analysis, timeline reconstruction &amp; preventive action</span>
</div>
</button>
</div>
</div>
{/*  Recent Document Changelog / History feed  */}
<div className="flex flex-col p-4 rounded-lg bg-surface-container-low border border-outline-variant/30">
<div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
<div className="flex items-center gap-1.5">
<span className="material-symbols-outlined text-[16px] text-primary">reorder</span>
<h4 className="font-headline-sm text-body-sm text-on-surface">Document Changelog</h4>
</div>
<span className="text-[10px] font-label-code text-outline">Real-time</span>
</div>
<div className="relative flex flex-col gap-4 mt-3 pl-3 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-outline-variant/30">
{/*  Event 1  */}
<div className="relative flex items-start gap-3 pl-3">
<span className="absolute left-[-15px] top-1.5 w-2 h-2 rounded-full bg-primary-container ring-4 ring-surface-container-low"></span>
<div className="flex flex-col leading-tight">
<p className="font-body-sm text-body-sm text-on-surface">
<span className="font-medium text-primary">Elena Rostova</span> locked <span className="font-label-code text-on-surface">RFC-8819</span> as Approved.
              </p>
<span className="text-[11px] font-label-code text-outline mt-0.5">2 hours ago</span>
</div>
</div>
{/*  Event 2  */}
<div className="relative flex items-start gap-3 pl-3">
<span className="absolute left-[-15px] top-1.5 w-2 h-2 rounded-full bg-secondary ring-4 ring-surface-container-low"></span>
<div className="flex flex-col leading-tight">
<p className="font-body-sm text-body-sm text-on-surface">
<span className="font-medium text-secondary">Alex Nazeer</span> pushed revision <span className="font-label-code text-outline">#3</span> to <span className="font-label-code text-on-surface">SPEC-108</span>.
              </p>
<span className="text-[11px] font-label-code text-outline mt-0.5">Yesterday at 18:41</span>
</div>
</div>
{/*  Event 3  */}
<div className="relative flex items-start gap-3 pl-3">
<span className="absolute left-[-15px] top-1.5 w-2 h-2 rounded-full bg-outline ring-4 ring-surface-container-low"></span>
<div className="flex flex-col leading-tight">
<p className="font-body-sm text-body-sm text-on-surface">
<span className="font-medium text-on-surface">Tanya Liu</span> opened review on <span className="font-label-code text-on-surface">SEC-441</span>.
              </p>
<span className="text-[11px] font-label-code text-outline mt-0.5">Oct 23, 11:20</span>
</div>
</div>
{/*  Event 4  */}
<div className="relative flex items-start gap-3 pl-3">
<span className="absolute left-[-15px] top-1.5 w-2 h-2 rounded-full bg-primary-container ring-4 ring-surface-container-low"></span>
<div className="flex flex-col leading-tight">
<p className="font-body-sm text-body-sm text-on-surface">
<span className="font-medium text-primary">Marcus Kane</span> merged color tokens into <span className="font-label-code text-on-surface">RFC-8824</span>.
              </p>
<span className="text-[11px] font-label-code text-outline mt-0.5">Oct 22, 15:02</span>
</div>
</div>
</div>
<button className="w-full mt-3 py-1.5 rounded bg-surface-container border border-outline-variant/30 text-outline hover:text-on-surface hover:bg-surface-container-high text-[11px] font-body-sm transition-colors text-center" type="button">
          View full audit trail (28 events)
        </button>
</div>
{/*  Architecture Compliance Box  */}
<div className="p-3.5 rounded-lg bg-surface-container-low border border-outline-variant/30 flex items-center justify-between">
<div className="flex items-center gap-2.5">
<div className="w-8 h-8 rounded-lg bg-primary-container/20 text-primary flex items-center justify-center">
<span className="material-symbols-outlined text-[18px]">verified</span>
</div>
<div className="flex flex-col">
<span className="font-body-sm text-body-sm text-on-surface font-medium">Compliance Check</span>
<span className="text-[11px] font-body-sm text-outline">All RFCs adhere to ADR-04</span>
</div>
</div>
<span className="font-label-code text-[11px] text-primary bg-primary-container/20 px-2 py-0.5 rounded">100% PASS</span>
</div>
</aside>
</div>
</div>

    </div>
  );
}
