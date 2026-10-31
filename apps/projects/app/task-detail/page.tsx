"use client";

import Link from "next/link";
import React, { useState } from "react";

export default function TaskDetailPage() {
  return (
    <div className="flex flex-col w-full pb-16">
<div className="flex flex-col w-full pb-16">
{/*  Top Navigation & Action Context Bar  */}
<div className="flex items-center justify-between py-space-sm border-b border-outline-variant/30 text-body-sm font-body-sm">
<div className="flex items-center gap-space-sm min-w-0">
<div className="flex items-center gap-1.5 text-outline">
<a className="hover:text-on-surface transition-colors flex items-center gap-1" href="/projects/prj-204">
<span className="material-symbols-outlined text-[15px]">folder</span>
          Projects
        </a>
<span className="text-outline-variant">/</span>
<a className="hover:text-on-surface transition-colors" href="/projects/prj-204">Nexus 2.0 Redesign</a>
<span className="text-outline-variant">/</span>
<a className="hover:text-on-surface transition-colors" href="/projects/prj-204">Issues</a>
<span className="text-outline-variant">/</span>
<span className="font-label-code text-label-code text-primary font-medium">SCR-104</span>
</div>
<div className="h-3 w-px bg-outline-variant/40 mx-1"></div>
<span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-surface-container text-outline text-[11px] font-label-badge">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
        Sprint 14
      </span>
</div>
{/*  Actions / Utilities  */}
<div className="flex items-center gap-space-xs">
<button className="h-7 px-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1.5 text-body-sm font-body-sm" id="copyLinkBtn" type="button">
<span className="material-symbols-outlined text-[14px]">link</span>
<span>Copy Link</span>
<span className="font-label-kbd text-label-kbd text-outline">⌘L</span>
</button>
<button className="h-7 px-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1.5 text-body-sm font-body-sm" id="subscribeBtn" type="button">
<span className="material-symbols-outlined text-[14px] text-primary">notifications_active</span>
<span>Subscribed</span>
</button>
<div className="relative inline-block text-left">
<button className="h-7 w-7 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center" type="button">
<span className="material-symbols-outlined text-[16px]">more_horiz</span>
</button>
</div>
</div>
</div>
{/*  Main Grid: Issue Canvas (Left) + Inspector Sidebar (Right)  */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop mt-space-md">
{/*  Left / Center Canvas (Col 8)  */}
<div className="lg:col-span-8 flex flex-col gap-space-lg min-w-0">
{/*  Issue Header Block  */}
<div className="bg-surface-container-low rounded-xl p-space-lg flex flex-col gap-space-md shadow-sm">
<div className="flex flex-wrap items-center gap-2">
{/*  Status Pill  */}
<div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-secondary-container/40 text-primary text-label-badge font-label-badge shadow-[0_0_12px_-2px_rgba(94,106,210,0.35)]">
<span className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
<span>In Progress</span>
</div>
{/*  Priority Pill (Urgent)  */}
<div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-error-container/30 text-error text-label-badge font-label-badge">
<span className="material-symbols-outlined text-[13px] text-error" style={{fontVariationSettings: "\'FILL\' 1"}}>local_fire_department</span>
<span>Urgent</span>
</div>
{/*  Cycle / Milestone Badges  */}
<div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface-container text-on-surface-variant text-label-badge font-label-badge">
<span className="material-symbols-outlined text-[13px] text-outline">cached</span>
<span>Cycle 14</span>
</div>
<div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-surface-container text-on-surface-variant text-label-badge font-label-badge">
<span className="material-symbols-outlined text-[13px] text-outline">timer</span>
<span>8h est (5 pts)</span>
</div>
<div className="ml-auto flex items-center gap-1 text-outline font-label-kbd text-label-kbd">
<span>Opened 2d ago by</span>
<span className="text-on-surface font-body-sm">Elena R.</span>
</div>
</div>
{/*  Issue Title  */}
<h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-semibold">
          SCR-104: Interactive Analytics Dashboard &amp; Real-time Canvas
        </h1>
{/*  Issue Context Meta Tabs  */}
<div className="flex items-center gap-space-md text-body-sm font-body-sm text-outline border-b border-outline-variant/20 pb-2">
<div className="flex items-center gap-1 text-primary border-b-2 border-primary-container pb-1 -mb-2">
<span className="material-symbols-outlined text-[15px]">description</span>
<span className="font-medium">Specification &amp; Overview</span>
</div>
<div className="flex items-center gap-1 hover:text-on-surface cursor-pointer pb-1 -mb-2 transition-colors">
<span className="material-symbols-outlined text-[15px]">call_split</span>
<span>Sub-issues (3)</span>
</div>
<div className="flex items-center gap-1 hover:text-on-surface cursor-pointer pb-1 -mb-2 transition-colors">
<span className="material-symbols-outlined text-[15px]">commit</span>
<span>Linked PR #489</span>
</div>
</div>
{/*  Rich Markdown Body Content  */}
<div className="flex flex-col gap-space-md text-on-surface-variant font-body-md text-body-md leading-relaxed pt-1">
<p>
            Implement a 60fps rendering pipeline for the streaming metric topology canvas in <code className="font-label-code text-label-code bg-surface-container-high px-1 py-0.5 rounded-lg text-primary">@nexus/analytics-canvas</code>. The canvas must handle up to 25,000 live data vectors concurrently with hardware-accelerated pan, zoom, and frame scrubbing.
          </p>
{/*  High Impact Architecture Graphic Banner  */}
<div className="relative w-full rounded-lg overflow-hidden bg-surface-container-lowest my-1">
<div className="p-space-md flex flex-col gap-2">
<div className="flex items-center justify-between text-body-sm font-body-sm">
<span className="flex items-center gap-2 text-on-surface font-medium">
<span className="material-symbols-outlined text-primary text-[16px]">area_chart</span>
                  Live Telemetry Pipeline Architecture (Real-time WebGL buffer)
                </span>
<span className="font-label-code text-label-code text-primary bg-primary-container/20 px-1.5 py-0.5 rounded-lg">60.2 FPS TARGET</span>
</div>
{/*  Inline Data Visualization (Latency Sparkline SVG)  */}
<div className="w-full h-24 bg-surface-container-low rounded-lg p-2 flex flex-col justify-end relative overflow-hidden">
<div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-container/5 to-transparent pointer-events-none"></div>
<svg className="w-full h-16 text-primary" fill="none" preserveAspectRatio="none" viewBox="0 0 600 80">
<path d="M0,60 Q40,25 90,45 T180,20 T270,55 T360,15 T450,40 T540,10 T600,25 L600,80 L0,80 Z" fill="currentColor" fill-opacity="0.1"></path>
<path d="M0,60 Q40,25 90,45 T180,20 T270,55 T360,15 T450,40 T540,10 T600,25" stroke="currentColor" stroke-linecap="round" stroke-width="2"></path>
<circle className="fill-primary animate-ping" cx="540" cy="10" r="3.5"></circle>
<circle className="fill-primary-container" cx="540" cy="10" r="3"></circle>
</svg>
<div className="flex items-center justify-between text-[10px] font-label-code text-outline px-1">
<span>T-00:00 (Frame Start)</span>
<span>BUFFER DRAIN: 1.4ms</span>
<span>FPS LOCK: 59.94</span>
</div>
</div>
</div>
</div>
{/*  Code Snippet  */}
<div className="rounded-lg bg-surface-container-lowest overflow-hidden">
<div className="flex items-center justify-between px-space-md py-1.5 bg-surface-container-high/60 text-outline font-label-code text-[11px]">
<span className="flex items-center gap-1.5">
<span className="w-2 h-2 rounded-full bg-error-container"></span>
<span className="w-2 h-2 rounded-full bg-secondary-container"></span>
<span className="w-2 h-2 rounded-full bg-primary-container"></span>
<span className="ml-2 text-on-surface-variant">src/canvas/streamBuffer.ts</span>
</span>
<span className="text-outline">TypeScript</span>
</div>
<pre className="p-space-md font-label-code text-label-code overflow-x-auto text-on-surface leading-5"><code><span className="text-outline">// Initialize off-screen WebGL instanced buffer</span>
<span className="text-secondary">export const</span> <span className="text-primary">initTopologyCanvas</span> = (ctx: <span className="text-tertiary">WebGL2RenderingContext</span>): <span className="text-tertiary">CanvasController</span> =&gt; &#123;
  <span className="text-secondary">const</span> buffer = <span className="text-on-surface">new</span> <span className="text-primary-fixed">Float32Array</span>(MAX_VECTORS * <span className="text-secondary-fixed">4</span>);
  <span className="text-outline">// Bind uniform vertex streams</span>
  ctx.<span className="text-primary">bindBuffer</span>(ctx.ARRAY_BUFFER, glBuffer);
  ctx.<span className="text-primary">bufferData</span>(ctx.ARRAY_BUFFER, buffer, ctx.DYNAMIC_DRAW);
  <span className="text-secondary">return</span> &#123; renderFrame: (delta: <span className="text-tertiary">number</span>) =&gt; syncTelemetry(delta) &#125;;
&#125;;</code></pre>
</div>
{/*  Acceptance Criteria Checklist  */}
<div className="flex flex-col gap-2 pt-2">
<span className="font-headline-sm text-headline-sm text-on-surface tracking-tight flex items-center gap-2">
<span className="material-symbols-outlined text-primary text-[18px]">fact_check</span>
              Acceptance Criteria
            </span>
<div className="flex flex-col gap-1.5 bg-surface-container rounded-lg p-space-md">
<label className="flex items-center gap-space-sm cursor-pointer group select-none">
<input defaultChecked={true} className="w-3.5 h-3.5 rounded bg-surface-container-lowest border-0 text-primary-container focus:ring-0 accent-primary-container cursor-pointer" type="checkbox"/>
<span className="line-through text-outline font-body-sm text-body-sm group-hover:text-on-surface-variant transition-colors">Off-screen Canvas instance pooling for WebGL context lifecycle management</span>
</label>
<label className="flex items-center gap-space-sm cursor-pointer group select-none">
<input defaultChecked={true} className="w-3.5 h-3.5 rounded bg-surface-container-lowest border-0 text-primary-container focus:ring-0 accent-primary-container cursor-pointer" type="checkbox"/>
<span className="line-through text-outline font-body-sm text-body-sm group-hover:text-on-surface-variant transition-colors">Telemetry stream buffer with &lt; 4ms latency per 10k metrics frame</span>
</label>
<label className="flex items-center gap-space-sm cursor-pointer group select-none">
<input className="w-3.5 h-3.5 rounded bg-surface-container-lowest border-0 text-primary-container focus:ring-0 accent-primary-container cursor-pointer" type="checkbox"/>
<span className="text-on-surface font-body-sm text-body-sm group-hover:text-primary transition-colors">Time-scrubbing controller with smooth timeline scrubbing and inertial drag</span>
</label>
<label className="flex items-center gap-space-sm cursor-pointer group select-none">
<input className="w-3.5 h-3.5 rounded bg-surface-container-lowest border-0 text-primary-container focus:ring-0 accent-primary-container cursor-pointer" type="checkbox"/>
<span className="text-on-surface font-body-sm text-body-sm group-hover:text-primary transition-colors">High-DPI retina canvas scaling without blurry SVG metric overlays</span>
</label>
</div>
</div>
{/*  Subtasks Section  */}
<div className="flex flex-col gap-2 pt-2">
<div className="flex items-center justify-between">
<span className="font-headline-sm text-headline-sm text-on-surface tracking-tight flex items-center gap-2">
<span className="material-symbols-outlined text-outline text-[18px]">account_tree</span>
                Subtasks &amp; Work Breakdown
              </span>
<button className="text-primary hover:text-primary-fixed text-body-sm font-body-sm flex items-center gap-1 transition-colors" type="button">
<span className="material-symbols-outlined text-[14px]">add</span> Add Subtask
              </button>
</div>
<div className="flex flex-col rounded-lg bg-surface-container overflow-hidden">
{/*  Subtask 1  */}
<div className="flex items-center justify-between px-space-md py-2.5 hover:bg-surface-container-high transition-colors group cursor-pointer border-b border-outline-variant/10">
<div className="flex items-center gap-space-sm min-w-0">
<span className="material-symbols-outlined text-[16px] text-primary" style={{fontVariationSettings: "\'FILL\' 1"}}>check_circle</span>
<span className="font-label-code text-label-code text-outline group-hover:text-primary transition-colors">SCR-104.1</span>
<span className="text-on-surface font-body-md text-body-md truncate">WebGL Canvas Layer &amp; Vertex Buffer Allocation</span>
</div>
<div className="flex items-center gap-space-md shrink-0">
<span className="text-[11px] font-label-badge bg-surface-container-lowest px-1.5 py-0.5 rounded text-outline">Done</span>
<div className="w-5 h-5 rounded-full bg-secondary-container text-on-secondary text-[10px] flex items-center justify-center font-bold">ER</div>
</div>
</div>
{/*  Subtask 2  */}
<div className="flex items-center justify-between px-space-md py-2.5 hover:bg-surface-container-high transition-colors group cursor-pointer border-b border-outline-variant/10">
<div className="flex items-center gap-space-sm min-w-0">
<span className="material-symbols-outlined text-[16px] text-primary">radio_button_unchecked</span>
<span className="font-label-code text-label-code text-outline group-hover:text-primary transition-colors">SCR-104.2</span>
<span className="text-on-surface font-body-md text-body-md truncate">Latency Telemetry Hook &amp; WebSocket Backpressure</span>
</div>
<div className="flex items-center gap-space-md shrink-0">
<span className="text-[11px] font-label-badge bg-primary-container/20 px-1.5 py-0.5 rounded text-primary">In Progress</span>
<div className="w-5 h-5 rounded-full bg-primary-container text-on-primary-container text-[10px] flex items-center justify-center font-bold">AM</div>
</div>
</div>
{/*  Subtask 3  */}
<div className="flex items-center justify-between px-space-md py-2.5 hover:bg-surface-container-high transition-colors group cursor-pointer">
<div className="flex items-center gap-space-sm min-w-0">
<span className="material-symbols-outlined text-[16px] text-outline">radio_button_unchecked</span>
<span className="font-label-code text-label-code text-outline group-hover:text-primary transition-colors">SCR-104.3</span>
<span className="text-on-surface-variant font-body-md text-body-md truncate">Scrubbing Controller &amp; Keyframe Replay Engine</span>
</div>
<div className="flex items-center gap-space-md shrink-0">
<span className="text-[11px] font-label-badge bg-surface-container-lowest px-1.5 py-0.5 rounded text-outline">Todo</span>
<div className="w-5 h-5 rounded-full bg-surface-container-highest text-outline text-[10px] flex items-center justify-center font-bold">ER</div>
</div>
</div>
</div>
</div>
{/*  Pull Request Attachment  */}
<div className="flex flex-col gap-2 pt-2">
<span className="font-headline-sm text-headline-sm text-on-surface tracking-tight flex items-center gap-2">
<span className="material-symbols-outlined text-outline text-[18px]">merge</span>
              Pull Requests &amp; Branches
            </span>
<div className="p-space-md bg-surface-container rounded-lg flex items-center justify-between hover:bg-surface-container-high transition-colors">
<div className="flex items-center gap-space-sm">
<div className="w-7 h-7 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-[16px]">call_merge</span>
</div>
<div className="flex flex-col">
<div className="flex items-center gap-2">
<span className="font-body-md text-body-md font-medium text-on-surface">feat(canvas): streaming buffers and real-time scrubbing</span>
<span className="px-1.5 py-0.2 rounded-lg bg-primary-container text-on-primary-container font-label-badge text-[10px] font-semibold">merged-staging</span>
</div>
<span className="font-label-code text-[11px] text-outline">#489 by elena-r · merged 4 hours ago into <span className="text-primary">main</span></span>
</div>
</div>
<a className="h-7 px-2.5 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface text-body-sm font-body-sm flex items-center gap-1 transition-colors" href="/projects/prj-204">
                View PR
                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
</a>
</div>
</div>
</div>
</div>
{/*  Activity Feed & Timeline & Comment System  */}
<div className="bg-surface-container-low rounded-xl p-space-lg flex flex-col gap-space-lg shadow-sm">
<div className="flex items-center justify-between border-b border-outline-variant/20 pb-space-sm">
<div className="flex items-center gap-space-md">
<span className="font-headline-sm text-headline-sm text-on-surface tracking-tight">Activity Feed</span>
<div className="flex items-center gap-1 bg-surface-container rounded-lg p-0.5">
<button className="px-2 py-0.5 text-body-sm font-body-sm rounded-lg bg-surface-container-high text-on-surface" type="button">All</button>
<button className="px-2 py-0.5 text-body-sm font-body-sm rounded-lg text-outline hover:text-on-surface transition-colors" type="button">Comments</button>
<button className="px-2 py-0.5 text-body-sm font-body-sm rounded-lg text-outline hover:text-on-surface transition-colors" type="button">History</button>
</div>
</div>
<span className="font-label-kbd text-label-kbd text-outline">3 items</span>
</div>
{/*  Timeline Events  */}
<div className="flex flex-col gap-space-lg relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-outline-variant/30">
{/*  Event 1: Status Change  */}
<div className="flex items-start gap-space-md relative pl-1">
<div className="w-5 h-5 rounded-full bg-surface-container border-2 border-surface-container-low flex items-center justify-center text-primary z-10">
<span className="material-symbols-outlined text-[12px]">change_circle</span>
</div>
<div className="flex items-center gap-2 text-body-sm font-body-sm pt-0.5">
<span className="font-medium text-on-surface">Elena Rostova</span>
<span className="text-outline">changed status from</span>
<span className="px-1.5 py-0.2 rounded bg-surface-container text-outline text-[11px]">Todo</span>
<span className="text-outline">to</span>
<span className="px-1.5 py-0.2 rounded bg-primary-container/20 text-primary text-[11px] font-medium">In Progress</span>
<span className="text-outline-variant text-[11px] ml-2">Yesterday at 14:24</span>
</div>
</div>
{/*  Event 2: Commit Reference  */}
<div className="flex items-start gap-space-md relative pl-1">
<div className="w-5 h-5 rounded-full bg-surface-container border-2 border-surface-container-low flex items-center justify-center text-outline z-10">
<span className="material-symbols-outlined text-[12px]">commit</span>
</div>
<div className="flex flex-col gap-1 text-body-sm font-body-sm pt-0.5">
<div className="flex items-center gap-2">
<span className="font-medium text-on-surface">Arbian Musaf</span>
<span className="text-outline">referenced commit</span>
<span className="font-label-code text-label-code text-primary bg-surface-container px-1 py-0.5 rounded">e4b7891</span>
<span className="text-outline-variant text-[11px]">18h ago</span>
</div>
<span className="text-on-surface-variant font-label-code text-[12px] bg-surface-container/60 p-1.5 rounded-lg max-w-lg">
                canvas: add dual-buffered instanced render pass for metric cards
              </span>
</div>
</div>
{/*  Event 3: Threaded Comment  */}
<div className="flex items-start gap-space-md relative pl-1">
<div className="w-5 h-5 rounded-full bg-secondary-container text-on-secondary font-bold text-[10px] flex items-center justify-center z-10 ring-2 ring-surface-container-low">
              AM
            </div>
<div className="flex flex-col gap-space-xs w-full bg-surface-container rounded-lg p-space-md">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="font-body-md text-body-md font-medium text-on-surface">Arbian Musaf</span>
<span className="font-label-badge text-[10px] px-1.5 py-0.5 rounded bg-surface-container-high text-outline">Lead Reviewer</span>
<span className="text-outline text-body-sm">· 6h ago</span>
</div>
<div className="flex items-center gap-1 text-outline hover:text-on-surface cursor-pointer">
<span className="material-symbols-outlined text-[16px]">thumb_up</span>
<span className="text-[11px] font-label-kbd">2</span>
</div>
</div>
<div className="text-body-md font-body-md text-on-surface-variant leading-relaxed">
                Tested the latest WebGL memory allocators on chromium head. Memory retention stays under 42MB during peak stress at 25,000 points. Let's make sure the mousewheel inertia on timeline scrubbing doesn't trigger continuous layout repaints.
              </div>
</div>
</div>
{/*  Event 4: Response Comment  */}
<div className="flex items-start gap-space-md relative pl-1">
<div className="w-5 h-5 rounded-full bg-primary-container text-on-primary-container font-bold text-[10px] flex items-center justify-center z-10 ring-2 ring-surface-container-low">
              ER
            </div>
<div className="flex flex-col gap-space-xs w-full bg-surface-container rounded-lg p-space-md">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="font-body-md text-body-md font-medium text-on-surface">Elena Rostova</span>
<span className="font-label-badge text-[10px] px-1.5 py-0.5 rounded bg-primary-container/20 text-primary">Assignee</span>
<span className="text-outline text-body-sm">· 2h ago</span>
</div>
<button className="text-outline hover:text-on-surface transition-colors" type="button">
<span className="material-symbols-outlined text-[16px]">reply</span>
</button>
</div>
<div className="text-body-md font-body-md text-on-surface-variant leading-relaxed">
                Great catch! Added a passive wheel listener with <code className="font-label-code text-label-code bg-surface-container-high px-1 py-0.5 rounded text-primary">requestAnimationFrame</code> throttling in subtask SCR-104.3. Staging deploy running now.
              </div>
</div>
</div>
</div>
{/*  Quick Reply / Comment Composer  */}
<div className="mt-space-sm flex flex-col gap-2 bg-surface-container rounded-lg p-space-md">
<div className="flex items-center justify-between text-body-sm font-body-sm text-outline border-b border-outline-variant/20 pb-2">
<span className="flex items-center gap-1 font-medium text-on-surface">
<span className="material-symbols-outlined text-[16px]">edit_note</span>
              Write a comment
            </span>
<div className="flex items-center gap-2 text-[11px] font-label-code">
<span>Markdown supported</span>
<span className="font-label-kbd text-label-kbd bg-surface-container-high px-1 rounded">⌘Enter to submit</span>
</div>
</div>
<textarea className="w-full bg-surface-container-lowest text-on-surface placeholder-outline font-body-md text-body-md rounded-lg p-2.5 resize-none border-0 focus:ring-1 focus:ring-primary-container outline-none" id="commentInput" placeholder="Leave a note or type '/' for slash commands..." rows={3}></textarea>
<div className="flex items-center justify-between pt-1">
<div className="flex items-center gap-1 text-outline">
<button className="p-1 hover:text-on-surface rounded hover:bg-surface-container-high transition-colors" title="Attach file" type="button">
<span className="material-symbols-outlined text-[16px]">attach_file</span>
</button>
<button className="p-1 hover:text-on-surface rounded hover:bg-surface-container-high transition-colors" title="Mention person" type="button">
<span className="material-symbols-outlined text-[16px]">alternate_email</span>
</button>
<button className="p-1 hover:text-on-surface rounded hover:bg-surface-container-high transition-colors" title="Add emoji" type="button">
<span className="material-symbols-outlined text-[16px]">sentiment_satisfied</span>
</button>
</div>
<button className="h-7 px-3 bg-primary-container hover:bg-primary-container/90 text-on-primary-container rounded-lg text-body-sm font-headline-sm flex items-center gap-1 transition-colors" id="postCommentBtn" type="button">
<span>Comment</span>
</button>
</div>
</div>
</div>
</div>
{/*  Right Metadata Inspector Sidebar (Col 4)  */}
<div className="lg:col-span-4 flex flex-col gap-space-md">
{/*  Property Sheet Card  */}
<div className="bg-surface-container-low rounded-xl p-space-lg flex flex-col gap-space-md shadow-sm">
<div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
<span className="font-headline-sm text-headline-sm text-on-surface tracking-tight">Properties</span>
<button className="text-outline hover:text-on-surface text-body-sm font-body-sm flex items-center gap-1 transition-colors" type="button">
<span className="material-symbols-outlined text-[14px]">settings</span>
            Customize
          </button>
</div>
<div className="flex flex-col gap-space-sm text-body-sm font-body-sm">
{/*  Assignee  */}
<div className="flex items-center justify-between py-1 hover:bg-surface-container rounded-lg px-1.5 transition-colors cursor-pointer group">
<span className="text-outline group-hover:text-on-surface-variant transition-colors flex items-center gap-1.5">
<span className="material-symbols-outlined text-[15px]">person</span>
              Assignee
            </span>
<div className="flex items-center gap-1.5">
<div className="w-5 h-5 rounded-full bg-primary-container text-on-primary-container text-[10px] flex items-center justify-center font-bold">ER</div>
<span className="text-on-surface font-medium">Elena Rostova</span>
</div>
</div>
{/*  Reviewer  */}
<div className="flex items-center justify-between py-1 hover:bg-surface-container rounded-lg px-1.5 transition-colors cursor-pointer group">
<span className="text-outline group-hover:text-on-surface-variant transition-colors flex items-center gap-1.5">
<span className="material-symbols-outlined text-[15px]">rate_review</span>
              Reviewer
            </span>
<div className="flex items-center gap-1.5">
<div className="w-5 h-5 rounded-full bg-secondary-container text-on-secondary text-[10px] flex items-center justify-center font-bold">AM</div>
<span className="text-on-surface font-medium">Arbian Musaf</span>
</div>
</div>
{/*  Labels  */}
<div className="flex items-start justify-between py-1 hover:bg-surface-container rounded-lg px-1.5 transition-colors cursor-pointer group">
<span className="text-outline group-hover:text-on-surface-variant transition-colors flex items-center gap-1.5 pt-0.5">
<span className="material-symbols-outlined text-[15px]">label</span>
              Labels
            </span>
<div className="flex flex-wrap gap-1 justify-end max-w-[180px]">
<span className="px-1.5 py-0.5 rounded-lg bg-surface-container-high text-primary font-label-badge text-[11px]">frontend</span>
<span className="px-1.5 py-0.5 rounded-lg bg-surface-container-high text-secondary-fixed-dim font-label-badge text-[11px]">analytics</span>
<span className="px-1.5 py-0.5 rounded-lg bg-surface-container-high text-on-surface font-label-badge text-[11px]">canvas-2.0</span>
</div>
</div>
{/*  Due Date  */}
<div className="flex items-center justify-between py-1 hover:bg-surface-container rounded-lg px-1.5 transition-colors cursor-pointer group">
<span className="text-outline group-hover:text-on-surface-variant transition-colors flex items-center gap-1.5">
<span className="material-symbols-outlined text-[15px]">calendar_today</span>
              Due Date
            </span>
<div className="flex items-center gap-1 text-on-surface font-medium">
<span>Oct 28, 2024</span>
<span className="font-label-badge text-[10px] text-error bg-error-container/20 px-1 py-0.2 rounded">In 4 days</span>
</div>
</div>
{/*  Milestone  */}
<div className="flex items-center justify-between py-1 hover:bg-surface-container rounded-lg px-1.5 transition-colors cursor-pointer group">
<span className="text-outline group-hover:text-on-surface-variant transition-colors flex items-center gap-1.5">
<span className="material-symbols-outlined text-[15px]">flag</span>
              Milestone
            </span>
<div className="flex items-center gap-1 text-on-surface font-medium truncate max-w-[150px]">
<span className="truncate">v2.0 Beta RC</span>
</div>
</div>
{/*  Project  */}
<div className="flex items-center justify-between py-1 hover:bg-surface-container rounded-lg px-1.5 transition-colors cursor-pointer group">
<span className="text-outline group-hover:text-on-surface-variant transition-colors flex items-center gap-1.5">
<span className="material-symbols-outlined text-[15px]">rocket_launch</span>
              Project
            </span>
<div className="flex items-center gap-1 text-on-surface font-medium">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
<span>Nexus 2.0</span>
</div>
</div>
</div>
</div>
{/*  Linked Time Tracker Widget  */}
<div className="bg-surface-container-low rounded-xl p-space-lg flex flex-col gap-space-md shadow-sm">
<div className="flex items-center justify-between">
<span className="font-headline-sm text-headline-sm text-on-surface tracking-tight flex items-center gap-1.5">
<span className="material-symbols-outlined text-[16px] text-primary">schedule</span>
            Time Logged
          </span>
<button className="h-6 px-2 rounded-lg bg-surface-container hover:bg-primary-container hover:text-on-primary-container text-on-surface-variant transition-colors flex items-center gap-1 font-body-sm text-[11px]" id="quickLogBtn" type="button">
<span className="material-symbols-outlined text-[13px]">add</span>
            Log Time
          </button>
</div>
{/*  Metric Numbers  */}
<div className="flex items-baseline justify-between pt-1">
<div className="flex items-baseline gap-1.5">
<span className="font-display-lg text-headline-lg font-semibold text-on-surface font-label-code">14h 20m</span>
<span className="text-outline text-body-sm font-body-sm">of 16h est.</span>
</div>
<span className="text-label-badge font-label-code text-primary font-medium">89%</span>
</div>
{/*  Progress Bar  */}
<div className="w-full bg-surface-container-lowest h-2 rounded-lg overflow-hidden flex">
<div className="bg-primary-container h-full transition-all duration-500" style={{width: "89%"}}></div>
</div>
{/*  Quick Log Breakdowns  */}
<div className="flex flex-col gap-1.5 pt-1 text-body-sm font-body-sm text-outline">
<div className="flex items-center justify-between">
<span className="flex items-center gap-1.5">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
              Elena (WebGL Buffer)
            </span>
<span className="font-label-code text-on-surface">10h 30m</span>
</div>
<div className="flex items-center justify-between">
<span className="flex items-center gap-1.5">
<span className="w-1.5 h-1.5 rounded-full bg-secondary-container"></span>
              Arbian (Benchmarking)
            </span>
<span className="font-label-code text-on-surface">3h 50m</span>
</div>
</div>
</div>
{/*  Keyboard Command Shortcuts Aid  */}
<div className="bg-surface-container-low rounded-xl p-space-md flex flex-col gap-2 text-body-sm font-body-sm text-outline shadow-sm">
<span className="text-[11px] font-label-badge uppercase tracking-wider text-outline">Linear Shortcuts</span>
<div className="grid grid-cols-2 gap-2 text-[11px] font-label-kbd">
<div className="flex items-center justify-between bg-surface-container px-2 py-1 rounded-lg">
<span>Change Status</span>
<span className="bg-surface-container-high px-1 rounded text-on-surface">S</span>
</div>
<div className="flex items-center justify-between bg-surface-container px-2 py-1 rounded-lg">
<span>Assign Issue</span>
<span className="bg-surface-container-high px-1 rounded text-on-surface">A</span>
</div>
<div className="flex items-center justify-between bg-surface-container px-2 py-1 rounded-lg">
<span>Set Priority</span>
<span className="bg-surface-container-high px-1 rounded text-on-surface">P</span>
</div>
<div className="flex items-center justify-between bg-surface-container px-2 py-1 rounded-lg">
<span>Add Label</span>
<span className="bg-surface-container-high px-1 rounded text-on-surface">L</span>
</div>
</div>
</div>
</div>
</div>
</div>

    </div>
  );
}
