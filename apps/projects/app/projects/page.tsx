"use client";

import Link from "next/link";
import React, { useState } from "react";
import { LayoutGrid, Rows, Plus, Search, X, FolderOpen, Sparkles, ListTodo, Pencil, ArrowRight, Trash2 } from "lucide-react";
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from "@/lib/hooks/use-projects";
import { usePermissions } from "@/lib/permissions";
import { Project } from "@/lib/api";

export default function ProjectsPage() {
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [activeFilter, setActiveFilter] = useState<"all" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { data: projects = [], isLoading } = useProjects();
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

    await createProjectMutation.mutateAsync({
      name: newProjectName.trim(),
      key: newProjectKey.trim().toUpperCase() || undefined,
      description: newProjectDesc.trim() || undefined,
      status: "ACTIVE",
    });

    setNewProjectName("");
    setNewProjectKey("");
    setNewProjectDesc("");
    setIsNewProjectOpen(false);
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

    await updateProjectMutation.mutateAsync({
      id: editingProject.id,
      data: {
        name: editName.trim(),
        description: editDesc.trim() || undefined,
        status: editStatus,
      },
    });

    setEditingProject(null);
  };

  const handleDelete = async (e: React.MouseEvent, projectId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this project workspace?")) return;
    await deleteProjectMutation.mutateAsync(projectId);
  };

  const activeCount = projects.filter((p) => p.status === "ACTIVE").length;
  const completedCount = projects.filter((p) => p.status === "COMPLETED").length;
  const onHoldCount = projects.filter((p) => p.status === "ON_HOLD").length;
  const archivedCount = projects.filter((p) => p.status === "ARCHIVED").length;

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="flex flex-col w-full">
        {/* Top Utility Bar: Title, Counters, Scope Filters, Actions */}
        <div className="flex flex-col gap-4 py-4 mb-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Projects</span>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-surface-container-high text-outline text-label-badge font-label-badge">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                  {activeCount} Active
                </span>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-surface-container-low text-outline text-label-badge font-label-badge">
                  {completedCount} Completed
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              {/* View Mode Switcher */}
              <div className="flex items-center bg-surface-container-lowest p-0.5 rounded-lg shadow-sm border border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-body-sm text-body-sm transition-all ${
                    viewMode === "grid"
                      ? "bg-surface-container-high text-on-surface shadow-sm"
                      : "text-outline hover:text-on-surface"
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span className="hidden sm:inline">Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-body-sm text-body-sm transition-all ${
                    viewMode === "table"
                      ? "bg-surface-container-high text-on-surface shadow-sm"
                      : "text-outline hover:text-on-surface"
                  }`}
                >
                  <Rows className="h-4 w-4" />
                  <span className="hidden sm:inline">Table</span>
                </button>
              </div>
              <div className="h-4 w-px bg-surface-container-highest"></div>
              {/* New Project Action */}
              {canManageTasks ? (
                <button
                  type="button"
                  onClick={() => setIsNewProjectOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm shadow-sm transition-all"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Project</span>
                  <span className="ml-1 text-label-kbd font-label-kbd text-on-primary-container/70 bg-on-primary-fixed/20 px-1 py-0.2 rounded-lg">P</span>
                </button>
              ) : (
                <span className="text-outline text-body-sm text-[11px] px-2">Read-only Access</span>
              )}
            </div>
          </div>

          {/* Sub-navigation: Scope tabs & quick search */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className={`px-2.5 py-1 rounded-lg font-body-sm text-body-sm transition-colors ${
                  activeFilter === "all"
                    ? "bg-surface-container text-on-surface font-headline-sm"
                    : "text-outline hover:text-on-surface hover:bg-surface-container-low"
                }`}
              >
                All Projects
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("ACTIVE")}
                className={`px-2.5 py-1 rounded-lg font-body-sm text-body-sm transition-colors flex items-center gap-1.5 ${
                  activeFilter === "ACTIVE"
                    ? "bg-surface-container text-on-surface font-headline-sm"
                    : "text-outline hover:text-on-surface hover:bg-surface-container-low"
                }`}
              >
                <span>Active</span>
                <span className="text-label-badge font-label-badge px-1 rounded-lg bg-surface-container-highest text-outline">
                  {activeCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("ON_HOLD")}
                className={`px-2.5 py-1 rounded-lg font-body-sm text-body-sm transition-colors flex items-center gap-1.5 ${
                  activeFilter === "ON_HOLD"
                    ? "bg-surface-container text-on-surface font-headline-sm"
                    : "text-outline hover:text-on-surface hover:bg-surface-container-low"
                }`}
              >
                <span>On Hold</span>
                <span className="text-label-badge font-label-badge px-1 rounded-lg bg-surface-container-highest text-outline">
                  {onHoldCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("COMPLETED")}
                className={`px-2.5 py-1 rounded-lg font-body-sm text-body-sm transition-colors flex items-center gap-1.5 ${
                  activeFilter === "COMPLETED"
                    ? "bg-surface-container text-on-surface font-headline-sm"
                    : "text-outline hover:text-on-surface hover:bg-surface-container-low"
                }`}
              >
                <span>Completed</span>
                <span className="text-label-badge font-label-badge px-1 rounded-lg bg-surface-container-highest text-outline">
                  {completedCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("ARCHIVED")}
                className={`px-2.5 py-1 rounded-lg font-body-sm text-body-sm transition-colors flex items-center gap-1.5 ${
                  activeFilter === "ARCHIVED"
                    ? "bg-surface-container text-on-surface font-headline-sm"
                    : "text-outline hover:text-on-surface hover:bg-surface-container-low"
                }`}
              >
                <span>Archived</span>
                <span className="text-label-badge font-label-badge px-1 rounded-lg bg-surface-container-highest text-outline">
                  {archivedCount}
                </span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-outline focus-within:text-on-surface focus-within:bg-surface-container-low transition-all">
                <Search className="h-3.5 w-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search projects, keys, tags..."
                  className="bg-transparent font-body-sm text-body-sm text-on-surface focus:outline-none placeholder:text-outline w-44 md:w-60"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-outline hover:text-on-surface"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal: New Project */}
        {isNewProjectOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-lg bg-surface-container-low border border-outline-variant/50 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Create New Project</h3>
                <button
                  type="button"
                  onClick={() => setIsNewProjectOpen(false)}
                  className="w-6 h-6 rounded flex items-center justify-center text-outline hover:text-on-surface"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleCreateProject} className="flex flex-col gap-4 mt-4">
                <div>
                  <label className="block text-body-sm font-medium text-on-surface mb-1">Project Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kinetic Engine 3.0"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full h-8 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary-container"
                  />
                </div>
                <div>
                  <label className="block text-body-sm font-medium text-on-surface mb-1">Project Key (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. KINETIC"
                    value={newProjectKey}
                    onChange={(e) => setNewProjectKey(e.target.value)}
                    className="w-full h-8 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm uppercase focus:outline-none focus:border-primary-container"
                  />
                </div>
                <div>
                  <label className="block text-body-sm font-medium text-on-surface mb-1">Description</label>
                  <input
                    type="text"
                    placeholder="Brief objective"
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    className="w-full h-8 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary-container"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsNewProjectOpen(false)}
                    className="px-3 py-1.5 rounded-lg text-body-sm text-outline hover:text-on-surface"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createProjectMutation.isPending}
                    className="px-4 py-1.5 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm disabled:opacity-50"
                  >
                    {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Project */}
        {editingProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-lg bg-surface-container-low border border-outline-variant/50 p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Edit Project: {editingProject.key}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="w-6 h-6 rounded flex items-center justify-center text-outline hover:text-on-surface"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleSaveEdit} className="flex flex-col gap-4 mt-4">
                <div>
                  <label className="block text-body-sm font-medium text-on-surface mb-1">Project Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full h-8 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary-container"
                  />
                </div>
                <div>
                  <label className="block text-body-sm font-medium text-on-surface mb-1">Description</label>
                  <input
                    type="text"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full h-8 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary-container"
                  />
                </div>
                <div>
                  <label className="block text-body-sm font-medium text-on-surface mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as Project["status"])}
                    className="w-full h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm focus:outline-none"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="ON_HOLD">ON_HOLD</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingProject(null)}
                    className="px-3 py-1.5 rounded-lg text-body-sm text-outline hover:text-on-surface"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateProjectMutation.isPending}
                    className="px-4 py-1.5 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm disabled:opacity-50"
                  >
                    {updateProjectMutation.isPending ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/20 animate-pulse h-48 flex flex-col justify-between">
                <div className="flex flex-col gap-2">
                  <div className="w-24 h-4 bg-surface-container-highest rounded"></div>
                  <div className="w-40 h-3 bg-surface-container rounded"></div>
                </div>
                <div className="w-full h-2 bg-surface-container rounded"></div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredProjects.length === 0 && (
          <div className="p-12 rounded-lg bg-surface-container-low border border-dashed border-outline-variant/40 flex flex-col items-center justify-center text-center gap-3 my-6">
            <FolderOpen className="h-9 w-9 text-outline" />
            <div className="text-on-surface font-headline-sm text-body-md">No projects found</div>
            <p className="text-outline text-body-sm max-w-sm">
              Get started by creating your first project workspace to collaborate on tasks, cycles, and milestones.
            </p>
            {canManageTasks && (
              <button
                type="button"
                onClick={() => setIsNewProjectOpen(true)}
                className="mt-2 px-4 py-1.5 rounded-lg bg-primary-container text-on-primary-container font-headline-sm text-body-sm"
              >
                Create New Project
              </button>
            )}
          </div>
        )}

        {/* View Layout: Grid vs Table */}
        {!isLoading && filteredProjects.length > 0 && viewMode === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5 mb-6">
            {filteredProjects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}?tab=overview`}
                className="group relative flex flex-col justify-between p-4 rounded-lg bg-surface-container-low hover:bg-surface-container transition-all duration-150 shadow-sm border border-outline-variant/30 hover:border-outline-variant"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary text-[13px] font-label-code shrink-0">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-headline-sm text-headline-sm text-on-surface truncate group-hover:text-primary transition-colors">
                          {project.name}
                        </h3>
                        <p className="font-body-sm text-body-sm text-outline truncate">{project.description || "Project Workspace"}</p>
                      </div>
                    </div>
                    <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-label-code uppercase tracking-wider bg-surface-container-highest text-primary">
                      {project.key}
                    </span>
                  </div>

                  {/* Status Strip */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-surface-container-highest">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        project.status === "ACTIVE" ? "bg-emerald-400" : project.status === "COMPLETED" ? "bg-primary" : project.status === "ARCHIVED" ? "bg-outline" : "bg-amber-400"
                      }`}></span>
                      <span className="font-label-badge text-label-badge text-on-surface">{project.status}</span>
                    </div>
                    {project._count && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface-container-highest text-outline font-label-code text-label-code">
                        <ListTodo className="h-3.5 w-3.5" />
                        <span>{project._count.tasks} Tasks</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer strip */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-outline-variant/30 text-body-sm">
                  <span className="font-label-code text-[11px] text-outline">
                    {new Date(project.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>

                  <div className="flex items-center gap-1">
                    {canManageTasks && (
                      <button
                        type="button"
                        onClick={(e) => handleEditClick(e, project)}
                        className="p-1 text-outline hover:text-on-surface transition-colors"
                        title="Edit Project"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
<ArrowRight className="h-4 w-4 text-outline group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!isLoading && filteredProjects.length > 0 && viewMode === "table" && (
          <div className="w-full overflow-x-auto rounded-lg border border-outline-variant/30 bg-surface-container-low shadow-sm mb-6">
            <table className="w-full text-left font-body-sm">
              <thead className="bg-surface-container-high/60 text-outline text-[11px] font-label-badge uppercase tracking-wider border-b border-outline-variant/30">
                <tr>
                  <th className="px-4 py-2.5">Key</th>
                  <th className="px-4 py-2.5">Project</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Tasks</th>
                  <th className="px-4 py-2.5">Updated</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {filteredProjects.map((project) => (
                  <tr
                    key={project.id}
                    className="hover:bg-surface-container transition-colors group cursor-pointer"
                  >
                    <td className="px-4 py-3 font-label-code text-primary text-[11px]">
                      {project.key}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/projects/${project.id}?tab=overview`}
                        className="flex flex-col"
                      >
                        <span className="font-headline-sm text-body-sm text-on-surface group-hover:text-primary transition-colors">
                          {project.name}
                        </span>
                        <span className="text-[11px] text-outline">{project.description || "--"}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="capitalize text-on-surface-variant font-label-code text-[11px]">{project.status}</span>
                    </td>
                    <td className="px-4 py-3 font-label-code text-[11px]">
                      {project._count?.tasks ?? 0}
                    </td>
                    <td className="px-4 py-3 font-label-code text-[11px] text-outline">
                      {new Date(project.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canManageTasks && (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={(e) => handleEditClick(e, project)}
                            className="p-1 text-outline hover:text-on-surface"
                            title="Edit Project"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDelete(e, project.id)}
                            className="p-1 text-outline hover:text-red-400"
                            title="Delete Project"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
    </div>
  );
}
