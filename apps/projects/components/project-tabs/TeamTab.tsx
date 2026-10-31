"use client";

import Link from "next/link";
import React, { useState } from "react";

export function TeamTab() {
  return (
    <div className="flex flex-col w-full">
<div className="flex flex-col gap-space-lg w-full py-space-md">
{/*  Top Meta & Controls Header  */}
<div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md bg-surface-container-low p-space-lg rounded-lg shadow-sm">
<div className="flex flex-col gap-space-xs">
<div className="flex items-center gap-space-sm font-label-code text-label-code text-outline">
<span className="hover:text-on-surface cursor-pointer transition-colors">Projects</span>
<span>/</span>
<span className="text-primary font-medium">PRJ-204</span>
<span>/</span>
<span className="text-on-surface">Nexus 2.0 Redesign</span>
</div>
<div className="flex flex-wrap items-center gap-space-sm mt-1">
<h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-semibold">Nexus 2.0 Redesign</h1>
<div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-surface-container-highest text-primary font-label-badge text-label-badge">
<span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
<span>Live Pipeline</span>
</div>
<div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface-container font-label-badge text-label-badge text-on-surface-variant">
<span className="material-symbols-outlined text-[14px] text-error">priority_high</span>
<span>High Priority</span>
</div>
<div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface-container font-label-badge text-label-badge text-outline">
<span className="material-symbols-outlined text-[14px]">calendar_today</span>
<span>Oct 29, 2024</span>
</div>
<div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface-container-high text-primary font-label-badge text-label-badge">
<span className="material-symbols-outlined text-[14px] text-primary" style={{fontVariationSettings: "\'FILL\' 1"}}>verified</span>
<span>94% Health</span>
</div>
</div>
</div>
<div className="flex items-center flex-wrap gap-space-sm">
<button className="h-8 px-space-sm bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg font-body-sm text-body-sm flex items-center gap-1.5 transition-colors" type="button">
<span className="material-symbols-outlined text-[16px] text-outline">ios_share</span>
<span>Share</span>
</button>
<button className="h-8 px-space-sm bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg font-body-sm text-body-sm flex items-center gap-1.5 transition-colors" onClick={() => { if (typeof navigator !== "undefined") navigator.clipboard?.writeText(window.location.href); }} type="button">
<span className="material-symbols-outlined text-[16px] text-outline">link</span>
<span>Copy URL</span>
</button>
<button className="h-8 px-space-sm bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg font-body-sm text-body-sm flex items-center gap-1.5 transition-colors" type="button">
<span className="material-symbols-outlined text-[16px] text-outline">edit_document</span>
<span>Edit Spec</span>
</button>
<button className="h-8 px-space-md bg-primary-container hover:bg-primary-container/90 text-on-primary-container rounded-lg font-body-sm text-body-sm font-medium flex items-center gap-1.5 transition-colors shadow-sm" type="button">
<span className="material-symbols-outlined text-[16px]">add_circle</span>
<span>New Issue</span>
<kbd className="font-label-kbd text-label-kbd bg-surface-container-lowest/40 px-1 py-0.2 rounded text-on-primary-container">N</kbd>
</button>
</div>
</div>
{/*  Quick Metrics Deck  */}
<div className="grid grid-cols-2 md:grid-cols-5 gap-space-sm w-full">
<div className="bg-surface-container-low p-space-md rounded-lg flex flex-col justify-between shadow-sm">
<div className="flex items-center justify-between text-outline font-label-badge text-label-badge uppercase tracking-wider">
<span>Execution State</span>
<span className="material-symbols-outlined text-[16px] text-primary">donut_large</span>
</div>
<div className="mt-2 flex items-baseline gap-2">
<span className="font-headline-md text-headline-md text-on-surface font-semibold">68%</span>
<span className="font-body-sm text-body-sm text-outline font-label-code">42/62 Tasks</span>
</div>
<div className="w-full bg-surface-container-highest h-1 rounded-full mt-2 overflow-hidden">
<div className="bg-primary-container h-full rounded-full" style={{width: "68%"}}></div>
</div>
</div>
<div className="bg-surface-container-low p-space-md rounded-lg flex flex-col justify-between shadow-sm">
<div className="flex items-center justify-between text-outline font-label-badge text-label-badge uppercase tracking-wider">
<span>Active Sprint</span>
<span className="material-symbols-outlined text-[16px] text-primary">reorder</span>
</div>
<div className="mt-2 flex items-baseline gap-2">
<span className="font-headline-md text-headline-md text-on-surface font-semibold">Sprint 14</span>
<span className="font-body-sm text-body-sm text-outline font-label-code">4d left</span>
</div>
<div className="flex items-center gap-1 mt-2 text-primary font-label-code text-[11px]">
<span className="material-symbols-outlined text-[13px]">bolt</span>
<span>26 Velocity Pts</span>
</div>
</div>
<div className="bg-surface-container-low p-space-md rounded-lg flex flex-col justify-between shadow-sm">
<div className="flex items-center justify-between text-outline font-label-badge text-label-badge uppercase tracking-wider">
<span>Hours Logged</span>
<span className="material-symbols-outlined text-[16px] text-primary">schedule</span>
</div>
<div className="mt-2 flex items-baseline gap-2">
<span className="font-headline-md text-headline-md text-on-surface font-semibold">142h</span>
<span className="font-body-sm text-body-sm text-outline font-label-code">/ 180h target</span>
</div>
<div className="flex items-center gap-1 mt-2 text-outline font-label-code text-[11px]">
<span className="material-symbols-outlined text-[13px] text-primary">trending_up</span>
<span>+18.4h this cycle</span>
</div>
</div>
<div className="bg-surface-container-low p-space-md rounded-lg flex flex-col justify-between shadow-sm">
<div className="flex items-center justify-between text-outline font-label-badge text-label-badge uppercase tracking-wider">
<span>Cap Utilization</span>
<span className="material-symbols-outlined text-[16px] text-primary">attach_money</span>
</div>
<div className="mt-2 flex items-baseline gap-2">
<span className="font-headline-md text-headline-md text-on-surface font-semibold">$19,880</span>
<span className="font-body-sm text-body-sm text-outline font-label-code">/ $29.4k</span>
</div>
<div className="w-full bg-surface-container-highest h-1 rounded-full mt-2 overflow-hidden">
<div className="bg-primary h-full rounded-full" style={{width: "67.6%"}}></div>
</div>
</div>
<div className="bg-surface-container-low p-space-md rounded-lg flex flex-col justify-between shadow-sm col-span-2 md:col-span-1">
<div className="flex items-center justify-between text-outline font-label-badge text-label-badge uppercase tracking-wider">
<span>Squad Roster</span>
<span className="material-symbols-outlined text-[16px] text-primary">group</span>
</div>
<div className="mt-2 flex items-baseline gap-2">
<span className="font-headline-md text-headline-md text-on-surface font-semibold">6 Members</span>
<span className="font-body-sm text-body-sm text-outline font-label-code">2 Guests</span>
</div>
<div className="flex -space-x-1.5 mt-2 overflow-hidden">
<div className="inline-block h-5 w-5 rounded-full bg-primary-container text-on-primary-container font-label-kbd text-[10px] flex items-center justify-center font-bold">ER</div>
<div className="inline-block h-5 w-5 rounded-full bg-secondary-container text-on-secondary-container font-label-kbd text-[10px] flex items-center justify-center font-bold">MK</div>
<div className="inline-block h-5 w-5 rounded-full bg-surface-container-high text-on-surface font-label-kbd text-[10px] flex items-center justify-center font-bold">TL</div>
<div className="inline-block h-5 w-5 rounded-full bg-surface-container-highest text-primary font-label-kbd text-[10px] flex items-center justify-center font-bold">+3</div>
</div>
</div>
</div>
{/*  Project Sub-Tabs Nav Rail  */}
<div className="flex items-center justify-between bg-surface-container-lowest px-space-sm pt-space-xs rounded-lg overflow-x-auto shadow-sm">
<nav className="flex items-center gap-space-xs font-body-sm text-body-sm">
<button className="px-space-md py-2 text-outline hover:text-on-surface hover:bg-surface-container rounded-t-lg transition-colors flex items-center gap-1.5" type="button">
<span className="material-symbols-outlined text-[15px]">dashboard</span>
<span>Overview</span>
</button>
<button className="px-space-md py-2 text-outline hover:text-on-surface hover:bg-surface-container rounded-t-lg transition-colors flex items-center gap-1.5" type="button">
<span className="material-symbols-outlined text-[15px]">check_box</span>
<span>Issues</span>
<span className="px-1.5 py-0.2 bg-surface-container text-outline rounded font-label-code text-[10px]">58</span>
</button>
<button className="px-space-md py-2 text-outline hover:text-on-surface hover:bg-surface-container rounded-t-lg transition-colors flex items-center gap-1.5" type="button">
<span className="material-symbols-outlined text-[15px]">cycle</span>
<span>Cycles &amp; Sprints</span>
</button>
<button className="px-space-md py-2 text-outline hover:text-on-surface hover:bg-surface-container rounded-t-lg transition-colors flex items-center gap-1.5" type="button">
<span className="material-symbols-outlined text-[15px]">flag</span>
<span>Milestones</span>
<span className="px-1.5 py-0.2 bg-surface-container text-outline rounded font-label-code text-[10px]">4</span>
</button>
<button className="px-space-md py-2 text-outline hover:text-on-surface hover:bg-surface-container rounded-t-lg transition-colors flex items-center gap-1.5" type="button">
<span className="material-symbols-outlined text-[15px]">description</span>
<span>Documents &amp; RFCs</span>
<span className="px-1.5 py-0.2 bg-surface-container text-outline rounded font-label-code text-[10px]">6</span>
</button>
{/*  ACTIVE TAB  */}
<button className="px-space-md py-2 text-on-surface bg-surface-container-high rounded-t-lg font-medium flex items-center gap-1.5 relative shadow-sm" type="button">
<span className="material-symbols-outlined text-[15px] text-primary" style={{fontVariationSettings: "\'FILL\' 1"}}>shield_person</span>
<span>Team &amp; Access</span>
<span className="w-1.5 h-1.5 rounded-full bg-primary ml-1"></span>
</button>
<button className="px-space-md py-2 text-outline hover:text-on-surface hover:bg-surface-container rounded-t-lg transition-colors flex items-center gap-1.5" type="button">
<span className="material-symbols-outlined text-[15px]">monitoring</span>
<span>Analytics &amp; Telemetry</span>
</button>
</nav>
<div className="hidden lg:flex items-center gap-2 pb-1 pr-2">
<span className="font-label-code text-[11px] text-outline">Branch lock:</span>
<span className="px-2 py-0.5 rounded bg-surface-container text-primary font-label-code text-[11px]">release/2.0</span>
</div>
</div>
{/*  Active Workspace: Team & Access  */}
<div className="flex flex-col gap-space-lg w-full">
{/*  Section 1: Squad Controls Bar & Cost Telemetry  */}
<div className="bg-surface-container-low p-space-lg rounded-lg shadow-sm flex flex-col lg:flex-row justify-between lg:items-center gap-space-md">
<div className="flex flex-col gap-1">
<div className="flex items-center gap-space-sm">
<h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight">Project Squad &amp; Permissions</h2>
<span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-badge text-label-badge">6 Members Assigned</span>
<span className="px-2 py-0.5 rounded bg-surface-container-highest text-outline font-label-badge text-label-badge">2 External Guests</span>
</div>
<div className="flex flex-wrap items-center gap-space-md text-outline font-body-sm text-body-sm mt-1">
<div className="flex items-center gap-1.5">
<span className="material-symbols-outlined text-[15px] text-primary">payments</span>
<span>Budget Cap:</span>
<span className="font-label-code text-on-surface font-medium">$19,880 spent</span>
<span>/ $29,400 cap</span>
</div>
<span>•</span>
<div className="flex items-center gap-1.5">
<span className="material-symbols-outlined text-[15px] text-outline">speed</span>
<span>Blended Burn:</span>
<span className="font-label-code text-on-surface font-medium">$140/hr</span>
</div>
<span>•</span>
<div className="flex items-center gap-1 text-primary">
<span className="material-symbols-outlined text-[14px]">lock</span>
<span className="font-label-code text-[11px]">SOC-2 Enforced Scope</span>
</div>
</div>
</div>
<div className="flex items-center flex-wrap gap-space-sm">
<button className="h-8 px-space-sm bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg font-body-sm text-body-sm flex items-center gap-1.5 transition-colors" type="button">
<span className="material-symbols-outlined text-[16px] text-outline">history</span>
<span>Export Access Audit</span>
</button>
<button className="h-8 px-space-sm bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg font-body-sm text-body-sm flex items-center gap-1.5 transition-colors" type="button">
<span className="material-symbols-outlined text-[16px] text-outline">policy</span>
<span>Security Policies</span>
</button>
<button className="h-8 px-space-md bg-primary-container hover:bg-primary-container/90 text-on-primary-container rounded-lg font-body-sm text-body-sm font-medium flex items-center gap-1.5 shadow-sm transition-colors" type="button">
<span className="material-symbols-outlined text-[16px]">person_add</span>
<span>+ Invite Member</span>
</button>
</div>
</div>
{/*  Section 2: Team Members Table  */}
<div className="bg-surface-container-low rounded-lg shadow-sm overflow-hidden flex flex-col">
<div className="px-space-md py-space-sm bg-surface-container-lowest flex items-center justify-between">
<div className="flex items-center gap-space-md">
<span className="font-label-badge text-label-badge text-outline uppercase tracking-wider">Active Core Squad</span>
<div className="flex items-center gap-1 text-primary font-label-code text-[11px]">
<span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
<span>All 6 Members Verified</span>
</div>
</div>
<div className="flex items-center gap-space-sm">
<span className="font-label-kbd text-label-kbd text-outline">Sprint 14 Window: Nov 4 – Nov 18</span>
</div>
</div>
<div className="overflow-x-auto w-full">
<table className="w-full text-left font-body-sm text-body-sm">
<thead className="bg-surface-container-lowest text-outline font-label-badge text-label-badge uppercase tracking-wider">
<tr>
<th className="py-2.5 px-space-md">Member</th>
<th className="py-2.5 px-space-md">Project Role</th>
<th className="py-2.5 px-space-md">Access Level</th>
<th className="py-2.5 px-space-md text-center">Assigned Issues</th>
<th className="py-2.5 px-space-md">Sprint 14 Capacity</th>
<th className="py-2.5 px-space-md">2FA / SOC-2</th>
<th className="py-2.5 px-space-md">Last Active</th>
<th className="py-2.5 px-space-md text-right">Actions</th>
</tr>
</thead>
<tbody className="divide-y-0">
{/*  Member 1: Elena Rostova  */}
<tr className="hover:bg-surface-container transition-colors group">
<td className="py-3 px-space-md">
<div className="flex items-center gap-space-sm">
<div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-label-code font-bold text-[12px] shrink-0">
                      ER
                    </div>
<div className="flex flex-col min-w-0">
<span className="font-headline-sm text-headline-sm text-on-surface truncate">Elena Rostova</span>
<span className="font-label-code text-[11px] text-outline truncate">elena.r@nexus.internal</span>
</div>
</div>
</td>
<td className="py-3 px-space-md text-on-surface-variant font-medium">Staff Architect &amp; Tech Lead</td>
<td className="py-3 px-space-md">
<span className="px-2 py-0.5 rounded bg-primary-container/20 text-primary font-label-badge text-label-badge font-semibold">Lead / Admin</span>
</td>
<td className="py-3 px-space-md text-center">
<span className="font-label-code text-on-surface bg-surface-container px-2 py-0.5 rounded">14 issues</span>
</td>
<td className="py-3 px-space-md">
<div className="flex flex-col gap-1 w-36">
<div className="flex justify-between font-label-code text-[11px] text-on-surface">
<span>38h / 40h</span>
<span className="text-primary font-medium">95%</span>
</div>
<div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
<div className="bg-primary-container h-full rounded-full" style={{width: "95%"}}></div>
</div>
</div>
</td>
<td className="py-3 px-space-md">
<div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-container font-label-code text-[11px] text-on-surface">
<span className="material-symbols-outlined text-[13px] text-primary" style={{fontVariationSettings: "\'FILL\' 1"}}>security</span>
<span>Enforced</span>
</div>
</td>
<td className="py-3 px-space-md">
<div className="flex items-center gap-1.5 text-primary font-label-code text-[11px]">
<span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
<span>Active now</span>
</div>
</td>
<td className="py-3 px-space-md text-right">
<button className="p-1 text-outline hover:text-on-surface rounded hover:bg-surface-container-high transition-colors" type="button">
<span className="material-symbols-outlined text-[16px]">more_vert</span>
</button>
</td>
</tr>
{/*  Member 2: Marcus Kane  */}
<tr className="hover:bg-surface-container transition-colors group bg-surface-container-low/50">
<td className="py-3 px-space-md">
<div className="flex items-center gap-space-sm">
<div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-label-code font-bold text-[12px] shrink-0">
                      MK
                    </div>
<div className="flex flex-col min-w-0">
<span className="font-headline-sm text-headline-sm text-on-surface truncate">Marcus Kane</span>
<span className="font-label-code text-[11px] text-outline truncate">marcus.k@nexus.internal</span>
</div>
</div>
</td>
<td className="py-3 px-space-md text-on-surface-variant font-medium">Senior WebGL &amp; Shader Engineer</td>
<td className="py-3 px-space-md">
<span className="px-2 py-0.5 rounded bg-surface-container text-secondary font-label-badge text-label-badge">Maintainer</span>
</td>
<td className="py-3 px-space-md text-center">
<span className="font-label-code text-on-surface bg-surface-container px-2 py-0.5 rounded">11 issues</span>
</td>
<td className="py-3 px-space-md">
<div className="flex flex-col gap-1 w-36">
<div className="flex justify-between font-label-code text-[11px] text-on-surface">
<span>40h / 40h</span>
<span className="text-error font-medium">100% (Cap)</span>
</div>
<div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
<div className="bg-error h-full rounded-full" style={{width: "100%"}}></div>
</div>
</div>
</td>
<td className="py-3 px-space-md">
<div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-container font-label-code text-[11px] text-on-surface">
<span className="material-symbols-outlined text-[13px] text-primary" style={{fontVariationSettings: "\'FILL\' 1"}}>security</span>
<span>Enforced</span>
</div>
</td>
<td className="py-3 px-space-md">
<span className="text-outline font-label-code text-[11px]">14m ago</span>
</td>
<td className="py-3 px-space-md text-right">
<button className="p-1 text-outline hover:text-on-surface rounded hover:bg-surface-container-high transition-colors" type="button">
<span className="material-symbols-outlined text-[16px]">more_vert</span>
</button>
</td>
</tr>
{/*  Member 3: Tanya Liu  */}
<tr className="hover:bg-surface-container transition-colors group">
<td className="py-3 px-space-md">
<div className="flex items-center gap-space-sm">
<div className="w-8 h-8 rounded-full bg-surface-container-highest text-on-surface flex items-center justify-center font-label-code font-bold text-[12px] shrink-0">
                      TL
                    </div>
<div className="flex flex-col min-w-0">
<span className="font-headline-sm text-headline-sm text-on-surface truncate">Tanya Liu</span>
<span className="font-label-code text-[11px] text-outline truncate">tanya.l@nexus.internal</span>
</div>
</div>
</td>
<td className="py-3 px-space-md text-on-surface-variant font-medium">Distributed Systems Engineer</td>
<td className="py-3 px-space-md">
<span className="px-2 py-0.5 rounded bg-surface-container text-secondary font-label-badge text-label-badge">Maintainer</span>
</td>
<td className="py-3 px-space-md text-center">
<span className="font-label-code text-on-surface bg-surface-container px-2 py-0.5 rounded">8 issues</span>
</td>
<td className="py-3 px-space-md">
<div className="flex flex-col gap-1 w-36">
<div className="flex justify-between font-label-code text-[11px] text-on-surface">
<span>32h / 40h</span>
<span className="text-on-surface-variant">80%</span>
</div>
<div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
<div className="bg-primary-container h-full rounded-full" style={{width: "80%"}}></div>
</div>
</div>
</td>
<td className="py-3 px-space-md">
<div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-container font-label-code text-[11px] text-on-surface">
<span className="material-symbols-outlined text-[13px] text-primary" style={{fontVariationSettings: "\'FILL\' 1"}}>security</span>
<span>Enforced</span>
</div>
</td>
<td className="py-3 px-space-md">
<span className="text-outline font-label-code text-[11px]">2h ago</span>
</td>
<td className="py-3 px-space-md text-right">
<button className="p-1 text-outline hover:text-on-surface rounded hover:bg-surface-container-high transition-colors" type="button">
<span className="material-symbols-outlined text-[16px]">more_vert</span>
</button>
</td>
</tr>
{/*  Member 4: Alex Nazeer  */}
<tr className="hover:bg-surface-container transition-colors group bg-surface-container-low/50">
<td className="py-3 px-space-md">
<div className="flex items-center gap-space-sm">
<div className="w-8 h-8 rounded-full bg-surface-container-high text-primary font-label-code font-bold text-[12px] flex items-center justify-center shrink-0">
                      AN
                    </div>
<div className="flex flex-col min-w-0">
<span className="font-headline-sm text-headline-sm text-on-surface truncate">Alex Nazeer</span>
<span className="font-label-code text-[11px] text-outline truncate">alex.n@nexus.internal</span>
</div>
</div>
</td>
<td className="py-3 px-space-md text-on-surface-variant font-medium">Fullstack &amp; Canvas Virtualization</td>
<td className="py-3 px-space-md">
<span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-badge text-label-badge">Contributor</span>
</td>
<td className="py-3 px-space-md text-center">
<span className="font-label-code text-on-surface bg-surface-container px-2 py-0.5 rounded">9 issues</span>
</td>
<td className="py-3 px-space-md">
<div className="flex flex-col gap-1 w-36">
<div className="flex justify-between font-label-code text-[11px] text-on-surface">
<span>28h / 40h</span>
<span className="text-on-surface-variant">70%</span>
</div>
<div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
<div className="bg-primary-container h-full rounded-full" style={{width: "70%"}}></div>
</div>
</div>
</td>
<td className="py-3 px-space-md">
<div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-container font-label-code text-[11px] text-on-surface">
<span className="material-symbols-outlined text-[13px] text-primary" style={{fontVariationSettings: "\'FILL\' 1"}}>security</span>
<span>Enforced</span>
</div>
</td>
<td className="py-3 px-space-md">
<span className="text-outline font-label-code text-[11px]">1h ago</span>
</td>
<td className="py-3 px-space-md text-right">
<button className="p-1 text-outline hover:text-on-surface rounded hover:bg-surface-container-high transition-colors" type="button">
<span className="material-symbols-outlined text-[16px]">more_vert</span>
</button>
</td>
</tr>
{/*  Member 5: Azahra Ge  */}
<tr className="hover:bg-surface-container transition-colors group">
<td className="py-3 px-space-md">
<div className="flex items-center gap-space-sm">
<div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-label-code font-bold text-[12px] shrink-0">
                      AG
                    </div>
<div className="flex flex-col min-w-0">
<span className="font-headline-sm text-headline-sm text-on-surface truncate">Azahra Ge</span>
<span className="font-label-code text-[11px] text-outline truncate">azahra.ge@nexus.design</span>
</div>
</div>
</td>
<td className="py-3 px-space-md text-on-surface-variant font-medium">Principal Product Designer</td>
<td className="py-3 px-space-md">
<span className="px-2 py-0.5 rounded bg-surface-container text-secondary font-label-badge text-label-badge">Maintainer</span>
</td>
<td className="py-3 px-space-md text-center">
<span className="font-label-code text-on-surface bg-surface-container px-2 py-0.5 rounded">5 issues</span>
</td>
<td className="py-3 px-space-md">
<div className="flex flex-col gap-1 w-36">
<div className="flex justify-between font-label-code text-[11px] text-on-surface">
<span>25h / 40h</span>
<span className="text-on-surface-variant">62%</span>
</div>
<div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
<div className="bg-primary-container h-full rounded-full" style={{width: "62%"}}></div>
</div>
</div>
</td>
<td className="py-3 px-space-md">
<div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-container font-label-code text-[11px] text-on-surface">
<span className="material-symbols-outlined text-[13px] text-primary" style={{fontVariationSettings: "\'FILL\' 1"}}>security</span>
<span>Enforced</span>
</div>
</td>
<td className="py-3 px-space-md">
<span className="text-outline font-label-code text-[11px]">Yesterday</span>
</td>
<td className="py-3 px-space-md text-right">
<button className="p-1 text-outline hover:text-on-surface rounded hover:bg-surface-container-high transition-colors" type="button">
<span className="material-symbols-outlined text-[16px]">more_vert</span>
</button>
</td>
</tr>
{/*  Member 6: Arbian Musaf  */}
<tr className="hover:bg-surface-container transition-colors group bg-surface-container-low/50">
<td className="py-3 px-space-md">
<div className="flex items-center gap-space-sm">
<div className="w-8 h-8 rounded-full bg-surface-container-highest text-tertiary flex items-center justify-center font-label-code font-bold text-[12px] shrink-0">
                      AM
                    </div>
<div className="flex flex-col min-w-0">
<span className="font-headline-sm text-headline-sm text-on-surface truncate">Arbian Musaf</span>
<span className="font-label-code text-[11px] text-outline truncate">a.musaf@audit-corp.io</span>
</div>
</div>
</td>
<td className="py-3 px-space-md text-on-surface-variant font-medium">Security &amp; Code Reviewer</td>
<td className="py-3 px-space-md">
<span className="px-2 py-0.5 rounded bg-surface-container-highest text-outline font-label-badge text-label-badge">Auditor / Viewer</span>
</td>
<td className="py-3 px-space-md text-center">
<span className="font-label-code text-on-surface bg-surface-container px-2 py-0.5 rounded">4 issues</span>
</td>
<td className="py-3 px-space-md">
<div className="flex flex-col gap-1 w-36">
<div className="flex justify-between font-label-code text-[11px] text-on-surface">
<span>15h / 20h</span>
<span className="text-on-surface-variant">75%</span>
</div>
<div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
<div className="bg-primary-container h-full rounded-full" style={{width: "75%"}}></div>
</div>
</div>
</td>
<td className="py-3 px-space-md">
<div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-container font-label-code text-[11px] text-on-surface">
<span className="material-symbols-outlined text-[13px] text-primary" style={{fontVariationSettings: "\'FILL\' 1"}}>security</span>
<span>Enforced</span>
</div>
</td>
<td className="py-3 px-space-md">
<span className="text-outline font-label-code text-[11px]">3h ago</span>
</td>
<td className="py-3 px-space-md text-right">
<button className="p-1 text-outline hover:text-on-surface rounded hover:bg-surface-container-high transition-colors" type="button">
<span className="material-symbols-outlined text-[16px]">more_vert</span>
</button>
</td>
</tr>
</tbody>
</table>
</div>
</div>
{/*  Section 3 & 4: Linear Permissions Matrix + SSO Audit Security Banner  */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-space-lg w-full">
{/*  Granular Permissions Matrix (2 Cols)  */}
<div className="lg:col-span-2 bg-surface-container-low p-space-lg rounded-lg shadow-sm flex flex-col gap-space-md">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-primary text-[18px]">tune</span>
<h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">PRJ-204 Granular Matrix</h3>
</div>
<span className="font-label-code text-outline text-[11px]">Enforced via GitOps policy #POL-894</span>
</div>
<div className="w-full overflow-x-auto">
<table className="w-full text-left font-body-sm text-body-sm">
<thead className="bg-surface-container text-outline font-label-badge text-label-badge uppercase tracking-wider">
<tr>
<th className="py-2 px-space-md">Permission Scope</th>
<th className="py-2 px-space-sm text-center">Lead / Admin</th>
<th className="py-2 px-space-sm text-center">Maintainer</th>
<th className="py-2 px-space-sm text-center">Contributor</th>
<th className="py-2 px-space-sm text-center">Auditor</th>
</tr>
</thead>
<tbody className="divide-y-0">
<tr className="hover:bg-surface-container-high transition-colors">
<td className="py-2.5 px-space-md text-on-surface flex flex-col">
<span className="font-medium">Branch merge rights</span>
<span className="font-label-code text-[11px] text-outline">main, release/2.0 strict signing</span>
</td>
<td className="py-2.5 px-space-sm text-center text-primary">
<span className="material-symbols-outlined text-[18px]" style={{fontVariationSettings: "\'FILL\' 1"}}>check_circle</span>
</td>
<td className="py-2.5 px-space-sm text-center text-primary">
<span className="material-symbols-outlined text-[18px]" style={{fontVariationSettings: "\'FILL\' 1"}}>check_circle</span>
</td>
<td className="py-2.5 px-space-sm text-center text-outline">
<span className="material-symbols-outlined text-[18px]">remove</span>
</td>
<td className="py-2.5 px-space-sm text-center text-outline">
<span className="material-symbols-outlined text-[18px]">lock</span>
</td>
</tr>
<tr className="hover:bg-surface-container-high transition-colors bg-surface-container-lowest/30">
<td className="py-2.5 px-space-md text-on-surface flex flex-col">
<span className="font-medium">Issue deletion &amp; cycle closure</span>
<span className="font-label-code text-[11px] text-outline">State transition destruction protection</span>
</td>
<td className="py-2.5 px-space-sm text-center text-primary">
<span className="material-symbols-outlined text-[18px]" style={{fontVariationSettings: "\'FILL\' 1"}}>check_circle</span>
</td>
<td className="py-2.5 px-space-sm text-center text-outline">
<span className="material-symbols-outlined text-[18px]">remove</span>
</td>
<td className="py-2.5 px-space-sm text-center text-outline">
<span className="material-symbols-outlined text-[18px]">remove</span>
</td>
<td className="py-2.5 px-space-sm text-center text-outline">
<span className="material-symbols-outlined text-[18px]">lock</span>
</td>
</tr>
<tr className="hover:bg-surface-container-high transition-colors">
<td className="py-2.5 px-space-md text-on-surface flex flex-col">
<span className="font-medium">Client billable time log edits</span>
<span className="font-label-code text-[11px] text-outline">Direct invoice item adjustment</span>
</td>
<td className="py-2.5 px-space-sm text-center text-primary">
<span className="material-symbols-outlined text-[18px]" style={{fontVariationSettings: "\'FILL\' 1"}}>check_circle</span>
</td>
<td className="py-2.5 px-space-sm text-center text-outline">
<span className="material-symbols-outlined text-[18px]">remove</span>
</td>
<td className="py-2.5 px-space-sm text-center text-outline">
<span className="material-symbols-outlined text-[18px]">remove</span>
</td>
<td className="py-2.5 px-space-sm text-center text-outline">
<span className="material-symbols-outlined text-[18px]">visibility</span>
</td>
</tr>
<tr className="hover:bg-surface-container-high transition-colors bg-surface-container-lowest/30">
<td className="py-2.5 px-space-md text-on-surface flex flex-col">
<span className="font-medium">STOMP cluster telemetry access</span>
<span className="font-label-code text-[11px] text-outline">Live WebSocket log tail &amp; traces</span>
</td>
<td className="py-2.5 px-space-sm text-center text-primary">
<span className="material-symbols-outlined text-[18px]" style={{fontVariationSettings: "\'FILL\' 1"}}>check_circle</span>
</td>
<td className="py-2.5 px-space-sm text-center text-primary">
<span className="material-symbols-outlined text-[18px]" style={{fontVariationSettings: "\'FILL\' 1"}}>check_circle</span>
</td>
<td className="py-2.5 px-space-sm text-center text-primary">
<span className="material-symbols-outlined text-[18px]" style={{fontVariationSettings: "\'FILL\' 1"}}>check_circle</span>
</td>
<td className="py-2.5 px-space-sm text-center text-outline">
<span className="material-symbols-outlined text-[18px]">visibility</span>
</td>
</tr>
</tbody>
</table>
</div>
</div>
{/*  Section 4: Security Policy & Audit Telemetry  */}
<div className="bg-surface-container-low p-space-lg rounded-lg shadow-sm flex flex-col justify-between gap-space-md">
<div className="flex flex-col gap-space-sm">
<div className="flex items-center justify-between">
<span className="font-label-badge text-label-badge uppercase tracking-wider text-outline">Access Compliance</span>
<span className="px-2 py-0.5 rounded bg-primary-container text-on-primary-container font-label-code text-[10px] font-semibold">Tier-1 Enforced</span>
</div>
{/*  Okta SSO + YubiKey Policy Box  */}
<div className="bg-surface-container p-space-md rounded-lg flex flex-col gap-2 mt-1">
<div className="flex items-center gap-2 text-on-surface font-headline-sm text-body-lg font-medium">
<span className="material-symbols-outlined text-primary text-[20px]">verified_user</span>
<span>Okta SSO + Hardware YubiKey</span>
</div>
<p className="font-body-sm text-body-sm text-outline">
                Mandatory cryptographic FIDO2 token verification for all git push, pull requests, and telemetry sockets targeting PRJ-204 repository resources.
              </p>
<div className="flex items-center gap-2 mt-1 pt-2 font-label-code text-[11px] text-primary">
<span className="w-2 h-2 rounded-full bg-primary"></span>
<span>Zero Bypass Exceptions Active</span>
</div>
</div>
{/*  Recent Access Audit Entries  */}
<div className="flex flex-col gap-2 mt-2">
<span className="font-label-badge text-label-badge uppercase text-outline">Live Security Log</span>
<div className="flex items-center justify-between p-2 rounded bg-surface-container-lowest text-body-sm">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-[14px] text-primary">key</span>
<div className="flex flex-col">
<span className="font-label-code text-[11px] text-on-surface">elena.r (Admin)</span>
<span className="text-[10px] text-outline font-label-code">Signed release/2.0 tag</span>
</div>
</div>
<span className="text-[10px] text-outline font-label-code">4m ago</span>
</div>
<div className="flex items-center justify-between p-2 rounded bg-surface-container-lowest text-body-sm">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-[14px] text-secondary">login</span>
<div className="flex flex-col">
<span className="font-label-code text-[11px] text-on-surface">marcus.k (Maintainer)</span>
<span className="text-[10px] text-outline font-label-code">WebAuthn challenge PASS</span>
</div>
</div>
<span className="text-[10px] text-outline font-label-code">14m ago</span>
</div>
<div className="flex items-center justify-between p-2 rounded bg-surface-container-lowest text-body-sm">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-[14px] text-outline">sync_alt</span>
<div className="flex flex-col">
<span className="font-label-code text-[11px] text-on-surface">a.musaf (Auditor)</span>
<span className="text-[10px] text-outline font-label-code">Read STOMP trace logs</span>
</div>
</div>
<span className="text-[10px] text-outline font-label-code">3h ago</span>
</div>
</div>
</div>
<button className="w-full py-2 px-space-md bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg font-body-sm text-body-sm flex items-center justify-center gap-1.5 transition-colors" type="button">
<span className="material-symbols-outlined text-[16px] text-primary">manage_history</span>
<span>View Full SOC-2 Immutable Trail</span>
</button>
</div>
</div>
</div>
</div>
    </div>
  );
}
