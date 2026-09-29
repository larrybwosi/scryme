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

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  const sessionResponse = authClient.useSession ? authClient.getStore?.()?.value : null;
  const sessionToken = sessionResponse?.session?.token;
  const orgSlug = sessionResponse?.session?.activeOrganizationId || sessionResponse?.user?.activeOrganizationId;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (sessionToken) {
    headers["Authorization"] = `Bearer ${sessionToken}`;
  }
  if (orgSlug) {
    headers["x-org-slug"] = orgSlug;
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

  return response.json();
}

export const taskApi = {
  // Task endpoints
  async getTasks(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/v3/tasks${query ? `?${query}` : ""}`;
    return fetchWithAuth(endpoint, { method: "GET" });
  },

  async getTask(id: string) {
    return fetchWithAuth(`/v3/tasks/${id}`, { method: "GET" });
  },

  async createTask(data: any) {
    return fetchWithAuth("/v3/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateTask(id: string, data: any) {
    return fetchWithAuth(`/v3/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async deleteTask(id: string) {
    return fetchWithAuth(`/v3/tasks/${id}`, {
      method: "DELETE",
    });
  },

  async manageAssignees(id: string, memberIds: string[]) {
    return fetchWithAuth(`/v3/tasks/${id}/assignees`, {
      method: "POST",
      body: JSON.stringify({ memberIds }),
    });
  },

  async addDependency(id: string, dependsOnTaskId: string, type: 'BLOCKS' | 'BLOCKED_BY' = 'BLOCKS') {
    return fetchWithAuth(`/v3/tasks/${id}/dependencies`, {
      method: "POST",
      body: JSON.stringify({ dependsOnTaskId, type }),
    });
  },

  async removeDependency(id: string, dependsOnTaskId: string) {
    return fetchWithAuth(`/v3/tasks/${id}/dependencies/${dependsOnTaskId}`, {
      method: "DELETE",
    });
  },

  async addComment(id: string, content: string) {
    return fetchWithAuth(`/v3/tasks/${id}/comments`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  },

  // Project endpoints
  async getProjects(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/v3/projects${query ? `?${query}` : ""}`;
    return fetchWithAuth(endpoint, { method: "GET" });
  },

  async getProject(id: string) {
    return fetchWithAuth(`/v3/projects/${id}`, { method: "GET" });
  },

  async createProject(data: any) {
    return fetchWithAuth("/v3/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateProject(id: string, data: any) {
    return fetchWithAuth(`/v3/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async deleteProject(id: string) {
    return fetchWithAuth(`/v3/projects/${id}`, {
      method: "DELETE",
    });
  },

  async manageProjectMember(id: string, memberId: string, role: 'ADMIN' | 'MEMBER' | 'VIEWER') {
    return fetchWithAuth(`/v3/projects/${id}/members`, {
      method: "POST",
      body: JSON.stringify({ memberId, role }),
    });
  },

  async removeProjectMember(id: string, memberId: string) {
    return fetchWithAuth(`/v3/projects/${id}/members/${memberId}`, {
      method: "DELETE",
    });
  },

  // Label endpoints
  async getLabels(projectId?: string) {
    const query = projectId ? `?projectId=${projectId}` : "";
    return fetchWithAuth(`/v3/tasks/labels/list${query}`, { method: "GET" });
  },

  async createLabel(data: { name: string; color?: string; projectId?: string }) {
    return fetchWithAuth("/v3/tasks/labels", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Member / Team endpoints
  async getMembers() {
    return fetchWithAuth("/v3/members", { method: "GET" });
  },
};
