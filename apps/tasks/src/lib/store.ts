import { create } from 'zustand';
import { taskApi } from "./api";
import {
  Task,
  TimeEntry,
  Project,
  Client,
  Tag,
  TeamMember,
  TimeOffRequest,
  TaskStatus,
  Subtask,
  TaskComment,
  TaskDependency,
  TaskActivityLog
} from './types';

export interface ActiveTimer {
  description: string;
  project: string;
  startTime: number;
  elapsedSeconds: number;
  isRunning: boolean;
}

interface AppStoreState {
  tasks: Task[];
  projects: Project[];
  clients: Client[];
  teamMembers: TeamMember[];
  tags: Tag[];
  timeEntries: TimeEntry[];
  timeOffRequests: TimeOffRequest[];
  activeTimer: ActiveTimer;
  selectedProject: string;
  myTasksOnly: boolean;
  isLoading: boolean;
}

interface AppStoreActions {
  syncWithApi: () => Promise<void>;
  addTask: (taskData: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  reorderTasks: (newTasks: Task[]) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  addComment: (taskId: string, content: string, authorName?: string) => Promise<void>;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  addSubtask: (taskId: string, title: string) => void;
  addProject: (projectData: Omit<Project, 'id' | 'createdAt'>) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addClient: (client: Omit<Client, 'id'>) => void;
  addTeamMember: (member: Omit<TeamMember, 'id'>) => void;
  addTag: (tag: Omit<Tag, 'id'>) => void;
  addTimeOff: (request: Omit<TimeOffRequest, 'id'>) => void;
  setMyTasksOnly: (val: boolean) => void;
  startTimer: (description: string, project: string) => void;
  pauseTimer: () => void;
  stopAndSaveTimer: () => void;
  updateTimerElapsed: (seconds: number) => void;
  setActiveTimerField: (fields: Partial<ActiveTimer>) => void;
}

export type AppStore = AppStoreState & AppStoreActions;

const STORAGE_KEY = 'scryme_tasks_app_timer_v1';

function loadSavedActiveTimer(): ActiveTimer {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.activeTimer) {
          return parsed.activeTimer;
        }
      }
    } catch (e) {
      console.error('Failed to load timer state from localStorage', e);
    }
  }
  return {
    description: '',
    project: '',
    startTime: 0,
    elapsedSeconds: 0,
    isRunning: false,
  };
}

function persistActiveTimer(timer: ActiveTimer) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ activeTimer: timer }));
    } catch (e) {
      console.error('Failed to save timer state to localStorage', e);
    }
  }
}

function mapApiStatusToUi(status?: string): TaskStatus {
  switch (status) {
    case 'DONE':
    case 'COMPLETED':
      return 'Completed';
    case 'IN_PROGRESS':
      return 'InProgress';
    case 'IN_REVIEW':
    case 'REVIEW':
      return 'Review';
    case 'CANCELED':
    case 'CANCELLED':
    case 'STOPPED':
      return 'Stopped';
    case 'TODO':
    default:
      return 'ToDo';
  }
}

function mapUiStatusToApi(status: TaskStatus): string {
  switch (status) {
    case 'Completed':
      return 'DONE';
    case 'InProgress':
      return 'IN_PROGRESS';
    case 'Review':
      return 'IN_REVIEW';
    case 'Stopped':
      return 'CANCELED';
    case 'ToDo':
    default:
      return 'TODO';
  }
}

let isSyncing = false;

export const useTaskStore = create<AppStore>()((set, get) => ({
  tasks: [],
  projects: [],
  clients: [],
  teamMembers: [],
  tags: [],
  timeEntries: [],
  timeOffRequests: [],
  activeTimer: loadSavedActiveTimer(),
  selectedProject: '',
  myTasksOnly: false,
  isLoading: false,

  syncWithApi: async () => {
    if (isSyncing) return;
    isSyncing = true;

    // Only set isLoading if tasks are empty to avoid thrashing state when modals open or background re-syncs happen
    if (get().tasks.length === 0) {
      set({ isLoading: true });
    }

    try {
      const [tasksRes, projectsRes, membersRes] = await Promise.all([
        taskApi.getTasks().catch(() => null),
        taskApi.getProjects().catch(() => null),
        taskApi.getMembers().catch(() => null),
      ]);

      const stateUpdates: Partial<AppStoreState> = { isLoading: false };

      if (tasksRes && Array.isArray(tasksRes.items)) {
        const apiTasks: Task[] = tasksRes.items.map((item: any) => ({
          id: item.id,
          taskKey: item.taskKey || (item.taskNumber ? `TASK-${item.taskNumber}` : `TSK-${item.id.slice(0, 4)}`),
          taskNumber: item.taskNumber,
          name: item.title || item.name || 'Untitled Task',
          description: item.description,
          client: item.project?.organization?.name || item.project?.name || 'Workspace Client',
          projectId: item.projectId,
          project: item.project?.name || 'Workspace Project',
          status: mapApiStatusToUi(item.status),
          priority: item.priority || 'MEDIUM',
          tags: item.labels && Array.isArray(item.labels)
            ? item.labels.map((l: any) => l.label?.name || l.name).filter(Boolean)
            : ['Development'],
          estimation: item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'Today',
          estimatedHours: item.estimatedHours || 8,
          actualHours: item.actualHours || 0,
          dateGroup: 'Today',
          assignees: item.assignees && Array.isArray(item.assignees)
            ? item.assignees.map((a: any) => ({
                id: a.member?.id || a.memberId || a.id,
                name: a.member?.user?.name || a.member?.name || 'Team Member',
                email: a.member?.user?.email || a.member?.email,
                avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
              }))
            : [],
          subtasks: [],
          comments: item.comments && Array.isArray(item.comments)
            ? item.comments.map((c: any) => ({
                id: c.id,
                taskId: item.id,
                author: {
                  id: c.authorId || c.author?.id,
                  name: c.author?.user?.name || c.author?.name || 'Author',
                  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
                },
                content: c.content,
                createdAt: c.createdAt || new Date().toISOString(),
              }))
            : [],
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: item.updatedAt,
        }));
        stateUpdates.tasks = apiTasks;
      }

      if (projectsRes && Array.isArray(projectsRes.items)) {
        const apiProjects: Project[] = projectsRes.items.map((item: any) => ({
          id: item.id,
          key: item.key || 'PRJ',
          name: item.name,
          client: item.organization?.name || 'Client Entity',
          description: item.description,
          status: item.status || 'ACTIVE',
          priority: item.priority || 'MEDIUM',
          color: '#6366F1',
          owner: item.owner
            ? {
                id: item.owner.id,
                name: item.owner.user?.name || item.owner.name || 'Owner',
                avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
              }
            : undefined,
          taskCount: item._count?.tasks || 0,
          completedTaskCount: 0,
          progress: item.progress || 0,
          createdAt: item.createdAt,
        }));
        stateUpdates.projects = apiProjects;
      }

      if (membersRes && Array.isArray(membersRes.items)) {
        const apiMembers: TeamMember[] = membersRes.items.map((m: any) => ({
          id: m.id,
          name: m.user?.name || m.name || 'Workspace Member',
          email: m.user?.email || m.email || '',
          role: m.role || 'MEMBER',
          avatar: m.user?.image || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
          department: m.jobTitle || 'Engineering',
        }));
        stateUpdates.teamMembers = apiMembers;
      }

      set(stateUpdates);
    } catch (err) {
      console.error("Failed to sync task store with API:", err);
      set({ isLoading: false });
    } finally {
      isSyncing = false;
    }
  },

  addTask: async (taskData) => {
    try {
      const payload = {
        title: taskData.name,
        description: taskData.description,
        projectId: taskData.projectId,
        priority: taskData.priority,
        status: mapUiStatusToApi(taskData.status),
        dueDate: taskData.dueDate,
        estimatedHours: taskData.estimatedHours,
      };

      const res = await taskApi.createTask(payload);
      if (res && res.data) {
        await get().syncWithApi();
      } else {
        const newTask: Task = {
          ...taskData,
          id: `task-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ tasks: [newTask, ...state.tasks] }));
      }
    } catch (e) {
      console.warn("Failed to create task on backend, adding locally:", e);
      const newTask: Task = {
        ...taskData,
        id: `task-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      set((state) => ({ tasks: [newTask, ...state.tasks] }));
    }
  },

  updateTask: async (taskId, updates) => {
    // Optimistic local update
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t)),
    }));

    try {
      const payload: Record<string, any> = {};
      if (updates.name) payload.title = updates.name;
      if (updates.description) payload.description = updates.description;
      if (updates.status) payload.status = mapUiStatusToApi(updates.status);
      if (updates.priority) payload.priority = updates.priority;
      if (updates.dueDate) payload.dueDate = updates.dueDate;
      if (updates.estimatedHours) payload.estimatedHours = updates.estimatedHours;

      if (Object.keys(payload).length > 0 && !taskId.startsWith('task-')) {
        await taskApi.updateTask(taskId, payload);
      }
    } catch (e) {
      console.error("Failed to sync task update to backend:", e);
    }
  },

  updateTaskStatus: async (taskId, status) => {
    await get().updateTask(taskId, { status });
  },

  reorderTasks: async (newTasks) => {
    set({ tasks: newTasks });
  },

  deleteTask: async (taskId) => {
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== taskId),
    }));

    try {
      if (!taskId.startsWith('task-')) {
        await taskApi.deleteTask(taskId);
      }
    } catch (e) {
      console.error("Failed to delete task from backend:", e);
    }
  },

  addComment: async (taskId, content, authorName = 'Current User') => {
    if (!content.trim()) return;

    const newComment: TaskComment = {
      id: `tc-${Date.now()}`,
      taskId,
      author: {
        id: 'user-me',
        name: authorName,
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      },
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          comments: [...(t.comments || []), newComment],
        };
      }),
    }));

    try {
      if (!taskId.startsWith('task-')) {
        await taskApi.addComment(taskId, content.trim());
      }
    } catch (e) {
      console.error("Failed to send comment to backend:", e);
    }
  },

  toggleSubtask: (taskId, subtaskId) => {
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id !== taskId || !t.subtasks) return t;
        return {
          ...t,
          subtasks: t.subtasks.map((st) => (st.id === subtaskId ? { ...st, completed: !st.completed } : st)),
        };
      }),
    }));
  },

  addSubtask: (taskId, title) => {
    if (!title.trim()) return;
    const newSubtask: Subtask = {
      id: `st-${Date.now()}`,
      title: title.trim(),
      completed: false,
    };
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          subtasks: [...(t.subtasks || []), newSubtask],
        };
      }),
    }));
  },

  addProject: async (projectData) => {
    try {
      const payload = {
        name: projectData.name,
        key: projectData.key,
        description: projectData.description,
        status: projectData.status,
        priority: projectData.priority,
      };

      const res = await taskApi.createProject(payload);
      if (res && res.data) {
        await get().syncWithApi();
      } else {
        const newPrj: Project = {
          ...projectData,
          id: `prj-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ projects: [newPrj, ...state.projects] }));
      }
    } catch (e) {
      console.warn("Failed to create project on backend, adding locally:", e);
      const newPrj: Project = {
        ...projectData,
        id: `prj-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      set((state) => ({ projects: [newPrj, ...state.projects] }));
    }
  },

  updateProject: async (id, updates) => {
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));

    try {
      if (!id.startsWith('prj-')) {
        await taskApi.updateProject(id, updates);
      }
    } catch (e) {
      console.error("Failed to update project on backend:", e);
    }
  },

  deleteProject: async (id) => {
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
    }));

    try {
      if (!id.startsWith('prj-')) {
        await taskApi.deleteProject(id);
      }
    } catch (e) {
      console.error("Failed to delete project on backend:", e);
    }
  },

  addClient: (client) => {
    const newCli: Client = { ...client, id: `cli-${Date.now()}` };
    set((state) => ({ clients: [newCli, ...state.clients] }));
  },

  addTeamMember: (member) => {
    const newMember: TeamMember = { ...member, id: `m-${Date.now()}` };
    set((state) => ({ teamMembers: [newMember, ...state.teamMembers] }));
  },

  addTag: (tag) => {
    const newTag: Tag = { ...tag, id: `tag-${Date.now()}` };
    set((state) => ({ tags: [newTag, ...state.tags] }));
  },

  addTimeOff: (request) => {
    const newReq: TimeOffRequest = { ...request, id: `to-${Date.now()}` };
    set((state) => ({ timeOffRequests: [newReq, ...state.timeOffRequests] }));
  },

  setMyTasksOnly: (val) => {
    set({ myTasksOnly: val });
  },

  startTimer: (description, project) => {
    set((state) => {
      const activeTimer: ActiveTimer = {
        description,
        project,
        startTime: Date.now(),
        elapsedSeconds: state.activeTimer.isRunning && state.activeTimer.description === description
          ? state.activeTimer.elapsedSeconds
          : 0,
        isRunning: true,
      };
      persistActiveTimer(activeTimer);
      return { activeTimer };
    });
  },

  pauseTimer: () => {
    set((state) => {
      if (!state.activeTimer.isRunning) return {};
      const activeTimer: ActiveTimer = {
        ...state.activeTimer,
        isRunning: false,
      };
      persistActiveTimer(activeTimer);
      return { activeTimer };
    });
  },

  stopAndSaveTimer: () => {
    const { activeTimer, selectedProject } = get();
    if (activeTimer.elapsedSeconds <= 0 && !activeTimer.description) return;

    const newEntry: TimeEntry = {
      id: `time-${Date.now()}`,
      description: activeTimer.description || 'Untitled Activity',
      project: activeTimer.project || 'General',
      startTime: new Date(activeTimer.startTime || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      endTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      duration: activeTimer.elapsedSeconds,
      dateGroup: 'Today',
    };

    const resetTimer: ActiveTimer = {
      description: '',
      project: selectedProject,
      startTime: 0,
      elapsedSeconds: 0,
      isRunning: false,
    };

    persistActiveTimer(resetTimer);

    set((state) => ({
      timeEntries: [newEntry, ...state.timeEntries],
      activeTimer: resetTimer,
    }));
  },

  updateTimerElapsed: (seconds) => {
    set((state) => {
      const activeTimer = { ...state.activeTimer, elapsedSeconds: seconds };
      persistActiveTimer(activeTimer);
      return { activeTimer };
    });
  },

  setActiveTimerField: (fields) => {
    set((state) => {
      const activeTimer = { ...state.activeTimer, ...fields };
      persistActiveTimer(activeTimer);
      return { activeTimer };
    });
  },
}));

// Backward compatibility helper for direct method calls on taskStore
export const taskStore = {
  syncWithApi: () => useTaskStore.getState().syncWithApi(),
  addTask: (taskData: Omit<Task, 'id' | 'createdAt'>) => useTaskStore.getState().addTask(taskData),
  updateTask: (taskId: string, updates: Partial<Task>) => useTaskStore.getState().updateTask(taskId, updates),
  updateTaskStatus: (taskId: string, status: TaskStatus) => useTaskStore.getState().updateTaskStatus(taskId, status),
  reorderTasks: (newTasks: Task[]) => useTaskStore.getState().reorderTasks(newTasks),
  deleteTask: (taskId: string) => useTaskStore.getState().deleteTask(taskId),
  addComment: (taskId: string, content: string, authorName?: string) => useTaskStore.getState().addComment(taskId, content, authorName),
  toggleSubtask: (taskId: string, subtaskId: string) => useTaskStore.getState().toggleSubtask(taskId, subtaskId),
  addSubtask: (taskId: string, title: string) => useTaskStore.getState().addSubtask(taskId, title),
  addProject: (projectData: Omit<Project, 'id' | 'createdAt'>) => useTaskStore.getState().addProject(projectData),
  updateProject: (id: string, updates: Partial<Project>) => useTaskStore.getState().updateProject(id, updates),
  deleteProject: (id: string) => useTaskStore.getState().deleteProject(id),
  addClient: (client: Omit<Client, 'id'>) => useTaskStore.getState().addClient(client),
  addTeamMember: (member: Omit<TeamMember, 'id'>) => useTaskStore.getState().addTeamMember(member),
  addTag: (tag: Omit<Tag, 'id'>) => useTaskStore.getState().addTag(tag),
  addTimeOff: (request: Omit<TimeOffRequest, 'id'>) => useTaskStore.getState().addTimeOff(request),
  setMyTasksOnly: (val: boolean) => useTaskStore.getState().setMyTasksOnly(val),
  startTimer: (description: string, project: string) => useTaskStore.getState().startTimer(description, project),
  pauseTimer: () => useTaskStore.getState().pauseTimer(),
  stopAndSaveTimer: () => useTaskStore.getState().stopAndSaveTimer(),
  updateTimerElapsed: (seconds: number) => useTaskStore.getState().updateTimerElapsed(seconds),
  setActiveTimerField: (fields: Partial<ActiveTimer>) => useTaskStore.getState().setActiveTimerField(fields),
};
