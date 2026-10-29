"use client";

import { useEffect, useState } from "react";
import { ProjectsAPI, OrganizationMember, Task } from "@/lib/api";
import { Users, Mail, Shield, CheckCircle2, UserPlus, FolderKanban } from "lucide-react";

export default function TeamAssignmentsPage() {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    Promise.all([
      ProjectsAPI.getMembers(),
      ProjectsAPI.getProjectTasks("proj-1"),
    ]).then(([membersData, tasksData]) => {
      setMembers(membersData);
      setTasks(tasksData);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Users className="h-6 w-6 text-indigo-400" /> Team & Member Assignments
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Assign team members to projects, tasks, and track member allocations across active sprints.
          </p>
        </div>

        <button className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md shadow-indigo-600/20">
          <UserPlus className="h-4 w-4" /> Assign Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {members.map((member) => {
          const assignedCount = tasks.filter((t) => t.assigneeId === member.id).length;

          return (
            <div
              key={member.id}
              className="bg-[#121824] border border-[#1F293D] rounded-xl p-5 space-y-4 hover:border-indigo-500/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm">
                  {member.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">{member.name}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <Mail className="h-3 w-3 text-slate-500" /> {member.email}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#1F293D] flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-slate-400">
                  <Shield className="h-3.5 w-3.5 text-indigo-400" />
                  <span>{member.role}</span>
                </div>
                <div className="flex items-center gap-1 text-emerald-400 font-medium">
                  <FolderKanban className="h-3.5 w-3.5" />
                  <span>{assignedCount} Tasks Assigned</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
