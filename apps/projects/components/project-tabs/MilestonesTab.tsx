"use client";

import { Input } from "@repo/ui/components/ui/input";
import { DatePicker } from "@repo/ui/components/ui/date-picker";
import { format } from "date-fns";
import React, { useState } from "react";
import { Plus, Check, Trash2, Target } from "lucide-react";
import {
  useMilestones,
  useCreateMilestone,
  useUpdateMilestone,
  useDeleteMilestone,
} from "@/lib/hooks/use-projects";
import { Milestone } from "@/lib/api";
import { Dialog } from "@/components/Dialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PageEmpty, PageLoading } from "@/components/PageState";
import { notifyError, notifySuccess } from "@/lib/feedback";

export function MilestonesTab({ projectId }: { projectId: string }) {
  const { data: milestones = [], isLoading } = useMilestones(projectId);
  const createMilestoneMutation = useCreateMilestone(projectId);
  const updateMilestoneMutation = useUpdateMilestone(projectId);
  const deleteMilestoneMutation = useDeleteMilestone(projectId);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId) return;

    try {
      await createMilestoneMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dueDate || undefined,
        status: "OPEN",
      });
      notifySuccess("Milestone created");
      setTitle("");
      setDescription("");
      setDueDate("");
      setIsCreateOpen(false);
    } catch (error) {
      notifyError(error, "Could not create milestone");
    }
  };

  const handleToggleStatus = async (m: Milestone) => {
    const nextStatus = m.status === "COMPLETED" ? "IN_PROGRESS" : "COMPLETED";
    try {
      await updateMilestoneMutation.mutateAsync({ milestoneId: m.id, data: { status: nextStatus } });
      notifySuccess("Status updated");
    } catch (error) {
      notifyError(error, "Could not change status");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMilestoneMutation.mutateAsync(deleteTarget.id);
      notifySuccess("Milestone deleted");
      setDeleteTarget(null);
    } catch (error) {
      notifyError(error, "Could not delete milestone");
    }
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
          <Plus className="h-4 w-4" />
          <span>New Milestone</span>
        </button>
      </div>

      <Dialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Milestone"
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
              form="create-milestone-form"
              disabled={createMilestoneMutation.isPending}
              className="px-4 py-1.5 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm disabled:opacity-50"
            >
              {createMilestoneMutation.isPending ? "Creating..." : "Create Milestone"}
            </button>
          </div>
        }
      >
        <form id="create-milestone-form" onSubmit={handleCreate} className="flex flex-col gap-4 p-5">
          <div>
            <label htmlFor="milestone-title" className="block text-body-sm font-medium text-on-surface mb-1">
              Title
            </label>
            <Input
              id="milestone-title"
              type="text"
              required
              placeholder="e.g. Beta Release Candidate"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-8 bg-surface-container border-outline-variant text-on-surface text-body-sm focus-visible:border-primary-container"
            />
          </div>
          <div>
            <label htmlFor="milestone-description" className="block text-body-sm font-medium text-on-surface mb-1">
              Description
            </label>
            <Input
              id="milestone-description"
              type="text"
              placeholder="Target scope or deliverable"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-8 bg-surface-container border-outline-variant text-on-surface text-body-sm focus-visible:border-primary-container"
            />
          </div>
          <div>
            <label htmlFor="milestone-due-date" className="block text-body-sm font-medium text-on-surface mb-1">
              Target Due Date
            </label>
            <DatePicker
              value={dueDate ? new Date(dueDate) : undefined}
              onChange={(d) => setDueDate(d ? format(d, "yyyy-MM-dd") : "")}
              placeholder="Select due date"
              className="w-full h-8 bg-surface-container border-outline-variant text-on-surface text-body-sm"
            />
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete milestone"
        description={`Delete "${deleteTarget?.title ?? ""}"? This cannot be undone.`}
        confirmLabel="Delete milestone"
        destructive
        pending={deleteMilestoneMutation.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {isLoading && <PageLoading variant="list" rows={3} label="Loading milestones" />}

      {!isLoading && milestones.length === 0 && (
        <PageEmpty
          icon={Target}
          title="No milestones yet"
          description="Add a milestone to track release targets and deliverables."
        />
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
                    {isCompleted && <Check className="h-3.5 w-3.5" />}
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
                    isCompleted ? "bg-status-success/20 text-status-success" : "bg-surface-container text-primary"
                  }`}>
                    {m.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget({ id: m.id, title: m.title })}
                    className="text-outline hover:text-status-critical p-1 transition-colors"
                    aria-label={`Delete ${m.title}`}
                    title="Delete Milestone"
                  >
                    <Trash2 className="h-4 w-4" />
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
