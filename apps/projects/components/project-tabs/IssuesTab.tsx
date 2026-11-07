"use client";

import React, { useState } from "react";
import { Plus, Check } from "lucide-react";
import { useTasks, useUpdateTaskStatus } from "@/lib/hooks/use-projects";
import { Task } from "@/lib/api";
import { CreateTaskModal } from "@/components/CreateTaskModal";
import Link from "next/link";

export function IssuesTab({ projectId }: { projectId: string }) {
  const { data: tasks = [], isLoading } = useTasks(projectId);
  const updateTaskStatusMutation = useUpdateTaskStatus(projectId);

  const [isNewOpen, setIsNewOpen] = useState(false);

  const toggleTask = (task: Task) => {
    const nextStatus = task.status === "DONE" ? "IN_PROGRESS" : "DONE";
    updateTaskStatusMutation.mutate({ taskId: task.id, status: nextStatus });
  };

  return (
    <div className="flex flex-col w-full gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
          Project Issues ({tasks.length})
        </h3>
        <button
          type="button"
          onClick={() => setIsNewOpen(true)}
          className="px-3 py-1 bg-primary-container text-on-primary-container rounded-lg font-headline-sm text-body-sm flex items-center gap-1 shadow-sm hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          <span>Add Issue</span>
        </button>
      </div>

      <CreateTaskModal
        isOpen={isNewOpen}
        onClose={() => setIsNewOpen(false)}
        defaultProjectId={projectId}
      />

      {isLoading && (
        <div className="p-8 text-center text-outline text-body-sm">Loading issues...</div>
      )}

      {!isLoading && tasks.length === 0 && (
        <div className="p-8 text-center text-outline text-body-sm border border-dashed border-outline-variant/30 rounded-lg">
          No issues logged for this project yet.
        </div>
      )}

      {!isLoading && tasks.length > 0 && (
        <div className="divide-y divide-outline-variant/20 rounded-lg border border-outline-variant/30 bg-surface-container-low overflow-hidden">
          {tasks.map((task) => (
            <div key={task.id} className="p-3 flex items-center justify-between hover:bg-surface-container transition-colors">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleTask(task)}
                  className={`w-4 h-4 rounded-xs border flex items-center justify-center ${
                    task.status === "DONE" ? "bg-primary-container text-on-primary-container" : "border-outline-variant"
                  }`}
                >
                  {task.status === "DONE" && <Check className="h-3 w-3" />}
                </button>
                <Link href={`/tasks/${task.id}`} className="font-label-code text-primary text-[11px]">
                  {task.taskKey || task.id.slice(-6)}
                </Link>
                <Link href={`/tasks/${task.id}`} className={`text-body-sm ${task.status === "DONE" ? "line-through text-outline" : "text-on-surface"}`}>
                  {task.title}
                </Link>
                {task.bookingId && (
                  <span className="text-[10px] font-label-code px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">
                    Booking
                  </span>
                )}
                {task.batches && task.batches.length > 0 && (
                  <span className="text-[10px] font-label-code px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Batch
                  </span>
                )}
              </div>
              <span className="text-[10px] font-label-code px-2 py-0.5 rounded bg-surface-container text-outline">
                {task.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
