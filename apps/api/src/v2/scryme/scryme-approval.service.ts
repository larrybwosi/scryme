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

    // Enterprise: Post to a central discussion channel if configured (e.g., department channel)
    await this.notifyDiscussionChannel(organizationId, requestId);

    const pendingDecisions = request.decisions.filter(
      (d) => d.stepNumber === request.currentStep,
    );

    for (const decision of pendingDecisions) {
      try {
        let scrymeUserId = decision.approver.user.scrymeUserId;

        if (!scrymeUserId) {
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
          scrymeUserId = scrymeUser.id;

          // Update for next time
          await this.prisma.client.user.update({
            where: { id: decision.approver.user.id },
            data: { scrymeUserId },
          });
        }

        const dmChannel = await this.scrymeClient.getDirectMessageChannel(
          workspaceSlug,
          scrymeUserId,
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

        // Enterprise: DO NOT use scrymeThreadId in DMs across different users.
        // DM threads are user-specific. Instead, we use it only if it was started in THIS DM.
        const existingDmMessage = await this.prisma.client.scrymeMessage.findFirst({
          where: {
            relatedId: requestId,
            recipientId: decision.approverId,
            channelSlug: dmChannel.slug,
          },
          orderBy: { createdAt: "asc" },
        });

        const message = await this.scrymeClient.sendMessage(
          workspaceSlug,
          dmChannel.slug,
          {
            content,
            actions,
            threadId: existingDmMessage?.messageId || undefined,
          },
        );

        await this.prisma.client.approvalDecision.update({
          where: { id: decision.id },
          data: {
            scrymeMessageId: message.id,
            scrymeChannelId: dmChannel.slug,
          },
        });

        // Log message for audit and threading
        await this.prisma.client.scrymeMessage.create({
          data: {
            organizationId,
            workspaceSlug,
            channelSlug: dmChannel.slug,
            messageId: message.id,
            content,
            recipientId: decision.approverId,
            eventType: "APPROVAL_REQUEST",
            relatedId: requestId,
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
      let scrymeUserId = request.requester.user.scrymeUserId;

      if (!scrymeUserId) {
        const requesterEmail = request.requester.user.email;
        const scrymeUser = await this.scrymeClient.findUserByEmail(
          workspaceSlug,
          requesterEmail,
        );

        if (!scrymeUser) return;
        scrymeUserId = scrymeUser.id;

        await this.prisma.client.user.update({
          where: { id: request.requester.user.id },
          data: { scrymeUserId },
        });
      }

      const dmChannel = await this.scrymeClient.getDirectMessageChannel(
        workspaceSlug,
        scrymeUserId,
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

  /**
   * Enterprise: Post to a central discussion channel for the approval request.
   */
  private async notifyDiscussionChannel(organizationId: string, requestId: string) {
    const request = await this.prisma.client.approvalRequest.findUnique({
      where: { id: requestId },
      include: {
        requester: { include: { user: true } },
        organization: { include: { scrymeConfiguration: true } },
      },
    });

    if (!request || !request.organization.scrymeConfiguration?.workspaceSlug) return;

    const workspaceSlug = request.organization.scrymeConfiguration.workspaceSlug;

    // Determine target channel (e.g., 'finance-approvals' or department channel)
    let targetChannel = "notifications";

    // Try to find the requester's department channel
    const deptMember = await this.prisma.client.departmentMember.findFirst({
      where: { memberId: request.requesterId },
      include: { department: true }
    });

    if (deptMember?.department?.scrymeChannelId) {
      targetChannel = deptMember.department.scrymeChannelId;
    }

    const content = `💬 *Discussion Thread for Approval: ${request.relatedRecordNumber}*\n` +
      `Requested by: ${request.requester.user.name || request.requester.user.email}\n` +
      `Amount: ${request.currency} ${request.amount.toString()}\n` +
      `Please use this thread for team discussion regarding this request.`;

    try {
      // If we don't have a central thread ID yet, create the root message
      if (!request.scrymeThreadId) {
        const message = await this.scrymeClient.sendMessage(workspaceSlug, targetChannel, { content });

        await this.prisma.client.approvalRequest.update({
          where: { id: requestId },
          data: { scrymeThreadId: message.id }
        });

        await this.prisma.client.scrymeMessage.create({
          data: {
            organizationId,
            workspaceSlug,
            channelSlug: targetChannel,
            messageId: message.id,
            content,
            eventType: "APPROVAL_DISCUSSION_ROOT",
            relatedId: requestId,
          }
        });
      }
    } catch (error: any) {
      this.logger.error(`Failed to post to discussion channel: ${error.message}`);
    }
  }
}
