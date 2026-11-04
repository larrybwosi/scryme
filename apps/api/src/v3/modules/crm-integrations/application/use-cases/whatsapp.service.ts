import { Injectable, Logger, BadRequestException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { WhatsappCloudApiProvider } from "../../domain/whatsapp-cloud-api.provider";
import axios from "axios";

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly provider: WhatsappCloudApiProvider,
  ) {}

  async getIntegration(organizationId: string) {
    const definition = await this.prisma.client.integrationDefinition.findUnique({
      where: { slug: "whatsapp" },
    });
    if (!definition) return null;

    return this.prisma.client.organizationIntegration.findUnique({
      where: {
        organizationId_integrationDefinitionId: {
          organizationId,
          integrationDefinitionId: definition.id,
        },
      },
    });
  }

  async saveCredentials(
    organizationId: string,
    data: {
      phoneNumberId: string;
      accessToken: string;
      verifyToken?: string;
      appSecret?: string;
      displayPhoneNumber?: string;
      wabaId?: string;
      enableWelcomeReply?: boolean;
      welcomeMessage?: string;
      enableOutOfOfficeReply?: boolean;
      outOfOfficeMessage?: string;
    },
  ) {
    const definition = await this.prisma.client.integrationDefinition.upsert({
      where: { slug: "whatsapp" },
      create: {
        name: "WhatsApp Cloud API",
        slug: "whatsapp",
        category: "COMMUNICATION",
        description: "Official Meta WhatsApp Business Cloud API integration",
        authType: "API_KEY" as any,
        isActive: true,
      },
      update: {},
    });

    const credentials = {
      phoneNumberId: data.phoneNumberId,
      accessToken: data.accessToken,
      verifyToken: data.verifyToken || undefined,
      appSecret: data.appSecret || undefined,
      displayPhoneNumber: data.displayPhoneNumber || undefined,
      wabaId: data.wabaId || undefined,
    };

    const settings = {
      enableWelcomeReply: data.enableWelcomeReply ?? false,
      welcomeMessage: data.welcomeMessage ?? "Thank you for reaching out! We received your message and will get back to you shortly.",
      enableOutOfOfficeReply: data.enableOutOfOfficeReply ?? false,
      outOfOfficeMessage: data.outOfOfficeMessage ?? "We are currently out of office. We will attend to your inquiry as soon as we open.",
    };

    return this.prisma.client.organizationIntegration.upsert({
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
        credentials,
        settings,
        syncStatus: "CONNECTED",
        lastSyncAt: new Date(),
      },
      update: {
        isActive: true,
        credentials,
        settings,
        syncStatus: "CONNECTED",
        lastSyncAt: new Date(),
      },
    });
  }

  async verifyWebhookToken(token: string): Promise<boolean> {
    if (!token) return false;
    // Check if any active organization configured this verify token
    const integration = await this.prisma.client.organizationIntegration.findFirst({
      where: {
        integrationDefinition: { slug: "whatsapp" },
        isActive: true,
        credentials: { path: ["verifyToken"], equals: token },
      },
    });
    return !!integration;
  }

  async sendMessage(
    organizationId: string,
    memberId: string | undefined,
    payload: {
      recipientPhone: string;
      text: string;
      templateName?: string;
      templateLanguage?: string;
      components?: any[];
      mediaType?: "image" | "document" | "audio";
      mediaUrl?: string;
      mediaCaption?: string;
      mediaFilename?: string;
      interactive?: any;
      crmRecordId?: string;
    },
  ) {
    const integration = await this.getIntegration(organizationId);
    if (!integration || !integration.isActive) {
      throw new BadRequestException("WhatsApp integration is not active or configured for this organization.");
    }

    const cleanPhone = payload.recipientPhone.replace(/[^\d]/g, "");

    const sendRes = await this.provider.sendMessage(integration, {
      text: payload.text,
      threadId: cleanPhone,
      templateName: payload.templateName,
      templateLanguage: payload.templateLanguage,
      components: payload.components,
      mediaType: payload.mediaType,
      mediaUrl: payload.mediaUrl,
      mediaCaption: payload.mediaCaption,
      mediaFilename: payload.mediaFilename,
      interactive: payload.interactive,
    });

    let crmRecordId = payload.crmRecordId;
    if (!crmRecordId) {
      const existingThread = await this.prisma.client.communicationThread.findFirst({
        where: { organizationId, channel: "WHATSAPP", participantPhone: cleanPhone },
      });
      crmRecordId = existingThread?.crmRecordId || undefined;
    }

    const thread = await this.prisma.client.communicationThread.upsert({
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

    const message = await this.prisma.client.communicationMessage.create({
      data: {
        threadId: thread.id,
        organizationId,
        direction: "OUTBOUND",
        content: payload.text || (payload.mediaCaption ? `[${payload.mediaType}] ${payload.mediaCaption}` : `[${payload.mediaType || "TEMPLATE"}]`),
        status: "SENT",
        externalId: sendRes.externalId,
        senderMemberId: memberId || undefined,
        metadata: {
          templateName: payload.templateName,
          components: payload.components,
          mediaType: payload.mediaType,
          mediaUrl: payload.mediaUrl,
          mediaFilename: payload.mediaFilename,
          interactive: payload.interactive,
        },
      },
    });

    return { thread, message };
  }

  async listThreads(organizationId: string) {
    return this.prisma.client.communicationThread.findMany({
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
  }

  async getThreadMessages(organizationId: string, threadId: string) {
    await this.prisma.client.communicationThread.updateMany({
      where: { id: threadId, organizationId, unreadCount: { gt: 0 } },
      data: { unreadCount: 0 },
    });

    return this.prisma.client.communicationMessage.findMany({
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
  }

  async processIncomingWebhook(payload: any, signatureHeader?: string, rawBody?: string | Buffer) {
    const messages = await this.provider.parseWebhookEvent(payload);
    const statuses = this.provider.parseStatusUpdates ? await this.provider.parseStatusUpdates(payload) : null;

    const integrationCache = new Map<string, any>();

    const getCachedIntegration = async (phoneNumberId: string) => {
      if (!integrationCache.has(phoneNumberId)) {
        const found = await this.prisma.client.organizationIntegration.findFirst({
          where: {
            integrationDefinition: { slug: "whatsapp" },
            isActive: true,
            credentials: { path: ["phoneNumberId"], equals: phoneNumberId },
          },
        });
        integrationCache.set(phoneNumberId, found || null);
      }
      return integrationCache.get(phoneNumberId);
    };

    // 1. Process Status Updates (sent, delivered, read, failed)
    if (statuses && statuses.length > 0) {
      for (const st of statuses) {
        if (!st.externalId) continue;
        const msg = await this.prisma.client.communicationMessage.findFirst({
          where: { externalId: st.externalId },
        });

        if (msg) {
          const updatedMetadata = {
            ...((msg.metadata as object) || {}),
            deliveryStatus: st.status,
            statusTimestamp: st.timestamp,
            ...(st.error ? { error: st.error } : {}),
          };

          await this.prisma.client.communicationMessage.update({
            where: { id: msg.id },
            data: {
              status: st.status,
              metadata: updatedMetadata,
            },
          });
        }
      }
    }

    // 2. Process Incoming Messages
    if (messages && messages.length > 0) {
      for (const msg of messages) {
        const phoneNumberId = msg.metadata?.phoneNumberId;
        if (!phoneNumberId) continue;

        const integration = await getCachedIntegration(phoneNumberId);
        if (!integration) {
          this.logger.warn(`No active organization found for WhatsApp phoneNumberId: ${phoneNumberId}`);
          continue;
        }

        // Validate HMAC signature if appSecret is configured
        const appSecret = (integration.credentials as any)?.appSecret;
        if (appSecret && signatureHeader && rawBody) {
          const isValid = this.provider.verifyWebhookSignature(signatureHeader, rawBody, appSecret);
          if (!isValid) {
            this.logger.warn(`Invalid HMAC signature for phoneNumberId: ${phoneNumberId}`);
            continue;
          }
        }

        const organizationId = integration.organizationId;
        const cleanPhone = msg.metadata.from.replace(/[^\d]/g, "");

        const crmRecord = await this.prisma.client.crmRecord.findFirst({
          where: {
            organizationId,
            OR: [
              { data: { path: ["phone"], equals: cleanPhone } },
              { data: { path: ["phone"], equals: `+${cleanPhone}` } },
            ],
          },
        });

        const existingThread = this.prisma.client.communicationThread.findFirst
          ? await this.prisma.client.communicationThread.findFirst({
              where: {
                organizationId,
                channel: "WHATSAPP",
                participantPhone: cleanPhone,
              },
            })
          : null;

        const isNewThread = !existingThread;

        const thread = await this.prisma.client.communicationThread.upsert({
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
            participantName: msg.metadata.contactName,
            crmRecordId: crmRecord?.id,
            lastMessageAt: new Date(),
            unreadCount: 1,
          },
          update: {
            participantName: msg.metadata.contactName || undefined,
            crmRecordId: crmRecord?.id || undefined,
            lastMessageAt: new Date(),
            unreadCount: { increment: 1 },
          },
        });

        await this.prisma.client.communicationMessage.upsert({
          where: { externalId: msg.externalId },
          create: {
            threadId: thread.id,
            organizationId,
            direction: "INBOUND",
            content: msg.text,
            status: "DELIVERED",
            externalId: msg.externalId,
            metadata: msg.metadata,
          },
          update: {
            content: msg.text,
            status: "DELIVERED",
            metadata: msg.metadata,
          },
        });

        // 3. Automated Autoreply Evaluation (Welcome message or Out of Office)
        const settings = (integration.settings as any) || {};
        if (isNewThread && settings.enableWelcomeReply && settings.welcomeMessage) {
          try {
            await this.sendMessage(organizationId, undefined, {
              recipientPhone: cleanPhone,
              text: settings.welcomeMessage,
            });
          } catch (autoErr: any) {
            this.logger.warn(`Automated welcome reply failed: ${autoErr.message}`);
          }
        } else if (settings.enableOutOfOfficeReply && settings.outOfOfficeMessage) {
          // If out of office enabled, send autoreply once per incoming conversation batch
          try {
            await this.sendMessage(organizationId, undefined, {
              recipientPhone: cleanPhone,
              text: settings.outOfOfficeMessage,
            });
          } catch (autoErr: any) {
            this.logger.warn(`Automated out-of-office reply failed: ${autoErr.message}`);
          }
        }
      }
    }

    return { ok: true };
  }

  async syncTemplates(organizationId: string) {
    const integration = await this.getIntegration(organizationId);
    if (!integration || !integration.isActive) {
      throw new BadRequestException("WhatsApp integration not configured");
    }

    const { phoneNumberId, accessToken, wabaId } = (integration.credentials as any) || {};
    const businessAccountId = wabaId || phoneNumberId;

    if (!accessToken || !businessAccountId) {
      throw new BadRequestException("WhatsApp access token or WABA ID missing");
    }

    try {
      const response = await axios.get(`https://graph.facebook.com/v23.0/${businessAccountId}/message_templates`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const templates = response.data?.data || [];
      await Promise.all(
        templates.map((tpl: any) =>
          this.prisma.client.whatsappTemplate.upsert({
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

      return this.prisma.client.whatsappTemplate.findMany({ where: { organizationId } });
    } catch (err: any) {
      this.logger.error("Failed to sync templates", err?.response?.data || err?.message);
      throw new BadRequestException(`Template sync failed: ${JSON.stringify(err?.response?.data || err?.message)}`);
    }
  }

  async listTemplates(organizationId: string) {
    return this.prisma.client.whatsappTemplate.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
    });
  }

  async sendInvoiceNotification(organizationId: string, invoiceId: string, customerPhone: string, amount: number, currency: string = "USD") {
    try {
      const integration = await this.getIntegration(organizationId);
      if (!integration || !integration.isActive) return null;

      const text = `Hello! Your invoice #${invoiceId} for ${currency} ${amount} has been issued. Thank you for your business!`;
      return await this.sendMessage(organizationId, undefined, {
        recipientPhone: customerPhone,
        text,
        templateName: "invoice_notification",
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: invoiceId },
              { type: "text", text: `${currency} ${amount}` },
            ],
          },
        ],
      });
    } catch (err: any) {
      this.logger.warn(`Invoice WhatsApp notification skipped or failed: ${err.message}`);
      return null;
    }
  }

  async sendPaymentReceiptNotification(
    organizationId: string,
    transactionId: string,
    customerPhone: string,
    amount: number,
    currency: string = "USD",
    receiptUrl?: string,
  ) {
    try {
      const integration = await this.getIntegration(organizationId);
      if (!integration || !integration.isActive) return null;

      const receiptSuffix = receiptUrl ? ` View your receipt here: ${receiptUrl}` : "";
      const text = `Payment Confirmed! We received your payment of ${currency} ${amount} (Ref: ${transactionId}). Thank you!${receiptSuffix}`;

      return await this.sendMessage(organizationId, undefined, {
        recipientPhone: customerPhone,
        text,
        templateName: "payment_receipt",
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: transactionId },
              { type: "text", text: `${currency} ${amount}` },
            ],
          },
        ],
      });
    } catch (err: any) {
      this.logger.warn(`Payment receipt WhatsApp notification failed: ${err.message}`);
      return null;
    }
  }

  async sendDeliveryStatusNotification(
    organizationId: string,
    trackingNumber: string,
    customerPhone: string,
    status: string,
    estimatedDate?: string,
  ) {
    try {
      const integration = await this.getIntegration(organizationId);
      if (!integration || !integration.isActive) return null;

      const dateSuffix = estimatedDate ? ` Estimated delivery: ${estimatedDate}.` : "";
      const text = `Delivery Update: Package #${trackingNumber} status is now: ${status}.${dateSuffix}`;

      return await this.sendMessage(organizationId, undefined, {
        recipientPhone: customerPhone,
        text,
        templateName: "delivery_status_update",
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: trackingNumber },
              { type: "text", text: status },
            ],
          },
        ],
      });
    } catch (err: any) {
      this.logger.warn(`Delivery status WhatsApp notification failed: ${err.message}`);
      return null;
    }
  }

  async sendOrderStatusNotification(organizationId: string, orderNumber: string, customerPhone: string, status: string) {
    try {
      const integration = await this.getIntegration(organizationId);
      if (!integration || !integration.isActive) return null;

      const text = `Hello! Your order #${orderNumber} status has been updated to: ${status}.`;
      return await this.sendMessage(organizationId, undefined, {
        recipientPhone: customerPhone,
        text,
        templateName: "order_status_update",
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: orderNumber },
              { type: "text", text: status },
            ],
          },
        ],
      });
    } catch (err: any) {
      this.logger.warn(`Order status WhatsApp notification skipped or failed: ${err.message}`);
      return null;
    }
  }

  async verifyConfig(organizationId: string) {
    const integration = await this.getIntegration(organizationId);
    if (!integration) {
      return {
        isConfigured: false,
        isActive: false,
        phoneNumberId: null,
        wabaId: null,
        syncStatus: "DISCONNECTED",
        multitenancyValid: true,
      };
    }

    const credentials = (integration.credentials as any) || {};
    const hasPhoneNumberId = !!credentials.phoneNumberId;
    const hasAccessToken = !!credentials.accessToken;

    return {
      isConfigured: hasPhoneNumberId && hasAccessToken,
      isActive: integration.isActive,
      phoneNumberId: credentials.phoneNumberId || null,
      wabaId: credentials.wabaId || null,
      syncStatus: integration.syncStatus,
      multitenancyValid: integration.organizationId === organizationId,
    };
  }

  async sendPurchaseOrderNotification(
    organizationId: string,
    poNumber: string,
    supplierPhone?: string,
    totalAmount?: number,
    purchaseOrderId?: string,
    recipientPhoneOverride?: string,
  ) {
    try {
      const integration = await this.getIntegration(organizationId);
      if (!integration || !integration.isActive) return null;

      let targetPhone = recipientPhoneOverride || supplierPhone;
      let amount = totalAmount;

      if ((!targetPhone || amount === undefined) && purchaseOrderId) {
        const po = await this.prisma.client.purchase.findFirst({
          where: { id: purchaseOrderId, organizationId },
          include: { supplier: true },
        });

        if (po) {
          if (!targetPhone) {
            targetPhone = po.supplier?.phone || undefined;
          }
          if (amount === undefined) {
            amount = Number(po.totalAmount);
          }
        }
      }

      if (!targetPhone) {
        this.logger.warn(`Purchase order WhatsApp notification skipped: recipient phone is missing for PO ${poNumber}`);
        return null;
      }

      const formattedAmount = amount !== undefined ? `${amount}` : "N/A";
      const text = `Hello! A new Purchase Order #${poNumber} for total ${formattedAmount} has been issued to you. Please check your portal or contact us for details.`;

      return await this.sendMessage(organizationId, undefined, {
        recipientPhone: targetPhone,
        text,
        templateName: "purchase_order_issued",
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: poNumber },
              { type: "text", text: formattedAmount },
            ],
          },
        ],
      });
    } catch (err: any) {
      this.logger.warn(`Purchase order WhatsApp notification skipped or failed: ${err.message}`);
      return null;
    }
  }
}
