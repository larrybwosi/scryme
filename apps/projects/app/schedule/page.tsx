"use client";

import Link from "next/link";
import React, { useState } from "react";

export default function SchedulePage() {
  return (
    <div className="flex flex-col w-full pb-16">
<div className="flex flex-col w-full">
<div className="flex flex-col gap-space-lg py-space-lg">
{/*  Top Action & Capacity Overview Bar  */}
<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md bg-surface-container-lowest p-space-md rounded-lg shadow-sm">
<div className="flex flex-wrap items-center gap-space-md">
{/*  Date Navigator  */}
<div className="flex items-center gap-1 bg-surface-container px-space-xs py-1 rounded-lg shadow-inner">
<button className="w-6 h-6 flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container-high rounded transition-colors" title="Previous Week" type="button">
<span className="material-symbols-outlined text-[16px]">chevron_left</span>
</button>
<div className="flex items-center gap-2 px-space-xs">
<span className="material-symbols-outlined text-[15px] text-primary">calendar_month</span>
<span className="font-headline-sm text-body-md text-on-surface font-medium tracking-tight">Week of Oct 21 – Oct 27, 2024</span>
</div>
<button className="w-6 h-6 flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container-high rounded transition-colors" title="Next Week" type="button">
<span className="material-symbols-outlined text-[16px]">chevron_right</span>
</button>
<button className="px-2 py-0.5 ml-1 text-label-badge font-label-badge bg-surface-container-high text-on-surface-variant hover:text-on-surface rounded" type="button">
            Current
          </button>
</div>
<div className="h-4 w-px bg-surface-container-highest hidden sm:block"></div>
{/*  Filter Selector  */}
<div className="flex items-center gap-2">
<div className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container rounded-lg cursor-pointer hover:bg-surface-container-high transition-colors">
<span className="material-symbols-outlined text-[15px] text-outline">groups</span>
<span className="font-body-md text-body-sm text-on-surface">Core Eng &amp; Product (4)</span>
<span className="material-symbols-outlined text-[14px] text-outline">expand_more</span>
</div>
<div className="flex items-center gap-1 px-2 py-1 bg-surface-container rounded-lg text-outline hover:text-on-surface cursor-pointer text-body-sm">
<span className="material-symbols-outlined text-[14px]">filter_list</span>
<span className="font-body-sm text-body-sm">All Epics</span>
</div>
</div>
</div>
{/*  Capacity Metric & Booking Action  */}
<div className="flex flex-wrap items-center gap-space-lg">
<div className="flex items-center gap-space-md bg-surface-container px-space-md py-1.5 rounded-lg">
<div className="flex flex-col">
<div className="flex items-center gap-2">
<span className="font-headline-sm text-body-sm text-on-surface font-semibold tracking-tight">168h / 200h</span>
<span className="font-label-badge text-label-badge px-1.5 py-0.5 rounded bg-primary-container/20 text-primary font-mono font-medium">84% Load</span>
</div>
<span className="font-body-sm text-[10px] text-outline">Cluster Allocation</span>
</div>
{/*  Inline Sparkline / Progress Bar  */}
<div className="w-24 h-2 bg-surface-container-high rounded-full overflow-hidden flex">
<div className="h-full bg-primary-container" style={{width: "84%"}}></div>
</div>
</div>
<button className="h-8 px-space-md bg-primary-container hover:bg-primary-container/90 text-on-primary-container rounded text-body-sm font-headline-sm flex items-center gap-1.5 shadow-sm transition-all active:scale-[0.98]" type="button">
<span className="material-symbols-outlined text-[16px]">add_circle</span>
<span>Add Booking</span>
<span className="font-label-kbd text-label-kbd text-on-primary-container/60 ml-1">B</span>
</button>
</div>
</div>
{/*  Allocation Summary Ticker Cards  */}
<div className="grid grid-cols-1 md:grid-cols-4 gap-space-sm">
<div className="bg-surface-container-low p-space-md rounded-lg flex items-center justify-between">
<div>
<span className="font-body-sm text-[11px] text-outline block uppercase tracking-wider">Scheduled Workload</span>
<span className="font-headline-lg text-headline-sm text-on-surface font-semibold">168.0 hrs</span>
</div>
<div className="p-2 rounded bg-surface-container text-primary">
<span className="material-symbols-outlined text-[18px]">timelapse</span>
</div>
</div>
<div className="bg-surface-container-low p-space-md rounded-lg flex items-center justify-between">
<div>
<span className="font-body-sm text-[11px] text-outline block uppercase tracking-wider">Available Headroom</span>
<span className="font-headline-lg text-headline-sm text-on-surface font-semibold">32.0 hrs</span>
</div>
<div className="p-2 rounded bg-surface-container text-secondary">
<span className="material-symbols-outlined text-[18px]">battery_horiz_075</span>
</div>
</div>
<div className="bg-surface-container-low p-space-md rounded-lg flex items-center justify-between">
<div>
<span className="font-body-sm text-[11px] text-outline block uppercase tracking-wider">Max Utilized Member</span>
<span className="font-headline-lg text-headline-sm text-on-surface font-semibold truncate max-w-[140px]">Arbian M.</span>
</div>
<div className="p-2 rounded bg-surface-container text-error">
<span className="material-symbols-outlined text-[18px]">warning</span>
</div>
</div>
<div className="bg-surface-container-low p-space-md rounded-lg flex items-center justify-between">
<div>
<span className="font-body-sm text-[11px] text-outline block uppercase tracking-wider">Unscheduled Backlog</span>
<span className="font-headline-lg text-headline-sm text-on-surface font-semibold">5 Tickets (28h)</span>
</div>
<div className="p-2 rounded bg-surface-container text-outline">
<span className="material-symbols-outlined text-[18px]">assignment_late</span>
</div>
</div>
</div>
{/*  Resource Allocation Matrix (Weekly Grid)  */}
<div className="flex flex-col bg-surface-container-lowest rounded-lg shadow-sm overflow-hidden">
{/*  Grid Header (Days)  */}
<div className="grid grid-cols-12 bg-surface-container-low text-on-surface-variant text-body-sm py-2 px-space-md items-center">
<div className="col-span-12 lg:col-span-3 flex items-center justify-between pr-4">
<span className="font-label-badge text-label-badge uppercase tracking-wider text-outline font-semibold">Resource / Load</span>
<span className="font-label-code text-label-code text-outline">Weekly Total</span>
</div>
<div className="hidden lg:grid col-span-9 grid-cols-5 gap-2 text-center">
<div className="flex flex-col items-center">
<span className="font-headline-sm text-body-sm text-on-surface font-medium">Mon</span>
<span className="font-label-code text-[10px] text-outline">Oct 21</span>
</div>
<div className="flex flex-col items-center">
<span className="font-headline-sm text-body-sm text-on-surface font-medium">Tue</span>
<span className="font-label-code text-[10px] text-outline">Oct 22</span>
</div>
<div className="flex flex-col items-center bg-surface-container py-0.5 rounded">
<span className="font-headline-sm text-body-sm text-primary font-medium">Wed (Today)</span>
<span className="font-label-code text-[10px] text-primary">Oct 23</span>
</div>
<div className="flex flex-col items-center">
<span className="font-headline-sm text-body-sm text-on-surface font-medium">Thu</span>
<span className="font-label-code text-[10px] text-outline">Oct 24</span>
</div>
<div className="flex flex-col items-center">
<span className="font-headline-sm text-body-sm text-on-surface font-medium">Fri</span>
<span className="font-label-code text-[10px] text-outline">Oct 25</span>
</div>
</div>
</div>
{/*  MEMBER ROW 1: Elena Rostova  */}
<div className="grid grid-cols-12 p-space-md items-start bg-surface-container-lowest hover:bg-surface-container-low/40 transition-colors">
{/*  Profile & Capacity  */}
<div className="col-span-12 lg:col-span-3 flex flex-col justify-between pr-4 mb-4 lg:mb-0">
<div className="flex items-center gap-space-sm mb-2">
<div className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center text-primary font-semibold text-body-sm">
              ER
            </div>
<div className="flex flex-col min-w-0">
<span className="font-headline-sm text-body-sm text-on-surface font-medium truncate">Elena Rostova</span>
<span className="font-body-sm text-[11px] text-outline truncate">Lead PM</span>
</div>
</div>
<div className="flex flex-col gap-1 w-full bg-surface-container p-2 rounded">
<div className="flex justify-between items-center text-body-sm font-label-code">
<span className="text-on-surface-variant text-[11px]">38h / 40h</span>
<span className="text-primary font-semibold text-[11px]">95%</span>
</div>
<div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
<div className="bg-primary h-full rounded-full" style={{width: "95%"}}></div>
</div>
</div>
</div>
{/*  5 Days Time Slots  */}
<div className="col-span-12 lg:col-span-9 grid grid-cols-1 sm:grid-cols-5 gap-2">
{/*  Mon  */}
<div className="flex flex-col gap-1 min-h-[90px] p-1 bg-surface-container-low rounded">
<div className="group relative flex flex-col p-2 bg-surface-container rounded cursor-grab hover:bg-surface-container-high transition-all shadow-sm">
<div className="flex items-center justify-between mb-1">
<span className="px-1.5 py-0.2 text-[10px] font-label-badge bg-primary-container/20 text-primary rounded font-mono">SCR-104</span>
<span className="font-label-code text-[10px] text-outline">6h</span>
</div>
<p className="font-headline-sm text-[12px] text-on-surface leading-tight font-medium line-clamp-2">Product Spec &amp; Roadmap V2</p>
<div className="flex items-center gap-1 mt-2 text-[10px] text-outline">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
<span>Logged 6h</span>
</div>
</div>
</div>
{/*  Tue  */}
<div className="flex flex-col gap-1 min-h-[90px] p-1 bg-surface-container-low rounded">
<div className="group relative flex flex-col p-2 bg-surface-container rounded cursor-grab hover:bg-surface-container-high transition-all shadow-sm">
<div className="flex items-center justify-between mb-1">
<span className="px-1.5 py-0.2 text-[10px] font-label-badge bg-tertiary-container/30 text-tertiary-fixed rounded font-mono">ANL-42</span>
<span className="font-label-code text-[10px] text-outline">8h</span>
</div>
<p className="font-headline-sm text-[12px] text-on-surface leading-tight font-medium line-clamp-2">Analytics Wireframes Review</p>
<div className="flex items-center gap-1 mt-2 text-[10px] text-outline">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
<span>Logged 8h</span>
</div>
</div>
</div>
{/*  Wed  */}
<div className="flex flex-col gap-1 min-h-[90px] p-1 bg-surface-container rounded">
<div className="group relative flex flex-col p-2 bg-surface-container-high rounded cursor-grab hover:bg-surface-container-highest transition-all shadow-sm">
<div className="flex items-center justify-between mb-1">
<span className="px-1.5 py-0.2 text-[10px] font-label-badge bg-primary-container/20 text-primary rounded font-mono">SYNC-09</span>
<span className="font-label-code text-[10px] text-primary">6h</span>
</div>
<p className="font-headline-sm text-[12px] text-on-surface leading-tight font-medium line-clamp-2">Exec Alignment &amp; Stakeholders</p>
<div className="flex items-center gap-1 mt-2 text-[10px] text-primary">
<span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
<span>In Progress (4h)</span>
</div>
</div>
</div>
{/*  Thu  */}
<div className="flex flex-col gap-1 min-h-[90px] p-1 bg-surface-container-low rounded">
<div className="group relative flex flex-col p-2 bg-surface-container rounded cursor-grab hover:bg-surface-container-high transition-all shadow-sm">
<div className="flex items-center justify-between mb-1">
<span className="px-1.5 py-0.2 text-[10px] font-label-badge bg-secondary-container/30 text-secondary-fixed rounded font-mono">REL-88</span>
<span className="font-label-code text-[10px] text-outline">8h</span>
</div>
<p className="font-headline-sm text-[12px] text-on-surface leading-tight font-medium line-clamp-2">Live QA Staging Deployment</p>
<div className="flex items-center gap-1 mt-2 text-[10px] text-outline">
<span className="material-symbols-outlined text-[12px]">schedule</span>
<span>Scheduled</span>
</div>
</div>
</div>
{/*  Fri  */}
<div className="flex flex-col gap-1 min-h-[90px] p-1 bg-surface-container-low rounded">
<div className="group relative flex flex-col p-2 bg-surface-container rounded cursor-grab hover:bg-surface-container-high transition-all shadow-sm">
<div className="flex items-center justify-between mb-1">
<span className="px-1.5 py-0.2 text-[10px] font-label-badge bg-primary-container/20 text-primary rounded font-mono">DEMO-03</span>
<span className="font-label-code text-[10px] text-outline">6h</span>
</div>
<p className="font-headline-sm text-[12px] text-on-surface leading-tight font-medium line-clamp-2">Sprint Demo Prep &amp; Deck</p>
<div className="flex items-center gap-1 mt-2 text-[10px] text-outline">
<span className="material-symbols-outlined text-[12px]">schedule</span>
<span>Scheduled</span>
</div>
</div>
<div className="p-1 rounded bg-surface-container/40 text-center">
<span className="font-label-code text-[10px] text-outline">+2h Free</span>
</div>
</div>
</div>
</div>
{/*  MEMBER ROW 2: Arbian Musaf  */}
<div className="grid grid-cols-12 p-space-md items-start bg-surface-container-lowest hover:bg-surface-container-low/40 transition-colors">
{/*  Profile & Capacity  */}
<div className="col-span-12 lg:col-span-3 flex flex-col justify-between pr-4 mb-4 lg:mb-0">
<div className="flex items-center gap-space-sm mb-2">
<div className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center text-error font-semibold text-body-sm">
              AM
            </div>
<div className="flex flex-col min-w-0">
<span className="font-headline-sm text-body-sm text-on-surface font-medium truncate">Arbian Musaf</span>
<span className="font-body-sm text-[11px] text-outline truncate">Frontend Architect</span>
</div>
</div>
<div className="flex flex-col gap-1 w-full bg-surface-container p-2 rounded">
<div className="flex justify-between items-center text-body-sm font-label-code">
<span className="text-on-surface-variant text-[11px]">40h / 40h</span>
<span className="text-error font-semibold text-[11px]">100% Full</span>
</div>
<div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
<div className="bg-error h-full rounded-full" style={{width: "100%"}}></div>
</div>
</div>
</div>
{/*  5 Days Time Slots  */}
<div className="col-span-12 lg:col-span-9 grid grid-cols-1 sm:grid-cols-5 gap-2">
{/*  Mon  */}
<div className="flex flex-col gap-1 min-h-[90px] p-1 bg-surface-container-low rounded">
<div className="group relative flex flex-col p-2 bg-surface-container rounded cursor-grab hover:bg-surface-container-high transition-all shadow-sm">
<div className="flex items-center justify-between mb-1">
<span className="px-1.5 py-0.2 text-[10px] font-label-badge bg-secondary-container/40 text-secondary-fixed rounded font-mono">ENG-210</span>
<span className="font-label-code text-[10px] text-outline">8h</span>
</div>
<p className="font-headline-sm text-[12px] text-on-surface leading-tight font-medium line-clamp-2">Tailwind Token Sync Compiler</p>
<div className="flex items-center gap-1 mt-2 text-[10px] text-outline">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
<span>Logged 8h</span>
</div>
</div>
</div>
{/*  Tue  */}
<div className="flex flex-col gap-1 min-h-[90px] p-1 bg-surface-container-low rounded">
<div className="group relative flex flex-col p-2 bg-surface-container rounded cursor-grab hover:bg-surface-container-high transition-all shadow-sm">
<div className="flex items-center justify-between mb-1">
<span className="px-1.5 py-0.2 text-[10px] font-label-badge bg-secondary-container/40 text-secondary-fixed rounded font-mono">ENG-211</span>
<span className="font-label-code text-[10px] text-outline">8h</span>
</div>
<p className="font-headline-sm text-[12px] text-on-surface leading-tight font-medium line-clamp-2">WebGL Timeline Chart Engine</p>
<div className="flex items-center gap-1 mt-2 text-[10px] text-outline">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
<span>Logged 8h</span>
</div>
</div>
</div>
{/*  Wed  */}
<div className="flex flex-col gap-1 min-h-[90px] p-1 bg-surface-container rounded">
<div className="group relative flex flex-col p-2 bg-surface-container-high rounded cursor-grab hover:bg-surface-container-highest transition-all shadow-sm">
<div className="flex items-center justify-between mb-1">
<span className="px-1.5 py-0.2 text-[10px] font-label-badge bg-secondary-container/40 text-secondary-fixed rounded font-mono">ENG-214</span>
<span className="font-label-code text-[10px] text-primary">8h</span>
</div>
<p className="font-headline-sm text-[12px] text-on-surface leading-tight font-medium line-clamp-2">Canvas Virtualizer 120fps Refactor</p>
<div className="flex items-center gap-1 mt-2 text-[10px] text-primary">
<span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
<span>In Progress (5h)</span>
</div>
</div>
</div>
{/*  Thu  */}
<div className="flex flex-col gap-1 min-h-[90px] p-1 bg-surface-container-low rounded">
<div className="group relative flex flex-col p-2 bg-surface-container rounded cursor-grab hover:bg-surface-container-high transition-all shadow-sm">
<div className="flex items-center justify-between mb-1">
<span className="px-1.5 py-0.2 text-[10px] font-label-badge bg-secondary-container/40 text-secondary-fixed rounded font-mono">ENG-219</span>
<span className="font-label-code text-[10px] text-outline">8h</span>
</div>
<p className="font-headline-sm text-[12px] text-on-surface leading-tight font-medium line-clamp-2">Dynamic Memory Leak Hunting</p>
<div className="flex items-center gap-1 mt-2 text-[10px] text-outline">
<span className="material-symbols-outlined text-[12px]">schedule</span>
<span>Scheduled</span>
</div>
</div>
</div>
{/*  Fri  */}
<div className="flex flex-col gap-1 min-h-[90px] p-1 bg-surface-container-low rounded">
<div className="group relative flex flex-col p-2 bg-surface-container rounded cursor-grab hover:bg-surface-container-high transition-all shadow-sm">
<div className="flex items-center justify-between mb-1">
<span className="px-1.5 py-0.2 text-[10px] font-label-badge bg-secondary-container/40 text-secondary-fixed rounded font-mono">ENG-222</span>
<span className="font-label-code text-[10px] text-outline">8h</span>
</div>
<p className="font-headline-sm text-[12px] text-on-surface leading-tight font-medium line-clamp-2">Architecture Architecture RFC Demo</p>
<div className="flex items-center gap-1 mt-2 text-[10px] text-outline">
<span className="material-symbols-outlined text-[12px]">schedule</span>
<span>Scheduled</span>
</div>
</div>
</div>
</div>
</div>
{/*  MEMBER ROW 3: Azahra Ge  */}
<div className="grid grid-cols-12 p-space-md items-start bg-surface-container-lowest hover:bg-surface-container-low/40 transition-colors">
{/*  Profile & Capacity  */}
<div className="col-span-12 lg:col-span-3 flex flex-col justify-between pr-4 mb-4 lg:mb-0">
<div className="flex items-center gap-space-sm mb-2">
<div className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center text-secondary font-semibold text-body-sm">
              AG
            </div>
<div className="flex flex-col min-w-0">
<span className="font-headline-sm text-body-sm text-on-surface font-medium truncate">Azahra Ge</span>
<span className="font-body-sm text-[11px] text-outline truncate">Product Designer</span>
</div>
</div>
<div className="flex flex-col gap-1 w-full bg-surface-container p-2 rounded">
<div className="flex justify-between items-center text-body-sm font-label-code">
<span className="text-on-surface-variant text-[11px]">32h / 40h</span>
<span className="text-secondary font-semibold text-[11px]">80%</span>
</div>
<div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
<div className="bg-secondary h-full rounded-full" style={{width: "80%"}}></div>
</div>
</div>
</div>
{/*  5 Days Time Slots  */}
<div className="col-span-12 lg:col-span-9 grid grid-cols-1 sm:grid-cols-5 gap-2">
{/*  Mon  */}
<div className="flex flex-col gap-1 min-h-[90px] p-1 bg-surface-container-low rounded">
<div className="group relative flex flex-col p-2 bg-surface-container rounded cursor-grab hover:bg-surface-container-high transition-all shadow-sm">
<div className="flex items-center justify-between mb-1">
<span className="px-1.5 py-0.2 text-[10px] font-label-badge bg-primary-container/20 text-primary rounded font-mono">DES-80</span>
<span className="font-label-code text-[10px] text-outline">8h</span>
</div>
<p className="font-headline-sm text-[12px] text-on-surface leading-tight font-medium line-clamp-2">Figma Component Tokens Audit</p>
<div className="flex items-center gap-1 mt-2 text-[10px] text-outline">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
<span>Logged 8h</span>
</div>
</div>
</div>
{/*  Tue  */}
<div className="flex flex-col gap-1 min-h-[90px] p-1 bg-surface-container-low rounded">
<div className="group relative flex flex-col p-2 bg-surface-container rounded cursor-grab hover:bg-surface-container-high transition-all shadow-sm">
<div className="flex items-center justify-between mb-1">
<span className="px-1.5 py-0.2 text-[10px] font-label-badge bg-primary-container/20 text-primary rounded font-mono">DES-82</span>
<span className="font-label-code text-[10px] text-outline">8h</span>
</div>
<p className="font-headline-sm text-[12px] text-on-surface leading-tight font-medium line-clamp-2">Dark Elevation Contrast Audit</p>
<div className="flex items-center gap-1 mt-2 text-[10px] text-outline">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
<span>Logged 8h</span>
</div>
</div>
</div>
{/*  Wed  */}
<div className="flex flex-col gap-1 min-h-[90px] p-1 bg-surface-container rounded">
<div className="group relative flex flex-col p-2 bg-surface-container-high rounded cursor-grab hover:bg-surface-container-highest transition-all shadow-sm">
<div className="flex items-center justify-between mb-1">
<span className="px-1.5 py-0.2 text-[10px] font-label-badge bg-primary-container/20 text-primary rounded font-mono">DES-84</span>
<span className="font-label-code text-[10px] text-primary">8h</span>
</div>
<p className="font-headline-sm text-[12px] text-on-surface leading-tight font-medium line-clamp-2">Navigation Rail Micro-Interactions</p>
<div className="flex items-center gap-1 mt-2 text-[10px] text-primary">
<span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
<span>In Progress (6h)</span>
</div>
</div>
</div>
{/*  Thu  */}
<div className="flex flex-col gap-1 min-h-[90px] p-1 bg-surface-container-low rounded">
<div className="group relative flex flex-col p-2 bg-surface-container rounded cursor-grab hover:bg-surface-container-high transition-all shadow-sm">
<div className="flex items-center justify-between mb-1">
<span className="px-1.5 py-0.2 text-[10px] font-label-badge bg-primary-container/20 text-primary rounded font-mono">DES-89</span>
<span className="font-label-code text-[10px] text-outline">8h</span>
</div>
<p className="font-headline-sm text-[12px] text-on-surface leading-tight font-medium line-clamp-2">UX Usability Testing Synthesis</p>
<div className="flex items-center gap-1 mt-2 text-[10px] text-outline">
<span className="material-symbols-outlined text-[12px]">schedule</span>
<span>Scheduled</span>
</div>
</div>
</div>
{/*  Fri (Open capacity)  */}
<div className="flex flex-col gap-1 min-h-[90px] p-2 bg-surface-container-low rounded border border-dashed border-outline-variant/30 items-center justify-center text-center cursor-pointer hover:bg-surface-container transition-colors">
<span className="material-symbols-outlined text-outline text-[18px]">add</span>
<span className="font-label-code text-[10px] text-primary font-medium mt-1">Available (8h)</span>
<span className="font-body-sm text-[10px] text-outline">Drop task here</span>
</div>
</div>
</div>
{/*  MEMBER ROW 4: Alex Nazeer  */}
<div className="grid grid-cols-12 p-space-md items-start bg-surface-container-lowest hover:bg-surface-container-low/40 transition-colors">
{/*  Profile & Capacity  */}
<div className="col-span-12 lg:col-span-3 flex flex-col justify-between pr-4 mb-4 lg:mb-0">
<div className="flex items-center gap-space-sm mb-2">
<div className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center text-tertiary-fixed font-semibold text-body-sm">
              AN
            </div>
<div className="flex flex-col min-w-0">
<span className="font-headline-sm text-body-sm text-on-surface font-medium truncate">Alex Nazeer</span>
<span className="font-body-sm text-[11px] text-outline truncate">Fullstack Eng</span>
</div>
</div>
<div className="flex flex-col gap-1 w-full bg-surface-container p-2 rounded">
<div className="flex justify-between items-center text-body-sm font-label-code">
<span className="text-on-surface-variant text-[11px]">28h / 40h</span>
<span className="text-on-surface font-semibold text-[11px]">70%</span>
</div>
<div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
<div className="bg-primary-container h-full rounded-full" style={{width: "70%"}}></div>
</div>
</div>
</div>
{/*  5 Days Time Slots  */}
<div className="col-span-12 lg:col-span-9 grid grid-cols-1 sm:grid-cols-5 gap-2">
{/*  Mon  */}
<div className="flex flex-col gap-1 min-h-[90px] p-1 bg-surface-container-low rounded">
<div className="group relative flex flex-col p-2 bg-surface-container rounded cursor-grab hover:bg-surface-container-high transition-all shadow-sm">
<div className="flex items-center justify-between mb-1">
<span className="px-1.5 py-0.2 text-[10px] font-label-badge bg-tertiary-container/30 text-tertiary-fixed rounded font-mono">API-19</span>
<span className="font-label-code text-[10px] text-outline">8h</span>
</div>
<p className="font-headline-sm text-[12px] text-on-surface leading-tight font-medium line-clamp-2">PostgreSQL Read Replica Query Opt</p>
<div className="flex items-center gap-1 mt-2 text-[10px] text-outline">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
<span>Logged 8h</span>
</div>
</div>
</div>
{/*  Tue  */}
<div className="flex flex-col gap-1 min-h-[90px] p-1 bg-surface-container-low rounded">
<div className="group relative flex flex-col p-2 bg-surface-container rounded cursor-grab hover:bg-surface-container-high transition-all shadow-sm">
<div className="flex items-center justify-between mb-1">
<span className="px-1.5 py-0.2 text-[10px] font-label-badge bg-tertiary-container/30 text-tertiary-fixed rounded font-mono">API-23</span>
<span className="font-label-code text-[10px] text-outline">6h</span>
</div>
<p className="font-headline-sm text-[12px] text-on-surface leading-tight font-medium line-clamp-2">Redis Event Pipeline Ingestion</p>
<div className="flex items-center gap-1 mt-2 text-[10px] text-outline">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
<span>Logged 6h</span>
</div>
</div>
<div className="p-1 rounded bg-surface-container/40 text-center">
<span className="font-label-code text-[10px] text-outline">+2h Free</span>
</div>
</div>
{/*  Wed  */}
<div className="flex flex-col gap-1 min-h-[90px] p-1 bg-surface-container rounded">
<div className="group relative flex flex-col p-2 bg-surface-container-high rounded cursor-grab hover:bg-surface-container-highest transition-all shadow-sm">
<div className="flex items-center justify-between mb-1">
<span className="px-1.5 py-0.2 text-[10px] font-label-badge bg-tertiary-container/30 text-tertiary-fixed rounded font-mono">API-25</span>
<span className="font-label-code text-[10px] text-primary">6h</span>
</div>
<p className="font-headline-sm text-[12px] text-on-surface leading-tight font-medium line-clamp-2">Webhooks Retry Backoff Logic</p>
<div className="flex items-center gap-1 mt-2 text-[10px] text-primary">
<span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
<span>In Progress (4h)</span>
</div>
</div>
<div className="p-1 rounded bg-surface-container/40 text-center">
<span className="font-label-code text-[10px] text-outline">+2h Free</span>
</div>
</div>
{/*  Thu  */}
<div className="flex flex-col gap-1 min-h-[90px] p-1 bg-surface-container-low rounded">
<div className="group relative flex flex-col p-2 bg-surface-container rounded cursor-grab hover:bg-surface-container-high transition-all shadow-sm">
<div className="flex items-center justify-between mb-1">
<span className="px-1.5 py-0.2 text-[10px] font-label-badge bg-tertiary-container/30 text-tertiary-fixed rounded font-mono">API-30</span>
<span className="font-label-code text-[10px] text-outline">8h</span>
</div>
<p className="font-headline-sm text-[12px] text-on-surface leading-tight font-medium line-clamp-2">OAuth2 Token Rotation Endpoint</p>
<div className="flex items-center gap-1 mt-2 text-[10px] text-outline">
<span className="material-symbols-outlined text-[12px]">schedule</span>
<span>Scheduled</span>
</div>
</div>
</div>
{/*  Fri  */}
<div className="flex flex-col gap-1 min-h-[90px] p-2 bg-surface-container-low rounded border border-dashed border-outline-variant/30 items-center justify-center text-center cursor-pointer hover:bg-surface-container transition-colors">
<span className="material-symbols-outlined text-outline text-[18px]">add</span>
<span className="font-label-code text-[10px] text-primary font-medium mt-1">Available (8h)</span>
<span className="font-body-sm text-[10px] text-outline">Drop task here</span>
</div>
</div>
</div>
</div>
{/*  Bottom Section: Unscheduled Tasks Backlog (Draggable Drawer / Ready Queue)  */}
<div className="flex flex-col bg-surface-container-lowest p-space-md rounded-lg shadow-sm gap-space-md">
<div className="flex items-center justify-between">
<div className="flex items-center gap-space-sm">
<div className="flex items-center justify-center w-5 h-5 rounded bg-surface-container text-primary">
<span className="material-symbols-outlined text-[15px]">inventory_2</span>
</div>
<span className="font-headline-sm text-body-md text-on-surface font-semibold">Unscheduled Tasks Backlog</span>
<span className="font-label-badge text-label-badge px-2 py-0.5 rounded bg-surface-container-high text-outline">5 items</span>
</div>
<div className="flex items-center gap-space-sm">
<span className="font-body-sm text-[11px] text-outline hidden sm:inline">Drag blocks onto calendar slots to assign</span>
<button className="text-body-sm text-primary hover:text-primary-fixed flex items-center gap-1 font-medium transition-colors" type="button">
<span>View All Backlog</span>
<span className="material-symbols-outlined text-[14px]">arrow_forward</span>
</button>
</div>
</div>
{/*  Drag Pool Cards Grid  */}
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-space-sm">
{/*  Item 1  */}
<div className="flex flex-col p-space-sm bg-surface-container-low hover:bg-surface-container rounded cursor-grab active:cursor-grabbing transition-all border border-transparent hover:border-outline-variant/40 group">
<div className="flex items-center justify-between mb-1.5">
<span className="px-1.5 py-0.2 text-[10px] font-label-badge bg-primary-container/20 text-primary rounded font-mono">SCR-118</span>
<span className="font-label-code text-[10px] text-outline bg-surface-container-high px-1 rounded">Est: 4h</span>
</div>
<span className="font-headline-sm text-[12px] text-on-surface font-medium line-clamp-2 group-hover:text-primary transition-colors">
            Workspace Permission Scopes Audit
          </span>
<div className="flex items-center justify-between mt-2 pt-2 border-t border-outline-variant/20 text-[10px] text-outline">
<span className="flex items-center gap-1">
<span className="material-symbols-outlined text-[12px]">drag_indicator</span>
<span>Priority: High</span>
</span>
<span className="text-tertiary">Product</span>
</div>
</div>
{/*  Item 2  */}
<div className="flex flex-col p-space-sm bg-surface-container-low hover:bg-surface-container rounded cursor-grab active:cursor-grabbing transition-all border border-transparent hover:border-outline-variant/40 group">
<div className="flex items-center justify-between mb-1.5">
<span className="px-1.5 py-0.2 text-[10px] font-label-badge bg-secondary-container/30 text-secondary-fixed rounded font-mono">ENG-240</span>
<span className="font-label-code text-[10px] text-outline bg-surface-container-high px-1 rounded">Est: 8h</span>
</div>
<span className="font-headline-sm text-[12px] text-on-surface font-medium line-clamp-2 group-hover:text-primary transition-colors">
            SSR Bundle Splitting for Command Bar
          </span>
<div className="flex items-center justify-between mt-2 pt-2 border-t border-outline-variant/20 text-[10px] text-outline">
<span className="flex items-center gap-1">
<span className="material-symbols-outlined text-[12px]">drag_indicator</span>
<span>Priority: Urgent</span>
</span>
<span className="text-secondary">Core Web</span>
</div>
</div>
{/*  Item 3  */}
<div className="flex flex-col p-space-sm bg-surface-container-low hover:bg-surface-container rounded cursor-grab active:cursor-grabbing transition-all border border-transparent hover:border-outline-variant/40 group">
<div className="flex items-center justify-between mb-1.5">
<span className="px-1.5 py-0.2 text-[10px] font-label-badge bg-tertiary-container/30 text-tertiary-fixed rounded font-mono">API-44</span>
<span className="font-label-code text-[10px] text-outline bg-surface-container-high px-1 rounded">Est: 6h</span>
</div>
<span className="font-headline-sm text-[12px] text-on-surface font-medium line-clamp-2 group-hover:text-primary transition-colors">
            Rate Limiter Middleware for External Hooks
          </span>
<div className="flex items-center justify-between mt-2 pt-2 border-t border-outline-variant/20 text-[10px] text-outline">
<span className="flex items-center gap-1">
<span className="material-symbols-outlined text-[12px]">drag_indicator</span>
<span>Priority: Med</span>
</span>
<span className="text-tertiary-fixed">Backend</span>
</div>
</div>
{/*  Item 4  */}
<div className="flex flex-col p-space-sm bg-surface-container-low hover:bg-surface-container rounded cursor-grab active:cursor-grabbing transition-all border border-transparent hover:border-outline-variant/40 group">
<div className="flex items-center justify-between mb-1.5">
<span className="px-1.5 py-0.2 text-[10px] font-label-badge bg-primary-container/20 text-primary rounded font-mono">DES-95</span>
<span className="font-label-code text-[10px] text-outline bg-surface-container-high px-1 rounded">Est: 4h</span>
</div>
<span className="font-headline-sm text-[12px] text-on-surface font-medium line-clamp-2 group-hover:text-primary transition-colors">
            Empty State Illustrations &amp; Micro-copy
          </span>
<div className="flex items-center justify-between mt-2 pt-2 border-t border-outline-variant/20 text-[10px] text-outline">
<span className="flex items-center gap-1">
<span className="material-symbols-outlined text-[12px]">drag_indicator</span>
<span>Priority: Low</span>
</span>
<span className="text-primary">Design</span>
</div>
</div>
{/*  Item 5  */}
<div className="flex flex-col p-space-sm bg-surface-container-low hover:bg-surface-container rounded cursor-grab active:cursor-grabbing transition-all border border-transparent hover:border-outline-variant/40 group">
<div className="flex items-center justify-between mb-1.5">
<span className="px-1.5 py-0.2 text-[10px] font-label-badge bg-secondary-container/30 text-secondary-fixed rounded font-mono">ENG-255</span>
<span className="font-label-code text-[10px] text-outline bg-surface-container-high px-1 rounded">Est: 6h</span>
</div>
<span className="font-headline-sm text-[12px] text-on-surface font-medium line-clamp-2 group-hover:text-primary transition-colors">
            Keybinding Listeners Cleanup on Blur
          </span>
<div className="flex items-center justify-between mt-2 pt-2 border-t border-outline-variant/20 text-[10px] text-outline">
<span className="flex items-center gap-1">
<span className="material-symbols-outlined text-[12px]">drag_indicator</span>
<span>Priority: Med</span>
</span>
<span className="text-secondary">Core Web</span>
</div>
</div>
</div>
</div>
</div>
</div>

    </div>
  );
}
