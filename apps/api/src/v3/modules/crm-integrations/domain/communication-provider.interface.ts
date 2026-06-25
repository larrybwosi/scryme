export interface CommunicationMessage {
  text: string;
  externalId: string;
  externalThreadId?: string;
  externalChannelId?: string;
  senderEmail?: string;
  metadata?: any;
}

export interface CommunicationProvider {
  slug: string;

  // OAuth2 methods
  getAuthUrl(organizationId: string): string;
  handleCallback(code: string): Promise<{ credentials: any; settings?: any }>;

  // Outbound
  sendMessage(
    integration: any,
    message: { text: string; threadId?: string; channelId?: string },
  ): Promise<{ externalId: string; threadId?: string }>;

  // Inbound Parsing
  parseWebhookEvent(payload: any): Promise<CommunicationMessage[] | null>;
}
