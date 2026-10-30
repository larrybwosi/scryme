"use client";

import Link from "next/link";
import { useMilestones } from "@/lib/hooks/use-projects";
import { useTasks } from "@/lib/hooks/use-projects";
import {
  Clock,
  Plus,
  Milestone,
  Calendar,
  CheckCircle2,
  ChevronRight
} from "lucide-react";

export default function GanttTimelinePage() {
  const { data: milestones = [], isLoading: loadingMilestones } = useMilestones();
  const { data: tasks = [] } = useTasks();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2E3039]/50 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span className="text-[#5E6AD2]">Nexus 2.0</span>
            <span>/</span>
            <span className="text-slate-200 font-medium">Gantt Timeline</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">
            Roadmap & Milestone Schedule
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Sequential task dependencies, milestone release targets, and critical path timelines.
          </p>
        </div>

        <Link
          href="/new"
          className="inline-flex items-center gap-1.5 bg-[#5E6AD2] hover:bg-[#717DE3] text-white px-3 py-1.5 rounded-md text-xs font-medium transition-all shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Milestone</span>
        </Link>
      </div>

      {/* Gantt View Container */}
      <div className="bg-[#12141A] border border-[#2E3039] rounded-lg overflow-hidden p-4 space-y-4">
        {/* Timeline Header Scale */}
        <div className="grid grid-cols-12 gap-1 bg-[#171922] p-2 rounded border border-[#2E3039]/60 text-[10px] font-mono text-slate-400 text-center uppercase tracking-wider">
          <div className="col-span-3 text-left pl-2 text-slate-200 font-semibold">Milestone / Scope</div>
          <div className="col-span-1">Oct W1</div>
          <div className="col-span-1">Oct W2</div>
          <div className="col-span-1">Oct W3</div>
          <div className="col-span-1 text-[#5E6AD2] font-semibold">Oct W4</div>
          <div className="col-span-1">Nov W1</div>
          <div className="col-span-1">Nov W2</div>
          <div className="col-span-1">Nov W3</div>
          <div className="col-span-1">Nov W4</div>
          <div className="col-span-1">Dec W1</div>
        </div>

        {/* Milestone Timeline Rows */}
        {loadingMilestones ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            Loading timeline dependencies...
          </div>
        ) : milestones.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No milestones scheduled yet.
          </div>
        ) : (
          <div className="space-y-3">
            {milestones.map((m, idx) => (
              <div
                key={m.id}
                className="grid grid-cols-12 gap-1 items-center bg-[#171922] p-2.5 rounded border border-[#2E3039]/50 hover:border-[#5E6AD2]/50 transition-colors text-xs"
              >
                <div className="col-span-3 flex items-center gap-2 pr-2">
                  <Milestone className="h-4 w-4 text-[#5E6AD2] shrink-0" />
                  <div className="truncate">
                    <div className="font-semibold text-slate-200 truncate">{m.title}</div>
                    <div className="text-[10px] text-slate-400 font-mono">Due {m.dueDate || "Oct 30"}</div>
                  </div>
                </div>

                {/* Timeline Bar (Dynamic Offset Visualizer) */}
                <div className="col-span-9 bg-[#0d0e11] h-6 rounded border border-[#2E3039]/40 relative overflow-hidden flex items-center px-2">
                  <div
                    className="bg-[#5E6AD2]/80 hover:bg-[#5E6AD2] h-4 rounded text-[10px] font-mono text-white flex items-center px-2 shadow-sm transition-all"
                    style={{
                      marginLeft: `${(idx * 15) % 50}%`,
                      width: `${40 + (idx * 10) % 40}%`
                    }}
                  >
                    <span className="truncate">Progress 75%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
