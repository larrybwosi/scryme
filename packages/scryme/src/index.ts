import axios from 'axios';

export interface ScrymeChatWorkspace {
  id: string;
  name: string;
  slug: string;
}

export interface ScrymeChatMessage {
  content: string;
  attachments?: any[];
  actions?: ScrymeChatAction[];
  threadId?: string;
}

export interface ScrymeChatAction {
  id: string;
  label: string;
  type: 'button';
  style?: 'primary' | 'secondary' | 'danger';
  value?: string;
}

export interface ScrymeChatUser {
  id: string;
  email: string;
  name: string;
}

export interface ScrymeChatChannel {
  id: string;
  slug: string;
  type: 'public' | 'private' | 'dm';
}

export class ScrymeChatApiClient {
  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiresAt: number | null = null;
  private authPromise: Promise<void> | null = null;

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

    if (this.authPromise) {
      return this.authPromise;
    }

    this.authPromise = (async () => {
      try {
        if (!this.clientId || !this.clientSecret) {
          throw new Error('Scryme Chat M2M credentials missing');
        }

        const response = await axios.post(
          `${this.baseUrl}/api/v2/oauth/token`,
          {
            grant_type: 'client_credentials',
            client_id: this.clientId,
            client_secret: this.clientSecret,
          },
          {
            timeout: 10000,
            maxContentLength: 1 * 1024 * 1024, // 1MB for token
          }
        );

        this.accessToken = response.data.access_token;
        // Assuming 1 hour expiry if not provided
        const expiresIn = response.data.expires_in || 3600;
        this.tokenExpiresAt = Date.now() + (expiresIn - 60) * 1000; // Buffer of 1 minute
      } finally {
        this.authPromise = null;
      }
    })();

    return this.authPromise;
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    path: string,
    data?: any
  ): Promise<T> {
    await this.ensureAuthenticated();

    try {
      const response = await axios({
        method,
        url: `${this.baseUrl}${path}`,
        data,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
        maxContentLength: 10 * 1024 * 1024, // 10MB limit
      });

      return response.data;
    } catch (error: any) {
      if (error.response) {
        console.error(`Scryme API Error [${method} ${path}]:`, {
          status: error.response.status,
          data: error.response.data,
        });
      } else {
        console.error(`Scryme API Error [${method} ${path}]:`, error.message);
      }
      throw error;
    }
  }

  /**
   * Create a new workspace in Scryme Chat.
   */
  async createWorkspace(name: string, slug: string): Promise<ScrymeChatWorkspace> {
    return this.request<ScrymeChatWorkspace>('POST', '/api/v2/m2m/workspaces', {
      name,
      slug,
    });
  }

  /**
   * Get workspace details.
   */
  async getWorkspace(slug: string): Promise<ScrymeChatWorkspace> {
    return this.request<ScrymeChatWorkspace>('GET', `/api/v2/m2m/workspaces/${slug}`);
  }

  /**
   * Create a new channel in a workspace.
   */
  async createChannel(
    workspaceSlug: string,
    name: string,
    slug: string,
    type: 'public' | 'private' = 'public'
  ): Promise<ScrymeChatChannel> {
    return this.request<ScrymeChatChannel>('POST', `/api/v2/m2m/workspaces/${workspaceSlug}/channels`, {
      name,
      slug,
      type,
    });
  }

  /**
   * Add a user to a channel.
   */
  async addUserToChannel(
    workspaceSlug: string,
    channelSlug: string,
    email: string
  ): Promise<any> {
    return this.request('POST', `/api/v2/m2m/workspaces/${workspaceSlug}/channels/${channelSlug}/members`, {
      email
    });
  }

  /**
   * Send a message to a Scryme Chat channel.
   */
  async sendMessage(workspaceSlug: string, channelSlug: string, message: ScrymeChatMessage): Promise<any> {
    return this.request('POST', `/api/v2/m2m/workspaces/${workspaceSlug}/channels/${channelSlug}/messages`, message);
  }

  /**
   * Update an existing message.
   */
  async updateMessage(workspaceSlug: string, channelSlug: string, messageId: string, message: ScrymeChatMessage): Promise<any> {
    return this.request('PATCH', `/api/v2/m2m/workspaces/${workspaceSlug}/channels/${channelSlug}/messages/${messageId}`, message);
  }

  /**
   * Find a user in the workspace by email.
   */
  async findUserByEmail(workspaceSlug: string, email: string): Promise<ScrymeChatUser | null> {
    const users = await this.request<ScrymeChatUser[]>('GET', `/api/v2/m2m/workspaces/${workspaceSlug}/users?email=${encodeURIComponent(email)}`);
    return users.length > 0 ? users[0] : null;
  }

  /**
   * Get or create a direct message channel with a user.
   */
  async getDirectMessageChannel(workspaceSlug: string, userId: string): Promise<ScrymeChatChannel> {
    return this.request<ScrymeChatChannel>('POST', `/api/v2/m2m/workspaces/${workspaceSlug}/users/${userId}/dm`);
  }

  /**
   * Register a global webhook for interactive actions.
   */
  async registerGlobalWebhook(webhookUrl: string): Promise<any> {
     return this.request('POST', '/api/v2/m2m/webhooks', {
       url: webhookUrl,
       events: ['message.action']
     });
  }
}
