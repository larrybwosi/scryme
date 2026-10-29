import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProjectsAPI, Project, Task, Milestone, TimeEntry, OrganizationMember } from "../api";

export const QUERY_KEYS = {
  projects: ["projects"] as const,
  projectTasks: (projectId: string) => ["tasks", projectId] as const,
  projectMilestones: (projectId: string) => ["milestones", projectId] as const,
  members: ["members"] as const,
};

export function useProjects() {
  return useQuery<Project[]>({
    queryKey: QUERY_KEYS.projects,
    queryFn: () => ProjectsAPI.getProjects(),
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

export function useTasks(projectId: string = "proj-1") {
  return useQuery<Task[]>({
    queryKey: QUERY_KEYS.projectTasks(projectId),
    queryFn: () => ProjectsAPI.getProjectTasks(projectId),
  });
}

export function useCreateTask(projectId: string = "proj-1") {
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
    },
  });
}

export function useUpdateTaskStatus(projectId: string = "proj-1") {
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
    },
  });
}

export function useMilestones(projectId: string = "proj-1") {
  return useQuery<Milestone[]>({
    queryKey: QUERY_KEYS.projectMilestones(projectId),
    queryFn: () => ProjectsAPI.getProjectMilestones(projectId),
  });
}

export function useCreateMilestone(projectId: string = "proj-1") {
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

export function useLogTimeEntry(projectId: string = "proj-1") {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      hours,
      notes,
    }: {
      taskId: string;
      hours: number;
      notes?: string;
    }) => ProjectsAPI.logTimeEntry(taskId, hours, notes),
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
    },
  });
}

export function useMembers() {
  return useQuery<OrganizationMember[]>({
    queryKey: QUERY_KEYS.members,
    queryFn: () => ProjectsAPI.getMembers(),
  });
}
