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
  task: (taskId: string) => ["task", taskId] as const,
  subtasks: (taskId: string) => ["subtasks", taskId] as const,
  timeEntries: (taskId: string) => ["time-entries", taskId] as const,
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

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Project> }) =>
      ProjectsAPI.updateProject(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(QUERY_KEYS.project(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ProjectsAPI.deleteProject(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<Project[]>(QUERY_KEYS.projects, (old = []) =>
        old.filter((p) => p.id !== id)
      );
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

export function useTask(taskId: string) {
  return useQuery<Task>({
    queryKey: QUERY_KEYS.task(taskId),
    queryFn: () => ProjectsAPI.getTask(taskId),
    enabled: !!taskId,
  });
}

export function useCreateTask(projectId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Task> & { assigneeIds?: string[]; labelIds?: string[] }) =>
      ProjectsAPI.createTask(data),
    onSuccess: (newTask) => {
      const targetProjectId = newTask.projectId || projectId;
      if (targetProjectId) {
        queryClient.setQueryData<Task[]>(
          QUERY_KEYS.projectTasks(targetProjectId),
          (old = []) => [newTask, ...old]
        );
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.projectTasks(targetProjectId),
        });
      }
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.projectTasks(undefined),
      });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateTask(projectId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: Partial<Task> }) =>
      ProjectsAPI.updateTask(taskId, data),
    onMutate: async ({ taskId, data }) => {
      const targetKey = QUERY_KEYS.projectTasks(projectId);
      await queryClient.cancelQueries({ queryKey: targetKey });
      const prevTasks = queryClient.getQueryData<Task[]>(targetKey);

      if (prevTasks) {
        queryClient.setQueryData<Task[]>(
          targetKey,
          prevTasks.map((t) => (t.id === taskId ? { ...t, ...data } : t))
        );
      }

      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.task(taskId) });
      const prevTask = queryClient.getQueryData<Task>(QUERY_KEYS.task(taskId));
      if (prevTask) {
        queryClient.setQueryData<Task>(QUERY_KEYS.task(taskId), {
          ...prevTask,
          ...data,
        });
      }

      return { prevTasks, prevTask };
    },
    onError: (_err, { taskId }, context) => {
      if (context?.prevTasks) {
        queryClient.setQueryData(QUERY_KEYS.projectTasks(projectId), context.prevTasks);
      }
      if (context?.prevTask) {
        queryClient.setQueryData(QUERY_KEYS.task(taskId), context.prevTask);
      }
    },
    onSettled: (_data, _err, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projectTasks(projectId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projectTasks(undefined) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.task(taskId) });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateTaskStatus(projectId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: Task["status"] }) =>
      ProjectsAPI.updateTaskStatus(taskId, status),
    onMutate: async ({ taskId, status }) => {
      const targetKey = QUERY_KEYS.projectTasks(projectId);
      await queryClient.cancelQueries({ queryKey: targetKey });
      const previousTasks = queryClient.getQueryData<Task[]>(targetKey);

      if (previousTasks) {
        queryClient.setQueryData<Task[]>(
          targetKey,
          previousTasks.map((t) => (t.id === taskId ? { ...t, status } : t))
        );
      }

      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.task(taskId) });
      const prevTask = queryClient.getQueryData<Task>(QUERY_KEYS.task(taskId));
      if (prevTask) {
        queryClient.setQueryData<Task>(QUERY_KEYS.task(taskId), {
          ...prevTask,
          status,
        });
      }

      return { previousTasks, prevTask };
    },
    onError: (_err, { taskId }, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(
          QUERY_KEYS.projectTasks(projectId),
          context.previousTasks
        );
      }
      if (context?.prevTask) {
        queryClient.setQueryData(QUERY_KEYS.task(taskId), context.prevTask);
      }
    },
    onSettled: (_data, _err, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projectTasks(projectId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projectTasks(undefined) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.task(taskId) });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteTask(projectId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => ProjectsAPI.deleteTask(taskId),
    onSuccess: (_, taskId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projectTasks(projectId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projectTasks(undefined) });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useSubtasks(taskId: string) {
  return useQuery<Task[]>({
    queryKey: QUERY_KEYS.subtasks(taskId),
    queryFn: () => ProjectsAPI.getSubtasks(taskId),
    enabled: !!taskId,
  });
}

export function useAddTaskComment(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => ProjectsAPI.addTaskComment(taskId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.task(taskId) });
    },
  });
}

export function useManageTaskAssignees(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberIds: string[]) =>
      ProjectsAPI.manageTaskAssignees(taskId, memberIds),
    onSuccess: (updatedTask) => {
      queryClient.setQueryData(QUERY_KEYS.task(taskId), updatedTask);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useMilestones(projectId: string) {
  return useQuery<Milestone[]>({
    queryKey: QUERY_KEYS.projectMilestones(projectId),
    queryFn: () => ProjectsAPI.getProjectMilestones(projectId),
    enabled: !!projectId,
  });
}

export function useCreateMilestone(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Milestone>) =>
      ProjectsAPI.createMilestone({ ...data, projectId }),
    onSuccess: (newMilestone) => {
      queryClient.setQueryData<Milestone[]>(
        QUERY_KEYS.projectMilestones(projectId),
        (old = []) => [...old, newMilestone]
      );
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.projectMilestones(projectId),
      });
    },
  });
}

export function useUpdateMilestone(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ milestoneId, data }: { milestoneId: string; data: Partial<Milestone> }) =>
      ProjectsAPI.updateMilestone(milestoneId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.projectMilestones(projectId),
      });
    },
  });
}

export function useDeleteMilestone(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (milestoneId: string) => ProjectsAPI.deleteMilestone(milestoneId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.projectMilestones(projectId),
      });
    },
  });
}

export function useSprints(projectId: string) {
  return useQuery<Sprint[]>({
    queryKey: QUERY_KEYS.projectSprints(projectId),
    queryFn: () => ProjectsAPI.getProjectSprints(projectId),
    enabled: !!projectId,
  });
}

export function useCreateSprint(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Sprint>) => ProjectsAPI.createSprint(projectId, data),
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

export function useUpdateSprint(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sprintId, data }: { sprintId: string; data: Partial<Sprint> }) =>
      ProjectsAPI.updateSprint(sprintId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.projectSprints(projectId),
      });
    },
  });
}

export function useDeleteSprint(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sprintId: string) => ProjectsAPI.deleteSprint(sprintId),
    onSuccess: () => {
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

export function useCreateProjectDocument(projectId: string) {
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

export function useTimeEntries(taskId: string) {
  return useQuery<TimeEntry[]>({
    queryKey: QUERY_KEYS.timeEntries(taskId),
    queryFn: () => ProjectsAPI.listTimeEntries(taskId),
    enabled: !!taskId,
  });
}

export function useLogTimeEntry(projectId?: string) {
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
      const targetKey = QUERY_KEYS.projectTasks(projectId);
      await queryClient.cancelQueries({ queryKey: targetKey });
      const previousTasks = queryClient.getQueryData<Task[]>(targetKey);

      if (previousTasks) {
        queryClient.setQueryData<Task[]>(
          targetKey,
          previousTasks.map((t) =>
            t.id === taskId
              ? { ...t, actualHours: (Number(t.actualHours) || 0) + Number(hours) }
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
    onSettled: (_data, _err, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projectTasks(projectId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projectTasks(undefined) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.timeEntries(taskId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.task(taskId) });
    },
  });
}

export function useDeleteTimeEntry(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entryId: string) => ProjectsAPI.deleteTimeEntry(taskId, entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.timeEntries(taskId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.task(taskId) });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useMembers() {
  return useQuery<OrganizationMember[]>({
    queryKey: QUERY_KEYS.members,
    queryFn: () => ProjectsAPI.getMembers(),
  });
}
