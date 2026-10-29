"use client";

import { Bell, Search, User } from "lucide-react";

export function Header() {
  return (
    <header className="h-16 border-b border-[#1F293D] bg-[#0B0F17]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-3 w-96">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects, tasks, milestones..."
            className="w-full bg-[#121824] border border-[#1F293D] rounded-lg pl-9 pr-4 py-1.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#121824] transition-colors relative"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-500" />
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-[#1F293D]">
          <div className="h-8 w-8 rounded-full bg-slate-800 border border-[#1F293D] flex items-center justify-center text-slate-300 font-medium text-xs">
            <User className="h-4 w-4" />
          </div>
          <div className="hidden sm:block">
            <div className="text-xs font-medium text-slate-200">Engineering Admin</div>
            <div className="text-[10px] text-slate-400">Scryme Workspaces</div>
          </div>
        </div>
      </div>
    </header>
  );
}
