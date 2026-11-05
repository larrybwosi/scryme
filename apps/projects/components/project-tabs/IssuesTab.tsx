"use client";

import React, { useState } from "react";
import { Plus, Check } from "lucide-react";
import { useTasks, useCreateTask, useUpdateTaskStatus } from "@/lib/hooks/use-projects";
import { Task } from "@/lib/api";
import Link from "next/link";

export function IssuesTab({ projectId }: { projectId: string }) {
  const { data: tasks = [], isLoading } = useTasks(projectId);
  const createTaskMutation = useCreateTask(projectId);
  const updateTaskStatusMutation = useUpdateTaskStatus(projectId);

  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<Task["priority"]>("MEDIUM");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await createTaskMutation.mutateAsync({
      title: newTitle.trim(),
      projectId,
      priority: newPriority,
      status: "TODO",
    });

    setNewTitle("");
    setIsNewOpen(false);
  };

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
          className="px-3 py-1 bg-primary-container text-on-primary-container rounded-lg font-headline-sm text-body-sm flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          <span>Add Issue</span>
        </button>
      </div>

      {isNewOpen && (
        <form onSubmit={handleCreate} className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-3">
          <input
            type="text"
            required
            placeholder="Issue title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="h-8 px-3 rounded bg-surface-container border border-outline-variant text-on-surface text-body-sm"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsNewOpen(false)}
              className="px-3 py-1 text-outline text-body-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1 bg-primary-container text-on-primary-container rounded font-headline-sm text-body-sm"
            >
              Create
            </button>
          </div>
        </form>
      )}

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
                {task.title?.includes("[On-Demand]") && (
                  <span className="text-[10px] font-label-code px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold uppercase tracking-wider">
                    On-Demand
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
