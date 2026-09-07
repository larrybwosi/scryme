import { Injectable, Logger, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CommunicationProvider } from "../../domain/communication-provider.interface";

@Injectable()
export class CommunicationIntegrationService {
  private readonly logger = new Logger(CommunicationIntegrationService.name);
  private providers: Map<string, CommunicationProvider> = new Map();

  constructor(
    private readonly prisma: PrismaService,
  ) {
  }

  registerProvider(provider: CommunicationProvider) {
    this.providers.set(provider.slug, provider);
  }

  getProvider(slug: string): CommunicationProvider {
    const provider = this.providers.get(slug);
    if (!provider) throw new NotFoundException(`Provider ${slug} not found`);
    return provider;
  }

  async handleOAuthCallback(
    providerSlug: string,
    organizationId: string,
    code: string,
  ) {
    if (!organizationId || !code) {
      throw new BadRequestException("Missing mandatory organizationId or authorization code");
    }

    const provider = this.getProvider(providerSlug);
    const { credentials, settings } = await provider.handleCallback(code);

    const definition = await this.prisma.client.integrationDefinition.findUnique({
      where: { slug: providerSlug },
    });

    if (!definition) {
      throw new NotFoundException(`Integration definition for ${providerSlug} not found`);
    }

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
        syncStatus: "SYNCED",
        lastSyncAt: new Date(),
      },
      update: {
        isActive: true,
        credentials,
        settings,
        syncStatus: "SYNCED",
        lastSyncAt: new Date(),
      },
    });
  }

  async replyToActivity(
    organizationId: string,
    activityId: string,
    text: string,
  ) {
    const activity = await this.prisma.client.crmActivity.findFirst({
      where: { id: activityId, organizationId },
      include: { record: true },
    });

    if (!activity) {
      throw new NotFoundException("Activity not found");
    }

    const metadata = activity.metadata as any;
    const providerSlug = metadata?.provider;

    if (!providerSlug) {
      throw new Error("Activity does not have a linked provider for reply");
    }

    const integration =
      await this.prisma.client.organizationIntegration.findFirst({
        where: {
          organizationId,
          integrationDefinition: { slug: providerSlug },
          isActive: true,
        },
      });

    if (!integration) {
      throw new NotFoundException(`No active integration for ${providerSlug}`);
    }

    const provider = this.getProvider(providerSlug);
    const result = await provider.sendMessage(integration, {
      text,
      threadId: metadata.threadId,
      channelId: metadata.channelId,
    });

    return this.prisma.client.crmActivity.create({
      data: {
        organizationId,
        recordId: activity.recordId,
        type: "REPLY",
        description: text,
        metadata: {
          ...metadata,
          externalId: result.externalId,
          threadId: result.threadId,
          isReply: true,
        },
      },
    });
  }

  async handleWebhook(
    providerSlug: string,
    headers: any,
    body: any,
  ) {
    const provider = this.getProvider(providerSlug);
    const messages = (await provider.parseWebhookEvent(body)) || [];

    const integrationCache = new Map<string, any>();
    const personDefCache = new Map<string, any>();

    for (const msg of messages) {
      if (!msg.metadata?.team) continue;

      let integration = integrationCache.get(msg.metadata.team);
      if (!integration) {
        integration = await this.prisma.client.organizationIntegration.findFirst({
          where: {
            integrationDefinition: { slug: providerSlug },
            credentials: { path: ["teamId"], equals: msg.metadata.team },
          },
          include: { organization: true },
        });
        if (integration) {
          integrationCache.set(msg.metadata.team, integration);
        }
      }

      if (!integration) continue;

      let record = await this.prisma.client.crmRecord.findFirst({
        where: {
          organizationId: integration.organizationId,
          data: { path: ["email"], equals: msg.senderEmail },
        },
      });

      if (!record) {
        let personDef = personDefCache.get(integration.organizationId);
        if (!personDef) {
          personDef = await this.prisma.client.crmObjectDefinition.findFirst({
            where: {
              organizationId: integration.organizationId,
              name: "person",
            },
          });
          if (personDef) {
            personDefCache.set(integration.organizationId, personDef);
          }
        }

        if (personDef) {
          record = await this.prisma.client.crmRecord.create({
            data: {
              organizationId: integration.organizationId,
              objectId: personDef.id,
              data: {
                email: msg.senderEmail,
                name: msg.senderEmail.split("@")[0],
              },
            },
          });
        }
      }

      await this.prisma.client.crmActivity.create({
        data: {
          organizationId: integration.organizationId,
          recordId: record?.id,
          type: "COMMUNICATION",
          description: msg.text,
          metadata: {
            provider: providerSlug,
            externalId: msg.externalId,
            ...msg.metadata,
          },
        },
      });
    }

    return { ok: true };
  }
}
