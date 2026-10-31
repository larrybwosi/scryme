"use client";

import Link from "next/link";
import React, { useState } from "react";

export default function BoardPage() {
  return (
    <div className="flex flex-col w-full pb-16">
<div className="flex flex-col w-full">
<div className="flex flex-col gap-space-md pb-space-lg">
{/*  Board Secondary Sub-Header & Controls  */}
<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md pt-space-xs">
<div className="flex items-center gap-space-md">
<div className="flex items-center gap-space-sm">
<div className="w-2.5 h-2.5 rounded-sm bg-primary-container"></div>
<h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Nexus 2.0 Redesign</h1>
</div>
<div className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-surface-container-high text-on-surface-variant font-label-badge text-label-badge tracking-wide">
<span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
<span>Sprint 14</span>
<span className="text-outline font-label-code text-label-code">4d left</span>
</div>
<div className="hidden xl:flex items-center gap-1 text-outline font-label-code text-label-code bg-surface-container-low px-2 py-0.5 rounded-sm">
<span className="material-symbols-outlined text-[13px] text-primary">data_thresholding</span>
<span>58 issues • 84% cycle velocity</span>
</div>
</div>
{/*  Quick Action Buttons  */}
<div className="flex items-center gap-space-sm self-start lg:self-auto">
<div className="flex items-center bg-surface-container-low rounded-sm p-0.5 shadow-sm">
<button className="px-2 py-1 rounded-sm bg-surface-container-highest text-on-surface font-label-badge text-label-badge flex items-center gap-1 shadow-sm" type="button">
<span className="material-symbols-outlined text-[14px]">view_kanban</span>
<span>Board</span>
</button>
<button className="px-2 py-1 rounded-sm text-outline hover:text-on-surface font-label-badge text-label-badge flex items-center gap-1 transition-colors" type="button">
<span className="material-symbols-outlined text-[14px]">view_agenda</span>
<span>List</span>
</button>
<button className="px-2 py-1 rounded-sm text-outline hover:text-on-surface font-label-badge text-label-badge flex items-center gap-1 transition-colors" type="button">
<span className="material-symbols-outlined text-[14px]">timeline</span>
<span>Roadmap</span>
</button>
</div>
<button className="h-8 px-2.5 rounded-sm bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm flex items-center gap-1.5 transition-colors" type="button">
<span className="material-symbols-outlined text-[15px] text-outline">tune</span>
<span>Display</span>
</button>
<button className="h-8 px-3 rounded-sm bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-headline-sm flex items-center gap-1.5 shadow-sm transition-all" type="button">
<span className="material-symbols-outlined text-[16px]">add</span>
<span>New Issue</span>
<kbd className="font-label-kbd text-label-kbd bg-on-primary-container/20 px-1 rounded-sm ml-1 text-on-primary-container">C</kbd>
</button>
</div>
</div>
{/*  Filter & View Command Bar  */}
<div className="flex flex-wrap items-center justify-between gap-space-sm bg-surface-container-lowest p-space-xs rounded-sm">
<div className="flex flex-wrap items-center gap-1.5">
<div className="relative flex items-center">
<span className="material-symbols-outlined absolute left-2 text-outline text-[16px] pointer-events-none">filter_list</span>
<input className="h-7 w-48 sm:w-64 bg-surface-container-low focus:bg-surface-container text-on-surface placeholder:text-outline text-body-sm font-body-sm pl-7 pr-7 rounded-sm outline-none transition-all" placeholder="Filter issues (press 'F')..." type="text"/>
<span className="font-label-kbd text-label-kbd text-outline absolute right-2">/</span>
</div>
{/*  Filter Segment Toggles  */}
<div className="h-4 w-px bg-surface-container-highest mx-1"></div>
<button className="h-7 px-2 rounded-sm bg-surface-container-high text-on-surface font-body-sm text-body-sm flex items-center gap-1" type="button">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
<span>Active</span>
<span className="font-label-code text-label-code text-outline ml-1">39</span>
</button>
<button className="h-7 px-2 rounded-sm bg-surface-container-low hover:bg-surface-container text-outline hover:text-on-surface font-body-sm text-body-sm flex items-center gap-1 transition-colors" type="button">
<span className="material-symbols-outlined text-[14px]">person</span>
<span>Assignee</span>
<span className="material-symbols-outlined text-[14px] text-outline">expand_more</span>
</button>
<button className="h-7 px-2 rounded-sm bg-surface-container-low hover:bg-surface-container text-outline hover:text-on-surface font-body-sm text-body-sm flex items-center gap-1 transition-colors" type="button">
<span className="material-symbols-outlined text-[14px]">flag</span>
<span>Priority</span>
<span className="material-symbols-outlined text-[14px] text-outline">expand_more</span>
</button>
<button className="h-7 px-2 rounded-sm bg-surface-container-low hover:bg-surface-container text-outline hover:text-on-surface font-body-sm text-body-sm flex items-center gap-1 transition-colors" type="button">
<span className="material-symbols-outlined text-[14px]">label</span>
<span>Label</span>
</button>
</div>
<div className="flex items-center gap-2">
{/*  Team Stack Representation  */}
<div className="flex items-center -space-x-1.5">
<div className="w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-badge text-[9px] shadow-sm">MK</div>
<div className="w-5 h-5 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-label-badge text-[9px] shadow-sm">EL</div>
<div className="w-5 h-5 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center font-label-badge text-[9px] shadow-sm">DR</div>
<div className="w-5 h-5 rounded-full bg-surface-container-highest text-outline flex items-center justify-center font-label-badge text-[9px] shadow-sm">+5</div>
</div>
<div className="h-4 w-px bg-surface-container-highest mx-1"></div>
<button className="h-7 px-2 rounded-sm bg-surface-container-low hover:bg-surface-container text-outline hover:text-on-surface font-body-sm text-body-sm flex items-center gap-1 transition-colors" type="button">
<span className="material-symbols-outlined text-[15px]">view_column</span>
<span>Add Column</span>
</button>
</div>
</div>
</div>
{/*  Kanban Horizontal Columns Container  */}
<div className="w-full overflow-x-auto pb-6 scrollbar-none">
<div className="flex items-start gap-3 min-w-[1360px] select-none">
{/*  ================= 1. BACKLOG COLUMN =================  */}
<div className="flex flex-col w-[268px] flex-shrink-0 bg-surface-container-lowest/80 rounded-sm p-1.5">
{/*  Column Header  */}
<div className="flex items-center justify-between px-2 py-1.5 mb-1.5">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-outline text-[16px]">radio_button_unchecked</span>
<span className="font-headline-sm text-headline-sm text-on-surface">Backlog</span>
<span className="px-1.5 py-0.2 rounded-sm bg-surface-container font-label-code text-label-code text-outline">12</span>
</div>
<div className="flex items-center gap-1">
<button className="text-outline hover:text-on-surface p-0.5 rounded-sm hover:bg-surface-container transition-colors" type="button">
<span className="material-symbols-outlined text-[16px]">add</span>
</button>
<button className="text-outline hover:text-on-surface p-0.5 rounded-sm hover:bg-surface-container transition-colors" type="button">
<span className="material-symbols-outlined text-[16px]">more_horiz</span>
</button>
</div>
</div>
{/*  Issue Cards Lane  */}
<div className="flex flex-col gap-2">
{/*  Card: SCR-89  */}
<div className="group flex flex-col p-2.5 rounded-sm bg-surface-container-low hover:bg-surface-container text-on-surface cursor-pointer shadow-sm hover:shadow-md transition-all">
<div className="flex items-center justify-between text-outline mb-1.5">
<span className="font-label-code text-label-code text-outline hover:text-primary">SCR-89</span>
<span className="material-symbols-outlined text-outline text-[14px]">signal_cellular_alt_1_bar</span>
</div>
<p className="font-body-md text-body-md text-on-surface font-medium leading-snug mb-2 group-hover:text-primary-fixed transition-colors">
              Deprecate legacy WebSocket connection fallback
            </p>
<div className="flex items-center justify-between mt-auto pt-1">
<div className="flex items-center gap-1.5">
<span className="px-1.5 py-0.5 rounded-sm bg-surface-container-high text-on-surface-variant font-label-badge text-label-badge">Arch</span>
<span className="font-label-code text-label-code text-outline">Cycle 12</span>
</div>
<div className="w-4 h-4 rounded-full bg-surface-container-highest text-outline flex items-center justify-center font-label-badge text-[9px]">un</div>
</div>
</div>
{/*  Card: SCR-94  */}
<div className="group flex flex-col p-2.5 rounded-sm bg-surface-container-low hover:bg-surface-container text-on-surface cursor-pointer shadow-sm hover:shadow-md transition-all">
<div className="flex items-center justify-between text-outline mb-1.5">
<span className="font-label-code text-label-code text-outline hover:text-primary">SCR-94</span>
<span className="material-symbols-outlined text-outline text-[14px]">signal_cellular_alt_2_bar</span>
</div>
<p className="font-body-md text-body-md text-on-surface font-medium leading-snug mb-2 group-hover:text-primary-fixed transition-colors">
              Unified keyboard shortcuts map across modal sheets
            </p>
<div className="flex items-center justify-between mt-auto pt-1">
<div className="flex items-center gap-1.5">
<span className="px-1.5 py-0.5 rounded-sm bg-surface-container-high text-on-surface-variant font-label-badge text-label-badge">UX</span>
<span className="flex items-center gap-0.5 text-outline font-label-code text-label-code">
<span className="material-symbols-outlined text-[13px]">checklist</span> 0/4
                </span>
</div>
<div className="w-4 h-4 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-label-badge text-[9px]">TC</div>
</div>
</div>
{/*  Card: SCR-98  */}
<div className="group flex flex-col p-2.5 rounded-sm bg-surface-container-low hover:bg-surface-container text-on-surface cursor-pointer shadow-sm hover:shadow-md transition-all">
<div className="flex items-center justify-between text-outline mb-1.5">
<span className="font-label-code text-label-code text-outline hover:text-primary">SCR-98</span>
<span className="material-symbols-outlined text-outline text-[14px]">signal_cellular_alt_1_bar</span>
</div>
<p className="font-body-md text-body-md text-on-surface font-medium leading-snug mb-2 group-hover:text-primary-fixed transition-colors">
              Evaluate Rust-based regex compile engine for search
            </p>
<div className="flex items-center justify-between mt-auto pt-1">
<div className="flex items-center gap-1.5">
<span className="px-1.5 py-0.5 rounded-sm bg-surface-container-high text-on-surface-variant font-label-badge text-label-badge">Engine</span>
</div>
<div className="w-4 h-4 rounded-full bg-surface-container-highest text-outline flex items-center justify-center font-label-badge text-[9px]">RH</div>
</div>
</div>
</div>
</div>
{/*  ================= 2. TODO COLUMN =================  */}
<div className="flex flex-col w-[268px] flex-shrink-0 bg-surface-container-lowest/80 rounded-sm p-1.5">
{/*  Column Header  */}
<div className="flex items-center justify-between px-2 py-1.5 mb-1.5">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-secondary text-[16px]">change_circle</span>
<span className="font-headline-sm text-headline-sm text-on-surface">Todo</span>
<span className="px-1.5 py-0.2 rounded-sm bg-surface-container font-label-code text-label-code text-outline">14</span>
</div>
<div className="flex items-center gap-1">
<button className="text-outline hover:text-on-surface p-0.5 rounded-sm hover:bg-surface-container transition-colors" type="button">
<span className="material-symbols-outlined text-[16px]">add</span>
</button>
<button className="text-outline hover:text-on-surface p-0.5 rounded-sm hover:bg-surface-container transition-colors" type="button">
<span className="material-symbols-outlined text-[16px]">more_horiz</span>
</button>
</div>
</div>
<div className="flex flex-col gap-2">
{/*  Card: SCR-101 (Urgent Flame)  */}
<div className="group flex flex-col p-2.5 rounded-sm bg-surface-container-low hover:bg-surface-container text-on-surface cursor-pointer shadow-sm hover:shadow-md transition-all">
<div className="flex items-center justify-between text-outline mb-1.5">
<div className="flex items-center gap-1.5">
<span className="font-label-code text-label-code text-primary-fixed">SCR-101</span>
<span className="px-1 py-0.2 rounded-sm bg-error-container text-error font-label-badge text-[10px] flex items-center gap-0.5">
<span className="material-symbols-outlined text-[12px] leading-none">local_fire_department</span> Urgent
                </span>
</div>
<span className="material-symbols-outlined text-error text-[15px]">priority_high</span>
</div>
<p className="font-body-md text-body-md text-on-surface font-medium leading-snug mb-2 group-hover:text-primary-fixed transition-colors">
              Resolve memory leak in telemetry stream sync worker
            </p>
<div className="flex items-center justify-between mt-auto pt-1">
<div className="flex items-center gap-1.5">
<span className="px-1.5 py-0.5 rounded-sm bg-surface-container-high text-on-surface-variant font-label-badge text-label-badge">Infra</span>
<span className="flex items-center gap-0.5 text-outline font-label-code text-label-code">
<span className="material-symbols-outlined text-[13px]">checklist</span> 1/3
                </span>
</div>
<div className="w-4 h-4 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-badge text-[9px]">MK</div>
</div>
</div>
{/*  Card: SCR-104 (High Priority)  */}
<div className="group flex flex-col p-2.5 rounded-sm bg-surface-container-low hover:bg-surface-container text-on-surface cursor-pointer shadow-sm hover:shadow-md transition-all">
<div className="flex items-center justify-between text-outline mb-1.5">
<span className="font-label-code text-label-code text-outline hover:text-primary">SCR-104</span>
<span className="material-symbols-outlined text-primary text-[15px]">signal_cellular_alt</span>
</div>
<p className="font-body-md text-body-md text-on-surface font-medium leading-snug mb-2 group-hover:text-primary-fixed transition-colors">
              Design high-density split view for code diff review
            </p>
<div className="flex items-center justify-between mt-auto pt-1">
<div className="flex items-center gap-1.5">
<span className="px-1.5 py-0.5 rounded-sm bg-surface-container-high text-on-surface-variant font-label-badge text-label-badge">UI</span>
<span className="font-label-code text-label-code text-outline">Sprint 14</span>
</div>
<div className="w-4 h-4 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-label-badge text-[9px]">EL</div>
</div>
</div>
{/*  Card: SCR-108  */}
<div className="group flex flex-col p-2.5 rounded-sm bg-surface-container-low hover:bg-surface-container text-on-surface cursor-pointer shadow-sm hover:shadow-md transition-all">
<div className="flex items-center justify-between text-outline mb-1.5">
<span className="font-label-code text-label-code text-outline hover:text-primary">SCR-108</span>
<span className="material-symbols-outlined text-outline text-[14px]">signal_cellular_alt_2_bar</span>
</div>
<p className="font-body-md text-body-md text-on-surface font-medium leading-snug mb-2 group-hover:text-primary-fixed transition-colors">
              OAuth token auto-renewal background service hooks
            </p>
<div className="flex items-center justify-between mt-auto pt-1">
<div className="flex items-center gap-1.5">
<span className="px-1.5 py-0.5 rounded-sm bg-surface-container-high text-on-surface-variant font-label-badge text-label-badge">Auth</span>
<span className="flex items-center gap-0.5 text-outline font-label-code text-label-code">
<span className="material-symbols-outlined text-[13px]">checklist</span> 2/2
                </span>
</div>
<div className="w-4 h-4 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center font-label-badge text-[9px]">DR</div>
</div>
</div>
</div>
</div>
{/*  ================= 3. IN PROGRESS COLUMN =================  */}
<div className="flex flex-col w-[268px] flex-shrink-0 bg-surface-container-lowest/80 rounded-sm p-1.5">
{/*  Column Header  */}
<div className="flex items-center justify-between px-2 py-1.5 mb-1.5">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-primary-container text-[16px]">timelapse</span>
<span className="font-headline-sm text-headline-sm text-on-surface">In Progress</span>
<span className="px-1.5 py-0.2 rounded-sm bg-primary-container/20 font-label-code text-label-code text-primary">8</span>
</div>
<div className="flex items-center gap-1">
<button className="text-outline hover:text-on-surface p-0.5 rounded-sm hover:bg-surface-container transition-colors" type="button">
<span className="material-symbols-outlined text-[16px]">add</span>
</button>
<button className="text-outline hover:text-on-surface p-0.5 rounded-sm hover:bg-surface-container transition-colors" type="button">
<span className="material-symbols-outlined text-[16px]">more_horiz</span>
</button>
</div>
</div>
<div className="flex flex-col gap-2">
{/*  Featured Card: Interactive Analytics Dashboard (Rich Visual)  */}
<div className="group flex flex-col p-3 rounded-sm bg-surface-container text-on-surface cursor-pointer shadow-md transition-all">
<div className="flex items-center justify-between text-outline mb-1.5">
<div className="flex items-center gap-1.5">
<span className="font-label-code text-label-code text-primary font-semibold">SCR-112</span>
{/*  Active Timer Pill  */}
<div className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-surface-container-high text-primary font-label-code text-[10px]">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse"></span>
<span>01:42:15</span>
</div>
</div>
<span className="material-symbols-outlined text-primary text-[15px]">signal_cellular_alt</span>
</div>
<p className="font-headline-sm text-headline-sm text-on-surface font-semibold leading-snug mb-1.5 group-hover:text-primary-fixed transition-colors">
              Interactive Analytics Dashboard
            </p>
{/*  Inline Metric Mini Sparkline  */}
<div className="my-2 bg-surface-container-lowest p-2 rounded-sm flex flex-col gap-1.5">
<div className="flex justify-between items-center text-outline font-label-badge text-[10px]">
<span>Throughput</span>
<span className="text-primary font-label-code text-label-code">+28.4%</span>
</div>
<div className="w-full h-8 flex items-end gap-1">
<div className="w-full bg-surface-container-high rounded-sm h-[30%]"></div>
<div className="w-full bg-surface-container-high rounded-sm h-[50%]"></div>
<div className="w-full bg-surface-container-high rounded-sm h-[40%]"></div>
<div className="w-full bg-primary-container/70 rounded-sm h-[75%]"></div>
<div className="w-full bg-primary-container rounded-sm h-[95%]"></div>
<div className="w-full bg-primary rounded-sm h-[80%]"></div>
<div className="w-full bg-primary-container rounded-sm h-[100%]"></div>
</div>
</div>
{/*  Progress Bar  */}
<div className="flex flex-col gap-1 mb-2.5">
<div className="flex justify-between text-outline font-label-code text-[11px]">
<span>Milestone tasks</span>
<span className="text-on-surface">5/7 done</span>
</div>
<div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden">
<div className="bg-primary-container h-full rounded-full w-[71%]"></div>
</div>
</div>
<div className="flex items-center justify-between pt-1">
<div className="flex items-center gap-1.5">
<span className="px-1.5 py-0.5 rounded-sm bg-primary-container/20 text-primary-fixed font-label-badge text-label-badge">Front-End</span>
<span className="px-1.5 py-0.5 rounded-sm bg-surface-container-high text-on-surface-variant font-label-badge text-label-badge">Canvas</span>
</div>
<div className="flex items-center -space-x-1">
<div className="w-4 h-4 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-badge text-[9px]">MK</div>
<div className="w-4 h-4 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-label-badge text-[9px]">AL</div>
</div>
</div>
</div>
{/*  Card: SCR-115  */}
<div className="group flex flex-col p-2.5 rounded-sm bg-surface-container-low hover:bg-surface-container text-on-surface cursor-pointer shadow-sm hover:shadow-md transition-all">
<div className="flex items-center justify-between text-outline mb-1.5">
<span className="font-label-code text-label-code text-outline hover:text-primary">SCR-115</span>
<span className="material-symbols-outlined text-outline text-[14px]">signal_cellular_alt_2_bar</span>
</div>
<p className="font-body-md text-body-md text-on-surface font-medium leading-snug mb-2 group-hover:text-primary-fixed transition-colors">
              Extract shared color token palette for desktop dark mode
            </p>
<div className="flex items-center justify-between mt-auto pt-1">
<div className="flex items-center gap-1.5">
<span className="px-1.5 py-0.5 rounded-sm bg-surface-container-high text-on-surface-variant font-label-badge text-label-badge">Design</span>
</div>
<div className="w-4 h-4 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-label-badge text-[9px]">EL</div>
</div>
</div>
</div>
</div>
{/*  ================= 4. IN REVIEW COLUMN =================  */}
<div className="flex flex-col w-[268px] flex-shrink-0 bg-surface-container-lowest/80 rounded-sm p-1.5">
{/*  Column Header  */}
<div className="flex items-center justify-between px-2 py-1.5 mb-1.5">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-tertiary text-[16px]">rate_review</span>
<span className="font-headline-sm text-headline-sm text-on-surface">In Review</span>
<span className="px-1.5 py-0.2 rounded-sm bg-surface-container font-label-code text-label-code text-outline">5</span>
</div>
<div className="flex items-center gap-1">
<button className="text-outline hover:text-on-surface p-0.5 rounded-sm hover:bg-surface-container transition-colors" type="button">
<span className="material-symbols-outlined text-[16px]">add</span>
</button>
<button className="text-outline hover:text-on-surface p-0.5 rounded-sm hover:bg-surface-container transition-colors" type="button">
<span className="material-symbols-outlined text-[16px]">more_horiz</span>
</button>
</div>
</div>
<div className="flex flex-col gap-2">
{/*  Card: SCR-118  */}
<div className="group flex flex-col p-2.5 rounded-sm bg-surface-container-low hover:bg-surface-container text-on-surface cursor-pointer shadow-sm hover:shadow-md transition-all">
<div className="flex items-center justify-between text-outline mb-1.5">
<span className="font-label-code text-label-code text-outline hover:text-primary">SCR-118</span>
<div className="flex items-center gap-1 px-1.5 py-0.2 rounded-sm bg-tertiary-container/30 text-tertiary-fixed font-label-badge text-[10px]">
<span className="material-symbols-outlined text-[12px]">verified</span> QA Ready
              </div>
</div>
<p className="font-body-md text-body-md text-on-surface font-medium leading-snug mb-2 group-hover:text-primary-fixed transition-colors">
              Virtual table list rendering optimization with 10k rows
            </p>
{/*  Review Details Strip  */}
<div className="bg-surface-container-lowest p-1.5 rounded-sm mb-2 flex items-center justify-between text-outline font-label-badge text-[10px]">
<span className="flex items-center gap-1 text-on-surface-variant">
<span className="material-symbols-outlined text-[13px] text-primary">commit</span> PR #348
              </span>
<span className="text-outline">Reviewer: DR</span>
</div>
<div className="flex items-center justify-between mt-auto pt-1">
<div className="flex items-center gap-1.5">
<span className="px-1.5 py-0.5 rounded-sm bg-surface-container-high text-on-surface-variant font-label-badge text-label-badge">Perf</span>
</div>
<div className="flex items-center gap-1">
<span className="text-outline font-label-code text-[10px]">QA by</span>
<div className="w-4 h-4 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center font-label-badge text-[9px]">DR</div>
</div>
</div>
</div>
{/*  Card: SCR-121  */}
<div className="group flex flex-col p-2.5 rounded-sm bg-surface-container-low hover:bg-surface-container text-on-surface cursor-pointer shadow-sm hover:shadow-md transition-all">
<div className="flex items-center justify-between text-outline mb-1.5">
<span className="font-label-code text-label-code text-outline hover:text-primary">SCR-121</span>
<span className="material-symbols-outlined text-outline text-[14px]">signal_cellular_alt_1_bar</span>
</div>
<p className="font-body-md text-body-md text-on-surface font-medium leading-snug mb-2 group-hover:text-primary-fixed transition-colors">
              Fix command palette flickering on rapid ESC triggers
            </p>
<div className="flex items-center justify-between mt-auto pt-1">
<div className="flex items-center gap-1.5">
<span className="px-1.5 py-0.5 rounded-sm bg-surface-container-high text-on-surface-variant font-label-badge text-label-badge">Hotfix</span>
</div>
<div className="w-4 h-4 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-badge text-[9px]">MK</div>
</div>
</div>
</div>
</div>
{/*  ================= 5. DONE COLUMN =================  */}
<div className="flex flex-col w-[268px] flex-shrink-0 bg-surface-container-lowest/80 rounded-sm p-1.5">
{/*  Column Header  */}
<div className="flex items-center justify-between px-2 py-1.5 mb-1.5">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-primary text-[16px]" style={{fontVariationSettings: "\'FILL\' 1"}}>check_circle</span>
<span className="font-headline-sm text-headline-sm text-on-surface">Done</span>
<span className="px-1.5 py-0.2 rounded-sm bg-surface-container font-label-code text-label-code text-outline">19</span>
</div>
<div className="flex items-center gap-1">
<button className="text-outline hover:text-on-surface p-0.5 rounded-sm hover:bg-surface-container transition-colors" type="button">
<span className="material-symbols-outlined text-[16px]">more_horiz</span>
</button>
</div>
</div>
<div className="flex flex-col gap-2">
{/*  Card: SCR-77 (Completed)  */}
<div className="group flex flex-col p-2.5 rounded-sm bg-surface-container-low/70 hover:bg-surface-container text-on-surface cursor-pointer opacity-85 hover:opacity-100 transition-all">
<div className="flex items-center justify-between text-outline mb-1.5">
<div className="flex items-center gap-1.5">
<span className="material-symbols-outlined text-primary text-[14px]" style={{fontVariationSettings: "\'FILL\' 1"}}>check_circle</span>
<span className="font-label-code text-label-code text-outline line-through">SCR-77</span>
</div>
<span className="font-label-code text-label-code text-outline text-[11px]">Sprint 13</span>
</div>
<p className="font-body-md text-body-md text-outline font-normal leading-snug mb-2 line-through">
              Refactor Global State Dispatcher to use Zustand slices
            </p>
<div className="flex items-center justify-between mt-auto pt-1">
<div className="flex items-center gap-1.5">
<span className="px-1.5 py-0.5 rounded-sm bg-surface-container text-outline font-label-badge text-label-badge">Core</span>
<span className="text-outline font-label-badge text-[10px]">Closed</span>
</div>
<div className="w-4 h-4 rounded-full bg-surface-container-highest text-outline flex items-center justify-center font-label-badge text-[9px]">MK</div>
</div>
</div>
{/*  Card: SCR-82 (Completed)  */}
<div className="group flex flex-col p-2.5 rounded-sm bg-surface-container-low/70 hover:bg-surface-container text-on-surface cursor-pointer opacity-85 hover:opacity-100 transition-all">
<div className="flex items-center justify-between text-outline mb-1.5">
<div className="flex items-center gap-1.5">
<span className="material-symbols-outlined text-primary text-[14px]" style={{fontVariationSettings: "\'FILL\' 1"}}>check_circle</span>
<span className="font-label-code text-label-code text-outline line-through">SCR-82</span>
</div>
<span className="font-label-code text-label-code text-outline text-[11px]">Sprint 13</span>
</div>
<p className="font-body-md text-body-md text-outline font-normal leading-snug mb-2 line-through">
              Set up Docker preview environments on ephemeral PR branches
            </p>
<div className="flex items-center justify-between mt-auto pt-1">
<div className="flex items-center gap-1.5">
<span className="px-1.5 py-0.5 rounded-sm bg-surface-container text-outline font-label-badge text-label-badge">DevOps</span>
</div>
<div className="w-4 h-4 rounded-full bg-surface-container-highest text-outline flex items-center justify-center font-label-badge text-[9px]">DR</div>
</div>
</div>
{/*  Card: SCR-86 (Completed)  */}
<div className="group flex flex-col p-2.5 rounded-sm bg-surface-container-low/70 hover:bg-surface-container text-on-surface cursor-pointer opacity-85 hover:opacity-100 transition-all">
<div className="flex items-center justify-between text-outline mb-1.5">
<div className="flex items-center gap-1.5">
<span className="material-symbols-outlined text-primary text-[14px]" style={{fontVariationSettings: "\'FILL\' 1"}}>check_circle</span>
<span className="font-label-code text-label-code text-outline line-through">SCR-86</span>
</div>
<span className="font-label-code text-label-code text-outline text-[11px]">Sprint 14</span>
</div>
<p className="font-body-md text-body-md text-outline font-normal leading-snug mb-2 line-through">
              Replace system font cascade with bundled JetBrains Mono &amp; Inter
            </p>
<div className="flex items-center justify-between mt-auto pt-1">
<div className="flex items-center gap-1.5">
<span className="px-1.5 py-0.5 rounded-sm bg-surface-container text-outline font-label-badge text-label-badge">Typography</span>
</div>
<div className="w-4 h-4 rounded-full bg-surface-container-highest text-outline flex items-center justify-center font-label-badge text-[9px]">EL</div>
</div>
</div>
</div>
</div>
</div>
</div>
{/*  Bottom Workspace Status Bar  */}
<div className="w-full flex items-center justify-between py-space-xs text-outline font-label-code text-label-code border-t border-outline-variant/20 mt-space-md">
<div className="flex items-center gap-space-md">
<span className="flex items-center gap-1">
<span className="w-2 h-2 rounded-full bg-primary-container"></span>
<span className="text-on-surface-variant font-body-sm text-body-sm">Sprint 14 Target: Apr 26</span>
</span>
<span className="hidden sm:inline text-outline-variant">•</span>
<span className="hidden sm:inline text-outline">58 total issues synced</span>
<span className="hidden md:inline text-outline-variant">•</span>
<span className="hidden md:inline text-outline">Linear Sync v2.4 (Active)</span>
</div>
<div className="flex items-center gap-space-md">
<div className="flex items-center gap-1">
<kbd className="font-label-kbd text-label-kbd bg-surface-container px-1 py-0.5 rounded text-outline">J</kbd>
<kbd className="font-label-kbd text-label-kbd bg-surface-container px-1 py-0.5 rounded text-outline">K</kbd>
<span className="text-[11px] text-outline ml-1">Navigate</span>
</div>
<div className="flex items-center gap-1">
<kbd className="font-label-kbd text-label-kbd bg-surface-container px-1 py-0.5 rounded text-outline">Space</kbd>
<span className="text-[11px] text-outline ml-1">Expand</span>
</div>
</div>
</div>
</div>

    </div>
  );
}
