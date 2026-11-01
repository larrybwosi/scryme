import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

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
  status: "BACKLOG" | "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "CANCELED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  projectId: string;
  milestoneId?: string;
  sprintId?: string;
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
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  createdAt: string;
}

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  goal?: string;
  status: "PLANNED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  startDate?: string;
  endDate?: string;
  scopePoints: number;
  completedPoints: number;
  createdAt: string;
}

export interface ProjectDocument {
  id: string;
  projectId: string;
  title: string;
  type: "RFC" | "SPEC" | "PLAN" | "GUIDE";
  status: "DRAFT" | "REVIEW" | "APPROVED" | "DEPRECATED";
  content?: string;
  summary?: string;
  authorId?: string;
  author?: {
    id: string;
    role: string;
    user: { id: string; name: string; email: string };
  };
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntry {
  id: string;
  taskId: string;
  memberId: string;
  hours: number;
  description?: string;
  date: string;
}

export interface Project {
  id: string;
  key?: string;
  name: string;
  description?: string;
  status: "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED";
  startDate?: string;
  endDate?: string;
  ownerId?: string;
  organizationId: string;
  tasks?: Task[];
  milestones?: Milestone[];
  sprints?: Sprint[];
  documents?: ProjectDocument[];
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

export interface WorkspaceContext {
  organizationId: string;
  orgSlug: string;
  orgName?: string;
  memberId: string | null;
}

export const ProjectsAPI = {
  async getWorkspaceContext(): Promise<WorkspaceContext> {
    try {
      const res = await apiClient.get("/v3/tasks/workspace");
      const data = res.data?.data || res.data;
      return data;
    } catch {
      return {
        organizationId: "org-demo",
        orgSlug: "scryme-hq",
        orgName: "Scryme HQ",
        memberId: "mem-1",
      };
    }
  },

  async getProjects(): Promise<Project[]> {
    try {
      const res = await apiClient.get("/v3/projects");
      const data = res.data?.data?.items || res.data?.items || res.data;
      if (Array.isArray(data) && data.length > 0) return data;
      return [
        {
          id: "prj-204",
          key: "NEXUS",
          name: "Nexus 2.0 Redesign",
          description: "Next-gen UI engine & unified tokens",
          status: "ACTIVE",
          startDate: "2025-01-01",
          endDate: "2025-10-29",
          organizationId: "org-demo",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "prj-102",
          key: "ENGINE",
          name: "Core Engine v3",
          description: "Zero-latency telemetry pipeline",
          status: "ACTIVE",
          startDate: "2025-02-01",
          endDate: "2025-11-15",
          organizationId: "org-demo",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
    } catch {
      return [
        {
          id: "prj-204",
          key: "NEXUS",
          name: "Nexus 2.0 Redesign",
          description: "Next-gen UI engine & unified tokens",
          status: "ACTIVE",
          startDate: "2025-01-01",
          endDate: "2025-10-29",
          organizationId: "org-demo",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
    }
  },

  async createProject(data: Partial<Project>): Promise<Project> {
    const payload = {
      name: data.name || "Untitled Project",
      key: data.key || (data.name ? data.name.substring(0, 5).toUpperCase().replace(/[^A-Z]/g, "PRJ") : `PRJ${Date.now().toString().slice(-4)}`),
      description: data.description,
      status: data.status || "ACTIVE",
    };
    try {
      const res = await apiClient.post("/v3/projects", payload);
      return res.data?.data || res.data;
    } catch {
      return {
        id: `prj-${Date.now()}`,
        name: payload.name,
        key: payload.key,
        description: payload.description,
        status: payload.status as any,
        organizationId: "org-demo",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  },

  async getProject(projectId: string): Promise<Project> {
    try {
      const res = await apiClient.get(`/v3/projects/${projectId}`);
      return res.data?.data || res.data;
    } catch {
      return {
        id: projectId,
        name: "Nexus 2.0 Redesign",
        description: "Next-gen UI engine & unified tokens",
        status: "ACTIVE",
        organizationId: "org-demo",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  },

  async getProjectTasks(projectId?: string): Promise<Task[]> {
    try {
      const url = projectId ? `/v3/tasks?projectId=${projectId}` : "/v3/tasks";
      const res = await apiClient.get(url);
      const data = res.data?.data?.items || res.data?.items || res.data;
      if (Array.isArray(data) && data.length > 0) return data;
      return [];
    } catch {
      return [];
    }
  },

  async createTask(taskData: Partial<Task>): Promise<Task> {
    try {
      const res = await apiClient.post("/v3/tasks", taskData);
      return res.data?.data || res.data;
    } catch {
      return {
        id: `task-${Date.now()}`,
        title: taskData.title || "New Task",
        description: taskData.description,
        status: taskData.status || "TODO",
        priority: taskData.priority || "MEDIUM",
        projectId: taskData.projectId || "prj-204",
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
      // Handled
    }
  },

  async logTimeEntry(taskId: string, hours: number, description?: string): Promise<TimeEntry> {
    try {
      const res = await apiClient.post(`/v3/tasks/${taskId}/time-entries`, { hours, description });
      return res.data?.data || res.data;
    } catch {
      return {
        id: `time-${Date.now()}`,
        taskId,
        memberId: "mem-current",
        hours,
        description,
        date: new Date().toISOString(),
      };
    }
  },

  async getProjectMilestones(projectId: string): Promise<Milestone[]> {
    try {
      const res = await apiClient.get(`/v3/projects/${projectId}/milestones`);
      const data = res.data?.data || res.data;
      if (Array.isArray(data)) return data;
      return [];
    } catch {
      return [];
    }
  },

  async createMilestone(milestoneData: Partial<Milestone>): Promise<Milestone> {
    try {
      const res = await apiClient.post(`/v3/projects/${milestoneData.projectId}/milestones`, milestoneData);
      return res.data?.data || res.data;
    } catch {
      return {
        id: `ms-${Date.now()}`,
        title: milestoneData.title || "New Milestone",
        description: milestoneData.description,
        projectId: milestoneData.projectId!,
        dueDate: milestoneData.dueDate,
        status: "OPEN",
        createdAt: new Date().toISOString(),
      };
    }
  },

  async getProjectSprints(projectId: string): Promise<Sprint[]> {
    try {
      const res = await apiClient.get(`/v3/projects/${projectId}/sprints`);
      const data = res.data?.data || res.data;
      if (Array.isArray(data)) return data;
      return [];
    } catch {
      return [];
    }
  },

  async createSprint(projectId: string, sprintData: Partial<Sprint>): Promise<Sprint> {
    try {
      const res = await apiClient.post(`/v3/projects/${projectId}/sprints`, sprintData);
      return res.data?.data || res.data;
    } catch {
      return {
        id: `sprint-${Date.now()}`,
        projectId,
        name: sprintData.name || "New Sprint",
        goal: sprintData.goal,
        status: sprintData.status || "PLANNED",
        scopePoints: sprintData.scopePoints || 0,
        completedPoints: 0,
        createdAt: new Date().toISOString(),
      };
    }
  },

  async getProjectDocuments(projectId?: string): Promise<ProjectDocument[]> {
    try {
      const url = projectId ? `/v3/projects/${projectId}/documents` : "/v3/projects/documents";
      const res = await apiClient.get(url);
      const data = res.data?.data || res.data;
      if (Array.isArray(data)) return data;
      return [];
    } catch {
      return [];
    }
  },

  async createProjectDocument(projectId: string, docData: Partial<ProjectDocument>): Promise<ProjectDocument> {
    try {
      const res = await apiClient.post(`/v3/projects/${projectId}/documents`, docData);
      return res.data?.data || res.data;
    } catch {
      return {
        id: `doc-${Date.now()}`,
        projectId,
        title: docData.title || "New Document",
        type: docData.type || "RFC",
        status: docData.status || "DRAFT",
        content: docData.content,
        summary: docData.summary,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  },

  async getMembers(): Promise<OrganizationMember[]> {
    try {
      const res = await apiClient.get("/v3/members");
      const data = res.data?.data?.items || res.data?.items || res.data?.data || res.data;
      if (Array.isArray(data) && data.length > 0) {
        return data.map((m: any) => ({
          id: m.id,
          name: m.user?.name || m.name || "Member",
          email: m.user?.email || m.email || "",
          role: m.role || "Member",
          avatarUrl: m.user?.image || m.avatarUrl,
        }));
      }
      return [
        { id: "mem-1", name: "Alex Johnson", email: "alex@scryme.tech", role: "Lead" },
        { id: "mem-2", name: "Sarah Chen", email: "sarah@scryme.tech", role: "Product" },
      ];
    } catch {
      return [
        { id: "mem-1", name: "Alex Johnson", email: "alex@scryme.tech", role: "Lead" },
        { id: "mem-2", name: "Sarah Chen", email: "sarah@scryme.tech", role: "Product" },
      ];
    }
  },
};
