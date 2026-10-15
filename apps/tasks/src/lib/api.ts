import { authClient } from "./auth-client";

function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const viteApiUrl = (import.meta as any).env?.VITE_API_URL || (import.meta as any).env?.VITE_PUBLIC_API_URL;
    if (viteApiUrl && typeof viteApiUrl === "string" && viteApiUrl.trim() !== "" && !viteApiUrl.includes("PLACEHOLDER")) {
      return viteApiUrl.trim();
    }
    const isDev = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    return isDev ? "http://localhost:3002" : "https://api.scryme.tech";
  }
  return "https://api.scryme.tech";
}

// The backend resolves the authenticated organization from the session/JWT
// already. Routes that are tenant-scoped in their URL path (e.g. the staff
// scheduling endpoints under `/:orgSlug/services/...`) additionally require
// the real organization *slug* (not its id) either in the path or in the
// `x-org-slug` header — sending the wrong value there causes the backend to
// reject the request with "Organization slug mismatch". We resolve and cache
// the real slug once per session via a dedicated workspace-context endpoint.
interface WorkspaceContext {
  organizationId: string;
  orgSlug: string;
  memberId: string | null;
}

let cachedWorkspace: WorkspaceContext | null = null;
let workspacePromise: Promise<WorkspaceContext | null> | null = null;

export function getWorkspaceContext(): Promise<WorkspaceContext | null> {
  if (cachedWorkspace) return Promise.resolve(cachedWorkspace);
  if (!workspacePromise) {
    workspacePromise = fetchWithAuth("/api/v3/tasks/workspace", { method: "GET" })
      .then((data: WorkspaceContext) => {
        cachedWorkspace = data;
        return data;
      })
      .catch(() => null)
      .finally(() => {
        workspacePromise = null;
      });
  }
  return workspacePromise;
}

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  let sessionToken: string | undefined;

  try {
    const sessionRes = await authClient.getSession();
    sessionToken = sessionRes?.data?.session?.token;
  } catch {
    // Session fetching failed or unauthenticated
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (sessionToken) {
    headers["Authorization"] = `Bearer ${sessionToken}`;
  }

  // Avoid recursing into ourselves while resolving the workspace context.
  if (!endpoint.includes("/tasks/workspace") && !("x-org-slug" in headers)) {
    const workspace = await getWorkspaceContext();
    if (workspace?.orgSlug) {
      headers["x-org-slug"] = workspace.orgSlug;
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || `API request failed with status ${response.status}`);
  }

  const json = await response.json().catch(() => null);

  // The API wraps every successful response as { success, data, timestamp }.
  // Unwrap it here so every call site works with the actual payload.
  if (json && typeof json === "object" && "success" in json && "data" in json) {
    return json.data;
  }

  return json;
}

export const taskApi = {
  // Task endpoints
  async getTasks(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/api/v3/tasks${query ? `?${query}` : ""}`;
    return fetchWithAuth(endpoint, { method: "GET" });
  },

  async getTask(id: string) {
    return fetchWithAuth(`/api/v3/tasks/${id}`, { method: "GET" });
  },

  async createTask(data: any) {
    return fetchWithAuth("/api/v3/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateTask(id: string, data: any) {
    return fetchWithAuth(`/api/v3/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async deleteTask(id: string) {
    return fetchWithAuth(`/api/v3/tasks/${id}`, {
      method: "DELETE",
    });
  },

  async manageAssignees(id: string, memberIds: string[]) {
    return fetchWithAuth(`/api/v3/tasks/${id}/assignees`, {
      method: "POST",
      body: JSON.stringify({ memberIds }),
    });
  },

  async addDependency(id: string, dependsOnTaskId: string, type: 'BLOCKS' | 'BLOCKED_BY' = 'BLOCKS') {
    return fetchWithAuth(`/api/v3/tasks/${id}/dependencies`, {
      method: "POST",
      body: JSON.stringify({ dependsOnTaskId, type }),
    });
  },

  async removeDependency(id: string, dependsOnTaskId: string) {
    return fetchWithAuth(`/api/v3/tasks/${id}/dependencies/${dependsOnTaskId}`, {
      method: "DELETE",
    });
  },

  async addComment(id: string, content: string) {
    return fetchWithAuth(`/api/v3/tasks/${id}/comments`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  },

  // Project endpoints
  async getProjects(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/api/v3/projects${query ? `?${query}` : ""}`;
    return fetchWithAuth(endpoint, { method: "GET" });
  },

  async getProject(id: string) {
    return fetchWithAuth(`/api/v3/projects/${id}`, { method: "GET" });
  },

  async createProject(data: any) {
    return fetchWithAuth("/api/v3/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateProject(id: string, data: any) {
    return fetchWithAuth(`/api/v3/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async deleteProject(id: string) {
    return fetchWithAuth(`/api/v3/projects/${id}`, {
      method: "DELETE",
    });
  },

  async manageProjectMember(id: string, memberId: string, role: 'ADMIN' | 'MEMBER' | 'VIEWER') {
    return fetchWithAuth(`/api/v3/projects/${id}/members`, {
      method: "POST",
      body: JSON.stringify({ memberId, role }),
    });
  },

  async removeProjectMember(id: string, memberId: string) {
    return fetchWithAuth(`/api/v3/projects/${id}/members/${memberId}`, {
      method: "DELETE",
    });
  },

  // Label endpoints
  async getLabels(projectId?: string) {
    const query = projectId ? `?projectId=${projectId}` : "";
    return fetchWithAuth(`/api/v3/tasks/labels/list${query}`, { method: "GET" });
  },

  async createLabel(data: { name: string; color?: string; projectId?: string }) {
    return fetchWithAuth("/api/v3/tasks/labels", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Member / Team endpoints
  async getMembers() {
    return fetchWithAuth("/api/v3/members", { method: "GET" });
  },
};

// Staff scheduling endpoints (recurring shifts + one-off leave/overrides).
// These live under the tenant-scoped `/:orgSlug/services` module, so every
// call first resolves the real organization slug via the workspace context.
async function servicesEndpoint(path: string) {
  const workspace = await getWorkspaceContext();
  if (!workspace?.orgSlug) {
    throw new Error("Unable to resolve the current workspace organization");
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `/api/v3/${workspace.orgSlug}/services${cleanPath}`;
}

export const scheduleApi = {
  // Weekly recurring shifts
  async getShifts(params: { memberId?: string; dayOfWeek?: number; isActive?: boolean } = {}) {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    const endpoint = await servicesEndpoint(`/shifts${query ? `?${query}` : ""}`);
    return fetchWithAuth(endpoint, { method: "GET" });
  },

  async createShift(
    memberId: string,
    data: { dayOfWeek: number; startTime: string; endTime: string; locationId?: string },
  ) {
    const endpoint = await servicesEndpoint(`/staff/${memberId}/shifts`);
    return fetchWithAuth(endpoint, { method: "POST", body: JSON.stringify(data) });
  },

  async updateShift(
    id: string,
    data: Partial<{ dayOfWeek: number; startTime: string; endTime: string; isActive: boolean; locationId: string | null }>,
  ) {
    const endpoint = await servicesEndpoint(`/shifts/${id}`);
    return fetchWithAuth(endpoint, { method: "PATCH", body: JSON.stringify(data) });
  },

  async deleteShift(id: string) {
    const endpoint = await servicesEndpoint(`/shifts/${id}`);
    return fetchWithAuth(endpoint, { method: "DELETE" });
  },

  // One-off schedule overrides (leave, unavailability, blackouts, extra working time)
  async getOverrides(params: { from: string; to: string; memberId?: string }) {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    const endpoint = await servicesEndpoint(`/schedule/overrides?${query}`);
    return fetchWithAuth(endpoint, { method: "GET" });
  },

  async createOverride(
    memberId: string,
    data: { type: "WORKING" | "UNAVAILABLE" | "LEAVE" | "BLACKOUT"; startTime: string; endTime: string; reason?: string },
  ) {
    const endpoint = await servicesEndpoint(`/staff/${memberId}/overrides`);
    return fetchWithAuth(endpoint, { method: "POST", body: JSON.stringify(data) });
  },

  async deleteOverride(id: string) {
    const endpoint = await servicesEndpoint(`/schedule/overrides/${id}`);
    return fetchWithAuth(endpoint, { method: "DELETE" });
  },

  // Shift Trade / Swap endpoints
  async getShiftTrades(params: { memberId?: string; status?: string } = {}) {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    const endpoint = await servicesEndpoint(`/shifts/trades${query ? `?${query}` : ""}`);
    return fetchWithAuth(endpoint, { method: "GET" });
  },

  async requestShiftTrade(data: {
    shiftId: string;
    targetMemberId?: string;
    offeredShiftId?: string;
    type?: "TRADE" | "SWAP";
    reason?: string;
  }) {
    const endpoint = await servicesEndpoint("/shifts/trades");
    return fetchWithAuth(endpoint, { method: "POST", body: JSON.stringify(data) });
  },

  async processShiftTrade(id: string, action: "APPROVE" | "REJECT" | "CANCEL") {
    const endpoint = await servicesEndpoint(`/shifts/trades/${id}/process`);
    return fetchWithAuth(endpoint, { method: "POST", body: JSON.stringify({ action }) });
  },
};
