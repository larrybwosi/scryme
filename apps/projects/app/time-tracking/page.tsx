"use client";

import Link from "next/link";
import React, { useState } from "react";

export default function TimeTrackingPage() {
  return (
    <div className="flex flex-col w-full pb-16">
<div className="flex flex-col w-full">
<div className="py-space-md flex flex-col gap-space-lg">
{/*  Active Timer Controller Console  */}
<div className="relative overflow-hidden rounded-lg bg-surface-container-low shadow-xl p-space-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-lg">
<div className="absolute -right-20 -top-20 w-80 h-80 bg-primary-container/10 rounded-full blur-3xl pointer-events-none"></div>
{/*  Left: Running Timer Info & Counter  */}
<div className="flex items-center gap-space-lg min-w-0">
<div className="relative flex items-center justify-center w-12 h-12 rounded-lg bg-surface-container-high shrink-0 shadow-md">
<span className="material-symbols-outlined text-primary-container animate-pulse text-[28px]" style={{fontVariationSettings: "\'FILL\' 1"}}>timer</span>
<span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full ring-2 ring-surface-container-low"></span>
</div>
<div className="flex flex-col min-w-0">
<div className="flex items-center gap-space-sm">
<span className="font-label-badge text-label-badge px-1.5 py-0.5 rounded bg-surface-container-high text-primary font-medium tracking-wide">SCR-104</span>
<span className="font-body-sm text-body-sm text-outline truncate">Nexus 2.0 Redesign</span>
<span className="w-1 h-1 rounded-full bg-outline-variant"></span>
<span className="font-label-badge text-label-badge text-primary-container font-medium uppercase tracking-wider flex items-center gap-1">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-ping"></span>
              Live Recording
            </span>
</div>
<div className="flex items-baseline gap-space-md mt-0.5">
<span className="font-label-code text-[26px] leading-[30px] font-medium tracking-tight text-on-surface" id="live-timer-display">03:42:22</span>
<span className="font-body-sm text-body-sm text-on-surface-variant truncate max-w-[280px]">Interactive Analytics Dashboard</span>
</div>
</div>
</div>
{/*  Center: Contextual Note Input  */}
<div className="flex-1 w-full lg:max-w-md">
<div className="relative flex items-center rounded-lg bg-surface-container px-space-md py-1.5 shadow-inner">
<span className="material-symbols-outlined text-outline text-[16px] mr-2">edit_note</span>
<input className="w-full bg-transparent font-body-md text-body-md text-on-surface placeholder-outline focus:outline-none" placeholder="What are you working on?" type="text" value="Drafting WebGL viewport sync &amp; frame-rate telemetry"/>
<div className="flex items-center gap-1 ml-2">
<button className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant hover:text-on-surface text-label-kbd font-label-kbd transition-colors" title="Toggle Billable Status">
<span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
<span>$140/hr</span>
</button>
</div>
</div>
</div>
{/*  Right: Action Buttons  */}
<div className="flex items-center gap-space-sm w-full lg:w-auto justify-end">
<button className="h-8 px-space-md rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-body-sm text-body-sm flex items-center gap-1.5 transition-colors shadow-sm" id="timer-toggle-btn" type="button">
<span className="material-symbols-outlined text-[16px]">pause</span>
<span>Pause</span>
<kbd className="font-label-kbd text-label-kbd text-outline ml-1">␣</kbd>
</button>
<button className="h-8 px-space-md rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm flex items-center gap-1.5 transition-colors shadow-md" type="button">
<span className="material-symbols-outlined text-[16px]">check_circle</span>
<span>Stop &amp; Log</span>
<kbd className="font-label-kbd text-label-kbd text-on-primary-container/80 ml-1">⌘S</kbd>
</button>
<button className="h-8 w-8 rounded-lg bg-surface-container-high hover:bg-error-container hover:text-on-error-container text-outline transition-colors flex items-center justify-center shadow-sm" title="Discard Session" type="button">
<span className="material-symbols-outlined text-[16px]">delete</span>
</button>
</div>
</div>
{/*  KPI Summary Grid (4 Cards)  */}
<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
{/*  Card 1: Total Logged  */}
<div className="rounded-lg bg-surface-container-low p-space-md shadow-md flex flex-col justify-between hover:bg-surface-container transition-colors">
<div className="flex items-center justify-between">
<span className="font-label-badge text-label-badge text-outline uppercase tracking-wider">Logged This Week</span>
<span className="font-label-code text-label-code text-primary">85.6%</span>
</div>
<div className="my-space-sm flex items-baseline justify-between">
<div className="font-headline-lg text-headline-lg text-on-surface tracking-tight">34h 15m</div>
<div className="font-body-sm text-body-sm text-outline">Target: 40h</div>
</div>
<div>
<div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
<div className="h-full bg-primary-container rounded-full" style={{width: "85.6%"}}></div>
</div>
<div className="flex justify-between items-center mt-1.5 font-label-kbd text-[10px] text-outline">
<span>5.75h required</span>
<span>Est. Done Fri 17:15</span>
</div>
</div>
</div>
{/*  Card 2: Billable Ratio  */}
<div className="rounded-lg bg-surface-container-low p-space-md shadow-md flex flex-col justify-between hover:bg-surface-container transition-colors">
<div className="flex items-center justify-between">
<span className="font-label-badge text-label-badge text-outline uppercase tracking-wider">Billable Ratio</span>
<span className="material-symbols-outlined text-[16px] text-primary">payments</span>
</div>
<div className="my-space-sm flex items-baseline justify-between">
<div className="font-headline-lg text-headline-lg text-on-surface tracking-tight">88.5%</div>
<div className="font-body-sm text-body-sm text-primary font-medium">$4,250.00</div>
</div>
<div className="flex items-center gap-2">
<div className="h-1.5 flex-1 bg-surface-container-highest rounded-full overflow-hidden flex">
<div className="h-full bg-primary" style={{width: "88.5%"}}></div>
<div className="h-full bg-surface-variant" style={{width: "11.5%"}}></div>
</div>
<span className="font-label-kbd text-label-kbd text-outline">30.3h / 3.9h</span>
</div>
</div>
{/*  Card 3: Active Team Timers  */}
<div className="rounded-lg bg-surface-container-low p-space-md shadow-md flex flex-col justify-between hover:bg-surface-container transition-colors">
<div className="flex items-center justify-between">
<span className="font-label-badge text-label-badge text-outline uppercase tracking-wider">Team Concurrent</span>
<div className="flex items-center gap-1">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse"></span>
<span className="font-label-code text-label-code text-on-surface">4 Online</span>
</div>
</div>
<div className="my-space-sm flex items-center justify-between">
<div className="font-headline-lg text-headline-lg text-on-surface tracking-tight">4 Logging</div>
<div className="flex -space-x-1.5 overflow-hidden">
<div className="inline-block h-6 w-6 rounded-full bg-surface-container-high ring-2 ring-surface-container-low flex items-center justify-center font-label-badge text-[10px] text-on-surface font-semibold">AL</div>
<div className="inline-block h-6 w-6 rounded-full bg-primary-container ring-2 ring-surface-container-low flex items-center justify-center font-label-badge text-[10px] text-on-primary-container font-semibold">DR</div>
<div className="inline-block h-6 w-6 rounded-full bg-surface-bright ring-2 ring-surface-container-low flex items-center justify-center font-label-badge text-[10px] text-on-surface font-semibold">SK</div>
<div className="inline-block h-6 w-6 rounded-full bg-secondary-container ring-2 ring-surface-container-low flex items-center justify-center font-label-badge text-[10px] text-on-secondary-container font-semibold">VT</div>
</div>
</div>
<div className="flex items-center justify-between text-body-sm font-body-sm text-outline">
<span className="truncate">Latest: DR on SCR-108</span>
<span className="font-label-kbd text-[10px] text-primary">02:14:10</span>
</div>
</div>
{/*  Card 4: Overtime / Headroom  */}
<div className="rounded-lg bg-surface-container-low p-space-md shadow-md flex flex-col justify-between hover:bg-surface-container transition-colors">
<div className="flex items-center justify-between">
<span className="font-label-badge text-label-badge text-outline uppercase tracking-wider">Sprint Headroom</span>
<span className="material-symbols-outlined text-[16px] text-outline">bolt</span>
</div>
<div className="my-space-sm flex items-baseline justify-between">
<div className="font-headline-lg text-headline-lg text-on-surface tracking-tight">+5.8h</div>
<div className="font-body-sm text-body-sm text-outline">Nominal load</div>
</div>
<div className="flex items-center justify-between text-body-sm font-body-sm text-outline">
<span className="flex items-center gap-1">
<span className="w-2 h-2 rounded-sm bg-primary-container"></span>
            Velocity: 1.04x
          </span>
<span className="font-label-kbd text-label-kbd text-primary">Healthy</span>
</div>
</div>
</div>
{/*  Timesheet Matrix Section  */}
<div className="rounded-lg bg-surface-container-low shadow-md overflow-hidden flex flex-col">
{/*  Toolbar Header  */}
<div className="px-space-md py-space-sm bg-surface-container flex flex-wrap items-center justify-between gap-space-md">
{/*  Left: Range Navigator  */}
<div className="flex items-center gap-space-md">
<div className="flex items-center bg-surface-container-high rounded-lg p-0.5">
<button className="p-1 rounded hover:bg-surface-container text-outline hover:text-on-surface transition-colors" title="Previous Week">
<span className="material-symbols-outlined text-[16px]">chevron_left</span>
</button>
<span className="px-space-sm font-headline-sm text-body-sm text-on-surface">Oct 21 – Oct 27, 2024</span>
<button className="p-1 rounded hover:bg-surface-container text-outline hover:text-on-surface transition-colors" title="Next Week">
<span className="material-symbols-outlined text-[16px]">chevron_right</span>
</button>
</div>
<button className="px-space-sm py-1 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-body-sm font-body-sm text-on-surface-variant hover:text-on-surface transition-colors">
            Today
          </button>
</div>
{/*  Center: Granularity Segment Switcher  */}
<div className="flex items-center bg-surface-container-lowest p-0.5 rounded-lg">
<button className="px-space-sm py-1 rounded text-outline hover:text-on-surface text-body-sm font-body-sm transition-colors">Day</button>
<button className="px-space-sm py-1 rounded bg-surface-container-high text-on-surface font-headline-sm text-body-sm shadow-sm transition-colors">Week</button>
<button className="px-space-sm py-1 rounded text-outline hover:text-on-surface text-body-sm font-body-sm transition-colors">Month</button>
<button className="px-space-sm py-1 rounded text-outline hover:text-on-surface text-body-sm font-body-sm transition-colors">Range</button>
</div>
{/*  Right: Actions  */}
<div className="flex items-center gap-space-sm">
<div className="flex items-center gap-1 px-space-sm py-1 rounded-lg bg-surface-container-high text-body-sm font-body-sm text-outline">
<span>Filter:</span>
<span className="text-on-surface font-medium">All Projects</span>
<span className="material-symbols-outlined text-[14px]">expand_more</span>
</div>
<button className="h-7 px-space-sm rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-body-sm text-body-sm flex items-center gap-1 transition-colors">
<span className="material-symbols-outlined text-[15px]">file_download</span>
<span>Export</span>
</button>
<button className="h-7 px-space-sm rounded-lg bg-primary-container text-on-primary-container hover:bg-primary-container/90 font-headline-sm text-body-sm flex items-center gap-1 transition-colors shadow-sm">
<span className="material-symbols-outlined text-[15px]">add</span>
<span>Add Row</span>
</button>
</div>
</div>
{/*  Timesheet Grid Table  */}
<div className="overflow-x-auto">
<table className="w-full text-left border-collapse">
<thead>
<tr className="bg-surface-container-lowest text-outline font-label-badge text-label-badge uppercase tracking-wider select-none">
<th className="py-2.5 px-space-md w-72">Task / Project</th>
<th className="py-2.5 px-space-sm w-36">Category</th>
<th className="py-2.5 px-space-sm text-right w-16">
<div>Mon</div>
<div className="font-label-kbd text-[10px] text-outline-variant font-normal">21</div>
</th>
<th className="py-2.5 px-space-sm text-right w-16">
<div>Tue</div>
<div className="font-label-kbd text-[10px] text-outline-variant font-normal">22</div>
</th>
<th className="py-2.5 px-space-sm text-right w-16">
<div>Wed</div>
<div className="font-label-kbd text-[10px] text-outline-variant font-normal">23</div>
</th>
<th className="py-2.5 px-space-sm text-right w-16 bg-surface-container/40 text-on-surface">
<div className="text-primary">Thu</div>
<div className="font-label-kbd text-[10px] text-primary/80 font-normal">24</div>
</th>
<th className="py-2.5 px-space-sm text-right w-16">
<div>Fri</div>
<div className="font-label-kbd text-[10px] text-outline-variant font-normal">25</div>
</th>
<th className="py-2.5 px-space-sm text-right w-16 text-outline-variant">
<div>Sat</div>
<div className="font-label-kbd text-[10px] text-outline-variant font-normal">26</div>
</th>
<th className="py-2.5 px-space-sm text-right w-16 text-outline-variant">
<div>Sun</div>
<div className="font-label-kbd text-[10px] text-outline-variant font-normal">27</div>
</th>
<th className="py-2.5 px-space-md text-right w-24">Total</th>
</tr>
</thead>
<tbody className="divide-y divide-surface-container-highest/20 font-body-md text-body-md text-on-surface">
{/*  Row 1: SCR-104  */}
<tr className="hover:bg-surface-container transition-colors group">
<td className="py-2 px-space-md">
<div className="flex items-center gap-space-sm min-w-0">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container shrink-0"></span>
<div className="flex flex-col min-w-0">
<div className="flex items-center gap-1.5">
<a className="font-label-code text-label-code text-primary hover:underline" href="/task-detail">SCR-104</a>
<span className="truncate font-medium text-on-surface">Interactive Analytics Dashboard</span>
</div>
<span className="text-body-sm font-body-sm text-outline">Nexus 2.0 Redesign</span>
</div>
</div>
</td>
<td className="py-2 px-space-sm">
<span className="inline-flex items-center px-1.5 py-0.5 rounded bg-surface-container-high text-body-sm font-body-sm text-on-surface-variant">Development</span>
</td>
<td className="py-2 px-space-sm text-right font-label-code text-label-code text-on-surface-variant">3.5h</td>
<td className="py-2 px-space-sm text-right font-label-code text-label-code text-on-surface-variant">4.0h</td>
<td className="py-2 px-space-sm text-right font-label-code text-label-code text-on-surface-variant">2.25h</td>
<td className="py-2 px-space-sm text-right font-label-code text-label-code bg-surface-container/40 text-primary font-medium">3.7h</td>
<td className="py-2 px-space-sm text-right font-label-code text-label-code text-outline">—</td>
<td className="py-2 px-space-sm text-right font-label-code text-label-code text-outline-variant">—</td>
<td className="py-2 px-space-sm text-right font-label-code text-label-code text-outline-variant">—</td>
<td className="py-2 px-space-md text-right font-label-code text-label-code font-semibold text-on-surface">13.45h</td>
</tr>
{/*  Row 2: SCR-106  */}
<tr className="hover:bg-surface-container transition-colors group">
<td className="py-2 px-space-md">
<div className="flex items-center gap-space-sm min-w-0">
<span className="w-1.5 h-1.5 rounded-full bg-outline-variant shrink-0"></span>
<div className="flex flex-col min-w-0">
<div className="flex items-center gap-1.5">
<a className="font-label-code text-label-code text-primary hover:underline" href="/task-detail">SCR-106</a>
<span className="truncate font-medium text-on-surface">Memory Leak Fix in Engine WebGL</span>
</div>
<span className="text-body-sm font-body-sm text-outline">Core Graphics Runtime</span>
</div>
</div>
</td>
<td className="py-2 px-space-sm">
<span className="inline-flex items-center px-1.5 py-0.5 rounded bg-surface-container-high text-body-sm font-body-sm text-on-surface-variant">Code Review</span>
</td>
<td className="py-2 px-space-sm text-right font-label-code text-label-code text-on-surface-variant">1.5h</td>
<td className="py-2 px-space-sm text-right font-label-code text-label-code text-on-surface-variant">2.0h</td>
<td className="py-2 px-space-sm text-right font-label-code text-label-code text-on-surface-variant">1.5h</td>
<td className="py-2 px-space-sm text-right font-label-code text-label-code bg-surface-container/40 text-on-surface font-medium">1.0h</td>
<td className="py-2 px-space-sm text-right font-label-code text-label-code text-outline">—</td>
<td className="py-2 px-space-sm text-right font-label-code text-label-code text-outline-variant">—</td>
<td className="py-2 px-space-sm text-right font-label-code text-label-code text-outline-variant">—</td>
<td className="py-2 px-space-md text-right font-label-code text-label-code font-semibold text-on-surface">6.00h</td>
</tr>
{/*  Row 3: SCR-108  */}
<tr className="hover:bg-surface-container transition-colors group">
<td className="py-2 px-space-md">
<div className="flex items-center gap-space-sm min-w-0">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container shrink-0"></span>
<div className="flex flex-col min-w-0">
<div className="flex items-center gap-1.5">
<a className="font-label-code text-label-code text-primary hover:underline" href="/task-detail">SCR-108</a>
<span className="truncate font-medium text-on-surface">Spatial Canvas Gestures API</span>
</div>
<span className="text-body-sm font-body-sm text-outline">Nexus 2.0 Redesign</span>
</div>
</div>
</td>
<td className="py-2 px-space-sm">
<span className="inline-flex items-center px-1.5 py-0.5 rounded bg-surface-container-high text-body-sm font-body-sm text-on-surface-variant">Development</span>
</td>
<td className="py-2 px-space-sm text-right font-label-code text-label-code text-on-surface-variant">2.0h</td>
<td className="py-2 px-space-sm text-right font-label-code text-label-code text-on-surface-variant">2.5h</td>
<td className="py-2 px-space-sm text-right font-label-code text-label-code text-on-surface-variant">3.0h</td>
<td className="py-2 px-space-sm text-right font-label-code text-label-code bg-surface-container/40 text-on-surface font-medium">1.5h</td>
<td className="py-2 px-space-sm text-right font-label-code text-label-code text-outline">—</td>
<td className="py-2 px-space-sm text-right font-label-code text-label-code text-outline-variant">—</td>
<td className="py-2 px-space-sm text-right font-label-code text-label-code text-outline-variant">—</td>
<td className="py-2 px-space-md text-right font-label-code text-label-code font-semibold text-on-surface">9.00h</td>
</tr>
{/*  Row 4: SCR-112  */}
<tr className="hover:bg-surface-container transition-colors group">
<td className="py-2 px-space-md">
<div className="flex items-center gap-space-sm min-w-0">
<span className="w-1.5 h-1.5 rounded-full bg-outline-variant shrink-0"></span>
<div className="flex flex-col min-w-0">
<div className="flex items-center gap-1.5">
<a className="font-label-code text-label-code text-primary hover:underline" href="/task-detail">SCR-112</a>
<span className="truncate font-medium text-on-surface">Design Tokens &amp; Contrast Audit</span>
</div>
<span className="text-body-sm font-body-sm text-outline">Design System Core</span>
</div>
</div>
</td>
<td className="py-2 px-space-sm">
<span className="inline-flex items-center px-1.5 py-0.5 rounded bg-surface-container-high text-body-sm font-body-sm text-on-surface-variant">Design QA</span>
</td>
<td className="py-2 px-space-sm text-right font-label-code text-label-code text-on-surface-variant">1.0h</td>
<td className="py-2 px-space-sm text-right font-label-code text-label-code text-outline">—</td>
<td className="py-2 px-space-sm text-right font-label-code text-label-code text-on-surface-variant">2.0h</td>
<td className="py-2 px-space-sm text-right font-label-code text-label-code bg-surface-container/40 text-on-surface font-medium">2.7h</td>
<td className="py-2 px-space-sm text-right font-label-code text-label-code text-outline">—</td>
<td className="py-2 px-space-sm text-right font-label-code text-label-code text-outline-variant">—</td>
<td className="py-2 px-space-sm text-right font-label-code text-label-code text-outline-variant">—</td>
<td className="py-2 px-space-md text-right font-label-code text-label-code font-semibold text-on-surface">5.70h</td>
</tr>
</tbody>
<tfoot>
<tr className="bg-surface-container font-headline-sm text-body-sm text-on-surface">
<td className="py-2.5 px-space-md text-outline font-label-badge text-label-badge uppercase tracking-wider" colSpan={2}>
                Daily Totals
              </td>
<td className="py-2.5 px-space-sm text-right font-label-code text-label-code">8.0h</td>
<td className="py-2.5 px-space-sm text-right font-label-code text-label-code">8.5h</td>
<td className="py-2.5 px-space-sm text-right font-label-code text-label-code">8.75h</td>
<td className="py-2.5 px-space-sm text-right font-label-code text-label-code bg-surface-container-high text-primary font-bold">8.9h</td>
<td className="py-2.5 px-space-sm text-right font-label-code text-label-code text-outline">0.0h</td>
<td className="py-2.5 px-space-sm text-right font-label-code text-label-code text-outline-variant">0.0h</td>
<td className="py-2.5 px-space-sm text-right font-label-code text-label-code text-outline-variant">0.0h</td>
<td className="py-2.5 px-space-md text-right font-label-code text-headline-sm text-primary font-bold">34.15h</td>
</tr>
</tfoot>
</table>
</div>
</div>
{/*  Detailed Audit Log Section  */}
<div className="rounded-lg bg-surface-container-low shadow-md overflow-hidden flex flex-col">
{/*  Section Header  */}
<div className="px-space-md py-space-sm bg-surface-container flex flex-wrap items-center justify-between gap-space-md">
<div className="flex items-center gap-space-md">
<div className="flex items-center gap-space-sm">
<span className="material-symbols-outlined text-outline text-[18px]">history</span>
<span className="font-headline-sm text-headline-sm text-on-surface">Recorded Sessions Audit Log</span>
</div>
<span className="px-1.5 py-0.5 rounded bg-surface-container-high text-outline text-label-kbd font-label-kbd">14 Records</span>
</div>
<div className="flex items-center gap-space-sm">
<div className="relative flex items-center bg-surface-container-high rounded-lg px-2 py-1">
<span className="material-symbols-outlined text-outline text-[14px] mr-1.5">search</span>
<input className="bg-transparent font-body-sm text-body-sm text-on-surface placeholder-outline focus:outline-none w-48" placeholder="Filter descriptions or task IDs..." type="text"/>
</div>
<button className="h-7 px-space-sm rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-outline hover:text-on-surface font-body-sm text-body-sm flex items-center gap-1 transition-colors">
<span className="material-symbols-outlined text-[15px]">filter_list</span>
<span>Filters</span>
</button>
</div>
</div>
{/*  Audit Table  */}
<div className="overflow-x-auto">
<table className="w-full text-left border-collapse">
<thead>
<tr className="bg-surface-container-lowest text-outline font-label-badge text-label-badge uppercase tracking-wider select-none">
<th className="py-2.5 px-space-md w-32">Date / Time</th>
<th className="py-2.5 px-space-sm w-44">Member</th>
<th className="py-2.5 px-space-sm w-28">Task</th>
<th className="py-2.5 px-space-md">Log Description</th>
<th className="py-2.5 px-space-sm w-28 text-center">Billing</th>
<th className="py-2.5 px-space-sm w-24 text-right">Duration</th>
<th className="py-2.5 px-space-md w-16 text-right">Actions</th>
</tr>
</thead>
<tbody className="divide-y divide-surface-container-highest/20 font-body-md text-body-md text-on-surface">
{/*  Row 1  */}
<tr className="hover:bg-surface-container transition-colors group">
<td className="py-2.5 px-space-md">
<div className="font-body-sm text-body-sm text-on-surface">Today, 24 Oct</div>
<div className="font-label-kbd text-[10px] text-outline">13:45 - 17:27</div>
</td>
<td className="py-2.5 px-space-sm">
<div className="flex items-center gap-2">
<div className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container font-label-badge text-[10px] flex items-center justify-center font-bold">AL</div>
<span className="font-body-sm text-body-sm font-medium text-on-surface">Alex Lind</span>
</div>
</td>
<td className="py-2.5 px-space-sm">
<a className="font-label-code text-label-code text-primary hover:underline flex items-center gap-1" href="/task-detail">
<span>SCR-104</span>
<span className="material-symbols-outlined text-[12px] opacity-0 group-hover:opacity-100 transition-opacity">north_east</span>
</a>
</td>
<td className="py-2.5 px-space-md">
<div className="font-body-md text-body-md text-on-surface line-clamp-1">Refactored canvas buffer pipelines and state subscription reconciler</div>
<span className="font-body-sm text-body-sm text-outline">Nexus 2.0 Redesign</span>
</td>
<td className="py-2.5 px-space-sm text-center">
<span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-container-high text-primary font-label-badge text-label-badge">
<span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  Billable
                </span>
</td>
<td className="py-2.5 px-space-sm text-right font-label-code text-label-code text-on-surface font-medium">
                03:42:00
              </td>
<td className="py-2.5 px-space-md text-right">
<div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
<button className="p-1 rounded hover:bg-surface-container-high text-outline hover:text-on-surface transition-colors" title="Edit Session">
<span className="material-symbols-outlined text-[15px]">edit</span>
</button>
<button className="p-1 rounded hover:bg-surface-container-high text-outline hover:text-error transition-colors" title="Delete Session">
<span className="material-symbols-outlined text-[15px]">delete</span>
</button>
</div>
</td>
</tr>
{/*  Row 2  */}
<tr className="hover:bg-surface-container transition-colors group">
<td className="py-2.5 px-space-md">
<div className="font-body-sm text-body-sm text-on-surface">Today, 24 Oct</div>
<div className="font-label-kbd text-[10px] text-outline">10:15 - 12:45</div>
</td>
<td className="py-2.5 px-space-sm">
<div className="flex items-center gap-2">
<div className="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container font-label-badge text-[10px] flex items-center justify-center font-bold">DR</div>
<span className="font-body-sm text-body-sm font-medium text-on-surface">Daria Ross</span>
</div>
</td>
<td className="py-2.5 px-space-sm">
<a className="font-label-code text-label-code text-primary hover:underline flex items-center gap-1" href="/task-detail">
<span>SCR-108</span>
<span className="material-symbols-outlined text-[12px] opacity-0 group-hover:opacity-100 transition-opacity">north_east</span>
</a>
</td>
<td className="py-2.5 px-space-md">
<div className="font-body-md text-body-md text-on-surface line-clamp-1">Multi-touch pointer unification with trackpad panning friction model</div>
<span className="font-body-sm text-body-sm text-outline">Nexus 2.0 Redesign</span>
</td>
<td className="py-2.5 px-space-sm text-center">
<span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-container-high text-primary font-label-badge text-label-badge">
<span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  Billable
                </span>
</td>
<td className="py-2.5 px-space-sm text-right font-label-code text-label-code text-on-surface font-medium">
                02:30:00
              </td>
<td className="py-2.5 px-space-md text-right">
<div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
<button className="p-1 rounded hover:bg-surface-container-high text-outline hover:text-on-surface transition-colors" title="Edit Session">
<span className="material-symbols-outlined text-[15px]">edit</span>
</button>
<button className="p-1 rounded hover:bg-surface-container-high text-outline hover:text-error transition-colors" title="Delete Session">
<span className="material-symbols-outlined text-[15px]">delete</span>
</button>
</div>
</td>
</tr>
{/*  Row 3  */}
<tr className="hover:bg-surface-container transition-colors group">
<td className="py-2.5 px-space-md">
<div className="font-body-sm text-body-sm text-on-surface">Yesterday, 23 Oct</div>
<div className="font-label-kbd text-[10px] text-outline">14:00 - 16:00</div>
</td>
<td className="py-2.5 px-space-sm">
<div className="flex items-center gap-2">
<div className="w-6 h-6 rounded-full bg-surface-bright text-on-surface font-label-badge text-[10px] flex items-center justify-center font-bold">SK</div>
<span className="font-body-sm text-body-sm font-medium text-on-surface">Soren Kjel</span>
</div>
</td>
<td className="py-2.5 px-space-sm">
<a className="font-label-code text-label-code text-primary hover:underline flex items-center gap-1" href="/task-detail">
<span>SCR-112</span>
<span className="material-symbols-outlined text-[12px] opacity-0 group-hover:opacity-100 transition-opacity">north_east</span>
</a>
</td>
<td className="py-2.5 px-space-md">
<div className="font-body-md text-body-md text-on-surface line-clamp-1">WCAG 2.2 AAA Contrast audit on dark token pairings and surface badges</div>
<span className="font-body-sm text-body-sm text-outline">Design System Core</span>
</td>
<td className="py-2.5 px-space-sm text-center">
<span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-container-high text-outline font-label-badge text-label-badge">
<span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
                  Internal
                </span>
</td>
<td className="py-2.5 px-space-sm text-right font-label-code text-label-code text-on-surface font-medium">
                02:00:00
              </td>
<td className="py-2.5 px-space-md text-right">
<div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
<button className="p-1 rounded hover:bg-surface-container-high text-outline hover:text-on-surface transition-colors" title="Edit Session">
<span className="material-symbols-outlined text-[15px]">edit</span>
</button>
<button className="p-1 rounded hover:bg-surface-container-high text-outline hover:text-error transition-colors" title="Delete Session">
<span className="material-symbols-outlined text-[15px]">delete</span>
</button>
</div>
</td>
</tr>
{/*  Row 4  */}
<tr className="hover:bg-surface-container transition-colors group">
<td className="py-2.5 px-space-md">
<div className="font-body-sm text-body-sm text-on-surface">Yesterday, 23 Oct</div>
<div className="font-label-kbd text-[10px] text-outline">09:10 - 10:40</div>
</td>
<td className="py-2.5 px-space-sm">
<div className="flex items-center gap-2">
<div className="w-6 h-6 rounded-full bg-surface-container-high text-on-surface font-label-badge text-[10px] flex items-center justify-center font-bold">AL</div>
<span className="font-body-sm text-body-sm font-medium text-on-surface">Alex Lind</span>
</div>
</td>
<td className="py-2.5 px-space-sm">
<a className="font-label-code text-label-code text-primary hover:underline flex items-center gap-1" href="/task-detail">
<span>SCR-106</span>
<span className="material-symbols-outlined text-[12px] opacity-0 group-hover:opacity-100 transition-opacity">north_east</span>
</a>
</td>
<td className="py-2.5 px-space-md">
<div className="font-body-md text-body-md text-on-surface line-clamp-1">Reviewing PR #492: Disposal hook leak in matrix transformations</div>
<span className="font-body-sm text-body-sm text-outline">Core Graphics Runtime</span>
</td>
<td className="py-2.5 px-space-sm text-center">
<span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-container-high text-primary font-label-badge text-label-badge">
<span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  Billable
                </span>
</td>
<td className="py-2.5 px-space-sm text-right font-label-code text-label-code text-on-surface font-medium">
                01:30:00
              </td>
<td className="py-2.5 px-space-md text-right">
<div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
<button className="p-1 rounded hover:bg-surface-container-high text-outline hover:text-on-surface transition-colors" title="Edit Session">
<span className="material-symbols-outlined text-[15px]">edit</span>
</button>
<button className="p-1 rounded hover:bg-surface-container-high text-outline hover:text-error transition-colors" title="Delete Session">
<span className="material-symbols-outlined text-[15px]">delete</span>
</button>
</div>
</td>
</tr>
</tbody>
</table>
</div>
{/*  Pagination / Footer  */}
<div className="px-space-md py-2 bg-surface-container-lowest flex items-center justify-between text-body-sm font-body-sm text-outline">
<div className="flex items-center gap-space-sm">
<span>Showing 4 of 14 sessions</span>
<span className="w-1 h-1 rounded-full bg-outline-variant"></span>
<span>Total selected: 9h 42m</span>
</div>
<div className="flex items-center gap-1">
<button className="px-2 py-1 rounded bg-surface-container hover:bg-surface-container-high text-outline hover:text-on-surface text-body-sm font-body-sm transition-colors" disabled={true}>Previous</button>
<button className="px-2 py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface text-body-sm font-body-sm transition-colors">Next</button>
</div>
</div>
</div>
</div>
</div>

    </div>
  );
}
