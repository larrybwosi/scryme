"use client";

import Link from "next/link";
import React, { useState } from "react";

export function MilestonesTab() {
  return (
    <div className="flex flex-col w-full">
{/*  Top Project Header  */}
<section className="flex flex-col gap-space-md pt-4 pb-space-lg">
{/*  Breadcrumb & Primary Command Actions  */}
<div className="flex flex-wrap items-center justify-between gap-space-md">
<div className="flex flex-col gap-1 min-w-0">
<div className="flex items-center gap-2 font-label-code text-label-code text-outline">
<span className="hover:text-on-surface cursor-pointer transition-colors">Projects</span>
<span className="text-outline-variant">/</span>
<span className="hover:text-on-surface cursor-pointer transition-colors text-primary">PRJ-204</span>
<span className="text-outline-variant">/</span>
<span className="text-on-surface font-medium truncate">Nexus 2.0 Redesign</span>
</div>
<div className="flex items-center gap-3">
<h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Nexus 2.0 Redesign</h1>
<span className="font-label-badge text-label-badge px-2 py-0.5 rounded-lg bg-surface-container-high text-outline flex items-center gap-1.5 border border-outline-variant/30">
<span className="material-symbols-outlined text-[13px] text-primary">lock_open</span>
            Public Fleet
          </span>
</div>
</div>
{/*  Action Buttons  */}
<div className="flex items-center gap-2 flex-wrap">
<button className="h-8 px-space-md rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm flex items-center gap-1.5 transition-colors border border-outline-variant/30" type="button">
<span className="material-symbols-outlined text-[16px] text-outline">ios_share</span>
<span>Share</span>
</button>
<button className="h-8 px-space-md rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm flex items-center gap-1.5 transition-colors border border-outline-variant/30" type="button">
<span className="material-symbols-outlined text-[16px] text-outline">link</span>
<span>Copy URL</span>
</button>
<button className="h-8 px-space-md rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm flex items-center gap-1.5 transition-colors border border-outline-variant/30" type="button">
<span className="material-symbols-outlined text-[16px] text-outline">edit_note</span>
<span>Edit Spec</span>
</button>
<button className="h-8 px-space-md rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm flex items-center gap-1.5 transition-colors shadow-sm" type="button">
<span className="material-symbols-outlined text-[16px]">add</span>
<span>New Issue</span>
</button>
</div>
</div>
{/*  Metadata Badges Strip  */}
<div className="flex items-center gap-2 flex-wrap text-body-sm font-body-sm">
<div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-low border border-outline-variant/40">
<span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
<span className="text-on-surface font-medium">Live Pipeline</span>
</div>
<div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface-variant">
<span className="material-symbols-outlined text-[15px] text-error">priority_high</span>
<span className="text-on-surface">High Priority</span>
</div>
<div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface-variant">
<span className="material-symbols-outlined text-[15px] text-outline">calendar_today</span>
<span>Target: <strong className="text-on-surface font-medium">Oct 29, 2024</strong></span>
</div>
<div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface-variant">
<span className="material-symbols-outlined text-[15px] text-primary">vital_signs</span>
<span>Telemetry: <strong className="text-emerald-400 font-medium">94% Health</strong></span>
</div>
<div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface-container border border-outline-variant/30 text-outline font-label-code text-label-code">
<span>GIT: main@a8f10c3</span>
</div>
</div>
{/*  Summary Metrics Cards Grid  */}
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-1">
<div className="p-space-md rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1">
<div className="flex items-center justify-between text-outline font-label-badge text-label-badge uppercase tracking-wider">
<span>Execution State</span>
<span className="material-symbols-outlined text-[16px] text-primary">donut_large</span>
</div>
<div className="flex items-baseline gap-2">
<span className="font-headline-lg text-headline-lg text-on-surface">68%</span>
<span className="text-label-code font-label-code text-emerald-400 flex items-center text-[11px]">
<span className="material-symbols-outlined text-[12px]">trending_up</span>+12%
          </span>
</div>
<div className="w-full bg-surface-container-highest rounded-full h-1 mt-1 overflow-hidden">
<div className="bg-primary-container h-1 rounded-full" style={{width: "68%"}}></div>
</div>
</div>
<div className="p-space-md rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1">
<div className="flex items-center justify-between text-outline font-label-badge text-label-badge uppercase tracking-wider">
<span>Active Sprint</span>
<span className="material-symbols-outlined text-[16px] text-outline">reorder</span>
</div>
<div className="flex items-baseline gap-2">
<span className="font-headline-lg text-headline-lg text-on-surface">Sprint 14</span>
</div>
<span className="font-body-sm text-body-sm text-outline truncate">Ends Oct 31 • 6 days left</span>
</div>
<div className="p-space-md rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1">
<div className="flex items-center justify-between text-outline font-label-badge text-label-badge uppercase tracking-wider">
<span>Hours Logged</span>
<span className="material-symbols-outlined text-[16px] text-outline">schedule</span>
</div>
<div className="flex items-baseline gap-2">
<span className="font-headline-lg text-headline-lg text-on-surface">142h</span>
<span className="text-label-code font-label-code text-outline text-[11px]">/ 160h cap</span>
</div>
<span className="font-body-sm text-body-sm text-emerald-400 truncate">On pace (88.7%)</span>
</div>
<div className="p-space-md rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1">
<div className="flex items-center justify-between text-outline font-label-badge text-label-badge uppercase tracking-wider">
<span>Cap Utilization</span>
<span className="material-symbols-outlined text-[16px] text-outline">payments</span>
</div>
<div className="flex items-baseline gap-2">
<span className="font-headline-lg text-headline-lg text-on-surface">$19,880</span>
</div>
<span className="font-body-sm text-body-sm text-outline truncate">Allocated: $28,000</span>
</div>
<div className="p-space-md rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1 col-span-2 md:col-span-1">
<div className="flex items-center justify-between text-outline font-label-badge text-label-badge uppercase tracking-wider">
<span>Squad Roster</span>
<span className="material-symbols-outlined text-[16px] text-outline">group</span>
</div>
<div className="flex items-center gap-1.5 mt-0.5">
<div className="flex -space-x-2 overflow-hidden">
<div className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container text-[10px] font-label-code font-semibold flex items-center justify-center ring-2 ring-surface">EK</div>
<div className="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-label-code font-semibold flex items-center justify-center ring-2 ring-surface">ML</div>
<div className="w-6 h-6 rounded-full bg-surface-bright text-on-surface text-[10px] font-label-code font-semibold flex items-center justify-center ring-2 ring-surface">TS</div>
<div className="w-6 h-6 rounded-full bg-tertiary-container text-on-tertiary-container text-[10px] font-label-code font-semibold flex items-center justify-center ring-2 ring-surface">AR</div>
<div className="w-6 h-6 rounded-full bg-surface-container-highest text-outline text-[10px] font-label-code font-medium flex items-center justify-center ring-2 ring-surface">+2</div>
</div>
<span className="font-body-sm text-body-sm text-on-surface font-medium ml-1">6 Active</span>
</div>
<span className="font-body-sm text-body-sm text-outline truncate">Core Nexus Guild</span>
</div>
</div>
</section>
{/*  Project Navigation Tabs Strip  */}
<div className="border-b border-outline-variant/30 flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
<nav className="flex items-center gap-1 text-body-sm font-body-sm -mb-px">
<button className="px-space-md py-2.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors rounded-t-lg" type="button">
        Overview
      </button>
<button className="px-space-md py-2.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors rounded-t-lg flex items-center gap-1.5" type="button">
<span>Issues</span>
<span className="px-1.5 py-0.2 rounded-full bg-surface-container-high text-outline text-[11px] font-label-code">58</span>
</button>
<button className="px-space-md py-2.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors rounded-t-lg" type="button">
        Cycles &amp; Sprints
      </button>
{/*  ACTIVE TAB: Milestones (4)  */}
<button className="px-space-md py-2.5 text-on-surface font-medium border-b-2 border-primary-container bg-surface-container-low/40 rounded-t-lg flex items-center gap-2" type="button">
<span className="material-symbols-outlined text-[17px] text-primary">flag</span>
<span>Milestones</span>
<span className="px-1.5 py-0.5 rounded-full bg-primary-container/20 text-primary text-[11px] font-label-code font-semibold">4</span>
</button>
<button className="px-space-md py-2.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors rounded-t-lg flex items-center gap-1.5" type="button">
<span>Documents &amp; RFCs</span>
<span className="px-1.5 py-0.2 rounded-full bg-surface-container-high text-outline text-[11px] font-label-code">6</span>
</button>
<button className="px-space-md py-2.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors rounded-t-lg" type="button">
        Team &amp; Access
      </button>
<button className="px-space-md py-2.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors rounded-t-lg" type="button">
        Analytics &amp; Telemetry
      </button>
</nav>
<div className="flex items-center gap-2 py-1 flex-shrink-0">
<button className="h-7 px-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-outline hover:text-on-surface text-body-sm font-body-sm flex items-center gap-1 border border-outline-variant/30" type="button">
<span className="material-symbols-outlined text-[15px]">filter_list</span>
<span>Filter</span>
</button>
<button className="h-7 px-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-outline hover:text-on-surface text-body-sm font-body-sm flex items-center gap-1 border border-outline-variant/30" type="button">
<span className="material-symbols-outlined text-[15px]">sort</span>
<span>Date</span>
</button>
</div>
</div>
{/*  ACTIVE CONTENT: Enterprise Milestones & Release Tracking View  */}
<div className="flex flex-col gap-space-lg mt-6">
{/*  1. Top Milestone Stats Header  */}
<div className="p-space-lg rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-lg shadow-sm">
<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
{/*  Milestone Counters  */}
<div className="flex flex-col gap-1 border-r border-outline-variant/20 pr-3">
<span className="font-label-badge text-label-badge text-outline uppercase tracking-wider">Total Milestones</span>
<div className="flex items-baseline gap-2">
<span className="font-headline-lg text-headline-lg text-on-surface">4</span>
<span className="font-body-sm text-body-sm text-outline">Target Q4</span>
</div>
<div className="flex items-center gap-1 text-[11px] font-label-code text-outline mt-0.5">
<span className="text-emerald-400 font-medium">1 Done</span>
<span>•</span>
<span className="text-primary font-medium">2 Active</span>
<span>•</span>
<span>1 Plan</span>
</div>
</div>
{/*  Target Release Date  */}
<div className="flex flex-col gap-1 border-r border-outline-variant/20 pr-3">
<span className="font-label-badge text-label-badge text-outline uppercase tracking-wider">Target Release</span>
<div className="flex items-baseline gap-1.5">
<span className="font-headline-md text-headline-md text-on-surface">Oct 29, 2024</span>
</div>
<span className="font-body-sm text-body-sm text-primary font-medium truncate">v2.0 Beta Release Candidate</span>
</div>
{/*  Overall Project Completion  */}
<div className="flex flex-col gap-1 border-r border-outline-variant/20 pr-3">
<span className="font-label-badge text-label-badge text-outline uppercase tracking-wider">Release Progress</span>
<div className="flex items-baseline gap-2">
<span className="font-headline-lg text-headline-lg text-on-surface">68%</span>
<span className="font-body-sm text-body-sm text-outline">42/56 Issues</span>
</div>
<div className="w-full bg-surface-container-highest rounded-full h-1.5 mt-1 overflow-hidden">
<div className="bg-primary-container h-1.5 rounded-full" style={{width: "68%"}}></div>
</div>
</div>
{/*  Milestone Health  */}
<div className="flex flex-col gap-1">
<span className="font-label-badge text-label-badge text-outline uppercase tracking-wider">Milestone Health</span>
<div className="flex items-center gap-2 mt-0.5">
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 font-label-badge text-label-badge font-semibold">
<span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              1 On Track
            </span>
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 font-label-badge text-label-badge font-semibold">
<span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              1 Low Risk
            </span>
</div>
<span className="font-label-code text-label-code text-outline text-[11px] mt-1">0 Critical Blockers</span>
</div>
</div>
{/*  Header Action  */}
<div className="flex items-center lg:self-center">
<button className="w-full lg:w-auto h-9 px-space-lg rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm flex items-center justify-center gap-2 transition-all shadow-sm" type="button">
<span className="material-symbols-outlined text-[18px]">add_circle</span>
<span>New Milestone</span>
<span className="font-label-kbd text-label-kbd bg-on-primary-container/20 px-1 py-0.5 rounded ml-1 text-on-primary-container">M</span>
</button>
</div>
</div>
{/*  2. Detailed Milestone Cards List  */}
<div className="flex flex-col gap-space-md">
{/*  Card 1: Milestone 1: Multi-theme Token Ingestion (COMPLETED)  */}
<div className="p-space-lg rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col gap-space-md transition-all hover:bg-surface-container-high/60">
<div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm pb-space-sm border-b border-outline-variant/20">
<div className="flex items-center gap-3">
<div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
<span className="material-symbols-outlined text-[20px]">check_circle</span>
</div>
<div className="flex flex-col">
<div className="flex items-center gap-2">
<span className="font-label-code text-label-code text-outline">M1 • REQ-189</span>
<h3 className="font-headline-sm text-headline-sm text-on-surface">Milestone 1: Multi-theme Token Ingestion</h3>
</div>
<span className="font-body-sm text-body-sm text-outline">Architectural baseline for dynamic styling tokens</span>
</div>
</div>
<div className="flex items-center gap-3 flex-wrap">
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-label-badge text-label-badge font-semibold">
<span className="material-symbols-outlined text-[14px]">done_all</span>
              COMPLETED
            </span>
<div className="flex items-center gap-1.5 font-body-sm text-body-sm text-outline">
<span className="material-symbols-outlined text-[16px]">event_available</span>
<span>Target: Oct 25, 2024 <span className="text-emerald-400 font-medium">(Completed on time)</span></span>
</div>
<button className="w-7 h-7 rounded-lg hover:bg-surface-container-highest flex items-center justify-center text-outline hover:text-on-surface transition-colors" type="button">
<span className="material-symbols-outlined text-[18px]">more_vert</span>
</button>
</div>
</div>
{/*  Deliverable & Content Body  */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md items-start">
<div className="lg:col-span-8 flex flex-col gap-space-sm">
<div className="text-body-md font-body-md text-on-surface-variant">
<span className="font-semibold text-on-surface">Deliverable:</span> Export and dynamic runtime compile pipeline for Figma Design System v3.2 token variables.
            </div>
<div className="flex items-center gap-2 flex-wrap">
<span className="text-outline font-label-badge text-label-badge uppercase">Key Artifacts:</span>
<span className="px-2 py-0.5 rounded bg-surface-container-low text-on-surface font-label-code text-label-code border border-outline-variant/30 flex items-center gap-1">
<span className="material-symbols-outlined text-[13px] text-primary">extension</span> Figma plugin v1.4
              </span>
<span className="px-2 py-0.5 rounded bg-surface-container-low text-on-surface font-label-code text-label-code border border-outline-variant/30 flex items-center gap-1">
<span className="material-symbols-outlined text-[13px] text-secondary">data_object</span> Token schema JSON
              </span>
<span className="px-2 py-0.5 rounded bg-surface-container-low text-emerald-400 font-label-code text-label-code border border-outline-variant/30 flex items-center gap-1">
<span className="material-symbols-outlined text-[13px]">verified</span> 0 regressions reported
              </span>
</div>
</div>
{/*  Progress Widget  */}
<div className="lg:col-span-4 p-space-sm rounded-lg bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1.5">
<div className="flex items-center justify-between text-body-sm font-body-sm">
<span className="text-outline">Scope Execution</span>
<span className="font-label-code text-label-code text-emerald-400 font-semibold">100% (14 / 14 issues closed)</span>
</div>
<div className="w-full bg-surface-container-highest rounded-full h-2 overflow-hidden">
<div className="bg-emerald-400 h-2 rounded-full" style={{width: "100%"}}></div>
</div>
<div className="flex items-center justify-between text-[11px] font-label-code text-outline mt-0.5">
<span>All PRs merged to main</span>
<span className="text-emerald-400">Validated</span>
</div>
</div>
</div>
</div>
{/*  Card 2: Milestone 2: Nexus 2.0 Beta Release Candidate (PRIMARY TARGET)  */}
<div className="p-space-lg rounded-xl bg-surface-container border-2 border-primary-container/70 flex flex-col gap-space-md transition-all shadow-md relative overflow-hidden">
{/*  Accent Glow Pill  */}
<div className="absolute top-0 right-0 px-3 py-0.5 bg-primary-container text-on-primary-container text-[11px] font-label-badge font-semibold uppercase tracking-wider rounded-bl-lg shadow-sm">
          Primary Milestone Target
        </div>
<div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm pb-space-sm border-b border-outline-variant/30 pt-1">
<div className="flex items-center gap-3">
<div className="w-8 h-8 rounded-lg bg-primary-container/20 border border-primary-container/40 text-primary flex items-center justify-center animate-pulse">
<span className="material-symbols-outlined text-[20px]">rocket_launch</span>
</div>
<div className="flex flex-col">
<div className="flex items-center gap-2">
<span className="font-label-code text-label-code text-primary font-semibold">M2 • TARGET RC</span>
<h3 className="font-headline-md text-headline-md text-on-surface font-semibold">Milestone 2: Nexus 2.0 Beta Release Candidate</h3>
</div>
<span className="font-body-sm text-body-sm text-outline">Sub-16ms WebGL canvas render loop &amp; dogfood fleet roll</span>
</div>
</div>
<div className="flex items-center gap-3 flex-wrap">
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-container/20 border border-primary-container/40 text-primary font-label-badge text-label-badge font-semibold">
<span className="material-symbols-outlined text-[14px]">progress_activity</span>
              IN PROGRESS (82%)
            </span>
<div className="flex items-center gap-1.5 font-body-sm text-body-sm text-on-surface">
<span className="material-symbols-outlined text-[16px] text-primary">schedule</span>
<span>Target: <strong className="text-primary-fixed">Oct 29, 2024</strong> <span className="text-primary font-label-code text-[11px]">(6 days left)</span></span>
</div>
<button className="w-7 h-7 rounded-lg hover:bg-surface-container-highest flex items-center justify-center text-outline hover:text-on-surface transition-colors" type="button">
<span className="material-symbols-outlined text-[18px]">more_vert</span>
</button>
</div>
</div>
{/*  Deliverable & Content Body  */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md items-start">
<div className="lg:col-span-7 flex flex-col gap-space-md">
<div className="text-body-md font-body-md text-on-surface">
<span className="font-semibold text-primary">Deliverable:</span> Public beta rollout across dogfood clusters; telemetry baseline validation; sub-16ms WebGL canvas render loop.
            </div>
{/*  Active Issue Tracker Strip  */}
<div className="flex flex-col gap-1.5">
<div className="flex items-center justify-between text-body-sm font-body-sm">
<span className="text-on-surface font-medium flex items-center gap-1">
<span className="material-symbols-outlined text-[15px] text-primary">pending_actions</span>
                  5 Active Issues Remaining:
                </span>
<span className="text-outline font-label-code text-label-code">22 / 27 Closed</span>
</div>
<div className="flex items-center gap-1.5 flex-wrap">
<span className="px-2 py-0.5 rounded bg-surface-container-low hover:bg-surface-container-high cursor-pointer text-on-surface font-label-code text-label-code border border-outline-variant/40 flex items-center gap-1">
<span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> SCR-104: Shader compile latency
                </span>
<span className="px-2 py-0.5 rounded bg-surface-container-low hover:bg-surface-container-high cursor-pointer text-on-surface font-label-code text-label-code border border-outline-variant/40 flex items-center gap-1">
<span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> SCR-106: Safari WebKit clip bug
                </span>
<span className="px-2 py-0.5 rounded bg-surface-container-low hover:bg-surface-container-high cursor-pointer text-on-surface font-label-code text-label-code border border-outline-variant/40 flex items-center gap-1">
<span className="w-1.5 h-1.5 rounded-full bg-primary"></span> SCR-118: Node delta hydration
                </span>
<span className="px-2 py-0.5 rounded bg-surface-container-low hover:bg-surface-container-high cursor-pointer text-on-surface font-label-code text-label-code border border-outline-variant/40 flex items-center gap-1">
<span className="w-1.5 h-1.5 rounded-full bg-primary"></span> SCR-105: Touch event debouncing
                </span>
<span className="px-2 py-0.5 rounded bg-surface-container-low hover:bg-surface-container-high cursor-pointer text-on-surface font-label-code text-label-code border border-outline-variant/40 flex items-center gap-1">
<span className="w-1.5 h-1.5 rounded-full bg-outline"></span> SCR-112: Tooltip placement
                </span>
</div>
</div>
{/*  Blockers & Risks Alert Box  */}
<div className="p-space-sm rounded-lg bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between text-body-sm font-body-sm">
<div className="flex items-center gap-2 text-emerald-400">
<span className="material-symbols-outlined text-[18px]">verified_user</span>
<span><strong>Blockers &amp; Risks:</strong> 0 blocking issues. Security scan SOC-2 passed.</span>
</div>
<span className="font-label-code text-label-code text-emerald-400/80 text-[11px]">Audit pass #914</span>
</div>
</div>
{/*  Progress Widget & Contributors  */}
<div className="lg:col-span-5 p-space-md rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-3">
<div className="flex flex-col gap-1.5">
<div className="flex items-center justify-between text-body-sm font-body-sm">
<span className="text-on-surface font-medium">Sprint 14 Burnup Progress</span>
<span className="font-label-code text-label-code text-primary font-semibold">82%</span>
</div>
<div className="w-full bg-surface-container-highest rounded-full h-2.5 overflow-hidden">
<div className="bg-primary-container h-2.5 rounded-full transition-all" style={{width: "82%"}}></div>
</div>
<div className="flex items-center justify-between text-[11px] font-label-code text-outline">
<span>Target: Oct 29 Beta</span>
<span className="text-primary">22 / 27 Issues Resolved</span>
</div>
</div>
{/*  Contributors Strip  */}
<div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between">
<span className="font-label-badge text-label-badge text-outline uppercase tracking-wider">Assigned Squad</span>
<div className="flex items-center gap-2">
<div className="flex -space-x-1.5">
<div className="w-7 h-7 rounded-full bg-primary text-on-primary text-[11px] font-label-code font-bold flex items-center justify-center ring-2 ring-surface cursor-pointer" title="Elena (Lead Tech)">EK</div>
<div className="w-7 h-7 rounded-full bg-secondary text-on-secondary text-[11px] font-label-code font-bold flex items-center justify-center ring-2 ring-surface cursor-pointer" title="Marcus (WebGL)">ML</div>
<div className="w-7 h-7 rounded-full bg-tertiary text-on-tertiary text-[11px] font-label-code font-bold flex items-center justify-center ring-2 ring-surface cursor-pointer" title="Tanya (QA)">TS</div>
<div className="w-7 h-7 rounded-full bg-surface-bright text-on-surface text-[11px] font-label-code font-bold flex items-center justify-center ring-2 ring-surface cursor-pointer" title="Alex (Pipeline)">AR</div>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant font-medium">Elena, Marcus +2</span>
</div>
</div>
</div>
</div>
</div>
{/*  Card 3: Milestone 3: Client Acceptance & Telemetry Sign-off  */}
<div className="p-space-lg rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col gap-space-md transition-all hover:bg-surface-container-high/60">
<div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm pb-space-sm border-b border-outline-variant/20">
<div className="flex items-center gap-3">
<div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
<span className="material-symbols-outlined text-[20px]">verified</span>
</div>
<div className="flex flex-col">
<div className="flex items-center gap-2">
<span className="font-label-code text-label-code text-outline">M3 • AUDIT-9</span>
<h3 className="font-headline-sm text-headline-sm text-on-surface">Milestone 3: Client Acceptance &amp; Telemetry Sign-off</h3>
</div>
<span className="font-body-sm text-body-sm text-outline">Enterprise infosec sign-off &amp; multi-region high availability</span>
</div>
</div>
<div className="flex items-center gap-3 flex-wrap">
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 font-label-badge text-label-badge font-semibold">
<span className="material-symbols-outlined text-[14px]">sync</span>
              IN PROGRESS (40%)
            </span>
<div className="flex items-center gap-1.5 font-body-sm text-body-sm text-outline">
<span className="material-symbols-outlined text-[16px]">calendar_month</span>
<span>Target: <strong className="text-on-surface">Nov 05, 2024</strong> <span className="text-outline font-label-code text-[11px]">(13 days left)</span></span>
</div>
<button className="w-7 h-7 rounded-lg hover:bg-surface-container-highest flex items-center justify-center text-outline hover:text-on-surface transition-colors" type="button">
<span className="material-symbols-outlined text-[18px]">more_vert</span>
</button>
</div>
</div>
{/*  Deliverable & Content Body  */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md items-start">
<div className="lg:col-span-8 flex flex-col gap-space-sm">
<div className="text-body-md font-body-md text-on-surface-variant">
<span className="font-semibold text-on-surface">Deliverable:</span> Full compliance audit with Acme Security team, zero regressions gate, high-availability multi-region STOMP cluster.
            </div>
<div className="flex items-center gap-2 flex-wrap text-body-sm font-body-sm text-outline">
<span className="text-outline font-label-badge text-label-badge uppercase">Pending Gatekeepers:</span>
<span className="px-2 py-0.5 rounded bg-surface-container-low text-on-surface font-label-code text-label-code border border-outline-variant/30">Acme Infosec Board</span>
<span className="px-2 py-0.5 rounded bg-surface-container-low text-on-surface font-label-code text-label-code border border-outline-variant/30">Chaos Engineering Soak Test</span>
<span className="px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 font-label-code text-label-code border border-amber-400/20">STOMP Cluster US-West-2</span>
</div>
</div>
{/*  Progress Widget  */}
<div className="lg:col-span-4 p-space-sm rounded-lg bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1.5">
<div className="flex items-center justify-between text-body-sm font-body-sm">
<span className="text-outline">Scope Execution</span>
<span className="font-label-code text-label-code text-amber-400 font-semibold">40% (6 / 15 issues closed)</span>
</div>
<div className="w-full bg-surface-container-highest rounded-full h-2 overflow-hidden">
<div className="bg-amber-400 h-2 rounded-full" style={{width: "40%"}}></div>
</div>
<div className="flex items-center justify-between text-[11px] font-label-code text-outline mt-0.5">
<span>9 issues in active review</span>
<span className="text-amber-400">On Track</span>
</div>
</div>
</div>
</div>
{/*  Card 4: Milestone 4: General Availability (GA) v2.0 Global Rollout  */}
<div className="p-space-lg rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col gap-space-md transition-all hover:bg-surface-container-high/60 opacity-90">
<div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm pb-space-sm border-b border-outline-variant/20">
<div className="flex items-center gap-3">
<div className="w-8 h-8 rounded-lg bg-surface-container-highest border border-outline-variant/30 text-outline flex items-center justify-center">
<span className="material-symbols-outlined text-[20px]">public</span>
</div>
<div className="flex flex-col">
<div className="flex items-center gap-2">
<span className="font-label-code text-label-code text-outline">M4 • RELEASE-FINAL</span>
<h3 className="font-headline-sm text-headline-sm text-on-surface">Milestone 4: General Availability (GA) v2.0 Global Rollout</h3>
</div>
<span className="font-body-sm text-body-sm text-outline">Global ingress cutover &amp; legacy engine decommission</span>
</div>
</div>
<div className="flex items-center gap-3 flex-wrap">
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-high border border-outline-variant/30 text-outline font-label-badge text-label-badge font-semibold">
<span className="material-symbols-outlined text-[14px]">hourglass_empty</span>
              UPCOMING (0%)
            </span>
<div className="flex items-center gap-1.5 font-body-sm text-body-sm text-outline">
<span className="material-symbols-outlined text-[16px]">event</span>
<span>Target: <strong className="text-on-surface">Nov 15, 2024</strong> <span className="text-outline font-label-code text-[11px]">(23 days left)</span></span>
</div>
<button className="w-7 h-7 rounded-lg hover:bg-surface-container-highest flex items-center justify-center text-outline hover:text-on-surface transition-colors" type="button">
<span className="material-symbols-outlined text-[18px]">more_vert</span>
</button>
</div>
</div>
{/*  Deliverable & Content Body  */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md items-start">
<div className="lg:col-span-8 flex flex-col gap-space-sm">
<div className="text-body-md font-body-md text-on-surface-variant">
<span className="font-semibold text-on-surface">Deliverable:</span> Production DNS switch, enterprise billing hooks integration, and deprecation of v1 legacy engines.
            </div>
<div className="flex items-center gap-2 flex-wrap text-body-sm font-body-sm text-outline">
<span className="text-outline font-label-badge text-label-badge uppercase">Prerequisites:</span>
<span className="px-2 py-0.5 rounded bg-surface-container-low text-outline font-label-code text-label-code border border-outline-variant/30">M2 Beta Passed</span>
<span className="px-2 py-0.5 rounded bg-surface-container-low text-outline font-label-code text-label-code border border-outline-variant/30">M3 Audit Signed</span>
<span className="px-2 py-0.5 rounded bg-surface-container-low text-outline font-label-code text-label-code border border-outline-variant/30">Marketing Launch Comms</span>
</div>
</div>
{/*  Progress Widget  */}
<div className="lg:col-span-4 p-space-sm rounded-lg bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1.5">
<div className="flex items-center justify-between text-body-sm font-body-sm">
<span className="text-outline">Scope Execution</span>
<span className="font-label-code text-label-code text-outline font-semibold">0% (0 / 12 planned)</span>
</div>
<div className="w-full bg-surface-container-highest rounded-full h-2 overflow-hidden">
<div className="bg-outline h-2 rounded-full" style={{width: "0%"}}></div>
</div>
<div className="flex items-center justify-between text-[11px] font-label-code text-outline mt-0.5">
<span>Locked pending M2 &amp; M3 closure</span>
<span className="text-outline">Planned</span>
</div>
</div>
</div>
</div>
</div>
{/*  3. Interactive Milestone Gantt Roadmap Preview Strip  */}
<div className="p-space-lg rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col gap-space-md shadow-sm">
<div className="flex items-center justify-between flex-wrap gap-2 pb-space-sm border-b border-outline-variant/20">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-[20px] text-primary">linear_scale</span>
<h3 className="font-headline-sm text-headline-sm text-on-surface">Milestone Roadmap &amp; Timeline Projection</h3>
<span className="font-label-code text-label-code text-outline text-[11px]">Q4 2024 Release Cadence</span>
</div>
<div className="flex items-center gap-3">
<div className="flex items-center gap-1.5 text-body-sm font-body-sm text-outline">
<span className="w-2.5 h-2.5 rotate-45 bg-emerald-400"></span>
<span>Completed</span>
</div>
<div className="flex items-center gap-1.5 text-body-sm font-body-sm text-outline">
<span className="w-2.5 h-2.5 rotate-45 bg-primary animate-pulse"></span>
<span className="text-primary font-medium">Current Target</span>
</div>
<div className="flex items-center gap-1.5 text-body-sm font-body-sm text-outline">
<span className="w-2.5 h-2.5 rotate-45 bg-amber-400"></span>
<span>In Review</span>
</div>
<div className="flex items-center gap-1.5 text-body-sm font-body-sm text-outline">
<span className="w-2.5 h-2.5 rotate-45 bg-outline"></span>
<span>Upcoming</span>
</div>
</div>
</div>
{/*  Roadmap Timeline Visualizer  */}
<div className="relative w-full pt-4 pb-2 px-2 overflow-x-auto">
<div className="min-w-[700px] flex flex-col gap-8">
{/*  Horizontal Timeline Baseline Bar  */}
<div className="relative w-full h-1 bg-surface-container-highest rounded-full">
{/*  Completed segment  */}
<div className="absolute left-0 top-0 h-1 bg-emerald-400 rounded-full" style={{width: "25%"}}></div>
{/*  In-progress segment  */}
<div className="absolute left-[25%] top-0 h-1 bg-primary-container" style={{width: "28%"}}></div>
{/*  Diamond Milestone 1 (Oct 25)  */}
<div className="absolute left-[25%] -top-2 flex flex-col items-center -translate-x-1/2 cursor-pointer group">
<div className="w-5 h-5 rotate-45 bg-emerald-400 border-2 border-surface flex items-center justify-center shadow transition-transform group-hover:scale-125">
<span className="material-symbols-outlined text-[10px] text-surface font-bold -rotate-45">check</span>
</div>
<div className="flex flex-col items-center mt-3 text-center">
<span className="font-label-code text-label-code text-emerald-400 font-semibold">M1: Token Ingestion</span>
<span className="text-[11px] font-body-sm text-outline">Oct 25 (Done)</span>
</div>
</div>
{/*  Diamond Milestone 2 (Oct 29 - TODAY TARGET)  */}
<div className="absolute left-[53%] -top-2.5 flex flex-col items-center -translate-x-1/2 cursor-pointer group">
<div className="w-6 h-6 rotate-45 bg-primary-container border-2 border-surface flex items-center justify-center shadow-lg shadow-primary-container/40 ring-2 ring-primary transition-transform group-hover:scale-125">
<span className="material-symbols-outlined text-[12px] text-on-primary-container font-bold -rotate-45">flag</span>
</div>
<div className="flex flex-col items-center mt-3 text-center">
<span className="px-2 py-0.5 rounded bg-primary-container text-on-primary-container font-label-code text-label-code font-bold">M2: Nexus 2.0 Beta RC</span>
<span className="text-[11px] font-body-sm text-primary font-medium">Oct 29 (Target)</span>
</div>
</div>
{/*  Diamond Milestone 3 (Nov 05)  */}
<div className="absolute left-[75%] -top-2 flex flex-col items-center -translate-x-1/2 cursor-pointer group">
<div className="w-5 h-5 rotate-45 bg-amber-400 border-2 border-surface flex items-center justify-center shadow transition-transform group-hover:scale-125">
<span className="material-symbols-outlined text-[10px] text-surface font-bold -rotate-45">sync</span>
</div>
<div className="flex flex-col items-center mt-3 text-center">
<span className="font-label-code text-label-code text-amber-400 font-semibold">M3: Client Acceptance</span>
<span className="text-[11px] font-body-sm text-outline">Nov 05</span>
</div>
</div>
{/*  Diamond Milestone 4 (Nov 15)  */}
<div className="absolute left-[96%] -top-2 flex flex-col items-center -translate-x-1/2 cursor-pointer group">
<div className="w-5 h-5 rotate-45 bg-surface-bright border-2 border-surface flex items-center justify-center shadow transition-transform group-hover:scale-125">
<span className="material-symbols-outlined text-[10px] text-outline font-bold -rotate-45">schedule</span>
</div>
<div className="flex flex-col items-center mt-3 text-center">
<span className="font-label-code text-label-code text-outline font-semibold">M4: General Availability</span>
<span className="text-[11px] font-body-sm text-outline">Nov 15 (Final)</span>
</div>
</div>
</div>
{/*  Bottom Dates Ticks Strip  */}
<div className="flex items-center justify-between text-[11px] font-label-code text-outline pt-6 border-t border-outline-variant/10">
<span>Sprint 13 Kickoff (Oct 14)</span>
<span>Sprint 14 Cutoff (Oct 31)</span>
<span>Code Freeze Gate (Nov 08)</span>
<span>Production Deployment (Nov 15)</span>
</div>
</div>
</div>
</div>
</div>
    </div>
  );
}
