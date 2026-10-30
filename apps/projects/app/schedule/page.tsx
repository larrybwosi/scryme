"use client";

import Link from "next/link";
import { useState } from "react";
import { Calendar, Clock, Plus, Users, Filter, ChevronLeft, ChevronRight } from "lucide-react";

export default function SchedulePage() {
  const [shifts, setShifts] = useState([
    { id: "1", member: "Elena Rostova", shift: "08:00 - 16:30", role: "Frontend Lead", location: "Canvas Team" },
    { id: "2", member: "Arbian Musaf", shift: "09:00 - 17:30", role: "Graphics Specialist", location: "WebGL Team" },
    { id: "3", member: "Sophia Vance", shift: "12:00 - 20:30", role: "QA Engineer", location: "Automation Team" },
  ]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2E3039]/50 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span className="text-[#5E6AD2]">Nexus 2.0</span>
            <span>/</span>
            <span className="text-slate-200 font-medium">Workforce Schedule</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">
            Engineering On-Call & Shift Roster
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Shift coverage, rotation schedules, and availability windows.
          </p>
        </div>

        <Link
          href="/new"
          className="inline-flex items-center gap-1.5 bg-[#5E6AD2] hover:bg-[#717DE3] text-white px-3 py-1.5 rounded-md text-xs font-medium transition-all shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Shift</span>
        </Link>
      </div>

      {/* Roster Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {shifts.map((s) => (
          <div
            key={s.id}
            className="bg-[#12141A] border border-[#2E3039] hover:border-[#5E6AD2]/50 p-4 rounded-lg space-y-3 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#5E6AD2]/20 text-[#5E6AD2] font-bold text-xs flex items-center justify-center">
                  <Users className="h-3 w-3" />
                </div>
                <span className="text-xs font-semibold text-slate-200">{s.member}</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-[#171922] text-[10px] font-mono text-slate-400 border border-[#2E3039]">
                {s.role}
              </span>
            </div>

            <div className="pt-2 border-t border-[#2E3039]/50 flex items-center justify-between text-xs text-slate-300">
              <span className="flex items-center gap-1 font-mono">
                <Clock className="h-3.5 w-3.5 text-[#5E6AD2]" />
                <span>{s.shift}</span>
              </span>
              <span className="text-slate-400 font-mono text-[11px]">{s.location}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
