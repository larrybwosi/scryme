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
  name?: string;
}

export class ScrymeChatApiClient {
  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiresAt: number | null = null;
  private authPromise: Promise<void> | null = null;
  private channelCache = new Map<string, Map<string, string>>();

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
   * Helper to resolve channel slug to channelId
   */
  private async resolveChannelId(workspaceSlug: string, channelSlugOrId: string): Promise<string> {
    if (/^[a-f0-9-]{36}$/i.test(channelSlugOrId) || channelSlugOrId.startsWith('ch_') || channelSlugOrId.startsWith('channel_')) {
      return channelSlugOrId;
    }

    let wsCache = this.channelCache.get(workspaceSlug);
    if (wsCache && wsCache.has(channelSlugOrId)) {
      return wsCache.get(channelSlugOrId)!;
    }

    try {
      const channels = await this.listChannels(workspaceSlug);
      if (!wsCache) {
        wsCache = new Map<string, string>();
        this.channelCache.set(workspaceSlug, wsCache);
      }
      for (const ch of channels) {
        wsCache.set(ch.slug, ch.id);
        wsCache.set(ch.id, ch.id);
        if (ch.name) {
          wsCache.set(ch.name.toLowerCase(), ch.id);
        }
      }

      const cachedId = wsCache.get(channelSlugOrId) || wsCache.get(channelSlugOrId.toLowerCase());
      if (cachedId) {
        return cachedId;
      }
    } catch (err: any) {
      console.error(`Failed to resolve channel ID for slug ${channelSlugOrId}:`, err.message);
    }

    return channelSlugOrId;
  }

  /**
   * Create a new workspace in Scryme Chat.
   */
  async createWorkspace(name: string, slug: string): Promise<ScrymeChatWorkspace> {
    return this.request<ScrymeChatWorkspace>('POST', '/api/workspaces', {
      name,
      slug,
    });
  }

  /**
   * Get workspace details.
   */
  async getWorkspace(slug: string): Promise<ScrymeChatWorkspace> {
    return this.request<ScrymeChatWorkspace>('GET', `/api/workspaces/${slug}`);
  }

  /**
   * List channels in a workspace.
   */
  async listChannels(workspaceSlug: string): Promise<ScrymeChatChannel[]> {
    return this.request<ScrymeChatChannel[]>('GET', `/api/v2/workspaces/${workspaceSlug}/channels`);
  }

  /**
   * Create a new channel in a workspace.
   */
  async createChannel(
    workspaceSlug: string,
    name: string,
    slug?: string,
    type: 'public' | 'private' = 'public'
  ): Promise<ScrymeChatChannel> {
    return this.request<ScrymeChatChannel>('POST', `/api/v2/workspaces/${workspaceSlug}/channels`, {
      name,
      type,
    });
  }

  /**
   * Add a user to a channel (workspace).
   */
  async addUserToChannel(
    workspaceSlug: string,
    channelSlugOrId: string,
    email: string
  ): Promise<any> {
    return this.request('POST', `/api/v2/workspaces/${workspaceSlug}/members`, {
      email,
      role: 'member',
    });
  }

  /**
   * Send a message to a Scryme Chat channel.
   */
  async sendMessage(workspaceSlug: string, channelSlugOrId: string, message: ScrymeChatMessage): Promise<any> {
    const channelId = await this.resolveChannelId(workspaceSlug, channelSlugOrId);
    return this.request('POST', `/api/v2/workspaces/${workspaceSlug}/messages`, {
      channelId,
      content: message.content,
      attachments: message.attachments,
      actions: message.actions,
      threadId: message.threadId,
    });
  }

  /**
   * Update an existing message.
   */
  async updateMessage(workspaceSlug: string, channelSlugOrId: string, messageId: string, message: ScrymeChatMessage): Promise<any> {
    const channelId = await this.resolveChannelId(workspaceSlug, channelSlugOrId);
    return this.request('PATCH', `/api/workspaces/${workspaceSlug}/channels/${channelId}/messages/${messageId}`, {
      content: message.content,
      actions: message.actions,
      attachments: message.attachments,
    });
  }

  /**
   * Find a user in the workspace by email.
   */
  async findUserByEmail(workspaceSlug: string, email: string): Promise<ScrymeChatUser | null> {
    const members = await this.request<any[]>('GET', `/api/v2/workspaces/${workspaceSlug}/search/members?q=${encodeURIComponent(email)}`);
    const found = members.find(m => m.email === email || m.user?.email === email);
    if (found) {
      return {
        id: found.userId || found.user?.id || found.id,
        email: found.email || found.user?.email,
        name: found.name || found.user?.name,
      };
    }
    return null;
  }

  /**
   * Get or create a direct message channel with a user.
   */
  async getDirectMessageChannel(workspaceSlug: string, userId: string): Promise<ScrymeChatChannel> {
    const dm = await this.request<any>('POST', '/api/dms', {
      userId,
    });
    return {
      id: dm.id,
      slug: dm.id,
      type: 'dm',
    };
  }

  /**
   * Register a webhook for a specific workspace.
   */
  async registerWorkspaceWebhook(workspaceSlug: string, webhookUrl: string): Promise<any> {
    return this.request('POST', `/api/v2/workspaces/${workspaceSlug}/webhooks`, {
      name: 'Dealio Integration Webhook',
      url: webhookUrl,
      events: ['message.action'],
    });
  }

  /**
   * Register a global webhook for interactive actions.
   */
  async registerGlobalWebhook(webhookUrl: string): Promise<any> {
    await this.ensureAuthenticated();
    try {
      const workspaces = await this.request<any[]>('GET', '/api/workspaces');
      for (const ws of workspaces) {
        try {
          await this.registerWorkspaceWebhook(ws.slug, webhookUrl);
        } catch (err: any) {
          if (err.response?.status !== 409) {
            console.error(`Failed to register webhook for workspace ${ws.slug}:`, err.message);
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to register webhooks across workspaces:', err.message);
    }
  }
}
