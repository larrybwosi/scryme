"use client";

import Link from "next/link";
import React, { useState } from "react";

export default function TasksPage() {
  return (
    <div className="flex flex-col w-full pb-16">
<div className="flex flex-col gap-space-lg pb-16 pt-2">
{/*  Top Action & View Toolbar  */}
<div className="flex flex-col gap-space-md">
{/*  Upper Tier: View Modes & Quick Insights  */}
<div className="flex items-center justify-between gap-space-md">
{/*  View Scope Tabs  */}
<div className="flex items-center gap-1 bg-surface-container-lowest p-1 rounded">
<button className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-high text-on-surface font-headline-sm text-body-sm shadow-sm transition-all" type="button">
<span className="material-symbols-outlined text-[15px] text-primary">layers</span>
<span>All Tasks</span>
<span className="font-label-code text-label-code text-outline ml-1">38</span>
</button>
<button className="flex items-center gap-1.5 px-2.5 py-1 rounded text-outline hover:text-on-surface hover:bg-surface-container transition-all font-body-sm text-body-sm" type="button">
<span className="material-symbols-outlined text-[15px] text-secondary">radio_button_checked</span>
<span>Active</span>
<span className="font-label-code text-label-code text-outline-variant">27</span>
</button>
<button className="flex items-center gap-1.5 px-2.5 py-1 rounded text-outline hover:text-on-surface hover:bg-surface-container transition-all font-body-sm text-body-sm" type="button">
<span className="material-symbols-outlined text-[15px]">inventory_2</span>
<span>Backlog</span>
<span className="font-label-code text-label-code text-outline-variant">8</span>
</button>
<button className="flex items-center gap-1.5 px-2.5 py-1 rounded text-outline hover:text-on-surface hover:bg-surface-container transition-all font-body-sm text-body-sm" type="button">
<span className="material-symbols-outlined text-[15px] text-primary">check_circle</span>
<span>Completed</span>
<span className="font-label-code text-label-code text-outline-variant">3</span>
</button>
</div>
{/*  Right Side: Secondary Actions & Display Mode  */}
<div className="flex items-center gap-space-sm">
<div className="flex items-center bg-surface-container-lowest p-0.5 rounded">
<button className="p-1 rounded bg-surface-container-high text-on-surface hover:text-primary transition-colors" title="List View (V then L)" type="button">
<span className="material-symbols-outlined text-[16px]">view_agenda</span>
</button>
<button className="p-1 rounded text-outline hover:text-on-surface transition-colors" title="Board View (V then B)" type="button">
<span className="material-symbols-outlined text-[16px]">view_kanban</span>
</button>
<button className="p-1 rounded text-outline hover:text-on-surface transition-colors" title="Gantt Timeline" type="button">
<span className="material-symbols-outlined text-[16px]">waterfall_chart</span>
</button>
</div>
<div className="h-4 w-px bg-surface-variant"></div>
<button className="flex items-center gap-1 px-2 py-1 rounded bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-body-sm text-body-sm transition-colors" type="button">
<span className="material-symbols-outlined text-[15px] text-outline">tune</span>
<span>Display</span>
</button>
<button className="flex items-center gap-1.5 px-2 py-1 rounded bg-surface-container-low text-on-surface hover:bg-surface-container font-headline-sm text-body-sm transition-colors" type="button">
<span className="material-symbols-outlined text-[15px] text-primary">swap_vert</span>
<span>Sort: Priority</span>
</button>
</div>
</div>
{/*  Lower Tier: Interactive Filter Pills & Global Filter Input  */}
<div className="flex items-center justify-between gap-space-md bg-surface-container-low px-space-md py-1.5 rounded">
<div className="flex items-center gap-space-sm flex-wrap">
<span className="material-symbols-outlined text-outline text-[16px]">filter_list</span>
{/*  Assignee Filter Pill  */}
<div className="flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container hover:bg-surface-container-high cursor-pointer transition-colors group">
<span className="font-body-sm text-[11px] text-outline uppercase tracking-wider">Assignee:</span>
<div className="w-3.5 h-3.5 rounded-full bg-primary-container flex items-center justify-center text-[9px] text-on-primary-container font-headline-sm">NL</div>
<span className="font-body-sm text-body-sm text-on-surface">Me</span>
<span className="material-symbols-outlined text-[14px] text-outline group-hover:text-on-surface">close</span>
</div>
{/*  Priority Filter Pill  */}
<div className="flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container hover:bg-surface-container-high cursor-pointer transition-colors group">
<span className="font-body-sm text-[11px] text-outline uppercase tracking-wider">Priority:</span>
<span className="material-symbols-outlined text-[13px] text-error">priority_high</span>
<span className="font-body-sm text-body-sm text-on-surface">Urgent &amp; High</span>
<span className="material-symbols-outlined text-[14px] text-outline group-hover:text-on-surface">close</span>
</div>
{/*  Label Filter Pill  */}
<button className="flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-lowest hover:bg-surface-container text-outline hover:text-on-surface transition-colors font-body-sm text-body-sm" type="button">
<span className="material-symbols-outlined text-[14px]">label</span>
<span>Label</span>
<span className="material-symbols-outlined text-[13px]">add</span>
</button>
{/*  Milestone Pill  */}
<button className="flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-lowest hover:bg-surface-container text-outline hover:text-on-surface transition-colors font-body-sm text-body-sm" type="button">
<span className="material-symbols-outlined text-[14px] text-secondary">flag</span>
<span>Milestone: v2.4 Release</span>
<span className="material-symbols-outlined text-[13px]">expand_more</span>
</button>
</div>
{/*  Filter Search & Quick Add  */}
<div className="flex items-center gap-2">
<div className="relative flex items-center">
<span className="material-symbols-outlined absolute left-2 text-[14px] text-outline">search</span>
<input className="h-6 w-44 pl-7 pr-2 rounded bg-surface-container-lowest text-on-surface font-body-sm text-body-sm placeholder-outline focus:outline-none focus:w-60 transition-all" placeholder="Filter tasks..." type="text"/>
</div>
<span className="font-label-kbd text-label-kbd text-outline bg-surface-container px-1 rounded">F</span>
</div>
</div>
</div>
{/*  Main High-Density Tasks Canvas  */}
<div className="flex flex-col gap-6">
{/*  ================= SECTION 1: IN PROGRESS =================  */}
<section className="flex flex-col">
{/*  Section Sticky Header  */}
<div className="flex items-center justify-between px-space-md py-1.5 bg-surface-container-lowest rounded-t">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-[16px] text-primary" style={{fontVariationSettings: "\'FILL\' 1"}}>rotate_right</span>
<h2 className="font-headline-sm text-body-md text-on-surface tracking-tight">In Progress</h2>
<span className="font-label-code text-label-code text-on-surface-variant bg-surface-container px-1.5 py-0.2 rounded font-medium">8</span>
</div>
<div className="flex items-center gap-space-sm text-outline font-body-sm text-[11px]">
<span>EST 42h</span>
<span>•</span>
<span>LOGGED 31h 10m</span>
<button className="hover:text-on-surface ml-1 p-0.5 rounded hover:bg-surface-container transition-colors" type="button">
<span className="material-symbols-outlined text-[15px]">more_horiz</span>
</button>
</div>
</div>
{/*  Task Rows Container  */}
<div className="flex flex-col bg-surface-container-low divide-y-0 rounded-b overflow-hidden shadow-sm">
{/*  Row: SCR-104 (Interactive Analytics Dashboard)  */}
<div className="group relative flex items-center justify-between h-9 px-space-md bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer">
<div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
<div className="flex items-center gap-space-md min-w-0 flex-1">
{/*  Select Checkbox  */}
<input className="w-3.5 h-3.5 rounded-sm bg-surface-container-high defaultChecked={true}:bg-primary accent-primary cursor-pointer transition-colors" type="checkbox"/>
{/*  Priority Indicator: Urgent  */}
<span className="material-symbols-outlined text-[15px] text-error flex-shrink-0" title="Urgent Priority">priority_high</span>
{/*  Status Circular Node  */}
<div className="w-3.5 h-3.5 rounded-full border border-primary flex items-center justify-center flex-shrink-0" title="In Progress">
<div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
</div>
{/*  Task Key  */}
<span className="font-label-code text-label-code text-outline group-hover:text-on-surface-variant flex-shrink-0">SCR-104</span>
{/*  Issue Title & Subtasks  */}
<div className="flex items-center gap-2 truncate min-w-0">
<span className="font-body-md text-body-md text-on-surface font-medium truncate">Interactive Analytics Dashboard &amp; Real-time Canvas</span>
<span className="flex items-center gap-0.5 px-1 rounded bg-surface-container-high text-outline group-hover:text-on-surface font-label-code text-[10px] flex-shrink-0">
<span className="material-symbols-outlined text-[11px]">checklist</span>
                  3/5
                </span>
<span className="px-1.5 py-0.2 rounded bg-surface-container-highest text-on-surface-variant font-label-badge text-[10px] flex-shrink-0">Analytics</span>
</div>
</div>
{/*  Task Metadata Cluster  */}
<div className="flex items-center gap-3 flex-shrink-0 ml-4">
{/*  Sprint Cycle Badge  */}
<span className="flex items-center gap-1 font-label-code text-[11px] text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">
<span className="material-symbols-outlined text-[12px] text-secondary">sync</span>
                Sprint 14
              </span>
{/*  Time Logged Indicator  */}
<div className="flex items-center gap-1 font-label-code text-label-code text-primary bg-primary-container/20 px-1.5 py-0.5 rounded">
<span className="material-symbols-outlined text-[13px]">timer</span>
<span>14h 20m</span>
</div>
{/*  Due Date Tag  */}
<div className="flex items-center gap-1 font-body-sm text-[11px] text-error bg-error-container/20 px-1.5 py-0.5 rounded">
<span className="material-symbols-outlined text-[12px]">calendar_clock</span>
<span>Oct 28</span>
</div>
{/*  Assignee Avatar  */}
<div className="relative w-5 h-5 rounded bg-primary-container flex items-center justify-center text-on-primary-container font-headline-sm text-[10px] font-medium" title="Nathaniel Vance">
                NV
              </div>
</div>
</div>
{/*  Row: SCR-106 (WebSocket Fallback Handler)  */}
<div className="group relative flex items-center justify-between h-9 px-space-md bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer">
<div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
<div className="flex items-center gap-space-md min-w-0 flex-1">
<input className="w-3.5 h-3.5 rounded-sm bg-surface-container-high defaultChecked={true}:bg-primary accent-primary cursor-pointer" type="checkbox"/>
<span className="material-symbols-outlined text-[15px] text-primary" title="High Priority">signal_cellular_alt</span>
<div className="w-3.5 h-3.5 rounded-full border border-primary flex items-center justify-center flex-shrink-0">
<div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
</div>
<span className="font-label-code text-label-code text-outline group-hover:text-on-surface-variant flex-shrink-0">SCR-106</span>
<div className="flex items-center gap-2 truncate min-w-0">
<span className="font-body-md text-body-md text-on-surface truncate">WebSocket Fallback Handler for Offline Queue Synchronization</span>
<span className="flex items-center gap-0.5 px-1 rounded bg-surface-container-high text-outline font-label-code text-[10px] flex-shrink-0">
<span className="material-symbols-outlined text-[11px]">checklist</span>
                  1/2
                </span>
<span className="px-1.5 py-0.2 rounded bg-surface-container-highest text-on-surface-variant font-label-badge text-[10px] flex-shrink-0">Core Engine</span>
</div>
</div>
<div className="flex items-center gap-3 flex-shrink-0 ml-4">
<span className="font-label-code text-[11px] text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">Sprint 14</span>
<div className="flex items-center gap-1 font-label-code text-label-code text-outline bg-surface-container px-1.5 py-0.5 rounded">
<span className="material-symbols-outlined text-[13px]">timer</span>
<span>6h 45m</span>
</div>
<div className="flex items-center gap-1 font-body-sm text-[11px] text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">
<span className="material-symbols-outlined text-[12px] text-outline">event</span>
<span>Nov 02</span>
</div>
<div className="w-5 h-5 rounded bg-surface-container-highest flex items-center justify-center text-on-surface font-headline-sm text-[10px]">
                EK
              </div>
</div>
</div>
{/*  Row: SCR-108 (Virtual DOM Grid Scrolling Performance)  */}
<div className="group relative flex items-center justify-between h-9 px-space-md bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer">
<div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
<div className="flex items-center gap-space-md min-w-0 flex-1">
<input className="w-3.5 h-3.5 rounded-sm bg-surface-container-high defaultChecked={true}:bg-primary accent-primary cursor-pointer" type="checkbox"/>
<span className="material-symbols-outlined text-[15px] text-outline" title="Medium Priority">remove</span>
<div className="w-3.5 h-3.5 rounded-full border border-primary flex items-center justify-center flex-shrink-0">
<div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
</div>
<span className="font-label-code text-label-code text-outline group-hover:text-on-surface-variant flex-shrink-0">SCR-108</span>
<div className="flex items-center gap-2 truncate min-w-0">
<span className="font-body-md text-body-md text-on-surface truncate">Virtual DOM Grid 120fps Scrolling &amp; Mutation Observer Tuning</span>
<span className="px-1.5 py-0.2 rounded bg-surface-container-highest text-on-surface-variant font-label-badge text-[10px] flex-shrink-0">Performance</span>
</div>
</div>
<div className="flex items-center gap-3 flex-shrink-0 ml-4">
<span className="font-label-code text-[11px] text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">Sprint 14</span>
<div className="flex items-center gap-1 font-label-code text-label-code text-outline bg-surface-container px-1.5 py-0.5 rounded">
<span className="material-symbols-outlined text-[13px]">timer</span>
<span>8h 15m</span>
</div>
<div className="flex items-center gap-1 font-body-sm text-[11px] text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">
<span className="material-symbols-outlined text-[12px] text-outline">event</span>
<span>Nov 04</span>
</div>
<div className="w-5 h-5 rounded bg-secondary-container flex items-center justify-center text-on-secondary-container font-headline-sm text-[10px]">
                TC
              </div>
</div>
</div>
{/*  Row: SCR-110 (PostgreSQL Read Replica Partitioning)  */}
<div className="group relative flex items-center justify-between h-9 px-space-md bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer">
<div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
<div className="flex items-center gap-space-md min-w-0 flex-1">
<input className="w-3.5 h-3.5 rounded-sm bg-surface-container-high defaultChecked={true}:bg-primary accent-primary cursor-pointer" type="checkbox"/>
<span className="material-symbols-outlined text-[15px] text-primary" title="High Priority">signal_cellular_alt</span>
<div className="w-3.5 h-3.5 rounded-full border border-primary flex items-center justify-center flex-shrink-0">
<div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
</div>
<span className="font-label-code text-label-code text-outline group-hover:text-on-surface-variant flex-shrink-0">SCR-110</span>
<div className="flex items-center gap-2 truncate min-w-0">
<span className="font-body-md text-body-md text-on-surface truncate">PostgreSQL Read Replica Connection Pooler Load Balancer</span>
<span className="px-1.5 py-0.2 rounded bg-surface-container-highest text-on-surface-variant font-label-badge text-[10px] flex-shrink-0">Infra</span>
</div>
</div>
<div className="flex items-center gap-3 flex-shrink-0 ml-4">
<span className="font-label-code text-[11px] text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">Sprint 14</span>
<div className="flex items-center gap-1 font-label-code text-label-code text-outline bg-surface-container px-1.5 py-0.5 rounded">
<span className="material-symbols-outlined text-[13px]">timer</span>
<span>1h 50m</span>
</div>
<div className="flex items-center gap-1 font-body-sm text-[11px] text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">
<span className="material-symbols-outlined text-[12px] text-outline">event</span>
<span>Nov 05</span>
</div>
<div className="w-5 h-5 rounded bg-primary-container flex items-center justify-center text-on-primary-container font-headline-sm text-[10px]">
                NV
              </div>
</div>
</div>
{/*  Bottom Add inline prompt  */}
<div className="flex items-center gap-2 h-8 px-space-md bg-surface-container-low hover:bg-surface-container/60 text-outline hover:text-on-surface transition-colors cursor-pointer font-body-sm text-body-sm">
<span className="material-symbols-outlined text-[15px]">add</span>
<span>Add task to In Progress...</span>
</div>
</div>
</section>
{/*  ================= SECTION 2: IN REVIEW =================  */}
<section className="flex flex-col">
<div className="flex items-center justify-between px-space-md py-1.5 bg-surface-container-lowest rounded-t">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-[16px] text-secondary" style={{fontVariationSettings: "\'FILL\' 1"}}>find_in_page</span>
<h2 className="font-headline-sm text-body-md text-on-surface tracking-tight">In Review</h2>
<span className="font-label-code text-label-code text-on-surface-variant bg-surface-container px-1.5 py-0.2 rounded font-medium">5</span>
</div>
<div className="flex items-center gap-space-sm text-outline font-body-sm text-[11px]">
<span>2 PRs PENDING</span>
<span>•</span>
<span>EST 18h</span>
<button className="hover:text-on-surface ml-1 p-0.5 rounded hover:bg-surface-container transition-colors" type="button">
<span className="material-symbols-outlined text-[15px]">more_horiz</span>
</button>
</div>
</div>
<div className="flex flex-col bg-surface-container-low rounded-b overflow-hidden shadow-sm">
{/*  Row: SCR-105 (Component Library Finalization)  */}
<div className="group relative flex items-center justify-between h-9 px-space-md bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer">
<div className="absolute left-0 top-0 bottom-0 w-0.5 bg-secondary opacity-0 group-hover:opacity-100 transition-opacity"></div>
<div className="flex items-center gap-space-md min-w-0 flex-1">
<input className="w-3.5 h-3.5 rounded-sm bg-surface-container-high defaultChecked={true}:bg-secondary accent-secondary cursor-pointer" type="checkbox"/>
<span className="material-symbols-outlined text-[15px] text-primary" title="High Priority">signal_cellular_alt</span>
<div className="w-3.5 h-3.5 rounded-full border border-secondary flex items-center justify-center flex-shrink-0">
<span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
</div>
<span className="font-label-code text-label-code text-outline group-hover:text-on-surface-variant flex-shrink-0">SCR-105</span>
<div className="flex items-center gap-2 truncate min-w-0">
<span className="font-body-md text-body-md text-on-surface font-medium truncate">Component Library Finalization &amp; Token Exports</span>
<span className="flex items-center gap-0.5 px-1 rounded bg-surface-container-high text-outline font-label-code text-[10px] flex-shrink-0">
<span className="material-symbols-outlined text-[11px]">alt_route</span>
                  PR #418
                </span>
<span className="px-1.5 py-0.2 rounded bg-surface-container-highest text-on-surface-variant font-label-badge text-[10px] flex-shrink-0">Design System</span>
</div>
</div>
<div className="flex items-center gap-3 flex-shrink-0 ml-4">
<span className="font-label-code text-[11px] text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">Sprint 14</span>
<div className="flex items-center gap-1 font-label-code text-label-code text-outline bg-surface-container px-1.5 py-0.5 rounded">
<span className="material-symbols-outlined text-[13px]">timer</span>
<span>12h 00m</span>
</div>
<div className="flex items-center gap-1 font-body-sm text-[11px] text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">
<span className="material-symbols-outlined text-[12px] text-outline">event</span>
<span>Oct 30</span>
</div>
<div className="w-5 h-5 rounded bg-tertiary-container flex items-center justify-center text-on-tertiary-container font-headline-sm text-[10px]">
                MR
              </div>
</div>
</div>
{/*  Row: SCR-112 (OAuth2 Refresh Token Revocation Strategy)  */}
<div className="group relative flex items-center justify-between h-9 px-space-md bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer">
<div className="absolute left-0 top-0 bottom-0 w-0.5 bg-secondary opacity-0 group-hover:opacity-100 transition-opacity"></div>
<div className="flex items-center gap-space-md min-w-0 flex-1">
<input className="w-3.5 h-3.5 rounded-sm bg-surface-container-high defaultChecked={true}:bg-secondary accent-secondary cursor-pointer" type="checkbox"/>
<span className="material-symbols-outlined text-[15px] text-error" title="Urgent Priority">priority_high</span>
<div className="w-3.5 h-3.5 rounded-full border border-secondary flex items-center justify-center flex-shrink-0">
<span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
</div>
<span className="font-label-code text-label-code text-outline group-hover:text-on-surface-variant flex-shrink-0">SCR-112</span>
<div className="flex items-center gap-2 truncate min-w-0">
<span className="font-body-md text-body-md text-on-surface truncate">OAuth2 Refresh Token Revocation Strategy &amp; Blacklist Cache</span>
<span className="flex items-center gap-0.5 px-1 rounded bg-surface-container-high text-outline font-label-code text-[10px] flex-shrink-0">
<span className="material-symbols-outlined text-[11px]">alt_route</span>
                  PR #421
                </span>
<span className="px-1.5 py-0.2 rounded bg-surface-container-highest text-on-surface-variant font-label-badge text-[10px] flex-shrink-0">Security</span>
</div>
</div>
<div className="flex items-center gap-3 flex-shrink-0 ml-4">
<span className="font-label-code text-[11px] text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">Sprint 14</span>
<div className="flex items-center gap-1 font-label-code text-label-code text-outline bg-surface-container px-1.5 py-0.5 rounded">
<span className="material-symbols-outlined text-[13px]">timer</span>
<span>9h 30m</span>
</div>
<div className="flex items-center gap-1 font-body-sm text-[11px] text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">
<span className="material-symbols-outlined text-[12px] text-outline">event</span>
<span>Oct 29</span>
</div>
<div className="w-5 h-5 rounded bg-primary-container flex items-center justify-center text-on-primary-container font-headline-sm text-[10px]">
                NV
              </div>
</div>
</div>
</div>
</section>
{/*  ================= SECTION 3: TODO =================  */}
<section className="flex flex-col">
<div className="flex items-center justify-between px-space-md py-1.5 bg-surface-container-lowest rounded-t">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-[16px] text-outline">circle</span>
<h2 className="font-headline-sm text-body-md text-on-surface tracking-tight">Todo</h2>
<span className="font-label-code text-label-code text-on-surface-variant bg-surface-container px-1.5 py-0.2 rounded font-medium">14</span>
</div>
<div className="flex items-center gap-space-sm text-outline font-body-sm text-[11px]">
<span>EST 76h</span>
<span>•</span>
<span>UNASSIGNED: 2</span>
<button className="hover:text-on-surface ml-1 p-0.5 rounded hover:bg-surface-container transition-colors" type="button">
<span className="material-symbols-outlined text-[15px]">more_horiz</span>
</button>
</div>
</div>
<div className="flex flex-col bg-surface-container-low rounded-b overflow-hidden shadow-sm">
{/*  Row: SCR-101 (Design Token System Architecture)  */}
<div className="group relative flex items-center justify-between h-9 px-space-md bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer">
<div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary-container opacity-0 group-hover:opacity-100 transition-opacity"></div>
<div className="flex items-center gap-space-md min-w-0 flex-1">
<input className="w-3.5 h-3.5 rounded-sm bg-surface-container-high defaultChecked={true}:bg-primary accent-primary cursor-pointer" type="checkbox"/>
<span className="material-symbols-outlined text-[15px] text-primary" title="High Priority">signal_cellular_alt</span>
<div className="w-3.5 h-3.5 rounded-full border border-outline flex items-center justify-center flex-shrink-0"></div>
<span className="font-label-code text-label-code text-outline group-hover:text-on-surface-variant flex-shrink-0">SCR-101</span>
<div className="flex items-center gap-2 truncate min-w-0">
<span className="font-body-md text-body-md text-on-surface font-medium truncate">Design Token System Architecture &amp; Figma Sync Plugin</span>
<span className="flex items-center gap-0.5 px-1 rounded bg-surface-container-high text-outline font-label-code text-[10px] flex-shrink-0">
<span className="material-symbols-outlined text-[11px]">checklist</span>
                  0/4
                </span>
<span className="px-1.5 py-0.2 rounded bg-surface-container-highest text-on-surface-variant font-label-badge text-[10px] flex-shrink-0">Design</span>
</div>
</div>
<div className="flex items-center gap-3 flex-shrink-0 ml-4">
<span className="font-label-code text-[11px] text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">Sprint 14</span>
<div className="flex items-center gap-1 font-label-code text-label-code text-outline bg-surface-container px-1.5 py-0.5 rounded">
<span className="material-symbols-outlined text-[13px]">timer</span>
<span>0h</span>
</div>
<div className="flex items-center gap-1 font-body-sm text-[11px] text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">
<span className="material-symbols-outlined text-[12px] text-outline">event</span>
<span>Nov 08</span>
</div>
<div className="w-5 h-5 rounded bg-surface-container-highest flex items-center justify-center text-on-surface font-headline-sm text-[10px]">
                AL
              </div>
</div>
</div>
{/*  Row: SCR-102 (Client Feedback Integration)  */}
<div className="group relative flex items-center justify-between h-9 px-space-md bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer">
<div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary-container opacity-0 group-hover:opacity-100 transition-opacity"></div>
<div className="flex items-center gap-space-md min-w-0 flex-1">
<input className="w-3.5 h-3.5 rounded-sm bg-surface-container-high defaultChecked={true}:bg-primary accent-primary cursor-pointer" type="checkbox"/>
<span className="material-symbols-outlined text-[15px] text-error" title="Urgent Priority">priority_high</span>
<div className="w-3.5 h-3.5 rounded-full border border-outline flex items-center justify-center flex-shrink-0"></div>
<span className="font-label-code text-label-code text-outline group-hover:text-on-surface-variant flex-shrink-0">SCR-102</span>
<div className="flex items-center gap-2 truncate min-w-0">
<span className="font-body-md text-body-md text-on-surface truncate">Client Feedback Integration &amp; Staging Demo QA Runbook</span>
<span className="px-1.5 py-0.2 rounded bg-surface-container-highest text-on-surface-variant font-label-badge text-[10px] flex-shrink-0">Product</span>
</div>
</div>
<div className="flex items-center gap-3 flex-shrink-0 ml-4">
<span className="font-label-code text-[11px] text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">Sprint 14</span>
<div className="flex items-center gap-1 font-label-code text-label-code text-outline bg-surface-container px-1.5 py-0.5 rounded">
<span className="material-symbols-outlined text-[13px]">timer</span>
<span>0h</span>
</div>
<div className="flex items-center gap-1 font-body-sm text-[11px] text-error bg-error-container/20 px-1.5 py-0.5 rounded">
<span className="material-symbols-outlined text-[12px]">calendar_clock</span>
<span>Nov 01</span>
</div>
<div className="w-5 h-5 rounded bg-primary-container flex items-center justify-center text-on-primary-container font-headline-sm text-[10px]">
                NV
              </div>
</div>
</div>
{/*  Row: SCR-103 (Micro-animations & Lottie Specs)  */}
<div className="group relative flex items-center justify-between h-9 px-space-md bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer">
<div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary-container opacity-0 group-hover:opacity-100 transition-opacity"></div>
<div className="flex items-center gap-space-md min-w-0 flex-1">
<input className="w-3.5 h-3.5 rounded-sm bg-surface-container-high defaultChecked={true}:bg-primary accent-primary cursor-pointer" type="checkbox"/>
<span className="material-symbols-outlined text-[15px] text-outline" title="Low Priority">south</span>
<div className="w-3.5 h-3.5 rounded-full border border-outline flex items-center justify-center flex-shrink-0"></div>
<span className="font-label-code text-label-code text-outline group-hover:text-on-surface-variant flex-shrink-0">SCR-103</span>
<div className="flex items-center gap-2 truncate min-w-0">
<span className="font-body-md text-body-md text-on-surface truncate">Micro-animations &amp; Lottie Specs for Empty State Indicators</span>
<span className="px-1.5 py-0.2 rounded bg-surface-container-highest text-on-surface-variant font-label-badge text-[10px] flex-shrink-0">Motion</span>
</div>
</div>
<div className="flex items-center gap-3 flex-shrink-0 ml-4">
<span className="font-label-code text-[11px] text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">Sprint 14</span>
<div className="flex items-center gap-1 font-label-code text-label-code text-outline bg-surface-container px-1.5 py-0.5 rounded">
<span className="material-symbols-outlined text-[13px]">timer</span>
<span>0h</span>
</div>
<div className="flex items-center gap-1 font-body-sm text-[11px] text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">
<span className="material-symbols-outlined text-[12px] text-outline">event</span>
<span>Nov 12</span>
</div>
<div className="w-5 h-5 rounded bg-surface-container-highest flex items-center justify-center text-on-surface font-headline-sm text-[10px]">
                DS
              </div>
</div>
</div>
{/*  Bottom Add inline prompt  */}
<div className="flex items-center gap-2 h-8 px-space-md bg-surface-container-low hover:bg-surface-container/60 text-outline hover:text-on-surface transition-colors cursor-pointer font-body-sm text-body-sm">
<span className="material-symbols-outlined text-[15px]">add</span>
<span>Add task to Todo...</span>
</div>
</div>
</section>
</div>
{/*  Active Task Detail Popover Context (Keyboard-driven Preview Deck)  */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-space-md pt-2">
{/*  Velocity & Sprint Sparkcard  */}
<div className="flex flex-col gap-2 p-3 bg-surface-container-lowest rounded shadow-sm">
<div className="flex items-center justify-between text-outline">
<span className="font-headline-sm text-body-sm text-on-surface">Sprint 14 Velocity</span>
<span className="font-label-code text-label-code text-primary">64%</span>
</div>
{/*  Inline Mini SVG Progress / Velocity Sparkline  */}
<div className="w-full h-8 flex items-end gap-1 pt-1">
<div className="flex-1 bg-surface-container rounded-xs h-3"></div>
<div className="flex-1 bg-surface-container rounded-xs h-4"></div>
<div className="flex-1 bg-surface-container rounded-xs h-6"></div>
<div className="flex-1 bg-primary/40 rounded-xs h-5"></div>
<div className="flex-1 bg-primary/60 rounded-xs h-7"></div>
<div className="flex-1 bg-primary rounded-xs h-8"></div>
<div className="flex-1 bg-primary-container rounded-xs h-6"></div>
<div className="flex-1 bg-surface-container-high rounded-xs h-2"></div>
</div>
<div className="flex items-center justify-between text-[11px] font-body-sm text-outline">
<span>Target: 48 pts</span>
<span className="text-on-surface font-label-code">31 pts burned</span>
</div>
</div>
{/*  Time Tracking Breakdown  */}
<div className="flex flex-col gap-2 p-3 bg-surface-container-lowest rounded shadow-sm">
<div className="flex items-center justify-between">
<span className="font-headline-sm text-body-sm text-on-surface">Time Allocation</span>
<span className="font-label-code text-label-code text-outline">84h Total</span>
</div>
<div className="w-full bg-surface-container rounded-full h-2 flex overflow-hidden">
<div className="bg-primary h-full" style={{width: "48%"}} title="Core Development 48%"></div>
<div className="bg-secondary h-full" style={{width: "26%"}} title="Review &amp; QA 26%"></div>
<div className="bg-tertiary-container h-full" style={{width: "14%"}} title="Architecture 14%"></div>
<div className="bg-surface-container-highest h-full" style={{width: "12%"}} title="Meetings 12%"></div>
</div>
<div className="flex items-center justify-between text-[11px] font-body-sm text-outline">
<span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-primary"></span> Core Dev</span>
<span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> Review</span>
<span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-tertiary-container"></span> Arch</span>
</div>
</div>
{/*  Keyboard Command Guide  */}
<div className="flex flex-col justify-between p-3 bg-surface-container-lowest rounded shadow-sm">
<div className="flex items-center justify-between">
<span className="font-headline-sm text-body-sm text-on-surface">Linear Quick Actions</span>
<span className="material-symbols-outlined text-[15px] text-outline">keyboard</span>
</div>
<div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] font-body-sm text-outline">
<div className="flex items-center justify-between"><span>New issue</span><kbd className="font-label-kbd bg-surface-container px-1 rounded text-on-surface">C</kbd></div>
<div className="flex items-center justify-between"><span>Change status</span><kbd className="font-label-kbd bg-surface-container px-1 rounded text-on-surface">S</kbd></div>
<div className="flex items-center justify-between"><span>Assignee</span><kbd className="font-label-kbd bg-surface-container px-1 rounded text-on-surface">A</kbd></div>
<div className="flex items-center justify-between"><span>Set priority</span><kbd className="font-label-kbd bg-surface-container px-1 rounded text-on-surface">P</kbd></div>
</div>
</div>
</div>
</div>
{/*  Sleek Bottom Fixed-Style Task Metrics Bar  */}
<footer className="sticky bottom-0 left-0 right-0 -mx-8 px-8 py-2 bg-surface-container-lowest/95 backdrop-blur-md flex items-center justify-between shadow-xl z-30">
<div className="flex items-center gap-space-lg">
<div className="flex items-center gap-2">
<span className="w-2 h-2 rounded-full bg-primary"></span>
<span className="font-body-sm text-body-sm text-on-surface font-medium">38 Total Tasks</span>
</div>
<div className="h-3 w-px bg-surface-variant"></div>
<div className="flex items-center gap-space-sm font-label-code text-label-code text-outline">
<span className="text-on-surface">8</span> in progress
        <span>•</span>
<span className="text-on-surface">5</span> in review
        <span>•</span>
<span className="text-on-surface">14</span> todo
        <span>•</span>
<span className="text-on-surface">11</span> other
      </div>
</div>
{/*  Center/Right: Velocity & Shortcuts  */}
<div className="flex items-center gap-space-md">
<div className="flex items-center gap-2 font-body-sm text-body-sm">
<span className="text-outline">Sprint Velocity:</span>
<span className="font-label-code text-label-code text-primary font-semibold">64%</span>
<div className="w-16 h-1.5 rounded-full bg-surface-container overflow-hidden">
<div className="h-full bg-primary" style={{width: "64%"}}></div>
</div>
</div>
<div className="h-3 w-px bg-surface-variant"></div>
<div className="flex items-center gap-1 text-[11px] font-body-sm text-outline">
<span>Press</span>
<kbd className="font-label-kbd bg-surface-container px-1 rounded text-on-surface">?</kbd>
<span>for shortcut list</span>
</div>
</div>
</footer>

    </div>
  );
}
