import { taskApi } from "./api";
import { useSyncExternalStore } from 'react';
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

const STORAGE_KEY = 'scryme_tasks_app_timer_v1';

function getInitialState(): AppStoreState {
  return {
    tasks: [],
    projects: [],
    clients: [],
    teamMembers: [],
    tags: [],
    timeEntries: [],
    timeOffRequests: [],
    activeTimer: {
      description: '',
      project: '',
      startTime: 0,
      elapsedSeconds: 0,
      isRunning: false,
    },
    selectedProject: '',
    myTasksOnly: false,
    isLoading: false,
  };
}

let currentState: AppStoreState = getInitialState();
const listeners = new Set<() => void>();

function notify() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ activeTimer: currentState.activeTimer }));
    } catch (e) {
      console.error('Failed to save timer state to localStorage', e);
    }
  }
  listeners.forEach((listener) => listener());
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

export const taskStore = {
  async syncWithApi() {
    if (isSyncing) return;
    isSyncing = true;

    currentState = { ...currentState, isLoading: true };
    notify();

    try {
      const [tasksRes, projectsRes, membersRes] = await Promise.all([
        taskApi.getTasks().catch(() => null),
        taskApi.getProjects().catch(() => null),
        taskApi.getMembers().catch(() => null),
      ]);

      let updatedState = { ...currentState, isLoading: false };

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
        updatedState.tasks = apiTasks;
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
        updatedState.projects = apiProjects;

        const clientNames = Array.from(new Set(apiProjects.map((p) => p.client)));
        updatedState.clients = clientNames.map((cName, idx) => ({
          id: `cli-${idx + 1}`,
          name: cName,
          company: `${cName} Corp`,
          status: 'ACTIVE',
          activeProjectsCount: apiProjects.filter((p) => p.client === cName).length,
        }));
      }

      if (membersRes && Array.isArray(membersRes.items)) {
        const apiMembers: TeamMember[] = membersRes.items.map((m: any) => ({
          id: m.id,
          name: m.user?.name || m.name || 'Team Member',
          email: m.user?.email || m.email || '',
          role: m.role || 'Member',
          department: m.department?.name || 'Engineering',
          assignedTasksCount: 0,
          completedTasksCount: 0,
          weeklyCapacityHours: 40,
          loggedHoursThisWeek: 0,
          status: 'ONLINE',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
        }));
        updatedState.teamMembers = apiMembers;
      }

      currentState = updatedState;
      notify();
    } catch (err) {
      console.error("Failed to sync task store with API:", err);
      currentState = { ...currentState, isLoading: false };
      notify();
    } finally {
      isSyncing = false;
    }
  },

  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return currentState;
  },

  // Async Task Actions wired to taskApi
  async addTask(taskData: Omit<Task, 'id' | 'createdAt'>) {
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
        await this.syncWithApi();
      } else {
        const newTask: Task = {
          ...taskData,
          id: `task-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        currentState = { ...currentState, tasks: [newTask, ...currentState.tasks] };
        notify();
      }
    } catch (e) {
      console.warn("Failed to create task on backend, adding locally:", e);
      const newTask: Task = {
        ...taskData,
        id: `task-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      currentState = { ...currentState, tasks: [newTask, ...currentState.tasks] };
      notify();
    }
  },

  async updateTask(taskId: string, updates: Partial<Task>) {
    // Optimistic local update
    currentState = {
      ...currentState,
      tasks: currentState.tasks.map((t) => (t.id === taskId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t)),
    };
    notify();

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

  async updateTaskStatus(taskId: string, status: TaskStatus) {
    await this.updateTask(taskId, { status });
  },

  async reorderTasks(newTasks: Task[]) {
    currentState = {
      ...currentState,
      tasks: newTasks,
    };
    notify();
  },

  async deleteTask(taskId: string) {
    currentState = {
      ...currentState,
      tasks: currentState.tasks.filter((t) => t.id !== taskId),
    };
    notify();

    try {
      if (!taskId.startsWith('task-')) {
        await taskApi.deleteTask(taskId);
      }
    } catch (e) {
      console.error("Failed to delete task from backend:", e);
    }
  },

  async addComment(taskId: string, content: string, authorName: string = 'Current User') {
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

    currentState = {
      ...currentState,
      tasks: currentState.tasks.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          comments: [...(t.comments || []), newComment],
        };
      }),
    };
    notify();

    try {
      if (!taskId.startsWith('task-')) {
        await taskApi.addComment(taskId, content.trim());
      }
    } catch (e) {
      console.error("Failed to send comment to backend:", e);
    }
  },

  toggleSubtask(taskId: string, subtaskId: string) {
    currentState = {
      ...currentState,
      tasks: currentState.tasks.map((t) => {
        if (t.id !== taskId || !t.subtasks) return t;
        return {
          ...t,
          subtasks: t.subtasks.map((st) => (st.id === subtaskId ? { ...st, completed: !st.completed } : st)),
        };
      }),
    };
    notify();
  },

  addSubtask(taskId: string, title: string) {
    if (!title.trim()) return;
    const newSubtask: Subtask = {
      id: `st-${Date.now()}`,
      title: title.trim(),
      completed: false,
    };
    currentState = {
      ...currentState,
      tasks: currentState.tasks.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          subtasks: [...(t.subtasks || []), newSubtask],
        };
      }),
    };
    notify();
  },

  // Async Project Actions
  async addProject(projectData: Omit<Project, 'id' | 'createdAt'>) {
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
        await this.syncWithApi();
      } else {
        const newPrj: Project = {
          ...projectData,
          id: `prj-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        currentState = { ...currentState, projects: [newPrj, ...currentState.projects] };
        notify();
      }
    } catch (e) {
      console.warn("Failed to create project on backend, adding locally:", e);
      const newPrj: Project = {
        ...projectData,
        id: `prj-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      currentState = { ...currentState, projects: [newPrj, ...currentState.projects] };
      notify();
    }
  },

  async updateProject(id: string, updates: Partial<Project>) {
    currentState = {
      ...currentState,
      projects: currentState.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    };
    notify();

    try {
      if (!id.startsWith('prj-')) {
        await taskApi.updateProject(id, updates);
      }
    } catch (e) {
      console.error("Failed to update project on backend:", e);
    }
  },

  async deleteProject(id: string) {
    currentState = {
      ...currentState,
      projects: currentState.projects.filter((p) => p.id !== id),
    };
    notify();

    try {
      if (!id.startsWith('prj-')) {
        await taskApi.deleteProject(id);
      }
    } catch (e) {
      console.error("Failed to delete project on backend:", e);
    }
  },

  addClient(client: Omit<Client, 'id'>) {
    const newCli: Client = { ...client, id: `cli-${Date.now()}` };
    currentState = { ...currentState, clients: [newCli, ...currentState.clients] };
    notify();
  },

  addTeamMember(member: Omit<TeamMember, 'id'>) {
    const newMember: TeamMember = { ...member, id: `m-${Date.now()}` };
    currentState = { ...currentState, teamMembers: [newMember, ...currentState.teamMembers] };
    notify();
  },

  addTag(tag: Omit<Tag, 'id'>) {
    const newTag: Tag = { ...tag, id: `tag-${Date.now()}` };
    currentState = { ...currentState, tags: [newTag, ...currentState.tags] };
    notify();
  },

  addTimeOff(request: Omit<TimeOffRequest, 'id'>) {
    const newReq: TimeOffRequest = { ...request, id: `to-${Date.now()}` };
    currentState = { ...currentState, timeOffRequests: [newReq, ...currentState.timeOffRequests] };
    notify();
  },

  setMyTasksOnly(val: boolean) {
    currentState = { ...currentState, myTasksOnly: val };
    notify();
  },

  // Timer Actions (Lightweight update without triggering full app notify on every tick)
  startTimer(description: string, project: string) {
    currentState = {
      ...currentState,
      activeTimer: {
        description,
        project,
        startTime: Date.now(),
        elapsedSeconds: currentState.activeTimer.isRunning && currentState.activeTimer.description === description
          ? currentState.activeTimer.elapsedSeconds
          : 0,
        isRunning: true,
      },
    };
    notify();
  },
  pauseTimer() {
    if (!currentState.activeTimer.isRunning) return;
    currentState = {
      ...currentState,
      activeTimer: {
        ...currentState.activeTimer,
        isRunning: false,
      },
    };
    notify();
  },
  stopAndSaveTimer() {
    const { activeTimer } = currentState;
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

    currentState = {
      ...currentState,
      timeEntries: [newEntry, ...currentState.timeEntries],
      activeTimer: {
        description: '',
        project: currentState.selectedProject,
        startTime: 0,
        elapsedSeconds: 0,
        isRunning: false,
      },
    };
    notify();
  },
  updateTimerElapsed(seconds: number) {
    currentState.activeTimer.elapsedSeconds = seconds;
    // Silent state mutation for high frequency ticker ticks to avoid re-rendering unrelated pages
    notify();
  },
  setActiveTimerField(fields: Partial<ActiveTimer>) {
    currentState = {
      ...currentState,
      activeTimer: {
        ...currentState.activeTimer,
        ...fields,
      },
    };
    notify();
  },
};

export function useTaskStore() {
  return useSyncExternalStore(taskStore.subscribe, taskStore.getSnapshot, taskStore.getSnapshot);
}
