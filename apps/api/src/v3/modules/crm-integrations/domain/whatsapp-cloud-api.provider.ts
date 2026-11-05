import { Injectable, Logger } from "@nestjs/common";
import { CommunicationProvider, CommunicationMessage, CommunicationStatusUpdate } from "./communication-provider.interface";
import axios from "axios";
import * as crypto from "crypto";

@Injectable()
export class WhatsappCloudApiProvider implements CommunicationProvider {
  public readonly slug = "whatsapp";
  private readonly logger = new Logger(WhatsappCloudApiProvider.name);

  getAuthUrl(organizationId: string): string {
    return "";
  }

  async handleCallback(code: string): Promise<{ credentials: any; settings?: any }> {
    return { credentials: { accessToken: code } };
  }

  /**
   * Cryptographically verify Meta Webhook payload using HMAC-SHA256 signature
   */
  verifyWebhookSignature(signatureHeader: string | undefined, rawPayload: string | Buffer, appSecret: string): boolean {
    if (!signatureHeader || !appSecret) {
      return false;
    }

    try {
      const parts = signatureHeader.split("sha256=");
      if (parts.length !== 2) return false;
      const signature = parts[1];

      const expected = crypto
        .createHmac("sha256", appSecret)
        .update(rawPayload)
        .digest("hex");

      return crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
    } catch (err: any) {
      this.logger.warn(`Signature verification failed: ${err.message}`);
      return false;
    }
  }

  async sendMessage(
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
  ): Promise<{ externalId: string; threadId?: string }> {
    const credentials = integration.credentials || {};
    const phoneNumberId = credentials.phoneNumberId;
    const accessToken = credentials.accessToken;

    if (!phoneNumberId || !accessToken) {
      throw new Error("WhatsApp Cloud API credentials (phoneNumberId, accessToken) are missing.");
    }

    const recipientPhone = message.threadId || message.channelId;
    if (!recipientPhone) {
      throw new Error("Recipient phone number is missing.");
    }

    const cleanPhone = recipientPhone.replace(/[^\d]/g, "");
    const url = `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`;

    const payload: any = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanPhone,
    };

    if (message.templateName) {
      payload.type = "template";
      payload.template = {
        name: message.templateName,
        language: { code: message.templateLanguage || "en_US" },
        components: message.components || [],
      };
    } else if (message.interactive) {
      payload.type = "interactive";
      payload.interactive = message.interactive;
    } else if (message.mediaType && message.mediaUrl) {
      payload.type = message.mediaType;
      payload[message.mediaType] = {
        link: message.mediaUrl,
        ...(message.mediaCaption ? { caption: message.mediaCaption } : {}),
        ...(message.mediaFilename ? { filename: message.mediaFilename } : {}),
      };
    } else {
      payload.type = "text";
      payload.text = { preview_url: false, body: message.text };
    }

    try {
      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      const messageId = response.data?.messages?.[0]?.id || `wamid.${Date.now()}`;
      return { externalId: messageId, threadId: recipientPhone };
    } catch (error: any) {
      this.logger.error("Failed to send WhatsApp message via Meta Cloud API", error?.response?.data || error?.message);
      throw new Error(`WhatsApp API error: ${JSON.stringify(error?.response?.data || error?.message)}`);
    }
  }

  async parseWebhookEvent(payload: any): Promise<CommunicationMessage[] | null> {
    if (!payload || payload.object !== "whatsapp_business_account") {
      return null;
    }

    const messagesList: CommunicationMessage[] = [];

    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== "messages") continue;
        const value = change.value;
        const metadata = value?.metadata;
        const phoneNumberId = metadata?.phone_number_id;
        const displayPhoneNumber = metadata?.display_phone_number;

        for (const msg of value?.messages || []) {
          const baseMetadata = {
            phoneNumberId,
            displayPhoneNumber,
            from: msg.from,
            timestamp: msg.timestamp,
            contactName: value?.contacts?.[0]?.profile?.name || msg.from,
          };

          if (msg.type === "text") {
            messagesList.push({
              text: msg.text?.body || "",
              externalId: msg.id,
              externalThreadId: msg.from,
              externalChannelId: phoneNumberId,
              senderEmail: `${msg.from}@whatsapp.com`,
              type: "text",
              metadata: baseMetadata,
            });
          } else if (msg.type === "image") {
            messagesList.push({
              text: msg.image?.caption || "[Image]",
              externalId: msg.id,
              externalThreadId: msg.from,
              externalChannelId: phoneNumberId,
              senderEmail: `${msg.from}@whatsapp.com`,
              type: "image",
              metadata: {
                ...baseMetadata,
                mediaType: "image",
                mediaId: msg.image?.id,
                mimeType: msg.image?.mime_type,
                sha256: msg.image?.sha256,
                caption: msg.image?.caption,
              },
            });
          } else if (msg.type === "document") {
            messagesList.push({
              text: msg.document?.caption || msg.document?.filename || "[Document]",
              externalId: msg.id,
              externalThreadId: msg.from,
              externalChannelId: phoneNumberId,
              senderEmail: `${msg.from}@whatsapp.com`,
              type: "document",
              metadata: {
                ...baseMetadata,
                mediaType: "document",
                mediaId: msg.document?.id,
                filename: msg.document?.filename,
                mimeType: msg.document?.mime_type,
                caption: msg.document?.caption,
              },
            });
          } else if (msg.type === "audio") {
            messagesList.push({
              text: "[Voice/Audio]",
              externalId: msg.id,
              externalThreadId: msg.from,
              externalChannelId: phoneNumberId,
              senderEmail: `${msg.from}@whatsapp.com`,
              type: "audio",
              metadata: {
                ...baseMetadata,
                mediaType: "audio",
                mediaId: msg.audio?.id,
                mimeType: msg.audio?.mime_type,
                voice: msg.audio?.voice,
              },
            });
          } else if (msg.type === "interactive") {
            const replyTitle =
              msg.interactive?.button_reply?.title ||
              msg.interactive?.list_reply?.title ||
              "[Interactive Response]";
            const replyId =
              msg.interactive?.button_reply?.id ||
              msg.interactive?.list_reply?.id;

            messagesList.push({
              text: replyTitle,
              externalId: msg.id,
              externalThreadId: msg.from,
              externalChannelId: phoneNumberId,
              senderEmail: `${msg.from}@whatsapp.com`,
              type: "interactive",
              metadata: {
                ...baseMetadata,
                interactiveType: msg.interactive?.type,
                replyId,
                replyTitle,
              },
            });
          } else if (msg.type === "location") {
            messagesList.push({
              text: msg.location?.name || `[Location: ${msg.location?.latitude}, ${msg.location?.longitude}]`,
              externalId: msg.id,
              externalThreadId: msg.from,
              externalChannelId: phoneNumberId,
              senderEmail: `${msg.from}@whatsapp.com`,
              type: "location",
              metadata: {
                ...baseMetadata,
                mediaType: "location",
                latitude: msg.location?.latitude,
                longitude: msg.location?.longitude,
                name: msg.location?.name,
                address: msg.location?.address,
              },
            });
          }
        }
      }
    }

    return messagesList;
  }

  async parseStatusUpdates(payload: any): Promise<CommunicationStatusUpdate[] | null> {
    if (!payload || payload.object !== "whatsapp_business_account") {
      return null;
    }

    const updates: CommunicationStatusUpdate[] = [];

    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== "messages") continue;
        const value = change.value;
        const phoneNumberId = value?.metadata?.phone_number_id;

        for (const status of value?.statuses || []) {
          let mappedStatus: "SENT" | "DELIVERED" | "READ" | "FAILED" = "SENT";
          if (status.status === "delivered") mappedStatus = "DELIVERED";
          else if (status.status === "read") mappedStatus = "READ";
          else if (status.status === "failed") mappedStatus = "FAILED";

          updates.push({
            externalId: status.id,
            status: mappedStatus,
            timestamp: status.timestamp ? parseInt(status.timestamp, 10) : undefined,
            recipientPhone: status.recipient_id,
            error: status.errors?.[0] || null,
            externalChannelId: phoneNumberId,
          });
        }
      }
    }

    return updates;
  }
}
