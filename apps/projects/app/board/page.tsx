"use client";

import Link from "next/link";
import { useTasks } from "@/lib/hooks/use-projects";
import {
  Plus,
  MoreHorizontal,
  Flame,
  User,
  Clock
} from "lucide-react";

const columns = [
  { id: "BACKLOG", title: "Backlog", color: "border-slate-500" },
  { id: "TODO", title: "Unstarted / Todo", color: "border-[#5E6AD2]" },
  { id: "IN_PROGRESS", title: "In Progress", color: "border-amber-400" },
  { id: "DONE", title: "Completed", color: "border-emerald-400" },
];

export default function KanbanBoardPage() {
  const { data: tasks = [], isLoading } = useTasks();

  const getTasksByColumn = (columnId: string) => {
    return tasks.filter((t) => {
      if (columnId === "BACKLOG") return t.status === "BACKLOG" || !t.status;
      if (columnId === "TODO") return t.status === "TODO";
      if (columnId === "IN_PROGRESS") return t.status === "IN_PROGRESS" || t.status === "IN_REVIEW";
      if (columnId === "DONE") return t.status === "DONE";
      return false;
    });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2E3039]/50 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span className="text-[#5E6AD2]">Nexus 2.0</span>
            <span>/</span>
            <span className="text-slate-200 font-medium">Kanban Board</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">
            Sprint 14 Interactive Board
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Visual column lanes, task status transitions, and priority tracking.
          </p>
        </div>

        <Link
          href="/new"
          className="inline-flex items-center gap-1.5 bg-[#5E6AD2] hover:bg-[#717DE3] text-white px-3 py-1.5 rounded-md text-xs font-medium transition-all shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Board Item</span>
        </Link>
      </div>

      {/* Board Columns Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-500 text-xs">
          Loading board columns...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4">
          {columns.map((col) => {
            const columnTasks = getTasksByColumn(col.id);

            return (
              <div
                key={col.id}
                className="bg-[#12141A] border border-[#2E3039] rounded-lg p-3 flex flex-col space-y-3 min-h-[500px]"
              >
                {/* Column Header */}
                <div className={`flex items-center justify-between border-b-2 ${col.color} pb-2 px-1`}>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-200">{col.title}</span>
                    <span className="px-1.5 py-0.2 rounded bg-[#171922] text-slate-400 text-[10px] font-mono border border-[#2E3039]">
                      {columnTasks.length}
                    </span>
                  </div>
                  <button type="button" className="text-slate-500 hover:text-slate-300">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Column Task Cards */}
                <div className="space-y-2.5 flex-1">
                  {columnTasks.length === 0 ? (
                    <div className="p-4 border border-dashed border-[#2E3039] rounded text-center text-slate-500 text-[11px]">
                      No items
                    </div>
                  ) : (
                    columnTasks.map((task) => (
                      <div
                        key={task.id}
                        className="bg-[#171922] border border-[#2E3039] hover:border-[#5E6AD2]/60 p-3 rounded-md space-y-2.5 transition-all shadow-sm group"
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-[#5E6AD2] font-semibold">
                            SCR-{task.id.slice(0, 3).toUpperCase()}
                          </span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <Flame className="h-3 w-3 text-amber-400" />
                            <span>{task.priority || "HIGH"}</span>
                          </span>
                        </div>

                        <Link
                          href={`/task-detail?id=${task.id}`}
                          className="text-xs font-medium text-slate-200 group-hover:text-[#5E6AD2] transition-colors line-clamp-2 block"
                        >
                          {task.title}
                        </Link>

                        <div className="flex items-center justify-between pt-2 border-t border-[#2E3039]/50 text-[10px] text-slate-400">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-500" />
                            <span>{task.estimatedHours || 4}h</span>
                          </div>

                          <div className="w-5 h-5 rounded-full bg-[#5E6AD2]/20 text-[#5E6AD2] font-bold flex items-center justify-center border border-[#5E6AD2]/30">
                            <User className="h-3 w-3" />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
