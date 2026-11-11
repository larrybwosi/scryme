"use client";

import { Input } from "@repo/ui/components/ui/input";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select";
import Link from "next/link";
import React, { useState } from "react";
import { Check, Link2, Settings, PlusCircle, X } from "lucide-react";
import { useProject, useTasks, useMilestones, useSprints, useProjectDocuments, useUpdateProject } from "@/lib/hooks/use-projects";
import { usePermissions } from "@/lib/permissions";
import { Project } from "@/lib/api";

export function OverviewTab({ projectId }: { projectId: string }) {
  const { data: project } = useProject(projectId);
  const { data: tasks = [] } = useTasks(projectId);
  const { data: milestones = [] } = useMilestones(projectId);
  const { data: sprints = [] } = useSprints(projectId);
  const { data: docs = [] } = useProjectDocuments(projectId);
  const updateProjectMutation = useUpdateProject();
  const { canManageTasks, checkProjectRole } = usePermissions();

  const projectAuth = checkProjectRole(project?.members as any);
  const canEdit = canManageTasks || projectAuth.canEditProject;

  const [copied, setCopied] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editStatus, setEditStatus] = useState<Project["status"]>("ACTIVE");

  const handleCopy = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openEditModal = () => {
    if (!project) return;
    setEditName(project.name);
    setEditDesc(project.description || "");
    setEditStatus(project.status);
    setIsEditModalOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    await updateProjectMutation.mutateAsync({
      id: projectId,
      data: {
        name: editName.trim(),
        description: editDesc.trim() || undefined,
        status: editStatus,
      },
    });

    setIsEditModalOpen(false);
  };

  const closedTasks = tasks.filter((t) => t.status === "DONE").length;
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const progressPct = tasks.length > 0 ? Math.round((closedTasks / tasks.length) * 100) : 0;
  const activeSprint = sprints.find((s) => s.status === "ACTIVE") || sprints[0];

  const totalEstimatedHours = tasks.reduce((sum, t) => sum + (Number(t.estimatedHours) || 0), 0);
  const totalActualHours = tasks.reduce((sum, t) => sum + (Number(t.actualHours) || 0), 0);

  return (
    <div className="flex flex-col w-full">
      {/* Top Command & Action Bar */}
      <div className="w-full flex flex-col gap-space-md pt-2 pb-space-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-body-sm text-outline">
            <Link href="/projects" className="hover:text-on-surface">Projects</Link>
            <span>/</span>
            <span className="font-label-code text-label-code uppercase tracking-wider text-outline">
              {project?.key || "PRJ"}
            </span>
            <span>/</span>
            <span className="font-headline-sm text-on-surface font-medium">
              {project?.name || "Overview"}
            </span>
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="h-8 px-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-body-sm flex items-center gap-1.5 transition-colors border border-outline-variant/30"
            >
{copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
              <span>{copied ? "Copied" : "Copy URL"}</span>
            </button>

            {canEdit && (
              <button
                type="button"
                onClick={openEditModal}
                className="h-8 px-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-body-sm flex items-center gap-1.5 transition-colors border border-outline-variant/30"
              >
                <Settings className="h-3.5 w-3.5" />
                <span>Settings</span>
              </button>
            )}

            {canEdit && (
              <Link
                href={`/tasks?projectId=${projectId}`}
                className="h-8 px-3 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container text-body-sm font-headline-sm flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>New Issue</span>
              </Link>
            )}
          </div>
        </div>

        {/* Project Title & Primary Badges */}
        <div className="flex flex-wrap items-baseline justify-between gap-4 pt-1">
          <div className="flex items-center gap-3">
            <h1 className="font-display-lg text-display-lg text-on-surface tracking-tight">
              {project?.name}
            </h1>
            <span className={`px-2 py-0.5 rounded text-[11px] font-label-badge uppercase ${
              project?.status === "ACTIVE"
                ? "bg-emerald-500/20 text-emerald-300"
                : project?.status === "COMPLETED"
                ? "bg-primary-container/20 text-primary"
                : "bg-surface-container text-outline"
            }`}>
              {project?.status}
            </span>
            {projectAuth.isProjectAdmin && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-label-code bg-surface-container-high text-secondary">
                Admin
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 font-label-code text-[12px] text-outline">
            <span>Tasks: {tasks.length}</span>
            <span>•</span>
            <span>Milestones: {milestones.length}</span>
            <span>•</span>
            <span>Hours: {totalActualHours}h / {totalEstimatedHours}h</span>
          </div>
        </div>
      </div>

      {/* Edit Project Dialog */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-lg bg-surface-container-low border border-outline-variant/50 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                Project Settings: {project?.key}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="w-6 h-6 rounded flex items-center justify-center text-outline hover:text-on-surface"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSaveProject} className="flex flex-col gap-4 mt-4">
              <div>
                <label className="block text-body-sm font-medium text-on-surface mb-1">Project Name</label>
                <Input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-8 bg-surface-container border-outline-variant text-on-surface text-body-sm focus-visible:border-primary-container"
                />
              </div>
              <div>
                <label className="block text-body-sm font-medium text-on-surface mb-1">Description / Objective</label>
                <Textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full p-2 bg-surface-container border-outline-variant text-on-surface text-body-sm focus-visible:border-primary-container"
                />
              </div>
              <div>
                <label className="block text-body-sm font-medium text-on-surface mb-1">Lifecycle Status</label>
                <Select value={editStatus} onValueChange={(val) => setEditStatus(val as Project["status"])}>
                  <SelectTrigger className="w-full h-8 bg-surface-container border-outline-variant text-on-surface text-body-sm">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-container border-outline-variant text-on-surface">
                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                    <SelectItem value="ON_HOLD">ON_HOLD</SelectItem>
                    <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                    <SelectItem value="ARCHIVED">ARCHIVED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-body-sm text-outline hover:text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateProjectMutation.isPending}
                  className="px-4 py-1.5 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm disabled:opacity-50"
                >
                  {updateProjectMutation.isPending ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
        <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1">
          <span className="text-outline text-body-sm">Progress</span>
          <span className="text-headline-lg font-headline-lg text-on-surface font-semibold">
            {progressPct}%
          </span>
          <span className="text-[11px] text-emerald-400 font-label-code">
            {closedTasks} / {tasks.length} issues closed ({inProgressTasks} active)
          </span>
        </div>
        <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1">
          <span className="text-outline text-body-sm">Active Sprints</span>
          <span className="text-headline-lg font-headline-lg text-on-surface font-semibold">
            {activeSprint ? activeSprint.name : "No active cycle"}
          </span>
          <span className="text-[11px] text-primary font-label-code">
            {sprints.length} total cycles
          </span>
        </div>
        <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1">
          <span className="text-outline text-body-sm">Documentation</span>
          <span className="text-headline-lg font-headline-lg text-on-surface font-semibold">
            {docs.length} Specs
          </span>
          <span className="text-[11px] text-outline font-label-code">RFCs & Architecture</span>
        </div>
        <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1">
          <span className="text-outline text-body-sm">Milestones</span>
          <span className="text-headline-lg font-headline-lg text-on-surface font-semibold">
            {milestones.filter((m) => m.status === "COMPLETED").length} / {milestones.length}
          </span>
          <span className="text-[11px] text-emerald-400 font-label-code">Delivered Targets</span>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-8 flex flex-col gap-6">
          <div className="p-5 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-4">
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              Project Objective & Scope
            </h2>
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              {project?.description || "No extended description provided for this project workspace."}
            </p>
          </div>

          {/* Quick Task Activity */}
          <div className="p-5 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-sm text-body-md text-on-surface font-semibold">Recent Tasks</h2>
              <Link href={`/projects/${projectId}?tab=issues`} className="text-body-sm text-primary hover:underline">
                View all ({tasks.length})
              </Link>
            </div>
            <div className="divide-y divide-outline-variant/20 flex flex-col">
              {tasks.slice(0, 5).map((t) => (
                <div key={t.id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span className="font-label-code text-[11px] text-primary">{t.taskKey || t.id.slice(-6)}</span>
                    <span className="text-body-sm text-on-surface truncate">{t.title}</span>
                  </div>
                  <span className="text-[11px] font-label-code text-outline shrink-0">{t.status}</span>
                </div>
              ))}
              {tasks.length === 0 && (
                <div className="py-4 text-center text-outline text-body-sm italic">No tasks created yet</div>
              )}
            </div>
          </div>
        </div>

        <div className="xl:col-span-4 flex flex-col gap-4">
          <div className="p-5 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-4">
            <h2 className="font-headline-sm text-body-md text-on-surface font-semibold">Recent Milestones</h2>
            <div className="flex flex-col gap-2">
              {milestones.slice(0, 4).map((m) => (
                <div key={m.id} className="p-2.5 rounded bg-surface-container border border-outline-variant/20 flex flex-col gap-1">
                  <span className="text-body-sm font-medium text-on-surface">{m.title}</span>
                  <span className="text-[11px] text-primary font-label-code">{m.status}</span>
                </div>
              ))}
              {milestones.length === 0 && (
                <span className="text-outline text-body-sm italic">No milestones configured</span>
              )}
            </div>
          </div>

          <div className="p-5 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-3">
            <h2 className="font-headline-sm text-body-md text-on-surface font-semibold">Sprint Cadence</h2>
            {activeSprint ? (
              <div className="flex flex-col gap-2">
                <span className="text-body-sm text-on-surface font-medium">{activeSprint.name}</span>
                <p className="text-[11px] text-outline">{activeSprint.goal || "Focus iteration on deliverables."}</p>
                <div className="flex items-center justify-between text-[11px] font-label-code text-primary">
                  <span>Scope: {activeSprint.scopePoints} pts</span>
                  <span>Completed: {activeSprint.completedPoints} pts</span>
                </div>
              </div>
            ) : (
              <span className="text-outline text-body-sm italic">No active cycle</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
