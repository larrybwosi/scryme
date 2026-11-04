"use server";

import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export interface WhatsappConfigData {
  phoneNumberId: string;
  accessToken: string;
  wabaId?: string;
  appSecret?: string;
  verifyToken?: string;
  displayPhoneNumber?: string;
  enableWelcomeReply?: boolean;
  welcomeMessage?: string;
  enableOutOfOfficeReply?: boolean;
  outOfOfficeMessage?: string;
}

export interface SendWhatsappMessageInput {
  recipientPhone: string;
  text?: string;
  templateName?: string;
  templateLanguage?: string;
  components?: any[];
  mediaType?: "image" | "document" | "audio";
  mediaUrl?: string;
  mediaCaption?: string;
  mediaFilename?: string;
  interactive?: any;
  crmRecordId?: string;
}

export interface SendPaymentReceiptInput {
  recipientPhone: string;
  transactionId: string;
  amount: number;
  currency?: string;
  receiptUrl?: string;
}

export interface SendDeliveryStatusInput {
  recipientPhone: string;
  trackingNumber: string;
  status: string;
  estimatedDate?: string;
}

/**
 * Fetch WhatsApp Integration Configuration & Webhook Setup Details.
 */
export async function getWhatsappConfig() {
  const auth = await getServerAuth();
  if (!auth?.organizationId) redirect("/login");
  const organizationId = auth.organizationId;

  try {
    const integration = await db.organizationIntegration.findFirst({
      where: {
        organizationId,
        integrationDefinition: { slug: "whatsapp" },
      },
    });

    const credentials = (integration?.credentials as unknown as WhatsappConfigData) || null;
    const settings = (integration?.settings as any) || {};

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.API_BASE_URL || "https://api.scryme.tech";
    const webhookCallbackUrl = `${baseUrl.replace(/\/+$/, "")}/webhooks/whatsapp`;
    const defaultVerifyToken = credentials?.verifyToken || `scryme_wa_${organizationId.slice(-8)}`;

    return {
      success: true,
      data: {
        isConnected: !!integration?.isActive,
        credentials: credentials
          ? {
              ...credentials,
              verifyToken: credentials.verifyToken || defaultVerifyToken,
            }
          : null,
        settings: {
          enableWelcomeReply: settings.enableWelcomeReply ?? false,
          welcomeMessage: settings.welcomeMessage ?? "Hello! Thank you for contacting us. We will assist you shortly.",
          enableOutOfOfficeReply: settings.enableOutOfOfficeReply ?? false,
          outOfOfficeMessage: settings.outOfOfficeMessage ?? "Thank you for reaching out. We are currently out of the office and will respond soon.",
        },
        webhookCallbackUrl,
        verifyToken: credentials?.verifyToken || defaultVerifyToken,
        syncStatus: integration?.syncStatus || "DISCONNECTED",
        lastSyncAt: integration?.lastSyncAt || null,
      },
    };
  } catch (error: any) {
    console.error("Error fetching WhatsApp config:", error);
    return { success: false, error: error?.message || "Failed to fetch WhatsApp configuration" };
  }
}

/**
 * Save WhatsApp Cloud API Credentials, Secret, and Autoreply Settings.
 */
export async function saveWhatsappConfig(data: WhatsappConfigData) {
  const auth = await getServerAuth();
  if (!auth?.organizationId) redirect("/login");
  const organizationId = auth.organizationId;

  if (!data.phoneNumberId || !data.accessToken) {
    return { success: false, error: "Phone Number ID and Access Token are required." };
  }

  try {
    const definition = await db.integrationDefinition.upsert({
      where: { slug: "whatsapp" },
      create: {
        name: "WhatsApp Cloud API",
        slug: "whatsapp",
        category: "COMMUNICATION",
        description: "Official Meta WhatsApp Business Cloud API integration",
        authType: "API_KEY",
        isActive: true,
      },
      update: {},
    });

    const credentials = {
      phoneNumberId: data.phoneNumberId,
      accessToken: data.accessToken,
      wabaId: data.wabaId || undefined,
      appSecret: data.appSecret || undefined,
      verifyToken: data.verifyToken || `scryme_wa_${organizationId.slice(-8)}`,
      displayPhoneNumber: data.displayPhoneNumber || undefined,
    };

    const settings = {
      enableWelcomeReply: data.enableWelcomeReply ?? false,
      welcomeMessage: data.welcomeMessage ?? "Hello! Thank you for contacting us. We will assist you shortly.",
      enableOutOfOfficeReply: data.enableOutOfOfficeReply ?? false,
      outOfOfficeMessage: data.outOfOfficeMessage ?? "Thank you for reaching out. We are currently out of the office and will respond soon.",
    };

    await db.organizationIntegration.upsert({
      where: {
        organizationId_integrationDefinitionId: {
          organizationId,
          integrationDefinitionId: definition.id,
        },
      },
      create: {
        organizationId,
        integrationDefinitionId: definition.id,
        isActive: true,
        credentials: JSON.parse(JSON.stringify(credentials)),
        settings: JSON.parse(JSON.stringify(settings)),
        syncStatus: "CONNECTED",
        lastSyncAt: new Date(),
      },
      update: {
        isActive: true,
        credentials: JSON.parse(JSON.stringify(credentials)),
        settings: JSON.parse(JSON.stringify(settings)),
        syncStatus: "CONNECTED",
        lastSyncAt: new Date(),
      },
    });

    revalidatePath("/settings/integrations/whatsapp");
    return { success: true };
  } catch (error: any) {
    console.error("Error saving WhatsApp config:", error);
    return { success: false, error: error?.message || "Failed to save WhatsApp configuration." };
  }
}

/**
 * List communication threads for active organization.
 */
export async function getCommunicationThreads() {
  const auth = await getServerAuth();
  if (!auth?.organizationId) redirect("/login");
  const organizationId = auth.organizationId;

  try {
    const threads = await db.communicationThread.findMany({
      where: { organizationId },
      orderBy: { lastMessageAt: "desc" },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
        crmRecord: true,
      },
    });

    return { success: true, data: threads };
  } catch (error: any) {
    console.error("Error fetching communication threads:", error);
    return { success: false, error: error?.message || "Failed to fetch communication threads", data: [] };
  }
}

/**
 * Get messages in a specific communication thread and reset unread count.
 */
export async function getThreadMessages(threadId: string) {
  const auth = await getServerAuth();
  if (!auth?.organizationId) redirect("/login");
  const organizationId = auth.organizationId;

  try {
    await db.communicationThread.updateMany({
      where: { id: threadId, organizationId, unreadCount: { gt: 0 } },
      data: { unreadCount: 0 },
    });

    const messages = await db.communicationMessage.findMany({
      where: { threadId, organizationId },
      orderBy: { createdAt: "asc" },
      include: {
        senderMember: {
          select: {
            id: true,
            user: { select: { name: true, email: true } },
          },
        },
      },
    });

    return { success: true, data: messages };
  } catch (error: any) {
    console.error("Error fetching thread messages:", error);
    return { success: false, error: error?.message || "Failed to fetch thread messages", data: [] };
  }
}

/**
 * Send WhatsApp text, template, media, or interactive message via Meta Cloud API and record message in DB.
 */
export async function sendWhatsappMessage(data: SendWhatsappMessageInput) {
  const auth = await getServerAuth();
  if (!auth?.organizationId) redirect("/login");
  const organizationId = auth.organizationId;
  const memberId = auth.memberId;

  if (!data.recipientPhone || (!data.text && !data.templateName && !data.mediaUrl && !data.interactive)) {
    return { success: false, error: "Recipient phone and message text, template, media, or interactive content are required." };
  }

  const cleanPhone = data.recipientPhone.replace(/[^\d]/g, "");

  try {
    const integration = await db.organizationIntegration.findFirst({
      where: {
        organizationId,
        integrationDefinition: { slug: "whatsapp" },
        isActive: true,
      },
    });

    let externalId: string | undefined;

    if (integration?.credentials) {
      const creds = integration.credentials as unknown as WhatsappConfigData;
      if (creds.phoneNumberId && creds.accessToken) {
        let payload: any = {
          messaging_product: "whatsapp",
          to: cleanPhone,
        };

        if (data.templateName) {
          payload.type = "template";
          payload.template = {
            name: data.templateName,
            language: { code: data.templateLanguage || "en_US" },
            ...(data.components ? { components: data.components } : {}),
          };
        } else if (data.interactive) {
          payload.type = "interactive";
          payload.interactive = data.interactive;
        } else if (data.mediaType && data.mediaUrl) {
          payload.type = data.mediaType;
          payload[data.mediaType] = {
            link: data.mediaUrl,
            ...(data.mediaCaption ? { caption: data.mediaCaption } : {}),
            ...(data.mediaFilename ? { filename: data.mediaFilename } : {}),
          };
        } else {
          payload.type = "text";
          payload.text = { body: data.text };
        }

        const metaRes = await fetch(
          `https://graph.facebook.com/v23.0/${creds.phoneNumberId}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${creds.accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );

        if (metaRes.ok) {
          const metaData = await metaRes.json();
          externalId = metaData.messages?.[0]?.id;
        } else {
          const errData = await metaRes.json().catch(() => null);
          console.warn("Meta WhatsApp API error:", errData);
        }
      }
    }

    let crmRecordId = data.crmRecordId;
    if (!crmRecordId) {
      const existingThread = await db.communicationThread.findFirst({
        where: { organizationId, channel: "WHATSAPP", participantPhone: cleanPhone },
      });
      crmRecordId = existingThread?.crmRecordId || undefined;
    }

    const thread = await db.communicationThread.upsert({
      where: {
        organizationId_channel_participantPhone: {
          organizationId,
          channel: "WHATSAPP",
          participantPhone: cleanPhone,
        },
      },
      create: {
        organizationId,
        channel: "WHATSAPP",
        participantPhone: cleanPhone,
        crmRecordId,
        lastMessageAt: new Date(),
      },
      update: {
        lastMessageAt: new Date(),
        ...(crmRecordId ? { crmRecordId } : {}),
      },
    });

    const displayContent =
      data.text ||
      (data.mediaCaption ? `[${data.mediaType?.toUpperCase()}] ${data.mediaCaption}` : `[${data.mediaType?.toUpperCase() || (data.templateName ? "TEMPLATE" : "MESSAGE")}]`);

    const message = await db.communicationMessage.create({
      data: {
        threadId: thread.id,
        organizationId,
        direction: "OUTBOUND",
        content: displayContent,
        status: "SENT",
        externalId: externalId || undefined,
        senderMemberId: memberId || undefined,
        metadata: {
          templateName: data.templateName,
          components: data.components,
          mediaType: data.mediaType,
          mediaUrl: data.mediaUrl,
          mediaFilename: data.mediaFilename,
          interactive: data.interactive,
        },
      },
    });

    revalidatePath("/communications");
    return { success: true, data: { thread, message } };
  } catch (error: any) {
    console.error("Error sending WhatsApp message:", error);
    return { success: false, error: error?.message || "Failed to send WhatsApp message" };
  }
}

/**
 * Send Payment Receipt Notification via WhatsApp.
 */
export async function sendPaymentReceiptNotificationAction(data: SendPaymentReceiptInput) {
  const auth = await getServerAuth();
  if (!auth?.organizationId) redirect("/login");

  const receiptSuffix = data.receiptUrl ? ` View your receipt here: ${data.receiptUrl}` : "";
  const text = `Payment Confirmed! We received your payment of ${data.currency || "USD"} ${data.amount} (Ref: ${data.transactionId}). Thank you!${receiptSuffix}`;

  return sendWhatsappMessage({
    recipientPhone: data.recipientPhone,
    text,
    templateName: "payment_receipt",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: data.transactionId },
          { type: "text", text: `${data.currency || "USD"} ${data.amount}` },
        ],
      },
    ],
  });
}

/**
 * Send Delivery / Fulfillment Status Notification via WhatsApp.
 */
export async function sendDeliveryStatusNotificationAction(data: SendDeliveryStatusInput) {
  const auth = await getServerAuth();
  if (!auth?.organizationId) redirect("/login");

  const dateSuffix = data.estimatedDate ? ` Estimated delivery: ${data.estimatedDate}.` : "";
  const text = `Delivery Update: Package #${data.trackingNumber} status is now: ${data.status}.${dateSuffix}`;

  return sendWhatsappMessage({
    recipientPhone: data.recipientPhone,
    text,
    templateName: "delivery_status_update",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: data.trackingNumber },
          { type: "text", text: data.status },
        ],
      },
    ],
  });
}

/**
 * Sync message templates from Meta WhatsApp Business Cloud API.
 */
export async function syncWhatsappTemplates() {
  const auth = await getServerAuth();
  if (!auth?.organizationId) redirect("/login");
  const organizationId = auth.organizationId;

  try {
    const integration = await db.organizationIntegration.findFirst({
      where: {
        organizationId,
        integrationDefinition: { slug: "whatsapp" },
        isActive: true,
      },
    });

    if (!integration || !integration.credentials) {
      return { success: false, error: "WhatsApp integration is not active or missing credentials" };
    }

    const { phoneNumberId, accessToken, wabaId } = (integration.credentials as unknown as WhatsappConfigData) || {};
    const businessAccountId = wabaId || phoneNumberId;

    if (!accessToken || !businessAccountId) {
      return { success: false, error: "WhatsApp access token or WABA ID missing" };
    }

    const metaRes = await fetch(
      `https://graph.facebook.com/v23.0/${businessAccountId}/message_templates`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!metaRes.ok) {
      const errData = await metaRes.json().catch(() => null);
      return { success: false, error: `Template sync failed: ${JSON.stringify(errData)}` };
    }

    const data = await metaRes.json();
    const templates = data.data || [];

    await Promise.all(
      templates.map((tpl: any) =>
        db.whatsappTemplate.upsert({
          where: {
            organizationId_name_language: {
              organizationId,
              name: tpl.name,
              language: tpl.language || "en_US",
            },
          },
          create: {
            organizationId,
            name: tpl.name,
            category: tpl.category || "UTILITY",
            language: tpl.language || "en_US",
            status: tpl.status || "APPROVED",
            components: tpl.components || [],
          },
          update: {
            category: tpl.category || "UTILITY",
            status: tpl.status || "APPROVED",
            components: tpl.components || [],
          },
        }),
      ),
    );

    const savedTemplates = await db.whatsappTemplate.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
    });

    revalidatePath("/communications");
    revalidatePath("/settings/integrations/whatsapp");
    return { success: true, data: savedTemplates };
  } catch (error: any) {
    console.error("Error syncing WhatsApp templates:", error);
    return { success: false, error: error?.message || "Failed to sync WhatsApp templates" };
  }
}

/**
 * List synced WhatsApp templates.
 */
export async function getWhatsappTemplates() {
  const auth = await getServerAuth();
  if (!auth?.organizationId) redirect("/login");
  const organizationId = auth.organizationId;

  try {
    const templates = await db.whatsappTemplate.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
    });

    return { success: true, data: templates };
  } catch (error: any) {
    console.error("Error fetching WhatsApp templates:", error);
    return { success: false, error: error?.message || "Failed to fetch WhatsApp templates", data: [] };
  }
}
