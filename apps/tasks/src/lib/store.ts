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
  Invoice,
  Expense,
  TaskStatus,
  Subtask,
  TaskComment,
  TaskDependency,
  TaskActivityLog
} from './types';

const INITIAL_PROJECTS: Project[] = [
  {
    id: 'prj-1',
    key: 'AI-LEARN',
    name: 'AI-Powered Learning Platform',
    client: 'TechNova Solutions',
    description: 'Next-gen interactive course material and adaptive quiz generator using enterprise AI models.',
    status: 'ACTIVE',
    priority: 'HIGH',
    startDate: '2024-01-10',
    endDate: '2024-05-30',
    color: '#6366F1',
    owner: { id: 'm-1', name: 'Sarah Jenkins', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
    taskCount: 14,
    completedTaskCount: 8,
    progress: 57,
  },
  {
    id: 'prj-2',
    key: 'ECO-TRACK',
    name: 'Eco-Friendly Lifestyle Tracker',
    client: 'GreenGroove App',
    description: 'Carbon footprint analytics and sustainable habits gamification mobile application.',
    status: 'ACTIVE',
    priority: 'MEDIUM',
    startDate: '2024-02-01',
    endDate: '2024-06-15',
    color: '#10B981',
    owner: { id: 'm-2', name: 'David Kim', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' },
    taskCount: 10,
    completedTaskCount: 6,
    progress: 60,
  },
  {
    id: 'prj-3',
    key: 'FIT-TRACK',
    name: 'Fitness Tracker Web App',
    client: 'HealthMetrics',
    description: 'Real-time workout logging, biometric insights, and personal trainer booking hub.',
    status: 'ACTIVE',
    priority: 'MEDIUM',
    startDate: '2024-01-15',
    endDate: '2024-04-30',
    color: '#F59E0B',
    owner: { id: 'm-3', name: 'Elena Rostova', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100' },
    taskCount: 8,
    completedTaskCount: 3,
    progress: 37,
  },
  {
    id: 'prj-4',
    key: 'FIN-TOOL',
    name: 'Financial Management Tool',
    client: 'SmartPay',
    description: 'Multi-currency invoicing, automated expense reporting, and financial forecasting platform.',
    status: 'ACTIVE',
    priority: 'URGENT',
    startDate: '2024-02-10',
    endDate: '2024-07-01',
    color: '#3B82F6',
    owner: { id: 'm-4', name: 'Marcus Chen', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' },
    taskCount: 18,
    completedTaskCount: 12,
    progress: 66,
  },
  {
    id: 'prj-5',
    key: 'GROCERY-UI',
    name: 'Online Grocery Platform',
    client: 'Foodly',
    description: 'Same-day grocery order fulfillment system with dynamic stock inventory syncing.',
    status: 'ON_HOLD',
    priority: 'LOW',
    startDate: '2023-11-01',
    endDate: '2024-03-31',
    color: '#EC4899',
    owner: { id: 'm-1', name: 'Sarah Jenkins', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
    taskCount: 12,
    completedTaskCount: 5,
    progress: 41,
  },
  {
    id: 'prj-6',
    key: 'LANDING',
    name: 'Landing Page Rebrand',
    client: 'Snazzy Studio',
    description: 'High-converting interactive studio homepage showcasing digital product design capabilities.',
    status: 'ACTIVE',
    priority: 'HIGH',
    startDate: '2024-02-01',
    endDate: '2024-03-15',
    color: '#8B5CF6',
    owner: { id: 'm-1', name: 'Sarah Jenkins', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
    taskCount: 6,
    completedTaskCount: 4,
    progress: 67,
  }
];

const INITIAL_CLIENTS: Client[] = [
  { id: 'cli-1', name: 'TechNova Solutions', company: 'TechNova Inc.', email: 'contact@technova.io', activeProjectsCount: 2, totalInvoiced: 48500, status: 'ACTIVE' },
  { id: 'cli-2', name: 'GreenGroove App', company: 'GreenGroove LLC', email: 'hello@greengroove.app', activeProjectsCount: 1, totalInvoiced: 22000, status: 'ACTIVE' },
  { id: 'cli-3', name: 'HealthMetrics', company: 'HealthMetrics Corp', email: 'ops@healthmetrics.com', activeProjectsCount: 1, totalInvoiced: 31000, status: 'ACTIVE' },
  { id: 'cli-4', name: 'SmartPay', company: 'SmartPay Global', email: 'billing@smartpay.io', activeProjectsCount: 2, totalInvoiced: 65400, status: 'ACTIVE' },
  { id: 'cli-5', name: 'Foodly', company: 'Foodly Tech', email: 'support@foodly.com', activeProjectsCount: 1, totalInvoiced: 18000, status: 'ACTIVE' },
  { id: 'cli-6', name: 'Snazzy Studio', company: 'Snazzy Co', email: 'team@snazzy.studio', activeProjectsCount: 1, totalInvoiced: 12500, status: 'ACTIVE' }
];

const INITIAL_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'm-1',
    name: 'Sarah Jenkins',
    email: 'sarah.j@snazzy.studio',
    role: 'Lead UI/UX Designer',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    department: 'Design',
    assignedTasksCount: 5,
    completedTasksCount: 18,
    weeklyCapacityHours: 40,
    loggedHoursThisWeek: 32.5,
    status: 'ONLINE',
  },
  {
    id: 'm-2',
    name: 'David Kim',
    email: 'david.k@snazzy.studio',
    role: 'Senior Fullstack Engineer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    department: 'Engineering',
    assignedTasksCount: 6,
    completedTasksCount: 24,
    weeklyCapacityHours: 40,
    loggedHoursThisWeek: 38.0,
    status: 'ONLINE',
  },
  {
    id: 'm-3',
    name: 'Elena Rostova',
    email: 'elena.r@snazzy.studio',
    role: 'Product Designer',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
    department: 'Design',
    assignedTasksCount: 4,
    completedTasksCount: 15,
    weeklyCapacityHours: 40,
    loggedHoursThisWeek: 28.0,
    status: 'BUSY',
  },
  {
    id: 'm-4',
    name: 'Marcus Chen',
    email: 'marcus.c@snazzy.studio',
    role: 'Backend Architect',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    department: 'Engineering',
    assignedTasksCount: 4,
    completedTasksCount: 21,
    weeklyCapacityHours: 40,
    loggedHoursThisWeek: 36.5,
    status: 'ONLINE',
  },
  {
    id: 'm-5',
    name: 'Alex Rivera',
    email: 'alex.r@snazzy.studio',
    role: 'Frontend Developer',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    department: 'Engineering',
    assignedTasksCount: 3,
    completedTasksCount: 12,
    weeklyCapacityHours: 40,
    loggedHoursThisWeek: 30.0,
    status: 'OFFLINE',
  }
];

const INITIAL_TAGS: Tag[] = [
  { id: 'tag-1', name: 'Design', color: '#10B981', usageCount: 14 },
  { id: 'tag-2', name: 'Frontend', color: '#06B6D4', usageCount: 18 },
  { id: 'tag-3', name: 'UX Design', color: '#8B5CF6', usageCount: 9 },
  { id: 'tag-4', name: 'Development', color: '#3B82F6', usageCount: 22 },
  { id: 'tag-5', name: 'Back-end', color: '#F59E0B', usageCount: 11 },
  { id: 'tag-6', name: 'UX Research', color: '#EC4899', usageCount: 6 },
];

const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    taskKey: 'AI-101',
    name: 'Create Wireframes for Homepage',
    client: 'TechNova Solutions',
    projectId: 'prj-1',
    project: 'AI-Powered Learning Platform',
    status: 'Review',
    priority: 'HIGH',
    tags: ['Design', 'UX Design'],
    estimation: 'Today, 1:00 AM',
    estimatedHours: 12,
    actualHours: 10,
    dateGroup: 'Today',
    assignees: [
      { id: 'm-1', name: 'Sarah Jenkins', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
      { id: 'm-5', name: 'Alex Rivera', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' }
    ],
    subtasks: [
      { id: 'st-1', title: 'Desktop hero layout options', completed: true },
      { id: 'st-2', title: 'Mobile breakpoints', completed: true },
      { id: 'st-3', title: 'Design system typography scale', completed: false }
    ],
    comments: [
      {
        id: 'tc-1',
        taskId: 'task-1',
        author: { id: 'm-1', name: 'Sarah Jenkins', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
        content: 'Updated hero section wireframe with dark mode variant.',
        createdAt: '2024-02-15T10:30:00Z'
      }
    ],
    activityLogs: [
      {
        id: 'act-1',
        taskId: 'task-1',
        actor: { id: 'm-1', name: 'Sarah Jenkins', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
        action: 'moved task from In Progress to Review',
        createdAt: '2024-02-15T11:00:00Z'
      }
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-2',
    taskKey: 'ECO-102',
    name: 'Develop Responsive Navigation Menu',
    client: 'GreenGroove App',
    projectId: 'prj-2',
    project: 'Eco-Friendly Lifestyle Tracker',
    status: 'InProgress',
    priority: 'MEDIUM',
    tags: ['Frontend'],
    estimation: 'Today, 1:00 PM',
    estimatedHours: 8,
    actualHours: 4,
    dateGroup: 'Today',
    assignees: [
      { id: 'm-2', name: 'David Kim', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' }
    ],
    subtasks: [
      { id: 'st-4', title: 'Implement mobile drawer toggle', completed: true },
      { id: 'st-5', title: 'Add keyboard navigation accessibility', completed: false }
    ],
    comments: [],
    activityLogs: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-3',
    taskKey: 'FIT-103',
    name: 'Design Mobile Layout for User Dashboard',
    client: 'HealthMetrics',
    projectId: 'prj-3',
    project: 'Fitness Tracker Web App',
    status: 'Stopped',
    priority: 'LOW',
    tags: ['UX Design'],
    estimation: 'Today, 3:00 PM',
    estimatedHours: 10,
    actualHours: 3,
    dateGroup: 'Today',
    assignees: [
      { id: 'm-3', name: 'Elena Rostova', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100' }
    ],
    subtasks: [],
    comments: [],
    activityLogs: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-4',
    taskKey: 'FIN-104',
    name: 'Implement Dark Mode Toggle',
    client: 'SmartPay',
    projectId: 'prj-4',
    project: 'Financial Management Tool',
    status: 'ToDo',
    priority: 'MEDIUM',
    tags: ['Development'],
    estimation: 'Today, 3:00 PM',
    estimatedHours: 6,
    actualHours: 0,
    dateGroup: 'Today',
    assignees: [
      { id: 'm-4', name: 'Marcus Chen', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' }
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-5',
    taskKey: 'GRO-105',
    name: 'Create Visual Style Guide',
    client: 'Foodly',
    projectId: 'prj-5',
    project: 'Online Grocery Platform',
    status: 'InProgress',
    priority: 'MEDIUM',
    tags: ['Design'],
    estimation: 'Today, 3:30 PM',
    estimatedHours: 16,
    actualHours: 9,
    dateGroup: 'Today',
    assignees: [
      { id: 'm-1', name: 'Sarah Jenkins', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' }
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-6',
    taskKey: 'AI-106',
    name: 'Optimize API Data Display on Dashboard',
    client: 'TechNova Solutions',
    projectId: 'prj-1',
    project: 'AI-Powered Learning Platform',
    status: 'Review',
    priority: 'HIGH',
    tags: ['Back-end'],
    estimation: 'Today, 5:00 PM',
    estimatedHours: 14,
    actualHours: 12,
    dateGroup: 'Today',
    assignees: [
      { id: 'm-2', name: 'David Kim', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' }
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-7',
    taskKey: 'LAN-107',
    name: 'Prototype Interaction Animations',
    client: 'Snazzy Studio',
    projectId: 'prj-6',
    project: 'Landing Page Rebrand',
    status: 'ToDo',
    priority: 'LOW',
    tags: ['UX Design'],
    estimation: 'Today, 6:00 PM',
    estimatedHours: 8,
    actualHours: 0,
    dateGroup: 'Today',
    assignees: [
      { id: 'm-3', name: 'Elena Rostova', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100' }
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-8',
    taskKey: 'FIN-108',
    name: 'Debug Authentication System',
    client: 'SmartPay',
    projectId: 'prj-4',
    project: 'Financial Management Tool',
    status: 'Review',
    priority: 'URGENT',
    tags: ['Development'],
    estimation: 'Tomorrow, 6:00 PM',
    estimatedHours: 5,
    actualHours: 5,
    dateGroup: 'Tomorrow',
    assignees: [
      { id: 'm-4', name: 'Marcus Chen', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' }
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-9',
    taskKey: 'ECO-109',
    name: 'Build Interactive Task Kanban Board',
    client: 'GreenGroove App',
    projectId: 'prj-2',
    project: 'Eco-Friendly Lifestyle Tracker',
    status: 'ToDo',
    priority: 'MEDIUM',
    tags: ['Frontend'],
    estimation: 'Tomorrow, 6:00 PM',
    estimatedHours: 10,
    actualHours: 0,
    dateGroup: 'Tomorrow',
    assignees: [
      { id: 'm-2', name: 'David Kim', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' }
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-10',
    taskKey: 'LAN-110',
    name: 'Conduct Usability Tests for Final Design',
    client: 'Snazzy Studio',
    projectId: 'prj-6',
    project: 'Landing Page Rebrand',
    status: 'Review',
    priority: 'HIGH',
    tags: ['UX Research'],
    estimation: 'Tomorrow, 7:00 PM',
    estimatedHours: 12,
    actualHours: 11,
    dateGroup: 'Tomorrow',
    assignees: [
      { id: 'm-3', name: 'Elena Rostova', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100' }
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-11',
    taskKey: 'LAN-111',
    name: 'Finalize Typography and Icon Set',
    client: 'Snazzy Studio',
    projectId: 'prj-6',
    project: 'Landing Page Rebrand',
    status: 'Completed',
    priority: 'MEDIUM',
    tags: ['Design'],
    estimation: 'Feb 16, 3:30 PM',
    estimatedHours: 6,
    actualHours: 6,
    dateGroup: 'Feb 16, 2024',
    assignees: [
      { id: 'm-1', name: 'Sarah Jenkins', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' }
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
    project: 'Eco-Friendly Lifestyle Tracker',
    startTime: '9:12 AM',
    endTime: '10:32 AM',
    duration: 4800, // 01:20:00
    dateGroup: 'Today',
  },
  {
    id: 'time-3',
    description: 'Preparing mood board and style guide',
    project: 'Fitness Tracker Web App',
    startTime: '10:32 AM',
    endTime: '1:21 PM',
    duration: 10140, // 02:49:00
    dateGroup: 'Today',
  },
  {
    id: 'time-4',
    description: 'Conducting usability tests',
    project: 'Landing Page Rebrand',
    startTime: '8:00 AM',
    endTime: '9:15 AM',
    duration: 4500, // 01:15:00
    dateGroup: 'Yesterday',
  },
  {
    id: 'time-5',
    description: 'Building responsive navigation menu',
    project: 'Eco-Friendly Lifestyle Tracker',
    startTime: '9:15 AM',
    endTime: '2:12 PM',
    duration: 17820, // 04:57:00
    dateGroup: 'Yesterday',
  }
];

const INITIAL_TIME_OFF: TimeOffRequest[] = [
  {
    id: 'to-1',
    memberId: 'm-3',
    memberName: 'Elena Rostova',
    memberAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
    type: 'VACATION',
    startDate: '2024-03-10',
    endDate: '2024-03-15',
    daysCount: 5,
    status: 'APPROVED',
    reason: 'Annual family holiday',
  },
  {
    id: 'to-2',
    memberId: 'm-5',
    memberName: 'Alex Rivera',
    memberAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    type: 'SICK_LEAVE',
    startDate: '2024-02-20',
    endDate: '2024-02-21',
    daysCount: 2,
    status: 'APPROVED',
    reason: 'Flu recovery',
  }
];

const INITIAL_INVOICES: Invoice[] = [
  { id: 'inv-101', invoiceNumber: 'INV-2024-001', clientName: 'TechNova Solutions', projectName: 'AI-Powered Learning Platform', amount: 18500, issueDate: '2024-02-01', dueDate: '2024-03-01', status: 'PAID', itemsCount: 4 },
  { id: 'inv-102', invoiceNumber: 'INV-2024-002', clientName: 'SmartPay', projectName: 'Financial Management Tool', amount: 24000, issueDate: '2024-02-10', dueDate: '2024-03-10', status: 'SENT', itemsCount: 6 },
  { id: 'inv-103', invoiceNumber: 'INV-2024-003', clientName: 'GreenGroove App', projectName: 'Eco-Friendly Lifestyle Tracker', amount: 12000, issueDate: '2024-02-14', dueDate: '2024-03-14', status: 'SENT', itemsCount: 3 },
];

const INITIAL_EXPENSES: Expense[] = [
  { id: 'exp-1', expenseNumber: 'EXP-2024-01', category: 'Software License', description: 'Figma Enterprise Workspace Annual Renewal', amount: 1450, projectName: 'Landing Page Rebrand', submittedBy: 'Sarah Jenkins', date: '2024-02-05', status: 'APPROVED' },
  { id: 'exp-2', expenseNumber: 'EXP-2024-02', category: 'Cloud Infrastructure', description: 'AWS Development Sandbox Instance Hosting', amount: 820, projectName: 'AI-Powered Learning Platform', submittedBy: 'Marcus Chen', date: '2024-02-12', status: 'APPROVED' },
  { id: 'exp-3', expenseNumber: 'EXP-2024-03', category: 'Design Assets', description: 'Stock Photography & Custom Icon Package', amount: 350, projectName: 'Eco-Friendly Lifestyle Tracker', submittedBy: 'Elena Rostova', date: '2024-02-14', status: 'PENDING' },
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
  projects: Project[];
  clients: Client[];
  teamMembers: TeamMember[];
  tags: Tag[];
  timeEntries: TimeEntry[];
  timeOffRequests: TimeOffRequest[];
  invoices: Invoice[];
  expenses: Expense[];
  activeTimer: ActiveTimer;
  selectedProject: string;
  myTasksOnly: boolean;
}

const STORAGE_KEY = 'scryme_tasks_app_state_v2';

function getStoredState(): AppStoreState {
  if (typeof window === 'undefined') {
    return {
      tasks: INITIAL_TASKS,
      projects: INITIAL_PROJECTS,
      clients: INITIAL_CLIENTS,
      teamMembers: INITIAL_TEAM_MEMBERS,
      tags: INITIAL_TAGS,
      timeEntries: INITIAL_TIME_ENTRIES,
      timeOffRequests: INITIAL_TIME_OFF,
      invoices: INITIAL_INVOICES,
      expenses: INITIAL_EXPENSES,
      activeTimer: {
        description: '',
        project: 'AI-Powered Learning Platform',
        startTime: 0,
        elapsedSeconds: 0,
        isRunning: false,
      },
      selectedProject: 'AI-Powered Learning Platform',
      myTasksOnly: false,
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
    projects: INITIAL_PROJECTS,
    clients: INITIAL_CLIENTS,
    teamMembers: INITIAL_TEAM_MEMBERS,
    tags: INITIAL_TAGS,
    timeEntries: INITIAL_TIME_ENTRIES,
    timeOffRequests: INITIAL_TIME_OFF,
    invoices: INITIAL_INVOICES,
    expenses: INITIAL_EXPENSES,
    activeTimer: {
      description: '',
      project: 'AI-Powered Learning Platform',
      startTime: 0,
      elapsedSeconds: 0,
      isRunning: false,
    },
    selectedProject: 'AI-Powered Learning Platform',
    myTasksOnly: false,
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
      const [tasksRes, projectsRes] = await Promise.all([
        taskApi.getTasks().catch(() => null),
        taskApi.getProjects().catch(() => null)
      ]);

      let updatedState = { ...currentState };

      if (tasksRes && Array.isArray(tasksRes.items) && tasksRes.items.length > 0) {
        const apiTasks: Task[] = tasksRes.items.map((item: any) => ({
          id: item.id,
          taskKey: item.taskKey || `TASK-${item.taskNumber || 101}`,
          name: item.title,
          description: item.description,
          client: item.project?.name || "General Workspace",
          projectId: item.projectId,
          project: item.project?.name || "Workspace Project",
          status: item.status === "DONE" ? "Completed" : item.status === "IN_PROGRESS" ? "InProgress" : item.status === "IN_REVIEW" ? "Review" : item.status === "CANCELED" ? "Stopped" : "ToDo",
          priority: item.priority || "MEDIUM",
          tags: item.labels ? item.labels.map((l: any) => l.label?.name).filter(Boolean) : ["Development"],
          estimation: item.dueDate ? new Date(item.dueDate).toLocaleDateString() : "Today",
          dateGroup: "Today",
          assignees: item.assignees ? item.assignees.map((a: any) => ({
            id: a.member?.id || a.memberId,
            name: a.member?.user?.name || "Team Member",
            avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
          })) : [],
          subtasks: [],
          comments: item.comments ? item.comments.map((c: any) => ({
            id: c.id,
            taskId: item.id,
            author: { id: c.authorId, name: c.author?.user?.name || "Author" },
            content: c.content,
            createdAt: c.createdAt,
          })) : [],
          createdAt: item.createdAt || new Date().toISOString(),
        }));
        updatedState.tasks = apiTasks;
      }

      if (projectsRes && Array.isArray(projectsRes.items) && projectsRes.items.length > 0) {
        const apiProjects: Project[] = projectsRes.items.map((item: any) => ({
          id: item.id,
          key: item.key || 'PRJ',
          name: item.name,
          client: item.organization?.name || 'Client',
          description: item.description,
          status: item.status || 'ACTIVE',
          priority: item.priority || 'MEDIUM',
          color: '#6366F1',
          owner: item.owner ? { id: item.owner.id, name: item.owner.user?.name || 'Owner' } : undefined,
          taskCount: item._count?.tasks || 0,
          completedTaskCount: 0,
          progress: 50,
          createdAt: item.createdAt,
        }));
        updatedState.projects = apiProjects;
      }

      currentState = updatedState;
      notify();
    } catch (err) {
      console.warn("API sync fallback to local state:", err);
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
  updateTask(taskId: string, updates: Partial<Task>) {
    currentState = {
      ...currentState,
      tasks: currentState.tasks.map((t) => (t.id === taskId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t)),
    };
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
  toggleSubtask(taskId: string, subtaskId: string) {
    currentState = {
      ...currentState,
      tasks: currentState.tasks.map((t) => {
        if (t.id !== taskId || !t.subtasks) return t;
        return {
          ...t,
          subtasks: t.subtasks.map((st) => (st.id === subtaskId ? { ...st, completed: !st.completed } : st))
        };
      })
    };
    notify();
  },
  addSubtask(taskId: string, title: string) {
    if (!title.trim()) return;
    const newSubtask: Subtask = {
      id: `st-${Date.now()}`,
      title: title.trim(),
      completed: false
    };
    currentState = {
      ...currentState,
      tasks: currentState.tasks.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          subtasks: [...(t.subtasks || []), newSubtask]
        };
      })
    };
    notify();
  },
  addComment(taskId: string, content: string, authorName: string = 'Sarah Jenkins') {
    if (!content.trim()) return;
    const newComment: TaskComment = {
      id: `tc-${Date.now()}`,
      taskId,
      author: {
        id: 'm-1',
        name: authorName,
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'
      },
      content: content.trim(),
      createdAt: new Date().toISOString()
    };
    currentState = {
      ...currentState,
      tasks: currentState.tasks.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          comments: [...(t.comments || []), newComment]
        };
      })
    };
    notify();
  },

  // Project Actions
  addProject(project: Omit<Project, 'id' | 'createdAt'>) {
    const newPrj: Project = {
      ...project,
      id: `prj-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    currentState = { ...currentState, projects: [newPrj, ...currentState.projects] };
    notify();
  },
  updateProject(id: string, updates: Partial<Project>) {
    currentState = {
      ...currentState,
      projects: currentState.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    };
    notify();
  },
  deleteProject(id: string) {
    currentState = {
      ...currentState,
      projects: currentState.projects.filter((p) => p.id !== id),
    };
    notify();
  },

  // Client Actions
  addClient(client: Omit<Client, 'id'>) {
    const newCli: Client = { ...client, id: `cli-${Date.now()}` };
    currentState = { ...currentState, clients: [newCli, ...currentState.clients] };
    notify();
  },

  // Team Actions
  addTeamMember(member: Omit<TeamMember, 'id'>) {
    const newMember: TeamMember = { ...member, id: `m-${Date.now()}` };
    currentState = { ...currentState, teamMembers: [newMember, ...currentState.teamMembers] };
    notify();
  },

  // Tag Actions
  addTag(tag: Omit<Tag, 'id'>) {
    const newTag: Tag = { ...tag, id: `tag-${Date.now()}` };
    currentState = { ...currentState, tags: [newTag, ...currentState.tags] };
    notify();
  },

  // Time Off Actions
  addTimeOff(request: Omit<TimeOffRequest, 'id'>) {
    const newReq: TimeOffRequest = { ...request, id: `to-${Date.now()}` };
    currentState = { ...currentState, timeOffRequests: [newReq, ...currentState.timeOffRequests] };
    notify();
  },

  // Invoice & Expense Actions
  addInvoice(invoice: Omit<Invoice, 'id'>) {
    const newInv: Invoice = { ...invoice, id: `inv-${Date.now()}` };
    currentState = { ...currentState, invoices: [newInv, ...currentState.invoices] };
    notify();
  },
  addExpense(expense: Omit<Expense, 'id'>) {
    const newExp: Expense = { ...expense, id: `exp-${Date.now()}` };
    currentState = { ...currentState, expenses: [newExp, ...currentState.expenses] };
    notify();
  },

  // View Filter Toggles
  setMyTasksOnly(val: boolean) {
    currentState = { ...currentState, myTasksOnly: val };
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
      projects: INITIAL_PROJECTS,
      clients: INITIAL_CLIENTS,
      teamMembers: INITIAL_TEAM_MEMBERS,
      tags: INITIAL_TAGS,
      timeEntries: INITIAL_TIME_ENTRIES,
      timeOffRequests: INITIAL_TIME_OFF,
      invoices: INITIAL_INVOICES,
      expenses: INITIAL_EXPENSES,
      activeTimer: {
        description: '',
        project: 'AI-Powered Learning Platform',
        startTime: 0,
        elapsedSeconds: 0,
        isRunning: false,
      },
      selectedProject: 'AI-Powered Learning Platform',
      myTasksOnly: false,
    };
    notify();
  }
};

export function useTaskStore() {
  return useSyncExternalStore(taskStore.subscribe, taskStore.getSnapshot, taskStore.getSnapshot);
}
