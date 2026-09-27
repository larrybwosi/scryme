export type TaskStatus = 'ToDo' | 'InProgress' | 'Stopped' | 'Review' | 'Completed';

export interface Task {
  id: string;
  name: string;
  client: string;
  project: string;
  status: TaskStatus;
  tags: string[];
  estimation: string; // e.g., "Today, 1:00 AM" or "Feb 16, 3:30 PM"
  dateGroup: 'Today' | 'Tomorrow' | 'Feb 16, 2024';
  assignees: {
    name: string;
    avatar: string;
  }[];
  createdAt: string;
}

export interface TimeEntry {
  id: string;
  description: string;
  project: string;
  startTime: string; // e.g., "8:00 AM"
  endTime: string;   // e.g., "9:12 AM"
  duration: number;  // in seconds (e.g. 4320 = 01:12:00)
  dateGroup: 'Today' | 'Yesterday' | 'Friday, 14 Feb 2024';
  isRunning?: boolean;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  color?: string;
}

export interface Client {
  id: string;
  name: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
}
