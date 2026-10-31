"use client";

import Link from "next/link";
import React, { useState } from "react";

export function OverviewTab() {
  return (
    <div className="flex flex-col w-full">
{/*  Top Command & Action Bar  */}
<div className="w-full flex flex-col gap-space-md pt-4 pb-space-lg">
{/*  Breadcrumb + Live Sync indicator  */}
<div className="flex items-center justify-between">
<nav aria-label="Breadcrumb" className="flex items-center gap-2">
<span className="font-body-sm text-body-sm text-outline">Projects</span>
<span className="font-body-sm text-body-sm text-outline-variant">/</span>
<span className="font-label-code text-label-code text-outline uppercase tracking-wider">PRJ-204</span>
<span className="font-body-sm text-body-sm text-outline-variant">/</span>
<span className="font-headline-sm text-body-sm text-on-surface font-medium">Nexus 2.0 Redesign</span>
</nav>
<div className="flex items-center gap-space-sm">
<div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-surface-container-low text-outline">
<span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
<span className="font-label-kbd text-label-kbd uppercase tracking-wider text-on-surface-variant">Live Pipeline</span>
</div>
<button className="h-7 px-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-body-sm flex items-center gap-1.5 transition-colors" type="button">
<span className="material-symbols-outlined text-[15px]">share</span>
<span>Share</span>
</button>
<button className="h-7 px-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-body-sm flex items-center gap-1.5 transition-colors" type="button">
<span className="material-symbols-outlined text-[15px]">link</span>
<span>Copy URL</span>
<kbd className="font-label-kbd text-[10px] text-outline ml-1">⌘L</kbd>
</button>
<button className="h-7 px-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-body-sm flex items-center gap-1.5 transition-colors" type="button">
<span className="material-symbols-outlined text-[15px]">edit</span>
<span>Edit Spec</span>
<kbd className="font-label-kbd text-[10px] text-outline ml-1">E</kbd>
</button>
<button className="h-7 px-3 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container text-body-sm font-headline-sm flex items-center gap-1.5 shadow-sm transition-colors" type="button">
<span className="material-symbols-outlined text-[15px]">add_circle</span>
<span>New Issue</span>
<kbd className="font-label-kbd text-[10px] text-on-primary-container/80 ml-1">N</kbd>
</button>
</div>
</div>
{/*  Title & Key Indicators Row  */}
<div className="flex flex-wrap items-end justify-between gap-space-lg">
<div className="flex flex-col gap-1.5">
<div className="flex items-center gap-3">
<div className="w-8 h-8 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary font-label-code text-body-md font-semibold">
            N2
          </div>
<h1 className="font-display-lg text-display-lg text-on-surface tracking-tight">Nexus 2.0 Redesign</h1>
<span className="font-label-code text-label-code px-2 py-0.5 rounded-lg bg-surface-container-high text-primary tracking-wide">PRJ-204</span>
</div>
<p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
          Next-generation interface engine overhaul, introducing WebGL hardware acceleration, instant local cache hydration, token-compiled theme engines, and multi-cursor real-time telemetry canvas.
        </p>
</div>
{/*  Quick Badges Group  */}
<div className="flex items-center flex-wrap gap-2">
{/*  Status  */}
<div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-high text-on-surface">
<span className="w-2 h-2 rounded-full bg-secondary-fixed"></span>
<span className="font-label-badge text-label-badge text-on-surface font-medium">In Progress</span>
<span className="font-body-sm text-[11px] text-outline">· On Track</span>
</div>
{/*  Priority  */}
<div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-high text-error">
<span className="material-symbols-outlined text-[14px]">priority_high</span>
<span className="font-label-badge text-label-badge font-medium">High Priority</span>
</div>
{/*  Target Date  */}
<div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-high text-on-surface-variant">
<span className="material-symbols-outlined text-[14px] text-outline">event</span>
<span className="font-body-sm text-body-sm text-on-surface font-medium">Oct 29, 2024</span>
<span className="font-label-code text-[11px] text-outline">(6 days left)</span>
</div>
{/*  Health Score  */}
<div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-high text-primary">
<span className="material-symbols-outlined text-[14px]">vital_signs</span>
<span className="font-label-code text-body-sm font-semibold">94% Health</span>
</div>
</div>
</div>
</div>
{/*  Primary Project Metrics Grid (High Density Bento Strip)  */}
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 pb-space-lg">
{/*  Issues Progress  */}
<div className="p-3.5 rounded-lg bg-surface-container-low shadow-sm flex flex-col justify-between">
<div className="flex items-center justify-between text-outline">
<span className="font-label-badge text-label-badge uppercase tracking-wider text-outline">Execution State</span>
<span className="font-label-code text-label-code text-primary">68%</span>
</div>
<div className="my-2.5">
<div className="flex items-baseline gap-2">
<span className="font-headline-lg text-headline-lg text-on-surface">39</span>
<span className="font-body-sm text-body-sm text-outline">/ 58 issues open</span>
</div>
{/*  Segmented bar  */}
<div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden flex gap-0.5 mt-2">
<div className="h-full bg-primary-container" style={{width: "68%"}}></div>
<div className="h-full bg-secondary-fixed" style={{width: "9%"}}></div>
<div className="h-full bg-surface-bright" style={{width: "23%"}}></div>
</div>
</div>
<div className="flex items-center justify-between text-[11px] font-body-sm text-outline">
<span>14 done</span>
<span>5 in review</span>
<span>39 active</span>
</div>
</div>
{/*  Cycle Cadence  */}
<div className="p-3.5 rounded-lg bg-surface-container-low shadow-sm flex flex-col justify-between">
<div className="flex items-center justify-between text-outline">
<span className="font-label-badge text-label-badge uppercase tracking-wider text-outline">Active Sprint</span>
<span className="font-label-code text-label-code text-on-surface">Day 8 of 14</span>
</div>
<div className="my-2.5">
<div className="flex items-baseline gap-1.5">
<span className="font-headline-lg text-headline-lg text-on-surface">Sprint 14</span>
</div>
<p className="font-body-sm text-body-sm text-outline truncate mt-0.5">Core UI &amp; Shader Stream</p>
</div>
<div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
<div className="bg-secondary h-full" style={{width: "57%"}}></div>
</div>
</div>
{/*  Hours Allocation & Velocity  */}
<div className="p-3.5 rounded-lg bg-surface-container-low shadow-sm flex flex-col justify-between">
<div className="flex items-center justify-between text-outline">
<span className="font-label-badge text-label-badge uppercase tracking-wider text-outline">Hours Logged</span>
<span className="font-label-code text-label-code text-on-surface-variant">+8.4h today</span>
</div>
<div className="my-2.5">
<div className="flex items-baseline gap-1.5">
<span className="font-headline-lg text-headline-lg text-on-surface">142h</span>
<span className="font-body-sm text-body-sm text-outline">/ 210h est</span>
</div>
<div className="flex items-center gap-1.5 mt-1 text-primary">
<span className="material-symbols-outlined text-[14px]">trending_up</span>
<span className="font-label-code text-[11px]">Velocity +14% vs Sprint 13</span>
</div>
</div>
<div className="flex items-center justify-between text-[11px] text-outline font-label-code">
<span>Burn rate: 1.12x</span>
<span>68h remaining</span>
</div>
</div>
{/*  Budget & Financials  */}
<div className="p-3.5 rounded-lg bg-surface-container-low shadow-sm flex flex-col justify-between">
<div className="flex items-center justify-between text-outline">
<span className="font-label-badge text-label-badge uppercase tracking-wider text-outline">Cap Utilization</span>
<span className="font-label-code text-label-code text-primary">67.6%</span>
</div>
<div className="my-2.5">
<div className="flex items-baseline gap-1.5">
<span className="font-headline-lg text-headline-lg text-on-surface">$19,880</span>
<span className="font-body-sm text-body-sm text-outline">/ $29,400</span>
</div>
<p className="font-body-sm text-body-sm text-outline truncate mt-0.5">Fixed milestone contract</p>
</div>
<div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
<div className="bg-primary-container h-full" style={{width: "67.6%"}}></div>
</div>
</div>
{/*  Leadership & Squad  */}
<div className="p-3.5 rounded-lg bg-surface-container-low shadow-sm flex flex-col justify-between">
<div className="flex items-center justify-between text-outline">
<span className="font-label-badge text-label-badge uppercase tracking-wider text-outline">Squad Roster</span>
<span className="font-label-code text-label-code text-outline">6 members</span>
</div>
<div className="flex items-center gap-2.5 my-2">
<div className="w-7 h-7 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-body-sm font-semibold">
          ER
        </div>
<div className="flex flex-col min-w-0">
<span className="font-headline-sm text-body-sm text-on-surface truncate">Elena Rostova</span>
<span className="font-body-sm text-[11px] text-outline truncate">Staff Architect · Lead</span>
</div>
</div>
{/*  Mini avatar stack  */}
<div className="flex items-center justify-between">
<div className="flex -space-x-1.5 overflow-hidden">
<div className="w-5 h-5 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-[10px] font-medium ring-1 ring-surface-container-low">MK</div>
<div className="w-5 h-5 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center text-[10px] font-medium ring-1 ring-surface-container-low">TL</div>
<div className="w-5 h-5 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center text-[10px] font-medium ring-1 ring-surface-container-low">JS</div>
<div className="w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center text-[10px] font-medium ring-1 ring-surface-container-low">AD</div>
<div className="w-5 h-5 rounded-full bg-surface-bright text-on-surface flex items-center justify-center text-[9px] ring-1 ring-surface-container-low">+2</div>
</div>
<span className="font-label-code text-[11px] text-outline">All synced</span>
</div>
</div>
</div>
{/*  In-Project Tab Navigation Bar  */}
<div className="w-full flex items-center justify-between border-b border-outline-variant/30 mb-6 overflow-x-auto">
<div className="flex items-center gap-1">
<button className="px-3.5 py-2.5 font-headline-sm text-body-sm text-on-surface border-b-2 border-primary-container flex items-center gap-2" type="button">
<span className="material-symbols-outlined text-[16px] text-primary">dashboard</span>
<span>Overview</span>
</button>
<button className="px-3.5 py-2.5 font-headline-sm text-body-sm text-outline hover:text-on-surface hover:border-b-2 hover:border-outline-variant transition-colors flex items-center gap-2" type="button">
<span className="material-symbols-outlined text-[16px]">check_box</span>
<span>Issues</span>
<span className="font-label-code text-[10px] px-1.5 py-0.2 rounded-lg bg-surface-container text-outline">58</span>
</button>
<button className="px-3.5 py-2.5 font-headline-sm text-body-sm text-outline hover:text-on-surface transition-colors flex items-center gap-2" type="button">
<span className="material-symbols-outlined text-[16px]">cycle</span>
<span>Cycles &amp; Sprints</span>
</button>
<button className="px-3.5 py-2.5 font-headline-sm text-body-sm text-outline hover:text-on-surface transition-colors flex items-center gap-2" type="button">
<span className="material-symbols-outlined text-[16px]">flag</span>
<span>Milestones</span>
<span className="font-label-code text-[10px] px-1.5 py-0.2 rounded-lg bg-surface-container text-outline">4</span>
</button>
<button className="px-3.5 py-2.5 font-headline-sm text-body-sm text-outline hover:text-on-surface transition-colors flex items-center gap-2" type="button">
<span className="material-symbols-outlined text-[16px]">article</span>
<span>Documents &amp; RFCs</span>
<span className="font-label-code text-[10px] px-1.5 py-0.2 rounded-lg bg-surface-container text-outline">6</span>
</button>
<button className="px-3.5 py-2.5 font-headline-sm text-body-sm text-outline hover:text-on-surface transition-colors flex items-center gap-2" type="button">
<span className="material-symbols-outlined text-[16px]">group</span>
<span>Team &amp; Access</span>
</button>
<button className="px-3.5 py-2.5 font-headline-sm text-body-sm text-outline hover:text-on-surface transition-colors flex items-center gap-2" type="button">
<span className="material-symbols-outlined text-[16px]">insights</span>
<span>Analytics</span>
</button>
</div>
<div className="flex items-center gap-2 pb-1.5">
<div className="flex items-center gap-1 bg-surface-container-low px-2 py-1 rounded-lg">
<span className="material-symbols-outlined text-[14px] text-outline">filter_list</span>
<span className="font-body-sm text-[11px] text-outline">Filter stream</span>
</div>
<div className="flex items-center gap-1 bg-surface-container-low px-2 py-1 rounded-lg">
<span className="material-symbols-outlined text-[14px] text-outline">sort</span>
<span className="font-body-sm text-[11px] text-outline">Updated</span>
</div>
</div>
</div>
{/*  Master-Detail Content Grid (2:1 Proportion)  */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
{/*  Primary Content Stream (Cols 1-8)  */}
<div className="lg:col-span-8 flex flex-col gap-6">
{/*  Active Workstream Section  */}
<section className="p-4 rounded-lg bg-surface-container-low shadow-sm flex flex-col gap-3.5">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2.5">
<span className="w-2.5 h-2.5 rounded-full bg-primary-container"></span>
<div className="flex items-baseline gap-2">
<h2 className="font-headline-md text-headline-sm text-on-surface">Sprint 14: Core UI &amp; Analytics</h2>
<span className="font-label-code text-body-sm text-outline">Oct 14 – Oct 28</span>
</div>
</div>
<div className="flex items-center gap-3">
<div className="flex items-center gap-1 text-primary font-label-code text-body-sm font-medium">
<span>72% completed</span>
</div>
<button className="text-outline hover:text-on-surface transition-colors" type="button">
<span className="material-symbols-outlined text-[18px]">open_in_new</span>
</button>
</div>
</div>
<div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
<div className="bg-primary-container h-full" style={{width: "72%"}}></div>
</div>
{/*  Issue Mini Table / High-Density List  */}
<div className="flex flex-col mt-1 divide-y divide-outline-variant/10">
{/*  Row 1  */}
<div className="h-10 flex items-center justify-between px-2 rounded-lg hover:bg-surface-container transition-colors group cursor-pointer">
<div className="flex items-center gap-3 min-w-0">
<span className="material-symbols-outlined text-[16px] text-secondary">motion_photos_paused</span>
<span className="font-label-code text-label-code text-outline group-hover:text-primary">SCR-104</span>
<span className="font-body-md text-body-md text-on-surface truncate">WebGL canvas frame stream double-buffering &amp; memory leak fix</span>
</div>
<div className="flex items-center gap-3 shrink-0 ml-4">
<span className="font-label-badge text-[11px] px-2 py-0.5 rounded-lg bg-surface-container-high text-on-surface-variant">In Progress</span>
<span className="font-label-code text-[11px] text-outline">28h</span>
<div className="w-5 h-5 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-[10px] font-semibold">
                ER
              </div>
</div>
</div>
{/*  Row 2  */}
<div className="h-10 flex items-center justify-between px-2 rounded-lg hover:bg-surface-container transition-colors group cursor-pointer">
<div className="flex items-center gap-3 min-w-0">
<span className="material-symbols-outlined text-[16px] text-primary">hourglass_top</span>
<span className="font-label-code text-label-code text-outline group-hover:text-primary">SCR-106</span>
<span className="font-body-md text-body-md text-on-surface truncate">Optimistic offline state queue replay under degraded network</span>
</div>
<div className="flex items-center gap-3 shrink-0 ml-4">
<span className="font-label-badge text-[11px] px-2 py-0.5 rounded-lg bg-surface-container-high text-on-surface-variant">In Review</span>
<span className="font-label-code text-[11px] text-outline">16h</span>
<div className="w-5 h-5 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center text-[10px] font-semibold">
                MK
              </div>
</div>
</div>
{/*  Row 3  */}
<div className="h-10 flex items-center justify-between px-2 rounded-lg hover:bg-surface-container transition-colors group cursor-pointer">
<div className="flex items-center gap-3 min-w-0">
<span className="material-symbols-outlined text-[16px] text-outline">radio_button_unchecked</span>
<span className="font-label-code text-label-code text-outline group-hover:text-primary">SCR-108</span>
<span className="font-body-md text-body-md text-on-surface truncate">Virtual DOM spreadsheet virtualization for 100k+ row datasets</span>
</div>
<div className="flex items-center gap-3 shrink-0 ml-4">
<span className="font-label-badge text-[11px] px-2 py-0.5 rounded-lg bg-surface-container text-outline">Todo</span>
<span className="font-label-code text-[11px] text-outline">12h</span>
<div className="w-5 h-5 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-[10px] font-semibold">
                TL
              </div>
</div>
</div>
{/*  Row 4  */}
<div className="h-10 flex items-center justify-between px-2 rounded-lg hover:bg-surface-container transition-colors group cursor-pointer">
<div className="flex items-center gap-3 min-w-0">
<span className="material-symbols-outlined text-[16px] text-primary" style={{fontVariationSettings: "\'FILL\' 1"}}>check_circle</span>
<span className="font-label-code text-label-code text-outline group-hover:text-primary line-through">SCR-099</span>
<span className="font-body-md text-body-md text-outline truncate line-through">Color system migration to OKLCH perceptual space tokens</span>
</div>
<div className="flex items-center gap-3 shrink-0 ml-4">
<span className="font-label-badge text-[11px] px-2 py-0.5 rounded-lg bg-primary/10 text-primary">Done</span>
<span className="font-label-code text-[11px] text-outline">8h</span>
<div className="w-5 h-5 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center text-[10px] font-semibold">
                JS
              </div>
</div>
</div>
</div>
<div className="flex items-center justify-between pt-1 text-body-sm text-outline">
<button className="hover:text-on-surface transition-colors flex items-center gap-1 font-body-sm" type="button">
<span className="material-symbols-outlined text-[14px]">add</span>
<span>Add sprint issue</span>
<kbd className="font-label-kbd text-[10px] ml-1">A</kbd>
</button>
<a className="hover:text-on-surface transition-colors font-label-code text-body-sm" href="/projects/prj-204">View full sprint board →</a>
</div>
</section>
{/*  Key Milestones & Delivery Horizon  */}
<section className="p-4 rounded-lg bg-surface-container-low shadow-sm flex flex-col gap-4">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-outline text-[18px]">flag</span>
<h2 className="font-headline-sm text-headline-sm text-on-surface">Release Milestones</h2>
</div>
<span className="font-label-code text-body-sm text-outline">2 of 4 targets cleared</span>
</div>
<div className="flex flex-col gap-3">
{/*  Milestone Card 1  */}
<div className="p-3 rounded-lg bg-surface-container flex flex-col gap-2.5">
<div className="flex items-start justify-between">
<div className="flex items-start gap-2.5">
<div className="mt-0.5 w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-[13px]" style={{fontVariationSettings: "\'FILL\' 1"}}>check</span>
</div>
<div className="flex flex-col">
<span className="font-headline-sm text-body-md text-on-surface">Milestone 1: Multi-theme Token Ingestion</span>
<p className="font-body-sm text-body-sm text-outline">Export and dynamic runtime compile pipeline for Figma Design System v3.2</p>
</div>
</div>
<span className="font-label-code text-[11px] px-2 py-0.5 rounded-lg bg-primary/10 text-primary">Completed Oct 25</span>
</div>
<div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
<div className="bg-primary h-full" style={{width: "100%"}}></div>
</div>
</div>
{/*  Milestone Card 2  */}
<div className="p-3 rounded-lg bg-surface-container flex flex-col gap-2.5">
<div className="flex items-start justify-between">
<div className="flex items-start gap-2.5">
<div className="mt-0.5 w-4 h-4 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
<span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
</div>
<div className="flex flex-col">
<span className="font-headline-sm text-body-md text-on-surface">Milestone 2: Nexus 2.0 Beta Release Candidate</span>
<p className="font-body-sm text-body-sm text-outline">Public beta rollout across dogfood clusters; telemetry baseline validation</p>
</div>
</div>
<div className="flex items-center gap-2">
<span className="font-label-code text-[11px] text-secondary">82%</span>
<span className="font-label-code text-[11px] px-2 py-0.5 rounded-lg bg-surface-container-high text-on-surface">Target: Oct 29</span>
</div>
</div>
<div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
<div className="bg-secondary h-full" style={{width: "82%"}}></div>
</div>
</div>
{/*  Milestone Card 3  */}
<div className="p-3 rounded-lg bg-surface-container flex flex-col gap-2.5">
<div className="flex items-start justify-between">
<div className="flex items-start gap-2.5">
<div className="mt-0.5 w-4 h-4 rounded-full bg-surface-container-highest flex items-center justify-center text-outline">
<span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
</div>
<div className="flex flex-col">
<span className="font-headline-sm text-body-md text-on-surface-variant">Milestone 3: Client Acceptance &amp; Telemetry Sign-off</span>
<p className="font-body-sm text-body-sm text-outline">Full compliance audit with Acme Security team, zero regressions gate</p>
</div>
</div>
<span className="font-label-code text-[11px] px-2 py-0.5 rounded-lg bg-surface-container-high text-outline">Upcoming Nov 05</span>
</div>
<div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
<div className="bg-surface-bright h-full" style={{width: "15%"}}></div>
</div>
</div>
</div>
</section>
{/*  Embedded Technical Architecture / RFC Reference Card  */}
<section className="p-4 rounded-lg bg-surface-container-low shadow-sm flex flex-col gap-3">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-outline text-[18px]">terminal</span>
<h2 className="font-headline-sm text-headline-sm text-on-surface">Architecture RFC Preview: Realtime Synchronization Protocol</h2>
</div>
<span className="font-label-code text-label-code text-outline">RFC-8819</span>
</div>
<div className="p-3.5 rounded-lg bg-surface-container-lowest font-label-code text-[12px] leading-relaxed text-on-surface-variant overflow-x-auto">
<div className="text-outline">// Nexus 2.0 WebGL Pipeline: Memory Sharded State Replication</div>
<div className="mt-1"><span className="text-primary">interface</span> <span className="text-on-surface">NexusFrameBuffer</span> &#123;</div>
<div className="pl-4">streamId: <span className="text-secondary">UUID</span>;</div>
<div className="pl-4">syncClock: <span className="text-secondary">Uint64Array</span>; <span className="text-outline">// Hybrid Logical Clock (HLC)</span></div>
<div className="pl-4">layerTensors: <span className="text-secondary">Float32Array</span>[]; <span className="text-outline">// GPU-accelerated raster cache</span></div>
<div className="pl-4">deltaCompression: <span className="text-primary-container font-semibold">'ZSTD_STREAM'</span>;</div>
<div>&#125;</div>
</div>
<div className="flex items-center justify-between pt-1">
<span className="font-body-sm text-body-sm text-outline">Approved by Security &amp; Platform Architecture Group</span>
<button className="text-primary hover:text-on-primary-fixed-variant transition-colors font-headline-sm text-body-sm flex items-center gap-1" type="button">
<span>Read RFC-8819 doc</span>
<span className="material-symbols-outlined text-[14px]">arrow_forward</span>
</button>
</div>
</section>
{/*  Recent Project Activity Stream  */}
<section className="p-4 rounded-lg bg-surface-container-low shadow-sm flex flex-col gap-3.5">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-outline text-[18px]">history</span>
<h2 className="font-headline-sm text-headline-sm text-on-surface">Recent Project Activity</h2>
</div>
<span className="font-label-code text-body-sm text-outline">Synced 2m ago</span>
</div>
<div className="flex flex-col gap-2.5">
{/*  Commit item  */}
<div className="flex items-start gap-3 p-2 rounded-lg hover:bg-surface-container transition-colors">
<span className="material-symbols-outlined text-[16px] text-primary mt-0.5">merge_type</span>
<div className="flex flex-col flex-1 min-w-0">
<div className="flex items-center gap-2">
<span className="font-headline-sm text-body-sm text-on-surface">PR #489 Merged: feat(canvas): zero-copy streaming buffers</span>
<span className="font-label-code text-[11px] text-outline">by Elena Rostova</span>
</div>
<span className="font-body-sm text-[12px] text-outline truncate">Branch feature/buffer-opt merged into main with 0 build warnings.</span>
</div>
<span className="font-label-code text-[11px] text-outline shrink-0">14m ago</span>
</div>
{/*  Task Update  */}
<div className="flex items-start gap-3 p-2 rounded-lg hover:bg-surface-container transition-colors">
<span className="material-symbols-outlined text-[16px] text-secondary mt-0.5">change_circle</span>
<div className="flex flex-col flex-1 min-w-0">
<div className="flex items-center gap-2">
<span className="font-headline-sm text-body-sm text-on-surface">Marked SCR-106 as 'In Review'</span>
<span className="font-label-code text-[11px] text-outline">by Marcus Kane</span>
</div>
<span className="font-body-sm text-[12px] text-outline truncate">Assigned review requests to Elena Rostova and Tanya Liu.</span>
</div>
<span className="font-label-code text-[11px] text-outline shrink-0">1h ago</span>
</div>
{/*  Document updated  */}
<div className="flex items-start gap-3 p-2 rounded-lg hover:bg-surface-container transition-colors">
<span className="material-symbols-outlined text-[16px] text-outline mt-0.5">edit_document</span>
<div className="flex flex-col flex-1 min-w-0">
<div className="flex items-center gap-2">
<span className="font-headline-sm text-body-sm text-on-surface">Updated Release Notes Draft: v2.0.0-rc.3</span>
<span className="font-label-code text-[11px] text-outline">by James Silva</span>
</div>
<span className="font-body-sm text-[12px] text-outline truncate">Document updated with breaking shader parameter signatures.</span>
</div>
<span className="font-label-code text-[11px] text-outline shrink-0">3h ago</span>
</div>
</div>
</section>
</div>
{/*  Secondary Inspector Panel (Col 9-12)  */}
<div className="lg:col-span-4 flex flex-col gap-6">
{/*  Project Metadata / Properties Card  */}
<div className="p-4 rounded-lg bg-surface-container-low shadow-sm flex flex-col gap-3.5">
<span className="font-label-badge text-label-badge uppercase tracking-wider text-outline">Project Parameters</span>
<div className="flex flex-col divide-y divide-outline-variant/10 text-body-sm">
<div className="py-2 flex items-center justify-between">
<span className="text-outline">Project Lead</span>
<div className="flex items-center gap-1.5 text-on-surface font-medium">
<span className="w-4 h-4 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-[9px]">ER</span>
<span>Elena Rostova</span>
</div>
</div>
<div className="py-2 flex items-center justify-between">
<span className="text-outline">Target Milestone</span>
<span className="text-on-surface font-label-code">RC-2 (Oct 29)</span>
</div>
<div className="py-2 flex items-center justify-between">
<span className="text-outline">Codebase</span>
<a className="text-primary hover:underline font-label-code flex items-center gap-1" href="/projects/prj-204">
<span>acme/nexus-core</span>
<span className="material-symbols-outlined text-[12px]">open_in_new</span>
</a>
</div>
<div className="py-2 flex items-center justify-between">
<span className="text-outline">Client Account</span>
<span className="text-on-surface font-medium">Acme Global HQ</span>
</div>
<div className="py-2 flex items-center justify-between">
<span className="text-outline">Slack Sync</span>
<span className="text-on-surface-variant font-label-code">#proj-nexus-2</span>
</div>
<div className="py-2 flex items-center justify-between">
<span className="text-outline">Security Clearance</span>
<span className="font-label-badge text-[11px] px-1.5 py-0.5 rounded-lg bg-surface-container text-outline">SOC-2 Type II</span>
</div>
</div>
</div>
{/*  Velocity Sparkline Card (Inline SVG Dataviz)  */}
<div className="p-4 rounded-lg bg-surface-container-low shadow-sm flex flex-col gap-3">
<div className="flex items-center justify-between">
<span className="font-label-badge text-label-badge uppercase tracking-wider text-outline">Sprint Velocity Curve</span>
<span className="font-label-code text-[11px] text-primary">34 pts / cycle</span>
</div>
{/*  Inline Burndown SVG Chart  */}
<div className="w-full h-24 flex items-end">
<svg className="w-full h-full text-primary" fill="none" viewBox="0 0 280 80" xmlns="http://www.w3.org/2000/svg">
{/*  Background grid lines  */}
<line stroke="currentColor" stroke-dasharray="2 2" stroke-opacity="0.08" x1="0" x2="280" y1="20" y2="20"></line>
<line stroke="currentColor" stroke-dasharray="2 2" stroke-opacity="0.08" x1="0" x2="280" y1="50" y2="50"></line>
{/*  Ideal burndown line  */}
<path d="M10 15 L270 70" stroke="currentColor" stroke-dasharray="4 4" stroke-opacity="0.2" stroke-width="1.5"></path>
{/*  Actual velocity path  */}
<path d="M10 18 Q50 22 90 35 T170 42 T240 58 T270 65" stroke="currentColor" stroke-linecap="round" stroke-width="2"></path>
{/*  Fill gradient below actual curve  */}
<path d="M10 18 Q50 22 90 35 T170 42 T240 58 T270 65 L270 80 L10 80 Z" fill="currentColor" fill-opacity="0.07"></path>
{/*  Current position pin  */}
<circle cx="240" cy="58" fill="currentColor" r="3.5"></circle>
</svg>
</div>
<div className="flex items-center justify-between text-[11px] font-label-code text-outline pt-1">
<span>Sprint Start (Day 1)</span>
<span className="text-on-surface">Day 8 (Now)</span>
<span>Target (Day 14)</span>
</div>
</div>
{/*  Time & Effort Budget Breakdown  */}
<div className="p-4 rounded-lg bg-surface-container-low shadow-sm flex flex-col gap-3.5">
<div className="flex items-center justify-between">
<span className="font-label-badge text-label-badge uppercase tracking-wider text-outline">Effort by Discipline</span>
<span className="font-label-code text-[11px] text-outline">142h total</span>
</div>
<div className="flex flex-col gap-2.5">
{/*  Item 1  */}
<div className="flex flex-col gap-1">
<div className="flex justify-between text-body-sm">
<span className="text-on-surface">Frontend &amp; Canvas</span>
<span className="font-label-code text-outline">82h (58%)</span>
</div>
<div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
<div className="bg-primary-container h-full" style={{width: "58%"}}></div>
</div>
</div>
{/*  Item 2  */}
<div className="flex flex-col gap-1">
<div className="flex justify-between text-body-sm">
<span className="text-on-surface">Core Shader &amp; Engine</span>
<span className="font-label-code text-outline">34h (24%)</span>
</div>
<div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
<div className="bg-secondary h-full" style={{width: "24%"}}></div>
</div>
</div>
{/*  Item 3  */}
<div className="flex justify-between text-body-sm">
<span className="text-on-surface">Design &amp; Tokens</span>
<span className="font-label-code text-outline">26h (18%)</span>
</div>
<div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
<div className="bg-tertiary h-full" style={{width: "18%"}}></div>
</div>
</div>
</div>
{/*  Linked Project Resources  */}
<div className="p-4 rounded-lg bg-surface-container-low shadow-sm flex flex-col gap-3">
<div className="flex items-center justify-between">
<span className="font-label-badge text-label-badge uppercase tracking-wider text-outline">Key Documents</span>
<button className="text-outline hover:text-on-surface text-[14px]" type="button">
<span className="material-symbols-outlined text-[16px]">add</span>
</button>
</div>
<div className="flex flex-col gap-1.5">
<a className="p-2 rounded-lg hover:bg-surface-container flex items-center justify-between transition-colors group" href="/projects/prj-204">
<div className="flex items-center gap-2.5 min-w-0">
<span className="material-symbols-outlined text-[16px] text-outline group-hover:text-primary">description</span>
<span className="font-body-sm text-body-sm text-on-surface truncate">Sprint 14 Design Notes</span>
</div>
<span className="font-label-code text-[11px] text-outline">Figma</span>
</a>
<a className="p-2 rounded-lg hover:bg-surface-container flex items-center justify-between transition-colors group" href="/projects/prj-204">
<div className="flex items-center gap-2.5 min-w-0">
<span className="material-symbols-outlined text-[16px] text-outline group-hover:text-primary">code</span>
<span className="font-body-sm text-body-sm text-on-surface truncate">Shader Memory RFC-8819</span>
</div>
<span className="font-label-code text-[11px] text-outline">Markdown</span>
</a>
<a className="p-2 rounded-lg hover:bg-surface-container flex items-center justify-between transition-colors group" href="/projects/prj-204">
<div className="flex items-center gap-2.5 min-w-0">
<span className="material-symbols-outlined text-[16px] text-outline group-hover:text-primary">sync_alt</span>
<span className="font-body-sm text-body-sm text-on-surface truncate">Design Tokens JSON Sync</span>
</div>
<span className="font-label-code text-[11px] text-outline">GitHub</span>
</a>
</div>
</div>
{/*  Squad Active Contributors  */}
<div className="p-4 rounded-lg bg-surface-container-low shadow-sm flex flex-col gap-3">
<div className="flex items-center justify-between">
<span className="font-label-badge text-label-badge uppercase tracking-wider text-outline">Active Contributors</span>
<span className="font-label-code text-[11px] text-outline">6 assigned</span>
</div>
<div className="flex flex-col gap-2">
{/*  Member 1  */}
<div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-surface-container transition-colors">
<div className="flex items-center gap-2.5">
<div className="relative">
<div className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-[10px] font-semibold">ER</div>
<span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-primary ring-1 ring-surface-container-low"></span>
</div>
<div className="flex flex-col">
<span className="font-body-sm text-body-sm text-on-surface font-medium">Elena Rostova</span>
<span className="font-body-sm text-[10px] text-outline">Lead Architect</span>
</div>
</div>
<span className="font-label-code text-[11px] text-outline">14 issues</span>
</div>
{/*  Member 2  */}
<div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-surface-container transition-colors">
<div className="flex items-center gap-2.5">
<div className="relative">
<div className="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-[10px] font-semibold">MK</div>
<span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-primary ring-1 ring-surface-container-low"></span>
</div>
<div className="flex flex-col">
<span className="font-body-sm text-body-sm text-on-surface font-medium">Marcus Kane</span>
<span className="font-body-sm text-[10px] text-outline">WebGL Engineer</span>
</div>
</div>
<span className="font-label-code text-[11px] text-outline">11 issues</span>
</div>
{/*  Member 3  */}
<div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-surface-container transition-colors">
<div className="flex items-center gap-2.5">
<div className="relative">
<div className="w-6 h-6 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center text-[10px] font-semibold">TL</div>
<span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-outline ring-1 ring-surface-container-low"></span>
</div>
<div className="flex flex-col">
<span className="font-body-sm text-body-sm text-on-surface font-medium">Tanya Liu</span>
<span className="font-body-sm text-[10px] text-outline">Core Systems</span>
</div>
</div>
<span className="font-label-code text-[11px] text-outline">8 issues</span>
</div>
</div>
</div>
</div>
</div>
    </div>
  );
}
