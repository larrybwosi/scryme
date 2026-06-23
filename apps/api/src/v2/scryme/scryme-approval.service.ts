import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ScrymeChatApiClient, ScrymeChatAction } from "@repo/scryme";

@Injectable()
export class ScrymeApprovalService {
  private readonly logger = new Logger(ScrymeApprovalService.name);
  private readonly scrymeClient = new ScrymeChatApiClient();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Send an approval request to all approvers in the current step via Scryme Chat.
   */
  async notifyApprovers(organizationId: string, requestId: string) {
    const request = await this.prisma.client.approvalRequest.findFirst({
      where: { id: requestId, organizationId },
      include: {
        requester: { include: { user: true } },
        organization: { include: { scrymeConfiguration: true } },
        decisions: {
          where: { status: "PENDING" },
          include: { approver: { include: { user: true } } },
        },
      },
    });

    if (!request || !request.organization.scrymeConfiguration?.isActive) {
      return;
    }

    const workspaceSlug =
      request.organization.scrymeConfiguration.workspaceSlug;
    if (!workspaceSlug) return;

    const pendingDecisions = request.decisions.filter(
      (d) => d.stepNumber === request.currentStep,
    );

    for (const decision of pendingDecisions) {
      try {
        const approverEmail = decision.approver.user.email;
        const scrymeUser = await this.scrymeClient.findUserByEmail(
          workspaceSlug,
          approverEmail,
        );

        if (!scrymeUser) {
          this.logger.warn(
            `Approver ${approverEmail} not found in Scryme workspace ${workspaceSlug}`,
          );
          continue;
        }

        const dmChannel = await this.scrymeClient.getDirectMessageChannel(
          workspaceSlug,
          scrymeUser.id,
        );

        const actions: ScrymeChatAction[] = [
          {
            id: `approve:${decision.id}`,
            label: "Approve",
            type: "button",
            style: "primary",
            value: decision.id,
          },
          {
            id: `decline:${decision.id}`,
            label: "Decline",
            type: "button",
            style: "danger",
            value: decision.id,
          },
          {
            id: `request_info:${decision.id}`,
            label: "Ask for More Details",
            type: "button",
            style: "secondary",
            value: decision.id,
          },
        ];

        const content =
          `🔔 *Approval Request: ${request.relatedRecordNumber}*\n\n` +
          `*Requester:* ${request.requester.user.name || request.requester.user.email}\n` +
          `*Amount:* ${request.currency} ${request.amount.toString()}\n` +
          `*Type:* ${request.requestType}\n\n` +
          `Please review and take action.`;

        const message = await this.scrymeClient.sendMessage(
          workspaceSlug,
          dmChannel.slug,
          {
            content,
            actions,
          },
        );

        await this.prisma.client.approvalDecision.update({
          where: { id: decision.id },
          data: {
            scrymeMessageId: message.id,
            scrymeChannelId: dmChannel.slug,
          },
        });
      } catch (error: any) {
        this.logger.error(
          `Failed to send Scryme notification to approver ${decision.approverId}: ${error.message}`,
        );
      }
    }
  }

  /**
   * Update Scryme messages for all approvers of a step when a decision is made.
   */
  async updateStepMessages(
    organizationId: string,
    requestId: string,
    decisionByMemberId: string,
    stepNumber: number,
  ) {
    const request = await this.prisma.client.approvalRequest.findFirst({
      where: { id: requestId, organizationId },
      include: {
        organization: { include: { scrymeConfiguration: true } },
        decisions: {
          where: { stepNumber: stepNumber },
          include: { approver: { include: { user: true } } },
        },
      },
    });

    if (!request || !request.organization.scrymeConfiguration?.isActive) {
      return;
    }

    const workspaceSlug =
      request.organization.scrymeConfiguration.workspaceSlug;
    if (!workspaceSlug) return;

    const finalDecision = request.decisions.find(
      (d) => d.approverId === decisionByMemberId && d.status !== "PENDING",
    );

    if (!finalDecision) return;

    const approverName =
      finalDecision.approver.user.name || finalDecision.approver.user.email;
    const statusText =
      finalDecision.status === "APPROVED"
        ? "Approved"
        : finalDecision.status === "REJECTED"
          ? "Declined"
          : finalDecision.status === "REQUEST_INFO"
            ? "Information Requested"
            : finalDecision.status;

    for (const decision of request.decisions) {
      if (decision.scrymeMessageId && decision.scrymeChannelId) {
        try {
          const content =
            `✅ *Approval Request: ${request.relatedRecordNumber}*\n\n` +
            `*Status:* ${statusText} by ${approverName}\n` +
            (finalDecision.comments &&
            finalDecision.comments !== "Action taken via Scryme Chat"
              ? `*Comments:* ${finalDecision.comments}\n`
              : "");

          await this.scrymeClient.updateMessage(
            workspaceSlug,
            decision.scrymeChannelId,
            decision.scrymeMessageId,
            {
              content,
              actions: [], // Remove buttons
            },
          );
        } catch (error: any) {
          this.logger.error(
            `Failed to update Scryme message ${decision.scrymeMessageId}: ${error.message}`,
          );
        }
      }
    }
  }

  /**
   * Notify the requester about a decision (approval, rejection, or info request).
   */
  async notifyRequester(organizationId: string, requestId: string) {
    const request = await this.prisma.client.approvalRequest.findFirst({
      where: { id: requestId, organizationId },
      include: {
        requester: { include: { user: true } },
        organization: { include: { scrymeConfiguration: true } },
        decisions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { approver: { include: { user: true } } },
        },
      },
    });

    if (!request || !request.organization.scrymeConfiguration?.isActive) {
      return;
    }

    const workspaceSlug =
      request.organization.scrymeConfiguration.workspaceSlug;
    if (!workspaceSlug) return;

    const latestDecision = request.decisions[0];
    if (!latestDecision) return;

    try {
      const requesterEmail = request.requester.user.email;
      const scrymeUser = await this.scrymeClient.findUserByEmail(
        workspaceSlug,
        requesterEmail,
      );

      if (!scrymeUser) return;

      const dmChannel = await this.scrymeClient.getDirectMessageChannel(
        workspaceSlug,
        scrymeUser.id,
      );

      let statusEmoji = "ℹ️";
      let title = "Update on your Approval Request";

      if (latestDecision.status === "APPROVED" && request.status === "APPROVED") {
        statusEmoji = "✅";
        title = "Request Approved";
      } else if (latestDecision.status === "REJECTED") {
        statusEmoji = "❌";
        title = "Request Declined";
      } else if (latestDecision.status === "REQUEST_INFO") {
        statusEmoji = "❓";
        title = "Information Requested";
      }

      const approverName =
        latestDecision.approver.user.name || latestDecision.approver.user.email;

      let content =
        `${statusEmoji} *${title}: ${request.relatedRecordNumber}*\n\n` +
        `*Status:* ${latestDecision.status} by ${approverName}\n` +
        `*Amount:* ${request.currency} ${request.amount.toString()}\n`;

      if (
        latestDecision.comments &&
        latestDecision.comments !== "Action taken via Scryme Chat"
      ) {
        content += `*Comments:* ${latestDecision.comments}\n`;
      }

      await this.scrymeClient.sendMessage(workspaceSlug, dmChannel.slug, {
        content,
      });
    } catch (error: any) {
      this.logger.error(
        `Failed to notify requester via Scryme: ${error.message}`,
      );
    }
  }
}
