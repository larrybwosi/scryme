"use client";

import Link from "next/link";
import React, { useState } from "react";

export default function GanttPage() {
  return (
    <div className="flex flex-col w-full pb-16">
<div className="flex flex-col w-full">
{/*  Top Metagame / Control Bar  */}
<div className="sticky top-12 z-30 flex flex-wrap items-center justify-between gap-3 px-space-md py-space-sm bg-surface-container-low shadow-sm">
<div className="flex items-center gap-space-sm flex-wrap">
{/*  Breadcrumb indicator & View Title  */}
<div className="flex items-center gap-2 pr-2">
<span className="w-2 h-2 rounded-[2px] bg-primary-container"></span>
<span className="font-headline-sm text-headline-sm text-on-surface tracking-tight">Roadmap Gantt</span>
<span className="font-label-code text-label-code text-outline px-1.5 py-0.5 rounded-[4px] bg-surface-container">v2.4</span>
</div>
<div className="h-4 w-px bg-outline-variant/30 hidden sm:block"></div>
{/*  Zoom Level Segmented Control  */}
<div className="inline-flex p-0.5 rounded-[4px] bg-surface-container-high" role="group">
<button className="zoom-btn px-2.5 py-1 text-label-badge font-label-badge rounded-[4px] bg-primary-container text-on-primary-container shadow-sm transition-all" data-zoom="days" type="button">Days</button>
<button className="zoom-btn px-2.5 py-1 text-label-badge font-label-badge rounded-[4px] text-on-surface-variant hover:text-on-surface transition-all" data-zoom="weeks" type="button">Weeks</button>
<button className="zoom-btn px-2.5 py-1 text-label-badge font-label-badge rounded-[4px] text-on-surface-variant hover:text-on-surface transition-all" data-zoom="months" type="button">Months</button>
<button className="zoom-btn px-2.5 py-1 text-label-badge font-label-badge rounded-[4px] text-on-surface-variant hover:text-on-surface transition-all" data-zoom="quarters" type="button">Quarters</button>
</div>
{/*  Quick 'Today' Jump  */}
<button className="flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-surface-container hover:bg-surface-bright text-on-surface text-body-sm font-headline-sm transition-colors" id="jump-today" type="button">
<span className="material-symbols-outlined text-[15px] text-primary">my_location</span>
<span>Today</span>
<span className="font-label-kbd text-label-kbd text-outline ml-1">T</span>
</button>
{/*  Dependency Line Toggle  */}
<button className="flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-surface-container hover:bg-surface-bright text-on-surface text-body-sm font-headline-sm transition-colors" id="toggle-deps" type="button">
<span className="material-symbols-outlined text-[15px] text-primary transition-transform" id="dep-icon">account_tree</span>
<span>Links</span>
<span className="w-1.5 h-1.5 rounded-full bg-primary" id="dep-status-dot"></span>
</button>
</div>
{/*  Filter Bar Right  */}
<div className="flex items-center gap-2 flex-wrap">
{/*  Milestone Filter Toggle  */}
<button className="flex items-center gap-1 px-2 py-1 rounded-[4px] bg-surface-container hover:bg-surface-bright text-on-surface text-body-sm font-body-sm transition-colors" id="toggle-milestones" type="button">
<span className="material-symbols-outlined text-[15px] text-secondary">diamond</span>
<span>Milestones</span>
<span className="font-label-code text-[10px] text-outline px-1 rounded-[2px] bg-surface-container-high">3</span>
</button>
{/*  Team Filter Dropdown Pill  */}
<div className="relative group">
<button className="flex items-center gap-1.5 px-2 py-1 rounded-[4px] bg-surface-container hover:bg-surface-bright text-on-surface text-body-sm font-body-sm transition-colors" type="button">
<span className="material-symbols-outlined text-[15px] text-outline">groups</span>
<span>Core Team</span>
<span className="material-symbols-outlined text-[14px] text-outline">arrow_drop_down</span>
</button>
</div>
{/*  Quick Add Item Button  */}
<button className="flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-primary-container text-on-primary-container font-headline-sm text-body-sm shadow-sm hover:opacity-95 transition-opacity" type="button">
<span className="material-symbols-outlined text-[15px]">add</span>
<span>Sprint Item</span>
</button>
</div>
</div>
{/*  Main Dual Pane Splitter Canvas  */}
<div className="relative flex w-full overflow-hidden bg-surface-container-lowest my-2 rounded-[4px] shadow-md">
{/*  LEFT PANE: Task Tree & Hierarchy (Fixed Width 360px on Desktop)  */}
<div className="w-[360px] flex-shrink-0 bg-surface-container-low flex flex-col z-20 shadow-sm select-none">
{/*  Tree Header  */}
<div className="h-14 px-3 flex items-center justify-between bg-surface-container-high text-on-surface-variant font-headline-sm text-body-sm">
<div className="flex items-center gap-1.5">
<span className="material-symbols-outlined text-[16px] text-outline">account_tree</span>
<span className="text-on-surface font-medium">Work Breakdown</span>
</div>
<div className="flex items-center gap-2">
<span className="font-label-code text-[11px] text-outline">5 ITEMS</span>
<button className="p-1 rounded-[4px] hover:bg-surface-bright text-outline hover:text-on-surface transition-colors" id="collapse-all-btn" title="Toggle collapse" type="button">
<span className="material-symbols-outlined text-[16px]">unfold_less</span>
</button>
</div>
</div>
{/*  Tree Items Container  */}
<div className="flex flex-col divide-y divide-transparent text-body-sm" id="tree-list">
{/*  EPIC 1: Sprint 14  */}
<div className="group epic-row" data-id="sprint-14">
<div className="h-10 px-3 flex items-center justify-between bg-surface-container hover:bg-surface-bright cursor-pointer transition-colors">
<div className="flex items-center gap-1.5 min-w-0">
<span className="material-symbols-outlined text-[16px] text-outline-variant transition-transform transform rotate-90 epic-toggle-caret">arrow_right</span>
<span className="w-2 h-2 rounded-[2px] bg-primary"></span>
<span className="font-headline-sm text-headline-sm text-on-surface truncate">Sprint 14: Core UI &amp; Analytics</span>
</div>
<span className="font-label-code text-[11px] text-outline flex-shrink-0 ml-2">Oct 01 - 28</span>
</div>
{/*  Children of Sprint 14  */}
<div className="epic-children flex flex-col bg-surface-container-lowest">
{/*  Child 1: SCR-104  */}
<div className="h-10 pl-7 pr-3 flex items-center justify-between hover:bg-surface-container transition-colors group/item" data-task-id="task-104">
<div className="flex items-center gap-2 min-w-0">
<span className="material-symbols-outlined text-[15px] text-primary" style={{fontVariationSettings: "\'FILL\' 1"}}>play_circle</span>
<span className="font-label-code text-label-code text-outline flex-shrink-0">SCR-104</span>
<span className="text-on-surface truncate">Interactive Analytics Dashboard</span>
</div>
<div className="flex items-center gap-2 flex-shrink-0">
<span className="w-5 h-5 rounded-[4px] bg-surface-container-high text-primary flex items-center justify-center font-label-badge text-[10px] font-semibold">ER</span>
</div>
</div>
{/*  Child 2: SCR-101  */}
<div className="h-10 pl-7 pr-3 flex items-center justify-between hover:bg-surface-container transition-colors group/item" data-task-id="task-101">
<div className="flex items-center gap-2 min-w-0">
<span className="material-symbols-outlined text-[15px] text-primary" style={{fontVariationSettings: "\'FILL\' 1"}}>check_circle</span>
<span className="font-label-code text-label-code text-outline flex-shrink-0">SCR-101</span>
<span className="text-on-surface truncate">Design Token Architecture</span>
</div>
<div className="flex items-center gap-2 flex-shrink-0">
<span className="w-5 h-5 rounded-[4px] bg-surface-container-high text-secondary flex items-center justify-center font-label-badge text-[10px] font-semibold">AM</span>
</div>
</div>
{/*  Child 3: SCR-105  */}
<div className="h-10 pl-7 pr-3 flex items-center justify-between hover:bg-surface-container transition-colors group/item" data-task-id="task-105">
<div className="flex items-center gap-2 min-w-0">
<span className="material-symbols-outlined text-[15px] text-outline">pending</span>
<span className="font-label-code text-label-code text-outline flex-shrink-0">SCR-105</span>
<span className="text-on-surface truncate">Component Finalization</span>
</div>
<div className="flex items-center gap-2 flex-shrink-0">
<span className="w-5 h-5 rounded-[4px] bg-surface-container-high text-tertiary flex items-center justify-center font-label-badge text-[10px] font-semibold">AG</span>
</div>
</div>
</div>
</div>
{/*  EPIC 2: Sprint 15  */}
<div className="group epic-row" data-id="sprint-15">
<div className="h-10 px-3 flex items-center justify-between bg-surface-container hover:bg-surface-bright cursor-pointer transition-colors">
<div className="flex items-center gap-1.5 min-w-0">
<span className="material-symbols-outlined text-[16px] text-outline-variant transition-transform transform rotate-90 epic-toggle-caret">arrow_right</span>
<span className="w-2 h-2 rounded-[2px] bg-secondary-container"></span>
<span className="font-headline-sm text-headline-sm text-on-surface truncate">Sprint 15: API &amp; Webhooks</span>
</div>
<span className="font-label-code text-[11px] text-outline flex-shrink-0 ml-2">Oct 24 - Nov 15</span>
</div>
{/*  Children of Sprint 15  */}
<div className="epic-children flex flex-col bg-surface-container-lowest">
<div className="h-10 pl-7 pr-3 flex items-center justify-between hover:bg-surface-container transition-colors group/item" data-task-id="task-110">
<div className="flex items-center gap-2 min-w-0">
<span className="material-symbols-outlined text-[15px] text-outline">radio_button_unchecked</span>
<span className="font-label-code text-label-code text-outline flex-shrink-0">SCR-110</span>
<span className="text-on-surface truncate">Event Ingestion Gateway</span>
</div>
<div className="flex items-center gap-2 flex-shrink-0">
<span className="w-5 h-5 rounded-[4px] bg-surface-container-high text-primary flex items-center justify-center font-label-badge text-[10px] font-semibold">ER</span>
</div>
</div>
<div className="h-10 pl-7 pr-3 flex items-center justify-between hover:bg-surface-container transition-colors group/item" data-task-id="task-114">
<div className="flex items-center gap-2 min-w-0">
<span className="material-symbols-outlined text-[15px] text-outline">radio_button_unchecked</span>
<span className="font-label-code text-label-code text-outline flex-shrink-0">SCR-114</span>
<span className="text-on-surface truncate">Secure Webhook Relays</span>
</div>
<div className="flex items-center gap-2 flex-shrink-0">
<span className="w-5 h-5 rounded-[4px] bg-surface-container-high text-secondary flex items-center justify-center font-label-badge text-[10px] font-semibold">AM</span>
</div>
</div>
</div>
</div>
{/*  Summary Metric block  */}
<div className="p-3 bg-surface-container-low mt-4 rounded-[4px] flex flex-col gap-2">
<div className="flex items-center justify-between text-[11px] font-label-code text-outline">
<span>VELOCITY ALLOCATION</span>
<span className="text-primary font-semibold">78% CAPACITY</span>
</div>
<div className="w-full h-1.5 bg-surface-container-high rounded-[2px] overflow-hidden flex">
<div className="h-full bg-primary-container" style={{width: "54%"}}></div>
<div className="h-full bg-primary" style={{width: "24%"}}></div>
<div className="h-full bg-surface-variant" style={{width: "22%"}}></div>
</div>
<div className="flex items-center justify-between text-[11px] text-outline-variant">
<span>Logged: 164.5h</span>
<span>Est: 210h</span>
</div>
</div>
</div>
</div>
{/*  RIGHT PANE: Interactive Timeline Chart Canvas  */}
<div className="flex-1 overflow-x-auto relative bg-surface-container-lowest" id="gantt-scroll-container">
<div className="min-w-[1300px] relative select-none" id="timeline-matrix">
{/*  Header: Month Bands & Day Tracks (56px tall total)  */}
<div className="sticky top-0 z-20 flex flex-col bg-surface-container-high backdrop-blur-md shadow-sm">
{/*  Month labels  */}
<div className="h-6 flex text-[11px] font-label-code tracking-wider text-outline uppercase border-b-0">
<div className="w-[740px] px-3 flex items-center bg-surface-container">OCTOBER 2024</div>
<div className="w-[560px] px-3 flex items-center bg-surface-container-low">NOVEMBER 2024</div>
</div>
{/*  Days Scale: (each day ~35px wide)  */}
<div className="h-8 flex text-[11px] font-label-code text-outline items-center bg-surface-container-high" id="days-header-strip">
{/*  October days (sample intervals)  */}
<div className="w-[105px] text-center bg-surface-container/40 py-1">Oct 01 - 03</div>
<div className="w-[140px] text-center bg-surface-container/20 py-1">Oct 04 - 07</div>
<div className="w-[140px] text-center bg-surface-container/40 py-1">Oct 08 - 11</div>
<div className="w-[140px] text-center bg-surface-container/20 py-1">Oct 12 - 15</div>
<div className="w-[105px] text-center bg-surface-container/40 py-1">Oct 16 - 18</div>
<div className="w-[110px] text-center bg-primary-container/20 text-primary py-1 font-semibold">Oct 19 (TODAY)</div>
<div className="w-[100px] text-center bg-surface-container/20 py-1">Oct 20 - 23</div>
<div className="w-[100px] text-center bg-surface-container/40 py-1">Oct 24 - 28</div>
{/*  November days  */}
<div className="w-[120px] text-center bg-surface-container/20 py-1">Nov 01 - 04</div>
<div className="w-[120px] text-center bg-surface-container/40 py-1">Nov 05 - 08</div>
<div className="w-[120px] text-center bg-surface-container/20 py-1">Nov 09 - 12</div>
<div className="w-[200px] text-center bg-surface-container/40 py-1">Nov 13 - 18</div>
</div>
</div>
{/*  Vertical Grid Overlay Lines and Phase Bands  */}
<div aria-hidden="true" className="absolute inset-0 top-14 pointer-events-none flex">
{/*  Sprint 14 Phase Band Highlight  */}
<div className="w-[840px] h-full bg-primary/5"></div>
{/*  Sprint 15 Phase Band Highlight  */}
<div className="w-[460px] h-full bg-secondary-container/10"></div>
</div>
{/*  TODAY INDICATOR LINE  */}
<div className="absolute top-14 bottom-0 left-[790px] w-0.5 z-20 pointer-events-none flex flex-col items-center" id="today-indicator-line">
<div className="w-3 h-3 bg-primary rounded-full -mt-1.5 shadow-md flex items-center justify-center">
<span className="w-1.5 h-1.5 bg-on-primary rounded-full"></span>
</div>
<div className="w-full h-full border-l-2 border-dashed border-primary"></div>
</div>
{/*  Dependency Connectors (SVG Overlay)  */}
<svg className="absolute inset-0 top-14 w-full h-[360px] pointer-events-none z-10 overflow-visible transition-opacity duration-200" id="dependency-svg">
<defs>
&lt;marker id="arrow" markerheight="6" markerwidth="6" orient="auto-start-reverse" refx="6" refy="5" viewBox="0 0 10 10"&gt;
<path d="M 0 1 L 8 5 L 0 9 z" fill="#bdc2ff"></path>
&lt;/marker&gt;
</defs>
{/*  Link SCR-101 to SCR-104  */}
<path d="M 430 80 C 470 80, 470 40, 510 40" fill="none" marker-end="url(#arrow)" stroke="#bdc2ff" stroke-dasharray="3 3" stroke-width="1.5"></path>
{/*  Link SCR-104 to SCR-105  */}
<path d="M 720 40 C 740 40, 740 120, 760 120" fill="none" marker-end="url(#arrow)" stroke="#bdc2ff" stroke-width="1.5"></path>
{/*  Link SCR-105 to SCR-110 (Sprint 14 to Sprint 15)  */}
<path d="M 850 120 C 870 120, 870 200, 890 200" fill="none" marker-end="url(#arrow)" stroke="#5e6ad2" stroke-dasharray="4 2" stroke-width="1.5"></path>
</svg>
{/*  Gantt Task Rows Layer  */}
<div className="flex flex-col relative z-10 pt-0" id="gantt-bars-container">
{/*  SPRINT 14 EPIC BANNER ROW  */}
<div className="h-10 flex items-center relative hover:bg-surface-container/20">
{/*  Sprint 14 Span Bar  */}
<div className="absolute left-[30px] w-[810px] h-6 rounded-[4px] bg-surface-container flex items-center px-2.5 shadow-sm group cursor-pointer">
<div className="absolute inset-0 bg-primary/10 rounded-[4px]"></div>
<span className="font-headline-sm text-body-sm text-on-surface z-10 font-semibold tracking-tight">Sprint 14 Active Window (Oct 1 - Oct 28)</span>
<span className="ml-auto font-label-code text-[11px] text-primary z-10">68% Complete</span>
</div>
</div>
{/*  TASK: SCR-104 (Interactive Analytics Dashboard)  */}
<div className="h-10 flex items-center relative hover:bg-surface-container/30 group/row">
<div className="task-bar absolute left-[510px] w-[210px] h-7 rounded-[4px] bg-surface-container-high shadow-md flex items-center justify-between px-2 cursor-pointer transition-all hover:brightness-110" data-assignee="Elena R." data-hours="42h / 50h" data-status="In Progress (84%)" data-task="SCR-104">
{/*  Progress fill  */}
<div className="absolute inset-y-0 left-0 bg-primary-container rounded-l-[4px]" style={{width: "84%"}}></div>
<div className="relative z-10 flex items-center gap-1.5 truncate">
<span className="font-label-code text-[11px] font-semibold text-on-primary-container">SCR-104</span>
<span className="text-body-sm font-medium text-on-primary-container truncate">Analytics Dashboard</span>
</div>
<span className="relative z-10 font-label-code text-[10px] text-on-primary-container/80 flex-shrink-0">84%</span>
</div>
</div>
{/*  TASK: SCR-101 (Design Token Architecture)  */}
<div className="h-10 flex items-center relative hover:bg-surface-container/30 group/row">
<div className="task-bar absolute left-[120px] w-[310px] h-7 rounded-[4px] bg-surface-container-high shadow-md flex items-center justify-between px-2 cursor-pointer transition-all hover:brightness-110" data-assignee="Arbian M." data-hours="36h / 36h" data-status="Completed (100%)" data-task="SCR-101">
{/*  100% Complete Progress  */}
<div className="absolute inset-0 bg-secondary-container rounded-[4px]"></div>
<div className="relative z-10 flex items-center gap-1.5 truncate text-on-secondary">
<span className="material-symbols-outlined text-[14px]">check</span>
<span className="font-label-code text-[11px] font-semibold">SCR-101</span>
<span className="text-body-sm font-medium truncate">Design Token Architecture</span>
</div>
<span className="relative z-10 font-label-code text-[10px] text-on-secondary flex-shrink-0">36h</span>
</div>
</div>
{/*  TASK: SCR-105 (Component Finalization)  */}
<div className="h-10 flex items-center relative hover:bg-surface-container/30 group/row">
<div className="task-bar absolute left-[760px] w-[90px] h-7 rounded-[4px] bg-surface-container-high shadow-md flex items-center justify-between px-2 cursor-pointer transition-all hover:brightness-110" data-assignee="Azahra G." data-hours="8h / 24h" data-status="Review (33%)" data-task="SCR-105">
{/*  Progress bar  */}
<div className="absolute inset-y-0 left-0 bg-primary-container/70 rounded-l-[4px]" style={{width: "33%"}}></div>
<div className="relative z-10 flex items-center gap-1 truncate text-on-surface">
<span className="font-label-code text-[11px]">SCR-105</span>
</div>
<span className="relative z-10 font-label-code text-[10px] text-outline">33%</span>
</div>
{/*  MILESTONE 1: Design Signoff Marker  */}
<div className="milestone-marker absolute left-[850px] -top-1 z-20 flex flex-col items-center cursor-pointer group/m">
<div className="w-4 h-4 bg-primary rotate-45 rounded-[2px] shadow-sm flex items-center justify-center">
<div className="w-1.5 h-1.5 bg-surface-container-lowest rotate-45"></div>
</div>
<span className="text-[9px] font-label-code text-primary bg-surface-container-high px-1 py-0.5 rounded-[2px] mt-1 shadow-sm whitespace-nowrap">UI Freeze (Oct 28)</span>
</div>
</div>
{/*  SPRINT 15 EPIC BANNER ROW  */}
<div className="h-10 flex items-center relative hover:bg-surface-container/20">
{/*  Sprint 15 Span Bar  */}
<div className="absolute left-[780px] w-[500px] h-6 rounded-[4px] bg-surface-container flex items-center px-2.5 shadow-sm group cursor-pointer">
<div className="absolute inset-0 bg-secondary/10 rounded-[4px]"></div>
<span className="font-headline-sm text-body-sm text-on-surface z-10 font-semibold tracking-tight">Sprint 15: API &amp; Webhooks Engine</span>
<span className="ml-auto font-label-code text-[11px] text-secondary z-10">Queued</span>
</div>
</div>
{/*  TASK: SCR-110 (Event Ingestion Gateway)  */}
<div className="h-10 flex items-center relative hover:bg-surface-container/30 group/row">
<div className="task-bar absolute left-[890px] w-[180px] h-7 rounded-[4px] bg-surface-container-high shadow-md flex items-center justify-between px-2 cursor-pointer transition-all hover:brightness-110" data-assignee="Elena R." data-hours="0h / 40h" data-status="To Do (0%)" data-task="SCR-110">
<div className="relative z-10 flex items-center gap-1.5 truncate text-on-surface">
<span className="font-label-code text-[11px] text-outline">SCR-110</span>
<span className="text-body-sm truncate">Event Ingestion</span>
</div>
<span className="relative z-10 font-label-code text-[10px] text-outline">0%</span>
</div>
</div>
{/*  TASK: SCR-114 (Secure Webhook Relays)  */}
<div className="h-10 flex items-center relative hover:bg-surface-container/30 group/row">
<div className="task-bar absolute left-[1030px] w-[160px] h-7 rounded-[4px] bg-surface-container-high shadow-md flex items-center justify-between px-2 cursor-pointer transition-all hover:brightness-110" data-assignee="Arbian M." data-hours="0h / 32h" data-status="To Do (0%)" data-task="SCR-114">
<div className="relative z-10 flex items-center gap-1.5 truncate text-on-surface">
<span className="font-label-code text-[11px] text-outline">SCR-114</span>
<span className="text-body-sm truncate">Webhook Relays</span>
</div>
<span className="relative z-10 font-label-code text-[10px] text-outline">0%</span>
</div>
{/*  MILESTONE 2: Beta Launch Marker  */}
<div className="milestone-marker absolute left-[1250px] -top-1 z-20 flex flex-col items-center cursor-pointer group/m">
<div className="w-4 h-4 bg-secondary rotate-45 rounded-[2px] shadow-sm flex items-center justify-center">
<div className="w-1.5 h-1.5 bg-surface-container-lowest rotate-45"></div>
</div>
<span className="text-[9px] font-label-code text-secondary bg-surface-container-high px-1 py-0.5 rounded-[2px] mt-1 shadow-sm whitespace-nowrap">v2.0 Beta (Nov 15)</span>
</div>
</div>
</div>
</div>
</div>
</div>
{/*  Realtime Floating Hover Tooltip for Tasks  */}
<div className="fixed hidden z-50 pointer-events-none p-2.5 rounded-[4px] bg-surface-container-high shadow-xl text-on-surface text-body-sm max-w-xs transition-opacity duration-150" id="gantt-tooltip">
<div className="flex items-center justify-between gap-3 mb-1">
<span className="font-label-code text-label-code text-primary font-semibold" id="tooltip-task">SCR-104</span>
<span className="text-[10px] font-label-badge px-1.5 py-0.5 rounded-[2px] bg-surface-container text-on-surface-variant" id="tooltip-status">In Progress</span>
</div>
<div className="text-[11px] text-outline flex items-center gap-1 mb-1">
<span className="material-symbols-outlined text-[13px]">person</span>
<span id="tooltip-assignee">Elena R.</span>
</div>
<div className="text-[11px] text-outline flex items-center gap-1">
<span className="material-symbols-outlined text-[13px]">schedule</span>
<span>Logged: <strong className="text-on-surface font-label-code" id="tooltip-hours">42h / 50h</strong></span>
</div>
</div>
{/*  Operational Footer Metrics Bar  */}
<div className="flex flex-wrap items-center justify-between gap-4 p-space-sm mt-1 bg-surface-container rounded-[4px] text-body-sm">
<div className="flex items-center gap-4">
<div className="flex items-center gap-1.5">
<span className="w-2.5 h-2.5 rounded-[2px] bg-primary-container"></span>
<span className="text-outline">Active Sprint</span>
</div>
<div className="flex items-center gap-1.5">
<span className="w-2.5 h-2.5 rounded-[2px] bg-secondary-container"></span>
<span className="text-outline">Next Cycle</span>
</div>
<div className="flex items-center gap-1.5">
<span className="w-2.5 h-2.5 rounded-[2px] bg-secondary rotate-45 inline-block"></span>
<span className="text-outline">Milestone Target</span>
</div>
<div className="flex items-center gap-1.5">
<span className="w-3 border-t border-dashed border-primary"></span>
<span className="text-outline">Dependency Flow</span>
</div>
</div>
{/*  Quick Stats  */}
<div className="flex items-center gap-3 font-label-code text-[11px]">
<span className="text-outline">CRITICAL PATH: <span className="text-primary font-semibold">18d</span></span>
<span className="text-outline-variant">/</span>
<span className="text-outline">SLACK: <span className="text-on-surface">3d</span></span>
<span className="text-outline-variant">/</span>
<span className="text-outline">TOTAL ISSUES: <span className="text-on-surface">5</span></span>
</div>
</div>
</div>

    </div>
  );
}
