"use client";

import Link from "next/link";
import React, { useState } from "react";

export default function CalendarPage() {
  return (
    <div className="flex flex-col w-full pb-16">
{/*  Top Command & Perspective Filter Bar  */}
<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md py-space-md">
{/*  Left Navigation Cluster  */}
<div className="flex items-center gap-space-md">
<div className="flex items-center bg-surface-container-low p-0.5 rounded-lg shadow-sm">
<button className="px-2.5 py-1 text-body-sm font-headline-sm rounded-lg bg-surface-container-high text-on-surface shadow-sm transition-colors" id="view-month">Month</button>
<button className="px-2.5 py-1 text-body-sm font-headline-sm rounded-lg text-outline hover:text-on-surface transition-colors" id="view-week">Week</button>
<button className="px-2.5 py-1 text-body-sm font-headline-sm rounded-lg text-outline hover:text-on-surface transition-colors" id="view-day">Day</button>
</div>
<div className="flex items-center gap-1">
<button className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-container-low text-outline hover:text-on-surface hover:bg-surface-container transition-colors">
<span className="material-symbols-outlined text-[16px]">chevron_left</span>
</button>
<button className="px-2.5 py-1 text-body-sm font-headline-sm rounded-lg bg-surface-container-low text-on-surface hover:bg-surface-container transition-colors">
          Today
        </button>
<button className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-container-low text-outline hover:text-on-surface hover:bg-surface-container transition-colors">
<span className="material-symbols-outlined text-[16px]">chevron_right</span>
</button>
</div>
<div className="flex items-baseline gap-2">
<h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">October</h1>
<span className="font-headline-sm text-headline-sm text-outline font-normal">2024</span>
<span className="ml-1 text-[11px] font-label-badge uppercase tracking-wider px-1.5 py-0.5 rounded-lg bg-surface-container-high text-tertiary">Sprint 14</span>
</div>
</div>
{/*  Right Controls Cluster  */}
<div className="flex items-center flex-wrap gap-space-sm">
{/*  Member Filter  */}
<div className="relative group">
<button className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface text-body-sm font-body-sm transition-colors shadow-sm">
<span className="material-symbols-outlined text-[14px] text-outline">group</span>
<span>Assignee: All</span>
<span className="material-symbols-outlined text-[14px] text-outline">expand_more</span>
</button>
</div>
{/*  Tag Filter  */}
<button className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface text-body-sm font-body-sm transition-colors shadow-sm">
<span className="material-symbols-outlined text-[14px] text-outline">label</span>
<span>Filter</span>
<span className="px-1 py-0.2 rounded-lg bg-surface-container-high text-[10px] font-label-code text-primary">3</span>
</button>
<div className="w-px h-4 bg-surface-container-high"></div>
{/*  Milestone Legend Quick Indicators  */}
<div className="hidden sm:flex items-center gap-3 px-2 py-1 rounded-lg bg-surface-container-lowest">
<div className="flex items-center gap-1.5">
<span className="w-1.5 h-1.5 rounded-full bg-error"></span>
<span className="text-[11px] font-label-badge text-outline">P0 Critical</span>
</div>
<div className="flex items-center gap-1.5">
<span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]"></span>
<span className="text-[11px] font-label-badge text-outline">P1 High</span>
</div>
<div className="flex items-center gap-1.5">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
<span className="text-[11px] font-label-badge text-outline">Routine</span>
</div>
</div>
{/*  Quick Action  */}
<button className="h-7 px-2.5 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container text-body-sm font-headline-sm flex items-center gap-1 transition-colors shadow-sm">
<span className="material-symbols-outlined text-[14px]">event</span>
<span>New Event</span>
</button>
</div>
</div>
{/*  Main Canvas Layout: Calendar Grid + Inspection Drawer  */}
<div className="grid grid-cols-1 xl:grid-cols-12 gap-space-md mt-space-xs">
{/*  Left Calendar Workspace (9 cols)  */}
<div className="xl:col-span-9 flex flex-col bg-surface-container-lowest rounded-xl shadow-md overflow-hidden">
{/*  Weekday Headers  */}
<div className="grid grid-cols-7 bg-surface-container-low text-outline font-label-code text-body-sm select-none">
<div className="py-2 text-center">MON</div>
<div className="py-2 text-center">TUE</div>
<div className="py-2 text-center">WED</div>
<div className="py-2 text-center">THU</div>
<div className="py-2 text-center">FRI</div>
<div className="py-2 text-center text-outline-variant">SAT</div>
<div className="py-2 text-center text-outline-variant">SUN</div>
</div>
{/*  Month Grid Container (5 Weeks)  */}
<div className="grid grid-cols-7 gap-px bg-surface-container-high auto-rows-fr">
{/*  ================= WEEK 1 (Sept 30 - Oct 06) =================  */}
{/*  Sept 30 (Dimmed Prev Month)  */}
<div className="min-h-[110px] bg-surface-container-lowest p-1.5 flex flex-col justify-between opacity-40 hover:opacity-75 transition-opacity">
<div className="flex items-center justify-between">
<span className="text-body-sm font-label-code text-outline">30</span>
</div>
<div className="flex flex-col gap-1 mt-1 flex-1">
<div className="h-5 px-1.5 rounded-lg bg-surface-container-low text-outline text-[11px] font-body-sm truncate flex items-center gap-1">
<span>Backlog Sweep</span>
</div>
</div>
</div>
{/*  Oct 01  */}
<div className="min-h-[110px] bg-surface-container-lowest p-1.5 flex flex-col justify-between hover:bg-surface-container-low transition-colors group">
<div className="flex items-center justify-between">
<span className="text-body-sm font-label-code text-on-surface">01</span>
</div>
<div className="flex flex-col gap-1 mt-1 flex-1">
<div className="h-5 px-1.5 rounded-lg bg-surface-container text-on-surface text-[11px] font-body-sm truncate flex items-center gap-1.5 hover:bg-surface-container-high cursor-pointer transition-colors shadow-sm">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container shrink-0"></span>
<span className="truncate">Q4 Planning Kickoff</span>
</div>
</div>
</div>
{/*  Oct 02  */}
<div className="min-h-[110px] bg-surface-container-lowest p-1.5 flex flex-col justify-between hover:bg-surface-container-low transition-colors group">
<div className="flex items-center justify-between">
<span className="text-body-sm font-label-code text-on-surface">02</span>
</div>
<div className="flex flex-col gap-1 mt-1 flex-1">
<div className="h-5 px-1.5 rounded-lg bg-surface-container text-on-surface text-[11px] font-body-sm truncate flex items-center gap-1.5 hover:bg-surface-container-high cursor-pointer transition-colors shadow-sm">
<span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] shrink-0"></span>
<span className="truncate font-medium">SCR-098 API Sync</span>
</div>
</div>
</div>
{/*  Oct 03  */}
<div className="min-h-[110px] bg-surface-container-lowest p-1.5 flex flex-col justify-between hover:bg-surface-container-low transition-colors group">
<div className="flex items-center justify-between">
<span className="text-body-sm font-label-code text-on-surface">03</span>
</div>
<div className="flex flex-col gap-1 mt-1 flex-1">
<div className="h-5 px-1.5 rounded-lg bg-surface-container-high text-on-surface text-[11px] font-body-sm truncate flex items-center gap-1.5 cursor-pointer">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container shrink-0"></span>
<span className="truncate">Database Schema Mig</span>
</div>
</div>
</div>
{/*  Oct 04  */}
<div className="min-h-[110px] bg-surface-container-lowest p-1.5 flex flex-col justify-between hover:bg-surface-container-low transition-colors group">
<div className="flex items-center justify-between">
<span className="text-body-sm font-label-code text-on-surface">04</span>
</div>
<div className="flex flex-col gap-1 mt-1 flex-1">
<div className="h-5 px-1.5 rounded-lg bg-surface-container text-on-surface text-[11px] font-body-sm truncate flex items-center gap-1.5 hover:bg-surface-container-high cursor-pointer transition-colors shadow-sm">
<span className="w-1.5 h-1.5 rounded-full bg-error shrink-0"></span>
<span className="truncate">Design Token Freeze</span>
</div>
</div>
</div>
{/*  Oct 05 (Weekend)  */}
<div className="min-h-[110px] bg-surface-dim p-1.5 flex flex-col justify-between">
<div className="flex items-center justify-between">
<span className="text-body-sm font-label-code text-outline-variant">05</span>
</div>
<div className="flex-1"></div>
</div>
{/*  Oct 06 (Weekend)  */}
<div className="min-h-[110px] bg-surface-dim p-1.5 flex flex-col justify-between">
<div className="flex items-center justify-between">
<span className="text-body-sm font-label-code text-outline-variant">06</span>
</div>
<div className="flex-1"></div>
</div>
{/*  ================= WEEK 2 (Oct 07 - Oct 13) =================  */}
{/*  Oct 07  */}
<div className="min-h-[110px] bg-surface-container-lowest p-1.5 flex flex-col justify-between hover:bg-surface-container-low transition-colors group">
<div className="flex items-center justify-between">
<span className="text-body-sm font-label-code text-on-surface">07</span>
</div>
<div className="flex flex-col gap-1 mt-1 flex-1">
<div className="h-5 px-1.5 rounded-lg bg-surface-container text-on-surface text-[11px] font-body-sm truncate flex items-center gap-1.5 hover:bg-surface-container-high cursor-pointer transition-colors shadow-sm">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container shrink-0"></span>
<span className="truncate">Sprint 13 Retro</span>
</div>
</div>
</div>
{/*  Oct 08  */}
<div className="min-h-[110px] bg-surface-container-lowest p-1.5 flex flex-col justify-between hover:bg-surface-container-low transition-colors group">
<div className="flex items-center justify-between">
<span className="text-body-sm font-label-code text-on-surface">08</span>
</div>
<div className="flex flex-col gap-1 mt-1 flex-1">
<div className="h-5 px-1.5 rounded-lg bg-surface-container text-on-surface text-[11px] font-body-sm truncate flex items-center gap-1.5 hover:bg-surface-container-high cursor-pointer transition-colors shadow-sm">
<span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] shrink-0"></span>
<span className="truncate">Security Scan Sweep</span>
</div>
</div>
</div>
{/*  Oct 09  */}
<div className="min-h-[110px] bg-surface-container-lowest p-1.5 flex flex-col justify-between hover:bg-surface-container-low transition-colors group">
<div className="flex items-center justify-between">
<span className="text-body-sm font-label-code text-on-surface">09</span>
</div>
<div className="flex flex-col gap-1 mt-1 flex-1">
<div className="h-5 px-1.5 rounded-lg bg-surface-container text-on-surface text-[11px] font-body-sm truncate flex items-center gap-1.5 hover:bg-surface-container-high cursor-pointer transition-colors shadow-sm">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container shrink-0"></span>
<span className="truncate">Client Feedback Sync</span>
</div>
</div>
</div>
{/*  Oct 10  */}
<div className="min-h-[110px] bg-surface-container-lowest p-1.5 flex flex-col justify-between hover:bg-surface-container-low transition-colors group">
<div className="flex items-center justify-between">
<span className="text-body-sm font-label-code text-on-surface">10</span>
</div>
<div className="flex flex-col gap-1 mt-1 flex-1">
<div className="h-5 px-1.5 rounded-lg bg-surface-container text-on-surface text-[11px] font-body-sm truncate flex items-center gap-1.5 hover:bg-surface-container-high cursor-pointer transition-colors shadow-sm">
<span className="w-1.5 h-1.5 rounded-full bg-error shrink-0"></span>
<span className="truncate font-semibold">SCR-104 Analytics v1</span>
</div>
<div className="h-5 px-1.5 rounded-lg bg-surface-container-low text-outline text-[11px] font-body-sm truncate flex items-center gap-1">
<span>Docs deploy</span>
</div>
</div>
</div>
{/*  Oct 11  */}
<div className="min-h-[110px] bg-surface-container-lowest p-1.5 flex flex-col justify-between hover:bg-surface-container-low transition-colors group">
<div className="flex items-center justify-between">
<span className="text-body-sm font-label-code text-on-surface">11</span>
</div>
<div className="flex flex-col gap-1 mt-1 flex-1">
<div className="h-5 px-1.5 rounded-lg bg-surface-container text-on-surface text-[11px] font-body-sm truncate flex items-center gap-1.5 hover:bg-surface-container-high cursor-pointer transition-colors shadow-sm">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container shrink-0"></span>
<span className="truncate">Sprint 14 Review</span>
</div>
</div>
</div>
{/*  Oct 12 (Weekend)  */}
<div className="min-h-[110px] bg-surface-dim p-1.5 flex flex-col justify-between">
<div className="flex items-center justify-between">
<span className="text-body-sm font-label-code text-outline-variant">12</span>
</div>
<div className="flex-1"></div>
</div>
{/*  Oct 13 (Weekend)  */}
<div className="min-h-[110px] bg-surface-dim p-1.5 flex flex-col justify-between">
<div className="flex items-center justify-between">
<span className="text-body-sm font-label-code text-outline-variant">13</span>
</div>
<div className="flex-1"></div>
</div>
{/*  ================= WEEK 3 (Oct 14 - Oct 20) =================  */}
{/*  Oct 14  */}
<div className="min-h-[110px] bg-surface-container-lowest p-1.5 flex flex-col justify-between hover:bg-surface-container-low transition-colors group">
<div className="flex items-center justify-between">
<span className="text-body-sm font-label-code text-on-surface">14</span>
</div>
<div className="flex flex-col gap-1 mt-1 flex-1">
<div className="h-5 px-1.5 rounded-lg bg-surface-container text-on-surface text-[11px] font-body-sm truncate flex items-center gap-1.5 hover:bg-surface-container-high cursor-pointer transition-colors shadow-sm">
<span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] shrink-0"></span>
<span className="truncate">Infra Cost Audit</span>
</div>
</div>
</div>
{/*  Oct 15  */}
<div className="min-h-[110px] bg-surface-container-lowest p-1.5 flex flex-col justify-between hover:bg-surface-container-low transition-colors group">
<div className="flex items-center justify-between">
<span className="text-body-sm font-label-code text-on-surface">15</span>
</div>
<div className="flex flex-col gap-1 mt-1 flex-1">
<div className="h-5 px-1.5 rounded-lg bg-surface-container text-on-surface text-[11px] font-body-sm truncate flex items-center gap-1.5 hover:bg-surface-container-high cursor-pointer transition-colors shadow-sm">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container shrink-0"></span>
<span className="truncate">Onboarding Flow Revamp</span>
</div>
</div>
</div>
{/*  Oct 16 (TODAY ACTIVE)  */}
<div className="min-h-[110px] bg-surface-container-low p-1.5 flex flex-col justify-between relative shadow-sm group">
<div className="flex items-center justify-between">
<div className="w-5 h-5 rounded-lg bg-primary-container text-on-primary-container font-label-code text-body-sm flex items-center justify-center font-bold shadow-sm">
              16
            </div>
<span className="text-[10px] font-label-code text-primary uppercase font-semibold">Today</span>
</div>
<div className="flex flex-col gap-1 mt-1 flex-1">
<div className="h-5 px-1.5 rounded-lg bg-surface-container-high text-on-surface text-[11px] font-body-sm truncate flex items-center gap-1.5 hover:bg-surface-container-highest cursor-pointer transition-colors shadow-sm">
<span className="w-1.5 h-1.5 rounded-full bg-error shrink-0"></span>
<span className="truncate font-medium">SCR-112 Core Sync Bug</span>
</div>
<div className="h-5 px-1.5 rounded-lg bg-surface-container-high text-on-surface text-[11px] font-body-sm truncate flex items-center gap-1.5 hover:bg-surface-container-highest cursor-pointer transition-colors shadow-sm">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container shrink-0"></span>
<span className="truncate">Demo Recording</span>
</div>
</div>
</div>
{/*  Oct 17  */}
<div className="min-h-[110px] bg-surface-container-lowest p-1.5 flex flex-col justify-between hover:bg-surface-container-low transition-colors group">
<div className="flex items-center justify-between">
<span className="text-body-sm font-label-code text-on-surface">17</span>
</div>
<div className="flex flex-col gap-1 mt-1 flex-1">
<div className="h-5 px-1.5 rounded-lg bg-surface-container text-on-surface text-[11px] font-body-sm truncate flex items-center gap-1.5 hover:bg-surface-container-high cursor-pointer transition-colors shadow-sm">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container shrink-0"></span>
<span className="truncate">Frontend Guild Meet</span>
</div>
</div>
</div>
{/*  Oct 18  */}
<div className="min-h-[110px] bg-surface-container-lowest p-1.5 flex flex-col justify-between hover:bg-surface-container-low transition-colors group">
<div className="flex items-center justify-between">
<span className="text-body-sm font-label-code text-on-surface">18</span>
</div>
<div className="flex flex-col gap-1 mt-1 flex-1">
<div className="h-5 px-1.5 rounded-lg bg-surface-container text-on-surface text-[11px] font-body-sm truncate flex items-center gap-1.5 hover:bg-surface-container-high cursor-pointer transition-colors shadow-sm">
<span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] shrink-0"></span>
<span className="truncate">Staging Release 2.4</span>
</div>
</div>
</div>
{/*  Oct 19 (Weekend)  */}
<div className="min-h-[110px] bg-surface-dim p-1.5 flex flex-col justify-between">
<div className="flex items-center justify-between">
<span className="text-body-sm font-label-code text-outline-variant">19</span>
</div>
<div className="flex-1"></div>
</div>
{/*  Oct 20 (Weekend)  */}
<div className="min-h-[110px] bg-surface-dim p-1.5 flex flex-col justify-between">
<div className="flex items-center justify-between">
<span className="text-body-sm font-label-code text-outline-variant">20</span>
</div>
<div className="flex-1"></div>
</div>
{/*  ================= WEEK 4 (Oct 21 - Oct 27) with SPANNING BANNER =================  */}
{/*  Relative multi-day spanning wrapper row  */}
{/*  Oct 21  */}
<div className="min-h-[110px] bg-surface-container-lowest p-1.5 flex flex-col justify-between hover:bg-surface-container-low transition-colors group">
<div className="flex items-center justify-between">
<span className="text-body-sm font-label-code text-on-surface">21</span>
</div>
<div className="flex flex-col gap-1 mt-1 flex-1">
<div className="h-5 px-1.5 rounded-lg bg-surface-container text-on-surface text-[11px] font-body-sm truncate flex items-center gap-1.5 hover:bg-surface-container-high cursor-pointer transition-colors shadow-sm">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container shrink-0"></span>
<span className="truncate">Perf Profiling</span>
</div>
</div>
</div>
{/*  Oct 22  */}
<div className="min-h-[110px] bg-surface-container-lowest p-1.5 flex flex-col justify-between hover:bg-surface-container-low transition-colors group">
<div className="flex items-center justify-between">
<span className="text-body-sm font-label-code text-on-surface">22</span>
</div>
<div className="flex flex-col gap-1 mt-1 flex-1">
<div className="h-5 px-1.5 rounded-lg bg-surface-container text-on-surface text-[11px] font-body-sm truncate flex items-center gap-1.5 hover:bg-surface-container-high cursor-pointer transition-colors shadow-sm">
<span className="w-1.5 h-1.5 rounded-full bg-error shrink-0"></span>
<span className="truncate">Code Freeze Cut</span>
</div>
</div>
</div>
{/*  Oct 23 (Span Start)  */}
<div className="min-h-[110px] bg-surface-container-lowest p-1.5 flex flex-col justify-between relative hover:bg-surface-container-low transition-colors group">
<div className="flex items-center justify-between">
<span className="text-body-sm font-label-code text-on-surface">23</span>
</div>
<div className="flex flex-col gap-1 mt-1 flex-1">
{/*  Multi-day spanning banner across 5 columns (Oct 23 to Oct 27)  */}
<div className="relative z-10 w-[calc(500%+4px)] h-6 px-2 rounded-lg bg-secondary-container/90 text-on-secondary-fixed flex items-center justify-between shadow-md cursor-pointer hover:bg-secondary-container transition-colors">
<div className="flex items-center gap-1.5">
<span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
<span className="text-[11px] font-headline-sm tracking-tight truncate">Sprint 14 QA Hardening &amp; Regression Suite</span>
</div>
<span className="text-[10px] font-label-code bg-surface-container-lowest/50 px-1 py-0.5 rounded-lg text-primary-fixed">Oct 23 - Oct 27</span>
</div>
{/*  Secondary event under banner  */}
<div className="h-5 px-1.5 rounded-lg bg-surface-container text-on-surface text-[11px] font-body-sm truncate flex items-center gap-1.5 hover:bg-surface-container-high cursor-pointer transition-colors mt-0.5 shadow-sm">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container shrink-0"></span>
<span className="truncate">E2E Matrix</span>
</div>
</div>
</div>
{/*  Oct 24 (Under span)  */}
<div className="min-h-[110px] bg-surface-container-lowest p-1.5 flex flex-col justify-between hover:bg-surface-container-low transition-colors group">
<div className="flex items-center justify-between">
<span className="text-body-sm font-label-code text-on-surface">24</span>
</div>
<div className="flex flex-col gap-1 mt-7 flex-1">
<div className="h-5 px-1.5 rounded-lg bg-surface-container text-on-surface text-[11px] font-body-sm truncate flex items-center gap-1.5 hover:bg-surface-container-high cursor-pointer transition-colors shadow-sm">
<span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] shrink-0"></span>
<span className="truncate">Load Test Cycle</span>
</div>
</div>
</div>
{/*  Oct 25 (Under span)  */}
<div className="min-h-[110px] bg-surface-container-lowest p-1.5 flex flex-col justify-between hover:bg-surface-container-low transition-colors group">
<div className="flex items-center justify-between">
<span className="text-body-sm font-label-code text-on-surface">25</span>
</div>
<div className="flex flex-col gap-1 mt-7 flex-1">
<div className="h-5 px-1.5 rounded-lg bg-surface-container text-on-surface text-[11px] font-body-sm truncate flex items-center gap-1.5 hover:bg-surface-container-high cursor-pointer transition-colors shadow-sm">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container shrink-0"></span>
<span className="truncate">RC Build Signoff</span>
</div>
</div>
</div>
{/*  Oct 26 (Weekend Under span)  */}
<div className="min-h-[110px] bg-surface-dim p-1.5 flex flex-col justify-between">
<div className="flex items-center justify-between">
<span className="text-body-sm font-label-code text-outline-variant">26</span>
</div>
<div className="flex-1 mt-7"></div>
</div>
{/*  Oct 27 (Weekend Span End)  */}
<div className="min-h-[110px] bg-surface-dim p-1.5 flex flex-col justify-between">
<div className="flex items-center justify-between">
<span className="text-body-sm font-label-code text-outline-variant">27</span>
</div>
<div className="flex-1 mt-7"></div>
</div>
{/*  ================= WEEK 5 (Oct 28 - Nov 03) =================  */}
{/*  Oct 28  */}
<div className="min-h-[110px] bg-surface-container-lowest p-1.5 flex flex-col justify-between hover:bg-surface-container-low transition-colors group">
<div className="flex items-center justify-between">
<span className="text-body-sm font-label-code text-on-surface">28</span>
</div>
<div className="flex flex-col gap-1 mt-1 flex-1">
<div className="h-5 px-1.5 rounded-lg bg-surface-container text-on-surface text-[11px] font-body-sm truncate flex items-center gap-1.5 hover:bg-surface-container-high cursor-pointer transition-colors shadow-sm">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container shrink-0"></span>
<span className="truncate">Sprint 15 Planning</span>
</div>
</div>
</div>
{/*  Oct 29  */}
<div className="min-h-[110px] bg-surface-container-lowest p-1.5 flex flex-col justify-between hover:bg-surface-container-low transition-colors group">
<div className="flex items-center justify-between">
<span className="text-body-sm font-label-code text-on-surface">29</span>
</div>
<div className="flex flex-col gap-1 mt-1 flex-1">
<div className="h-5 px-1.5 rounded-lg bg-surface-container text-on-surface text-[11px] font-body-sm truncate flex items-center gap-1.5 hover:bg-surface-container-high cursor-pointer transition-colors shadow-sm">
<span className="w-1.5 h-1.5 rounded-full bg-error shrink-0"></span>
<span className="truncate">Production Rollout</span>
</div>
</div>
</div>
{/*  Oct 30  */}
<div className="min-h-[110px] bg-surface-container-lowest p-1.5 flex flex-col justify-between hover:bg-surface-container-low transition-colors group">
<div className="flex items-center justify-between">
<span className="text-body-sm font-label-code text-on-surface">30</span>
</div>
<div className="flex flex-col gap-1 mt-1 flex-1">
<div className="h-5 px-1.5 rounded-lg bg-surface-container text-on-surface text-[11px] font-body-sm truncate flex items-center gap-1.5 hover:bg-surface-container-high cursor-pointer transition-colors shadow-sm">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container shrink-0"></span>
<span className="truncate">Canary Traffic Shift</span>
</div>
</div>
</div>
{/*  Oct 31  */}
<div className="min-h-[110px] bg-surface-container-lowest p-1.5 flex flex-col justify-between hover:bg-surface-container-low transition-colors group">
<div className="flex items-center justify-between">
<span className="text-body-sm font-label-code text-on-surface">31</span>
</div>
<div className="flex flex-col gap-1 mt-1 flex-1">
<div className="h-5 px-1.5 rounded-lg bg-surface-container text-on-surface text-[11px] font-body-sm truncate flex items-center gap-1.5 hover:bg-surface-container-high cursor-pointer transition-colors shadow-sm">
<span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] shrink-0"></span>
<span className="truncate">Post-Mortem Review</span>
</div>
</div>
</div>
{/*  Nov 01 (Dimmed Next Month)  */}
<div className="min-h-[110px] bg-surface-container-lowest p-1.5 flex flex-col justify-between opacity-40 hover:opacity-75 transition-opacity">
<div className="flex items-center justify-between">
<span className="text-body-sm font-label-code text-outline">01</span>
</div>
<div className="flex flex-col gap-1 mt-1 flex-1">
<div className="h-5 px-1.5 rounded-lg bg-surface-container-low text-outline text-[11px] font-body-sm truncate flex items-center gap-1">
<span>Nov Roadmapping</span>
</div>
</div>
</div>
{/*  Nov 02 (Weekend Next Month)  */}
<div className="min-h-[110px] bg-surface-dim p-1.5 flex flex-col justify-between opacity-40">
<div className="flex items-center justify-between">
<span className="text-body-sm font-label-code text-outline-variant">02</span>
</div>
<div className="flex-1"></div>
</div>
{/*  Nov 03 (Weekend Next Month)  */}
<div className="min-h-[110px] bg-surface-dim p-1.5 flex flex-col justify-between opacity-40">
<div className="flex items-center justify-between">
<span className="text-body-sm font-label-code text-outline-variant">03</span>
</div>
<div className="flex-1"></div>
</div>
</div>
</div>
{/*  Right Drawer: Upcoming Deadlines & Telemetry (3 cols)  */}
<div className="xl:col-span-3 flex flex-col gap-space-md">
{/*  Panel 1: Upcoming Deadlines This Week  */}
<div className="bg-surface-container-low rounded-xl p-space-md shadow-md flex flex-col">
<div className="flex items-center justify-between mb-space-sm">
<div className="flex items-center gap-1.5">
<span className="material-symbols-outlined text-[16px] text-primary">alarm</span>
<span className="font-headline-sm text-body-md text-on-surface">Upcoming Deadlines</span>
</div>
<span className="font-label-code text-label-kbd text-outline px-1.5 py-0.5 rounded-lg bg-surface-container">W42</span>
</div>
<p className="text-body-sm text-outline mb-space-md">4 items due within 48 hours for Nexus 2.0.</p>
{/*  Deadlines List  */}
<div className="flex flex-col gap-2">
{/*  Item 1: SCR-112  */}
<div className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer group shadow-sm">
<div className="flex items-start justify-between gap-1">
<div className="flex items-center gap-1.5">
<span className="w-1.5 h-1.5 rounded-full bg-error shrink-0"></span>
<span className="font-label-code text-[11px] text-primary">SCR-112</span>
</div>
<span className="font-label-code text-[10px] text-error bg-error-container/30 px-1 py-0.2 rounded-lg">4h left</span>
</div>
<div className="font-headline-sm text-body-sm text-on-surface mt-1 truncate">Core Sync Bug on Websocket Fallback</div>
<div className="flex items-center justify-between mt-2 pt-1.5 border-t border-outline-variant/20">
<div className="flex items-center gap-1.5">
<div className="w-4 h-4 rounded-full bg-primary-container text-on-primary-container text-[9px] font-label-code flex items-center justify-center font-bold">AK</div>
<span className="text-body-sm text-outline text-[11px]">Alex Kim</span>
</div>
<span className="text-body-sm text-outline text-[11px]">Oct 16, 18:00</span>
</div>
</div>
{/*  Item 2: SCR-104  */}
<div className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer group shadow-sm">
<div className="flex items-start justify-between gap-1">
<div className="flex items-center gap-1.5">
<span className="w-1.5 h-1.5 rounded-full bg-error shrink-0"></span>
<span className="font-label-code text-[11px] text-primary">SCR-104</span>
</div>
<span className="font-label-code text-[10px] text-error bg-error-container/30 px-1 py-0.2 rounded-lg">11h left</span>
</div>
<div className="font-headline-sm text-body-sm text-on-surface mt-1 truncate">Analytics v1 release documentation</div>
<div className="flex items-center justify-between mt-2 pt-1.5 border-t border-outline-variant/20">
<div className="flex items-center gap-1.5">
<div className="w-4 h-4 rounded-full bg-secondary text-on-secondary text-[9px] font-label-code flex items-center justify-center font-bold">SL</div>
<span className="text-body-sm text-outline text-[11px]">Sarah Lin</span>
</div>
<span className="text-body-sm text-outline text-[11px]">Oct 17, 09:00</span>
</div>
</div>
{/*  Item 3: SCR-118  */}
<div className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer group shadow-sm">
<div className="flex items-start justify-between gap-1">
<div className="flex items-center gap-1.5">
<span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] shrink-0"></span>
<span className="font-label-code text-[11px] text-primary">SCR-118</span>
</div>
<span className="font-label-code text-[10px] text-on-surface-variant bg-surface-container-high px-1 py-0.2 rounded-lg">26h left</span>
</div>
<div className="font-headline-sm text-body-sm text-on-surface mt-1 truncate">Staging 2.4 Artifact Bundler Verification</div>
<div className="flex items-center justify-between mt-2 pt-1.5 border-t border-outline-variant/20">
<div className="flex items-center gap-1.5">
<div className="w-4 h-4 rounded-full bg-tertiary-container text-on-tertiary-container text-[9px] font-label-code flex items-center justify-center font-bold">MR</div>
<span className="text-body-sm text-outline text-[11px]">Marcus Reed</span>
</div>
<span className="text-body-sm text-outline text-[11px]">Oct 17, 23:59</span>
</div>
</div>
{/*  Item 4: SCR-125  */}
<div className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer group shadow-sm">
<div className="flex items-start justify-between gap-1">
<div className="flex items-center gap-1.5">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container shrink-0"></span>
<span className="font-label-code text-[11px] text-primary">SCR-125</span>
</div>
<span className="font-label-code text-[10px] text-on-surface-variant bg-surface-container-high px-1 py-0.2 rounded-lg">42h left</span>
</div>
<div className="font-headline-sm text-body-sm text-on-surface mt-1 truncate">Client Feedback Sync Preparation</div>
<div className="flex items-center justify-between mt-2 pt-1.5 border-t border-outline-variant/20">
<div className="flex items-center gap-1.5">
<div className="w-4 h-4 rounded-full bg-primary-fixed-dim text-on-primary-fixed text-[9px] font-label-code flex items-center justify-center font-bold">EK</div>
<span className="text-body-sm text-outline text-[11px]">Elena Keller</span>
</div>
<span className="text-body-sm text-outline text-[11px]">Oct 18, 16:00</span>
</div>
</div>
</div>
</div>
{/*  Panel 2: Sprint 14 Execution Progress Gauge  */}
<div className="bg-surface-container-low rounded-xl p-space-md shadow-md flex flex-col">
<div className="flex items-center justify-between mb-2">
<span className="font-headline-sm text-body-md text-on-surface">Sprint Velocity &amp; Health</span>
<span className="text-[11px] font-label-code text-primary">Day 8 of 14</span>
</div>
{/*  Inline Visual Chart: Progress Sparkline / Bar  */}
<div className="flex items-center justify-between mt-1 text-body-sm font-label-code">
<span className="text-outline">68% scope completed</span>
<span className="text-on-surface font-semibold">42 / 62 SP</span>
</div>
<div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden mt-2">
<div className="h-full bg-primary-container rounded-full" style={{width: "68%"}}></div>
</div>
{/*  Micro Sparkline SVG  */}
<div className="mt-4 flex items-center justify-between">
<div className="flex flex-col">
<span className="text-[10px] font-label-code text-outline uppercase tracking-wider">Burn-down Trajectory</span>
<span className="text-headline-sm text-on-surface font-headline-sm font-semibold">On Track</span>
</div>
{/*  120x30 Sparkline  */}
<svg className="w-28 h-8 text-primary" fill="none" viewBox="0 0 120 32">
<path d="M0 4 L24 8 L48 14 L72 12 L96 22 L120 28" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
<path d="M0 4 L24 8 L48 14 L72 12 L96 22 L120 28 L120 32 L0 32 Z" fill="currentColor" fill-opacity="0.08"></path>
</svg>
</div>
</div>
{/*  Panel 3: Quick Context Milestone Snippet  */}
<div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex items-center gap-3">
<div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0 text-primary">
<span className="material-symbols-outlined text-[18px]">flag</span>
</div>
<div className="flex flex-col min-w-0">
<span className="text-[10px] font-label-code uppercase text-outline">Target Milestone</span>
<span className="font-headline-sm text-body-sm text-on-surface truncate">Release Candidate 2.0.0</span>
<span className="text-[11px] text-tertiary">Oct 29, 2024 (13 days)</span>
</div>
</div>
</div>
</div>
{/*  Inline Script for micro-interaction switching between views  */}

    </div>
  );
}
