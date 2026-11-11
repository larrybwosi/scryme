"use client";

import React, { useState } from "react";
import { ChevronRight, UserPlus, X, Trash2, Shield, User, Loader2 } from "lucide-react";
import {
  useMembers,
  useProject,
  useManageProjectMember,
  useRemoveProjectMember,
} from "@/lib/hooks/use-projects";
import { MemberPerformanceDrawer } from "@/components/MemberPerformanceDrawer";
import { usePermissions } from "@/lib/permissions";
import { toast } from "sonner";

export function TeamTab({ projectId }: { projectId?: string } = {}) {
  const { data: members = [], isLoading: isMembersLoading } = useMembers();
  const { data: project, isLoading: isProjectLoading } = useProject(projectId || "");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const manageMemberMutation = useManageProjectMember(projectId || "");
  const removeMemberMutation = useRemoveProjectMember(projectId || "");
  const { canManageTasks } = usePermissions();

  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedAddMemberId, setSelectedAddMemberId] = useState("");
  const [selectedRole, setSelectedRole] = useState<"ADMIN" | "MEMBER" | "VIEWER">("MEMBER");

  const projectMembers = project?.members || [];

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAddMemberId || !projectId) {
      toast.error("Please select a team member");
      return;
    }

    try {
      await manageMemberMutation.mutateAsync({
        memberId: selectedAddMemberId,
        role: selectedRole,
      });
      toast.success("Team member assigned to project");
      setIsAddMemberOpen(false);
      setSelectedAddMemberId("");
      setSelectedRole("MEMBER");
    } catch (err: any) {
      toast.error(err?.message || "Failed to assign member to project");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!projectId) return;
    try {
      await removeMemberMutation.mutateAsync(memberId);
      toast.success("Member removed from project");
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove member");
    }
  };

  const isLoading = isMembersLoading || (projectId ? isProjectLoading : false);

  return (
    <div className="flex flex-col w-full gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
            {projectId
              ? `Project Team & Access (${projectMembers.length > 0 ? projectMembers.length : members.length})`
              : `Organization Team & Access (${members.length})`}
          </h3>
          <p className="font-body-sm text-body-sm text-outline mt-1">
            {projectId
              ? "Manage project team assignments, permissions, and inspect real-time performance analytics."
              : "Click on any member card to inspect real-time performance analytics, velocity, and workloads."}
          </p>
        </div>

        {projectId && canManageTasks && (
          <button
            type="button"
            onClick={() => setIsAddMemberOpen(true)}
            className="h-8 px-3 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm flex items-center gap-1.5 shadow-sm transition-all shrink-0 self-start sm:self-auto"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Team Member</span>
          </button>
        )}
      </div>

      {isLoading && (
        <div className="p-8 text-center text-outline text-body-sm">Loading team members...</div>
      )}

      {projectId && !isLoading && projectMembers.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="text-[11px] font-label-badge uppercase tracking-wider text-outline">
            Assigned Project Members ({projectMembers.length})
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {projectMembers.map((pm) => {
              const memberName = pm.member?.user?.name || "Team Member";
              const memberEmail = pm.member?.user?.email || "";
              const memberRole = pm.role || "MEMBER";

              return (
                <div
                  key={pm.id}
                  className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 hover:border-primary-container/60 hover:bg-surface-container transition-all flex items-center justify-between shadow-xs group"
                >
                  <div
                    onClick={() => setSelectedMemberId(pm.member?.id || pm.id)}
                    className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-headline-sm text-body-md font-semibold shrink-0">
                      {memberName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-headline-sm text-body-sm text-on-surface font-medium truncate group-hover:text-primary transition-colors">
                        {memberName}
                      </div>
                      <div className="text-[11px] text-outline truncate">{memberEmail}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] font-label-code text-primary uppercase bg-primary-container/20 px-1.5 py-0.2 rounded">
                          {memberRole}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedMemberId(pm.member?.id || pm.id)}
                      className="p-1.5 text-outline hover:text-on-surface transition-colors"
                      title="Inspect Analytics"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    {canManageTasks && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(pm.member?.id || pm.id)}
                        disabled={removeMemberMutation.isPending}
                        className="p-1.5 text-outline hover:text-red-400 transition-colors"
                        title="Remove Member from Project"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!isLoading && (
        <div className="flex flex-col gap-3">
          {projectId && (
            <div className="text-[11px] font-label-badge uppercase tracking-wider text-outline mt-2">
              All Organization Members ({members.length})
            </div>
          )}

          {members.length === 0 ? (
            <div className="p-8 text-center text-outline text-body-sm border border-dashed border-outline-variant/30 rounded-lg">
              No members found in this organization.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {members.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setSelectedMemberId(m.id)}
                  className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 hover:border-primary-container/60 hover:bg-surface-container cursor-pointer transition-all flex items-center justify-between shadow-xs group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-headline-sm text-body-md font-semibold shrink-0">
                      {m.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-headline-sm text-body-sm text-on-surface font-medium truncate group-hover:text-primary transition-colors">
                        {m.name}
                      </div>
                      <div className="text-[11px] text-outline truncate">{m.email}</div>
                      <div className="text-[10px] font-label-code text-primary uppercase mt-1">
                        {m.role}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-outline group-hover:text-on-surface transition-colors">
                    <span className="text-[11px] font-medium hidden sm:inline">Analytics</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isAddMemberOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-lg bg-surface-container-low border border-outline-variant/50 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-primary" />
                <span>Assign Team Member</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddMemberOpen(false)}
                className="w-6 h-6 rounded flex items-center justify-center text-outline hover:text-on-surface"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="flex flex-col gap-4 mt-4">
              <div>
                <label className="block text-body-sm font-medium text-on-surface mb-1">Select Member</label>
                <select
                  required
                  value={selectedAddMemberId}
                  onChange={(e) => setSelectedAddMemberId(e.target.value)}
                  className="w-full h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm"
                >
                  <option value="">Choose an organization member...</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-body-sm font-medium text-on-surface mb-1">Project Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as "ADMIN" | "MEMBER" | "VIEWER")}
                  className="w-full h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm"
                >
                  <option value="ADMIN">Project Admin (Full Access)</option>
                  <option value="MEMBER">Project Member (Standard)</option>
                  <option value="VIEWER">Viewer (Read Only)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-body-sm text-outline hover:text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={manageMemberMutation.isPending}
                  className="px-4 py-1.5 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {manageMemberMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : null}
                  <span>{manageMemberMutation.isPending ? "Assigning..." : "Assign Member"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <MemberPerformanceDrawer
        isOpen={!!selectedMemberId}
        memberId={selectedMemberId}
        onClose={() => setSelectedMemberId(null)}
      />
    </div>
  );
}
