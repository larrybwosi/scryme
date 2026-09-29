export type TaskStatus = 'ToDo' | 'InProgress' | 'Stopped' | 'Review' | 'Completed';
export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type DependencyType = 'BLOCKS' | 'BLOCKED_BY';

export interface TaskAssignee {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  role?: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  assigneeId?: string;
  dueDate?: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  createdAt: string;
}

export interface TaskActivityLog {
  id: string;
  taskId: string;
  actor: {
    id: string;
    name: string;
    avatar?: string;
  };
  action: string;
  details?: Record<string, any>;
  createdAt: string;
}

export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  dependsOnTaskTitle?: string;
  type: DependencyType;
}

export interface Task {
  id: string;
  taskKey?: string; // e.g. PRJ-101
  taskNumber?: number;
  name: string;
  description?: string;
  client: string;
  projectId?: string;
  project: string;
  status: TaskStatus;
  priority?: PriorityLevel;
  tags: string[];
  estimation: string; // e.g., "Today, 1:00 AM" or "Feb 16, 3:30 PM"
  estimatedHours?: number;
  actualHours?: number;
  startDate?: string;
  dueDate?: string;
  dateGroup: 'Today' | 'Tomorrow' | 'Feb 16, 2024';
  assignees: TaskAssignee[];
  createdById?: string;
  subtasks?: Subtask[];
  comments?: TaskComment[];
  dependencies?: TaskDependency[];
  activityLogs?: TaskActivityLog[];
  createdAt: string;
  updatedAt?: string;
}

export interface TimeEntry {
  id: string;
  taskId?: string;
  description: string;
  project: string;
  startTime: string; // e.g., "8:00 AM"
  endTime: string;   // e.g., "9:12 AM"
  duration: number;  // in seconds (e.g. 4320 = 01:12:00)
  dateGroup: 'Today' | 'Yesterday' | 'Friday, 14 Feb 2024';
  isRunning?: boolean;
}

export interface ProjectMember {
  id: string;
  memberId: string;
  name: string;
  email?: string;
  avatar?: string;
  role: 'ADMIN' | 'MEMBER' | 'VIEWER';
}

export interface Project {
  id: string;
  key: string;
  name: string;
  client: string;
  description?: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'ON_HOLD' | 'COMPLETED';
  priority?: PriorityLevel;
  startDate?: string;
  endDate?: string;
  color?: string;
  owner?: {
    id: string;
    name: string;
    avatar?: string;
  };
  members?: ProjectMember[];
  taskCount?: number;
  completedTaskCount?: number;
  progress?: number; // 0-100%
  createdAt?: string;
  updatedAt?: string;
}

export interface Client {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  activeProjectsCount?: number;
  status: 'ACTIVE' | 'INACTIVE' | 'PROSPECT';
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  department?: string;
  assignedTasksCount: number;
  completedTasksCount: number;
  weeklyCapacityHours: number;
  loggedHoursThisWeek: number;
  status: 'ONLINE' | 'OFFLINE' | 'BUSY' | 'ON_LEAVE';
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  usageCount?: number;
}

export interface TimeOffRequest {
  id: string;
  memberId: string;
  memberName: string;
  memberAvatar?: string;
  type: 'VACATION' | 'SICK_LEAVE' | 'PERSONAL' | 'MATERNITY_PATERNITY';
  startDate: string;
  endDate: string;
  daysCount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason?: string;
}
