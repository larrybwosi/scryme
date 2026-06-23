import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ScrymeChatApiClient } from "@repo/scryme";
import { createHmac } from "crypto";
import { makeApprovalDecisionCore } from "@repo/shared/actions/finance/approvals";
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

      return config;
    } catch (error: any) {
      this.logger.error(
        `Failed to provision Scryme workspace: ${error.message}`,
        error.stack,
      );
      throw error;
    }
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

      const expectedSignature = createHmac("sha256", secret)
        .update(JSON.stringify(payload))
        .digest("hex");

      if (signature !== expectedSignature) {
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

      // Trigger Windmill workflow
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
