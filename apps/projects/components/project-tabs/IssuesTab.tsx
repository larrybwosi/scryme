"use client";

import Link from "next/link";
import React, { useState } from "react";

export function IssuesTab() {
  return (
    <div className="flex flex-col w-full">
{/*  Top Project Banner & Metadata  */}
<div className="flex flex-col gap-space-md pb-space-lg">
{/*  Breadcrumbs & Global Quick Actions  */}
<div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-xs">
<div className="flex items-center gap-2">
<span className="font-body-sm text-body-sm text-outline hover:text-on-surface transition-colors cursor-pointer">Projects</span>
<span className="text-outline-variant font-label-code text-body-sm">/</span>
<span className="font-label-code text-label-code text-outline uppercase tracking-wider">PRJ-204</span>
<span className="text-outline-variant font-label-code text-body-sm">/</span>
<span className="font-headline-sm text-headline-sm text-on-surface font-semibold">Nexus 2.0 Redesign</span>
</div>
<div className="flex items-center gap-space-xs">
<button className="h-8 px-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center gap-1.5 transition-colors shadow-sm font-body-sm text-body-sm" type="button">
<span className="material-symbols-outlined text-[16px] text-outline">ios_share</span>
<span>Share</span>
</button>
<button className="h-8 px-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center gap-1.5 transition-colors shadow-sm font-body-sm text-body-sm" id="copyUrlBtn" type="button">
<span className="material-symbols-outlined text-[16px] text-outline">link</span>
<span id="copyUrlLabel">Copy URL</span>
</button>
<button className="h-8 px-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center gap-1.5 transition-colors shadow-sm font-body-sm text-body-sm" type="button">
<span className="material-symbols-outlined text-[16px] text-outline">edit_note</span>
<span>Edit Spec</span>
</button>
<button className="h-8 px-space-md rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container flex items-center gap-1.5 transition-colors font-headline-sm text-body-sm font-medium shadow-sm" type="button">
<span className="material-symbols-outlined text-[16px]">add</span>
<span>New Issue</span>
<span className="font-label-kbd text-label-kbd bg-surface-container-lowest/30 px-1 py-0.5 rounded text-on-primary-container">C</span>
</button>
</div>
</div>
{/*  Title, Badges & Execution Status  */}
<div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md bg-surface-container-low p-space-lg rounded-xl shadow-sm">
<div className="flex flex-col gap-space-xs max-w-3xl">
<div className="flex flex-wrap items-center gap-2">
<span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-container-high text-primary font-label-badge text-label-badge font-semibold">
<span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            Live Pipeline
          </span>
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-error-container/30 text-error font-label-badge text-label-badge font-semibold">
<span className="material-symbols-outlined text-[13px]">emergency</span>
            High Priority
          </span>
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-badge text-label-badge">
<span className="material-symbols-outlined text-[13px] text-outline">calendar_today</span>
            Target: Oct 29, 2024
          </span>
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container/40 text-secondary font-label-badge text-label-badge font-medium">
<span className="material-symbols-outlined text-[13px]">verified</span>
            94% Health
          </span>
</div>
<h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight mt-1">Nexus 2.0 Redesign &amp; Kinetic Real-Time Engine</h1>
<p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
          Zero-latency multi-tenant state orchestration, high-frequency WebGL rendering pipelines, and unified atomic token architectures powering next-generation Scryme surfaces.
        </p>
</div>
{/*  Quick progress donut / metric combo  */}
<div className="flex items-center gap-space-lg self-start lg:self-auto bg-surface-container p-space-md rounded-lg">
<div className="relative w-14 h-14 flex items-center justify-center shrink-0">
<svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
<path className="text-surface-container-highest" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="3.5"></path>
<path className="text-primary-container" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-dasharray="68, 100" stroke-linecap="round" stroke-width="3.5"></path>
</svg>
<span className="absolute font-headline-sm text-body-sm text-on-surface font-semibold">68%</span>
</div>
<div className="flex flex-col">
<span className="font-label-badge text-label-badge text-outline uppercase tracking-wider">Milestone Beta</span>
<span className="font-headline-sm text-body-sm text-on-surface font-medium">42 / 58 Closed or In Review</span>
<span className="font-body-sm text-body-sm text-outline-variant mt-0.5">8 Days Remaining in Sprint 14</span>
</div>
</div>
</div>
{/*  Project Metrics Summary KPI Strip  */}
<div className="grid grid-cols-2 md:grid-cols-5 gap-space-sm">
<div className="flex flex-col p-space-md rounded-lg bg-surface-container-low shadow-sm">
<div className="flex items-center justify-between text-outline">
<span className="font-label-badge text-label-badge uppercase tracking-wider">Execution State</span>
<span className="material-symbols-outlined text-[16px] text-primary">speed</span>
</div>
<div className="flex items-baseline gap-1.5 mt-1">
<span className="font-headline-md text-headline-md text-on-surface font-semibold">68%</span>
<span className="font-label-code text-body-sm text-primary">+4.2% wk</span>
</div>
<div className="w-full bg-surface-container-highest h-1 rounded-full mt-2 overflow-hidden">
<div className="bg-primary-container h-full rounded-full" style={{width: "68%"}}></div>
</div>
</div>
<div className="flex flex-col p-space-md rounded-lg bg-surface-container-low shadow-sm">
<div className="flex items-center justify-between text-outline">
<span className="font-label-badge text-label-badge uppercase tracking-wider">Active Sprint</span>
<span className="material-symbols-outlined text-[16px] text-secondary">sync</span>
</div>
<div className="flex items-baseline gap-1.5 mt-1">
<span className="font-headline-md text-headline-md text-on-surface font-semibold">Sprint 14</span>
<span className="font-label-code text-body-sm text-outline">Day 6/14</span>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant mt-2 truncate">Velocity: 44.5 pts / cycle</span>
</div>
<div className="flex flex-col p-space-md rounded-lg bg-surface-container-low shadow-sm">
<div className="flex items-center justify-between text-outline">
<span className="font-label-badge text-label-badge uppercase tracking-wider">Hours Logged</span>
<span className="material-symbols-outlined text-[16px] text-primary-fixed-dim">timer</span>
</div>
<div className="flex items-baseline gap-1.5 mt-1">
<span className="font-headline-md text-headline-md text-on-surface font-semibold">142h</span>
<span className="font-label-code text-body-sm text-outline-variant">/ 180h cap</span>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant mt-2 truncate">38h projected buffer</span>
</div>
<div className="flex flex-col p-space-md rounded-lg bg-surface-container-low shadow-sm">
<div className="flex items-center justify-between text-outline">
<span className="font-label-badge text-label-badge uppercase tracking-wider">Cap Utilization</span>
<span className="material-symbols-outlined text-[16px] text-on-surface-variant">account_balance_wallet</span>
</div>
<div className="flex items-baseline gap-1.5 mt-1">
<span className="font-headline-md text-headline-md text-on-surface font-semibold">$19,880</span>
<span className="font-label-code text-body-sm text-outline">78.5%</span>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant mt-2 truncate">Pool budget: $25,300</span>
</div>
<div className="col-span-2 md:col-span-1 flex flex-col p-space-md rounded-lg bg-surface-container-low shadow-sm">
<div className="flex items-center justify-between text-outline">
<span className="font-label-badge text-label-badge uppercase tracking-wider">Squad Roster</span>
<span className="material-symbols-outlined text-[16px] text-secondary">group</span>
</div>
<div className="flex items-center justify-between mt-1">
<span className="font-headline-md text-headline-md text-on-surface font-semibold">6 members</span>
<div className="flex -space-x-1.5 overflow-hidden">
<span className="inline-flex h-6 w-6 rounded-full bg-primary-container text-on-primary-container items-center justify-center font-label-badge text-body-sm font-semibold">ER</span>
<span className="inline-flex h-6 w-6 rounded-full bg-secondary-container text-on-secondary-container items-center justify-center font-label-badge text-body-sm font-semibold">MK</span>
<span className="inline-flex h-6 w-6 rounded-full bg-surface-container-highest text-on-surface items-center justify-center font-label-badge text-body-sm font-semibold">AN</span>
<span className="inline-flex h-6 w-6 rounded-full bg-outline-variant text-on-surface items-center justify-center font-label-badge text-body-sm font-semibold">TL</span>
</div>
</div>
<span className="font-body-sm text-body-sm text-primary mt-2 flex items-center gap-1 cursor-pointer hover:underline">
          Manage allocations <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
</span>
</div>
</div>
{/*  Project Sub-Tabs Navigation Strip  */}
<div className="flex items-center gap-1 overflow-x-auto bg-surface-container-lowest p-1 rounded-lg">
<button className="px-space-md py-1.5 rounded text-outline hover:text-on-surface hover:bg-surface-container transition-all font-body-sm text-body-sm flex items-center gap-1.5 shrink-0" type="button">
<span className="material-symbols-outlined text-[16px]">overview</span>
<span>Overview</span>
</button>
{/*  Active Issues Tab with solid highlight  */}
<button className="px-space-md py-1.5 rounded bg-surface-container-high text-on-surface font-headline-sm text-body-sm flex items-center gap-2 shrink-0 shadow-sm" type="button">
<span className="material-symbols-outlined text-[16px] text-primary">adjust</span>
<span>Issues</span>
<span className="px-1.5 py-0.2 rounded-full bg-primary-container text-on-primary-container font-label-badge text-label-badge font-semibold">58</span>
<div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
</button>
<button className="px-space-md py-1.5 rounded text-outline hover:text-on-surface hover:bg-surface-container transition-all font-body-sm text-body-sm flex items-center gap-1.5 shrink-0" type="button">
<span className="material-symbols-outlined text-[16px]">change_circle</span>
<span>Cycles &amp; Sprints</span>
</button>
<button className="px-space-md py-1.5 rounded text-outline hover:text-on-surface hover:bg-surface-container transition-all font-body-sm text-body-sm flex items-center gap-1.5 shrink-0" type="button">
<span className="material-symbols-outlined text-[16px]">flag</span>
<span>Milestones</span>
<span className="px-1.5 py-0.2 rounded bg-surface-container text-outline font-label-badge text-label-badge">4</span>
</button>
<button className="px-space-md py-1.5 rounded text-outline hover:text-on-surface hover:bg-surface-container transition-all font-body-sm text-body-sm flex items-center gap-1.5 shrink-0" type="button">
<span className="material-symbols-outlined text-[16px]">description</span>
<span>Documents &amp; RFCs</span>
<span className="px-1.5 py-0.2 rounded bg-surface-container text-outline font-label-badge text-label-badge">6</span>
</button>
<button className="px-space-md py-1.5 rounded text-outline hover:text-on-surface hover:bg-surface-container transition-all font-body-sm text-body-sm flex items-center gap-1.5 shrink-0" type="button">
<span className="material-symbols-outlined text-[16px]">shield_person</span>
<span>Team &amp; Access</span>
</button>
<button className="px-space-md py-1.5 rounded text-outline hover:text-on-surface hover:bg-surface-container transition-all font-body-sm text-body-sm flex items-center gap-1.5 shrink-0" type="button">
<span className="material-symbols-outlined text-[16px]">analytics</span>
<span>Analytics &amp; Telemetry</span>
</button>
</div>
</div>
{/*  Filter & View Controls Bar (Linear Precision Toolset)  */}
<div className="flex flex-col gap-space-sm bg-surface-container-low p-space-md rounded-xl mb-space-md shadow-sm">
<div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-space-sm">
{/*  Search Input  */}
<div className="relative flex-1 max-w-xl">
<span className="material-symbols-outlined text-[16px] text-outline absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">search</span>
<input className="w-full h-8 pl-8 pr-12 rounded-lg bg-surface-container text-on-surface placeholder:text-outline font-body-sm text-body-sm outline-none focus:bg-surface-container-highest transition-colors" id="issueSearchInput" placeholder="Filter by title, description, or #tag... (Press '/' to focus)" type="text"/>
<div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
<span className="font-label-kbd text-label-kbd text-outline bg-surface-container-low px-1 py-0.5 rounded">/</span>
</div>
</div>
{/*  View Switcher & Display Options  */}
<div className="flex items-center gap-space-xs self-end md:self-auto">
{/*  View Mode Switcher  */}
<div className="flex items-center bg-surface-container p-0.5 rounded-lg">
<button className="h-7 px-2.5 rounded bg-surface-container-high text-on-surface font-headline-sm text-body-sm flex items-center gap-1 shadow-sm" type="button">
<span className="material-symbols-outlined text-[15px] text-primary">view_stream</span>
<span>List</span>
</button>
<button className="h-7 px-2.5 rounded text-outline hover:text-on-surface hover:bg-surface-container-high/50 font-body-sm text-body-sm flex items-center gap-1 transition-colors" type="button">
<span className="material-symbols-outlined text-[15px]">view_kanban</span>
<span>Board</span>
</button>
<button className="h-7 px-2.5 rounded text-outline hover:text-on-surface hover:bg-surface-container-high/50 font-body-sm text-body-sm flex items-center gap-1 transition-colors" type="button">
<span className="material-symbols-outlined text-[15px]">grid_view</span>
<span>Matrix</span>
</button>
</div>
<button className="h-8 px-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface font-body-sm text-body-sm flex items-center gap-1.5 transition-colors" type="button">
<span className="material-symbols-outlined text-[16px] text-outline">tune</span>
<span>Display</span>
</button>
<button className="h-8 px-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface font-body-sm text-body-sm flex items-center gap-1.5 transition-colors" type="button">
<span className="material-symbols-outlined text-[16px] text-outline">swap_vert</span>
<span>Priority</span>
<span className="material-symbols-outlined text-[14px] text-outline">expand_more</span>
</button>
</div>
</div>
{/*  Active Filter Chips Row  */}
<div className="flex items-center gap-space-xs overflow-x-auto pb-0.5 pt-1 text-body-sm">
<div className="flex items-center gap-1 bg-surface-container px-2 py-1 rounded-md text-on-surface shrink-0">
<span className="material-symbols-outlined text-[14px] text-outline">filter_list</span>
<span className="font-label-badge text-label-badge text-outline">Status:</span>
<span className="font-headline-sm text-body-sm text-primary">All (58)</span>
<button className="hover:text-error text-outline transition-colors ml-0.5" type="button"><span className="material-symbols-outlined text-[13px]">close</span></button>
</div>
<button className="flex items-center gap-1.5 bg-surface-container hover:bg-surface-container-high px-2 py-1 rounded-md text-on-surface-variant hover:text-on-surface transition-colors shrink-0" type="button">
<span className="w-2 h-2 rounded-full bg-secondary"></span>
<span>In Progress</span>
<span className="font-label-code text-body-sm text-outline">8</span>
</button>
<button className="flex items-center gap-1.5 bg-surface-container hover:bg-surface-container-high px-2 py-1 rounded-md text-on-surface-variant hover:text-on-surface transition-colors shrink-0" type="button">
<span className="w-2 h-2 rounded-full bg-outline"></span>
<span>Todo</span>
<span className="font-label-code text-body-sm text-outline">14</span>
</button>
<button className="flex items-center gap-1.5 bg-surface-container hover:bg-surface-container-high px-2 py-1 rounded-md text-on-surface-variant hover:text-on-surface transition-colors shrink-0" type="button">
<span className="w-2 h-2 rounded-full bg-primary-container"></span>
<span>In Review</span>
<span className="font-label-code text-body-sm text-outline">5</span>
</button>
<button className="flex items-center gap-1.5 bg-surface-container hover:bg-surface-container-high px-2 py-1 rounded-md text-on-surface-variant hover:text-on-surface transition-colors shrink-0" type="button">
<span className="w-2 h-2 rounded-full bg-outline-variant"></span>
<span>Done</span>
<span className="font-label-code text-body-sm text-outline">31</span>
</button>
<div className="h-4 w-px bg-surface-container-highest shrink-0 mx-1"></div>
{/*  Priority Filter Dropdown Trigger  */}
<button className="flex items-center gap-1 bg-surface-container hover:bg-surface-container-high px-2 py-1 rounded-md text-on-surface-variant hover:text-on-surface transition-colors shrink-0" type="button">
<span className="material-symbols-outlined text-[14px] text-error">priority_high</span>
<span>Priority</span>
<span className="material-symbols-outlined text-[13px] text-outline">expand_more</span>
</button>
{/*  Assignee Filter Dropdown Trigger  */}
<button className="flex items-center gap-1 bg-surface-container hover:bg-surface-container-high px-2 py-1 rounded-md text-on-surface-variant hover:text-on-surface transition-colors shrink-0" type="button">
<span className="material-symbols-outlined text-[14px] text-outline">person</span>
<span>Assignee</span>
<span className="material-symbols-outlined text-[13px] text-outline">expand_more</span>
</button>
{/*  Label Filter Dropdown Trigger  */}
<button className="flex items-center gap-1 bg-surface-container hover:bg-surface-container-high px-2 py-1 rounded-md text-on-surface-variant hover:text-on-surface transition-colors shrink-0" type="button">
<span className="material-symbols-outlined text-[14px] text-outline">label</span>
<span>Label: WebGL, Engine, Tokens...</span>
<span className="material-symbols-outlined text-[13px] text-outline">expand_more</span>
</button>
{/*  Cycle Filter Dropdown Trigger  */}
<button className="flex items-center gap-1 bg-surface-container hover:bg-surface-container-high px-2 py-1 rounded-md text-on-surface-variant hover:text-on-surface transition-colors shrink-0" type="button">
<span className="material-symbols-outlined text-[14px] text-primary">autorenew</span>
<span>Sprint 14</span>
<span className="material-symbols-outlined text-[13px] text-outline">expand_more</span>
</button>
</div>
</div>
{/*  Linear Precision Grouped Issue List Canvas  */}
<div className="flex flex-col gap-space-md pb-space-xl">
{/*  ==========================================  */}
{/*  GROUP 1: IN PROGRESS (8 ISSUES)  */}
{/*  ==========================================  */}
<div className="flex flex-col rounded-xl bg-surface-container-lowest overflow-hidden shadow-sm">
{/*  Section Header  */}
<div className="flex items-center justify-between px-space-md py-2 bg-surface-container-low select-none">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-[16px] text-secondary">motion_photos_on</span>
<span className="font-headline-sm text-body-sm text-on-surface font-semibold uppercase tracking-wider">In Progress</span>
<span className="px-1.5 py-0.2 rounded-full bg-surface-container text-on-surface-variant font-label-code text-label-badge font-semibold">8</span>
<span className="text-outline-variant font-body-sm">·</span>
<span className="font-body-sm text-body-sm text-outline">Sprint 14 active</span>
</div>
<div className="flex items-center gap-3">
<span className="font-label-code text-label-code text-outline">Est: 64h (32h logged)</span>
<button className="text-outline hover:text-on-surface transition-colors" type="button">
<span className="material-symbols-outlined text-[16px]">more_horiz</span>
</button>
</div>
</div>
{/*  Issue Rows  */}
<div className="flex flex-col">
{/*  Row 1: SCR-104  */}
<div className="group flex items-center justify-between px-space-md py-2.5 hover:bg-surface-container transition-colors cursor-pointer">
<div className="flex items-center gap-space-sm min-w-0 flex-1">
<div className="w-4 h-4 rounded flex items-center justify-center text-outline group-hover:text-primary transition-colors">
<span className="material-symbols-outlined text-[15px]">check_box_outline_blank</span>
</div>
{/*  Priority Icon (Urgent)  */}
<span className="material-symbols-outlined text-[16px] text-error shrink-0" title="Urgent Priority">error</span>
{/*  Key / Identifier  */}
<span className="font-label-code text-label-code text-outline group-hover:text-primary transition-colors shrink-0">SCR-104</span>
{/*  Title  */}
<span className="font-body-md text-body-md text-on-surface font-medium truncate flex-1 min-w-0">
              WebGL canvas frame stream double-buffering &amp; memory pool
            </span>
{/*  PR Pill  */}
<span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-container text-primary font-label-code text-label-badge shrink-0">
<span className="material-symbols-outlined text-[12px]">alt_route</span>
              PR #489
            </span>
{/*  Labels  */}
<div className="hidden lg:flex items-center gap-1 shrink-0">
<span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-badge text-label-badge">canvas</span>
<span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-badge text-label-badge">perf</span>
</div>
</div>
<div className="flex items-center gap-space-md shrink-0 ml-4">
<span className="font-label-code text-body-sm text-outline hidden sm:inline">28h (14h)</span>
<span className="px-2 py-0.5 rounded bg-surface-container text-outline font-label-badge text-label-badge hidden md:inline">Sprint 14</span>
<div className="flex items-center gap-1.5" title="Elena Rostova">
<span className="w-5 h-5 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-label-badge text-[10px] font-semibold">ER</span>
<span className="font-body-sm text-body-sm text-on-surface-variant hidden xl:inline">Elena Rostova</span>
</div>
</div>
</div>
{/*  Row 2: SCR-106  */}
<div className="group flex items-center justify-between px-space-md py-2.5 hover:bg-surface-container transition-colors cursor-pointer">
<div className="flex items-center gap-space-sm min-w-0 flex-1">
<div className="w-4 h-4 rounded flex items-center justify-center text-outline group-hover:text-primary transition-colors">
<span className="material-symbols-outlined text-[15px]">check_box_outline_blank</span>
</div>
{/*  Priority Icon (High)  */}
<span className="material-symbols-outlined text-[16px] text-primary shrink-0" title="High Priority">signal_cellular_alt</span>
<span className="font-label-code text-label-code text-outline group-hover:text-primary transition-colors shrink-0">SCR-106</span>
<span className="font-body-md text-body-md text-on-surface font-medium truncate flex-1 min-w-0">
              Optimistic offline state queue replay under degraded network
            </span>
<span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-container text-primary font-label-code text-label-badge shrink-0">
<span className="material-symbols-outlined text-[12px]">alt_route</span>
              PR #492
            </span>
<div className="hidden lg:flex items-center gap-1 shrink-0">
<span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-badge text-label-badge">engine</span>
<span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-badge text-label-badge">sync</span>
</div>
</div>
<div className="flex items-center gap-space-md shrink-0 ml-4">
<span className="font-label-code text-body-sm text-outline hidden sm:inline">16h (8h)</span>
<span className="px-2 py-0.5 rounded bg-surface-container text-outline font-label-badge text-label-badge hidden md:inline">Sprint 14</span>
<div className="flex items-center gap-1.5" title="Marcus Kane">
<span className="w-5 h-5 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-label-badge text-[10px] font-semibold">MK</span>
<span className="font-body-sm text-body-sm text-on-surface-variant hidden xl:inline">Marcus Kane</span>
</div>
</div>
</div>
{/*  Row 3: SCR-110  */}
<div className="group flex items-center justify-between px-space-md py-2.5 hover:bg-surface-container transition-colors cursor-pointer">
<div className="flex items-center gap-space-sm min-w-0 flex-1">
<div className="w-4 h-4 rounded flex items-center justify-center text-outline group-hover:text-primary transition-colors">
<span className="material-symbols-outlined text-[15px]">check_box_outline_blank</span>
</div>
{/*  Priority Icon (High)  */}
<span className="material-symbols-outlined text-[16px] text-primary shrink-0" title="High Priority">signal_cellular_alt</span>
<span className="font-label-code text-label-code text-outline group-hover:text-primary transition-colors shrink-0">SCR-110</span>
<span className="font-body-md text-body-md text-on-surface font-medium truncate flex-1 min-w-0">
              PostgreSQL Read Replica Connection Pooler Load Balancer
            </span>
<div className="hidden lg:flex items-center gap-1 shrink-0">
<span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-badge text-label-badge">infra</span>
<span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-badge text-label-badge">db</span>
</div>
</div>
<div className="flex items-center gap-space-md shrink-0 ml-4">
<span className="font-label-code text-body-sm text-outline hidden sm:inline">12h (6h)</span>
<span className="px-2 py-0.5 rounded bg-surface-container text-outline font-label-badge text-label-badge hidden md:inline">Sprint 14</span>
<div className="flex items-center gap-1.5" title="Alex Nazeer">
<span className="w-5 h-5 rounded-full bg-surface-container-highest text-on-surface flex items-center justify-center font-label-badge text-[10px] font-semibold">AN</span>
<span className="font-body-sm text-body-sm text-on-surface-variant hidden xl:inline">Alex Nazeer</span>
</div>
</div>
</div>
{/*  Row 4: SCR-115  */}
<div className="group flex items-center justify-between px-space-md py-2.5 hover:bg-surface-container transition-colors cursor-pointer">
<div className="flex items-center gap-space-sm min-w-0 flex-1">
<div className="w-4 h-4 rounded flex items-center justify-center text-outline group-hover:text-primary transition-colors">
<span className="material-symbols-outlined text-[15px]">check_box_outline_blank</span>
</div>
{/*  Priority Icon (Medium)  */}
<span className="material-symbols-outlined text-[16px] text-tertiary shrink-0" title="Medium Priority">signal_cellular_alt_2_bar</span>
<span className="font-label-code text-label-code text-outline group-hover:text-primary transition-colors shrink-0">SCR-115</span>
<span className="font-body-md text-body-md text-on-surface font-medium truncate flex-1 min-w-0">
              Extract shared color token palette for desktop dark mode
            </span>
<div className="hidden lg:flex items-center gap-1 shrink-0">
<span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-badge text-label-badge">design-tokens</span>
</div>
</div>
<div className="flex items-center gap-space-md shrink-0 ml-4">
<span className="font-label-code text-body-sm text-outline hidden sm:inline">8h (4h)</span>
<span className="px-2 py-0.5 rounded bg-surface-container text-outline font-label-badge text-label-badge hidden md:inline">Sprint 14</span>
<div className="flex items-center gap-1.5" title="Elena Rostova">
<span className="w-5 h-5 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-label-badge text-[10px] font-semibold">ER</span>
<span className="font-body-sm text-body-sm text-on-surface-variant hidden xl:inline">Elena Rostova</span>
</div>
</div>
</div>
</div>
</div>
{/*  ==========================================  */}
{/*  GROUP 2: IN REVIEW (5 ISSUES)  */}
{/*  ==========================================  */}
<div className="flex flex-col rounded-xl bg-surface-container-lowest overflow-hidden shadow-sm">
{/*  Section Header  */}
<div className="flex items-center justify-between px-space-md py-2 bg-surface-container-low select-none">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-[16px] text-primary">rate_review</span>
<span className="font-headline-sm text-body-sm text-on-surface font-semibold uppercase tracking-wider">In Review</span>
<span className="px-1.5 py-0.2 rounded-full bg-surface-container text-on-surface-variant font-label-code text-label-badge font-semibold">5</span>
<span className="text-outline-variant font-body-sm">·</span>
<span className="font-body-sm text-body-sm text-outline">Awaiting approval</span>
</div>
<div className="flex items-center gap-3">
<span className="font-label-code text-label-code text-outline">Est: 35h</span>
<button className="text-outline hover:text-on-surface transition-colors" type="button">
<span className="material-symbols-outlined text-[16px]">more_horiz</span>
</button>
</div>
</div>
{/*  Issue Rows  */}
<div className="flex flex-col">
{/*  Row 1: SCR-105  */}
<div className="group flex items-center justify-between px-space-md py-2.5 hover:bg-surface-container transition-colors cursor-pointer">
<div className="flex items-center gap-space-sm min-w-0 flex-1">
<div className="w-4 h-4 rounded flex items-center justify-center text-outline group-hover:text-primary transition-colors">
<span className="material-symbols-outlined text-[15px]">check_box_outline_blank</span>
</div>
{/*  Priority Icon (Urgent)  */}
<span className="material-symbols-outlined text-[16px] text-error shrink-0" title="Urgent Priority">error</span>
<span className="font-label-code text-label-code text-outline group-hover:text-primary transition-colors shrink-0">SCR-105</span>
<span className="font-body-md text-body-md text-on-surface font-medium truncate flex-1 min-w-0">
              Component Library Finalization &amp; Token Exports
            </span>
<div className="hidden lg:flex items-center gap-1 shrink-0">
<span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-badge text-label-badge">design-system</span>
</div>
</div>
<div className="flex items-center gap-space-md shrink-0 ml-4">
<div className="hidden sm:flex items-center gap-1 text-outline font-body-sm text-body-sm">
<span className="material-symbols-outlined text-[14px]">visibility</span>
<span className="text-on-surface-variant">Review: ER</span>
</div>
<span className="font-label-code text-body-sm text-outline hidden md:inline">12h</span>
<div className="flex items-center gap-1.5" title="Marcus Kane">
<span className="w-5 h-5 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-label-badge text-[10px] font-semibold">MK</span>
<span className="font-body-sm text-body-sm text-on-surface-variant hidden xl:inline">Marcus Kane</span>
</div>
</div>
</div>
{/*  Row 2: SCR-112  */}
<div className="group flex items-center justify-between px-space-md py-2.5 hover:bg-surface-container transition-colors cursor-pointer">
<div className="flex items-center gap-space-sm min-w-0 flex-1">
<div className="w-4 h-4 rounded flex items-center justify-center text-outline group-hover:text-primary transition-colors">
<span className="material-symbols-outlined text-[15px]">check_box_outline_blank</span>
</div>
{/*  Priority Icon (High)  */}
<span className="material-symbols-outlined text-[16px] text-primary shrink-0" title="High Priority">signal_cellular_alt</span>
<span className="font-label-code text-label-code text-outline group-hover:text-primary transition-colors shrink-0">SCR-112</span>
<span className="font-body-md text-body-md text-on-surface font-medium truncate flex-1 min-w-0">
              OAuth2 Refresh Token Revocation Strategy &amp; Blacklist Cache
            </span>
<div className="hidden lg:flex items-center gap-1 shrink-0">
<span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-badge text-label-badge">security</span>
<span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-badge text-label-badge">auth</span>
</div>
</div>
<div className="flex items-center gap-space-md shrink-0 ml-4">
<span className="font-label-code text-body-sm text-outline hidden md:inline">9h</span>
<span className="px-2 py-0.5 rounded bg-surface-container text-outline font-label-badge text-label-badge hidden md:inline">Sprint 14</span>
<div className="flex items-center gap-1.5" title="Tanya Liu">
<span className="w-5 h-5 rounded-full bg-outline-variant text-on-surface flex items-center justify-center font-label-badge text-[10px] font-semibold">TL</span>
<span className="font-body-sm text-body-sm text-on-surface-variant hidden xl:inline">Tanya Liu</span>
</div>
</div>
</div>
{/*  Row 3: SCR-118  */}
<div className="group flex items-center justify-between px-space-md py-2.5 hover:bg-surface-container transition-colors cursor-pointer">
<div className="flex items-center gap-space-sm min-w-0 flex-1">
<div className="w-4 h-4 rounded flex items-center justify-center text-outline group-hover:text-primary transition-colors">
<span className="material-symbols-outlined text-[15px]">check_box_outline_blank</span>
</div>
{/*  Priority Icon (High)  */}
<span className="material-symbols-outlined text-[16px] text-primary shrink-0" title="High Priority">signal_cellular_alt</span>
<span className="font-label-code text-label-code text-outline group-hover:text-primary transition-colors shrink-0">SCR-118</span>
<span className="font-body-md text-body-md text-on-surface font-medium truncate flex-1 min-w-0">
              Virtual table list renderer for 100k rows at 60fps
            </span>
<div className="hidden lg:flex items-center gap-1 shrink-0">
<span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-badge text-label-badge">perf</span>
<span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-badge text-label-badge">dom</span>
</div>
</div>
<div className="flex items-center gap-space-md shrink-0 ml-4">
<span className="font-label-code text-body-sm text-outline hidden md:inline">14h</span>
<span className="px-2 py-0.5 rounded bg-surface-container text-outline font-label-badge text-label-badge hidden md:inline">Sprint 14</span>
<div className="flex items-center gap-1.5" title="Alex Nazeer">
<span className="w-5 h-5 rounded-full bg-surface-container-highest text-on-surface flex items-center justify-center font-label-badge text-[10px] font-semibold">AN</span>
<span className="font-body-sm text-body-sm text-on-surface-variant hidden xl:inline">Alex Nazeer</span>
</div>
</div>
</div>
</div>
</div>
{/*  ==========================================  */}
{/*  GROUP 3: TODO (14 ISSUES)  */}
{/*  ==========================================  */}
<div className="flex flex-col rounded-xl bg-surface-container-lowest overflow-hidden shadow-sm">
{/*  Section Header  */}
<div className="flex items-center justify-between px-space-md py-2 bg-surface-container-low select-none">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-[16px] text-outline">pending_actions</span>
<span className="font-headline-sm text-body-sm text-on-surface font-semibold uppercase tracking-wider">Todo</span>
<span className="px-1.5 py-0.2 rounded-full bg-surface-container text-on-surface-variant font-label-code text-label-badge font-semibold">14</span>
<span className="text-outline-variant font-body-sm">·</span>
<span className="font-body-sm text-body-sm text-outline">Scheduled items</span>
</div>
<div className="flex items-center gap-3">
<span className="font-label-code text-label-code text-outline">Est: 112h</span>
<button className="text-outline hover:text-on-surface transition-colors" type="button">
<span className="material-symbols-outlined text-[16px]">more_horiz</span>
</button>
</div>
</div>
{/*  Issue Rows  */}
<div className="flex flex-col">
{/*  Row 1: SCR-108  */}
<div className="group flex items-center justify-between px-space-md py-2.5 hover:bg-surface-container transition-colors cursor-pointer">
<div className="flex items-center gap-space-sm min-w-0 flex-1">
<div className="w-4 h-4 rounded flex items-center justify-center text-outline group-hover:text-primary transition-colors">
<span className="material-symbols-outlined text-[15px]">check_box_outline_blank</span>
</div>
{/*  Priority Icon (Normal)  */}
<span className="material-symbols-outlined text-[16px] text-outline shrink-0" title="Normal Priority">signal_cellular_alt_1_bar</span>
<span className="font-label-code text-label-code text-outline group-hover:text-primary transition-colors shrink-0">SCR-108</span>
<span className="font-body-md text-body-md text-on-surface font-medium truncate flex-1 min-w-0">
              Virtual DOM spreadsheet virtualization for 100k+ row datasets
            </span>
<div className="hidden lg:flex items-center gap-1 shrink-0">
<span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-badge text-label-badge">frontend</span>
</div>
</div>
<div className="flex items-center gap-space-md shrink-0 ml-4">
<span className="font-label-code text-body-sm text-outline hidden md:inline">12h</span>
<span className="px-2 py-0.5 rounded bg-surface-container text-outline font-label-badge text-label-badge hidden md:inline">Sprint 14</span>
<div className="flex items-center gap-1.5" title="Tanya Liu">
<span className="w-5 h-5 rounded-full bg-outline-variant text-on-surface flex items-center justify-center font-label-badge text-[10px] font-semibold">TL</span>
<span className="font-body-sm text-body-sm text-on-surface-variant hidden xl:inline">Tanya Liu</span>
</div>
</div>
</div>
{/*  Row 2: SCR-120  */}
<div className="group flex items-center justify-between px-space-md py-2.5 hover:bg-surface-container transition-colors cursor-pointer">
<div className="flex items-center gap-space-sm min-w-0 flex-1">
<div className="w-4 h-4 rounded flex items-center justify-center text-outline group-hover:text-primary transition-colors">
<span className="material-symbols-outlined text-[15px]">check_box_outline_blank</span>
</div>
{/*  Priority Icon (High)  */}
<span className="material-symbols-outlined text-[16px] text-primary shrink-0" title="High Priority">signal_cellular_alt</span>
<span className="font-label-code text-label-code text-outline group-hover:text-primary transition-colors shrink-0">SCR-120</span>
<span className="font-body-md text-body-md text-on-surface font-medium truncate flex-1 min-w-0">
              STOMP delta protocol sequence monotonic retry loop
            </span>
<div className="hidden lg:flex items-center gap-1 shrink-0">
<span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-badge text-label-badge">networking</span>
</div>
</div>
<div className="flex items-center gap-space-md shrink-0 ml-4">
<span className="font-label-code text-body-sm text-outline hidden md:inline">18h</span>
<span className="px-2 py-0.5 rounded bg-surface-container text-outline font-label-badge text-label-badge hidden md:inline">Sprint 15</span>
<div className="flex items-center gap-1.5 text-outline" title="Unassigned">
<span className="w-5 h-5 rounded-full border border-dashed border-outline-variant flex items-center justify-center">
<span className="material-symbols-outlined text-[12px]">person_add</span>
</span>
<span className="font-body-sm text-body-sm text-outline hidden xl:inline">Unassigned</span>
</div>
</div>
</div>
{/*  Row 3: SCR-122  */}
<div className="group flex items-center justify-between px-space-md py-2.5 hover:bg-surface-container transition-colors cursor-pointer">
<div className="flex items-center gap-space-sm min-w-0 flex-1">
<div className="w-4 h-4 rounded flex items-center justify-center text-outline group-hover:text-primary transition-colors">
<span className="material-symbols-outlined text-[15px]">check_box_outline_blank</span>
</div>
{/*  Priority Icon (Urgent)  */}
<span className="material-symbols-outlined text-[16px] text-error shrink-0" title="Urgent Priority">error</span>
<span className="font-label-code text-label-code text-outline group-hover:text-primary transition-colors shrink-0">SCR-122</span>
<span className="font-body-md text-body-md text-on-surface font-medium truncate flex-1 min-w-0">
              WASM SIMD vector acceleration for canvas physics compute
            </span>
<div className="hidden lg:flex items-center gap-1 shrink-0">
<span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-badge text-label-badge">wasm</span>
<span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-badge text-label-badge">core</span>
</div>
</div>
<div className="flex items-center gap-space-md shrink-0 ml-4">
<span className="font-label-code text-body-sm text-outline hidden md:inline">24h</span>
<span className="px-2 py-0.5 rounded bg-surface-container text-outline font-label-badge text-label-badge hidden md:inline">Sprint 15</span>
<div className="flex items-center gap-1.5" title="Marcus Kane">
<span className="w-5 h-5 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-label-badge text-[10px] font-semibold">MK</span>
<span className="font-body-sm text-body-sm text-on-surface-variant hidden xl:inline">Marcus Kane</span>
</div>
</div>
</div>
{/*  Quick Add Issue Row Button  */}
<button className="w-full flex items-center gap-2 px-space-md py-2 hover:bg-surface-container text-outline hover:text-on-surface font-body-sm text-body-sm transition-colors text-left" type="button">
<span className="material-symbols-outlined text-[16px] text-primary">add</span>
<span>Create an issue in Todo...</span>
<span className="font-label-kbd text-label-kbd text-outline ml-auto bg-surface-container px-1 py-0.5 rounded">Enter</span>
</button>
</div>
</div>
</div>
{/*  Bottom Batch & Quick Action Linear Keyboard Status Footer  */}
<footer className="sticky bottom-0 z-30 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-space-sm px-space-md py-2.5 bg-surface-container-low/95 backdrop-blur-md rounded-t-xl shadow-xl">
{/*  Counts Breakdown Summary  */}
<div className="flex items-center gap-space-sm text-body-sm overflow-x-auto">
<span className="font-headline-sm text-body-sm text-on-surface font-medium whitespace-nowrap">58 total issues</span>
<span className="text-outline-variant font-label-code">·</span>
<div className="flex items-center gap-1.5 text-on-surface-variant whitespace-nowrap">
<span className="w-2 h-2 rounded-full bg-secondary"></span>
<span>8 in progress</span>
</div>
<span className="text-outline-variant font-label-code">·</span>
<div className="flex items-center gap-1.5 text-on-surface-variant whitespace-nowrap">
<span className="w-2 h-2 rounded-full bg-primary-container"></span>
<span>5 in review</span>
</div>
<span className="text-outline-variant font-label-code">·</span>
<div className="flex items-center gap-1.5 text-on-surface-variant whitespace-nowrap">
<span className="w-2 h-2 rounded-full bg-outline"></span>
<span>14 todo</span>
</div>
<span className="text-outline-variant font-label-code">·</span>
<div className="flex items-center gap-1.5 text-on-surface-variant whitespace-nowrap">
<span className="w-2 h-2 rounded-full bg-outline-variant"></span>
<span>31 closed</span>
</div>
</div>
{/*  Linear Keycap Hints Strip  */}
<div className="flex items-center gap-space-md text-body-sm text-outline self-end md:self-auto">
<div className="flex items-center gap-1">
<span className="font-label-kbd text-label-kbd text-outline-variant bg-surface-container px-1.5 py-0.5 rounded">C</span>
<span className="text-[11px] font-body-sm">New issue</span>
</div>
<div className="flex items-center gap-1">
<span className="font-label-kbd text-label-kbd text-outline-variant bg-surface-container px-1.5 py-0.5 rounded">S</span>
<span className="text-[11px] font-body-sm">Status</span>
</div>
<div className="flex items-center gap-1">
<span className="font-label-kbd text-label-kbd text-outline-variant bg-surface-container px-1.5 py-0.5 rounded">P</span>
<span className="text-[11px] font-body-sm">Priority</span>
</div>
<div className="flex items-center gap-1">
<span className="font-label-kbd text-label-kbd text-outline-variant bg-surface-container px-1.5 py-0.5 rounded">Space</span>
<span className="text-[11px] font-body-sm">Preview</span>
</div>
</div>
</footer>

    </div>
  );
}
