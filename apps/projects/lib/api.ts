import axios from "axios";
import { authClient } from "./auth-client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

apiClient.interceptors.request.use(async (config) => {
  try {
    const session = await authClient.getSession();
    const activeOrgId =
      session?.data?.session?.activeOrganizationId ||
      session?.data?.user?.activeOrganizationId;
    const activeOrgSlug =
      session?.data?.session?.activeOrganizationSlug ||
      session?.data?.user?.activeOrganizationSlug;

    if (activeOrgId) {
      config.headers["x-organization-id"] = activeOrgId;
      config.headers["x-org-id"] = activeOrgId;
    }
    if (activeOrgSlug) {
      config.headers["x-org-slug"] = activeOrgSlug;
    }
    if (session?.data?.session?.token) {
      config.headers["Authorization"] = `Bearer ${session.data.session.token}`;
    }
  } catch {
    // Best-effort session attachment
  }
  return config;
});

export interface Task {
  id: string;
  taskNumber?: number;
  taskKey?: string;
  title: string;
  description?: string;
  status: "BACKLOG" | "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "CANCELED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  projectId: string;
  project?: { id: string; name: string; key: string };
  milestoneId?: string;
  sprintId?: string;
  parentTaskId?: string;
  assignees?: { id: string; member: { id: string; role: string; user: { name: string; email: string; image?: string } } }[];
  labels?: { label: { id: string; name: string; color: string } }[];
  subtasks?: Task[];
  timeEntries?: TimeEntry[];
  comments?: any[];
  activityLogs?: any[];
  estimatedHours?: number;
  actualHours?: number;
  startDate?: string;
  dueDate?: string;
  batches?: {
    id: string;
    batchNumber: string;
    runType: string;
    orderReference?: string;
    status: string;
  }[];
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
  tasks?: Task[];
  _count?: { tasks: number };
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
  _count?: { tasks: number };
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
    user: { id: string; name: string; email: string; image?: string };
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
  member?: { id: string; role: string; user: { name: string; email: string } };
}

export interface Project {
  id: string;
  key: string;
  name: string;
  description?: string;
  status: "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  startDate?: string;
  endDate?: string;
  ownerId?: string;
  organizationId: string;
  tasks?: Task[];
  milestones?: Milestone[];
  sprints?: Sprint[];
  documents?: ProjectDocument[];
  members?: { id: string; role: string; member: { id: string; role: string; user: { name: string; email: string; image?: string } } }[];
  _count?: { tasks: number; members: number };
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
    const res = await apiClient.get("/v3/tasks/workspace");
    const data = res.data?.data || res.data;
    return data;
  },

  async getProjects(): Promise<Project[]> {
    const res = await apiClient.get("/v3/projects");
    const data = res.data?.data?.items || res.data?.items || res.data?.data || res.data;
    return Array.isArray(data) ? data : [];
  },

  async createProject(data: Partial<Project>): Promise<Project> {
    const payload = {
      name: data.name || "Untitled Project",
      key: data.key || (data.name ? data.name.substring(0, 5).toUpperCase().replace(/[^A-Z]/g, "PRJ") : `PRJ${Date.now().toString().slice(-4)}`),
      description: data.description,
      status: data.status || "ACTIVE",
      priority: data.priority || "MEDIUM",
      startDate: data.startDate,
      endDate: data.endDate,
    };
    const res = await apiClient.post("/v3/projects", payload);
    return res.data?.data || res.data;
  },

  async getProject(projectId: string): Promise<Project> {
    const res = await apiClient.get(`/v3/projects/${projectId}`);
    return res.data?.data || res.data;
  },

  async updateProject(projectId: string, data: Partial<Project>): Promise<Project> {
    const res = await apiClient.patch(`/v3/projects/${projectId}`, data);
    return res.data?.data || res.data;
  },

  async deleteProject(projectId: string): Promise<{ success: boolean; id: string }> {
    const res = await apiClient.delete(`/v3/projects/${projectId}`);
    return res.data?.data || res.data;
  },

  async getProjectTasks(projectId?: string): Promise<Task[]> {
    const url = projectId ? `/v3/tasks?projectId=${projectId}` : "/v3/tasks";
    const res = await apiClient.get(url);
    const data = res.data?.data?.items || res.data?.items || res.data?.data || res.data;
    return Array.isArray(data) ? data : [];
  },

  async getTask(taskId: string): Promise<Task> {
    const res = await apiClient.get(`/v3/tasks/${taskId}`);
    return res.data?.data || res.data;
  },

  async createTask(taskData: Partial<Task> & { assigneeIds?: string[]; labelIds?: string[] }): Promise<Task> {
    const res = await apiClient.post("/v3/tasks", taskData);
    return res.data?.data || res.data;
  },

  async updateTask(taskId: string, taskData: Partial<Task>): Promise<Task> {
    const res = await apiClient.patch(`/v3/tasks/${taskId}`, taskData);
    return res.data?.data || res.data;
  },

  async updateTaskStatus(taskId: string, status: Task["status"]): Promise<Task> {
    const res = await apiClient.patch(`/v3/tasks/${taskId}`, { status });
    return res.data?.data || res.data;
  },

  async deleteTask(taskId: string): Promise<{ success: boolean; id: string }> {
    const res = await apiClient.delete(`/v3/tasks/${taskId}`);
    return res.data?.data || res.data;
  },

  async manageTaskAssignees(taskId: string, memberIds: string[]): Promise<Task> {
    const res = await apiClient.post(`/v3/tasks/${taskId}/assignees`, { memberIds });
    return res.data?.data || res.data;
  },

  async addTaskComment(taskId: string, content: string): Promise<any> {
    const res = await apiClient.post(`/v3/tasks/${taskId}/comments`, { content });
    return res.data?.data || res.data;
  },

  async getSubtasks(taskId: string): Promise<Task[]> {
    const res = await apiClient.get(`/v3/tasks/${taskId}/subtasks`);
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : [];
  },

  async logTimeEntry(taskId: string, hours: number, description?: string): Promise<TimeEntry> {
    const res = await apiClient.post(`/v3/tasks/${taskId}/time-entries`, { hours, description });
    return res.data?.data || res.data;
  },

  async listTimeEntries(taskId: string): Promise<TimeEntry[]> {
    const res = await apiClient.get(`/v3/tasks/${taskId}/time-entries`);
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : [];
  },

  async deleteTimeEntry(taskId: string, entryId: string): Promise<{ success: boolean; id: string }> {
    const res = await apiClient.delete(`/v3/tasks/${taskId}/time-entries/${entryId}`);
    return res.data?.data || res.data;
  },

  async getProjectMilestones(projectId: string): Promise<Milestone[]> {
    const res = await apiClient.get(`/v3/projects/${projectId}/milestones`);
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : [];
  },

  async createMilestone(milestoneData: Partial<Milestone>): Promise<Milestone> {
    const res = await apiClient.post(`/v3/projects/${milestoneData.projectId}/milestones`, milestoneData);
    return res.data?.data || res.data;
  },

  async updateMilestone(milestoneId: string, milestoneData: Partial<Milestone>): Promise<Milestone> {
    const res = await apiClient.patch(`/v3/projects/milestones/${milestoneId}`, milestoneData);
    return res.data?.data || res.data;
  },

  async deleteMilestone(milestoneId: string): Promise<{ success: boolean; id: string }> {
    const res = await apiClient.delete(`/v3/projects/milestones/${milestoneId}`);
    return res.data?.data || res.data;
  },

  async getProjectSprints(projectId: string): Promise<Sprint[]> {
    const res = await apiClient.get(`/v3/projects/${projectId}/sprints`);
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : [];
  },

  async createSprint(projectId: string, sprintData: Partial<Sprint>): Promise<Sprint> {
    const res = await apiClient.post(`/v3/projects/${projectId}/sprints`, sprintData);
    return res.data?.data || res.data;
  },

  async updateSprint(sprintId: string, sprintData: Partial<Sprint>): Promise<Sprint> {
    const res = await apiClient.patch(`/v3/projects/sprints/${sprintId}`, sprintData);
    return res.data?.data || res.data;
  },

  async deleteSprint(sprintId: string): Promise<{ success: boolean; id: string }> {
    const res = await apiClient.delete(`/v3/projects/sprints/${sprintId}`);
    return res.data?.data || res.data;
  },

  async getProjectDocuments(projectId?: string): Promise<ProjectDocument[]> {
    const url = projectId ? `/v3/projects/${projectId}/documents` : "/v3/projects/documents";
    const res = await apiClient.get(url);
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : [];
  },

  async createProjectDocument(projectId: string, docData: Partial<ProjectDocument>): Promise<ProjectDocument> {
    const res = await apiClient.post(`/v3/projects/${projectId}/documents`, docData);
    return res.data?.data || res.data;
  },

  async updateProjectDocument(documentId: string, docData: Partial<ProjectDocument>): Promise<ProjectDocument> {
    const res = await apiClient.patch(`/v3/projects/documents/${documentId}`, docData);
    return res.data?.data || res.data;
  },

  async deleteProjectDocument(documentId: string): Promise<{ success: boolean; id: string }> {
    const res = await apiClient.delete(`/v3/projects/documents/${documentId}`);
    return res.data?.data || res.data;
  },

  async getMembers(): Promise<OrganizationMember[]> {
    const res = await apiClient.get("/v3/members");
    const data = res.data?.data?.items || res.data?.items || res.data?.data || res.data;
    if (Array.isArray(data)) {
      return data.map((m: any) => ({
        id: m.id,
        name: m.user?.name || m.name || "Member",
        email: m.user?.email || m.email || "",
        role: m.role || "Member",
        avatarUrl: m.user?.image || m.avatarUrl,
      }));
    }
    return [];
  },
};
