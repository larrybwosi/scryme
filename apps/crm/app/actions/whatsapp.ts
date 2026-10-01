"use server";

import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export interface WhatsappConfigData {
  phoneNumberId: string;
  accessToken: string;
  wabaId?: string;
  displayPhoneNumber?: string;
}

export interface SendWhatsappMessageInput {
  recipientPhone: string;
  text: string;
  templateName?: string;
  templateLanguage?: string;
  components?: any[];
  crmRecordId?: string;
}

/**
 * Get WhatsApp integration configuration for current organization.
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

    return {
      success: true,
      data: {
        isConnected: !!integration?.isActive,
        credentials: (integration?.credentials as unknown as WhatsappConfigData) || null,
        syncStatus: integration?.syncStatus || "DISCONNECTED",
      },
    };
  } catch (error: any) {
    console.error("Error fetching WhatsApp config:", error);
    return {
      success: false,
      error: error?.message || "Failed to fetch WhatsApp configuration",
      data: {
        isConnected: false,
        credentials: null,
        syncStatus: "DISCONNECTED",
      },
    };
  }
}

/**
 * Save Meta WhatsApp Business Cloud API credentials.
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
        name: "WhatsApp",
        slug: "whatsapp",
        category: "COMMUNICATION",
        authType: "API_KEY",
        description: "Meta WhatsApp Business Cloud API Integration",
      },
      update: {},
    });

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
        credentials: JSON.parse(JSON.stringify(data)),
        syncStatus: "CONNECTED",
        lastSyncAt: new Date(),
      },
      update: {
        isActive: true,
        credentials: JSON.parse(JSON.stringify(data)),
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
 * Send WhatsApp text or template message via Meta Cloud API and record message in DB.
 */
export async function sendWhatsappMessage(data: SendWhatsappMessageInput) {
  const auth = await getServerAuth();
  if (!auth?.organizationId) redirect("/login");
  const organizationId = auth.organizationId;
  const memberId = auth.memberId;

  if (!data.recipientPhone || (!data.text && !data.templateName)) {
    return { success: false, error: "Recipient phone and message text or template are required." };
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

    const message = await db.communicationMessage.create({
      data: {
        threadId: thread.id,
        organizationId,
        direction: "OUTBOUND",
        content: data.text,
        status: "SENT",
        externalId: externalId || undefined,
        senderMemberId: memberId || undefined,
        metadata: {
          templateName: data.templateName,
          components: data.components,
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

    for (const tpl of templates) {
      await db.whatsappTemplate.upsert({
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
      });
    }

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
