"use client";

import Link from "next/link";
import { Bell, Search, Plus, Play, StopCircle, User, Folder } from "lucide-react";
import { useState } from "react";

export function Header() {
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  return (
    <header className="h-12 border-b border-[#2E3039]/50 bg-[#0d0e11]/90 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-30 select-none">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Link href="/projects" className="hover:text-slate-200 transition-colors flex items-center gap-1">
            <Folder className="h-3.5 w-3.5 text-slate-400" />
            <span>Workspace</span>
          </Link>
          <span className="text-slate-600">/</span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#171922] border border-[#2E3039] text-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5E6AD2]"></span>
            <span className="font-medium">Nexus 2.0 Redesign</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Active Timer Pill */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#171922] border border-[#2E3039] text-xs">
          <span className={`w-2 h-2 rounded-full ${isTimerRunning ? "bg-[#5E6AD2] animate-pulse" : "bg-slate-500"}`}></span>
          <span className="font-mono text-indigo-300 font-semibold">01:42:15</span>
          <button
            type="button"
            onClick={() => setIsTimerRunning(!isTimerRunning)}
            className="text-slate-400 hover:text-amber-400 transition-colors ml-1"
            title={isTimerRunning ? "Pause Timer" : "Start Timer"}
          >
            {isTimerRunning ? <StopCircle className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Global Search Input */}
        <div className="relative w-48 hidden md:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search... (⌘K)"
            className="w-full bg-[#12141A] border border-[#2E3039] rounded-md pl-8 pr-3 py-1 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#5E6AD2] transition-colors"
          />
        </div>

        {/* Notification Bell */}
        <button
          type="button"
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-[#171922] transition-colors relative"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-[#5E6AD2]" />
        </button>

        {/* Quick New Task Button */}
        <Link
          href="/new"
          className="h-7 px-2.5 bg-[#5E6AD2] hover:bg-[#717DE3] text-white rounded-md text-xs font-medium flex items-center gap-1 transition-colors shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Task</span>
        </Link>

        <div className="h-4 w-px bg-[#2E3039]/60"></div>

        {/* User Profile */}
        <div className="w-7 h-7 rounded-full bg-[#5E6AD2] flex items-center justify-center text-white font-semibold text-xs border border-indigo-400/30">
          <User className="h-3.5 w-3.5" />
        </div>
      </div>
    </header>
  );
}
