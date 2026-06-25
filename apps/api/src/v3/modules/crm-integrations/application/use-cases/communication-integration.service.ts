import { Injectable, Logger, NotFoundException } from "@nestjs/common";
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

  async handleWebhook(providerSlug: string, payload: any, query: any) {
    const provider = this.getProvider(providerSlug);
    const messages = await provider.parseWebhookEvent(payload);

    if (!messages) return { ok: true };

    for (const msg of messages) {
      // 1. Identify Organization
      const integration =
        await this.prisma.client.organizationIntegration.findFirst({
          where: {
            integrationDefinition: { slug: providerSlug },
            credentials: { path: ["teamId"], equals: msg.metadata?.team },
          },
          include: { organization: true },
        });

      if (!integration) {
        this.logger.warn(
          `No integration found for ${providerSlug} team ${msg.metadata?.team}`,
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
          const personDef =
            await this.prisma.client.crmObjectDefinition.findFirst({
              where: {
                organizationId: integration.organizationId,
                name: "person",
              },
            });

          if (personDef) {
            const newRecord = await this.prisma.client.crmRecord.create({
              data: {
                organizationId: integration.organizationId,
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
    const activity = await this.prisma.client.crmActivity.findUnique({
      where: { id: activityId },
      include: { record: true },
    });

    if (!activity || activity.organizationId !== organizationId) {
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
