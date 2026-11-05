"use client";

import React, { useState } from "react";
import { Plus, X, Trash2 } from "lucide-react";
import {
  useSprints,
  useCreateSprint,
  useDeleteSprint,
} from "@/lib/hooks/use-projects";

export function CyclesTab({ projectId }: { projectId: string }) {
  const { data: sprints = [], isLoading } = useSprints(projectId);
  const createSprintMutation = useCreateSprint(projectId);
  const deleteSprintMutation = useDeleteSprint(projectId);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [scopePoints, setScopePoints] = useState("20");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !projectId) return;

    await createSprintMutation.mutateAsync({
      name: name.trim(),
      goal: goal.trim() || undefined,
      scopePoints: parseInt(scopePoints, 10) || 0,
      status: "PLANNED",
    });

    setName("");
    setGoal("");
    setIsCreateOpen(false);
  };

  return (
    <div className="flex flex-col w-full gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
            Cycles & Sprints Roadmap
          </h2>
          <p className="text-body-sm text-outline">
            Iteration cadences and sprint goals
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="h-8 px-3 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>New Sprint Cycle</span>
        </button>
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-lg bg-surface-container-low border border-outline-variant/50 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Create Sprint Cycle</h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="w-6 h-6 rounded flex items-center justify-center text-outline hover:text-on-surface"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="flex flex-col gap-4 mt-4">
              <div>
                <label className="block text-body-sm font-medium text-on-surface mb-1">Cycle Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sprint 15: Core UI Architecture"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-8 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary-container"
                />
              </div>
              <div>
                <label className="block text-body-sm font-medium text-on-surface mb-1">Sprint Goal</label>
                <input
                  type="text"
                  placeholder="Deliverable objective"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full h-8 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary-container"
                />
              </div>
              <div>
                <label className="block text-body-sm font-medium text-on-surface mb-1">Story Points Scope</label>
                <input
                  type="number"
                  min="0"
                  value={scopePoints}
                  onChange={(e) => setScopePoints(e.target.value)}
                  className="w-full h-8 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary-container"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-body-sm text-outline hover:text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSprintMutation.isPending}
                  className="px-4 py-1.5 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm disabled:opacity-50"
                >
                  {createSprintMutation.isPending ? "Creating..." : "Create Cycle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="p-8 text-center text-outline text-body-sm">
          Loading sprint cycles...
        </div>
      )}

      {!isLoading && sprints.length === 0 && (
        <div className="p-12 rounded-lg bg-surface-container-low border border-dashed border-outline-variant/30 text-center text-outline text-body-sm">
          No sprint cycles created for this project yet.
        </div>
      )}

      {!isLoading && sprints.length > 0 && (
        <div className="flex flex-col gap-3">
          {sprints.map((sprint) => (
            <div
              key={sprint.id}
              className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-wrap items-center justify-between gap-4 hover:border-outline-variant transition-colors"
            >
              <div className="flex flex-col gap-1 min-w-[240px]">
                <div className="flex items-center gap-2">
                  <span className="font-headline-sm text-body-md text-on-surface font-semibold">{sprint.name}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-label-badge uppercase ${
                      sprint.status === "ACTIVE"
                        ? "bg-primary-container/20 text-primary"
                        : sprint.status === "COMPLETED"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-surface-container text-outline"
                    }`}
                  >
                    {sprint.status}
                  </span>
                </div>
                {sprint.goal && (
                  <span className="text-[11px] text-outline">{sprint.goal}</span>
                )}
              </div>

              <div className="flex items-center gap-6 text-[12px] font-label-code">
                <div>
                  <span className="text-outline">Scope: </span>
                  <span className="text-on-surface">{sprint.scopePoints} pts</span>
                </div>
                <div>
                  <span className="text-outline">Completed: </span>
                  <span className="text-on-surface">{sprint.completedPoints} pts</span>
                </div>
                <button
                  type="button"
                  onClick={() => deleteSprintMutation.mutate(sprint.id)}
                  className="text-outline hover:text-red-400 p-1 transition-colors"
                  title="Delete Sprint"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
