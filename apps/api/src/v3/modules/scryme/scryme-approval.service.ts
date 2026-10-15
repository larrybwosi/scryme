import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { ScrymeChatApiClient, ScrymeChatAction } from "@repo/chat";

@Injectable()
export class ScrymeApprovalService {
  private readonly logger = new Logger(ScrymeApprovalService.name);
  private readonly scrymeClient = new ScrymeChatApiClient();

  constructor(private readonly prisma: PrismaService) {}

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

    await this.notifyDiscussionChannel(organizationId, requestId);

    const pendingDecisions = request.decisions.filter(
      (d) => d.stepNumber === request.currentStep,
    );

    await Promise.all(
      pendingDecisions.map(async (decision) => {
        try {
          let scrymeUserId = decision.approver.user.scrymeUserId;

          if (!scrymeUserId) {
            try {
              const members = await this.scrymeClient.listWorkspaceMembers(
                workspaceSlug,
              );
              const userEmail = decision.approver.user.email?.toLowerCase();
              const foundMember = members.find(
                (m) => m.email?.toLowerCase() === userEmail,
              );

              if (foundMember) {
                scrymeUserId = foundMember.id;
                await this.prisma.client.user.update({
                  where: { id: decision.approver.user.id },
                  data: { scrymeUserId: foundMember.id },
                });
              }
            } catch (err: any) {
              this.logger.warn(
                `Failed to auto-lookup Scryme user for ${decision.approver.user.email}: ${err.message}`,
              );
            }
          }

          if (!scrymeUserId) {
            this.logger.warn(
              `Approver ${decision.approver.id} (${decision.approver.user.email}) does not have a linked Scryme user ID and couldn't be auto-linked. Skipping direct message.`,
            );
            return;
          }

          const crmBaseUrl =
            process.env.NEXT_PUBLIC_CRM_URL || "http://localhost:3001";
          const requestUrl = `${crmBaseUrl}/approvals/${request.id}`;

          const content =
            `📋 *Approval Required: Step ${request.currentStep}*\n\n` +
            `*Request:* ${request.requestType} (${request.relatedId})\n` +
            `*Requester:* ${request.requester.user.name || request.requester.user.email}\n` +
            `*Details:* ${(request as any).metadata ? JSON.stringify((request as any).metadata) : "N/A"}\n\n` +
            `Please review and make a decision below or view in CRM.`;

          const actions: ScrymeChatAction[] = [
            {
              id: `approve:${request.id}:${decision.id}`,
              label: "Approve",
              type: "button",
              style: "primary",
              value: "APPROVE",
            },
            {
              id: `reject:${request.id}:${decision.id}`,
              label: "Reject",
              type: "button",
              style: "danger",
              value: "REJECT",
            },
            {
              id: `view:${request.id}`,
              label: "View Request",
              type: "button",
              style: "secondary",
              value: requestUrl,
            },
          ];

          const dmChannel = await this.scrymeClient.getDirectMessageChannel(
            workspaceSlug,
            scrymeUserId,
          );

          const message = await this.scrymeClient.sendMessage(
            workspaceSlug,
            dmChannel.id,
            { content, actions },
          );

          await this.prisma.client.scrymeMessage.create({
            data: {
              organizationId,
              workspaceSlug,
              channelSlug: dmChannel.id,
              messageId: message.id,
              content,
              eventType: "APPROVAL_REQUESTED",
              relatedId: requestId,
              metadata: {
                stepNumber: request.currentStep,
                decisionId: decision.id,
                approverMemberId: decision.approverId,
              },
            },
          });
        } catch (error: any) {
          this.logger.error(
            `Failed to notify approver ${decision.approverId} via Scryme: ${error.message}`,
          );
        }
      }),
    );
  }

  async notifyDiscussionChannel(organizationId: string, requestId: string) {
    const request = await this.prisma.client.approvalRequest.findFirst({
      where: { id: requestId, organizationId },
      include: {
        requester: { include: { user: true } },
        organization: { include: { scrymeConfiguration: true } },
      },
    });

    if (!request || !request.organization.scrymeConfiguration?.isActive) {
      return;
    }

    const workspaceSlug =
      request.organization.scrymeConfiguration.workspaceSlug;
    if (!workspaceSlug) return;

    let targetChannelSlug: string | null = null;

    if (request.requestType === "PURCHASE_ORDER") {
      targetChannelSlug = "procurement";
    } else if (request.requestType === "EXPENSE") {
      targetChannelSlug = "finance";
    }

    if (!targetChannelSlug) {
      targetChannelSlug = "notifications";
    }

    try {
      const crmBaseUrl =
        process.env.NEXT_PUBLIC_CRM_URL || "http://localhost:3001";
      const requestUrl = `${crmBaseUrl}/approvals/${request.id}`;

      const content =
        `📢 *New Approval Request Created*\n\n` +
        `*Request:* ${request.requestType} (${request.relatedId})\n` +
        `*Requester:* ${request.requester.user.name || request.requester.user.email}\n` +
        `*Status:* Pending Step ${request.currentStep}\n\n` +
        `An approval request has been initiated and routed to assigned approvers.`;

      const actions: ScrymeChatAction[] = [
        {
          id: `view:${request.id}`,
          label: "View Request in CRM",
          type: "button",
          style: "primary",
          value: requestUrl,
        },
      ];

      const message = await this.scrymeClient.sendMessage(
        workspaceSlug,
        targetChannelSlug,
        { content, actions },
      );

      await this.prisma.client.scrymeMessage.create({
        data: {
          organizationId,
          workspaceSlug,
          channelSlug: targetChannelSlug,
          messageId: message.id,
          content,
          eventType: "APPROVAL_CREATED",
          relatedId: requestId,
          metadata: {
            stepNumber: request.currentStep,
            entityType: request.requestType,
            entityId: request.relatedId,
          },
        },
      });
    } catch (error: any) {
      this.logger.error(
        `Failed to post approval request to discussion channel ${targetChannelSlug}: ${error.message}`,
      );
    }
  }

  async updateStepMessages(
    organizationId: string,
    requestId: string,
    memberId: string,
    stepNumber: number,
  ) {
    const messages = await this.prisma.client.scrymeMessage.findMany({
      where: {
        organizationId,
        relatedId: requestId,
        eventType: "APPROVAL_REQUESTED",
      },
    });

    const relevantMessages = messages.filter(
      (m) => (m.metadata as any)?.stepNumber === stepNumber,
    );

    await Promise.all(
      relevantMessages.map(async (msg) => {
        try {
          const approverMemberId = (msg.metadata as any)?.approverMemberId;
          const isDecider = approverMemberId === memberId;
          const statusText = isDecider
            ? "✅ *You responded to this request.*"
            : "ℹ️ *This request was acted upon by another approver.*";

          const updatedContent = `${msg.content}\n\n${statusText}`;

          await this.scrymeClient.updateMessage(
            msg.workspaceSlug,
            msg.channelSlug,
            msg.messageId,
            { content: updatedContent, actions: [] },
          );
        } catch (error: any) {
          this.logger.error(
            `Failed to update Scryme message ${msg.messageId}: ${error.message}`,
          );
        }
      }),
    );
  }

  async notifyRequester(organizationId: string, requestId: string) {
    const request = await this.prisma.client.approvalRequest.findFirst({
      where: { id: requestId, organizationId },
      include: {
        requester: { include: { user: true } },
        organization: { include: { scrymeConfiguration: true } },
      },
    });

    if (!request || !request.organization.scrymeConfiguration?.isActive) {
      return;
    }

    const workspaceSlug =
      request.organization.scrymeConfiguration.workspaceSlug;
    if (!workspaceSlug) return;

    let requesterScrymeId = request.requester.user.scrymeUserId;

    if (!requesterScrymeId) {
      try {
        const members =
          await this.scrymeClient.listWorkspaceMembers(workspaceSlug);
        const userEmail = request.requester.user.email?.toLowerCase();
        const foundMember = members.find(
          (m) => m.email?.toLowerCase() === userEmail,
        );

        if (foundMember) {
          requesterScrymeId = foundMember.id;
          await this.prisma.client.user.update({
            where: { id: request.requester.user.id },
            data: { scrymeUserId: foundMember.id },
          });
        }
      } catch (err: any) {
        this.logger.warn(
          `Failed to auto-lookup Scryme user for requester ${request.requester.user.email}: ${err.message}`,
        );
      }
    }

    if (!requesterScrymeId) {
      this.logger.warn(
        `Requester ${request.requester.id} does not have a linked Scryme user ID. Skipping notification.`,
      );
      return;
    }

    try {
      const crmBaseUrl =
        process.env.NEXT_PUBLIC_CRM_URL || "http://localhost:3001";
      const requestUrl = `${crmBaseUrl}/approvals/${request.id}`;

      const statusEmoji = request.status === "APPROVED" ? "✅" : "❌";
      const content =
        `${statusEmoji} *Approval Request Update*\n\n` +
        `Your request for *${request.requestType}* (${request.relatedId}) has been *${request.status}*.\n\n` +
        `Click below to view full details in CRM.`;

      const actions: ScrymeChatAction[] = [
        {
          id: `view:${request.id}`,
          label: "View Request",
          type: "button",
          style: "primary",
          value: requestUrl,
        },
      ];

      const dmChannel = await this.scrymeClient.getDirectMessageChannel(
        workspaceSlug,
        requesterScrymeId,
      );

      await this.scrymeClient.sendMessage(workspaceSlug, dmChannel.id, {
        content,
        actions,
      });
    } catch (error: any) {
      this.logger.error(
        `Failed to notify requester ${request.requester.id} via Scryme: ${error.message}`,
      );
    }
  }
}
