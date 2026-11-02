"use client";

import { useSession } from "./auth-client";
import { useWorkspaceContext } from "./hooks/use-projects";

export interface PermissionsResult {
  canManageTasks: boolean;
  canReadTasks: boolean;
  isOwnerOrAdmin: boolean;
  memberId: string | null;
  role: string | null;
  isLoading: boolean;
  checkProjectRole: (projectMembers?: { role?: string; memberId?: string; member?: { id: string } }[]) => {
    isProjectAdmin: boolean;
    isProjectMember: boolean;
    canEditProject: boolean;
  };
}

export function usePermissions(): PermissionsResult {
  const { data: session, isPending: isSessionPending } = useSession();
  const { data: workspace, isLoading: isWorkspaceLoading } = useWorkspaceContext();

  const userRole = (session?.user as any)?.role || (session?.session as any)?.role || "member";
  const permissions: string[] = (session?.user as any)?.permissions || (session?.session as any)?.permissions || [];

  const isOwnerOrAdmin =
    userRole === "owner" ||
    userRole === "admin" ||
    userRole === "OWNER" ||
    userRole === "ADMIN";

  // If user is owner/admin or has explicit tasks:manage or wildcard '*'
  const canManageTasks =
    isOwnerOrAdmin ||
    permissions.includes("tasks:manage") ||
    permissions.includes("*") ||
    permissions.includes("tasks:*");

  const canReadTasks =
    canManageTasks ||
    permissions.includes("tasks:read") ||
    true; // Default read access for workspace members

  const memberId = workspace?.memberId || null;

  const checkProjectRole = (projectMembers: { role?: string; memberId?: string; member?: { id: string } }[] = []) => {
    if (isOwnerOrAdmin) {
      return { isProjectAdmin: true, isProjectMember: true, canEditProject: true };
    }

    if (!memberId) {
      return { isProjectAdmin: false, isProjectMember: false, canEditProject: canManageTasks };
    }

    const membership = projectMembers.find(
      (m) => m.memberId === memberId || m.member?.id === memberId
    );

    const isProjectAdmin = membership?.role === "ADMIN" || membership?.role === "OWNER";
    const isProjectMember = !!membership;
    const canEditProject = canManageTasks && (isProjectAdmin || isProjectMember);

    return {
      isProjectAdmin,
      isProjectMember,
      canEditProject,
    };
  };

  return {
    canManageTasks,
    canReadTasks,
    isOwnerOrAdmin,
    memberId,
    role: userRole,
    isLoading: isSessionPending || isWorkspaceLoading,
    checkProjectRole,
  };
}
