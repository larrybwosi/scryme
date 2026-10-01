import { Injectable, Logger } from "@nestjs/common";
import { CommunicationProvider, CommunicationMessage } from "./communication-provider.interface";
import axios from "axios";

@Injectable()
export class WhatsappCloudApiProvider implements CommunicationProvider {
  public readonly slug = "whatsapp";
  private readonly logger = new Logger(WhatsappCloudApiProvider.name);

  getAuthUrl(organizationId: string): string {
    // Return empty or embedded signup token URL template if needed
    return "";
  }

  async handleCallback(code: string): Promise<{ credentials: any; settings?: any }> {
    return { credentials: { accessToken: code } };
  }

  async sendMessage(
    integration: any,
    message: { text: string; threadId?: string; channelId?: string; templateName?: string; templateLanguage?: string; components?: any[] },
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

    let payload: any;
    if (message.templateName) {
      payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanPhone,
        type: "template",
        template: {
          name: message.templateName,
          language: { code: message.templateLanguage || "en_US" },
          components: message.components || [],
        },
      };
    } else {
      payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanPhone,
        type: "text",
        text: { preview_url: false, body: message.text },
      };
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
          if (msg.type === "text") {
            messagesList.push({
              text: msg.text?.body || "",
              externalId: msg.id,
              externalThreadId: msg.from,
              externalChannelId: phoneNumberId,
              senderEmail: `${msg.from}@whatsapp.com`,
              metadata: {
                phoneNumberId,
                displayPhoneNumber,
                from: msg.from,
                timestamp: msg.timestamp,
                contactName: value?.contacts?.[0]?.profile?.name || msg.from,
              },
            });
          }
        }
      }
    }

    return messagesList;
  }
}
