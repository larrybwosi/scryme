"use client";

import Link from "next/link";
import { useMilestones } from "@/lib/hooks/use-projects";
import { Milestone, Calendar, Plus, Flag } from "lucide-react";

export default function MilestonesPage() {
  const { data: milestones = [], isLoading } = useMilestones();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2E3039]/50 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span className="text-[#5E6AD2]">Nexus 2.0</span>
            <span>/</span>
            <span className="text-slate-200 font-medium">Release Milestones</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">
            Project Milestones & Deliverables
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Key delivery targets, milestone completion tracking, and sprint goals.
          </p>
        </div>

        <Link
          href="/new"
          className="inline-flex items-center gap-1.5 bg-[#5E6AD2] hover:bg-[#717DE3] text-white px-3 py-1.5 rounded-md text-xs font-medium transition-all shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Milestone</span>
        </Link>
      </div>

      {/* Milestones Grid */}
      {isLoading ? (
        <div className="py-12 text-center text-slate-500 text-xs">
          Loading milestones...
        </div>
      ) : milestones.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-xs bg-[#12141A] rounded-lg border border-[#2E3039]">
          No milestones defined yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {milestones.map((m) => (
            <div
              key={m.id}
              className="bg-[#12141A] border border-[#2E3039] hover:border-[#5E6AD2]/50 rounded-lg p-4 space-y-3 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase bg-[#5E6AD2]/10 text-[#5E6AD2] border border-[#5E6AD2]/20 flex items-center gap-1">
                  <Flag className="h-3 w-3" />
                  <span>{m.status || "PLANNED"}</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-slate-500" />
                  <span>{m.dueDate || "Oct 30, 2024"}</span>
                </span>
              </div>

              <h2 className="text-sm font-semibold text-slate-200">{m.title}</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                {m.description || "Core milestone tracking critical delivery objectives and architectural benchmarks."}
              </p>

              <div className="space-y-1 pt-2 border-t border-[#2E3039]/50">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Completion</span>
                  <span className="font-mono text-slate-200">75%</span>
                </div>
                <div className="w-full bg-[#1f1f23] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#5E6AD2] h-full rounded-full" style={{ width: "75%" }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
