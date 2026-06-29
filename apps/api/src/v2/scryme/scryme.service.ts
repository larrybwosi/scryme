import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ScrymeChatApiClient } from "@repo/scryme";
import * as crypto from "crypto";
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

  async provisionWorkspace(organizationId: string, name: string, slug: string) {
    const workspaceSlug = `org-${slug}`.toLowerCase();

    this.logger.log(
      `Provisioning Scryme workspace for org ${organizationId}: ${workspaceSlug}`,
    );

    try {
      const workspace = await this.scrymeClient.createWorkspace(
        name,
        workspaceSlug,
      );

      const config = await this.prisma.client.scrymeConfiguration.upsert({
        where: { organizationId },
        update: {
          workspaceId: workspace.id,
          workspaceSlug: workspace.slug,
          isActive: true,
        },
        create: {
          organizationId,
          workspaceId: workspace.id,
          workspaceSlug: workspace.slug,
          isActive: true,
        },
      });

      // Background sync users for enterprise robust mapping
      this.syncUsers(organizationId).catch((err) =>
        this.logger.error(`Initial user sync failed: ${err.message}`),
      );

      return config;
    } catch (error: any) {
      this.logger.error(
        `Failed to provision Scryme workspace: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async syncUsers(organizationId: string, force = false) {
    const config = await this.getConfiguration(organizationId);
    if (!config || !config.workspaceSlug || !config.isActive) return;

    // Enterprise: Throttle automatic syncs to once every 24 hours
    if (!force && config.lastSyncAt) {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      if (config.lastSyncAt > twentyFourHoursAgo) {
        this.logger.debug(`Skipping automatic Scryme user sync for org ${organizationId}: recently synced`);
        return;
      }
    }

    const members = await this.prisma.client.member.findMany({
      where: { organizationId },
      include: { user: true },
    });

    this.logger.log(
      `Syncing ${members.length} users for Scryme workspace ${config.workspaceSlug}`,
    );

    for (const member of members) {
      try {
        const scrymeUser = await this.scrymeClient.findUserByEmail(
          config.workspaceSlug,
          member.user.email,
        );

        if (scrymeUser) {
          await this.prisma.client.user.update({
            where: { id: member.userId },
            data: { scrymeUserId: scrymeUser.id },
          });
        }
      } catch (error: any) {
        this.logger.warn(
          `Failed to sync user ${member.user.email}: ${error.message}`,
        );
      }
    }

    // Record last sync
    await this.prisma.client.scrymeConfiguration.update({
      where: { organizationId },
      data: { lastSyncAt: new Date() },
    });
  }

  async handleWebhook(signature: string, payload: any) {
    // Verify Signature
    const secret = process.env.SCRYME_WEBHOOK_SECRET;
    const isProduction = process.env.NODE_ENV === "production";

    if (secret) {
      if (!signature) {
        this.logger.warn(
          "Missing Scryme webhook signature while secret is configured",
        );
        throw new BadRequestException("Missing signature");
      }

      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(JSON.stringify(payload))
        .digest("hex");

      const signatureBuffer = Buffer.from(signature);
      const expectedBuffer = Buffer.from(expectedSignature);

      if (
        signatureBuffer.length !== expectedBuffer.length ||
        !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
      ) {
        this.logger.warn("Invalid Scryme webhook signature");
        throw new BadRequestException("Invalid signature");
      }
    } else if (isProduction) {
      this.logger.error(
        "SCRYME_WEBHOOK_SECRET is not configured in production. Webhooks are disabled for security.",
      );
      throw new BadRequestException("Webhooks disabled: configuration missing");
    } else {
      this.logger.warn(
        "SCRYME_WEBHOOK_SECRET is not configured. Webhook signature verification is skipped (Development mode only).",
      );
    }

    this.logger.log(`Received Scryme webhook: ${payload.event}`);

    if (payload.event === "message.action") {
      const { workspaceSlug, action, message, user } = payload.data;

      if (
        action.id.startsWith("approve:") ||
        action.id.startsWith("decline:") ||
        action.id.startsWith("request_info:")
      ) {
        const decisionId = action.value;
        const [actionType] = action.id.split(":");

        const decision = await this.prisma.client.approvalDecision.findUnique({
          where: { id: decisionId },
          include: {
            approvalRequest: true,
            approver: { include: { user: true } },
          },
        });

        if (decision && decision.approver.user.email === user.email) {
          const status =
            actionType === "approve"
              ? "APPROVED"
              : actionType === "decline"
                ? "REJECTED"
                : "REQUEST_INFO";

          const result = await makeApprovalDecisionCore(
            decision.approvalRequest.organizationId,
            decision.approverId,
            {
              requestId: decision.approvalRequestId,
              status: status as any,
              comments: "Action taken via Scryme Chat",
            },
          );

          const { request, finalStatus, nextStep, originalStep } = result;

          // Process side effects (notifications) directly via service to avoid insecure/buggy internal fetch
          try {
            // Update Scryme messages for the step
            await this.scrymeApprovalService.updateStepMessages(
              request.organizationId,
              request.id,
              decision.approverId,
              originalStep,
            );

            // If moved to next step, notify new approvers
            if (nextStep > originalStep) {
              await this.scrymeApprovalService.notifyApprovers(
                request.organizationId,
                request.id,
              );
            }

            // If final decision or info requested, notify requester
            if (
              (finalStatus === "APPROVED" ||
                finalStatus === "REJECTED" ||
                finalStatus === "REQUEST_INFO") &&
              nextStep === originalStep
            ) {
              await this.scrymeApprovalService.notifyRequester(
                request.organizationId,
                request.id,
              );
            }
          } catch (err: any) {
            this.logger.error(`Failed to process Scryme side effects: ${err.message}`);
          }

          return { status: "success", message: `Action ${status} processed` };
        }
      }

      // Find the organization associated with this workspace
      const config = await (
        this.prisma.client as any
      ).scrymeConfiguration.findFirst({
        where: { workspaceSlug },
        include: { organization: { include: { windmillConfiguration: true } } },
      });

      if (!config || !config.organization.windmillConfiguration) {
        this.logger.warn(
          `No organization or Windmill config found for Scryme workspace: ${workspaceSlug}`,
        );
        return { status: "ignored" };
      }

      // Enterprise: Handle generic HITL (Human-in-the-loop) actions
      if (action.id.startsWith("wm_resume:")) {
        const resumeToken = action.value;
        const [_, jobId] = action.id.split(":");

        this.logger.log(`Resuming Windmill job ${jobId} via Scryme action`);

        // In a real scenario, this would call Windmill's resume endpoint
        // For now, we update the execution record if it exists
        const execution = await this.prisma.client.windmillExecution.findFirst({
          where: { jobId },
        });

        if (execution) {
          await this.prisma.client.windmillExecution.update({
            where: { id: execution.id },
            data: {
              status: "RUNNING",
              result: {
                ...(execution.result as any),
                resumedBy: user,
                resumedAt: new Date(),
                actionValue: action.value,
              },
            },
          });
        }

        // Send confirmation back to Scryme
        await this.scrymeClient.updateMessage(workspaceSlug, message.channelSlug || message.channelId, message.id, {
          content: `${message.content}\n\n✅ *Action processed by ${user.name}*`,
          actions: [],
        });

        return { status: "success", message: "Windmill job resumed" };
      }

      // Trigger Windmill workflow for unknown actions
      const scriptPath =
        process.env.SCRYME_ACTION_WORKFLOW_PATH ||
        "f/dealio/scryme_action_handler";

      await (this.prisma.client as any).windmillExecution.create({
        data: {
          organizationId: config.organizationId,
          configId: config.organization.windmillConfiguration.id,
          jobId: `scryme_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          scriptPath,
          dealioEventType: "SCRYME_ACTION",
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
        `Queued Windmill execution for Scryme action: ${action.id} in workspace ${workspaceSlug}`,
      );
      return { status: "success" };
    }

    return { status: "received" };
  }

  async registerWebhook(baseUrl: string) {
    const webhookUrl = `${baseUrl.replace(/\/$/, "")}/v2/scryme/webhook`;
    this.logger.log(`Registering Scryme global webhook: ${webhookUrl}`);
    try {
      await this.scrymeClient.registerGlobalWebhook(webhookUrl);
    } catch (error: any) {
      this.logger.error(`Failed to register Scryme webhook: ${error.message}`);
    }
  }
}
