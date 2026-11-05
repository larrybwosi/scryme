import axios from "axios";
import { env } from "@repo/env";
import { authClient } from "./auth-client";
import { getResolvedApiUrl } from "./urls";

export interface MemberPerformance {
  member: {
    id: string;
    name: string;
    email: string;
    role: string;
    image?: string | null;
  };
  period: {
    from: string;
    to: string;
  };
  kpis: {
    onTimeCompletionRate: number;
    velocity: number;
    totalTasks: number;
    completedTasks: number;
    capacityUtilizationRate: number;
    overdueTaskCount: number;
    averageResolutionHours: number;
    totalActualHours: number;
    totalEstimatedHours: number;
    expectedCapacityHours: number;
  };
  recentTasks: {
    id: string;
    taskKey?: string;
    title: string;
    status: string;
    priority: string;
    dueDate?: string;
    actualHours?: number;
    estimatedHours?: number;
    project?: { id: string; name: string; key: string };
  }[];
}

export interface WeeklyTimesheetRecord {
  memberId: string;
  memberName: string;
  memberEmail: string;
  weekStartDate: string;
  totalHours: number;
  billableHours: number;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  entries: {
    id: string;
    taskId: string;
    taskKey?: string;
    taskTitle?: string;
    hours: number;
    description?: string;
    date: string;
  }[];
}

export interface StaffShiftItem {
  id: string;
  memberId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  locationId?: string;
  departmentId?: string;
  breaks?: { id: string; startTime: string; endTime: string; description?: string }[];
  member?: { id: string; user?: { name: string; email: string } };
}

export interface ShiftTradeItem {
  id: string;
  requesterMemberId: string;
  targetMemberId?: string;
  shiftId: string;
  offeredShiftId?: string;
  type: string;
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  requesterMember?: { id: string; user?: { name: string; email: string; image?: string } };
  targetMember?: { id: string; user?: { name: string; email: string; image?: string } };
  shift?: { id: string; dayOfWeek: number; startTime: string; endTime: string };
  offeredShift?: { id: string; dayOfWeek: number; startTime: string; endTime: string };
}

const API_BASE_URL = getResolvedApiUrl(env.NEXT_PUBLIC_API_URL, env.NODE_ENV);

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
  assignees?: { id: string; isPrimary?: boolean; allocatedHours?: number; member: { id: string; role: string; user: { name: string; email: string; image?: string } } }[];
  labels?: { label: { id: string; name: string; color: string } }[];
  subtasks?: Task[];
  timeEntries?: TimeEntry[];
  comments?: any[];
  activityLogs?: any[];
  estimatedHours?: number;
  actualHours?: number;
  startDate?: string;
  dueDate?: string;
  bookingId?: string | null;
  booking?: {
    id: string;
    serviceName: string;
    status: string;
    scheduledStartTime: string;
    scheduledEndTime?: string;
    customer?: { id: string; name: string; phone?: string; email?: string };
    locationId?: string;
  };
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
  project?: { id: string; name: string; key: string };
  dueDate?: string;
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  tasks?: Task[];
  _count?: { tasks: number };
  createdAt: string;
}

export interface Sprint {
  id: string;
  projectId: string;
  project?: { id: string; name: string; key: string };
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
  taskId?: string | null;
  memberId: string;
  hours: number;
  description?: string;
  date: string;
  category?: string;
  isBillable?: boolean;
  isLocked?: boolean;
  member?: { id: string; role: string; user: { name: string; email: string } };
  task?: { id: string; taskKey: string; title: string; projectId?: string };
}

export interface TeamPerformanceOverview {
  period: {
    from: string;
    to: string;
  };
  squadOverview: {
    averageOnTimeCompletionRate: number;
    totalVelocity: number;
    totalHoursLogged: number;
    averageCapacityUtilization: number;
    activeMemberCount: number;
  };
  leaderboard: {
    member: {
      id: string;
      name: string;
      email: string;
      role: string;
      image?: string | null;
    };
    kpis: {
      onTimeCompletionRate: number;
      velocity: number;
      totalTasks: number;
      completedTasks: number;
      capacityUtilizationRate: number;
      overdueTaskCount: number;
      averageResolutionHours: number;
      totalActualHours: number;
      totalEstimatedHours: number;
      expectedCapacityHours: number;
    };
  }[];
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


export interface UnifiedCalendarEvent {
  id: string;
  rawId: string;
  category: "task" | "milestone" | "production" | "delivery" | "crm" | "shift";
  title: string;
  status: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | string;
  startAt: string;
  endAt: string;
  code?: string;
  projectId?: string;
  projectName?: string;
  projectKey?: string;
  assignees?: {
    id: string;
    name: string;
    email?: string;
    image?: string;
    phone?: string;
  }[];
  details?: Record<string, any>;
}

export interface UnifiedCalendarResponse {
  range: {
    from: string;
    to: string;
  };
  counts: {
    total: number;
    tasks: number;
    production: number;
    deliveries: number;
    crm: number;
    shifts: number;
  };
  events: UnifiedCalendarEvent[];
}

export interface UnifiedCalendarFilter {
  from?: string;
  to?: string;
  categories?: string;
  projectId?: string;
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

  async manageTaskAssignees(
    taskId: string,
    assignees: { memberId: string; isPrimary?: boolean; allocatedHours?: number }[] | string[]
  ): Promise<Task> {
    const payload = Array.isArray(assignees) && typeof assignees[0] === 'string'
      ? { memberIds: assignees }
      : { assignees };
    const res = await apiClient.post(`/v3/tasks/${taskId}/assignees`, payload);
    return res.data?.data || res.data;
  },

  async getTeamPerformance(from?: string, to?: string): Promise<TeamPerformanceOverview> {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const res = await apiClient.get(`/v3/tasks/team/performance?${params.toString()}`);
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

  async logTimeEntry(
    taskId: string | undefined,
    hours: number,
    description?: string,
    options?: { category?: string; isBillable?: boolean }
  ): Promise<TimeEntry> {
    const url = taskId ? `/v3/tasks/${taskId}/time-entries` : `/v3/tasks/time-entries`;
    const res = await apiClient.post(url, {
      hours,
      description,
      taskId: taskId || undefined,
      category: options?.category,
      isBillable: options?.isBillable,
    });
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

  async getCalendarEvents(projectId?: string): Promise<{ tasks: Task[]; milestones: Milestone[]; sprints: Sprint[] }> {
    const url = projectId ? `/v3/tasks/calendar/events?projectId=${projectId}` : "/v3/tasks/calendar/events";
    const res = await apiClient.get(url);
    const data = res.data?.data || res.data;
    return {
      tasks: Array.isArray(data?.tasks) ? data.tasks : [],
      milestones: Array.isArray(data?.milestones) ? data.milestones : [],
      sprints: Array.isArray(data?.sprints) ? data.sprints : [],
    };
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

  async getUnifiedCalendar(filter?: UnifiedCalendarFilter): Promise<UnifiedCalendarResponse> {
    const params = new URLSearchParams();
    if (filter?.from) params.set("from", filter.from);
    if (filter?.to) params.set("to", filter.to);
    if (filter?.categories) params.set("categories", filter.categories);
    if (filter?.projectId) params.set("projectId", filter.projectId);

    const queryStr = params.toString() ? `?${params.toString()}` : "";
    const res = await apiClient.get(`/v3/scheduling/unified-calendar${queryStr}`);
    const data = res.data?.data || res.data;
    return {
      range: data?.range || { from: "", to: "" },
      counts: data?.counts || { total: 0, tasks: 0, production: 0, deliveries: 0, crm: 0, shifts: 0 },
      events: Array.isArray(data?.events) ? data.events : [],
    };
  },

  async updateUnifiedEventStatus(
    eventId: string,
    payload: { category: "task" | "production" | "delivery" | "crm" | "shift"; status: string; scheduledDate?: string; notes?: string }
  ): Promise<{ success: boolean; id: string; status: string }> {
    const res = await apiClient.patch(`/v3/scheduling/unified-calendar/events/${eventId}/status`, payload);
    return res.data?.data || res.data;
  },


  async getMemberPerformance(memberId: string, from?: string, to?: string): Promise<MemberPerformance> {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const query = params.toString() ? ('?' + params.toString()) : '';
    const res = await apiClient.get('/v3/tasks/members/' + memberId + '/performance' + query);
    return res.data?.data || res.data;
  },

  async getWeeklyTimesheets(memberId?: string, weekStartDate?: string): Promise<WeeklyTimesheetRecord[]> {
    const params = new URLSearchParams();
    if (memberId) params.set('memberId', memberId);
    if (weekStartDate) params.set('weekStartDate', weekStartDate);
    const query = params.toString() ? ('?' + params.toString()) : '';
    const res = await apiClient.get('/v3/tasks/timesheets/weekly' + query);
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : [];
  },

  async submitWeeklyTimesheet(payload: { weekStartDate: string; notes?: string }): Promise<any> {
    const res = await apiClient.post('/v3/tasks/timesheets/submit', payload);
    return res.data?.data || res.data;
  },

  async processWeeklyTimesheet(timesheetId: string, payload: { action: 'APPROVE' | 'REJECT'; notes?: string }): Promise<any> {
    const res = await apiClient.post('/v3/tasks/timesheets/' + timesheetId + '/process', payload);
    return res.data?.data || res.data;
  },

  async getStaffShifts(memberId?: string): Promise<StaffShiftItem[]> {
    const query = memberId ? ('?memberId=' + memberId) : '';
    const res = await apiClient.get('/v3/shifts' + query);
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : [];
  },

  async createStaffShift(data: Partial<StaffShiftItem>): Promise<StaffShiftItem> {
    const res = await apiClient.post('/v3/shifts', data);
    return res.data?.data || res.data;
  },

  async updateStaffShift(shiftId: string, data: Partial<StaffShiftItem>): Promise<StaffShiftItem> {
    const res = await apiClient.patch('/v3/shifts/' + shiftId, data);
    return res.data?.data || res.data;
  },

  async deleteStaffShift(shiftId: string): Promise<{ success: boolean; id: string }> {
    const res = await apiClient.delete('/v3/shifts/' + shiftId);
    return res.data?.data || res.data;
  },

  async getShiftTrades(status?: string): Promise<ShiftTradeItem[]> {
    const query = status ? ('?status=' + status) : '';
    const res = await apiClient.get('/v3/shifts/trades' + query);
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : [];
  },

  async requestShiftTrade(payload: { shiftId: string; targetMemberId?: string; offeredShiftId?: string; type?: string; reason?: string }): Promise<ShiftTradeItem> {
    const res = await apiClient.post('/v3/shifts/trades', payload);
    return res.data?.data || res.data;
  },

  async processShiftTrade(tradeId: string, action: 'APPROVE' | 'REJECT' | 'CANCEL'): Promise<any> {
    const res = await apiClient.post('/v3/shifts/trades/' + tradeId + '/process', { action });
    return res.data?.data || res.data;
  },
};
