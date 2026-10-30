"use client";

import Link from "next/link";
import { useState } from "react";
import { Clock, Plus, Timer, User, Calendar, Play, StopCircle } from "lucide-react";

export default function TimeTrackingPage() {
  const [entries, setEntries] = useState([
    { id: "1", task: "SCR-104 WebGL Instanced Buffers", duration: "4h 30m", date: "Oct 24", member: "Elena Rostova" },
    { id: "2", task: "SCR-108 Telemetry Frame Scrubbing", duration: "2h 15m", date: "Oct 24", member: "Arbian Musaf" },
    { id: "3", task: "SCR-112 WebSocket Backpressure Benchmarks", duration: "3h 45m", date: "Oct 23", member: "Elena Rostova" },
  ]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2E3039]/50 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span className="text-[#5E6AD2]">Nexus 2.0</span>
            <span>/</span>
            <span className="text-slate-200 font-medium">Time Tracking</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">
            Work Time Logs & Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Tracked engineering hours, task time entries, and sprint utilization.
          </p>
        </div>

        <Link
          href="/new"
          className="inline-flex items-center gap-1.5 bg-[#5E6AD2] hover:bg-[#717DE3] text-white px-3 py-1.5 rounded-md text-xs font-medium transition-all shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Log Time Entry</span>
        </Link>
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#12141A] border border-[#2E3039] p-4 rounded-lg flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Hours Logged This Sprint
            </div>
            <div className="text-xl font-bold text-slate-100 font-mono mt-1">104.5h</div>
          </div>
          <div className="h-9 w-9 rounded-md bg-[#5E6AD2]/10 border border-[#5E6AD2]/20 flex items-center justify-center text-[#5E6AD2]">
            <Clock className="h-4 w-4" />
          </div>
        </div>

        <div className="bg-[#12141A] border border-[#2E3039] p-4 rounded-lg flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Estimated Sprint Total
            </div>
            <div className="text-xl font-bold text-indigo-400 font-mono mt-1">120.0h</div>
          </div>
          <div className="h-9 w-9 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Timer className="h-4 w-4" />
          </div>
        </div>

        <div className="bg-[#12141A] border border-[#2E3039] p-4 rounded-lg flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Efficiency Ratio
            </div>
            <div className="text-xl font-bold text-emerald-400 font-mono mt-1">94.2%</div>
          </div>
          <div className="h-9 w-9 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Clock className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Log Entries Table */}
      <div className="bg-[#12141A] border border-[#2E3039] rounded-lg overflow-hidden">
        <div className="p-3 bg-[#171922] border-b border-[#2E3039] flex items-center justify-between text-xs font-semibold text-slate-200">
          <span>Recent Work Logs</span>
          <span className="text-[11px] font-mono text-slate-400">Sorted by newest</span>
        </div>

        <div className="divide-y divide-[#2E3039]/40 text-xs">
          {entries.map((item) => (
            <div key={item.id} className="p-3.5 flex items-center justify-between hover:bg-[#171922] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded bg-[#5E6AD2]/10 text-[#5E6AD2] flex items-center justify-center font-mono font-bold">
                  <Clock className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="font-semibold text-slate-200">{item.task}</div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3 text-slate-500" />
                      <span>{item.member}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="h-3 w-3 text-slate-500" />
                      <span>{item.date}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="font-mono text-sm font-bold text-[#5E6AD2] bg-[#171922] px-2.5 py-1 rounded border border-[#2E3039]">
                {item.duration}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
