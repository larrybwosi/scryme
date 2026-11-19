"use client";

import { Input } from "@repo/ui/components/ui/input";
import React, { useState } from "react";
import { Plus, Repeat, Trash2 } from "lucide-react";
import {
  useSprints,
  useCreateSprint,
  useDeleteSprint,
} from "@/lib/hooks/use-projects";
import { Dialog } from "@/components/Dialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PageEmpty, PageLoading } from "@/components/PageState";
import { notifyError, notifySuccess } from "@/lib/feedback";

export function CyclesTab({ projectId }: { projectId: string }) {
  const { data: sprints = [], isLoading } = useSprints(projectId);
  const createSprintMutation = useCreateSprint(projectId);
  const deleteSprintMutation = useDeleteSprint(projectId);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [scopePoints, setScopePoints] = useState("20");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !projectId) return;

    try {
      await createSprintMutation.mutateAsync({
        name: name.trim(),
        goal: goal.trim() || undefined,
        scopePoints: parseInt(scopePoints, 10) || 0,
        status: "PLANNED",
      });
      notifySuccess("Cycle created");
      setName("");
      setGoal("");
      setIsCreateOpen(false);
    } catch (error) {
      notifyError(error, "Could not create cycle");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSprintMutation.mutateAsync(deleteTarget.id);
      notifySuccess("Cycle deleted");
      setDeleteTarget(null);
    } catch (error) {
      notifyError(error, "Could not delete cycle");
    }
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

      <Dialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Sprint Cycle"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-3 py-1.5 rounded-lg text-body-sm text-outline hover:text-on-surface"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-cycle-form"
              disabled={createSprintMutation.isPending}
              className="px-4 py-1.5 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm disabled:opacity-50"
            >
              {createSprintMutation.isPending ? "Creating..." : "Create Cycle"}
            </button>
          </div>
        }
      >
        <form id="create-cycle-form" onSubmit={handleCreate} className="flex flex-col gap-4 p-5">
          <div>
            <label htmlFor="cycle-name" className="block text-body-sm font-medium text-on-surface mb-1">
              Cycle Name
            </label>
            <Input
              id="cycle-name"
              type="text"
              required
              placeholder="e.g. Sprint 15: Core UI Architecture"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-8 bg-surface-container border-outline-variant text-on-surface text-body-sm focus-visible:border-primary-container"
            />
          </div>
          <div>
            <label htmlFor="cycle-goal" className="block text-body-sm font-medium text-on-surface mb-1">
              Sprint Goal
            </label>
            <Input
              id="cycle-goal"
              type="text"
              placeholder="Deliverable objective"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full h-8 bg-surface-container border-outline-variant text-on-surface text-body-sm focus-visible:border-primary-container"
            />
          </div>
          <div>
            <label htmlFor="cycle-scope" className="block text-body-sm font-medium text-on-surface mb-1">
              Story Points Scope
            </label>
            <Input
              id="cycle-scope"
              type="number"
              min="0"
              value={scopePoints}
              onChange={(e) => setScopePoints(e.target.value)}
              className="w-full h-8 bg-surface-container border-outline-variant text-on-surface text-body-sm focus-visible:border-primary-container"
            />
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete cycle"
        description={`Delete "${deleteTarget?.name ?? ""}"? This cannot be undone.`}
        confirmLabel="Delete cycle"
        destructive
        pending={deleteSprintMutation.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {isLoading && <PageLoading variant="list" rows={3} label="Loading sprint cycles" />}

      {!isLoading && sprints.length === 0 && (
        <PageEmpty
          icon={Repeat}
          title="No cycles yet"
          description="Create a sprint cycle to plan scope and track points for this project."
        />
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
                        ? "bg-status-success/20 text-status-success"
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
                  onClick={() => setDeleteTarget({ id: sprint.id, name: sprint.name })}
                  className="text-outline hover:text-status-critical p-1 transition-colors"
                  aria-label={`Delete ${sprint.name}`}
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
