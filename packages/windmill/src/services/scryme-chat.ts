import axios from 'axios';

export interface ScrymeChatWorkspace {
  id: string;
  name: string;
  slug: string;
}

export class ScrymeChatApiClient {
  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiresAt: number | null = null;

  constructor(
    baseUrl: string = process.env.SCRYME_CHAT_API_URL || 'https://api.scryme.app',
    clientId: string = process.env.SCRYME_CHAT_CLIENT_ID || '',
    clientSecret: string = process.env.SCRYME_CHAT_CLIENT_SECRET || ''
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  private async ensureAuthenticated(): Promise<void> {
    if (this.accessToken && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt) {
      return;
    }

    const response = await axios.post(`${this.baseUrl}/api/v2/oauth/token`, {
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });

    this.accessToken = response.data.access_token;
    // Assuming 1 hour expiry if not provided
    const expiresIn = response.data.expires_in || 3600;
    this.tokenExpiresAt = Date.now() + (expiresIn - 60) * 1000; // Buffer of 1 minute
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    data?: any
  ): Promise<T> {
    await this.ensureAuthenticated();

    const response = await axios({
      method,
      url: `${this.baseUrl}${path}`,
      data,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  }

  /**
   * Create a new workspace in Scryme Chat.
   */
  async createWorkspace(name: string, slug: string): Promise<ScrymeChatWorkspace> {
    return this.request<ScrymeChatWorkspace>('POST', '/api/v2/workspaces', {
      name,
      slug,
    });
  }

  /**
   * Get workspace details.
   */
  async getWorkspace(slug: string): Promise<ScrymeChatWorkspace> {
    return this.request<ScrymeChatWorkspace>('GET', `/api/v2/workspaces/${slug}`);
  }
}
