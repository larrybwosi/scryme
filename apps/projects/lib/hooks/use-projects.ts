import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ProjectsAPI,
  Project,
  Task,
  Milestone,
  Sprint,
  ProjectDocument,
  TimeEntry,
  OrganizationMember,
  WorkspaceContext,
} from "../api";

export const QUERY_KEYS = {
  workspace: ["workspace-context"] as const,
  projects: ["projects"] as const,
  project: (projectId: string) => ["project", projectId] as const,
  projectTasks: (projectId?: string) => ["tasks", projectId || "all"] as const,
  projectMilestones: (projectId: string) => ["milestones", projectId] as const,
  projectSprints: (projectId: string) => ["sprints", projectId] as const,
  projectDocuments: (projectId?: string) => ["documents", projectId || "all"] as const,
  members: ["members"] as const,
};

export function useWorkspaceContext() {
  return useQuery<WorkspaceContext>({
    queryKey: QUERY_KEYS.workspace,
    queryFn: () => ProjectsAPI.getWorkspaceContext(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useProjects() {
  return useQuery<Project[]>({
    queryKey: QUERY_KEYS.projects,
    queryFn: () => ProjectsAPI.getProjects(),
  });
}

export function useProject(projectId: string) {
  return useQuery<Project>({
    queryKey: QUERY_KEYS.project(projectId),
    queryFn: () => ProjectsAPI.getProject(projectId),
    enabled: !!projectId,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Project>) => ProjectsAPI.createProject(data),
    onSuccess: (newProject) => {
      queryClient.setQueryData<Project[]>(QUERY_KEYS.projects, (old = []) => [
        newProject,
        ...old,
      ]);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
    },
  });
}

export function useTasks(projectId?: string) {
  return useQuery<Task[]>({
    queryKey: QUERY_KEYS.projectTasks(projectId),
    queryFn: () => ProjectsAPI.getProjectTasks(projectId),
  });
}

export function useCreateTask(projectId: string = "prj-204") {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Task>) =>
      ProjectsAPI.createTask({ ...data, projectId: data.projectId || projectId }),
    onSuccess: (newTask) => {
      const targetProjectId = newTask.projectId || projectId;
      queryClient.setQueryData<Task[]>(
        QUERY_KEYS.projectTasks(targetProjectId),
        (old = []) => [...old, newTask]
      );
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.projectTasks(targetProjectId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.projectTasks(undefined),
      });
    },
  });
}

export function useUpdateTaskStatus(projectId: string = "prj-204") {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: Task["status"] }) =>
      ProjectsAPI.updateTaskStatus(taskId, status),
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.projectTasks(projectId) });

      const previousTasks = queryClient.getQueryData<Task[]>(
        QUERY_KEYS.projectTasks(projectId)
      );

      if (previousTasks) {
        queryClient.setQueryData<Task[]>(
          QUERY_KEYS.projectTasks(projectId),
          previousTasks.map((t) => (t.id === taskId ? { ...t, status } : t))
        );
      }

      return { previousTasks };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(
          QUERY_KEYS.projectTasks(projectId),
          context.previousTasks
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projectTasks(projectId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projectTasks(undefined) });
    },
  });
}

export function useMilestones(projectId: string = "prj-204") {
  return useQuery<Milestone[]>({
    queryKey: QUERY_KEYS.projectMilestones(projectId),
    queryFn: () => ProjectsAPI.getProjectMilestones(projectId),
    enabled: !!projectId,
  });
}

export function useCreateMilestone(projectId: string = "prj-204") {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Milestone>) =>
      ProjectsAPI.createMilestone({ ...data, projectId: data.projectId || projectId }),
    onSuccess: (newMilestone) => {
      const targetProjectId = newMilestone.projectId || projectId;
      queryClient.setQueryData<Milestone[]>(
        QUERY_KEYS.projectMilestones(targetProjectId),
        (old = []) => [...old, newMilestone]
      );
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.projectMilestones(targetProjectId),
      });
    },
  });
}

export function useSprints(projectId: string = "prj-204") {
  return useQuery<Sprint[]>({
    queryKey: QUERY_KEYS.projectSprints(projectId),
    queryFn: () => ProjectsAPI.getProjectSprints(projectId),
    enabled: !!projectId,
  });
}

export function useCreateSprint(projectId: string = "prj-204") {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Sprint>) =>
      ProjectsAPI.createSprint(projectId, data),
    onSuccess: (newSprint) => {
      queryClient.setQueryData<Sprint[]>(
        QUERY_KEYS.projectSprints(projectId),
        (old = []) => [newSprint, ...old]
      );
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.projectSprints(projectId),
      });
    },
  });
}

export function useProjectDocuments(projectId?: string) {
  return useQuery<ProjectDocument[]>({
    queryKey: QUERY_KEYS.projectDocuments(projectId),
    queryFn: () => ProjectsAPI.getProjectDocuments(projectId),
  });
}

export function useCreateProjectDocument(projectId: string = "prj-204") {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<ProjectDocument>) =>
      ProjectsAPI.createProjectDocument(projectId, data),
    onSuccess: (newDoc) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.projectDocuments(projectId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.projectDocuments(undefined),
      });
    },
  });
}

export function useLogTimeEntry(projectId: string = "prj-204") {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      hours,
      description,
    }: {
      taskId: string;
      hours: number;
      description?: string;
    }) => ProjectsAPI.logTimeEntry(taskId, hours, description),
    onMutate: async ({ taskId, hours }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.projectTasks(projectId) });

      const previousTasks = queryClient.getQueryData<Task[]>(
        QUERY_KEYS.projectTasks(projectId)
      );

      if (previousTasks) {
        queryClient.setQueryData<Task[]>(
          QUERY_KEYS.projectTasks(projectId),
          previousTasks.map((t) =>
            t.id === taskId
              ? { ...t, actualHours: (t.actualHours || 0) + Number(hours) }
              : t
          )
        );
      }

      return { previousTasks };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(
          QUERY_KEYS.projectTasks(projectId),
          context.previousTasks
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projectTasks(projectId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projectTasks(undefined) });
    },
  });
}

export function useMembers() {
  return useQuery<OrganizationMember[]>({
    queryKey: QUERY_KEYS.members,
    queryFn: () => ProjectsAPI.getMembers(),
  });
}
