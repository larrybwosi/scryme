"use client";

import Link from "next/link";
import { useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from "lucide-react";

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState("October 2024");

  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2E3039]/50 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span className="text-[#5E6AD2]">Nexus 2.0</span>
            <span>/</span>
            <span className="text-slate-200 font-medium">Calendar</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">
            Sprint Release Calendar
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Key milestone target dates, deployment windows, and task deadlines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#12141A] border border-[#2E3039] rounded-md p-1 text-xs">
            <button type="button" className="p-1 text-slate-400 hover:text-slate-200">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-semibold text-slate-200 px-2 font-mono">{currentMonth}</span>
            <button type="button" className="p-1 text-slate-400 hover:text-slate-200">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <Link
            href="/new"
            className="inline-flex items-center gap-1.5 bg-[#5E6AD2] hover:bg-[#717DE3] text-white px-3 py-1.5 rounded-md text-xs font-medium transition-all shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Event</span>
          </Link>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-[#12141A] border border-[#2E3039] rounded-lg overflow-hidden p-4">
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider mb-2 border-b border-[#2E3039]/50 pb-2">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        <div className="grid grid-cols-7 gap-1 min-h-[500px]">
          {daysInMonth.map((day) => (
            <div
              key={day}
              className={`bg-[#171922] border border-[#2E3039]/40 rounded-md p-2 flex flex-col justify-between hover:border-[#5E6AD2]/50 transition-colors ${
                day === 24 ? "border-[#5E6AD2] bg-[#1f1f23]" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-mono font-semibold ${
                    day === 24 ? "text-[#5E6AD2] bg-[#5E6AD2]/20 px-1.5 rounded" : "text-slate-400"
                  }`}
                >
                  {day}
                </span>
              </div>

              <div className="space-y-1 my-1">
                {day === 14 && (
                  <div className="bg-[#5E6AD2]/20 text-[#5E6AD2] border border-[#5E6AD2]/30 px-1.5 py-0.5 rounded text-[10px] truncate font-mono">
                    SCR-104 Release
                  </div>
                )}
                {day === 28 && (
                  <div className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded text-[10px] truncate font-mono">
                    v2.0 Beta RC
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
