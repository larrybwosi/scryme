import { Injectable, Logger } from "@nestjs/common";
import { ScrymeChatApiClient } from "@repo/chat";
import { SendAgentMessageDto, RequestAgentApprovalDto, HandleAgentApprovalCallbackDto } from "./dto/agent.dto";

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private readonly chatClient = new ScrymeChatApiClient();

  async sendMessage(orgSlug: string, dto: SendAgentMessageDto) {
    this.logger.log(`Dispatching agent message to ScrymeChat workspace=${orgSlug} channel=${dto.channel}`);
    return this.chatClient.sendMessage(orgSlug, dto.channel, {
      content: dto.content,
      metadata: dto.metadata,
    });
  }

  async requestApproval(orgSlug: string, dto: RequestAgentApprovalDto) {
    this.logger.log(`Creating HITL approval request action=${dto.action} org=${orgSlug}`);

    const approvalId = `approval_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const content = `⚠️ **Approval Required: ${dto.action}**\n\n${dto.details}\n\n*Requested by: ${dto.requestedBy || "Hermes Agent"}*`;

    const actions = [
      {
        id: `approve_${approvalId}`,
        label: "Approve Action",
        type: "button" as const,
        style: "primary" as const,
        value: JSON.stringify({ approvalId, decision: "APPROVED", orgSlug, action: dto.action }),
      },
      {
        id: `decline_${approvalId}`,
        label: "Decline",
        type: "button" as const,
        style: "danger" as const,
        value: JSON.stringify({ approvalId, decision: "DECLINED", orgSlug, action: dto.action }),
      },
    ];

    return this.chatClient.sendMessage(orgSlug, dto.channel, {
      content,
      actions,
      metadata: { approvalId, action: dto.action, status: "PENDING" },
    });
  }

  async handleApprovalCallback(orgSlug: string, dto: HandleAgentApprovalCallbackDto) {
    this.logger.log(`Approval decision received approvalId=${dto.approvalId} decision=${dto.decision}`);
    return {
      success: true,
      approvalId: dto.approvalId,
      decision: dto.decision,
      orgSlug,
      processedAt: new Date().toISOString(),
    };
  }
}
