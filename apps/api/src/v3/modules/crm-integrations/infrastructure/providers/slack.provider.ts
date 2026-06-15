import {Injectable, Logger} from "@nestjs/common";
import {OrganizationIntegration} from "@repo/db";
import {
  CommunicationMessage,
  CommunicationProvider,
} from "../../domain/communication-provider.interface";
import axios from "axios";
import {env} from "@repo/env";

@Injectable()
export class SlackProvider implements CommunicationProvider {
  private readonly logger = new Logger(SlackProvider.name);
  slug = "slack";

  private readonly clientId = env.SLACK_CLIENT_ID;
  private readonly clientSecret = env.SLACK_CLIENT_SECRET;
  private readonly redirectUri = env.SLACK_REDIRECT_URI;

  getAuthUrl(organizationId: string): string {
    const scopes =
      "chat:write,channels:history,groups:history,im:history,mpim:history,users:read,users:read.email";
    return `https://slack.com/oauth/v2/authorize?client_id=${this.clientId}&scope=${scopes}&redirect_uri=${this.redirectUri}&state=${organizationId}`;
  }

  async handleCallback(
    code: string,
  ): Promise<{credentials: any; settings?: any}> {
    const response = await axios.post(
      "https://slack.com/api/oauth.v2.access",
      null,
      {
        params: {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code,
          redirect_uri: this.redirectUri,
        },
      },
    );

    if (!response.data.ok) {
      throw new Error(`Slack OAuth failed: ${response.data.error}`);
    }

    return {
      credentials: {
        accessToken: response.data.access_token,
        botUserId: response.data.bot_user_id,
        teamId: response.data.team?.id,
        teamName: response.data.team?.name,
      },
      settings: {
        channelId: response.data.incoming_webhook?.channel_id,
      },
    };
  }

  async sendMessage(
    integration: OrganizationIntegration,
    message: {text: string; threadId?: string; channelId?: string},
  ): Promise<{externalId: string; threadId?: string}> {
    const credentials = integration.credentials as any;
    const accessToken = credentials.accessToken;

    const response = await axios.post(
      "https://slack.com/api/chat.postMessage",
      {
        channel: message.channelId,
        text: message.text,
        thread_ts: message.threadId,
      },
      {
        headers: {Authorization: `Bearer ${accessToken}`},
      },
    );

    if (!response.data.ok) {
      throw new Error(`Slack message failed: ${response.data.error}`);
    }

    return {
      externalId: response.data.ts,
      threadId: response.data.message.thread_ts || response.data.ts,
    };
  }

  async parseWebhookEvent(
    payload: any,
  ): Promise<CommunicationMessage[] | null> {
    if (payload.type === "url_verification") {
      return null;
    }

    if (
      payload.type !== "event_callback" ||
      payload.event?.type !== "message"
    ) {
      return null;
    }

    const event = payload.event;

    if (event.bot_id || event.subtype === "bot_message") {
      return null;
    }

    return [
      {
        text: event.text,
        externalId: event.ts,
        externalThreadId: event.thread_ts || event.ts,
        externalChannelId: event.channel,
        metadata: {
          slackUser: event.user,
          team: payload.team_id,
        },
      },
    ];
  }

  async getUserEmail(
    integration: OrganizationIntegration,
    slackUserId: string,
  ): Promise<string | undefined> {
    const credentials = integration.credentials as any;
    const accessToken = credentials.accessToken;

    try {
      const response = await axios.get("https://slack.com/api/users.info", {
        params: {user: slackUserId},
        headers: {Authorization: `Bearer ${accessToken}`},
      });

      if (response.data.ok) {
        return response.data.user?.profile?.email;
      }
    } catch (error) {
      this.logger.error(`Failed to fetch Slack user email: ${error.message}`);
    }
    return undefined;
  }
}
