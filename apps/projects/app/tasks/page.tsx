"use client";

import Link from "next/link";
import { useState } from "react";
import { useTasks, useUpdateTaskStatus } from "@/lib/hooks/use-projects";
import {
  CheckCircle2,
  Circle,
  Clock,
  Filter,
  Plus,
  Search,
  Flame,
  User,
  ArrowRight
} from "lucide-react";

export default function TasksPage() {
  const { data: tasks = [], isLoading } = useTasks();
  const updateTaskStatus = useUpdateTaskStatus();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const filteredTasks = tasks.filter((task) => {
    const matchesFilter =
      filter === "ALL" ||
      (filter === "IN_PROGRESS" && (task.status === "IN_PROGRESS" || task.status === "IN_REVIEW")) ||
      (filter === "DONE" && task.status === "DONE") ||
      (filter === "TODO" && (task.status === "TODO" || task.status === "BACKLOG"));
    const matchesSearch =
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.id.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleStatusToggle = (taskId: string, currentStatus: string) => {
    const nextStatus =
      currentStatus === "DONE" ? "IN_PROGRESS" : "DONE";
    updateTaskStatus.mutate({ taskId, status: nextStatus });
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2E3039]/50 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span className="text-[#5E6AD2]">Nexus 2.0</span>
            <span>/</span>
            <span className="text-slate-200 font-medium">Task List</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">
            Workspace Tasks
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time backlog, sprint execution items, and task priorities.
          </p>
        </div>

        <Link
          href="/new"
          className="inline-flex items-center gap-1.5 bg-[#5E6AD2] hover:bg-[#717DE3] text-white px-3 py-1.5 rounded-md text-xs font-medium transition-all shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Create Issue</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#12141A] p-2.5 rounded-lg border border-[#2E3039]">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or SCR-key..."
            className="w-full bg-[#171922] border border-[#2E3039] rounded-md pl-8 pr-3 py-1 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#5E6AD2]"
          />
        </div>

        <div className="flex items-center gap-1 text-xs font-medium text-slate-400">
          <Filter className="h-3.5 w-3.5 text-slate-500 mr-1" />
          <button
            onClick={() => setFilter("ALL")}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              filter === "ALL"
                ? "bg-[#1f1f23] text-slate-100 border border-[#2E3039]"
                : "hover:text-slate-200"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("IN_PROGRESS")}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              filter === "IN_PROGRESS"
                ? "bg-[#1f1f23] text-amber-400 border border-[#2E3039]"
                : "hover:text-slate-200"
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => setFilter("DONE")}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              filter === "DONE"
                ? "bg-[#1f1f23] text-emerald-400 border border-[#2E3039]"
                : "hover:text-slate-200"
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Task List Table */}
      <div className="bg-[#12141A] border border-[#2E3039] rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            Loading tasks...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No tasks found.
          </div>
        ) : (
          <div className="divide-y divide-[#2E3039]/40">
            {filteredTasks.map((task) => {
              const isDone = task.status === "DONE";
              const isInProgress = task.status === "IN_PROGRESS" || task.status === "IN_REVIEW";

              return (
                <div
                  key={task.id}
                  className="px-4 py-3 flex items-center justify-between hover:bg-[#171922] transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-4">
                    <button
                      type="button"
                      onClick={() => handleStatusToggle(task.id, task.status)}
                      className="text-slate-500 hover:text-[#5E6AD2] transition-colors shrink-0"
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4 text-[#5E6AD2]" />
                      ) : isInProgress ? (
                        <Clock className="h-4 w-4 text-amber-400" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </button>

                    <span className="font-mono text-xs text-[#5E6AD2] font-semibold shrink-0 bg-[#1f1f23] px-1.5 py-0.5 rounded border border-[#2E3039]/60">
                      SCR-{task.id.slice(0, 3).toUpperCase()}
                    </span>

                    <Link
                      href={`/task-detail?id=${task.id}`}
                      className={`text-xs font-medium truncate hover:text-[#5E6AD2] transition-colors ${
                        isDone ? "line-through text-slate-500" : "text-slate-200"
                      }`}
                    >
                      {task.title}
                    </Link>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 text-xs">
                    <span className="hidden sm:flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-[#1f1f23] text-slate-400 border border-[#2E3039]">
                      <Flame className="h-3 w-3 text-amber-400" />
                      <span>{task.priority || "HIGH"}</span>
                    </span>

                    <span className="text-[11px] font-mono text-slate-400">
                      {task.estimatedHours ? `${task.estimatedHours}h est` : "4h est"}
                    </span>

                    <div className="w-5 h-5 rounded-full bg-[#5E6AD2]/20 text-[#5E6AD2] text-[10px] font-bold flex items-center justify-center border border-[#5E6AD2]/30">
                      <User className="h-3 w-3" />
                    </div>

                    <Link
                      href={`/task-detail?id=${task.id}`}
                      className="text-slate-500 hover:text-slate-200 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
