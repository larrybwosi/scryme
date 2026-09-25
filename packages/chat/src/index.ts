import { chat } from "./client";
import type { CustomMessage } from "@scryme/chat";

export {
  CustomMessageSchema,
  MessageNodeSchema,
  ConditionSchema,
  ValidationSchema,
  DataSourceSchema,
  CustomMessageThemeSchema,
  PredefinedCustomMessageTypeSchema,
  MessageActionSchema,
  createApprovalMessage,
  createReportMessage,
  createFormMessage,
  createTaskCardMessage,
  type CustomMessage,
  type MessageNode,
  type ConditionSchemaType,
  type ValidationSchemaType,
  type CustomMessageTheme,
  type PredefinedCustomMessageType,
  type MessageAction,
  type CreateApprovalMessageOptions,
  type CreateReportMessageOptions,
  type CreateFormMessageOptions,
  type CreateTaskCardMessageOptions,
  type FormFieldConfig,
} from "@scryme/chat";

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
  customMessage?: CustomMessage;
  metadata?: Record<string, any>;
}

export interface ScrymeChatAction {
  id: string;
  label: string;
  type: "button";
  style?: "primary" | "secondary" | "danger";
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
  type: "public" | "private" | "dm";
  name?: string;
}

export interface ProvisionWorkspaceOptions {
  ownerEmail?: string;
  ownerName?: string;
  ownerAvatar?: string;
  industry?: string;
  description?: string;
  channels?: string[];
  initialMembers?: {
    email: string;
    name?: string;
    avatar?: string;
    role?: "admin" | "member";
    externalId?: string;
  }[];
}

export interface ImportMemberOptions {
  members: {
    email: string;
    name?: string;
    avatar?: string;
    role?: "admin" | "member";
    externalId?: string;
  }[];
}

export class ScrymeChatApiClient {
  private channelCache = new Map<string, Map<string, string>>();

  /**
   * Helper to resolve channel slug to channelId
   */
  private async resolveChannelId(
    workspaceSlug: string,
    channelSlugOrId: string,
  ): Promise<string> {
    if (
      /^[a-f0-9-]{36}$/i.test(channelSlugOrId) ||
      channelSlugOrId.startsWith("ch_") ||
      channelSlugOrId.startsWith("channel_")
    ) {
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

      const cachedId =
        wsCache.get(channelSlugOrId) ||
        wsCache.get(channelSlugOrId.toLowerCase());
      if (cachedId) {
        return cachedId;
      }
    } catch (err: any) {
      console.error(
        `Failed to resolve channel ID for slug ${channelSlugOrId}:`,
        err.message,
      );
    }

    return channelSlugOrId;
  }

  /**
   * Provision a workspace in Scryme Chat using V3 M2M API.
   */
  async createWorkspace(
    name: string,
    slug: string,
    ownerEmailOrOptions?: string | ProvisionWorkspaceOptions,
    initialMembers?: { email: string; name?: string; role?: "admin" | "member" }[],
  ): Promise<ScrymeChatWorkspace> {
    const options: ProvisionWorkspaceOptions =
      typeof ownerEmailOrOptions === "object"
        ? ownerEmailOrOptions
        : {
            ownerEmail: ownerEmailOrOptions || "admin@scryme.tech",
            initialMembers,
          };

    const data: any = await (chat.m2m as any).workspace.provision({
      name,
      slug,
      ownerEmail: options.ownerEmail || "admin@scryme.tech",
      ownerName: options.ownerName,
      ownerAvatar: options.ownerAvatar,
      industry: options.industry,
      description: options.description,
      channels: options.channels,
      initialMembers: options.initialMembers,
    });

    const workspace = data?.data?.workspace || data?.workspace || data;
    return {
      id: workspace.id || workspace.slug || slug,
      name: workspace.name || name,
      slug: workspace.slug || slug,
    };
  }

  /**
   * Bulk import members into a workspace using V3 M2M API.
   */
  async importWorkspaceMembers(
    workspaceSlug: string,
    membersOrOptions: ImportMemberOptions | ImportMemberOptions["members"],
  ): Promise<any> {
    const payload: ImportMemberOptions = Array.isArray(membersOrOptions)
      ? { members: membersOrOptions }
      : membersOrOptions;

    return (chat.m2m as any).member.import(workspaceSlug, payload);
  }

  /**
   * Get workspace details using V3 API.
   */
  async getWorkspace(slug: string): Promise<ScrymeChatWorkspace> {
    const res: any = await chat.workspace.get(slug);
    const workspace = res?.data?.workspace || res?.workspace || res;
    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
    };
  }

  /**
   * Register a webhook for a specific workspace in V3 API.
   */
  async registerWorkspaceWebhook(
    workspaceSlug: string,
    webhookUrl: string,
    events: string[] = ["message.action"],
  ): Promise<any> {
    return chat.webhooks.create(workspaceSlug, {
      name: "Interactive Action Webhook",
      url: webhookUrl,
      events,
    });
  }

  /**
   * List channels in a workspace using V3 API.
   */
  async listChannels(workspaceSlug: string): Promise<ScrymeChatChannel[]> {
    return chat.workspace.channels.list(workspaceSlug);
  }

  /**
   * Create a new channel in a workspace using V3 API.
   */
  async createChannel(
    workspaceSlug: string,
    name: string,
    slug?: string,
    type: "public" | "private" = "public",
    allowedUserIds?: string[],
  ): Promise<ScrymeChatChannel> {
    const payload: any = {
      name,
      type,
      ...(allowedUserIds ? { allowedUserIds } : {}),
    };
    if (slug) {
      payload.slug = slug;
    }
    return chat.workspace.channels.create(workspaceSlug, payload);
  }

  /**
   * Update an existing channel (name, slug, type/visibility, members) using V3 API.
   */
  async updateChannel(
    workspaceSlug: string,
    channelId: string,
    data: {
      name?: string;
      slug?: string;
      type?: "public" | "private";
      allowedUserIds?: string[];
    },
  ): Promise<ScrymeChatChannel> {
    if (typeof (chat.workspace.channels as any).update === "function") {
      return (chat.workspace.channels as any).update(workspaceSlug, channelId, data);
    }
    if (typeof (chat as any).channel?.update === "function") {
      return (chat as any).channel.update(workspaceSlug, channelId, data);
    }
    return {
      id: channelId,
      slug: data.slug || channelId,
      type: data.type || "public",
      name: data.name,
    };
  }

  /**
   * Update channel member access/viewers for a private channel using V3 API.
   */
  async updateChannelMembers(
    workspaceSlug: string,
    channelId: string,
    memberUserIds: string[],
  ): Promise<any> {
    if (typeof (chat.workspace.channels as any).updateMembers === "function") {
      return (chat.workspace.channels as any).updateMembers(workspaceSlug, channelId, { userIds: memberUserIds });
    }
    return this.updateChannel(workspaceSlug, channelId, { allowedUserIds: memberUserIds });
  }

  /**
   * List members in a workspace using V3 API.
   */
  async listWorkspaceMembers(workspaceSlug: string): Promise<any[]> {
    try {
      const res: any = await chat.workspace.members.list(workspaceSlug);
      return res?.data?.members || res?.members || [];
    } catch {
      return [];
    }
  }

  /**
   * Add a member to a workspace using V3 API.
   */
  async addWorkspaceMember(
    workspaceSlug: string,
    email: string,
    role: "admin" | "member" = "member",
  ): Promise<any> {
    return chat.workspace.members.add(workspaceSlug, { email, role });
  }

  /**
   * Remove a member from a workspace using V3 API.
   */
  async removeWorkspaceMember(
    workspaceSlug: string,
    userId: string,
  ): Promise<any> {
    return chat.workspace.members.delete(workspaceSlug, userId);
  }

  /**
   * Legacy helper to add a user to the workspace (delegates to V3 workspace members API).
   */
  async addUserToChannel(
    workspaceSlug: string,
    channelSlugOrId: string,
    email: string,
  ): Promise<any> {
    return this.addWorkspaceMember(workspaceSlug, email, "member");
  }

  /**
   * Send a message to a Scryme Chat channel using V3 API.
   */
  async sendMessage(
    workspaceSlug: string,
    channelSlugOrId: string,
    message: ScrymeChatMessage,
  ): Promise<any> {
    const channelId = await this.resolveChannelId(
      workspaceSlug,
      channelSlugOrId,
    );
    const metadata = {
      ...(message.metadata || {}),
      ...(message.customMessage ? { customMessage: message.customMessage } : {}),
    };
    const payload: any = {
      content: message.content,
      attachments: message.attachments,
      actions: message.actions,
      threadId: message.threadId,
      ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
    };
    return chat.channel.message.create(workspaceSlug, channelId, payload);
  }

  /**
   * Update an existing message using V3 API.
   */
  async updateMessage(
    workspaceSlug: string,
    channelSlugOrId: string,
    messageId: string,
    message: ScrymeChatMessage,
  ): Promise<any> {
    const channelId = await this.resolveChannelId(
      workspaceSlug,
      channelSlugOrId,
    );
    const metadata = {
      ...(message.metadata || {}),
      ...(message.customMessage ? { customMessage: message.customMessage } : {}),
    };
    const payload: any = {
      content: message.content,
      actions: message.actions,
      attachments: message.attachments,
      ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
    };
    return chat.channel.message.update(workspaceSlug, channelId, messageId, payload);
  }

  /**
   * Find a user in the workspace by email.
   */
  async findUserByEmail(
    workspaceSlug: string,
    email: string,
  ): Promise<ScrymeChatUser | null> {
    const found = await chat.workspace.members.get(workspaceSlug, email);
    const member = found?.data?.member;
    if (member) {
      return {
        id: member.userId || member.user?.id || member.id,
        email: member.user?.email,
        name: member.user?.name,
      };
    }
    return null;
  }

  /**
   * Get or create a direct message channel with a user using V3 API.
   */
  async getDirectMessageChannel(
    workspaceSlug: string,
    userId: string,
  ): Promise<ScrymeChatChannel> {
    const dm = await chat.dm.create({ userId });
    return {
      id: dm.id,
      slug: dm.id,
      type: "dm",
    };
  }

  /**
   * Register a global webhook for interactive actions using V3 API.
   */
  async registerGlobalWebhook(webhookUrl: string): Promise<any> {
    try {
      const workspaces = await chat.workspace.list();
      for (const ws of workspaces.data.workspaces) {
        try {
          await this.registerWorkspaceWebhook(ws.slug, webhookUrl);
        } catch (err: any) {
          if (err.response?.status !== 409) {
            console.error(
              `Failed to register webhook for workspace ${ws.slug}:`,
              err.message,
            );
          }
        }
      }
    } catch (err: any) {
      console.error(
        "Failed to register webhooks across workspaces:",
        err.message,
      );
    }
  }
}
