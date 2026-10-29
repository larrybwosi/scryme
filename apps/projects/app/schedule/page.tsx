"use client";

import { Calendar as CalendarIcon, Clock, Users, ArrowUpRight } from "lucide-react";

export default function SchedulePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <CalendarIcon className="h-6 w-6 text-indigo-400" /> Schedule & Shift Allocations
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Bridge project work packages with employee shifts and scheduling overrides via V3 Scheduling Module.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#121824] border border-[#1F293D] p-5 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase">Assigned Shifts</span>
            <Clock className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100">18 Shifts</div>
          <p className="text-xs text-slate-500">Linked to Project Milestones</p>
        </div>

        <div className="bg-[#121824] border border-[#1F293D] p-5 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase">Active Staff</span>
            <Users className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">12 Members</div>
          <p className="text-xs text-slate-500">On duty this sprint</p>
        </div>

        <div className="bg-[#121824] border border-[#1F293D] p-5 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase">Schedule Overrides</span>
            <ArrowUpRight className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">2 Requests</div>
          <p className="text-xs text-slate-500">Pending approval</p>
        </div>
      </div>

      <div className="bg-[#121824] border border-[#1F293D] rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-100">Weekly Shift Schedule Grid</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B0F17] border-b border-[#1F293D] text-slate-400 font-mono text-[10px] uppercase">
              <tr>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Mon</th>
                <th className="px-4 py-3">Tue</th>
                <th className="px-4 py-3">Wed</th>
                <th className="px-4 py-3">Thu</th>
                <th className="px-4 py-3">Fri</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F293D] text-slate-300">
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-100">Alex Johnson</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">09:00 - 17:00</span></td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">09:00 - 17:00</span></td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">09:00 - 17:00</span></td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">09:00 - 17:00</span></td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">09:00 - 17:00</span></td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-100">Sarah Chen</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">10:00 - 18:00</span></td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">10:00 - 18:00</span></td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">10:00 - 18:00</span></td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">10:00 - 18:00</span></td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-slate-800 text-slate-500">OFF</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
