"use client";

import Link from "next/link";
import React, { useState } from "react";
import { INITIAL_TASKS, TaskItem } from "@/lib/mock-data";

export function IssuesTab() {
  const [tasks, setTasks] = useState<TaskItem[]>(
    INITIAL_TASKS.filter((t) => t.projectId === "prj-204")
  );
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = tasks.filter((t) => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return t.title.toLowerCase().includes(q) || t.id.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Top Header & Search */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
            Nexus 2.0 Redesign & Kinetic Real-Time Engine Issues
          </h2>
          <p className="text-body-sm text-outline">
            58 Tracked Work Items • Sprint 14 Execution Scope
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-low border border-outline-variant/30 text-outline focus-within:text-on-surface">
            <span className="material-symbols-outlined text-[14px]">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search project issues..."
              className="bg-transparent font-body-sm text-body-sm text-on-surface focus:outline-none placeholder:text-outline w-44 md:w-56"
            />
          </div>

          <div className="flex items-center gap-1 bg-surface-container-lowest p-1 rounded-lg border border-outline-variant/30 text-body-sm">
            {["all", "In Progress", "In Review", "Todo", "Done"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilterStatus(s)}
                className={`px-2 py-0.5 rounded text-[11px] font-label-code ${
                  filterStatus === s
                    ? "bg-surface-container-high text-on-surface font-medium"
                    : "text-outline hover:text-on-surface"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <Link
            href="/tasks"
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm shadow-sm transition-all"
          >
            <span className="material-symbols-outlined text-[15px]">add</span>
            <span>New Issue</span>
          </Link>
        </div>
      </div>

      {/* Issues Table */}
      <div className="rounded-lg bg-surface-container-low border border-outline-variant/30 overflow-hidden shadow-sm">
        <table className="w-full text-left font-body-sm">
          <thead className="bg-surface-container-high/40 text-outline text-[11px] font-label-badge uppercase tracking-wider border-b border-outline-variant/30">
            <tr>
              <th className="px-4 py-2.5">Key</th>
              <th className="px-4 py-2.5">Summary</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Priority</th>
              <th className="px-4 py-2.5">Assignee</th>
              <th className="px-4 py-2.5 text-right">Cycle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {filtered.map((task) => (
              <tr key={task.id} className="hover:bg-surface-container transition-colors group">
                <td className="px-4 py-3">
                  <Link
                    href={`/tasks/${task.id}`}
                    className="font-label-code text-label-code text-primary hover:underline"
                  >
                    {task.id}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/tasks/${task.id}`}
                    className="font-body-md text-on-surface group-hover:text-primary transition-colors"
                  >
                    {task.title}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded text-[11px] font-label-code bg-surface-container-high text-on-surface-variant">
                    {task.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-label-badge uppercase ${
                      task.priority === "Urgent"
                        ? "bg-red-500/20 text-red-400"
                        : task.priority === "High"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-primary-container/20 text-primary"
                    }`}
                  >
                    {task.priority}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <img
                      src={task.assigneeAvatar}
                      alt={task.assigneeName}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                    <span className="text-[12px] text-on-surface-variant">{task.assigneeName}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-label-code text-[11px] text-outline">
                  {task.cycle}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
