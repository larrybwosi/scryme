"use client";

import Link from "next/link";
import React, { useState } from "react";

export default function ProjectsPage() {
  return (
    <div className="flex flex-col w-full pb-16">
<div className="flex flex-col w-full pb-16">
{/*  Top Utility Bar: Title, Counters, Scope Filters, Actions  */}
<div className="flex flex-col gap-4 py-4 mb-2">
<div className="flex flex-wrap items-center justify-between gap-4">
<div className="flex items-center gap-3">
<div className="flex items-center gap-2">
<span className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Projects</span>
<span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-surface-container-high text-outline text-label-badge font-label-badge">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
            6 Active
          </span>
<span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-surface-container-low text-outline text-label-badge font-label-badge">
            2 Completed
          </span>
</div>
</div>
<div className="flex items-center gap-2.5">
{/*  View Mode Switcher  */}
<div className="flex items-center bg-surface-container-lowest p-0.5 rounded-lg shadow-sm">
<button className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-high text-on-surface font-body-sm text-body-sm shadow-sm transition-all" id="viewGridBtn" type="button">
<span className="material-symbols-outlined text-[15px]">grid_view</span>
<span className="hidden sm:inline">Grid</span>
</button>
<button className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-outline hover:text-on-surface font-body-sm text-body-sm transition-all" id="viewTableBtn" type="button">
<span className="material-symbols-outlined text-[15px]">view_agenda</span>
<span className="hidden sm:inline">Table</span>
</button>
</div>
<div className="h-4 w-px bg-surface-container-highest"></div>
{/*  Filter Selector  */}
<div className="relative">
<button className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant font-body-sm text-body-sm transition-colors" type="button">
<span className="material-symbols-outlined text-[15px] text-outline">filter_list</span>
<span>Filter</span>
<span className="text-outline text-label-kbd font-label-kbd">F</span>
</button>
</div>
{/*  New Project Action  */}
<button className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm shadow-sm transition-all" type="button">
<span className="material-symbols-outlined text-[15px]">add</span>
<span>New Project</span>
<span className="ml-1 text-label-kbd font-label-kbd text-on-primary-container/70 bg-on-primary-fixed/20 px-1 py-0.2 rounded-lg">P</span>
</button>
</div>
</div>
{/*  Sub-navigation: Scope tabs & quick search  */}
<div className="flex flex-wrap items-center justify-between gap-3 pt-2">
<div className="flex items-center gap-1">
<button className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface font-headline-sm text-body-sm transition-colors">All Projects</button>
<button className="px-2.5 py-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-low font-body-sm text-body-sm transition-colors flex items-center gap-1.5">
<span>In Progress</span>
<span className="text-label-badge font-label-badge px-1 rounded-lg bg-surface-container-highest text-outline">4</span>
</button>
<button className="px-2.5 py-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-low font-body-sm text-body-sm transition-colors flex items-center gap-1.5">
<span>Planning</span>
<span className="text-label-badge font-label-badge px-1 rounded-lg bg-surface-container-highest text-outline">2</span>
</button>
<button className="px-2.5 py-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-low font-body-sm text-body-sm transition-colors flex items-center gap-1.5">
<span>Paused</span>
<span className="text-label-badge font-label-badge px-1 rounded-lg bg-surface-container-highest text-outline">0</span>
</button>
</div>
<div className="flex items-center gap-2">
<div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-surface-container-lowest text-outline focus-within:text-on-surface focus-within:bg-surface-container-low transition-all">
<span className="material-symbols-outlined text-[14px]">search</span>
<input className="bg-transparent font-body-sm text-body-sm text-on-surface focus:outline-none placeholder:text-outline w-44 md:w-60" placeholder="Search projects, leads, tags..." type="text"/>
</div>
</div>
</div>
</div>
{/*  Main Active Projects Grid  */}
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5 mb-6" id="projectsGrid">
{/*  Project 1: Nexus 2.0 Redesign (Flagship)  */}
<div className="group relative flex flex-col justify-between p-4 rounded-lg bg-surface-container-low hover:bg-surface-container transition-all duration-150 shadow-sm cursor-pointer">
<div className="flex flex-col gap-3">
<div className="flex items-start justify-between gap-2">
<div className="flex items-center gap-2 min-w-0">
<div className="w-6 h-6 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary text-[13px] font-label-code shrink-0">
<span className="material-symbols-outlined text-[15px] text-primary">auto_awesome</span>
</div>
<div className="min-w-0">
<h3 className="font-headline-sm text-headline-sm text-on-surface truncate group-hover:text-primary transition-colors">Nexus 2.0 Redesign</h3>
<p className="font-body-sm text-body-sm text-outline truncate">Next-gen UI engine &amp; unified tokens</p>
</div>
</div>
<span className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-surface-container-highest text-[10px] font-label-badge text-primary uppercase tracking-wider">Flagship</span>
</div>
{/*  Health and Metadata strip  */}
<div className="flex flex-wrap items-center gap-2 pt-1">
<div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-surface-container-highest">
<span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
<span className="font-label-badge text-label-badge text-on-surface">On Track</span>
</div>
<div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface-container-highest text-outline font-label-code text-label-code">
<span className="material-symbols-outlined text-[13px]">date_range</span>
<span>Oct 29</span>
</div>
<div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface-container-highest text-outline font-label-code text-label-code">
<span>Sprint 14</span>
</div>
</div>
{/*  Burnup Progress Indicator  */}
<div className="flex flex-col gap-1.5 pt-2">
<div className="flex items-center justify-between text-body-sm font-body-sm">
<span className="text-outline">Execution Progress</span>
<span className="font-label-code text-label-code text-on-surface font-medium">68%</span>
</div>
<div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
<div className="h-full bg-primary-container rounded-full transition-all duration-500" style={{width: "68%"}}></div>
</div>
</div>
{/*  Issues Breakdown Matrix  */}
<div className="grid grid-cols-3 gap-1 py-1 text-center bg-surface-container-lowest rounded-lg p-2">
<div className="flex flex-col">
<span className="font-label-code text-label-code text-primary font-medium">39</span>
<span className="text-[10px] text-outline uppercase tracking-wider">Active</span>
</div>
<div className="flex flex-col border-x border-surface-container-highest">
<span className="font-label-code text-label-code text-amber-300 font-medium">5</span>
<span className="text-[10px] text-outline uppercase tracking-wider">Review</span>
</div>
<div className="flex flex-col">
<span className="font-label-code text-label-code text-outline font-medium">14</span>
<span className="text-[10px] text-outline uppercase tracking-wider">Todo</span>
</div>
</div>
</div>
{/*  Footer: Lead, Scope summary  */}
<div className="flex items-center justify-between pt-3 mt-3 border-t border-surface-container-highest text-body-sm font-body-sm">
<div className="flex items-center gap-2">
<div className="w-5 h-5 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-label-badge text-[10px] font-semibold">
            ER
          </div>
<span className="text-outline text-body-sm truncate max-w-[100px]">Elena Rostova</span>
</div>
<div className="flex items-center gap-1 text-outline font-label-code text-label-code">
<span className="material-symbols-outlined text-[14px]">checklist</span>
<span>58 issues</span>
</div>
</div>
</div>
{/*  Project 2: Core Engine v3 Migration  */}
<div className="group relative flex flex-col justify-between p-4 rounded-lg bg-surface-container-low hover:bg-surface-container transition-all duration-150 shadow-sm cursor-pointer">
<div className="flex flex-col gap-3">
<div className="flex items-start justify-between gap-2">
<div className="flex items-center gap-2 min-w-0">
<div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 text-[13px] font-label-code shrink-0">
<span className="material-symbols-outlined text-[15px] text-amber-400">deployed_code</span>
</div>
<div className="min-w-0">
<h3 className="font-headline-sm text-headline-sm text-on-surface truncate group-hover:text-primary transition-colors">Core Engine v3</h3>
<p className="font-body-sm text-body-sm text-outline truncate">Distributed state rewrite &amp; WASM</p>
</div>
</div>
</div>
{/*  Health and Metadata strip  */}
<div className="flex flex-wrap items-center gap-2 pt-1">
<div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-surface-container-highest">
<span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
<span className="font-label-badge text-label-badge text-amber-200">At Risk</span>
</div>
<div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface-container-highest text-outline font-label-code text-label-code">
<span className="material-symbols-outlined text-[13px]">date_range</span>
<span>Nov 15</span>
</div>
<div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface-container-highest text-outline font-label-code text-label-code">
<span>Sprint 15</span>
</div>
</div>
{/*  Burnup Progress Indicator  */}
<div className="flex flex-col gap-1.5 pt-2">
<div className="flex items-center justify-between text-body-sm font-body-sm">
<span className="text-outline">Execution Progress</span>
<span className="font-label-code text-label-code text-on-surface font-medium">42%</span>
</div>
<div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
<div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{width: "42%"}}></div>
</div>
</div>
{/*  Issues Breakdown Matrix  */}
<div className="grid grid-cols-3 gap-1 py-1 text-center bg-surface-container-lowest rounded-lg p-2">
<div className="flex flex-col">
<span className="font-label-code text-label-code text-primary font-medium">11</span>
<span className="text-[10px] text-outline uppercase tracking-wider">Active</span>
</div>
<div className="flex flex-col border-x border-surface-container-highest">
<span className="font-label-code text-label-code text-amber-300 font-medium">3</span>
<span className="text-[10px] text-outline uppercase tracking-wider">Review</span>
</div>
<div className="flex flex-col">
<span className="font-label-code text-label-code text-outline font-medium">10</span>
<span className="text-[10px] text-outline uppercase tracking-wider">Todo</span>
</div>
</div>
</div>
{/*  Footer: Lead, Scope summary  */}
<div className="flex items-center justify-between pt-3 mt-3 border-t border-surface-container-highest text-body-sm font-body-sm">
<div className="flex items-center gap-2">
<div className="w-5 h-5 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center font-label-badge text-[10px] font-semibold">
            AM
          </div>
<span className="text-outline text-body-sm truncate max-w-[100px]">Arbian Musaf</span>
</div>
<div className="flex items-center gap-1 text-outline font-label-code text-label-code">
<span className="material-symbols-outlined text-[14px]">checklist</span>
<span>24 issues</span>
</div>
</div>
</div>
{/*  Project 3: Enterprise SSO & RBAC  */}
<div className="group relative flex flex-col justify-between p-4 rounded-lg bg-surface-container-low hover:bg-surface-container transition-all duration-150 shadow-sm cursor-pointer">
<div className="flex flex-col gap-3">
<div className="flex items-start justify-between gap-2">
<div className="flex items-center gap-2 min-w-0">
<div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center text-primary text-[13px] font-label-code shrink-0">
<span className="material-symbols-outlined text-[15px] text-primary">key</span>
</div>
<div className="min-w-0">
<h3 className="font-headline-sm text-headline-sm text-on-surface truncate group-hover:text-primary transition-colors">Enterprise SSO &amp; RBAC</h3>
<p className="font-body-sm text-body-sm text-outline truncate">SAML 2.0 &amp; custom permission roles</p>
</div>
</div>
</div>
{/*  Health and Metadata strip  */}
<div className="flex flex-wrap items-center gap-2 pt-1">
<div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-surface-container-highest">
<span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
<span className="font-label-badge text-label-badge text-on-surface">On Track</span>
</div>
<div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface-container-highest text-outline font-label-code text-label-code">
<span className="material-symbols-outlined text-[13px]">date_range</span>
<span>Oct 31</span>
</div>
<div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface-container-highest text-outline font-label-code text-label-code">
<span>Sprint 14</span>
</div>
</div>
{/*  Burnup Progress Indicator  */}
<div className="flex flex-col gap-1.5 pt-2">
<div className="flex items-center justify-between text-body-sm font-body-sm">
<span className="text-outline">Execution Progress</span>
<span className="font-label-code text-label-code text-on-surface font-medium">85%</span>
</div>
<div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
<div className="h-full bg-primary-container rounded-full transition-all duration-500" style={{width: "85%"}}></div>
</div>
</div>
{/*  Issues Breakdown Matrix  */}
<div className="grid grid-cols-3 gap-1 py-1 text-center bg-surface-container-lowest rounded-lg p-2">
<div className="flex flex-col">
<span className="font-label-code text-label-code text-primary font-medium">10</span>
<span className="text-[10px] text-outline uppercase tracking-wider">Active</span>
</div>
<div className="flex flex-col border-x border-surface-container-highest">
<span className="font-label-code text-label-code text-amber-300 font-medium">1</span>
<span className="text-[10px] text-outline uppercase tracking-wider">Review</span>
</div>
<div className="flex flex-col">
<span className="font-label-code text-label-code text-outline font-medium">1</span>
<span className="text-[10px] text-outline uppercase tracking-wider">Todo</span>
</div>
</div>
</div>
{/*  Footer: Lead, Scope summary  */}
<div className="flex items-center justify-between pt-3 mt-3 border-t border-surface-container-highest text-body-sm font-body-sm">
<div className="flex items-center gap-2">
<div className="w-5 h-5 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-label-badge text-[10px] font-semibold">
            AN
          </div>
<span className="text-outline text-body-sm truncate max-w-[100px]">Alex Nazeer</span>
</div>
<div className="flex items-center gap-1 text-outline font-label-code text-label-code">
<span className="material-symbols-outlined text-[14px]">checklist</span>
<span>12 issues</span>
</div>
</div>
</div>
{/*  Project 4: Design Tokens & Multi-theme Sync  */}
<div className="group relative flex flex-col justify-between p-4 rounded-lg bg-surface-container-low hover:bg-surface-container transition-all duration-150 shadow-sm cursor-pointer">
<div className="flex flex-col gap-3">
<div className="flex items-start justify-between gap-2">
<div className="flex items-center gap-2 min-w-0">
<div className="w-6 h-6 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary text-[13px] font-label-code shrink-0">
<span className="material-symbols-outlined text-[15px] text-primary">palette</span>
</div>
<div className="min-w-0">
<h3 className="font-headline-sm text-headline-sm text-on-surface truncate group-hover:text-primary transition-colors">Design Tokens Sync</h3>
<p className="font-body-sm text-body-sm text-outline truncate">Figma zero-friction export pipeline</p>
</div>
</div>
</div>
{/*  Health and Metadata strip  */}
<div className="flex flex-wrap items-center gap-2 pt-1">
<div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-surface-container-highest">
<span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
<span className="font-label-badge text-label-badge text-on-surface">On Track</span>
</div>
<div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface-container-highest text-outline font-label-code text-label-code">
<span className="material-symbols-outlined text-[13px]">date_range</span>
<span>Oct 25</span>
</div>
<div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface-container-highest text-outline font-label-code text-label-code">
<span>Sprint 14</span>
</div>
</div>
{/*  Burnup Progress Indicator  */}
<div className="flex flex-col gap-1.5 pt-2">
<div className="flex items-center justify-between text-body-sm font-body-sm">
<span className="text-outline">Execution Progress</span>
<span className="font-label-code text-label-code text-on-surface font-medium">92%</span>
</div>
<div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
<div className="h-full bg-primary-container rounded-full transition-all duration-500" style={{width: "92%"}}></div>
</div>
</div>
{/*  Issues Breakdown Matrix  */}
<div className="grid grid-cols-3 gap-1 py-1 text-center bg-surface-container-lowest rounded-lg p-2">
<div className="flex flex-col">
<span className="font-label-code text-label-code text-primary font-medium">16</span>
<span className="text-[10px] text-outline uppercase tracking-wider">Active</span>
</div>
<div className="flex flex-col border-x border-surface-container-highest">
<span className="font-label-code text-label-code text-amber-300 font-medium">2</span>
<span className="text-[10px] text-outline uppercase tracking-wider">Review</span>
</div>
<div className="flex flex-col">
<span className="font-label-code text-label-code text-outline font-medium">0</span>
<span className="text-[10px] text-outline uppercase tracking-wider">Todo</span>
</div>
</div>
</div>
{/*  Footer: Lead, Scope summary  */}
<div className="flex items-center justify-between pt-3 mt-3 border-t border-surface-container-highest text-body-sm font-body-sm">
<div className="flex items-center gap-2">
<div className="w-5 h-5 rounded-full bg-primary-container/80 text-on-primary flex items-center justify-center font-label-badge text-[10px] font-semibold">
            AG
          </div>
<span className="text-outline text-body-sm truncate max-w-[100px]">Azahra Ge</span>
</div>
<div className="flex items-center gap-1 text-outline font-label-code text-label-code">
<span className="material-symbols-outlined text-[14px]">checklist</span>
<span>18 issues</span>
</div>
</div>
</div>
</div>
{/*  Bottom Section: Sprint Health & Velocity Analytics + Milestones Roadmap  */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
{/*  Sprint Health & Velocity Analytics Panel (7 Cols)  */}
<div className="lg:col-span-7 flex flex-col p-4 rounded-lg bg-surface-container-low shadow-sm">
<div className="flex items-center justify-between pb-3 border-b border-surface-container-highest">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-[17px] text-primary">monitoring</span>
<span className="font-headline-sm text-headline-sm text-on-surface">Sprint Health &amp; Velocity</span>
<span className="text-[11px] font-label-code text-outline px-1.5 py-0.5 rounded-lg bg-surface-container-highest">Cycle 14</span>
</div>
<div className="flex items-center gap-3 text-body-sm font-body-sm text-outline">
<span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary-container"></span> Delivered</span>
<span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-surface-container-highest"></span> Target</span>
</div>
</div>
{/*  Metric Highlights Strip  */}
<div className="grid grid-cols-3 gap-3 py-3 my-1">
<div className="flex flex-col p-2.5 rounded-lg bg-surface-container-lowest">
<span className="text-outline font-body-sm text-[11px] uppercase tracking-wider">Avg Lead Time</span>
<div className="flex items-baseline gap-1.5 mt-0.5">
<span className="font-display-lg text-[22px] font-semibold text-on-surface leading-none">3.2</span>
<span className="text-outline text-body-sm">days</span>
</div>
<span className="text-[10px] text-emerald-400 mt-1 flex items-center gap-0.5">
<span className="material-symbols-outlined text-[11px]">arrow_downward</span> 0.4d vs cycle 13
          </span>
</div>
<div className="flex flex-col p-2.5 rounded-lg bg-surface-container-lowest">
<span className="text-outline font-body-sm text-[11px] uppercase tracking-wider">Throughput</span>
<div className="flex items-baseline gap-1.5 mt-0.5">
<span className="font-display-lg text-[22px] font-semibold text-on-surface leading-none">46</span>
<span className="text-outline text-body-sm">pts/wk</span>
</div>
<span className="text-[10px] text-emerald-400 mt-1 flex items-center gap-0.5">
<span className="material-symbols-outlined text-[11px]">arrow_upward</span> +8.2% efficiency
          </span>
</div>
<div className="flex flex-col p-2.5 rounded-lg bg-surface-container-lowest">
<span className="text-outline font-body-sm text-[11px] uppercase tracking-wider">Bug Burndown</span>
<div className="flex items-baseline gap-1.5 mt-0.5">
<span className="font-display-lg text-[22px] font-semibold text-on-surface leading-none">94.8%</span>
</div>
<span className="text-[10px] text-outline mt-1 flex items-center gap-0.5">
<span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> 2 critical remaining
          </span>
</div>
</div>
{/*  14-Day Velocity Inline SVG Chart  */}
<div className="flex flex-col gap-1.5 pt-1">
<div className="flex items-center justify-between text-body-sm font-body-sm">
<span className="text-outline text-[11px]">Sprint 14 Velocity Trend (Past 14 Days)</span>
<span className="font-label-code text-label-code text-outline">Target: 48 pts</span>
</div>
<div className="w-full h-28 bg-surface-container-lowest rounded-lg p-2 flex items-end">
<svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 520 80">
{/*  Target line dashed  */}
<line className="text-surface-container-highest" stroke="currentColor" stroke-dasharray="3 3" stroke-width="1.5" x1="0" x2="520" y1="28" y2="28"></line>
{/*  Area fill  */}
<polygon className="text-primary-container/10" fill="currentColor" points="0,75 40,68 80,62 120,55 160,50 200,48 240,42 280,38 320,32 360,25 400,22 440,18 480,14 520,10 520,80 0,80"></polygon>
{/*  Burnup Actual Line  */}
<polyline className="text-primary-container" fill="none" points="0,75 40,68 80,62 120,55 160,50 200,48 240,42 280,38 320,32 360,25 400,22 440,18 480,14 520,10" stroke="currentColor" stroke-width="2.5"></polyline>
{/*  Highlight node at peak  */}
<circle className="fill-primary-container stroke-surface" cx="520" cy="10" r="3.5" stroke-width="2"></circle>
</svg>
</div>
<div className="flex justify-between font-label-code text-[10px] text-outline px-1">
<span>Day 1</span>
<span>Day 4</span>
<span>Day 7</span>
<span>Day 10</span>
<span>Today (Day 14)</span>
</div>
</div>
</div>
{/*  Cross-Project Milestones Roadmap Strip (5 Cols)  */}
<div className="lg:col-span-5 flex flex-col p-4 rounded-lg bg-surface-container-low shadow-sm">
<div className="flex items-center justify-between pb-3 border-b border-surface-container-highest">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-[17px] text-primary">flag</span>
<span className="font-headline-sm text-headline-sm text-on-surface">Milestones Roadmap</span>
</div>
<button className="text-outline hover:text-on-surface font-body-sm text-[12px] flex items-center gap-1 transition-colors" type="button">
<span>Timeline View</span>
<span className="material-symbols-outlined text-[14px]">arrow_forward</span>
</button>
</div>
{/*  Linear Roadmap timeline items  */}
<div className="flex flex-col gap-2.5 pt-3">
{/*  Milestone 1  */}
<div className="flex items-start gap-3 p-2.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container transition-colors">
<div className="mt-0.5 w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
<span className="material-symbols-outlined text-[12px]">done</span>
</div>
<div className="flex flex-col min-w-0 flex-1">
<div className="flex items-center justify-between gap-1">
<span className="font-headline-sm text-body-sm text-on-surface truncate">Multi-theme Token Ingestion</span>
<span className="font-label-code text-[11px] text-emerald-400 shrink-0">Oct 25</span>
</div>
<p className="font-body-sm text-[11px] text-outline truncate">Design Tokens &amp; Multi-theme Sync</p>
</div>
</div>
{/*  Milestone 2  */}
<div className="flex items-start gap-3 p-2.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container transition-colors">
<div className="mt-0.5 w-4 h-4 rounded-full bg-primary-container/20 text-primary flex items-center justify-center shrink-0">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse"></span>
</div>
<div className="flex flex-col min-w-0 flex-1">
<div className="flex items-center justify-between gap-1">
<span className="font-headline-sm text-body-sm text-on-surface truncate">Nexus 2.0 Beta Release Candidate</span>
<span className="font-label-code text-[11px] text-on-surface shrink-0">Oct 29</span>
</div>
<p className="font-body-sm text-[11px] text-outline truncate">Nexus 2.0 Redesign • Release Sprint 14</p>
</div>
</div>
{/*  Milestone 3  */}
<div className="flex items-start gap-3 p-2.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container transition-colors">
<div className="mt-0.5 w-4 h-4 rounded-full bg-surface-container-highest text-outline flex items-center justify-center shrink-0">
<span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
</div>
<div className="flex flex-col min-w-0 flex-1">
<div className="flex items-center justify-between gap-1">
<span className="font-headline-sm text-body-sm text-on-surface truncate">Okta &amp; Google SSO Certification</span>
<span className="font-label-code text-[11px] text-outline shrink-0">Oct 31</span>
</div>
<p className="font-body-sm text-[11px] text-outline truncate">Enterprise SSO &amp; RBAC</p>
</div>
</div>
{/*  Milestone 4  */}
<div className="flex items-start gap-3 p-2.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container transition-colors">
<div className="mt-0.5 w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
<span className="material-symbols-outlined text-[12px] text-amber-400">warning</span>
</div>
<div className="flex flex-col min-w-0 flex-1">
<div className="flex items-center justify-between gap-1">
<span className="font-headline-sm text-body-sm text-on-surface truncate">WASM Engine Staging Cutover</span>
<span className="font-label-code text-[11px] text-amber-300 shrink-0">Nov 15</span>
</div>
<p className="font-body-sm text-[11px] text-outline truncate">Core Engine v3 Migration</p>
</div>
</div>
</div>
</div>
</div>
</div>

    </div>
  );
}
