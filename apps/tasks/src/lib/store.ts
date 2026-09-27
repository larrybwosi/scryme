import { taskApi } from "./api";
import { useSyncExternalStore } from 'react';
import { Task, TimeEntry, Project, Client, Tag, TaskStatus } from './types';

const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    name: 'Create Wireframes for Homepage',
    client: 'TechNova Solutions',
    project: 'AI-Powered Learning Platform',
    status: 'Review',
    tags: ['Design'],
    estimation: 'Today, 1:00 AM',
    dateGroup: 'Today',
    assignees: [
      { name: 'Sarah Jenkins', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
      { name: 'Alex Rivera', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' }
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-2',
    name: 'Develop Responsive Navigation Menu',
    client: 'GreenGroove App',
    project: 'Eco-Friendly Lifestyle Tracker',
    status: 'InProgress',
    tags: ['Frontend'],
    estimation: 'Today, 1:00 PM',
    dateGroup: 'Today',
    assignees: [
      { name: 'David Kim', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' }
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-3',
    name: 'Design Mobile Layout for User Dashboard',
    client: 'HealthMetrics',
    project: 'Fitness Tracker Web App',
    status: 'Stopped',
    tags: ['UX Design'],
    estimation: 'Today, 3:00 PM',
    dateGroup: 'Today',
    assignees: [
      { name: 'Elena Rostova', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100' }
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-4',
    name: 'Implement Dark Mode Toggle',
    client: 'SmartPay',
    project: 'Financial Management Tool',
    status: 'ToDo',
    tags: ['Development'],
    estimation: 'Today, 3:00 PM',
    dateGroup: 'Today',
    assignees: [
      { name: 'Marcus Chen', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' }
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-5',
    name: 'Create Visual Style Guide',
    client: 'Foodly',
    project: 'Online Grocery Platform',
    status: 'InProgress',
    tags: ['Design'],
    estimation: 'Today, 3:30 PM',
    dateGroup: 'Today',
    assignees: [
      { name: 'Sarah Jenkins', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' }
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-6',
    name: 'Optimize API Data Display on Dashboard',
    client: 'DataSpark Analytics',
    project: 'Business Insights Dash.',
    status: 'Review',
    tags: ['Back-end'],
    estimation: 'Today, 5:00 PM',
    dateGroup: 'Today',
    assignees: [
      { name: 'David Kim', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' }
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-7',
    name: 'Prototype Interaction Animations',
    client: 'TravelMate',
    project: 'Travel Booking Platform',
    status: 'ToDo',
    tags: ['UX Design'],
    estimation: 'Today, 6:00 PM',
    dateGroup: 'Today',
    assignees: [
      { name: 'Elena Rostova', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100' }
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-8',
    name: 'Debug Authentication System',
    client: 'SafeVault',
    project: 'Password Manager API',
    status: 'Review',
    tags: ['Development'],
    estimation: 'Tomorrow, 6:00 PM',
    dateGroup: 'Tomorrow',
    assignees: [
      { name: 'Marcus Chen', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' }
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-9',
    name: 'Build Interactive Task Kanban Board',
    client: 'TaskFlow',
    project: 'Team Collaboration Tool',
    status: 'ToDo',
    tags: ['Frontend'],
    estimation: 'Tomorrow, 6:00 PM',
    dateGroup: 'Tomorrow',
    assignees: [
      { name: 'David Kim', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' }
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-10',
    name: 'Conduct Usability Tests for Final Design',
    client: 'Snazzy Studio',
    project: 'Landing Page',
    status: 'Review',
    tags: ['UX Research'],
    estimation: 'Tomorrow, 7:00 PM',
    dateGroup: 'Tomorrow',
    assignees: [
      { name: 'Elena Rostova', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100' }
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-11',
    name: 'Create Visual Style Guide',
    client: 'Snazzy Studio',
    project: 'Landing Page',
    status: 'ToDo',
    tags: ['Design'],
    estimation: 'Feb 16, 3:30 PM',
    dateGroup: 'Feb 16, 2024',
    assignees: [
      { name: 'Sarah Jenkins', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' }
    ],
    createdAt: new Date().toISOString(),
  }
];

const INITIAL_TIME_ENTRIES: TimeEntry[] = [
  {
    id: 'time-1',
    description: 'Creating wireframes for the homepage',
    project: 'AI-Powered Learning Platform',
    startTime: '8:00 AM',
    endTime: '9:12 AM',
    duration: 4320, // 01:12:00
    dateGroup: 'Today',
  },
  {
    id: 'time-2',
    description: 'Setting up API integration for user data',
    project: 'Smarthome Dashboard',
    startTime: '9:12 AM',
    endTime: '10:32 AM',
    duration: 4800, // 01:20:00
    dateGroup: 'Today',
  },
  {
    id: 'time-3',
    description: 'Preparing a mood board',
    project: 'Fitness Tracker',
    startTime: '10:32 AM',
    endTime: '1:21 PM',
    duration: 10140, // 02:49:00
    dateGroup: 'Today',
  },
  {
    id: 'time-4',
    description: 'Conducting usability tests',
    project: 'Healthcare Portal',
    startTime: '8:00 AM',
    endTime: '9:15 AM',
    duration: 4500, // 01:15:00
    dateGroup: 'Yesterday',
  },
  {
    id: 'time-5',
    description: 'Building a responsive navigation menu',
    project: 'Educational Platform UX',
    startTime: '9:15 AM',
    endTime: '2:12 PM',
    duration: 17820, // 04:57:00
    dateGroup: 'Yesterday',
  },
  {
    id: 'time-6',
    description: 'Debugging front-end display issues',
    project: 'FinTech Dashboard',
    startTime: '2:12 PM',
    endTime: '4:15 PM',
    duration: 7380, // 02:03:00
    dateGroup: 'Yesterday',
  },
  {
    id: 'time-7',
    description: 'Designing the mobile layout',
    project: 'Travel Booking',
    startTime: '4:15 PM',
    endTime: '6:40 PM',
    duration: 8700, // 02:25:00
    dateGroup: 'Yesterday',
  },
  {
    id: 'time-8',
    description: 'Creating brand guidelines and assets',
    project: 'Snazzy Studio',
    startTime: '9:00 AM',
    endTime: '1:30 PM',
    duration: 16200, // 04:30:00
    dateGroup: 'Friday, 14 Feb 2024',
  }
];

export interface ActiveTimer {
  description: string;
  project: string;
  startTime: number; // Date.now() timestamp when started
  elapsedSeconds: number;
  isRunning: boolean;
}

interface AppStoreState {
  tasks: Task[];
  timeEntries: TimeEntry[];
  activeTimer: ActiveTimer;
  selectedProject: string;
}

const STORAGE_KEY = 'scryme_tasks_app_state_v1';

function getStoredState(): AppStoreState {
  if (typeof window === 'undefined') {
    return {
      tasks: INITIAL_TASKS,
      timeEntries: INITIAL_TIME_ENTRIES,
      activeTimer: {
        description: '',
        project: 'AI-Powered Learning Platform',
        startTime: 0,
        elapsedSeconds: 0,
        isRunning: false,
      },
      selectedProject: 'AI-Powered Learning Platform',
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load tasks state from localStorage:', e);
  }

  return {
    tasks: INITIAL_TASKS,
    timeEntries: INITIAL_TIME_ENTRIES,
    activeTimer: {
      description: '',
      project: 'AI-Powered Learning Platform',
      startTime: 0,
      elapsedSeconds: 0,
      isRunning: false,
    },
    selectedProject: 'AI-Powered Learning Platform',
  };
}

let currentState: AppStoreState = getStoredState();
const listeners = new Set<() => void>();

function notify() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));
    } catch (e) {
      console.error('Failed to save state to localStorage', e);
    }
  }
  listeners.forEach((listener) => listener());
}

export const taskStore = {
  async syncWithApi() {
    try {
      const res = await taskApi.getTasks();
      if (res && Array.isArray(res.items) && res.items.length > 0) {
        const apiTasks = res.items.map((item: any) => ({
          id: item.id,
          name: item.title,
          client: item.project?.name || "General",
          project: item.project?.name || "Workspace",
          status: item.status === "DONE" ? "Done" : item.status === "IN_PROGRESS" ? "InProgress" : item.status === "IN_REVIEW" ? "Review" : "ToDo",
          tags: item.labels ? item.labels.map((l: any) => l.label?.name).filter(Boolean) : ["Development"],
          estimation: item.dueDate ? new Date(item.dueDate).toLocaleDateString() : "Today",
          dateGroup: "Today",
          assignees: item.assignees ? item.assignees.map((a: any) => ({
            name: a.member?.user?.name || "Team Member",
            avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
          })) : [],
          createdAt: item.createdAt || new Date().toISOString(),
        }));
        currentState = { ...currentState, tasks: apiTasks };
        notify();
      }
    } catch (err) {
      console.warn("API sync skipped or unavailable, using stored tasks:", err);
    }
  },

  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return currentState;
  },
  // Task Actions
  addTask(task: Omit<Task, 'id' | 'createdAt'>) {
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    currentState = { ...currentState, tasks: [newTask, ...currentState.tasks] };
    notify();
  },
  updateTaskStatus(taskId: string, status: TaskStatus) {
    currentState = {
      ...currentState,
      tasks: currentState.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
    };
    notify();
  },
  deleteTask(taskId: string) {
    currentState = {
      ...currentState,
      tasks: currentState.tasks.filter((t) => t.id !== taskId),
    };
    notify();
  },
  // Timer Actions
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
    currentState = {
      ...currentState,
      activeTimer: {
        ...currentState.activeTimer,
        elapsedSeconds: seconds,
      },
    };
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
  resetStateToSeed() {
    currentState = {
      tasks: INITIAL_TASKS,
      timeEntries: INITIAL_TIME_ENTRIES,
      activeTimer: {
        description: '',
        project: 'AI-Powered Learning Platform',
        startTime: 0,
        elapsedSeconds: 0,
        isRunning: false,
      },
      selectedProject: 'AI-Powered Learning Platform',
    };
    notify();
  }
};

export function useTaskStore() {
  return useSyncExternalStore(taskStore.subscribe, taskStore.getSnapshot, taskStore.getSnapshot);
}
