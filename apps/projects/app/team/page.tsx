"use client";

import Link from "next/link";
import { useMembers } from "@/lib/hooks/use-projects";
import { Mail, Plus, User } from "lucide-react";

export default function TeamPage() {
  const { data: members = [] } = useMembers();

  const fallbackMembers = [
    { id: "1", name: "Elena Rostova", role: "Frontend & Graphics Lead", email: "elena@scryme.tech", tasksAssigned: 8 },
    { id: "2", name: "Arbian Musaf", role: "WebGL & Engine Architect", email: "arbian@scryme.tech", tasksAssigned: 5 },
    { id: "3", name: "Sophia Vance", role: "QA & Automation Engineer", email: "sophia@scryme.tech", tasksAssigned: 3 },
  ];

  const displayMembers = members.length > 0
    ? members.map((m) => ({ ...m, tasksAssigned: 5 }))
    : fallbackMembers;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2E3039]/50 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span className="text-[#5E6AD2]">Nexus 2.0</span>
            <span>/</span>
            <span className="text-slate-200 font-medium">Team Roster</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">
            Engineering Team & Workload
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Team squad allocation, active issue assignments, and availability metrics.
          </p>
        </div>

        <Link
          href="/new"
          className="inline-flex items-center gap-1.5 bg-[#5E6AD2] hover:bg-[#717DE3] text-white px-3 py-1.5 rounded-md text-xs font-medium transition-all shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Invite Member</span>
        </Link>
      </div>

      {/* Team Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {displayMembers.map((member) => (
          <div
            key={member.id}
            className="bg-[#12141A] border border-[#2E3039] hover:border-[#5E6AD2]/50 p-4 rounded-lg space-y-3 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#5E6AD2]/20 text-[#5E6AD2] font-bold text-xs flex items-center justify-center border border-[#5E6AD2]/30">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-200">{member.name}</h2>
                  <p className="text-[11px] text-slate-400 font-mono">{member.role}</p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#2E3039]/50 space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2 text-slate-400">
                <Mail className="h-3.5 w-3.5 text-slate-500" />
                <span className="font-mono text-[11px]">{member.email || "dev@scryme.tech"}</span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-400">Tasks Assigned</span>
                <span className="font-mono font-bold text-[#5E6AD2] bg-[#171922] px-2 py-0.5 rounded border border-[#2E3039]">
                  {member.tasksAssigned} active
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
