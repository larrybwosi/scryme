"use client";

import React, { useState } from "react";
import {
  useMilestones,
  useCreateMilestone,
  useUpdateMilestone,
  useDeleteMilestone,
} from "@/lib/hooks/use-projects";
import { Milestone } from "@/lib/api";

export function MilestonesTab({ projectId }: { projectId: string }) {
  const { data: milestones = [], isLoading } = useMilestones(projectId);
  const createMilestoneMutation = useCreateMilestone(projectId);
  const updateMilestoneMutation = useUpdateMilestone(projectId);
  const deleteMilestoneMutation = useDeleteMilestone(projectId);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId) return;

    await createMilestoneMutation.mutateAsync({
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate: dueDate || undefined,
      status: "OPEN",
    });

    setTitle("");
    setDescription("");
    setDueDate("");
    setIsCreateOpen(false);
  };

  const handleToggleStatus = (m: Milestone) => {
    const nextStatus = m.status === "COMPLETED" ? "IN_PROGRESS" : "COMPLETED";
    updateMilestoneMutation.mutate({ milestoneId: m.id, data: { status: nextStatus } });
  };

  return (
    <div className="flex flex-col w-full gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
            Release Milestones
          </h2>
          <p className="text-body-sm text-outline">
            Track project deliverables and release targets
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="h-8 px-3 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm flex items-center gap-1.5 shadow-sm transition-all"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>New Milestone</span>
        </button>
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-lg bg-surface-container-low border border-outline-variant/50 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Create Milestone</h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="w-6 h-6 rounded flex items-center justify-center text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <form onSubmit={handleCreate} className="flex flex-col gap-4 mt-4">
              <div>
                <label className="block text-body-sm font-medium text-on-surface mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Beta Release Candidate"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-8 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary-container"
                />
              </div>
              <div>
                <label className="block text-body-sm font-medium text-on-surface mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Target scope or deliverable"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full h-8 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary-container"
                />
              </div>
              <div>
                <label className="block text-body-sm font-medium text-on-surface mb-1">Target Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
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
                  disabled={createMilestoneMutation.isPending}
                  className="px-4 py-1.5 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm disabled:opacity-50"
                >
                  {createMilestoneMutation.isPending ? "Creating..." : "Create Milestone"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="p-8 text-center text-outline text-body-sm">
          Loading milestones...
        </div>
      )}

      {!isLoading && milestones.length === 0 && (
        <div className="p-12 rounded-lg bg-surface-container-low border border-dashed border-outline-variant/30 text-center text-outline text-body-sm">
          No milestones defined for this project yet.
        </div>
      )}

      {!isLoading && milestones.length > 0 && (
        <div className="flex flex-col gap-3">
          {milestones.map((m) => {
            const isCompleted = m.status === "COMPLETED";
            return (
              <div
                key={m.id}
                className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 flex items-center justify-between gap-4 hover:border-outline-variant transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(m)}
                    className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                      isCompleted
                        ? "bg-primary-container border-primary-container text-on-primary-container"
                        : "border-outline-variant hover:border-outline bg-surface-container"
                    }`}
                  >
                    {isCompleted && <span className="material-symbols-outlined text-[14px]">check</span>}
                  </button>
                  <div className="flex flex-col min-w-0">
                    <span className={`font-headline-sm text-body-md font-semibold ${
                      isCompleted ? "line-through text-outline" : "text-on-surface"
                    }`}>
                      {m.title}
                    </span>
                    <span className="text-[11px] text-outline truncate">
                      {m.description || "--"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-[11px] font-label-code text-outline">
                    {m.dueDate ? new Date(m.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "No date"}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-label-code ${
                    isCompleted ? "bg-emerald-500/20 text-emerald-400" : "bg-surface-container text-primary"
                  }`}>
                    {m.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteMilestoneMutation.mutate(m.id)}
                    className="text-outline hover:text-red-400 p-1 transition-colors"
                    title="Delete Milestone"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
