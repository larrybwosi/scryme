"use client";

import Link from "next/link";
import React, { useState } from "react";

export function AnalyticsTab() {
  return (
    <div className="flex flex-col w-full">
<div className="flex flex-col w-full pb-16">
{/*  Top Ambient Glow Field  */}
<div className="relative w-full">
<div className="absolute -top-10 left-1/4 w-96 h-32 bg-primary-container/10 rounded-full blur-3xl pointer-events-none"></div>
<div className="absolute -top-6 right-1/3 w-80 h-28 bg-secondary-container/10 rounded-full blur-2xl pointer-events-none"></div>
{/*  Project Breadcrumb & Quick Actions Bar  */}
<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md py-space-md">
<div className="flex flex-col gap-1.5 min-w-0">
<div className="flex items-center gap-2 text-outline font-label-code text-label-code">
<span className="hover:text-on-surface cursor-pointer transition-colors">Projects</span>
<span className="text-outline-variant">/</span>
<span className="px-1.5 py-0.5 rounded bg-surface-container-high text-primary font-medium">PRJ-204</span>
<span className="text-outline-variant">/</span>
<span className="text-on-surface truncate font-body-sm font-medium">Nexus 2.0 Redesign</span>
</div>
<div className="flex items-center flex-wrap gap-space-sm pt-0.5">
<h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight mr-2">Nexus 2.0 Redesign</h1>
<span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container-high text-on-primary-container font-label-badge text-label-badge font-medium">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse"></span>
            Live Pipeline
          </span>
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-low text-on-surface-variant font-label-badge text-label-badge">
<span className="material-symbols-outlined text-[12px] text-error">priority_high</span>
            High Priority
          </span>
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-low text-outline font-label-badge text-label-badge">
<span className="material-symbols-outlined text-[12px]">calendar_today</span>
            Oct 29, 2024
          </span>
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-high text-primary font-label-badge text-label-badge">
<span className="material-symbols-outlined text-[12px] text-primary" style={{fontVariationSettings: "\'FILL\' 1"}}>verified</span>
            94% Health
          </span>
</div>
</div>
{/*  Action Button Group  */}
<div className="flex items-center gap-space-xs self-start lg:self-center shrink-0">
<button className="h-8 px-2.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface font-body-sm text-body-sm flex items-center gap-1.5 transition-colors shadow-sm" type="button">
<span className="material-symbols-outlined text-[15px]">share</span>
<span>Share</span>
</button>
<button className="h-8 px-2.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface font-body-sm text-body-sm flex items-center gap-1.5 transition-colors shadow-sm" id="copyUrlBtn" type="button">
<span className="material-symbols-outlined text-[15px]">content_copy</span>
<span id="copyUrlText">Copy URL</span>
</button>
<button className="h-8 px-2.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface font-body-sm text-body-sm flex items-center gap-1.5 transition-colors shadow-sm" type="button">
<span className="material-symbols-outlined text-[15px]">edit_note</span>
<span>Edit Spec</span>
</button>
<div className="h-5 w-px bg-surface-variant mx-1"></div>
<button className="h-8 px-3 rounded bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm flex items-center gap-1.5 shadow-sm transition-all" type="button">
<span className="material-symbols-outlined text-[16px]">add</span>
<span>New Issue</span>
<kbd className="ml-1 px-1 py-0.2 rounded bg-surface-container-lowest/40 font-label-kbd text-label-kbd text-primary-fixed">N</kbd>
</button>
</div>
</div>
{/*  Project Metrics Summary Bar (5 Stat Columns)  */}
<div className="grid grid-cols-2 md:grid-cols-5 gap-space-xs mt-space-sm mb-space-lg">
<div className="p-space-md rounded bg-surface-container-low flex flex-col justify-between shadow-sm">
<div className="flex items-center justify-between text-outline">
<span className="font-label-badge text-label-badge uppercase tracking-wider">Execution State</span>
<span className="material-symbols-outlined text-[16px] text-primary">donut_large</span>
</div>
<div className="mt-2 flex items-baseline gap-2">
<span className="font-headline-lg text-headline-lg text-on-surface font-semibold">68%</span>
<span className="font-label-code text-[11px] text-primary">On Target</span>
</div>
<div className="w-full bg-surface-container-highest h-1 rounded-full mt-2 overflow-hidden">
<div className="bg-primary-container h-full rounded-full" style={{width: "68%"}}></div>
</div>
</div>
<div className="p-space-md rounded bg-surface-container-low flex flex-col justify-between shadow-sm">
<div className="flex items-center justify-between text-outline">
<span className="font-label-badge text-label-badge uppercase tracking-wider">Active Sprint</span>
<span className="material-symbols-outlined text-[16px] text-secondary">alt_route</span>
</div>
<div className="mt-2 flex items-baseline gap-2">
<span className="font-headline-lg text-headline-lg text-on-surface font-semibold">Sprint 14</span>
<span className="font-label-code text-[11px] text-outline">Day 6 / 10</span>
</div>
<span className="font-body-sm text-[11px] text-on-surface-variant truncate mt-2">Core Shader &amp; State Engine</span>
</div>
<div className="p-space-md rounded bg-surface-container-low flex flex-col justify-between shadow-sm">
<div className="flex items-center justify-between text-outline">
<span className="font-label-badge text-label-badge uppercase tracking-wider">Hours Logged</span>
<span className="material-symbols-outlined text-[16px] text-tertiary">timer</span>
</div>
<div className="mt-2 flex items-baseline gap-2">
<span className="font-headline-lg text-headline-lg text-on-surface font-semibold">142h</span>
<span className="font-label-code text-[11px] text-primary">+12h sync</span>
</div>
<span className="font-body-sm text-[11px] text-on-surface-variant truncate mt-2">Target allocation: 160h</span>
</div>
<div className="p-space-md rounded bg-surface-container-low flex flex-col justify-between shadow-sm">
<div className="flex items-center justify-between text-outline">
<span className="font-label-badge text-label-badge uppercase tracking-wider">Cap Utilization</span>
<span className="material-symbols-outlined text-[16px] text-primary-fixed">payments</span>
</div>
<div className="mt-2 flex items-baseline gap-2">
<span className="font-headline-lg text-headline-lg text-on-surface font-semibold">$19,880</span>
<span className="font-label-code text-[11px] text-outline">/ $28.5k</span>
</div>
<span className="font-body-sm text-[11px] text-on-surface-variant truncate mt-2">Burn paced at 69.7%</span>
</div>
<div className="p-space-md rounded bg-surface-container-low flex flex-col justify-between shadow-sm col-span-2 md:col-span-1">
<div className="flex items-center justify-between text-outline">
<span className="font-label-badge text-label-badge uppercase tracking-wider">Squad Roster</span>
<span className="material-symbols-outlined text-[16px] text-outline">groups</span>
</div>
<div className="mt-2 flex items-center justify-between">
<span className="font-headline-lg text-headline-lg text-on-surface font-semibold">6 squad</span>
<div className="flex -space-x-1.5">
<div className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container text-[10px] font-label-badge flex items-center justify-center font-bold">AK</div>
<div className="w-6 h-6 rounded-full bg-secondary-container text-secondary text-[10px] font-label-badge flex items-center justify-center font-bold">MV</div>
<div className="w-6 h-6 rounded-full bg-surface-container-highest text-on-surface text-[10px] font-label-badge flex items-center justify-center font-bold">LR</div>
<div className="w-6 h-6 rounded-full bg-surface-container-high text-outline text-[10px] font-label-badge flex items-center justify-center font-bold">+3</div>
</div>
</div>
<span className="font-body-sm text-[11px] text-on-surface-variant truncate mt-2">4 Eng · 1 Shader · 1 Des</span>
</div>
</div>
{/*  Project Sub-Tabs Nav  */}
<div className="w-full flex items-center justify-between overflow-x-auto no-scrollbar bg-surface-container-lowest rounded-lg p-1 mb-space-lg">
<div className="flex items-center gap-1 min-w-max">
<button className="px-3 py-1.5 rounded text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors font-body-sm text-body-sm" type="button">
          Overview
        </button>
<button className="px-3 py-1.5 rounded text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors font-body-sm text-body-sm flex items-center gap-1.5" type="button">
<span>Issues</span>
<span className="px-1.5 py-0.2 rounded bg-surface-container text-outline font-label-badge text-[10px]">58</span>
</button>
<button className="px-3 py-1.5 rounded text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors font-body-sm text-body-sm" type="button">
          Cycles &amp; Sprints
        </button>
<button className="px-3 py-1.5 rounded text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors font-body-sm text-body-sm flex items-center gap-1.5" type="button">
<span>Milestones</span>
<span className="px-1.5 py-0.2 rounded bg-surface-container text-outline font-label-badge text-[10px]">4</span>
</button>
<button className="px-3 py-1.5 rounded text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors font-body-sm text-body-sm flex items-center gap-1.5" type="button">
<span>Documents &amp; RFCs</span>
<span className="px-1.5 py-0.2 rounded bg-surface-container text-outline font-label-badge text-[10px]">6</span>
</button>
<button className="px-3 py-1.5 rounded text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors font-body-sm text-body-sm" type="button">
          Team &amp; Access
        </button>
{/*  ACTIVE TAB  */}
<button className="relative px-3.5 py-1.5 rounded bg-surface-container-high text-on-surface font-headline-sm text-body-sm flex items-center gap-2 shadow-sm" type="button">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
<span>Analytics &amp; Telemetry</span>
<span className="inline-block w-1.5 h-1.5 bg-primary rounded-full animate-ping"></span>
<span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary-container rounded-t"></span>
</button>
</div>
<div className="hidden xl:flex items-center gap-2 px-2 text-outline font-label-code text-label-kbd">
<span className="w-2 h-2 rounded-full bg-primary-container"></span>
<span>Telemetry Stream: <span className="text-on-surface font-medium">STOMP #us-east-1</span></span>
</div>
</div>
</div>
{/*  SECTION 1: EXECUTIVE TELEMETRY OVERVIEW (5 Core Diagnostics Cards)  */}
<div className="flex flex-col gap-space-sm mb-space-xl">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="font-label-badge text-label-badge uppercase tracking-wider text-outline">Section 01 //</span>
<h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Executive Telemetry Overview</h2>
</div>
<div className="flex items-center gap-2">
<span className="font-label-code text-label-code text-outline">Window: Last 24 Hours</span>
<button className="w-6 h-6 rounded bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-outline hover:text-on-surface transition-colors" type="button">
<span className="material-symbols-outlined text-[14px]">refresh</span>
</button>
</div>
</div>
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-xs">
{/*  1. System Health  */}
<div className="p-space-md rounded bg-surface-container-low flex flex-col justify-between shadow-sm relative overflow-hidden group hover:bg-surface-container transition-colors">
<div className="absolute -right-3 -top-3 w-16 h-16 bg-primary-container/10 rounded-full blur-xl pointer-events-none"></div>
<div className="flex items-center justify-between text-outline">
<span className="font-label-code text-[11px] uppercase tracking-wider">Sys Health Index</span>
<span className="px-1.5 py-0.5 rounded bg-surface-container-highest text-primary font-label-code text-[10px]">99.4% target</span>
</div>
<div className="my-2.5">
<div className="flex items-baseline gap-1.5">
<span className="font-display-lg text-display-lg font-semibold text-on-surface tracking-tight">94.2%</span>
</div>
<p className="font-body-sm text-[11px] text-on-surface-variant mt-0.5">Healthy, sub-16ms target locked</p>
</div>
<div className="flex items-center justify-between pt-2 border-t border-surface-variant/40 font-label-code text-[11px]">
<span className="text-outline">SLO Breaches</span>
<span className="text-primary font-medium">0 today</span>
</div>
</div>
{/*  2. Canvas Render Loop Latency  */}
<div className="p-space-md rounded bg-surface-container-low flex flex-col justify-between shadow-sm relative overflow-hidden group hover:bg-surface-container transition-colors">
<div className="flex items-center justify-between text-outline">
<span className="font-label-code text-[11px] uppercase tracking-wider">Canvas Frame Latency</span>
<span className="material-symbols-outlined text-[16px] text-primary">speed</span>
</div>
<div className="my-2.5">
<div className="flex items-baseline gap-1.5">
<span className="font-display-lg text-display-lg font-semibold text-on-surface tracking-tight">14.2<span className="font-body-sm text-body-sm text-outline ml-0.5">ms</span></span>
</div>
<p className="font-body-sm text-[11px] text-on-surface-variant mt-0.5">Avg frame overhead (60fps cap)</p>
</div>
<div className="flex items-center justify-between pt-2 border-t border-surface-variant/40 font-label-code text-[11px]">
<span className="text-outline">p95: <span className="text-on-surface">15.8ms</span></span>
<span className="text-outline">p99: <span className="text-secondary">21.4ms</span></span>
</div>
</div>
{/*  3. WebSocket / STOMP Sync Latency  */}
<div className="p-space-md rounded bg-surface-container-low flex flex-col justify-between shadow-sm relative overflow-hidden group hover:bg-surface-container transition-colors">
<div className="flex items-center justify-between text-outline">
<span className="font-label-code text-[11px] uppercase tracking-wider">STOMP Sync Latency</span>
<span className="material-symbols-outlined text-[16px] text-secondary">hub</span>
</div>
<div className="my-2.5">
<div className="flex items-baseline gap-1.5">
<span className="font-display-lg text-display-lg font-semibold text-on-surface tracking-tight">18<span className="font-body-sm text-body-sm text-outline ml-0.5">ms</span></span>
</div>
<p className="font-body-sm text-[11px] text-on-surface-variant mt-0.5">Across 42 dogfood nodes</p>
</div>
<div className="flex items-center justify-between pt-2 border-t border-surface-variant/40 font-label-code text-[11px]">
<span className="text-outline">Jitter Rate</span>
<span className="text-primary font-medium">±1.4ms variance</span>
</div>
</div>
{/*  4. Crash-Free Sessions  */}
<div className="p-space-md rounded bg-surface-container-low flex flex-col justify-between shadow-sm relative overflow-hidden group hover:bg-surface-container transition-colors">
<div className="flex items-center justify-between text-outline">
<span className="font-label-code text-[11px] uppercase tracking-wider">Crash-Free Sessions</span>
<span className="material-symbols-outlined text-[16px] text-primary">security</span>
</div>
<div className="my-2.5">
<div className="flex items-baseline gap-1.5">
<span className="font-display-lg text-display-lg font-semibold text-on-surface tracking-tight">99.85<span className="font-body-sm text-body-sm text-outline ml-0.5">%</span></span>
</div>
<p className="font-body-sm text-[11px] text-on-surface-variant mt-0.5">48,290 client instances</p>
</div>
<div className="flex items-center justify-between pt-2 border-t border-surface-variant/40 font-label-code text-[11px]">
<span className="text-outline">Unhandled</span>
<span className="text-on-surface font-medium">1 capture</span>
</div>
</div>
{/*  5. Memory Allocation Peak  */}
<div className="p-space-md rounded bg-surface-container-low flex flex-col justify-between shadow-sm relative overflow-hidden group hover:bg-surface-container transition-colors">
<div className="flex items-center justify-between text-outline">
<span className="font-label-code text-[11px] uppercase tracking-wider">Memory Allocation</span>
<span className="material-symbols-outlined text-[16px] text-tertiary">memory</span>
</div>
<div className="my-2.5">
<div className="flex items-baseline gap-1.5">
<span className="font-display-lg text-display-lg font-semibold text-on-surface tracking-tight">42<span className="font-body-sm text-body-sm text-outline ml-0.5">MB</span></span>
</div>
<p className="font-body-sm text-[11px] text-on-surface-variant mt-0.5">Ceiling: 60MB budget rule</p>
</div>
<div className="flex items-center justify-between pt-2 border-t border-surface-variant/40 font-label-code text-[11px]">
<span className="text-outline">GC Pauses</span>
<span className="text-primary font-medium">sub-2.2ms peak</span>
</div>
</div>
</div>
</div>
{/*  SECTION 2: INTERACTIVE ENGINEERING GRAPHS (3 Diagnostic Charts)  */}
<div className="flex flex-col gap-space-sm mb-space-xl">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="font-label-badge text-label-badge uppercase tracking-wider text-outline">Section 02 //</span>
<h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Interactive Engineering Graphs</h2>
</div>
<div className="flex items-center gap-2">
<span className="px-2 py-0.5 rounded bg-surface-container font-label-code text-[11px] text-outline">Engine: Canvas 2D + WebGL 2.0</span>
</div>
</div>
<div className="grid grid-cols-1 lg:grid-cols-3 gap-space-md">
{/*  GRAPH 1: Sprint Velocity & Story Points Burn-down  */}
<div className="p-space-md rounded bg-surface-container-low flex flex-col justify-between shadow-sm relative group hover:bg-surface-container/80 transition-all">
<div className="flex items-start justify-between mb-space-sm">
<div>
<div className="flex items-center gap-1.5">
<span className="font-headline-sm text-headline-sm text-on-surface font-semibold">Sprint Velocity &amp; Burn-Down</span>
<span className="px-1.5 py-0.2 rounded bg-surface-container-highest font-label-code text-[10px] text-primary">S10 → S14</span>
</div>
<p className="font-body-sm text-body-sm text-outline mt-0.5">Actual points completed vs Nominal squad capacity</p>
</div>
<div className="flex items-center gap-2 text-[11px] font-label-code">
<span className="inline-flex items-center gap-1 text-primary">
<span className="w-2 h-2 rounded bg-primary-container"></span>Actual
            </span>
<span className="inline-flex items-center gap-1 text-outline">
<span className="w-2 h-0.5 bg-outline"></span>Nominal
            </span>
</div>
</div>
{/*  Inline SVG Visualization: Velocity Bar & Capacity Curve  */}
<div className="w-full h-44 my-2 relative">
<svg className="w-full h-full overflow-visible" fill="none" preserveAspectRatio="none" viewBox="0 0 340 140">
{/*  Grid Lines  */}
<line className="text-surface-variant/30" stroke="currentColor" stroke-dasharray="3 3" x1="0" x2="340" y1="20" y2="20"></line>
<line className="text-surface-variant/30" stroke="currentColor" stroke-dasharray="3 3" x1="0" x2="340" y1="60" y2="60"></line>
<line className="text-surface-variant/30" stroke="currentColor" stroke-dasharray="3 3" x1="0" x2="340" y1="100" y2="100"></line>
{/*  Nominal Capacity Dotted Line (approx 42-45 pts level at y=48)  */}
<path d="M 20 54 L 85 52 L 160 50 L 235 48 L 310 46" opacity="0.6" stroke="#908F9E" stroke-dasharray="4 3" stroke-width="1.5"></path>
{/*  Sprint 10 Bar (36 pts)  */}
<rect fill="#343E91" height="60" opacity="0.75" rx="2" width="28" x="25" y="62"></rect>
{/*  Sprint 11 Bar (41 pts)  */}
<rect fill="#343E91" height="74" opacity="0.85" rx="2" width="28" x="95" y="48"></rect>
{/*  Sprint 12 Bar (39 pts)  */}
<rect fill="#5E6AD2" height="68" opacity="0.9" rx="2" width="28" x="165" y="54"></rect>
{/*  Sprint 13 Bar (44 pts)  */}
<rect fill="#5E6AD2" height="80" rx="2" width="28" x="235" y="42"></rect>
{/*  Sprint 14 Bar (Current: 46 pts projected)  */}
<rect fill="#BDC2FF" height="90" rx="2" width="28" x="305" y="32"></rect>
{/*  Highlight marker on latest bar  */}
<circle cx="319" cy="32" fill="#DFE0FF" r="3"></circle>
{/*  Values Above Bars  */}
<text fill="#908F9E" font-family="JetBrains Mono" font-size="10" text-anchor="middle" x="39" y="56">36</text>
<text fill="#908F9E" font-family="JetBrains Mono" font-size="10" text-anchor="middle" x="109" y="42">41</text>
<text fill="#BDC2FF" font-family="JetBrains Mono" font-size="10" text-anchor="middle" x="179" y="48">39</text>
<text fill="#BDC2FF" font-family="JetBrains Mono" font-size="10" text-anchor="middle" x="249" y="36">44</text>
<text fill="#DFE0FF" font-family="JetBrains Mono" font-size="10" font-weight="600" text-anchor="middle" x="319" y="24">46</text>
</svg>
</div>
<div className="flex items-center justify-between pt-2 border-t border-surface-variant/40 font-label-code text-[11px] text-outline">
<span>Sprint 10</span>
<span>Sprint 11</span>
<span>Sprint 12</span>
<span>Sprint 13</span>
<span className="text-primary font-semibold">Sprint 14 (Now)</span>
</div>
</div>
{/*  GRAPH 2: WebGL Render Frame Times (60 FPS Lock)  */}
<div className="p-space-md rounded bg-surface-container-low flex flex-col justify-between shadow-sm relative group hover:bg-surface-container/80 transition-all">
<div className="flex items-start justify-between mb-space-sm">
<div>
<div className="flex items-center gap-1.5">
<span className="font-headline-sm text-headline-sm text-on-surface font-semibold">WebGL Frame Times</span>
<span className="px-1.5 py-0.2 rounded bg-surface-container-highest font-label-code text-[10px] text-primary">60 FPS Lock</span>
</div>
<p className="font-body-sm text-body-sm text-outline mt-0.5">Critical budget: 16.6ms frame hard ceiling</p>
</div>
<div className="flex items-center gap-2 text-[11px] font-label-code">
<span className="inline-flex items-center gap-1 text-error">
<span className="w-2 h-0.5 bg-error"></span>16.6ms limit
            </span>
</div>
</div>
{/*  Frame Time Waveform SVG  */}
<div className="w-full h-44 my-2 relative">
<svg className="w-full h-full overflow-visible" fill="none" preserveAspectRatio="none" viewBox="0 0 340 140">
{/*  16.6ms Critical Threshold Line at y=45  */}
<line opacity="0.8" stroke="#FFB4AB" stroke-dasharray="3 3" stroke-width="1.5" x1="0" x2="340" y1="45" y2="45"></line>
<text fill="#FFB4AB" font-family="JetBrains Mono" font-size="9" text-anchor="end" x="336" y="40">16.6ms threshold</text>
{/*  8.3ms 120 FPS Reference Line at y=85  */}
<line stroke="#454652" stroke-dasharray="2 4" stroke-width="1" x1="0" x2="340" y1="85" y2="85"></line>
<text fill="#908F9E" font-family="JetBrains Mono" font-size="9" x="6" y="81">8.3ms</text>
{/*  Frame Time Area Gradient & Path  */}
<defs>
&lt;lineargradient id="frameGrad" x1="0" x2="0" y1="0" y2="1"&gt;
<stop offset="0%" stop-color="#5E6AD2" stop-opacity="0.35"></stop>
<stop offset="100%" stop-color="#5E6AD2" stop-opacity="0.0"></stop>
&lt;/lineargradient&gt;
</defs>
<path d="M 0 68
                     L 20 65 L 40 69 L 60 62 L 80 66 L 100 58
                     L 120 72 L 140 54 L 160 56 L 180 52 L 200 48
                     L 220 50 L 240 43 L 260 52 L 280 50 L 300 49 L 320 52 L 340 50
                     L 340 130 L 0 130 Z" fill="url(#frameGrad)"></path>
<path d="M 0 68
                     L 20 65 L 40 69 L 60 62 L 80 66 L 100 58
                     L 120 72 L 140 54 L 160 56 L 180 52 L 200 48
                     L 220 50 L 240 43 L 260 52 L 280 50 L 300 49 L 320 52 L 340 50" stroke="#BDC2FF" stroke-linecap="round" stroke-width="2"></path>
{/*  Single spike indicator at x=240, y=43  */}
<circle cx="240" cy="43" fill="#FFB4AB" r="3.5"></circle>
<text fill="#FFB4AB" font-family="JetBrains Mono" font-size="9" text-anchor="middle" x="240" y="32">17.1ms</text>
</svg>
</div>
<div className="flex items-center justify-between pt-2 border-t border-surface-variant/40 font-label-code text-[11px] text-outline">
<span>T -60s</span>
<span>T -45s</span>
<span>T -30s</span>
<span>T -15s</span>
<span className="text-on-surface">Now (14.2ms)</span>
</div>
</div>
{/*  GRAPH 3: Real-time WebSocket Ingestion Throughput  */}
<div className="p-space-md rounded bg-surface-container-low flex flex-col justify-between shadow-sm relative group hover:bg-surface-container/80 transition-all">
<div className="flex items-start justify-between mb-space-sm">
<div>
<div className="flex items-center gap-1.5">
<span className="font-headline-sm text-headline-sm text-on-surface font-semibold">STOMP Ingestion Curve</span>
<span className="px-1.5 py-0.2 rounded bg-surface-container-highest font-label-code text-[10px] text-primary">events / sec</span>
</div>
<p className="font-body-sm text-body-sm text-outline mt-0.5">Real-time delta state synchronization bus</p>
</div>
<div className="flex items-center gap-1 text-[11px] font-label-code text-primary">
<span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
<span>4.2k evt/s</span>
</div>
</div>
{/*  Ingestion Waveform SVG  */}
<div className="w-full h-44 my-2 relative">
<svg className="w-full h-full overflow-visible" fill="none" preserveAspectRatio="none" viewBox="0 0 340 140">
<defs>
&lt;lineargradient id="ingestGrad" x1="0" x2="0" y1="0" y2="1"&gt;
<stop offset="0%" stop-color="#343E91" stop-opacity="0.45"></stop>
<stop offset="100%" stop-color="#343E91" stop-opacity="0.0"></stop>
&lt;/lineargradient&gt;
</defs>
{/*  Baseline grid  */}
<line className="text-surface-variant/30" stroke="currentColor" stroke-dasharray="3 3" x1="0" x2="340" y1="30" y2="30"></line>
<line className="text-surface-variant/30" stroke="currentColor" stroke-dasharray="3 3" x1="0" x2="340" y1="70" y2="70"></line>
<line className="text-surface-variant/30" stroke="currentColor" stroke-dasharray="3 3" x1="0" x2="340" y1="110" y2="110"></line>
<path d="M 0 95
                     Q 30 92, 60 78
                     T 120 62
                     T 180 82
                     T 240 45
                     T 300 52
                     L 340 38
                     L 340 130 L 0 130 Z" fill="url(#ingestGrad)"></path>
<path d="M 0 95
                     Q 30 92, 60 78
                     T 120 62
                     T 180 82
                     T 240 45
                     T 300 52
                     L 340 38" stroke="#5E6AD2" stroke-linecap="round" stroke-width="2"></path>
{/*  Active pulse point  */}
<circle cx="340" cy="38" fill="#BDC2FF" r="4"></circle>
</svg>
</div>
<div className="flex items-center justify-between pt-2 border-t border-surface-variant/40 font-label-code text-[11px] text-outline">
<span>00:00</span>
<span>06:00</span>
<span>12:00</span>
<span>18:00</span>
<span className="text-on-surface">Peak: 5,120/s</span>
</div>
</div>
</div>
</div>
{/*  SECTION 3 & 4: DUAL COLUMN LAYOUT (Sprint Health & Effort / Budget Burn Breakdown)  */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md items-start">
{/*  LEFT COLUMN: Sprint Health & Issue Distribution (7 Cols)  */}
<div className="lg:col-span-7 flex flex-col gap-space-sm">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="font-label-badge text-label-badge uppercase tracking-wider text-outline">Section 03 //</span>
<h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Sprint Health &amp; Issue Distribution</h2>
</div>
<span className="font-label-code text-label-code text-outline">Sprint 14 Active</span>
</div>
<div className="p-space-md rounded bg-surface-container-low shadow-sm flex flex-col gap-space-md">
{/*  4 Metric Micro-Tiles Grid  */}
<div className="grid grid-cols-2 sm:grid-cols-4 gap-space-xs">
<div className="p-2.5 rounded bg-surface-container flex flex-col">
<span className="font-label-badge text-[10px] uppercase text-outline">Throughput</span>
<span className="font-headline-md text-headline-md font-semibold text-on-surface mt-1">46 pts</span>
<span className="font-label-code text-[11px] text-primary flex items-center gap-0.5 mt-0.5">
<span className="material-symbols-outlined text-[13px]">trending_up</span> +8.2% eff
            </span>
</div>
<div className="p-2.5 rounded bg-surface-container flex flex-col">
<span className="font-label-badge text-[10px] uppercase text-outline">Cycle Lead Time</span>
<span className="font-headline-md text-headline-md font-semibold text-on-surface mt-1">3.2 days</span>
<span className="font-label-code text-[11px] text-outline flex items-center gap-0.5 mt-0.5">
              Prog → Done
            </span>
</div>
<div className="p-2.5 rounded bg-surface-container flex flex-col">
<span className="font-label-badge text-[10px] uppercase text-outline">Bug Defect Rate</span>
<span className="font-headline-md text-headline-md font-semibold text-on-surface mt-1">2.1%</span>
<span className="font-label-code text-[11px] text-primary flex items-center gap-0.5 mt-0.5">
              3/3 resolved
            </span>
</div>
<div className="p-2.5 rounded bg-surface-container flex flex-col">
<span className="font-label-badge text-[10px] uppercase text-outline">CR Turnaround</span>
<span className="font-headline-md text-headline-md font-semibold text-on-surface mt-1">4.2h</span>
<span className="font-label-code text-[11px] text-outline flex items-center gap-0.5 mt-0.5">
              p50 merge time
            </span>
</div>
</div>
{/*  Issue Distribution Bar Stack  */}
<div className="flex flex-col gap-1.5 pt-2">
<div className="flex items-center justify-between text-body-sm font-body-sm">
<span className="text-on-surface font-medium">Issue Distribution by Pipeline State</span>
<span className="text-outline font-label-code text-label-code">58 Total Issues</span>
</div>
{/*  Stacked Progress Bar  */}
<div className="w-full h-3 rounded-full bg-surface-container-highest overflow-hidden flex">
<div className="bg-primary-container h-full transition-all" style={{width: "48%"}} title="Completed: 28"></div>
<div className="bg-secondary h-full transition-all" style={{width: "28%"}} title="In Progress: 16"></div>
<div className="bg-surface-variant h-full transition-all" style={{width: "17%"}} title="In Review: 10"></div>
<div className="bg-error/60 h-full transition-all" style={{width: "7%"}} title="Blocked: 4"></div>
</div>
<div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-label-code text-[11px]">
<div className="flex items-center gap-1.5 text-on-surface">
<span className="w-2 h-2 rounded-full bg-primary-container"></span>
<span>Done: 28 (48%)</span>
</div>
<div className="flex items-center gap-1.5 text-secondary">
<span className="w-2 h-2 rounded-full bg-secondary"></span>
<span>Prog: 16 (28%)</span>
</div>
<div className="flex items-center gap-1.5 text-outline">
<span className="w-2 h-2 rounded-full bg-surface-variant"></span>
<span>Review: 10 (17%)</span>
</div>
<div className="flex items-center gap-1.5 text-error">
<span className="w-2 h-2 rounded-full bg-error/60"></span>
<span>Blocked: 4 (7%)</span>
</div>
</div>
</div>
{/*  Recent Critical Issues Table/Stream  */}
<div className="flex flex-col gap-1 pt-2">
<div className="flex items-center justify-between text-body-sm font-body-sm pb-1">
<span className="text-outline uppercase font-label-badge text-[10px] tracking-wider">Sprint 14 Dogfood Telemetry Incidents</span>
<span className="text-primary font-label-code text-[11px] cursor-pointer hover:underline">View in Issues</span>
</div>
<div className="flex items-center justify-between p-2 rounded bg-surface-container hover:bg-surface-container-high transition-colors">
<div className="flex items-center gap-2.5 min-w-0">
<span className="material-symbols-outlined text-[15px] text-primary" style={{fontVariationSettings: "\'FILL\' 1"}}>check_circle</span>
<span className="font-label-code text-[11px] text-primary">NX-412</span>
<span className="font-body-sm text-body-sm text-on-surface truncate">WebGL canvas offscreen context leak under multi-tab reload</span>
</div>
<span className="font-label-badge text-[10px] px-1.5 py-0.5 rounded bg-surface-container-highest text-primary font-medium shrink-0 ml-2">Resolved</span>
</div>
<div className="flex items-center justify-between p-2 rounded bg-surface-container hover:bg-surface-container-high transition-colors">
<div className="flex items-center gap-2.5 min-w-0">
<span className="material-symbols-outlined text-[15px] text-primary" style={{fontVariationSettings: "\'FILL\' 1"}}>check_circle</span>
<span className="font-label-code text-[11px] text-primary">NX-419</span>
<span className="font-body-sm text-body-sm text-on-surface truncate">STOMP heartbeat timeout recovery delay in low-bandwidth worker</span>
</div>
<span className="font-label-badge text-[10px] px-1.5 py-0.5 rounded bg-surface-container-highest text-primary font-medium shrink-0 ml-2">Resolved</span>
</div>
<div className="flex items-center justify-between p-2 rounded bg-surface-container hover:bg-surface-container-high transition-colors">
<div className="flex items-center gap-2.5 min-w-0">
<span className="material-symbols-outlined text-[15px] text-secondary">radio_button_checked</span>
<span className="font-label-code text-[11px] text-secondary">NX-427</span>
<span className="font-body-sm text-body-sm text-on-surface truncate">Bilinear interpolation shader jitter on Retina displays</span>
</div>
<span className="font-label-badge text-[10px] px-1.5 py-0.5 rounded bg-secondary-container text-secondary font-medium shrink-0 ml-2">Review</span>
</div>
</div>
</div>
</div>
{/*  RIGHT COLUMN: Effort & Budget Burn Breakdown (5 Cols)  */}
<div className="lg:col-span-5 flex flex-col gap-space-sm">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="font-label-badge text-label-badge uppercase tracking-wider text-outline">Section 04 //</span>
<h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Effort &amp; Capital Burn</h2>
</div>
<span className="font-label-code text-label-code text-outline">Paced: $1,420/day</span>
</div>
<div className="p-space-md rounded bg-surface-container-low shadow-sm flex flex-col gap-space-md">
{/*  Capital Burn Status Banner  */}
<div className="p-space-sm rounded bg-surface-container flex items-center justify-between">
<div className="flex flex-col">
<span className="font-label-badge text-[10px] uppercase text-outline">Milestone Cap Ceiling</span>
<span className="font-headline-md text-headline-md font-semibold text-on-surface mt-0.5">$19,880 <span className="font-body-sm text-body-sm text-outline font-normal">/ $28,500</span></span>
</div>
<div className="text-right">
<span className="font-label-code text-label-code text-primary font-medium">On Pace (69.7%)</span>
<p className="font-body-sm text-[11px] text-outline mt-0.5">$8,620 contingency left</p>
</div>
</div>
{/*  Hours Logged by Discipline (Bar Visuals)  */}
<div className="flex flex-col gap-space-sm">
<div className="flex items-center justify-between">
<span className="font-body-sm text-body-sm text-on-surface font-medium">Hours by Engineering Discipline</span>
<span className="font-label-code text-[11px] text-outline">142h Cumulative</span>
</div>
{/*  Discipline 1: Frontend & Canvas  */}
<div className="flex flex-col gap-1">
<div className="flex items-center justify-between font-label-code text-[11px]">
<div className="flex items-center gap-1.5 text-on-surface">
<span className="w-2 h-2 rounded-full bg-primary-container"></span>
<span>Frontend &amp; Canvas Engine</span>
</div>
<span className="text-primary font-medium">82h (58%)</span>
</div>
<div className="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
<div className="bg-primary-container h-full rounded-full" style={{width: "58%"}}></div>
</div>
</div>
{/*  Discipline 2: Core Shader  */}
<div className="flex flex-col gap-1">
<div className="flex items-center justify-between font-label-code text-[11px]">
<div className="flex items-center gap-1.5 text-on-surface">
<span className="w-2 h-2 rounded-full bg-secondary"></span>
<span>Core Shader &amp; Compute Pipeline</span>
</div>
<span className="text-secondary font-medium">34h (24%)</span>
</div>
<div className="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
<div className="bg-secondary h-full rounded-full" style={{width: "24%"}}></div>
</div>
</div>
{/*  Discipline 3: Design  */}
<div className="flex flex-col gap-1">
<div className="flex items-center justify-between font-label-code text-[11px]">
<div className="flex items-center gap-1.5 text-on-surface">
<span className="w-2 h-2 rounded-full bg-tertiary"></span>
<span>Design Systems &amp; Tokens</span>
</div>
<span className="text-tertiary font-medium">26h (18%)</span>
</div>
<div className="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
<div className="bg-tertiary h-full rounded-full" style={{width: "18%"}}></div>
</div>
</div>
</div>
{/*  Squad Allocation Roster Preview Cards  */}
<div className="pt-2 border-t border-surface-variant/40 flex flex-col gap-2">
<span className="font-label-badge text-[10px] uppercase text-outline tracking-wider">Top Contributors This Sprint</span>
<div className="flex items-center justify-between text-body-sm">
<div className="flex items-center gap-2">
<div className="w-5 h-5 rounded bg-primary-container text-on-primary-container text-[9px] font-label-code flex items-center justify-center font-bold">AK</div>
<span className="text-on-surface font-medium truncate">Alex K. (Staff Canvas)</span>
</div>
<span className="font-label-code text-[11px] text-outline">48.5h logged</span>
</div>
<div className="flex items-center justify-between text-body-sm">
<div className="flex items-center gap-2">
<div className="w-5 h-5 rounded bg-secondary-container text-secondary text-[9px] font-label-code flex items-center justify-center font-bold">MV</div>
<span className="text-on-surface font-medium truncate">Maya V. (Shader Eng)</span>
</div>
<span className="font-label-code text-[11px] text-outline">34.0h logged</span>
</div>
<div className="flex items-center justify-between text-body-sm">
<div className="flex items-center gap-2">
<div className="w-5 h-5 rounded bg-surface-container-highest text-on-surface text-[9px] font-label-code flex items-center justify-center font-bold">LR</div>
<span className="text-on-surface font-medium truncate">Leo R. (Product UI)</span>
</div>
<span className="font-label-code text-[11px] text-outline">26.0h logged</span>
</div>
</div>
{/*  Bottom Export / Log Audit Trigger  */}
<div className="pt-1 flex items-center justify-between">
<button className="w-full py-1.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface font-label-code text-label-code flex items-center justify-center gap-1.5 transition-colors" type="button">
<span className="material-symbols-outlined text-[14px]">download</span>
<span>Export Financial Audit Ledger (.csv)</span>
</button>
</div>
</div>
</div>
</div>
</div>

    </div>
  );
}
