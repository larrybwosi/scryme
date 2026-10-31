"use client";

import Link from "next/link";
import React, { useState } from "react";

export function CyclesTab() {
  return (
    <div className="flex flex-col w-full">
{/*  Top Command & Breadcrumb Context  */}
<div className="flex flex-col gap-space-lg w-full pt-4">
{/*  Breadcrumb + Actions Bar  */}
<div className="flex flex-wrap items-center justify-between gap-space-md w-full">
<div className="flex items-center gap-2">
<span className="font-label-code text-label-code text-outline uppercase tracking-wider">PRJ-204</span>
<span className="text-outline-variant text-body-sm">/</span>
<span className="font-body-md text-body-md text-on-surface-variant">Nexus 2.0 Redesign</span>
<span className="text-outline-variant text-body-sm">/</span>
<span className="font-headline-sm text-headline-sm text-on-surface">Cycles &amp; Sprints</span>
</div>
<div className="flex items-center gap-space-xs">
<button className="h-8 px-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1.5 font-body-sm text-body-sm" title="Share Project" type="button">
<span className="material-symbols-outlined text-[15px]">share</span>
<span>Share</span>
</button>
<button className="h-8 px-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1.5 font-body-sm text-body-sm" onClick={() => { if (typeof navigator !== "undefined") navigator.clipboard?.writeText(window.location.href); }} title="Copy Direct URL" type="button">
<span className="material-symbols-outlined text-[15px]">link</span>
<span>Copy URL</span>
</button>
<button className="h-8 px-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1.5 font-body-sm text-body-sm" type="button">
<span className="material-symbols-outlined text-[15px]">description</span>
<span>Edit Spec</span>
</button>
<div className="h-4 w-px bg-surface-variant mx-1"></div>
<button className="h-8 px-3 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm flex items-center gap-1.5 shadow-sm transition-all active:scale-[0.98]" type="button">
<span className="material-symbols-outlined text-[16px]">add</span>
<span>New Issue</span>
<span className="font-label-kbd text-label-kbd text-on-primary-container/70 ml-1">C</span>
</button>
</div>
</div>
{/*  Project Title & Primary Badges  */}
<div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md w-full">
<div className="flex flex-col gap-1.5">
<div className="flex items-center gap-2.5">
<h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">Nexus 2.0 Redesign</h1>
<span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-container-high text-primary font-label-badge text-label-badge font-medium">
<span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            Live Pipeline
          </span>
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container/40 text-secondary-fixed font-label-badge text-label-badge font-medium">
<span className="material-symbols-outlined text-[12px]">keyboard_double_arrow_up</span>
            High Priority
          </span>
</div>
<p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
          Hardware-accelerated reactive canvas overhaul, dynamic DAG task orchestrator, and real-time multiplayer cursor synchronization layer.
        </p>
</div>
<div className="flex items-center gap-3">
<div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-low text-on-surface-variant font-label-code text-label-code">
<span className="material-symbols-outlined text-[14px] text-outline">event_upcoming</span>
<span>Oct 29, 2024</span>
</div>
<div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-low text-on-surface-variant font-label-code text-label-code">
<span className="material-symbols-outlined text-[14px] text-primary">favorite</span>
<span className="text-on-surface font-medium">94%</span>
<span className="text-outline">Health</span>
</div>
</div>
</div>
{/*  Project Metrics Summary Bar (Bento-style strip)  */}
<div className="grid grid-cols-2 md:grid-cols-5 gap-2 w-full pt-1">
<div className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-1 transition-colors hover:bg-surface-container">
<span className="font-label-badge text-label-badge text-outline uppercase tracking-wider">Execution State</span>
<div className="flex items-baseline gap-2">
<span className="font-headline-md text-headline-md text-on-surface font-semibold">68%</span>
<span className="font-label-code text-label-code text-primary">+4.2% wk</span>
</div>
<div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden mt-1">
<div className="h-full bg-primary-container" style={{width: "68%"}}></div>
</div>
</div>
<div className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-1 transition-colors hover:bg-surface-container">
<span className="font-label-badge text-label-badge text-outline uppercase tracking-wider">Active Cycle</span>
<div className="flex items-baseline gap-2">
<span className="font-headline-md text-headline-md text-on-surface font-semibold">Sprint 14</span>
<span className="font-label-code text-label-code text-on-surface-variant">Day 8/14</span>
</div>
<span className="font-body-sm text-body-sm text-outline truncate">Ends Oct 28, 2024</span>
</div>
<div className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-1 transition-colors hover:bg-surface-container">
<span className="font-label-badge text-label-badge text-outline uppercase tracking-wider">Hours Logged</span>
<div className="flex items-baseline gap-2">
<span className="font-headline-md text-headline-md text-on-surface font-semibold">142h</span>
<span className="font-label-code text-label-code text-outline">/ 210h est</span>
</div>
<span className="font-body-sm text-body-sm text-outline">67.6% capacity burn</span>
</div>
<div className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-1 transition-colors hover:bg-surface-container">
<span className="font-label-badge text-label-badge text-outline uppercase tracking-wider">Cap Utilization</span>
<div className="flex items-baseline gap-2">
<span className="font-headline-md text-headline-md text-on-surface font-semibold">$19,880</span>
<span className="font-label-code text-label-code text-primary">On Target</span>
</div>
<span className="font-body-sm text-body-sm text-outline">$28k allocated sprint cap</span>
</div>
<div className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-1 transition-colors hover:bg-surface-container col-span-2 md:col-span-1">
<span className="font-label-badge text-label-badge text-outline uppercase tracking-wider">Squad Roster</span>
<div className="flex items-center justify-between mt-0.5">
<span className="font-headline-md text-headline-md text-on-surface font-semibold">6</span>
<div className="flex -space-x-1.5 overflow-hidden">
<div className="inline-block h-6 w-6 rounded-full ring-2 ring-surface bg-surface-container-high flex items-center justify-center font-label-badge text-[10px] text-primary">ER</div>
<div className="inline-block h-6 w-6 rounded-full ring-2 ring-surface bg-surface-container-high flex items-center justify-center font-label-badge text-[10px] text-secondary">MK</div>
<div className="inline-block h-6 w-6 rounded-full ring-2 ring-surface bg-surface-container-high flex items-center justify-center font-label-badge text-[10px] text-tertiary">TL</div>
<div className="inline-block h-6 w-6 rounded-full ring-2 ring-surface bg-surface-container-highest flex items-center justify-center font-label-badge text-[10px] text-outline">+3</div>
</div>
</div>
<span className="font-body-sm text-body-sm text-outline">100% active availability</span>
</div>
</div>
{/*  Project Sub-Tabs (Cycles & Sprints active with Linear-style baseline indicator)  */}
<div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-2">
<button className="px-3 py-2 rounded font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1.5 whitespace-nowrap" type="button">
<span>Overview</span>
</button>
<button className="px-3 py-2 rounded font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1.5 whitespace-nowrap" type="button">
<span>Issues</span>
<span className="px-1.5 py-0.2 bg-surface-container text-outline text-label-badge font-label-badge rounded">58</span>
</button>
<button className="relative px-3 py-2 rounded font-headline-sm text-body-sm text-on-surface font-medium flex items-center gap-1.5 whitespace-nowrap bg-surface-container-high/40" type="button">
<span className="material-symbols-outlined text-[15px] text-primary">cycle</span>
<span>Cycles &amp; Sprints</span>
<span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
<div className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary-container rounded-full"></div>
</button>
<button className="px-3 py-2 rounded font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1.5 whitespace-nowrap" type="button">
<span>Milestones</span>
<span className="px-1.5 py-0.2 bg-surface-container text-outline text-label-badge font-label-badge rounded">4</span>
</button>
<button className="px-3 py-2 rounded font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1.5 whitespace-nowrap" type="button">
<span>Documents &amp; RFCs</span>
<span className="px-1.5 py-0.2 bg-surface-container text-outline text-label-badge font-label-badge rounded">6</span>
</button>
<button className="px-3 py-2 rounded font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1.5 whitespace-nowrap" type="button">
<span>Team &amp; Access</span>
</button>
<button className="px-3 py-2 rounded font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1.5 whitespace-nowrap" type="button">
<span>Analytics &amp; Telemetry</span>
</button>
</div>
</div>
{/*  SPRINT MANAGEMENT SUITE  */}
<div className="flex flex-col gap-space-lg w-full mt-6">
{/*  1. ACTIVE SPRINT SPOTLIGHT BANNER  */}
<div className="relative overflow-hidden rounded-xl bg-surface-container-low p-6 shadow-md">
{/*  Glow effect ambient  */}
<div className="absolute top-0 right-0 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
<div className="relative z-10 flex flex-col gap-5">
{/*  Top header row of active sprint  */}
<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
<div className="flex flex-col gap-1">
<div className="flex items-center gap-2.5">
<span className="font-label-code text-label-code px-2 py-0.5 rounded bg-primary-container/20 text-primary uppercase tracking-wide">Current Cycle</span>
<h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold">Sprint 14: Core UI &amp; Analytics</h2>
<span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container text-primary font-label-badge text-label-badge">
<span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                Active (Day 8 of 14)
              </span>
</div>
<div className="flex items-center gap-2 text-outline font-label-code text-label-code mt-0.5">
<span className="material-symbols-outlined text-[14px]">calendar_month</span>
<span>Oct 14, 2024 — Oct 28, 2024</span>
<span>•</span>
<span>6 days remaining</span>
<span>•</span>
<span className="text-on-surface-variant">Lead: Elena Rostova</span>
</div>
</div>
{/*  Quick Sprint Actions  */}
<div className="flex items-center gap-2">
<button className="h-8 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface font-body-sm text-body-sm transition-colors flex items-center gap-1.5" type="button">
<span className="material-symbols-outlined text-[15px]">tune</span>
<span>Sprint Settings</span>
</button>
<button className="h-8 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface font-body-sm text-body-sm transition-colors flex items-center gap-1.5" type="button">
<span className="material-symbols-outlined text-[15px]">file_download</span>
<span>Export Report</span>
</button>
<button className="h-8 px-3.5 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm transition-all flex items-center gap-1.5 shadow-sm" type="button">
<span className="material-symbols-outlined text-[16px]">check_circle</span>
<span>Complete Sprint</span>
</button>
</div>
</div>
{/*  Goal narrative card  */}
<div className="p-3.5 rounded-lg bg-surface-container/60 flex items-start gap-3">
<span className="material-symbols-outlined text-primary text-[18px] mt-0.5 shrink-0">flag</span>
<div className="flex flex-col gap-0.5 min-w-0">
<span className="font-label-badge text-label-badge text-outline uppercase tracking-wider">Sprint Focus &amp; Goal</span>
<p className="font-body-md text-body-md text-on-surface text-balance">
              Deliver hardware-accelerated WebGL canvas, multi-cursor STOMP synchronization, and complete token ingestion pipeline.
            </p>
</div>
</div>
{/*  Burn-down and Progress telemetry block  */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center pt-1">
{/*  Left completion stat  */}
<div className="lg:col-span-4 flex flex-col gap-2 p-3.5 rounded-lg bg-surface-container-lowest/70">
<div className="flex justify-between items-baseline">
<span className="font-label-badge text-label-badge text-outline uppercase tracking-wider">Scope Completion</span>
<span className="font-label-code text-label-code text-primary font-semibold">72% Completed</span>
</div>
<div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
<div className="h-full bg-primary-container rounded-full" style={{width: "72%"}}></div>
</div>
<div className="flex justify-between items-center font-label-code text-label-code text-outline text-[11px] pt-0.5">
<span>34 of 48 Story Points</span>
<span>142h logged / 210h est</span>
</div>
</div>
{/*  Center burn-down trajectory visualization  */}
<div className="lg:col-span-8 flex flex-col md:flex-row items-center justify-between p-3.5 rounded-lg bg-surface-container-lowest/70 gap-4">
<div className="flex flex-col gap-1 w-full md:w-auto">
<div className="flex items-center gap-1.5 text-on-surface font-headline-sm text-body-md font-semibold">
<span className="material-symbols-outlined text-primary text-[16px]">trending_down</span>
<span>Burn-down Trajectory</span>
</div>
<div className="flex items-center gap-2">
<span className="inline-flex w-2 h-2 rounded-full bg-primary"></span>
<span className="font-body-sm text-body-sm text-on-surface-variant font-medium">On track to clear scope by Day 13</span>
</div>
<span className="font-label-code text-label-code text-outline text-[11px]">+2.4 pt/day average delta pace</span>
</div>
{/*  Inline SVG Burndown Sparkline  */}
<div className="w-full md:w-64 h-14 flex items-center justify-end">
<svg className="w-full h-full text-primary" fill="none" preserveAspectRatio="none" viewBox="0 0 240 60">
{/*  Ideal trajectory guide  */}
<line stroke="currentColor" stroke-dasharray="3 3" stroke-opacity="0.2" stroke-width="1.5" x1="10" x2="230" y1="10" y2="52"></line>
{/*  Actual trajectory gradient fill  */}
<defs>
&lt;lineargradient id="burnGrad" x1="0" x2="0" y1="0" y2="1"&gt;
<stop offset="0%" stop-color="currentColor" stop-opacity="0.3"></stop>
<stop offset="100%" stop-color="currentColor" stop-opacity="0"></stop>
&lt;/lineargradient&gt;
</defs>
<path d="M10 8 L35 12 L65 19 L95 22 L125 32 L155 36 L175 42 L175 58 L10 58 Z" fill="url(#burnGrad)"></path>
{/*  Actual trajectory curve line  */}
<path d="M10 8 L35 12 L65 19 L95 22 L125 32 L155 36 L175 42" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"></path>
{/*  Current Day 8 Node  */}
<circle className="animate-pulse" cx="175" cy="42" fill="currentColor" r="4"></circle>
{/*  Projected path  */}
<path d="M175 42 L205 48 L225 54" stroke="currentColor" stroke-dasharray="2 2" stroke-opacity="0.5" stroke-width="2"></path>
</svg>
</div>
</div>
</div>
</div>
</div>
{/*  2. SPRINT BOARD & WORK BREAKDOWN PULSE (3 Mini-board Overview Cards)  */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
{/*  Card 1: Velocity  */}
<div className="p-4 rounded-xl bg-surface-container-low flex flex-col justify-between gap-3 shadow-sm hover:bg-surface-container transition-colors">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<div className="w-7 h-7 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-[16px]">speed</span>
</div>
<span className="font-headline-sm text-body-md text-on-surface font-semibold">Velocity Rate</span>
</div>
<span className="font-label-code text-label-code px-1.5 py-0.5 rounded bg-surface-container text-primary font-medium">+14% vs S13</span>
</div>
<div className="flex items-baseline gap-2">
<span className="font-headline-lg text-headline-lg text-on-surface font-semibold">34 pts</span>
<span className="font-body-sm text-body-sm text-outline">/ cycle nominal</span>
</div>
<div className="flex items-center justify-between text-outline font-label-code text-label-code pt-1">
<span>Target baseline: 30 pts</span>
<span className="text-on-surface-variant font-medium">Cadence: High</span>
</div>
</div>
{/*  Card 2: Scope Changes  */}
<div className="p-4 rounded-xl bg-surface-container-low flex flex-col justify-between gap-3 shadow-sm hover:bg-surface-container transition-colors">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<div className="w-7 h-7 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary">
<span className="material-symbols-outlined text-[16px]">change_circle</span>
</div>
<span className="font-headline-sm text-body-md text-on-surface font-semibold">Scope Changes</span>
</div>
<span className="font-label-badge text-label-badge px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">Mid-Cycle</span>
</div>
<div className="flex items-baseline gap-2">
<span className="font-headline-lg text-headline-lg text-on-surface font-semibold">+2 issues</span>
<span className="font-body-sm text-body-sm text-outline">(+6 story points)</span>
</div>
<div className="flex items-center justify-between text-outline font-label-code text-label-code pt-1">
<span className="text-primary font-medium">0 removed / deprioritized</span>
<span className="text-outline">Approved RFC-41</span>
</div>
</div>
{/*  Card 3: Blockers & Dependencies  */}
<div className="p-4 rounded-xl bg-surface-container-low flex flex-col justify-between gap-3 shadow-sm hover:bg-surface-container transition-colors">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<div className="w-7 h-7 rounded-lg bg-surface-container-high flex items-center justify-center text-tertiary">
<span className="material-symbols-outlined text-[16px]">shield_with_heart</span>
</div>
<span className="font-headline-sm text-body-md text-on-surface font-semibold">Blockers &amp; Risk</span>
</div>
<span className="font-label-code text-label-code px-1.5 py-0.5 rounded bg-surface-container text-primary font-medium">0 Critical</span>
</div>
<div className="flex items-baseline gap-2">
<span className="font-headline-lg text-headline-lg text-on-surface font-semibold">1 Flagged</span>
<span className="font-body-sm text-body-sm text-outline">dependency</span>
</div>
<div className="flex items-center justify-between text-outline font-label-code text-label-code pt-1">
<span className="text-on-surface-variant truncate max-w-[170px]" title="OAuth cache cluster replication">OAuth cache cluster sync</span>
<span className="text-outline font-medium">SCR-119</span>
</div>
</div>
</div>
{/*  3. CYCLE ROADMAP & TIMELINE SPECIFICATION  */}
<div className="flex flex-col gap-3 w-full">
<div className="flex items-center justify-between pt-2">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-[18px] text-outline">route</span>
<h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Cycle Roadmap &amp; Pipeline Cadence</h3>
<span className="font-label-code text-label-code text-outline">(5 Cycles Loaded)</span>
</div>
<div className="flex items-center gap-2">
<button className="h-7 px-2.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-label-code text-label-code flex items-center gap-1 transition-colors" type="button">
<span className="material-symbols-outlined text-[13px]">filter_list</span>
<span>All Cycles</span>
</button>
<button className="h-7 px-2.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-label-code text-label-code flex items-center gap-1 transition-colors" type="button">
<span className="material-symbols-outlined text-[13px]">add</span>
<span>Plan Sprint 17</span>
</button>
</div>
</div>
{/*  Roadmap Table List  */}
<div className="flex flex-col rounded-xl bg-surface-container-low overflow-hidden shadow-sm">
{/*  Header row  */}
<div className="grid grid-cols-12 px-4 py-2.5 bg-surface-container-highest/40 font-label-badge text-label-badge text-outline uppercase tracking-wider">
<div className="col-span-3">Cycle &amp; Status</div>
<div className="col-span-2">Timeline Window</div>
<div className="col-span-4">Strategic Focus &amp; Scope</div>
<div className="col-span-2 text-right">Progress / Points</div>
<div className="col-span-1 text-right">Lead</div>
</div>
{/*  Row 1: Sprint 14 (Current Active)  */}
<div className="grid grid-cols-12 px-4 py-3.5 items-center hover:bg-surface-container transition-colors bg-surface-container/20">
<div className="col-span-3 flex items-center gap-2.5">
<div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></div>
<div className="flex flex-col">
<span className="font-headline-sm text-body-md text-on-surface font-semibold flex items-center gap-1.5">
                Sprint 14
                <span className="px-1.5 py-0.2 rounded bg-primary-container/20 text-primary font-label-code text-[10px]">CURRENT</span>
</span>
<span className="font-label-code text-label-code text-outline text-[11px]">18 issues • 48 story pts</span>
</div>
</div>
<div className="col-span-2 flex flex-col">
<span className="font-body-sm text-body-sm text-on-surface font-medium">Oct 14 — Oct 28</span>
<span className="font-label-code text-label-code text-primary text-[11px]">6 days left (Day 8/14)</span>
</div>
<div className="col-span-4 flex flex-col pr-3">
<span className="font-body-md text-body-md text-on-surface truncate">Core WebGL Canvas Engine &amp; STOMP Telemetry</span>
<span className="font-body-sm text-body-sm text-outline truncate">Milestone 2.1 deliverables &amp; Token compiler runtime</span>
</div>
<div className="col-span-2 flex flex-col items-end gap-1">
<div className="flex items-center gap-2">
<span className="font-label-code text-label-code text-on-surface font-semibold">34 / 48 pts</span>
<span className="font-label-code text-label-code text-primary">72%</span>
</div>
<div className="w-24 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
<div className="h-full bg-primary-container rounded-full" style={{width: "72%"}}></div>
</div>
</div>
<div className="col-span-1 flex items-center justify-end gap-1.5">
<div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center font-label-badge text-[10px] text-primary" title="Elena Rostova">ER</div>
</div>
</div>
{/*  Row 2: Sprint 15 (Upcoming)  */}
<div className="grid grid-cols-12 px-4 py-3.5 items-center hover:bg-surface-container transition-colors">
<div className="col-span-3 flex items-center gap-2.5">
<div className="w-2.5 h-2.5 rounded-full bg-outline-variant"></div>
<div className="flex flex-col">
<span className="font-headline-sm text-body-md text-on-surface font-semibold flex items-center gap-1.5">
                Sprint 15
                <span className="px-1.5 py-0.2 rounded bg-surface-container-high text-on-surface-variant font-label-code text-[10px]">UPCOMING</span>
</span>
<span className="font-label-code text-label-code text-outline text-[11px]">14 issues queued • 52 pts planned</span>
</div>
</div>
<div className="col-span-2 flex flex-col">
<span className="font-body-sm text-body-sm text-on-surface font-medium">Oct 29 — Nov 12</span>
<span className="font-label-code text-label-code text-outline text-[11px]">Starts next Tuesday</span>
</div>
<div className="col-span-4 flex flex-col pr-3">
<span className="font-body-md text-body-md text-on-surface truncate">WASM Physics &amp; Realtime Telemetry Pipeline</span>
<span className="font-body-sm text-body-sm text-outline truncate">Cluster node sync, state hydration, snapshot worker</span>
</div>
<div className="col-span-2 flex flex-col items-end gap-1">
<div className="flex items-center gap-2">
<span className="font-label-code text-label-code text-on-surface-variant font-medium">0 / 52 pts</span>
<span className="font-label-code text-label-code text-outline">0%</span>
</div>
<div className="w-24 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
<div className="h-full bg-surface-variant rounded-full" style={{width: "0%"}}></div>
</div>
</div>
<div className="col-span-1 flex items-center justify-end gap-1.5">
<div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center font-label-badge text-[10px] text-secondary" title="Marcus Kane">MK</div>
</div>
</div>
{/*  Row 3: Sprint 16 (Planned)  */}
<div className="grid grid-cols-12 px-4 py-3.5 items-center hover:bg-surface-container transition-colors">
<div className="col-span-3 flex items-center gap-2.5">
<div className="w-2.5 h-2.5 rounded-full bg-surface-variant"></div>
<div className="flex flex-col">
<span className="font-headline-sm text-body-md text-on-surface font-semibold flex items-center gap-1.5">
                Sprint 16
                <span className="px-1.5 py-0.2 rounded bg-surface-container text-outline font-label-code text-[10px]">PLANNED</span>
</span>
<span className="font-label-code text-label-code text-outline text-[11px]">9 issues drafted • 40 pts estimated</span>
</div>
</div>
<div className="col-span-2 flex flex-col">
<span className="font-body-sm text-body-sm text-on-surface font-medium">Nov 13 — Nov 27</span>
<span className="font-label-code text-label-code text-outline text-[11px]">Sprint draft stage</span>
</div>
<div className="col-span-4 flex flex-col pr-3">
<span className="font-body-md text-body-md text-on-surface truncate">Production Cutover &amp; Client Acceptance Hardening</span>
<span className="font-body-sm text-body-sm text-outline truncate">Load benchmarks, Pen-testing, SOC2 audit review</span>
</div>
<div className="col-span-2 flex flex-col items-end gap-1">
<div className="flex items-center gap-2">
<span className="font-label-code text-label-code text-outline">0 / 40 pts</span>
<span className="font-label-code text-label-code text-outline">—</span>
</div>
<div className="w-24 h-1.5 bg-surface-container-highest rounded-full"></div>
</div>
<div className="col-span-1 flex items-center justify-end gap-1.5">
<span className="text-outline font-label-code text-[11px]">—</span>
</div>
</div>
{/*  Sub-section: Past Completed Cycles Header  */}
<div className="grid grid-cols-12 px-4 py-2 bg-surface-container-highest/20 font-label-badge text-[10px] text-outline uppercase tracking-wider">
<div className="col-span-12 flex items-center gap-1.5">
<span className="material-symbols-outlined text-[13px]">history</span>
<span>Archived Completed Cycles</span>
</div>
</div>
{/*  Row 4: Sprint 13 (Completed)  */}
<div className="grid grid-cols-12 px-4 py-3 items-center hover:bg-surface-container transition-colors opacity-90">
<div className="col-span-3 flex items-center gap-2.5">
<span className="material-symbols-outlined text-primary text-[16px]">check_circle</span>
<div className="flex flex-col">
<span className="font-headline-sm text-body-md text-on-surface font-semibold flex items-center gap-1.5">
                Sprint 13
                <span className="px-1.5 py-0.2 rounded bg-surface-container text-on-surface-variant font-label-code text-[10px]">CLOSED</span>
</span>
<span className="font-label-code text-label-code text-outline text-[11px]">22 issues closed</span>
</div>
</div>
<div className="col-span-2 flex flex-col">
<span className="font-body-sm text-body-sm text-on-surface-variant">Sep 29 — Oct 12</span>
<span className="font-label-code text-label-code text-outline text-[11px]">Completed on schedule</span>
</div>
<div className="col-span-4 flex items-center gap-2 pr-3">
<span className="font-body-md text-body-md text-on-surface-variant truncate">DAG Layout Framework &amp; Token Pipeline MVP</span>
<a className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-container hover:bg-surface-container-high text-primary font-label-code text-[11px] shrink-0" href="/projects/prj-204">
<span className="material-symbols-outlined text-[12px]">article</span>
<span>Retro RFC</span>
</a>
</div>
<div className="col-span-2 flex flex-col items-end gap-1">
<div className="flex items-center gap-2">
<span className="font-label-code text-label-code text-on-surface font-medium">44 / 44 pts delivered</span>
<span className="font-label-code text-label-code text-primary">100%</span>
</div>
<div className="w-24 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
<div className="h-full bg-primary-container rounded-full" style={{width: "100%"}}></div>
</div>
</div>
<div className="col-span-1 flex items-center justify-end gap-1.5">
<div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center font-label-badge text-[10px] text-tertiary" title="Tanya Liu">TL</div>
</div>
</div>
{/*  Row 5: Sprint 12 (Completed)  */}
<div className="grid grid-cols-12 px-4 py-3 items-center hover:bg-surface-container transition-colors opacity-80">
<div className="col-span-3 flex items-center gap-2.5">
<span className="material-symbols-outlined text-primary text-[16px]">check_circle</span>
<div className="flex flex-col">
<span className="font-headline-sm text-body-md text-on-surface font-semibold flex items-center gap-1.5">
                Sprint 12
                <span className="px-1.5 py-0.2 rounded bg-surface-container text-on-surface-variant font-label-code text-[10px]">CLOSED</span>
</span>
<span className="font-label-code text-label-code text-outline text-[11px]">19 issues closed</span>
</div>
</div>
<div className="col-span-2 flex flex-col">
<span className="font-body-sm text-body-sm text-on-surface-variant">Sep 15 — Sep 28</span>
<span className="font-label-code text-label-code text-outline text-[11px]">Delivered</span>
</div>
<div className="col-span-4 flex items-center gap-2 pr-3">
<span className="font-body-md text-body-md text-on-surface-variant truncate">Design Tokens Architecture &amp; Theme Config Generator</span>
</div>
<div className="col-span-2 flex flex-col items-end gap-1">
<div className="flex items-center gap-2">
<span className="font-label-code text-label-code text-on-surface-variant">40 / 41 pts</span>
<span className="font-label-code text-label-code text-on-surface">98%</span>
</div>
<div className="w-24 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
<div className="h-full bg-primary-container rounded-full" style={{width: "98%"}}></div>
</div>
</div>
<div className="col-span-1 flex items-center justify-end gap-1.5">
<div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center font-label-badge text-[10px] text-primary" title="Elena Rostova">ER</div>
</div>
</div>
</div>
</div>
{/*  4. SPRINT CAPACITY & TEAM WORKLOAD DISTRIBUTION  */}
<div className="flex flex-col gap-3 w-full pt-2">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-[18px] text-outline">group_work</span>
<h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Sprint 14 Capacity &amp; Squad Workload</h3>
<span className="font-label-code text-label-code text-outline">(138h allocated of 160h squad max)</span>
</div>
<div className="flex items-center gap-2 text-outline font-label-code text-label-code text-[11px]">
<span>Standard: 40h/eng/cycle</span>
<span className="text-primary font-medium">• 86.2% Avg Utilization</span>
</div>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
{/*  Eng 1: Elena Rostova  */}
<div className="p-4 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors flex flex-col justify-between gap-3 shadow-sm">
<div className="flex items-start justify-between">
<div className="flex items-center gap-2.5">
<div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center font-label-badge text-body-sm text-primary font-semibold">ER</div>
<div className="flex flex-col">
<span className="font-headline-sm text-body-sm text-on-surface font-semibold">Elena Rostova</span>
<span className="font-body-sm text-[11px] text-outline">Staff Architect</span>
</div>
</div>
<span className="font-label-code text-label-code px-1.5 py-0.5 rounded bg-surface-container text-primary font-medium">95%</span>
</div>
<div className="flex flex-col gap-1.5">
<div className="flex justify-between items-baseline font-label-code text-label-code">
<span className="text-outline">Capacity Burn</span>
<span className="text-on-surface font-medium">38h / 40h</span>
</div>
<div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
<div className="h-full bg-primary-container rounded-full" style={{width: "95%"}}></div>
</div>
</div>
<div className="flex flex-col gap-1 pt-1">
<span className="font-label-badge text-[10px] text-outline uppercase tracking-wider">Active Commitments</span>
<div className="flex flex-wrap gap-1">
<span className="font-label-code text-label-code px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant hover:text-on-surface cursor-pointer">SCR-104</span>
<span className="font-label-code text-label-code px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant hover:text-on-surface cursor-pointer">SCR-115</span>
<span className="font-label-code text-[11px] px-1 py-0.5 rounded bg-surface-container-high text-outline">+1 rfc</span>
</div>
</div>
</div>
{/*  Eng 2: Marcus Kane  */}
<div className="p-4 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors flex flex-col justify-between gap-3 shadow-sm">
<div className="flex items-start justify-between">
<div className="flex items-center gap-2.5">
<div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center font-label-badge text-body-sm text-secondary font-semibold">MK</div>
<div className="flex flex-col">
<span className="font-headline-sm text-body-sm text-on-surface font-semibold">Marcus Kane</span>
<span className="font-body-sm text-[11px] text-outline">WebGL Engineer</span>
</div>
</div>
<span className="font-label-code text-label-code px-1.5 py-0.5 rounded bg-secondary-container/40 text-secondary-fixed font-medium">100% Full</span>
</div>
<div className="flex flex-col gap-1.5">
<div className="flex justify-between items-baseline font-label-code text-label-code">
<span className="text-outline">Capacity Burn</span>
<span className="text-on-surface font-medium">40h / 40h</span>
</div>
<div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
<div className="h-full bg-secondary-container rounded-full" style={{width: "100%"}}></div>
</div>
</div>
<div className="flex flex-col gap-1 pt-1">
<span className="font-label-badge text-[10px] text-outline uppercase tracking-wider">Active Commitments</span>
<div className="flex flex-wrap gap-1">
<span className="font-label-code text-label-code px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant hover:text-on-surface cursor-pointer">SCR-106</span>
<span className="font-label-code text-label-code px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant hover:text-on-surface cursor-pointer">SCR-105</span>
</div>
</div>
</div>
{/*  Eng 3: Tanya Liu  */}
<div className="p-4 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors flex flex-col justify-between gap-3 shadow-sm">
<div className="flex items-start justify-between">
<div className="flex items-center gap-2.5">
<div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center font-label-badge text-body-sm text-tertiary font-semibold">TL</div>
<div className="flex flex-col">
<span className="font-headline-sm text-body-sm text-on-surface font-semibold">Tanya Liu</span>
<span className="font-body-sm text-[11px] text-outline">Core Systems</span>
</div>
</div>
<span className="font-label-code text-label-code px-1.5 py-0.5 rounded bg-surface-container text-on-surface font-medium">80%</span>
</div>
<div className="flex flex-col gap-1.5">
<div className="flex justify-between items-baseline font-label-code text-label-code">
<span className="text-outline">Capacity Burn</span>
<span className="text-on-surface font-medium">32h / 40h</span>
</div>
<div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
<div className="h-full bg-primary-container rounded-full" style={{width: "80%"}}></div>
</div>
</div>
<div className="flex flex-col gap-1 pt-1">
<span className="font-label-badge text-[10px] text-outline uppercase tracking-wider">Active Commitments</span>
<div className="flex flex-wrap gap-1">
<span className="font-label-code text-label-code px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant hover:text-on-surface cursor-pointer">SCR-108</span>
<span className="font-label-code text-label-code px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant hover:text-on-surface cursor-pointer">SCR-112</span>
</div>
</div>
</div>
{/*  Eng 4: Alex Nazeer  */}
<div className="p-4 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors flex flex-col justify-between gap-3 shadow-sm">
<div className="flex items-start justify-between">
<div className="flex items-center gap-2.5">
<div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center font-label-badge text-body-sm text-on-surface-variant font-semibold">AN</div>
<div className="flex flex-col">
<span className="font-headline-sm text-body-sm text-on-surface font-semibold">Alex Nazeer</span>
<span className="font-body-sm text-[11px] text-outline">Fullstack Eng</span>
</div>
</div>
<span className="font-label-code text-label-code px-1.5 py-0.5 rounded bg-surface-container text-on-surface font-medium">70%</span>
</div>
<div className="flex flex-col gap-1.5">
<div className="flex justify-between items-baseline font-label-code text-label-code">
<span className="text-outline">Capacity Burn</span>
<span className="text-on-surface font-medium">28h / 40h</span>
</div>
<div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
<div className="h-full bg-primary-container rounded-full" style={{width: "70%"}}></div>
</div>
</div>
<div className="flex flex-col gap-1 pt-1">
<span className="font-label-badge text-[10px] text-outline uppercase tracking-wider">Active Commitments</span>
<div className="flex flex-wrap gap-1">
<span className="font-label-code text-label-code px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant hover:text-on-surface cursor-pointer">SCR-110</span>
<span className="font-label-code text-label-code px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant hover:text-on-surface cursor-pointer">SCR-118</span>
</div>
</div>
</div>
</div>
</div>
</div>
    </div>
  );
}
