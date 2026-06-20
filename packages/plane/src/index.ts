import axios, { AxiosInstance } from 'axios';

export interface PlaneWorkspace {
  id: string;
  name: string;
  slug: string;
}

export interface PlaneProject {
  id: string;
  name: string;
  identifier: string;
}

export interface PlaneMember {
  id: string;
  email: string;
  role: string;
}

export class PlaneApiClient {
  private readonly client: AxiosInstance;

  constructor(
    private readonly baseUrl: string = process.env.PLANE_API_URL || 'https://app.plane.so',
    private readonly accessToken: string = process.env.PLANE_ACCESS_TOKEN || ''
  ) {
    this.client = axios.create({
      baseURL: `${this.baseUrl.replace(/\/$/, '')}/api/v1`,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Create a new workspace in Plane.
   */
  async createWorkspace(name: string, slug: string): Promise<PlaneWorkspace> {
    const response = await this.client.post<PlaneWorkspace>('/workspaces/', {
      name,
      slug,
    });
    return response.data;
  }

  /**
   * Create a new project within a workspace.
   */
  async createProject(workspaceSlug: string, name: string, identifier: string): Promise<PlaneProject> {
    const response = await this.client.post<PlaneProject>(`/workspaces/${workspaceSlug}/projects/`, {
      name,
      identifier,
    });
    return response.data;
  }

  /**
   * Add a member to a workspace.
   */
  async addWorkspaceMember(workspaceSlug: string, email: string, role: number = 20): Promise<any> {
    const response = await this.client.post(`/workspaces/${workspaceSlug}/members/`, {
      email,
      role,
    });
    return response.data;
  }

  /**
   * Add a member to a project.
   */
  async addProjectMember(workspaceSlug: string, projectId: string, memberId: string, role: number = 20): Promise<any> {
    const response = await this.client.post(`/workspaces/${workspaceSlug}/projects/${projectId}/members/`, {
      member: memberId,
      role,
    });
    return response.data;
  }

  /**
   * Get project details.
   */
  async getProject(workspaceSlug: string, projectId: string): Promise<PlaneProject> {
    const response = await this.client.get<PlaneProject>(`/workspaces/${workspaceSlug}/projects/${projectId}/`);
    return response.data;
  }
}
