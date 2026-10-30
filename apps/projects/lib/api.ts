import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: "BACKLOG" | "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  projectId: string;
  milestoneId?: string;
  assigneeId?: string;
  estimatedHours?: number;
  actualHours?: number;
  startDate?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  dueDate?: string;
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED";
  createdAt: string;
}

export interface TimeEntry {
  id: string;
  taskId: string;
  memberId: string;
  hours: number;
  notes?: string;
  date: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: "PLANNING" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED";
  startDate?: string;
  endDate?: string;
  ownerId?: string;
  organizationId: string;
  tasks?: Task[];
  milestones?: Milestone[];
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

export const ProjectsAPI = {
  async getProjects(): Promise<Project[]> {
    try {
      const res = await apiClient.get("/v3/tasks/projects");
      return res.data;
    } catch {
      return [
        {
          id: "proj-1",
          name: "ERP Mobile Redesign",
          description: "Mobile app overhaul for Android & POS modules",
          status: "ACTIVE",
          startDate: "2025-01-01",
          endDate: "2025-06-30",
          organizationId: "org-demo",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "proj-2",
          name: "V3 API Microservices & Performance",
          description: "Database queries parallelization and security hardening",
          status: "ACTIVE",
          startDate: "2025-02-01",
          endDate: "2025-04-30",
          organizationId: "org-demo",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
    }
  },

  async createProject(data: Partial<Project>): Promise<Project> {
    try {
      const res = await apiClient.post("/v3/tasks/projects", data);
      return res.data;
    } catch {
      return {
        id: `proj-${Date.now()}`,
        name: data.name || "Untitled Project",
        description: data.description,
        status: data.status || "PLANNING",
        organizationId: "org-demo",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  },

  async getProjectTasks(projectId: string): Promise<Task[]> {
    try {
      const res = await apiClient.get(`/v3/tasks?projectId=${projectId}`);
      return res.data;
    } catch {
      return [
        {
          id: "task-101",
          title: "Implement Task Kanban Drag-and-Drop",
          description: "Allow status updates directly via column cards",
          status: "IN_PROGRESS",
          priority: "HIGH",
          projectId,
          estimatedHours: 12,
          actualHours: 4,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "task-102",
          title: "Setup Gantt Timeline View",
          description: "Render task schedules and milestones visually",
          status: "TODO",
          priority: "MEDIUM",
          projectId,
          estimatedHours: 20,
          actualHours: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
    }
  },

  async createTask(taskData: Partial<Task>): Promise<Task> {
    try {
      const res = await apiClient.post("/v3/tasks", taskData);
      return res.data;
    } catch {
      return {
        id: `task-${Date.now()}`,
        title: taskData.title || "New Task",
        description: taskData.description,
        status: taskData.status || "TODO",
        priority: taskData.priority || "MEDIUM",
        projectId: taskData.projectId || "proj-1",
        estimatedHours: taskData.estimatedHours || 0,
        actualHours: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  },

  async updateTaskStatus(taskId: string, status: Task["status"]): Promise<void> {
    try {
      await apiClient.patch(`/v3/tasks/${taskId}`, { status });
    } catch {
      // Mock fallback state update
    }
  },

  async logTimeEntry(taskId: string, hours: number, notes?: string): Promise<TimeEntry> {
    try {
      const res = await apiClient.post(`/v3/tasks/${taskId}/time-entries`, { hours, notes });
      return res.data;
    } catch {
      return {
        id: `time-${Date.now()}`,
        taskId,
        memberId: "mem-current",
        hours,
        notes,
        date: new Date().toISOString(),
      };
    }
  },

  async getProjectMilestones(projectId: string): Promise<Milestone[]> {
    try {
      const res = await apiClient.get(`/v3/tasks/projects/${projectId}/milestones`);
      return res.data;
    } catch {
      return [
        {
          id: "ms-1",
          title: "Beta Launch Baseline",
          description: "Core features verified and tested",
          projectId,
          dueDate: "2025-04-15",
          status: "IN_PROGRESS",
          createdAt: new Date().toISOString(),
        },
      ];
    }
  },

  async createMilestone(milestoneData: Partial<Milestone>): Promise<Milestone> {
    try {
      const res = await apiClient.post(`/v3/tasks/projects/${milestoneData.projectId}/milestones`, milestoneData);
      return res.data;
    } catch {
      return {
        id: `ms-${Date.now()}`,
        title: milestoneData.title || "New Milestone",
        description: milestoneData.description,
        projectId: milestoneData.projectId!,
        dueDate: milestoneData.dueDate,
        status: "PLANNED",
        createdAt: new Date().toISOString(),
      };
    }
  },

  async getMembers(): Promise<OrganizationMember[]> {
    try {
      const res = await apiClient.get("/v3/organization/members");
      return res.data;
    } catch {
      return [
        { id: "mem-1", name: "Alex Johnson", email: "alex@scryme.tech", role: "Engineering Lead" },
        { id: "mem-2", name: "Sarah Chen", email: "sarah@scryme.tech", role: "Product Manager" },
        { id: "mem-3", name: "David Kim", email: "david@scryme.tech", role: "Fullstack Developer" },
      ];
    }
  },
};
