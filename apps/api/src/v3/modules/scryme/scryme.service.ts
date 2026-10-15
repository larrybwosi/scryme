import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { ScrymeChatApiClient } from "@repo/chat";
import { makeApprovalDecisionCore } from "@repo/shared/actions";
import { ScrymeApprovalService } from "./scryme-approval.service";

@Injectable()
export class ScrymeService {
  private readonly logger = new Logger(ScrymeService.name);
  private readonly scrymeClient = new ScrymeChatApiClient();

  constructor(
    private readonly prisma: PrismaService,
    private readonly scrymeApprovalService: ScrymeApprovalService,
  ) {}

  async getConfiguration(organizationId: string) {
    return this.prisma.client.scrymeConfiguration.findUnique({
      where: { organizationId },
    });
  }

  async provisionWorkspace(
    organizationId: string,
    name: string,
    slug: string,
    ownerEmail?: string,
  ) {
    const workspaceSlug = `org-${slug}`.toLowerCase();

    this.logger.log(
      `Provisioning Scryme workspace for org ${organizationId}: ${workspaceSlug}`,
    );

    try {
      let finalOwnerEmail = ownerEmail;
      if (!finalOwnerEmail) {
        const firstMember = await this.prisma.client.member.findFirst({
          where: { organizationId },
          include: { user: true },
          orderBy: { createdAt: "asc" },
        });
        finalOwnerEmail = firstMember?.user?.email;
      }
      if (!finalOwnerEmail) {
        throw new BadRequestException(
          "Cannot provision Scryme workspace without an owner email. Please ensure the organization has at least one active user.",
        );
      }

      await this.scrymeClient.createWorkspace(
        `${name} Workspace`,
        workspaceSlug,
        finalOwnerEmail,
      );

      const defaultChannels = [
        { name: "general", topic: "Company-wide announcements and discussions" },
        { name: "notifications", topic: "Automated business alerts and order notifications" },
        { name: "sales", topic: "Sales updates and lead notifications" },
        { name: "procurement", topic: "Purchase order discussions and approvals" },
        { name: "finance", topic: "Expense approvals and financial updates" },
      ];

      for (const channel of defaultChannels) {
        try {
          await this.scrymeClient.createChannel(
            workspaceSlug,
            channel.name,
            channel.name,
            "public",
          );
        } catch (e: any) {
          this.logger.warn(`Channel ${channel.name} creation skipped/exists: ${e.message}`);
        }
      }

      const config = await this.prisma.client.scrymeConfiguration.upsert({
        where: { organizationId },
        update: {
          workspaceSlug,
          isActive: true,
        },
        create: {
          organizationId,
          workspaceSlug,
          isActive: true,
        },
      });

      await this.syncUsers(organizationId);

      return config;
    } catch (error: any) {
      this.logger.error(
        `Failed to provision Scryme workspace for org ${organizationId}: ${error.message}`,
      );
      throw error;
    }
  }

  async syncUsers(organizationId: string, force = false) {
    const config = await this.getConfiguration(organizationId);
    if (!config || !config.isActive || !config.workspaceSlug) {
      return;
    }

    const members = await this.prisma.client.member.findMany({
      where: { organizationId, isActive: true },
      include: { user: true },
    });

    for (const member of members) {
      if (!member.user || !member.user.email) continue;

      if (!member.user.scrymeUserId || force) {
        try {
          const scrymeUser = await this.scrymeClient.addWorkspaceMember(
            config.workspaceSlug,
            member.user.email,
            member.role === "ADMIN" || member.role === "OWNER" ? "admin" : "member",
          );

          if (scrymeUser?.id) {
            await this.prisma.client.user.update({
              where: { id: member.user.id },
              data: { scrymeUserId: scrymeUser.id },
            });
          }
        } catch (error: any) {
          this.logger.error(
            `Failed to provision Scryme user for ${member.user.email}: ${error.message}`,
          );
        }
      }
    }
  }


  async provisionChannelForEntity(organizationId: string, entityType: string, entityId: string) {
    const config = await this.getConfiguration(organizationId);
    if (!config || !config.isActive || !config.workspaceSlug) return null;
    const channelName = `${entityType}-${entityId.substring(0, 8)}`;
    try {
      return await this.scrymeClient.createChannel(
        config.workspaceSlug,
        channelName,
        channelName,
        "public",
      );
    } catch (e: any) {
      this.logger.error(`Failed to provision channel for ${entityType} ${entityId}: ${e.message}`);
      return null;
    }
  }

  async syncAllChannels(organizationId: string) {
    const config = await this.getConfiguration(organizationId);
    if (!config || !config.isActive || !config.workspaceSlug) {
      return;
    }

    const locations = await this.prisma.client.inventoryLocation.findMany({
      where: { organizationId, isActive: true },
    });

    for (const loc of locations) {
      if (!loc.scrymeChannelId) {
        const channelName = `location-${loc.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
        try {
          const ch = await this.scrymeClient.createChannel(
            config.workspaceSlug,
            channelName,
            channelName,
            "public",
          );
          await this.prisma.client.inventoryLocation.update({
            where: { id: loc.id },
            data: { scrymeChannelId: ch.slug || channelName },
          });
        } catch (err: any) {
          this.logger.error(
            `Failed to sync location channel for ${loc.name}: ${err.message}`,
          );
        }
      }
    }

    const accounts = await this.prisma.client.businessAccount.findMany({
      where: { organizationId },
    });

    for (const acc of accounts) {
      const channelName = `client-${acc.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
      try {
        await this.scrymeClient.createChannel(
          config.workspaceSlug,
          channelName,
          channelName,
          "private",
        );
      } catch (err: any) {
        this.logger.error(
          `Failed to sync account channel for ${acc.name}: ${err.message}`,
        );
      }
    }
  }

  async handleWebhook(signature: string, payload: any) {
    const event = payload.event;
    const workspaceSlug = payload.workspaceSlug;

    const config = await this.prisma.client.scrymeConfiguration.findFirst({
      where: { workspaceSlug },
    });

    if (!config || !config.isActive) {
      this.logger.warn(`Received webhook for unknown or inactive workspace: ${workspaceSlug}`);
      return { status: "ignored" };
    }

    if (event === "action.triggered") {
      const { action, message, user } = payload.data;

      if (action.id.startsWith("approve:") || action.id.startsWith("reject:")) {
        const parts = action.id.split(":");
        const actionType = parts[0];
        const requestId = parts[1];

        const dbUser = await this.prisma.client.user.findFirst({
          where: { scrymeUserId: user.id },
        });

        if (!dbUser) {
          return { status: "error", message: "User not recognized in Scryme system" };
        }

        const member = await this.prisma.client.member.findFirst({
          where: {
            organizationId: config.organizationId,
            userId: dbUser.id,
          },
        });

        if (!member) {
          return { status: "error", message: "User is not a member of this organization" };
        }

        const decision = actionType === "approve" ? "APPROVED" : "REJECTED";

        try {
          const result = await makeApprovalDecisionCore(
            config.organizationId,
            member.id,
            {
              requestId,
              status: decision,
              comments: `Decision made via Scryme Chat by ${user.name}`,
            },
          );

          if (result.nextStep > result.originalStep) {
            await this.scrymeApprovalService.updateStepMessages(
              config.organizationId,
              requestId,
              member.id,
              result.originalStep,
            );
          }

          if (result.finalStatus === "APPROVED" || result.finalStatus === "REJECTED") {
            await this.scrymeApprovalService.notifyRequester(
              config.organizationId,
              requestId,
            );
          } else if (result.nextStep > result.originalStep) {
            await this.scrymeApprovalService.notifyApprovers(
              config.organizationId,
              requestId,
            );
          }

          await this.scrymeClient.updateMessage(
            workspaceSlug,
            message.channelSlug || message.channelId,
            message.id,
            {
              content: `${message.content}\n\n${decision === "APPROVED" ? "✅ Approved" : "❌ Rejected"} by ${user.name}`,
              actions: [],
            },
          );

          return { status: "success", decision };
        } catch (err: any) {
          this.logger.error(`Error processing Scryme approval decision: ${err.message}`);
          return { status: "error", message: err.message };
        }
      }

      if (action.id.startsWith("resume_job:")) {
        const parts = action.id.split(":");
        const executionId = parts[1];

        const execution = await (this.prisma.client as any).workflowEngineExecution.findFirst({
          where: { id: executionId, organizationId: config.organizationId },
        });

        if (!execution) {
          return { status: "error", message: "Workflow execution not found" };
        }

        await (this.prisma.client as any).workflowEngineExecution.update({
          where: { id: executionId },
          data: {
            status: "PENDING",
            result: {
              ...(execution.result as object || {}),
              userAction: {
                actionId: action.id,
                value: action.value,
                user,
                timestamp: new Date().toISOString(),
              },
            },
          },
        });

        await this.scrymeClient.updateMessage(
          workspaceSlug,
          message.channelSlug || message.channelId,
          message.id,
          {
            content: `${message.content}\n\n✅ *Action processed by ${user.name}*`,
            actions: [],
          },
        );

        return { status: "success", message: "Automation job resumed" };
      }

      const scriptPath =
        process.env.SCRYME_ACTION_WORKFLOW_PATH ||
        "f/dealio/scryme_action_handler";

      await (this.prisma.client as any).workflowEngineExecution.create({
        data: {
          organizationId: config.organizationId,
          definitionId: scriptPath,
          triggerEvent: "SCRYME_ACTION",
          correlationId: message.id,
          status: "PENDING",
          result: {
            action,
            message,
            user,
            workspaceSlug,
          },
        },
      });

      this.logger.log(
        `Queued execution for Scryme action: ${action.id} in workspace ${workspaceSlug}`,
      );
      return { status: "success" };
    }

    return { status: "received" };
  }

  async registerWebhook(baseUrl: string) {
    const webhookUrl = `${baseUrl.replace(/\/$/, "")}/v3/scryme/webhook`;
    this.logger.log(`Registering Scryme global webhook: ${webhookUrl}`);
    try {
      await this.scrymeClient.registerGlobalWebhook(webhookUrl);
    } catch (error: any) {
      this.logger.error(`Failed to register Scryme webhook: ${error.message}`);
    }
  }
}
