export interface CommunicationMessage {
  text: string;
  externalId: string;
  externalThreadId?: string;
  externalChannelId?: string;
  senderEmail?: string;
  direction?: "INBOUND" | "OUTBOUND";
  type?: "text" | "image" | "document" | "audio" | "location" | "interactive";
  metadata?: any;
}

export interface CommunicationStatusUpdate {
  externalId: string;
  status: "SENT" | "DELIVERED" | "READ" | "FAILED";
  timestamp?: number;
  recipientPhone?: string;
  error?: any;
  externalChannelId?: string;
}

export interface CommunicationProvider {
  slug: string;

  // OAuth2 methods
  getAuthUrl(organizationId: string): string;
  handleCallback(code: string): Promise<{ credentials: any; settings?: any }>;

  // Outbound
  sendMessage(
    integration: any,
    message: {
      text: string;
      threadId?: string;
      channelId?: string;
      templateName?: string;
      templateLanguage?: string;
      components?: any[];
      mediaType?: "image" | "document" | "audio";
      mediaUrl?: string;
      mediaCaption?: string;
      mediaFilename?: string;
      interactive?: any;
    },
  ): Promise<{ externalId: string; threadId?: string }>;

  // Inbound Parsing
  parseWebhookEvent(payload: any): Promise<CommunicationMessage[] | null>;
  parseStatusUpdates?(payload: any): Promise<CommunicationStatusUpdate[] | null>;
}
