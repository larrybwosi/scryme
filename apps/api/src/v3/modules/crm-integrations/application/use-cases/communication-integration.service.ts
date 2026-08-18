import { Injectable, Logger, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { SlackProvider } from "../../infrastructure/providers/slack.provider";
import { CommunicationProvider } from "../../domain/communication-provider.interface";

@Injectable()
export class CommunicationIntegrationService {
  private readonly logger = new Logger(CommunicationIntegrationService.name);
  private providers: Map<string, CommunicationProvider> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly slackProvider: SlackProvider,
  ) {
    this.providers.set(slackProvider.slug, slackProvider);
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

    // SECURITY (Sentinel): Securely persist OAuth credentials tied to the verified organization state
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

  async handleWebhook(providerSlug: string, payload: any, query: any) {
    const provider = this.getProvider(providerSlug);
    const messages = await provider.parseWebhookEvent(payload);

    if (!messages) return { ok: true };

    // ⚡ Bolt Optimization: Use in-memory Map caches to prevent N+1 queries.
    // - integrationCache caches organizationIntegration records by teamId to prevent redundant queries
    //   when multiple messages in a batch belong to the same integration/team.
    // - personDefCache caches "person" crmObjectDefinition records by organizationId.
    const integrationCache = new Map<string, any>();
    const personDefCache = new Map<string, any>();

    for (const msg of messages) {
      const teamId = msg.metadata?.team;
      let integration: any = null;

      // 1. Identify Organization
      if (teamId) {
        if (integrationCache.has(teamId)) {
          integration = integrationCache.get(teamId);
        } else {
          integration = await this.prisma.client.organizationIntegration.findFirst({
            where: {
              integrationDefinition: { slug: providerSlug },
              credentials: { path: ["teamId"], equals: teamId },
            },
            include: { organization: true },
          });
          if (integration) {
            integrationCache.set(teamId, integration);
          }
        }
      } else {
        // Fallback if teamId is not present
        integration = await this.prisma.client.organizationIntegration.findFirst({
          where: {
            integrationDefinition: { slug: providerSlug },
          },
          include: { organization: true },
        });
      }

      if (!integration) {
        this.logger.warn(
          `No integration found for ${providerSlug} team ${teamId}`,
        );
        continue;
      }

      // 2. Resolve Email (Slack specific for now)
      let email = msg.senderEmail;
      if (!email && providerSlug === "slack" && msg.metadata?.slackUser) {
        email = await (provider as SlackProvider).getUserEmail(
          integration,
          msg.metadata.slackUser,
        );
      }

      // 3. Resolve or Create Record
      let recordId: string | undefined;
      if (email) {
        const record = await this.prisma.client.crmRecord.findFirst({
          where: {
            organizationId: integration.organizationId,
            data: { path: ["email"], equals: email },
          },
        });

        if (record) {
          recordId = record.id;
        } else {
          let personDef: any = null;
          const orgId = integration.organizationId;

          if (personDefCache.has(orgId)) {
            personDef = personDefCache.get(orgId);
          } else {
            personDef = await this.prisma.client.crmObjectDefinition.findFirst({
              where: {
                organizationId: orgId,
                name: "person",
              },
            });
            if (personDef) {
              personDefCache.set(orgId, personDef);
            }
          }

          if (personDef) {
            const newRecord = await this.prisma.client.crmRecord.create({
              data: {
                organizationId: orgId,
                objectId: personDef.id,
                data: { email: email, name: email.split("@")[0] },
              },
            });
            recordId = newRecord.id;
          }
        }
      }

      // 4. Create Activity
      if (recordId) {
        await this.prisma.client.crmActivity.create({
          data: {
            organizationId: integration.organizationId,
            recordId,
            type: "MESSAGE",
            description: msg.text,
            metadata: {
              ...msg.metadata,
              externalId: msg.externalId,
              threadId: msg.externalThreadId,
              channelId: msg.externalChannelId,
              provider: providerSlug,
              senderEmail: email,
            },
          },
        });
      }
    }

    return { ok: true };
  }

  async replyToActivity(
    organizationId: string,
    activityId: string,
    text: string,
  ) {
    // SECURITY (Sentinel): Using findFirst instead of findUnique because crm_activities lacks
    // a composite unique index on [id, organizationId], ensuring proper tenant scoping.
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
}
