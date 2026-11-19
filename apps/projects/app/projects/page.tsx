"use client";

import { Input } from "@repo/ui/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  FolderKanban,
  FolderOpen,
  LayoutGrid,
  ListTodo,
  Pencil,
  Plus,
  Rows,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from "@/lib/hooks/use-projects";
import { usePermissions } from "@/lib/permissions";
import { Project } from "@/lib/api";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Dialog } from "@/components/Dialog";
import { PageEmpty, PageLoading } from "@/components/PageState";
import { notifyError, notifySuccess } from "@/lib/feedback";
import { FOCUS_RING } from "@/lib/navigation";

type ProjectFilter = "all" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED";

const STATUS_DOT: Record<Project["status"], string> = {
  ACTIVE: "bg-status-success",
  ON_HOLD: "bg-status-warning",
  COMPLETED: "bg-primary",
  ARCHIVED: "bg-outline",
};

function ProjectPicker({
  open,
  projects,
  isLoading,
  isError,
  onCancel,
  onCreate,
  onChoose,
}: {
  open: boolean;
  projects: Project[];
  isLoading: boolean;
  isError: boolean;
  onCancel: () => void;
  onCreate: () => void;
  onChoose: (project: Project) => void;
}) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (project) =>
        project.name.toLowerCase().includes(q) ||
        project.key.toLowerCase().includes(q) ||
        (project.description || "").toLowerCase().includes(q),
    );
  }, [projects, query]);

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title="Choose a project"
      description="Pick the project workspace you want to open."
      className="max-w-lg"
    >
      <div className="flex flex-col gap-3 px-5 py-4">
        {isLoading && <PageLoading label="Loading projects" />}

        {!isLoading && isError && (
          <p className="rounded-sm border border-error/30 bg-error/5 px-3 py-2 font-body-sm text-body-sm text-error">
            Could not load projects. Close this prompt and try again.
          </p>
        )}

        {!isLoading && !isError && projects.length === 0 && (
          <PageEmpty
            icon={FolderOpen}
            title="No projects yet"
            description="Create your first project workspace to start organizing tasks, cycles, and milestones."
            action={
              <button
                type="button"
                onClick={onCreate}
                className={`inline-flex h-8 items-center gap-1.5 rounded-sm bg-primary-container px-3 font-headline-sm text-body-sm text-on-primary-container transition-colors hover:bg-primary-container/90 ${FOCUS_RING}`}
              >
                <Plus className="h-4 w-4" aria-hidden />
                New project
              </button>
            }
          />
        )}

        {!isLoading && !isError && projects.length > 0 && (
          <>
            <div className="flex items-center gap-2 rounded-sm border border-outline-variant bg-surface-container px-2.5">
              <Search className="h-4 w-4 text-outline" aria-hidden />
              <Input
                autoFocus
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search projects"
                className="h-8 w-full border-0 bg-transparent px-0 font-body-sm text-body-sm text-on-surface shadow-none placeholder:text-outline focus-visible:ring-0"
              />
            </div>

            {filtered.length === 0 ? (
              <p className="px-1 py-6 text-center font-body-sm text-body-sm text-outline">
                No matches
              </p>
            ) : (
              <ul className="flex max-h-80 flex-col gap-1 overflow-y-auto">
                {filtered.map((project) => (
                  <li key={project.id}>
                    <button
                      type="button"
                      onClick={() => onChoose(project)}
                      className={`flex w-full items-center justify-between gap-3 rounded-sm border border-transparent px-3 py-2 text-left transition-colors hover:border-outline-variant hover:bg-surface-container ${FOCUS_RING}`}
                    >
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="truncate font-headline-sm text-body-sm text-on-surface">
                            {project.name}
                          </span>
                          <span className="shrink-0 rounded-sm bg-surface-container-high px-1.5 py-0.5 font-label-code text-[10px] uppercase tracking-wider text-primary">
                            {project.key}
                          </span>
                        </span>
                        <span className="mt-0.5 block truncate font-body-sm text-[11px] text-outline">
                          {project.description || "Project workspace"}
                        </span>
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-outline" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </Dialog>
  );
}

function ProjectsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPickerOpen = searchParams.get("choose") === "1";

  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [activeFilter, setActiveFilter] = useState<ProjectFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { data: projects = [], isLoading, isError, refetch } = useProjects();
  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();
  const { canManageTasks } = usePermissions();

  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectKey, setNewProjectKey] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");

  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editStatus, setEditStatus] = useState<Project["status"]>("ACTIVE");

  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  const closePicker = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("choose");
    const query = params.toString();
    router.replace(query ? `/projects?${query}` : "/projects");
  };

  const openProject = (project: Project) => {
    router.push(`/projects/${project.id}?tab=overview`);
  };

  useEffect(() => {
    if (!isPickerOpen || isLoading || projects.length !== 1) return;
    router.replace(`/projects/${projects[0].id}?tab=overview`);
  }, [isPickerOpen, isLoading, projects, router]);

  const startCreate = () => {
    if (isPickerOpen) closePicker();
    setIsNewProjectOpen(true);
  };

  const filteredProjects = projects.filter((project) => {
    const matchesFilter =
      activeFilter === "all" ? true : project.status === activeFilter;
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !canManageTasks) return;

    try {
      await createProjectMutation.mutateAsync({
        name: newProjectName.trim(),
        key: newProjectKey.trim().toUpperCase() || undefined,
        description: newProjectDesc.trim() || undefined,
        status: "ACTIVE",
      });
      notifySuccess("Project created");
      setNewProjectName("");
      setNewProjectKey("");
      setNewProjectDesc("");
      setIsNewProjectOpen(false);
    } catch (err) {
      notifyError(err, "Could not create project");
    }
  };

  const handleEditClick = (e: React.MouseEvent, project: Project) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingProject(project);
    setEditName(project.name);
    setEditDesc(project.description || "");
    setEditStatus(project.status);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject || !editName.trim()) return;

    try {
      await updateProjectMutation.mutateAsync({
        id: editingProject.id,
        data: {
          name: editName.trim(),
          description: editDesc.trim() || undefined,
          status: editStatus,
        },
      });
      notifySuccess("Project updated");
      setEditingProject(null);
    } catch (err) {
      notifyError(err, "Could not update project");
    }
  };

  const handleDelete = async () => {
    if (!deletingProject) return;
    try {
      await deleteProjectMutation.mutateAsync(deletingProject.id);
      notifySuccess("Project deleted");
      setDeletingProject(null);
    } catch (err) {
      notifyError(err, "Could not delete project");
    }
  };

  const activeCount = projects.filter((p) => p.status === "ACTIVE").length;
  const completedCount = projects.filter((p) => p.status === "COMPLETED").length;
  const onHoldCount = projects.filter((p) => p.status === "ON_HOLD").length;
  const archivedCount = projects.filter((p) => p.status === "ARCHIVED").length;

  return (
    <div className="flex w-full flex-col pb-16 text-on-surface">
      <div className="flex w-full flex-col">
        <div className="mb-2 flex flex-col gap-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <h1
                  data-route-heading
                  tabIndex={-1}
                  className="font-headline-lg text-headline-lg tracking-tight text-on-surface outline-none"
                >
                  Projects
                </h1>
                <span className="flex items-center gap-1.5 rounded-sm bg-surface-container-high px-2 py-0.5 font-label-badge text-label-badge text-outline">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-container" />
                  {activeCount} Active
                </span>
                <span className="flex items-center gap-1.5 rounded-sm bg-surface-container-low px-2 py-0.5 font-label-badge text-label-badge text-outline">
                  {completedCount} Completed
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="flex items-center rounded-sm border border-outline-variant bg-surface-container-lowest p-0.5 shadow-sm">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  aria-pressed={viewMode === "grid"}
                  className={`flex items-center gap-1 rounded-sm px-2.5 py-1 font-body-sm text-body-sm transition-all ${FOCUS_RING} ${
                    viewMode === "grid"
                      ? "bg-surface-container-high text-on-surface shadow-sm"
                      : "text-outline hover:text-on-surface"
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" aria-hidden />
                  <span className="hidden sm:inline">Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  aria-pressed={viewMode === "table"}
                  className={`flex items-center gap-1 rounded-sm px-2.5 py-1 font-body-sm text-body-sm transition-all ${FOCUS_RING} ${
                    viewMode === "table"
                      ? "bg-surface-container-high text-on-surface shadow-sm"
                      : "text-outline hover:text-on-surface"
                  }`}
                >
                  <Rows className="h-4 w-4" aria-hidden />
                  <span className="hidden sm:inline">Table</span>
                </button>
              </div>
              <div className="h-4 w-px bg-surface-container-highest" />
              {canManageTasks ? (
                <button
                  type="button"
                  onClick={startCreate}
                  className={`flex items-center gap-1 rounded-sm bg-primary-container px-2.5 py-1 font-headline-sm text-body-sm text-on-primary-container shadow-sm transition-all hover:bg-primary-container/90 ${FOCUS_RING}`}
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  <span>New Project</span>
                  <span className="ml-1 rounded-sm bg-on-primary-fixed/20 px-1 py-0.5 font-label-kbd text-label-kbd text-on-primary-container/70">
                    P
                  </span>
                </button>
              ) : (
                <span className="px-2 font-body-sm text-[11px] text-outline">
                  Read-only access
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-1">
              {[
                { key: "all", label: "All Projects", count: undefined },
                { key: "ACTIVE", label: "Active", count: activeCount },
                { key: "ON_HOLD", label: "On Hold", count: onHoldCount },
                { key: "COMPLETED", label: "Completed", count: completedCount },
                { key: "ARCHIVED", label: "Archived", count: archivedCount },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveFilter(tab.key as ProjectFilter)}
                  aria-pressed={activeFilter === tab.key}
                  className={`flex items-center gap-1.5 rounded-sm px-2.5 py-1 font-body-sm text-body-sm transition-colors ${FOCUS_RING} ${
                    activeFilter === tab.key
                      ? "bg-surface-container font-headline-sm text-on-surface"
                      : "text-outline hover:bg-surface-container-low hover:text-on-surface"
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="rounded-sm bg-surface-container-highest px-1 font-label-badge text-label-badge text-outline">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-sm border border-outline-variant bg-surface-container-lowest px-2.5 py-1 text-outline transition-all focus-within:bg-surface-container-low focus-within:text-on-surface">
                <Search className="h-3.5 w-3.5" aria-hidden />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search projects, keys, tags..."
                  className="h-7 w-44 border-0 bg-transparent font-body-sm text-body-sm text-on-surface shadow-none placeholder:text-outline focus-visible:ring-0 md:w-60"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                    className={`rounded-sm text-outline hover:text-on-surface ${FOCUS_RING}`}
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {isLoading && <PageLoading variant="grid" label="Loading projects" />}

        {!isLoading && isError && (
          <PageEmpty
            icon={FolderOpen}
            title="Could not load projects"
            description="Check your connection and try again."
            action={
              <button
                type="button"
                onClick={() => refetch()}
                className={`inline-flex h-8 items-center rounded-sm border border-outline-variant px-3 font-body-sm text-body-sm text-on-surface transition-colors hover:bg-surface-container ${FOCUS_RING}`}
              >
                Try again
              </button>
            }
          />
        )}

        {!isLoading && !isError && filteredProjects.length === 0 && (
          <PageEmpty
            icon={FolderOpen}
            title={projects.length === 0 ? "No projects yet" : "No projects match these filters"}
            description={
              projects.length === 0
                ? "Get started by creating your first project workspace to collaborate on tasks, cycles, and milestones."
                : "Adjust the status filter or search to find a project."
            }
            action={
              canManageTasks ? (
                <button
                  type="button"
                  onClick={startCreate}
                  className={`inline-flex h-8 items-center gap-1.5 rounded-sm bg-primary-container px-3 font-headline-sm text-body-sm text-on-primary-container transition-colors hover:bg-primary-container/90 ${FOCUS_RING}`}
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  Create New Project
                </button>
              ) : undefined
            }
          />
        )}

        {!isLoading && !isError && filteredProjects.length > 0 && viewMode === "grid" && (
          <div className="mb-6 grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-4">
            {filteredProjects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}?tab=overview`}
                className={`group relative flex flex-col justify-between rounded-md border border-outline-variant/60 bg-surface-container-low p-4 shadow-sm transition-all duration-150 hover:border-outline-variant hover:bg-surface-container ${FOCUS_RING}`}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-primary-container/20 font-label-code text-[13px] text-primary">
                        <Sparkles className="h-4 w-4 text-primary" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate font-headline-sm text-headline-sm text-on-surface transition-colors group-hover:text-primary">
                          {project.name}
                        </h3>
                        <p className="truncate font-body-sm text-body-sm text-outline">
                          {project.description || "Project Workspace"}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-sm bg-surface-container-highest px-1.5 py-0.5 font-label-code text-[10px] uppercase tracking-wider text-primary">
                      {project.key}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <div className="flex items-center gap-1.5 rounded-sm bg-surface-container-highest px-2 py-0.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[project.status]}`} />
                      <span className="font-label-badge text-label-badge text-on-surface">
                        {project.status}
                      </span>
                    </div>
                    {project._count && (
                      <div className="flex items-center gap-1 rounded-sm bg-surface-container-highest px-2 py-0.5 font-label-code text-label-code text-outline">
                        <ListTodo className="h-3.5 w-3.5" aria-hidden />
                        <span>{project._count.tasks} Tasks</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-outline-variant/60 pt-3 text-body-sm">
                  <span className="font-label-code text-[11px] text-outline">
                    {new Date(project.updatedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>

                  <div className="flex items-center gap-1">
                    {canManageTasks && (
                      <button
                        type="button"
                        onClick={(e) => handleEditClick(e, project)}
                        aria-label={`Edit ${project.name}`}
                        className={`rounded-sm p-1 text-outline transition-colors hover:text-on-surface ${FOCUS_RING}`}
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    )}
                    <ArrowRight
                      className="h-4 w-4 text-outline transition-colors group-hover:text-primary"
                      aria-hidden
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!isLoading && !isError && filteredProjects.length > 0 && viewMode === "table" && (
          <div className="mb-6 w-full overflow-x-auto rounded-md border border-outline-variant/60 bg-surface-container-low shadow-sm">
            <table className="w-full text-left font-body-sm">
              <thead className="border-b border-outline-variant/60 bg-surface-container-high/60 font-label-badge text-[11px] uppercase tracking-wider text-outline">
                <tr>
                  <th className="px-4 py-2.5">Key</th>
                  <th className="px-4 py-2.5">Project</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Tasks</th>
                  <th className="px-4 py-2.5">Updated</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {filteredProjects.map((project) => (
                  <tr
                    key={project.id}
                    className="group cursor-pointer transition-colors hover:bg-surface-container"
                  >
                    <td className="px-4 py-3 font-label-code text-[11px] text-primary">
                      {project.key}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/projects/${project.id}?tab=overview`} className={`flex flex-col ${FOCUS_RING}`}>
                        <span className="font-headline-sm text-body-sm text-on-surface transition-colors group-hover:text-primary">
                          {project.name}
                        </span>
                        <span className="text-[11px] text-outline">
                          {project.description || "--"}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 font-label-code text-[11px] capitalize text-on-surface-variant">
                        <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[project.status]}`} />
                        {project.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-label-code text-[11px]">
                      {project._count?.tasks ?? 0}
                    </td>
                    <td className="px-4 py-3 font-label-code text-[11px] text-outline">
                      {new Date(project.updatedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canManageTasks && (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={(e) => handleEditClick(e, project)}
                            aria-label={`Edit ${project.name}`}
                            className={`rounded-sm p-1 text-outline hover:text-on-surface ${FOCUS_RING}`}
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDeletingProject(project);
                            }}
                            aria-label={`Delete ${project.name}`}
                            className={`rounded-sm p-1 text-outline hover:text-error ${FOCUS_RING}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ProjectPicker
        open={isPickerOpen}
        projects={projects}
        isLoading={isLoading}
        isError={isError}
        onCancel={closePicker}
        onCreate={() => {
          closePicker();
          setIsNewProjectOpen(true);
        }}
        onChoose={openProject}
      />

      <Dialog
        open={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
        title="Create New Project"
        className="max-w-md"
      >
        <form onSubmit={handleCreateProject} className="flex flex-col gap-4 px-5 py-4">
          <div>
            <label htmlFor="new-project-name" className="mb-1 block font-body-sm font-medium text-on-surface">
              Project Name
            </label>
            <Input
              id="new-project-name"
              type="text"
              required
              placeholder="e.g. Kinetic Engine 3.0"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="h-8 w-full border-outline-variant bg-surface-container font-body-sm text-body-sm text-on-surface focus-visible:border-primary-container"
            />
          </div>
          <div>
            <label htmlFor="new-project-key" className="mb-1 block font-body-sm font-medium text-on-surface">
              Project Key (Optional)
            </label>
            <Input
              id="new-project-key"
              type="text"
              placeholder="e.g. KINETIC"
              value={newProjectKey}
              onChange={(e) => setNewProjectKey(e.target.value)}
              className="h-8 w-full border-outline-variant bg-surface-container font-body-sm uppercase text-on-surface focus-visible:border-primary-container"
            />
          </div>
          <div>
            <label htmlFor="new-project-desc" className="mb-1 block font-body-sm font-medium text-on-surface">
              Description
            </label>
            <Input
              id="new-project-desc"
              type="text"
              placeholder="Brief objective"
              value={newProjectDesc}
              onChange={(e) => setNewProjectDesc(e.target.value)}
              className="h-8 w-full border-outline-variant bg-surface-container font-body-sm text-on-surface focus-visible:border-primary-container"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsNewProjectOpen(false)}
              className={`rounded-sm px-3 py-1.5 font-body-sm text-body-sm text-outline hover:text-on-surface ${FOCUS_RING}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createProjectMutation.isPending || !newProjectName.trim()}
              className={`rounded-sm bg-primary-container px-4 py-1.5 font-headline-sm text-body-sm text-on-primary-container hover:bg-primary-container/90 disabled:pointer-events-none disabled:opacity-50 ${FOCUS_RING}`}
            >
              {createProjectMutation.isPending ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={Boolean(editingProject)}
        onClose={() => setEditingProject(null)}
        title={editingProject ? `Edit Project: ${editingProject.key}` : "Edit Project"}
        className="max-w-md"
      >
        <form onSubmit={handleSaveEdit} className="flex flex-col gap-4 px-5 py-4">
          <div>
            <label htmlFor="edit-project-name" className="mb-1 block font-body-sm font-medium text-on-surface">
              Project Name
            </label>
            <Input
              id="edit-project-name"
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="h-8 w-full border-outline-variant bg-surface-container font-body-sm text-body-sm text-on-surface focus-visible:border-primary-container"
            />
          </div>
          <div>
            <label htmlFor="edit-project-desc" className="mb-1 block font-body-sm font-medium text-on-surface">
              Description
            </label>
            <Input
              id="edit-project-desc"
              type="text"
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="h-8 w-full border-outline-variant bg-surface-container font-body-sm text-body-sm text-on-surface focus-visible:border-primary-container"
            />
          </div>
          <div>
            <label htmlFor="edit-project-status" className="mb-1 block font-body-sm font-medium text-on-surface">
              Status
            </label>
            <Select value={editStatus} onValueChange={(val) => setEditStatus(val as Project["status"])}>
              <SelectTrigger
                id="edit-project-status"
                className="h-8 w-full border-outline-variant bg-surface-container font-body-sm text-body-sm text-on-surface"
              >
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="border-outline-variant bg-surface-container text-on-surface">
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
              onClick={() => setEditingProject(null)}
              className={`rounded-sm px-3 py-1.5 font-body-sm text-body-sm text-outline hover:text-on-surface ${FOCUS_RING}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateProjectMutation.isPending || !editName.trim()}
              className={`rounded-sm bg-primary-container px-4 py-1.5 font-headline-sm text-body-sm text-on-primary-container hover:bg-primary-container/90 disabled:pointer-events-none disabled:opacity-50 ${FOCUS_RING}`}
            >
              {updateProjectMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deletingProject)}
        title="Delete this project?"
        description={
          deletingProject
            ? `"${deletingProject.name}" will be permanently removed. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete project"
        destructive
        pending={deleteProjectMutation.isPending}
        onCancel={() => setDeletingProject(null)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<PageLoading variant="grid" label="Loading projects" />}>
      <ProjectsPageContent />
    </Suspense>
  );
}
